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
        jquery_xdomainrequest: 'jquery.xdomainrequest.min',
        jquery_ui: 'jquery-ui-1.11.4.custom/jquery-ui.min',
        jquery_cookie: 'jquery.cookie',
        jquery_timeago: 'jquery.timeago',
        jquery_timeago_pt: 'jquery.timeago.pt-br',
        jquery_simplePagination: 'jquery.simplePagination',
        jquery_simplePagination: 'footable',
        handlebars: 'handlebars-v3.0.1',
        handlebars_helpers: 'handlebars-helpers',
        jquery_maxlength: 'jquery.maxlength.min',
        slick: 'slick.min',
        fastclick: 'fastclick.min',
        layout: 'layout',
        main: 'main',
        proposal_app: 'proposal-app'
    },
    shim: {
      'handlebars':{
        deps: ['jquery'],
        exports: 'Handlebars'
      },
      'jquery_xdomainrequest': {
        deps: ['jquery']
      },
      'jquery_timeago': {
        deps: ['jquery']
      },
      'jquery_timeago_pt': {
        deps: ['jquery_timeago']
      },
      'jquery_simplePagination': {
        deps: ['jquery']
      },
      'footable': {
        deps: ['jquery']
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
      'fastclick': {
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

requirejs(['jquery', 'proposal_app', 'jquery_ui', 'jquery_xdomainrequest', 'jquery_timeago_pt', 'jquery_simplePagination', 'footable', 'handlebars_helpers']);
requirejs(['slick', 'fastclick', 'jquery_maxlength', 'layout','main']);
