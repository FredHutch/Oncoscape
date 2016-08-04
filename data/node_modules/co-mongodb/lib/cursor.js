var mongodb = require('mongodb');

var supportedFunctions = [
  'toArray',
  'each',
  'count',
  'sort',
  'limit',
  'maxTimeMS',
  'setReadPreference',
  'skip',
  'batchSize',
  'nextObject',
  'explain',
  'close'
];

supportedFunctions.forEach(function (functionName) {
  module.exports[functionName] = function () {
    var cb;
    var args = [].slice.call(arguments);
    var cursor = args.splice(0, 1)[0];
    
    if (!cursor instanceof mongodb.Cursor) {
      throw Error('Invalid cursor object specified.');
    }
    
    return function (cb) {
      args.push(cb);
      cursor[functionName].apply(cursor, args);
    };
  };
});
