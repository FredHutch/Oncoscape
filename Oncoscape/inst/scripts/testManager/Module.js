// testManager/Module.js
//----------------------------------------------------------------------------------------------------
var moduleTests = [];
//----------------------------------------------------------------------------------------------------
var TestManagerModule = (function () {

   var mdoules = {};

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
   
   console.log("testManager/Module.js assessUserIdForTesting: " + userID);
   
   if(userID.indexOf("autotest") === 0){
      console.log("testManager/Module.js running tests for user " + userID);
      //var datasetNames = $("#datasetMenu").children().map(function() {return $(this).val();}).get();
         // delete any empty strings
      //datasetNames = datasetNames.filter(function(e) {return (e.length > 0);});
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

      moduleTests[0].run(datasetNames, reps, exitOnCompletion);
      console.log("back from <module>Tester.run()");
      }

} // assessUserIdForTesting
//----------------------------------------------------------------------------------------------------
function runTests(datasetNames, reps, exitOnCompletion)
{
   console.log("runTests: " + JSON.stringify(datasetNames));
   console.log("reps: " + reps);
   console.log("exitOnCompletion: " + exitOnCompletion);

} // runTests
//----------------------------------------------------------------------------------------------------

  return({
     init: initializeModule,
     run: runTests
     });

});  // TestManagerMdoule
//----------------------------------------------------------------------------------------------------
testManager = TestManagerModule();
testManager.init();