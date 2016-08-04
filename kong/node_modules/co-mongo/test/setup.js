
var mongo = require('mongodb');
var comongo = require('../');

exports.mongoHost = process.env.MONGO_HOST || '127.0.0.1:27017';
exports.mongoName = process.env.MONGO_Name || 'comongo_test';
exports.connString = 'mongodb://' + exports.mongoHost + '/' + exports.mongoName;

// And this is why we use generators :)
beforeEach(function (done) {
  mongo.connect(exports.connString, function (err, db) {
    exports.db = new comongo.Db(db);
    db.dropDatabase(function (err) {
      if (err) return done(err);
      db.createCollection('test_collection', function (err, test) {
        if (err) return done(err);
        exports.test = new comongo.Collection(test);
        test.insert({ hello: 'world' }, function (err, doc) {
          if (err) return done(err);
          exports._id = doc[0]._id.toString();
          db.createIndex('test_collection', { hello: 1 }, done);
        });
      });
    });
  });
});

afterEach(function () {
  if (exports.db)
    exports.db.close();
});
