define(['handlebars','handlebars_helpers'], function(Handlebars){

  /* global Handlebars, $ */
  // The template code
  var templateSource = $('#proposal-template').html();

  // compile the template
  var template = Handlebars.compile(templateSource);
  var supportProposalTemplate = Handlebars.compile(document.getElementById('support-proposal-template').innerHTML);
  var loginTemplate = Handlebars.compile(document.getElementById('login').innerHTML);
  var resultsTemplate = Handlebars.compile(document.getElementById('results').innerHTML);

  // The div/container that we are going to display the results in
  var resultsPlaceholder = document.getElementById('proposal-result');

  var logged_in = false;

  var loginButton;

  var participa = true;
  if(participa){
    var host = 'http://www.participa.br';
    var private_token = '375bee7e17d0021af7160ce664874618';  //participa
    var proposal_discussion = '92856'; //participa
  }else{
    var host = 'http://noosfero.com:3000';
    //var private_token = 'bd8996155f5ea4354e42fee50b4b6891'; //casa
    var private_token = 'aae32bf5031e895b00a20a529d763b31'; //local serpro
    var proposal_discussion = '632'; //local serpro
    //var proposal_discussion = '401'; //casa
  }

  // Load data from localhost when it is dev env.
  var noosferoAPI = host + '/api/v1/articles/' + proposal_discussion + '?private_token=' + private_token + '&fields=id,children,categories,abstract,title,image,url,setting';

  $.getJSON(noosferoAPI)
    .done(function( data ) {
      data.host = host;
      data.private_token = private_token;
      resultsPlaceholder.innerHTML = template(data);
      $('.login-container').html(loginTemplate());
      $('.countdown').maxlength({text: '%left caracteres restantes'});

      Main.navigateTo(window.location.hash);

      //Actions for links
      $( '#nav-proposal-categories a' ).on('click touchstart', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '#nav-proposal-group a' ).on('click touchstart', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.proposal-item a' ).on('click touchstart', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.proposal-category a' ).on('click touchstart', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.proposal-category .go-back' ).on('click touchstart', function(e){
        e.preventDefault();

        var oldHash = window.location.hash;
        var regexSubpages = /sobre-o-programa$/;
        var isSubpage = regexSubpages.exec(oldHash) !== null;
        var newHash = '#/temas'; // default page

        if(isSubpage){
          // return to proposal page
          newHash = oldHash.split('/sobre-o-programa')[0];
        }

        // Update URL and Navigate
        Main.updateHash(newHash);
      });

      $( '.send-button a' ).on('click touchstart', function(e){
        e.preventDefault();

        //display form to send proposal (or login form for non-logged users)
        var $this = $(this);
        loginButton = $this.parents('.send-button');
        loginButton.hide();
        $this.parents('.success-proposal-sent').hide();
        Main.loginCallback(logged_in);
      });

      $( '#display-contrast' ).on('click touchstart', function(e){
        e.preventDefault();
        $('#proposal-result').toggleClass('contrast');
      });

      $( '.show_body a' ).on('click touchstart', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.go-to-proposal-button a' ).on('click touchstart', function(e){
        e.preventDefault();

        var $link = $(this);

        // Update URL and Navigate
        Main.updateHash($link.attr('href'));
      });

      $( '.proposal-selection' ).change(function(e){
        e.preventDefault();

        // Update URL and Navigate
        Main.updateHash('#/programas/' + this.value);
      });

      var availableTags = [ ];
      $('#proposal-group li a').each(function(){
        availableTags.push({ label: $(this).text(), value: $(this).attr('href')});
      });

      $( '#search-input' ).autocomplete({
        source: availableTags,
        minLength: 3,
        select: function( event, ui ) {
          updateHash(ui.item.value);
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
          data: $('#'+this.id).serialize() + '&private_token=' + private_token + '&fields=id&article[name]=article_' + Main.guid()
        })
        .done(function( /*data*/ ) {
          form.reset();
          $form.hide();
          $form.siblings('.success-sent').show();
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

    var BARRA_ADDED = false;
    var HIDE_BARRA_DO_GOVERNO = false;

    Main = (function(){

      return {
        loadRandomProposal: function (topic_id, private_token) {
            var $noProposals = $('.no-proposals');
            var $loading = $('.loading');
            var $randomProposal = $('.random-proposal');
            var $body = $(document.body);
            var contextMain = this;

            // reset view
            $noProposals.hide();
            $loading.show();
            $randomProposal.html('');

            var url = host + '/api/v1/articles/' + topic_id + '/children' + '?private_token=' + private_token + '&limit=1&order=random()&_='+new Date().getTime()+'&fields=id,name,abstract,created_by&content_type=ProposalsDiscussionPlugin::Proposal';
            $.getJSON(url).done(function( data ) {
              $loading.hide();

              if(data.articles.length === 0) {
                $noProposals.show();
                return;
              }

              var article = data.articles[0];
              $randomProposal.html(supportProposalTemplate(article));
              $body.off('click', '.vote-actions .skip');
              $body.on('click', '.vote-actions .skip', function(e) {
                contextMain.loadRandomProposal(topic_id, private_token);
                e.preventDefault();
              });
              $body.off('click', '.vote-actions .like');
              $body.on('click', '.vote-actions .like', function(e) {
                //Helps to prevent more than one vote per proposal
                if(ProposalApp.hasProposalbeenVoted(article.id)){
                  console.log("Proposta " + article.id + " já havia sido votada");
                  contextMain.loadRandomProposal(topic_id, private_token);
                  e.preventDefault();
                  return;
                }
                $.ajax({
                  type: 'post',
                  url: host + '/api/v1/articles/' + article.id + '/vote',
                  data: {
                    value: $(this).data('vote-value'),
                    private_token: private_token
                  }
                }).done(function( /*data*/ ) {
                  ProposalApp.addVotedProposal(article.id);
                  contextMain.loadRandomProposal(topic_id, private_token);
                });
                e.preventDefault();
              });

              $body.off('click', '.vote-result');
              $body.on('click', '.vote-result', function(e) {

                var $this = $(this);
                var $proposalDetail = $this.parents('.proposal-detail');
                var $resultsContainer = $proposalDetail.find('.results-container');

                // $resultsContainer.toggle();
                // $resultsContainer.toggleClass('hide');

                if($resultsContainer.css('display') === 'none') {

                  $resultsContainer.find('.loading').show();
                  $resultsContainer.find('.results-content').hide();

                  var url = host + '/api/v1/articles/' + topic_id + '/children' + '?private_token=' + private_token + '&limit=10&order=votes_score&fields=id,name,abstract,votes_for,votes_against&content_type=ProposalsDiscussionPlugin::Proposal';
                  $.getJSON(url).done(function( data ) {

                    $resultsContainer.html(resultsTemplate(data));
                    $resultsContainer.find('.loading').hide();
                    $resultsContainer.find('.results-content').show();
                    $resultsContainer.show();

                    // scroll to the end
                    $('html, body').animate({
                      scrollTop: $(document).height()
                    }, 'fast');
                  });
                  $('.experience-proposal-container').hide();
                  $('.talk-proposal-container').hide();
                } else {
                  $('.experience-proposal-container').show();
                  $('.talk-proposal-container').show();
                  $resultsContainer.hide();
                }

                e.preventDefault();
              });
            });
          },

          loginCallback: function(loggedIn, token) {
            logged_in = loggedIn;
            $('.login .message').text('');

            if(logged_in) {
              if(token){
                private_token = token;
              }
              loginButton.siblings('.save-article-form').show();
              loginButton.siblings('.save-article-form .message').show();
              loginButton.siblings('.login-container').hide();
              $.cookie('_dialoga_session', private_token);
            } else {
              loginButton.siblings('.save-article-form').hide();
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
          display_category_tab: function(){
            $('#proposal-group').hide();
            $('#proposal-categories').show();
            $('#nav-proposal-categories a').addClass('active');
            $('#nav-proposal-group a').removeClass('active');
            $('.proposal-category-items').hide();
            $('.proposal-category .arrow-box').hide();
            $('.proposal-detail').hide();

            $('#content').show();
            $('nav').show();
          },
          display_proposals_tab: function(){
            $('#proposal-categories').hide();
            $('#proposal-group').show();
            $('#nav-proposal-group a').addClass('active');
            $('#nav-proposal-categories a').removeClass('active');
            $('#content').show();
            $('nav').show();
          },
          display_proposal: function(proposal_id){
            $('#proposal-categories').hide();
            $('#proposal-group').hide();
            $('nav').hide();
            $('#content').hide();
            $('.make-proposal-form').hide();
            $('.login-container').hide();
            $('.proposal-detail').hide();
            $('.proposal-detail-base').hide();
            $('#' + proposal_id).show();
            $('.proposal-header').show();
            $('.make-proposal-container').show();
            $('.support-proposal-container').show();
            $('.results-container').hide();
            $('.results-container .loading').hide();
            $('.results-container .results-content').hide();
            $('.experience-proposal-container').show();
            $('.talk-proposal-container').show();
            var topic_id = proposal_id.split('-').pop();
            this.loadRandomProposal(topic_id, private_token);
          },
          display_proposal_detail: function(proposal_id){
            $('#proposal-categories').hide();
            $('#proposal-group').hide();
            $('nav').hide();
            $('#content').hide();
            $('.make-proposal-form').hide();
            $('.proposal-header').hide();
            $('.make-proposal-container').hide();
            $('.support-proposal-container').hide();
            $('.results-container').hide();
            $('.experience-proposal-container').hide();
            $('.talk-proposal-container').hide();
            $('#proposal-item-' + proposal_id + ' .body').show();

            var url = host + '/api/v1/articles/' + proposal_id + '?private_token=' + private_token + '&fields=id,body&content_type=ProposalsDiscussionPlugin::Topic';
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
              $('.proposal-category-items').hide();
              $('.proposal-detail').hide();
              $item.toggle( 'blind', 1000 );
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
              '<div id="footer-brasil"></div>' +
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
            var regexProposals = /#\/programas/;
            var regexCategory = /#\/temas/;
            var regexHideBarra = /barra=false$/;

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

            if( isProposal ){

              // go to proposal
              var proposalId = parts[2];
              this.navigateToProposal(proposalId);
            }

            if( isCategory ){

              // go to category
              var categoryId = parts[3];
              this.navigateToCategory(categoryId);
            }

            // default
            if( !isProposal && !isCategory ){
              // show the 'index' -> category tab
              this.display_category_tab();
            }

            $('html, body').animate({ scrollTop: 0 }, 'fast');
          },
          navigateToProposal: function(proposalId){
            if(proposalId === undefined){
              this.display_proposals_tab();
            }else{
              this.display_proposal('proposal-item-' + proposalId);

              // show sub-page
              var regexSubpages = /sobre-o-programa$/;
              var m;
              if((m = regexSubpages.exec(window.location.hash)) !== null ){
                this.display_proposal_detail(proposalId);
              }
            }
          },
          navigateToCategory: function(categoryId){
            if(categoryId === undefined){
              this.display_category_tab();
            }else{
              this.display_proposal_by_category('proposal-item-' + categoryId);
            }
          }
      }
    })();


  $(document).ready(function($) {
    if($.cookie('_dialoga_session')) {
      var url = host + '/api/v1/users/me?private_token=' + $.cookie('_dialoga_session');
      $.getJSON(url).done(function( /*data*/ ) {
        logged_in = true;
        private_token = $.cookie('_dialoga_session');
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
  });

  window.oauthPluginHandleLoginResult = function(loggedIn, token) {
    Main.loginCallback(loggedIn, token);
  }

  if('onhashchange' in window){

    window.onhashchange = function(){
      Main.locationHashChanged.apply(Main);
    }
  }else{
    console.log('The browser not supports the hashchange event!');
  }

  return Main;
});
