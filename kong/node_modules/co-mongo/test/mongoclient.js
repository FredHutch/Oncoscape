
var mongo = require('mongodb');
var comongo = require('../');
var co = require('co');

describe('MongoClient', function () {

  describe('connect', function () {
    it('should return co-mongo db', function (done) {
      co(function *() {
        var db = yield comongo.MongoClient.connect('mongodb://127.0.0.1:27017/test');
        db.should.be.instanceOf(comongo.Db);
      })(done);
    });
  });

});

