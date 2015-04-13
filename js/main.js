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
    resultsPlaceholder.innerHTML = template(data);
    $( 'a' ).click(function(){ 
    var item = this.href.split('#').pop();
      if(item == 'proposal-categories'){
        $('#proposal-group').hide();
        var active_tab = $('nav ul li a.active').removeClass('active');
        var inactive_tab = $('nav ul li a.inactive').removeClass('inactive');
        inactive_tab.addClass('active');
        active_tab.addClass('inactive');
      }else if(item == 'proposal-group'){
        $('#proposal-categories').hide();
        var active_tab = $('nav ul li a.active').removeClass('active');
        var inactive_tab = $('nav ul li a.inactive').removeClass('inactive');
        inactive_tab.addClass('active');
        active_tab.addClass('inactive');
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

