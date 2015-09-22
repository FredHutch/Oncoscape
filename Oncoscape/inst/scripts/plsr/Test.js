//----------------------------------------------------------------------------------------------------
var PlsrTestModule = (function () {

  var plsrTestDiv;
  var controlsDiv;
  var outputDiv;

  var testButton;

  var thisModulesName = "plsrTest";
  var thisModulesOutermostDiv = "plsrTestDiv";


//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  plsrTestDiv = $("#plsrTestDiv");
  outputDiv = $("#plsrTestOutputDiv");

  testButton = $("#plsrTestButton");
  testButton.button();
  testButton.click(runTests);

  handleWindowResize();

} // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  plsrTestDiv.width($(window).width() * 0.95);
  plsrTestDiv.height($(window).height() * 0.90);  // leave room for tabs above

  outputDiv.width(plsrTestDiv.width()); //  * 0.95);
  outputDiv.height(plsrTestDiv.height() - 130);

} // handleWindowResize
//--------------------------------------------------------------------------------------------
runTests = function()
{
   for(var i=0; i < 1; i++){
     runOneTest();
     }

}; // runTests
//--------------------------------------------------------------------------------------------
runOneTest = function()
{
     // check for presence of all the expected tabs
     hub.raiseTab(thisModulesOutermostDiv);
     console.log("plsr runTests");
   
     QUnit.test("all expected tabs present?", function(assert){
       console.log("starting 'all expected tabs present?' test");
       assert.equal($("#datasetsDiv").length, 1);
       assert.equal($("#plsrDiv").length, 1);
       });
   
     QUnit.test('choose DEMOdz dataset', function(assert) {
         hub.raiseTab("datasetsDiv");
         var desiredDataset = "DEMOdz";
         var dzNames = $("#datasetMenu option").map(function(opt){return this.value;});
   
         if($.inArray(desiredDataset, dzNames) < 0){
            alert("cannot run tests:  " + desiredDataset + " dataset not loaded");
            return;
            }
   
         $("#datasetMenu").val(desiredDataset);
         $("#datasetMenu").trigger("change");
   
         var done1 = assert.async();
         var done2 = assert.async();
         var done3 = assert.async();
         assert.expect(3);
   
         setTimeout(function(){
            assert.equal($("#datasetMenu").val(), desiredDataset);  done1();
            assert.ok($("#datasetsManifestTable tr").length >= 10); done2();
            assert.equal($("#datasetsManifestTable tbody tr").eq(0).find("td").eq(0).text(), 
                         "mRNA expression"); done3();
            testLoadDEMOdz();
            }, 5000);
         });

}; // runOneTest
//----------------------------------------------------------------------------------------------------
function testLoadDEMOdz()
{
   QUnit.test('load DEMOdz', function(assert) {
      console.log("=============  starting load DEMOdz test");
      hub.enableButton($("#selectDatasetButton"));
      $("#selectDatasetButton").trigger("click");
      hub.raiseTab("plsrDiv");
      assert.expect(0);   // no tests here
       setTimeout(function(){
          testDEMOdzPLSRConfiguration();
          }, 5000);
       });

} // testLoadDEMOdz
//----------------------------------------------------------------------------------------------------
function testDEMOdzPLSRConfiguration()
{
   QUnit.test('testDEMOdzPLSRConfiguration', function(assert) {
      var minAge = $("#plsrAgeAtDxMinSliderReadout").val();
      assert.ok(minAge == "45");
      var maxAge = $("#plsrAgeAtDxMaxSliderReadout").val();
      assert.ok(maxAge == "66");
      var minSurvival = $("#plsrSurvivalMinSliderReadout").val();
      console.log("  minSurvival: " + minSurvival);
      assert.ok(minSurvival == "3");
      var maxSurvival = $("#plsrSurvivalMaxSliderReadout").val();
      console.log("  maxSurvival: " + maxSurvival);
      assert.ok(maxSurvival == "7"); 
      assert.ok($("#plsrGeneSetSelector").val() == "random.40");
      testRunPLSR();
      });

} // testDEMOdzPLSRConfiguration
//----------------------------------------------------------------------------------------------------
function testRunPLSR()
{
   QUnit.test('testRunPLSR', function(assert) {
      $("#plsrCalculateButton").trigger("click");
       assert.expect(6); 
       var done1 = assert.async();
       var done2 = assert.async();
       var done3 = assert.async();
       var done4 = assert.async();
       var done5 = assert.async();
       var done6 = assert.async();
       setTimeout(function(){
          assert.ok($("circle").length > 10); done1();
          assert.ok($("circle").length > 10); done2();
          var c0 = $("circle")[0];
          var geneName = c0.innerHTML;
          assert.ok(geneName == "PRRX1"); done3();
          var xPos = Number(c0.getAttribute("cx"));
          var yPos =  Number(c0.getAttribute("cy"));
          var radius = Number(c0.getAttribute("r"));
          assert.ok(xPos > 0); done4();
          assert.ok(yPos > 0); done5();
          assert.ok(radius > 0); done6();
          hub.raiseTab("plsrTestDiv");
          }, 5000);
      });

} // testRunPLSR
//----------------------------------------------------------------------------------------------------
// query the oncoscape server for user id.  the callback then makes a local (that is,
// Module-specific) decision to run this module's automated tests based upon that id
//
function runAutomatedTestsIfAppropriate()
{
   var msg = {cmd: "getUserId",  callback: "plsrTestAssessUserIdForTesting",
              status: "request", payload: ""};

   hub.send(JSON.stringify(msg));

} // runAutomatedTestsIfAppropriate
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.addOnDocumentReadyFunction(runTests);

} // initializeModule
//----------------------------------------------------------------------------------------------------
return{
   init: initializeModule
   }; // PlsrTestModule return value

//----------------------------------------------------------------------------------------------------
}); // PlsrTestModule

plsrTestModule = PlsrTestModule();
plsrTestModule.init();
