# co-mongo

A mongodb wrapper that plays nicely with [co](https://github.com/visionmedia/co).

This is project has two goals:
 * Maintain exact compatibility with the mongodb module, what ever mongo returns in it's callback is what gets returned when you yield
 * Add a few convenience methods to make handling connections easier (see below)

## Install

```
npm install co-mongo
```

## Example

```js
var comongo = require('co-mongo');
var co = require('co');

co(function *() {
  var db = yield comongo.connect('mongodb://127.0.0.1:27017/test');
  var collection = yield db.collection('test_insert');
  yield collection.insert({ a: 2});

  var count = yield collection.count();
  console.log(count);

  var docs = yield collection.find().toArray();
  console.log(docs);

  yield db.close();
})();


```

## Notes

Not all methods should be yielded, the rule is: if the methods accepts a callback (e.g. `collection.insert()`), yield it, if it doesn't (e.g. `collection.find()`) don't.

Because all methods have to be wrapped it does mean that when you do things wrong (miss a parameter for example) the error message sometimes isn't very useful. The solution is just to do it right :), check the mongo API, check the co-mongo tests.

It's not yet 100% API compatible, methods that are not implemented are marked as TODO in `lib/<class>.js`.

## Extras

Beyond the standard mongo methods, co-mongo also provides the following convenience methods, this is mainly inspired by [martinrue](https://twitter.com/martinrue)'s [congo](https://github.com/martinrue/congo) module.

 * `configure(options)`
     - Set the default connection options
     - Options:
        - **host** `{string}` MongoDB host name (default: `127.0.0.1`)
        - **port** `{int}` MongoDB port number (default: `27017`)
        - **name** `{string}` MongoDB database name (default: `test`)
        - **pool** `{int}` MongoDB poolSize (default: `5`)
        - **collections** `{array[string]}` These collection will be attached, automatically, to the `db` object returned by `comongo.get()` (see example)

 * `get()`
     - Returns a db object (see example)

### Example

```js
var comongo = require('co-mongo');

comongo.configure({
    host: '127.0.0.1',
    port: 27017,
    name: 'mydb',
    pool: 10,
    collections: ['users', 'products', 'orders']
});

co(function *() {
    var db = yield comongo.get();

    // Collections attached to db object
    var users db.users.find().toArray();
    console.log(users);

    yield db.close();
})();
```

## License

The MIT License (MIT)

Copyright (c) 2014 Thom Seddon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
