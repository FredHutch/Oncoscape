// markersAndSamples/Test.js
//------------------------------------------------------------------------------------------------------------------------

    // observers used in QUnit testing
var markersAndSamplesStatusObserver = null;


var MarkersAndSamplesTestModule = (function () {

//------------------------------------------------------------------------------------------------------------------------
runTests = function(show)
{
   if(show) showTests();

   testLoadDataSetThenProceed();

} // runTests
//------------------------------------------------------------------------------------------------------------------------
showTests = function()
{
   $("#qunit").css({"display": "block"});

} // showTests
//------------------------------------------------------------------------------------------------------------------------
hideTests = function()
{
   $("#qunit").css({"display": "none"});

} // hide
//------------------------------------------------------------------------------------------------------------------------
function testLoadDataSetThenProceed()
{
   var testTitle = "testLoadDataSet";
   console.log(testTitle);
     
     // we could use the datasets tab menu to select the dataset, then click the button.
     // easier and quite adequate for our purposes here, however, is to simply send out the message which
     // these ui actions create

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload: "DEMOdz"};

      // when our module receives the resulting 'datasetSpecified' msg, which includes the dataset's manifest
      // in its payload, it requests 
      //   - the markers network: to be displayed by cyjs
      //   - sampleCategorizationNames, to popbulate the dropdeon menu
      // when the network is loaded, the statusDiv is updated, which is detected here, and we
      // check to see that a reasonable number of nodes are contained in the loaded graph.
      // when those tests are over, we then cascade through a number of gui operations: search, node selections
      // network operations

   if(markersAndSamplesStatusObserver == null){
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
           })
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector("#markersAndPatientsStatusDiv");
   markersAndSamplesStatusObserver.observe(target, config);

   hub.send(JSON.stringify(msg));

}; // testLoadDataSetThenProceed
//------------------------------------------------------------------------------------------------------------------------
function testSearch()
{
   console.log("--- Test.markers testSearch");
   var gene = "EGFR";
   var searchBox = $("#markersAndTissuesSearchBox");
   var netOpsMenu = $("#cyMarkersOperationsMenu");

   QUnit.test("markers testSearch", function(assert){
     netOpsMenu.val("Hide All Edges");
     netOpsMenu.trigger("change");
     assert.equal(cwMarkers.filter("node:selected").length, 0);
     searchBox.val(gene);
     searchBox.trigger(jQuery.Event("keydown", {which: 13}))
     assert.equal(cwMarkers.filter("node:selected").length, 1);
     netOpsMenu.val("Show Edges from Selected Nodes");
     netOpsMenu.trigger("change");
     netOpsMenu.val("Select All Connected Nodes");
     netOpsMenu.trigger("change");
     console.log("about to check for 10 selected nodes");
     assert.equal(cwMarkers.filter("node:selected").length, 10);
     });

};  // testSearch
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
//mast = MarkersAndSamplesTestModule();

