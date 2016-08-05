
/**
 * Module Dependencies
 */

var Collection = require('./collection');
var Cursor = require('./cursor');
var mongo = require('mongodb');

/**
 * Expose Db
 */

module.exports = Db;

/**
 * Db
 */

function Db(db) {
  this._db = db;
}

/**
 * Methods that return a db
 */

var db = [
  'open'
];

/**
 * Wrap returned db
 */

db.forEach(function (method) {
  Db.prototype[method] = function () {
    var args = [].slice.call(arguments);
    var db = this._db;

    return function (done) {
      args.push(function (err, db) {
        if (err) return done(err);
        done(null, new Db(db));
      });
      db[method].apply(db, args);
    };
  };
});

/**
 * Methods to thunk
 */

var thunk = [
  'close',
  // 'admin', // @TODO // Returns Admin object
  'eval',
  'collectionNames',
  // 'dereference', // @TODO
  'logout',
  'authenticate',
  'addUser',
  'removeUser',
  'command',
  'dropCollection',
  'renameCollection',
  'lastError',
  'previousErrors',
  'resetErrorHistory',
  'createIndex',
  'ensureIndex',
  'cursorInfo',
  'dropIndex',
  'reIndex',
  'indexInformation',
  'dropDatabase',
  'stats'
];

/**
 * Thunk specified functions
 */

thunk.forEach(function (method) {
  Db.prototype[method] = function () {
    var args = [].slice.call(arguments);
    var self = this;

    return function (done) {
      args.push(done);
      self._db[method].apply(self._db, args);
    };
  };
});

/**
 * Methods that return collection
 */

var collection = [
  'collection',
  'collections',
  'createCollection'
];

/**
 * Wrap returned collection(s)
 */

collection.forEach(function (method) {
  Db.prototype[method] = function () {
    var args = [].slice.call(arguments);
    var db = this._db;

    return function (done) {
      args.push(function (err, collection) {
        if (err) return done(err);

        if (Array.isArray(collection)) {
          collection = collection.map(function (collection) {
            return new Collection(collection);
          });
          return done(null, collection);
        }

        done(null, new Collection(collection));
      });
      db[method].apply(db, args);
    };
  };
});

/**
 * Methods that return cursor
 */

var cursor = [
  'collectionsInfo'
];

/**
 * Wrap returned cursor
 */

cursor.forEach(function (method) {
  Db.prototype[method] = function () {
    var args = [].slice.call(arguments);
    var db = this._db;

    return function (done) {
      args.push(function (err, cursor) {
        if (err) return done(err);
        done(null, new Cursor(cursor));
      });
      db[method].apply(db, args);
    };
  };
});

/**
 * Connect
 */

Db.connect = function (url, options) {
  return function (done) {
    options = options || {};
    mongo.MongoClient.connect(url, options, function (err, db) {
      if (err) return done(err);
      done(null, new Db(db));
    });
  };
};
