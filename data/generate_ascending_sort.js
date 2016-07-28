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

//retrieves data from database, pass in collection name to get data from and the name of the field to sort this data by
var getSortedDocs =	function(collectionName,fieldToSortBy){
	return new Promise(function(resolve, reject){
		console.log("getSortedDocs: " + collectionName + "  retrieving: " + fieldToSortBy);

		var fields = {patient_ID:1, _id:0};
		fields[fieldToSortBy] = 1;
		var sorter = {};
		sorter[fieldToSortBy] = 1;


		connection.collection(collectionName).find({},fields).sort(sorter).toArray(function(err,docsSorted){
				console.log("getSortedDocs completed: " + docsSorted.length + " docs returned");
				// console.dir(docsSorted);
				if(!err) resolve(docsSorted);
				else console.log("***error in filterDocs")
					reject(err);
			})
	})
};


// //assigns x & y values to each patient based on age
// var clusterSortAscending = function(docsSorted,category){
// 		var docsClustered = new Array(docsSorted.length);
// 		console.log("clusterDocs: starting for loop");
// 		var xFactor = determineXFactor(docsSorted,category);
// 		var j = Y_MIN;
// 		var yIncrement = determineYIncrement(docsSorted,category);
		
// 		for(i=0; i<docsSorted.length; i++){
// 			// console.log(parseInt(docsSorted[i][category]) + " - " + docsSorted[i][category]);
// 			//assigns x,y values only if document contains field of interest
// 			if(!(isNaN(parseInt(docsSorted[i][category])))){
// 				docsClustered[i] = {
// 					patient_ID:docsSorted[i].patient_ID.replace(/\./gi,"-")+"-01",
// 					category:docsSorted[i][category],
// 					x:(docsSorted[i][category]*xFactor),
// 					y:j,
// 					v:docsSorted[i][category]
// 				};
// 				j+=yIncrement;
// 			} else {
// 					docsClustered[i] = {
// 					patient_ID:docsSorted[i].patient_ID.replace(/\./gi,"-")+"-01",
// 					category:docsSorted[i][category],
// 					x:X_CONST,
// 					y:Y_CONST,
// 					v:V_CONST
// 				};
// 			}
// 		}
// 		console.log("clusterDocs: ending for loop, docsClustered: " + docsClustered.length)
// 		return docsClustered;
// }

//constants for use in clusterGroupByValue
const VALUES_PER_ROW = 100;
const X_RANGE = X_MAX - X_MIN;
const Y_RANGE = Y_MAX - Y_MIN;
const X_SPACING = X_RANGE / VALUES_PER_ROW;

//assigns x & y values to each patient clustered by category
var clusterGroupByValue = function(docsSorted,category){
	var docsClustered = new Array(docsSorted.length);
	console.log("clusterDocs: starting");

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

	// console.log("categories.length: " + categories.length);
	// console.log("categories[0]: " + categories[0]);
	// console.log(categories[0] + ": " + counts[categories[0]]);
	// console.log(categories[1] + ": " + counts[categories[1]]);


	//*******DOESN'T ACCOUNT FOR PERCENTAGE THAT EACH CATEGORY TAKES UP!!!*************************************
	// ySpacing - constant across each category
	// yGap - currently 10%, should change for account for possibility of >10 categories
	//		or just have different values when >8(?) categories?

	var totalRecordsCounter = 0;
	if(categories.length < 10){
		var yGap = Y_RANGE * 0.1;
		var ySpacing = Y_RANGE * 0.025;
	} else {
		var yGap = Y_RANGE * 0.05;
		var ySpacing = Y_RANGE * 0.01;
	}

	for (var i = 0; i < categories.length; i++){
		var xCounter = 0;
		xCoordinate = X_MIN;

console.log('create annotationData:');
		//create annotation data
		annotationData[i] = {
			text:categories[i],
			count:counts[categories[i]],
			x:xCoordinate,
			y:yCoordinate,
			rotation:0
		};
// console.dir("annotationData: " + annotationData[i].text + " " + annotationData[i].count + " " + annotationData[i].x + " " + annotationData[i].y + " " + annotationData[i].rotation);
// console.log('...');
		yCoordinate += yGap;
// console.log('inner for loop');
		//assign x value incrementally, resetting at end of row
		for (var j = 0; j < counts[categories[i]]; j++){
			xCounter++;
			//save coordinates
			docsClustered[totalRecordsCounter] = {
				patient_ID:docsSorted[totalRecordsCounter].patient_ID.replace(/\./gi,"-")+"-01",
				category:docsSorted[totalRecordsCounter][category],
				x:xCoordinate,
				y:yCoordinate,
				v:docsSorted[totalRecordsCounter][category]
			};
			// console.dir(docsClustered[totalRecordsCounter]);
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
		// var dataArray = new Array(docs.length);

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
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','days_to_death'))
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
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','age_at_diagnosis'))
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
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','count_lymph_nodes_examined'))
// 	.then(function(docsSorted){
// 		var docsToInsert = clusterSortAscending(docsSorted,'count_lymph_nodes_examined');
// 		insertDocs(docsToInsert,'brca','Count Lymph Nodes Examined');
// 	})

// getConnection(url)
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','count_lymph_nodes_examined_he'))
// 	.then(function(docsSorted){
// 		var docsToInsert = clusterSortAscending(docsSorted,'count_lymph_nodes_examined_he');
// 		insertDocs(docsToInsert,'brca','Count Lymph Nodes Examined He');
// 	})

// getConnection(url)
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','days_to_last_contact'))
// 	.then(function(docsSorted){
// 		var docsToInsert = clusterSortAscending(docsSorted,'days_to_last_contact');
// 		insertDocs(docsToInsert,'brca','Days to Last Contact');
// 	})

// getConnection(url)
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','gender'))
// 	.then(function(docsSorted){
// 					// console.dir(docsSorted);
// 		var docsToInsert = clusterGroupByValue(docsSorted,'gender');
// 		insertDocs(docsToInsert,'brca','GenderDistributed');
// 	})

// getConnection(url)
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','race'))
// 	.then(function(docsSorted){
// 					// console.dir(docsSorted);
// 		var docsToInsert = clusterGroupByValue(docsSorted,'race');
// 		insertDocs(docsToInsert.allDocs,docsToInsert.annotation,'brca','RaceDistributed');
// 	})

// getConnection(url)
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','gender'))
// 	.then(function(docsSorted){
// 					// console.dir(docsSorted);
// 		var docsToInsert = clusterGroupByValue(docsSorted,'gender');
// 		insertDocs(docsToInsert.allDocs,docsToInsert.annotation,'brca','GenderDistributed');
// 	})

getConnection(url)
	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','pathologic_method'))
	.then(function(docsSorted){
					// console.dir(docsSorted);
		var docsToInsert = clusterGroupByValue(docsSorted,'pathologic_method');
		insertDocs(docsToInsert.allDocs,docsToInsert.annotation,'brca','Pathologic Method Distributed');
	})