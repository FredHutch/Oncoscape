// 18:24
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
   var plsrMsg = plsr.ModuleMsg();

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
          plsrMsg = plsr.ModuleMsg();
          assert.equal($("#plsrCalculateButton").prop("disabled"), false);
          $("#plsrDisplay").show();
          assert.notEqual($("circle").length, 0, "There are circles plotted.");
          var ageAtDxMin = Math.floor(plsrMsg.ageAtDxMin/365.24);
          var ageAtDxMax = Math.floor(plsrMsg.ageAtDxMax/365.24);
          var survivalMin = Math.floor(plsrMsg.survivalMin/365.24);
          var survivalMax = Math.floor(plsrMsg.survivalMax/365.24);
          var ageAtDxSpan = ageAtDxMax - ageAtDxMin;
          var survivalSpan = survivalMax - survivalMin;

          var ageAtDxMinThreshold = Math.floor(ageAtDxMin + (ageAtDxSpan/3));
          var ageAtDxMaxThreshold = Math.floor(1 + ageAtDxMax - (ageAtDxSpan/3));
          var survivalMinThreshold = Math.floor(survivalMin + (survivalSpan/3));
          var survivalMaxThreshold = Math.floor(1 + survivalMax - (survivalSpan/3));
          assert.equal(ageAtDxMinThreshold, $("#plsrAgeAtDxMinSliderReadout").val(), "age slider minimum readout checked.");
          assert.equal(ageAtDxMaxThreshold, $("#plsrAgeAtDxMaxSliderReadout").val(), "age slider maximum readout checked.");
          assert.equal(survivalMinThreshold, $("#plsrSurvivalMinSliderReadout").val(), "survival slider minimum readout checked.");
          assert.equal(survivalMaxThreshold, $("#plsrSurvivalMaxSliderReadout").val(), "survial slider maximum readout checked.");
          assert.equal($("#plsrInstructions").css("display"), "none", "plsrInstructions div disappeared.");
          testContentsOfplsrPlot();
        });  
      }); // new MutationObserver
    } // if null mutation observer    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   plsrStatusObserver.observe(target, config);
   $("#plsrCalculateButton").click();
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

      var vectors = $(".line");
      assert.equal(vectors.length, 4, "There should be 4 vectors.");
      for(var i=0; i < 4; i++){
         var x1 = Number($(".line")[i].getAttribute("x1"));
         var x2 = Number($(".line")[i].getAttribute("x2"));
         var y1 = Number($(".line")[i].getAttribute("y1"));
         var y2 = Number($(".line")[i].getAttribute("y2"));
         var axisLength = Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
         console.log("extent for axis " + i + ": " + vectors);
         assert.ok(axisLength > 10);
       }  
      testSendIDs();
   });

} // testContentsOfplsrPlot
//----------------------------------------------------------------------------------------------------
function testSliderUpdates(plsrMsg) {
   console.log("entering Test.plsr:testSliderUpdates");
   
   var plsrMsg_update = plsr.ModuleMsg();

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
          plsrMsg = plsr.ModuleMsg();
          assert.notEqual(plsrMsg_update.vector, plsrMsg.vector, "the plsr vectors are updated.");
          $("#plsrDisplay").show();
          testSendIDs();
        });  
      }); // new MutationObserver
    } // if null mutation observer    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   plsrStatusObserver.observe(target, config);
   //$("#plsrAgeAtDxMinSliderReadout").val(Number($("#plsrAgeAtDxMinSliderReadout").val())-1);
   //$("#plsrAgeAtDxMaxSliderReadout").val(Number($("#plsrAgeAtDxMaxSliderReadout").val())+1);
   //$("#plsrSurvivalMinSliderReadout").val(Number($("#plsrSurvivalMinSliderReadout").val())-1);
   //$("#plsrSurvivalMaxSliderReadout").val(Number($("#plsrSurvivalMaxSliderReadout").val())+1);
   $("#plsrCalculateButton").click();
} // testSliderUpdates
//------------------------------------------------------------------------------------------------------------------------
function testSendIDs() {
   console.log("entering Test.plsr:testSendIDstoHighlight");

   var title = "testSendIDs";
   console.log(title);
      // first test is to clear any existing selection, then send 10 node
      // ids (simple name strings) taken from the network itself.
      // these nodes are sent to the network using hub.send
      // we then check to see that these 10 nodes are selected in cyjs
   //var ids = plsrMsg.selectedIDs.splice(-1, 1);
   var ids;
   var maxNodes = 10;
   var plsrMsg = plsr.ModuleMsg();
   //if(plsrMsg.geneNames.length <= maxNodes){
   //   ids = plsrMsg.geneNames.slice(0, plsrMsg.geneNames.length);
   //}else{
      ids = plsrMsg.geneNames.slice(0, maxNodes);
      console.log("***** ids sent: ", ids);
   //}
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
           //length_highlighted = $("circle").attr("class","highlighted").length;
           length_highlighted = d3.selectAll(".highlighted")[0].length;
           console.log("-- in QUnit.test for testSendIDs " + length_highlighted + "  statusMsg: " + statusMsg);
           console.log("***** length_highlighted is: ", length_highlighted);
           console.log("***** length of the ids sent: ", ids.length);
           assert.equal(length_highlighted, ids.length, "highlighted length equals the length of IDs");
           assert.equal(d3.selectAll(".highlighted").attr("r"), 20, "highlighted radius is 20.");
           assert.equal(d3.selectAll(".highlighted").attr("style"), "fill: rgb(255, 0, 0);", "highlighted style is confirmed.");
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
