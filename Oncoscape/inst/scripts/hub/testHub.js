// testHub.js: test all the public functions in the module
//----------------------------------------------------------------------------------------------------
//----------------------------------------------------------------------------------------------------
// These javascript functions and variables are arranged into a simple module so that
// implementation details are kept private from the public API other oncoscape 
// browser modules will use.  common services and utility functions are provided here
//----------------------------------------------------------------------------------------------------
var HubModule = (function () {

  var name = "HubModule";
     // keys are module names, their outermost divs are the values.
     // providing these outermost divs allows was inspired by 
     // the need to allow raising of tabs by the sending tab.
     // TODO: not sure that's still needed

  var selectionDestinations = {};
  var dispatchOptions = {};
  var socketIsConnected = false;
  var socketConnectedFunctions = [];
  var onDocumentReadyFunctions = [];

  var socketURI = window.location.href.replace("http://", "ws://");

  var socket;

//----------------------------------------------------------------------------------------------------
// TODO: add 3rd argument: acceptsIncomingMessages
//       datasets, for instance, seems to have no need for incoming json/websocket messages
function registerSelectionDestination(names, outermostDivID)
{
  if(typeof(names) == "string")
    names = [names];

  for(var i=0; i < names.length; i++)
     selectionDestinations[names[i]] = outermostDivID;

} // registerSelectionDestination
//----------------------------------------------------------------------------------------------------
function getRegisteredSelectionDestinations()
{
  return(selectionDestinations);

} // getRegisteredSelectionDestinations
//----------------------------------------------------------------------------------------------------
function setupSocket(socket)
{
  console.log("=== Module.hub setupSocket");

  try {
     socket.onopen = function() {
        console.log("websocket connection now open");
        socketIsConnected = true;
        for(var f=0; f < socketConnectedFunctions.length; f++){
           console.log("calling the next sockectConnectedFunction");
           socketConnectedFunctions[f]();
           } // for f
        } // socked.onopen

     socket.onmessage = function got_packet(msg) {
        //console.log("=== Hub, socket.onmessage");
        var msg = JSON.parse(msg.data)
        dispatchMessage(msg)
        } // socket.onmessage, got_packet

     socket.onclose = function(){
        console.log("socket closing");
        } // socket.onclose
     } // try
  catch(exception) {
    console.log("Error: " + exception);
    }
 
  return(socket);

} // setupSocket
//----------------------------------------------------------------------------------------------------
function socketConnected()
{
   return(socketIsConnected);

} // socketConnected
//----------------------------------------------------------------------------------------------------
function addSocketConnectedFunction(func)
{
   socketConnectedFunctions.push(func)

} // addSocketConnectedFunction
//----------------------------------------------------------------------------------------------------
function getSocketConnectedFunctions()
{
   return(socketConnectedFunctions)

} // getSocketConnectedFunction
//----------------------------------------------------------------------------------------------------
function addOnDocumentReadyFunction(func)
{
   onDocumentReadyFunctions.push(func)

} // addOnDocumentReadyFunction
//----------------------------------------------------------------------------------------------------
function getOnDocumentReadyFunctions()
{
   return(onDocumentReadyFunctions)

} // getOnDocumentReadyFunctions
//----------------------------------------------------------------------------------------------------
function runOnDocumentReadyFunctions()
{
  var funcs = getOnDocumentReadyFunctions()
  console.log("==== Module.hub: " + funcs.length + " onDocumentReadyFunctions");

  for (var f = 0; f < funcs.length; f++) {
     console.log("calling on ready function");
     funcs[f]();
     }

} // runOnDocumentReadyFunctions
//----------------------------------------------------------------------------------------------------
function runningInNode()
{
    // a not very sophisticated test, but adequate for our purposes thus far
  return(typeof(window) == "undefined")

} // functionRunningInNode
//----------------------------------------------------------------------------------------------------
function initializeWebSocket()
{
   if(runningInNode()){
     console.log("--- web socket not currently available when runing in Node");
     process.exit(code=1)
     }

   socket = new WebSocket(socketURI);
   socket = setupSocket(socket);

} // initializeWebSocket
//----------------------------------------------------------------------------------------------------
function getSocket()
{
  return(socket);

} // getSocket
//----------------------------------------------------------------------------------------------------
function addMessageHandler(cmd, func)
{
  if(cmd in dispatchOptions){
     dispatchOptions[cmd].push(func)
     }
  else{
     dispatchOptions[cmd] = [func]
     }
  
} // addMessageHandler
//----------------------------------------------------------------------------------------------------
function getRegisteredMessageNames()
{
   return(Object.keys(dispatchOptions));
  
} // getRegisteredMessageNames
//----------------------------------------------------------------------------------------------------
function dispatchMessage(msg)
{
   var cmd = msg.cmd;
   var status = msg.status;
   //console.log("=============== dispatching '" + cmd + "'");

   if(Object.keys(dispatchOptions).indexOf(cmd) == -1){
      console.log("unrecognized socket request: " + msg.cmd);
      }
   else{
     var funcs = dispatchOptions[cmd];
     //console.log(" func count for msg cmd " + cmd + ": " + funcs.length);
      for(var i=0; i < funcs.length; i++){
         //console.log("--- Module.hub executing func # " + i + " for cmd " + msg.cmd);
         funcs[i](msg); // dispatchOptions[msg.cmd](msg)
         } // for i
      }

}  // dispatchMessage
//----------------------------------------------------------------------------------------------------
function send(msg)
{
   var cmd = JSON.parse(msg).cmd;
   var browserLocalCommand = Object.keys(dispatchOptions).indexOf(cmd) >= 0;
   var mode = "server";
   if(browserLocalCommand)
      mode = "browser local";

   console.log("--- hub.send: '" + cmd + "' (" + mode + ")");

   if(browserLocalCommand)
      dispatchMessage(JSON.parse(msg));
   else{
      socket.send(msg);
      }

}  // send
//----------------------------------------------------------------------------------------------------
function setTitle (newTitle)
{
  window.document.title = newTitle;

}  // setTitle
//----------------------------------------------------------------------------------------------------
// add a pulldown menu to the specified menuSelector, which has been provided by the caller, which
// is assumed to be an Oncoscape module.  append the names of all previously-registered divs, 
// except for those explicitly excluded in the incoming argument "excludedModules".
// This supports the usual (but not universal) case: a module does not want to send selections
// to itself.
// this argument will often be an array of one element, the name of the calling module.
// some modules may have multiple send destinations (eg, "PCA" & "PCA (highlight)".
function configureSendSelectionMenu(menuSelector, excludedModules, changeFunction, menuTitle)
{
  var menu = $(menuSelector);
  menu.append("<option>" + menuTitle + "</option>");
  menu.change(changeFunction);
  var otherModules = Object.keys(hub.getRegisteredSelectionDestinations());

  for(var i=0; i < otherModules.length; i++){
     var moduleName = otherModules[i];
     var excluded = excludedModules.indexOf(moduleName) >= 0;
     if(!excluded){
        menu.append("<option>" + moduleName + "</option>");
        }
     } // for i

  return(menu);

} // createSendSelectionMenu
//--------------------------------------------------------------------------------------------
function disableButton(button)
{
   button.prop("disabled", true);
   button.css({"background-color": "lightgray", "color": "gray"});

} // disableButton
//--------------------------------------------------------------------------------------------
function enableButton(button)
{
   button.prop("disabled", false);
   //button.css({ 'color': 'black'})
   button.css({"background-color": "white", "color": "black"});

} // enableButton
//--------------------------------------------------------------------------------------------
// if jQuery-style tabs are in use with Oncoscape, this function raised the named tab to the
// the front (visible) position in the tabset
// the argument, "tabIDString" is the tab id used in the module's widget.html, reproduced exactly
// in tabsApp/widget.html, with some current examples being
//  pcaDiv, patientTimeLinesDiv, gbmPathwaysDiv
//
function raiseTab(tabIDString)
{
  var tabsWidget = $("#oncoscapeTabs");

  if(tabsWidget.length > 0){
     var selectionString = '#oncoscapeTabs a[href="#' + tabIDString + '"]';
     var tabIndex = $(selectionString).parent().JAVASCRIPT_INDEX ();
     if(tabIndex < 0) throw "Module.hub does not recognize tabIDString '" + tabIDString + "'";
     tabsWidget.tabs( "option", "active", tabIndex);
     } // if tabs exist

} // raiseTab
//----------------------------------------------------------------------------------------------------
function getRandomFloat (min, max)
{
    return Math.random() * (max - min) + min;
}
//----------------------------------------------------------------------------------------------------
function getRandomInt (min, max) 
{
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
//----------------------------------------------------------------------------------------------------
String.prototype.beginsWith = function (string) 
{
    return(this.toLowerCase().indexOf(string.toLowerCase()) === 0);
};
//----------------------------------------------------------------------------------------------------
// return the targets matched by the candidates, where match is tolerant of differences by suffix
// thus incoming id "TCGA.06.0649.01" matches existing id "TCGA.06.0649" and
//      incoming id "TCGA.06.0649"    matches existing id "TCGA.06.0649.01" 
// this may cause problems with gene names, eg, MYC would mach MYCL and MYCA
// todo: make this suffix-tolerant match suffix-specific 
function intersectionOfArrays(candidates, targets) {

  hits=[]; 

  for(var i=0; i < candidates.length; i++){
    for (var j=0; j < targets.length; j++){
       candidate = candidates[i];
       target = targets[j];
       index1 = candidate.indexOf(target);   // "abc".indexOf("ab") -> 0
       index2 = target.indexOf(candidate); 
       console.log("c(t): " + candidate + " contains " + target + ": " + index1);
       console.log("t(c): " + target + " contains " + candidate + ": " + index2);
       if (index1 == 0)
          hits.push(target)
       else if (index2 == 0)
          hits.push(target)
         } // for j
     } // for i

  return(hits)

} // intersectionOfArays
//----------------------------------------------------------------------------------------------------
function setupGlobalExceptionHandler()
{
   window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {

      var title = "Oncoscape Error";
      var options = {buttons: { "Ok": function () { $(this).dialog("close"); } },
                     title: title};
      var text = "<i>" + errorMsg + "</i><br>" +
                 "<br><b>Script</b>: " + url + 
                 "<br><b>Line:</b> " + lineNumber + 
                 "<br><b>Column:</b> " + column + 
                 "<br><b>StackTrace:</b> " +  errorObj;
      $("<div></div>").dialog(options).html(text);
      };
 
} // setupGlobalExceptionHandler
//----------------------------------------------------------------------------------------------------
function start()
{
  setupGlobalExceptionHandler();
  initializeWebSocket();
  $(document).ready(runOnDocumentReadyFunctions);

}  // start
//----------------------------------------------------------------------------------------------------
function test_intersectionOfArrays()
{
   console.log("---  test_intersectionOfArrays");
   var targets = ["TCGA.02.0006"];
   var candidates = ["TCGA.02.0006"];

   QUnit.test("test_intersectionOfArrays 1", function(assert) {
      assert.equal(hub.intersectionOfArrays(candidates, targets), candidates);
      });

   targets = ["TCGA.02.0006"];
   candidates = ["bogus"];
   QUnit.test("test_intersectionOfArrays 2", function(assert) {
      assert.equal(hub.intersectionOfArrays(candidates, targets), []);
      });

   targets = ["bogus"];
   candidates = ["TCGA.02.0006"];
   QUnit.test("test_intersectionOfArrays 3", function(assert) {
      assert.equal(hub.intersectionOfArrays(candidates, targets), []);
      });


   targets = ["TCGA.02.0006.01"];
   candidates = ["TCGA.02.0006"];
   QUnit.test("test_intersectionOfArrays 4", function(assert) {
      assert.equal(hub.intersectionOfArrays(candidates, targets), candidates);
      });


} //  test_intersectionOfArrays
//----------------------------------------------------------------------------------------------------
function standAloneTest()
{
   test_intersectionOfArrays();

}  // standaloneTest
//----------------------------------------------------------------------------------------------------

  return({
     getName: function() {return(name)},
     registerSelectionDestination: registerSelectionDestination,
     getRegisteredSelectionDestinations: getRegisteredSelectionDestinations,
     socketConnected: socketConnected,
     addSocketConnectedFunction: addSocketConnectedFunction,
     getSocketConnectedFunctions: getSocketConnectedFunctions,
     addOnDocumentReadyFunction: addOnDocumentReadyFunction,
     getOnDocumentReadyFunctions: getOnDocumentReadyFunctions,
     runningInNode: runningInNode,
     initializeWebSocket: initializeWebSocket,
     getSocket: getSocket,
     addMessageHandler: addMessageHandler,
     getRegisteredMessageNames: getRegisteredMessageNames,
     dispatchMessage: dispatchMessage,
     configureSendSelectionMenu: configureSendSelectionMenu,
     enableButton: enableButton,
     disableButton: disableButton,
     getRandomInt: getRandomInt,
     getRandomFloat: getRandomFloat,
     intersectionOfArrays: intersectionOfArrays,
     send: send,
     setTitle: setTitle,
     raiseTab: raiseTab,
     sat: standAloneTest,
     start: start
     });

}); // HubModule
//----------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------
function assert(condition, message)
{ 
  if (!condition)
      throw Error("Assert failed" + (typeof message !== "undefined" ? ": " + message : ""));

}; // assert
//----------------------------------------------------------------------------------------------------
function runTests()
{
  testConstructor();
  testRegisterModule();
  testRunningInNode();
  testAddSocketConnectedFunction();
  testAddOnReadyFunction();
  testAddMessageHandler();

  //testInitializeWebSocket();

} // runTests
//----------------------------------------------------------------------------------------------------
function testConstructor()
{
   console.log("--- testConstructor");

   hub = HubModule();
   assert(hub.getName() === "HubModule");

} // testConstructor
//----------------------------------------------------------------------------------------------------
function testRegisterModule()
{
   console.log("--- testRegisterModule");

   hub = HubModule();
   hub.registerModule("dummy", "dummyDiv");
   hub.registerModule("dimmy", "dimmyDiv");
   rm = hub.getRegisteredModules();
   assert(Object.keys(rm).length == 2);
   assert(rm["dummy"] == "dummyDiv");

   assert(rm["dimmy"] == "dimmyDiv");

} // testConstructor
//----------------------------------------------------------------------------------------------------
function testRunningInNode()
{
   console.log("--- testRunningInNode");

   hub = HubModule();
   assert(hub.runningInNode());

} // testRunningInNode
//----------------------------------------------------------------------------------------------------
function testAddSocketConnectedFunction()
{
   console.log("--- testAddSocketConnectedFunction");

   hub = HubModule();
   func = function() {console.log("do this when socket connected");}
   hub.addSocketConnectedFunction(func);
   funcs = hub.getSocketConnectedFunctions();
   assert(funcs.length == 1)

} // testAddSocketConnectionFunction
//----------------------------------------------------------------------------------------------------
function testAddOnReadyFunction()
{
   console.log("--- testAddOnReadyFunction");

   hub = HubModule();
   func = function() {console.log("do this when socket connected");}
   hub.addOnReadyFunction(func);
   funcs = hub.getOnReadyFunctions();
   assert(funcs.length == 1)

} // testAddOnReadyFunction
//----------------------------------------------------------------------------------------------------
// skip this.  it hangs in Node.  kept here in case we figure it out later.
// depends upon ws module (npm install ws) 
function testInitializeWebSocket()
{
   console.log("--- testInitializeWebSocket");
   hub = HubModule();

   func = function() {console.log("do this when socket connected");}
   func2 = function() {socket.send("hello from testInitializeWebSocket");}

   hub.addSocketConnectedFunction(func);
   hub.addSocketConnectedFunction(func2);

   socket = hub.initializeWebSocket();
   console.log("back in testInitializeWebSocket");

} // testInitWebSocket
//----------------------------------------------------------------------------------------------------
function testAddMessageHandler()
{
   console.log("--- testAddMessageHandler");

   hub = HubModule()
   func = function(msg) {};

   hub.addMessageHandler("test", func);
   assert(hub.getRegisteredMessageNames() == "test")
   
} // testAddMessageHandler
//----------------------------------------------------------------------------------------------------
runTests();