
var mongo = require('mongodb');
var database = require('./');
var co = require('co');

co(function *() {
  database.configure({
    collections: ['test']
  });

  var db = yield database.get();
  console.log('here1');
  var collection = yield db.collection('test');
  console.log('here2');
  var cursor = yield collection.findOne();
  console.log('here3', cursor);
})();

