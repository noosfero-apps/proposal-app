// The template code
var templateSource = document.getElementById('proposal-template').innerHTML;

// compile the template
var template = Handlebars.compile(templateSource);

var supportProposalTemplate = Handlebars.compile(document.getElementById('support-proposal-template').innerHTML);

// The div/container that we are going to display the results in
var resultsPlaceholder = document.getElementById('proposal-result');

var topics;

var participa = true;
if(participa){
  var host = 'http://www.participa.br';
  var private_token = '9350c1488fcae884ad955091a3d2d960';  //participa
  var proposal_discussion = '92856'; //participa
}else{
  var host = 'http://noosfero.com:3000';
  //var private_token = 'bd8996155f5ea4354e42fee50b4b6891'; //casa
  var private_token = '04c9b36cf0afba52915fe86f182e741c'; //local serpro
  var proposal_discussion = '632'; //local serpro
  //var proposal_discussion = '401'; //casa
}

var noosferoAPI = host + '/api/v1/articles/' + proposal_discussion + '?private_token=' + private_token;

$.getJSON(noosferoAPI)
  .done(function( data ) {
    data['host'] = host;
    data['private_token'] = private_token;
    resultsPlaceholder.innerHTML = template(data);
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
      //Display Proposal
      $('#proposal-categories').hide();
      $('#proposal-group').hide();
      $('nav').hide();
      $('#content').hide();
      $('.proposal-detail').hide();
      $('#' + item).show();

      var topic_id = this.id.replace('\#','');
      loadRandomProposal(topic_id, private_token);
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

    $('.make-proposal-form').submit(function (e) {
      e.preventDefault();
      var proposal_id = this.id.split('-').pop();
      $.ajax({
        type: 'post',
        url: host + '/api/v1/articles/' + proposal_id + '/children',
        data: $('#'+this.id).serialize()
      })
      .done(function( data ) {
      })
      .fail(function( jqxhr, textStatus, error ) {
        var err = textStatus + ", " + error;
        console.log( "Request Failed: " + err );
       });
    });

  })
  .fail(function( jqxhr, textStatus, error ) {
    var err = textStatus + ", " + error;
    console.log( "Request Failed: " + err );
   });

function loadRandomProposal(topic_id, private_token) {
  var url = host + '/api/v1/articles/' + topic_id + '/children' + '?private_token=' + private_token + '&limit=1&order=random()&_='+new Date().getTime()+'&fields=id,name,created_by';
  $.getJSON(url).done(function( data ) {
    if(data.articles.length == 0) return;
    var article = data.articles[0];
    $('.support-proposal-container').html(supportProposalTemplate(article));
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

function oauthPluginHandleLoginResult(loggedIn, token) {
  private_token = token;
}
