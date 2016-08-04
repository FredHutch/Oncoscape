var mongodb = require('mongodb');

var supportedFunctions = [
  'open',
  'writeFile',
  'close',
  'chunkCollection',
  'unlink',
  'collection',
  'readlines',
  'rewind',
  'read',
  'tell',
  'seek',
  'getc',
  'puts',
  'write'
];

supportedFunctions.forEach(function (functionName) {
  module.exports[functionName] = function () {
    var cb;
    var args = [].slice.call(arguments);
    var gridstore = args.splice(0, 1)[0];
    
    if (!gridstore instanceof mongodb.GridStore) {
      throw Error('Invalid gridstore object specified.');
    }
    
    return function (cb) {
      args.push(cb);
      gridstore[functionName].apply(gridstore, args);
    };
  };
});

// TODO: Handle static functions.
