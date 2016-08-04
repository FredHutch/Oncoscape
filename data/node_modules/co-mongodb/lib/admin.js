var mongodb = require('mongodb');

var supportedFunctions = [
  'buildInfo',
  'serverStatus',
  'profilingLevel',
  'ping',
  'authenticate',
  'logout',
  'addUser',
  'removeUser',
  'setProfilingLevel',
  'profilingInfo',
  'command',
  'validateCollection',
  'listDatabases',
  'replSetGetStatus'
];

supportedFunctions.forEach(function (functionName) {
  module.exports[functionName] = function () {
    var cb;
    var args = [].slice.call(arguments);
    var admin = args.splice(0, 1)[0];
    
    if (!admin instanceof mongodb.Admin) {
      throw Error('Invalid admin object specified.');
    }
    
    return function (cb) {
      args.push(cb);
      admin[functionName].apply(admin, args);
    };
  };
});
