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
app.post('/api/projects', jwtVerification, function (req, res, next) {
    Model.create(req.body, processResult(req, res));
});
app.get('/api/projects/:id', jwtVerification, function (req, res, next) {
    Model.findById(req.params.id, processResult(req, res));
});
app.put('/api/projects/:id', jwtVerification, function (req, res, next) {
    Model.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
});
app.delete('/api/projects/:id', jwtVerification, function (req, res, next) {
    Model.remove({ _id: req.params.id }, processResult(req, res));
});

// PERMISSIONS
app.get('/api/permisisons', jwtVerification, function (req, res, next) {
    Model.find({}, processResult(req, res));
});
app.post('/api/permisisons', jwtVerification, function (req, res, next) {
    Model.create(req.body, processResult(req, res));
});
app.get('/api/permisisons/:id', jwtVerification, function (req, res, next) {
    Model.findById(req.params.id, processResult(req, res));
});
app.put('/api/permisisons/:id', jwtVerification, function (req, res, next) {
    Model.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
});
app.delete('/api/permisisons/:id', jwtVerification, function (req, res, next) {
    Model.remove({ _id: req.params.id }, processResult(req, res));
});

// USERS
app.get('/api/users', function (req, res, next) {
    Model.find({}, processResult(req, res));
});
app.post('/api/users', function (req, res, next) {
    Model.create(req.body, processResult(req, res));
});
app.get('/api/users/:id', jwtVerification, function (req, res, next) {
    Model.findById(req.params.id, processResult(req, res));
});
app.put('/api/users/:id', jwtVerification, function (req, res, next) {
    Model.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
});
app.delete('/api/users/:id', jwtVerification, function (req, res, next) {
    Model.remove({ _id: req.params.id }, processResult(req, res));
});

// FILES
app.get('/api/files', jwtVerification, function (req, res) {
    console.log("in Files");
    res.status(200).end();
});

app.post('/api/files', jwtVerification, function (req, res) {
    console.log("in post");
});

app.get('/api/files/:id', jwtVerification, function (req, res) {
    console.log("Getting Project-Related Collections...", req.params.id);
    var projectID = req.params.id;
    db.db.listCollections().toArray(function (err, collectionMeta) {
        if (err) {
            console.log(err);
        }
        else {
            projectCollections = collectionMeta.map(function (m) {
                return m.name;
            }).filter(function (m) {
                return m.indexOf(projectID) > -1;
            });

            if (projectCollections.length === 0) {
                res.status(404).send("Not Found").end();
                // res.send('Not Find').end();
            } else {
                var arr = [];

                asyncLoop(projectCollections, function (m, next) {
                    db.collection(m).find().toArray(function (err, data) {
                        var obj = {};
                        obj.collection = m;
                        if (m.indexOf("clinical") > -1) {
                            obj.category = "clinical";
                            obj.patients = data.map(function (m) { return m.id });
                            obj.metatdata = data[0].metadata;
                            obj.enums_fields = data.map(function (m) { return Object.keys(m.enums); })
                                .reduce(function (a, b) { return a = _.uniq(a.concat(b)); });
                            obj.nums_fields = data.map(function (m) { return Object.keys(m.nums); })
                                .reduce(function (a, b) { return a = _.uniq(a.concat(b)); });
                            obj.time_fields = data.map(function (m) { return Object.keys(m.time); })
                                .reduce(function (a, b) { return a = _.uniq(a.concat(b)); });
                            obj.boolean_fields = data.map(function (m) { return Object.keys(m.boolean); })
                                .reduce(function (a, b) { return a = _.uniq(a.concat(b)); });
                            arr.push(obj);
                        } else if (m.indexOf("molecular") > -1) {
                            obj.category = "molecular";
                            var types = _.uniq(data.map(function (m) { return m.type }));
                            types.forEach(function (n) {
                                obj[n] = {};
                                typeObjs = data.filter(function (v) { return v.type === n });
                                obj[n].markers = typeObjs.map(function (v) { return v.marker });
                                obj[n].patients = _.uniq(typeObjs.map(function (v) { return Object.keys(v.data); })
                                    .reduce(function (a, b) { return a = _.uniq(a.concat(b)); }));
                            });
                            arr.push(obj);
                        } else {
                            arr.push(data);
                        }
                        next();
                    });

                }, function (err) {
                    if (err) {
                        console.log(err);
                        res.status(404).send(err).end();
                    } else {
                        res.json(arr).end();
                    }

                });

            }
        }
    });
})

app.delete('/api/files/:id', jwtVerification, function (req, res) {
    console.log("in delete");
    console.log(req.params.id);
    var projectID = req.params.id;
    db.db.listCollections().toArray(function (err, collectionMeta) {
        if (err) {
            console.log(err);
        }
        else {
            collectionMeta.map(function (m) {
                return m.name;
            }).filter(function (m) {
                return m.indexOf(projectID) > -1;
            }).forEach(function (m) {
                db.db.dropCollection(m, function (err, result) {
                    console.log("DELETING", m);
                    if (err) console.log(err);
                    console.log(result);
                });
            });
        }
    });
    res.status(200).send("files are deleted").end();
});


// UPLOAD
