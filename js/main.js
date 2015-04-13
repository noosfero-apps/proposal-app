// The template code
var templateSource = document.getElementById('proposal-template').innerHTML;
 
// compile the template
var template = Handlebars.compile(templateSource);
 
// The div/container that we are going to display the results in
var resultsPlaceholder = document.getElementById('proposal-result');

var topics;

//var noosferoAPI = 'http://localhost:3000/api/v1/articles?private_token=89419a2d331a17e815c3ecc53b303aac&content_type=ProposalsDiscussionPlugin::Topic&parent_id=377&callback=?';

var noosferoAPI = 'http://www.participa.br/api/v1/articles?private_token=9350c1488fcae884ad955091a3d2d960&content_type=ProposalsDiscussionPlugin::Topic&parent_id=92856&callback=?';

$.getJSON(noosferoAPI)
  .done(function( data ) {
    resultsPlaceholder.innerHTML = template(data);
    $( 'a' ).click(function(){ 
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
    });
  })
  .fail(function( jqxhr, textStatus, error ) {
    var err = textStatus + ", " + error;
    console.log( "Request Failed: " + err );
   });

