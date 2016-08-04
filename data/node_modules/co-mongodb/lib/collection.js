var mongodb = require('mongodb');

var supportedFunctions = [
  'insert',
  'remove',
  'rename',
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
  'mapReduce',
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

supportedFunctions.forEach(function (functionName) {
  module.exports[functionName] = function () {
    var cb;
    var args = [].slice.call(arguments);
    var collection = args.splice(0, 1)[0];
    
    if (!collection instanceof mongodb.Collection) {
      throw Error('Invalid collection object specified.');
    }
    
    return function (cb) {
      args.push(cb);
      collection[functionName].apply(collection, args);
    };
  };
});
