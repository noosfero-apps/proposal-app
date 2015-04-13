// The template code
var templateSource = document.getElementById('proposal-template').innerHTML;
 
// compile the template
var template = Handlebars.compile(templateSource);
 
// The div/container that we are going to display the results in
var resultsPlaceholder = document.getElementById('proposal-result');


$.ajax({
  dataType: "json",
  url: 'http://localhost:3000/api/v1/articles?private_token=89419a2d331a17e815c3ecc53b303aac&content_type=ProposalsDiscussionPlugin::Topic&parent_id=377',
  data: data,
  success: success
}); 

var data = {
  "proposal":
  {
    "title": "Handlebars",
    "description": "Demo"
  }
};

resultsPlaceholder.innerHTML = template(data);
