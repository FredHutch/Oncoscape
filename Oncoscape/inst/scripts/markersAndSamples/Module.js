//----------------------------------------------------------------------------------------------------
// move these all back inside module scope when debugging is done

var cwMarkers;
var markersTester;

//----------------------------------------------------------------------------------------------------
var markersAndTissuesModule = (function () {

  var statusDiv; 
  var cyDiv;
  var searchBox;
  var hideEdgesButton, showEdgesButton, showAllEdgesButton, clearSelectionButton, sfnButton;
  var markersFitViewButton, markersHideEdgesButton, markersShowEdgesButton, markersZoomSelectedButton;

  var nodeRestriction = [];
  var subSelectButton;
  var helpButton;
  var infoMenu;
  var zoomMode = "Spread";
  var initialZoom;
  var oldZoom;
  var edgeTypeSelector;
  var mouseOverReadout;
  var graphOperationsMenu;
  var tumorCategorizationsMenu;
  var tumorCategorizationsMenuTitle = "Tumor Groups...";
  var sendSelectionsMenu;
  var layoutMenu;
  var thisModulesName = "MarkersAndPatients";
  var thisModulesOutermostDiv = "markersAndPatientsDiv";
  var userID = "NA";

     // assigned on first load, used when tumor groups are cleared
  var defaultPatientNodeColor = "black";  

      // sometimes a module offers multiple selection destinations.
      // usually there is just one:

  var selectionDestinations = [thisModulesName];


  var sendSelectionsMenuTitle = "Send selection...";

     // the user may specify that only certain tumors, and/or certain genes
     // are to be used in any subsequent network operations -- especially
     // "show edges from selected nodes"
     // to experiment with this capability, there are two new net ops menu
     // options, which assign zero or more selected nodes to these variables,
     // which are then used (if defined) to limit the subsequent network
     // operation


//--------------------------------------------------------------------------------------------
function initializeUI ()
{

  cyDiv = $("#cyMarkersDiv");
  statusDiv = $("#markersAndPatientsStatusDiv");

  sendSelectionsMenu = hub.configureSendSelectionMenu("#cyMarkersSendSelectionsMenu", 
                                                      [thisModulesName], sendSelections,
                                                      sendSelectionsMenuTitle);

  markersFitViewButton = $("#markersFitViewButton");
  markersFitViewButton.click(function(){cwMarkers.fit(50);});
  
  markersZoomSelectedButton = $("#markersZoomSelectedButton");
  markersZoomSelectedButton.click(zoomSelected);

  markersHideEdgesButton = $("#markersHideEdgesButton");
  markersHideEdgesButton.click(hideAllEdges);
  hub.disableButton(markersHideEdgesButton);
  
  markersShowEdgesFromButton = $("#markersShowEdgesFromSelectedButton");
  markersShowEdgesFromButton.click(showEdgesFromSelectedNodes);
  hub.disableButton(markersShowEdgesFromButton);

  //$("#markersFitViewButton").click(function(){cwMarkers.fit();});
  //$("#markersHideEdgesButton").click(hideAllEdges);
  //$("#markersShowEdgesFromSelectedButton").click(showEdgesFromSelectedNodes);

  tumorCategorizationsMenu = $("#cyMarkersTumorCategorizationsMenu");
  tumorCategorizationsMenu.empty();
  tumorCategorizationsMenu.append("<option>" + tumorCategorizationsMenuTitle + "</option>");
  tumorCategorizationsMenu.change(requestTumorCategorization);

  graphOperationsMenu = $("#cyMarkersOperationsMenu");
  graphOperationsMenu.change(doGraphOperation);
  graphOperationsMenu.empty();
  graphOperationsMenu.append("<option>Network Operations...</option>");

  var operations = ["Show All Edges",
                    "Show Edges from Selected Nodes",
                    "Hide All Edges",
                    //"Connect to First Neighbors",
                    "Invert Node Selection",
                    "Clear Selections",
                    "Select All Connected Nodes",
                    "Select All Nodes with Selected Edges",
                    "Hide Unselected Nodes",
                    "Show All Nodes",
                    "Restrict Next Ops to Selected Nodes"];

  for(var i=0;i< operations.length; i++){
     var optionMarkup = "<option>" + operations[i] + "</option>";
     graphOperationsMenu.append(optionMarkup);
     } // for 


   layoutMenu = $("#markerLayouts");
   layoutMenu.change(performLayout);

   showEdgesButton = $("#cyMarkersShowEdgesButton");
   showEdgesButton.click(showEdges);
   
   showAllEdgesButton = $("#cyMarkersShowAllEdgesButton");
   showAllEdgesButton.click(showAllEdges);

   sfnButton = $("#cyMarkersSFNButton");
   sfnButton.click(selectFirstNeighbors);
   clearSelectionButton = $("#cyMarkersClearSelectionButton");
   clearSelectionButton.click(clearSelection);

   hideEdgesButton = $("#cyMarkersHideEdgesButton");
   hideEdgesButton.click(hideAllEdges);


   searchBox = $("#markersAndTissuesSearchBox");

   edgeTypeSelector = $("#markersEdgeTypeSelector");
   edgeTypeSelector.chosen();

   mouseOverReadout = $("#markersAndTissuesMouseOverReadout");
   configureCytoscape();
   $(window).resize(handleWindowResize);

   subSelectButton = $("#markersSubSelectButton");
   subSelectButton.click(subSelectNodes);

   setInterval(buttonAndMenuStatusSetter, 500);
      
   hub.disableTab(thisModulesOutermostDiv);
   $("#markersAndPatientsDiv").css("display", "none");

 
} // initializeUI
//----------------------------------------------------------------------------------------------------
// some buttons and menu are live or disabled depending on the presence of e.g., selected nodes
// or visible (non-chromosome) edges.   check those things and set their states appropriately

function buttonAndMenuStatusSetter()
{
   var selectedNodes = cwMarkers.nodes("node:selected");
   var selectedNodeCount = selectedNodes.length;
   $("#markersSelectionCountReadout").val(selectedNodeCount);
   
   var selectedPatientNodes = cwMarkers.nodes("node[nodeType='patient']:selected");
   var selectedPatientNodeCount = selectedPatientNodes.length;
   
   if(selectedNodeCount === 0){
      hub.disableButton(sendSelectionsMenu);
      hub.disableButton(markersShowEdgesFromButton);
      hub.disableButton(markersZoomSelectedButton);
      }
   else{
      hub.enableButton(sendSelectionsMenu);
      hub.enableButton(markersShowEdgesFromButton);
      hub.enableButton(markersZoomSelectedButton);
      }
      
      // the Subselect button is only on if a primary selection has been made
   var categories = selectedPatientNodes.map(function(e) {return e.data().category;});
   var categoriesPresent = categories.filter(function(e){return e;}).length > 0;  // undefined & null filtered out

   if(selectedPatientNodeCount > 0 & categoriesPresent)
      hub.enableButton(subSelectButton);
   else
      hub.disableButton(subSelectButton);
   

   var visibleEdges = cwMarkers.edges().fnFilter(function(e){return(e.visible());})
                                       .fnFilter(function(e){return(e.data("edgeType") != "chromosome");}).length;
   if(visibleEdges > 0)
       hub.enableButton(markersHideEdgesButton);
   else
       hub.disableButton(markersHideEdgesButton);

} // buttonAndMenuStatusSetter
//----------------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();
   console.log("CyMarkers send selections to " + destination);
   sendSelectionsMenu.val(sendSelectionsMenuTitle);
   var nodeNames = selectedNodeNames(cwMarkers);
   if(nodeNames.length === 0){
      console.log("no nodes selected!");
      return;
      }

  var cmd = "sendSelectionTo_" + destination;
  payload = {value: nodeNames, count: nodeNames.length, source: "markers and patients module"};
  var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

  sendSelectionsMenu.val(sendSelectionsMenuTitle);

  hub.send(JSON.stringify(newMsg));

} // sendSelections
//--------------------------------------------------------------------------------------------
function configureLayoutsMenu(layoutMenu){

   console.log("--- configureLayoutsMenu");
   layoutMenu.append("<option>Layouts...</option>");
   layoutMenu.append("<option> Save Current</option>");

   var defaultLayout = JSON.stringify(cwMarkers.nodes().map(function(n){
          var result = {id:n.id(), position:n.position()};
          return (result);  
          }) // map
       ); // stringify

   localStorage.markersDefault = defaultLayout;

   var existingLayouts = Object.keys(localStorage);
   for(var i=0; i < existingLayouts.length; i++){
      if(existingLayouts[i].match("markers") !== null){
        layoutMenu.append("<option>" + existingLayouts[i] + "</option>");
        }
      } // for i

} // configureLayoutsMenu
//----------------------------------------------------------------------------------------------------
function performLayout(event){

  var chosenLayoutName = layoutMenu.val();

  if(chosenLayoutName == "Save Current"){
     var uniqueNumber = Math.floor(new Date().getTime()/1000);   // number of seconds since 1970
     newName = "markers." + (uniqueNumber - 1420414900);    // since today, very roughly
     var positions = cwMarkers.nodes().map(function(n){
           var result = {id:n.id(), position:n.position()};
           return(result);
           }); // map
     currentLayout = JSON.stringify(positions);
     localStorage[newName] = currentLayout;
     layoutMenu.append("<option>" + newName + "</option>");
     layoutMenu.val(newName);
     return;
     } // if "Save Current"

  if(Object.keys(localStorage).indexOf(chosenLayoutName) >= 0){
     var newLayout;
     newLayout = JSON.parse(localStorage[chosenLayoutName]);
     cwMarkers.nodes().positions(function(i, node){
        return{x: newLayout[i].position.x, y:newLayout[i].position.y};
         });
     } // if requested layout name is recognized
  
  layoutMenu.val("Layouts...");   // restore the title

} // performLayout
//--------------------------------------------------------------------------------------------
function sendSelection()
{
   destinationModule = sendSelectionsMenu.val();
   var nodeNames = selectedNodeNames(cwMarkers);
   if(nodeNames.length === 0){
      console.log("no nodes selected!");
      return;
      }
   metadata = {};
   sendSelectionToModule(destinationModule, nodeNames, metadata);
   sendSelectionsMenu.val("Send Selection...");

} // sendSelectionsMenuChanged
//--------------------------------------------------------------------------------------------
function configureCytoscape ()
{
  cwMarkers = $("#cyMarkersDiv");
  cwMarkers.cytoscape({
     hideEdgesOnViewport: false,
     hideLabelsOnViewport: false,
     boxSelectionEnabled: true,
     showOverlay: false,
     minZoom: 0.001,
     maxZoom: 1000.0,
     layout: {
       name: "preset",
       fit: true
       },
   ready: function() {
      console.log("cwMarkers ready");
      cwMarkers = this;
      initialZoom = cwMarkers.zoom();
      var debouncedSmartZoom = debounce(smartZoom, 20);
      cwMarkers.on('zoom', debouncedSmartZoom);
      cwMarkers.on('pan', debouncedSmartZoom);

      cwMarkers.on('mouseover', 'node', function(evt){
         var node = evt.cyTarget;
         mouseOverReadout.val(node.id());
         });
      cwMarkers.on('mouseout', 'node', function(evt){
         var node = evt.cyTarget;
         mouseOverReadout.val("");
         });
      cwMarkers.on('mouseover', 'edge', function(evt){
         var edge = evt.cyTarget;
         var d = edge.data();
         var msg = d.edgeType + ": " + d.source + " - " + d.target;
         var mutation = d.mutation;
         if(typeof(mutation) == "string")
            msg = mutation + " " + msg;
         mouseOverReadout.val(msg);
         });

      cwMarkers.filter("edge[edgeType='chromosome']").style({"curve-style": "bezier"});
      cwMarkers.filter("edge[edgeType='chromosome']").show();
      searchBox.keydown(doSearch);

      console.log("cwMarkers.reset");
      cwMarkers.reset();
      handleWindowResize();
      cwMarkers.edges().selectify(); // this seems to hold through session, visibility notwithstanding
      //hideAllEdges();
      configureLayoutsMenu(layoutMenu);
      cwMarkers.fit(50);
      }, // cwMarkers.ready
     }); // .cytoscape

} // configureCytoscape
//----------------------------------------------------------------------------------------------------
function handleWindowResize ()
{
   cyDiv.width(0.95 * $(window).width());
   cyDiv.height(0.8 * $(window).height());
   cwMarkers.resize();
   cwMarkers.fit(50);

} // handleWindowResize
//----------------------------------------------------------------------------------------------------
// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate)
{
   var timeout;
   return function() {
      var context = this, args = arguments;
      var later = function() {
         timeout = null;
         if (!immediate) func.apply(context, args);
          };
       var callNow = immediate && !timeout;
       clearTimeout(timeout);
       timeout = setTimeout(later, wait);
       if (callNow) func.apply(context, args);
       };
}
//----------------------------------------------------------------------------------------------------
// expand node size and display node labels when:
//   1) the user's coordinate space, due to zooming, has shrunk to < 600 pixels
//   2) the zoom factor is so large relative to the initial zoom (a global variable, set on startup)
// 
function smartZoom(event)
{
   //console.log("smartZoom");
   var queuedEvents = $("#cyMarkersDiv").queue();
   
   var zoomRatio = cwMarkers.zoom()/initialZoom;
   console.log("zoomRatio: " + zoomRatio);

   if(zoomRatio < 1.0){
      defaultStyle();
      return;
      }
      
   var visibleCoords = cwMarkers.extent();
   var visibleOnScreen = function(node){
      if(node.data("landmark"))
         return(false);
      //var x = node.position().x;
      //var y = node.position().y;
      var bbox = node.boundingBox();
      var visibleX = (bbox.x1 >= visibleCoords.x1 && bbox.x1 <= visibleCoords.x2) |
                     (bbox.x2 >= visibleCoords.x1 && bbox.x2 <= visibleCoords.x2);
      if(!visibleX)
        return false;
      var visibleY = (bbox.y1 >= visibleCoords.y1 && bbox.y1 <= visibleCoords.y2) |
                     (bbox.y2 >= visibleCoords.y1 && bbox.y2 <= visibleCoords.y2);
      return(visibleY);
      //return(x >= visibleCoords.x1 && x <= visibleCoords.x2 &&
      //       y >= visibleCoords.y1 && y <= visibleCoords.y2);
      };
      
   //console.log("starting calculation of visibleNodes");
   var visibleNodes = cwMarkers.nodes().fnFilter(function(node){return(visibleOnScreen(node));});		
   console.log("visibleNode count: " + visibleNodes.length);
   if(visibleNodes.length > 400){
      defaultStyle();
      //console.log("returning, visibleNode count: " + visibleNodes.length);
      return;
      }
   //console.log("need to smartZoom, setting hanlder off to discard queued events");
   //cwMarkers.off('zoom', smartZoom);

   //console.log(event);
   var newZoom = 1.0 + cwMarkers.zoom() - oldZoom;
   oldZoom = cwMarkers.zoom(); // keep this for next time

   //console.log("complete");

      // TODO: these two ratios might be reduced to just one
      
   var windowRatio = cwMarkers.width()/cwMarkers.extent().h;
   
   var fontSize = cwMarkers.extent().h/60;
   if(fontSize < 0.6)
     fontSize = 0.6;
     
   var fontSizeString = fontSize + "px";
   var borderWidthString = cwMarkers.extent().h/600 + "px";
   //console.log("--- new fontsize: " + fontSizeString);
   //console.log("--- new borderWidth: " + borderWidthString);
   cwMarkers.edges().style({"width": borderWidthString});
   
   var newWidth, newHeight, id;
   var factor = 1.5; // 3
   cwMarkers.batch(function(){
      visibleNodes.map(function(node){
         newWidth = factor *  node.data("trueWidth") / zoomRatio;
         newHeight = factor *  node.data("trueHeight") / zoomRatio;
         id = node.id();
         node.data({zoomed: true});
         node.style({width: newWidth, height: newHeight, label: id, "font-size": fontSizeString,
                    "border-width": borderWidthString});
         });
       });

  //console.log("visibleNode mapping complete, adding smartZoom handler back");
  //cwMarkers.on('zoom', smartZoom);


} // smartZoom
//----------------------------------------------------------------------------------------------------
function defaultStyle()
{
   var zoomedNodes = cwMarkers.nodes("[zoomed]");
   // console.log("restoring default style, zoomed node count: " + zoomedNodes.length);
   cwMarkers.edges().style({"width": "1px"});
   
   zoomedNodes.map(function(node){node.style({width: node.data('trueWidth'),
                                              height: node.data('trueHeight'),
                                              zoomed: false,
                                             'border-width': "1px",
                                             'font-size': "3px"});});

} // defaultStyle
//----------------------------------------------------------------------------------------------------
// tumor (patient, sample) nodes can be categorized, usually based upon independent biology,
// expressed in simple named tables included in each data package.  Each sample group in these
// tables is assigned a color for distinctive display.
// here we present a simple dialog so that one or more categories within the current selection
// can be subselected
//
function subSelectNodes()
{
  var selectedPatientNodes = cwMarkers.nodes("node[nodeType='patient']:selected");
  var categories = jQuery.unique(selectedPatientNodes.map(function(e){return e.data("category");}));

  var colors = jQuery.unique(selectedPatientNodes.map(function(node){return (node.style("background-color"));}));

  var content = "<form action=''>";
  for(i=0; i < categories.length; i++){
     var category = categories[i];
     var color = colors[i];
     var selector = "[category='" + category + "']:selected";
     var count = cwMarkers.nodes(selector).length;
     var id = "cb" + i;
     var e = "<html><body><input id='" + id + "' type='checkbox' class='markersSubSelectRadioButton' name='" + category + "'" +
             " style='background':'" + color + "'" + " checked> " +
             "<label for='" + id + "' style='color:" + color + "'>" + category + " (" + count + ")</label><br></body></html>";
     content = content + e;
     }
  content = content + "</form>";
  button = "<br><br><button id='markersSubSelectCloseButton'>Close</button>";

  content = content + button;

  var dialog = $('<div id="markersSubSelectDialog" />').html(content).dialog({title:"Subselect by Sample Category",
                                                                              width: "500px"});

  $("#markersSubSelectCloseButton").click(function(){
     console.log("about to remove subselect dialog");
     $("#markersSubSelectDialog").remove();
     });

  $(".markersSubSelectRadioButton").click(function(e) {
      var category = this.name;
      var doSelectNodes = this.checked;
      var subsetNodes = selectedPatientNodes.filterFn(function(e){return(e.data("category") === category);});
      if(doSelectNodes)
         subsetNodes.select();
      else
         subsetNodes.unselect();
      }); // radio button click

} // subSelectNodes
//----------------------------------------------------------------------------------------------------
// patient (sample, tumor) nodes sometimes get category data attached: the tumorCategorizationsMenu
// initiates that process.  the server supplies (nodeID, cluster|group, color) triples, one for
// each categorized tumor.  we place the group into a category field in the node's data, and collapse
// all the color/category assignments down into a few style rules.
// in this function, all of that (possibly) present information is stripped out.
function clearTumorCategoriesAndCategoryStyles()
{
   var patientNodes = cwMarkers.nodes("node[nodeType ='patient']");
   cwMarkers.batch(function(){
      patientNodes.map(function(e){if("category" in e.data()) delete e.data().category;});
      });
      
   var oldStyle = cwMarkers.style().json();
   var newStyle = oldStyle.filter(function(e){return(e.selector.indexOf("node[category"));});
   cwMarkers.style(newStyle);
  postStatus("clearTumorCategoryStyles complete");

} // clearTumorCategoriesAndCategoryStyles
//----------------------------------------------------------------------------------------------------
function requestTumorCategorization()
{
  var allCategoryNames = tumorCategorizationsMenu.children().map(function() {return $(this).val();}).get();
  var menuTitle = allCategoryNames[0];
  var categorizationName = tumorCategorizationsMenu.val();

  console.log("--- requestTumorCategorization, name: " + categorizationName);

  if(categorizationName === menuTitle || categorizationName === "Clear"  || categorizationName === null){
     clearTumorCategoriesAndCategoryStyles();
     return;
     } // clear
     
  console.log("apply " + categorizationName);
  hub.logEventOnServer(thisModulesName, "markersApplyTumorCategorization", "request", "");

  var msg = {cmd: "getSampleCategorization", callback: "markersApplyTumorCategorization",
             status: "request", payload: categorizationName};

  hub.send(JSON.stringify(msg));

} // requestTumorCategorization
//----------------------------------------------------------------------------------------------------
function applyTumorCategorization(msg)
{
   console.log("=== applyTumorCategorization");
   var tumorsInGraph = cwMarkers.nodes("[nodeType='patient']");
   var tumorsInTable = msg.payload.rownames;
   var tbl = msg.payload.tbl;
   var categoryRules = {};
   tbl.forEach(function(row){categoryRules[row[0]] = row[1];});


        /* jshint ignore:start */
	//debugger;
	/* jshint ignore:end */

   categoryRuleNames = Object.keys(categoryRules);
   categoryRuleNames.filter(function(name){return name !== "null";});
   categoryRuleNames.filter(function(name){return name !== null;});
   var newRules = [];

   categoryRuleNames.forEach(function(name){
      var selector = "node[category='" + name + "']";
      color=categoryRules[name];
      console.log(selector + ": " + color);
      newRules.push({"selector": selector, "style": {"background-color": color}});
      var selector2 = selector + ":selected";
      newRules.push({"selector": selector2, "style": {"border-color": "red",
                                                      "background-color": color,
                                                      "border-width": "10px"}});
      });

      // category=unassigned nodes are rendered in grey
   newRules.push({"selector": "node[category='unassigned']",
                     style: {"background-color": "lightgray"}});

     // but get the standard treatment when selected
   newRules.push({"selector": "node[category='unassigned']:selected",
                     style: {"border-color": "red",
                             "background-color": "lightgray",
                             "border-width": "10px"}});

   hub.logEventOnServer(thisModulesName, "markersApplyTumorCategorization", "data received", "");

   console.log("starting tumorsInGraph.forEach");
   cwMarkers.batch(function() {
      tumorsInGraph.forEach(function(node, index){
        var nodeID = node.id();  // our convention is that this is the tumor name, eg, "TCGA.02.0014"
        var indexInTable = tumorsInTable.indexOf(nodeID);
        if(indexInTable >= 0){
           var cluster = tbl[indexInTable][0];
           var color = tbl[indexInTable][1];
           node.data({category: cluster});
           }
        else{
           node.data({category: "unassigned"});
           }
         }); // forEach
       }); // batch

  console.log("ending tumorsInGraph.forEach");

  var oldStyle = cwMarkers.style().json();
     // remove any pre-existing node category rules
  var oldStyleClean = oldStyle.filter(function(e){return(e.selector.indexOf("node[category"));});

  var newStyle = oldStyleClean.concat(newRules);
  cwMarkers.style(newStyle);
  
  postStatus("applyTumorCategorization complete");
  hub.logEventOnServer(thisModulesName, "markersApplyTumorCategorization", "node category assigned", "");

} // applyTumorCategorization
//----------------------------------------------------------------------------------------------------
function doGraphOperation()
{
   var operation = graphOperationsMenu.val();

   switch(operation){
      case "Show All Edges":
         showAllEdges();
         break;
      case "Show Edges from Selected Nodes":
         //showEdgesFromSelectedNodes();
         showEdgesFromSelectedNodes();
         break;
      case "Hide All Edges":
         hideAllEdges();
         break;
      case "Invert Node Selection":
         invertSelection();
         break;
      case "Clear Selections":
         cwMarkers.filter('node:selected').unselect();
         break;
      case "Select All Connected Nodes":
         selectAllConnectedNodes();
         break;
      case "Select All Nodes with Selected Edges":
        selectAllNodesConnectedBySelectedEdges();
        break;
      case "Hide Unselected Nodes":
         cwMarkers.filter("node:unselected").hide();
         break;
      case "Show All Nodes":
         cwMarkers.filter('node:hidden').show();
         break;
      case "Restrict Next Ops to Selected Nodes":
         restrictNextOpsToSelectedNodes();
         break;
      default:
         console.log("unrecoginized graph operation requested from menu: " + operation);
      } // switch

      // restore menu to initial condition, with only title showing
   graphOperationsMenu.val("Network Operations...");

} // doGraphOperation
//----------------------------------------------------------------------------------------------------
function clearSelection ()
{
   cwMarkers.elements().unselect();
}
//----------------------------------------------------------------------------------------------------
function selectFirstNeighbors ()
{
  selectedNodes = cwMarkers.filter('node:selected');
  showEdgesForNodes(cwMarkers, selectedNodes);
}
//----------------------------------------------------------------------------------------------------
function invertSelection ()
{
   selected = cwMarkers.filter("node:selected");
   unselected = cwMarkers.filter("node:unselected");
   selected.unselect();
   unselected.select();
}
//----------------------------------------------------------------------------------------------------
function hideAllEdges ()
{
     // hide all edges besides chromsome edges
  cwMarkers.edges().fnFilter(function(edge) {
     return(edge.data("edgeType") != "chromosome");
     }).hide();

} // hideAllEdges
//----------------------------------------------------------------------------------------------------
function showAllEdges ()
{
   var edgeTypesToDisplay = edgeTypeSelector.val();

   console.log("edgeTypeToDisplay: " + edgeTypesToDisplay);

   if(edgeTypesToDisplay === null){
      return;
      }

   for(var e=0; e < edgeTypesToDisplay.length; e++){
      var type =  edgeTypesToDisplay[e];
      selectionString = '[edgeType="' + type + '"]';
      //console.log(" showAllEdges selection string: " + selectionString);
      cwMarkers.edges(selectionString).show();
      } // for e

} // showAllEdges
//----------------------------------------------------------------------------------------------------
function zoomSelected()
{
   cwMarkers.fit(cwMarkers.$(':selected'), 100);
}
//----------------------------------------------------------------------------------------------------
function handleIncomingIdentifiers(msg)
{
   console.log("Module.markers, handleIncomingIdentifiers");
      // expect 3 payload fields: value, count, source
   var ids = msg.payload.value; 
   if(typeof(ids) == "string")
      ids = [ids];
   //intersectingIDs = hub.intersectionOfArrays(ids, nodeNames())
   intersectingIDs = hub.intersectionOfArrays(ids, nodeIDs());
   console.log("found ids: " + intersectingIDs.length);

   if(intersectingIDs.length > 0){
      selectNodesByID(intersectingIDs);
      }
   else{
      errorMessage = "No overlap with genes or tissue sample IDs:  <br><br>" +
                      ids.join(", ");
      title = ids.length + " unrecognized identifiers";
      console.log("+++++++++++ creating error div");
      $('<div id="markersIncomingIdentifiersErrorDialog" />').html(errorMessage).dialog({title: title, width:600, height:300});
      }

   console.log("about to post status from incoming identifiers");
   postStatus("incoming identifiers: " + ids.length);

   hub.raiseTab(thisModulesOutermostDiv);

} // handleIncomingIdentifiers
//----------------------------------------------------------------------------------------------------
  // run all that should happen when this module receives an incoming selection of patientIDs
function demoMarkersIncomingSelectionOfIDs()
{

   names = ["TCGA.06.0210", "TCGA.02.0106", "TCGA.02.0111",
            "TCGA.06.0194", "TCGA.06.0164", "TCGA.06.0409", "TCGA.02.0004",
            "TCGA.02.0051", "TCGA.08.0390", "TCGA.02.0025", "TCGA.08.0392",
            "TCGA.02.0079", "TCGA.12.0620", "TCGA.08.0373", "TCGA.06.0645",
            "TCGA.06.0192", "TCGA.12.0776", "TCGA.12.0778", "TCGA.06.0750",
            "TCGA.06.0878", "TCGA.14.0789", "TCGA.06.0881", "BCL11A",
            "BRCA1", "MDM2", "PIK3R1", "ABCA1", "CDK6", "CNTRL", "FH",
            "IFNA1", "LMO2", "PRKCA", "RELA", "STK11", "ZEB1", "CCNB1IP1",
            "CREB3L1", "GDF2", "OR4K2", "PRKCH", "WAS"];

   subset = [];
   for(var i=0; i < 10; i++)
     subset.push(names[getRandomInt(0, names.length -1)]);

   selectNodes(subset);

} // demoIncomingSelectionOfPatientIDs
//----------------------------------------------------------------------------------------------------
function allNodeIDs()
{
   ids = [];
   allNodes = cwMarkers.nodes();

   for(i=0; i < allNodes.length; i++)
       ids.push(allNodes[i].data("id"));

   return(ids);

} // allNodeIDs
//----------------------------------------------------------------------------------------------------
function showEdges()
{
   hideAllEdges();   // is this wise?

   var edgeTypesToDisplay = edgeTypeSelector.val();
   if(edgeTypesToDisplay === null){
      hideAllEdges();
      return;
      }

   var selectedNodes = selectedNodeIDs(cwMarkers);

   //console.log(" newEdgeTypeSelection (" + edgeTypesToDisplay.length + 
   //            "), selectedNodes: " + selectedNodes.length);

   if(selectedNodes.length > 0) { // show edges to and from all selected nodes
     showEdgesForNodes(cwMarkers, selectedNodes);
     }

} // showEdges
//----------------------------------------------------------------------------------------------------
function zoomSelection()
{
   cwMarkers.fit(cwMarkers.$(':selected'), 50);
}
//----------------------------------------------------------------------------------------------------
function selectedNodeIDs(cw)
{
   ids = [];
   noi = cw.filter('node:selected');
   for(var n=0; n < noi.length; n++){
     ids.push(noi[n].data('id'));
     }
  return(ids);

} // selectedNodeIDs
//----------------------------------------------------------------------------------------------------
function selectedNodeNames(cw)
{
   var names = [];
   var noi = cw.filter('node:selected');
   for(var n=0; n < noi.length; n++){
     names.push(noi[n].data('name'));
     }

  return(names);

} // selectedNodeNames
//----------------------------------------------------------------------------------------------------
function showEdgesFromSelectedNodes()
{
   
   var targets = nodeRestriction;
   var selectedNodes = cwMarkers.nodes("node:selected");
   var neighbors = selectedNodes.neighborhood();
   var candidateEdges = neighbors.filterFn(function(e){
       if(e.isEdge()) return (e);
       });

   candidateEdges = candidateEdges.fnFilter(function(edge){
      return(edgeTypeSelector.val().indexOf(edge.data("edgeType")) >= 0);
      });

   if(targets.length === 0){
      candidateEdges.show();
      postStatus("showEdgesFromSelectedNodes");
      return;
      }

   function intersects(array1, array2){
      var size = array1.filter(function(n) {return (array2.indexOf(n) != -1);}).length;
      return(size > 0);
      }

   candidateEdges.filterFn(function(edge){
      var actual=edge.connectedNodes().map(function(node){return node.id();});
      return(intersects(actual, targets));
       }).show();

   postStatus("showEdgesFromSelectedNodes");

} // showEdgesFromSelectedNodes
//----------------------------------------------------------------------------------------------------
function selectSourceAndTargetNodesOfEdges(cw, edges)
{
  //var eoi = cwMarkers.filter('edge:visible');
  var notChromosomal = function(edge){return(edge.data("edgeType") !== "chromosome");};
  eoi = edges.filterFn(notChromosomal);

  var filterStrings = [];

  for(var i=0; i < eoi.length; i++){
     edge = eoi[i];
     targetID = edge.target().data("id");
     sourceID = edge.source().data("id");
     var sourceFilterString = '[id="' + sourceID + '"]';
     var targetFilterString = '[id="' + targetID + '"]';
     filterStrings.push(sourceFilterString);
     filterStrings.push(targetFilterString);
     } // for i

   var nodesToSelect = cw.nodes(filterStrings.join());
   nodesToSelect.select();

} // selecteSourceAndTargetNodesOfEdge
//----------------------------------------------------------------------------------------------------
// todo: massive inefficiencies here
function showEdgesForNodes(cw, nodes)
{

  var edgeTypes = edgeTypeSelector.val();
  console.log("=== showEdgesForNodes, edgeType count: " + edgeTypes.length);
  //console.log(edgeTypes);

  if(edgeTypes.length === 0)
      return;

  var filterStrings = [];

  setTimeout(function(){
     for(var e=0; e < edgeTypes.length; e++){
        var edgeType = edgeTypes[e];
        for(var n=0; n < nodes.length; n++){
          var nodeID = nodes[n].data("id");
          var sourceFilterString = '[edgeType="' + edgeType + '"][source="' + nodeID + '"]';
          var targetFilterString = '[edgeType="' + edgeType + '"][target="' + nodeID + '"]';
          filterStrings.push(sourceFilterString);
          filterStrings.push(targetFilterString);
          } // for n
        } // for e

      //console.log("filterString count: " + filterStrings.length);
      filter = filterStrings.join();
      //console.log("filter created, about to apply...");
      var existingEdges = cw.edges(filter);
      //console.log("filtering complete");
      if(existingEdges.length > 0) {
         //console.log("about to show edges");
         existingEdges.show();
         //console.log("edges shown...");
         }
     }, 0); // setTimeout

} // showEdgesForNodes
//----------------------------------------------------------------------------------------------------
function selectAllConnectedNodes()
{
    var selectedEdges = cwMarkers.filter("edge:visible");
    selectedEdges = selectedEdges.filterFn(function(e){return (e.data("edgeType") !== "chromosome");});
    if(selectedEdges.length > 0)
       selectSourceAndTargetNodesOfEdges(cwMarkers, selectedEdges);

} // selectAllConnectedNodes
//----------------------------------------------------------------------------------------------------
function selectAllNodesConnectedBySelectedEdges()
{
    edges = cwMarkers.filter("edge:selected");
    console.log(" selected edge count: " + edges.length);
    if(edges.length === 0)
      return;
    for(var e=0; e < edges.length; e++){
       selectNodes(edges[e].target().data("name"));
       selectNodes(edges[e].source().data("name"));
       } // for e

} //selectAllNodesConnectedBySelectedEdges
//----------------------------------------------------------------------------------------------------
function showEdgesForSelectedNodes(cw, edgeTypes)
{
   var nodeIDs = selectedNodeIDs(cw);
   for(var n=0; n < nodeIDs.length; n++){
      nodeID = nodeIDs[n];
      for(var e=0; e < edgeTypes.length; e++){
         edgeType = edgeTypes[e];
         filterString = '[edgeType="' + edgeType + '"][source="' + nodeID + '"]';
         //console.log("filter string: " + filterString);
         cw.edges(filterString).show();
         filterString = '[edgeType="' + edgeType + '"][target="' + nodeID + '"]';
         //console.log("filter string: " + filterString);
         cw.edges(filterString).show();
         } // for e
      } // for n

} // showEdgesForSelectedNodes
//----------------------------------------------------------------------------------------------------
function restrictNextOpsToSelectedNodes()
{
  var nodes = cwMarkers.nodes("node:selected"); // .filter("[nodeType='gene']");
  if(nodes.length === 0){
     nodeRestriction = [];
     }
  else{
     nodeRestriction = nodes.map(function(node){return (node.id());});
     }

} // restrictNextOpsToSelectedNodes
//----------------------------------------------------------------------------------------------------
function nodeNames()
{
  var nodes = cwMarkers.filter("node:visible");
  var result = [];
  for(var i=0; i < nodes.length; i++){
    result.push(nodes[i].data().label);
    } // for i

  return(result);

} // nodeNames
//----------------------------------------------------------------------------------------------------
function nodeIDs()
{
   return(cwMarkers.nodes().map(function(node){return (node.id());}));
}
//----------------------------------------------------------------------------------------------------
function upperCaseNodeIDs()
{
   return(nodeIDs().map(function(node){return(node.toUpperCase());}));
}
//----------------------------------------------------------------------------------------------------
// todo: build up the filter string first, then send it all at once
function selectNodes(nodeNames)
{
  console.log("Module.markers::selectNodes");
  //console.log(nodeNames);

  if(typeof(nodeNames) == "string")   // trap scalar, but expect and support arrays
     nodeNames = [nodeNames];

  var allNodes = cwMarkers.nodes().map(function(n){return (n.id());});
  var allNodesUpperCase = allNodes.map(function(name){return (name.toUpperCase());});

  for(var i=0; i < nodeNames.length; i++){
    var nodeName = nodeNames[i].toUpperCase();  // depends upon this conv
    var index = allNodesUpperCase.indexOf(nodeName);
    if(index >= 0){
      var actualNodeID = allNodes[index];
      var s = "cwMarkers.filter('node[id=\"" + actualNodeID + "\"]').select()";
       //console.log("markers selectNodes: " + s);
       JAVASCRIPT_EVAL (s);
       } // if found, index >= 0
    } // for i

   postStatus("nodes selected: " + allNodes.length);

} // selectNodes
//----------------------------------------------------------------------------------------------------
   // todo: build up the filter string first, then send it all at once
function selectNodesByID(nodeIDs) {

  if(typeof(nodeIDs) == "string")   // trap scalar, but expect and support arrays
     nodeIDs = [nodeIDs];

  console.log("about to select nodes by id: " + nodeIDs.length);
  console.log(nodeIDs);

  for(var i=0; i < nodeIDs.length; i++){
    s = "cwMarkers.filter('node[id=\"" + nodeIDs[i] + "\"]').select()";
    console.log(s);
    JAVASCRIPT_EVAL (s);
    } // for i

} // selectNodesByID
//----------------------------------------------------------------------------------------------------
function doSearch(e)
{
   var keyCode = e.keyCode || e.which;

   if (keyCode == 13) {
      var searchString = searchBox.val().toUpperCase();
      if(searchString.length === 0)
         return;
      console.log("searchString: " + searchString);
      var idsActual = nodeIDs();
      var idsUpper = upperCaseNodeIDs();
      var hits = idsUpper.filter(function(id) {return(id.indexOf(searchString) === 0);});
      var hitIndices = hits.map(function(hit) {return(idsUpper.indexOf(hit));});
      var hitsActual = hitIndices.map(function(hit) {return(idsActual[hit]);});
      selectNodes(hitsActual);
      } // if 13 (return key)

} // doSearch
//----------------------------------------------------------------------------------------------------
function displayMarkersNetwork(msg)
{
   console.log("--- Module.markers: displayMarkersNetwork");
	var messageText = "Loading Network...(this may take ~10 seconds due to the number of nodes and edges, please be patient"
    var el = document.getElementById("loadingDatasetMessage");
	el.innerHTML = messageText;
		
   hub.logEventOnServer(thisModulesName, "display markers network", "data received", "");
  
   if(msg.status == "success"){
         var json = JSON.parse(msg.payload);

   window.setTimeout(function(){
         console.log("nchar(network): " + msg.payload.length);
         cwMarkers.batch(function(){
           cwMarkers.remove(cwMarkers.edges());
           cwMarkers.remove(cwMarkers.nodes());
           console.log(" after JSON.parse, json.length: " + json.length);
           console.log("  about to add json.elements");
           cwMarkers.add(json.elements);
           // map current node degree into a node attribute of that name
       }) 
      
   }, 100);	

	window.setTimeout(function(){
		messageText ="Mapping Edges..."
		el.innerHTML = messageText;

		  cwMarkers.batch(function(){
			   cwMarkers.style(json.style);
			   cwMarkers.edges().hide();
			   cwMarkers.nodes().unselect();
		  })
        
        cwMarkers.nodes().map(function(node){node.data({degree: node.degree(), trueWidth: node.width(), trueHeight: node.height()});});
        cwMarkers.filter("edge[edgeType='chromosome']").style({"curve-style": "bezier"});
        cwMarkers.filter("edge[edgeType='chromosome']").show();

		  var edgeTypes = hub.uniqueElementsOfArray(cwMarkers.edges().map(function(edge){
									  return(edge.data("edgeType"));}
									  ));
			 updateEdgeSelectionWidget(edgeTypes);  // preserve only known edgeTypes
		  var defaultLayout = JSON.stringify(cwMarkers.nodes().map(function(n){
											 return({id:n.id(), position:n.position()});}));
		  localStorage.markersDefault = defaultLayout;
		  defaultPatientNodeColor = cwMarkers.nodes("[nodeType='patient']").style("background-color");

		  hub.logEventOnServer(thisModulesName, "display markers network", "complete", "");

			//postStatus("markers network displayed");  // deferred; set when the category menu is configured

		  hub.logEventOnServer(thisModulesName, "getSampleCategorizationNames", "request", "");

		 cwMarkers.resize();
		 cwMarkers.fit(50);

     var msg2 = {cmd: "getSampleCategorizationNames", callback: "configureSampleCategorizationMenu",
                  status: "request", payload: ""};
      hub.send(JSON.stringify(msg2));

    }, 100);	
      }
   else{
     console.log("displayMarkersNetwork error: " + msg.payload);
     }


} // displayMarkersNetwork
//----------------------------------------------------------------------------------------------------
function postStatus(msg)
{
  statusDiv.text(msg);

} // postStatus
//----------------------------------------------------------------------------------------------------
// ensure that only edgeTypes in current network are offered in the selection widget
function updateEdgeSelectionWidget(edgeTypes)
{
     // loop over currently offered edge types
     //             <option value="mutation" class="btn-info" selected>Mut</option>

   var edgeTypeMenu = $("#markersEdgeTypeSelector");
   edgeTypeMenu.find('option').remove();
   edgeTypeMenu.trigger("chosen:updated");
   
   edgeTypes = edgeTypes.filter(function(e){return(e !== "chromosome");});

   for(var i=0; i < edgeTypes.length; i++){
      var name = edgeTypes[i];
      var optionMarkup =  "<option value='" + name + "' class='btn-info' selected>" + name + "</option>";
      $("#markersEdgeTypeSelector").append(optionMarkup);
      }
      
   $("#markersEdgeTypeSelector").trigger("chosen:updated");

} // updateEdgeSelectionWidget
//----------------------------------------------------------------------------------------------------
// called when the a dataset has been specified, typically via the Datasets tab, which presents
// the user with a list of the datasets they are able to use, from which they choose one at a time
// as their current working dataset.
// this module uses the dataset name to request the g.markers.json network from the server
function datasetSpecified (msg)
{
   var datasetName = msg.payload;

   hub.logEventOnServer(thisModulesName, "display markers network", "request", "");
   $("#markersAndPatientsDiv").css("display", "block");

   var newMsg = {cmd: "getMarkersNetwork",  callback: "displayMarkersNetwork", status: "request", payload: datasetName};
   hub.send(JSON.stringify(newMsg));

} // datasetSpecified
//----------------------------------------------------------------------------------------------------
function configureSampleCategorizationMenu(msg)
{
   console.log("=== configureSampleCategorizationMenu");
   //console.log(msg.payload);
   tumorCategorizationsMenu.empty();
   var categorizations = msg.payload;

   if(typeof categorizations == "string") 
   	 categorizations = [categorizations];

   var titleOption = "Tumor Groups...";

   tumorCategorizationsMenu.append("<option>" + titleOption + "</option>");
   tumorCategorizationsMenu.append("<option>Clear</option>");

   for(var i=0; i < categorizations.length; i++){
     tumorCategorizationsMenu.append("<option>" + categorizations[i] + "</option>");
     } // for i

   tumorCategorizationsMenu.val(titleOption);
   hub.logEventOnServer(thisModulesName, "getSampleCategorizationNames",  "complete", "");
   
   hub.enableTab(thisModulesOutermostDiv);
   postStatus("markers network displayed");

   $("#datasetsManifestTable").css("display", "block");
   $("#loadingDatasetMessage").css("display", "none");

	cwMarkers.fit(50);

} // configureSampleCategorizationMenu
//----------------------------------------------------------------------------------------------------

 return{
     init: function(){
        hub.addMessageHandler("sendSelectionTo_MarkersAndPatients", handleIncomingIdentifiers);
        hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
        hub.addMessageHandler("datasetSpecified", datasetSpecified);
        hub.addMessageHandler("displayMarkersNetwork", displayMarkersNetwork);
        hub.addMessageHandler("configureSampleCategorizationMenu", configureSampleCategorizationMenu);
        hub.addMessageHandler("markersApplyTumorCategorization", applyTumorCategorization);
        hub.addOnDocumentReadyFunction(initializeUI);
       }
     };

   }); // markersAndTissuesModule
//----------------------------------------------------------------------------------------------------
markersModule = markersAndTissuesModule();
markersModule.init();
