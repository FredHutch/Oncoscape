
var co = require('co');
var comongo = require('./');


var thunk = function (opts) {
  return function (done) {
    console.log(arguments);
  };
};

// co(function *() {
//   var db = yield comongo.connect('mongodb://127.0.0.1:27017/test');
//   var c = yield db.collection('test');
//   console.log(yield c.find().close())
// })();


comongo.connect('mongodb://127.0.0.1:27017/test')(function (err, db) {
  db.collection('test')(function (err, c) {
    c.find().close()(function (err, cur) {
      console.log(cur instanceof comongo.Cursor);
      db.close()();
    });
  });
});
