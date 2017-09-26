var mongoose = require("mongoose");
var Schema = mongoose.Schema;
 
 //UW5335 FH28775 
var IRBSchema = new Schema({
    IRBNumber: { type: String, required: true},
    IRBTitle: { type: String, required: true},
    PI: {type: Schema.ObjectId, ref: 'User', required: true},
    OtherUsers: [{type: Schema.ObjectId, ref: 'User'}],
    date: {type: Date, default: Date.now}
}, {collection:'Accounts_IRBs'});
module.exports = mongoose.model("IRB", IRBSchema);
