Handlebars.registerHelper('link', function(text, url) {
  text = Handlebars.Utils.escapeExpression(text);
  url  = Handlebars.Utils.escapeExpression(url);

  // Exemplo: <a href="#/programas/{{id}}" class="proposal-link" data-target="">{{name}}</a>
  var result = '<a href="#/programas/' + url + '" data-target="proposal-item-' + url + '" class="proposal-link">' + text + '</a>';

  return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('list_proposal', function(proposals, options) {

  var ret = "";
  for(var i=0, j=proposals.length; i<j; i++) {
    var proposal = proposals[i];
    
    element = '<li class="proposal-item">' + 
      '<a href="#/programas/'+proposal.id+'" data-target="proposal-item-'+proposal.id+'" class="proposal-link">' +
        '<div class="item">' +
          '' + proposal.title;
    category = "<ul class='category'>";
    
    
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

Handlebars.registerHelper('score', function(article) {
  return article.votes_for - article.votes_against;
});

Handlebars.registerHelper('select_proposal', function(proposals, category_slug, selected_id) {
  var ret = '<label for="proposal-selection" class="sr-only">Selecione o programa</label>'
  ret =  ret + '<select id="proposal-selection" name="proposal-selection" title="Selecione o programa" class="proposal-selection">';

  for(var i=0; i<proposals.length; i++) {
    if(!proposal_has_category(proposals[i], category_slug)) continue;
    var selected = proposals[i].id===selected_id ? "selected" : "";
    ret += '<option value="'+proposals[i].id+'" '+selected+'>'+proposals[i].title+'</option>';
  }
  ret += '</select>';
  return ret;
});

Handlebars.registerHelper('trimString', function(passedString, endstring) {
  var theString = passedString.substring(0, endstring);
  return new Handlebars.SafeString(theString)
});

function proposal_has_category(proposal, category_slug) {
  for(var i=0; i<proposal.categories.length; i++) {
    if(proposal.categories[i].slug == category_slug)
      return true;
  }
  return false;
}
