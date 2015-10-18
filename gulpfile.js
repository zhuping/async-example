var gulp = require('gulp');
var nodemon = require('gulp-nodemon');

gulp.task('develop', function() {
  var nodeArgs = ['--harmony'];
  if (gulp.env.debug) {
    nodeArgs.push('--debug')
  }
  nodemon({
      script: 'app.js',
      ext: 'html js',
      ignore: ['node_modules/*'],
      nodeArgs: nodeArgs,
      env: {
        'NODE_ENV': 'development'
      }
    })
    .on('restart', function() {
      console.log('restarted!')
    });
});

//开发时使用
gulp.task('default', [
  'develop'
]);
