//----------------------------------------------------------------------------------------------------
// observers used in QUnit testing

var plsrStatusObserver = null;


var PlsrTestModule = (function () {


//--------------------------------------------------------------------------------------------
runTests = function()
{
   console.log("starting PlsrTestModule runTests");
   showTests();

   testLoadDataSetAndConfigure();

}; // runTests
//--------------------------------------------------------------------------------------------
function testLoadDataSetAndConfigure()
{
   var testTitle = "testLoadDataSetConfigure";
   console.log(testTitle);
     
      // when our module receives the resulting 'datasetSpecified' msg, which includes the dataset's manifest
      // in its payload, it requests
      // ... 

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
oldRrunOneTest = function()
{
     // check for presence of all the expected tabs
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
       var done7 = assert.async();

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
          var axisLines = $(".line");
          assert.equal(axisLines.length, 4); done7();
          for(var i=0; i < 4; i++){
             var x1 = Number($(".line")[i].getAttribute("x1"));
             var x2 = Number($(".line")[i].getAttribute("x2"));
             var y1 = Number($(".line")[i].getAttribute("y1"));
             var y2 = Number($(".line")[i].getAttribute("y2"));
             var extent = Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
             console.log("extent: " + extent);
             assert.ok(extent > 10);
             } // for i
          }, 5000);
      });

} // testRunPLSR
//----------------------------------------------------------------------------------------------------
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

