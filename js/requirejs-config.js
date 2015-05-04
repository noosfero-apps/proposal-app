if(window.Url){
  var base = Url.initBase() + '/js/';
}else{
  base = '../js'
}

requirejs.config({
    baseUrl: base,
    waitSeconds: 0,
    paths: {
        jquery: 'jquery-2.1.3.min',
        jquery_ui: 'jquery-ui-1.11.4.custom/jquery-ui.min',
        jquery_cookie: 'jquery.cookie',
        handlebars: 'handlebars-v3.0.1',
        handlebars_helpers: 'handlebars-helpers',
        jquery_maxlength: 'jquery.maxlength.min',
        slick: 'slick.min',
        layout: 'layout',
        main: 'main',
        proposal_app: 'proposal-app'
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
      'slick': {
        deps: ['jquery']
      },
      'handlebars_helpers':{
        deps: ['handlebars']
      },
      'proposal_app' :{
        deps: ['jquery'],
        exports: 'ProposalApp'
      }
    }
});

requirejs(['jquery', 'proposal_app', 'jquery_ui','handlebars_helpers']);
requirejs(['slick', 'jquery_maxlength', 'layout','main']);
