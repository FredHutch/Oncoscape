//----------------------------------------------------------------------------------------------------
var TestsModule = (function () {

  var testsDiv;
  var outputDiv;

  var thisModulesName = "tests";
  var thisModulesOutermostDiv = "testsDiv";

  var test1Button;

//--------------------------------------------------------------------------------------------
function initializeUI()
{
  console.log("=== Module.tests, initializeUID");

  $(window).resize(handleWindowResize);

  testsDiv = $("#testsDiv");
  outputDiv = $("#testsOutputDiv");

  test1Button = $("#testsButton01");
  test1Button.button();
  test1Button.click(testChooseDataSetSelectLongSurvivorsPlotKaplanMeier);

  handleWindowResize();

}; // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  console.log("=== tests handleWindowResize")

  testsDiv.width($(window).width() * 0.95);
  testsDiv.height($(window).height() * 0.90);  // leave room for tabs above

  //controlsDiv.width($(window).width() * 0.90);
  //controlsDiv.width(testsDiv.width()); //  * 0.95);
  //controlsDiv.height("100px")

  outputDiv.width(testsDiv.width()); //  * 0.95);
  outputDiv.height(testsDiv.height() * 0.90);

}; // handleWindowResize
//--------------------------------------------------------------------------------------------
function runDataSetTest(event)
{
   console.log("runDataSetTEst for " + this.id);
   var datasetName = this.id.replace("TestButton", "");

      // load data set, check manifest, click "Use Dataset", call each currently-loaded tab's 
      // test method
   var currentModules = hub.getModules();
   var moduleNames = Object.keys(currentModules);
   for(var i=0; i < moduleNames.length; i++){
     var name = moduleNames[i];
     var module = currentModules[name];
     console.log("about to call test function on module '" + name + "'");
     module.test(datasetName);
     }

} // runDataSetTest
//----------------------------------------------------------------------------------------------------
function setupTestButtons(msg)
{
   console.log("--- Module.test handleDataSetNames");
   console.log(msg);
   var dataSetNames = msg.payload;
   if(typeof(dataSetNames) == "string")
     dataSetNames = [dataSetNames];
   var list = $("#testTabButtonList");
   for(var i=0; i < dataSetNames.length; i++){
     var name = dataSetNames[i];
     var buttonID = name + "TestButton";
     var html = "<li> <button id='" +
                buttonID +
                "' class='oncoTestButton'>" +
                name + " tests" +
                "</button>";
     console.log("html: " + html);
     list.append(html);
     $("#" + buttonID).button();
     $("#" + buttonID).click(runDataSetTest);
     } // for i

} // handleDataSetNames
//----------------------------------------------------------------------------------------------------
function testChooseDataSetSelectLongSurvivorsPlotKaplanMeier()
{
   QUnit.test('raise datasets tab', function(assert) {
      console.log("============= starting raise datasets tab test");
      hub.raiseTab("datasetsDiv");
       var done1 = assert.async();
       var done2 = assert.async();
       var done3 = assert.async();
       assert.expect(3);
       setTimeout(function() {
         var elementName, expected, actual;
         elementName = "#datasetsDiv";
         expected = "block";
         actual = $(elementName).css("display");
         assert.equal(actual, expected, elementName + " display should be " + expected);
         done1();

         elementName = "#patientHistoryDiv";
         expected = "none";
         actual = $(elementName).css("display");
         assert.equal(actual, expected, elementName + " display should be " + expected);
         done2();
   
         elementName = "#oncoscapeTestsDiv";
         expected = "none";
         actual = $(elementName).css("display");
         assert.equal(actual, expected, elementName + " display should be " + expected);
         done3();
         }, 1000);
       });

   QUnit.test('choose DEMOdz dataset', function(assert) {
      var desiredDataset = "DEMOdz";

      console.log("============= starting choose DEMOdz dataset test");

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
         assert.equal($("#datasetsManifestTable tr").length, 8); done2();
         assert.equal($("#datasetsManifestTable tbody tr").eq(0).find("td").eq(0).text(), 
                      "mRNA expression"); done3();
         testLoadPatientHistoryTable();
         }, 5000);
      });

}; // testChooseDataSetSelectLongSurvivorsPlotKaplanMeier
//--------------------------------------------------------------------------------------------
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
      $("#survivalMinSliderReadout").text("3000");
      tbl.draw()
      hub.raiseTab("patientHistoryDiv");
      assert.expect(1);
      var done1 = assert.async()
      setTimeout(function(){
         assert.equal($("#patientHistoryTable tbody tr").length, 2);
         done1();
         testKaplanMeierCurve();
         }, 5000);
      });

} // testSelectLongSurvivors
//----------------------------------------------------------------------------------------------------
function testKaplanMeierCurve()
{
   QUnit.test('testKaplanMeierCurve', function(assert) {
      $("#patientHistorySendSelectionsMenu").val("survival");
      $("#patientHistorySendSelectionsMenu").trigger("change");
      assert.expect(1);
      var done1 = assert.async()
      setTimeout(function(){
         assert.ok($("#survivalImageArea").prop("src").length > 0);
         done1();
         hub.raiseTab("oncoscapeTestsDiv");
         }, 5000);
      });

} // testKaplanMeierCurve
//----------------------------------------------------------------------------------------------------
return{
   init: function(){
      hub.addOnDocumentReadyFunction(initializeUI);
      hub.addMessageHandler("handleDataSetNames", setupTestButtons);
      }
   } // TestsModule return value

//----------------------------------------------------------------------------------------------------
}) // TestsModule

testsModule = TestsModule();
testsModule.init();
