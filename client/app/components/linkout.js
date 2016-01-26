//----------------------------------------------------------------------------------------------------
var LinkoutModule = (function () {

  var thisModulesName = "linkout";
  var selectionDestinations = ["DGIdb", "Wikipedia", "Google", "GeneCards"];
  var thisModulesOutermostDiv = null;

//--------------------------------------------------------------------------------------------
function handleSelections_google(msg)
{
   console.log(JSON.stringify(msg));
   var ids = msg.payload.value;
   var searchString = ids[0];   // just one term for google

   var url = 'http://www.google.com/search?q="' + searchString + '"';
   window.open(url);

} // handleSelections_google
//----------------------------------------------------------------------------------------------------
function handleSelections_DGIdb(msg)
{
   console.log(JSON.stringify(msg));
   var ids = msg.payload.value;
   var searchString = ids[0];
   for(var i=1; i < msg.payload.value.length; i++)
     searchString = searchString + "," + ids[i];

   var url = "http://dgidb.genome.wustl.edu/interaction_search_results?genes=" + searchString; //=EGFR,MET
   url = url + "&limit_drugs=true";
   window.open(url);

} // handleSelections_DGIdb
//----------------------------------------------------------------------------------------------------
function handleSelections_wikipedia(msg)
{
   console.log(JSON.stringify(msg));
   var baseUrl = "https://en.wikipedia.org/wiki/";
   var ids = msg.payload.value;
   var searchString = ids[0];
   var url = baseUrl + searchString;
   window.open(url);

} // handleSelections_wikipedia
//----------------------------------------------------------------------------------------------------
function handleSelections_genecards(msg)
{
   console.log(JSON.stringify(msg));
   var baseUrl = "http://www.genecards.org/cgi-bin/carddisp.pl?gene=";
   var ids = msg.payload.value;
   var searchString = ids[0];
   var url = baseUrl + searchString;
   window.open(url);

} // handleSelections_genecards
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
   //hub.addOnDocumentReadyFunction(initializeUI);
   hub.addMessageHandler("sendSelectionTo_DGIdb", handleSelections_DGIdb);
   hub.addMessageHandler("sendSelectionTo_Wikipedia", handleSelections_wikipedia);
   hub.addMessageHandler("sendSelectionTo_Google", handleSelections_google);
   hub.addMessageHandler("sendSelectionTo_GeneCards", handleSelections_genecards);

} // initializeModule
//----------------------------------------------------------------------------------------------------
return{
   init: initializeModule
   }; // LinkoutModule return value

//----------------------------------------------------------------------------------------------------
}); // LinkoutModule

linkoutModule = LinkoutModule();
linkoutModule.init();

