//------------------------------------------------------------------------------------------------------------------------
    // observers used in QUnit testing
  var datasetsStatusObserver = null;
  var gbmPathwaysStatusObserver = null;


var GbmPathwayTestModule = (function () {

//------------------------------------------------------------------------------------------------------------------------
function initializeUI()
{
   console.log("Test.gbmPathway intializeUI")

} // initializeUI
//------------------------------------------------------------------------------------------------------------------------
runTests = function(show)
{
   if(show) showTests();

   testLoadDataSetThenLoadPathways();

} // runTests
//------------------------------------------------------------------------------------------------------------------------
showTests = function()
{
   $("#qunit").css({"display": "block"});

} // show
//------------------------------------------------------------------------------------------------------------------------
hideTests = function()
{
   $("#qunit").css({"display": "none"});

} // hide
//------------------------------------------------------------------------------------------------------------------------
function testLoadDataSetThenLoadPathways()
{
   var testTitle = "testLoadDataSet";
   console.log(testTitle);
   hub.raiseTab("gbmPathwaysDiv")
     
     // we could use the datasets tab menu to select the dataset, then click the button.
     // easier and quite adequate for our purposes is to simply send out the message which
     // these ui actions create

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload: "DEMOdz"};
      // when our module receives the 'datasetSpecified' msg, which is accompanied by the dataset's manifest
      // it looks for the gbmPathways data object in the manifest, requests it be sent if it is there
      // when that data is loaded and ready, the module updates the status div; we watch for that, then
      // check that a reasonable number of nodes are contained in the loaded graph.

   var target = document.querySelector("#gbmPathwaysStatusDiv");

   if(gbmPathwaysStatusObserver == null){
      gbmPathwaysStatusObserver = new MutationObserver(function(mutations) {
      mutation = mutations[0];
      gbmPathwaysStatusObserver.disconnect();
      gbmPathwaysStatusObserver = null;
      var id = mutation.target.id;
      var msg = $("#gbmPathwaysStatusDiv").text();
      QUnit.test("gbmPathways loaded", function(assert) {
         var nodeCount = cyGbm.nodes().length;
         var edgeCount = cyGbm.edges().length;
         console.log("gbmPathway loaded, with " + nodeCount + " nodes and " + edgeCount + " edges.");
         assert.ok(nodeCount > 150);
         assert.ok(edgeCount > 200);
         testMakeSelections();
         })
      }); // new MutationObserver
      }

   var config = {attributes: true, childList: true, characterData: true};
   gbmPathwaysStatusObserver.observe(target, config);

   hub.send(JSON.stringify(msg));

}; // testLoadDataSetThenLoadPathways
//------------------------------------------------------------------------------------------------------------------------
function testMakeSelections()
{
   var selectedNodes = cyGbm.filter("node:selected").map(function(node){ return node.id();});
   console.log("--- testMakeSelections, selected node count: " + selectedNodes.length);
   console.log(JSON.stringify(selectedNodes));
   console.log("   menu disabled? " + $("#gbmPathwaysSendSelectionMenu").prop("disabled"));

   QUnit.test("gbmPathways selections", function(assert){
     assert.equal(cyGbm.filter("node:selected").length, 0);
     assert.equal($("#gbmPathwaysSendSelectionMenu").prop("disabled"), true);
     cyGbm.$("#GAB1").select()  // effectively instantaneous results?
     assert.equal(cyGbm.filter("node:selected").length, 1);
     assert.equal($("#gbmPathwaysSendSelectionMenu").prop("disabled"), false);
     });

   QUnit.test("gbmPathways direct cyjs search", function(assert){
       // use setTimeout to ensure a brief delay between 
       // calls to cyjs and results appearing on the cyjs canvas
     var done1 = assert.async();
     var done2 = assert.async();
     var done3 = assert.async();
     var done4 = assert.async();
     var done5 = assert.async();
     assert.expect(5);
     cyGbm.filter("node:selected").unselect();
     setTimeout(function(){
        var selectedNodeCount = cyGbm.filter("node:selected").length;
        console.log(" testing  unselect: " + selectedNodeCount);
        assert.equal(selectedNodeCount, 0); done1();
        var menuDisabled = $("#gbmPathwaysSendSelectionMenu").prop("disabled")
        console.log(" testing  unselect, menu disabled?: " + menuDisabled);
        assert.equal(menuDisabled, true); done2();
          // with this test complete, setup the next one
        cyGbm.$("#GAB1").select();  // effectively instantaneous results?
        }, 1000);
     setTimeout(function(){
        var selectedNodes = cyGbm.filter("node:selected").map(function(node){ return node.id();});
        assert.equal(selectedNodes.length, 1); done3();
        console.log("selected node: " + selectedNodes[0]);
        assert.equal(selectedNodes[0], "GAB1"); done4();
        assert.equal($("#gbmPathwaysSendSelectionMenu").prop("disabled"), false); done5();
        testSearchBox();
        }, 1000);
      }); // gbmPathways direct cyjs search

} // testMakeSelections
//------------------------------------------------------------------------------------------------------------------------
function testSearchBox()
{
   cyGbm.filter("node:selected").unselect();

   QUnit.test("gbmPathways searchBox", function(assert){
     assert.equal(cyGbm.filter("node:selected").length, 0);
     assert.equal($("#gbmPathwaysSendSelectionMenu").prop("disabled"), true);
     var box = $("#gbmPathwaysSearchBox");
     box.val("pik");  // user lower case to test case insensitivity
     box.trigger(jQuery.Event("keydown", {which: 13}))
     assert.equal(cyGbm.filter("node:selected").length, 9);
     assert.equal($("#gbmPathwaysSendSelectionMenu").prop("disabled"), false);
     testZoomSelected();
     });


} // testSearchBox
//------------------------------------------------------------------------------------------------------------------------
function testZoomSelected()
{
   console.log("--- testZoomSelected");

   QUnit.test("gbmPathways zoom selected", function(assert){
     assert.ok(cyGbm.filter("node:selected").length > 0);
     var zoomBefore = cyGbm.viewport().zoom();
     $("#gbmZoomSelectedButton").click();
     var zoomAfter = cyGbm.viewport().zoom();
     console.log("zoomBefore: " + zoomBefore);
     console.log("zoomAfter: " + zoomAfter);
     assert.ok(zoomAfter > zoomBefore);
     console.log("pause zoomed in before calling testHandleIncomingSelections");
     setTimeout(function(){testHandleIncomingSelections()}, 1000);
     });

} // testZoomSelected
//------------------------------------------------------------------------------------------------------------------------
function testHandleIncomingSelections()
{
     // start out with network zoomed out, and no selected nodes
   console.log("--- testHandleIncomingSelections")

   cyGbm.filter("node:selected").unselect();
   cyGbm.fit(50);
 
   var cmd = "sendSelectionTo_gbmPathways";
   var payload = {value: ["GRB2", "PDGFRB"]};  // two nodes at top center of network
   var msg = {cmd: cmd, callback: "", status: "request", payload: payload};

   var target = document.querySelector("#gbmPathwaysStatusDiv");

   if(gbmPathwaysStatusObserver == null){
      gbmPathwaysStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        gbmPathwaysStatusObserver.disconnect();
        gbmPathwaysStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#gbmPathwaysStatusDiv").text();
        QUnit.test("gbmPathways incoming identifiers received", function(assert) {
           assert.equal(cyGbm.filter("node:selected").length, 2)        
           })
        setTimeout(testSendSelectionsViaGUI, 2000);
        }); // new MutationObserver
      } // if null observer

   var config = {attributes: true, childList: true, characterData: true};
   gbmPathwaysStatusObserver.observe(target, config);
   hub.send(JSON.stringify(msg));
   
} // testHandleIncomingSelections
//------------------------------------------------------------------------------------------------------------------------
function testSendSelectionsViaGUI()
{
   console.log("--- testSendSelectionsViaGUI");

     // start out with network zoomed out, and no selected nodes
   cyGbm.filter("node:selected").unselect();
   cyGbm.fit(50);
 
   cyGbm.$("#IRS1").select();
   cyGbm.$("#GAB1").select();

   setTimeout(function(){
      $("#gbmPathwaysSendSelectionMenu").val("blankTab");
      $("#gbmPathwaysSendSelectionMenu").trigger("change");
      }, 200);

   setTimeout(function(){
      QUnit.test("gbmPathways send selection via GUI", function(assert) {
        assert.ok($("#blankTabOutputDiv").text().indexOf("IRS1") >= 0);
        assert.ok($("#blankTabOutputDiv").text().indexOf("GAB1") >= 0);
        //testEdgeSelectionAndAbstractDisplay();
        })}, 1000)
    
   setTimeout(function(){hub.raiseTab("gbmPathwaysDiv")}, 2000);

   console.log("--- testSendAndReceiveSelectionsViaGUI, sent selections?");

} // testSendSelectionsViaGUI
//------------------------------------------------------------------------------------------------------------------------
function testEdgeSelectionAndAbstractDisplay()
{
  console.log("--- testSendSelectionsViaGUI");
  $("#gbmViewAbstractsButton").trigger("click");
  cyGbm.edges()[0].select();
    // edge is not visually selected
    // don't know how to detect for an actually opened window...


} // testEdgeSelectionAndAbstractDisplay
//------------------------------------------------------------------------------------------------------------------------

return{
   init: initializeUI,
   run: runTests,
   show: showTests,
   hide: hideTests
   }; // module return value

//------------------------------------------------------------------------------------------------------------------------
}); // GbmPathwayTestModule

gbt = GbmPathwayTestModule();
//gbt.run(true);
