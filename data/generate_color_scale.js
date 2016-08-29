var MongoClient = require('mongodb').MongoClient, assert = require('assert');
var comongo = require('co-mongodb');
var co = require('co');

//connection url
var url = 'mongodb://localhost:27017/os';

//retrieves data from database, pass in collection name to get data from and the name of the field to sort this data by
var getDocs =	function(collectionName,category){
	return new Promise(function(resolve, reject){
		// console.log("getDocs: " + collectionName + "  retrieving: " + category);

		var fields = {patient_ID:1, _id:0};
		fields[category] = 1;
		var sorter = {};
		sorter[category] = 1;

		connection.collection(collectionName).find({},fields).sort(sorter).toArray(function(err,docsSorted){
				// console.log("getSortedDocs completed: " + docsSorted.length + " docs returned");
				// console.dir(docsSorted);
				if(!err) resolve(docsSorted);
				else console.log("***error in filterDocs")
					reject(err);
			})
	})
};

//currently only supports up to 10 colors
//numColors and colorScheme are optional parameters
//numColors is calculated from docs and category if none provided, colorScheme defaults to blue
var getColors = function(docs,category,colorScheme,numColors){
	//get count of each category
	var counts = {};
	for(var i = 0; i < docs.length; i++) {
	    var categoryName = docs[i][category];
	    counts[categoryName] = counts[categoryName] ? counts[categoryName]+1 : 1;
	}

console.log("length keys " + Object.keys(counts).length);

	// assign parameters if not provided
	switch(arguments.length - 2){
		case 0: colorScheme = 'blue';
		case 1: numColors = Object.keys(counts).length;
	}

	if(numColors > 10){
		var colorArray = generateColorScale(numColors,colorScheme);
	} else {
		var colorArray = getColorGroupings(numColors,colorScheme);
	}
	return colorArray;
}

// not built but could be to allow for more than ten categories/colors
var generateColorScale = function(numColorsNeeded,colorScheme){
	//generate color palette based on input number of colors needed
}

var getColorGroupings = function(numColorsNeeded,colorScheme){
	// console.log("getColorGroupings");
	var colorSchemeArray = [];

	// color schemes from Google Material: https://material.google.com/style/color.html#color-color-palette
	switch(colorScheme){
		case 'blue':
			colorSchemeArray = ['e1f5fe','b3e5fc','81d4fa','4fc3f7','29b6f6','03a9f4','039be5','0288d1','0277bd','01579b'];
			break;
		case 'pink':
			colorSchemeArray = ['fce4ec','f8bbd0','f48fb1','f06292','ec407a','e91e63','d81b60','c2185b','ad1457','880e4f'];
			break;
		case 'purple':
			colorSchemeArray = ['f3e5f5','e1bee7','ce93d8','ba68c8','ab47bc','9c27b0','8e24aa','7b1fa2','6a1b9a','4a148c'];
			break;
		case 'green':
			colorSchemeArray = ['e8f5e9','c8e6c9','a5d6a7','81c784','66bb6a','4caf50','43a047','388e3c','2e7d32','1b5e20'];
			break;
		case 'orange':
			colorSchemeArray = ['fff3e0','ffe0b2','ffcc80','ffb74d','ffa726','ff9800','fb8c00','f57c00','ef6c00','e65100'];
			break;
		case 'gray':
			colorSchemeArray = ['fafafa','f5f5f5','eeeeee','e0e0e0','bdbdbd','9e9e9e','757575','616161','424242','212121'];
			break;
		//blue is default
		default:
			colorSchemeArray = ['e1f5fe','b3e5fc','81d4fa','4fc3f7','29b6f6','03a9f4','039be5','0288d1','0277bd','01579b'];
			break;
	}

	// variables for color assignment
	var numColorsTotal = colorSchemeArray.length;
	var increment = numColorsTotal/numColorsNeeded;
	var startValue = (increment/2)-1;
	startValue = Math.round(startValue);

	var colorArray = [];

	//assign number of needed colors
	for(var i=0; i<numColorsNeeded; i++){
		if(numColorsNeeded<3){
			i+=(increment-1);
			colorArray.push(colorSchemeArray[Math.round(i)]);
			i-=(increment-1);
		} else {
			colorArray.push(colorSchemeArray[Math.round(i*increment)]);
		}
	}
	return colorArray;
}

//******************************************************************************************************
//******************************************************************************************************

//run script
connError = function(e){
	console.log(e);
}

var collectionName = 'clinical_tcga_brca_pt';
var category = 'gender';

co(function *() {
	var db = yield comongo.client.connect(url);
	var collection = yield comongo.db.collection(db,collectionName);

	//get sorted documents
	var fields = {patient_ID:1, _id:0};
	fields[category] = 1;
	var docs = yield collection.find({},fields).toArray();
	//get array of hex color values in input color based on number of distict values in given category of docs parameter
	var colorArray = getColors(docs,category,'orange');

	yield comongo.db.close(db);
}).catch(connError);