Handlebars.registerHelper('link', function(text, url) {
  text = Handlebars.Utils.escapeExpression(text);
  url  = Handlebars.Utils.escapeExpression(url);

  var result = '<a id="#' + url + '" href="#proposal-item-' + url + '">' + text + '</a>';

  return new Handlebars.SafeString(result);
});

Handlebars.registerHelper('list_proposal', function(proposals, options) {

  var ret = "";

  for(var i=0, j=proposals.length; i<j; i++) {
    ret = ret + "<li class='proposal-item'>";
    ret = ret + "<ul class='category'>";
     
    for(var x=0, y=proposals[i].categories.length; x<y; x++) {
      ret = ret + '<li>' + proposals[i].categories[x].name + '</li>';
    }
    ret =  ret + '</ul>';
    ret = ret + options.fn(proposals[i]);
    ret = ret + '<p>' + proposals[i].body + '</p>';
    ret = ret + '</li>';
  }

  return ret;

});
