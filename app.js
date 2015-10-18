var koa = require('koa');
var path = require('path');
var async = require('async');
var render = require('koa-ejs');
var request = require('request');
var statics = require('koa-static');
var router = require('koa-router')();
var bodyParser = require('koa-bodyparser');
var thunkify = require('thunkify-wrap').genify;
var fs = require('fs');

var app = module.exports = koa();

request = thunkify(request);

app.use(bodyParser());
app.use(statics(path.join(__dirname, 'public')));

render(app, {
  root: path.join(__dirname, 'views'),
  layout: 'layout',
  viewExt: 'html'
});

app.use(router.routes());

// 路由
router.get('/', function*() {
  yield this.render('index');
});

router.get('/api/album/downloadImg', function*() {
  var url = this.query.url.split('/');
  var aid = url.pop();
  aid = aid === '' ? url.pop() : aid;

  var count = 100;
  var start = i = 0;
  var total = Infinity;
  var allPhotos = [];
  var response = null;

  do {
    start = i++ * count;
    response = yield requestAlbum(aid, count, start);
    var body = JSON.parse(response.body);
    total = body.total - start;

    // 下载相册
    if (body.photos.length > 0) {
      allPhotos = allPhotos.concat(body.photos);
    } else {
      downloadAlbum(allPhotos, body.album.id);
    }
  } while (total / count > 0);

  this.body = {
    ok: true
  };
});

function* requestAlbum(aid, count, start) {
  var dbUrl = 'https://api.douban.com/v2/album/' + aid + '/photos?start=' + start + '&count=' + count;
  var response = yield * request(dbUrl);
  return response[0];
}

function downloadAlbum(photos, id) {
  fs.exists('./public/download/' + id, function(exists) {
    if (!exists) {
      fs.mkdirSync('./public/download/' + id);
    }

    async.eachLimit(photos, 50, function(photo, callback) {
      if (photo.image) {
        var filename = path.basename(photo.image);
        var filepath = './public/download/' + id + '/' + filename;

        require('request')
          .get(photo.image)
          .on('error', function() {
            console.log(error);
          })
          .pipe(fs.createWriteStream(filepath))
          .on('error', function(err) {
            console.log(err);
          })
          .on('close', function() {
            callback();
          });
      }
    }, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('============== all images have been downloaded. =============');
      }
    });
  });
}

app.listen(8080, function() {
  console.log('listening on port ' + 8080 + '.');
})