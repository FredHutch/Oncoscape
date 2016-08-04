
/**
 * Module Dependencies
 */

var Cursor = require('./cursor');

/**
 * Expose Collection
 */

module.exports = Collection;

/**
 * Collection
 */

function Collection(collection) {
  this._collection = collection;
}

/**
 * Methods to thunk
 */

var thunk = [
  'insert',
  'remove',
  'save',
  'update',
  'distinct',
  'count',
  'drop',
  'findAndModify',
  'findAndRemove',
  'find',
  'findOne',
  'createIndex',
  'ensureIndex',
  'indexInformation',
  'dropIndex',
  'dropAllIndexes',
  'reIndex',
  'group',
  'options',
  'isCapped',
  'indexExists',
  'geoNear',
  'geoHaystackSearch',
  'indexes',
  'aggregate',
  'stats'
];

/**
 * Thunk specified functions
 */

thunk.forEach(function (method) {
  Collection.prototype[method] = function () {
    var args = [].slice.call(arguments);
    var collection = this._collection;

    return function (done) {
      args.push(done);
      collection[method].apply(collection, args);
    };
  };
});

/**
 * Methods that return a collection
 */

var collection = [
  'rename',
  'mapReduce'
];

/**
 * Wrap returned collection
 */

collection.forEach(function (method) {
  Collection.prototype[method] = function () {
    var args = [].slice.call(arguments);
    var collection = this._collection;

    return function (done) {
      args.push(function (err, collection) {
        if (err) return done(err);
        done(null, new Collection(collection));
      });
      collection[method].apply(collection, args);
    };
  };
});

/**
 * Method that return a cursor
 */

var cursor = [
  'find'
];

/**
 * Wrap returned cursor
 */

cursor.forEach(function (method) {
  Collection.prototype[method] = function () {
    var collection = this._collection;
    return new Cursor(collection[method].apply(collection, arguments));
  };
});
