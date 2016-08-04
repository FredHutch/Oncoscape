
/**
 * Module Dependencies
 */

var Db = require('./db');

/**
 * Expose Client
 */

module.exports = MongoClient;

/**
 * MongoClient
 *
 * @TODO: Handle the "test" db connection created on startup:
 * https://github.com/mongodb/node-mongodb-native/blob/1.4/lib/mongodb/mongo_client.js#L45
 */

function MongoClient(client) {
  this._client = client;
}

/**
 * Methods to wrap
 */

var wrap = [
  // 'connect', // returns new DB
  // 'open', // @TODO
  // 'close' // @TODO
];

/**
 * Connect
 */

MongoClient.connect = Db.connect;
