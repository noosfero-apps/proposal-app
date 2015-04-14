// The template code
var templateSource = document.getElementById('proposal-template').innerHTML;
 
// compile the template
var template = Handlebars.compile(templateSource);
 
// The div/container that we are going to display the results in
var resultsPlaceholder = document.getElementById('proposal-result');

var topics;

var host = 'http://www.participa.br';
//var host = 'http://localhost:3000';
var private_token = '9350c1488fcae884ad955091a3d2d960';
//var private_token = 'bd8996155f5ea4354e42fee50b4b6891';
var proposal_discussion = '92856'; 
//var proposal_discussion = '401'; 

//var noosferoAPI = 'http://localhost:3000/api/v1/articles?private_token=89419a2d331a17e815c3ecc53b303aac&content_type=ProposalsDiscussionPlugin::Topic&parent_id=377&callback=?';

var noosferoAPI = host + '/api/v1/articles/' + proposal_discussion + '?private_token=' + private_token + '&callback=?';
//var noosferoAPI = host + '/api/v1/articles?private_token=' + private_token + '&parent_id=401&callback=?';

$.getJSON(noosferoAPI)
  .done(function( data ) {
    data['host'] = host;
    resultsPlaceholder.innerHTML = template(data);
    $( 'a' ).click(function(event){ 
      var item = this.href.split('#').pop();
      if(item == 'proposal-categories'){
        $('#proposal-group').hide();
        $('#nav-proposal-categories a').addClass('active');
        $('#nav-proposal-group a').removeClass('active');
      }else if(item == 'proposal-group'){
        $('#proposal-categories').hide();
        $('#nav-proposal-group a').addClass('active');
        $('#nav-proposal-categories a').removeClass('active');
      }else{
        $('#proposal-categories').hide();
        $('#proposal-group').hide();
      }
      $('.proposal-detail').hide();
      $('#' + item).show();
      event.preventDefault();
    });
  })
  .fail(function( jqxhr, textStatus, error ) {
    var err = textStatus + ", " + error;
    console.log( "Request Failed: " + err );
   });

