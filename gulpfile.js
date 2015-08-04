'use strict';
/* global require, __dirname, console  */

var gulp = require('gulp');
// var sass = require('gulp-sass');
var sass = require('gulp-ruby-sass');
var connect = require('gulp-connect');

// gulp.task('sass', function () {
//   gulp.src('./sass/**/*.scss')
//     .pipe(sass().on('error', sass.logError))
//     .pipe(gulp.dest('.'))
//     .pipe(connect.reload());
// });

gulp.task('sass', function() {
  return sass('./sass/style.sass')
    .on('error', function(err) {
      console.error('Error', err.message);
    })
    .pipe(gulp.dest('.'))
    .pipe(connect.reload());
});

gulp.task('watch', function() {
  gulp.watch('./sass/**/*.sass', ['sass']);
});

gulp.task('connect', function() {
  connect.server({
    port: 3000,
    root: [__dirname],
    livereload: true
  });
});

gulp.task('connect_dist', ['clean',  'copyResources', 'sass', 'compileJS',  'htmlReplace'], function() {
  connect.server({
    port: 3000,
    root: ['./dist'],
    livereload: false
  });
});


gulp.task('default', ['sass', 'connect', 'watch']);

//var htmlusemin = require('gulp-usemin-html');
var useRef = require('gulp-useref');
var minifyCss = require('gulp-minify-css');
var rev = require('gulp-rev');
var revReplace = require('gulp-rev-replace');
var uglify = require('gulp-uglify');
var gulpif = require('gulp-if');
var filter = require('gulp-filter');
var sourcemaps = require('gulp-sourcemaps');
var requirejsOptimize = require('gulp-requirejs-optimize');
var concat = require('gulp-concat');
var copy = require('gulp-copy');
var add = require("gulp-add");

gulp.task('copyResources', function(){
  gulp.src(["./*.html", "style.css", "./fonts/**/*.*", "./favicon.ico", "./images/**/*.*"])
    .pipe(copy('dist/'));
});


gulp.task('compileJS', function() {
  var mainInit =
    "require.config({  paths: {    \"main\": \"main-bundled\"  }});require([\"main\"]);";
  return gulp.src('js/main.js')
    //.pipe(sourcemaps.init())
    .pipe(requirejsOptimize({
      baseUrl: 'js',
      name: 'main',
      //generateSourceMaps: true,
      optimize: "none",
      preserveLicenseComments: false,
      findNestedDependencies: true,
      mainConfigFile: 'js/main.js',
      paths: {
        requireLib: "require",
        jquery: 'jquery-2.1.3.min',
        jquery_xdomainrequest: 'jquery.xdomainrequest.min',
        jquery_ui: 'jquery-ui-1.11.4.custom/jquery-ui.min',
        jquery_cookie: 'jquery.cookie',
        jquery_timeago: 'jquery.timeago',
        jquery_timeago_pt: 'jquery.timeago.pt-br',
        jquery_simplePagination: 'jquery.simplePagination',
        jquery_equalHeights: 'jquery.equalHeights',
        jquery_footable: 'footable',
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
      'handlebars_helpers':{
        deps: ['handlebars']
      },
      'proposal_app' :{
        deps: ['jquery'],
        exports: 'ProposalApp'
      }
    },
      include: ["requireLib"],
      out: "dist/main.min.js"
    }).on('error', function(error) {
      console.log(error);
    }))
    .pipe(add('dist/main-init.js', mainInit))
    .pipe(concat('dist/main-bundled.js'))
    //.pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./'));
});


gulp.task('htmlReplace', ['clean', 'sass', 'copyResources', 'compileJS'],function() {
  var assets;
  var jsFilter = filter("./dist/main-bundled.js");
  var cssFilter = filter("dist/*.css");
  return gulp.src('dist/index.html')
    .pipe(assets = useRef.assets())
    .pipe(sourcemaps.init())
    .pipe(rev())
    .pipe(gulpif('*.js', uglify()))
    .pipe(assets.restore())
    .pipe(useRef())
    .pipe(revReplace())
    .pipe(gulpif('*.css', minifyCss({
      sourceMap: true
    })))

  .pipe(assets.restore())
    .pipe(useRef())
    .pipe(revReplace())
    .pipe(sourcemaps.write('./'))
    .pipe(assets.restore())
    .pipe(gulp.dest('dist/'));
});

var del = require('del');

gulp.task('clean', function(cb) {
  del([
    'dist/*.*'
  ], cb);
});

gulp.task('build', ['clean',  'copyResources', 'sass', 'compileJS',  'htmlReplace']);
