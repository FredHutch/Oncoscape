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
  var track_id = [];
  var cnv_data,mnra_data,mut_data, cnv_data_promise,mrna_data_promise,mut_data_promise;
  var OncoprintDiv = $("#oncoprintDiv");
  var ControlsDiv = $("#oncoprintControlsDiv");
//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  sendSelectionsMenu = hub.configureSendSelectionMenu("#oncoprintSendSelectionsMenu", 
                                                      selectionDestinations, 
                                                      sendSelections,
                                                      sendSelectionsMenuTitle);
  
  $('#toggle_whitespace').click(function() {
	onc.toggleCellPadding();
	});
  var z = 1;
  $('#reduce_cell_width').click(function() {
	z *= 0.5;
	onc.setZoom(z);
	});
  handleWindowResize();
  

} // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  OncoprintDiv.width($(window).width() * 0.95);
  
  ControlsDiv.width(OncoprintDiv.width()); //  * 0.95);
  ControlsDiv.height("100px");

  $("#onc").width(OncoprintDiv.width()); //  * 0.95);
  
  OncoprintDiv.height($("#onc").height() + 100);  // leave room for tabs above	

} // handleWindowResize
//--------------------------------------------------------------------------------------------
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
   hub.enableTab(thisModulesOutermostDiv);
   hub.raiseTab(thisModulesOutermostDiv);   //var msgAsString = JSON.stringify(msg.payload);
   
   var ids = msg.payload.value;
   
   if(typeof(ids) == "string")
      ids = [ids];

   console.log("Oncoprint module, " + msg.cmd + " patients and markers: " + ids);
   $("#onc").empty();
   
   analyzeSelectedTissues(ids);
} // handleSelections
//----------------------------------------------------------------------------------------------------
function analyzeSelectedTissues(IDs)
{
   $("#onc").append("Computing...");
   console.log("Oncoprint module, hub.send 'oncoprint_data_selection' for %d IDs",
               IDs.length);
   if(IDs.length > 350){
   		alert("Please choose less than 350 Nodes");
   }else{
	   var payload = {sampleIDs: IDs};
	   var msg = {cmd:"oncoprint_data_selection", callback: "displayOncoprint", status: "request", 
				  payload: payload};
	   console.log("msg cmd, call back, status, payload: %s,%s,%s,%s", msg.cmd, msg.callback, msg.status, msg.payload.sampleIDs );
	   hub.send(JSON.stringify(msg));
	}

} // analyzeSelectedTissues
//----------------------------------------------------------------------------------------------------
function displayOncoprint(msg)
{
   //console.log("about to add survival curve image to survivalCurve div");
   $("#onc").empty();
   console.log("entering displayOncoprint");
   
   console.log("displayOncoprint print recieved msg.payload: %s", msg.payload);
   
   if(msg.status == "fail") {
   		alert(msg.payload);
   		$("#onc").empty();
   }else{
	    /*cnv_data_promise = xx[0];
	    mrna_data_promise = xx[1];
	    mut_data_promise = xx[2];*/
	   xx = JSON.parse(msg.payload);
	   console.log("displayOncoprint print recieved genes: %s",xx[1]);
	   genes = xx[1];
       processed_data = JSON.parse(xx[0]);
	   onc = Oncoprint.create('#onc', {cell_padding: cell_padding, cell_width: cell_width});
	   
	  
	   onc.suppressRendering();
       
	  /*map_cnv_data(cnv_data_promise);
   	   map_mrna_data(mrna_data_promise, cnv_data);
   	   map_mut_data(mut_data_promise, mrna_data);*/	
   		
   	   if(typeof(genes) === "string"){
   	   		i = 0;
   	   		gene = genes;
   	   		tracks_to_load = 1;
   	   		console.log(tracks_to_load);			
			var data_gene = processed_data.filter(function(obj){return obj.gene === gene});     
			$.when(processed_data).then(function() {
				track_id[i] = onc.addTrack({label: gene, removable:true}, 0);
				tracks_to_load -= 1;
				if(i == 0){
					onc.setRuleSet(track_id[i], Oncoprint.GENETIC_ALTERATION);
				}else{
					onc.useSameRuleSet(track_id[i], track_id[0]);
				}
				onc.setTrackData(track_id[i], data_gene, true);
				if (tracks_to_load === 0) {
					onc.releaseRendering();
					onc.sort();
				};
			})
	   		
   	   }else{	
			tracks_to_load = genes.length;
			console.log(tracks_to_load);
			for(i = 0; i < genes.length; i++){
				gene = genes[i];
			
				var data_gene = processed_data.filter(function(obj){return obj.gene === gene}); 
				    
				$.when(processed_data).then(function() {
					track_id[i] = onc.addTrack({label: gene, removable:true}, 0);
					tracks_to_load -= 1;
					if(i == 0){
						onc.setRuleSet(track_id[i], Oncoprint.GENETIC_ALTERATION);
						
					}else{
						onc.useSameRuleSet(track_id[i], track_id[0]);
					}
					onc.setTrackData(track_id[i], data_gene, true);
					if (tracks_to_load === 0) {
						onc.releaseRendering();
						onc.sort();
					};
				})
				}
	   
	   }	
   }
    
} // displaySurvivalCurves
//----------------------------------------------------------------------------------------------------
function map_cnv_data(data){
				cnv_data = _.map(data, function(x) {
							if(x.value == 2) x.cna='AMPLIFIED';
							if(x.value == 1) x.cna='GAINED';
							if(x.value == -1) x.cna='HEMIZYGOUSLYDELETED'; 
							if(x.value == -2) x.cna='HOMODELETED'; 
							//if(x.value != "") x.mut_type='MISSENSE';
							x.patient = x.sample; return x; })
	   }
function map_mrna_data(mrna_promise, data){
				mrna_data = _.map(data, function(x) {
								single_sample = x.sample;
								single_gene = x.gene;
								y = mrna_data_promise.filter(function (obj) {
										return (obj.sample == single_sample && obj.gene == single_gene);});
								if(y.length != 0){
									if(y[0].value > 2) x.mrna='UPREGULATED';
									if(y[0].value < -2) x.mrna='DOWNREGULATED';
									x.patient = x.sample; return x;
								}else{ return x;} 
							})
	   }
//---------------------------------------------------------------------------------------	   
function map_mut_data(mut_promise, data){
				mut_data = _.map(data, function(x) {
								single_sample = x.sample;
								single_gene = x.gene;
								y = mut_data_promise.filter(function (obj) {
										return (obj.sample == single_sample && obj.gene == single_gene);});
								if(y.length != 0){
									if(y[0].value != "") x.mut_type='MISSENSE';
									x.patient = x.sample; return x;
								}else{ return x;} 
							})
	   }
//----------------------------------------------------------------------------------------------------	   	   
function initializeModule()
{
   hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.addMessageHandler("sendSelectionTo_Oncoprint", handleSelections);
   hub.addMessageHandler("displayOncoprint", displayOncoprint);

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
function sat(maxReps)
{

} // sat
//----------------------------------------------------------------------------------------------------
return{
   init: initializeModule,
   sat: sat
   }; // OncoprintTabModule return value

//----------------------------------------------------------------------------------------------------
}); // OncoprintTabModule

OncoprintM = OncoprintModule();
OncoprintM.init();

