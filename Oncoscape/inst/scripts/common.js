<script>
var socket;
var dispatchOptions = {};
var socketConnectedFunctions = [];
var onReadyFunctions = [];
var registeredModules = {}; // module name as key, outermost div id as value
//----------------------------------------------------------------------------------------------------
window.onerror = function(msg, url, line, col, error) 
{
     // Note that col & error are new to the HTML 5 spec and may not be 
     // supported in every browser.  It worked for me in Chrome.

   var extra = !col ? '' : '\ncolumn: ' + col;
   extra += !error ? '' : '\nerror: ' + error;

   // You can view the information in an alert to see things working like this:

   alert("Error: " + msg + "\nurl: " + url + "\nline: " + line + extra);

    // TODO: Report this error via ajax so you can keep track  of what pages have JS issues

   var suppressErrorAlert = true;

     // If you return true, then error alerts (like in older versions of 
     // Internet Explorer) will be suppressed.

   return suppressErrorAlert;
};
//----------------------------------------------------------------------------------------------------
addJavascriptMessageHandler = function(cmd, func)
{
   if(cmd in dispatchOptions){
      alert("javascript message handler for '" +  cmd + " already set");
      }
   else{
      dispatchOptions[cmd] = func
      }
}
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
function intersectionOfArrays(a, b)
{
   result = a.filter(function(n) {console.log(n); return (b.indexOf(n) != -1)})
   return(result);

} // intersectionOfArrays
//----------------------------------------------------------------------------------------------------
// if jQuery-style tabs are in use with Oncoscape, this function raised the named tab to the
// the front (visible) position in the tabset
// the argument, "tabIDString" is the tab id used in the module's widget.html, reproduced exactly
// in tabsApp/widget.html, with some current examples being
//  pcaDiv, patientTimeLinesDiv, gbmPathwaysDiv
function raiseTab(tabIDString)
{
  tabsWidget = $("#oncoscapeTabs");
  if(tabsWidget.length > 0){
     selectionString = '#oncoscapeTabs a[href="#' + tabIDString + '"]';
     tabIndex = $(selectionString).parent().JAVASCRIPT_INDEX ();
     tabsWidget.tabs( "option", "active", tabIndex);
     } // if tabs exist

} // raiseTab
//----------------------------------------------------------------------------------------------------
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

} // openCenteredBrowserWindow
//----------------------------------------------------------------------------------------------------
dispatchMessage = function(msg)
{
   console.log("--- webapp, index.common, dispatchMessage: " + msg.cmd);

   if (dispatchOptions[msg.cmd])
       dispatchOptions[msg.cmd](msg)
   else
      console.log("unrecognized socket request: " + msg.cmd);
} 
//--------------------------------------------------------------------------------------------------
setupSocket = function (socket)
{
  try {
     socket.onopen = function() {
        console.log("websocket connection now open");
        for(var f=0; f < socketConnectedFunctions.length; f++){
           console.log("calling the next sockectConnectedFunction");
           socketConnectedFunctions[f]();
           } // for f
        } 
     socket.onmessage = function got_packet(msg) {
        console.log("=== common.js, socket.onmessage");
        console.log(msg);
        msg = JSON.parse(msg.data)
        console.log("index.common onmessage sees " + msg.cmd);
        dispatchMessage(msg)
        } // socket.onmessage, got_packet
     socket.onclose = function(){
        //$("#status").text(msg.cmd)
        console.log("socket closing");
        } // socket.onclose
    } // try
  catch(exception) {
    $("#status").text("Error: " + exception);
    }

} // setupSocket
//----------------------------------------------------------------------------------------------------
// the nginx proxy server, used by fhcrc IT for the publicly-visible version of Oncoscape
// times out web sockets at 90 seconds.
// this function, when called more often that that, will keep the websocket open.
keepAlive = function()
{   
    console.log("keep alive"); 
    msg = {cmd: "keepAlive", callback: "", status:"request", payload:""}
    socket.send(JSON.stringify(msg));

} // keepAlive
//--------------------------------------------------------------------------------------------------
$(document).ready(function() {
    console.log("==== index.common document.ready #1");

    for (var f = 0; f < onReadyFunctions.length; f++) {
       console.log("calling on ready function");
       onReadyFunctions[f]();
       }

   var socketURI = window.location.href.replace("http://", "ws://");

   console.log("about to create websocket at " + socketURI);
   socket = new WebSocket(socketURI);
   console.log("about to setupScoket");
   setupSocket(socket);
   console.log("aftersetupScoket");

   setInterval(keepAlive, 30000);

   }) // document ready

//--------------------------------------------------------------------------------------------------
</script>
