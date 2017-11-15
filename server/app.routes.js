db = require('./app.db.js');
const mongoose = require('mongoose');
const request = require('request');
const asyncLoop = require('node-async-loop');
const _ = require('underscore');
Query = require('./app.query.js');
Permissions = require('./app.permissions.js');
var User = require("./models/user");
var Project = require("./models/project");
var File = require("./models/file");
var IRB = require("./models/irb");
var Permission = require("./models/permission");

const jwt = require('jsonwebtoken');

function privateQuery (req) {
    var queryString = req.params.query;
    var route = req.route.path.split('/')[2];
    var method = req.method;
    console.log('in privateQuery function: ', queryString, '||', route, '||', method);

    var query = {};
    if (queryString.indexOf(";") > -1) {
        queryString.split(";").forEach(function(q){
            if(q.split(":")[0] == '_id' ||
               q.split(":")[0] == 'Project' ||
               q.split(":")[0] == 'User'||
               q.split(":")[0] == 'Author') {
                var obj = {};
                obj['$in'] = q.split(":")[1].split(",").map(function(p){
                    return mongoose.Types.ObjectId(p);
                });
                console.log('Before Where Clause: ', JSON.stringify(obj));
                if (q.split(":")[0] == 'Project') {
                    obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m.Project));
                } else if (q.split(":")[0] == 'User' || q.split(":")[0] == 'Author') {
                    obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m.User));
                } else if (q.split(":")[0] == '_id') {
                    if (route == 'permissions') {
                        obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m._id));
                    } else if (route == 'projects') {
                        obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m.Project));
                    } else if (route == 'users') {
                        obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m.User));                        
                    }
                }
                console.log('After Where Clause: ', JSON.stringify(obj));
                query[q.split(":")[0]] = obj;
               } else {
                query[q.split(":")[0]] = q.split(":")[1];
                console.log("YES1, WHY WE ARE HERE?: ", query);
               } 
        });
    } else {
        if (queryString.split(":")[0] == '_id' || 
            queryString.split(":")[0] == 'User' || 
            queryString.split(":")[0] == 'Author' || 
            queryString.split(":")[0] == 'Project') {
            var arr = queryString.split(":")[1].split(",").map(function (p) {
                            return mongoose.Types.ObjectId(p);
                        });
            var obj = {};
            obj['$in'] = arr;
            console.log('Before Where Clause: ', JSON.stringify(obj));
            if (queryString.split(":")[0] == 'Project') {
                obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m.Project));
            } else if (queryString.split(":")[0] == 'User' || queryString.split(":")[0] == 'Author') {
                obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m.User));
            } else if (queryString.split(":")[0] == '_id') {
                if (route == 'permissions') {
                    obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m._id));
                } else if (route == 'projects') {
                    obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m.Project));
                } else if (route == 'users') {
                    obj['$in'] = _.intersection(obj['$in'], req.permissions.map(m => m.User));                        
                }
            }
            console.log('After Where Clause: ', JSON.stringify(obj));

            query[queryString.split(":")[0]] = obj;
        } else {
            query = JSON.parse(queryString);
            console.log("YES2, WHY WE ARE HERE?: ", query);
        }
    }
    console.log('B- ', query);
    return query;
}

function processResult(req, res, next) {
    // console.log('req.userID: ', req.userID);
    // console.log('req.permissions: ', req.permissions);
    console.log(Object.keys(req.route.methods), ' : ', req.route.path);
    // console.log('req.userID: ', req.userID);
    // console.log('req.isAuthenticated: ', req.isAuthenticated);
    // console.log('req.permissions: ', req.permissions);
    return function (err, data) {
        if (err) {
            console.log(err);
            res.status(404).send("Not Found").end();
        } else {
            res.json(data).end();
            // if (req.method == 'GET' || req.method == 'PUT' || req.method == 'DELETE'){
            //     if (data.length > 0) {
            //         if('Name' in data[0]) {
            //             // Project Array
            //             console.log('Validation Project Object Array');
            //             var projectIDs = _.uniq(data.map(m => m._id.toString()));
            //             var projectIDs_permissions = _.uniq(req.permissions.map(m => m.Project.toString()));
            //             if ( _.difference(projectIDs, projectIDs_permissions).length == 0) {
            //                 console.log('Project Array: yay');
            //                 res.json(data).end();
            //             } else {
            //                 console.log('did not pass validaiton');
            //                 console.log('projectIDs: ', projectIDs);
            //                 console.log('projectIDs_permissions: ', projectIDs_permissions);
            //                 console.log(_.difference(projectIDs, projectIDs_permissions).length);
            //                 res.status(404).send("Did not pass validation").end();
            //             }
            //         } else if ('Role' in data[0]) {
            //             // Permission Array
            //             console.log('Validation Permission Object Array');
            //             var permissionIDs = _.uniq(data.map(m => m._id.toString()));
            //             var permissionIDs_permissions = _.uniq(req.permissions.map(m => m._id.toString()));
            //             if ( _.difference(permissionIDs, permissionIDs_permissions).length == 0) {
            //                 console.log('Permission Array: yay');
            //                 res.json(data).end();
            //             } else {
            //                 console.log('did not pass validaiton');
            //                 console.log("permissionIDs", permissionIDs);
            //                 console.log("permissionIDs_permissions", permissionIDs_permissions);
            //                 res.status(404).send("Did not pass validation").end();
            //             }
            //         } else if ('Email' in data[0]){
            //             // User Array
            //             console.log('Validation User Object Array');
            //             var userIDs = _.uniq(data.map(m => m._id.toString()));
            //             var userIDs_permissions = _.uniq(req.permissions.map(m => m.User.toString()));
                        
            //             if ( _.difference(userIDs, userIDs_permissions).length == 0) {
            //                 console.log('User Array: yay');
            //                 res.json(data).end();
            //             } else {
            //                 console.log('did not pass validaiton');
            //                 console.log("userIDs", userIDs);
            //                 console.log("userIDs_permissions", userIDs_permissions);
            //                 console.log(_.difference(userIDs, userIDs_permissions));
            //                 res.status(404).send("Did not pass validation").end();
            //             }
            //         } else {
            //             console.log('WHY ARE WE HERE? ', data);
            //         }
            //     } else {
            //         if('Name' in data) {
            //             // Project Array
            //             console.log('Validation Project Object ');
                         
            //             console.log('projectIDs: ', data._id);
            //             var projectIDs_permissions = _.uniq(req.permissions.map(function(m){
            //                 return m.Project;
            //             }));
            //             console.log('projectIDs_permissions: ', projectIDs_permissions);
            //         } else if ('Role' in data) {
            //             // Permission Array
            //             console.log('Validation Permission Object');
        
            //         } else if ('Email' in data){
            //             // User Array
            //             console.log('Validation User Object');
        
            //         } else {
            //             console.log('Data is a single object, None of the three Data Model...', data);
            //         }
            //     }
            // } else {
            //     console.log('&&&&&&&&&&&&&&&', req.method);
            //     console.log('req.body: ', req.body);
            //     console.log('req.isAuthenticated: ', req.isAuthenticated);
            //     res.json(data).end();
            // }
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

    app.get('/api/projects/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            var query = privateQuery(req);
            Project.find(query, processResult(req, res));
        }
    });

    app.post('/api/projects', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            if (req.body.Author.toString() != req.userID) {
                console.log('req.body.Author: ', req.body.Author.toString());
                console.log('typeof(req.body.Author): ', typeof(req.body.Author));
                console.log('req.userID: ', req.userID);
                console.log('And they are not equal, cannot write to database');
            } else {
                Project.create(req.body, processResult(req, res));
            }    
        }
    });

    app.put('/api/projects/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            // console.log('GET projects/:query, ', req.params.query);
            var query = privateQuery(req);
            // console.log('privateQuery() processed: ', query);
            Project.findOneAndUpdate(query, req.body, { upsert: false }, processResult(req, res));
        }
    });

    app.delete('/api/projects/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            // console.log('GET projects/:query, ', req.params.query);
            var query = privateQuery(req);
            // console.log('privateQuery() processed: ', query);
            Project.remove(query, processResult(req, res));
        } 
    });

    //#endregion

    //#region PERMISSIONS

    app.get('/api/permissions/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            // console.log('GET projects/:query, ', req.params.query);
            var query = privateQuery(req);
            // console.log('privateQuery() processed: ', query);
            Permission.find(query, processResult(req, res));
        }
    });

    app.post('/api/permissions', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            if (req.body.User.toString() != req.userID || 
                _.intersection(req.body.Project, req.permissions.map(m => m.Project) )) {
                console.log('req.body.User: ', req.body.User.toString());
                console.log('req.userID: ', req.userID);
                console.log('req.body.Project: ', req.body.Project);
                console.log('req.permissions.map(m => m.Project): ', req.permissions.map(m => m.Project));
            } else {
                Permission.create(req.body, processResult(req, res));
            }
        }
    });
    
    app.put('/api/permissions/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            // console.log('GET projects/:query, ', req.params.query);
            var query = privateQuery(req);
            // console.log('privateQuery() processed: ', query);
            Permission.findOneAndUpdate(query, req.body, { upsert: false }, processResult(req, res));
        }
    });
    
    app.delete('/api/permissions/:query', Permissions.jwtVerification, function (req, res, next) {
        console.log('&& authenticated DELETE api/permissions/:query ', req.params.query);
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            // console.log('GET projects/:query, ', req.params.query);
            var query = privateQuery(req);
            // console.log('privateQuery() processed: ', query);
            Permission.remove(query, processResult(req, res));
        }
    });

    //#endregion

    //#region USERS

    app.post('/api/users', function (req, res, next) {
        User.create(req.body, processResult(req, res));
        console.log('***** NO AUTH is REQUIRED ****');
    });

    app.get('/api/users/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            // console.log('GET projects/:query, ', req.params.query);
            var query = privateQuery(req);
            // console.log('privateQuery() processed: ', query);
            User.find(query, processResult(req, res));
        }
    });

    app.put('/api/users/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            // console.log('GET projects/:query, ', req.params.query);
            var query = privateQuery(req);
            // console.log('privateQuery() processed: ', query);
            User.findOneAndUpdate(query, req.body, { upsert: false }, processResult(req, res));
        }
    });

    app.delete('/api/users/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            // console.log('GET projects/:query, ', req.params.query);
            var query = privateQuery(req);
            // console.log('privateQuery() processed: ', query);
            User.remove(query, req.body, processResult(req, res));
        }
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
                        res.status(200).send("Not Found or No File has been uploaded yet.").end();
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
        }); 
    })

    app.delete('/api/files/:id', Permissions.jwtVerification, function (req, res) {
        console.log("in file delete");
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
