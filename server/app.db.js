const mongoose = require('mongoose');

var db;
function getConnection() {
    return new Promise( (resolve, reject) => {
        if (db && db.open) {
            resolve(db);
        } else {
            mongoose.connect(
                process.env.MONGO_CONNECTION, {
                    db: {
                        native_parser: true
                    },
                    reconnectTries: Number.MAX_VALUE,
                    poolSize: 5,
                    replicaSet: 'rs0',
                    user: process.env.MONGO_USERNAME,
                    pass: process.env.MONGO_PASSWORD,
                    useMongoClient: true
                });
            db = mongoose.connection;
            db.once("open", () => resolve(db) );
        }
    })    
}

module.exports = {
    getConnection: getConnection
}