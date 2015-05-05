var base,test = '';

if(window.Url){
  var base = Url.initBase().removeUrlParameters()+'/js/';
}else{
  base = '../js'
  test = window.location.href.replace(/\/\w*\.html/g,'');
}

requirejs.config({
    baseUrl: base,
    waitSeconds: 0,
    paths: {
        jquery: 'jquery-2.1.3.min',
        jquery_xdomainrequest: 'jquery.xdomainrequest.min',
        jquery_ui: 'jquery-ui-1.11.4.custom/jquery-ui.min',
        jquery_cookie: 'jquery.cookie',
        handlebars: 'handlebars-v3.0.1',
        handlebars_helpers: 'handlebars-helpers',
        jquery_maxlength: 'jquery.maxlength.min',
        jquery_slick: 'slick.min',
        layout: 'layout',
        main: 'main',
        proposal_app: 'proposal-app',
        test:test
    },
    shim: {
      'handlebars':{
        deps: ['jquery'],
        exports: 'Handlebars'
      },
      'handlebars_helpers':{
        deps: ['handlebars'],
        exports: 'Handlebars'
      },
      'jquery_xdomainrequest': {
        deps: ['jquery']
      },
      'jquery_ui': {
        deps: ['jquery']
      },
      'layout': {
        deps: ['jquery']
      },
      'jquery_maxlength':{
        deps: ['jquery']
      },
      'jquery_cookie':{
        deps: ['jquery']
      },
      'jquery_slick': {
        deps: ['jquery']
      },
      'proposal_app' :{
        deps: ['jquery'],
        exports: 'ProposalApp'
      }
    }
});
