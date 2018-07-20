let gulp = require("gulp");
let minify = require("gulp-babel-minify");
let babel = require("gulp-babel");
let sass = require('gulp-sass');
let combineMq = require('gulp-combine-mq');
let rename = require("gulp-rename");

/*************************************************/

gulp.task('js', function(){
  return gulp.src('src/js/*.js')
      .on('error', function (err) {
          console.log(err.toString());

          this.emit('end');
      })
      .pipe(babel({
          presets: ['env']
      }))
      .pipe(minify({
          mangle: {
              keepClassName: true
          }
      }))
	  .pipe(rename({ suffix: '.min' }))
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

gulp.task('default', function() {
	gulp.start('js');
	gulp.start('scss');
	gulp.start('query:css');
});