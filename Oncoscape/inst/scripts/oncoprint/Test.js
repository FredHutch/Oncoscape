//14:33
// oncoprint/Test.js
//------------------------------------------------------------------------------------------------------------------------
var oncoprintTestModule = (function () {

       // for observing relatively small scale status changes: i.e., network loaded and displayed
       // the div watched here is in widget.html

    var oncoprintStatusObserver = null;
    var testStatusObserver = null;   // modified at the end of each dataset test

    var minorStatusDiv = "#oncoprintStatusDiv";
    var majorStatusDiv = "#oncoprintTestStatusDiv";

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
     
      
   console.log("===================================== Test.oncoprint: runTests");
   console.log("Test.oncoprint: runTests: " + JSON.stringify(datasetNames));
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
            console.log('*****before testLoadDatasetOncoprint');
            console.log("*****dataSetNames is: ", datasetNames);
            console.log("*****datasetIndex is: ", datasetIndex);
            testLoadDatasetOncoprint(datasetNames[datasetIndex % datasetNames.length]);
       }else{
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
function testLoadDatasetOncoprint(dataSetName)
{
   var testTitle = "testLoadDatasetOncoprint";
   console.log(testTitle);
   console.log("*****testLoadDatasetOncoprint dataSetName is: ", dataSetName);
      // when our module receives the resulting 'datasetSpecified' msg, which includes the dataset's manifest
      // in its payload, it requests 
      //   - the oncoprint network: to be displayed by cyjs
      //   - sampleCategorizationNames, to populate the dropdown menu
      // when the network is loaded, the statusDiv is updated, which is detected here, and we
      // check to see that a reasonable number of nodes are contained in the loaded graph.
      // when those tests are over, we then cascade through a number of gui operations: search, node selections
      // network operations

   if(oncoprintStatusObserver === null){
      oncoprintStatusObserver = new MutationObserver(function(mutations) {
        hub.raiseTab("datasetsDiv");
        mutation = mutations[0];
        oncoprintStatusObserver.disconnect();
        oncoprintStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#oncoprintStatusDiv").text();
        QUnit.test("oncoprint loaded: " + dataSetName, function(assert) {
           //hub.raiseTab("datasetsDiv");
           console.log('*****before val');
           $("#datasetMenu").val(dataSetName);
           console.log('*****before trigger');
           $("#datasetMenu").trigger("change");
           console.log('*****before assetion');
           assert.equal($("#datasetMenu").val(), dataSetName);
           hub.raiseTab("oncoprintDiv");
           testOfStartingMessage(dataSetName);
           });
        }); // new MutationObserver
      } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   oncoprintStatusObserver.observe(target, config);

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dataSetName};

   console.log("about to send specifyCurrentDataset msg to server: " + dataSetName);
   hub.send(JSON.stringify(msg));

} // testLoadDataSetDisplayNetworkSendIDs
//------------------------------------------------------------------------------------------------------------------------
function testOfStartingMessage()
{
  console.log("*****testOfStartingMessage");  
  QUnit.test("oncoprint checking the starting message", function(assert) {
      assert.equal($("#oncoprintInstructions").is(":visible"),false);
      testSendGoodMsg();
      //markEndOfTestingDataSet();
   });  
}
//------------------------------------------------------------------------------------------------------------------------
function testSendGoodMsg()
{
  var testTitle = "testSendGoodMsg";
  console.log(testTitle);
  var sampleIDs = ["TCGA.06.0125", "TCGA.12.1088", "TCGA.02.0113", "TCGA.02.0114", "TCGA.08.0344"];
  var genes = ["EGFR", "ELAVL2"];
  var string = sampleIDs.concat(genes);
   
  if(oncoprintStatusObserver === null){
    oncoprintStatusObserver = new MutationObserver(function(mutations) {
      hub.raiseTab("datasetsDiv");
      mutation = mutations[0];
      oncoprintStatusObserver.disconnect();
      oncoprintStatusObserver = null;
      var id = mutation.target.id;
      var msg = $("#oncoprintStatusDiv").text();
      QUnit.test("oncoprint testSendGoodMsg: ", function(assert) {
          console.log("*****testSendGoodMsg");
          console.log("***** gene length: ", genes.length);
          assert.equal($(".oncoprint-label-area-ctr div span").length/3, genes.length);
          //markEndOfTestingDataSet();
          testSendBadMsg();
       });
    }); // new MutationObserver
  } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   oncoprintStatusObserver.observe(target, config);
   
   var payload = {value: string, count: string.length, source: "oncoprint/Test.js::testSendGoodMsg"};
   var msg = {cmd: "sendSelectionTo_Oncoprint", callback: "", status: "request", payload:  payload};

   console.log("about to send testSendGoodMsg msg to server: " + msg);
   hub.send(JSON.stringify(msg));
} // testSendGoodMsg
//------------------------------------------------------------------------------------------------------------------------
function testSendBadMsg()
{
  var testTitle = "testSendBadMsg";
  console.log(testTitle);
  var sampleIDs = ["TCGA.06.0125", "TCGA.12.1088", "TCGA.02.0113", "TCGA.02.0114", "TCGA.08.0344"];
  var string = sampleIDs;
   
  if(oncoprintStatusObserver === null){
    oncoprintStatusObserver = new MutationObserver(function(mutations) {
      hub.raiseTab("datasetsDiv");
      mutation = mutations[0];
      oncoprintStatusObserver.disconnect();
      oncoprintStatusObserver = null;
      var id = mutation.target.id;
      var msg = $("#oncoprintStatusDiv").text();
      QUnit.test("oncoprint testSendBadMsg: ", function(assert) {
          console.log("*****testSendBadMsg");
          assert.equal($("#onc").is(':empty'), true);
          testSendBigNumber();
      });
    }); // new MutationObserver
  } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   oncoprintStatusObserver.observe(target, config);
   
   var payload = {value: string, count: string.length, source: "oncoprint/Test.js::testtestSendBadMsg"};
   var msg = {cmd: "sendSelectionTo_Oncoprint", callback: "", status: "request", payload:  payload};

   console.log("about to send testSendBadMsg msg to server: " + msg);
   hub.send(JSON.stringify(msg));

} // testSendBadMsg
//------------------------------------------------------------------------------------------------------------------------
function testSendBigNumber()
{
  var testTitle = "testSendBigNumber";
  console.log(testTitle);
  var range = 351;
   
  if(oncoprintStatusObserver === null){
    oncoprintStatusObserver = new MutationObserver(function(mutations) {
      hub.raiseTab("datasetsDiv");
      mutation = mutations[0];
      oncoprintStatusObserver.disconnect();
      oncoprintStatusObserver = null;
      var id = mutation.target.id;
      var msg = $("#oncoprintStatusDiv").text();
      QUnit.test("oncoprint testSendBigNumber: ", function(assert) {
          console.log("*****testSendBigNumber");
          assert.equal($("#onc").is(':empty'), true);
          markEndOfTestingDataSet();
          //testSendRandomizedGoodMsg();
      });
    }); // new MutationObserver
  } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   oncoprintStatusObserver.observe(target, config);
   
   var payload = {value: range, count: range.length, source: "oncoprint/Test.js::testSendBigNumber"};
   var msg = {cmd: "sendSelectionTo_Oncoprint", callback: "", status: "request", payload:  payload};

   console.log("about to send testSendBigNumber msg to server: " + msg);
   hub.send(JSON.stringify(msg));

} // testSendBigNumber
//------------------------------------------------------------------------------------------------------------------------
function testSendRandomizedGoodMsg()
{
  var testTitle = "testSendRandomizedGoodMsg";
  console.log(testTitle);
  /*var sampleIDs = ["TCGA.06.0125", "TCGA.12.1088", "TCGA.02.0113", "TCGA.02.0114", "TCGA.08.0344"];
  var genes = ["EGFR", "ELAVL2"];
  var string = sampleIDs.concat(genes);*/
  var totalNodesLength = hub.getRandomInt(1,350);
  console.log("*****testSendRandomizedGoodMsg totalNodesLength is: ", totalNodesLength);

  
  if(oncoprintStatusObserver === null){
    oncoprintStatusObserver = new MutationObserver(function(mutations) {
      hub.raiseTab("datasetsDiv");
      mutation = mutations[0];
      oncoprintStatusObserver.disconnect();
      oncoprintStatusObserver = null;
      var id = mutation.target.id;
      var msg = $("#oncoprintStatusDiv").text();
      QUnit.test("oncoprint testSendRandomizedGoodMsg: ", function(assert) {
          console.log("*****testSendRandomizedGoodMsg");
          var genes = document.getElementById("oncoprintStatusDiv").innerHTML.string.split(',');
          assert.equal($(".oncoprint-label-area-ctr div span").length/3, genes.length);
          markEndOfTestingDataSet();
       });
    }); // new MutationObserver
  } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   oncoprintStatusObserver.observe(target, config);
   
   var payload = {value: totalNodesLength, count: totalNodesLength.length, source: "oncoprint/Test.js::testSendRandomizedGoodMsg"};
   var msg = {cmd: "sendSelectionTo_Oncoprint", callback: "", status: "request", payload:  payload};

   console.log("about to send testSendRandomizedGoodMsg msg to server: " + msg);
   hub.send(JSON.stringify(msg));
} // testSendRandomizedGoodMsg
//------------------------------------------------------------------------------------------------------------------------
function markEndOfTestingDataSet()
{
  console.log("end of testing dataset");
  $(majorStatusDiv).text("dataset complete");
  $("#testManagerLoopStatusDiv").text("Test.oncoprint, datasets complete");
  
} // markEndOfTestingDataSet
//------------------------------------------------------------------------------------------------------------------------
function initialize()
{
   console.log("--- initializing oncoprint/Test.js");

} // initialize
//------------------------------------------------------------------------------------------------------------------------
return{
   init: initialize,
   run: runTests
   }; // module return value

//------------------------------------------------------------------------------------------------------------------------
}); // oncoprintTestModule
oncoprintTester = oncoprintTestModule();
moduleTests.push(oncoprintTester);

