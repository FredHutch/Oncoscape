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
   hub.raiseTab("markersAndPatientsDiv")
     
     // we could use the datasets tab menu to select the dataset, then click the button.
     // easier and quite adequate for our purposes is to simply send out the message which
     // these ui actions create

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload: "DEMOdz"};
      // when our module receives the 'datasetSpecified' msg, which is accompanied by the dataset's manifest
      // it looks for the markersAndSamples data object in the manifest, requests it be sent if it is there
      // when that data is loaded and ready, the module updates the status div; we watch for that, then
      // check that a reasonable number of nodes are contained in the loaded graph.


   if(markersAndSamplesStatusObserver == null){
      markersAndSamplesStatusObserver = new MutationObserver(function(mutations) {
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
           })
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector("#markersAndPatientsStatusDiv");
   markersAndSamplesStatusObserver.observe(target, config);

   hub.send(JSON.stringify(msg));

}; // testLoadDataSetThenProceed
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

mast = MarkersAndSamplesTestModule();
//mast.run(true);
