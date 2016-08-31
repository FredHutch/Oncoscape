// Imports
const MongoClient = require('mongodb').MongoClient, assert = require('assert');
const comongo = require('co-mongodb');
const co = require('co');
const url = 'mongodb://localhost:27017/os';

var importSort = require("./generate_ascending_sort_export.js");
var importGroup = require("./generate_groupings_export.js");

//******************************************************************************************************
//******************************************************************************************************

var getDiseaseCollectionNames = (function (docs) {
    var collectionCount = Object.keys(docs).length;
    var collectionNames = [];

    //loop through collection name file, pulling out disease names
    for (var i=0; i<collectionCount; i++){
        // console.log(docs[i].disease);
        var diseaseLength = Object.keys(docs[i].collections).length;
        var diseaseName = docs[i].disease;

        diseaseCollectionKeys = Object.keys(docs[i].collections);
        diseaseCollectionKeysCount = diseaseCollectionKeys.length;

        //loop through each disease, pulling out collection names for each disease
        for (var j=0; j<diseaseCollectionKeysCount; j++){
            var diseaseKey = Object.keys(docs[i].collections)[j];
            var diseaseCollectionName = docs[i].collections[diseaseKey];
            collectionNames.push({disease:docs[i].disease,collection:diseaseCollectionName});
        }   
    }

    return collectionNames;
})

Array.prototype.unique = function() {
    return this.reduce(function(accum, current) {
        if (accum.indexOf(current) < 0) {
            accum.push(current);
        }
        return accum;
    }, []);
}

var getCollectionFields = function(collectionDoc){
    collectionFields = [];
    collectionDocLength = collectionDoc.length;
    for(var i=0; i<collectionDocLength; i++){
        keys = Object.keys(collectionDoc[i]);
        docLength = Object.keys(collectionDoc[i]).length;
        for(var j=0; j<docLength; j++){
            collectionFields.push(keys[j])
        }
    }
    return (collectionFields.unique());
}

var scanCollection = function(collectionDoc){
    //get fields in collection
    var collectionFields = getCollectionFields(collectionDoc);

    //filter out unwanted fields
    collectionFields = collectionFields.filter(function(f){
        if(f=="patient_ID") return false;
        return true;
    });

    // var collectionFieldsLength = collectionFields.length;
    // for(var i=1; i<collectionFieldsLength; i++){
    //     // console.log(collectionFields[i]);
        
    //     // var collectionReduced = collectionDoc.map(function(curr){
    //     //     //field listed as "field"
    //     //     return {patient_ID:curr.patient_ID, field:curr.collectionFields[i]};
    //     // })
    // }
    // console.dir(collectionReduced);

    // collectionDocKeys = Object.keys(collectionDoc);
    return collectionFields;
}

//******************************************************************************************************
//******************************************************************************************************

connError = function(e){
    console.log(e);
}

co(function *() {
    var collectionName = 'lookup_oncoscape_datasources';
    var collectionNameToInsertTo = 'render_patient';

    var db = yield comongo.client.connect(url);
    var collection = yield comongo.db.collection(db,collectionName);
    //get list of collections
    var docs = yield collection.find({},{disease:1,collections:1,_id:0}).toArray();
    var collectionNames = getDiseaseCollectionNames(docs);
    var collectionNamesLength = collectionNames.length;

    //get secondary sorting values
    var secondarySortCollectionName = 'edge_brca_oncovogel274_patient_weight';
    var collection2 = yield comongo.db.collection(db,secondarySortCollectionName);
    fields = {_id:0};
    var secondarySortDocs = yield collection2.find({},fields).toArray();
    var secondarySortDocsLength = secondarySortDocs.length;
    for(var i=0; i<secondarySortDocsLength; i++){
        secondarySortDocs[i]=[Object.keys(secondarySortDocs[i])[0], secondarySortDocs[i][Object.keys(secondarySortDocs[i])]];
    }

    //loop through collections
    // for(var i=0; i<collectionNamesLength; i++){
        collectionName = collectionNames[0].collection;
        datasetLabel = collectionNames[0].disease;
        //change [0] to [i] to run all collections
        collection = yield comongo.db.collection(db,collectionName);
        var collectionDoc = yield collection.find({},{_id:0}).toArray();
        collectionFields = scanCollection(collectionDoc);
        collectionFieldsLength = collectionFields.length;

        for(var j=0; j<collectionFieldsLength; j++){
            field = collectionFields[j];
            if(typeof collectionDoc[0][collectionFields[j]]=='number'){
                console.log("if number")
                //call sorting functions
                var docSortedObj = importSort.clusterAssignPoints(collectionDoc,field);
            }
            if(typeof collectionDoc[0][collectionFields[j]]=='string'){
                console.log("if string")
                //secondary sort, group by value, format for db insertion, insert into db
                var docsAllFields = yield importGroup.secondarySort(collectionDoc,secondarySortDocs,field);
                //call grouping functions
                var docSortedObj = importGroup.clusterGroupByValue(docsAllFields,field);
            }

            var categoryLabel = field;
            
            var docToInsert = importGroup.formatDocsForInsertion(docSortedObj.allDocs,docSortedObj.annotation,datasetLabel,categoryLabel);
            console.dir(docToInsert)
        }
    // }

}).catch(connError);











