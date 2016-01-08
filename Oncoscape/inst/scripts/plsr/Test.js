// 15:15
// plsr/Test.js
//------------------------------------------------------------------------------------------------------------------------

var plsrTestModule = (function () {

       // for observing relatively small scale status changes: i.e., network loaded and displayed
       // the div watched here is in widget.html

    var plsrStatusObserver = null;
    var testStatusObserver = null;   // modified at the end of each dataset test

    var minorStatusDiv = "#plsrStatusDiv";
    var majorStatusDiv = "#plsrTestStatusDiv";

    

       // to detect when the full test of a dataset is complete, so that the next dataset can be tested
       // the div watched here is in test.html


//------------------------------------------------------------------------------------------------------------------------
function runTests(datasetNames, reps, exitOnCompletion)
{
     // run through <reps> repetitions of the test
     // condition the next test upon the completion of the preceeding one,
     // which is detected by a change to the majorStatusDiv
     // minorStatusDiv is used to gate successive tests applied -within-
     // a dataset
     
      
   console.log("===================================== Test.plsr: runTests");
   console.log("Test.plsr: runTests: " + JSON.stringify(datasetNames));
   console.log("reps: " + reps);
   console.log("exitOnCompletion: " + exitOnCompletion);
   
   
   var datasetIndex = -1;

   var config = {attributes: true, childList: true, characterData: true};
   var target =  document.querySelector(majorStatusDiv);

      // define a function to be called whenever the testStatusDiv changes,
      // which is our signal that the next test is ready to run.
      // the first test is kicked off when we -- after setting up and
      // configuring the observer -- manually (see below: "start testing")
      // change the target which the observer watches.
      // there may be a better way, but for now we delete and recreate
      // the observer at the end of each test.
      // note also that the next dataset is determined inside this function
      // and that the function refers to itself.

   var onMutation = function(mutations){
      mutation = mutations[0];
      testStatusObserver.disconnect();
      testStatusObserver = null;
      var id = mutation.target.id;
      var msg = $(majorStatusDiv).text();
      console.log("test status changed, text: " + msg);
      datasetIndex++;
      if(datasetIndex < (datasetNames.length * reps)){
         console.log("about to test dataset " + datasetNames[datasetIndex]);      
         testStatusObserver = new MutationObserver(onMutation);
         testStatusObserver.observe(target, config);
         if(datasetIndex < (datasetNames.length * reps))
            testLoadDatasetplsr(datasetNames[datasetIndex % datasetNames.length]);
         }
      else{
         console.log("mutation observer function detected end of datasets");
         if(exitOnCompletion){
            var payload = {errorCount: Object.keys(sessionStorage).length,
                           errors: JSON.stringify(sessionStorage)};
            var exitMsg = {cmd: "exitAfterTesting", callback: "", status: "request", payload: payload};
            console.log("about to send exitAfterTesting msg to server");
            hub.send(JSON.stringify(exitMsg));
            } // if exitOnCompletion
         } // else: datasets exhaused
      };

   testStatusObserver = new MutationObserver(onMutation);
   testStatusObserver.observe(target, config);

   $(majorStatusDiv).text("start testing");

} // runTests
//------------------------------------------------------------------------------------------------------------------------
function testLoadDatasetplsr(dataSetName)
{
   var testTitle = "testLoadDatasetplsr";
   console.log(testTitle);
  
   if(plsrStatusObserver === null){
      plsrStatusObserver = new MutationObserver(function(mutations) {
        //hub.raiseTab("plsrDiv");
        mutation = mutations[0];
        plsrStatusObserver.disconnect();
        plsrStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#plsrStatusDiv").text();
        QUnit.test('choose dataset for plsr: '+ dataSetName, function(assert) {
          hub.raiseTab("datasetsDiv");
          console.log("*****before change datasetname.");
          $("#datasetMenu").val(dataSetName);
          $("#datasetMenu").trigger("change");
          assert.equal($("#datasetMenu").val(), dataSetName);
          console.log("*****change dataSetName.");
          hub.raiseTab("plsrDiv");
          var genesetList = $("#plsrGeneSetSelector option").map(function(opt){return this.value;});
          console.log("***** genesetList: ", genesetList);
          //aseert.equals(document.getElementById("plsrInstructions").style.display, "block");
          //markEndOfTestingDataSet();
          testCalculate(genesetList);
        });
      }); // new MutationObserver
    } // if null mutation observer
    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   plsrStatusObserver.observe(target, config);

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dataSetName};
   console.log("about to send specifyCurrentDataset msg to server: " + dataSetName);
   hub.send(JSON.stringify(msg));

} // testLoadDataset
//----------------------------------------------------------------------------------------------------
function testCalculate(genesetList)
{
   hub.raiseTab("plsrDiv");
   console.log("starting testCalculate");
   var genesetLength = genesetList.length;
   console.log("******testCalculate - Current geneset length is:", genesetLength);
   genesetIndex = hub.getRandomInt(0, $("#plsrGeneSetSelector option").length - 1);
   geneset = genesetList[genesetIndex];     
   

   if(plsrStatusObserver === null){
      plsrStatusObserver = new MutationObserver(function(mutations) {
        //hub.raiseTab("plsrDiv");
        mutation = mutations[0];
        plsrStatusObserver.disconnect();
        plsrStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#plsrStatusDiv").text();
        // enable the calculate button, change its color, then click
        
        QUnit.test('testplsrCalculate', function(assert){
          //plsrMsg = plsr.ModuleMsg();
          //console.log("*****testCalculate plsrMsg.geneSet ",plsrMsg.geneSet);
          assert.equal($("#plsrCalculateButton").prop("disabled"), false);
          $("#plsrDisplay").show();
          assert.notEqual($("circle").length, 0, 'There are circles plotted.');
          assert.equal($("#plsrInstructions").css("display"), "none", "plsrInstructions div disappeared.");
          testContentsOfplsrPlot();
        });  
      }); // new MutationObserver
    } // if null mutation observer    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   plsrStatusObserver.observe(target, config);
   $("#plsrCalculateButton").click();
   console.log("***** clicked plsrCalculateButton.");
   /*
   var ageAtDxMinThreshold = Number($("#plsrAgeAtDxMinSliderReadout").val()) * 365.24;
   var ageAtDxMaxThreshold = Number($("#plsrAgeAtDxMaxSliderReadout").val()) * 365.24;
   var survivalMinThreshold = Number($("#plsrSurvivalMinSliderReadout").val()) * 365.24; 
   var survivalMaxThreshold = Number($("#plsrSurvivalMaxSliderReadout").val()) * 365.24;
   factor1 = {name: "AgeDx", 
             low: ageAtDxMinThreshold, 
             high: ageAtDxMaxThreshold};

   factor2 = {name: "Survival", 
             low: survivalMinThreshold,
             high: survivalMaxThreshold};
  
   var payload = {genes: geneset, source: "plsr/Test.js::testCalculate",
                  factorCount: 2, factors: [factor1, factor2]};
   msg = {cmd: "calculatePLSR", callback: "handlePlsrResults", status: "request", payload: payload};
   console.log("***** msg is: ", msg);

   hub.send(JSON.stringify(msg));*/

} // testCalculate
//----------------------------------------------------------------------------------------------------
function testContentsOfplsrPlot()
{
   console.log("--- testContentsOfplsrPlot");
   var plsrMsg = plsr.ModuleMsg();
    QUnit.test('testplsrContents', function(assert) { 
      assert.equal($("circle").length, plsrMsg.genes.length, "tested the number of circles");
      var circleIndex = hub.getRandomInt(0, plsrMsg.genes.length - 1);
      var cir_random = $("circle")[circleIndex];
      var xPos = Number(cir_random.getAttribute("cx"));
      var yPos =  Number(cir_random.getAttribute("cy"));
      var radius = Number(cir_random.getAttribute("r"));
      console.log("*****testContentsOfplsrPlot coordinates" + xPos + "  " + yPos + "  " + radius);
      // get score for this circle, maybe check tooltip name too
      assert.equal(xPos, plsrMsg.xScale(plsrMsg.genes[circleIndex][0]), "tested one circle's x coordinate");
      assert.equal(yPos, plsrMsg.yScale(plsrMsg.genes[circleIndex][1]), "tested one circle's y coordinate");
      assert.equal(radius, 3, "tested one circle's radius");
      markEndOfTestingDataSet(); 
      //testSendIDs(); 
   });

} // testContentsOfplsrPlot
//----------------------------------------------------------------------------------------------------
function testSendIDs() {
   console.log("entering Test.plsr:testSendGoodIDs");

   var title = "testSendIDs";
   console.log(title);
      // first test is to clear any existing selection, then send 10 node
      // ids (simple name strings) taken from the network itself.
      // these nodes are sent to the network using hub.send
      // we then check to see that these 10 nodes are selected in cyjs
   //var ids = plsrMsg.selectedIDs.splice(-1, 1);
   var ids;
   var maxNodes = 200;
   var plsrMsg = plsr.ModuleMsg();
   if(plsrMsg.geneNames.length <= maxNodes){
      ids = plsrMsg.geneNames.slice(0, plsrMsg.geneNames.length);
   }else{
      ids = plsrMsg.geneNames.slice(0, maxNodes);
   }
   //console.log("*****testSendIDs number of original global circles appeared: " + $("circle").length + "number of original global value stored: " + plsrMsg.selectedIDs.length);  
   //console.log("*****testSendIDs number of ids to be sent: " + ids.length);  
   if(plsrStatusObserver === null){
      plsrStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        plsrStatusObserver.disconnect();
        plsrStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test(title, function(assert) {

           length_highlighted = $("circle").attr("class","highlighted").length;
           console.log("-- in QUnit.test for testSendIDs " + length_highlighted + "  statusMsg: " + statusMsg);
           console.log("***** length_highlighted is: ", length_highlighted);
           console.log("***** length of the ids sent: ", ids.length);
           assert.equal(length_highlighted, ids.length);
           markEndOfTestingDataSet();
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   plsrStatusObserver.observe(target, config);

   console.log("testSendIDs, sending " + JSON.stringify(ids));
   var payload = {value: $.unique(ids), count: $.unique(ids).length, source: "plsr/Test.js::testSendIDs"};
   var msg = {cmd: "sendSelectionTo_PLSR (highlight)", callback: "", status: "request", payload:  payload};
   
   hub.send(JSON.stringify(msg));

} // testSendIDs
//------------------------------------------------------------------------------------------------------------------------
function markEndOfTestingDataSet()
{
  console.log("end of testing dataset");
  $(majorStatusDiv).text("dataset complete");
  $("#testManagerLoopStatusDiv").text("Test.plsr, datasets complete");
  
} // markEndOfTestingDataSet
//------------------------------------------------------------------------------------------------------------------------
function initialize()
{
   console.log("--- initializing plsr/Test.js");

} // initialize
//------------------------------------------------------------------------------------------------------------------------
return{
   init: initialize,
   run: runTests
   }; // module return value

//------------------------------------------------------------------------------------------------------------------------
}); // plsrTestModule
plsrTester = plsrTestModule();
moduleTests.push(plsrTester);

