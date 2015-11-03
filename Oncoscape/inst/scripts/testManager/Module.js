// testManager/Module.js
//----------------------------------------------------------------------------------------------------
var moduleTests = [];
//----------------------------------------------------------------------------------------------------
var TestManagerModule = (function () {

   var loopStatusObserver = null;

   var loopStatusDiv = "#testManagerLoopStatusDiv";

//----------------------------------------------------------------------------------------------------
function initializeModule()
{
  console.log("--- entering Module.testManager.initializeModule");
  
  hub.addMessageHandler("testManagerAssessUserIdForTesting", assessUserIdForTesting);

  if(hub.socketConnected())
     runAutomatedTestsIfAppropriate();
  else
     hub.addSocketConnectedFunction(runAutomatedTestsIfAppropriate);
    
} // initializeModule
//----------------------------------------------------------------------------------------------------
// query the oncoscape server for user id.  the callback then makes a local (that is,
// Module-specific) decision to run this module's automated tests based upon that id
function runAutomatedTestsIfAppropriate()
{
   var msg = {cmd: "getUserInfo",  callback: "testManagerAssessUserIdForTesting", status: "request", payload: ""};
   hub.send(JSON.stringify(msg));

} // runAutomatedTestsIfAppropriate
//----------------------------------------------------------------------------------------------------
function assessUserIdForTesting(msg)
{
   console.log("---- Module.testManager, payload: ");
   console.log(JSON.stringify(msg.payload));
   
   var userID = msg.payload.userID;
   userID = userID.toLowerCase();

   var datasetNames = msg.payload.datasets;
   if(typeof(datasetNames) === "string")
      datasetNames = [datasetNames];

     // currently restricted to just one module:
     // mutation observer pacing not yet worked out with multiple modules tested successively
     
   console.log("testManager/Module.js assessUserIdForTesting: " + userID);
   if(userID.indexOf("autotest") === 0){
      console.log("testManager/Module.js running tests for user " + userID);
      var start = userID.indexOf(".");
      var end = userID.indexOf("@");
      var reps = 1;
      if(start > 0 && end > 0)
        reps = parseInt(userID.slice(start+1, end));
      var exitOnCompletion = false;
      if(userID.indexOf("exitoncompletion") > 0)
          exitOnCompletion = true;

      console.log("runTests: " + JSON.stringify(datasetNames));
      console.log("reps: " + reps);
      console.log("exitOnCompletion: " + exitOnCompletion);
      //runTests(datasetNames, reps, exitOnCompletion);

        // the individual modules should not exitOnCompletion
      var modulesExitOnCompletion = false;
      for(var i=0; i < moduleTests.length; i++){
         console.log("about to run <module>Tester.run(), loop " + i);
         moduleTests[0].run(datasetNames, reps, exitOnCompletion);
         } // var i
       
      //if(exitOnCompletion){
      //   var payload = {errorCount: Object.keys(sessionStorage).length,
      //                  errors: JSON.stringify(sessionStorage)};
      //   var exitMsg = {cmd: "exitAfterTesting", callback: "", status: "request", payload: payload};
      //   console.log("about to send exitAfterTesting msg to server");
      //   hub.send(JSON.stringify(exitMsg));
      //   } // if exitOnCompletion
      } // if userID == autotest

} // assessUserIdForTesting
//----------------------------------------------------------------------------------------------------
function runTests(datasetNames, reps, exitOnCompletion)
{

   var config = {attributes: true, childList: true, characterData: true};
   var target =  document.querySelector(loopStatusDiv);

   var testIndex = -1;

   var onMutation = function(mutations){
      mutation = mutations[0];
      loopStatusObserver.disconnect();
      loopStatusObserver = null;
      var id = mutation.target.id;
      var msg = $(loopStatusDiv).text();
      console.log("test status changed, text: " + msg);
      testIndex++;
      if(testIndex < moduleTests.length){
         console.log("about to test module " + testIndex);
	 loopStatusObserver = new MutationObserver(onMutation);
         loopStatusObserver.observe(target, config);
         var moduleExitOnCompletion = false;
         moduleTests[testIndex].run(datasetNames, reps, moduleExitOnCompletion);
	 }
      else{
         console.log("mutation observer function detected end of moduleTests array");
         if(exitOnCompletion){
            var payload = {errorCount: Object.keys(sessionStorage).length,
	                   errors: JSON.stringify(sessionStorage)};
            var exitMsg = {cmd: "exitAfterTesting", callback: "", status: "request", payload: payload};
            console.log("about to send exitAfterTesting msg to server");
            hub.send(JSON.stringify(exitMsg));
	    } // if exitOnCompletion
	 } // else: datasets exhaused
      }; // onMutation function

   loopStatusObserver = new MutationObserver(onMutation);
   loopStatusObserver.observe(target, config);

   $(loopStatusDiv).text("start testing");   // mutate the target

} // runTests
//----------------------------------------------------------------------------------------------------

  return({
     init: initializeModule,
     run: runTests
     });

});  // TestManagerMdoule
//----------------------------------------------------------------------------------------------------
testManager = TestManagerModule();
hub.addOnDocumentReadyFunction(testManager.init);