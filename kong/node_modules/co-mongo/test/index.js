
var mongo = require('mongodb');
var comongo = require('../');
var co = require('co');

describe('co-mongo', function () {

  describe('connect', function () {
    it('should return comongo db', function (done) {
      co(function *() {
        var db = yield comongo.connect('mongodb://127.0.0.1:27017/test');
        db.should.be.instanceOf(comongo.Db);
      })(done);
    });
  });

  describe('get', function () {
    it('should return comongo db', function (done) {
      co(function *() {
        var db = yield comongo.get();
        db.should.be.instanceOf(comongo.Db);
        yield db.close();
      })(done);
    });

    it('should conect to configured database', function (done) {
      co(function *() {
        comongo.configure({
          name: 'test2'
        });

        var db = yield comongo.get();
        db._db.databaseName.should.equal('test2');
        yield db.close();
      })(done);
    });

    it('should attach collections', function (done) {
      co(function *() {
        comongo.configure({
          collections: ['users', 'posts']
        });

        var db = yield comongo.get();
        db.users.should.be.instanceOf(comongo.Collection);
        db.users._collection.collectionName.should.equal('users');
        db.posts.should.be.instanceOf(comongo.Collection);
        db.posts._collection.collectionName.should.equal('posts');
      })(done);
    });
  });

});
