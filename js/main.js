define(['handlebars', 'fastclick', 'handlebars_helpers'], function(Handlebars, FastClick){

  /* global Handlebars, $ */
  // The template code
  var templateSource = $('#proposal-template').html();

  // compile the template
  var template = Handlebars.compile(templateSource);
  var supportProposalTemplate = Handlebars.compile(document.getElementById('support-proposal-template').innerHTML);
  var loginTemplate = Handlebars.compile(document.getElementById('login').innerHTML);
  var resultsTemplate = Handlebars.compile(document.getElementById('results').innerHTML);
  var articleTemplate = Handlebars.compile(document.getElementById('article').innerHTML);

  // The div/container that we are going to display the results in
  var resultsPlaceholder = document.getElementById('proposal-result');

  var logged_in = false;

  var loginButton;

  var participa = true;

  //Detects for localhost settings
  var patt = new RegExp(":3000/");
  if(patt.test(window.location.href))
    participa = false;
  
  if(participa){
    var host = 'http://www.participa.br';
    var proposal_discussion = '103358'; //participa
    window.recaptchaSiteKey = '6LcLPAcTAAAAAKsd0bxY_TArhD_A7OL19SRCW7_i'
  }else{
    var host = 'http://noosfero.com:3000';
    var proposal_discussion = '392'; //local serpro
    window.recaptchaSiteKey = '6LdsWAcTAAAAAChTUUD6yu9fCDhdIZzNd7F53zf-' //http://noosfero.com/
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
            $body.off('click', '.vote-actions .like');
            $body.on('click', '.vote-actions .like', function(e) {
              //Helps to prevent more than one vote per proposal
              if(ProposalApp.hasProposalbeenVoted(article.id)){
                console.log("Proposta " + article.id + " já havia sido votada");
                contextMain.loadRandomProposal(topic_id);
                e.preventDefault();
                return;
              }

              if(!logged_in) {
                $(this).closest('.support-proposal').find('.send-button a').click();
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
              }).done(function( /*data*/ ) {
                ProposalApp.addVotedProposal(article.id);
                contextMain.loadRandomProposal(topic_id);
              });
              e.preventDefault();
            });

            $body.off('click', '.vote-result');
            $body.on('click', '.vote-result', function(e) {
              var $this = $(this);
              var $proposalDetail = $this.parents('.proposal-detail');
              var $resultsContainer = $proposalDetail.find('.results-container');

              if($resultsContainer.css('display') === 'none') {
                Main.loadRanking($resultsContainer, topic_id, 1);
              } else {
                $('.experience-proposal-container').show();
                $('.talk-proposal-container').show();
                $resultsContainer.hide();
              }
              e.preventDefault();
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
          var url = host + '/api/v1/proposals_discussion_plugin/' + topic_id + '/ranking' + '?private_token=' + Main.private_token + '&per_page='+per_page+'&page='+page;
          $.getJSON(url).done(function( data, stats, xhr ) {
            data.pagination = {
              total: parseInt(xhr.getResponseHeader('Total')),
              per_page: parseInt(xhr.getResponseHeader('Per-Page')),
              page: page,
            };

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

            // scroll to the end
            $('html, body').animate({
              scrollTop: $(document).height()
            }, 'fast');
          });
          $('.experience-proposal-container').hide();
          $('.talk-proposal-container').hide();
        },

        loginCallback: function(loggedIn, token, user) {
          logged_in = loggedIn;
          $('.login .message').text('');

          if(logged_in) {
            if(token){
              Main.private_token = token;
            }
            loginButton.siblings('.require-login').show();
            loginButton.siblings('.require-login .message').show();
            loginButton.siblings('.login-container').hide();
            $.cookie('_dialoga_session', Main.private_token);
          } else if (user) {
            var loginContainer = loginButton.siblings('.login-container');
            loginContainer.show();
            loginContainer.find('.new-user').click();
            var signupForm = loginContainer.find('#signup-form');
            signupForm.find("#user_email").val(user.email);
            signupForm.find("#user_name").val(user.login);
            signupForm.find("#user_oauth_providers").val(user.oauth_providers);
            //signupForm.find(".password").hide();
            //signupForm.find(".password-confirmation").hide();
          } else {
            loginButton.siblings('.require-login').hide();
            loginButton.siblings('.login-container').show();
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
        display_article: function(article_id) {
          var url = host + '/api/v1/articles/' + article_id + '?private_token=' + Main.private_token;
          $.getJSON(url).done(function( data ) {
            $('#article-container').html(articleTemplate(data.article));
            $('#article-container').show();
            $('#proposal-categories').hide();
            $('#proposal-group').hide();
            $('nav').hide();
            $('#content').hide();
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
          $('#proposal-categories').show();
          $('#nav-proposal-categories a').addClass('active');
          $('#nav-proposal-group a').removeClass('active');
          $('.proposal-category-items').hide();
          $('.proposal-category .arrow-box').hide();
          $('.proposal-detail').hide();
          $('#article-container').hide();

          $('#content').show();
          $('nav').show();
        },
        display_proposals_tab: function(){
          $('#proposal-categories').hide();
          this.randomProposalByTheme(['category-saude', 'category-seguranca-publica', 'category-educacao', 'category-reducao-da-pobreza']);
          $('#proposal-group').show();
          $('#nav-proposal-group a').addClass('active');
          $('#nav-proposal-categories a').removeClass('active');
          $('#content').show();
          $('#article-container').hide();
          $('nav').show();
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
          $('.proposal-detail').hide(); // hide all proposals
          // $('.proposal-detail-base').hide();
          $proposal = $('#' + proposal_id);
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
          switch($proposal.find('.categories').attr('class')) {
            case 'categories saude':
              active_category = 'saude';
              break;
            case 'categories educacao':
              active_category = 'educacao';
              break;
            case 'categories seguranca-publica':
              active_category = 'seguranca-publica';
              break;
            case 'categories reducao-da-pobreza':
              active_category = 'reducao-da-pobreza';
              break;
          }     

          $proposal.find('.calendar.' + active_category).show();
          $proposal.find('.calendar').slick();

          var topic_id = proposal_id.split('-').pop();
          this.loadRandomProposal(topic_id);
        },
        display_proposal_detail: function(proposal_id){
          $('.content').removeClass('background'); /* Remove class background */
          $('#proposal-categories').hide();
          $('#proposal-group').hide();
          $('nav').hide();
          $('#content').hide();
          $('#article-container').hide();
          $proposal = $('#proposal-item-' + proposal_id);
          $proposal.find('.make-proposal-form').hide();
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
            $('.proposal-detail').hide();
            $item.toggle( 'blind', 200, function () {
              var itemOffset = $item.offset();
              if(itemOffset){
                $('html, body').animate({ scrollTop: itemOffset.top }, 'fast');
              }
            } );
            $('.proposal-category .arrow-box').hide();
            var categorySlug = $item.data('category');
            $('#proposal-category-' + categorySlug).find('.arrow-box').show();

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
          this.navigateTo(hash);
        },
        navigateTo: function(hash){
          var scrollTop = 0;
          var $nav = $('nav[role="tabpanel"]');
          var navOffset = $nav.offset();

          var regexProposals = /#\/programas/;
          var regexCategory = /#\/temas/;
          var regexHideBarra = /barra=false$/;
          var regexArticle = /#\/artigo/;

          if( !(regexHideBarra.exec(hash) !== null) && !HIDE_BARRA_DO_GOVERNO ){
            this.addBarraDoGoverno();
          }else{
            HIDE_BARRA_DO_GOVERNO = true;
          }

          // remove query params
          hash = hash.split('?')[0];

          var parts = hash.split('/');

          var isProposal = regexProposals.exec(hash) !== null;
          var isCategory = regexCategory.exec(hash) !== null;
          var isArticle  = regexArticle.exec(hash) !== null;

          if(isArticle) {
            this.display_article(hash.split('/')[2]);
          }

          if( isProposal ){

            // go to proposal
            var proposalId = parts[2];
            this.navigateToProposal(proposalId);

            var $proposal = $('#proposal-item-' + proposalId);
            var proposalOffset = $proposal.offset();
            if(proposalOffset){
              scrollTop = proposalOffset.top;
            }else{
              if(navOffset){
                scrollTop = navOffset.top;
              }
            }
          }

          if( isCategory ){

            // go to category
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


            // if(navOffset){
            //   scrollTop = navOffset.top;
            // }
          }

          $('html, body').animate({ scrollTop: scrollTop }, 'fast');
        },
        navigateToProposal: function(proposalId){
          var regexSubpages = /sobre-o-programa$/;
          if(proposalId === undefined){
            this.display_proposals_tab();
          }else if(regexSubpages.exec(window.location.hash) == null){
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
        responseToText: function(responseJSONmessage){
          var o = JSON.parse(responseJSONmessage);
          var msg;
          Object.keys(o).map(function(k) { msg += k + " " + o[k] + ", " });
          return msg.substring(0, msg.length - 2) + ".";
        }
    }
  })();

  // Load data from localhost when it is dev env.
  var noosferoAPI = host + '/api/v1/articles/' + proposal_discussion + '?private_token=' + Main.private_token + '&fields=id,children,categories,abstract,title,image,url,setting,position';

  $.getJSON(noosferoAPI)
    .done(function( data ) {
      data.host = host;
      data.private_token = Main.private_token;
      resultsPlaceholder.innerHTML = template(data);
      $('.login-container').html(loginTemplate());
      $('.countdown').maxlength({text: '%left caracteres restantes'});

      Main.navigateTo(window.location.hash);

      $('.oauth-login').on('click', function(e) {
        Main.oauthClientAction($(this).attr('href'));
        e.preventDefault();
      });

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
        var regexSubpages = /sobre-o-programa$/;
        var isSubpage = regexSubpages.exec(oldHash) !== null;
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

      $( '.send-button a' ).on('click', function(e){
        e.preventDefault();

        //display form to send proposal (or login form for non-logged users)
        var $this = $(this);
        loginButton = $this.parents('.send-button');
        loginButton.hide();
        $this.parents('.success-proposal-sent').hide();
        $wrapper = $this.parents('.make-proposal');
        $wrapper.find('.subtitle').show();
        $wrapper.find('.info').show();
        Main.loginCallback(logged_in);
      });

      $( '#display-contrast' ).on('click', function(e){
        e.preventDefault();
        $('body').toggleClass('contrast');
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

  // window.addEventListener('load', function() {
  //   new FastClick(document.body);
  // }, false);


  $(document).ready(function($) {

    FastClick.attach(document.body);

    if($.cookie('_dialoga_session')) {
      var url = host + '/api/v1/users/me?private_token=' + $.cookie('_dialoga_session');
      $.getJSON(url).done(function( /*data*/ ) {
        logged_in = true;
        Main.private_token = $.cookie('_dialoga_session');
      });
    }

    $(document).on('click', '.login-action', function(e) {
      var message = $('.login .message');
      message.hide();
      message.text('');
      $.ajax({
        type: 'post',
        url: host + '/api/v1/login',
        data: $(this).parents('.login').serialize(),
        xhrFields: {
          //withCredentials: true
        }
      }).done(function(data) {
        Main.loginCallback(true, data.private_token);
      }).fail(function( /*data*/ ) {
        message.show();
        message.text('Não foi possível logar');
      });
      e.preventDefault();
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
      grecaptcha.render(signupForm.find('#g-recaptcha')[0], {'sitekey' : window.recaptchaSiteKey });
      e.preventDefault();
    })

    $(document).on('click', '.cancel-signup', function(e) {
      var signupForm = $(this).parents('#signup-form');
      signupForm.hide();
      signupForm.siblings('#login-form').show();
      grecaptcha.reset();
      e.preventDefault();
    });

    $(document).on('click', '.confirm-signup', function(e) {
      var message = $('.signup .message');
      message.hide();
      message.text('');

      var signup = $(this).parents('form.signup');
      var loading = $('.login-container .loading');
      loading.show();
      signup.hide();

      $.ajax({
        type: 'post',
        url: host + '/api/v1/register',
        data: $(this).parents('.signup').serialize(),
      }).done(function(data) {
        Main.loginCallback(true, data.private_token);
      }).fail(function(data) {
        var msg = Main.responseToText(data.responseJSON.message);
        message.show();
        message.text('Não foi possível efetuar o cadastro: ' + msg);
      }).always(function() {
        loading.hide();
        signup.show();
      });
      grecaptcha.reset();
      e.preventDefault();
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
  });

  window.addEventListener("message", function(ev) {
    if (ev.data.message === "oauthClientPluginResult") {
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

  return Main;
});
