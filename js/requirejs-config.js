var base = window.location.href;
var host = window.location.host;
var regex = new RegExp(".*" + host + '/', "g");

if(host){
  base = base.replace(regex,'');
}else{
  base = base.replace('index.html','');
}
base = removeUrlParameters(base);

requirejs.config({
    baseUrl: ( base + '/js/'),
    paths: {
        jquery: 'jquery-2.1.3.min',
        jquery_ui: 'jquery-ui-1.11.4.custom/jquery-ui.min', 
        jquery_cookie: 'jquery.cookie', 
        handlebars: 'handlebars-v3.0.1',
        handlebars_helpers: 'handlebars-helpers',
        jquery_maxlength: 'jquery.maxlength.min',
        layout: 'layout',
        main: 'main'    
    },
    shim: {
      'handlebars':{
        deps: ['jquery'],
        exports: 'Handlebars'
      },
      'jquery_ui': {
        deps: ['jquery']
      },
      'layout': {
        deps: ['jquery']
      },
      'jquery_maxlength': {
        deps: ['jquery']
      },
      'handlebars_helpers':{
        deps: ['handlebars']
      }
    }
});

requirejs(['jquery', 'jquery_ui', 'jquery_cookie', 'handlebars', 'handlebars_helpers']);
requirejs(['jquery_maxlength', 'layout', 'main']);
