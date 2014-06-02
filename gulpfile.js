var gulp = require('gulp');
var jshint = require('gulp-jshint');
var mocha = require('gulp-mocha');

gulp.task('lint', function() {
    return gulp.src(['src/*.js', 'test/*.js'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('test', ['lint'], function() {
    return gulp.src(['test/test-*.js'])
        .pipe(mocha({
            reporter: 'spec'
        }));
});

gulp.task('default', ['test']);
