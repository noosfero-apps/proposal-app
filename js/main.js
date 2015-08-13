/* global define */
define(['jquery', 'handlebars', 'fastclick', 'proposal_app', 'handlebars_helpers', 'piwik'], function($, Handlebars, FastClick, ProposalApp){
  // 'use strict';

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

  var isProduction = /^http:\/\/dialoga\.gov\.br\//.test(window.location.href);
  var host = isProduction ? 'http://login.dialoga.gov.br' : 'http://hom.login.dialoga.serpro';
  var serpro_captcha_clienteId = 'fdbcdc7a0b754ee7ae9d865fda740f17';
  var dialoga_community = 19195;
  var proposal_discussion = '103358'; //participa
  var cat_saude = 180;
  // var cat_seguranca_publica = 182;
  // var cat_educacao = 181;
  // var cat_reducao_da_pobreza = 183;
  var recaptchaSiteKey = '6LcLPAcTAAAAAKsd0bxY_TArhD_A7OL19SRCW7_i';

  // There are two modes for development
  // 1: Remote API
  // 2: Local API with proposal database
  // For (1) use port 3000 -> rails s
  //
  // gulp connect_api_prod for access api from production - localhost:3001
  // gulp connect_api_local for access api from local noosfero - localhost:3002
  // For (2) set at /etc/hosts:
  //
  //127.0.0.1  participa.br
  //127.0.0.1  dialoga.gov.br
  //127.0.0.1  login.dialoga.gov.br
  //127.0.0.1  noosfero.com
  //Detects for localhost settings
  var patt = new RegExp(':300[1-2]/');
  var localDevelopment = false;

  if(patt.test(window.location.href)){
    localDevelopment = true;
    patt = new RegExp(':3001/');

    if(patt.test(window.location.href)){
      host = 'http://login.dialoga.gov.br';
    }else if (new RegExp(':3002/').test(window.location.href)){
      host = 'http://noosfero.com:3000';
      recaptchaSiteKey = '6LdsWAcTAAAAAChTUUD6yu9fCDhdIZzNd7F53zf-'; //http://noosfero.com/
    }
  }


  var BARRA_ADDED = false;
  var HIDE_BARRA_DO_GOVERNO = false;

  var Main;
  window.Main = Main = (function(){

    var API = {
      articles: '',
      proposals: '/api/v1/articles/{topic_id}/children',

    };

    API.getProposalsURL = function (topicId){
      return host + replace(API.proposals, '{topic_id}', topicId);
    };

    function replace(str, pattern, value){
      return str.replace(new RegExp(pattern, 'g'), value);
    }

    function fillSignupForm(signupForm, user) {
      signupForm.find('#signup-user_email').val(user.email);
      signupForm.find('#signup-user_email').attr('disabled', true);
      signupForm.find('#signup-user_fullname').val(user.name);
      signupForm.find('#user_oauth_signup_token').val(user.signup_token);
      signupForm.find('#user_oauth_providers').val(user.oauth_providers);
      signupForm.find('div.password').hide();
      signupForm.find('div.password-confirmation').hide();
      signupForm.find('#signup-user_password').attr('required', false);
      signupForm.find('#user_password_confirmation').attr('required', false);
    };

    return {
      private_token: null,
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
      loadRandomProposal: function (topic_id, force) {
          /*var private_token = window.Main.private_token;*/
          var $noProposals = $('.no-proposals');
          var $loading = $('.loading');
          var $randomProposal = $('.random-proposal');
          var $body = $(document.body);
          var contextMain = this;

          // reset view
          $noProposals.hide();
          $loading.show();
          $randomProposal.html('');

          var url = API.getProposalsURL(topic_id);
          var childId = this.getProposalId();

          if(childId !== 0 && !force){
            url += '/' + childId;
          }
          //url += '?private_token=' + private_token + '&limit=1&order=random()&_='+new Date().getTime()+'&fields=id,name,slug,abstract,created_by&content_type=ProposalsDiscussionPlugin::Proposal';
          url += '?limit=1&order=random()&_='+new Date().getTime()+'&fields=id,name,slug,abstract,created_by&content_type=ProposalsDiscussionPlugin::Proposal';

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
              e.preventDefault();
              contextMain.loadRandomProposal(topic_id, true);
            });
            $body.off('click', '.vote-actions .vote-action');
            $body.on('click', '.vote-actions .vote-action', function(e) {
              e.preventDefault();

              //Helps to prevent more than one vote per proposal
              var $button = $(this);
              var $proposal = $button.closest('.random-proposal');

              if(!logged_in) {
                $(this).closest('.require-login-container').find('.button-send a').click();
                return;
              }

              if(ProposalApp.hasProposalbeenVoted(article.id)){
                // console.debug("Proposta " + article.id + " já havia sido votada");
                Main.displaySuccess($button.closest('.support-proposal .section-content'), 'Seu voto já foi computado nesta proposta', 800);
                contextMain.loadRandomProposal(topic_id, true);
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
                  // Main.displaySuccess($button.closest('.support-proposal .section-content'), '', 800);
                  $proposal.find('.abstract').hide();
                  $proposal.find('.vote-actions .like').hide();
                  $proposal.find('.vote-actions .dislike').hide();
                  // $proposal.find('.vote-actions .vote-result').hide();
                  var $successPanel = $('.success-panel').clone();
                  $successPanel.find('.icon').addClass('icon-proposal-sent');
                  $successPanel.find('.message').html('Voto realizado com sucesso');
                  $successPanel.removeClass('hide');
                  $proposal.prepend($successPanel);
                  $successPanel.show();
                  // $successPanel.css('top', Math.max(0, (($proposal.height() - $successPanel.outerHeight()) / 2) + $proposal.offset().top) + 'px');
                  // $successPanel.css('left', Math.max(0, (($proposal.width() - $successPanel.outerWidth()) / 2) + $proposal.offset().left) + 'px');
                } else {
                  $proposal.find('.abstract').hide();
                  $proposal.find('.vote-actions .like').hide();
                  $proposal.find('.vote-actions .dislike').hide();

                  var $successPanel = $('.success-panel').clone();
                  // $successPanel.find('.icon').addClass('icon-proposal-sent');
                  $successPanel.find('.message').html('Seu voto já foi computado nesta proposta');
                  $successPanel.removeClass('hide');
                  $proposal.prepend($successPanel);
                  $successPanel.show();
                  // Main.displaySuccess($button.closest('.support-proposal .section-content'), , 800);
                  // $successPanel.find('.message').html('Seu voto já foi computado nesta proposta');
                }
                // ProposalApp.addVotedProposal(article.id);
                // contextMain.loadRandomProposal(topic_id, true);
              });
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

                // remove '/resultados' from URL
                window.location.hash = window.location.hash.split('/resultados')[0];
                e.preventDefault();
              }
            });

          }).fail(function(){
            $loading.hide();
            $('.support-proposal .alert').show();
          });
      },
      loadRanking: function($resultsContainer, topic_id, page) {
        $resultsContainer.find('.loading').show();
        $resultsContainer.find('.results-content').hide();

        var per_page = 10;
        var parentId = topic_id;
        //var url = host + '/api/v1/proposals_discussion_plugin/' + topic_id + '/ranking' + '?private_token=' + Main.private_token + '&per_page='+per_page+'&page='+page;
        var url = host + '/api/v1/proposals_discussion_plugin/' + topic_id + '/ranking' + '?per_page='+per_page+'&page='+page;
        $.getJSON(url).done(function( data, stats, xhr ) {
          data.pagination = {
            total: parseInt(xhr.getResponseHeader('Total')),
            per_page: parseInt(xhr.getResponseHeader('Per-Page')),
            page: page,
          };

          // hack: add more info to result table
          var $header = $resultsContainer.closest('.categories').find('.proposal-header');
          data.title = $header.find('.title').text();
          data.topic_id = $header.find('a').attr('href').match(/\d+/)[0];

          $resultsContainer.html(resultsTemplate(data));
          $resultsContainer.find('.loading').hide();
          $resultsContainer.find('.results-content').show();
          $resultsContainer.find('.timeago').timeago();
          $resultsContainer.show();
          $resultsContainer.find('.footable').footable(); // must be called on visible elements.


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
        var requireLoginContainer;
        $('.login .message').text('');
        if(loginButton){
          requireLoginContainer = loginButton.closest('.require-login-container');
        }

        if(user && !Main.getUser()) {
          Main.setUser(user);
        }

        if(logged_in) {
          Main.showLogout();
          if(token){
            Main.private_token = token;
          }

          $.cookie('_dialoga_session', Main.private_token);

          if(requireLoginContainer){
            // requireLoginContainer = $('.require-login-container');
            requireLoginContainer.find('.require-login').show();
            requireLoginContainer.find('.require-login .message').show();
            requireLoginContainer.find('.login-container').hide();

            $('#login-panel').hide();
          }
        } else if (user) {
          // fluxo signup vindo das caixas de login dentro dos programas
          if(requireLoginContainer && requireLoginContainer.length > 0){
            var loginContainer = requireLoginContainer.find('.login-container');
            loginContainer.show();
            loginContainer.find('.new-user').click();
            var $signupForm = loginContainer.find('#signup-form');
            fillSignupForm($signupForm, user);
          } else { //signup botão Entrar principal vindo de OAUTH
            $('#login-panel').find('a.new-user').click();
            var $signupForm = $('#login-panel #signup-form');
            fillSignupForm($signupForm, user);
          }
        } else {

          if(requireLoginContainer){
            requireLoginContainer.find('.require-login').hide();
            requireLoginContainer.find('.login-container').show();
          }
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
        //var url = host + '/api/v1/articles/' + article_id + '?private_token=' + Main.private_token;
        var url = host + '/api/v1/articles/' + article_id;
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
        var $proposalGroup = $('#proposal-group');
        var $proposalList = $proposalGroup.find('.proposal-list');
        var $proposalItem = $proposalList.find('.proposal-item');
        
        $proposalItem.hide();
        
        $.each(themeClasses, function(i, themeClass) {
          var proposalsByTheme = $proposalList.find('.' + themeClass);
          var randomizedIndex = Math.floor(Math.random() * proposalsByTheme.length);
          // var proposalToShow = $(proposalsByTheme[randomizedIndex]).parents().filter('.proposal-item');
          // $(proposalToShow).show();
          $(proposalsByTheme[randomizedIndex]).show();

          // Hack to align proposals at home
          if(themeClass == "cultura"){
            var l = proposalsByTheme.length;
            var next = randomizedIndex + 1;
            next = next >= l ? 0 : next;
            $(proposalsByTheme[next]).show();
          }
        });
      },
      display_category_tab: function(){
        // $('#proposal-group').hide();
        this.randomProposalByTheme(['saude', 'seguranca-publica', 'educacao', 'reducao-da-pobreza', 'cultura']);
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

        //var url = host + '/api/v1/articles/' + proposal_id + '?private_token=' + Main.private_token + '&fields=id,body&content_type=ProposalsDiscussionPlugin::Topic';
        var url = host + '/api/v1/articles/' + proposal_id + '?fields=id,body&content_type=ProposalsDiscussionPlugin::Topic';
        $.getJSON(url).done(function( data ) {
          $('#proposal-item-' + proposal_id + ' .body-content').replaceWith(data.article.body);
        })
        .fail(function( jqxhr, textStatus, error ) {
          var err = textStatus + ', ' + error;
          console.error( 'Request Failed: ' + err );
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
          $('#article-container').hide();
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
        var regexPropostas = /\/propostas\//;
        var regexHideBarra = /barra=false$/;
        var regexArticle = /#\/artigo/;
        var regexResultados = /resultados$/;
        var regexSobreOPrograma = /sobre-o-programa$/;
        var regexActivateUser = /#\/activate/;
        var regexChangeUserPassword = /#\/trocar_senha/;

        if( (regexHideBarra.exec(hash) === null) && !HIDE_BARRA_DO_GOVERNO ){
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
        var isPropostas       = regexPropostas.exec(hash) !== null;
        var isResultados      = regexResultados.exec(hash) !== null;
        var isSobreOPrograma  = regexSobreOPrograma.exec(hash) !== null;
        var isActivateUser    = regexActivateUser.exec(hash) !== null;
        var isChangeUserPassword = regexChangeUserPassword.exec(hash) !== null;

        if(isArticle) {
          this.display_article(hash.split('/')[2], lastHash);
        }

        var proposalTitle;

        if( isProposal ){

          // go to proposal
          var proposalId = parts[2];
          this.navigateToProposal(proposalId);

          var $proposal = $('#proposal-item-' + proposalId);
          proposalTitle = $proposal.find('.title').text();
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
              $proposal.find('.experience-proposal-container').show();
              $proposal.find('.talk-proposal-container').show();
              $resultsContainer.hide();
            }

            proposalOffset = $resultsContainer.offset();
            if(proposalOffset){
              scrollTop = proposalOffset.top;
            }
          }


          if(isPropostas){
            var $propostasContainer = $proposal.find('.support-proposal-container');

            proposalOffset = $propostasContainer.offset();
            if(proposalOffset){
              scrollTop = proposalOffset.top;
            }

          }
        }

        var categorySlug;

        if( isCategory ){

          // go to category
          categorySlug = parts[2];
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

        if(isActivateUser){
          var code = parts.pop();
          Main.activateUser(code);
        }

        if(isChangeUserPassword){
          var code = parts.pop();
          Main.changeUserPassword(code);
        }

        // [BEGIN] Tracking
        if (window._paq){
          // _paq.push(['trackEvent', 'NavegarPara', hash || '/']);
          // _paq.push(['setDocumentTitle', document.domain + '/' + hash]);
          // _paq.push(['trackPageView']);

          var trackPageTitle = '';
          if(isArticle){
            trackPageTitle = 'Página: Sobre';
          }

          if(isProposal){

            if( proposalTitle ){
              trackPageTitle = 'Programa: ' + proposalTitle + ' / Início';
            }else{
              trackPageTitle = 'todos os programas';
            }

            if(isResultados){
              trackPageTitle += ' / Resultados' ;
            }

            if(isSobreOPrograma){
              trackPageTitle += ' / Conheça o programa' ;
            }
          }

          if(isCategory){
            trackPageTitle = 'Tema: ' + categorySlug;
          }

          window._paq.push(['trackPageView', trackPageTitle]);
          // console.log('tracked page view', trackPageTitle);
        }
        // [END] Tracking

        $('html, body').animate({ scrollTop: scrollTop }, 'fast');
      },
      navigateToProposal: function(proposalId){
        var regexSobreOPrograma = /sobre-o-programa$/;
        if(proposalId === undefined){
          this.display_proposals_tab();
        }else if(regexSobreOPrograma.exec(window.location.hash) === null){
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
        var child = window.open(url, '_blank');
        var interval = setInterval(function() {
            try {
              if(!child.closed) {
                  child.postMessage({
                    message: 'requestOauthClientPluginResult'
                  }, '*');
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
        successPanel.css('top', Math.max(0, ((container.height() - successPanel.outerHeight()) / 2) + container.offset().top) + 'px');
        successPanel.css('left', Math.max(0, ((container.width() - successPanel.outerWidth()) / 2) + container.offset().left) + 'px');

        setTimeout(function() {
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
          if(user.person && user.person.name){
            name = user.person.name;
          }else{
            name = user.email;
          }
        }
        $('#logout-button .name').text(name + " - ");
        $('#logout-button').show();
      },
      responseToText: function(responseJSONmessage){
        var o = JSON.parse(responseJSONmessage);
        var msg = '';
        var fn;

        for (var key in o) {
          if (o[key] instanceof Array) {
            fn =  key;
            for (var i = 0; i < o[key].length; i++) {
              msg += fn + ' ' + o[key][i] + '</br>';
            }
          }
        }
        msg = msg.replace('password_confirmation', 'campo "confirmação da senha"');
        msg = msg.replace(/password/g, 'campo "senha"');
        msg = msg.replace(/login/g, 'campo "nome de usuário"');
        msg = msg.replace(/user/g, 'campo "nome de usuário"');
        msg = msg.replace('email', 'campo "e-mail"');
        msg = msg.substring(0, msg.length - 5) + '.';
        return msg;
      },
      display_events: function(cat_id, active_category) {
        //var url = host + '/api/v1/communities/' + dialoga_community + '/articles?categories_ids[]=' + cat_id + '&content_type=Event&private_token=' + '375bee7e17d0021af7160ce664874618';
        var url = host + '/api/v1/communities/' + dialoga_community + '/articles?categories_ids[]=' + cat_id + '&content_type=Event';
        $.getJSON(url).done(function (data) {

          if(data.articles.length === 0){
            return;
          }

          // FIXME fix api and remove this
          var article;//data.articles[0];
          for(var i=0; i<data.articles.length; i++) {
            if($.grep(data.articles[i].categories, function(e){ return e.id == cat_id; }).length>0) {
              article = data.articles[i];
            }
          }

          var dt = article.start_date;
          var date = dt.substr(8, 2) + '/' + dt.substr(5, 2) + '/' + dt.substr(0, 4);
          var dd = new Date(dt);
          var time = dd.getHours() + ':' + (dd.getMinutes()<10?'0':'') + dd.getMinutes();
          var params = {event: article, date: date, time: time, category: article.categories[0].name, category_class: active_category};
          //$.getJSON(host+'/api/v1/articles/'+article.id+'/followers?private_token=' + '375bee7e17d0021af7160ce664874618' + '&_='+new Date().getTime()).done(function (data) {
          $.getJSON(host+'/api/v1/articles/'+article.id+'/followers?_='+new Date().getTime()).done(function (data) {
            //FIXME do not depend on this request
            params.total_followers = data.total_followers;
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
      reloadCaptcha: function(element) {
        var $element = $(element);
        if($element.data('captcha')){
          $element.data('captcha').recarregar();
        }
      },
      initCaptcha: function(element) {
        var $element = $(element);
        if($element.data('captcha')) return;

        $element.val('');
        var oCaptcha_serpro_gov_br = new captcha_serpro_gov_br();
        $element.data('captcha', oCaptcha_serpro_gov_br);
        oCaptcha_serpro_gov_br.clienteId = serpro_captcha_clienteId;
        if(!localDevelopment) {
          oCaptcha_serpro_gov_br.url = "/serprocaptcha"
        }
        oCaptcha_serpro_gov_br.criarUI(element, 'css', 'serpro_captcha_component_', Main.guid());
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
            maxLinesByParagraph = lines;
          }
        });
        // console.log('maxLinesByParagraph', maxLinesByParagraph);

        // get the bigger title
        $visibleProposals.each(function(index, proposalItemEl){
          var $proposalItemEl = $(proposalItemEl);
          var $title = $proposalItemEl.find('.box__title');
          var lines = Main.computeLines($title);
          if(lines > maxLinesByTitle ){
            maxLinesByTitle = lines;
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
          Main.setUser(data);
        }
        data = data.user || data;
        Main.loginCallback(data.activated, data.private_token);
      },
      handleLoginFail: function (e){
        console.error('handleLoginFail', e);
      },
      changeUserPassword: function(code){
        if(!code || code.length == 0) return;
        var $loginPanel = $('#login-panel');
        $loginPanel.show();
        $loginPanel.find('#login-form').hide();
        var $newPasswordForm = $loginPanel.find('#new-password-form');
        $newPasswordForm.find('#new-password-code').val(code);
        $newPasswordForm.show();
      },
      activateUser: function(code){

        /**
        * @TODO Import database of dialoga.gov.br into local
        *       and test the activation with new url
        */
        if(code && code.length > 0){
          $.ajax({
            method: 'PATCH',
            url:host+'/api/v1/activate',
            data: {
              private_token: Main.private_token,
              activation_code: code
            },
            success:function(response, textStatus, xhr){

              if(xhr != 202){
                $('.activate-message').html('Usuário ativado com sucesso')
                                      .removeClass('alert-danger')
                                      .addClass('alert-success')
                                      .show();

                $(document).trigger('login:success', response);
              }

            },
            error:function(xhr, textStatus, errorTrown){
              if(xhr.status == 412){
                $('.activate-message').html('<strong>Erro:</strong> O código de ativação é inválido')
                                      .removeClass('alert-success')
                                      .addClass('alert-danger')
                                      .show();
              }
            }
          });
        }
      }
    };
  })();


  var noosferoAPI = host + '/api/v1/articles/' + proposal_discussion + '?private_token=' + Main.private_token + '&fields=id,children,categories,abstract,title,image,url,setting,position';

  $.getJSON(noosferoAPI)
    .done(function( data ) {
      data.host = host;
      data.private_token = Main.private_token;

      // check youtube iframe
      function forceWmodeIframe(article){
        var abstract = article.abstract;
        // console.log('article.abstract', article.abstract);

        var patternIframe = '<iframe src="';
        var indexOfIframe = abstract.indexOf(patternIframe);

        if(indexOfIframe === -1){
          return;
        }

        var startSrcUrl = indexOfIframe + patternIframe.length;
        var endSrcUrl = abstract.indexOf('"', startSrcUrl);
        var url = abstract.substring(startSrcUrl , endSrcUrl);
        // console.log('url', url);

        if(url.indexOf('wmode=opaque') !== -1){
          // already in opaque mode
          // console.debug('already in opaque mode');
          return;
        }
        var c = '';
        if(url.indexOf('?') !== -1){
          c = '&';
        }

        var resultUrl = url + c + 'wmode=opaque';
        article.abstract = abstract.replace(url, resultUrl);
        // console.log('article.abstract', article.abstract);
      }

      forceWmodeIframe(data.article);

      function removeStylefromIframe (article){
        var abstract = article.abstract;

        var patternIframe = 'style="';
        var indexOfIframe = abstract.indexOf('<iframe');
        var indexOfStyleOnIframe = abstract.indexOf('style="', indexOfIframe);

        if(indexOfStyleOnIframe === -1){
          return;
        }

        var startStyleContent = indexOfStyleOnIframe + patternIframe.length;
        var endStyleContent = abstract.indexOf('"', startStyleContent);
        var style = abstract.substring(startStyleContent , endStyleContent);
        // console.log('style', style);

        article.abstract = abstract.replace(style, '');
        // console.log('article.abstract', article.abstract);
      }

      removeStylefromIframe(data.article);

      resultsPlaceholder.innerHTML = template(data);
      $('.login-container').html(loginTemplate());
      $('.countdown').maxlength({text: '%left caracteres restantes'});

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
          var isLoginButtonIcon = $target.hasClass('icon-login');
          var requireLogin = $target.hasClass('require-main-login');
          var isChildOfPanel = ($target.closest(loginPanelId).length !== 0);

          if( !isLoginButton && !isLoginButtonIcon && !isChildOfPanel && !requireLogin ){
            $loginPanel.hide();
          }
        });

        // handle esc
        $(document).keyup(function(e) {

          // escape key maps to keycode `27`
          if (e.keyCode === 27) { // ESC
            $loginPanel.hide();
          }
        });

        $('.participar').removeClass('hide');
      })();

      Main.navigateTo(window.location.hash);

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
          var $link = $(this).siblings('.proposal-link');
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

      $( '.proposal-selection' ).change(function(){
        // Update URL and Navigate
        Main.updateHash('#/programas/' + this.value);
        $(this).val($(this).data('proposal')).trigger('chosen:updated');
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
        // var proposal_id = this.id.split('-').pop();
        // var form = this;
        var $form = $(this);
        var $description = $form.find('#article_abstract');
        var $message = $form.find('.message');

        // validation
        if( $description.val().length  === 0 ){
          $message.text('O campo "descrição" é obrigatório.');
          return false;
        }

        // reset messages
        $message.hide();
        $message.text('');

        // handle 'loading'
        var $submitButton = $form.find('.make-proposal-button');
        $submitButton.hide();
        // $loading.show();

        $.ajax({
          type: 'post',
          url: host + $form.attr('action'),
          data: $form.serialize() + '&private_token=' + Main.private_token + '&fields=id&article[name]=article_' + Main.guid()
        })
        .done(function( /*data*/ ) {
          $form[0].reset();
          $form.hide();
          $form.siblings('.success-sent').show();
          $form.siblings('.subtitle').hide();
          $form.siblings('.info').hide();
          Main.displaySuccess($form.closest('.make-proposal .section-content'), 'Proposta enviada com sucesso', 2000, 'icon-proposal-sent');
        })
        .fail(function( jqxhr, textStatus, error ) {
          var err = textStatus + ', ' + error;
          console.error( 'Request Failed: ' + err );
          $message.show();
          $message.text('Não foi possível enviar.');
         })
        .always(function(){
          $submitButton.show();
          // $loading.hide();
        });
      });
    })
    .fail(function( jqxhr, textStatus, error ) {
      var err = textStatus + ', ' + error;
      console.error( 'Request Failed: ' + err );
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
        if(data.status === 401){
          $message.text('Nome de usuário, e-mail ou senha incorretos, não foi possível acessar.');
        }else{
          $message.text('Um erro inesperado ocorreu');
        }

        $(document).trigger('login:fail', data);
      });
    });

    $(document).on('click', '.social .fb-share', function(e) {
      e.preventDefault();
      var link = $(this).attr('href');
      FB.ui({
          method: 'feed',
          link: link,
          name: $(this).data('name') || 'Dialoga Brasil',
          caption: $(this).data('caption') || 'dialoga.gov.br',
          description: $(this).data('description'),
      }, function(response){
        console.log('response', response);
      });
    });

    $(document).on('click', 'a.forgot-password', function(e) {
      var loginForm = $(this).parents('#login-form');
      var $forgotPasswordForm = loginForm.siblings('#forgot-password-form');
      loginForm.hide();
      $forgotPasswordForm.show();

      Main.initCaptcha($forgotPasswordForm.find('#serpro_captcha')[0]);

      var $message = $forgotPasswordForm.find('.message');
      $message.html('');
      $message.hide();
      $forgotPasswordForm.find('#forgot-password-value').val('');

      e.preventDefault();
    });

    $(document).on('click', '.cancel-new-password', function(e) {
      var newPasswordForm = $(this).parents('#new-password-form');
      var loginForm = newPasswordForm.siblings('#login-form');
      loginForm.show();
      newPasswordForm.hide();
    });

    $(document).on('click', '.confirm-new-password', function(e) {
      var $newPasswordForm = $(this).parents('#new-password-form');
      $.ajax({
        method: 'PATCH',
        url:host+'/api/v1/new_password',
        data: {
          code: $newPasswordForm.find('#new-password-code').val(),
          password: $newPasswordForm.find('#new-password').val(),
          password_confirmation: $newPasswordForm.find('#new-password-confirmation').val()
        },
      }).done(function(data) {
        $newPasswordForm.find('.cancel-new-password').click();
        var $message = $newPasswordForm.siblings('#login-form').find('.message-success');
        $message.html('Senha alterada com sucesso.');
        $message.show();
        window.location.hash = '/';
      }).fail(function() {
        var $message = $newPasswordForm.find('.message');
        $message.html('Não foi possível trocar a senha com os dados informados.');
        $message.show();
      });
      e.preventDefault();
    });

    $(document).on('click', '.confirm-forgot-password', function(e) {
      var $forgotPasswordForm = $(this).parents('#forgot-password-form');
      var $inputValue = $forgotPasswordForm.find('#forgot-password-value');
      var forgotPasswordFormData = $forgotPasswordForm.serialize();
      $.ajax({
        method: 'post',
        url:host+'/api/v1/forgot_password',
        data: forgotPasswordFormData,
      }).done(function(data) {
        $forgotPasswordForm.find('.cancel-forgot-password').click();
        var $message = $forgotPasswordForm.siblings('#login-form').find('.message-success');
        $message.html('Verifique seu email para efetuar a troca da senha.');
        $message.show();
      }).fail(function(data) {
        console.log(data.responseJSON);

        Main.reloadCaptcha($forgotPasswordForm.find('#serpro_captcha')[0]);
        var $message = $forgotPasswordForm.find('.message');
        $message.html('Não foi possível requisitar a troca de senha para os dados informados.');
        $message.show();
      });
      e.preventDefault();
    });

    $(document).on('click', '.cancel-forgot-password', function(e) {
      var forgotPasswordForm = $(this).parents('#forgot-password-form');
      var loginForm = forgotPasswordForm.siblings('#login-form');
      loginForm.show();
      forgotPasswordForm.hide();
    });

    $(document).on('click', '.new-user', function(e) {
      var message = $('.signup .message');
      message.hide();
      message.text('');

      var loginForm = $(this).parents('#login-form');
      var signupForm = loginForm.siblings('#signup-form');
      window.signupForm = signupForm;

      loginForm.hide();
      signupForm.show();

      signupForm.find('.password').show();
      signupForm.find('.password-confirmation').show();

      signupForm.find('signup-user_password').attr('required', true);
      signupForm.find('#user_password_confirmation').attr('required', true);

      loginForm.find('.message').hide();
      signupForm.find('#serpro_captcha').val('');

      signupForm.find('#signup-user_email').val('');
      signupForm.find('#signup-user_email').attr('disabled', false);
      signupForm.find('#signup-user_fullname').val('');
      signupForm.find('#user_password_confirmation').val('');
      signupForm.find('#signup-user_password').val('');
      signupForm.find('#captcha_text').val('');
      signupForm.find('#user_terms_accepted').removeAttr('checked');

      Main.initCaptcha(signupForm.find('#serpro_captcha')[0]);

      e.preventDefault();
    });

    $(document).on('click', '.cancel-signup', function(e) {
      var signupForm = $(this).parents('#signup-form');
      signupForm.find('#user_oauth_providers').val('');
      signupForm.hide();
      signupForm.siblings('#login-form').show();
      e.preventDefault();
    });

    $(document).on('click', '.confirm-signup', function(e) {

      function validateEmail(email) {
          var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
          return re.test(email);
      }

      var $button = $(this);
      var $signupForm = $(this).parents('form.signup');
      var $inputEmail = $signupForm.find('#signup-user_email');
      var $inputFullname = $signupForm.find('#signup-user_fullname');
      var $inputPassword = $signupForm.find('#signup-user_password');
      var $inputPasswordConfirmation = $signupForm.find('#user_password_confirmation');
      var $inputAcceptation = $signupForm.find('#user_terms_accepted');
      var $inputCaptcha = $signupForm.find('#captcha_text');

      // clear messages
      var message = $('.signup .message');
      message.hide();
      message.text('');

      // Validate form
      var hasEmail = $inputEmail && validateEmail($inputEmail.val());

      var isOAUTH = $signupForm.find('#user_oauth_providers').val() !== '';

      var hasPassword = true;
      var hasPasswordConfirmation = true;
      var hasPasswordEquals = true;
      var hasFullname = true;

      if(! isOAUTH){
        hasPassword = $inputPassword && $inputPassword.val().length > 0;
        hasPasswordConfirmation = $inputPasswordConfirmation && $inputPasswordConfirmation.val().length > 0;
        hasPasswordEquals = $inputPassword.val() === $inputPasswordConfirmation.val();
        hasFullname = $inputFullname && $inputFullname.val().length > 0;
      }

      var hasAcceptation = $inputAcceptation.prop('checked');
      var hasCaptcha = $inputCaptcha.val().length > 0;
      var hasError = (!hasEmail || !hasPassword || !hasPasswordConfirmation || !hasPasswordEquals || !hasAcceptation || !hasCaptcha);

      if(hasError){

        if ($signupForm[0].checkValidity() || !hasAcceptation) { // force check of HTML5 validation
          e.preventDefault();

          var messageErrors = [];

          messageErrors.push('<ul>'); // start a HTML list

          if (!hasEmail){
            messageErrors.push('<li>O e-mail é um campo obrigatório.</li>');
          }

          if(!isOAUTH){
            if (!hasPassword){
              messageErrors.push('<li>A senha é um campo obrigatório.</li>');
            }

            if (!hasPasswordConfirmation){
              messageErrors.push('<li>A confirmação da senha é um campo obrigatório.</li>');
            }

            if (!hasPasswordEquals){
              messageErrors.push('<li>A senha e confirmação da senha devem ser iguais.</li>');
            }

            if (!hasFullname){
              messageErrors.push('<li>O nome é obrigatório.</li>');
            }
          }

          if (!hasAcceptation){
            messageErrors.push('<li>Você deve ler e aceitar os termos de uso.</li>');
          }

          if (!hasCaptcha){
            messageErrors.push('<li>Você deve digitar o texto da imagem.</li>');
          }

          messageErrors.push('</ul>'); // close the paragraph

          messageErrors = messageErrors.join('<br/>');
          message.html($(messageErrors));
          message.show();
        }
      } else {
        e.preventDefault();
        // show loading
        var $loading = $('.login-container .loading');
        $loading.show();
        var signup_form_data = $signupForm.serialize();
        if(! new RegExp('email=').test(signup_form_data)){
          signup_form_data += "&email=" + $inputEmail.val();
        }
        var indexAt = $inputEmail.val().indexOf('@');
        login = $inputEmail.val().substr(0, indexAt);
        login = login.toLowerCase().replace(/\W+/g,"").substr(0,25) + "-" + Date.now();
        signup_form_data += "&login=" + login;
        signup_form_data += "&name=" + $inputFullname.val();
        $.ajax({
          type: 'post',
          contentType: 'application/x-www-form-urlencoded',
          url: host + '/api/v1/register',
          data: signup_form_data,
        })
        .done(function (data){
              $signupForm.hide();
              $signupForm.removeClass('hide');
              var $sectionContent = $button.closest('.section-content');

              if(data.activated) {
                if($sectionContent && $sectionContent.length > 0){
                  Main.displaySuccess($sectionContent, 'Cadastro efetuado com sucesso', 1000, 'icon-user-created');
                }
                $(document).trigger('login:success', data);
              } else {
                $signupForm.find('.cancel-signup').click();
                $signupForm.hide();
                var $message = $signupForm.siblings('#login-form').find('.message-success');
                $message.html('Cadastro efetuado com sucesso.<br/>Verifique seu email para confirmar o cadastro.');
                $message.show();
              }
            })
        .fail(function (data) {
              var msg = '';
              Main.reloadCaptcha($signupForm.find('#serpro_captcha')[0]);

              if(data.responseJSON){
                try{
                  msg = Main.responseToText(data.responseJSON.message);
                }catch(ex){
                  var ptBR = {};
                  // (Invalid request) email can't be saved
                  ptBR['(Invalid request) email can\'t be saved'] = 'E-mail inválido.';
                  // (Invalid request) login can't be saved
                  ptBR['(Invalid request) login can\'t be saved'] = 'Nome de usuário inválido.';
                  ptBR['Please solve the test in order to register.'] = 'Por favor, digite os caracteres da imagem na caixa abaixo dela.';
                  ptBR['Wrong captcha text, please try again'] = 'Por favor, digite os caracteres da imagem na caixa abaixo dela.';
                  ptBR['Internal captcha validation error'] = 'Por favor, digite os caracteres da imagem na caixa abaixo dela.';
                  msg = '<br/><br/>';
                  msg += ptBR[data.responseJSON.message] || data.responseJSON.message;
                }
              }else{
                msg = '<br/><br/>';
                msg += 'Erro na comunicação com o servidor.';
              }
              message.html('<p>Não foi possível efetuar o cadastro:' + msg + '</p>');
              message.show();
              $(document).trigger('login:fail', data);
            }
        )
        .always(function (data) {
              $loading.hide();
              if(!data || data.activated) {
                $signupForm.show();
              }
            }
        );
      }
    });

    var popupCenter = function(url, title, w, h) {
      var dualScreenLeft = window.screenLeft !== undefined ? window.screenLeft : screen.left;
      var dualScreenTop = window.screenTop !== undefined ? window.screenTop : screen.top;

      var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
      var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

      var left = ((width / 2) - (w / 2)) + dualScreenLeft;
      var top = ((height / 3) - (h / 3)) + dualScreenTop;

      var newWindow = window.open(url, title, 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

      // Puts focus on the newWindow
      if (window.focus) {
        newWindow.focus();
      }
    };

    $(document).on('click', '.social a.popup', {}, function popUp(e) {
      var self = $(this);
      popupCenter(self.attr('href'), self.find('.rrssb-text').html(), 580, 470);
      e.preventDefault();
    });

    $(document).on('click', '#logout-button', function (e){
      $.removeCookie('_dialoga_session');
      $.removeCookie('votedProposals');
      $.removeCookie('*');
      logged_in = false;
      Main.showLogin();
      if(window.location.hash.indexOf('/resultados') !== -1){
        window.location.hash = window.location.hash.split('/resultados')[0];
      }else{
        location.reload();
      }
      e.preventDefault();
    });

    // hack-fix to support z-index over video/iframe
    // function checkIframes () {

    //   $('iframe').each(function(){
    //     var $iframe = $(this);
    //     var url = $iframe.attr('src');
    //     var c = '?';

    //     if(url.indexOf("youtube") === -1){
    //       // is not a iframe of youtube
    //       // console.debug('is not a iframe of youtube');
    //       return;
    //     }

    //     if(url.indexOf("wmode=opaque") !== -1){
    //       // already in opaque mode
    //       // console.debug('already in opaque mode');
    //       return;
    //     }

    //     if(url.indexOf('?') !== -1){
    //       c = '&';
    //     }

    //     $iframe.attr("src",url+c+"wmode=opaque");
    //     // console.debug('iframe changed to opaque mode');
    //   });

    //   setTimeout(checkIframes, 500);
    // }
    // checkIframes();

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
    };
  }else{
    console.warn('The browser not supports the hashchange event!');
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
    };

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
