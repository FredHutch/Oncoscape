var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var comongo = require('co-mongodb');
var co = require('co');

//connection url
var url = 'mongodb://localhost:27017/os';
const X_MIN = 0;
const X_MAX = 32059;
const X_CONST = 1000;
const Y_MIN = 3786;
const Y_MAX = 32216;
const Y_CONST = 30000;
const V_CONST = -1;


//sort function
function sortByTwoFields(propertyName) {
	console.log("sortByTwoFields")
    return function (a, b) {
        return propertyName
            .map(function (o) {
                var dir = 1;
                if (o[0] === '-') {
                   dir = -1;
                   o=o.substring(1);
                }
                if (a[o] > b[o]) return dir;
                if (a[o] < b[o]) return -(dir);
                return 0;
            })
            .reduce(function firstNonZeroValue (p,n) {
                return p ? p : n;
            }, 0);
    };
};

var secondarySort = function(docs,secondarySortDocs,category){
	console.log("addSecondarySortField");
	for(var i=0; i<secondarySortDocs.length; i++){
		while(secondarySortDocs[i][1].length < 3){
			secondarySortDocs[i][1] = "0"+secondarySortDocs[i][1];
		}
	}
	for(var i=0; i<docs.length; i++){
		docs[i].patient_ID = docs[i].patient_ID.replace(/\./gi,"-")+"-01";
		for(var j=0; j<secondarySortDocs.length; j++){
			if(docs[i].patient_ID == secondarySortDocs[j][0]){
				docs[i].patient_weight = secondarySortDocs[j][1];
			}
		}
	}

	docs.sort(sortByTwoFields([category,'-patient_weight']));

	return docs;
};

//constants for use in clusterGroupByValue
const VALUES_PER_ROW = 100;
const X_RANGE = X_MAX - X_MIN;
const Y_RANGE = Y_MAX - Y_MIN;
const X_SPACING = X_RANGE / VALUES_PER_ROW;

//assigns x & y values to each patient clustered by category
var clusterGroupByValue = function(docsSorted,category){
	console.log("clusterDocs");
	var docsClustered = new Array(docsSorted.length);
			// console.dir(docsSorted);
	var counts = {};

	//get count of each category
	for(var i = 0; i < docsSorted.length; i++) {
	    var categoryName = docsSorted[i][category];
	    counts[categoryName] = counts[categoryName] ? counts[categoryName]+1 : 1;
	}

	//prints number of categories, then prints the name of each category

	var categories = Object.keys(counts)
	var annotationData = new Array(categories.length);
	var yCoordinate = Y_MIN;
	var xCoordinate = X_MIN;

	var totalRecordsCounter = 0;
	var yGap = Y_RANGE * 0.05;
	var ySpacing = Y_RANGE * 0.01;

	for (var i = 0; i < categories.length; i++){
		var xCounter = 0;
		xCoordinate = X_MIN;

		//create annotation data
		annotationData[i] = {
			text:categories[i],
			count:counts[categories[i]],
			x:xCoordinate,
			y:yCoordinate,
			rotation:0
		};

		yCoordinate += yGap;

		//assign x value incrementally, resetting at end of row
		for (var j = 0; j < counts[categories[i]]; j++){
			xCounter++;
			//save coordinates
			docsClustered[totalRecordsCounter] = {
				patient_ID:docsSorted[totalRecordsCounter].patient_ID,
				category:docsSorted[totalRecordsCounter][category],
				x:xCoordinate,
				y:yCoordinate,
				v:docsSorted[totalRecordsCounter][category],
			};

			xCoordinate += X_SPACING;
			//start new row if max values per row is reached
			if (xCounter == VALUES_PER_ROW){
				xCounter = 0;
				xCoordinate = X_MIN;
				yCoordinate += ySpacing;
			}
			totalRecordsCounter++;
		}
	}

	var docsClusteredObj = { allDocs:docsClustered, annotation:annotationData};

	return docsClusteredObj;
}

//inserts docs into database, pass in document array and name of data category
var formatDocsForInsertion = function(docs,annotationData,datasetLabel,category){
	console.log("--------------------------------- INSERT DOCS FUNCTION ---------------------------------");

	var coordinateObj = docs.reduce(function(prevValue, currentValue, index, arr){
		prevValue[currentValue.patient_ID] = {x:currentValue.x, y:currentValue.y, v:currentValue.v};
		return prevValue;
	}, {});

	var docToInsert = {
		type:'cluster',
		dataset:datasetLabel,
		name:category,
		annotation:annotationData,
		data:coordinateObj
	};

	return docToInsert;
}

//returns xFactor for given category of input array
var determineXFactor = function(docsSorted,category){
	console.log("x");
 	var min = Infinity, max = -Infinity;
	for(i=0; i<docsSorted.length; i++) {
	    if(docsSorted[i][category] < min) min = docsSorted[i][category];
	    if(docsSorted[i][category] > max) max = docsSorted[i][category];
	}
	var xFactor = (X_MAX/max)
	console.log(category + ": xFactor=" + xFactor + " min=" + min + " max=" + max);
	return xFactor;
}

//returns yFactor of input array for given category
var determineYIncrement = function(docsSorted,category){
	console.log("y");
 	var count = 0;
	for(i=0; i<docsSorted.length; i++) {
		if(!(isNaN(parseInt(docsSorted[i][category])))){
			count++;
		}
	}
	var yFactor = ((Y_MAX-Y_MIN)/count)
	return yFactor;
}

//******************************************************************************************************
//******************************************************************************************************

connError = function(e){
	console.log(e);
}

var collectionName = "clinical_tcga_brca_pt";
var secondarySortCollectionName = 'edge_brca_oncovogel274_patient_weight';
var category = "race";
var categoryLabel = 'Race Distributed';
var datasetLabel = 'brca';
var collectionNameToInsertTo = 'render_patient';

co(function *() {
	var db = yield comongo.client.connect(url);
	var collection = yield comongo.db.collection(db, collectionName);

	//get sorted documents
	var fields = {patient_ID:1, _id:0};
	fields[category] = 1;
	var sorter = {};
	sorter[category] = 1;
	var docs = yield collection.find({},fields).sort(sorter).toArray();

	//get secondary sorting values
	var collection2 = yield comongo.db.collection(db, secondarySortCollectionName);
	fields = {_id:0};
	var secondarySortDocs = yield collection2.find({},fields).toArray();
	for(var i=0; i<secondarySortDocs.length; i++){
		secondarySortDocs[i]=[Object.keys(secondarySortDocs[i])[0], secondarySortDocs[i][Object.keys(secondarySortDocs[i])]];
	}

	//secondary sort, group by value, format for db insertion, insert into db
	var docsAllFields = yield secondarySort(docs,secondarySortDocs,category);
	var docsWithPoints = yield clusterGroupByValue(docsAllFields,category);
	var docToInsert = yield formatDocsForInsertion(docsWithPoints.allDocs,docsWithPoints.annotation,datasetLabel,categoryLabel);
	var collectionToInsert = yield comongo.db.collection(db,collectionNameToInsertTo);
	yield collectionToInsert.insert(docToInsert, {w:'majority'});

	yield comongo.db.close(db);
}).catch(connError);


// getConnection(url)
// 	.then(getDocs.bind({},'clinical_tcga_brca_pt','gender'))
// 	.then(function(docsSorted){
// 					// console.dir(docsSorted);
// 		var docsToInsert = clusterGroupByValue(docsSorted,'gender');
// 		insertDocs(docsToInsert.allDocs,docsToInsert.annotation,'brca','GenderDistributed');
// 	})

// getConnection(url)
// 	.then(getDocs.bind({},'clinical_tcga_brca_pt','pathologic_method'))
// 	.then(function(docsSorted){
// 					// console.dir(docsSorted);
// 		var docsToInsert = clusterGroupByValue(docsSorted,'pathologic_method');
// 		insertDocs(docsToInsert.allDocs,docsToInsert.annotation,'brca','Pathologic Method Distributed');
// 	})