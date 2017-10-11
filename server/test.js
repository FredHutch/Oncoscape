console.log("START TEST");
db = require('./app.db.js');
query = require('./app.query.js');
permissions = require('./app.permissions.js');

db.getConnection().then( db => {
    permissions.getToken(db, 'jennylouzhang@gmail.com').then( token => {
        
         permissions.getProjects(token).then( projects => {
             console.dir(projects);
         })
    });
    // query.exec(db, 'Accounts_Users', {}).then( result => {
    //     console.dir(result);
    // });
});