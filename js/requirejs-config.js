if (window.Url) {
  var base = Url.initBase() + '/js/';
} else {
  base = '../js'
}

requirejs.config({
  baseUrl: base,
  waitSeconds: 0,
  paths: {
    piwik: 'piwik',
    jquery: 'jquery',
    jquery_xdomainrequest: 'jquery.xdomainrequest.min',
    jquery_ui: 'jquery-ui-1.11.4.custom/jquery-ui.min',
    jquery_cookie: 'jquery_cookie',
    jquery_timeago: 'jquery.timeago',
    jquery_timeago_pt: 'jquery.timeago.pt-br',
    jquery_simplePagination: 'jquery.simplePagination',
    jquery_equalHeights: 'jquery_equalHeights',
    jquery_footable: 'footable',
    handlebars: 'handlebars',
    handlebars_helpers: 'handlebars_helpers',
    jquery_maxlength: 'jquery_maxlength',
    slick: 'slick.min',
    fastclick: 'fastclick.min',
    layout: 'layout',
    main: 'main',
    "proposal-app": 'proposal-app'
  },
  shim: {
    'handlebars': {
      deps: ['jquery'],
      exports: 'Handlebars'
    },
    'jquery_xdomainrequest': {
      deps: ['jquery']
    },
    'jquery_cookie': {
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
    'jquery_equalHeights': {
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
    'handlebars_helpers': {
      deps: ['handlebars']
    },
    'proposal-app': {
      deps: ['jquery'],
      exports: 'ProposalApp'
    }
  }
});

requirejs(['piwik']);
requirejs(['jquery', 'proposal-app', 'jquery-ui', 'jquery_xdomainrequest',
  'jquery_timeago_pt', 'jquery_simplePagination', 'jquery_equalHeights',
  'footable', 'handlebars_helpers'
]);
requirejs(['slick', 'fastclick', 'jquery_maxlength', 'layout', 'main']);
