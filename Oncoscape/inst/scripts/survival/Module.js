"user strict";
//----------------------------------------------------------------------------------------------------
var SurvivalModule = (function () {

  var currentDataSet;
  var statusDiv;

  var survivalCurveDiv;
  var survivalImageArea;

  var thisModulesName = "survival";
  var thisModulesOutermostDiv = "survivalDiv";
  var selectionDestinationsOfferedHere = ["survival"];

//----------------------------------------------------------------------------------------------------
function initializeUI()
{
   survivalCurveDiv = $("#survivalCurveDiv");
   survivalImageArea = $("#survivalImageArea");
   statusDiv = $("#survivalStatusDiv");

   $(window).resize(handleWindowResize);
   handleWindowResize();
   hub.disableTab(thisModulesOutermostDiv);

}  // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
   //console.log("survivalCurveDiv window resize: " + $(window).width() + ", " + $(window).height());

   var newHeight = $(window).height() * 0.8;
   var newWidth = $(window).width() * 0.95;

   survivalCurveDiv.width(newWidth);
   survivalCurveDiv.height(newHeight);
   survivalImageArea.width(newWidth);
   survivalImageArea.height(newHeight);
  
} // handleWindowResize
//----------------------------------------------------------------------------------------------------
function handlePatientIDs(msg)
{
   var ids = msg.payload.value;
   var count = msg.payload.count;
   var source = msg.payload.source;  

   if(typeof(ids) == "string")
      ids = [ids];

   console.log("Survival module, " + msg.cmd + " count: " + count);
   analyzeSelectedTissues(ids, "");

} // handleTissueIDsForSurivalStats
//----------------------------------------------------------------------------------------------------
function analyzeSelectedTissues(patientIDs, title)
{
   console.log("Survival module, hub.send 'calculateSurvivalCurves' for %d patientIDs",
               patientIDs.length);

   var payload = {sampleIDs: patientIDs, title: title};
   var msg = {cmd:"calculateSurvivalCurves", callback: "displaySurvivalCurves", status: "request", 
              payload: payload};

   hub.send(JSON.stringify(msg));

} // analyzeSelectedTissues
//----------------------------------------------------------------------------------------------------
function getSurvivalPlot(msg)
{
   console.log("create Survival Plot for: ", msg);
   var payload = JSON.parse(msg.payload);
   var storage = [];

   for(var i=0;i<Object.keys(payload).length;i++){
      var patient = Object.keys(payload)[i];
      storage.push({ID: patient, value: payload[patient]});
      }

} // getSurvivalPlot
//----------------------------------------------------------------------------------------------------
function postStatus(msg)
{
  statusDiv.text(msg);

} // postStatus
//----------------------------------------------------------------------------------------------------
function displaySurvivalCurves(msg)
{
   //console.log("about to add survival curve image to survivalCurve div");
   var encodedImage = msg.payload;
   document.getElementById("survivalImageArea").src = encodedImage;
   hub.raiseTab(thisModulesOutermostDiv);
   postStatus("image loaded");
   // survivalImageArea.src = encodedImage;

} // displaySurvivalCurves
//----------------------------------------------------------------------------------------------------
function specifyCurrentDataset(datasetName)
{
   console.log("Module.survival, specifyCurrentDataset: " + datasetName);

   var msg = {cmd: "specifyCurrentDataset",  callback: "survivalDatasetSpecified", 
              status: "request", payload: datasetName};

   hub.send(JSON.stringify(msg));

} // specifyCurrentDataset
//----------------------------------------------------------------------------------------------------
function datasetSpecified(msg)
{
   console.log("--- Module.survival, datasetSpecified: " + msg.payload);
   hub.enableTab(thisModulesOutermostDiv)
   document.getElementById("survivalImageArea").src = ""

} // datasetSpecified
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
// the standalone-test
function sat(maxReps)
{
   if(typeof(maxReps) == "undefined")
      maxReps = 3;

     // might need to code defensively here, waiting for this request to return before proceeding
   specifyCurrentDataset("TCGAgbm");

   var pool = demoPatientSet();

   var maxIndex = pool.length - 1;
   
   var worker = function(randomIDs){
      console.log("survival on %d randomIDs", randomIDs.length);
      analyzeSelectedTissues(randomIDs, "");
      };

   for(var reps=0; reps < maxReps; reps++){
     var randomIDs = [];
     var count = hub.getRandomInt(4, maxIndex+1);   // get between 4 and ~40 patient ids
     for(var i=0; i < count; i++){
       randomIDs.push(pool[hub.getRandomInt(0, maxIndex)]);
       }
    analyzeSelectedTissues(randomIDs, "rep " + reps);
    }  // for reps

} // sat
//----------------------------------------------------------------------------------------------------
return{
   init: function(){
      hub.addOnDocumentReadyFunction(initializeUI);
      hub.registerSelectionDestination(selectionDestinationsOfferedHere, thisModulesOutermostDiv);
	  hub.addMessageHandler("datasetSpecified", datasetSpecified);
      hub.addMessageHandler("survivalDatasetSpecified", datasetSpecified);
      hub.addMessageHandler("displaySurvivalCurves", displaySurvivalCurves);
      hub.addMessageHandler("sendSelectionTo_survival", handlePatientIDs);
      },
   sat: sat   // standalone test
   };

}); // SurvivalModule
//----------------------------------------------------------------------------------------------------
var survival = SurvivalModule();
survival.init();
