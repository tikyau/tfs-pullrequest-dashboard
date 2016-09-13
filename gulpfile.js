var gulp = require('gulp');
var del = require('del');
var ts = require('gulp-typescript');
var sourcemaps = require('gulp-sourcemaps');
var runSequence = require('run-sequence');
var connect = require('gulp-connect');
var systemjsBuilder = require('systemjs-builder');
var concat = require('gulp-concat');

var tsProject = ts.createProject('tsconfig.json');

var paths = {
    buildFiles: ['gulpfile.js', 'package.json', 'typings.json', 'tsconfig.json'],
    static: ['src/**/*', '!**/*.ts', '!**/*.js'],
    tsSource: ['src/**/*.ts', 'typings/index.d.ts'],
    vendor_js: ['node_modules/zone.js/dist/zone.js','node_modules/reflect-metadata/Reflect.js', 'node_modules/systemjs/dist/system.src.js', 'node_modules/es6-shim/es6-shim.js'],
    vendor_css: ['node_modules/bootstrap/dist/**/*', 'node_modules/font-awesome/**/*'],
    compileFolder: 'build/compile',
    buildOut: 'build/target'
}

gulp.task('clean', function() {
    return del(['build']);
});

gulp.task('copy:static', function(){
    return gulp
        .src(paths.static)
        .pipe(gulp.dest(paths.buildOut));
});

gulp.task('copy:bootstrap', function() {
    return gulp.src(['node_modules/bootstrap/dist/css/*.css', 'node_modules/bootstrap/dist/fonts/*'], {base: './node_modules/bootstrap/dist'})
        .pipe(gulp.dest(paths.buildOut + '/vendor/bootstrap'));
})

gulp.task('copy:fa', function() {
    return gulp.src(['node_modules/font-awesome/css/*.css', 'node_modules/font-awesome/fonts/*'], {base: './node_modules'})
        .pipe(gulp.dest(paths.buildOut + '/vendor'));
})

gulp.task('copy:vendor_css', ['copy:bootstrap', 'copy:fa']);

gulp.task('compile:ts', function () {
    var tsResult = gulp.src(paths.tsSource)
        .pipe(sourcemaps.init())
        .pipe(ts(tsProject));

    tsResult.dts.pipe(gulp.dest(paths.compileFolder));

    return tsResult.js
        .pipe(sourcemaps.write({ sourceRoot: './' }))
        .pipe(gulp.dest(paths.compileFolder));
});

gulp.task('bundle:app', function() {
    var builder = new systemjsBuilder('.', './system.config.js');
    return builder.buildStatic('src/app/app.ts', paths.buildOut + '/app/app.bundle.js',
        {
            sourceMaps:true,
            runtime:false,
            sourceMapContents:true
        });
});

gulp.task('bundle:vendor', function() {
    return gulp.src(paths.vendor_js)
        .pipe(sourcemaps.init())
        .pipe(concat('vendor.bundle.js'))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(paths.buildOut + '/vendor'));
});

gulp.task('build', function(callback) {
    runSequence('clean', ['copy:static', 'copy:vendor_css', 'bundle:vendor'], 'bundle:app', callback);
});

gulp.task('watch', function() {
    gulp.watch(paths.buildFiles, ['build']);
    gulp.watch(paths.static, ['copy:static']);
    gulp.watch(paths.tsSource, ['compile:ts']);
});

gulp.task('serve', function() {
    connect.server({
        root: 'build/target'
    });
});

gulp.task('default', ['build']);
