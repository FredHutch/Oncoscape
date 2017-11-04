db = require('./app.db.js');
const request = require('request');
const asyncLoop = require('node-async-loop');
Query = require('./app.query.js');
Permissions = require('./app.permissions.js');
var User = require("./models/user");
var Project = require("./models/project");
var File = require("./models/file");
var IRB = require("./models/irb");
var Permission = require("./models/permission");

const jwt = require('jsonwebtoken');

function processResult(req, res, next, query) {
    return function (err, data) {
        if (err) {
            console.log(err);
            res.status(404).send("Not Found").end();
        } else {
            res.json(data).end();
        }
    };
};

function checkUserExistance(gmail){
    return new Promise((resolve, reject) => {
        User.findOne({"Gmail": gmail }, function(req, result){
           resolve(result);
        });
    });   
}


var init = function (app) {

    app.get("/api/ping", function (req, res, next) {
        res.send((new Date()).toString());
        res.end();
    });
    app.post('/api/token', function(req, res, next) {
        // Pull Token Out Of Request Body
        var token = req.body.token;
        request({ url: 'https://www.googleapis.com/oauth2/v3/userinfo', qs: { access_token: token }, method: 'POST', json: true },
        function (err, response, body) {
            // Google Returns Email Address For Token
            checkUserExistance(body.email).then(user => {
                if (user != null){
                    Permissions.getToken(db, body.email).then(jwtTokens => {
                        res.send({token: jwtTokens }).end();
                    });
                } else {
                    res.send({gmail: body.email}).end();
                }
            });
        });
    }); 
    app.post('/api/users/checkGmail/:gmail', function(req, res, next){
        checkUserExistance(req.params.gmail).then(user => {
            res.send({user: user}).end();
        })
    });
    //#region PROJECTS

    app.get('/api/projects', Permissions.jwtVerification, function (req, res, next) {
        Project.find({}, processResult(req, res));
        // next();
    });
    app.post('/api/projects', Permissions.jwtVerification, function (req, res, next) {
        Project.create(req.body, processResult(req, res));
    });
    app.get('/api/projects/:id', Permissions.jwtVerification,  function (req, res, next) {
        Project.findById(req.params.id, processResult(req, res));
    });
    app.put('/api/projects/:id', Permissions.jwtVerification, function (req, res, next) {
        Project.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
    });
    app.delete('/api/projects/:id', Permissions.jwtVerification, function (req, res, next) {
        Project.remove({ _id: req.params.id }, processResult(req, res));
    });

    //#endregion

    //#region PERMISSIONS

    app.get('/api/permissions', Permissions.jwtVerification, function (req, res, next) {

        // if (!req.isAuthenticated) return 404
        // Permission.find({User: req.userid}, processResult(req, res));

        Permission.find({}, processResult(req, res));
    });
    app.post('/api/permissions', Permissions.jwtVerification, function (req, res, next) {
        console.log('what do we received from client: ', req.body);

        // if (!req.isAuthenticated) return 404
        // Query Mongo To Determine If req.userid has write or admin permissions on the req.body.projectId
        // If Not Return 404

        Permission.create(req.body, processResult(req, res));
    });
    app.get('/api/permissions/:id', Permissions.jwtVerification, function (req, res, next) {

        // if (!req.isAuthenticated) return 404
        // Add The User Where Clause - Permission.find({User: req.userid}, processResult(req, res));
        // Find {_id: req.params.id, user=req.userid} 
        Permission.findById(req.params.id, processResult(req, res));
    });
    app.put('/api/permissions/:id', Permissions.jwtVerification, function (req, res, next) {

        // if (!req.isAuthenticated) return 404
        // Add The User Where Clause - Permission.find({User: req.userid}, processResult(req, res));
        // Find {_id: req.params.id, user=req.userid} 
        Permission.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
    });
    app.delete('/api/permissions/:id', Permissions.jwtVerification, function (req, res, next) {
        Permission.remove({ _id: req.params.id }, processResult(req, res));
    });

    //#endregion

    //#region USERS
    app.get('/api/users', Permissions.jwtVerification, function (req, res, next) {
        try{
            User.find({}, processResult(req, res));
        }catch(e){
            debugger;
        }
    });
    app.post('/api/users', function (req, res, next) {
        User.create(req.body, processResult(req, res));
    });
    app.get('/api/users/:id', Permissions.jwtVerification, function (req, res, next) {
        User.findById(req.params.id, processResult(req, res));
    });
    app.put('/api/users/:id', Permissions.jwtVerification, function (req, res, next) {
        User.findOneAndUpdate({ _id: req.params.id }, req.body, { upsert: false }, processResult(req, res));
    });
    app.delete('/api/users/:id', Permissions.jwtVerification, function (req, res, next) {
        User.remove({ _id: req.params.id }, processResult(req, res));
    });

    //#endregion

    //#region FILES

    app.get('/api/files', Permissions.jwtVerification, function (req, res) {
        console.log("in Files");
        res.status(200).end();
    });

    app.post('/api/files', Permissions.jwtVerification, function (req, res) {
        console.log("in post");
    });

    app.get('/api/files/:id', Permissions.jwtVerification, function (req, res) {
        var projectID = req.params.id;
        console.log('IN api/files/:id');
        db.getConnection().then(db => {
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
                        console.log('In projectCollections.length === 0 block');
                        res.status(200).send("Not Found or No File has been uploaded yet.").end();
                        // res.send('Not Find').end();
                    } else {
                        console.log('projectCollections.length !== 0');
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
        }); 
    })

    app.delete('/api/files/:id', Permissions.jwtVerification, function (req, res) {
        console.log("in delete");
        console.log(req.params.id);
        var projectID = req.params.id;
        db.getConnection().then(db => {
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
    });

    //#endregion

    app.get('/api/:collection/:query', function (req, res, next) {
        var collection = req.params.collection;
        var query = (req.params.query) ? JSON.parse(req.params.query) : {};
        // Permissions.getProjects(req.headers.authorization).then(projects => {
        //     Permissions.hasPermission(projects, collection, permission.ePermission.READ).then(
        //         hasAccess => {
        //             if (hasAccess) {
                        db.getConnection().then(db => {
                            Query.exec(db, collection, query).then(results => {
                                res.send(results);
                                res.end();
                            });
                        });
        //             }
        //         }
        //     )
        // }).catch(e => {
        //     res.send(e);
        //     res.end();
        // })
    });

    app.get('/api/:collection*', function (req, res, next) {
        var collection = req.params.collection;
        var query = {};
        // Permissions.getProjects(req.headers.authorization).then(projects => {
        //     Permissions.hasPermission(projects, collection, permission.ePermission.READ).then(
        //         hasAccess => {
        //             if (hasAccess) {
                        db.getConnection().then(db => {
                            Query.exec(db, collection, query).then(results => {
                                res.send(results);
                                res.end();
                            });
                        });
    //                 }else{ 
    //                     res.end();
    //                 }
    //             }
    //         ) 
    //     }).catch(e => {
    //         res.send(e);
    //         res.end();
    //     });
    });
}


module.exports = {
    init: init
};
