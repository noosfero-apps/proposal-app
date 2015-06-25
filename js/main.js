define(['jquery', 'handlebars', 'fastclick', 'handlebars_helpers', 'piwik'], function($, Handlebars, FastClick){
  
  /* global Handlebars, $ */
  // The template code
  var templateSource = $('#proposal-template').html();

  // compile the template
  var template = Handlebars.compile(templateSource);
  var supportProposalTemplate = Handlebars.compile(document.getElementById('support-proposal-template').innerHTML);
  var loginTemplate = Handlebars.compile(document.getElementById('login-template').innerHTML);
  var resultsTemplate = Handlebars.compile(document.getElementById('results-template').innerHTML);
  var articleTemplate = Handlebars.compile(document.getElementById('article-template').innerHTML);
  var calendarTemplate = Handlebars.compile(document.getElementById('calendar-template').innerHTML);

  // The div/container that we are going to display the results in
  var resultsPlaceholder = document.getElementById('proposal-result');

  var logged_in = false;

  var loginButton;

  var lastHash = window.location.hash;

  var participa = true;


  //Detects for localhost settings
  var patt = new RegExp(":3001/");
  if(patt.test(window.location.href))
    participa = false;

  if(participa){
    var host = 'http://www.participa.br';
    window.dialoga_community = 19195;
    window.proposal_discussion = '103358'; //participa
    proposal_discussion = '103358'; //participa
    var cat_saude = 180;
    var cat_seguranca_publica = 182;
    var cat_educacao = 181;
    var cat_reducao_da_pobreza = 183;

    window.recaptchaSiteKey = '6LcLPAcTAAAAAKsd0bxY_TArhD_A7OL19SRCW7_i'
  }else{
    var host = 'http://noosfero.com:3001';
    window.dialoga_community = 67;
    var proposal_discussion = '392'; //local serpro
    window.recaptchaSiteKey = '6LdsWAcTAAAAAChTUUD6yu9fCDhdIZzNd7F53zf-' //http://noosfero.com/

    window.proposal_discussion = '392'
    var cat_saude = 23;
  }

  var BARRA_ADDED = false;
  var HIDE_BARRA_DO_GOVERNO = false;

  Main = (function(){

    return {
      private_token: '375bee7e17d0021af7160ce664874618',
      getProposalId: function() {
        var regexProposals = /\d.*\/propostas\/*.*/;
        var proposalId = 0;

        var hasProposal = regexProposals.test(location.hash);
        if( hasProposal ){
          var regexExtractProposal = /propostas\/*.*/;
          proposalId = regexExtractProposal.exec(location.hash)[0].split('/')[1];

        }

        return proposalId;
      },
      loadRandomProposal: function (topic_id) {
          var private_token = Main.private_token;
          var $noProposals = $('.no-proposals');
          var $loading = $('.loading');
          var $randomProposal = $('.random-proposal');
          var $body = $(document.body);
          var contextMain = this;

          // reset view
          $noProposals.hide();
          $loading.show();
          $randomProposal.html('');

          var url = host + '/api/v1/articles/' + topic_id + '/children';
          var childId = this.getProposalId();

          if(childId != 0){
            url += '/'+childId;
          }
          url += '?private_token=' + Main.private_token + '&limit=1&order=random()&_='+new Date().getTime()+'&fields=id,name,abstract,created_by&content_type=ProposalsDiscussionPlugin::Proposal';

          $.getJSON(url).done(function( data ) {
            $loading.hide();
            $('.support-proposal .alert').hide();

            data.articles = data.articles || [data.article];
            if(data.articles.length === 0) {
              $noProposals.show();
              return;
            }

            var article = data.articles[0];
            var parentTitle = $('#proposal-item-'+topic_id).find('.proposal-header .title').text();
            article.parent = {id: topic_id, title: parentTitle};
            $randomProposal.html(supportProposalTemplate(article));
            $body.off('click', '.vote-actions .skip');
            $body.on('click', '.vote-actions .skip', function(e) {
              contextMain.loadRandomProposal(topic_id);
              e.preventDefault();
            });
            $body.off('click', '.vote-actions .vote-action');
            $body.on('click', '.vote-actions .vote-action', function(e) {
              //Helps to prevent more than one vote per proposal
              var button = $(this);

              if(!logged_in) {
                $(this).closest('.require-login-container').find('.button-send a').click();
                e.preventDefault();
                return;
              }

              if(ProposalApp.hasProposalbeenVoted(article.id)){
                console.log("Proposta " + article.id + " já havia sido votada");
                Main.displaySuccess(button.closest('.support-proposal .section-content'), 'Seu voto já foi computado nesta proposta', 800);
                contextMain.loadRandomProposal(topic_id);
                e.preventDefault();
                return;
              }

              $.ajax({
                type: 'post',
                url: host + '/api/v1/articles/' + article.id + '/vote',
                data: {
                  value: $(this).data('vote-value'),
                  private_token: Main.private_token
                }
              }).done(function(data) {
                if(data.vote) {
                  Main.displaySuccess(button.closest('.support-proposal .section-content'), 'Voto realizado com sucesso', 800);
                } else {
                  Main.displaySuccess(button.closest('.support-proposal .section-content'), 'Seu voto já foi computado nesta proposta', 800);
                }
                ProposalApp.addVotedProposal(article.id);
                contextMain.loadRandomProposal(topic_id);
              });
              e.preventDefault();
            });

            $body.off('click', '.vote-result');
            $body.on('click', '.vote-result', function(e) {
              // e.preventDefault();

              var $this = $(this);
              var $proposalDetail = $this.parents('.proposal-detail');
              var $resultsContainer = $proposalDetail.find('.results-container');

              if($resultsContainer.css('display') === 'none') {
                Main.loadRanking($resultsContainer, topic_id, 1);
              } else {
                $proposalDetail.find('.experience-proposal-container').show();
                $proposalDetail.find('.talk-proposal-container').show();
                $resultsContainer.hide();
              }
            });

            // $body.off('click', '.question-link');
            // $body.on('click', '.question-link', function(e) {
            //   var $this = $(this);
              
            //   // Main.navigateTo($this.attr('href'), backTo);
            // });
          }).fail(function(){
            $loading.hide();
            $('.support-proposal .alert').show();
          });
      },
      loadRanking: function($resultsContainer, topic_id, page) {
        $resultsContainer.find('.loading').show();
        $resultsContainer.find('.results-content').hide();

        var per_page = 10;
        var url = host + '/api/v1/proposals_discussion_plugin/' + topic_id + '/ranking' + '?private_token=' + Main.private_token + '&per_page='+per_page+'&page='+page;
        $.getJSON(url).done(function( data, stats, xhr ) {
          data.pagination = {
            total: parseInt(xhr.getResponseHeader('Total')),
            per_page: parseInt(xhr.getResponseHeader('Per-Page')),
            page: page,
          };

          // hack: add title to result table
          data.title = $resultsContainer.closest('.categories').find('.proposal-header .title').text();

          $resultsContainer.html(resultsTemplate(data));
          $resultsContainer.find('.loading').hide();
          $resultsContainer.find('.results-content').show();
          $(".timeago").timeago();
          $resultsContainer.show();

          $('.footable').footable();

          if(data.pagination.total > data.pagination.per_page) {
            $resultsContainer.find('.paging').pagination({
              items: data.pagination.total,
              itemsOnPage: data.pagination.per_page,
              currentPage: data.pagination.page,
              prevText: '«',
              nextText: '»',
              cssStyle: 'compact-theme',
              onPageClick: function(page, e) {
                Main.loadRanking($resultsContainer, topic_id, page);
                e.preventDefault();
              }
            });
          }
          $resultsContainer.find('.abstract-text .truncated').click(function() {
            $(this).toggleClass('truncated');
          });

          var scrollTop = $(document).height();
          var proposalOffset = $resultsContainer.offset();
          if(proposalOffset){
            scrollTop = proposalOffset.top;
          }

          // scroll to the end
          $('html, body').animate({scrollTop: scrollTop }, 'fast');
        });
        $('.experience-proposal-container').hide();
        $('.talk-proposal-container').hide();
      },
      loginCallback: function(loggedIn, token, user) {
        logged_in = loggedIn;
        $('.login .message').text('');
        var requireLoginContainer = loginButton.closest('.require-login-container');

        if(logged_in) {
          Main.showLogout();
          if(token){
            Main.private_token = token;
          }
          // requireLoginContainer = $('.require-login-container');
          requireLoginContainer.find('.require-login').show();
          requireLoginContainer.find('.require-login .message').show();
          requireLoginContainer.find('.login-container').hide();
          $.cookie('_dialoga_session', Main.private_token);
          $('#login-panel').hide();
        } else if (user) {
          var loginContainer = requireLoginContainer.find('.login-container');
          loginContainer.show();
          loginContainer.find('.new-user').click();
          var signupForm = loginContainer.find('#signup-form');
          signupForm.find('#user_email').val(user.email);
          signupForm.find('#user_name').val(user.login);
          signupForm.find('#user_oauth_providers').val(user.oauth_providers);
          //signupForm.find(".password").hide();
          //signupForm.find(".password-confirmation").hide();
        } else {
          requireLoginContainer.find('.require-login').hide();
          requireLoginContainer.find('.login-container').show();
          Main.showLogin();
        }
      },
      guid: function() {
        function s4() {
          return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
      },
      display_article: function(article_id, backTo) {
        var url = host + '/api/v1/articles/' + article_id + '?private_token=' + Main.private_token;
        $.getJSON(url).done(function( data ) {
          $('#article-container .article-content').html(articleTemplate(data.article));
          $('#article-container').show();
          $('#proposal-categories').hide();
          $('#proposal-group').hide();
          $('nav').hide();
          $('#content').hide();
          $('.content').removeClass('background'); /* Remove class background*/
          $('#article-container .go-back').attr('href', backTo);
        });
      },
      // inicio Eduardo
      randomProposalByTheme: function(themeClasses) {
        $('#proposal-group .proposal-list .proposal-item').hide();
        $.each(themeClasses, function(i, themeClass) {
          var proposalsByTheme = $('#proposal-group .proposal-list .proposal-item').find('.' + themeClass);
          var randomizedIndex = Math.floor(Math.random() * proposalsByTheme.length);
          var proposalToShow = $(proposalsByTheme[randomizedIndex]).parents().filter('.proposal-item');
          $(proposalToShow).show();           
        });
      },
      display_category_tab: function(){
        // $('#proposal-group').hide();
        this.randomProposalByTheme(['category-saude', 'category-seguranca-publica', 'category-educacao', 'category-reducao-da-pobreza']);
        $('#proposal-group').show(); /* Show random proposals*/
        $('.content').addClass('background'); /* Add class background */
        $('#proposal-categories').show();
        $('#nav-proposal-categories a').addClass('active');
        $('#nav-proposal-group a').removeClass('active');
        $('.proposal-category-items').hide();
        $('.proposal-category .arrow-box').hide();
        $('.proposal-detail').hide().removeClass('hide');
        $('#article-container').hide();

        $('#content').show();
        $('nav').show();

        this.computeBoxHeight();
      },
      display_proposals_tab: function(){
        // $('#proposal-categories').hide();
        // this.randomProposalByTheme(['category-saude', 'category-seguranca-publica', 'category-educacao', 'category-reducao-da-pobreza']);
        $('.proposal-item').show(); /* Show all programs */
        $('#proposal-group').show();
        $('#proposal-categories').show();
        $('.proposal-category-items').hide();
        $('.proposal-detail').hide().removeClass('hide');
        $('#nav-proposal-group a').addClass('active');
        $('#nav-proposal-categories a').removeClass('active');
        $('#content').show();
        $('.content').addClass('background'); /* Add class background */
        $('#article-container').hide();
        $('nav').show();
        $('html, body').animate({ scrollTop: $('#proposal-group').offset().top }, 'fast');

        this.computeBoxHeight();
      },
      // fim Eduardo
      display_proposal: function(proposal_id){
        $('#proposal-categories').hide();
        $('#proposal-group').hide();
        $('.proposal-category-items').hide(); /* Hide Category Items */
        $('.content').removeClass('background'); /* Remove class background*/
        $('nav').hide();
        $('#content').hide();
        $('#article-container').hide();
        // $('.make-proposal-form').hide();
        // $('.login-container').hide();
        $('.proposal-detail').hide().removeClass('hide'); // hide all proposals
        // $('.proposal-detail-base').hide();
        var $proposal = $('#' + proposal_id);
        $proposal.find('.proposal-detail-base').hide();
        $proposal.show();
        $proposal.find('.proposal-header').show();
        $proposal.find('.make-proposal-container').show();
        $proposal.find('.support-proposal-container').show();
        $proposal.find('.results-container').hide();
        $proposal.find('.results-container .loading').hide();
        $proposal.find('.results-container .results-content').hide();
        $proposal.find('.experience-proposal-container').show();
        $proposal.find('.talk-proposal-container').show();
        $proposal.find('.calendar').hide();
        var active_category = '';
        var category_id;
        switch($proposal.find('.categories').attr('class')) {
          case 'categories saude':
            active_category = 'saude';
            category_id = 180;
            break;
          case 'categories educacao':
            active_category = 'educacao';
            category_id = 181;
            break;
          case 'categories seguranca-publica':
            active_category = 'seguranca-publica';
            category_id = 182;
            break;
          case 'categories reducao-da-pobreza':
            active_category = 'reducao-da-pobreza';
            category_id = 183;
            break;
        }

        var topic_id = proposal_id.split('-').pop();
        this.loadRandomProposal(topic_id);
        Main.display_events(category_id, active_category);
      },
      display_proposal_detail: function(proposal_id){
        $('.content').removeClass('background'); /* Remove class background */
        $('#proposal-categories').hide();
        $('#proposal-group').hide();
        $('nav').hide();
        $('#content').hide();
        $('#article-container').hide();
        var $proposal = $('#proposal-item-' + proposal_id);
        $proposal.find('.proposal-header').hide();
        $proposal.find('.make-proposal-container').hide();
        $proposal.find('.support-proposal-container').hide();
        $proposal.find('.results-container').hide();
        $proposal.find('.experience-proposal-container').hide();
        $proposal.find('.talk-proposal-container').hide();
        $proposal.find('.body').show();
        $proposal.show();

        var url = host + '/api/v1/articles/' + proposal_id + '?private_token=' + Main.private_token + '&fields=id,body&content_type=ProposalsDiscussionPlugin::Topic';
        $.getJSON(url).done(function( data ) {
          $('#proposal-item-' + proposal_id + ' .body-content').replaceWith(data.article.body);
        })
        .fail(function( jqxhr, textStatus, error ) {
          var err = textStatus + ', ' + error;
          console.log( 'Request Failed: ' + err );
        });
      },
      display_proposal_by_category: function(item){
        var $item = $('#' + item);

        if($item.hasClass('proposal-category-items')){
          //Display Topics or Discussion by category
          $('nav').show();
          $('#content').show();
          $('#proposal-categories').show();
          $('#nav-proposal-categories a').addClass('active');
          $('#nav-proposal-group a').removeClass('active');
          $('#proposal-group').hide(); /* Hide section "Programas" */
          $('.content').addClass('background'); /* Add class background */
          $('.proposal-category-items').hide();
          $('.proposal-detail').hide().removeClass('hide');
          $item.toggle( 'blind', 200, function () {
            var itemOffset = $item.offset();
            if(itemOffset){
              $('html, body').animate({ scrollTop: itemOffset.top }, 'fast');
            }
          } );
          $('.proposal-category .arrow-box').hide();
          var categorySlug = $item.data('category');
          $('#proposal-category-' + categorySlug).find('.arrow-box').show();

          this.computeBoxHeight();

        }
      },
      addBarraDoGoverno: function(){

        if( BARRA_ADDED ) { return; }

        var HTML_BODY_PREPEND = '' +
          '<div id="barra-brasil" style="background:#7F7F7F; height: 20px; padding:0 0 0 10px;display:block;"> ' +
            '<ul id="menu-barra-temp" style="list-style:none;">' +
              '<li style="display:inline; float:left;padding-right:10px; margin-right:10px; border-right:1px solid #EDEDED"><a href="http://brasil.gov.br" style="font-family:sans,sans-serif; text-decoration:none; color:white;">Portal do Governo Brasileiro</a></li> ' +
              '<li><a style="font-family:sans,sans-serif; text-decoration:none; color:white;" href="http://epwg.governoeletronico.gov.br/barra/atualize.html">Atualize sua Barra de Governo</a></li>' +
            '</ul>' +
          '</div>';

        var HTML_BODY_APPEND = ''+
          '<footer id="footer-brasil"></footer>' +
          '<script defer="defer" src="http://barra.brasil.gov.br/barra.js" type="text/javascript"></script>';

        var STYLE_TEMA_AZUL = '' +
          '<style>'+
            '#footer-brasil {'+
             'background: none repeat scroll 0% 0% #0042b1;'+
             'padding: 1em 0px;'+
             'max-width: 100%;'+
             'margin-top: 40px;'+
            '}'+
            '#barra-brasil ul {'+
              'width: auto;'+
            '}'+
          '<style>';

        var $body = $(document.body);
        $body.prepend(HTML_BODY_PREPEND);
        $body.append(HTML_BODY_APPEND);
        $body.append(STYLE_TEMA_AZUL);

        BARRA_ADDED = true;
      },
      updateHash: function(hash){
        var id = hash.replace(/^.*#/, '');
        var elem = document.getElementById(id);

        // preserve the query param
        // if (HIDE_BARRA_DO_GOVERNO && (hash.indexOf('?barra=false') === -1)){
        //   hash += '?barra=false';
        // }

        if ( !elem ) {
          window.location.hash = hash;
          return;
        }

        elem.id = id+'-tmp';
        window.location.hash = hash;
        elem.id = id;
      },
      locationHashChanged: function(){
        var hash = window.location.hash;
        this.navigateTo(hash, lastHash);
        lastHash = hash;
      },
      navigateTo: function(hash, lastHash) {

        var scrollTop = 0;
        var $nav = $('nav[role="tabpanel"]');
        var navOffset = $nav.offset();

        var regexProposals = /#\/programas/;
        var regexCategory = /#\/temas/;
        var regexHideBarra = /barra=false$/;
        var regexArticle = /#\/artigo/;
        var regexResultados = /resultados$/;
        var regexSobreOPrograma = /sobre-o-programa$/;

        if( !(regexHideBarra.exec(hash) !== null) && !HIDE_BARRA_DO_GOVERNO ){
          this.addBarraDoGoverno();
        }else{
          HIDE_BARRA_DO_GOVERNO = true;
        }

        // remove query params
        hash = hash.split('?')[0];

        var parts = hash.split('/');

        var isProposal        = regexProposals.exec(hash) !== null;
        var isCategory        = regexCategory.exec(hash) !== null;
        var isArticle         = regexArticle.exec(hash) !== null;
        var isResultados      = regexResultados.exec(hash) !== null;
        var isSobreOPrograma  = regexSobreOPrograma.exec(hash) !== null;

        if(isArticle) {
          this.display_article(hash.split('/')[2], lastHash);
        }

        if( isProposal ){

          // go to proposal
          var proposalId = parts[2];
          this.navigateToProposal(proposalId);

          var $proposal = $('#proposal-item-' + proposalId);
          var proposalTitle = $proposal.find('.title').text();
          var proposalOffset = $proposal.offset();
          if(proposalOffset){
            scrollTop = proposalOffset.top;
          }else{
            if(navOffset){
              scrollTop = navOffset.top;
            } else {
              scrollTop = $('#proposal-group').offset().top;
            }
          }

          if(isResultados){
            var $resultsContainer = $proposal.find('.results-container');

            if($resultsContainer.css('display') === 'none') {
              Main.loadRanking($resultsContainer, proposalId, 1);
            } else {
              $proposalDetail.find('.experience-proposal-container').show();
              $proposalDetail.find('.talk-proposal-container').show();
              $resultsContainer.hide();
            }

            var proposalOffset = $resultsContainer.offset();
            if(proposalOffset){
              scrollTop = proposalOffset.top;
            }
          }
        }

        if( isCategory ){

          // go to category
          var categorySlug = parts[2];
          var categoryId = parts[3];
          this.navigateToCategory(categoryId);

          var $category = $('#proposal-item-' + categoryId);
          var categoryOffset = $category.offset();
          if(categoryOffset){
            scrollTop = categoryOffset.top;
          }else{
            if(navOffset){
              scrollTop = navOffset.top;
            }
          }
        }

        // default
        if( !isProposal && !isCategory ){
          // show the 'index' -> category tab
          this.display_category_tab();
        }

        // [BEGIN] Tracking
        if (window._paq){
          // _paq.push(['trackEvent', 'NavegarPara', hash || '/']);
          // _paq.push(['setDocumentTitle', document.domain + '/' + hash]);
          // _paq.push(['trackPageView']);

          var trackPageTitle = '';
          if(isArticle){
            trackPageTitle = 'Página: Sobre'
          }

          if(isProposal){
            trackPageTitle = 'Proposta: ' + (proposalTitle || 'todas as propostas');

            if(isResultados){
              trackPageTitle += ' / Resultados' ;
            }

            if(isSobreOPrograma){
              trackPageTitle += ' / Sobre o programa' ;
            }
          }

          if(isCategory){
            trackPageTitle = 'Tema: ' + categorySlug;
          }

          window._paq.push(['trackPageView', trackPageTitle]);
          console.log('tracked page view', trackPageTitle);
        }
        // [END] Tracking

        $('html, body').animate({ scrollTop: scrollTop }, 'fast');
      },
      navigateToProposal: function(proposalId){
        var regexSobreOPrograma = /sobre-o-programa$/;
        if(proposalId === undefined){
          this.display_proposals_tab();
        }else if(regexSobreOPrograma.exec(window.location.hash) == null){
          this.display_proposal('proposal-item-' + proposalId);
        }else{
          this.display_proposal_detail(proposalId);
        }
      },
      navigateToCategory: function(categoryId){
        if(categoryId === undefined){
          this.display_category_tab();
        }else{
          this.display_proposal_by_category('proposal-item-' + categoryId);
        }
      },
      oauthClientAction: function(url) {
        var child = window.open(url, "_blank");
        var interval = setInterval(function() {
            try {
              if(!child.closed) {
                  child.postMessage({ message: "requestOauthClientPluginResult" }, "*");
              }
            }
            catch(e) {
                // we're here when the child window has been navigated away or closed
                if (child.closed) {
                    clearInterval(interval);
                    return;
                }
            }
        }, 300);
      },
      displaySuccess: function(container, text, timeout, iconClass) {
        timeout = typeof timeout !== 'undefined' ? timeout : 2000;
        container.css('opacity', 0.1);
        var successPanel = $('.success-panel').clone();
        successPanel.find('.icon').addClass(iconClass);
        successPanel.find('.message').html(text);
        successPanel.appendTo(container.closest('.categories'));
        successPanel.show();
        successPanel.css("top", Math.max(0, ((container.height() - successPanel.outerHeight()) / 2) + container.offset().top) + "px");
        successPanel.css("left", Math.max(0, ((container.width() - successPanel.outerWidth()) / 2) + container.offset().left) + "px");

        var interval = setTimeout(function() {
          successPanel.hide();
          container.css('opacity', 1);
          successPanel.remove();
        }, timeout);
      },
      setUser: function(user){
        this.user = user;
      },
      getUser: function(){
        return this.user;
      },
      showLogin: function(){
        $('#login-button').show();
        $('#logout-button').hide();
      },
      showLogout: function(){
        $('#login-button').hide();
        var name = '';
        var user = Main.getUser();
        if(user){
          name = user.person.name + ' - ';
        }
        $('#logout-button .name').text(name);
        $('#logout-button').show();
      },
      responseToText: function(responseJSONmessage){
        var o = JSON.parse(responseJSONmessage);
        var msg = "";
        var fn;

        for (var key in o) {
          if (o[key] instanceof Array) {
            fn =  key;
            for (var i = 0; i < o[key].length; i++) {
              msg += fn + " " + o[key][i] + "</br>";
            }
          }
        }
        msg = msg.replace('password_confirmation', "campo 'confirmação da senha'");
        msg = msg.replace(/password/g, "campo 'senha'");
        msg = msg.replace('login', "campo 'nome de usuário'");
        msg = msg.replace('email', "campo 'e-mail'");
        msg = msg.substring(0, msg.length - 5) + ".";
        return msg;
      },
      display_events: function(cat_id, active_category) {
        var url = host + '/api/v1/communities/' + window.dialoga_community + '/articles?categories_ids[]=' + cat_id + '&content_type=Event&private_token=' + '375bee7e17d0021af7160ce664874618';
        $.getJSON(url).done(function (data) {
          if(data.articles.length==0) return;
          var dt = data.articles[0].start_date;
          var date = dt.substr(8, 2) + '/' + dt.substr(5, 2) + '/' + dt.substr(0, 4);
          var dd = new Date(dt);
          var time = dd.getHours() + ':' + (dd.getMinutes()<10?'0':'') + dd.getMinutes();
          var params = {event: data.articles[0], date: date, time: time, category: data.articles[0].categories[0].name, category_class: active_category};
          $.getJSON(host+'/api/v1/articles/'+data.articles[0].id+'/followers?private_token=' + '375bee7e17d0021af7160ce664874618' + '&_='+new Date().getTime()).done(function (data) {
            //FIXME do not depend on this request
            params['total_followers'] = data.total_followers;
            $('.calendar-container').html(calendarTemplate(params));
            $('.calendar-container .calendar.' + active_category).show();
            // $('.calendar-container .calendar').slick();

            $(document).off('click', '#talk__button-participate');
            $(document).on('click', '#talk__button-participate', function(e) {
              e.preventDefault();
              var $bt = $(this);
              if(!logged_in) {
                $('#login-button').click();
                $('html, body').animate({scrollTop: 0}, 'fast');
              } else {
                $.ajax({
                  type: 'post',
                  url: host + '/api/v1/articles/' + $(this).data('event-id') + '/follow',
                  data: {
                    private_token: Main.private_token
                  }
                }).done(function(data) {
                  var message = 'Sua participação foi registrada com sucesso';
                  if(!data.success) {
                    message = 'Sua participação já foi registrada';
                  } else {
                    var value= $bt.closest('.talk__participate').find('.talk__value');
                    value.text(parseInt(value.text()) + 1);
                  }
                  Main.displaySuccess($bt.closest('.talk__participate'), message, 2000, 'icon-proposal-sent');
                });
              }
            });

          });
        });
      },
      computeBoxHeight: function(){
        var hPerLineOnTitle = 25;
        var hPerLineOnParagraph = 20;
        var maxLinesByParagraph = 0;
        var maxLinesByTitle = 0;
        var $visibleProposals = $('.proposal-list .proposal-item:visible');
        
        // get the bigger paragraph
        $visibleProposals.each(function(index, proposalItemEl){
          var $proposalItemEl = $(proposalItemEl);
          var $paragraph = $proposalItemEl.find('p');
          var lines = Main.computeLines($paragraph);
          if(lines > maxLinesByParagraph ){
            maxLinesByParagraph = lines
          }
        });
        // console.log('maxLinesByParagraph', maxLinesByParagraph);
        
        // get the bigger title
        $visibleProposals.each(function(index, proposalItemEl){
          var $proposalItemEl = $(proposalItemEl);
          var $title = $proposalItemEl.find('.box__title');
          var lines = Main.computeLines($title);
          if(lines > maxLinesByTitle ){
            maxLinesByTitle = lines
          }
        });
        // console.log('maxLinesByTitle', maxLinesByTitle);

        $visibleProposals.each(function(index, proposalItemEl){
          var $proposalItemEl = $(proposalItemEl);
          var $title = $proposalItemEl.find('.box__title');
          var $paragraph = $proposalItemEl.find('p');
          
          var newTitleHeight = maxLinesByTitle * hPerLineOnTitle;
          var newParagraphHeight = maxLinesByParagraph * hPerLineOnParagraph;
          
          $title.css('height', newTitleHeight + 'px');
          $paragraph.css('height', newParagraphHeight + 'px');
        });

        // recalc box heights
        var setAsPx = true;
        $visibleProposals.equalHeights(setAsPx);
      },
      computeLines: function ($el) {
        // reset height
        $el.height('auto');
        
        var divHeight = $el.height();
        var lineHeight = parseInt($el.css('lineHeight'));
        var lines = Math.ceil(divHeight / lineHeight);
        return lines;
      },
      handleLoginSuccess: function (e, data){
        if(data.person){
          Main.setUser({person: data.person});
        }
        Main.loginCallback(true, data.private_token);
      },
      handleLoginFail: function (e){
        // console.log('Event', e);
      }
    }
  })();

  
  var noosferoAPI = host + '/api/v1/articles/' + proposal_discussion + '?private_token=' + Main.private_token + '&fields=id,children,categories,abstract,title,image,url,setting,position';

  $.getJSON(noosferoAPI)
    .done(function( data ) {
      data.host = host;
      data.private_token = Main.private_token;
      resultsPlaceholder.innerHTML = template(data);
      $('.login-container').html(loginTemplate());
      $('.countdown').maxlength({text: '%left caracteres restantes'});

      Main.navigateTo(window.location.hash);

      $(document).on('click', '.oauth-login', function (e){
        Main.oauthClientAction($(this).attr('href'));
        e.preventDefault();
      });

      // create login panel on header
      (function (){
        var loginPanelId = '#login-panel';
        var $loginPanel = $(loginPanelId);
        $loginPanel.hide();
        $loginPanel.removeClass('hide');
        $loginPanel.append(loginTemplate());
        $loginPanel.find('.actions')
          .removeClass('col-sm-4')
          .addClass('col-sm-12');
        $loginPanel.find('.oauth')
          .removeClass('col-sm-8')
          .addClass('col-sm-12');
        $loginPanel.find('.new-user').parent()
          .removeClass('col-sm-4')
          .addClass('col-sm-12');

        if(logged_in){
          Main.showLogout();
        }

        $(document).on('click', '#login-button', function (e){
          e.preventDefault();
          loginButton = $(this);
          $loginPanel.toggle();
        });

        // handle click on elsewhere (out of loginPanel)
        $(document).click(function(e){
          var $target = $(e.target);

          var isLoginButton = ($target.attr('id') === 'login-button');
          var requireLogin = $target.hasClass('require-main-login');
          var isChildOfPanel = ($target.closest(loginPanelId).length !== 0);

          if( !isLoginButton && !isChildOfPanel && !requireLogin ){
            $loginPanel.hide();
          }
        });

        // handle esc
        $(document).keyup(function(e) {
          
          // escape key maps to keycode `27`
          if (e.keyCode == 27) { // ESC
            $loginPanel.hide();
          }
        });

        $('.participar').removeClass('hide');
      })();

      //Actions for links
      $( '#nav-proposal-categories a' ).on('click', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));

      });

      $( '#nav-proposal-group a' ).on('click', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.proposal-item a' ).on('click', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.proposal-category a' ).on('click', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.proposal-category .go-back' ).on('click', function(e){
        e.preventDefault();

        var oldHash = window.location.hash;
        var regexSobreOPrograma = /sobre-o-programa$/;
        var isSubpage = regexSobreOPrograma.exec(oldHash) !== null;
        var newHash = '#/temas'; // default page

        if(isSubpage){
          // return to proposal page
          newHash = oldHash.split('/sobre-o-programa')[0];
        }else{
          $link = $(this).siblings('.proposal-link');
          newHash = $link.attr('href');
        }

        // Update URL and Navigate
        Main.updateHash(newHash);
      });

      $( '.button-send a' ).on('click', function(e){
        e.preventDefault();

        //display form to send proposal (or login form for non-logged users)
        var $this = $(this);
        loginButton = $this.closest('.button-send');
        loginButton.hide();
        $this.closest('.success-proposal-sent').hide();
        var $wrapper = $this.closest('.make-proposal');
        $wrapper.find('.subtitle').show();
        $wrapper.find('.info').show();
        Main.loginCallback(logged_in);
      });

      $( '#display-contrast' ).on('click', function(e){
        e.preventDefault();
        $('body').toggleClass('contraste');

        if($.cookie){
          var isContrasted = $('body').hasClass('contraste');
          $.cookie('dialoga_contraste', isContrasted);
        }
      });

      $( '.show_body' ).on('click', function(e){
        e.preventDefault();

        var $link = $(this).find('a');

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.go-to-proposal-button a' ).on('click', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.proposal-selection' ).change(function(e){
        // Update URL and Navigate
        Main.updateHash('#/programas/' + this.value);
        $(this).val($(this).data("proposal")).trigger("chosen:updated");
      });

      var availableTags = [ ];
      $('#proposal-group li a').each(function(){
        availableTags.push({ label: $(this).text(), value: $(this).attr('href')});
      });

      $( '#search-input' ).autocomplete({
        source: availableTags,
        minLength: 3,
        select: function( event, ui ) {
          Main.updateHash(ui.item.value);
          return false;
        },
        appendTo: '#search-input-container',
        messages: {
          noResults: '',
          results: function() {}
        }
      });


      $('.save-article-form').submit(function (e) {
        e.preventDefault();
        var proposal_id = this.id.split('-').pop();
        var form = this;
        var $form = $(this);
        var message = $(form).find('.message');
        message.hide();
        message.text('');
        $.ajax({
          type: 'post',
          url: host + $form.attr('action'),
          data: $('#'+this.id).serialize() + '&private_token=' + Main.private_token + '&fields=id&article[name]=article_' + Main.guid()
        })
        .done(function( /*data*/ ) {
          form.reset();
          $form.hide();
          $form.siblings('.success-sent').show();
          $form.siblings('.subtitle').hide();
          $form.siblings('.info').hide();
          Main.displaySuccess($form.closest('.make-proposal .section-content'), 'Proposta enviada com sucesso', 2000, 'icon-proposal-sent');
        })
        .fail(function( jqxhr, textStatus, error ) {
          var err = textStatus + ', ' + error;
          console.log( 'Request Failed: ' + err );
          message.show();
          message.text('Não foi possível enviar.');
         });
      });
    })
    .fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ', ' + error;
      console.log( 'Request Failed: ' + err );
    });

  $(document).ready(function($) {

    FastClick.attach(document.body);

    if($.cookie) {

      // session
      if($.cookie('_dialoga_session')){
        var url = host + '/api/v1/users/me?private_token=' + $.cookie('_dialoga_session');
        $.getJSON(url).done(function( data ) {
          logged_in = true;
          Main.private_token = $.cookie('_dialoga_session');

          if(data && data.user){
            Main.setUser(data.user);
            Main.showLogout();
          }
        });
      }

      // contrast
      var isContrasted = $.cookie('dialoga_contraste');
      if(isContrasted === 'true'){
        // remove all classes 'contraste' and add only one 'contraste'
        $('body').addClass('contraste');
      }
    }

    $(document).on('login:success', Main.handleLoginSuccess);
    $(document).on('login:fail', Main.handleLoginFail);

    $(document).on('click', '.login-action', function(e) {
      e.preventDefault();
      // console.log('obj', obj);

      var $this = $(this); // button
      var $form = $this.closest('#login-form');
      var $message = $form.find('.message');
      $message.text('').hide();

      loginButton = $this;

      $.ajax({
        type: 'post',
        url: host + '/api/v1/login',
        data: $form.serialize(),
        xhrFields: {
          //withCredentials: true
        }
      }).done(function(data) {

        var $sectionContent = $form.closest('.section-content');
        if($sectionContent && $sectionContent.length > 0){
          Main.displaySuccess($sectionContent, 'Login efetuado com sucesso', 1000, 'icon-login-success');
        }

        var $loginPanel = $form.closest('#login-panel');
        if($loginPanel && $loginPanel.length > 0){
          $loginPanel.hide();
        }

        $(document).trigger('login:success', data);
      }).fail(function(data) {

        $message.show();
        if(data.status==401){
          $message.text('Nome de usuário, e-mail ou senha incorretos, não foi possível acessar.');
        }else{
          $message.text('Um erro inesperado ocorreu');
        }

        $(document).trigger('login:fail', data);
      });
    });

    $(document).on('click', '.social .fb-share', function(e) {
      var link = $(this).attr('href');
      FB.ui({
          method: 'feed',
          link: link,
          name: $(this).data('name') || 'Dialoga Brasil',
          caption: $(this).data('caption') || 'dialoga.gov.br',
          description: $(this).data('description'),
      }, function(response){});
      e.preventDefault();
    });

    $(document).on('click', '.new-user', function(e) {
      var loginForm = $(this).parents('#login-form');
      var signupForm = loginForm.siblings('#signup-form');

      loginForm.hide();
      signupForm.show();
      signupForm.find(".password").show();
      signupForm.find(".password-confirmation").show();
      loginForm.find('.message').hide();
      signupForm.find('#g-recaptcha').empty();
      //grecaptcha.render(signupForm.find('#g-recaptcha')[0], {'sitekey' : window.recaptchaSiteKey });
      e.preventDefault();
    })

    $(document).on('click', '.cancel-signup', function(e) {
      var signupForm = $(this).parents('#signup-form');
      signupForm.hide();
      signupForm.siblings('#login-form').show();
      //Reset captcha here
      //grecaptcha.reset();
      e.preventDefault();
    });

    $(document).on('click', '.confirm-signup', function(e) {
      var message = $('.signup .message');
      message.hide();
      message.text('');

      var signup = $(this).parents('form.signup');
      var $loading = $('.login-container .loading');
      $loading.show();
      signup.hide();
      signup.removeClass('hide');
      var button = $(this);

      $.ajax({
        type: 'post',
        url: host + '/api/v1/register',
        data: $(this).parents('.signup').serialize(),
      }).done(function(data) {

        var $sectionContent = button.closest('.section-content');
        if($sectionContent && $sectionContent.length > 0){
          Main.displaySuccess($sectionContent, 'Cadastro efetuado com sucesso', 1000, 'icon-user-created');
        }

        $(document).trigger('login:success', data);
      }).fail(function(data) {
        var msg = "";
        try{
          msg = Main.responseToText(data.responseJSON.message);
        }catch(ex){
          var ptBR = {};
          // (Invalid request) email can't be saved
          ptBR['(Invalid request) email can\'t be saved'] = 'E-mail inválido.';
          // (Invalid request) login can't be saved
          ptBR['(Invalid request) login can\'t be saved'] = 'Nome de usuário inválido.';

          msg = ptBR[data.responseJSON.message] || data.responseJSON.message;
        }

        message.show();
        message.html('Não foi possível efetuar o cadastro: <br/><br/>' + msg);

        $(document).trigger('login:fail', data);
      }).always(function() {
        $loading.hide();
        signup.show();

        // var $loginPanel = $loading.closest('#login-panel');
        // if($loginPanel && $loginPanel.length > 0){
        //   $loginPanel.hide();
        // }
      });
      grecaptcha.reset();
      e.preventDefault();
    });

    // var popupCenter = function(url, title, w, h) {
    //   var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
    //   var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

    //   var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    //   var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    //   var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    //   var top = ((height / 3) - (h / 3)) + dualScreenTop;

    //   var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    //   // Puts focus on the newWindow
    //   if (window.focus) {
    //     newWindow.focus();
    //   }
    // };

    // $(document).on('click', '.social a.popup', {}, function popUp(e) {
    //   var self = $(this);
    //   popupCenter(self.attr('href'), self.find('.rrssb-text').html(), 580, 470);
    //   e.preventDefault();
    // });

    $(document).on('click', '#logout-button', function (e){
      var self = $(this);
      $.removeCookie('_dialoga_session');
      $.removeCookie('votedProposals');
      $.removeCookie('*');
      logged_in = false;
      Main.showLogin();
      location.reload();
      e.preventDefault();
    });

    // hack-fix to support z-index over video/iframe
    function checkIframes () {

      $('iframe').each(function(){
        var $iframe = $(this);
        var url = $iframe.attr('src');
        var c = '?';

        // console.log('url', url);
        // console.log('url.indexOf("youtube")', url.indexOf("youtube"));
        if(url.indexOf("youtube") === -1){
          // is not a iframe of youtube
          // console.debug('is not a iframe of youtube');
          return;
        }

        if(url.indexOf("wmode=opaque") !== -1){
          // already in opaque mode
          // console.debug('already in opaque mode');
          return;
        }

        if(url.indexOf('?') !== -1){
          c = '&';
        }
        
        $iframe.attr("src",url+c+"wmode=opaque");
        // console.debug('iframe changed to opaque mode');
      });

      setTimeout(checkIframes, 500);
    }
    checkIframes();
    // $(document).bind('DOMSubtreeModified', function(e){
      // console.log('this', this);
      // console.log('e', e);
      
    // });

  });

  window.addEventListener('message', function(ev) {
    if (ev.data.message === 'oauthClientPluginResult') {
      Main.loginCallback(ev.data.logged_in, ev.data.private_token, ev.data.user);
      ev.source.close();
    }
  });

  if('onhashchange' in window){
      window.onhashchange = function(){
      Main.locationHashChanged.apply(Main);
    }
  }else{
    console.log('The browser not supports the hashchange event!');
  }

  // Handle resize event
  (function($,sr){

    // debouncing function from John Hann
    // http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
    var debounce = function (func, threshold, execAsap) {
      var timeout;

      return function debounced () {
        var obj = this, args = arguments;
        
        function delayed () {
          if (!execAsap){
            func.apply(obj, args);
          }
          timeout = null;
        }

        if (timeout){
          clearTimeout(timeout);
        }else if (execAsap){
          func.apply(obj, args);
        }

        timeout = setTimeout(delayed, threshold || 100);
      };
    }

    // smartresize 
    jQuery.fn[sr] = function(fn){
      return fn ? this.bind('resize', debounce(fn)) : this.trigger(sr);
    };

  })(jQuery, 'smartresize');

  $(window).smartresize(function(){
    // console.log('window resized');
    Main.computeBoxHeight();
  });

  return Main;
});
