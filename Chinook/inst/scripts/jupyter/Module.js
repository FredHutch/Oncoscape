//----------------------------------------------------------------------------------------------------
var JupyterModule = (function () {

  var jupyterDiv;
  var controlsDiv;
  var outputDiv;

  var testButton;

  var sendSelectionsMenu;

  var thisModulesName = "jupyter";
  var thisModulesOutermostDiv = "jupyterDiv";

  var sendSelectionsMenuTitle = "Send selection...";

      // sometimes a module offers multiple selection destinations
      // but usually just the one entry point
  var selectionDestinations = [thisModulesName];
      // make sure to register, eg,
      // hub.addMessageHandler("sendSelectionTo_jupyter", handleSelections);

//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  jupyterDiv = $("#jupyterDiv");
  controlsDiv = $("#jupyterControlsDiv");
  outputDiv = $("#jupyterOutputDiv");

  sendSelectionsMenu = hub.configureSendSelectionMenu("#jupyterSendSelectionsMenu", 
                                                      selectionDestinations, 
                                                      sendSelections,
                                                      sendSelectionsMenuTitle);

  handleWindowResize();

} // initializeUI
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  jupyterDiv.width($(window).width() * 0.95);
  jupyterDiv.height($(window).height() * 0.90);  // leave room for tabs above

  controlsDiv.width(jupyterDiv.width()); //  * 0.95);
  controlsDiv.height("100px");

  outputDiv.width(jupyterDiv.width()); //  * 0.95);
  outputDiv.height(jupyterDiv.height() - 130);

} // handleWindowResize
//--------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();

  var cmd = "sendSelectionTo_" + destination;
  var dummySelections = ["dummy selection 1", "dummy selection 2"];

  payload = {value: dummySelections, count: dummySelections.length, 
             source: thisModulesName};

  var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

      // restore default (informational) title of the menu
   sendSelectionsMenu.val(sendSelectionsMenuTitle);

  hub.send(JSON.stringify(newMsg));

} // sendSelections
//--------------------------------------------------------------------------------------------
function handleSelections(msg)
{
   hub.raiseTab(thisModulesOutermostDiv);
   var msgAsString = JSON.stringify(msg.payload);
   
   outputDiv.html("<pre>" + msgAsString + "</pre");


} // handleSelections
//----------------------------------------------------------------------------------------------------
loadJupyter = function()
{
   console.log("=== loadJupyter");
   var jupyterIframe = $("#jupyterIframe");
   var url = "http://localhost:8888/notebooks/Untitled.ipynb?kernel_name=ir#";
   jupyterIframe.get(0).contentWindow.location.href = url;

}; // loadJupyter
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.addMessageHandler("sendSelectionTo_jupyter", handleSelections);
   hub.addSocketConnectedFunction(runAutomatedTestsIfAppropriate);

} // initializeModule
//----------------------------------------------------------------------------------------------------
return{
   init: initializeModule
   }; // JupyterModule return value

//----------------------------------------------------------------------------------------------------
}); // JupyterModule

jupyterModule = JupyterModule();
jupyterModule.init();

