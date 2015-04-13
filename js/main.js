// The template code
var templateSource = document.getElementById('proposal-template').innerHTML;
 
// compile the template
var template = Handlebars.compile(templateSource);
 
// The div/container that we are going to display the results in
var resultsPlaceholder = document.getElementById('proposal-result');

var topics;

var noosferoAPI = 'http://localhost:3000/api/v1/articles?private_token=89419a2d331a17e815c3ecc53b303aac&content_type=ProposalsDiscussionPlugin::Topic&parent_id=377&callback=?';

$.getJSON(noosferoAPI)
  .done(function( data ) {
    //console.log(data);
    resultsPlaceholder.innerHTML = template(data);
    $( 'a' ).click(function(){ 
//      resultsPlaceholder.innerHTML = $('#proposal-item-' + this.id.replace('#','')).html();
      resultsPlaceholder.innerHTML = $('#proposal-item-' + this.id.replace('#','')).html();
    });
    //console.log(resultsPlaceholder);
  })
  .fail(function( jqxhr, textStatus, error ) {
    var err = textStatus + ", " + error;
    console.log( "Request Failed: " + err );
   });

