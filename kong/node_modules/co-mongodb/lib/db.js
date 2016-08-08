var mongodb = require('mongodb');

var supportedFunctions = [
  'open',
  'close',
  'admin',
  'collectionsInfo',
  'collectionNames',
  'collection',
  'collections',
  'eval',
  'dereference',
  'logout',
  'authenticate',
  'addUser',
  'removeUser',
  'createCollection',
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

supportedFunctions.forEach(function (functionName) {
  module.exports[functionName] = function () {
    var cb;
    var args = [].slice.call(arguments);
    var db = args.splice(0, 1)[0];
    
    if (!db instanceof mongodb.Db) {
      throw Error('Invalid database object specified.');
    }
    
    return function (cb) {
      args.push(cb);
      db[functionName].apply(db, args);
    };
  };
});
