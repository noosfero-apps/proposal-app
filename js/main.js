// The template code
var templateSource = document.getElementById('proposal-template').innerHTML;

// compile the template
var template = Handlebars.compile(templateSource);

var supportProposalTemplate = Handlebars.compile(document.getElementById('support-proposal-template').innerHTML);
var loginTemplate = Handlebars.compile(document.getElementById('login').innerHTML);

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
      $(".proposal-item").dotdotdot();
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
        $(".proposal-item").dotdotdot();
        $('.proposal-category .arrow-box').hide();
        $(this).parent('.proposal-category').data('category')
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
    $( '.show_body a' ).click(function(event){
      $('.body').toggle();
      event.preventDefault();
    });
    $( '.proposal-selection' ).change(function(event){
      display_proposal('proposal-item-' + this.value);
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
  });
}

function loginCallback(loggedIn, token) {
  logged_in = loggedIn;
  $('.login .message').text('');

  if(logged_in) {
    if(token) private_token = token;
    loginButton.siblings('.save-article-form').show();
    loginButton.siblings('.save-article-form .message').show();
    loginButton.siblings('.login-container').hide();
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



function display_proposal(item){
  //Display Proposal
  $('#proposal-categories').hide();
  $('#proposal-group').hide();
  $('nav').hide();
  $('#content').hide();
  $('.proposal-detail').hide();
  $('#' + item).show();

  $('.send-proposal-button').show();
  $('.make-proposal-form').hide();
  $('.login-container').hide();

  var topic_id = item.split('-').pop();
  loadRandomProposal(topic_id, private_token);
}
