//----------------------------------------------------------------------------------------------------
var BlankTabModule = (function () {

  var blankTabDiv;
  var controlsDiv;
  var outputDiv;

  var testButton;

  var sendSelectionsMenu;

  var thisModulesName = "blankTab";
  var thisModulesOutermostDiv = "blankTabDiv";

  var sendSelectionsMenuTitle = "Send selection...";

      // sometimes a module offers multiple selection destinations
      // but usually just the one entry point
  var selectionDestinations = [thisModulesName];
      // make sure to register, eg,
      // hub.addMessageHandler("sendSelectionTo_blankTab", handleSelections);

//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  blankTabDiv = $("#blankTabDiv");
  controlsDiv = $("#blankTabControlsDiv");
  outputDiv = $("#blankTabOutputDiv");

  testButton = $("#testBlankTabButton");
  testButton.click(runTests);

  sendSelectionsMenu = hub.configureSendSelectionMenu("#blankTabSendSelectionsMenu", 
                                                      selectionDestinations, 
                                                      sendSelections,
                                                      sendSelectionsMenuTitle);

  handleWindowResize();

} // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  blankTabDiv.width($(window).width() * 0.95);
  blankTabDiv.height($(window).height() * 0.90);  // leave room for tabs above

  controlsDiv.width(blankTabDiv.width()); //  * 0.95);
  controlsDiv.height("100px");

  outputDiv.width(blankTabDiv.width()); //  * 0.95);
  outputDiv.height(blankTabDiv.height() - 130);

} // handleWindowResize
//--------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();

  var cmd = "sendSelectionTo_" + destination;
  var dummySelections = ["dummy selection 1", "dummy selection 2"];

  payload = {value: dummySelections, count: dummySelections.length, 
             source: thisModulesName};

  var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

      // restore default (informational) title of the menu
   sendSelectionsMenu.val(sendSelectionsMenuTitle);

  hub.send(JSON.stringify(newMsg));

} // sendSelections
//--------------------------------------------------------------------------------------------
function handleSelections(msg)
{
   hub.raiseTab(thisModulesOutermostDiv);
   var msgAsString = JSON.stringify(msg.payload);
   
   outputDiv.html("<pre>" + msgAsString + "</pre");


} // handleSelections
//----------------------------------------------------------------------------------------------------
runTests = function()
{
    // tests depend upon the presence of 2 tabs in addition to the present one.
  var datasetsTabPresent = $("#datasetsDiv").length > 0
  var patientHistoryTabPresent = $("#patientHistoryDiv").length > 0

  if(!(datasetsTabPresent && patientHistoryTabPresent)){
     alert("Need both datasets & patientHistory tabs for QUnit testing");
     return;
     } // check for other needed tabs

   outputDiv.css({display: "block"});

   QUnit.test('choose DEMOdz dataset', function(assert) {
      hub.raiseTab("datasetsDiv");
      var desiredDataset = "DEMOdz";
      var dzNames = $("#datasetMenu option").map(function(opt){return this.value})

      if($.inArray(desiredDataset, dzNames) < 0){
         alert("cannot run tests:  " + desiredDataset + " dataset not loaded");
         return;
         }

      $("#datasetMenu").val(desiredDataset)
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
         testLoadPatientHistoryTable();
         }, 5000);
      });

} // runTests
//----------------------------------------------------------------------------------------------------
function testLoadPatientHistoryTable()
{
   QUnit.test('load patient history table', function(assert) {
       console.log("=============  starting load pt tbl test");
       hub.enableButton($("#selectDatasetButton"));
       $("#selectDatasetButton").trigger("click");
       var done1 = assert.async();
       assert.expect(1);

       setTimeout(function(){
          console.log("-- starting async check");
          assert.equal($("#patientHistoryTable tr").length, 21);
          done1();
          testSelectLongSurvivors();
          }, 5000);
       });

} // testLoadPatientHistoryTable
//----------------------------------------------------------------------------------------------------
function testSelectLongSurvivors()
{
   QUnit.test('testSelectLongSurvivors', function(assert) {
      tbl = $("#patientHistoryTable").DataTable();
      $("#survivalMinSliderReadout").text("8");  // just two DEMOdz patients lived > 8 years
      tbl.draw()
      hub.raiseTab("patientHistoryDiv");
      assert.expect(1);
      var done1 = assert.async()
      setTimeout(function(){
         assert.equal($("#patientHistoryTable tbody tr").length, 2);
         done1();
         testSendToBlankTab();
         }, 5000);
      });

} // testSelectLongSurvivors
//----------------------------------------------------------------------------------------------------
function testSendToBlankTab()
{
   QUnit.test('testSendToBlankTab', function(assert) {
      $("#patientHistorySendSelectionsMenu").val("blankTab");
      $("#patientHistorySendSelectionsMenu").trigger("change");
      assert.expect(0);   // tests (assertions) in next function, testContentsOfBlankTab
      setTimeout(function(){
         hub.raiseTab("blankTabDiv");
         testContentsOfBlankTab();
         }, 5000);
      });

} // testSendToBlankTab
//----------------------------------------------------------------------------------------------------
function testContentsOfBlankTab()
{
   QUnit.test('testContensOfBlankTab', function(assert) {
      assert.equal($("#blankTabOutputDiv").text(), 
                   '{"value":["TCGA.02.0114","TCGA.08.0344"],"count":2,"source":"patient history module"}');
      $("#testingOutputDiv").css({display: "block"});
      });

} // testContentsOfBlankTab
//----------------------------------------------------------------------------------------------------
// query the oncoscape server for user id.  the callback then makes a local (that is,
// Module-specific) decision to run this module's automated tests based upon that id
//
function runAutomatedTestsIfAppropriate()
{
   var msg = {cmd: "getUserId",  callback: "blankTabAssessUserIdForTesting",
              status: "request", payload: ""};

   hub.send(JSON.stringify(msg));

} // runAutomatedTestsIfAppropriate
//----------------------------------------------------------------------------------------------------
function assessUserIdForTesting(msg)
{
   var userID = msg.payload;
   console.log("blankTab/Module.js assesUserIdForTesting: " + userID)

   if(userID.indexOf("autoTest") === 0){
      console.log("blankTab/Module.js running tests for user " + userID)
      runTests();
      }

} // assessUserIdForTesting
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.addMessageHandler("sendSelectionTo_blankTab", handleSelections);
   hub.addMessageHandler("blankTabAssessUserIdForTesting", assessUserIdForTesting)
   hub.addSocketConnectedFunction(runAutomatedTestsIfAppropriate);

} // initializeModule
//----------------------------------------------------------------------------------------------------
return{
   init: initializeModule
   }; // BlankTabModule return value

//----------------------------------------------------------------------------------------------------
}); // BlankTabModule

blankTabModule = BlankTabModule();
blankTabModule.init();

