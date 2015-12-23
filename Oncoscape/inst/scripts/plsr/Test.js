//----------------------------------------------------------------------------------------------------
// observers used in QUnit testing

var PlsrTestModule = (function (){

      // for observing relatively small scale status changes: i.e., network loaded and displayed
       // the div watched here is in widget.html

    var plsrStatusObserver = null;
    var testStatusObserver = null;   // modified at the end of each dataset test

    var minorStatusDiv = "#plsrStatusDiv";
    var majorStatusDiv = "#plsrTestStatusDiv";

       // to detect when the full test of a dataset is complete, so that the next dataset can be tested
       // the div watched here is in test.html


//------------------------------------------------------------------------------------------------------------------------
function runTests()
{
   console.log("starting PlsrTestModule runTests");
   testLoadDataSetAndConfigure();

} // runTests
//--------------------------------------------------------------------------------------------
function testLoadDataSetAndConfigure()
{
   var testTitle = "testLoadDataSetConfigure";
   console.log(testTitle);
     
      // when our module receives the resulting 'datasetSpecified' msg, which includes 
      // the dataset's manifest in its payload, it requests patient ageAtDz and
      // survival mins and maxes and sets up sliders in the ui, setting 
      // current thresholds to 33% and 67% of the full range.
      // the geneset pulldown menu is also populated, and a default value selected
      // no user selection (of points in the display) is possible, so the
      // clear selection button should not yet be active.
      // check all these things, then testCalculateAndDisplayPLSR.

   if(plsrStatusObserver === null){
      plsrStatusObserver = new MutationObserver(function(mutations) {
        console.log("in testLoadDataSet observer");
        hub.raiseTab("plsrDiv");
        mutation = mutations[0];
        plsrStatusObserver.disconnect();
        plsrStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#plsrStatusDiv").text();
        QUnit.test("plsr dataset loaded", function(assert) {
          assert.equal($("#plsrAgeAtDxMinSliderReadout").text(), "45");
          assert.equal($("#plsrAgeAtDxMaxSliderReadout").text(), "66");
          assert.equal($("#plsrSurvivalMinSliderReadout").text(), "3");
          assert.equal($("#plsrSurvivalMaxSliderReadout").text(), "7");
          assert.equal($("#plsrGeneSetSelector").val(), "random.40");
          assert.equal($("#plsrClearSelectionButton").prop("disabled"), true);
          testCalculateAndDisplayPLSR();
          });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector("#plsrStatusDiv");
   plsrStatusObserver.observe(target, config);

     // we could use the datasets tab menu to select the dataset, then click the button.
     // easier and quite adequate for our purposes here, however, is to simply send out the message which
     // these ui actions create

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload: "DEMOdz"};
   hub.send(JSON.stringify(msg));

} // testLoadDataSetAndConfigure
//------------------------------------------------------------------------------------------------------------------------
testCalculateAndDisplayPLSR = function()
{
  var testTitle = "testCalculateAndDisplayPLSR";
  console.log(testTitle);

     // use default settings of the two sliders

  $("#plsrCalculateButton").trigger("click");
 
  if(plsrStatusObserver === null){
     plsrStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        plsrStatusObserver.disconnect();
        plsrStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#plsrStatusDiv").text();
        QUnit.test("plsr loaded", function(assert) {
           var c0 = $("circle")[0];
           var geneName = c0.innerHTML;
           assert.ok(geneName == "PRRX1");
           var xPos = Number(c0.getAttribute("cx"));
           var yPos =  Number(c0.getAttribute("cy"));
           var radius = Number(c0.getAttribute("r"));
           assert.ok(xPos > 0);
           assert.ok(yPos > 0);
           assert.ok(radius > 0);
           var axisLines = $(".line");
          assert.equal(axisLines.length, 4);
          for(var i=0; i < 4; i++){
             var x1 = Number($(".line")[i].getAttribute("x1"));
             var x2 = Number($(".line")[i].getAttribute("x2"));
             var y1 = Number($(".line")[i].getAttribute("y1"));
             var y2 = Number($(".line")[i].getAttribute("y2"));
             var axisLength = Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
             console.log("extent for axis " + i + ": " + axisLength);
             assert.ok(axisLength > 10);
             } // for i
           }); // QUnit.test
         }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector("#plsrStatusDiv");
   plsrStatusObserver.observe(target, config);

}; // testCalculateAndDisplayPLSR
//-------------------------------------------------------------------------------------------
showTests = function()
{
   $("#qunit").css({"display": "block"});

}; // showTests
//------------------------------------------------------------------------------------------------------------------------
hideTests = function()
{
   $("#qunit").css({"display": "none"});

}; // hide
//------------------------------------------------------------------------------------------------------------------------
return{
   run: runTests,
   show: showTests,
   hide: hideTests
   }; // PlsrTestModule return value

//----------------------------------------------------------------------------------------------------
}); // PlsrTestModule


plsrTest = PlsrTestModule();

