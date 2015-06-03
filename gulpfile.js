'use strict';

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
    .on('error', function (err) {
      console.error('Error', err.message);
    })
    .pipe(gulp.dest('.'))
    .pipe(connect.reload());
});
 
gulp.task('watch', function () {
  gulp.watch('./sass/**/*.sass', ['sass']);
});

gulp.task('connect', function() {
  connect.server({
    root: [__dirname],
    livereload: true
  });
});

gulp.task('default', ['sass','connect','watch']);