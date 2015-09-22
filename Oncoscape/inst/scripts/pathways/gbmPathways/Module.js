//----------------------------------------------------------------------------------------------------
var cyPathway;  // move this back inside module when debugging is done
var XXX;

var gbmPathwaysModule = (function () {

  var cyDiv;
  var statusDiv; 
  var searchBox;
  var hideEdgesButton, showEdgesButton, showAllEdgesButton, clearSelectionButton, sfnButton;
  var helpButton;
  var infoMenu;
  var edgeTypeSelector;
  var mouseOverReadout;
  var graphOperationsMenu;
  var sendSelectionsMenu;
  var layoutMenu;
  var thisModulesName = "GBM Pathway"; // "PI3K-AKT Pathway";
  var thisModulesOutermostDiv = "gbmPathwaysPathwayDiv";

      // sometimes a module offers multiple selection destinations.
      // usually there is just one:

  var selectionDestinations = [thisModulesName];


  var sendSelectionsMenuTitle = "Send selection...";

//--------------------------------------------------------------------------------------------
function initializeUI ()
{

  cyDiv = $("#cyPathwayDiv");
  statusDiv = $("#pathwayStatusDiv");

  sendSelectionsMenu = hub.configureSendSelectionMenu("#cyPathwaySendSelectionsMenu", 
                                                      [thisModulesName], sendSelections,
                                                      sendSelectionsMenuTitle);

  graphOperationsMenu = $("#cyPathwayOperationsMenu");
  graphOperationsMenu.change(doGraphOperation)
  graphOperationsMenu.empty()
  graphOperationsMenu.append("<option>Network Operations...</option>")

  var operations = ["Show All Edges",
                    "Show Edges from Selected Nodes",
                    "Hide All Edges",
                    //"Connect to First Neighbors",
                    "Invert Node Selection",
                    "Clear Selections",
                    "Select All Connected Nodes",
                    "Select All Nodes with Selected Edges",
                    "Hide Unselected Nodes",
                    "Show All Nodes"];

  for(var i=0;i< operations.length; i++){
     var optionMarkup = "<option>" + operations[i] + "</option>";
     graphOperationsMenu.append(optionMarkup);
     } // for 


   layoutMenu = $("#markerLayouts");
   layoutMenu.change(performLayout);

   showEdgesButton = $("#cyPathwayShowEdgesButton");
   showEdgesButton.click(showEdges);
   
   showAllEdgesButton = $("#cyPathwayShowAllEdgesButton");
   showAllEdgesButton.click(showAllEdges);

   sfnButton = $("#cyPathwaySFNButton");
   sfnButton.click(selectFirstNeighbors);
   clearSelectionButton = $("#cyPathwayClearSelectionButton");
   clearSelectionButton.click(clearSelection);

   hideEdgesButton = $("#cyPathwayHideEdgesButton");
   hideEdgesButton.click(hideAllEdges)


   searchBox = $("#gbmPathwaysSearchBox");

   edgeTypeSelector = $("#gbmPathwaysPathwayEdgeTypeSelector");
   mouseOverReadout = $("#gbmPathwaysMouseOverReadout");
   loadNetwork();
   $(".chosen-select").chosen();
   $(window).resize(handleWindowResize);

 } // initializeUI
//----------------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();
   console.log("CyMarkers send selections to " + destination);
   sendSelectionsMenu.val(sendSelectionsMenuTitle);
   var nodeNames = selectedNodeNames(cyPathway);
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
   layoutMenu.append("<option>Layouts</option>");
   layoutMenu.append("<option> Save Current</option>");

   var defaultLayout = JSON.stringify(cyPathway.nodes().map(function(n){
            return{id:n.id(), position:n.position()}}));

   if(Object.keys(localStorage).indexOf("markersDefault") < 0){
      localStorage.markersDefault = defaultLayout;
      }

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
     currentLayout = JSON.stringify(cyPathway.nodes().map(function(n){return{id:n.id(), position:n.position()}}));
     localStorage[newName] = currentLayout;
     layoutMenu.append("<option>" + newName + "</option>");
     layoutMenu.val(newName);
     return;
     }

  if(Object.keys(localStorage).indexOf(chosenLayoutName) >= 0){
     var newLayout;
     newLayout = JSON.parse(localStorage[chosenLayoutName]);
     cyPathway.nodes().positions(function(i, node){
        return{x: newLayout[i].position.x, y:newLayout[i].position.y};
         });
     } // if requested layout name is recognized

} // performLayout
//--------------------------------------------------------------------------------------------
function sendSelection()
{
   destinationModule = sendSelectionsMenu.val();
   var nodeNames = selectedNodeNames(cyPathway);
   if(nodeNames.length == 0){
      console.log("no nodes selected!")
      return;
      }
   metadata = {};
   sendSelectionToModule(destinationModule, nodeNames, metadata);
   sendSelectionsMenu.val("Send Selection...");

}; // sendSelectionsMenuChanged
//--------------------------------------------------------------------------------------------
function loadNetwork ()
{

  //console.log("loadnetwork, node count: " + gbmPathwaysNetwork.elements.nodes.length);
  cyPathway = $("#cyPathwayDiv");
  cyPathway.cytoscape({
     //elements: gbmPathwaysNetwork.elements,
     //style: gbmPathwaysVizmap[0].style,
     boxSelectionEnabled: true,
     showOverlay: false,
     minZoom: 0.01,
     maxZoom: 8.0,
     layout: {
       name: "preset",
       fit: true
       },
   ready: function() {
      console.log("cyPathway ready");
      cyPathway = this;
      console.log("about to show all edges");
      cyPathway.edges().show();
      console.log("after showing all edges");
      cyPathway.on('mouseover', 'node', function(evt){
         var node = evt.cyTarget;
         mouseOverReadout.val(node.data().label)
         })
      cyPathway.on('mouseout', 'node', function(evt){
         var node = evt.cyTarget;
         mouseOverReadout.val("");
         })
      cyPathway.on('mouseover', 'edge', function(evt){
         var edge = evt.cyTarget;
         var d = edge.data();
         var msg = d.edgeType + ": " + d.source + " - " + d.target;
         var mutation = d.mutation
         if(typeof(mutation) == "string")
            msg = mutation + " " + msg;
         mouseOverReadout.val(msg);
         })
      cyPathway.on('select', 'node', function(evt){
         var disable = selectedNodeIDs(cyPathway).length == 0;
         sendSelectionsMenu.attr("disabled", disable);
         })
      cyPathway.on('unselect', 'node', function(evt){
         var disable = selectedNodeIDs(cyPathway).length == 0;
         sendSelectionsMenu.attr("disabled", disable);
         })


      searchBox.keydown(doSearch);

      console.log("cyPathway.reset");
      cyPathway.reset();
      handleWindowResize();
      cyPathway.edges().selectify(); // this seems to hold through session, visibility notwithstanding
      //hideAllEdges();

      //cyPathway.nodes().positions(function(i, node){return{x: ericsLayout[i].position.x, y:ericsLayout[i].position.y};});

      configureLayoutsMenu(layoutMenu);
      //cyPathway.add(network.elements);  // no positions yet
      //cyPathway.layout({name:"grid"});  // default layout  
      //cyPathway.nodes().positions(function(i, node){return{x: layout[i].pos.x, y:layout[i].pos.y};});
      //var box = cyPathway.extent();
      //var center = {x: box.x1 + (box.w/2), y: box.y1 + (box.h/2)};
      //cyPathway.fit();
      //var newLevel = cyPathway.zoom() * 0.8;
      //cyPathway.zoom({level: newLevel, position: center});
      //cyPathway.style(vizmap);
      //cyPathway.style().update();
      }, // cy.ready
   //style: cytoscape.stylesheet()
   //  .selector('edge')
   //      .css({'line-color': 'green',
   //            'source-arrow-shape': 'circle',
   //            'display': 'none',
   //            'source-arrow-color': 'red',
    //           'curve-style': 'haystack' // not bezier, buthaystack for faster drawing (no arrows)
    //           }) // .css
     }) // .cytoscape
  .cytoscapePanzoom({ });   // need to learn about options

} // loadNetwork
//----------------------------------------------------------------------------------------------------
function handleWindowResize ()
{
   cyDiv.width(0.95 * $(window).width());
   cyDiv.height(0.8 * $(window).height());
   cyPathway.resize();
   cyPathway.fit(50);

} // handleWindowResize
//----------------------------------------------------------------------------------------------------
function doGraphOperation()
{

   operation = graphOperationsMenu.val();

   switch(operation){
      case "Show All Edges":
         showAllEdges();
         break;
      case "Show Edges from Selected Nodes":
         showEdgesFromSelectedNodes();
         break;
      case "Hide All Edges":
         hideAllEdges();
         break;
      case "Invert Node Selection":
         invertSelection();
         break;
      case "Clear Selections":
         cyPathway.filter('node:selected').unselect();
         break;
      case "Select All Connected Nodes":
         selectAllConnectedNodes();
         break;
      case "Select All Nodes with Selected Edges":
        selectAllNodesConnectedBySelectedEdges();
        break;
      case "Hide Unselected Nodes":
         cyPathway.filter("node:unselected").hide();
         break;
      case "Show All Nodes":
         cyPathway.filter('node:hidden').show();
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
   cyPathway.elements().unselect();
}
//----------------------------------------------------------------------------------------------------
function selectFirstNeighbors ()
{
  selectedNodes = cyPathway.filter('node:selected');
  showEdgesForNodes(cyPathway, selectedNodes);

}
//----------------------------------------------------------------------------------------------------
function invertSelection ()
{
   selected = cyPathway.filter("node:selected");
   unselected = cyPathway.filter("node:unselected");
   selected.unselect();
   unselected.select();
}
//----------------------------------------------------------------------------------------------------
function hideAllEdges ()
{
   cyPathway.filter('edge').hide();
}
//----------------------------------------------------------------------------------------------------
function showAllEdges ()
{
   cyPathway.edges().show();

   /***********
   todo: edges need to be learned from the network, and displayed
   todo: more manageably than in the current select widget

   var edgeTypesToDisplay = edgeTypeSelector.val();

   console.log("edgeTypeToDisplay: " + edgeTypesToDisplay);

   if(edgeTypesToDisplay == null){
      return;
      }

   for(var e=0; e < edgeTypesToDisplay.length; e++){
      var type =  edgeTypesToDisplay[e];
      selectionString = '[edgeType="' + type + '"]';
      console.log(" showAllEdges selection string: " + selectionString);
      cyPathway.edges(selectionString).show()
      } // for e
    *********/

} // showAllEdges
//----------------------------------------------------------------------------------------------------
function zoomSelected()
{
   cyPathway.fit(cyPathway.$(':selected'), 100)
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
   allNodes = cyPathway.nodes();

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

   var selectedNodes = selectedNodeIDs(cyPathway);

   //console.log(" newEdgeTypeSelection (" + edgeTypesToDisplay.length + 
   //            "), selectedNodes: " + selectedNodes.length);

   if(selectedNodes.length > 0) { // show edges to and from all selected nodes
     showEdgesForNodes(cyPathway, selectedNodes);
     }

} // showEdges
//----------------------------------------------------------------------------------------------------
function showEdgesFromSelectedNodes()
{
   var selectedNodes = cyPathway.filter('node:selected');
   if(selectedNodes.length == 0) {
      return;
      }
   showEdgesForNodes(cyPathway, selectedNodes);

} // showEdgesFromSelectedNodes
//----------------------------------------------------------------------------------------------------
function zoomSelection()
{
   cyPathway.fit(cyPathway.$(':selected'), 50)

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
function selectSourceAndTargetNodesOfEdges(cw, edges)
{

  var edgesVisible = cyPathway.filter('edge:visible').length

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
    var selectedEdges = cyPathway.filter("edge:visible");
    selectSourceAndTargetNodesOfEdges(cyPathway, selectedEdges);

} // selectAllConnectedNodes
//----------------------------------------------------------------------------------------------------
function selectAllNodesConnectedBySelectedEdges()
{
    edges = cyPathway.filter("edge:selected")
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
function nodeNames()
{
  var nodes = cyPathway.filter("node:visible");
  var result = [];
  for(var i=0; i < nodes.length; i++){
    result.push(nodes[i].data().label)
    } // for i
  return(result)

} // nodeNames
//----------------------------------------------------------------------------------------------------
function nodeIDs()
{
  var nodes = cyPathway.filter("node:visible");
  var result = [];

  for(var i=0; i < nodes.length; i++){
    result.push(nodes[i].data().id)
    } // for i

  return(result)

} // nodeIDs
//----------------------------------------------------------------------------------------------------
   // todo: build up the filter string first, then send it all at once
function selectNodes(nodeNames) {

  if(typeof(nodeNames) == "string")   // trap scalar, but expect and support arrays
     nodeNames = [nodeNames];

  for(var i=0; i < nodeNames.length; i++){
    s = "cyPathway.filter('node[name=\"" + nodeNames[i] + "\"]').select()";
    //console.log("markers selectNodes: " + s);
    JAVASCRIPT_EVAL (s);
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
    s = "cyPathway.filter('node[id=\"" + nodeIDs[i] + "\"]').select()";
    console.log(s)
    JAVASCRIPT_EVAL (s);
    } // for i

} // selectNodesByID
//----------------------------------------------------------------------------------------------------
function doSearch(e)
{
   var keyCode = e.keyCode || e.which;
   if (keyCode == 13) {
      searchString = searchBox.val();
      //console.log("searchString: " + searchString);
      names = nodeNames()
      matches = []
      for(var i=0; i < names.length; i++){
         if(names[i].beginsWith(searchString)) {
            selectNodes([names[i]]);
            //s = "cyPathway.filter('node[name=\"" + names[i] + "\"]').select()";
            //JAVASCRIPT_EVAL (s);
            } // if searchString matched beginning of node
         } // for i
      } // if 13 (return key)

} // doSearch
//----------------------------------------------------------------------------------------------------
function displayPathway(msg)
{
   console.log("--- Module.pi3k: displayPathway");
   if(msg.status == "success"){
      console.log("nchar(network): " + msg.payload.length);
      s = msg.payload;
      XXX = msg.payload;
      console.log("      1:40: " + s.substring(1, 40));
      var json = JSON.parse(msg.payload);
      cyPathway.remove(cyPathway.edges());
      cyPathway.remove(cyPathway.nodes());
      console.log(" after JSON.parse, json.length: " + json.length);
      console.log("  about to add json.elements");
      cyPathway.add(json.elements);
      console.log("  about to add  json.style");
      cyPathway.style(json.style);
      cyPathway.nodes().unselect();
        // map current node degree into a node attribute of that name
      cyPathway.nodes().map(function(node){node.data({degree: node.degree()})});

      var edgeTypes = hub.uniqueElementsOfArray(cyPathway.edges().map(function(edge){
                               return(edge.data("edgeType"))}
                               ));
      //updateEdgeSelectionWidget(edgeTypes);  // preserve only known edgeTypes
      cyPathway.resize();
      cyPathway.fit(50);
      console.log("concluding displayPathway gbmPathways");
      cyPathway.edges().show();
      postStatus("pathway loaded");
      }
   else{
     console.log("displayPathway error: " + msg.payload);
     }

} // displayPathway
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
   var manifestInfo = msg.payload;
   var variableNames = manifestInfo.rownames;

   var pathway = "gbmPathways.json.RData";
   if($.inArray(pathway, variableNames) >= 0){
      var newMsg = {cmd: "getPathway",  callback: "gbmPathwaysDisplayPathway",
                    status: "request", payload: "g.gbmPathways.json"};
      hub.send(JSON.stringify(newMsg));
      } // if pathway available

} // datasetSpecified
//----------------------------------------------------------------------------------------------------
function postStatus(msg)
{
  console.log("posting new status to gbm status div: " + msg);
  statusDiv.text(msg);
  console.log("reading it back in: %s" + $("#pathwayStatusDiv").text());

} // postStatus
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
      assert.ok(cyPathway.nodes().length > 1500);
      console.log("about to check edge count");
      assert.ok(cyPathway.edges().length > 13000)
      console.log("end of test");
      });

  QUnit.test("markersAndSamples: select GBM", function(assert){
     cyPathway.nodes().unselect();
     assert.ok(cyPathway.filter("node:selected").length == 0);
     cyPathway.$("#GBM").select();
     assert.ok(cyPathway.filter("node:selected").length == 1);
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
     assert.equal(cyPathway.filter("node:selected").length, 1);
       // now restore the original settings. 
     $("#markersEdgeTypeSelector").val(["chromosome", "mutation", "cnGain.2", "cnLoss.2", "cnGain.1", "cnLoss.1"])
     $("#markersEdgeTypeSelector").trigger("change");
     });

  QUnit.test("markersAndSamples: select chrom edges from GBM", function(assert){
      var desiredAction = "Show Edges from Selected Nodes";
      var actions = $("#cyPathwayOperationsMenu option").map(function(x) {return this.value});

      if($.inArray(desiredAction, actions) < 0){
         alert("cannot run tests:  " + desiredAction + " not available");
         return;
         }

     cyPathway.edges().hide()
     assert.equal(cyPathway.filter("edge:visible").length, 0);
     $("#cyPathwayOperationsMenu").val(desiredAction);
     $("#cyPathwayOperationsMenu").trigger("change");
     assert.expect(1); // specify number of assertions which should run
     setTimeout(function() {  // takes a little while for the edge to be rendered
        assert.equal(cyPathway.filter("edge:visible").length, 1);
        }, 2000);
     });


  QUnit.test("markersAndSamples: search and select GBM", function(assert){
     cyPathway.nodes().unselect();
     assert.equal(cyPathway.filter("node:selected").length, 0);
     var targetNode = "GBM";
     $("#gbmPathwaysSearchBox").val(targetNode);
     var e = jQuery.Event("keydown");
     e.which = 13;  
     $("#gbmPathwaysSearchBox").trigger(e);
     var selectedNode = cyPathway.filter("node:selected")
     assert.equal(selectedNode.length, 1);
     assert.equal(selectedNode.data().id, targetNode);
     });


} // gbmLggDzSpecificTests
//----------------------------------------------------------------------------------------------------
 return{
     init: function(){

        hub.addMessageHandler("sendSelectionTo_GBM Pathway", handleIncomingIdentifiers);
        hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
        hub.addMessageHandler("datasetSpecified", datasetSpecified);
        hub.addMessageHandler("gbmPathwaysDisplayPathway", displayPathway);
        hub.addOnDocumentReadyFunction(initializeUI);
        hub.setTitle("Markers & Patients");
       },
     sat: standAloneTest
     };

   }); // gbmPathwaysModule
//----------------------------------------------------------------------------------------------------
markersModule = gbmPathwaysModule()
markersModule.init();

