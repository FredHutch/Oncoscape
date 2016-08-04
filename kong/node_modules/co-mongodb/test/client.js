var assert = require('assert');
var co = require('co');
var comongo = require('..');
var mongodb = require('mongodb');

describe('client', function () {
  var mongoClient;
  
  beforeEach(function () {
    mongoClient = new mongodb.MongoClient(new mongodb.Server('localhost', 27017));
  });
  afterEach(function () {
    mongoClient = undefined;
  });
  
  describe('#connect()', function () {
    var db;
    
    afterEach(function (done) {
      if (db instanceof mongodb.Db) {
        db.close(done);
      } else {
        done();
      }
      
      db = undefined;
    });
    
    it('should return the DB when called with no client', function (done) {
      co(function *() {
        db = yield comongo.client.connect('mongodb://localhost:27017/test');
        assert.ok(db instanceof mongodb.Db);
      })(done);
    });
    it('should return the DB when called with a client', function (done) {
      co(function *() {
        db = yield comongo.client.connect(mongoClient, 'mongodb://localhost:27017/test');
        assert.ok(db instanceof mongodb.Db);
      })(done);
    });
  });
  
  describe('#open()', function () {
    it('should initialize the DB connection and return the connected MongoClient', function (done) {
      co(function *() {
        var connectedMongoClient = yield comongo.client.open(mongoClient)
        assert.ok(connectedMongoClient instanceof mongodb.MongoClient);
        connectedMongoClient.close();
      })(done);
    });
  });
  
  describe('#close()', function () {
    it('should close the db connection', function (done) {
      co(function *() {
        var connectedMongoClient = yield comongo.client.open(mongoClient);
        var result = yield comongo.client.close(connectedMongoClient);
        assert.strictEqual(typeof result, 'undefined');
      })(done);
    });
  });
});
