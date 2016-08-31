// Imports
const fs = require("fs");
const excelbuilder = require('msexcel-builder');
const MongoClient = require('mongodb').MongoClient, assert = require('assert');
const comongo = require('co-mongodb');
const co = require('co');
const url = 'mongodb://localhost:27017/os';

//const
const ENUM_COLUMN = 4;
const VALUE_COLUMN = 5;

// Read Data & Create Useful Collections
var data = JSON.parse(fs.readFileSync("enumeration_data_filtered.json", "utf8"));
var categories = Object.keys(data);

// Helper Functions
var fnGetEnumsByCategory = function(categoryName){
    return Object.keys(data[categoryName])
};
var fnGetValuesByCategoryEnum = function(categoryName, enumName){
    return data[categoryName][enumName];
};
var fnWriteCategoryWorksheet = function(sheet, category, rowNumber){
    rowNumber += 1;
}
var fnWriteEnumRow = function(sheet, enumName, rowNumber){
    sheet.set(ENUM_COLUMN, rowNumber, enumName);
};
var fnWriteValueRow = function(sheet, value, rowNumber){
    sheet.set(VALUE_COLUMN, rowNumber, value);
};
var fnWriteDiseaseColumnRow = function(sheet,col,rowNumber,value){
    sheet.set(col,rowNumber,value);
}
var diseaseColumnLookup = function(disease){
    switch(disease){
        case ("acc"): return 6;
        case ("blca"): return 7;
        case ("brca"): return 8;
        case ("cesc"): return 9;
        case ("chol"): return 10;
        case ("coad"): return 11;
        case ("dlbc"): return 12;
        case ("esca"): return 13;
        case ("gbm"): return 14;
        case ("hnsc"): return 15;
        case ("kich"): return 16;
        case ("kirc"): return 17;
        case ("kirp"): return 18;
        case ("laml"): return 19;
        case ("lgg"): return 20;
        case ("lich"): return 21;
        case ("luad"): return 22;
        case ("lusc"): return 23;
        case ("meso"): return 24;
        case ("ov"): return 25;
        case ("paad"): return 26;
        case ("pcpg"): return 27;
        case ("prad"): return 28;
        case ("read"): return 29;
        case ("sarc"): return 30;
        case ("skcm"): return 31;
        case ("stad"): return 32;
        case ("tgct"): return 33;
        case ("thca"): return 34;
        case ("thym"): return 35;
        case ("ucec"): return 36;
        case ("ucs"): return 37;
        case ("uvm"): return 38;
    }
}



//******************************************************************************************************
//******************************************************************************************************

var checkIfEnumPresent = function(categoryName,valueToWrite,matchingNamesArray) {
    var present = [];
    var matchingNamesArrayLength = matchingNamesArray.length;
    for(var i=0; i<matchingNamesArrayLength; i++){
            if(matchingNamesArray[i].enum == valueToWrite){
                var diseaseName = matchingNamesArray[i].diseaseName;
                present.push(matchingNamesArray[i].diseaseName);
            }
    }
    return present;
}

//******************************************************************************************************
//******************************************************************************************************
var matchingNamesArray = [];


connError = function(e){
    console.log(e);
}

co(function *() {
    var collectionName = 'lookup_oncoscape_datasources';
    var category = 'age_at_diagnosis';
    var categoryLabel = 'Age at Diagnosis';
    var datasetLabel = 'brca';
    var collectionNameToInsertTo = 'render_patient';

    var db = yield comongo.client.connect(url);
    var collection = yield comongo.db.collection(db,collectionName);
    var docs = yield collection.find().toArray();

    var colEnumsDoc = require('./col_enumerations.json');
    var enumDataFile = require('./enumeration_data_filtered.json');
    var worksheetNames = Object.keys(enumDataFile);
    var worksheetNamesCount = worksheetNames.length;

    var collectionCount = Object.keys(docs).length;
    var collectionNames = [];

    //loop through collection name file, pulling out disease names
    for (var i=0; i<collectionCount; i++){
        var diseaseLength = Object.keys(docs[i].collections).length;
        var diseaseName = docs[i].disease;

        diseaseCollectionKeys = Object.keys(docs[i].collections);
        diseaseCollectionKeysCount = diseaseCollectionKeys.length;

    	//loop through each disease, pulling out collection names for each disease
        for (var j=0; j<diseaseCollectionKeysCount; j++){
            var diseaseKey = Object.keys(docs[i].collections)[j];
            var diseaseCollectionName = docs[i].collections[diseaseKey];
        
            //now get the collections for this disease
            collection = yield comongo.db.collection(db,diseaseCollectionName);
            diseaseCollectionDoc = yield collection.find().toArray();

            var diseaseCollectionDocLength = Object.keys(diseaseCollectionDoc).length;

            //loop through disease's collection, pulling out keys
            for(var k=0; k<diseaseCollectionDocLength; k++){
                var diseaseDocKeys = Object.keys(diseaseCollectionDoc[k]);
                var diseaseDocKeysLength = diseaseDocKeys.length;
    	

    			//loop through each key in the disease's collection (field name that contains the value to be validated)
                for(var l=0; l<diseaseDocKeysLength; l++){
                    keyConcat = diseaseDocKeys[l];

                    var colEnums = Object.keys(colEnumsDoc);
                    colEnumsLength = colEnums.length;

                    //loop through colEnums to find col enum names
                    for(var m=0; m<colEnumsLength; m++){
                        var colEnumsKeys = Object.keys(colEnumsDoc[colEnums[m]]);
                        var colEnumsKeysLength = colEnumsKeys.length;

                        //loop through each col enum name, pulling out values
                        for(var n=0; n<colEnumsKeysLength; n++){
                            var colEnumsKeysValue = colEnumsKeys[n];
                            var colEnumsKeysValueKeys = colEnumsDoc[colEnums[m]][colEnumsKeysValue];
                            var colEnumsKeysValueKeysLength = colEnumsKeysValueKeys.length;

                            //loop through each value, comparing the value and col enum name back to the enum's field name (keyConcat)
                            for(var o=0; o<colEnumsKeysValueKeysLength; o++){

                                if(keyConcat==colEnumsKeysValue || keyConcat==colEnumsKeysValueKeys[o]
                                    ||keyConcat==colEnumsKeysValue+"1" || keyConcat==colEnumsKeysValueKeys[o]+"1"
                                    ||keyConcat==colEnumsKeysValue+"2" || keyConcat==colEnumsKeysValueKeys[o]+"2"){
                                    keyConcat = colEnums[m];
                                }
                            }
                        }
                    }

                    //loop through the list of worksheet names, pulling out each worksheet name
                    for(var m=0; m<worksheetNamesCount; m++){
                        var worksheetName = worksheetNames[m];

            			//compare enumerated column name to the worksheet name, if they match continue with comparison
                        if (keyConcat==worksheetName){
                            var enumNames = Object.keys(enumDataFile[worksheetNames[m]]);
                            var enumNamesCount = enumNames.length;

                            var diseaseDocKeysValue = diseaseCollectionDoc[k][diseaseDocKeys[l]];
                        if(diseaseDocKeysValue.slice(-1)=='1'){console.log(diseaseDocKeysValue)};
                            //loop through each enum name
                            for(var n=0; n<enumNamesCount; n++) {
                                var enumValues = enumDataFile[worksheetNames[m]][enumNames[n]];
                                var enumValuesCount = enumValues.length;

                                for(var o=0; o<enumValuesCount; o++){
                                    var enumValuesToCompare = enumValues[o];
                                    var enumValuesToCompareCount = enumValuesToCompare.length;

                                        if(diseaseDocKeysValue==enumValuesToCompare || diseaseDocKeysValue==enumNames[n]){
                                            var matchingNamesArrayLength = matchingNamesArray.length;

                                            if(matchingNamesArrayLength==0){
                                                matchingNamesArray.push({"worksheetName":worksheetName,"diseaseName":diseaseName,"enum":enumValuesToCompare,"count":1});
                                            } else {
                                                var match = false;
                                                for(var p=0; p<matchingNamesArray.length; p++){
                                                    if(matchingNamesArray[p].worksheetName==worksheetName && matchingNamesArray[p].diseaseName==diseaseName && matchingNamesArray[p].enum==enumValuesToCompare){
                                                        match = true;
                                                        matchingNamesArray[p].count++;
                                                        break;
                                                    }
                                                }
                                                if(!match){
                                                    matchingNamesArray.push({"worksheetName":worksheetName,"diseaseName":diseaseName,"enum":enumValuesToCompare,"count":1});
                                                }
                                            }
                                        }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    yield comongo.db.close(db);















// console.log("next write workbook");

    //create Excel workbook
    var workbook = excelbuilder.createWorkbook('./', 'enumeration_worksheet.xlsx')

    //write worksheet column headers
    for (var i=0; i<categories.length; i++){
        var rowNumber = 2;
        var categoryName = categories[i];
        var sheet = workbook.createSheet(categoryName, 38, 1500);

        fnWriteCategoryWorksheet(sheet, categoryName, rowNumber);

        sheet.set(4,1,"Enumeration Name");
        sheet.set(1,1,"Yes");
        sheet.set(2,1,"No");
        sheet.set(3,1,"Comments");
        sheet.set(diseaseColumnLookup("acc"),1,"acc");
        sheet.set(diseaseColumnLookup("blca"),1,"blca");
        sheet.set(diseaseColumnLookup("brca"),1,"brca");
        sheet.set(diseaseColumnLookup("cesc"),1,"cesc");
        sheet.set(diseaseColumnLookup("chol"),1,"chol");
        sheet.set(diseaseColumnLookup("coad"),1,"coad");
        sheet.set(diseaseColumnLookup("dlbc"),1,"dlbc");
        sheet.set(diseaseColumnLookup("esca"),1,"esca");
        sheet.set(diseaseColumnLookup("gbm"),1,"gbm");
        sheet.set(diseaseColumnLookup("hnsc"),1,"hnsc");
        sheet.set(diseaseColumnLookup("kich"),1,"kich");
        sheet.set(diseaseColumnLookup("kirc"),1,"kirc");
        sheet.set(diseaseColumnLookup("kirp"),1,"kirp");
        sheet.set(diseaseColumnLookup("laml"),1,"laml");
        sheet.set(diseaseColumnLookup("lgg"),1,"lgg");
        sheet.set(diseaseColumnLookup("lich"),1,"lich");
        sheet.set(diseaseColumnLookup("luad"),1,"luad");
        sheet.set(diseaseColumnLookup("lusc"),1,"lusc");
        sheet.set(diseaseColumnLookup("meso"),1,"meso");
        sheet.set(diseaseColumnLookup("ov"),1,"ov");
        sheet.set(diseaseColumnLookup("paad"),1,"paad");
        sheet.set(diseaseColumnLookup("pcpg"),1,"pcpg");
        sheet.set(diseaseColumnLookup("prad"),1,"prad");
        sheet.set(diseaseColumnLookup("read"),1,"read");
        sheet.set(diseaseColumnLookup("sarc"),1,"sarc");
        sheet.set(diseaseColumnLookup("skcm"),1,"skcm");
        sheet.set(diseaseColumnLookup("stad"),1,"stad");
        sheet.set(diseaseColumnLookup("tgct"),1,"tgct");
        sheet.set(diseaseColumnLookup("thca"),1,"thca");
        sheet.set(diseaseColumnLookup("thym"),1,"thym");
        sheet.set(diseaseColumnLookup("ucec"),1,"ucec");
        sheet.set(diseaseColumnLookup("ucs"),1,"ucs");
        sheet.set(diseaseColumnLookup("uvm"),1,"uvm");

        var categoryEnums = fnGetEnumsByCategory(categoryName);

    // var countWritten = 0;
        //write enumeration names
        for(var j=0; j<categoryEnums.length; j++){
            var enumToWrite = categoryEnums[j];
            fnWriteEnumRow(sheet, enumToWrite, rowNumber);
            rowNumber += 1;

            //enumValues are the values listed in the xls
            var enumValues = fnGetValuesByCategoryEnum(categoryName,enumToWrite);

            //write value
            for(var k=0; k<enumValues.length; k++){
                var valueToWrite = enumValues[k];

                var present = [];
                present = checkIfEnumPresent(categoryName,valueToWrite,matchingNamesArray);
                presentLength = present.length;

                fnWriteValueRow(sheet, valueToWrite, rowNumber);

                if(presentLength > 0){
                    for(var l=0; l<present.length; l++){
                        var diseaseColumn = diseaseColumnLookup(present[l]);
                        fnWriteDiseaseColumnRow(sheet,diseaseColumn,rowNumber,1);
            // countWritten++;
                    }
                }

                rowNumber += 1;
            }
        }
    }

    // console.log("written: "+countWritten);
    workbook.save(function(ok){
        if (!ok) 
          workbook.cancel();
        else
          console.log('congratulations, your workbook created');
    });

}).catch(connError);











