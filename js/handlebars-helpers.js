Handlebars.registerHelper('link', function(text, url) {
  text = Handlebars.Utils.escapeExpression(text);
  url  = Handlebars.Utils.escapeExpression(url);

  var result = '<a id="#' + url + '" href="#proposal-item-' + url + '" class="proposal-link">' + text + '</a>';

  return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('list_proposal', function(proposals, options) {

  var ret = "";
  for(var i=0, j=proposals.length; i<j; i++) {
    element = "<li class='proposal-item'><div class='item'>";
    category = "<ul class='category'>";
     
    for(var x=0, y=proposals[i].categories.length; x<y; x++) {
      if((options.hash['category'] != null) && (options.hash['category'] != proposals[i].categories[x].slug)){
        element = '';
        continue;
      }      
      category = category + '<li class="category-'+proposals[i].categories[x].slug+'">' + proposals[i].categories[x].name + '</li>';
    }
    if(element == ''){
      continue;
    }
    category =  category + '</ul>';
    element = element + options.fn(proposals[i]);
    element = element + (proposals[i].abstract ? proposals[i].abstract : '');

    element = element + category;
    ret = ret + element + '</div></li>';
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
