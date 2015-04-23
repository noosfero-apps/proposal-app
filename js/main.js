// The template code
var templateSource = document.getElementById('proposal-template').innerHTML;

// compile the template
var template = Handlebars.compile(templateSource);

var supportProposalTemplate = Handlebars.compile(document.getElementById('support-proposal-template').innerHTML);
var loginTemplate = Handlebars.compile(document.getElementById('login').innerHTML);
var resultsTemplate = Handlebars.compile(document.getElementById('results').innerHTML);

// The div/container that we are going to display the results in
var resultsPlaceholder = document.getElementById('proposal-result');

var topics;

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
  var private_token = '04c9b36cf0afba52915fe86f182e741c'; //local serpro
  var proposal_discussion = '632'; //local serpro
  //var proposal_discussion = '401'; //casa
}

var noosferoAPI = host + '/api/v1/articles/' + proposal_discussion + '?private_token=' + private_token + '&fields=id,children,categories,abstract,body,title,image,url';

$.getJSON(noosferoAPI)
  .done(function( data ) {
    data['host'] = host;
    data['private_token'] = private_token;
    resultsPlaceholder.innerHTML = template(data);
    $('.login-container').html(loginTemplate());
    $('.countdown').maxlength({text: '%left caracteres restantes'});

    url = $(location).attr('href').split('#').pop();
    if(url.match(/proposal-item-[0-9]+/)){
      display_proposal(url);
    }
    //Actions for links
    $( '#nav-proposal-categories a' ).click(function(event){
      //Display the category tab
      $('#proposal-group').hide();
      $('#proposal-categories').show();
      $('#nav-proposal-categories a').addClass('active');
      $('#nav-proposal-group a').removeClass('active');
      $('.proposal-category-items').hide();
      $('.proposal-category .arrow-box').hide();
      $('.proposal-detail').hide();
      event.preventDefault();
    });
    $( '#nav-proposal-group a' ).click(function(event){
      //Display the Topics or Discussions tab
      $('#proposal-categories').hide();
      $('#proposal-group').show();
      $('#nav-proposal-group a').addClass('active');
      $('#nav-proposal-categories a').removeClass('active');
      $(".proposal-item p").dotdotdot();
      event.preventDefault();
    });
    $( '.proposal-item a' ).click(function(event){
      var item = this.href.split('#').pop();
      display_proposal(item);
    });
    $( '.proposal-category a' ).click(function(event){
      var item = this.href.split('#').pop();
      if($('#' + item).hasClass('proposal-category-items')){
        //Display Topics or Discussion by category
        $('nav').show();
        $('#content').show();
        $('#proposal-categories').show();
        $('.proposal-category-items').hide();
        $('.proposal-detail').hide();
        $('#' + item).show();
        $(".proposal-item p").dotdotdot();
        $('.proposal-category .arrow-box').hide();
        $(this).parent('.proposal-category').data('category');
        $('#proposal-category-'+$(this).parent('.proposal-category').data('category')).find('.arrow-box').show();
      }
      event.preventDefault();
    });
    $( '.send-button a' ).click(function(event){
      //display form to send proposal (or login form for non-logged users)
      loginButton = $(this).parents('.send-button');
      loginButton.hide();
      $('.success-proposal-sent').hide();
      loginCallback(logged_in);
      event.preventDefault();
    });
    $( '#display-contrast' ).click(function(event){
      $('#proposal-result').toggleClass('contrast');
    });
    $( '.show_body a' ).click(function(event){
      display_proposal_detail();
    });
    $( '.go-to-proposal-button a' ).click(function(event){
      display_proposal(this.href.split('#').pop());
    });
    $( '.proposal-selection' ).change(function(event){
      display_proposal('proposal-item-' + this.value);
    });

    var availableTags = [ ];
    $('#proposal-group li a').each(function(){
      availableTags.push({ label: $(this).text(), value: $(this).attr('href')});
    });
    $( "#search-input" ).autocomplete({
      source: availableTags,
      select: function( event, ui ) { display_proposal(ui.item['value' ].replace('#','')); },
      appendTo: '#search-input-container'
    });


    $('.save-article-form').submit(function (e) {
      e.preventDefault();
      var proposal_id = this.id.split('-').pop();
      var form = this;
      $.ajax({
        type: 'post',
        url: host + '/api/v1/articles/' + proposal_id + '/children',
        data: $('#'+this.id).serialize() + "&private_token="+private_token+"&fields=id&article[name]=article_"+guid()
      })
      .done(function( data ) {
        form.reset();
        $(form).hide();
        $(form).siblings('.success-sent').show();
      })
      .fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        console.log( "Request Failed: " + err );
        $(form).find('.message').text('Não foi possível enviar.');
       });
    });

  })
  .fail(function( jqxhr, textStatus, error ) {
    var err = textStatus + ", " + error;
    console.log( "Request Failed: " + err );
   });

function loadRandomProposal(topic_id, private_token) {
  $(".no-proposals").hide();
  $(".loading").show();
  $('.random-proposal').html('');
  var url = host + '/api/v1/articles/' + topic_id + '/children' + '?private_token=' + private_token + '&limit=1&order=random()&_='+new Date().getTime()+'&fields=id,name,abstract,created_by&content_type=ProposalsDiscussionPlugin::Proposal';
  $.getJSON(url).done(function( data ) {
    $(".loading").hide();

    if(data.articles.length == 0) {
      $(".no-proposals").show();
      return;
    }

    var article = data.articles[0];
    $('.random-proposal').html(supportProposalTemplate(article));
    $(".abstract").dotdotdot();
    $(document.body).off('click', '.vote-actions .skip');
    $(document.body).on('click', '.vote-actions .skip', function(e) {
      loadRandomProposal(topic_id, private_token);
      e.preventDefault();
    });
    $(document.body).off('click', '.vote-actions .like');
    $(document.body).on('click', '.vote-actions .like', function(e) {
      $.ajax({
        type: 'post',
        url: host + '/api/v1/articles/' + article.id + '/vote',
        data: {
          value: $(this).data('vote-value'),
          private_token: private_token
        }
      }).done(function( data ) {
        loadRandomProposal(topic_id, private_token);
      });
      e.preventDefault();
    });

    $('.results-container').hide();
    $('.experience-proposal-container').show();
    $('.talk-proposal-container').show();

    $(document.body).off('click', '.vote-result');
    $(document.body).on('click', '.vote-result', function(e) {
      $('.results-container').toggle();
      if($('.results-container').is(":visible")) {
        $('.results-container .loading').show();
        $('.results-container .results-content').hide();
        var url = host + '/api/v1/articles/' + topic_id + '/children' + '?private_token=' + private_token + '&limit=10&order=votes_score&fields=id,name,abstract,votes_for,votes_against&content_type=ProposalsDiscussionPlugin::Proposal';
        $.getJSON(url).done(function( data ) {
          $('.results-container').html(resultsTemplate(data));
          $('.results-container .loading').hide();
          $('.results-container .results-content').show();
        });
        $('.experience-proposal-container').hide();
        $('.talk-proposal-container').hide();
      } else {
        $('.experience-proposal-container').show();
        $('.talk-proposal-container').show();
      }
      e.preventDefault();
    });
  });
}

jQuery(document).ready(function($) {
  if($.cookie('_dialoga_session')) {
    var url = host + '/api/v1/users/me?private_token=' + $.cookie('_dialoga_session');
    $.getJSON(url).done(function( data ) {
      logged_in = true;
      private_token = $.cookie('_dialoga_session');
    });
  }
});

function loginCallback(loggedIn, token) {
  logged_in = loggedIn;
  $('.login .message').text('');

  if(logged_in) {
    if(token) private_token = token;
    loginButton.siblings('.save-article-form').show();
    loginButton.siblings('.save-article-form .message').show();
    loginButton.siblings('.login-container').hide();
    $.cookie('_dialoga_session', private_token);
  } else {
    loginButton.siblings('.save-article-form').hide();
    loginButton.siblings('.login-container').show();
  }
}

function oauthPluginHandleLoginResult(loggedIn, token) {
  loginCallback(loggedIn, token);
}

jQuery(document).ready(function($) {
  $(document).on('click', '.login-action', function(e) {
    $.ajax({
      type: 'post',
      url: host + '/api/v1/login',
      data: $(this).parents('.login').serialize(),
      xhrFields: {
        //withCredentials: true
      }
    }).done(function(data) {
      loginCallback(true, data.private_token);
    }).fail(function(data) {
      $('.login .message').text('Não foi possível logar');
    });
    e.preventDefault();
  });
});

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
    s4() + '-' + s4() + s4() + s4();
}

function display_proposal(proposal_id){
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
  $('.results-container').show();
  $('.experience-proposal-container').show();
  $('.talk-proposal-container').show();

  var topic_id = proposal_id.split('-').pop();
  loadRandomProposal(topic_id, private_token);
}

function display_proposal_detail(){
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

  $('.body').show();
  event.preventDefault();
  
}
