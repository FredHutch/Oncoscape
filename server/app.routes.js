db = require('./app.db.js');
query = require('./app.query.js');

var User = require("./models/user");
var Project = require("./models/project");
var File = require("./models/file");
var IRB = require("./models/irb");
var Permission = require("./models/permission");

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

// PROJECTS
app.get('/api/projects', function (req, res, next) {
    Project.find({}, processResult(req, res));
    next();
});

// USERS
router.get('/', jwtVerification, function (req, res, next) {
    Model.find({}, processResult(req, res));
});
router.post('/', jwtVerification, function (req, res, next) {
    Model.create(req.body, processResult(req, res));
});
router.get('/:id', jwtVerification, function (req, res, next) {
    Model.findById(req.params.id, processResult(req, res));
});
router.put('/:id', jwtVerification, function (req, res, next) {
    Model.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
});
router.delete('/:id', jwtVerification, function (req, res, next) {
    Model.remove({ _id: req.params.id }, processResult(req, res));
});
