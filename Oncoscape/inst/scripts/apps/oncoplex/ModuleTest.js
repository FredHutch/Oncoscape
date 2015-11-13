//----------------------------------------------------------------------------------------------------
var datasetsStatusObserver = null;
var patientHistoryStatusObserver = null;
var markersNetworkStatusObserver = null;
var pathwayStatusObserver = null;
var patientHistoryTableStatusObserver = null;
//----------------------------------------------------------------------------------------------------
var OncoplexTestModule = (function () {

  var sendSelectionsMenu;
  var oncoplexTestDiv;
  var controlsDiv;
  var outputDiv;

  var testButton;

  var thisModulesName = "oncoplexTest";
  var thisModulesOutermostDiv = "oncoplexTestDiv";


//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  oncoplexTestDiv = $("#oncoplexTestDiv");
  outputDiv = $("#oncoplexTestOutputDiv");

  testButton = $("#oncoplexTestButton");
  testButton.button();
  testButton.click(runTests);

  handleWindowResize();

} // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  oncoplexTestDiv.width($(window).width() * 0.95);
  oncoplexTestDiv.height($(window).height() * 0.90);  // leave room for tabs above

  outputDiv.width(oncoplexTestDiv.width()); //  * 0.95);
  outputDiv.height(oncoplexTestDiv.height() - 130);

} // handleWindowResize
//--------------------------------------------------------------------------------------------
runTests = function(password)
{
     // check for presence of all the expected tabs

  console.log("oncoplex runTests");

  $("#passcodeInput").val(password)
  $("#loginButton").trigger("click");

  QUnit.test("all expected tabs present?", function(assert){
    console.log("starting 'all expected tabs present?' test");
    assert.equal($("#loginDiv").length, 1);
    assert.equal($("#datasetsDiv").length, 1);
    assert.equal($("#patientHistoryDiv").length, 1);
    assert.equal($("#markersAndPatientsDiv").length, 1);
    assert.equal($("#survivalDiv").length, 1);
    assert.equal($("#pi3kAktPathwayDiv").length, 1);
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

   hub.raiseTab("oncoplexTestDiv");


} // runTests
//----------------------------------------------------------------------------------------------------
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
           assert.ok($("#datasetsManifestTable tr").length >= 4);
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
// we know that DEMOdz has a 20x7  (patients x attributes) patient history table which should be loaded
// wait for that, check the dimensions
function testLoadDataSet(datasetName)
{
   var testTitle = 'testLoadDataSet: ' + datasetName;
   console.log(testTitle);

   $("#selectDatasetButton").trigger("click");

     // patientHistory, PCA, PLSR tabs all respond to the "datasetSelected" message

   var target = document.querySelector("#patientHistoryStatusDiv");
   console.log(" new mutobs target: " + target.id);

   if(patientHistoryStatusObserver == null){
      patientHistoryStatusObserver = new MutationObserver(function(mutations) {
         mutation = mutations[0];
         patientHistoryStatusObserver.disconnect();
         var id = mutation.target.id;
         var msg = $("#patientHistoryStatusDiv").text();
         console.log("======== ----- =========== " + id + " status changed: " + msg);
         QUnit.test("found multiple patient history rows in data table", function(assert) {
            assert.ok($("#patientHistoryTable tr").length > 10);
            assert.ok($("#patientHistoryTable > tbody").find("> tr:first > td").length >= 4);
            testLoadDataSetForMarkersAndPatientsNetwork(datasetName);
            });
         }); // new MutationObserver
      } // if null observer 

   var config = {attributes: true, childList: true, characterData: true};
   patientHistoryStatusObserver.observe(target, config);
   console.log("observing " + target.id);

}; // testLoadDataSet
//----------------------------------------------------------------------------------------------------
// check the status div, which Module.markers writes to after the network is loaded
function testLoadDataSetForMarkersAndPatientsNetwork(datasetName)
{
   var testTitle = 'testLoadDataSetForMarkersAndPatientsNetwork: ' + datasetName;
   console.log(testTitle);

   var statusDivName = "#markersAndPatientsStatusDiv";
   var target = document.querySelector(statusDivName);
   console.log(" new mutobs target: " + target.id);

   if(markersNetworkStatusObserver == null){
      markersNetworkStatusObserver = new MutationObserver(function(mutations) {
         mutation = mutations[0];
         markersNetworkStatusObserver.disconnect();
         var id = mutation.target.id;
         var msg = $(statusDivName).text();
         console.log("======== ----- =========== " + id + " status changed: " + msg);
         QUnit.test("found multiple marker nodes", function(assert) {
            assert.ok(cwMarkers.nodes().length > 50);
            testLoadDataSetForEGFRPathway(datasetName);
            });
         }); // new MutationObserver
      } // if null observer 

   var config = {attributes: true, childList: true, characterData: true};
   markersNetworkStatusObserver.observe(target, config);
   console.log("observing " + target.id);

}; // testLoadDataSetForMarkersAndPatientsNetwork
//----------------------------------------------------------------------------------------------------
// check the status div, which Module.markers writes to after the network is loaded
function testLoadDataSetForEGFRPathway(datasetName)
{
   var testTitle = 'testLoadDataSetForEGFRPathway: ' + datasetName;
   console.log(testTitle);

   var statusDivName = "#pathwayStatusDiv";
   var target = document.querySelector(statusDivName);
   console.log("new mutobs target: " + target.id);

   if(pathwayStatusObserver == null){
      console.log("** creating a new pathwayStatusObserver");
      pathwayStatusObserver = new MutationObserver(function(mutations) {
         mutation = mutations[0];
         pathwayStatusObserver.disconnect();
         var id = mutation.target.id;
         var msg = $(statusDivName).text();
         console.log("======== ----- =========== " + id + " status changed: " + msg);
         QUnit.test("found multiple egfr signaling nodes", function(assert) {
            assert.ok(cyPathway.nodes().length > 30);
            });
         hub.raiseTab("oncoplexTestDiv");
         testSetPatientHistoryMinSurvival(datasetName);
         }); // new MutationObserver
      } // if null observer 

   var config = {attributes: true, childList: true, characterData: true};
   pathwayStatusObserver.observe(target, config);
   console.log("observing " + target.id);

}; // testLoadDataSetForEGFRPathway
//----------------------------------------------------------------------------------------------------
// check the status div, which Module.markers writes to after the network is loaded
function testSetPatientHistoryMinSurvival(datasetName)
{
   var testTitle = 'testSetPatientHistoryMinSurvival: ' + datasetName;
   console.log(testTitle);

   var targetElementName = "#survivalStatusDiv";
   var target = document.querySelector(targetElementName);
   console.log("new mutobs target: " + target.id);

   if(patientHistoryTableStatusObserver == null){
      console.log("** creating a new patientHistoryTableStatusObserver");
      console.log($("#patientHistoryTable_info").text());
      patientHistoryTableStatusObserver = new MutationObserver(function(mutations) {
         mutation = mutations[0];
         patientHistoryTableStatusObserver.disconnect();
         var id = mutation.target.id;
         var msg = $(targetElementName).text();
         console.log("======== ----- =========== " + id + " status changed: " + msg);
         QUnit.test("select 2 long surviving patients", function(assert) {
            assert.ok($("#survivalStatusDiv").text() == "image loaded");
            });
         hub.raiseTab("oncoplexTestDiv");
         }); // new MutationObserver
      } // if null observer 

   var config = {attributes: true, childList: true, characterData: true};
   patientHistoryTableStatusObserver.observe(target, config);
   console.log("observing " + target.id);

   //setTimeout(function(){
      console.log("about to set slider");
      $("#survivalMinSliderReadout").text("8"); 
      $("#patientHistoryTable").DataTable().draw();
      $("#patientHistorySendSelectionsMenu").val("survival")
      $("#patientHistorySendSelectionsMenu").trigger("change")
      console.log(" -- after draw");
      console.log($("#patientHistoryTable_info").text());
     // }, 3000);


}; // testSetPatientHistoryMinSurvival
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.addOnDocumentReadyFunction(initializeUI);
   //hub.addSocketConnectedFunction(runAutomatedTestsIfAppropriate);

} // initializeModule
//----------------------------------------------------------------------------------------------------
return{
   init: initializeModule,
   run: runTests
   }; // OncoplexTestModule return value

//----------------------------------------------------------------------------------------------------
}); // OncoplexTestModule

oncoplexTestModule = OncoplexTestModule();
oncoplexTestModule.init();
testOncoplex = oncoplexTestModule.run
