// datasets/Test.js
//------------------------------------------------------------------------------------------------------------------------
var DatasetsTestModule = (function () {

       // for observing relatively small scale status changes: i.e., network loaded and displayed
       // the div watched here is in widget.html

    var datasetsMinorStatusObserver = null;
    var datasetsMajorStatusObserver = null;   // modified at the end of each dataset test

    var minorStatusDiv = "#datasetsMinorStatusDiv";
    var majorStatusDiv = "#datasetsMajorStatusDiv";

       // to detect when the full test of a dataset is complete, so that the next dataset can be tested
       // the div watched here is in test.html

//------------------------------------------------------------------------------------------------------------------------
function runTests(datasetNames, reps, exitOnCompletion)
{
   console.log("===================================== Test.datasets: runTests");
   console.log("--- first make sure dataset menu is loaded");

      // the "Available Datasets" menu must be loaded before we start.
      // this happens automatically, but may NOT have happened by the
      // time this function executes.
      // therefore define a mutation observer, and use it (see below) only if
      // the menu is not loaded.

      // once the menu is loaded, iterate over the datasets, making sure
      // that any dataset menu change results in the display of
      // data table with the manifest of that dataset

   if(datasetsMinorStatusObserver === null){
      datasetsMinorStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        datasetsMinorStatusObserver.disconnect();
        datasetsMinorStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test("testDataSetMenuLoaded", function(assert) {
           var allNames = $("#datasetMenu").children().map(function() {return $(this).val();}).get();
           allNames.filter(function(e) {return (e.length > 0);});
           assert.ok(allNames.length >= 1);
           iterateOverDatasets(datasetNames, reps, exitOnCompletion);
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);

   var allNames = $("#datasetMenu").children().map(function() {return $(this).val();}).get();
     // filtering  deferred.  unlike R, js returns a scalar rather than a 1-element array.
     // this could be accomodated by checking type, but not just yet... (pshannon, 27oct15)
     // allNames.filter(function(e) {return (e.length > 0);});
     //console.log("found these names in the available datasets menu: " + JSON.stringify(allNames));
   
   if(allNames.length > 1){   // expect an empty (blank) first menu line
      console.log("found menu already loaded, preceeding to iterate");
      iterateOverDatasets(datasetNames, reps, exitOnCompletion);
      }
   else{
      console.log("no names in menu, watching target");
        // the target is mutated at the conclusion of Module.datasets:handleDatSetName
      datasetsMinorStatusObserver.observe(target, config);
      }

} // runTests
//------------------------------------------------------------------------------------------------------------------------
function iterateOverDatasets(datasetNames, reps, exitOnCompletion)
{
     // run through the specified number repetitions of the test, operating upon
     // each dataset in turn.
     // condition the next test upon the completion of the preceeding one,
     // which is detected by a change to the majorStatusDiv
     // (recall that the minorStatusDiv is modified by Module.js whenever a crucial
     // UI change has occurred, whereas majorStatusDiv is only user here, in
     // the Test module, to iterate over the datasets, ensuring that tests on
     // each one are complete before starting the next one.
      
   console.log("runTests: " + JSON.stringify(datasetNames));
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
      console.log("---- testing datasetIndex " + datasetIndex);
      if(datasetIndex < (datasetNames.length * reps)){
         console.log("about to test dataset " + datasetNames[datasetIndex]);      
	 testStatusObserver = new MutationObserver(onMutation);
         testStatusObserver.observe(target, config);
         if(datasetIndex < (datasetNames.length * reps)){
	    var datasetName = datasetNames[datasetIndex % datasetNames.length];
            testDisplayManifest(datasetName);
	    } // if not done yet
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

} // iterateOverDatasets
//------------------------------------------------------------------------------------------------------------------------
function testDisplayManifest(datasetName)
{
   console.log("testDisplayManifest: " + datasetName);

   if(datasetsMinorStatusObserver === null){
      datasetsMinorStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        datasetsMinorStatusObserver.disconnect();
        datasetsMinorStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test("testDisplayManifest: " + datasetName, function(assert) {
           var rowCount = $("#datasetsManifestTable tbody tr").length;
           assert.ok(rowCount > 5);
           markEndOfTestingDataSet();
           });
        }); // new MutationObserver
      } // if null mutation observer


   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   datasetsMinorStatusObserver.observe(target, config);

   var allNames = $("#datasetMenu").children().map(function() {return $(this).val();}).get();
   allNames.filter(function(e) {return (e.length > 0);});
   console.log("loaded datasetnames: " + JSON.stringify(allNames));
   console.log(" testDisplayManifest about to set datasetname in menu: " + datasetName);
   $("#datasetMenu").val(datasetName);
   console.log(" testDisplayManifest about to trigger change");
   $("#datasetMenu").trigger("change");

} // testDisplayManifest
//------------------------------------------------------------------------------------------------------------------------
function markEndOfTestingDataSet()
{
  console.log("end of testing dataset");
  $(majorStatusDiv).text("dataset complete");
  $("#testManagerLoopStatusDiv").text("Test.datasets,  dataset complete");
  
} // markEndOfTestingDataSet
//------------------------------------------------------------------------------------------------------------------------
function initialize()
{
   console.log("--- initializing datasets/Test.js");

} // initialize
//------------------------------------------------------------------------------------------------------------------------
return{
   init: initialize,
   run: runTests,
   }; // module return value

//------------------------------------------------------------------------------------------------------------------------
}); // DatasetsTestModule

console.log("creaing datasetsTester");
datasetsTester = DatasetsTestModule();
console.log("pushing datasetsTester");
moduleTests.push(datasetsTester);

