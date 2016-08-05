
/**
 * Expose Cursor
 */

module.exports = Cursor;

/**
 * Cursor
 */

function Cursor(cursor) {
  this._cursor = cursor;
}

/**
 * Methods to inherit
 */

var inherit = [
  'rewind',
  'stream',
  'isClosed'
];

/**
 * Just pass through
 */

inherit.forEach(function (method) {
  Cursor.prototype[method] = function () {
    var cursor = this._cursor;
    return cursor[method].apply(cursor, arguments);
  };
});

/**
 * Methods to thunk
 */

var thunk = [
  'toArray',
  'each', // When yield'ed with co this behaves like nextObject
  'count',
  'skip',
  'nextObject',
  'explain'
];

/**
 * thunk specified functions
 */

thunk.forEach(function (method) {
  Cursor.prototype[method] = function () {
    var args = [].slice.call(arguments);
    var cursor = this._cursor;

    return function (done) {
      args.push(done);
      cursor[method].apply(cursor, args);
    };
  };
});

/**
 * Methods that return a cursor
 */

var cursor = [
  'sort',
  'limit',
  'maxTimeMS',
  'setReadPreference',
  'skip',
  'batchSize'
];

/**
 * Wrap returned cursor
 */

cursor.forEach(function (method) {
  Cursor.prototype[method] = function () {
    var cursor = this._cursor;
    return new Cursor(cursor[method].apply(cursor, arguments));
  };
});

/**
 * Methods that return a cursor in a callback
 */

var cursorThunk = [
  'close'
];

/**
 * Thunk and wrap returned cursor
 */

cursorThunk.forEach(function (method) {
  Cursor.prototype[method] = function () {
    var args = [].slice.call(arguments);
    var cursor = this._cursor;

    return function (done) {
      args.push(function (err, cursor) {
        if (err) return done(err);
        done(null, new Cursor(cursor));
      });
      cursor[method].apply(cursor, args);
    };
  };
});
