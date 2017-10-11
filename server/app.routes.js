db = require('./app.db.js');
query = require('./app.query.js');


app.get('/api/:collection/:query', jwtVerification, function (req, res, next) {
    var collection = req.params.collection;
    var query = (req.params.query) ? JSON.parse(req.params.query) : {};
    db.getConnection().then( db => {
        query.exec(db, collection, query).then( result => {
            res.send(results);
            res.end();
        });
    });
});

app.get("/api/ping", function (req, res, next) {
    res.send((new Date()).toString());
    res.end();
});
