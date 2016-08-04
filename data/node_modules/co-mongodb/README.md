co-mongodb
==========

[![Build Status](https://travis-ci.org/ArnaudCourbiere/co-mongodb.png?branch=master)](https://travis-ci.org/ArnaudCourbiere/co-mongodb)

Manipulation library to use the mongodb native driver with generator based flow control libraries such as [co](https://github.com/visionmedia/co).

## Instalation

```
$ npm install co-mongodb
```
## Example

```js
var comongo = require('co-mongodb');

co(function *() {
  // db is just a regular Db instance from the native driver.
  db = yield comongo.client.connect('mongodb://localhost:27017/test');
  
  // The same goes for collection.
  var collection = yield comongo.db.collection(db, 'testCollection');
  
  var result = yield comongo.db.addUser(db, 'user', 'pass');
  var user = result[0];
  yield comongo.db.removeUser(db, 'user');
  
  yield comongo.db.close(db);
})();
```

## Supported functions

+ [MongoClient](http://mongodb.github.io/node-mongodb-native/api-generated/mongoclient.html) `comongo.client`
+ [Db](http://mongodb.github.io/node-mongodb-native/api-generated/db.html) `comongo.db`
+ [Collection](http://mongodb.github.io/node-mongodb-native/api-generated/collection.html) `comongo.collection`
+ [Admin](http://mongodb.github.io/node-mongodb-native/api-generated/admin.html) `comongo.admin`
+ [Cursor](http://mongodb.github.io/node-mongodb-native/api-generated/cursor.html) `comongo.cursor`
+ [Grid](http://mongodb.github.io/node-mongodb-native/api-generated/grid.html) `comongo.grid`

More to come soon...
