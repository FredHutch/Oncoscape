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
            testLoadDataSetDisplayNetworkSendIDs(datasetNames[datasetIndex % datasetNames.length]);
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
function testLoadDataSetDisplayNetworkSendIDs(dataSetName)
{
   var testTitle = "testLoadDataSetDisplayNetworkSendIDs";
   console.log(testTitle);

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
        hub.raiseTab("oncoprintDiv");
        mutation = mutations[0];
        oncoprintStatusObserver.disconnect();
        oncoprintStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#oncoprintStatusDiv").text();
        QUnit.test("oncoprint loaded: " + dataSetName, function(assert) {
           console.log("oncoprint loaded, with " + nodeCount + " nodes and " + edgeCount + " edges.");
           //assert.ok(nodeCount > 10, dataSetName + " nodeCount > 10");
           //assert.ok(edgeCount > 10, dataSetName + " edgeCount > 10");
           markEndOfTestingDataSet();
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

