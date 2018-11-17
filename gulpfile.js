/**
 * Icon Captcha Plugin: v2.5.0
 * Copyright © 2017, Fabian Wennink (https://www.fabianwennink.nl)
 *
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

const gulp = require("gulp");
const minify = require("gulp-babel-minify");
const babel = require("gulp-babel");
const sass = require('gulp-sass');
const combineMq = require('gulp-combine-mq');
const rename = require("gulp-rename");
const sourcemaps = require('gulp-sourcemaps');

/*************************************************/

gulp.task('js', function(){
    return gulp.src('src/js/*.js')
        .on('error', function (err) {
            console.log(err.toString());
            this.emit('end');
        })
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['env']
        }))
        .pipe(minify({
            mangle: {
                keepClassName: true
            }
        }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('dist/js/'));
});

gulp.task('scss', function() {
    return gulp.src('src/scss/*.scss')
        .on('error', function (err) {
            console.log(err.toString());
            this.emit('end');
        })
        .pipe(sass({outputStyle: 'compressed'}))
		.pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css/'));
});

gulp.task('query:css', function() {
    return gulp.src('src/scss/*.scss')
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(combineMq({
            beautify: false
        }))
		.pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('dist/css/'));
});

/*************************************************/

gulp.task('scss:watch', function () {
    gulp.watch('src/scss/**/*.scss', ['scss']);
});

gulp.task('js:watch', function () {
    gulp.watch('src/js/*.js', ['js']);
});

gulp.task('watch', function() {
    gulp.start('js:watch');
    gulp.start('scss:watch');
});

gulp.task('build', function() {
    gulp.start('js');
    gulp.start('scss');
    gulp.start('query:css');
});

gulp.task('default', function() {
	gulp.start('build');
});