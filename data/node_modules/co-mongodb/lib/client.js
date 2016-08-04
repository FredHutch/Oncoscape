var mongodb = require('mongodb');

var supportedFunctions = [
  'open',
  'close'
];

supportedFunctions.forEach(function (functionName) {
  module.exports[functionName] = function () {
    var cb;
    var args = [].slice.call(arguments);
    var client = args.splice(0, 1)[0];
    
    if (!client instanceof mongodb.MongoClient) {
      throw Error('Invalid database object specified.');
    }
    
    return function (cb) {
      args.push(cb);
      client[functionName].apply(client, args);
    };
  };
});

// TODO: Work this special case in the function above.
module.exports.connect = function (client, url, options) {
  if (typeof client === 'string') {
    url = client;
    options = url;
    client = require('mongodb').MongoClient;
  }
  
  return function (cb) {
    client.connect(url, options, cb);
  };
};
