define(['piwik'], function(){

  var _paq = _paq || [];
  _paq.push(["trackPageView"]);
  _paq.push(["enableLinkTracking"]);

  var isProduction = /^http:\/\/dialoga\.gov\.br\//.test(window.location.href);
  var siteId = isProduction ? "65" : "1";

  (function() {
    var u="http://estatisticas.dialoga.gov.br/";
    _paq.push(["setTrackerUrl", u+"piwik.php"]);
    _paq.push(["setSiteId", siteId]);
    var d=document, g=d.createElement("script"), s=d.getElementsByTagName("script")[0]; g.type="text/javascript";
    g.defer=true; g.async=true; g.src=u+"piwik.js"; s.parentNode.insertBefore(g,s);
  })();

  window._paq = _paq;
  return _paq;

});
