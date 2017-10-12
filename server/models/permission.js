var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var roles = ['admin', 'read-write', 'read-only'];

var permissionSchema = new Schema({
    User: {type: Schema.ObjectId, ref: 'User', required: true},
    Project: {type: Schema.ObjectId, ref: 'Project', required: true},
    Role: {type: String, enum:roles , required: true},
    Date: {type: Date, default: Date.now}
}, {collection:'Accounts_Permissions'});

module.exports= mongoose.model("Permission", permissionSchema);

