var MongoClient = require('mongodb').MongoClient, assert = require('assert');

//connection url
var url = 'mongodb://localhost:27017/os';
const X_MIN = 0;
const X_MAX = 32059;
const X_CONST = 1000;
const Y_MIN = 3786;
const Y_MAX = 32216;
const Y_CONST = 30000;
const V_CONST = -1;

var connection;	//global variable - fix this!!!

//connect to server with connect method, pass in database location
var getConnection = function(url){
	return new Promise(function(resolve, reject){
		MongoClient.connect(url, function(err, db) {
			connection = db;
			if (!err) console.log('connected'), resolve(db);
			else console.log('err - not connected'), reject(err);
		});
	});
};

//from http://stackoverflow.com/questions/3230028/how-to-order-a-json-object-by-two-keys/3230748#3230748
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

//retrieves data from database, pass in collection name to get data from and the name of the field to sort this data by
var getDocs = function(collectionName,category){
	return new Promise(function(resolve, reject){
		console.log("getDocs: " + collectionName + "  retrieving: " + category);

		var fields = {patient_ID:1, _id:0};
		fields[category] = 1;
		var sorter = {};
		sorter[category] = 1;

		connection.collection(collectionName).find({},fields).sort(sorter).toArray(function(err,docsSorted){
				console.log("getDocs completed: " + docsSorted.length + " docs returned");
				if(!err) resolve(docsSorted);
				else console.log("***error in filterDocs")
					reject(err);
			})
	})
};

var getSecondarySortDocs = function(docs,collectionName2){
	return new Promise(function(resolve, reject){
		console.log("getSecondarySortDocs:");

		var fields = {_id:0};
		var secondarySortDocs = [];
		connection.collection(collectionName2).find({},fields).toArray(function(err,secondarySortDocs){
			for(var i=0; i<secondarySortDocs.length; i++){
				secondarySortDocs[i]=[Object.keys(secondarySortDocs[i])[0],secondarySortDocs[i][Object.keys(secondarySortDocs[i])]];
			}
			console.log("secondarySort array completed: " + secondarySortDocs.length + " docs returned");
			// console.dir(secondarySortDocs);
			if(!err) resolve(secondarySortDocs);
			else console.log("***error in secondarySort")
				reject(err);
		})
	})
};

var secondarySort = function(docs,secondarySortDocs,category){
	// return new Promise(function(resolve, reject){
	console.log("addSecondarySortField:");
	for(var i=0; i<secondarySortDocs.length; i++){
		while(secondarySortDocs[i][1].length < 3){
			secondarySortDocs[i][1] = "0"+secondarySortDocs[i][1];
		}
	}
	// console.log("docs[patient_ID]: " + docs[1].patient_ID);
	for(var i=0; i<docs.length; i++){
		docs[i].patient_ID = docs[i].patient_ID.replace(/\./gi,"-")+"-01";
		// console.log(docs[i].patient_ID);
		for(var j=0; j<secondarySortDocs.length; j++){
			if(docs[i].patient_ID == secondarySortDocs[j][0]){
				docs[i].patient_weight = secondarySortDocs[j][1];
				// console.log(docs[i]);
			}
		}
	}
	console.log("now to sort")
	docs.sort(sortByTwoFields([category,'-patient_weight']));
	// console.dir(docs);
	console.log("sorted");
	return docs;
	// if(!err) resolve(sortedDocs);
	// else console.log("***error in addSecondarySortField")
	// 	reject(err);
	// })
};

//constants for use in clusterGroupByValue
const VALUES_PER_ROW = 100;
const X_RANGE = X_MAX - X_MIN;
const Y_RANGE = Y_MAX - Y_MIN;
const X_SPACING = X_RANGE / VALUES_PER_ROW;

//assigns x & y values to each patient clustered by category
var clusterGroupByValue = function(docsSorted,category){
	var docsClustered = new Array(docsSorted.length);
	console.log("clusterDocs: starting");
			// console.dir(docsSorted);
	var counts = {};

	//get count of each category
	for(var i = 0; i < docsSorted.length; i++) {
	    var categoryName = docsSorted[i][category];
	    counts[categoryName] = counts[categoryName] ? counts[categoryName]+1 : 1;
	}

	//prints number of categories, then prints the name of each category
	// console.log(Object.keys(counts).length);
	// console.log(Object.keys(counts));

	var categories = Object.keys(counts)
	var annotationData = new Array(categories.length);
	var yCoordinate = Y_MIN;
	var xCoordinate = X_MIN;

	console.log("categories.length: " + categories.length);
	// console.log(categories[0] + ": " + counts[categories[0]]);
	// console.log(categories[1] + ": " + counts[categories[1]]);
	// console.log(categories[2] + ": " + counts[categories[2]]);
	// console.log(categories[3] + ": " + counts[categories[3]]);
	// console.log(categories[4] + ": " + counts[categories[4]]);

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
			console.log("docsClustered next");
			console.log(docsSorted[totalRecordsCounter].patient_ID);
			console.log(docsSorted[totalRecordsCounter][category]);
			console.log(xCoordinate);
			console.log(yCoordinate);
			console.log(docsSorted[totalRecordsCounter][category]);
			console.log(docsSorted[totalRecordsCounter].patient_weight);

			docsClustered[totalRecordsCounter] = {
				patient_ID:docsSorted[totalRecordsCounter].patient_ID,
				category:docsSorted[totalRecordsCounter][category],
				x:xCoordinate,
				y:yCoordinate,
				v:docsSorted[totalRecordsCounter][category],
				// z:docsSorted[totalRecordsCounter].patient_weight
			};
			console.log("docsClustered done");
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

				// console.dir("annotationData to store: " + annotationData);
	// docsClustered[totalRecordsCounter] = annotationData;
	var docsClusteredObj = { allDocs:docsClustered, annotation:annotationData};

	// console.dir(docsClustered[totalRecordsCounter]);
	console.log('clusterDocs: finished')
	return docsClusteredObj;
}

//inserts docs into database, pass in document array and name of data category
var insertDocs = function(docs,annotationData,datasetLabel,category){
	return new Promise(function (resolve, reject){
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

		connection.collection('render_patient').insert(docToInsert, {w:'majority'}, function(err, docs) {
			if (!err) resolve(docs);
			else console.dir(err)
				reject(err);
		});
	});
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
	// var xFactor = (X_MAX/(max - min))
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

// getConnection(url)
// 	.then(getDocs.bind({},'clinical_tcga_brca_pt','days_to_death'))
// 	.then(function(docsSorted){
// 	 	// console.log(docsSorted.length + ' docs found')
// 	 	// console.log("x: " + determineXFactor(docsSorted,'days_to_death') + ", y: " + determineYFactor(docsSorted,'days_to_death'));
// 			// console.dir(docsDaysToDeath);
// 		var docsToInsert = clusterSortAscending(docsSorted,'days_to_death');
// 	 	 	 // console.dir(docsToInsert);
// 	 		// console.log("num docs to insert: " + docsToInsert.length);
// 		insertDocs(docsToInsert,'brca','Days to Death');
// 	})

// getConnection(url)
// 	.then(getDocs.bind({},'clinical_tcga_brca_pt','age_at_diagnosis'))
// 	.then(function(docsSorted){
// 	 	// console.log(docsSorted.length + ' docs found')
// 	 	// console.log("x: " + determineXFactor(docsSorted,'days_to_death') + ", y: " + determineYFactor(docsSorted,'days_to_death'));
// 			// console.dir(docsDaysToDeath);
// 		var docsToInsert = clusterSortAscending(docsSorted,'age_at_diagnosis');
// 	 	 	 // console.dir(docsToInsert);
// 	 		// console.log("num docs to insert: " + docsToInsert.length);
// 		insertDocs(docsToInsert,'brca','Age at Diagnosis');
// 	})

// getConnection(url)
// 	.then(getDocs.bind({},'clinical_tcga_brca_pt','count_lymph_nodes_examined'))
// 	.then(function(docsSorted){
// 		var docsToInsert = clusterSortAscending(docsSorted,'count_lymph_nodes_examined');
// 		insertDocs(docsToInsert,'brca','Count Lymph Nodes Examined');
// 	})

// getConnection(url)
// 	.then(getDocs.bind({},'clinical_tcga_brca_pt','count_lymph_nodes_examined_he'))
// 	.then(function(docsSorted){
// 		var docsToInsert = clusterSortAscending(docsSorted,'count_lymph_nodes_examined_he');
// 		insertDocs(docsToInsert,'brca','Count Lymph Nodes Examined He');
// 	})

// getConnection(url)
// 	.then(getDocs.bind({},'clinical_tcga_brca_pt','days_to_last_contact'))
// 	.then(function(docsSorted){
// 		var docsToInsert = clusterSortAscending(docsSorted,'days_to_last_contact');
// 		insertDocs(docsToInsert,'brca','Days to Last Contact');
// 	})

// getConnection(url)
// 	.then(getDocs.bind({},'clinical_tcga_brca_pt','gender'))
// 	.then(function(docsSorted){
// 					// console.dir(docsSorted);
// 		var docsToInsert = clusterGroupByValue(docsSorted,'gender');
// 		insertDocs(docsToInsert,'brca','GenderDistributed');
// 	})

var collectionName = "clinical_tcga_brca_pt";
var category = "race";
getConnection(url)
	.then(getDocs.bind({},collectionName,category))
	.then(function(docs){
		var secondarySortDocs = getSecondarySortDocs(docs,'edge_brca_oncovogel274_patient_weight')
		.then(function(secondarySortDocs){
			var docsAllFields = secondarySort(docs,secondarySortDocs,category);
			var docsToInsert = clusterGroupByValue(docsAllFields,category);
			console.dir(docsToInsert);
			console.log("insert next");
			// insertDocs(docsToInsert.allDocs,docsToInsert.annotation,'brca','RaceDistributed');
		})

	})

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