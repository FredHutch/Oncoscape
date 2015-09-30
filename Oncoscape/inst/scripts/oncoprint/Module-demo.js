//----------------------------------------------------------------------------------------------------
var OncoprintModule = (function () {

  var sendSelectionsMenu;

  var thisModulesName = "Oncoprint";
  var thisModulesOutermostDiv = "oncoprintDiv";

  var sendSelectionsMenuTitle = "Send selection...";

      // sometimes a module offers multiple selection destinations
      // but usually just the one entry point
  var selectionDestinations = [thisModulesName];
      // make sure to register, eg,
      // hub.addMessageHandler("sendSelectionTo_blankTab", handleSelections);
  var onc;
  var cell_padding = 3;
  var cell_width = 4;
  var whitespace_on = true;
  
//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  OncoprintDiv = $("#oncoprintDiv");
  sendSelectionsMenu = hub.configureSendSelectionMenu("#oncoprintSendSelectionsMenu", 
                                                      selectionDestinations, 
                                                      sendSelections,
                                                      sendSelectionsMenuTitle);
  onc = Oncoprint.create('#onc', {cell_padding: cell_padding, cell_width: cell_width});

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
 
  var tracks_to_load = 1;
	
  var cnv_data;
  var cnv_track_id;
  var cnv_data_promise = [
  {
    "sample": "TCGA.02.0001.01",
    "gene": "ACAP3",
    "value": 1
  },
  {
    "sample": "TCGA.02.0003.01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA.02.0006.01",
    "gene": "ACAP3",
    "value": -2
  },
  {
    "sample": "TCGA.02.0007.01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA.02.0009.01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA.02.0010.01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA.02.0011.01",
    "gene": "ACAP3",
    "value": 0
  },
  {
    "sample": "TCGA.02.0014.01",
    "gene": "ACAP3",
    "value": 0
  }];

  onc.suppressRendering();
  function map_data(data){
	cnv_data = _.map(data, function(x) { 
				if(x.gene == "ACAP3" & x.value == 2) x.cna='AMPLIFIED';
				if(x.gene == "ACAP3" & x.value == 1) x.cna='GAINED';
				if(x.gene == "ACAP3" & x.value == -1) x.cna='HEMIZYGOUSLYDELETED'; 
				if(x.gene == "ACAP3" & x.value == -2) x.cna='HOMODELETED';  
				x.patient = x.sample; return x; })
}
  map_data(cnv_data_promise);
	
  $.when(cnv_data_promise).then(function() {
	//alteration_track_id = onc.addTrack({label: 'TP53'}, 0);
	cnv_track_id = onc.addTrack({label: 'ACAP3'}, 0);
	tracks_to_load -= 1;
	onc.setRuleSet(cnv_track_id, Oncoprint.GENETIC_ALTERATION);
	onc.setTrackData(cnv_track_id, cnv_data, true);
	if (tracks_to_load === 0) {
		onc.releaseRendering();
	};
})

  handleWindowResize();

} // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  OncoprintDiv.width($(window).width() * 0.95);
  OncoprintDiv.height($(window).height() * 0.90);  // leave room for tabs above

  //$("#onc").width(OncoprintTabDiv.width()); //  * 0.95);
  //$("#onc").height("100px");

} // handleWindowResize
//--------------------------------------------------------------------------------------------
/*function handlePatientIDs(msg)
{
   var ids = msg.payload.value;
   var count = msg.payload.count;
   var source = msg.payload.source;  

   if(typeof(ids) == "string")
      ids = [ids];

   console.log("Oncoprint module, " + msg.cmd + " count: " + count);
   analyzeSelectedTissues(ids, "");

} // handleTissueIDsForSurivalStats
//----------------------------------------------------------------------------------------------------
function analyzeSelectedTissues(patientIDs, title)
{
   console.log("Oncoprint module, hub.send 'cnv_data_selection' for %d patientIDs",
               patientIDs.length);

   var payload = {sampleIDs: patientIDs, title: title};
   var msg = {cmd:"cnv_data_selection", callback: "displayOncoprint", status: "request", 
              payload: payload};

   hub.send(JSON.stringify(msg));

} // analyzeSelectedTissues
//----------------------------------------------------------------------------------------------------
function displayOncoprint(msg)
{
   //console.log("about to add survival curve image to survivalCurve div");
   var encodedImage = msg.payload;
   document.getElementById("survivalImageArea").src = encodedImage;
   hub.raiseTab(thisModulesOutermostDiv);
   postStatus("image loaded");
   // survivalImageArea.src = encodedImage;

} // displaySurvivalCurves*/
//----------------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();

  var cmd = "sendSelectionTo_" + destination;
  var dummySelections = ["dummy selection 1", "dummy selection 2"];

  payload = {value: dummySelections, count: dummySelections.length, 
             source: thisModulesName};

  var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

      // restore default (informational) title of the menu
   sendSelectionsMenu.val(sendSelectionsMenuTitle);

  hub.send(JSON.stringify(newMsg));

} // sendSelections
//--------------------------------------------------------------------------------------------
function handleSelections(msg)
{
   hub.raiseTab(thisModulesOutermostDiv);
   var msgAsString = JSON.stringify(msg.payload);
   
   //outputDiv.html("<pre>" + msgAsString + "</pre");


} // handleSelections
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.addMessageHandler("sendSelectionTo_Oncoprint", handleSelections);
   //hub.addMessageHandler("displayOncoprint", displayOncoprint);

} // initializeModule
//----------------------------------------------------------------------------------------------------
function demoPatientSet()
{
   var longSurvivors = ["TCGA.06.6693", "TCGA.12.1088", "TCGA.02.0113", "TCGA.02.0114", "TCGA.08.0344"];

   var firstFortyGbmPatients = ["TCGA.02.0001", "TCGA.02.0003", "TCGA.02.0006", "TCGA.02.0007",
                                "TCGA.02.0009", "TCGA.02.0010", "TCGA.02.0011", "TCGA.02.0014",
                                "TCGA.02.0021", "TCGA.02.0024", "TCGA.02.0027", "TCGA.02.0028",
                                "TCGA.02.0033", "TCGA.02.0034", "TCGA.02.0037", "TCGA.02.0038",
                                "TCGA.02.0043", "TCGA.02.0046", "TCGA.02.0047", "TCGA.02.0052",
                                "TCGA.02.0054", "TCGA.02.0055", "TCGA.02.0057", "TCGA.02.0058",
                                "TCGA.02.0060", "TCGA.06.0875", "TCGA.06.0876", "TCGA.06.0877",
                                "TCGA.06.0878", "TCGA.06.0879", "TCGA.06.0881", "TCGA.06.0882",
                                "TCGA.12.0670", "TCGA.12.0818", "TCGA.12.0819", "TCGA.12.0820",
                                "TCGA.12.0821", "TCGA.12.0822", "TCGA.12.0826", "TCGA.12.0827"];

   firstFortyGbmPatients.push(longSurvivors);
   return (firstFortyGbmPatients);

} // demoPatientSet
//----------------------------------------------------------------------------------------------------
/*function sat(maxReps)
{

} // sat*/
//----------------------------------------------------------------------------------------------------
return{
   init: initializeModule,
   //sat: sat
   }; // OncoprintTabModule return value

//----------------------------------------------------------------------------------------------------
}); // OncoprintTabModule

OncoprintM = OncoprintModule();
OncoprintM.init();

