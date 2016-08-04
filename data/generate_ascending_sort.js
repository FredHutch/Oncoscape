var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var comongo = require('co-mongodb');
var co = require('co');
var d3 = require('d3');

//connection url
const url = 'mongodb://localhost:27017/os';
const X_MIN = 0;
const X_MAX = 32059;
const X_CONST = 1000;
const Y_MIN = 3786;
const Y_MAX = 32216;
const Y_CONST = 30000;
const V_CONST = -1;


//assigns x & y values to each patient based on age
var clusterAssignPoints = function(docs,category){
	var yToInsert = Y_MIN;
	var yIncrement = determineYIncrement(docs,category);

	var counts = {};

	//get count of each category
	for(var i = 0; i < docs.length; i++) {
	    var categoryName = docs[i][category];
	    counts[categoryName] = counts[categoryName] ? counts[categoryName]+1 : 1;
	}

	//determine min, max for dataset
	var min = Infinity, max = -Infinity;
	for(i=0; i<docs.length; i++) {
	    if(docs[i][category] < min) min = docs[i][category];
	    if(docs[i][category] > max) max = docs[i][category];
	}
	
	//function to adjust x value to fit range
	var xScale = d3.scaleLinear().domain([min,max]).range([X_MIN,X_MAX]);

	var counter = 0;
	var quartile = (max-min)/4;
	var annoArray = [ "MIN ", "Q1 ", "Q2 ", "Q3 ", "MAX "];
	var annotationData = new Array(annoArray.length);

	//assign annotation data for creating quartile lines on display
	for (var i = 0; i < (annoArray.length*2); i+=2){
		var dataValueToAdd = (min+(counter*quartile));
		var lineArray = [{x:xScale(dataValueToAdd),y:0},{x:xScale(dataValueToAdd),y:Y_MAX}];
		//halign can be LEFT|RIGHT|CENTER
		annotationData[i] = {
			type:"text",
			text:annoArray[counter],
			dataValue:dataValueToAdd,
			x:xScale(dataValueToAdd),
			y:0,
			rotation:270,
			halign:"LEFT"
		};
		annotationData[i+1] = {
			type:"line",
			points:lineArray
		}
		counter++;
	}	

	var docsSorted = new Array(docs.length);

	//assigns x,y values if document contains field of interest, otherwise assign x,y constants
	for(i=0; i<docs.length; i++){
		if(!(isNaN(parseInt(docs[i][category])))){
			docsSorted[i] = {
				patient_ID:docs[i].patient_ID.replace(/\./gi,"-")+"-01",
				category:docs[i][category],
				x:(xScale(docs[i][category])),
				y:yToInsert,
				v:docs[i][category]
			};
			yToInsert += yIncrement;
		} else {
				docsSorted[i] = {
				patient_ID:docs[i].patient_ID.replace(/\./gi,"-")+"-01",
				category:docs[i][category],
				x:X_CONST,
				y:Y_CONST,
				v:V_CONST
			};
		}
	}

	var docsSortedObj = { allDocs:docsSorted, annotation:annotationData};

	return docsSortedObj;
}

//inserts docs into database, pass in document array and name of data category
var formatDocsForInsertion = function(docs,annotationData,datasetLabel,category){
		console.log("--------------------------- INSERT DOCS FUNCTION ---------------------------");

		//group coordinates
		var coordinateObj = docs.reduce(function(prevValue, currentValue, index, arr){
			prevValue[currentValue.patient_ID] = {x:currentValue.x, y:currentValue.y, v:currentValue.v};
			return prevValue;
		}, {});

		//group data to insert
		var docToInsert = {
			type:'cluster',
			dataset:datasetLabel,
			name:category,
			annotation:annotationData,
			data:coordinateObj
		};

		return docToInsert;
}

//returns yFactor of input array for given category
var determineYIncrement = function(docs,category){
 	var count = 0;
	for(i=0; i<docs.length; i++) {
		if(!(isNaN(parseInt(docs[i][category])))){
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

var collectionName = 'clinical_tcga_brca_pt';
var category = 'age_at_diagnosis';
var categoryLabel = 'Age at Diagnosis';
var datasetLabel = 'brca';
var collectionNameToInsertTo = 'render_patient';

co(function *() {
	var db = yield comongo.client.connect(url);

	var collection = yield comongo.db.collection(db,collectionName);

	//get sorted documents
	var fields = {patient_ID:1, _id:0};
	fields[category] = 1;
	var sorter = {};
	sorter[category] = 1;
	var docs = yield collection.find({},fields).sort(sorter).toArray();

	//assign points, format for db insertion, insert into db
	var docsWithPoints = yield clusterAssignPoints(docs,category);
	var docToInsert = yield formatDocsForInsertion(docsWithPoints.allDocs,docsWithPoints.annotation,datasetLabel,categoryLabel);
	var collectionToInsert = yield comongo.db.collection(db,collectionNameToInsertTo);
	yield collectionToInsert.insert(docToInsert, {w:'majority'});

	yield comongo.db.close(db);
}).catch(connError);




// getConnection(url)
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','days_to_death'))
// 	.then(function(docs){
// 		var docsToInsert = clusterSortAscending(docs,'days_to_death');
// 		insertDocs(docsToInsert.allDocs,docsToInsert.annotation,'brca','Days to Death');
// 	})

// getConnection(url)
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','count_lymph_nodes_examined'))
// 	.then(function(docs){
// 		var docsToInsert = clusterSortAscending(docs,'count_lymph_nodes_examined');
// 		insertDocs(docsToInsert,'brca','Count Lymph Nodes Examined');
// 	})

// getConnection(url)
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','count_lymph_nodes_examined_he'))
// 	.then(function(docs){
// 		var docsToInsert = clusterSortAscending(docs,'count_lymph_nodes_examined_he');
// 		insertDocs(docsToInsert,'brca','Count Lymph Nodes Examined He');
// 	})

// getConnection(url)
// 	.then(getSortedDocs.bind({},'clinical_tcga_brca_pt','days_to_last_contact'))
// 	.then(function(docs){
// 		var docsToInsert = clusterSortAscending(docs,'days_to_last_contact');
// 		insertDocs(docsToInsert,'brca','Days to Last Contact');
// 	})
