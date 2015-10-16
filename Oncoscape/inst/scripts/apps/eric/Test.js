//----------------------------------------------------------------------------------------------------
    // observers used in QUnit testing
  var datasetsStatusObserver = null;
  var pcaStatusObserver = null;


var EricTestModule = (function () {

  var ericTestDiv;
  var controlsDiv;
  var outputDiv;

  var testButton;

  var thisModulesName = "ericTest";
  var thisModulesOutermostDiv = "ericTestDiv";


//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  ericTestDiv = $("#ericTestDiv");
  outputDiv = $("#ericTestOutputDiv");

  testButton = $("#ericTestButton");
  testButton.button();
  testButton.click(runTests);

  handleWindowResize();

} // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  ericTestDiv.width($(window).width() * 0.95);
  ericTestDiv.height($(window).height() * 0.90);  // leave room for tabs above

  outputDiv.width(ericTestDiv.width()); //  * 0.95);
  outputDiv.height(ericTestDiv.height() - 130);

} // handleWindowResize
//--------------------------------------------------------------------------------------------
runTests = function()
{
   var datasetNames; 
   
   QUnit.test("all expected tabs present?", function(assert){
     console.log("starting 'all expected tabs present?' test");
     assert.equal($("#oncoscapeTabs").length, 1);               
     assert.equal($("#datasetsDiv").length, 1);
     assert.equal($("#patientHistoryDiv").length, 1);
     assert.equal($("#markersAndPatientsDiv").length, 1);
     assert.equal($("#survivalDiv").length, 1);
     assert.equal($("#pcaDiv").length, 1);
     assert.equal($("#plsrDiv").length, 1);
     assert.equal($("#dgiDiv").length, 1);
     assert.equal($("#userDataStoreDiv").length, 1);
     });
 
   QUnit.test("determine available datasets", function(assert) {
      console.log("determine available datasets");
      datasetNames = $("#datasetMenu option").map(function(opt){return this.value})
      datasetNames = datasetNames.filter(function(e){return e});
      assert.ok(datasetNames.length > 0);        
      });

   console.log(datasetNames);
   console.log("datasetNames length: " + datasetNames.length);

   for(var i=0; i < datasetNames.length; i++){
      console.log("about to start testing with dataset '" + datasetNames[i] + "'");
      testDisplayDataSetManifest(datasetNames[i]);
      }


}; // runTests
//----------------------------------------------------------------------------------------------------
//
// setup a mutation observer watching the datasetsStatusDiv
// raise the datasets tab
// select the named dataset
// mutation observer will call qunit_testManifestTableDisplayed
//
function testDisplayDataSetManifest(datasetName)
{
   var testTitle = 'display dataset manifest for ' + datasetName;

   console.log(testTitle);

   $("#datasetMenu").val(datasetName);
   $("#datasetMenu").trigger("change");
   
   var target = document.querySelector("#datasetsStatusDiv");
   console.log(" new mutobs target: " + target.id);

   if(datasetsStatusObserver == null) {
   datasetsStatusObserver = new MutationObserver(function(mutations) {
     datasetsStatusObserver.disconnect();
      //mutations.forEach(function(mutation) {
        var mutation = mutations[0];
        var id = mutation.target.id;
        var msg = $("#datasetsStatusDiv").text();
        console.log(id + " status changed: " + msg);
        QUnit.test(testTitle, function(assert) {
           assert.equal($("#datasetMenu").val(), datasetName);
           assert.ok($("#datasetsManifestTable tr").length >= 10);
           var firstRowTitle = $("#datasetsManifestTable tbody tr td")[0].innerHTML;
           var expectedTitles = ["mRNA expression", "mutations", "copy number", "history", 
                                 "protein abundance", "methylation", "geneset", "network"];
           assert.ok(jQuery.inArray(firstRowTitle, expectedTitles) >= 0);
           console.log("dispalyDataSetManifest test complete, now calling loadDataSet");
           firstTime = true;
           datasetsStatusObserver.disconnect();
           hub.raiseTab("datasetsDiv");
           testLoadDataSet(datasetName);
           }); // Qunit.test
     });  // new MutationObserver
      } // not null
   var config = {attributes: true, childList: true, characterData: true};
   datasetsStatusObserver.observe(target, config);
   console.log("observing " + target.id);

}; // testDisplayDataSetManifest
//----------------------------------------------------------------------------------------------------
function testLoadDataSet(datasetName)
{
   var testTitle = 'testLoadDataSet: ' + datasetName;
   console.log(testTitle);

   $("#selectDatasetButton").trigger("click");

     // patientHistory, PCA, PLSR tabs all respond to the "datasetSelected" message

   var pcaTarget = document.querySelector("#pcaStatusDiv");
   console.log(" new mutobs target: " + pcaTarget.id);

   if(pcaStatusObserver == null){
   pcaStatusObserver = new MutationObserver(function(mutations) {
      //mutations.forEach(function(mutation) {
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        var id = mutation.target.id;
        var msg = $("#pcaStatusDiv").text();
        console.log("======== ----- =========== " + id + " status changed: " + msg);
        QUnit.test("PCA button enabled after loading dataset", function(assert) {
           assert.equal($("#datasetMenu").val(), datasetName);
           assert.equal($("#pcaCalculateButton").prop("disabled"), false);
           });
        hub.raiseTab("ericTestDiv");
        //}); // forEach
     }); // new MutationObserver
      }

   var config = {attributes: true, childList: true, characterData: true};
   pcaStatusObserver.observe(pcaTarget, config);
   console.log("observing " + pcaTarget.id);

   hub.raiseTab("pcaDiv");
 
}; // testLoadDataSet
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
          hub.raiseTab("ericTestDiv");
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
function setupStatusObservers()
{

} // setupStatusObservers
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.addOnDocumentReadyFunction(initializeUI);
   setupStatusObservers();
   //hub.addOnDocumentReadyFunction(runTests);

} // initializeModule
//----------------------------------------------------------------------------------------------------
return{
   init: initializeModule,
   test: runTests
   }; // module return value

//----------------------------------------------------------------------------------------------------
}); // EricTestModule

ericTestModule = EricTestModule();
ericTestModule.init();
etm = ericTestModule
