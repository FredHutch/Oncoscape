//----------------------------------------------------------------------------------------------------
var cyGbm;   // keep this public so that the tabsApp can see it, reset on tab activate
var expressionData = [];   // consists of a gene list, a tissue list, and the data (a list of 
                           // gene/value pairs, each list named by a tissue (patient) id
var cnvData = [];
var mutationData = [];

var gbmPathwaysModule = (function () {

  var cyGbmDiv;
  var statusDiv; 
  var viewAbstractsButton, zoomSelectedButton;
  var tissueMenu, movieButton;
  var movieButtonOriginalColor, movieButtonDisabledColor = "lightGray";
  var selectLabel;

  var slowerMovieButton, fasterMovieButton;
  var currentMovieSpeed = 750;
  var movieSpeedReadout;
  var movieIntervalID;

  var searchBox;
  var edgeAbstractsOn = false;

  var moviePlaying = false;

  var infoMenu;

  var sendSelectionsMenu;
  var sendSelectionsMenuTitle = "Send selection...";

  var thisModulesName = "gbmPathways";
  var thisModulesOutermostDiv = "gbmPathwaysDiv";
  var selectionDestinations = [thisModulesName];
  var outermostDiv;
  var controlsDiv;

  var errorDialogBox;

  //--------------------------------------------------------------------------------------------
function initializeUI(network, vizmap)
{
   outermostDiv = $("#gbmPathwaysDiv");

   cyGbmDiv = $("#cyGbmPathwaysDiv");
   statusDiv = $("#gbmPathwaysStatusDiv");
   controlsDiv = $("#gbmPathwaysButtonDiv");

   selectLabel = $("#gbmPathwaysSelectLabel");
   selectLabel.css("color", "lightgray");   // not functional until some tissueIDs have been been added
   viewAbstractsButton = $("#gbmViewAbstractsButton");
   viewAbstractsButton.button();
   viewAbstractsButton.click(toggleEdgeSelection);

   zoomSelectedButton  = $("#gbmZoomSelectedButton");
   zoomSelectedButton.button()
   zoomSelectedButton.click(zoomSelection);

   tissueMenu = $("#gbmPathwaysSampleSelector");
   tissueMenu.change(tissueSelectorChanged);

   movieButton = $("#gbmPathwaysMovieButton");
   movieButton.button();
   movieButtonOriginalColor = movieButton.css("color");
   movieButton.prop("disabled", true);
   movieButton.css("color", movieButtonDisabledColor);

   slowerMovieButton = $("#gbmPathwaysSlowerMovieButton");
   slowerMovieButton.button();
   fasterMovieButton = $("#gbmPathwaysFasterMovieButton");
   fasterMovieButton.button();

   movieSpeedReadout = $("#gbmPathwaysMovieSpeedReadout");
   movieSpeedReadout.text(Number(currentMovieSpeed/1000).toFixed(2));

   fasterMovieButton.click(function() {changeMovieSpeed(-250);})
   slowerMovieButton.click(function() {changeMovieSpeed(250);})
   
   movieButton.text("Play Movie");
   movieButton.click(togglePlayMovie);
   searchBox = $("#gbmPathwaysSearchBox");


   sendSelectionsMenu = hub.configureSendSelectionMenu("#gbmPathwaysSendSelectionMenu",
                                                       [thisModulesName], sendSelections,
                                                       sendSelectionsMenuTitle);

   sendSelectionsMenu.attr("disabled", true);

   loadNetwork();
   $(window).resize(handleWindowResize);

   hub.disableTab(thisModulesOutermostDiv)


 }; // initializeUI
//----------------------------------------------------------------------------------------------------
function selectedNodeNames(cw)
{
   var names = [];
   var noi = cw.filter('node:selected');
   for(var n=0; n < noi.length; n++){
     names.push(noi[n].data('name'));
     }
  return(names);

} // selectedNodeNames
//----------------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();
   console.log("CyMarkers send selections to " + destination);
   sendSelectionsMenu.val(sendSelectionsMenuTitle);
   var nodeNames = selectedNodeNames(cyGbm);
   if(nodeNames.length == 0){
      console.log("no nodes selected!")
      return;
      }

  var cmd = "sendSelectionTo_" + destination;
  payload = {value: nodeNames, count: nodeNames.length, source: "markers and patients module"};
  var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

  sendSelectionsMenu.val(sendSelectionsMenuTitle);

  hub.send(JSON.stringify(newMsg));

} // sendSelections
//--------------------------------------------------------------------------------------------
function identifyEntitiesInCurrentSelection()  // defunct, not quite yet ready to del
{  
   var names = [];
   var noi = cyGbm.filter('node:selected'); 
   for(var n=0; n < noi.length; n++){
     names.push(noi[n].data('name'));
     }
  return(names);

} // identifyEntitiesInCurrentSelection
//--------------------------------------------------------------------------------------------
function loadNetwork()
{

    cyGbm = $("#cyGbmPathwaysDiv");
    cyGbm.cytoscape({
       boxSelectionEnabled: true,
       showOverlay: false,
       minZoom: 0.01,
       maxZoom: 8.0,
       layout: {
         name: "preset",
         fit: true
         },
     ready: function() {
        console.log("cyGbm ready");
        cyGbm = this;

        cyGbm.on('select', 'edge', function(evt){
           var edge = evt.cyTarget;
           console.log("selected edge");
           if(edgeAbstractsOn){
              var pmid = edge.data().pmid;
              var url = "http://www.ncbi.nlm.nih.gov/pubmed/?term=" + pmid;
              var replaceAnyExistingPopup = true;
              hub.openCenteredBrowserWindow(url, "pubmed abstract", 800, 600, replaceAnyExistingPopup)
              }
           });

        cyGbm.on('select', 'node', function(evt){
           var disable = identifyEntitiesInCurrentSelection().length == 0;
           sendSelectionsMenu.attr("disabled", disable);
           });
        cyGbm.on('unselect', 'node', function(evt){
           var disable = identifyEntitiesInCurrentSelection().length == 0;
           sendSelectionsMenu.attr("disabled", disable);
           });

        searchBox.keydown(doSearch);

        cyGbm.edges().unselectify();
        console.log("cyGbm.reset");
        cyGbm.reset();
        handleWindowResize();
        } // cy.ready
       })
    .cytoscapePanzoom({ });   // need to learn about options

} // loadNetwork
//----------------------------------------------------------------------------------------------------
function displayPathway(msg)
{
   console.log("--- Module.gbmPathways: displayPathway");
   if(msg.status == "success"){
      console.log("nchar(network): " + msg.payload.length);
      s = msg.payload;
      XXX = msg.payload;
      console.log("      1:40: " + s.substring(1, 40));
      var json = JSON.parse(msg.payload);
      cyGbm.remove(cyGbm.edges());
      cyGbm.remove(cyGbm.nodes());
      console.log(" after JSON.parse, json.length: " + json.length);
      console.log("  about to add json.elements");
      cyGbm.add(json.elements);
      console.log("  about to add  json.style");
      cyGbm.style(json.style);
      cyGbm.nodes().unselect();
        // map current node degree into a node attribute of that name
      cyGbm.nodes().map(function(node){node.data({degree: node.degree()})});

      var edgeTypes = hub.uniqueElementsOfArray(cyGbm.edges().map(function(edge){
                               return(edge.data("edgeType"))}
                               ));
      //updateEdgeSelectionWidget(edgeTypes);  // preserve only known edgeTypes
      cyGbm.resize();
      cyGbm.fit(50);
      console.log("concluding displayPathway in Module.gbmPathways");
      cyGbm.edges().show();
        // on load there are no selections.  make sure the menu is disabled.
      sendSelectionsMenu.prop({"disabled": true}); 
      hub.enableTab(thisModulesOutermostDiv);
      handleWindowResize();
//      postStatus("gbm pathway loaded");
      }
   else{
     console.log("displayPathway error: " + msg.payload);
     }

} // displayPathway
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
   outermostDiv.width(0.95 * $(window).width());
   outermostDiv.height(0.95 * $(window).width());

   controlsDiv.width(0.95 * $(window).width());
   controlsDiv.height(80);
  
   cyGbmDiv.width(0.95 * $(window).width());
   cyGbmDiv.height(0.8 * $(window).height());

   cyGbm.resize();
   cyGbm.fit(50);

} // handleWindowResize
//----------------------------------------------------------------------------------------------------
function zoomSelection()
{
   cyGbm.fit(cyGbm.$(':selected'), 50)

}
//----------------------------------------------------------------------------------------------------
function toggleEdgeSelection ()
{
  if(edgeAbstractsOn){
     edgeAbstractsOn = false;
     viewAbstractsButton.button("option", "label", "Enable Abstracts");
     }
   else{
     edgeAbstractsOn = true;
     viewAbstractsButton.button("option", "label", "Disable Abstracts");
     }

} // toggleEdgeSelection
//----------------------------------------------------------------------------------------------------
function transformMatrixToPatientOrientedNamedList(mtx) {

     // geneNames are repeated in each element; grab them from the first one
   var geneNames = Object.keys(mtx[0]);
     // the last element was originally (in R) the row name -- the tissue
     // gene1: expression, gene2: expession, ... rowname: 0445.T.1
   geneCount = geneNames.length - 1;
   geneNames = geneNames.slice(0,geneCount);
   var tissueNames = [];
   max = mtx.length;
   namedList={};

   for(var r=0; r < max; r++){
      row = mtx[r]
      tissueName = row["rowname"][0];
      tissueNames.push(tissueName);
      namedList[tissueName] = row;
      } // for r

   result = {genes: geneNames, tissues: tissueNames, values: namedList};
   return(result);

} // transformMatrixToPatientOrientedNamedList
//----------------------------------------------------------------------------------------------------
// policy: incoming ids will not always be only patientIDs, but may be geneIDs also
// a) if none of the incoming ids are recognized, their full list is displayed
//    in the body of an error dialog explaining the problem
// b) if there are any geneIDs present, we ignore all patientIDs, and select the geneIDs
// c) if there are only patientIDs, then they are used to load molecular data for
//    those patients, and to setup for running a gene/data movie across those patients
function handleIncomingIdentifiers(msg){

   console.log("=== entering handleIncomingIdentifiers for gbm");
   console.log("status: " + msg.status);

   var incomingIds = msg.payload.value;
   if(typeof(incomingIds) == "string")
      incomingIds = [incomingIds];

   var status = "gbm pathway received " + incomingIds.length + " identifiers";
   postStatus(status);
   console.log(status);
   console.log(JSON.stringify(incomingIds));

   var idsUpperCase = incomingIds.map(function(id){return(id.toUpperCase())});
   //var ourGenes = cyGbm.filter("node[nodeType='gene']").map(function(node){return(node.id())});
   var ourGenes = cyGbm.nodes().map(function(node){return(node.id())});
   var recognizedGenes = ourGenes.filter(function(gene){return(idsUpperCase.indexOf(gene) >= 0)});

   if(recognizedGenes.length > 0){
      hub.raiseTab("gbmPathwaysDiv");
      console.log(" incoming ids matched " + recognizedGenes.length + " gene names");
      console.log(JSON.stringify(recognizedGenes));
      selectNodes(recognizedGenes);
      }
   else{
     alert("None of the selected ids are recognized by the GBM Pathways tab.");
     }

     // todo: make this conditional, and post alert error message when there are no overlaps
     // todo: such that it appears on the sending page

    /**************
   for(var i=0; i < incomingIds.length; i++){
     if(ourGeneNames.indexOf(incomingIds[i]) >= 0)
        recognizedGeneNames.push(incomingIds[i]);
     } // for i

   if(recognizedGeneNames.length > 0){
      }
   else{
     alert("None of the selected nodes recogized by destination tab.");
     }
     // with no recognized genes, we may have recognized tissueIDs.
     // ask the server to check, providing a callback that will 
     // request loading the molecular data for those tissue ids
     // which are recognized
   //else{ 
   //   msg = {cmd:"getOverlappingIdentifiers",
   //          callback: "gbmPathwaysHandleOverlappingTissueIdentifiers",
   //          status:"request",
   //          payload: {idType:"entities", signature:"mRNA", ids:incomingIds}
   //          };
   //  msg.json = JSON.stringify(msg);
   // hub.send(msg.json);
   //  } // else: possibly some tissue (patient) ids 

   ********/

   } // handleIncomingIdentifiers
//----------------------------------------------------------------------------------------------------
function handleIdentifyOverlappingTissueIdentifiers(msg)
{ 
    console.log("=== Module.gbmPathways handleOverlappingTissueIdentifiers");
    payload = JSON.parse(msg.payload)
    recognizedIDs = payload.recognized;
    if(typeof(recognizedIDs) == "string")  // promote scalar to 1-element array
      recognizedIDs = [recognizedIDs];
    unrecognizedIDs = payload.unrecognized;
    if(typeof(unrecognizedIDs) == "string")  // promote scalar to 1-element array
      unrecognizedIDs = [unrecognizedIDs];

      // if any are recognized, ignore the others, request load of molecular data
      // allowing data movie to be run across these samples
    if(recognizedIDs.length > 0){
       request_mRNA_data(recognizedIDs, geneSymbols());   // entities: patient, tissue or sample ids
       request_cnv_data(recognizedIDs, geneSymbols());
       request_mutation_data(recognizedIDs, geneSymbols());
       }
    else if(unrecognizedIDs.length > 0) {
       errorMessage = "No overlap with pathway genes or tissue sample IDs:  <br><br>" +
                       unrecognizedIDs.join(", ");
       title = unrecognizedIDs.length + " unrecognized identifiers";
       $('<div />').html(errorMessage).dialog({title: title, width:600, height:300});
       } // else: only unrecognized identifiers

} // handleIdentifyOverlappingTissueIdentifiers
//----------------------------------------------------------------------------------------------------
function nodeIDs()
{
  nodes = cyGbm.filter("node:visible");
  result = [];
  for(var i=0; i < nodes.length; i++){
    id = nodes[i].data()['id'];
    result.push(id);
    } // for i
  return(result)

} // nodeIDs
//----------------------------------------------------------------------------------------------------
   function nodeNames() {

     nodes = cyGbm.nodes();
     //nodes = cyGbm.filter("node:visible");
     result = [];
     for(var i=0; i < nodes.length; i++){
       result.push(nodes[i].data().label)
       } // for i
     return(result)
     } // nodeNames

//----------------------------------------------------------------------------------------------------
function geneSymbols() {

  nodes = cyGbm.filter("node");
  result = [];
  for(var i=0; i < nodes.length; i++){
    sym = nodes[i].data().geneSymbol
    if(typeof(sym) != "undefined")
       result.push(sym)
    } // for i
  return(result)
  } // geneSymbols

//----------------------------------------------------------------------------------------------------
function selectNodes(nodeNames)
{
  if(typeof(nodeNames) == "string")   // trap scalar, but expect and support arrays
     nodeNames = [nodeNames];

  for(var i=0; i < nodeNames.length; i++){
     s = "cyGbm.filter('node[name=\"" + nodeNames[i] + "\"]').select()";
     //console.log("markers selectNodes: " + s);
     JAVASCRIPT_EVAL (s);
     } // for i

} // selectNodes
//----------------------------------------------------------------------------------------------------
   function changeMovieSpeed(delta) {

      if((currentMovieSpeed + delta) < 0)
         return;

      console.log("currentMovieSpeed: " + currentMovieSpeed);
      currentMovieSpeed += delta;
      console.log("currentMovieSpeed: " + currentMovieSpeed);
      movieSpeedReadout.text(Number(currentMovieSpeed/1000).toFixed(2));
      if(moviePlaying){
         clearInterval(movieIntervalID);
         movieIntervalID = setInterval(oneFrame, currentMovieSpeed);
         }
      } // changeMovieSpeed

   //----------------------------------------------------------------------------------------------------
   function togglePlayMovie() {


    allCurrentTissues = tissueMenu.children().map(function() {return $(this).val();}).get();
    currentTissueIndex = 0;

     oneFrame = function(){
        tissueIndex = currentTissueIndex  % allCurrentTissues.length;
        tissueName =  allCurrentTissues[tissueIndex]
        //console.log(" movie about to display frame " + tissueIndex + ", " + tissueName);
        currentTissueIndex = currentTissueIndex + 1;
        tissueMenu.val(tissueName);
        tissueSelectorChanged()
        } // oneFrame

     if(moviePlaying){
        moviePlaying = false;
        clearInterval(movieIntervalID);
        movieButton.text("Play Movie");
        }
     else{
        moviePlaying = true;
        movieButton.text("Stop Movie");
        movieIntervalID = setInterval(oneFrame, currentMovieSpeed);
        }
   

    } // togglePlayMovie
//----------------------------------------------------------------------------------------------------
function doSearch(e)
{
  var keyCode = e.keyCode || e.which;

  //console.log("Module.gbmPathway doSearch, keyCode: " + keyCode);

  if (keyCode == 13) {
     searchString = searchBox.val();
     //console.log("searchString: " + searchString);
     names = nodeNames()
     matches = []
     for(var i=0; i < names.length; i++){
        if(names[i].beginsWith(searchString)) {
           //console.log(searchString + " matched " + names[i]);
           selectNodes([names[i]]);
           } // if searchString matched beginning of node
        } // for i
     } // if 13 (return key)

} // doSearch
//----------------------------------------------------------------------------------------------------
function request_mRNA_data(entities, features) {

  msg = {cmd:"get_mRNA_data",
          callback: "handle_gbmPathways_mRNA_data",
          status:"request",
          payload:{entities: entities, features: features}
          };
   msg.json = JSON.stringify(msg);
   hub.send(msg.json);
   }

//----------------------------------------------------------------------------------------------------
function request_cnv_data(entities, features) {

  msg = {cmd:"get_cnv_data",
          callback: "handle_gbmPathways_cnv_data",
          status:"request",
          payload:{entities: entities, features: features}
          };
   msg.json = JSON.stringify(msg);
   hub.send(msg.json);
   }

//----------------------------------------------------------------------------------------------------
function request_mutation_data(entities, features) {

  msg = {cmd:"get_mutation_data",
          callback: "handle_gbmPathways_mutation_data",
          status:"request",
          payload:{entities: entities, features: features}
          };
   msg.json = JSON.stringify(msg);
   hub.send(msg.json);
   }

//----------------------------------------------------------------------------------------------------
function addTissueIDsToSelector (tissueIDs) {
  tissueMenu.empty();
  if(tissueIDs.length == 0) {
     alert("gbmPathways received empty tissueIDs list")
     return;
     }
  
  // every set of tissueIDs needs a neutral (no data) pseudo-tissue

  tissueIDs.unshift("neutral");

  for(var i=0; i < tissueIDs.length; i++){
     tissueName = tissueIDs[i]
     optionMarkup = "<option>" + tissueName + "</option>";
     tissueMenu.append(optionMarkup);
     } // for i

 } // addTissueIDsToSelector
//----------------------------------------------------------------------------------------------------
function handle_mRNA_data(msg) {

   console.log("handling mRNA data");
   hub.raiseTab("gbmPathwaysDiv");
   if(msg.status == "success"){
      var mtx = JSON.parse(msg.payload.mtx);
      expressionData = transformMatrixToPatientOrientedNamedList(mtx);
      console.log("handle_mRNA_data, success, rows: " + expressionData.length);
      addTissueIDsToSelector(expressionData.tissues);
      movieButton.prop("disabled", false);
      movieButton.css("color", movieButtonOriginalColor)
      selectLabel.css("color", "black");
      } // success
   else{
      expressionData = [];
      console.log("handle_mRNA_data, failure, rows: " + expressionData.length);
      } // failure
   } // handle_mRNA_data

//----------------------------------------------------------------------------------------------------
function handle_cnv_data(msg) {

   console.log("handling cnv data");
   if(msg.status == "success"){
     var mtx = JSON.parse(msg.payload.mtx);
     cnvData = transformMatrixToPatientOrientedNamedList(mtx);
     }
   else{
     cnvData = []
     }
   } // handle_mRNA_data

//----------------------------------------------------------------------------------------------------
function handle_mutation_data(msg) {

   console.log("handling mutation data");
   if(msg.status == "success"){
     var mtx = JSON.parse(msg.payload.mtx);
     mutationData = transformMatrixToPatientOrientedNamedList(mtx);
     }
   else{
     mutationData = [];
     }
   } // handle_mRNA_data

//----------------------------------------------------------------------------------------------------
function tissueSelectorChanged() {

   tissueID = tissueMenu.val()
   displayTissue(tissueID);

   } // tissueSelectorChanged

//----------------------------------------------------------------------------------------------------
function setInfoNodeLabel (newLabel)
{
   infoNodeID = cyGbm.filter('node[canonicalName="info.node"]').data("id")
   noa = {};
   noa[infoNodeID] = {label: newLabel};
   cyGbm.batchData(noa);
}
//----------------------------------------------------------------------------------------------------
function displayTissue(tissueID)
{
   setInfoNodeLabel(tissueID);

   var noa = {};

   if(tissueID == "neutral") {
      console.log(" will display neutral values of expression, copynumber, mutation");
      ids = [];
      allNodes = cyGbm.nodes();
      for(i=0; i < allNodes.length; i++){
         node = allNodes[i];
         id = node.data("id");
         if(Object.keys(node.data()).indexOf("geneSymbol") >= 0){
            geneSymbol = node.data("geneSymbol");
            ids.push(id);
            noa[id] = {score:0, label: geneSymbol, copyNumber:0}
            } // if node has geneSymbol attribute
         } // for i
      cyGbm.batchData(noa);
      return;
      } // neutral pseudo-tissue

   if(expressionData.tissues.indexOf(tissueID) < 0){
      alert(tissueId + " not found in current expressionData");
      return;
      }

   mRNA = expressionData.values
   genes = expressionData.genes;
   tissues = expressionData.tissues;

   noa = {};  // new node attributes to assign in the network

   for(var g=0; g < genes.length; g++){
      gene = genes[g];

      newScore = mRNA[tissueID][gene][0];
      filterString = '[geneSymbol="' + gene + '"]'
      nodeID = cyGbm.nodes(filterString)[0].data("id");
      noa[nodeID] = {score: newScore};
      } // for g

   cyGbm.batchData(noa);

   cnv = cnvData.values
   genes = cnvData.genes;
   tissues = cnvData.tissues;

   noa = {};  // new node attributes to assign in the network

   for(var g=0; g < genes.length; g++){
     gene = genes[g];
     newCopyNumber = cnv[tissueID][gene][0];
     filterString = '[geneSymbol="' + gene + '"]'
     nodeID = cyGbm.nodes(filterString)[0].data("id");
     noa[nodeID] = {copyNumber: newCopyNumber};
     } // for g

   cyGbm.batchData(noa);

   mut = mutationData.values

   noa = {};  // new node attributes to assign in the network


   for(var g=0; g < genes.length; g++){
     gene = genes[g];
     newMutation = mut [tissueID][gene][0];
        // identify the node (by id) whose geneSymbol attribute is gene
        // the label attribute changes, but geneSymbol remains
     filterString = 'node[geneSymbol="' + gene  + '"]';
     nodeID = cyGbm.filter(filterString).id();
        // set label and nodeType for every gene
     if(newMutation == null){
        newGeneLabel = gene;
        newNodeType = "gene";
        }
     else{
        newGeneLabel = gene + " (" + newMutation + ")";
        newNodeType = "mutation";
        }
     noa[nodeID] = {label: newGeneLabel, nodeType: newNodeType};
     } // for g, mutations
   cyGbm.batchData(noa);

} // displayTissue
//----------------------------------------------------------------------------------------------------
// called when the a dataset has been specified, typically via the Datasets tab, which presents
// the user with a list of the datasets they are able to use, from which they choose only one
// as their current working dataset.
// this module uses the dataset name to request the g.gbmPathways.json network from the server
function datasetSpecified (msg)
{
   console.log("Module.gbm datasetSpecified");
   console.log(msg.payload);

   var manifestInfo = msg.payload;
   var variableNames = manifestInfo.rownames;

   var pathway = "gbmPathways.json.RData";
   if($.inArray(pathway, variableNames) >= 0){
      var newMsg = {cmd: "getPathway",  callback: "displayGbmPathway",
                    status: "request", payload: "g.gbmPathways.json"};
      hub.send(JSON.stringify(newMsg));
      } // if pathway available

} // datasetSpecified
//----------------------------------------------------------------------------------------------------
function postStatus(msg)
{
  console.log("posting new status to gbmPathway status div: " + msg);
  statusDiv.text(msg);

} // postStatus
//----------------------------------------------------------------------------------------------------
function SetModifiedDate()
{
   msg = {cmd:"getModuleModificationDate",
          callback: "DisplayGbmPathwaysModifiedDate",
          status:"request",
          payload:"gbmPathways"
          };
   msg.json = JSON.stringify(msg);
   hub.send(msg.json);

} // setModifiedData
//----------------------------------------------------------------------------------------------------
function DisplayGbmPathwaysModifiedDate(msg)
{
   document.getElementById("gbmPathwaysDateModified").innerHTML = msg.payload;
}
//----------------------------------------------------------------------------------------------------
return{
  init: function(){
     hub.addMessageHandler("DisplayGbmPathwaysModifiedDate", DisplayGbmPathwaysModifiedDate);
     hub.addMessageHandler("handle_gbmPathways_mRNA_data", handle_mRNA_data);
     hub.addMessageHandler("handle_gbmPathways_cnv_data",  handle_cnv_data);
     hub.addMessageHandler("handle_gbmPathways_mutation_data",  handle_mutation_data);
     //hub.addMessageHandler("gbmPathwaysHandlePatientIDs", handlePatientIDs);
     hub.addMessageHandler("gbmPathwaysHandleOverlappingTissueIdentifiers",
                            handleIdentifyOverlappingTissueIdentifiers)

     hub.addMessageHandler("sendSelectionTo_gbmPathways", handleIncomingIdentifiers);
     hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
     hub.addMessageHandler("datasetSpecified", datasetSpecified);
     hub.addMessageHandler("displayGbmPathway", displayPathway);
     hub.addOnDocumentReadyFunction(initializeUI);
     } // init
  }; 

//----------------------------------------------------------------------------------------------------
}); // gbmPathwaysModule
//----------------------------------------------------------------------------------------------------
gbmPathway = gbmPathwaysModule()
gbmPathway.init();
