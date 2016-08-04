
var setup = require('./setup');
var mongo = require('mongodb');
var comongo = require('../');
var co = require('co');

describe('collection', function () {

  var test;

  beforeEach(function () {
    test = setup.test;
  });

  describe('insert', function () {
    it('should insert', function (done) {
      co(function *() {
        var res = yield test.insert({ hello: 'thom' });
        res[0].should.have.keys(['hello', '_id']);
        res[0].hello.should.equal('thom');
      })(done);
    });
  });

  describe('remove', function () {
    it('should remove', function (done) {
      co(function *() {
        var res = yield test.remove({ hello: 'world' });
        res.should.equal(1);
      })(done);
    });
  });

  describe('rename', function () {
    it('should rename', function (done) {
      co(function *() {
        var res = yield test.rename('new_name');
        res.should.be.instanceOf(comongo.Collection);
      })(done);
    });
  });

  describe('save', function () {
    it('should save', function (done) {
      co(function *() {
        var res = yield test.save({ hello: 'thom' });
        res.should.have.keys(['hello', '_id']);
        res.hello.should.equal('thom');
      })(done);
    });
  });

  describe('update', function () {
    it('should update', function (done) {
      co(function *() {
        var res = yield test.update({ hello: 'world' }, { hello: 'thom' });
        res[0].should.equal(1);
        res[1].should.have.keys(['updatedExisting', 'n', 'connectionId', 'err',
          'ok']);
      })(done);
    });
  });

  describe('distinct', function () {
    it('should distinct', function (done) {
      co(function *() {
        var docs = yield test.distinct('hello');
        docs.should.eql(['world']);
      })(done);
    });
  });

  describe('count', function () {
    it('should count', function (done) {
      co(function *() {
        var count = yield test.count();
        count.should.equal(1);
      })(done);
    });
  });

  describe('drop', function () {
    it('should drop', function (done) {
      co(function *() {
        var res = yield test.drop();
        res.should.equal(true);
      })(done);
    });
  });

  describe('findAndModify', function () {
    it('should findAndModify', function (done) {
      co(function *() {
        var res = yield test.findAndModify({ hello: 'world' }, [['hello', 1]],
          {$set: { hello: 'thom' }});
        res[0].should.have.keys(['_id', 'hello']);
        // res[0].hello.should.equal('thom'); // @TODO
      })(done);
    });
  });

  describe('findAndRemove', function () {
    it('should findAndRemove', function (done) {
      co(function *() {
        var res = yield test.findAndRemove({ hello: 'world' }, [['hello', 1]]);
        res[0].should.have.keys(['_id', 'hello']);
      })(done);
    });
  });

  describe('find', function () {
    it('should return a cursor', function () {
      var res = test.find({});
      res.should.be.instanceOf(comongo.Cursor);
    });
  });

  describe('findOne', function () {
    it('should findOne', function (done) {
      co(function *() {
        var res = yield test.findOne({ hello: 'world' });
        res.should.have.keys(['_id', 'hello']);
        res._id.toString().should.equal(setup._id);
        res.hello.should.equal('world');
      })(done);
    });
  });

  describe('createIndex', function () {
    it('should createIndex', function (done) {
      co(function *() {
        var res = yield test.createIndex('hello');
        res.should.equal('hello_1');
      })(done);
    });
  });

  describe('ensureIndex', function () {
    it('should ensureIndex', function (done) {
      co(function *() {
        var res = yield test.ensureIndex('hello');
        res.should.equal('hello_1');
      })(done);
    });
  });

  describe('indexInformation', function () {
    it('should indexInformation', function (done) {
      co(function *() {
        var res = yield test.indexInformation('hello');
        res.should.eql({
          _id_: [ [ '_id', 1 ] ], hello_1: [ [ 'hello', 1 ] ]
        });
      })(done);
    });
  });

  describe('dropIndex', function () {
    it('should dropIndex', function (done) {
      co(function *() {
        var res = yield test.dropIndex('hello_1');
        res.should.eql({ nIndexesWas: 2, ok: 1 });
      })(done);
    });
  });

  describe('dropAllIndexes', function () {
    it('should dropAllIndexes', function (done) {
      co(function *() {
        var res = yield test.dropAllIndexes();
        res.should.equal(true);
      })(done);
    });
  });

  describe('reIndex', function () {
    it('should reIndex', function (done) {
      co(function *() {
        var res = yield test.reIndex();
        res.should.equal(true);
      })(done);
    });
  });

  describe('mapReduce', function () {
    it('should mapReduce', function (done) {
      co(function *() {

        var map = function () {
          emit(this.hello, 1);
        };
        var reduce = function (k, vals) {
          return 1;
        };
        var res = yield test.mapReduce(map, reduce, {
          out: {
            replace: 'tempCollection',
            readPreference: 'secondary'
          }
        });
        res.should.be.instanceOf(comongo.Collection);
      })(done);
    });
  });

  describe('group', function () {
    it('should group', function (done) {
      co(function *() {
        var res = yield test.group([], {}, { count: 0 },
          'function (obj, prev) { prev.count++; }');
        res[0].count.should.eql(1);
      })(done);
    });
  });

  describe('options', function () {
    it('should return options', function (done) {
      co(function *() {
        var res = yield test.options();
        res.should.eql({ create: 'test_collection' });
      })(done);
    });
  });

  describe('isCapped', function () {
    it('should return if collection is capped', function (done) {
      co(function *() {
        var db = yield comongo.connect(setup.connString);
        var test = yield db.createCollection('capped', {
          capped: true,
          size: 2
        });
        var res = yield test.isCapped();
        res.should.equal(true);
      })(done);
    });
  });

  describe('indexExists', function () {
    it('should return if index exists', function (done) {
      co(function *() {
        var res = yield test.indexExists('hello_1');
        res.should.equal(true);
      })(done);
    });
  });

  describe('geoNear', function () {
    it('should perform geoNear', function (done) {
      co(function *() {
        var db = yield comongo.connect(setup.connString);
        var test = yield db.collection('geo');
        yield test.ensureIndex({ loc: '2d' });
        yield test.insert({ a: 1, loc: [50, 30] }, { a: 1, loc: [30, 50] });

        var res = yield test.geoNear(50, 50, { query: { a: 1 }, num: 1});
        res.results.should.have.lengthOf(1);
      })(done);
    });
  });

  describe('geoHaystackSearch', function () {
    it('should perform geoHaystackSearch', function (done) {
      co(function *() {
        var db = yield comongo.connect(setup.connString);
        var test = yield db.collection('geo');
        yield test.ensureIndex({ loc: 'geoHaystack', type: 1 }, {
          bucketSize: 1
        });
        yield test.insert({ a: 1, loc: [50, 30] }, { a: 1, loc: [30, 50] });

        var res = yield test.geoHaystackSearch(50, 50, {
          search: { a: 1 },
          limit: 1,
          maxDistance: 100
        });
        res.results.should.have.lengthOf(1);
      })(done);
    });
  });

  describe('indexes', function () {
    it('should get indexes', function (done) {
      co(function *() {
        var res = yield test.indexes();
        res.should.eql([{
          v: 1,
          key: { _id: 1 },
          ns: setup.mongoName + '.test_collection',
          name: '_id_'
        }, {
          v: 1,
          key: { hello: 1 },
          ns: setup.mongoName + '.test_collection',
          name: 'hello_1'
        }]);
      })(done);
    });
  });

  describe('aggregate', function () {
    it('should aggregate', function (done) {
      co(function *() {

        var docs =  [{
          title : "this is my title",
          author : "bob",
          posted : new Date(),
          pageViews : 5,
          tags : [ "fun" , "good" , "fun" ],
          other : { foo : 5 },
          comments : [
            { author :"joe", text : "this is cool" },
            { author :"sam", text : "this is bad" }
          ]
        }];
        yield test.insert(docs);

        var res = yield test.aggregate([{
          $project : { author : 1, tags : 1 }
        }, {
          $unwind : "$tags"
        }, {
          $group : {
            _id : { tags : "$tags" },
            authors : { $addToSet : "$author" }
          }
        }]);
        res.should.eql([{
          _id: { tags: 'good' },
          authors: [ 'bob' ]
        },{
          _id: { tags: 'fun' },
          authors: [ 'bob' ]
        }]);
      })(done);
    });
  });

  describe('stats', function () {
    it('should get stats', function (done) {
      co(function *() {
        var res = yield test.stats();
        res.count.should.equal(1);
        res.nindexes.should.equal(2);
      })(done);
    });
  });

});

