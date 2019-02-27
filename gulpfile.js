var gulp = require('gulp');
var babel = require('gulp-babel');
var plumber = require('gulp-plumber');
var jasmine = require('gulp-jasmine');
var bump = require('gulp-bump');
var git = require('gulp-git');
var argv = require('yargs').argv;
var del = require('del');

var paths = {
    es6: ['src/**/*.js'],
    es5: 'lib'
};

gulp.task('clean-lib', function () {
    return del([
        'lib/**/*'
    ]);
});

gulp.task('babel', function () {
    return gulp.src(paths.es6)
        .pipe(plumber())
        .pipe(babel())
        .pipe(gulp.dest(paths.es5));
});

gulp.task('test', function () {
    return gulp.src(['test/**/*.spec.js', '!test/http/HystrixSSEStream-missing-deps.spec.js'])
        .pipe(jasmine({
            verbose:true,
            includeStackTrace:true
        })
    );
});

gulp.task('test-missing-deps', function () {
    return gulp.src(['test/**/*.spec.js', '!test/http/HystrixSSEStream.spec.js'])
        .pipe(jasmine({
            verbose:true,
            includeStackTrace:true
        })
    );
});

gulp.task('clean-build-test', gulp.series('clean-lib', 'babel', 'test'));

gulp.task('watch', function() {
    gulp.watch(['test/**/*','src/**/*'], ['clean-build-test']);
});

gulp.task('bump', function () {
    return gulp.src(['./package.json'])
        .pipe(bump({type: argv.type || 'patch'}))
        .pipe(gulp.dest('./'));
});

gulp.task('tag', gulp.series('bump', function () {
    var pkg = require('./package.json');
    var v = 'v' + pkg.version;
    var message = 'Release ' + v;

    return gulp.src('./')
        .pipe(git.commit(message))
        .pipe(git.tag(v, message))
        .pipe(git.push('origin', 'master', '--tags'))
        .pipe(gulp.dest('./'));
}));

gulp.task('npm', gulp.series('tag', function (done) {
    require('child_process').spawn('npm', ['publish'], { stdio: 'inherit' })
        .on('close', done);
}));

gulp.task('default', gulp.series('clean-build-test'));
