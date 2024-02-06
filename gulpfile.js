/*
 * IconCaptcha - Copyright 2017-2024, Fabian Wennink (https://www.fabianwennink.nl)
 * Licensed under the MIT license: https://www.fabianwennink.nl/projects/IconCaptcha-Widget/license
 *
 * The above copyright notice and license shall be included in all copies or substantial portions of the software.
 */

const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const postcss = require('gulp-postcss');
const rename = require('gulp-rename');
const babelJS = require("gulp-babel");
const autoprefixer = require('autoprefixer');
const concat = require('gulp-concat');
const header = require('gulp-header');
const uglify = require('gulp-uglify');

const CSS_INPUT = 'src/scss/*.scss';
const CSS_OUTPUT = 'dist/css';
const JS_INPUT = ['src/js/polyfill.js', 'src/js/*.js'];
const JS_OUTPUT = 'dist/js';
const FILE_OUTPUT_NAME = 'iconcaptcha';

const HEADER = '/*! IconCaptcha v4.0.2 | (c) 2017-2024, Fabian Wennink (fabianwennink.nl) | fabianwennink.nl/projects/IconCaptcha-Widget/license */\n';

/*************************************************/

const css = () => {
    return gulp.src(CSS_INPUT)
        .pipe(sass({outputStyle: 'compressed'}))
        .pipe(postcss([autoprefixer()]))
        .pipe(header(HEADER))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(CSS_OUTPUT));
}

const js = () => {
    return gulp.src(JS_INPUT)
        .pipe(babelJS({
            presets: ['@babel/preset-env']
        }))
        .pipe(concat(`${FILE_OUTPUT_NAME}.js`))
        .pipe(uglify())
        .pipe(header(HEADER))
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
exports.watch = gulp.series(css, js, watch);
exports.default = gulp.parallel(css, js);
