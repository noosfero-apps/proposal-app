Handlebars.registerHelper('link', function(text, url) {
  text = Handlebars.Utils.escapeExpression(text);
  url  = Handlebars.Utils.escapeExpression(url);

  var result = '<a id="#' + url + '" href="#proposal-item-' + url + '">' + text + '</a>';

  return new Handlebars.SafeString(result);
});
