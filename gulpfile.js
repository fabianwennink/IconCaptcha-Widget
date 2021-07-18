/**
 * Icon Captcha Plugin: v3.0.0
 * Copyright © 2021, Fabian Wennink (https://www.fabianwennink.nl)
 *
 * Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
 */

const gulp = require('gulp');
const sass = require('gulp-sass');
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const babelJS = require("gulp-babel");
const minify = require("gulp-babel-minify");
const autoprefixer = require('autoprefixer');

const CSS_INPUT = 'src/scss/*.scss';
const CSS_OUTPUT = 'dist/css';
const JS_INPUT = 'src/js/*.js';
const JS_OUTPUT = 'dist/js';

/*************************************************/

const css = () => {
    return gulp.src(CSS_INPUT)
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(postcss([autoprefixer()]))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(CSS_OUTPUT));
}

const js = () => {
    return gulp.src(JS_INPUT)
        .pipe(babelJS({
            presets: ['@babel/preset-env']
        }))
        .pipe(minify({
            mangle: true
        }))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(JS_OUTPUT));
}

const watch = () => {
    gulp.watch(CSS_INPUT, gulp.parallel(css));
    gulp.watch(JS_INPUT, gulp.parallel(js));
}



/*************************************************/

exports.js = js;
exports.css = css;
exports.watch = gulp.series(css, js, watch)
exports.build = gulp.series(css, js);
exports.default = gulp.parallel(css, js);