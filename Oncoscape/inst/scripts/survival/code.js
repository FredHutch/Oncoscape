<script>
//--------------------------------------------------------------------------------------------------
demoTissueSet = function()
{
   return ["0525.T.2", "0598.T.1", "0622.T.1", "0636.T.1", "0664.T.1", "0761.T.1", "135.1.T.1", 
           "249.T.1", "270X.T.1", "286X.T.1", "349.T.1", "392.1.T.1", "443.1.T.1", "450.T.1", 
           "480.T.1", "821.T.1", "891.T.1", "929.T.1", "958.T.1"];


} // demoTissueSet
//--------------------------------------------------------------------------------------------------
onReadyFunctions.push(function() {
    console.log("==== survivalStats code.js document.ready");
    if(typeof(window.tabsAppRunning) == "undefined") {
       socketConnectedFunctions.push(analyzeSelectedTissuesWithDemoData);
       }
    addJavascriptMessageHandler("tissueIDsForSurvivalStats", handleTissueIDsForSurvivalStats);
    });
//--------------------------------------------------------------------------------------------------
handleTissueIDsForSurvivalStats = function(msg)
{
   console.log("--- handleTissueIDsForSurvivalStats");
   console.log(msg.cmd)
   console.log(msg)
   sampleCount = msg.payload.tissueIDs.length;
   console.log("   sampleCount: " + sampleCount);
   tissueIDs = msg.payload.tissueIDs;

   analyzeSelectedTissues(tissueIDs);
   $("#tabs").tabs( "option", "active", 6); 

   
} // handleTissueIDsForSurivalStats
//--------------------------------------------------------------------------------------------------
analyzeSelectedTissuesWithDemoData = function()
{
   analyzeSelectedTissues(demoTissueSet());
}  
//--------------------------------------------------------------------------------------------------
analyzeSelectedTissues = function(tissueIDs)
{
    msg = {cmd:"predictDzSubtypes", status: "request", payload: tissueIDs};
    msg.json = JSON.stringify(msg);
    socket.send(msg.json);
    msg = {cmd:"calculateSurvivalCurves", status: "request", payload: tissueIDs};
    msg.json = JSON.stringify(msg);
    socket.send(msg.json);
    msg = {cmd:"drawSurvivalBoxPlot", status: "request", payload: tissueIDs};
    msg.json = JSON.stringify(msg);
    socket.send(msg.json);

} // analyzeSelectedTissues
//--------------------------------------------------------------------------------------------------
displaySamplesVsSubtypePvals = function(msg)
{
   console.log("=== displaySamplesVsSubtypePvals");
   $("#dzSubTypeDataTableDiv").html(msg.payload)

} // displaySamplesVsSubtypePvals
//--------------------------------------------------------------------------------------------------
displaySurvivalCurves = function(msg)
{
   console.log("about to add survival curve image to survivalCurve div");
   encodedImage = msg.payload;
   document.getElementById("survivalCurveImage").src = encodedImage;
}
//--------------------------------------------------------------------------------------------------
displaySurvivalBoxPlot = function(msg)
{
   console.log("about to add survival boxplot image to survivalBoxPlot div");
   encodedImage = msg.payload;
   document.getElementById("survivalBoxPlotImage").src = encodedImage;
}
//--------------------------------------------------------------------------------------------------
addJavascriptMessageHandler("samplesVsSubtypePvals", displaySamplesVsSubtypePvals);
addJavascriptMessageHandler("displaySurvivalCurves", displaySurvivalCurves);
addJavascriptMessageHandler("displaySurvivalBoxPlot", displaySurvivalBoxPlot);
//----------------------------------------------------------------------------------------------------
</script>

