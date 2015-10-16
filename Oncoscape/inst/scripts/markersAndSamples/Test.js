// markersAndSamples/Test.js
//------------------------------------------------------------------------------------------------------------------------
var MarkersAndSamplesTestModule = (function () {

       // for observing relatively small scale status changes: i.e., network loaded and displayed
       // the div watched here is in widget.html

    var markersAndSamplesStatusObserver = null;

       // to detect when the full test of a dataset is complete, so that the next dataset can be tested
       // the div watched here is in test.html
    var testStatusObserver = null;   // modified at the end of each dataset test

//------------------------------------------------------------------------------------------------------------------------
function runTests(datasetNames)
{
     // run through some repetitions of the test
     // condition the next test upon the completion of the preceeding one,
     // which is detected by a change to the "status div"
      
   //var datasetNames = $("#datasetMenu").children().map(function() {return $(this).val();}).get();
     // delete any empty strings
   //datasetNames = datasetNames.filter(function(e) {return (e.length > 0);});
   var datasetIndex = -1;
   
   var config = {attributes: true, childList: true, characterData: true};
   var target =  document.querySelector("#markersTestStatusDiv");

      // define the function called whenever the testStatusDiv changes,
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
      var msg = $("#markersTestStatusDiv").text();
      console.log("test status changed, text: " + msg);
      datasetIndex++;
      if(datasetIndex < datasetNames.length){
         console.log("about to test dataset " + datasetNames[datasetIndex]);      
         if(datasetIndex < datasetNames.length)
            testLoadDataSetDisplayNetwork(datasetNames[datasetIndex]);
	 testStatusObserver = new MutationObserver(onMutation);
         testStatusObserver.observe(target, config);
	 }
      else{
         console.log("mutation observer function detected end of datasets");
	 }
      };

   testStatusObserver = new MutationObserver(onMutation);
   testStatusObserver.observe(target, config);

   $("#markersTestStatusDiv").text("start testing");

} // runTests
//------------------------------------------------------------------------------------------------------------------------
function showTests()
{
   hub.raiseTab("markersTestDiv");

  // $("#qunit").css({"display": "block"});

} // showTests
//------------------------------------------------------------------------------------------------------------------------
function hideTests()
{
   $("#qunit").css({"display": "none"});

} // hide
//------------------------------------------------------------------------------------------------------------------------
function testLoadDataSetDisplayNetwork(dzName)
{
   var testTitle = "testLoadDataSetDisplayNetwork";
   console.log(testTitle);

      // when our module receives the resulting 'datasetSpecified' msg, which includes the dataset's manifest
      // in its payload, it requests 
      //   - the markers network: to be displayed by cyjs
      //   - sampleCategorizationNames, to popbulate the dropdeon menu
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
        QUnit.test("markersAndSamples loaded", function(assert) {
           var nodeCount = cwMarkers.nodes().length;
           var edgeCount = cwMarkers.edges().length;
           console.log("markersAndSamples loaded, with " + nodeCount + " nodes and " + edgeCount + " edges.");
           assert.ok(nodeCount > 10);
           assert.ok(edgeCount > 10);
           testSearch();
           });
        }); // new MutationObserver
      } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector("#markersAndPatientsStatusDiv");
   markersAndSamplesStatusObserver.observe(target, config);

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dzName};

   console.log("about to send specifyCurrentDataset msg to server: " + dzName);
   hub.send(JSON.stringify(msg));

} // testLoadDataSetThenProceed
//------------------------------------------------------------------------------------------------------------------------
// new approach
//   1) clear selection
//   2) find the node with highest degree
//   3) select that node
//   4) show edges, select all connected
//   5) make sure selected node code -1 is equal to degree of the original node
function testSearch()
{
   console.log("--- Test.markers testSearch");
   var searchBox = $("#markersAndTissuesSearchBox");
   var netOpsMenu = $("#cyMarkersOperationsMenu");
   var nodes = cwMarkers.nodes().filterFn(function(node){return (node.data("nodeType") === "patient");});
   var nodesByDegree = nodes.map(function(node){return {id:node.data("id"), degree:node.degree()};});
   var mySort = function(a,b) {return(b.degree - a.degree);};
   var mostConnectedNode = nodesByDegree.sort(mySort)[0];
   console.log("mostConnectedNode: " + JSON.stringify(mostConnectedNode));

   QUnit.test("markers testSearch", function(assert){
     netOpsMenu.val("Hide All Edges");
     netOpsMenu.trigger("change");
     assert.equal(cwMarkers.filter("node:selected").length, 0);
     searchBox.val(mostConnectedNode.id);
     searchBox.trigger(jQuery.Event("keydown", {which: 13}));
     assert.equal(cwMarkers.filter("node:selected").length, 1);
     netOpsMenu.val("Show Edges from Selected Nodes");
     netOpsMenu.trigger("change");
     netOpsMenu.val("Select All Connected Nodes");
     netOpsMenu.trigger("change");
     console.log("about to check for selected nodes");
     var expectedSelectionCount = mostConnectedNode.degree + 1; // include self
     assert.ok(cwMarkers.filter("node:selected").length == expectedSelectionCount);
     //testColorTumorsByClassification();
     recordEndOfTest();
     });

}  // testSearch
//------------------------------------------------------------------------------------------------------------------------
function testColorTumorsByClassification()
{
   var testTitle = "testColorTumorsByClassifictaion";
   console.log(testTitle);

      // TCGA.02.0033 is in all three of our current gbm-related, public, TCGA datasets

   if(markersAndSamplesStatusObserver === null){
      markersAndSamplesStatusObserver = new MutationObserver(function(mutations) {
        hub.raiseTab("markersAndPatientsDiv");
        mutation = mutations[0];
        markersAndSamplesStatusObserver.disconnect();
        markersAndSamplesStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#markersAndSamplesStatusDiv").text();
        QUnit.test(title, function(assert) {
           assert.ok(10 === 10);
           });
        }); // new MutationObserver
      } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector("#markersAndPatientsStatusDiv");
   markersAndSamplesStatusObserver.observe(target, config);

   var dz = "TCGAbrain";
   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dzName};

   hub.send(JSON.stringify(msg));

} // testColorTumors
//------------------------------------------------------------------------------------------------------------------------
function recordEndOfTest()
{
  console.log("end of test");
  $("#markersTestStatusDiv").text("test complete");

} // recordEndOfTest
//------------------------------------------------------------------------------------------------------------------------
function initialize()
{
   console.log("--- initializing markersAndSamples/Test.js");

} // initialize
//------------------------------------------------------------------------------------------------------------------------
return{
   init: initialize,
   run: runTests,
   show: showTests,
   hide: hideTests
   }; // module return value

//------------------------------------------------------------------------------------------------------------------------
}); // MarkersAndSamplesTestModule
markersTester = MarkersAndSamplesTestModule();

