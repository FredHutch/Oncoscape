var datasetName = null;
var colorList = null;
var colorLegend = null;
var pc1variance = null;
var pc2variance = null;

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
  var displayInfoButton;
  //var useAllSamplesInCurrentDatasetButton;
  var expressionMatrixMenu;
  var geneSetMenu;
  var sampleGroupVizMenu;
  var currentIdentifiers = [];
  var infoMenu;

  var sendSelectionsMenuTitle = "Send selection...";
  var selectionDestinationsOfferedHere = ["PCA", "PCA (highlight)"];

//------------------------------------------------------------------------------------------------------------------------
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

  displayInfoButton = $("#pcaInfoButton")
  displayInfoButton.button();
  //hub.disableButton(displayInfoButton);
  displayInfoButton.click(displayInfo);
  
  //useAllSamplesInCurrentDatasetButton = $("#pcaUseAllSamplesButton");
  //useAllSamplesInCurrentDatasetButton.button();
  //useAllSamplesInCurrentDatasetButton.click(useAllSamplesInCurrentDataset);
  //hub.disableButton(useAllSamplesInCurrentDatasetButton);

  expressionMatrixMenu = $("#pcaExpressionMatrixSelector")

  geneSetMenu = $("#pcaGeneSetSelector");
  geneSetMenu.change(function(){
     console.log("gene set is now " + geneSetMenu.val());
     //msg = {payload: {ids:currentIdentifiers}, status: "success"}
     //handlePatientIDs(msg)
     });  // ASSUMES success and requires use of GLOBAL variable storing identifiers WITHOUT passing through WS


  sampleGroupVizMenu = $("#pcaVizGroupSelector");
  sampleGroupVizMenu.change(updateSampleViz);
  hub.disableButton(sampleGroupVizMenu);

  pcaTextDisplay = $("#pcaTextDisplayDiv");

  pcaSendSelectionMenu = hub.configureSendSelectionMenu("#pcaSendSelectionsMenu", 
                                                        selectionDestinationsOfferedHere, sendSelections,
                                                        sendSelectionsMenuTitle);
/// BUG FIX NECESSARY:		
//  $("#pcaSendSelectionsMenu").css("display", "none")                                                     
///
  hub.disableTab(thisModulesOutermostDiv)
 
}; // initializeUI
//------------------------------------------------------------------------------------------------------------------------
function displayInfo()
{
   var title = "PCA Details";
   var text = "";
   text = text + "<ul>";
   text = text + "  <li> PC1 variance: " + pc1variance + "%";
   text = text + "  <li> PC2 variance: " + pc2variance + "%";

   if(colorLegend != null){
      var categories = Object.keys(colorLegend)
      for(var i=0; i < categories.length; i++){
         category = categories[i];
         text = text + "  <li> " + category + ": " + colorLegend[category];
         } // for i
      }
      
  text = text + "</ul>";
  
  $("<div>").html(text).dialog({title: title, width:500, height:300});

} // displayInfo
//------------------------------------------------------------------------------------------------------------------------
function getPatientClassification ()
{
   payload = "";
   msg = {cmd: "getPatientClassification", callback: "handlePatientClassification", 
          status: "request", payload: payload};
   hub.send(JSON.stringify(msg));

} // getPatientClassification
//------------------------------------------------------------------------------------------------------------------------
function handlePatientClassification (msg)
{
   if(msg.status == "success"){
      patientClassification = msg.payload;
      console.log("got classification, length " + patientClassification.length);
      }
   else{
     alert("error!" + msg.payload)
     }

} // handlePatientClassification
//------------------------------------------------------------------------------------------------------------------------
function addGeneSetNamesToMenu (geneSetNames)
{
   console.log("Module.pca:addGetSetNamesToMenu");

   if(geneSetNames.length == 0) {
     postStatus("addGeneSetNamesToMenu: geneSetNames.length == 0");
     return;
     }
    
   if(typeof geneSetNames == "string") 
      geneSetNames = [geneSetNames] 
      
   for(var i=0; i < geneSetNames.length; i++){
     optionMarkup = "<option>" + geneSetNames[i] + "</option>";
     geneSetMenu.append(optionMarkup);
     } // for i

  postStatus("addGeneSetNamesToMenu: complete");
  hub.enableTab(thisModulesOutermostDiv)

} // addGeneSetNamesToMenu
//------------------------------------------------------------------------------------------------------------------------
function addSampleGroupNamesToMenu(names)
{
   if(typeof names == "string") 
      names = [names] 
      
   optionMarkup = "<option>Black</option>";
   sampleGroupVizMenu.append(optionMarkup);

   for(var i=0; i < names.length; i++){
     optionMarkup = "<option>" + names[i] + "</option>";
     sampleGroupVizMenu.append(optionMarkup);
     } // for i

  postStatus("addSampleGroupNamesToMenu: complete");
  hub.enableTab(thisModulesOutermostDiv)

} // addSampleGroupNamesToMenu
//------------------------------------------------------------------------------------------------------------------------
//function useAllSamplesInCurrentDataset()
//{
//  currentPatientIDs = null;
//  hub.disableButton(useAllSamplesInCurrentDatasetButton);
//
//}  // useAllSamplesInCurrentDataset
//------------------------------------------------------------------------------------------------------------------------
function changePCAids(msg)
{
   patientIDs = []
   selections = msg.payload;
   d3.values(selections).forEach(function(d){ d.patientIDs.forEach(function(id){patientIDs.push(id)})})
   sendSelectionToModule("PCA", patientIDs)

} // changePCAids
//------------------------------------------------------------------------------------------------------------------------
function drawLegend ()
{
  if(typeof(patientClassification) == "undefined")
     return;

  for(var i=0; i<patientClassification.length; i++){
    if(patientClassification[i].gbmDzSubType[0] == null | patientClassification[i].gbmDzSubType[0] == ""){
      patientClassification[i].gbmDzSubType[0]= "undefined";
      } // if
    } // for i

  var classifications = d3.nest()
                          .key(function(d) { return d.gbmDzSubType[0]; })
                          .map(patientClassification, d3.map);

  var LegendLabels = d3.values(classifications.keys())
 
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
                             return "translate(" + i*TextOffSet(d) + ",0)" 
                             });

    var text = legend.append("text")
                      .attr("y", 10)
                      .attr("x", 0)
                      .style("font-size", 12)
                      .text(function(d) { return d})
                      .attr("transform", function(d, i) { 
                          return "translate(" + 15 + ",0)";
                           });

    legend.append("circle")
          .attr("cx", 0)
          .attr("cy", 5)
          .attr("r", function(d) { return 6;})
          .style("fill", function(d)   { if(d=="undefined") return "white"; return classifications.get(d)[0].color[0]})
          .style("stroke", function(d) { if(d=="undefined") return "black"; return classifications.get(d)[0].color[0]})
 
} // drawLegend
//------------------------------------------------------------------------------------------------------------------------
function pcaHandleWindowResize () 
{
  pcaDisplay.width($(window).width() * 0.90);
  pcaDisplay.height($(window).height() * 0.80);

  if(!firstTime){
    d3PcaScatterPlot(pcaScores);
    }

} // handleWindowResize
//------------------------------------------------------------------------------------------------------------------------
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
//------------------------------------------------------------------------------------------------------------------------
function sendSelections(event)
{
  var destination = pcaSendSelectionMenu.val();

  var selectedIDs = pointsInBrushedRegion()
       
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
//------------------------------------------------------------------------------------------------------------------------
function pcaPlot (msg)
{
   hub.enableButton(sampleGroupVizMenu);
   hub.enableButton(displayInfoButton);
   
   if(msg.status == "success"){
      pcaScores = msg.payload.scores;
      currentIdentifiers = msg.payload.ids

      var pcaData = msg.payload.importance
      pc1variance = msg.payload["importance.PC1"];
      pc2variance = msg.payload["importance.PC2"];
      pc1variance =  Math.round(10000 * pc1variance)/100;
      pc2variance =  Math.round(10000 * pc2variance)/100;

      d3PcaScatterPlot(pcaScores, pc1variance, pc2variance);

      //var pcaText = $("#pcaTextDisplayDiv").html("")
      //pcaText.append("Proportion of Variance: ")
      //pcaText.append("PC1: "+PC1var.toFixed(2) + "%, PC2: "+PC2var.toFixed(2)+"%")
        
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
     };

//------------------------------------------------------------------------------------------------------------------------
function postStatus(msg)
{
  $("#pcaStatusDiv").text(msg);

} // postStatus
//------------------------------------------------------------------------------------------------------------------------
function highlightPatientIDs(msg)
{
   hub.raiseTab(thisModulesOutermostDiv);

   var candidates = msg.payload.value;
   console.log("=== Module.pca, highlightPatientIDs, candidates:");
   console.log(JSON.stringify(candidates));
   console.log("=== Module.pca, highlightPatientIDs, currentIdentifiers:");
   console.log(JSON.stringify(currentIdentifiers));

     // with currentIdentifiers (local shorter sample IDs) first, they
     // are returned:
     //   hub.intersectionOfArrays(currentIdentifiers, candidates)  ->    
     //      ["TCGA.02.0114", "TCGA.12.1088"]
     // rather than
     //    hub.intersectionOfArrays(candidates, currentIdentifiers) ->  
     //      ["TCGA.02.0114.01", "TCGA.12.1088.01"]

   var intersection = hub.intersectionOfArrays(candidates, currentIdentifiers);
   // debugger;
   console.log("=== Module.pca, highlightPatientIDs, intersection:");
   console.log(JSON.stringify(intersection));

   if(intersection.length == 0){
     count = candidates.length;
     errorMessage = "None of the incoming ids were recognized: ";
     for(var i=0; i < count; i++){
       errorMessage += candidates[i] + " ";
       }
     title = "Unrecognized Identifiers";
     $('<div />').html(errorMessage).dialog({title: title, width:600, height:300});
     } // if intersection
   else
     selectPoints(intersection, true);

} // highlightPatientIDs
//------------------------------------------------------------------------------------------------------------------------
function selectPoints(ids, clearIDs)
{
   console.log("=== module.pca: selectPoints");
   console.log("    incoming ids count: " + ids.length)
   //console.log(ids);

   d3.selectAll("circle")
     .filter(function(d, i){
        //console.log("examining currentIdentifier " + i + ": " + currentIdentifiers[i]);
        if(typeof(d) == "undefined")
           return(false);
        match = ids.indexOf(currentIdentifiers[i]);
        //console.log("match: " + match);
        return (match >= 0);
        }) // filter
     .classed("highlighted", true)
     .transition()
     .attr("r", 7)
     .duration(500);

} // selectPoints
//------------------------------------------------------------------------------------------------------------------------
function clearSelection()
{
   d3.selectAll("circle")
     .classed("highlighted", false)
     .attr("r", 3);

  d3PlotBrush.clear();
  svg.selectAll('.brush').call(d3PlotBrush);
  pcaHandleWindowResize();

} // clearSelection
//------------------------------------------------------------------------------------------------------------------------
function calculate()
{
   var geneSet = geneSetMenu.val();
   var expressionMatrix = expressionMatrixMenu.val()
   var payload = {datasetName: datasetName, geneset: geneSet, matrixName: expressionMatrix};

   //if(currentPatientIDs !== null)
   //    payload["samples"] = currentPatientIDs;

   msg = {cmd: "calculatePCA", callback: "pcaPlot", status: "request", payload: payload};
   console.log("sending calculatePCA: " + JSON.stringify(msg))
   hub.send(JSON.stringify(msg));
   $("#pcaInstructions").css("display", "none");
   $("#pcaDisplay").css("display", "block");

} // calculate
//------------------------------------------------------------------------------------------------------------------------
function handlePatientIDs(msg)
{
   console.log("Module.pca: handlePatientIDs");

   if(msg.status !== "error"){   // sometimes "success" from a prior call, sometimes "request"
     var currentGeneSet = geneSetMenu.val();
     var selectedPatientIdentifiers = msg.payload.value;
     currentPatientIDs = msg.payload.value;
     var payload = {samples: currentPatientIDs, genes: currentGeneSet};
     msg = {cmd: "calculatePCA", callback: "pcaPlot", status: "request", payload: payload};
     //hub.enableButton(useAllSamplesInCurrentDatasetButton);
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
    console.log("enabling pcaSendSelectionMenu")
    pcaSendSelectionMenu.prop("disabled",false);
    }
  else{
    console.log("disabling pcaSendSelectionMenu")
    pcaSendSelectionMenu.prop("disabled",true);
    }

} // d3PlotBrushReader
//------------------------------------------------------------------------------------------------------------------------
function chooseColor(id)
{
  //console.log("chooseColor for " + id);

  if(colorList == null)
     return("black")
     
  var allIDs = Object.keys(colorList)
  if(allIDs.indexOf(id) > 0){
     color = colorList[id];
     console.log(id + ": " + color);
     return(color);
     }

  return("black");

} // chooseColor
//------------------------------------------------------------------------------------------------------------------------
function d3PcaScatterPlot(dataset, pc1variance, pc2variance)
{
   //pcaSendSelectionMenu.prop("disabled",true);
   var padding = 50;
   var width = $("#pcaDisplay").width();
   var height = $("#pcaDisplay").height();

   var xMax = d3.max(dataset, function(d) { return +d[0];} );
   var xMin = d3.min(dataset, function(d) { return +d[0];} );
   var yMax = d3.max(dataset, function(d) { return +d[1];} );
   var yMin = d3.min(dataset, function(d) { return +d[1];} );
 
       // todo:  after finding min and max, determine largest of each axis in abs value
       // todo:  then find next larger even number, use that throughout
     
   xMax = xMax * 1.1
   xMin = xMin * 1.1
   yMax = yMax * 1.1
   yMin = yMin * 1.1

     //console.log("xMax: " + xMax);   console.log("xMin: " + xMin);
     //console.log("yMax: " + yMax);   console.log("yMin: " + yMin);

   d3pcaDisplay.select("#pcaSVG").remove();  // so that append("svg") is not cumulative
 
   var xScale = d3.scale.linear()
                  .domain([xMin,xMax])
                  .range([padding, width - padding]);

   var yScale = d3.scale.linear()
                  .domain([yMin, yMax])
                  .range([height - padding, padding]); // note inversion 

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
      .style("text-anchor", "start") // end, start, middle
      .text("PC2");
            
   var circle = svg.append("g").selectAll("circle")
                   .data(dataset)
                   .enter()
                   .append("circle")
                   .attr("cx", function(d,i) {return xScale(d[0]);})
                   .attr("cy", function(d,i) {return yScale(d[1]);})
                   .attr("r", function(d) { return 3;})
                   .style("fill", function(d,i) {
                        console.log("setting style for circle: " + currentIdentifiers[i]);
                        var color = chooseColor(currentIdentifiers[i]);
                        if(color == "") return "white"
                        return color;})
                   .style("stroke", function(d, i) {
                        var color = chooseColor(currentIdentifiers[i]);
                        if(color == "") return "black"
                        return color;})
                   .on("mouseover", function(d,i){
                         tooltip.text(currentIdentifiers[i]);
                         return tooltip.style("visibility", "visible");
                         })
                   .on("mousemove", function(){return tooltip.style("top",
                           (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
                   .on("mouseout", function(){return tooltip.style("visibility", "hidden");});
      
 
} // d3PcaScatterPlot
//------------------------------------------------------------------------------------------------------------------------
function datasetSpecified(msg)
{
   console.log("=== datasetSpecified");
   console.log(msg);

   datasetName = msg.payload;

      // for now, and very temporarily, use the first match (if any are found)

   //var matrixName = "mtx.mrna.ueArray";
   var matrixName = "mtx.mrna.bc";

   /***********
   var dataElementNames = msg.payload.rownames;
   var hits = dataElementNames.map(function(name) {if(name.indexOf("mtx.mrna") >= 0) return(name);});
   hits = hits.filter(function(n){ return (n !== undefined); });


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
      alert("No mtx.mrna in dataset '" + datasetName + "'");
      hub.disableButton(calculatePcaButton);
      return;
      }
    ************/

   console.log("== calling createPcaObjectOnServer");
   getExpressionMatrixNames();
   //createPcaObjectOnServer(datasetName, matrixName);

   d3pcaDisplay.select("#pcaSVG").remove();  // so that old layouts aren't mistaken for new dataset

} // datasetSpecified
//------------------------------------------------------------------------------------------------------------------------
function getExpressionMatrixNames()
{
  console.log("requesting expressionMatrixNames")
  payload = {datasetName: datasetName, category: "mrna expression"}

  msg = {cmd: "getMatrixNamesByCategory", callback: "pcaHandleExpressionMatrixNames",
         status: "request", payload: payload};

  msg.json = JSON.stringify(msg);
  console.log(msg.json);
  hub.send(msg.json);

} // getExpressionMatrixNames
//------------------------------------------------------------------------------------------------------------------------
function handleExpressionMatrixNames(msg)
{
   console.log("--- handleExpressionMatrixNames")
   console.log(JSON.stringify(msg))
   expressionMatrixMenu.empty()

   var matrixNames = msg.payload.expressionMatrixNames;
   if(typeof(matrixNames) == "string")
      matrixNames = [matrixNames];

   for(var i=0; i < matrixNames.length; i++){
      var name = matrixNames[i];
      var optionMarkup =  "<option value='" + name + "'>" + name + "</option>";
      expressionMatrixMenu.append(optionMarkup);
      }

   console.log("expression matrix menu updated");
   hub.enableTab("pcaDiv");
   hub.raiseTab("pcaDiv");

   requestGeneSetNames()


} // handleExpressionMatrixNames
//------------------------------------------------------------------------------------------------------------------------
function createPcaObjectOnServer(datasetName, matrixName)
{
  console.log("create PCA on server " + datasetName + ": " + matrixName);
  payload = {datasetName: datasetName, matrixName: matrixName};

  msg = {cmd: "createPCA", callback: "pcaObjectCreated", status: "request", payload: payload};

  msg.json = JSON.stringify(msg);
  console.log(msg.json);
  hub.send(msg.json);

} // createPcaObjectOnServer
//------------------------------------------------------------------------------------------------------------------------
function pcaObjectCreated(msg)
{
   console.log("=== pcaObjectCreated");
   console.log(msg);
   hub.enableTab("pcaDiv");
   hub.raiseTab("pcaDiv");
   calculate();
   
   //if(msg.status == "response")
   //  requestGeneSetNames();
   //else
   //   alert("PCA module failed to create PCA object on server");

} // pcaObjectCreated
//------------------------------------------------------------------------------------------------------------------------
function requestGeneSetNames()
{
   callback = "pcaHandleGeneSetNames";

   payload = {dataset: datasetName, items: "geneSets"};
   msg = {cmd:"getDatasetItemsByName", callback: callback, status: "request", payload: payload};

   hub.send(JSON.stringify(msg));

} // requestGeneSetNames
//------------------------------------------------------------------------------------------------------------------------
function handleGeneSetNames(msg)
{
   geneSetMenu.empty();

   newNames = msg.payload.geneSets
   if(newNames != null){
      addGeneSetNamesToMenu(newNames);
      }

   requestGroupVizGroupNames();
   
} // handleGeneSetNames
//------------------------------------------------------------------------------------------------------------------------
function requestGroupVizGroupNames()
{
   hub.enableTab("pcaDiv");
   hub.raiseTab("pcaDiv");

   callback = "pcaHandleGroupVizGroupNames";
               
   payload = {dataset: datasetName, items: "tbl.groupVizProps"};
   msg = {cmd:"getDatasetItemsByName", callback: callback, status: "request", payload: payload};

   hub.send(JSON.stringify(msg));

} // requestGroupVizGroupNames
//------------------------------------------------------------------------------------------------------------------------
function handleGroupVizGroupNames(msg)
{
   console.log("==== handleGroupVizGroupNames");
   sampleGroupVizMenu.empty();

   var tbl = msg.payload["tbl.groupVizProps"];

   if(tbl != null){
     var mtx = msg.payload["tbl.groupVizProps"].mtx;
     var groupNames = jQuery.unique(mtx.map(function(row){return row[0]}));
     addSampleGroupNamesToMenu(groupNames);
     }
   
} // handleGroupVizGroupNames
//------------------------------------------------------------------------------------------------------------------------
// called when user changes the pcaVizGroupSelector menu
function updateSampleViz()
{
   var value = sampleGroupVizMenu.val();
   if(value == "Black"){
      colorList = null;
      pcaHandleWindowResize();
      return;
      }
      
   callback = "pcaHandleSampleColors";

   payload = {dataset: datasetName, groupName: value, samples: currentIdentifiers};
   msg = {cmd: "getSampleColors", callback: callback, status: "request", payload: payload};

   hub.send(JSON.stringify(msg));

} // updateSampleViz
//------------------------------------------------------------------------------------------------------------------------
handleSampleColors = function(msg)
{
   hub.enableButton(displayInfoButton);
   
   console.log("=== getSampleColors")
   colorList = msg.payload.colors;
   colorLegend = msg.payload.legend
     // a simple strategy to force redraw, in which colorList is include
   pcaHandleWindowResize();

} // handelSampleColors
//------------------------------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.registerSelectionDestination(selectionDestinationsOfferedHere, thisModulesOutermostDiv);
   hub.addMessageHandler("datasetSpecified", datasetSpecified);
   hub.addMessageHandler("pcaHandleExpressionMatrixNames", handleExpressionMatrixNames)
   hub.addMessageHandler("sendSelectionTo_PCA", handlePatientIDs);
   hub.addMessageHandler("sendSelectionTo_PCA (highlight)", highlightPatientIDs)
   hub.addMessageHandler("pcaHandleGeneSetNames", handleGeneSetNames);
   hub.addMessageHandler("pcaHandleGroupVizGroupNames", handleGroupVizGroupNames);
   hub.addMessageHandler("pcaHandleSampleColors", handleSampleColors);
   hub.addMessageHandler("pcaPlot", pcaPlot);
   //hub.addMessageHandler("demoPcaCalculateAndDraw", demoPcaCalculateAndDraw);
   //hub.addMessageHandler("pcaAssessUserIdForTesting", assessUserIdForTesting);
   //hub.addSocketConnectedFunction(runAutomatedTestsIfAppropriate);

   //hub.addMessageHandler("handlePatientClassification", handlePatientClassification)
   // hub.addSocketConnectedFunction(getPatientClassification);

} // initializeModule
//------------------------------------------------------------------------------------------------------------------------
return{
  init: initializeModule,
  };
    
}); // PCAModule
//------------------------------------------------------------------------------------------------------------------------
pca = PCAModule();
pca.init();

