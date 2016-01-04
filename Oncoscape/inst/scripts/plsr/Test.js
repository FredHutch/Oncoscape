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
          markEndOfTestingDataSet();
          //testCalculate(genesetList);
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
          plsrMsg = plsr.ModuleMsg();
          console.log("*****testCalculate plsrMsg.geneSet ",plsrMsg.geneSet);
          console.log("*****testCalculate geneset: ",geneset);
          assert.equal(plsrMsg.geneSet, geneset);
          $("#plsrCalculateButton").prop("disabled", false);
          $("#plsrCalculateButton").css({"background-color": "red", "color": "green"});
          assert.equal($("#plsrCalculateButton").css('color'), "rgb(0, 128, 0)");
          //$("#plsrGeneSetSelector").val(geneset);
          //$("#plsrGeneSetSelector").trigger("change");
          // check if the "Calculate" is clicked
          $("#plsrDisplay").show();
          markEndOfTestingDataSet(); 
          //testContentsOfplsrPlot();
        });  
      }); // new MutationObserver
    } // if null mutation observer    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   plsrStatusObserver.observe(target, config);
   
   
   var payload = {genes: geneset, source: "plsr/Test.js::testCalculate"};
   msg = {cmd: "calculateplsr", callback: "plsrPlot", status: "request", payload: payload};
   hub.send(JSON.stringify(msg));

} // testCalculate
//----------------------------------------------------------------------------------------------------
function testContentsOfplsrPlot()
{
   console.log("--- testContentsOfplsrPlot");
   var plsrMsg = plsr.ModuleMsg();
    QUnit.test('testplsrContents', function(assert) { 
      assert.equal($("circle").length, plsrMsg.selectedIDs.length);
      var circleIndex = hub.getRandomInt(0, plsrMsg.selectedIDs.length - 1);
      var cir_random = $("circle")[circleIndex];
      var xPos = Number(cir_random.getAttribute("cx"));
      var yPos =  Number(cir_random.getAttribute("cy"));
      var radius = Number(cir_random.getAttribute("r"));
      console.log("*****testContentsOfplsrPlot coordinates" + xPos + "  " + yPos + "  " + radius);
      // get score for this circle, maybe check tooltip name too
      assert.equal(xPos, plsrMsg.xScale(plsrMsg.plsrScores[circleIndex][0]));
      assert.equal(yPos, plsrMsg.yScale(plsrMsg.plsrScores[circleIndex][1]));
      assert.equal(radius, 3);
      testSendIDs(); 
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
   if(plsrMsg.selectedIDs.length <= maxNodes){
      ids = plsrMsg.selectedIDs.slice(0, plsrMsg.selectedIDs.length);
   }else{
      ids = plsrMsg.selectedIDs.slice(0, maxNodes);
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
           plsrMsg = plsr.ModuleMsg();
           console.log("-- in QUnit.test for testSendIDs " + ids.length + "  statusMsg: " + statusMsg);
           //TCGAgbm is using mtx.mrna.ueArray, sampleID duplicates: "TCGA.06.0145.01.1" "TCGA.06.0145.01.2" "TCGA.06.0145.01.3"
                          //"TCGA.06.0137.01.1" "TCGA.06.0137.01.2" "TCGA.06.0145.01.4"
                          //"TCGA.06.0137.01.3" "TCGA.06.0145.01.5" "TCGA.06.0138.01.1"
                          //"TCGA.06.0156.01.1" "TCGA.06.0148.01.1" "TCGA.06.0148.01.2"
                          //"TCGA.06.0211.01.1" "TCGA.06.0148.01.3" "TCGA.06.0176.01.1"
                          //"TCGA.06.0154.01.1" "TCGA.06.0156.01.2" "TCGA.06.0208.01.1"
                          //"TCGA.06.0216.01.1"
           //DEMOdz: mtx.mrna.bc, sampleID duplicates: "TCGA.06.0747" "TCGA.06.0749"
           //TCGAbrain: mtx.mrna.bc, no sampleID duplicates
           //All sample IDs will be returned, so there might be duplicate points drawn representing samples for a given patient.
           assert.ok($("circle").length >= ids.length);
           //console.log("*****all ids sent length:", ids.length);
           //console.log("*****all ids received length:", plsrMsg.selectedIDs.length);
           //console.log("*****unique ids sent length:", $.unique(ids).length);
           //console.log("*****unique ids received length:", $.unique(plsrMsg.selectedIDs).length);
           assert.equal($.unique(ids).length, $.unique(plsrMsg.selectedIDs).length);
           testSendIDstoHighlight();
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   plsrStatusObserver.observe(target, config);

   console.log("testSendIDs, sending " + JSON.stringify(ids));
   var payload = {value: $.unique(ids), count: $.unique(ids).length, source: "plsr/Test.js::testSendIDs"};
   var msg = {cmd: "sendSelectionTo_plsr", callback: "", status: "request", payload:  payload};
   
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

