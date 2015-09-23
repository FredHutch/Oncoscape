
var cell_padding = 3;
var cell_width = 4;
var whitespace_on = true;

var onc = Oncoprint.create('#onc', {cell_padding: cell_padding, cell_width: cell_width});

$('#shuffle_btn').click(function() {
	onc.sort(gender_track_id, function(d1, d2) {
		var map = {'MALE':0, 'FEMALE':1};
		return map[d1.attr_val] - map[d2.attr_val];
	});
});

$('#toggle_whitespace').click(function() {
	onc.toggleCellPadding();
});
var z = 1;
$('#reduce_cell_width').click(function() {
	z *= 0.5;
	onc.setZoom(z);
});
$('#change_color_scheme').click(function() {
	onc.setRuleSet(gender_track_id, Oncoprint.CATEGORICAL_COLOR, {
		color: {MALE: '#CBCBCB', FEMALE: 'green'},
		getCategory: function(d) {
			return d.attr_val;
		},
		legend_label: 'Gender (modified color)'
	});
});
 /*$('#to_svg_btn').click(function() {
 	onc.toSVG(d3.select('#svg_container'));
	var DOMURL = window.URL || window.webkitURL || window;
	var ctx = $('#canvas')[0].getContext('2d');
	var img = new Image();
	var svg;
	var data = $('#svg_container')[0].outerHTML;
	console.log(data);
	svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
	console.log(svg);
	var url = DOMURL.createObjectURL(svg);
	img.src = url;
	img.onload = function() {
		ctx.drawImage(img, 0, 0);
		DOMURL.revokeObjectURL(url);
	};
 });*/



var tracks_to_load = 1;
	
var cnv_data;
var cnv_track_id;
//var cnv_data_promise = $.getJSON('oncoprint/cnv-gbm-tr.json');
var cnv_data_promise = [
  {
    "sample": "TCGA-02-0001-01",
    "gene": "ACAP3",
    "value": 1
  },
  {
    "sample": "TCGA-02-0003-01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA-02-0006-01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA-02-0007-01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA-02-0009-01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA-02-0010-01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA-02-0011-01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA-02-0014-01",
    "gene": "ACAP3",
    "value": 0
  }];



onc.suppressRendering()




/*cnv_data_promise.then(function(data) {
	cnv_data = _.map(data, function(x) { 
				if(x.gene == "ACAP3" & x.value == 2) x.cna='AMPLIFIED';
				if(x.gene == "ACAP3" & x.value == 1) x.cna='GAINED';
				if(x.gene == "ACAP3" & x.value == -1) x.cna='HEMIZYGOUSLYDELETED'; 
				if(x.gene == "ACAP3" & x.value == -2) x.cna='HOMODELETED';  
				x.patient = x.sample; return x; });
});*/

function map_data(data){
	cnv_data = _.map(data, function(x) { 
				if(x.gene == "ACAP3" & x.value == 2) x.cna='AMPLIFIED';
				if(x.gene == "ACAP3" & x.value == 1) x.cna='GAINED';
				if(x.gene == "ACAP3" & x.value == -1) x.cna='HEMIZYGOUSLYDELETED'; 
				if(x.gene == "ACAP3" & x.value == -2) x.cna='HOMODELETED';  
				x.patient = x.sample; return x; })
}
map_data(cnv_data_promise)

$.when(cnv_data_promise).then(function() {
	//alteration_track_id = onc.addTrack({label: 'TP53'}, 0);
	cnv_track_id = onc.addTrack({label: 'AGRN'}, 0);
	tracks_to_load -= 1;
	onc.setRuleSet(cnv_track_id, Oncoprint.GENETIC_ALTERATION);
	onc.setTrackData(cnv_track_id, cnv_data, true);
	if (tracks_to_load === 0) {
		onc.releaseRendering();
	};
	

})

