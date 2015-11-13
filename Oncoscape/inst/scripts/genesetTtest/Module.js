var specialSocket;
var dispatchOptions = {};
var socketConnectedFunctions = [];
var onReadyFunctions = [];
var filteredPatients = [];
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
dispatchMessage = function(msg)
{
   if (dispatchOptions[msg.cmd])
       dispatchOptions[msg.cmd](msg)
   else
      console.log("error unrecognized dispatch cmd: " + msg.cmd);
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
        //console.log(msg);
        msg = JSON.parse(msg.data)
        //console.log("common.js onmessage sees " + msg.cmd);
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

   return socket;
} // setupSocket

//--------------------------------------------------------------------------------------------
keepAlive = function()
{   
    console.log("keep alive"); 
    
    msg = {cmd: "keepAlive", callback: "", status:"request", payload:""}
    //socket.send(JSON.stringify(msg));
	specialSocket.send(JSON.stringify(msg));
	
} // keepAlive
    
    
//----------------------------------------------------------------------------------------------------
var sampleSelections = {};
var launchRegressionButton;
//var specialSocket;
var xx;
var outputsDiv;

var pValSlider, pValTHSliderReadout, pValTHMinSliderReadout, pValTHMaxSliderReadout;
var participationSlider, participationTHSliderReadout, participationTHMinSliderReadout, 
participationTHMaxSliderReadout;
var gsttDemoButton;
var quietMode;
var geneMode;
var heatMapImageArea;
var tabDiv;
var runDisplayGeneSetInfo;
var displayGeneSetInfo;
var geneSetTTests_Module = (function () {

  var socketURL = "ws://lopez.fhcrc.org:11003";  
  
  var checkboxDiv;
  var ThisModuleName = "geneSetTTests"   // Title of your Tab      
  var geneSetTTestsDiv;
  var sendSelectionMenu;
  var sampleListsCount = 0;


function initializeUI(){
   geneSetTTestsDiv = $("#geneSetTTests_Div");
   outputsDiv = $("#geneSetTTestsOutputsDiv");
   heatMapImageArea=$("#heatMapImageArea");
   
   checkboxDiv = $("#geneSetTTestsSampleListsDiv");
   launchRegressionButton = $("#geneSetTTestsLaunchButton");
   launchRegressionButton.button();
   launchRegressionButton.prop("disabled", false);
   launchRegressionButton.css("color", "#46b8da");
   launchRegressionButton.click(launchRegression);
   tabDiv = $("#tabDiv");
   tabDiv.tabs();
   quietMode = $("#quietMode").is(':checked');
   geneMode = $("#geneMode").is(':checked');
   
   pValSlider = $('#pValTHSlider');
   pValTHSliderReadout = $("#pValTHSliderReadout");
   pValTHMinSliderReadout = $("#pValTHMinSliderReadout");
   pValTHMaxSliderReadout = $("#pValTHMaxSliderReadout");
   participationSlider = $('#participationTHSlider');
   participationTHSliderReadout = $("#participationTHSliderReadout");
   participationTHMinSliderReadout = $("#participationTHMinSliderReadout");
   participationTHMaxSliderReadout = $("#participationTHMaxSliderReadout");
  
   gsttDemoButton=$("#gsttDemoButton");
   gsttDemoButton.click(runDemos);
   gsttHeatMapRequestButton=$("#gsttHeatMapRequestButton");
   gsttHeatMapRequestButton.click(requestHeatMapDemo);
   handleWindowResize();
  
    pValSlider.slider({
            value:0.050,
            min: 0.000,
            max: 1.000,
            step:0.001,
            slide: function( event, ui ) {
                pValTHSliderReadout.html( ui.value );
            }});
     
    pValTHSliderReadout.html(pValSlider.slider('value') );
    pValTHMinSliderReadout.val(0.00);
    pValTHMaxSliderReadout.val(1.00);
    
    participationSlider.slider({
            value:0.900,
            min: 0.000,
            max: 1.000,
            step:0.001,
            slide: function( event, ui ) {
                participationTHSliderReadout.html( ui.value );
            }});
     
    participationTHSliderReadout.html(participationSlider.slider('value') );
    participationTHMinSliderReadout.val(0.000);
    participationTHMaxSliderReadout.val(1.000);

   $(window).resize(handleWindowResize);
   if(typeof window.PortalGlobals !== 'undefined'){
   		group1 = window.PortalGlobals.getAlteredSampleIdList();
   		group2 = window.PortalGlobals.getUnalteredSampleIdList();
   		group1 = group1.replace(/-/g, ".");
   		group2 = group2.replace(/-/g, ".");
   		group1 = group1.split(" ");
   		group2 = group2.split(" ");
   		
		msg = {cmd: "demo", callback:"", status:"request", payload:{ids: group1}};
		handlePatientIDs(msg);
   		//console.log(msg);
   		msg = {cmd: "demo", callback:"", status:"request", payload:{ids: group2}};
   		//console.log(msg);
   		handlePatientIDs(msg);

   	}

}; // initializeUI
//----------------------------------------------------------------------------------------------------

launchRegression = function()
{
   outputsDiv.empty();
   outputsDiv.append("Calculating...");
   tabDiv.hide();
   
   patientSetNames = selectedSampleSets();
   var group1 = sampleSelections[patientSetNames[0]];
   var group2 = sampleSelections[patientSetNames[1]];
   
   
   var genesets = ["BIOCARTA_MCM_PATHWAY", "VERHAAK_GLIOBLASTOMA_PRONEURAL"];
   
   console.log("---Calculation is launched ---");
  
   payload = {group1: group1, group2: group2,quiet: quietMode, byGene: geneMode, 
              meanThreshold: pValSlider.slider('value'), 
              participationThreshold: participationSlider.slider('value')};

   msg = {cmd: "score", 
          callback: "displayGeneSetTTestResults",
          status: "request",
          payload: payload};
   
   specialSocket.send(JSON.stringify(msg));
   console.log("JSON message sent...");
debugger;
} // launchRegression

//----------------------------------------------------------------------------------------------------
launchRegression_args = function()
{
   outputsDiv.empty()
   outputsDiv.append("Calculating...");
   
   patientSetNames = selectedSampleSets();
   var group1 = sampleSelections[patientSetNames[0]];
   var group2 = sampleSelections[patientSetNames[1]];

  
   var genesets = ["BUDHU_LIVER_CANCER_METASTASIS_UP", "MODULE_143","MODULE_293"];
   var pv = 0.05;
   var pc = 0.7;
   var byGene = false;
   var quiet = false;
   //console.log("group1: " + group1);
   //console.log("group2: " + group2);
   console.log("genesets:" + genesets);
   console.log("byGene:" + byGene);
   console.log("quiet:" + quiet);
   console.log("pv:" + pv);
   console.log("pc:" + pc);
   
   payload = {genesets: genesets, 
              group1: group1, 
              group2: group2, 
              quiet: quiet, 
              byGene: byGene, 
              meanThreshold: pv, 
              participationThreshold: pc};

   msg = {cmd: "score", 
          callback: "displayGeneSetTTestResults",
          status: "request",
          payload: payload};

   specialSocket.send(JSON.stringify(msg));
 

} // launchRegression taking in args
//----------------------------------------------------------------------------------------------------
displayGeneSetTTestResults = function(msg)
{

   console.log("--- displayGeneSetTTestResults");
   //console.log(msg.payload);
   xx = JSON.parse(msg.payload)
   var array = []
   for(x in xx){
       array.push([x,xx[x]])
    }
   array.sort(function(a,b){return Object(a["1"]).mean - Object(b["1"]).mean});    
   
   outputsDiv.empty()
   outputsDiv.append("<h4> Best-scoring Gene Sets </h4>")
   outputsDiv.append("<ol style='list-style-type:none;'>")
   //titles = Object.keys(xx);
   if(array.length == 0)
     outputsDiv.append("No results above threshold");

   var group1 = sampleSelections[patientSetNames[0]];
   var group2 = sampleSelections[patientSetNames[1]];
   //console.log("group1: " + group1);
   //console.log("group2: " + group2);

   var tabDiv = [];
   if(array.length < 100){
   for(var i=0; i < array.length; i++){
      var title = array[i][0];
      var oneGeneSet = xx[title];
      var title_space = title.replace(/_/g,"  ")
      /*var s = "<li>" + "<a href='#tabDiv' class='geneSetSelectorClass'" + "onclick='return false;' id='" + title + "'>" + 
              title_space + "</a></li>";*/
      var geneSet = title;
      payload = {group1: group1, group2: group2,geneSet:geneSet};
      var s = "<li>" + "<a href='#tabDiv' class='geneSetSelectorClass'" + "onclick='requestHeatMap(payload)' id='" + title + "'>" + 
              title_space + " (p="+oneGeneSet.mean.toFixed(3) + ")</a></li>";        
      var geneSet = title;
      
      outputsDiv.append(s);
      //$(".geneSetSelectorClass").click(function(){$("#tabDiv").toggle();});
      $(".geneSetSelectorClass").click(runDisplayGeneSetInfo);
      
      } // for i
    }else{
    	outputsDiv.append(array.length + " genesets met your criteria. We limit display to the highest-scoring 100.");
    }  
   outputsDiv.append("</ol>")

} // displayGeneSetTTestResults
//----------------------------------------------------------------------------------------------------
fetchHeatMap = function(group1, group2, geneSet)
{
	payload = {group1: group1, group2: group2,geneSet:geneSet};
      msg = {cmd: "fetchHeatMap", 
          callback: "displayHeatMap",
          status: "request",
          payload: payload};
      specialSocket.send(JSON.stringify(msg));
}
//----------------------------------------------------------------------------------------------------
displayGeneSetInfo = function(singleGeneSetName){
   
   var group1 = sampleSelections[patientSetNames[0]];
   var group2 = sampleSelections[patientSetNames[1]];
   //console.log("group1: " + group1);
   //console.log("group2: " + group2);
   var geneSet = singleGeneSetName;
   payload = {group1: group1, group2: group2,geneSet:geneSet};
      msg = {cmd: "fetchHeatMap", 
          callback: "displayHeatMap",
          status: "request",
          payload: payload};
      specialSocket.send(JSON.stringify(msg));
   $("#tabDiv iframe").attr('src', "http://www.broadinstitute.org/gsea/msigdb/cards/"+ 
   singleGeneSetName + " target='_blank'");  
}
//----------------------------------------------------------------------------------------------------
runDisplayGeneSetInfo = function(){
     $("#tabDiv").hide();
     displayGeneSetInfo($(this).attr('id'));
     $("#tabDiv").toggle();
     //return displayGeneSetInfo($(this).attr('id'));
}
//------------------------------------------------------------------------------------------------------
function handleWindowResize()
{
   geneSetTTestsDiv.width($(window).width() * 0.95);
   geneSetTTestsDiv.width($(window).height()* 0.85);
   newHeight = $(window).height() * 0.7;
   newWidth = $(window).width() * 0.7;
   heatMapImageArea.width(newWidth);
   heatMapImageArea.height(newHeight);

}; // handleWindowResize

//--------------------------------------------------------------------------------------------------     
 selectedSampleSets = function()
{
  allCBs = $(".sampleListCheckbox")
  var names = [];

  for(var i=0; i < allCBs.length; i++){
     if(allCBs[i].checked){
       var name = Object.keys(sampleSelections)[i];
       if(name != undefined)
         names.push(name)
       } // if checked
     } // for i

   return(names)

} // selectedSampleSes
//--------------------------------------------------------------------------------------------------     
function sampleCheckboxClick(id)
{
  if(selectedSampleSets().length == 2){
     launchRegressionButton.prop("disabled", false);
     //launchRegressionButton.css("color", "rgb(220, 0, 0)");
     launchRegressionButton.css("color", "#3276b1");
     }
   else{
     launchRegressionButton.prop("disabled", true);
     launchRegressionButton.css("color", "rgb(170, 170, 170)");
     }


} // sampleCheckboxClick
//--------------------------------------------------------------------------------------------------     
function handlePatientIDs(msg){
  
   console.log("received patientIDs: ");
   //console.log(msg);
   sampleListsCount++;
   var name = "samples" + sampleListsCount;
 
   var patientIDs = msg.payload.ids;
 
   sampleSelections[name] = patientIDs;
 
   var id = "logisticSamplesCheckbox" + sampleListsCount;
   var name = id;
   if(sampleListsCount ==1 ){
   		var initialDisplayName = "Altered List " + " (" + patientIDs.length + ")";
   }else{
   		var initialDisplayName = "Unaltered List " + " (" + patientIDs.length + ")";
   }   
   var cbe = "<input type='checkbox' id='" + id + "' value='" + name + 
              "' class='sampleListCheckbox' checked>";
   
   
   
   var le =  "<input type='text' id='" + id + "' value='" + initialDisplayName + "'>";
   
   var del = "<button type='button' class='btn btn-default rem-btn'>" + 
             "<span class='glyphicon glyphicon-remove-circle'></span></button>";
   appString = "<div id=" + sampleListsCount+ "r" + " class='wrapper'><div>" + 
              cbe + " &nbsp; " + le + " &nbsp; </div></div>" ;
//              cbe + " &nbsp; " + le + " &nbsp; " + del + "</div></div>" ;
 
   checkboxDiv.append(appString); 
    
   var cbelement = $("#" + id);
   cbelement.click(function() {sampleCheckboxClick(id)});
   $(".rem-btn").on('click', function(){$(this).closest('div.wrapper').remove();});

}; // handlePatientIDs
//----------------------------------------------------------------------------------------------------
gsttDemo = function()
{

      // tcga gbm samples with survival < 0.05 years post diagnsosis
   shortSurvivors = ["TCGA.02.0439", "TCGA.06.0140", "TCGA.06.0201", "TCGA.06.0213", "TCGA.06.0402",
                     "TCGA.12.0657", "TCGA.14.3476", "TCGA.19.2624", "TCGA.32.1976", "TCGA.41.4097"];
  
      // tcga gbm samples with survival >6 years post diagnsosiss
   longSurvivors = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0080", "TCGA.02.0114",
                    "TCGA.06.6693", "TCGA.08.0344", "TCGA.12.0656", "TCGA.12.0818", "TCGA.12.1088"];

   $("#geneSetTTestsSampleListsDiv").empty()

   msg = {cmd: "demo", callback:"", status:"request", payload:{ids: shortSurvivors}};
   handlePatientIDs(msg)
   msg = {cmd: "demo", callback:"", status:"request", payload:{ids: longSurvivors}};
   handlePatientIDs(msg)

   allCBs = $(".sampleListCheckbox")
   for(var i=0; i < allCBs.length; i++){
     allCBs[i].click()
     }
   launchRegression_args();
         
} // gsttDemo
//----------------------------------------------------------------------------------------------------

runDemos = function (){
   gsttDemo();
}
//----------------------------------------------------------------------------------------------------

function Display_forgeneSetTTests_(msg)
{
   var EventsList = msg.payload
   //console.log(EventsList)
}
//--------------------------------------------------------------------------------------------------
requestHeatMapDemo = function()
{
   heatMapImageArea.empty()
   heatMapImageArea.append("Drawing...");

   patientSetNames = selectedSampleSets();
   //var group1 = sampleSelections[patientSetNames[0]];
   //var group2 = sampleSelections[patientSetNames[1]];
   

   group1 = ["TCGA.A8.A08F.01","TCGA.AR.A24H.01", "TCGA.AN.A0AS.01","TCGA.AR.A0TQ.01","TCGA.A2.A0T0.01",
   "TCGA.A8.A06X.01", "TCGA.BH.A0GZ.01", "TCGA.AN.A0XV.01",
   "TCGA.BH.A0BG.01","TCGA.AN.A046.01","TCGA.E2.A14P.01"];
  
      // tcga gbm samples with survival >6 years post diagnsosiss
   group2 = ["TCGA.AQ.A0Y5.01","TCGA.BH.A0EB.01","TCGA.E9.A22H.01","TCGA.AR.A24S.01",
   "TCGA.AR.A254.01","TCGA.EW.A1IW.01","TCGA.A7.A0CH.01","TCGA.AO.A0JC.01","TCGA.E2.A15R.01","TCGA.A8.A07Z.01","TCGA.E9.A1N9.01"];
   
   payload = {group1: group1, group2: group2,geneSet:"MONTERO_THYROID_CANCER_POOR_SURVIVAL_UP"};

   msg = {cmd: "fetchHeatMap", 
          callback: "displayHeatMap",
          status: "request",
          payload: payload};

   specialSocket.send(JSON.stringify(msg));
 

} // requestHeatMapDemo
//--------------------------------------------------------------------------------------------------
requestHeatMap = function(payload)
{
   heatMapImageArea.empty()
   heatMapImageArea.append("Drawing...");

   patientSetNames = selectedSampleSets();
  
   //payload = {group1: group1, group2: group2,geneSet:geneSet};
   msg = {cmd: "fetchHeatMap", 
          callback: "displayHeatMap",
          status: "request",
          payload: payload};

   specialSocket.send(JSON.stringify(msg));
 

} // requestHeatMap
//--------------------------------------------------------------------------------------------------
function displayHeatMap(msg)
    {
        console.log("about to add heat map image to heatMap div");
        encodedImage = msg.payload;
        //document.getElementById("heatMapImageArea").src = encodedImage;
        heatMapImageArea.html('<img src="' + msg.payload +'"/">');
        //heatMapImageArea.append('<img src="' + msg.payload +'"/>');
     }


//--------------------------------------------------------------------------------------------

     return{
        init: function(){
           specialSocket = new WebSocket("ws://chinookdemo3.sttrcancer.org");
           specialSocket = setupSocket(specialSocket);
		   setInterval(keepAlive,30000);
           onReadyFunctions.push(initializeUI);
           addJavascriptMessageHandler("FunctionForgeneSetTTests_Display", 
                                       Display_forgeneSetTTests_);
           addJavascriptMessageHandler("geneSetTTestsHandlePatientIDs", 
                                      handlePatientIDs);
                                      
           addJavascriptMessageHandler("displayGeneSetTTestResults", displayGeneSetTTestResults);
           addJavascriptMessageHandler("displayHeatMap", displayHeatMap);
        },
        demo: gsttDemo
     };

}); // GeneSetTTestsModule
//----------------------------------------------------------------------------------------------------
gstt = geneSetTTests_Module();
gstt.init();



//--------------------------------------------------------------------------------------------------
$(document).ready(function()
{
    console.log("==== index.common document.ready #1");
    for (var f = 0; f < onReadyFunctions.length; f++)
    {
        console.log("calling on ready function");
        onReadyFunctions[f]();
    }	   
   
})
//--------------------------------------------------------------------------------------------------
