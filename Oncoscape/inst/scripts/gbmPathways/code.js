<script>

//----------------------------------------------------------------------------------------------------
setGbmPathwaysFlags = function()
{
    window.gbmPathways = {};
    window.gbmPathways.flags = {};

    window.gbmPathways.flags.cyjsReady = false;
    window.gbmPathways.flags.expressionDataReady = false;
    window.gbmPathways.flags.copyNumberDataReady = false;
    window.gbmPathways.flags.averageExpressionDataReady = false;

} // setGbmPathwaysFlags
//----------------------------------------------------------------------------------------------------
setGbmPathwaysFlags();
var cwGBM;
//----------------------------------------------------------------------------------------------------
gbmPathwaysHandleWindowResize = function()
{
   console.log("gbmPathways window resize: " + $(window).width() + ", " + $(window).height());

   cydiv = $("#cyGbmPathways");
   cydiv.width(0.95 * $(window).width());
   cydiv.height(0.8 * $(window).height());

   cwGBM.resize();
   cwGBM.fit(50);

} // gbmPathwaysHandleWindowResize
//----------------------------------------------------------------------------------------------------
cwGBMZoomSelected = function() {
   cwGBM.fit(cwGBM.$(':selected'), 100)
   }
//----------------------------------------------------------------------------------------------------
gbmPathwaysDemoData = function()
{
   // return ["0599.T.1", "1159.T.1", "1160.T.1", "1184.T.1", "0699.T.1", "998.T.1"];
   //return ["103.1.T.1", "0598.T.1", "961.T.1"];
   return ["0599.T.1", "1159.T.1", "1160.T.1", "1184.T.1", "0699.T.1", "998.T.1",
           "103.1.T.1", "0598.T.1", "961.T.1"];

} // gbmPathwaysDemoData 
//----------------------------------------------------------------------------------------------------
gbmPathwaysDisplayDemoData = function()
{
   addTissueIDsToSelector(gbmPathwaysDemoData());

} // gbmPathwaysDisplayDemoData 
//----------------------------------------------------------------------------------------------------
readGbmPathwaysSearchBox = function(e)
{
   var keyCode = e.keyCode || e.which;
   if (keyCode == 13) {
      contents = $("#gbmPathwaysSearchBox").val();
      console.log("contents: " + contents);
      s = "cwGBM.filter('node[name=\"" + contents + "\"]').select()";
      console.log("selection count, before: " + cwGBM.elements("node:selected").length)
      JAVASCRIPT_EVAL (s);
      console.log(s);
      console.log("selection count, after: " + cwGBM.elements("node:selected").length)
      x = 99;
      x = JAVASCRIPT_EVAL ("x + 2");
      console.log("x after eval double increment");
      }

} // readGbmPathwaysSearchBox
//----------------------------------------------------------------------------------------------------
waitFor = function(condition, msg)
{
   console.log("entering waitFor " + msg);

   while(!condition){
      setTimeout(function(){
          console.log(" **  waiting for " + msg);
          }, 0);
      };

} // waitFor
//----------------------------------------------------------------------------------------------------
cwGBMtogglePlayMovie = function()
{
   //waitFor(window.gbmPathways.flags.cyjsReady, "cyjsReady");
   //waitFor(window.gbmPathways.flags.expressionDataReady, "expressionDataReady");
   //waitFor(window.gbmPathways.flags.copyNumberDataReady, "copyNumberDataReady");

   window.allCwGBMtissues = $("#sampleSelector").children().map(function() {return $(this).val();}).get();
   window.currentCwGBMtissueCount = 0;

   oneFrame = function(){
     tissueIndex = window.currentCwGBMtissueCount % window.allCwGBMtissues.length;
     tissueName = window.allCwGBMtissues [tissueIndex]
     console.log(" movie about to display frame " + tissueIndex + ", " + tissueName);
     window.currentCwGBMtissueCount = window.currentCwGBMtissueCount + 1;
     $("#sampleSelector").val(tissueName);
     console.log("calling displayNanoStringData from oneFrame function inside cwGBMtogglePlayMovie");
     displayNanoStringData()
     } // oneFrame

   if(window.cwGBMmoviePlaying){
      window.cwGBMmoviePlaying = false;
      clearInterval(window.gbmMovieIntervalID);
      $("#cwGBMMovieButton").button( "option", "label", "Movie");

      }
   else{
      window.cwGBMmoviePlaying = true;
      $("#cwGBMMovieButton").button( "option", "label", "Stop ");
      window.gbmMovieIntervalID = setInterval(oneFrame, 1500);
      }
   

} // cwGBMtogglePlayMovie
//----------------------------------------------------------------------------------------------------
toggleEdgeSelection = function()
{
  if(window.cwGBMEdgeSelectionOn){
     cwGBM.edges().unselectify();
     window.cwGBMEdgeSelectionOn = false;
     $("#cwGBMViewAbstractsButton").button( "option", "label", "Enable Abstracts");
     }
  else{
     cwGBM.edges().selectify();
     window.cwGBMEdgeSelectionOn = true;
     $("#cwGBMViewAbstractsButton").button( "option", "label", "Disable Abstracts");
     }

} // toggleEdgeSelection
//----------------------------------------------------------------------------------------------------
handleTissueIDsForGBMPathways = function(msg)
{
   console.log("=== entering handleTissueIDsForGBMPathways");
   console.log("status: " + msg.status);
   tissueIDCount = msg.payload.count;
   tissueIDs = msg.payload.tissueIDs;
 
      // solve the R/javascript difference about vectors of length 1 vs a single scalar

   if (tissueIDCount == 1){
       tissueIDs = [tissueIDs];
       }

   console.log("count: " + tissueIDCount + "  ids: " + tissueIDs);
   addTissueIDsToSelector(tissueIDs);

      // expression data for the currently-selected tissueID will be used 

} // handleTissueIDsForGBMPathways
//----------------------------------------------------------------------------------------------------
addTissueIDsToSelector = function(tissueIDs)
{
   $("#sampleSelector").empty();

   if(tissueIDs.length == 0) {
      alert("GBMPathways received empty tissueIDs list")
      return;
      }
      
      // every set of tissueIDs needs an aggregate, or average tissue

   //optionMarkup = "<option> average (of " + tissueIDs.length + ") </option>";
   optionMarkup = "<option>average</option>";
   $("#sampleSelector").append(optionMarkup);

   window.gbmPathways.flags.averageExpressionDataReady = false;

   msg = {cmd: "requestAverageExpression", status: "request", payload: tissueIDs};
   console.log(msg)
   msg.json = JSON.stringify(msg);
   console.log(msg.json)

   socket.send(msg.json);

   for(var i=0; i < tissueIDs.length; i++){
      tissueName = tissueIDs[i]
      optionMarkup = "<option>" + tissueName + "</option>";
      $("#sampleSelector").append(optionMarkup);
      } // for i

   $("#tabs").tabs( "option", "active", 2);


} // addTissueIDsToSelector
//----------------------------------------------------------------------------------------------------
displayNanoStringData = function()
{
   console.log("=== entering displayNanoStringData");

   if(typeof(window.nanoStringAverage) == "undefined")
      alert("window.nanoStringAverage not defined")

   if(typeof(window.gbmPathwaysCopyNumberData) == "undefined")
      alert("window.gbmPathwaysCopyNumberData not defined")

   if(typeof(window.nanoStringExpression) == "undefined")
      alert("window.nanoStringExpression not defined")

   if(typeof(window.gbmPathwaysMutationData) == "undefined")
      alert("window.gbmPathwaysMutationData not defined")

   var tissueName = $("#sampleSelector").val()

   if(tissueName == null){
       console.log("gbmPathways::displayNanoStringData, tissueName is null, returning");
       return;
       }

   console.log("    tissueName: " + tissueName);
   console.log(" matching 'average':  " + tissueName.match("average"));

   if(tissueName.match("average") != null){
      tissueName = "average"
      console.log("--- tissue selector says average");
      }

   var noa = {};

   var cnvGeneNames = [];     // assume we have no cnv values
   var mutantGeneNames = [];  // assume we have no mutations

   if(tissueName == "average"){
      expression = window.nanoStringAverage["average"];
      }
   else {
      expression = window.nanoStringExpression[tissueName];

      if(typeof(window.gbmPathwaysCopyNumberData) != "undefined") {
         if(Object.keys(window.gbmPathwaysCopyNumberData).indexOf(tissueName) >= 0) {
           copyNumber = window.gbmPathwaysCopyNumberData[tissueName];
           cnvGeneNames = Object.keys(copyNumber);
           } // if copyNumber data exists for this tissueName 
         } // if copyNumberData exists

      if(typeof(window.gbmPathwaysMutationData) != "undefined") {
         if(Object.keys(window.gbmPathwaysMutationData).indexOf(tissueName) >= 0) {
           mutation = window.gbmPathwaysMutationData[tissueName];
           mutantGeneNames = Object.keys(mutation);
           } // if mutation data exists for this tissueName 
         } // if mutationData exists

      } // else: tissueName is not 'average'


   console.log("about to get genenames from window.nanoStringExpression for " + tissueName);
   geneNames = Object.keys(expression);
   console.log("geneNames from expression: " + geneNames.length);

      // update node attribute data for "cnv"

   for(var i=0; i < geneNames.length; i++){
      gene = geneNames[i];
      newScore = expression[gene];
      newCopyNumber = "0";
      if(typeof(window.gbmPathwaysCopyNumberData) != "undefined") {
         if(cnvGeneNames.indexOf(gene) >= 0){
            newCopyNumber = copyNumber[gene][0];
            }
          } // copyNumber data is ready
      console.log(gene + "  score: " + newScore + "  cnv: " + newCopyNumber)
      filterString = 'node[label="' + gene + '"]'
      cwGBM.filter(filterString).data({score:newScore, cnv: newCopyNumber})
      } // for i

   allNodeNames = [];
   var nodes = cwGBM.elements("node:visible")
   for(var n=0; n < nodes.length; n++){
      node = nodes[n];
      allNodeNames.push(node.data()["label"])
      }
  
      // reset all of the gene names and node types to normal
   for(var i=0; i < window.gbmPathwaysCurrentMutantGeneInfo.length; i++){
      nodeID = window.gbmPathwaysCurrentMutantGeneInfo[i];
      filterString = 'node[id="' + nodeID + '"]';
      cwGBM.filter(filterString).data({label:cwGBM.filter(filterString).data()["canonicalName"]})
      cwGBM.filter(filterString).data({nodeType:"gene"});
      } // for i

   window.gbmPathwaysCurrentMutantGeneInfo = [];

   if(Object.keys(window.gbmPathwaysMutationData).indexOf(tissueName) >= 0){
      console.log(" looking for mutations in " + tissueName)
      for(var i=0; i < mutantGeneNames.length-1; i++){  // 'rowname' still present
         gene = mutantGeneNames[i];
         if(allNodeNames.indexOf(gene) >= 0){
             mutationInfo = window.gbmPathwaysMutationData[tissueName];
             mutation = mutationInfo[gene][0];
             console.log("    looking for mutations in " + gene + ": " + mutation);
             filterString = 'node[geneSymbol="' + gene  + '"]';
             nodeID = cwGBM.filter(filterString).id();
             filterString = 'node[id="' + nodeID + '"]';
             if(mutation == null){
                geneLabel = gene;
                newNodeType = "gene";
                }
             if(mutation != null){
                window.gbmPathwaysCurrentMutantGeneInfo.push(nodeID);
                geneLabel = gene + " (" + mutation + ") ";
                newNodeType = "mutation";
                }
             cwGBM.filter(filterString).data()["label"] = geneLabel
             cwGBM.filter(filterString).data({nodeType:newNodeType});
             //oldScore = cwGBM.filter(filterString).data("score");
             //  cwGBM.filter(filterString).data({score:oldScore*8});
            } // if possibly mutant gene is in the network
          } // for each of the mutantGeneNames
       } // if the current tissue (in the movie) is in the mutantGene info

   //console.log(noa);
   //cwGBM.batchData(noa);
   cwGBM.elements("node:visible").select().unselect()

} // displayNanoStringData
//----------------------------------------------------------------------------------------------------
requestNanoStringExpressionData = function()
{
   //waitFor(window.gbmPathways.flags.cyjsReady, "cyjsReady");

   console.log("requestNanoStringExpressionData");
   var nodes = cwGBM.elements("node:visible")
   console.log("requestNanoStringExpressionData, got nodes from cwGBM");
   var geneNames = [];

   for(var n=0; n < nodes.length; n++) { 
      geneName = nodes[n].data()['label'];
      geneNames.push(geneName);
      }

   console.log("--- getNanoStringExpressionData")
   payload = JSON.stringify(geneNames)
   msg = {cmd: "getNanoStringExpressionData", status: "request", payload: payload}
   msg.json = JSON.stringify(msg);
   socket.send(msg.json);

   console.log("--- getGbmPathwaysCopyNumberData")
   payload = JSON.stringify(geneNames)
   msg = {cmd: "getGbmPathwaysCopyNumberData", status: "request", payload: payload}
   msg.json = JSON.stringify(msg);
   socket.send(msg.json);

   console.log("--- getGbmPathwaysMutationData")

   payload = {mode: "getData"};
   msg = {cmd: "getGbmPathwaysMutationData", status: "request", payload: payload}
   msg.json = JSON.stringify(msg);
   socket.send(msg.json);

} // requestNanoStringExpressionData
//----------------------------------------------------------------------------------------------------
handleNanoStringExpressionData = function(msg)
{
   console.log("=== entering handleNanoStringExpressionData");
   console.log("status: " + msg.status);

   mRaw = JSON.parse(msg.payload);
   var mtx = {};
      // geneNames are repeated in each element; grab them from the first one
   var geneNames = Object.keys(mRaw[0]);
      // the last element was originally (in R) the row name -- the tissue
      // gene1: expression, gene2: expession, ... rowname: 0445.T.1
   geneNames = geneNames.slice(0,geneName.length);
   geneCount = geneNames.length;
   var tissueNames = [];
   max = mRaw.length;
   for(var r=0; r < max; r++){
      row = mRaw[r];
      tissueName = row["rowname"];
      tissueNames.push(tissueName);
      mtx[tissueName] = row;
      } // for r

   window.nanoStringExpression = mtx;
   window.gbmPathwaysTissueNames = tissueNames;

      // now that the data is loaded, and tissueIDs are in the selector
      // ask that the expression data for the currently-selected tissue
      // be display in the gbmPathways network

   console.log("end of handleNanoStringExpressionData"); // , about to call displayNanoStringData");

   // displayNanoStringData();

} // handleNanoStringExpressionData
//----------------------------------------------------------------------------------------------------
// payload is a json "array", an array with one object, each element of which is a gene/expression
// pair, with a final element  rowname: "average"
handleAverageExpression = function(msg)
{
   console.log("gbmPathways/handleAverageExpression");
   mRaw = JSON.parse(msg.payload);
   var mtx = {};
      // geneNames are repeated in each element; grab them from the first one
   var geneNames = Object.keys(mRaw[0]);
      // the last element was originally (in R) the row name -- the tissue
      // gene1: expression, gene2: expession, ... rowname: 0445.T.1
   geneNames = geneNames.slice(0, geneNames.length);
   geneCount = geneNames.length;
   var tissueNames = [];
   max = mRaw.length;
   for(var r=0; r < max; r++){
      row = mRaw[r];
      tissueName = row["rowname"];
      tissueNames.push(tissueName);
      mtx[tissueName] = row;
      } // for r

   window.nanoStringAverage = mtx;
   console.log("average mtx: " + mtx);
   
   window.gbmPathways.flags.averageExpressionDataReady = true;

   //displayNanoStringData();

} // handleAverageExpression
//----------------------------------------------------------------------------------------------------
handleGbmPathwaysCopyNumberData = function(msg)
{
   console.log("=== entering handleGbmPathwayCopyNumberData")
   console.log("status: " + msg.status);

   mRaw = JSON.parse(msg.payload);
   var mtx = {};
      // geneNames are repeated in each element; grab them from the first one
   var geneNames = Object.keys(mRaw[0]);
      // the last element was originally (in R) the row name -- the tissue
      // gene1: expression, gene2: expession, ... rowname: 0445.T.1
   // old, bugg: geneNames = geneNames.slice(0, geneName.length)
   geneNames = geneNames.slice(0, (geneNames.length-1));
   geneCount = geneNames.length;
   var tissueNames = [];
   max = mRaw.length;
   for(var r=0; r < max; r++){
      row = mRaw[r];
      tissueName = row["rowname"];
      tissueNames.push(tissueName);
      mtx[tissueName] = row;
      } // for r

   window.gbmPathwaysCopyNumberData = mtx;
   window.gbmPathwaysCopyNumberTissueNames = tissueNames;
   window.gbmPathways.flags.copyNumberDataReady = true;

      // now that the data is loaded, and tissueIDs are in the selector
      // ask that the expression data for the currently-selected tissue
      // be display in the gbmPathways network

   //console.log("end of handleNanoStringExpressionData, about to call displayNanoStringData");
   //displayNanoStringData();

} // handleGbmPathwaysCopyNumberData
//----------------------------------------------------------------------------------------------------
handleGbmPathwaysMutationData = function(msg)
{
   console.log("--- handleGbmPathwaysMutationData");
   mRaw = JSON.parse(msg.payload);
   var mtx = {};
   var geneNames = Object.keys(mRaw[0]);
      // the last element was originally (in R) the row name -- the tissue
      // gene1: expression, gene2: expession, ... rowname: 0445.T.1
   geneNames = geneNames.slice(0,geneNames.length-1);

   window.gbmPathwaysCurrentMutantGeneInfo = [];
   geneCount = geneNames.length;
   var tissueNames = [];
   max = mRaw.length - 1;  // leave off tissueName
   for(var r=0; r < max; r++){
      row = mRaw[r];
      tissueName = row["rowname"][0];
      tissueNames.push(tissueName);
      mtx[tissueName] = row;
      } // for r

   window.gbmPathwaysMutationData = mtx;
   window.gbmPathwaysMutationTissueNames = tissueNames;
   window.gbmPathways.flags.mutationDataReady = true;
   displayNanoStringData()

} // handleGbmPathwaysMutationData
//----------------------------------------------------------------------------------------------------
loadGBMPathwaysNetwork = function() {

   console.log("loadGBMPathwaysNetwork, node count: " + curatedGBMpathways.elements.nodes.length);
   cwGBM = $("#cyGbmPathways");
   cwGBM.cytoscape({
       elements: curatedGBMpathways.elements,
       style: curatedGBMVizmap[0].style,
       showOverlay: false,
       minZoom: 0.01,
       maxZoom: 8.0,
       layout: {
         name: "preset",
         fit: true
         },
    ready: function() {
        console.log("cwGBM ready");
        cwGBM = this;
        window.cwGBM = cwGBM;
        window.cwGBMEdgeSelectionOn = false;
        cwGBM.on('mouseover', 'node', function(evt){
           var node = evt.cyTarget;
           $("#gbmPathwaysMouseOverReadoutDiv").text(node.data().label);
           })
        cwGBM.on('mouseover', 'edge', function(evt){
           var edge = evt.cyTarget;
           $("#gbmPathwaysMouseOverReadoutDiv").text(edge.data().canonicalName);
           })
        cwGBM.on('select', 'edge', function(evt){
           var edge = evt.cyTarget;
           console.log("selected edge");
           var pmid = edge.data().pmid;
           console.log("pmid: " + pmid);
           window.open("http://www.ncbi.nlm.nih.gov/pubmed/?term=" + pmid,
                       "pubmed abstract", "height=600,width=800");
           });
        $("#cwGBMMovieButton").button()
        $("#cwGBMZoomSelectedButton").button();
        $("#cwGBMViewAbstractsButton").button();
        $("#cwGBMViewAbstractsButton").click(toggleEdgeSelection);
        $("#cwGBMMovieButton").click(cwGBMtogglePlayMovie);
        $("#gbmPathwaysSearchBox").keydown(readGbmPathwaysSearchBox);

        cwGBM.edges().unselectify();
        window.cwGBMEdgeSelectionOn = false;
        console.log("cwGBM.reset");
        cwGBM.reset();
        gbmPathwaysHandleWindowResize();
        window.gbmPathways.flags.cyjsReady = true;
        requestNanoStringExpressionData();
        } // cy.ready
       })
    .cytoscapePanzoom({ });   // need to learn about options

} // loadGBMPathwaysNetwork
//----------------------------------------------------------------------------------------------------
tissueSelectorChanged = function()
{
    console.log("tissue selector changed, new value: " + $("#sampleSelector").val())
    console.log("calling displayNanoStringData() from tissueSelectorChanged function")
    displayNanoStringData()

} // tissueSelectorChanged
//----------------------------------------------------------------------------------------------------
onReadyFunctions.push(function() {

   console.log("==== gbmPathways/code.js document ready");
      // specify the function to call when the value changes

   $("#sampleSelector").change(tissueSelectorChanged);

   socketConnectedFunctions.push(loadGBMPathwaysNetwork);
   //socketConnectedFunctions.push(requestNanoStringExpressionData);

   if(typeof(window.tabsAppRunning) == "undefined") {
       socketConnectedFunctions.push(gbmPathwaysDisplayDemoData);
       }

   $("#trigger-link").hover(function() {
       $("#target").show();
       }, function() {
       $("#target").hide();
       });

   $("#clearSamplesButton").click(function(){$("#sampleSelector").empty()})
   $("#cwGBMZoomSelectedButton").click(cwGBMZoomSelected);
   $(window).resize(gbmPathwaysHandleWindowResize);
   }); // document.ready

//----------------------------------------------------------------------------------------------------
addJavascriptMessageHandler("handleNanoStringExpressionData",  handleNanoStringExpressionData);
addJavascriptMessageHandler("handleAverageExpression",         handleAverageExpression);
addJavascriptMessageHandler("tissueIDsForGBMPathways",         handleTissueIDsForGBMPathways);
addJavascriptMessageHandler("handleGbmPathwaysCopyNumberData", handleGbmPathwaysCopyNumberData);
addJavascriptMessageHandler("handleGbmPathwaysMutationData",   handleGbmPathwaysMutationData);
//----------------------------------------------------------------------------------------------------

</script>
