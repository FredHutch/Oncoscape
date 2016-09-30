'use strict';

var path = require('path');
var gulp = require('gulp');
var conf = require('./conf');
var jslint = require('gulp-jslint');
var filter = require('gulp-filter');

var browserSync = require('browser-sync');

var $ = require('gulp-load-plugins')();


gulp.task('scripts-reload', function() {
  return buildScripts()
    .pipe(browserSync.stream());
});

gulp.task('scripts', function() {
  return buildScripts();
});

function buildScripts() {
  return gulp.src(path.join(conf.paths.src, '/app/**/*.js'))
  	.pipe(filter(function(v){return v.history[0].indexOf("worker")==-1; }))
    .pipe($.eslint())
    .pipe($.eslint.format())
    .pipe($.size())
};
