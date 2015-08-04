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
    port: 8080,
    root: [__dirname],
    livereload: true
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


gulp.task('compileJS', function() {
  var mainInit =
    "require.config({  paths: {    \"main\": \"main-bundled\"  }});require([\"main\"]);";
  return gulp.src('js/main.js')
    .pipe(sourcemaps.init())
    .pipe(requirejsOptimize({
      baseUrl: 'js',
      name: 'main',
      generateSourceMaps: true,
      optimize: "uglify2",
      preserveLicenseComments: false,
      paths: {
        "requireLib": "require"
      },
      include: "requireLib",
      out: "main.min.js"
    }).on('error', function(error) {
      console.log(error);
    }))
    .pipe(add('main-init.js', mainInit))
    .pipe(sourcemaps.write('./'))
    /*   .pipe(concat('main-bundled.js'))*/
    .pipe(gulp.dest('./'));
});


gulp.task('htmlReplace', function() {
  var assets = useRef.assets();
  var jsFilter = filter("./main-bundled.js");
  var cssFilter = filter("**/*.css");
  return gulp.src('./index.html')
    .pipe(assets)
    .pipe(sourcemaps.init())
    .pipe(rev())
    .pipe(gulpif('*.js', uglify({
      compress: false,
      mangle: false,
      output: {
        beautify: true
      }
    })))
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
    .pipe(gulp.dest('dist'));
});

var del = require('del');

gulp.task('clean', function(cb) {
  del([
    'dist/*.*'
  ], cb);
});

gulp.task('build', ['clean', 'sass', 'compileJS', 'htmlReplace']);
