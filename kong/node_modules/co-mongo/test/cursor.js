
var stream = require('stream');
var setup = require('./setup');
var mongo = require('mongodb');
var comongo = require('../');
var co = require('co');

describe('cursor', function () {

  var test;

  beforeEach(function () {
    test = setup.test;
  });

  describe('rewind', function () {
    it('should rewind cursor', function (done) {
      co(function *() {
        var cursor = test.find();

        var res = yield cursor.nextObject();
        res.hello.should.equal('world');

        cursor.rewind();

        res = yield cursor.nextObject();
        res.hello.should.equal('world');
      })(done);
    });
  });

  describe('toArray', function () {
    it('should return all results', function (done) {
      co(function *() {
        var res = yield test.find().toArray();
        res.should.have.lengthOf(1);
        res[0].should.have.keys(['_id', 'hello']);
        res[0]._id.toString().should.equal(setup._id);
        res[0].hello.should.equal('world');
      })(done);
    });
  });

  describe('each', function () {
    it('should return result', function (done) {
      co(function *() {
        var res = yield test.find().each();
        res.should.have.keys(['_id', 'hello']);
        res._id.toString().should.equal(setup._id);
        res.hello.should.equal('world');
      })(done);
    });
  });

  describe('count', function () {
    it('should return count', function (done) {
      co(function *() {
        var res = yield test.find().count();
        res.should.equal(1);
      })(done);
    });
  });

  describe('sort', function () {
    it('should return cursor', function () {
      var res = test.find().sort({ hello: -1 });
      res.should.be.instanceOf(comongo.Cursor);
    });
  });

  describe('limit', function () {
    it('should return cursor', function () {
      var res = test.find().limit(5);
      res.should.be.instanceOf(comongo.Cursor);
    });
  });

  describe('maxTimeMS', function () {
    it('should return cursor', function () {
      var res = test.find().maxTimeMS(5);
      res.should.be.instanceOf(comongo.Cursor);
    });
  });

  describe('setReadPreference', function () {
    it('should return cursor', function () {
      var res = test.find().setReadPreference(comongo.Server.READ_PRIMARY);
      res.should.be.instanceOf(comongo.Cursor);
    });
  });

  describe('skip', function () {
    it('should return cursor', function () {
      var res = test.find().skip();
      res.should.be.instanceOf(comongo.Cursor);
    });
  });

  describe('batchSize', function () {
    it('should return cursor', function () {
      var res = test.find().batchSize(1);
      res.should.be.instanceOf(comongo.Cursor);
    });
  });

  describe('nextObject', function () {
    it('should return cursor', function (done) {
      co(function *() {
        var res = yield test.find().nextObject();
        res.should.have.keys(['_id', 'hello']);
        res._id.toString().should.equal(setup._id);
        res.hello.should.equal('world');
      })(done);
    });
  });

  describe('explain', function () {
    it('should return cursor', function (done) {
      co(function *() {
        var res = yield test.find().explain();
        res.should.have.keys(['cursor', 'isMultiKey', 'n', 'nscannedObjects',
          'nscanned', 'nscannedObjectsAllPlans', 'nscannedAllPlans',
          'scanAndOrder', 'indexOnly', 'nYields', 'nChunkSkips', 'millis',
          'indexBounds', 'allPlans', 'server']);
      })(done);
    });
  });

  describe('stream', function () {
    it('should return stream', function () {
      var res = test.find().stream();
      res.should.be.instanceOf(stream.Stream);
      setup.db = false; // Flag db as closed
    });
  });

  describe('close', function () {
    it('should return close', function (done) {
      co(function *() {
        var res = yield test.find().close();
        res.should.be.instanceOf(comongo.Cursor);
      })(done);
    });
  });

  describe('isClosed', function () {
    it('should return isClosed', function () {
      var res = test.find().isClosed();
      res.should.equal(false);
    });
  });

});
