'use strict';

var gulp = require('gulp');

gulp.task('test', function() {
  var gulpMocha = require('gulp-mocha');
  var gulpUtil = require('gulp-util');
  var options = {
    reporter: 'spec',
    timeout: undefined
  };
  return gulp.src('./test/*.test.js')
    .pipe(gulpMocha(options))
    .on('error', gulpUtil.log);
});