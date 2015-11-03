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
  
  var  messagingRestrictedToLogin = false;

  var modules = {};
//----------------------------------------------------------------------------------------------------
function registerModule(name, moduleObject)
{
   modules[name] = moduleObject;

} // registerModule
//----------------------------------------------------------------------------------------------------
function getModuleNames()
{
   return(Object.getOwnPropertyNames(modules));

} // getModuleNames
//----------------------------------------------------------------------------------------------------
function getModules()
{
   return modules;

} // getModules
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
        var msg = JSON.parse(msg.data)
        dispatchMessage(msg)
        } // socket.onmessage, got_packet

     socket.onclose = function(){
        alert("Web socket connection to server has closed");
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
// the nginx proxy server, used by fhcrc IT for the publicly-visible version of Oncoscape
// times out web sockets at 90 seconds.
// this function, when called more often that that, will keep the websocket open.
keepAlive = function()
{   
    //console.log("keep alive"); 
    msg = {cmd: "keepAlive", callback: "", status:"request", payload:""}
    socket.send(JSON.stringify(msg));

} // keepAlive
//--------------------------------------------------------------------------------------------------
function runOnDocumentReadyFunctions()
{
  setInterval(keepAlive, 10000);  // 10 seconds
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
function getDispatchOptions()
{
   return(dispatchOptions);
  
} // getDispatchOptions
//----------------------------------------------------------------------------------------------------
function dispatchMessage(msg)
{
   var cmd = msg.cmd;
   var status = msg.status;
   console.log("====== Module.hub dispatchMessage '" + cmd + "' [" + Date() + "]" );

   var dispatchKeys = Object.keys(dispatchOptions);
   var cmdIndex = dispatchKeys.indexOf(cmd);
   console.log("hub.dispatchMessage(" + cmd + "): " + cmdIndex);

   if(cmdIndex === -1){
      console.log("unrecognized socket request: " + msg.cmd);
      console.log(" --- msg:");
      console.log(msg);
      console.log(" --- dispatchOptions");
      console.log(dispatchOptions);
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
function restrictMessagingToLogin(newState)
{
   messagingRestrictedToLogin = newState;

} // restrictMessagingToLogin
//----------------------------------------------------------------------------------------------------
function send(msg)
{
   var cmd = JSON.parse(msg).cmd;
   if(messagingRestrictedToLogin && cmd === "checkPassword"){
      console.log("hub.send drops non-login msg");
      return;
      }

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
// from http://stackoverflow.com/questions/4068373/center-a-popup-window-on-screen
function openCenteredBrowserWindow(url, title, w, h, replaceAnyExistingPopup) {
      // Fixes dual-screen position                       Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;
    width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var options = 'scrollbars=yes, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left;

    var newWindow;

      // warning, a bug: when multiple popup windows are created, they
      // all have the same content -- not what we want.  fix this
      // by severing their relationship, and/or switching to jQuery dialog

    if(replaceAnyExistingPopup)
      newWindow = window.open(url, title, options);
    else // leave any existing popup windows untouched
      newWindow = window.open(url, "_blank", options);

    if (window.focus) {
       newWindow.focus();
       }
       
    return newWindow;

} // openCenteredBrowserWindow
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
function disableAllTabsExcept(tabIDstring)
{
  if(typeof tabIDstring == "string") tabIDstring = [tabIDstring]
  var allDivIDs = getTabDivIDs()
  allDivIDs = allDivIDs.filter(function(i, id){ return(tabIDstring.indexOf(id) == -1) })
  for(var i=0;i<allDivIDs.length; i++){  	disableTab(allDivIDs[i]) }
  
  return allDivIDs;  //returns divIDs that have been disabled
  
} // disableTab
//--------------------------------------------------------------------------------------------
function disableTab(tabIDstring)
{
  $( "#oncoscapeTabs" ).tabs( "disable", "#" + tabIDstring  )

} // disableTab
//--------------------------------------------------------------------------------------------
function enableTab(tabIDstring)
{
  $( "#oncoscapeTabs" ).tabs( "enable", "#" + tabIDstring   )
} // enableTab

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
     console.log("Module.hub:raiseTab for '" + tabIDString + "' (" + tabIndex + ") set to active'");
     setTimeout(function(){tabsWidget.tabs( "option", "active", tabIndex);}, 0);
     } // if tabs exist

} // raiseTab
//----------------------------------------------------------------------------------------------------
// each of our tabs is a div, nested directly within $("oncoscapeTabs").  
// this function returns an array of each of the div ids
function getTabNames()
{
  var tabNames = $("#oncoscapeTabs").children()[0].textContent.trim().split("\n")
  for (i=0;i< tabNames.length; i++){ tabNames[i] = tabNames[i].trim()}
  tabNames =tabNames.filter(function(name){return name != ""})

	return tabNames;

} // getTabDivIDs
//----------------------------------------------------------------------------------------------------
// each of our tabs has a title within the $("oncoscapeTabs") nav bar
// this function returns an array of each tab Title
function getTabDivIDs()
{
   return ($("#oncoscapeTabs").children("div").map(function(index,dom){return dom.id}));

} // getTabDivIDs
//----------------------------------------------------------------------------------------------------
// e.g., hub.hideTab("Login", "#loginDiv");
function hideTab(tabTitle, tabDivIDstring)
{
  $(".ui-tabs-nav li:contains('" + tabTitle + "')").hide()
  $(tabDivIDstring).hide();

} // hideTab
//----------------------------------------------------------------------------------------------------
// e.g., hub.hideTabNav("Login");
function hideTabNav(tabTitle)
{
  $(".ui-tabs-nav li:contains('" + tabTitle + "')").hide()

} // hideTab
//----------------------------------------------------------------------------------------------------
function hideAllTabsButOne(tabTitle, tabDivIDstring)
{
  var divIDs = getTabDivIDs();
  
  $(".ui-tabs-nav li:contains('" + tabTitle + "')").hide()
  $(tabDivIDstring).hide();

} // hideAllTabsButOne
//----------------------------------------------------------------------------------------------------
function showTab(tabTitle, tabDivIDstring)
{
  $(".ui-tabs-nav li:contains('" + tabTitle + "')").show()
  $(tabDivIDstring).show();

} // showTab
//----------------------------------------------------------------------------------------------------
function addTab(tabTitle, tabDivIDstring,  content)
{
  var tabs = $("#oncoscapeTabs").tabs()
  var listItem = "<li><a href='#" + tabDivIDstring + "}'>" + tabTitle + "</a>";

  tabs.find(".ui-tabs-nav").append(listItem);
  tabs.append("<div id='" + tabDivIDstring + "'><p>" + content + "</p></div>");
  tabs.tabs("refresh");

} // addTab
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
uniqueElementsOfArray = function(vector)
{
  var u = {}, a = [];

  for(var i = 0, l = vector.length; i < l; ++i){
     if(u.hasOwnProperty(vector[i])){
       continue;
       }
     a.push(vector[i]);
     u[vector[i]] = 1;
     } // for i

   return a;

} // uniqueElementsOfArray
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
       //console.log("c(t): " + candidate + " contains " + target + ": " + index1);
       //console.log("t(c): " + target + " contains " + candidate + ": " + index2);
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
  QUnit.config.altertitle = false;

}  // start
//----------------------------------------------------------------------------------------------------
function logEventOnServer(moduleOfOrigin, eventName, eventStatus, comment)
{
   console.log("about to logEvent: " + eventName);
   payload= {eventName: eventName, eventStatus: eventStatus, 
             moduleOfOrigin: moduleOfOrigin, comment: comment};

   hub.send(JSON.stringify({cmd: "logEvent", callback: "", status: "request", payload: payload}));

} // logEventOnServer
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

   //targets = ["MAP2"];   this test will fail because sometimes we want incomplete matches:
   //  see test4 just above
   //candidates = ["MAP2K4", "abc"];
   //QUnit.test("test_intersectionOfArrays 5", function(assert) {
   //   assert.equal(hub.intersectionOfArrays(candidates, targets), []);
   //   });


} //  test_intersectionOfArrays
//----------------------------------------------------------------------------------------------------
function standAloneTest()
{
   test_intersectionOfArrays();

}  // standaloneTest
//----------------------------------------------------------------------------------------------------

  return({
     getName: function() {return(name)},
     restrictMessagingToLogin: restrictMessagingToLogin,
     registerModule: registerModule,
     getModules: getModules,
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
     getDispatchOptions: getDispatchOptions,
     dispatchMessage: dispatchMessage,
     configureSendSelectionMenu: configureSendSelectionMenu,
     openCenteredBrowserWindow: openCenteredBrowserWindow,
     enableButton: enableButton,
     disableButton: disableButton,
     enableTab: enableTab,
     disableTab: disableTab,
     disableAllTabsExcept: disableAllTabsExcept,
     getRandomInt: getRandomInt,
     getRandomFloat: getRandomFloat,
     intersectionOfArrays: intersectionOfArrays,
     uniqueElementsOfArray: uniqueElementsOfArray,
     send: send,
     setTitle: setTitle,
     getTabDivIDs: getTabDivIDs,
     getTabNames: getTabNames,
     raiseTab: raiseTab,
     hideTab: hideTab,
     hideTabNav: hideTabNav,
     showTab: showTab,
     addTab: addTab,
     sat: standAloneTest,
     start: start,
     logEventOnServer: logEventOnServer
     });

}); // HubModule
//----------------------------------------------------------------------------------------------------

