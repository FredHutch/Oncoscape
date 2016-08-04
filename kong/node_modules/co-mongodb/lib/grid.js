var mongodb = require('mongodb');

var supportedFunctions = [
  'put',
  'get',
  'delete'
];

supportedFunctions.forEach(function (functionName) {
  module.exports[functionName] = function () {
    var cb;
    var args = [].slice.call(arguments);
    var grid = args.splice(0, 1)[0];
    
    if (!grid instanceof mongodb.Grid) {
      throw Error('Invalid grid object specified.');
    }
    
    return function (cb) {
      args.push(cb);
      grid[functionName].apply(grid, args);
    };
  };
});
