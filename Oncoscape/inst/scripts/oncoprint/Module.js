"user strict";
//----------------------------------------------------------------------------------------------------
var OncoprintModule = (function () {
  var statusDiv; 
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
//  var track_id = [];
  var cnv_data,mnra_data,mut_data, cnv_data_promise,mrna_data_promise,mut_data_promise;
  var OncoprintDiv = $("#oncoprintDiv");
  var ControlsDiv = $("#oncoprintControlsDiv");
  var compute_start;
  var genes; 
//--------------------------------------------------------------------------------------------
function initializeUI()
{
  statusDiv = $("#oncoprintStatusDiv");
  $(window).resize(handleWindowResize);

  sendSelectionsMenu = hub.configureSendSelectionMenu("#oncoprintSendSelectionsMenu", 
                                                      selectionDestinations, 
                                                      sendSelections,
                                                      sendSelectionsMenuTitle);
  $("#oncoprintControlsDiv").css("display", "none");
  $('#toggle_whitespace').click(function() {
  onc.toggleCellPadding();
  });
  var z = 1;
  $('#reduce_cell_width').click(function() {
  z *= 0.5;
  onc.setZoom(z);
  });
  
  handleWindowResize();
  hub.disableTab(thisModulesOutermostDiv);
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

   sendSelectionsMenu.val(sendSelectionsMenuTitle);

   hub.send(JSON.stringify(newMsg));

} // sendSelections
//----------------------------------------------------------------------------------------------------
function handleSelections(msg)
{
   hub.enableTab(thisModulesOutermostDiv);
   hub.raiseTab(thisModulesOutermostDiv);   //var msgAsString = JSON.stringify(msg.payload);
   
   var ids = msg.payload.value;
   //var testingMode = msg.testing;

   console.log("******handleSelections msg.payload.value: ", ids);
   console.log("******handleSelections ids typeof:", typeof(ids));
   console.log("******handleSelections [ids] type: ", typeof([ids]));
   if(Array.isArray(ids)){
      console.log("Oncoprint module, " + msg.cmd + " patients and markers: " + ids);
   }else{
      console.log("Oncoprint module, " + msg.cmd + " patients and markers length" + ids);
   }
   $("#onc").empty();
   compute_start = Date.now();
   $("#oncoprintInstructions").css("display", "none");
   $("#oncoprintControlsDiv").css("display", "block");
   analyzeSelectedTissues(ids);
} // handleSelections
//----------------------------------------------------------------------------------------------------
function postStatus(msg)
{
  statusDiv.text(msg);

} // postStatus
//----------------------------------------------------------------------------------------------------
function analyzeSelectedTissues(IDs)
{   
   $("#onc").append("Computing...");
   $("#errorMessage2").empty();
   var payload;
   var msg;
   if(Array.isArray(IDs)){ 
     console.log("Oncoprint module, hub.send 'oncoprint_data_selection' for %d IDs",
                 IDs.length);
     //if(IDs.length > 350 && testingMode !== "testing"){
     if(IDs.length > 350){
        $("#errorMessage2").text("Please choose less than 350 Nodes");
        $("#errorMessage2").dialog();
        postStatus("msg.status is error.");
        $("#oncoprintInstructions").css("display", "block");
        $("#oncoprintControlsDiv").css("display", "none");
        $("#onc").empty();
        postStatus("too many nodes selected");
     }else{
          payload = {sampleIDs: IDs};
          msg = {cmd:"oncoprint_data_selection", callback: "displayOncoprint", status: "request", 
            payload: payload};
          hub.send(JSON.stringify(msg));
    }   
   }else{
     console.log("Oncoprint module, hub.send 'oncoprint_data_selection' for %d IDs",
                 IDs);
     if(IDs > 350){  
        $("#errorMessage2").text("Please choose less than 350 Nodes");
        $("#errorMessage2").dialog();
        postStatus("msg.status is error.");
        $("#oncoprintInstructions").css("display", "block");
        $("#oncoprintControlsDiv").css("display", "none");
        $("#onc").empty();
        postStatus("too many nodes selected");
     }else{
          payload = {sampleIDs: IDs};
          msg = {cmd:"oncoprint_data_selection", callback: "displayOncoprint", status: "request", 
            payload: payload};
         hub.send(JSON.stringify(msg));
       }     
    } 
} // analyzeSelectedTissues
//----------------------------------------------------------------------------------------------------
function displayOncoprint(msg)
{
   $("#onc").empty();
   $("#errorMessage1").empty();
   console.log("entering displayOncoprint");
   
   //console.log("displayOncoprint print recieved msg.payload: %s", msg.payload);
   
   if(msg.status === "error") {
      var errorMessage = JSON.parse(msg.payload);
      console.log("***** displayOncoprint error section, msg.payload is ", errorMessage);
      $("#errorMessage1").text(errorMessage);
      $("#errorMessage1").dialog();
      $("#oncoprintInstructions").css("display", "block");
      $("#oncoprintControlsDiv").css("display", "none");  
      $("#onc").empty();
      postStatus("msg.status is error.");
   }else{
     xx = JSON.parse(msg.payload);
     console.log("displayOncoprint print recieved genes: %s",xx[1]);
     genes = xx[1];
     processed_data = JSON.parse(xx[0]);
     console.log("*****no error report but the processed_data is: ", processed_data);
     var then = Date.now(); 
     onc = Oncoprint.create('#onc', {cell_padding: cell_padding, cell_width: cell_width});
       console.log("Milliseconds to create Oncoprint div: ", Date.now() - then); 
     onc.suppressRendering();
       
     var startGenes = Date.now(); 
        
     $.when(processed_data).then(function() {

        if(typeof(genes) === "string"){
          genes = [genes];
         }  
        tracks_to_load = genes.length;
        console.log("Number of tracks to load: ", tracks_to_load);

        var track_id = [];
        for(i = 0; i < genes.length; i++){
          var thisGeneStart = Date.now();
          gene = genes[i];
    
          var data_gene = processed_data.filter(data_gene_map); 

          var addTrackStart = Date.now();
          track_id[i] = onc.addTrack({label: gene, removable:true}, 0);
          console.log("Milliseconds to addTrack ", gene, " : ", Date.now() - addTrackStart);

          if(i === 0){
            onc.setRuleSet(track_id[i], Oncoprint.GENETIC_ALTERATION);
          }else{
            onc.useSameRuleSet(track_id[i], track_id[0]);
          }

          onc.setTrackData(track_id[i], data_gene, true);

        }
        
      onc.releaseRendering();
      onc.sort();
      console.log("Milliseconds to step through processded_data ", Date.now() - startGenes);
    });    
    postStatus("oncoprint is displayed");
  }
   console.log("#######Computing since msg sent took: " + (Date.now() - compute_start) + " milliseconds"); 
   
} // displaySurvivalCurves
//----------------------------------------------------------------------------------------------------
function data_gene_map(obj) {
  return obj.gene === gene;
}

//-------------------------------------------------------------------------------------------
// when a dataset is specified, this module 
//  1) extracts the name of the dataset from the payload of the incoming msg
//  2) (for now) extracts the name of the matrices, from the manifest (also in the payload
//     of the incoming msg, chooses the first mtx.mrna entry it finds
//  3) sends a "createPLSR" message to the server, with dataset & matrix name specified
//  4) asks that the server, upon successful completion of that createPLSR request, callback
//     here so that the sliders can be set
function datasetSpecified(msg)
{
   console.log("--- Module.oncoprint, datasetSpecified: " + msg.payload);
   hub.enableTab(thisModulesOutermostDiv);
   $("#oncoprintInstructions").css("display", "block");
   $("#oncoprintControlsDiv").css("display", "none");
   $("#onc").empty();
   postStatus("dataset specified");
} // datasetSpecified
//--------------------------------------------------------------------------------------------
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
return{
   init: function(){
        hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
        hub.addOnDocumentReadyFunction(initializeUI);
        hub.addMessageHandler("datasetSpecified", datasetSpecified);
        hub.addMessageHandler("sendSelectionTo_Oncoprint", handleSelections);
        hub.addMessageHandler("displayOncoprint", displayOncoprint);
      },
    genes: function(){
       return genes;
    }
}; // OncoprintTabModule return value

//----------------------------------------------------------------------------------------------------
}); // OncoprintTabModule

OncoprintM = OncoprintModule();
OncoprintM.init();