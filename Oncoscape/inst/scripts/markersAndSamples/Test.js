// markersAndSamples/Test.js
//------------------------------------------------------------------------------------------------------------------------
var MarkersAndSamplesTestModule = (function () {

       // for observing relatively small scale status changes: i.e., network loaded and displayed
       // the div watched here is in widget.html

    var markersAndSamplesStatusObserver = null;
    var testStatusObserver = null;   // modified at the end of each dataset test

    var minorStatusDiv = "#markersAndPatientsStatusDiv";
    var majorStatusDiv = "#markersTestStatusDiv";

       // to detect when the full test of a dataset is complete, so that the next dataset can be tested
       // the div watched here is in test.html


//------------------------------------------------------------------------------------------------------------------------
function runTests(datasetNames, reps, exitOnCompletion)
{
     // run through <reps> repetitions of the test
     // condition the next test upon the completion of the preceeding one,
     // which is detected by a change to the majorStatusDiv
     // minorStatusDiv is used to gate successive tests applied -within-
     // a dataset
     
      
   console.log("===================================== Test.markers: runTests");
   console.log("Test.markers: runTests: " + JSON.stringify(datasetNames));
   console.log("reps: " + reps);
   console.log("exitOnCompletion: " + exitOnCompletion);
   
   var datasetIndex = -1;
   
   var config = {attributes: true, childList: true, characterData: true};
   var target =  document.querySelector(majorStatusDiv);

      // define a function to be called whenever the testStatusDiv changes,
      // which is our signal that the next test is ready to run.
      // the first test is kicked off when we -- after setting up and
      // configuring the observer -- manually (see below: "start testing")
      // change the target which the observer watches.
      // there may be a better way, but for now we delete and recreate
      // the observer at the end of each test.
      // note also that the next dataset is determined inside this function
      // and that the function refers to itself.

   var onMutation = function(mutations){
      mutation = mutations[0];
      testStatusObserver.disconnect();
      testStatusObserver = null;
      var id = mutation.target.id;
      var msg = $(majorStatusDiv).text();
      console.log("test status changed, text: " + msg);
      datasetIndex++;
      if(datasetIndex < (datasetNames.length * reps)){
         console.log("about to test dataset " + datasetNames[datasetIndex]);      
         testStatusObserver = new MutationObserver(onMutation);
         testStatusObserver.observe(target, config);
         if(datasetIndex < (datasetNames.length * reps))
            testLoadDataSetDisplayNetworkSendIDs(datasetNames[datasetIndex % datasetNames.length]);
         }
      else{
         console.log("mutation observer function detected end of datasets");
         if(exitOnCompletion){
            var payload = {errorCount: Object.keys(sessionStorage).length,
                           errors: JSON.stringify(sessionStorage)};
            var exitMsg = {cmd: "exitAfterTesting", callback: "", status: "request", payload: payload};
            console.log("about to send exitAfterTesting msg to server");
            hub.send(JSON.stringify(exitMsg));
            } // if exitOnCompletion
         } // else: datasets exhaused
      };

   testStatusObserver = new MutationObserver(onMutation);
   testStatusObserver.observe(target, config);

   $(majorStatusDiv).text("start testing");

} // runTests
//------------------------------------------------------------------------------------------------------------------------
function testLoadDataSetDisplayNetworkSendIDs(dataSetName)
{
   var testTitle = "testLoadDataSetDisplayNetworkSendIDs";
   console.log(testTitle);

      // when our module receives the resulting 'datasetSpecified' msg, which includes the dataset's manifest
      // in its payload, it requests 
      //   - the markers network: to be displayed by cyjs
      //   - sampleCategorizationNames, to populate the dropdown menu
      // when the network is loaded, the statusDiv is updated, which is detected here, and we
      // check to see that a reasonable number of nodes are contained in the loaded graph.
      // when those tests are over, we then cascade through a number of gui operations: search, node selections
      // network operations

   if(markersAndSamplesStatusObserver === null){
      markersAndSamplesStatusObserver = new MutationObserver(function(mutations) {
        hub.raiseTab("markersAndPatientsDiv");
        mutation = mutations[0];
        markersAndSamplesStatusObserver.disconnect();
        markersAndSamplesStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#markersAndSamplesStatusDiv").text();
        QUnit.test("markersAndSamples loaded: " + dataSetName, function(assert) {
           var nodeCount = cwMarkers.nodes().length;
           var edgeCount = cwMarkers.edges().length;
           console.log("markersAndSamples loaded, with " + nodeCount + " nodes and " + edgeCount + " edges.");
           assert.ok(nodeCount > 10, dataSetName + " nodeCount > 10");
           assert.ok(edgeCount > 10, dataSetName + " edgeCount > 10");
           testSearch();
           });
        }); // new MutationObserver
      } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   markersAndSamplesStatusObserver.observe(target, config);

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dataSetName};

   console.log("about to send specifyCurrentDataset msg to server: " + dataSetName);
   hub.send(JSON.stringify(msg));

} // testLoadDataSetDisplayNetworkSendIDs
//------------------------------------------------------------------------------------------------------------------------
//   1) clear selection
//   2) find the node with highest degree
//   3) select that node
//   4) show edges, select all connected
//   5) make sure selected node count minus one is equal to degree of the original node
function testSearch()
{
   console.log("--- Test.markers testSearch");
   var searchBox = $("#markersAndTissuesSearchBox");
   setTimeout(function(){searchBox.val("");}, 0);
   cwMarkers.nodes().unselect();
   var netOpsMenu = $("#cyMarkersOperationsMenu");
   var nodes = cwMarkers.nodes().filterFn(function(node){return (node.data("nodeType") === "patient");});
   var nodesByDegree = nodes.map(function(node){return {id:node.data("id"), degree:node.degree()};});
   var mySort = function(a,b) {return(b.degree - a.degree);};
   var mostConnectedNode = nodesByDegree.sort(mySort)[0];
   console.log("mostConnectedNode: " + JSON.stringify(mostConnectedNode));

   QUnit.test("markers testSearch", function(assert){
     netOpsMenu.val("Hide All Edges");
     netOpsMenu.trigger("change");
     cwMarkers.filter("node:selected").unselect();
     assert.equal(cwMarkers.filter("node:selected").length, 0, "zero selected nodes");
     setTimeout(function(){searchBox.val(mostConnectedNode.id);}, 0);
     searchBox.trigger(jQuery.Event("keydown", {which: 13}));
     assert.equal(cwMarkers.filter("node:selected").length, 1, "one selected node from search box: " +
                  mostConnectedNode.id);
     netOpsMenu.val("Show Edges from Selected Nodes");
     netOpsMenu.trigger("change");
     netOpsMenu.val("Select All Connected Nodes");
     netOpsMenu.trigger("change");
     console.log("about to check for selected nodes");
     var expectedSelectionCount = mostConnectedNode.degree + 1; // include self
     var nodes = cwMarkers.nodes();
     var nodeNames = JSON.stringify(cwMarkers.nodes().map(function(node){return node.id();}));
     var selectedNodes = cwMarkers.filter("node:selected");
     var selectedNodeNames = JSON.stringify(selectedNodes.map(function(node){return node.id();}));
     console.log("selected nodes after filter: " + selectedNodeNames);
     assert.ok(cwMarkers.filter("node:selected").length == expectedSelectionCount,
               "found expected number of selected nodes: " + selectedNodes.length);
     setTimeout(function(){searchBox.val("");}, 0);
     cwMarkers.nodes().unselect();
     testSendGoodIDs();
     });

}  // testSearch
//------------------------------------------------------------------------------------------------------------------------
function testSendGoodIDs()
{
   console.log("entering Test.markers:testSendGoodIDs");

   var title = "testSendIDs";
   console.log(title);
   var maxNodes = 10;
   var totalNodes = cwMarkers.nodes().length; 
   if(maxNodes > totalNodes)
      maxNodes = totalNodes;

      // first test is to clear any existing selection, then send 10 node
      // ids (simple name strings) taken from the network itself.
      // these nodes are sent to the network using hub.send
      // we then check to see that these 10 nodes are selected in cyjs

   cwMarkers.filter("node:selected").unselect();
   var ids = cwMarkers.nodes().map(function(node) {return node.id();}).slice(0, maxNodes);
     // selection of incoming identifiers can be a bit promiscuous.  for instance,
     // sending "Y" will select "Y" and "YWHAE"

   if(markersAndSamplesStatusObserver === null){
      markersAndSamplesStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        markersAndSamplesStatusObserver.disconnect();
        markersAndSamplesStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test(title, function(assert) {
           console.log("-- in QUnit.test for testSendIDs " + 7 + "  statusMsg: " + statusMsg);
           var selectedNodes = cwMarkers.filter("node:selected").map(function(node){return node.id();});
           assert.ok(selectedNodes.length >= maxNodes, "incoming " + maxNodes + " nodes, selected: " +
                     selectedNodes.length);
           testSendBadIDs();
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   markersAndSamplesStatusObserver.observe(target, config);

   console.log("testSendIDs, sending " + JSON.stringify(ids));
   var payload = {value: ids, count: ids.length, source: "markers/Test.js::testSendIDs"};
   var msg = {cmd: "sendSelectionTo_MarkersAndPatients", callback: "", status: "request", payload:  payload};

   hub.send(JSON.stringify(msg));

} // testSendGoodIDs
//------------------------------------------------------------------------------------------------------------------------
function testSendBadIDs()
{
   console.log("entering Test.markers:testSendBadIDs");

   var title = "testSendBadIDs";
   console.log(title);
   var maxNodes = 10;
   var totalNodes = cwMarkers.nodes().length; 
   if(maxNodes > totalNodes)
      maxNodes = totalNodes;

      // first test is to clear any existing selection, then send 10 node
      // ids (simple name strings) taken from the network itself.
      // these nodes are sent to the network using hub.send
      // we then check to see that these 10 nodes are selected in cyjs

   cwMarkers.filter("node:selected").unselect();
   var badIDs = ["bogus1", "bogus2", "bogus3"];

   if(markersAndSamplesStatusObserver === null){
      markersAndSamplesStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        markersAndSamplesStatusObserver.disconnect();
        markersAndSamplesStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test(title, function(assert) {
           console.log("-- in QUnit.test for testSendIDs " + 7 + "  statusMsg: " + statusMsg);
           var selectedNodes = cwMarkers.filter("node:selected").map(function(node){return node.id();});
           assert.equal(selectedNodes.length, 0);
           var errorDialog = $("#markersIncomingIdentifiersErrorDialog");
           console.log("error dialog count: " + errorDialog.length);
           var errorText = errorDialog.text();
           console.log("======== badIDs errorText");
           console.log(errorText);
           for(var i=0; i < badIDs.length; i++){
              assert.ok(errorText.indexOf(badIDs[i]) > 0);
              } // for i
           errorDialog.remove();
           testSendMixedIDs();
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   markersAndSamplesStatusObserver.observe(target, config);

   console.log("testSendBadIDs, sending " + JSON.stringify(badIDs));
   var payload = {value: badIDs, count: badIDs.length, source: "markers/Test.js::testSendIDs"};
   var msg = {cmd: "sendSelectionTo_MarkersAndPatients", callback: "", status: "request", payload:  payload};

   hub.send(JSON.stringify(msg));

} // testSendBadIDs
//------------------------------------------------------------------------------------------------------------------------
function testSendMixedIDs()
{
   console.log("entering Test.markers:testSendMixedIDs");

   var title = "testSendMixedDs";
   console.log(title);
   var maxNodes = 3;
   var totalNodes = cwMarkers.nodes().length; 
   if(maxNodes > totalNodes)
      maxNodes = totalNodes;

   var goodIDs = cwMarkers.nodes().map(function(node) {return node.id();}).slice(0, maxNodes);

      // first test is to clear any existing selection, then send 10 node
      // ids (simple name strings) taken from the network itself.
      // these nodes are sent to the network using hub.send
      // we then check to see that these 10 nodes are selected in cyjs

   cwMarkers.filter("node:selected").unselect();
   var badIDs = ["bagus1", "begus2", "bigus3"];
   var ids = goodIDs.concat(badIDs);

   if(markersAndSamplesStatusObserver === null){
      markersAndSamplesStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        markersAndSamplesStatusObserver.disconnect();
        markersAndSamplesStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test(title, function(assert) {
           console.log("-- in QUnit.test for testSendIDs " + 7 + "  statusMsg: " + statusMsg);
           var selectedNodes = cwMarkers.filter("node:selected").map(function(node){return node.id();});
           assert.ok(selectedNodes.length >= goodIDs.length);
              // at present (we may wish to change) when some ids work, no error dialog is posted
              /************
              var errorDialog = $("#markersIncomingIdentifiersErrorDialog");
              console.log("error dialog count: " + errorDialog.length);
              var errorText = errorDialog.text();
              console.log("======== mixedIDs errorText");
              console.log(errorText);
              for(var i=0; i < badIDs.length; i++)
                 assert.ok(errorText.indexOf(badIDs[i]) >= 0);
              for(i=0; i < goodIDs.length; i++)
                 assert.equal(errorText.indexOf(goodIDs[i]), -1);
              errorDialog.remove();
              **************/
           testColorTumorsByCategory();
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   markersAndSamplesStatusObserver.observe(target, config);

   console.log("testSendIDs, sending " + JSON.stringify(ids));
   var payload = {value: ids, count: ids.length, source: "markers/Test.js::testSendIDs"};
   var msg = {cmd: "sendSelectionTo_MarkersAndPatients", callback: "", status: "request", payload:  payload};

   hub.send(JSON.stringify(msg));

} // testSendMixedIDs
//------------------------------------------------------------------------------------------------------------------------
function testColorTumorsByCategory()
{
   console.log("entering Test.markers:testColorTumorsByCategory");

   var title = "testColorTumorsByCategory";
   console.log(title);
     // set all tumor node-border colors to white: no tumor classification coloring scheme
     // would a) consist of just one group and b) mark it with such a nondescript color
     // then manipulate the menu, make sure that at least some of the colors have changed
     
   var tumorNodes = cwMarkers.nodes().fnFilter(function(node){ return(node.data("nodeType") == "patient");});
   tumorNodes.map(function(node){node.data({"subType": "unassigned"});});
   //var subTypes = jQuery.unique(tumorNodes.map(function(node){return(node.data("subType"));}));
   var subTypes = hub.uniqueElementsOfArray(tumorNodes.map(function(node){return(node.data("subType"));}));
   console.log("before tumor category test, should be just one subType: " + subTypes.length);
   
   if(markersAndSamplesStatusObserver === null){
      markersAndSamplesStatusObserver = new MutationObserver(function(mutations) {
        console.log("mutation observer for testColorTumorsByCategory");
        mutation = mutations[0];
        markersAndSamplesStatusObserver.disconnect();
        markersAndSamplesStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test(title, function(assert) {
           console.log("-- in QUnit.test for testColorTumorsByCategory");
           var subTypes = hub.uniqueElementsOfArray(tumorNodes.map(function(node){return(node.data("subType"));}));
           console.log(" during tumor category test, should be > one subType: " + subTypes.length);
           assert.ok(subTypes.length > 1);  // more than just the single "unassigned" enforced above;
           markEndOfTestingDataSet();
           });
        }); // new MutationObserver
      } // if null mutation observer

     // the menu value has been changed above.  now elicit action

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   markersAndSamplesStatusObserver.observe(target, config);

   var allCategoryNames = $("#cyMarkersTumorCategorizationsMenu").children().map(function() {return $(this).val();}).get();
   console.log("--- still setting up testColorTumorsByCateory, names: ");
   console.log(JSON.stringify(allCategoryNames));
   var firstCategory = allCategoryNames[2];  // the 0th name is always the menu title. 1st is "Clear". choose the next one
   $("#cyMarkersTumorCategorizationsMenu").val(firstCategory);
   $("#cyMarkersTumorCategorizationsMenu").trigger("change");

} // testColorTumorsByCategory
//------------------------------------------------------------------------------------------------------------------------
function testColorTumorsByClassification()
{
   var testTitle = "testColorTumorsByClassifictaion";
   console.log(testTitle);

      // TCGA.02.0033 is in all three of our current gbm-related, public, TCGA datasets

   if(markersAndSamplesStatusObserver === null){
      markersAndSamplesStatusObserver = new MutationObserver(function(mutations) {
        //hub.raiseTab("markersAndPatientsDiv");
        mutation = mutations[0];
        markersAndSamplesStatusObserver.disconnect();
        markersAndSamplesStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#markersAndSamplesStatusDiv").text();
        QUnit.test(title, function(assert) {
           assert.ok(10 === 10, msg);
           });
        }); // new MutationObserver
      } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   markersAndSamplesStatusObserver.observe(target, config);

   var dataSetName = "TCGAbrain";
   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dataSetName};

   hub.send(JSON.stringify(msg));

} // testColorTumors
//------------------------------------------------------------------------------------------------------------------------
function markEndOfTestingDataSet()
{
  console.log("end of testing dataset");
  $(majorStatusDiv).text("dataset complete");
  $("#testManagerLoopStatusDiv").text("Test.markers, datasets complete");
  
} // markEndOfTestingDataSet
//------------------------------------------------------------------------------------------------------------------------
function initialize()
{
   console.log("--- initializing markersAndSamples/Test.js");

} // initialize
//------------------------------------------------------------------------------------------------------------------------
return{
   init: initialize,
   run: runTests
   }; // module return value

//------------------------------------------------------------------------------------------------------------------------
}); // MarkersAndSamplesTestModule
markersTester = MarkersAndSamplesTestModule();
moduleTests.push(markersTester);

