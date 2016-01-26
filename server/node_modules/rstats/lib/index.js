var bindings = require('bindings')('R.node');

module.exports.session = function()
  {
  return new bindings.session() 
  };