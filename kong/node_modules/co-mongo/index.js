
/**
 * Module Dependencies
 */

var mongo = require('mongodb');
var Db = require('./lib/db');

/**
 * Expose Db
 */

module.exports = Db;

/**
 * Objects to wrap
 */

var wrap = [
  'Collection',
  'Cursor',
  'Db',
  'MongoClient'
];

/**
 * Expose comongo wrapper
 */

wrap.forEach(function (name) {
  Db[name] = require('./lib/' + name.toLowerCase());
});

/**
 * Expose everything else
 */

for (var key in mongo) {
  if (!Db[key])
    Db[key] = mongo[key];
}

/**
 * Default configuration
 */

var config = {
  host: '127.0.0.1',
  port: 27017,
  name: 'test',
  pool: 5,
  collections: []
};

/**
 * Set default configuration
 */

Db.configure = function (conf) {
  for (var key in conf) {
    config[key] = conf[key];
  }
};

/**
 * Get db attached collections
 */

Db.get = function () {
  return function (done) {
    var server = new mongo.Server(config.host, config.port);
    var db = new mongo.Db(config.name, server, {
      w: 1,
      poolSize: config.pool
    });

    db.open(function (err, db) {
      if (err) return done(err);

      // Wrap
      db = new Db(db);

      // Attach collections
      var collections = config.collections.slice(0);
      (function next() {
        if (!collections.length)
          return done(err, db);

        var name = collections.shift();
        db.collection(name)(function (err, collection) {
          if (err) return done(err);
          db[name] = collection;
          next();
        });
      })();
    });
  };
};
