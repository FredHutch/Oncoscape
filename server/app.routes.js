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
var Openprojects = require("./models/publicprojects");

const jwt = require('jsonwebtoken');

var objectIDArrayCompare = {
    intersection: function(objectIDArray1, objectIDArray2) {
        var strArr1 = _.uniq(objectIDArray1.map(m => String(m)));
        var strArr2 = _.uniq(objectIDArray2.map(m => String(m)));
        return _.intersection(strArr1, strArr2);
      },
    difference: function(objectIDArray1, objectIDArray2) {
        var strArr1 = _.uniq(objectIDArray1.map(m => String(m)));
        var strArr2 = _.uniq(objectIDArray2.map(m => String(m)));
        return _.difference(strArr1, strArr2);
      },
    included: function(objectIDArray1, objectIDArray2) {
        var strArr1 = _.uniq(objectIDArray1.map(m => String(m)));
        var strArr2 = _.uniq(objectIDArray2.map(m => String(m)));
        if(_.intersection(strArr1, strArr2).length == strArr1.length) {
            return true;
        } else {
            return false;
        }
      },
    objIncludes: function(objID, objectIDArray){
        var strArr = _.uniq(objectIDArray.map(m => String(m)));
        if(strArr.IndexOf(String(objID)) > -1) {
            return true;
        } else {
            return false;
        }
    },
    equal: function(objectIDArray1, objectIDArray2) {
        var strArr1 = _.uniq(objectIDArray1.map(m => String(m)));
        var strArr2 = _.uniq(objectIDArray2.map(m => String(m)));
        if(_.intersection(strArr1, strArr2).length == strArr1.length &&
           _.intersection(strArr1, strArr2).length == strArr2.length) {
            return true;
        } else {
            return false;
        }
      }
};

function queryStringConverter (queryString) {
    var query = {};
    Object.keys(queryString).forEach(k => {
        var obj = {};
        if(k == '_id'|| k == 'User' || k == 'Author' || k == 'Project') {
            if (typeof(queryString[k]) != 'string') {
                console.log('type 1: ');
                console.log(queryString);
                console.log('queryString[k].length:', queryString[k]['$in'].length);
                obj['$in'] = queryString[k]['$in'].map(m => mongoose.Types.ObjectId(m)); 
            } else {
                obj['$in'] = [mongoose.Types.ObjectId(queryString[k])];  
            }
            query[k] = obj;
        } else {
            query[k] = queryString[k];
        }
    });
    return query;
}

function processResult(req, res, next) {
    console.log(Object.keys(req.route.methods), ' : ', req.route.path);
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

    app.get('/api/projects/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            // convert queryString to query
            var query = queryStringConverter(JSON.parse(req.params.query));

            // Security: compare to req.permissions
            var permitted = req.permissions.map(m => m.Project);

            if ('_id' in query){
                query['_id'] = objectIDArrayCompare.intersection(query['_id']['$in'], permitted);
            } 
            if ('Author' in query && query['Author']['$in'][0] != req.userID) {
                query = null;
            }
            Project.find(query, processResult(req, res));
        }
    });
    app.post('/api/projects', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            if (JSON.stringify(req.body.Author) != String(req.userID)) {
                res.status(404).send('Author is not the current User, cannot write to database');
            } else {
                console.log('WE ARE ABLE TO POST PROJECT');
                Project.create(req.body, processResult(req, res));
            }    
        }
    });
    app.put('/api/projects/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            var query = queryStringConverter(JSON.parse(req.params.query));
            if (!'_id' in query) {res.status(404).send('Query doesn\'n have _id field!');};
            var permission = req.permissions.find( v => String(v.Project) == String(query['_id']['$in'][0]));
            if (permission === null || permission.Role == 'read-only') { 
                res.status(404).send('Current user does NOT have permission to UPDATE the project.'); 
            } else {
                var currentProjectID = String(req.body._id);
                console.log('currentProjectID', currentProjectID);
                var private = req.body.Private;
                console.log('private', private);
                Openprojects.findOne({}, function(req, res){
                    var publicProjects = res['public'];
                    if (!private) {
                        // Author/Admin agree to share the data to public
                        res['public'].push(currentProjectID);
                        res['public'] = _.uniq(res['public']);
                    } else {
                        var index = res['public'].indexOf(currentProjectID);
                        console.log('index', index);
                        if(index > -1) {
                            res['public'].splice(index, 1);
                        }
                    }
                    Openprojects.findOneAndUpdate({}, {'public': res['public']}, { upsert : false}, function(req, res){
                        console.log('Updated Openprojects');
                    });
                });
                Project.findOneAndUpdate(query, req.body, { upsert: false }, processResult(req, res));
            }
        }
    });
    app.delete('/api/projects/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            var query = queryStringConverter(JSON.parse(req.params.query));
            if (!'_id' in query) {res.status(404).send('Query doesn\'n have _id field!');};
            var permission = req.permissions.find( v => String(v.Project) == String(query['_id']['$in'][0]));
            if (permission === null || permission.Role == 'read-only') { 
                res.status(404).send('Current user does NOT have permission to DELETE the project.'); 
            } else {
                Project.remove(query, processResult(req, res));
            }
        } 
    });

    //#endregion

    //#region PERMISSIONS

    app.get('/api/permissions/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
             // convert queryString to query
             var query = queryStringConverter(JSON.parse(req.params.query));
             
             // Security: compare to req.permissions
             var permittedProjects = req.permissions.map(m => m.Project);
             var permittedUsers = req.relatedPermissions.map(m => m.User);
             var permittedIDs = req.permissions.map(m => m._id);
             
             if ('_id' in query){
                query['_id'] = objectIDArrayCompare.intersection(query['_id']['$in'], permittedIDs);
            } else if ('User' in query) {
                query['User'] = objectIDArrayCompare.intersection(query['User']['$in'], permittedUsers);
            } else if ('Project' in query) {
                query['Project'] = objectIDArrayCompare.intersection(query['Project']['$in'], permittedProjects);
            } 

            Permission.find(query, processResult(req, res));
        }
    });

    app.post('/api/permissions', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            var permission = req.permissions.find( v => String(v.Project) == String(req.body.Project));
            if (JSON.stringify(req.body.User) != String(req.userID) && 
                (permission == null || permission.Role == 'read-only')
                ) {
                res.status(404).send('Bad query. Do not have authorization.');
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
            var query = queryStringConverter(JSON.parse(req.params.query));
            Object.keys(query).forEach(k => {
                if (k == '_id') {
                    var currentUserRole;
                    var permission = req.permissions.concat(req.relatedPermissions)
                                        .find( v => String(v._id) == String(query['_id']['$in'][0]));
                    if (String(permission.User) != req.userID) {
                        var per = req.permissions.find( v => JSON.stringify(v.User) == req.userID && JSON.stringify(v.Project) == JSON.stringify(permission.Project));                      
                        currentUserRole = per.Role;                      
                    } else {
                        currentUserRole = permission.Role;
                    }
                    if (permission === null || currentUserRole == 'read-only') { 
                        query = null;
                    } 
                } else if (k == 'User') {
                    var permission = req.relatedPermissions.find( v => String(v.User) == String(query['User']['$in'][0]));
                    if (permission === null || permission.Role == 'read-only') { 
                        query = null;
                    } 
                } else if (k == 'Project') {
                    // There is a situation when deleting the whole project, all the related permissions will be removed from Database.
                    var permissions = req.relatedPermissions.filter( v => String(v.Project) == String(query['Project']['$in'][0]));
                    var currentUserRole = permissions.find( v => JSON.stringify(v.User) == req.userID).Role;
                    if (permissions.length === null || currentUserRole == 'read-only') { 
                        query = null;
                    } 
                } 
            });
            if (query == null ) {
                res.status(404).send('Bad query. Do not have authorization.');
            } else {
                Permission.findOneAndUpdate(query, req.body, { upsert: false }, processResult(req, res));                
            }
        }
    });
    
    app.delete('/api/permissions/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            var query = queryStringConverter(JSON.parse(req.params.query));
            
            Object.keys(query).forEach(k => {
                if (k == '_id') {
                    var currentUserRole;
                    var permission = req.permissions.concat(req.relatedPermissions)
                                        .find( v => String(v._id) == String(query['_id']['$in'][0]));
                    if (String(permission.User) != req.userID) {
                        var per = req.permissions.find( v => JSON.stringify(v.User) == req.userID && JSON.stringify(v.Project) == JSON.stringify(permission.Project));                      
                        currentUserRole = per.Role;                      
                    } else {
                        currentUserRole = permission.Role;
                    }
                    if (permission === null || currentUserRole == 'read-only') { 
                        query = null;
                    } 
                } else if (k == 'User') {
                    var permission = req.relatedPermissions.find( v => String(v.User) == String(query['User']['$in'][0]));
                    if (permission === null || permission.Role == 'read-only') { 
                        query = null;
                    } 
                } else if (k == 'Project') {
                    // There is a situation when deleting the whole project, all the related permissions will be removed from Database.
                    var permissions = req.relatedPermissions.filter( v => String(v.Project) == String(query['Project']['$in'][0]));
                    var currentUserRole = permissions.find( v => JSON.stringify(v.User) == req.userID).Role;
                    if (permissions.length === null || currentUserRole == 'read-only') { 
                        query = null;
                    } 
                } 
            });
            if (query == null ) {
                res.status(404).send('Bad query. Do not have authorization.');
            } else {
                Permission.remove(query, processResult(req, res));
            }
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
            // convert queryString to query
            var query = queryStringConverter(JSON.parse(req.params.query));
            
            // Security: compare to req.permissions
            if ('_id' in query) {
                var permission = req.relatedPermissions.find( v => String(v.User) == String(query['_id']['$in'][0]));
                if (JSON.stringify(query['_id']['$in'][0]) != req.userID && permission == null){
                    query['_id'] = null; 
                }
            } else {
                console.log('Just print the query: ', query);
            }
            User.find(query, processResult(req, res));
        }
    });

    app.put('/api/users/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            var query = queryStringConverter(JSON.parse(req.params.query));
            console.log('ARE WE DOING USER UPDATING?');
            console.log(query['_id']);
            console.log(query['_id']['$in']);
            
            console.log('text1');
            if ('_id' in query && JSON.stringify(query['_id']['$in'][0]) != req.userID) {
                res.status(404).send('Not current user, cannot update user profile.');
            } else {
                User.findOneAndUpdate(query, req.body, { upsert: false }, processResult(req, res));                
            }
        }
    });

    // User Deletion is not being used by anyone //
    app.delete('/api/users/:query', Permissions.jwtVerification, function (req, res, next) {
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            var query = queryStringConverter(JSON.parse(req.params.query));
            if (!'_id' in query) {res.status(404).send('Query doesn\'n have _id field!');};
            if (JSON.stringify(query['_id']['$in'][0]) != req.userID) {
                res.status(404).send('Not current user, cannot update user profile.');
            } else {
                User.remove(query, req.body, processResult(req, res));                
            }
        }
    });

    //#endregion

    //#region FILES

    // app.get('/api/files', Permissions.jwtVerification, function (req, res) {
    //     console.log("in Files");
    //     res.status(200).end();
    // });

    // app.post('/api/files', Permissions.jwtVerification, function (req, res) {
    //     console.log(req.body);
    // });

    app.get('/api/files/:id', Permissions.jwtVerification, function (req, res) {
        var projectID = req.params.id;
        // security
        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            var permitted = function(){
                if(req.permissions.length > 0){
                    var per = req.permissions.find(v => v.ProjectID == projectID);
                    if (per != null ) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
    
            if (!permitted) {
                res.status(404).send('The current User does not have access to the uploaded file');
            } else {
                console.log('ABLE TO GET FILE SUMMARY.');

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
                                res.status(200).send("Not Found or No File has been uploaded yet.").end()
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
            }
        }
    });

    app.delete('/api/files/:id', Permissions.jwtVerification, function (req, res) {
        console.log("in file delete");
        console.log(req.params.id);
        var projectID = req.params.id;

        if (!req.isAuthenticated) {
            console.log('!@! NOT AUTH');
            res.status(404).send('Not Authenticated!');
        } else {
            var permitted = function(){
                if(req.permissions.length > 0){
                    var per = req.permissions.find(v => v.ProjectID == projectID);
                    if (per != null && per.Role != 'read-only') {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }
    
            if (!permitted) {
                res.status(404).send('The Current User does not have priviledge to delete file to this project. Please contact the Author of this Dataset.');
            } else {
                console.log('ABLE TO DELETE FILES');
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
            }
        }
    });

    //#endregion
    
    app.get('/api/:collection/:query', Permissions.jwtVerification, function (req, res, next) {
        var collection = req.params.collection;
        var query = (req.params.query) ? JSON.parse(req.params.query) : {};
        if (req.permittedCollections.indexOf(collection.split("_")[0]) > -1) {
            db.getConnection().then(db => {
                Query.exec(db, collection, query).then(results => {
                    res.send(results);
                    res.end();
                });
            });
        } else {
            res.status(404).send('User does NOT have permission to query this collection.');
        }
    });

    app.get('/api/:collection*', Permissions.jwtVerification, function (req, res, next) {
        var collection = req.params.collection;
        var query = {};

        if (req.permittedCollections.indexOf(collection.split("_")[0]) > -1) {
            db.getConnection().then(db => {
                Query.exec(db, collection, query).then(results => {
                    res.send(results);
                    res.end();
                });
            });
        } else {
            res.status(404).send('User does NOT have permission to query this collection.');
        }
    });
}


module.exports = {
    init: init
};
