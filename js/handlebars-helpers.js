define(['handlebars'], function(Handlebars){

  Handlebars.registerHelper('link', function(text, url) {
    text = Handlebars.Utils.escapeExpression(text);
    url  = Handlebars.Utils.escapeExpression(url);
  
    // Exemplo: <a href="#/programas/{{id}}" class="proposal-link" data-target="">{{name}}</a>
    var result = '<a href="#/programas/' + url + '" data-target="proposal-item-' + url + '" class="proposal-link">' + text + '</a>';
  
    return new Handlebars.SafeString(result);
  });
  
  Handlebars.registerHelper('list_proposal', function(proposals, options) {

    proposals = proposals.sort(function(p1, p2) {
      return p1.position - p2.position;
    });
    var ret = "";
    for(var i=0, j=proposals.length; i<j; i++) {
      var proposal = proposals[i];
      
      element = '<li class="proposal-item col-sm-6">' + 
        '<a href="#/programas/'+proposal.id+'" data-target="proposal-item-'+proposal.id+'" class="proposal-link box">' +
          '<div class="box-header item">' +
            '' + proposal.title;
      category = "<ul class='category box-category'>";
      
      
      for(var x=0, y=proposal.categories.length; x<y; x++) {
        if((options.hash['category'] != null) && (options.hash['category'] != proposal.categories[x].slug)){
          element = '';
          continue;
        }      
        category = category + '<li class="category-'+proposal.categories[x].slug+'">' + proposal.categories[x].name + '</li>';
      }
      if(element == ''){
        continue;
      }
      category =  category + '</ul>';
      // element = element + options.fn(proposal);
      element = element + (proposal.abstract ? proposal.abstract : '');
  
      element = element + category;
      ret = ret + element + '</div></a></li>';
    }
    return ret;
  });
  
  Handlebars.registerHelper('proposal_detail', function(proposals, options) {
    var ret = "";
    for(var i=0, j=proposals.length; i<j; i++) {
      ret = ret + "<div class='proposal-detail hide' id='proposal-item-" + proposals[i].id + "'>";
      ret = ret + "<div class='title'>" + proposals[i].title + "</div>";
      ret = ret + "<span>" + proposals[i].body + "</span>";
      ret = ret + '</div>';
    }
    return ret;
  });
  
  Handlebars.registerHelper('replace', function(string, to_replace, replacement) {
    return (string || '').replace(new RegExp(to_replace, 'g'), replacement);
  });

  Handlebars.registerHelper('select_proposal', function(proposals, category_slug, selected_id) {
    var ret = '<label for="proposal-selection" class="sr-only">Selecione o programa</label>'
    ret =  ret + '<select id="proposal-selection" name="proposal-selection" data-proposal="'+selected_id+'" title="Selecione o programa" class="proposal-selection">';
  
    for(var i=0; i<proposals.length; i++) {
      if(!proposal_has_category(proposals[i], category_slug)) continue;
      var selected = proposals[i].id===selected_id ? "selected" : "";
      ret += '<option value="'+proposals[i].id+'" '+selected+'>'+proposals[i].title+'</option>';
    }
    ret += '</select>';
    return ret;
  });

  Handlebars.registerHelper('trimString', function(passedString, endstring) {
    return passedString.substring(0, endstring);
  });

  Handlebars.registerHelper('stripTags', function(passedString) {
    return $("<div/>").html(passedString).text();
  });

  Handlebars.registerHelper('proposal_action', function(discussion, target) {
    if(discussion.setting && discussion.setting.moderate_proposals) {
      return '/api/v1/articles/'+target.id+'/children/suggest';
    } else {
      return '/api/v1/articles/'+target.id+'/children';
    }
  });

  Handlebars.registerHelper('round', function(num) {
    return +(Math.round(num + "e+2")  + "e-2");
  });

  function proposal_has_category(proposal, category_slug) {
    for(var i=0; i<proposal.categories.length; i++) {
      if(proposal.categories[i].slug == category_slug)
        return true;
    }
    return false;
  }

});
