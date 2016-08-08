var assert = require('assert');
var co = require('co');
var comongo = require('..');
var mongodb = require('mongodb');

describe('db', function () {
  var db;
  
  beforeEach(function (done) {
    co(function *() {
      db = yield comongo.client.connect('mongodb://localhost:27017/test');
    })(done);
  });
  afterEach(function (done) {
    db.dropDatabase(function (err, result) {
      db.close(done);
      db = undefined;
    });
  });

  describe('#open()', function () {
    it('should initialize the database connection', function (done) {
      co(function *() {
        // Use a db that is not connected yet.
        var db = new  mongodb.Db('test', new mongodb.Server('localhost', 27017), { safe: true });
        var indexInfo = yield comongo.db.open(db);
        assert.notEqual(indexInfo, null);
        assert.strictEqual(indexInfo.databaseName, 'test');
        assert.ok(indexInfo.openCalled);
        db.close();
      })(done);
    });
  });
  
  describe('#close()', function () {
    it('should close the current database connection', function (done) {
      co(function *() {
        var result = yield comongo.db.close(db);
        assert.strictEqual(typeof result, 'undefined');
      })(done);
    });
  });
  
  describe('#admin()', function () {
    it('should return the admin db', function (done) {
      co(function *() {
        var adminDb = yield comongo.db.admin(db);
        assert.ok(adminDb instanceof mongodb.Admin);
      })(done);
    });
  });
  
  describe('#collectionsInfo()', function () {
    it('should return a cursor to the collection information', function (done) {
      co(function *() {
        var cursor = yield comongo.db.collectionsInfo(db);
        assert.ok(cursor instanceof mongodb.Cursor);
      })(done);
    });
  });
  
  describe('#collectionNames()', function () {
    it('sould get a list of collection names', function (done) {
      co(function *() {
        var collectionNames = yield comongo.db.collectionNames(db);
        assert.ok(collectionNames instanceof Array);
      })(done);
    });
  });
  
  describe('#collection()', function () {
    it('should fetch a collection', function (done) {
      co(function *() {
        var collection = yield comongo.db.collection(db, 'testCollection1');
        assert.ok(collection instanceof mongodb.Collection);
      })(done);
    });
  });
  
  describe('#collections()', function () {
    it('should fetch all collections', function (done) {
      co(function *() {
        var collections = yield comongo.db.collections(db);
        assert.ok(collections instanceof Array);
      })(done);
    });
  });
  
  describe('#eval()', function () {
    it('should evaluate javascript code on the server', function (done) {
      co(function *() {
        var result = yield comongo.db.eval(db, 'function (x, y) { return x + y; }', [2, 3]);
        assert.strictEqual(result, 5);
      })(done);
    });
  });
  
  // TODO: test dereference when implemented.
  
  describe('#logout()', function () {
    it('should logout user from the server', function (done) {
      co(function *() {
        var result = yield comongo.db.logout(db);
        assert.strictEqual(result, true);
      })(done);
    });
  });
  
  describe('#authenticate()', function () {
    it('should authenticate a user against the server', function (done) {
      db.addUser('user1', 'pass', function (err, result) {
        assert.strictEqual(err, null);
        
        co(function *() {
          var result = yield comongo.db.authenticate(db, 'user1', 'pass');
          assert.strictEqual(result, true);
          db.removeUser('user1', function (err, result) {
            assert.strictEqual(err, null);
            assert.strictEqual(result, true);
            done();
          });
        })();
      });
    });
  });

  describe('#addUser()', function () {
    it('should add a user to the database', function (done) {
      co(function *() {
        var result = yield comongo.db.addUser(db, 'user2', 'pass');
        assert.ok(result instanceof Array);
        assert.strictEqual(result.length, 1);
        var user = result[0];
        assert.strictEqual(user.user, 'user2');
        assert.ok(user.hasOwnProperty('pwd'));
        db.removeUser('user2', function (err, result) {
          assert.strictEqual(err, null);
          assert.strictEqual(result, true);
          done();
        });
      })();
    });
  });
  
  describe('#removeUser()', function () {
    it('should remove a user from the database', function (done) {
      co(function *() {
        yield comongo.db.addUser(db, 'user3', 'pass');
        var result = yield comongo.db.removeUser(db, 'user3');
        assert.strictEqual(result, true);
      })(done);
    });
  });
  
  describe('#createCollection()', function () {
    it('should create a collection on the server', function (done) {
      co(function *() {
        var collection = yield comongo.db.createCollection(db, 'testCollection2');
        assert.ok(collection instanceof mongodb.Collection);
      })(done);
    });
  });
  
  describe('#command()', function () {
    it('should execute a command hash against MongoDB', function (done) {
      co(function *() {
        var result = yield comongo.db.command(db, { ping: 1 });
        assert.strictEqual(result.ok, 1);
      })(done);
    });
  });
  
  describe('#dropCollection()', function () {
    it('should drop the collection on the server', function (done) {
      co(function *() {
        yield comongo.db.createCollection(db, 'testCollection3');
        var result = yield comongo.db.dropCollection(db, 'testCollection3');
        assert.strictEqual(result, true);
      })(done);
    });
  });
  
  describe('#renameCollection()', function () {
    it('should rename the collection', function (done) {
      co(function *() {
        yield comongo.db.createCollection(db, 'testCollection4');
        var collection = yield comongo.db.renameCollection(db, 'testCollection4', 'testCollection4Renamed');
        assert.ok(collection instanceof mongodb.Collection);
        assert.strictEqual(collection.collectionName, 'testCollection4Renamed');
      })(done);
    });
  });
  
  describe('#lastError()', function () {
    it('should return the last error message from the given connection', function (done) {
      co(function *() {
        var result = yield comongo.db.lastError(db);
        assert.strictEqual(result[0].err, null);
        assert.strictEqual(result[0].ok, 1);
      })(done);
    });
  });
  
  describe('#previousErrors()', function () {
    it('should return all errors up to the last time db reset_error_history was called', function (done) {
      co(function *() {
        var result = yield comongo.db.previousErrors(db);
        assert.strictEqual(result[0].err, null);
        assert.strictEqual(result[0].ok, 1);
      })(done);
    });
  });
  
  describe('#resetErrorHistory()', function () {
    it('should the error history of the mongo instance', function (done) {
      co(function *() {
        var result = yield comongo.db.resetErrorHistory(db);
        assert.strictEqual(result[0].ok, 1);
      })(done);
    });
  });
  
  describe('#createIndex()', function () {
    it('should create an index on the collection', function (done) {
      db.createCollection('testCollection5', function(err, collection) {
        assert.equal(null, err);

        collection.insert([{a:1, b:1}, {a:1, b:1}, {a:2, b:2}, {a:3, b:3},
          {a:4, b:4}], {w:1}, function(err, result) {
            
          co(function *() {
            var result = yield comongo.db.createIndex(db, 'testCollection5', {a:1, b:1},
              {unique:true, background:true, dropDups:true, w:1});
            
            assert.strictEqual(result, 'a_1_b_1');
          })(done);
        });
      });
    });
  });
  
  describe('#ensureIndex()', function () {
    it('should create an index on the collection', function (done) {
      db.createCollection('testCollection6', function(err, collection) {
        assert.equal(null, err);

        collection.insert([{a:1, b:1}, {a:1, b:1}, {a:2, b:2}, {a:3, b:3},
          {a:4, b:4}], {w:1}, function(err, result) {
            
          co(function *() {
            var result = yield comongo.db.ensureIndex(db, 'testCollection6', {a:1, b:1},
              {unique:true, background:true, dropDups:true, w:1});
            
            assert.strictEqual(result, 'a_1_b_1');
          })(done);
        });
      });
    });
  });
  
  describe('#cursorInfo()', function () {
    it('should return the cursor information', function (done) {
      co(function *() {
        var cursorInfo = yield comongo.db.cursorInfo(db);
        assert.strictEqual(cursorInfo.ok, 1);
        assert.strictEqual(cursorInfo.totalOpen, 0);
        assert.strictEqual(cursorInfo.timedOut, 0);
      })(done);
    });
  });
  
  describe('#dropIndex()', function () {
    it('should drop an index on a collection', function (done) {
      co(function *() {
        var collection = yield comongo.db.createCollection(db, 'testCollection7');
        yield comongo.db.ensureIndex(db, 'testCollection7', {a:1, b:1},
          {unique:true, background:true, dropDups:true, w:1});
        var result = yield comongo.db.dropIndex(db, 'testCollection7', 'a_1_b_1');
        assert.strictEqual(result.nIndexesWas, 2);
        assert.strictEqual(result.ok, 1);
      })(done);
    });
  });
  
  describe('#reIndex()', function () {
    it('should reindex all indexes on a collection', function (done) {
      co(function *() {
        var collection = yield comongo.db.createCollection(db, 'testCollection8');
        yield comongo.db.ensureIndex(db, 'testCollection8', {a:1, b:1},
          {unique:true, background:true, dropDups:true, w:1});
        
        var result = yield comongo.db.reIndex(db, 'testCollection8');
        assert.strictEqual(result, true);
      })(done);
    });
  });
  
  describe('#indexInformation()', function () {
    it('should return a collection index info', function (done) {
      co(function *() {
        var collection = yield comongo.db.createCollection(db, 'testCollection9');
        yield comongo.db.ensureIndex(db, 'testCollection8', {a:1, b:1},
          {unique:true, background:true, dropDups:true, w:1});
        
        var indexInfo = yield comongo.db.indexInformation(db, 'testCollection9');
        assert.deepEqual([ [ '_id', 1 ] ], indexInfo._id_);
      })(done);
    });
  });
  
  describe('#dropDatabase()', function () {
    it('should drop the database', function (done) {
      co(function *() {
        var result = yield comongo.db.dropDatabase(db);
        assert.strictEqual(result, true);
      })(done);
    });
  });
  
  describe('#stats()', function () {
    it('should get all database statistics', function (done) {
      co(function *() {
        var stats = yield comongo.db.stats(db);
        assert.strictEqual(stats.db, 'test');
      })(done);
    });
  });
});
