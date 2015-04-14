// The template code
var templateSource = document.getElementById('proposal-template').innerHTML;
 
// compile the template
var template = Handlebars.compile(templateSource);
 
// The div/container that we are going to display the results in
var resultsPlaceholder = document.getElementById('proposal-result');

var topics;

//var host = 'http://www.participa.br';
var host = 'http://localhost:3000';
//var private_token = '9350c1488fcae884ad955091a3d2d960';  //participa
//var private_token = 'bd8996155f5ea4354e42fee50b4b6891'; //casa
var private_token = '89419a2d331a17e815c3ecc53b303aac'; //local serpro
//var proposal_discussion = '92856'; //participa
var proposal_discussion = '377'; //local serpro
//var proposal_discussion = '401'; //casa

//var noosferoAPI = 'http://localhost:3000/api/v1/articles?private_token=89419a2d331a17e815c3ecc53b303aac&content_type=ProposalsDiscussionPlugin::Topic&parent_id=377&callback=?';

var noosferoAPI = host + '/api/v1/articles/' + proposal_discussion + '?private_token=' + private_token + '&callback=?';
//var noosferoAPI = host + '/api/v1/articles?private_token=' + private_token + '&parent_id=401&callback=?';

$.getJSON(noosferoAPI)
  .done(function( data ) {
    data['host'] = host;
    data['private_token'] = private_token;
    resultsPlaceholder.innerHTML = template(data);
    //Actions for links
    $( 'a' ).click(function(event){ 
      var item = this.href.split('#').pop();
      if(item == 'proposal-categories'){
        //Display the category tab
        $('#proposal-group').hide();
        $('#proposal-categories').show();
        $('#nav-proposal-categories a').addClass('active');
        $('#nav-proposal-group a').removeClass('active');
        $('.proposal-category-item').hide();
        $('.proposal-detail').hide();
      }else if(item == 'proposal-group'){
        //Display the Topics or Discussions tab
        $('#proposal-categories').hide();
        $('#proposal-group').show();
        $('#nav-proposal-group a').addClass('active');
        $('#nav-proposal-categories a').removeClass('active');
      }else{
        if($('#' + item).hasClass('proposal-category-item')){
          //Display Topics or Discussion by category
          $('.proposal-category-item').hide();
          $('#' + item).show();
          
        }else{
          //Display Proposal
          $('#proposal-categories').hide();
          $('#proposal-group').hide();
          $('.proposal-detail').hide();
          $('#' + item).show();
        }
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

