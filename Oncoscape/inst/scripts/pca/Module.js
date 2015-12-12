//----------------------------------------------------------------------------------------------------

var PCAModule = (function () {

  var currentPatientIDs = null;
  var pcaScores;
  var pcaSelectedRegion;    // from brushing
    // by default, all patients (aka 'samples') in the current dataset are used for
    // all pca analyses.
    // but if a group of patientIDs arrived here as an incoming selection (via a 'handlePatientIDs' 
    // message) then that list is used until it is
    //   - replaced by another incoming set of ids
    //   - the "use all patientIDs in dataset" button is clicked


  var pcaDisplay;
  var d3pcaDisplay;
  var d3PlotBrush;
  var svg;
  var patientClassification;
  var firstTime = true;
  var pcaTextDisplay, pcaScreeDiv, pcaScoresDiv;

  var testResultsOutputDiv;

  var patientMenu;
  var pcaSendSelectionMenu;

  var thisModulesName = "PCA";
  var thisModulesOutermostDiv = "pcaDiv";
  var tempTest;
  var clearSelectionButton;
  var calculatePcaButton;
  var useAllSamplesInCurrentDatasetButton;
  var geneSetMenu;
  var currentIdentifiers = [];
  var infoMenu;

  var sendSelectionsMenuTitle = "Send selection...";
  var selectionDestinationsOfferedHere = ["PCA", "PCA (highlight)"];
  var pcaMsg; 
  var highlightIndex = [];
//----------------------------------------------------------------------------------------------------
function initializeUI ()
{
  pcaDisplay = $("#pcaDisplay");
  d3pcaDisplay = d3.select("#pcaDisplay");
  pcaHandleWindowResize();
  testResultsOutputDiv = $("#pcaTestingOutputDiv");

  $(window).resize(pcaHandleWindowResize);

  clearSelectionButton = $("#pcaClearSelectionButton");
  clearSelectionButton.button();
  clearSelectionButton.click(clearSelection);

  calculatePcaButton = $("#pcaCalculateButton");
  calculatePcaButton.button();
  $("#pcaDisplay").css("display", "none");
  calculatePcaButton.click(calculate);
  useAllSamplesInCurrentDatasetButton = $("#pcaUseAllSamplesButton");
  useAllSamplesInCurrentDatasetButton.button();
  useAllSamplesInCurrentDatasetButton.click(useAllSamplesInCurrentDataset);
  hub.disableButton(useAllSamplesInCurrentDatasetButton);

  geneSetMenu = $("#pcaGeneSetSelector");
  geneSetMenu.change(function(){
     console.log("gene set is now " + geneSetMenu.val());
     //msg = {payload: {ids:currentIdentifiers}, status: "success"}
     //handlePatientIDs(msg)
     });  // ASSUMES success and requires use of GLOBAL variable storing identifiers WITHOUT passing through WS

  pcaTextDisplay = $("#pcaTextDisplayDiv");

  pcaSendSelectionMenu = hub.configureSendSelectionMenu("#pcaSendSelectionsMenu", 
                                                        selectionDestinationsOfferedHere, sendSelections,
                                                        sendSelectionsMenuTitle);
/// BUG FIX NECESSARY:		
//  $("#pcaSendSelectionsMenu").css("display", "none")                                                     
///
  hub.disableTab(thisModulesOutermostDiv);
 
} // initializeUI
//----------------------------------------------------------------------------------------------------
function showLegend(){

  var text = $("#PCALegend").html();
  var title = "PCA Legend";
  $("<div>").html(text).dialog({title: title, width:600, height:600});

} // showHelp
//----------------------------------------------------------------------------------------------------
function getPatientClassification ()
{
   payload = "";
   msg = {cmd: "getPatientClassification", callback: "handlePatientClassification", 
          status: "request", payload: payload};
   hub.send(JSON.stringify(msg));

} // getPatientClassification
//----------------------------------------------------------------------------------------------------
function handlePatientClassification (msg)
{
   if(msg.status == "success"){
      patientClassification = msg.payload;
      console.log("got classification, length " + patientClassification.length);
      }
   else{
     alert("error!" + msg.payload);
     }

   //drawLegend()

} // handlePatientClassification
//----------------------------------------------------------------------------------------------------
function requestGeneSetNames()
{
   console.log("=== requestGeneSetNames");

   callback = "pcaHandleGeneSetNames";

   msg = {cmd:"getGeneSetNames",
          callback: callback,
          status:"request",
          payload:""};

   hub.send(JSON.stringify(msg));

} // requestGeneSetNames
//----------------------------------------------------------------------------------------------------
function requestSampleNames()
{
   console.log("=== requestSampleNames");

   callback = " ";

   msg = {cmd:"canonicalizePatientIDsInDataset",
          callback:callback ,
          status:"request",
          payload:""};

   hub.send(JSON.stringify(msg));

} // requestSampleNames
//----------------------------------------------------------------------------------------------------
function handleGeneSetNames(msg)
{
   console.log("=== handleGeneSetNames");

   newNames = msg.payload;
   addGeneSetNamesToMenu(newNames);

} // handleGeneSetNames
//----------------------------------------------------------------------------------------------------
function addGeneSetNamesToMenu (geneSetNames)
{
   console.log("Module.pca:addGetSetNamesToMenu");

   geneSetMenu.empty();

   if(geneSetNames.length === 0) {
     postStatus("addGeneSetNamesToMenu: geneSetNames.length == 0");
     return;
     }
    
   if(typeof geneSetNames == "string") 
   	 geneSetNames = [geneSetNames]; 
 
      
   for(var i=0; i < geneSetNames.length; i++){
     optionMarkup = "<option>" + geneSetNames[i] + "</option>";
     geneSetMenu.append(optionMarkup);
     } // for i

  postStatus("addGeneSetNamesToMenu: complete");
  hub.enableTab(thisModulesOutermostDiv);



} // addGeneSetNamesToMenu
//----------------------------------------------------------------------------------------------------
function useAllSamplesInCurrentDataset()
{
  currentPatientIDs = null;
  hub.disableButton(useAllSamplesInCurrentDatasetButton);

}  // useAllSamplesInCurrentDataset
//----------------------------------------------------------------------------------------------------
function changePCAids(msg)
{
   patientIDs = [];
   selections = msg.payload;
   d3.values(selections).forEach(function(d){ d.patientIDs.forEach(function(id){patientIDs.push(id);});});
   sendSelectionToModule("PCA", patientIDs);

} // changePCAids
//----------------------------------------------------------------------------------------------------
function drawLegend ()
{
  if(typeof(patientClassification) == "undefined")
     return;

  for(var i=0; i<patientClassification.length; i++){
    if(patientClassification[i].gbmDzSubType[0] === null | patientClassification[i].gbmDzSubType[0] === ""){
      patientClassification[i].gbmDzSubType[0]= "undefined";
      } // if
    } // for i

  var classifications = d3.nest()
                          .key(function(d) { return d.gbmDzSubType[0]; })
                          .map(patientClassification, d3.map);

  var LegendLabels = d3.values(classifications.keys());
 
  var Legendsvg = d3.select("#pcaLegend").append("svg")
                      .attr("id", "pcaLegendSVG")
                      .attr("width", $("#pcaDisplay").width())
                      .attr("height", 50);
  
   var TextOffset =  [0, 87, 87, 87, 87, 87, 87];
   var TextOffSet = d3.scale.ordinal()
                      .range(TextOffset)
                      .domain(classifications.keys());
        
   var legend = Legendsvg.append("g")
                         .attr("class", "legend")
                         .attr("transform", "translate(" + 10 + "," + 10 + ")")  
                         .selectAll(".legend")
                         .data(LegendLabels)
                         .enter().append("g")
                         .attr("transform", function(d, i) { 
                             return "translate(" + i*TextOffSet(d) + ",0)"; 
                             });

    var text = legend.append("text")
                      .attr("y", 10)
                      .attr("x", 0)
                      .style("font-size", 12)
                      .text(function(d) { return d;})
                      .attr("transform", function(d, i) { 
                          return "translate(" + 15 + ",0)";
                           });

    legend.append("circle")
          .attr("cx", 0)
          .attr("cy", 5)
          .attr("r", function(d) { return 6;})
          .style("fill", function(d)   { if(d=="undefined") return "white"; return classifications.get(d)[0].color[0];})
          .style("stroke", function(d) { if(d=="undefined") return "black"; return classifications.get(d)[0].color[0];});
 
} // drawLegend
//----------------------------------------------------------------------------------------------------
function pcaHandleWindowResize () 
{
  pcaDisplay.width($(window).width() * 0.95);
  pcaDisplay.height($(window).height() * 0.80);

  if(!firstTime){
    d3PcaScatterPlot(pcaScores);
    }

} // handleWindowResize
//----------------------------------------------------------------------------------------------------
function pointsInBrushedRegion()
{
  x1=pcaSelectedRegion[0][0];
  y1=pcaSelectedRegion[0][1];
  x2=pcaSelectedRegion[1][0];
  y2=pcaSelectedRegion[1][1];

  var selectedIDs = [];

  for(var i=0; i < pcaScores.length; i++){
    px = pcaScores[i][0];
    py = pcaScores[i][1];
    if(px >= x1 & px <= x2 & py >= y1 & py <= y2){
      console.log(" selected: " + currentIdentifiers[i]);
      selectedIDs.push(currentIdentifiers[i]);
      }
    } // for i

  return(selectedIDs);

} // pointsInBrushedRegion
//----------------------------------------------------------------------------------------------------
function sendSelections(event)
{
  var destination = pcaSendSelectionMenu.val();

  var selectedIDs = pointsInBrushedRegion();
       
   if(selectedIDs.length > 0){
      var cmd = "sendSelectionTo_" + destination;
      payload = {value: selectedIDs, count: selectedIDs.length, source: "PCA module"};
      var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};
      pcaSendSelectionMenu.val(sendSelectionsMenuTitle);
      hub.send(JSON.stringify(newMsg));
      }
   else{
     alert("No selections to send...");
     }

} // sendSelections
//----------------------------------------------------------------------------------------------------
function pcaPlot (msg)
{
   if(msg.status == "success"){
      pcaScores = msg.payload.scores;
      var geneSet = msg.payload.geneSetName;
      currentIdentifiers = msg.payload.ids;
      console.log("*****pcaPlot received currentIdentifier length: ", currentIdentifiers.length);
      console.log("*****pcaPlot received pcaScores length: ", pcaScores.length);
      //capture message and store to a global variable for testing purpose
      pcaMsg = {selectedIDs:currentIdentifiers, pcaScores:pcaScores, geneSet:geneSet};
      for(var i = 0; i < pcaMsg.selectedIDs.length; i++) { pcaMsg.selectedIDs[i] = pcaMsg.selectedIDs[i].slice(0, 12);}
      console.log("*****pcaPlot selectedIDs", pcaMsg.selectedIDs);
      d3PcaScatterPlot(pcaScores);

      var pcaData = msg.payload.importance;
      var PC1var = 100 * msg.payload["importance.PC1"];
      var PC2var = 100 * msg.payload["importance.PC2"];
      var pcaText = $("#pcaTextDisplayDiv").html("");
      pcaText.append("Proportion of Variance: ");
      pcaText.append("PC1: "+PC1var.toFixed(2) + "%, PC2: "+PC2var.toFixed(2)+"%");
        
      //if(!firstTime){  // first call comes at startup.  do not want to raise tab then.
      hub.raiseTab(thisModulesOutermostDiv);
      postStatus("pcaPlot: success");
      //  }
      }// if success
    else{
      errorMessage = msg.payload;
      $("<div/>").html(errorMessage).dialog({title: "pcaPlot error", width:600, height:300});
      postStatus("pcaPlot: error");
      }
     firstTime = false;
}
//----------------------------------------------------------------------------------------------------
function postStatus(msg)
{
  $("#pcaStatusDiv").text(msg);

} // postStatus
//----------------------------------------------------------------------------------------------------
function highlightPatientIDs(msg)
{
   hub.raiseTab(thisModulesOutermostDiv);

   var candidates = msg.payload.value;
   //var testing = msg.payload.testing;
   //pcaMsg.selectedIDs = candidates;
   console.log("=== Module.pca, highlightPatientIDs, candidates:");
   //console.log(JSON.stringify(candidates));
   console.log("=== Module.pca, highlightPatientIDs, currentIdentifiers:");
   //console.log(JSON.stringify(currentIdentifiers));
     // with currentIdentifiers (local shorter sample IDs) first, they
     // are returned:
     //   hub.intersectionOfArrays(currentIdentifiers, candidates)  ->    
     //      ["TCGA.02.0114", "TCGA.12.1088"]
     // rather than
     //    hub.intersectionOfArrays(candidates, currentIdentifiers) ->  
     //      ["TCGA.02.0114.01", "TCGA.12.1088.01"]
   if(currentIdentifiers.length === 0){
     title = "PCA plot not calculated";
     errorMessage = "Please calculate PCA plot before sending identifiers for highlighting.";
     $('<div />').html(errorMessage).dialog({title: title, width:600, height:300});
     return; 
   }
   var intersection = hub.intersectionOfArrays(candidates, currentIdentifiers);
   // debugger;
   console.log("=== Module.pca, highlightPatientIDs, intersection:");
   console.log(JSON.stringify(intersection));

   if(intersection.length === 0){
     count = candidates.length;
     errorMessage = "None of the incoming ids were recognized: ";
     for(var i=0; i < count; i++){
       errorMessage += candidates[i] + " ";
       }
     title = "Unrecognized Identifiers";
     $('<div />').html(errorMessage).dialog({title: title, width:600, height:300});
     postStatus("intersection.length === 0");
     } // if intersection
   else{
     selectPoints(intersection, true);
     //postStatus("intersection.length !== 0");
   }
} // highlightPatientIDs
//----------------------------------------------------------------------------------------------------
function selectPoints(ids, clearIDs)
{
   console.log("=== module.pca: selectPoints");
   console.log("    incoming ids count: " + ids.length);
   //console.log(ids);
   
   if(true){
     d3.selectAll("circle")
       .filter(function(d, i){
         //console.log("examining currentIdentifier " + i + ": " + currentIdentifiers[i]);
         if(typeof(d) == "undefined")
           return(false);
         match = ids.indexOf(currentIdentifiers[i]);
         //highlightIndex.push(match);
         //console.log("match: " + match);
         return (match >= 0);
       }) // filter
       .classed("highlighted", true)
       .transition()
       .attr("r", 7)
       .duration(500);
   }
   //pcaMsg.highlightIndex = highlightIndex;
   setTimeout(function(){
            console.log("*****Module.js within selectPoints before qunit");
            console.log("***** Date time: ", Date());
            postStatus("selectPoints are highlighted"); 
   }, 5000);
 } // selectPoints
//----------------------------------------------------------------------------------------------------
function clearSelection()
{
   d3.selectAll("circle")
     .classed("highlighted", false)
     .attr("r", 3);

  d3PlotBrush.clear();
  svg.selectAll('.brush').call(d3PlotBrush);
  pcaHandleWindowResize();

} // clearSelection
//----------------------------------------------------------------------------------------------------
function calculate()
{
   var currentGeneSet = geneSetMenu.val();
   var payload = {genes: currentGeneSet};

   if(currentPatientIDs !== null)
       payload.samples = currentPatientIDs;
       //payload["samples"] = currentPatientIDs;


   msg = {cmd: "calculatePCA", callback: "pcaPlot", status: "request", payload: payload};
   hub.send(JSON.stringify(msg));
   $("#pcaInstructions").css("display", "none");
   $("#pcaDisplay").css("display", "block");
} // calculate
//----------------------------------------------------------------------------------------------------
function handlePatientIDs(msg)
{
   console.log("Module.pca: handlePatientIDs");

   if(msg.status !== "error"){   // sometimes "success" from a prior call, sometimes "request"
     var currentGeneSet = geneSetMenu.val();
     var selectedPatientIdentifiers = msg.payload.value;
     currentPatientIDs = msg.payload.value;
     console.log("*****handlePatientIDs received patientID length: ", currentPatientIDs.length);
     var payload = {samples: currentPatientIDs, genes: currentGeneSet};
     msg = {cmd: "calculatePCA", callback: "pcaPlot", status: "request", payload: payload};
     hub.enableButton(useAllSamplesInCurrentDatasetButton);
     hub.send(JSON.stringify(msg));
     }
   else{
     alert("Module.pca handlePatientIDs error: " + JSON.stringify(msg));
     }

} // handlePatientIDs
//----------------------------------------------------------------------------------------------------
function d3PlotBrushReader ()
{
     //console.log("plotBrushReader 1037a 22jul2014");
  pcaSelectedRegion = d3PlotBrush.extent();
  console.log("region: " + pcaSelectedRegion);

  x0 = pcaSelectedRegion[0][0];
  x1 = pcaSelectedRegion[1][0];

  width = Math.abs(x0-x1);

  console.log("width: " + width);
  if(width > 0.001 &   pointsInBrushedRegion().length > 0){
    console.log("enabling pcaSendSelectionMenu");
    pcaSendSelectionMenu.prop("disabled",false);
    }
  else{
    console.log("disabling pcaSendSelectionMenu");
    pcaSendSelectionMenu.prop("disabled",true);
    }

} // d3PlotBrushReader
//----------------------------------------------------------------------------------------------------
function chooseColor(d)
{
  /********
  var id = d.id;
  for(var i=0; i<patientClassification.length; i++){
    var patientID = patientClassification[i]._row;
      // "TCGA.02.0047.01".indexOf("TCGA.02.0047") -> 0
      // using this strategy for partial match allows patient/tumor/sample multiplicity to be mapped
      // to patient classification
    if(id.indexOf(patientID) == 0){
       result = patientClassification[i].color;
       return(result)
       } // if match
    } // for i
 
   *********/
   return("black");

} // chooseColor
//----------------------------------------------------------------------------------------------------
function d3PcaScatterPlot(dataset)
{
   var padding = 50;
   var width = $("#pcaDisplay").width();
   var height = $("#pcaDisplay").height();

   var xMax = d3.max(dataset, function(d) { return +d[0];} );
   var xMin = d3.min(dataset, function(d) { return +d[0];} );
   var yMax = d3.max(dataset, function(d) { return +d[1];} );
   var yMin = d3.min(dataset, function(d) { return +d[1];} );
 
       // todo:  after finding min and max, determine largest of each axis in abs value
       // todo:  then find next larger even number, use that throughout
     
   xMax = xMax * 1.1;
   xMin = xMin * 1.1;
   yMax = yMax * 1.1;
   yMin = yMin * 1.1;

     //console.log("xMax: " + xMax);   console.log("xMin: " + xMin);
     //console.log("yMax: " + yMax);   console.log("yMin: " + yMin);

   d3pcaDisplay.select("#pcaSVG").remove();  // so that append("svg") is not cumulative
 
   var xScale = d3.scale.linear()
                  .domain([xMin,xMax])
                  .range([padding, width - padding]);

   var yScale = d3.scale.linear()
                  .domain([yMin, yMax])
                  .range([height - padding, padding]); // note inversion 
  pcaMsg.xScale = xScale;
  pcaMsg.yScale = yScale; 
   var xTranslationForYAxis = xScale(0);
   var yTranslationForXAxis = yScale(0);

   var xAxis = d3.svg.axis()
                 .scale(xScale)
                 .orient("top")
                 .ticks(5);

   var yAxis = d3.svg.axis()
                 .scale(yScale)
                 .orient("left")
                 .ticks(5);

   var tooltip = d3pcaDisplay.append("div")
                             .attr("data-toggle", "tooltip")
                             .style("position", "absolute")
                             .style("z-index", "10")
                             .style("visibility", "hidden")
                             .text("a simple tooltip");

   d3PlotBrush = d3.svg.brush()
                   .x(xScale)
                   .y(yScale)
                   .on("brushend", d3PlotBrushReader);

   svg = d3pcaDisplay.append("svg")
                         .attr("id", "pcaSVG")
                         .attr("width", width)
                         .attr("height", height)
                         .call(d3PlotBrush);

    svg.append("g")
       .attr("class", "x axis")
       .attr("transform", "translate(0, " + yTranslationForXAxis + ")")
       .call(xAxis)
       .append("text")
       .style("font-size", 14)
       .text("PC1");

   svg.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + xTranslationForYAxis + ", 0)")
      .call(yAxis)
      .append("text")
      .attr("y", 10)
      .attr("dy", ".71em")
      .style("font-size", 14)
      .style("text-anchor", "end") //start, middle
      .text("PC2");       
   var circle = svg.append("g").selectAll("circle")
                   .data(dataset)
                   .enter()
                   .append("circle")
                   .attr("cx", function(d,i) {return xScale(d[0]);})
                   .attr("cy", function(d,i) {return yScale(d[1]);})
                   .attr("r", function(d) { return 3;})
                   .style("fill", function(d) {
                        var color = chooseColor(d[0]);
                        if(color === "") return "white";
                        return color;})
                   .style("stroke", function(d) {
                        var color = chooseColor(d[0]);
                        if(color === "") return "black";
                        return color;})
                   .on("mouseover", function(d,i){
                         tooltip.text(currentIdentifiers[i]);
                         return tooltip.style("visibility", "visible");
                         })
                   .on("mousemove", function(){return tooltip.style("top",
                           (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
                   .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
} // d3PcaScatterPlot
//----------------------------------------------------------------------------------------------------
function datasetSpecified(msg)
{
   console.log("=== datasetSpecified");
   console.log(msg);

   var dataPackageName = msg.payload.datasetName;
   var dataElementNames = msg.payload.rownames;

      // for now, and very temporarily, use the first match (if any are found)
   var hits = dataElementNames.map(function(name) {if(name.indexOf("mtx.mrna") >= 0) return(name);});
   hits = hits.filter(function(n){ return (n !== undefined); });

   var matrixName = null;
   if(hits.length > 0){
        // for now always grab the first (last!) hit, remove the trailing .RData
        // the PCA constructor wants both dataPacakgeName & a matrix name
        // our convention is that the maniftest rowname is the same as
        // its name, with ".RData" appended
        // TODO: this needs to be a user menu selection (29 jun 2015)
      var lastHit = hits.length - 1;
      matrixName = hits[lastHit].replace(".RData", "");
      }
   else{
      alert("No mtx.mrna in dataset '" + dataPackageName + "'");
      hub.disableButton(calculatePcaButton);
      return;
      }

   console.log("== calling createPcaObjectOnServer");
   createPcaObjectOnServer(dataPackageName, matrixName);

   d3pcaDisplay.select("#pcaSVG").remove();  // so that old layouts aren't mistaken for new dataset

} // datasetSpecified
//--------------------------------------------------------------------------------------------
function createPcaObjectOnServer(dataPackageName, matrixName)
{
  console.log("create PCA on server " + dataPackageName + ": " + matrixName);
  payload = {dataPackage: dataPackageName, matrixName: matrixName};

  msg = {cmd: "createPCA", callback: "pcaObjectCreated", status: "request", payload: payload};

  msg.json = JSON.stringify(msg);
  hub.send(msg.json);

} // createPcaObjectOnServer
//--------------------------------------------------------------------------------------------
function pcaObjectCreated(msg)
{
   console.log("=== pcaObjectCreated");
   console.log(msg);

   if(msg.status == "response"){
      requestGeneSetNames();
    }else
      alert("PCA module failed to create PCA object on server");

} // pcaObjectCreated
//--------------------------------------------------------------------------------------------
// a simple test.  can be called from the console in global scope
demoPCAHighlight = function ()
{
   ids = ["TCGA.06.0192", "TCGA.12.0775", "TCGA.14.0789"];
   selectPoints(ids, true);

}; // demoHighlight
//----------------------------------------------------------------------------------------------------
demo = function ()
{
  msg = {cmd: "specifyCurrentDataset", callback: "pcaCurrentDataSetSpecified",
         status: "request", payload: "DEMOdz"};

  hub.send(JSON.stringify(msg));

}; // demo
//----------------------------------------------------------------------------------------------------
function demoPcaCalculateAndDraw(msg)
{
  if(msg.status != "success"){
     alert("demoPCA failed: " + msg.payload);
     return;
     }

  var currentGeneSet = geneSetMenu.val();
  if(currentGeneSet === null)
      currentGeneSet = "tcga.GBM.classifiers";

  console.log("demoPCA, currentGeneSet: " + currentGeneSet);
  payload = {ids: "", geneSet: currentGeneSet};
  msg = {cmd: "calculate_mRNA_PCA", callback: "pcaPlot", status: "request", payload: payload};
  hub.send(JSON.stringify(msg));

} // demoPcaCalculateAndDraw
//----------------------------------------------------------------------------------------------------
// query the oncoscape server for user id.  the callback then makes a local (that is,
// Module-specific) decision to run this module's automated tests based upon that id
//
function runAutomatedTestsIfAppropriate()
{
   var msg = {cmd: "getUserId",  callback: "pcaAssessUserIdForTesting",
              status: "request", payload: ""};

   hub.send(JSON.stringify(msg));

} // runAutomatedTestsIfAppropriate 
//----------------------------------------------------------------------------------------------------
function assessUserIdForTesting(msg)
{
   var userID = msg.payload;

   if(userID.indexOf("autoTest") === 0){
      console.log("plsr/Module.js running tests for user " + userID);
      for(var i=0; i < 3; i++)
          runTests();
      } // if autoTest

} // assessUserIdForTesting
//----------------------------------------------------------------------------------------------------
function ModuleMsg(){
  return pcaMsg;
}
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.registerSelectionDestination(selectionDestinationsOfferedHere, thisModulesOutermostDiv);
   hub.addMessageHandler("datasetSpecified", datasetSpecified);
   hub.addMessageHandler("sendSelectionTo_PCA", handlePatientIDs);
   hub.addMessageHandler("sendSelectionTo_PCA (highlight)", highlightPatientIDs);
   hub.addMessageHandler("pcaObjectCreated", pcaObjectCreated);
   hub.addMessageHandler("pcaHandleGeneSetNames", handleGeneSetNames);
   hub.addMessageHandler("pcaPlot", pcaPlot);
   hub.addMessageHandler("demoPcaCalculateAndDraw", demoPcaCalculateAndDraw);
   //hub.addMessageHandler("pcaAssessUserIdForTesting", assessUserIdForTesting);
   //hub.addSocketConnectedFunction(runAutomatedTestsIfAppropriate);

   //hub.addMessageHandler("handlePatientClassification", handlePatientClassification)
   // hub.addSocketConnectedFunction(getPatientClassification);

} // initializeModule
//----------------------------------------------------------------------------------------------------
return{
  init: initializeModule,
  demo: demo,
  ModuleMsg: ModuleMsg
  };
    
}); // PCAModule
//----------------------------------------------------------------------------------------------------
pca = PCAModule();
pca.init();
