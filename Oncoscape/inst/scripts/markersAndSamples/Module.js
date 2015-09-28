//----------------------------------------------------------------------------------------------------
// move these all back inside module scope when debugging is done
var cwMarkers;
var XXX;
var nodeRestriction = [];
var subSelectButton;

//----------------------------------------------------------------------------------------------------
var markersAndTissuesModule = (function () {

  var statusDiv; 
  var cyDiv;
  var searchBox;
  var hideEdgesButton, showEdgesButton, showAllEdgesButton, clearSelectionButton, sfnButton;
  var helpButton;
  var infoMenu;
  var edgeTypeSelector;
  var mouseOverReadout;
  var graphOperationsMenu;
  var tumorCategorizationsMenu;
  var tumorCategorizationsMenuTitle = "Tumor Groups...";
  var sendSelectionsMenu;
  var layoutMenu;
  var thisModulesName = "MarkersAndPatients";
  var thisModulesOutermostDiv = "markersAndPatientsDiv";

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

  tumorCategorizationsMenu = $("#cyMarkersTumorCategorizationsMenu");
  tumorCategorizationsMenu.empty()
  tumorCategorizationsMenu.append("<option>" + tumorCategorizationsMenuTitle + "</otpion>");
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
   hideEdgesButton.click(hideAllEdges)


   searchBox = $("#markersAndTissuesSearchBox");

   edgeTypeSelector = $("#markersEdgeTypeSelector");
   mouseOverReadout = $("#markersAndTissuesMouseOverReadout");
   configureCytoscape();
   $(".chosen-select").chosen();
   $(window).resize(handleWindowResize);

   subSelectButton = $("#markersSubSelectButton");
   subSelectButton.click(subSelectNodes);

   setInterval(function(){
      var count = cwMarkers.nodes("node:selected").length;
      var disable = (count == 0);
      sendSelectionsMenu.attr("disabled", disable);
      subSelectButton.attr("disabled", disable);
      }, 500);
 

} // initializeUI
//----------------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();
   console.log("CyMarkers send selections to " + destination);
   sendSelectionsMenu.val(sendSelectionsMenuTitle);
   var nodeNames = selectedNodeNames(cwMarkers);
   if(nodeNames.length == 0){
      console.log("no nodes selected!")
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
            return{id:n.id(), position:n.position()}}));

   localStorage.markersDefault = defaultLayout;

   var existingLayouts = Object.keys(localStorage);
   for(var i=0; i < existingLayouts.length; i++){
      if(existingLayouts[i].match("markers") != null){
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
     currentLayout = JSON.stringify(cwMarkers.nodes().map(function(n){return{id:n.id(), position:n.position()}}));
     localStorage[newName] = currentLayout;
     layoutMenu.append("<option>" + newName + "</option>");
     layoutMenu.val(newName);
     return;
     }

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
   if(nodeNames.length == 0){
      console.log("no nodes selected!")
      return;
      }
   metadata = {};
   sendSelectionToModule(destinationModule, nodeNames, metadata);
   sendSelectionsMenu.val("Send Selection...");

}; // sendSelectionsMenuChanged
//--------------------------------------------------------------------------------------------
function configureCytoscape ()
{
  cwMarkers = $("#cyMarkersDiv");
  cwMarkers.cytoscape({
     boxSelectionEnabled: true,
     showOverlay: false,
     minZoom: 0.01,
     maxZoom: 8.0,
     layout: {
       name: "preset",
       fit: true
       },
   ready: function() {
      console.log("cwMarkers ready");
      cwMarkers = this;
      cwMarkers.on('mouseover', 'node', function(evt){
         var node = evt.cyTarget;
         mouseOverReadout.val(node.id());
         })
      cwMarkers.on('mouseout', 'node', function(evt){
         var node = evt.cyTarget;
         mouseOverReadout.val("");
         })
      cwMarkers.on('mouseover', 'edge', function(evt){
         var edge = evt.cyTarget;
         var d = edge.data();
         var msg = d.edgeType + ": " + d.source + " - " + d.target;
         var mutation = d.mutation
         if(typeof(mutation) == "string")
            msg = mutation + " " + msg;
         mouseOverReadout.val(msg);
         })

      //cwMarkers.on('select', 'node', function(evt){
      //   console.log("cwMarkers.on('select', 'node')");
      //   var disable = selectedNodeIDs(cwMarkers).length == 0;
      //   sendSelectionsMenu.attr("disabled", disable);
      //   })
      //cwMarkers.on('unselect', 'node', function(evt){
      //   var disable = selectedNodeIDs(cwMarkers).length == 0;
      //   sendSelectionsMenu.attr("disabled", disable);
      //   })

      cwMarkers.filter("edge[edgeType='chromosome']").style({"curve-style": "bezier"});
      cwMarkers.filter("edge[edgeType='chromosome']").show();
      searchBox.keydown(doSearch);

      console.log("cwMarkers.reset");
      cwMarkers.reset();
      handleWindowResize();
      cwMarkers.edges().selectify(); // this seems to hold through session, visibility notwithstanding
      //hideAllEdges();
      configureLayoutsMenu(layoutMenu);
      }, // cy.ready
     }) // .cytoscape
    .cytoscapePanzoom({ });   // need to learn about options

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
// there are often subgroups among a selected node.
// here we opreate only on those distinguished by different node border color
// the dialog posted here provided interactive select/deselect of those originally
// selected nodes, by color.
// this function could be made smarter by being made avaialble (via the subselect button) only
// if multiple border colors are found within the currently selected nodes
//
function subSelectNodes()
{
  var selectedNodes = cwMarkers.nodes("node:selected");
  var borderColors =  jQuery.unique(selectedNodes.map(function(node){return node.style("border-color")}));
  console.log(JSON.stringify(borderColors));

  var content = "<form action=''>";
  for(i=0; i < borderColors.length; i++){
     var color = borderColors[i];
     var e = "<input type='checkbox' class='markersSubSelectRadioButton' name='" + color + "' checked> " + color + "<br>";
     content = content + e
     }
  content = content + "</form>";
  button = "<br><br><button id='markersSubSelectCloseButton'>Close</button>";

  content = content + button;

  var dialog =  $('<div id="markersSubSelectDialog" />').html(content).dialog();

  $("#markersSubSelectCloseButton").click(function(){
     console.log("close dialog")
     $("#markersSubSelectDialog").remove();
     });

  $(".markersSubSelectRadioButton").click(function(e) {
      console.log("radio!"); 
      console.log(this.name + " " + this.checked);
      var color = this.name;
      var selectSubset = this.checked;
      var subsetNodes = selectedNodes.filterFn(function(node) {return node.style("border-color") == color});
      if(selectSubset)
         subsetNodes.select();
      else
         subsetNodes.unselect();
      }); // radio button click

} // subSelectNodes
//----------------------------------------------------------------------------------------------------
function requestTumorCategorization()
{
  var categorizationName = tumorCategorizationsMenu.val();
  console.log("apply " + categorizationName);

  var msg = {cmd: "getSampleCategorization", callback: "markersApplyTumorCategorization",
             status: "request", payload: categorizationName};

  hub.send(JSON.stringify(msg));

  tumorCategorizationsMenu.val(tumorCategorizationsMenuTitle);

} // requestTumorCategorization
//----------------------------------------------------------------------------------------------------
function applyTumorCategorization(msg)
{
   console.log("=== applyTumorCategorization");
   var tumorsInGraph = cwMarkers.nodes("[nodeType='patient']")
   var tumorsInTable = msg.payload.rownames
   var tbl = msg.payload.tbl

   tumorsInGraph.forEach(function(node, index){
      var nodeID = node.id();  // our convention is that this is the tumor name, eg, "TCGA.02.0014"
      var indexInTable = tumorsInTable.indexOf(nodeID);
      if(indexInTable >= 0){
         var cluster = tbl[indexInTable][0];
         node.data({subType: cluster});
         }
      else{
         node.data({subType: "unassigned"});
         }
       }); // forEach

  cwMarkers.style().update();

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
   cwMarkers.filter('edge').hide();
}
//----------------------------------------------------------------------------------------------------
function showAllEdges ()
{
   var edgeTypesToDisplay = edgeTypeSelector.val();

   console.log("edgeTypeToDisplay: " + edgeTypesToDisplay);

   if(edgeTypesToDisplay == null){
      return;
      }

   for(var e=0; e < edgeTypesToDisplay.length; e++){
      var type =  edgeTypesToDisplay[e];
      selectionString = '[edgeType="' + type + '"]';
      //console.log(" showAllEdges selection string: " + selectionString);
      cwMarkers.edges(selectionString).show()
      } // for e

} // showAllEdges
//----------------------------------------------------------------------------------------------------
function zoomSelected()
{
   cwMarkers.fit(cwMarkers.$(':selected'), 100)
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
   intersectingIDs = hub.intersectionOfArrays(ids, nodeIDs())
   console.log("found ids: " + intersectingIDs.length);

   if(intersectingIDs.length > 0)
      selectNodesByID(intersectingIDs);
   else{
      errorMessage = "No overlap with genes or tissue sample IDs:  <br><br>" +
                      ids.join(", ");
      title = ids.length + " unrecognized identifiers";
      $('<div />').html(errorMessage).dialog({title: title, width:600, height:300});
      }

   hub.raiseTab(thisModulesOutermostDiv);

} // handleIncomingIdentifiers
//----------------------------------------------------------------------------------------------------
  // run all that should happen when this module receives an incoming selection of patientIDs
demoMarkersIncomingSelectionOfIDs = function()
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

   subset = []
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
       ids.push(allNodes[i].data("id"))

   return(ids);

} // allNodeIDs
//----------------------------------------------------------------------------------------------------
function showEdges()
{
   hideAllEdges();   // is this wise?

   var edgeTypesToDisplay = edgeTypeSelector.val();
   if(edgeTypesToDisplay == null){
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
// function showEdgesFromSelectedNodes()
// {
//    var selectedNodes = cwMarkers.filter('node:selected');
// 
//       // break out the selected nodes into the two groups we care about: 
//       //    genes & tumors (aka, patients)
// 
//    var tumorNodes = selectedNodes.filter("[nodeType='patient']");
//    var geneNodes  = selectedNodes.filter("[nodeType='gene']");
// 
//       // if any tumor node restriction is in force, only 
//       // the intersecton of that with our current selection is kept
// 
//    if(tumorNodeRestriction.length > 0){
//       var correctedTumorNodes = [];
//       tumorNodes.forEach(function(node){
//         if(tumorNodeRestriction.indexOf(node.id()) >= 0){
//            console.log("match!");
//            correctedTumorNodes.push(node);
//           } // if matched
//         }); // forEach
//      console.log("some tumor nodes restricted, some selected");
//      tumorNodes = correctedTumorNodes;   // 0 or more
//      } // some tumor nodes restricted
// 
//    if(geneNodeRestriction.length > 0){
//       var correctedGeneNodes = [];
//       geneNodes.forEach(function(node){
//        if(geneNodeRestriction.indexOf(node.id()) >= 0){
//          console.log("match!");
//          correctedTumorNodes.push(node);
//           } // if matched
//        }); // forEach
//     console.log("some gene nodes restricted, some selected");
//     geneNodes = correctedGeneNodes;   // 0 or more
//     } // some gene node restriction
//        
//    selectedNodes = tumorNodes;
//    geneNodes.forEach(function(node){selectedNodes.push(node)});
// 
//    if(selectedNodes.length == 0) {
//       return;
//       }
// 
//       // "closed" means that we have tumors and genes specified, and
//       // only want to find connections among them
// 
//    //var closedCandidates = FALSE;
// 
//    //if(tumorNodes.length > 0 & geneNodes.length > 0)
//    //   closedCandidates = TRUE;
// 
//    debugger;
//    showEdgesForNodes(cwMarkers, selectedNodes);
// 
// } // showEdgesFromSelectedNodes
//----------------------------------------------------------------------------------------------------
function zoomSelection()
{
   cwMarkers.fit(cwMarkers.$(':selected'), 50)

}
//----------------------------------------------------------------------------------------------------
function selectedNodeIDs(cw)
{
   ids = [];
   noi = cw.filter('node:selected');
   for(var n=0; n < noi.length; n++){
     ids.push(noi[n].data()['id']);
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
showEdgesFromSelectedNodes = function()
{
   var targets = nodeRestriction;
   var selectedNodes = cwMarkers.nodes("node:selected");
   var neighbors = selectedNodes.neighborhood();
   var candidateEdges = neighbors.filterFn(function(e) {if(e.isEdge()) return e})
   candidateEdges = candidateEdges.fnFilter(function(edge){
      return(edgeTypeSelector.val().indexOf(edge.data("edgeType")) >= 0)
      });

   if(targets.length == 0){
      candidateEdges.show();
      return;
      }

   function intersects(array1, array2){
      var size = array1.filter(function(n) {return array2.indexOf(n) != -1}).length;
      return(size > 0);
      }

   candidateEdges.filterFn(function(edge){
      var actual=edge.connectedNodes().map(function(node){return node.id()});
      return(intersects(actual, targets));
       }).show()

} // showEdgesFromSelectedNodes
//----------------------------------------------------------------------------------------------------
function selectSourceAndTargetNodesOfEdges(cw, edges)
{

  var edgesVisible = cwMarkers.filter('edge:visible').length

  var filterStrings = [];

  for(var i=0; i < edges.length; i++){
     edge = edges[i];
     targetID = edge.target().data("id")
     sourceID = edge.source().data("id")
     var sourceFilterString = '[id="' + sourceID + '"]';
     var targetFilterString = '[id="' + targetID + '"]';
     filterStrings.push(sourceFilterString);
     filterStrings.push(targetFilterString);
     } // for i

   var nodesToSelect = cw.nodes(filterStrings.join());
   nodesToSelect.select()

} // selecteSourceAndTargetNodesOfEdge
//----------------------------------------------------------------------------------------------------
  // todo: massive inefficiencies here
function showEdgesForNodes(cw, nodes)
{

  var edgeTypes = edgeTypeSelector.val();
  console.log("=== showEdgesForNodes, edgeType count: " + edgeTypes.length);
  console.log(edgeTypes);

  if(edgeTypes.length == 0)
      return;

  var filterStrings = [];

  $("body").toggleClass("wait");

  setTimeout(function(){
     for(var e=0; e < edgeTypes.length; e++){
        var edgeType = edgeTypes[e];
        for(var n=0; n < nodes.length; n++){
          var nodeID = nodes[n].data("id");
          var sourceFilterString = '[edgeType="' + edgeType + '"][source="' + nodeID + '"]';
          var targetFilterString = '[edgeType="' + edgeType + '"][target="' + nodeID + '"]';
          filterStrings.push(sourceFilterString)
          filterStrings.push(targetFilterString)
          } // for n
        } // for e

      console.log("filterString count: " + filterStrings.length);
      filter = filterStrings.join();
      console.log("filter created, about to apply...");
      var existingEdges = cw.edges(filter);
      console.log("filtering complete");
      if(existingEdges.length > 0) {
         console.log("about to show edges");
         existingEdges.show()
         console.log("edges shown...");
         }
     }, 1000); // setTimeout

  $("body").toggleClass("wait");

} // showEdgesForNodes
//----------------------------------------------------------------------------------------------------
function selectAllConnectedNodes()
{
    var selectedEdges = cwMarkers.filter("edge:visible");
    selectSourceAndTargetNodesOfEdges(cwMarkers, selectedEdges);

} // selectAllConnectedNodes
//----------------------------------------------------------------------------------------------------
function selectAllNodesConnectedBySelectedEdges()
{
    edges = cwMarkers.filter("edge:selected")
    console.log(" selected edge count: " + edges.length);
    if(edges.length == 0)
      return;
    for(var e=0; e < edges.length; e++){
       selectNodes(edges[e].target().data("name"))
       selectNodes(edges[e].source().data("name"))
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
  if(nodes.length == 0){
     nodeRestriction = [];
     }
  else{
     nodeRestriction = nodes.map(function(node){return node.id()})
     }

  debugger;

} // restrictNextOpsToSelectedNodes
//----------------------------------------------------------------------------------------------------
function nodeNames()
{
  var nodes = cwMarkers.filter("node:visible");
  var result = [];
  for(var i=0; i < nodes.length; i++){
    result.push(nodes[i].data().label)
    } // for i
  return(result)

} // nodeNames
//----------------------------------------------------------------------------------------------------
function nodeIDs()
{
   return(cwMarkers.nodes().map(function(node){return node.id()}));
}
//----------------------------------------------------------------------------------------------------
function upperCaseNodeIDs()
{
   return(nodeIDs().map(function(node){return(node.toUpperCase())}));
}
//----------------------------------------------------------------------------------------------------
// todo: build up the filter string first, then send it all at once
function selectNodes(nodeNames)
{
  console.log("Module.markers::selectNodes");
  console.log(nodeNames);

  if(typeof(nodeNames) == "string")   // trap scalar, but expect and support arrays
     nodeNames = [nodeNames];

  var allNodes = cwMarkers.nodes().map(function(n){return n.id()});
  var allNodesUpperCase = allNodes.map(function(name){return name.toUpperCase()});

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
    console.log(s)
    JAVASCRIPT_EVAL (s);
    } // for i

} // selectNodesByID
//----------------------------------------------------------------------------------------------------
function doSearch(e)
{
   var keyCode = e.keyCode || e.which;

   if (keyCode == 13) {
      var searchString = searchBox.val().toUpperCase();
      console.log("searchString: " + searchString);
      var idsActual = nodeIDs();
      var idsUpper = upperCaseNodeIDs();
      var hits = idsUpper.filter(function(id) {return(id.startsWith(searchString))});
      var hitIndices = hits.map(function(hit) {return idsUpper.indexOf(hit)});
      var hitsActual = hitIndices.map(function(hit) {return idsActual[hit]})
      selectNodes(hitsActual);
      } // if 13 (return key)

} // doSearch
//----------------------------------------------------------------------------------------------------
function displayMarkersNetwork(msg)
{
   console.log("--- Module.markers: displayMarkersNetwork");
   //console.log(msg)
   if(msg.status == "success"){
      console.log("nchar(network): " + msg.payload.length);
      s = msg.payload;
      XXX = msg.payload;
      console.log("      1:40: " + s.substring(1, 40));
      var json = JSON.parse(msg.payload);
      cwMarkers.remove(cwMarkers.edges());
      cwMarkers.remove(cwMarkers.nodes());
      console.log(" after JSON.parse, json.length: " + json.length);
      console.log("  about to add json.elements");
      cwMarkers.add(json.elements);
      console.log("  about to add  json.style");
      cwMarkers.style(json.style);
      console.log("   hiding edges");
      cwMarkers.edges().hide()
      cwMarkers.filter("edge[edgeType='chromosome']").style({"curve-style": "bezier"});
      cwMarkers.filter("edge[edgeType='chromosome']").show();
      cwMarkers.nodes().unselect();
        // map current node degree into a node attribute of that name
      cwMarkers.nodes().map(function(node){node.data({degree: node.degree()})});

      var edgeTypes = hub.uniqueElementsOfArray(cwMarkers.edges().map(function(edge){
                               return(edge.data("edgeType"))}
                               ));
      updateEdgeSelectionWidget(edgeTypes);  // preserve only known edgeTypes
      cwMarkers.fit(20);
      var defaultLayout = JSON.stringify(cwMarkers.nodes().map(function(n){
                                         return{id:n.id(), position:n.position()}}));
      localStorage["markersDefault"] = defaultLayout;
      postStatus("markers network displayed");
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
   var options = $("#markersEdgeTypeSelector").children();
   for(var i=0; i < options.length; i++){
      var optionElement = options[i];
      var optionValue = optionElement.value;
      var found = jQuery.inArray(optionValue, edgeTypes) >= 0
      console.log("checking option '" + optionValue + "':  " + found);
      if(!found){
         console.log("  deleting selector option " + optionValue);
         $("#markersEdgeTypeSelector option[value='" + optionValue + "']").remove();
         } // unrecognized edge type
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

     // request patient data table
   var newMsg = {cmd: "getMarkersNetwork",  callback: "displayMarkersNetwork", 
                status: "request", payload: datasetName};

   hub.send(JSON.stringify(newMsg));

   var msg2 = {cmd: "getSampleCategorizationNames", callback: "configureSampleCategorizationMenu",
               status: "request", payload: ""};

   hub.send(JSON.stringify(msg2));

} // datasetSpecified
//----------------------------------------------------------------------------------------------------
function configureSampleCategorizationMenu(msg)
{
   console.log("=== configureSampleCategorizationMenu")
   console.log(msg.payload)
   tumorCategorizationsMenu.empty()
   var categorizations = msg.payload;

   var titleOption = "Tumor Groups...";

   tumorCategorizationsMenu.append("<option>" + titleOption + "</option>");

   for(var i=0; i < categorizations.length; i++){
     tumorCategorizationsMenu.append("<option>" + categorizations[i] + "</option>");
     } // for i

   tumorCategorizationsMenu.val(titleOption);

} // configureSampleCategorizationMenu
//----------------------------------------------------------------------------------------------------
// this module supports (or soon will support) markers & patients (or markers & samples) networks
// for a variety of diseases and patient sets.  we will develop tests which know nothing beforehand
// about the data, but our first priority now (28 apr 2015) is for the lgg/gbm combined tcga 
// dataset
function standAloneTest()
{
   $("#qunit").css({display: "block"})

   gbmLggDzSpecificTests();

} // standAloneTest
//----------------------------------------------------------------------------------------------------
function gbmLggDzSpecificTests()
{
   QUnit.test("markersAndSamples: basic network test", function(assert){
      console.log("============= starting basic network test");
      assert.expect(2);
      console.log("about to check node count");
      assert.ok(cwMarkers.nodes().length > 1500);
      console.log("about to check edge count");
      assert.ok(cwMarkers.edges().length > 13000)
      console.log("end of test");
      });

  QUnit.test("markersAndSamples: select EGFR", function(assert){
     cwMarkers.nodes().unselect();
     assert.ok(cwMarkers.filter("node:selected").length == 0);
     cwMarkers.$("#EGFR").select();
     assert.ok(cwMarkers.filter("node:selected").length == 1);
     });


  QUnit.test("markersAndSamples: choose edge types", function(assert){
     edgeTypes = $("#markersEdgeTypeSelector option").map(function(opt){return this.value})
     var desiredEdgeType = "chromosome";

     if($.inArray(desiredEdgeType, edgeTypes) < 0){
        alert("cannot run tests:  " + desiredEdgeType + " edgeType not available");
        return;
        }

     $("#markersEdgeTypeSelector").val(desiredEdgeType)
     $("#markersEdgeTypeSelector").trigger("change")
     console.log("=== edge type selected: " + $("#markersEdgeTypeSelector").val());
     assert.equal($("#markersEdgeTypeSelector").val(), desiredEdgeType);
     assert.equal(cwMarkers.filter("node:selected").length, 1);
       // now restore the original settings. 
     $("#markersEdgeTypeSelector").val(["chromosome", "mutation", "cnGain.2", "cnLoss.2", "cnGain.1", "cnLoss.1"])
     $("#markersEdgeTypeSelector").trigger("change");
     });

  QUnit.test("markersAndSamples: select chrom edges from EGFR", function(assert){
      var desiredAction = "Show Edges from Selected Nodes";
      var actions = $("#cyMarkersOperationsMenu option").map(function(x) {return this.value});

      if($.inArray(desiredAction, actions) < 0){
         alert("cannot run tests:  " + desiredAction + " not available");
         return;
         }

     cwMarkers.edges().hide()
     assert.equal(cwMarkers.filter("edge:visible").length, 0);
     $("#cyMarkersOperationsMenu").val(desiredAction);
     $("#cyMarkersOperationsMenu").trigger("change");
     assert.expect(1); // specify number of assertions which should run
     setTimeout(function() {  // takes a little while for the edge to be rendered
        assert.equal(cwMarkers.filter("edge:visible").length, 1);
        }, 2000);
     });


  QUnit.test("markersAndSamples: search and select EGFR", function(assert){
     cwMarkers.nodes().unselect();
     assert.equal(cwMarkers.filter("node:selected").length, 0);
     var targetNode = "EGFR";
     $("#markersAndTissuesSearchBox").val(targetNode);
     var e = jQuery.Event("keydown");
     e.which = 13;  
     $("#markersAndTissuesSearchBox").trigger(e);
     var selectedNode = cwMarkers.filter("node:selected")
     assert.equal(selectedNode.length, 1);
     assert.equal(selectedNode.data().id, targetNode);
     });


} // gbmLggDzSpecificTests
//----------------------------------------------------------------------------------------------------
// query the oncoscape server for user id.  the callback then makes a local (that is,
// Module-specific) decision to run this module's automated tests based upon that id
function runAutomatedTestsIfAppropriate()
{
   console.log("Module.markers, runAutomatedTestsIfAppropriate");

   var msg = {cmd: "getUserId",  callback: "markersAssessUserIdForTesting",
              status: "request", payload: ""};

   hub.send(JSON.stringify(msg));

} // runAutomatedTestsIfAppropriate
//----------------------------------------------------------------------------------------------------
function assessUserIdForTesting(msg)
{
   var userID = msg.payload;
   userId = userID.toLowerCase();

   console.log("markersAndSamples/Module.js assesUserIdForTesting: " + userID)
   
   if(userID.indexOf("autotest") === 0){
      console.log("markersAndSamples/Module.js running tests for user " + userID)
      debugger;
      mast = MarkersAndSamplesTestModule();
      mast.show()
      mast.run();
      }

} // assessUserIdForTesting
//----------------------------------------------------------------------------------------------------
 return{
     init: function(){
        hub.addMessageHandler("sendSelectionTo_MarkersAndPatients", handleIncomingIdentifiers);
        hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
        hub.addMessageHandler("datasetSpecified", datasetSpecified);
        hub.addMessageHandler("displayMarkersNetwork", displayMarkersNetwork);
        hub.addMessageHandler("configureSampleCategorizationMenu", configureSampleCategorizationMenu);
        hub.addMessageHandler("markersApplyTumorCategorization", applyTumorCategorization);
        hub.addMessageHandler("markersAssessUserIdForTesting", assessUserIdForTesting);
        hub.addSocketConnectedFunction(runAutomatedTestsIfAppropriate);
        hub.addOnDocumentReadyFunction(initializeUI);
       },
     sat: standAloneTest
     };

   }); // markersAndTissuesModule
//----------------------------------------------------------------------------------------------------
markersModule = markersAndTissuesModule()
markersModule.init();

