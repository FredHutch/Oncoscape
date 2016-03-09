#----------------------------------------------------------------------------------------------------
cyjsBrowserFile <- system.file(package="RCyjs", "scripts", "rcyjs.html")
printf <- function(...) print(noquote(sprintf(...)))
#----------------------------------------------------------------------------------------------------
.RCyjs <- setClass ("RCyjsClass", 
                    representation = representation(graph="graph"),
                    contains = "BrowserVizClass",
                    prototype = prototype (uri="http://localhost", 9000)
                    )

#----------------------------------------------------------------------------------------------------
setGeneric('setGraph',            signature='obj', function(obj, graph, hideEdges=FALSE) standardGeneric ('setGraph'))
setGeneric('addGraph',            signature='obj', function(obj, graph) standardGeneric ('addGraph'))
setGeneric('httpAddGraph',        signature='obj', function(obj, graph) standardGeneric ('httpAddGraph'))
setGeneric('httpSetStyle',        signature='obj', function(obj, filename) standardGeneric ('httpSetStyle'))

setGeneric('getNodeCount',        signature='obj', function(obj) standardGeneric ('getNodeCount'))
setGeneric('getEdgeCount',        signature='obj', function(obj) standardGeneric ('getEdgeCount'))
setGeneric('getNodes',            signature='obj', function(obj) standardGeneric ('getNodes'))

setGeneric('setNodeAttributes',   signature='obj', function(obj, attribute, nodes, values) standardGeneric('setNodeAttributes'))
#setGeneric('setEdgeAttributes',   signature='obj', function(obj, attribute, edges, values) standardGeneric('setEdgeAttributes'))

setGeneric('getSelectedNodes',    signature='obj', function(obj) standardGeneric ('getSelectedNodes'))
setGeneric('clearSelection',      signature='obj', function(obj) standardGeneric ('clearSelection'))
setGeneric('invertNodeSelection', signature='obj', function(obj) standardGeneric ('invertNodeSelection'))
setGeneric('hideSelectedNodes',   signature='obj', function(obj) standardGeneric ('hideSelectedNodes'))
setGeneric('deleteSelectedNodes', signature='obj', function(obj) standardGeneric ('deleteSelectedNodes'))
setGeneric('redraw',              signature='obj', function(obj) standardGeneric ('redraw'))
setGeneric('setNodeLabelRule',    signature='obj', function(obj, attribute) standardGeneric ('setNodeLabelRule'))
setGeneric('setNodeLabelAlignment',  signature='obj', function(obj, horizontal, vertical) standardGeneric ('setNodeLabelAlignment'))
setGeneric('setNodeSizeRule',     signature='obj', function(obj, attribute, control.points, node.sizes) standardGeneric('setNodeSizeRule'))
setGeneric('setNodeColorRule',    signature='obj', function(obj, attribute, control.points, colors, mode) standardGeneric('setNodeColorRule'))
setGeneric('setNodeShapeRule',    signature='obj', function(obj, attribute, control.points, node.shapes) standardGeneric('setNodeShapeRule'))

setGeneric('setEdgeStyle',        signature='obj', function(obj, mode) standardGeneric('setEdgeStyle'))
setGeneric('setEdgeColorRule',    signature='obj', function(obj, attribute, control.points, colors, mode) standardGeneric('setEdgeColorRule'))
setGeneric('setEdgeWidthRule',    signature='obj', function(obj, attribute, control.points, widths, mode) standardGeneric('setEdgeWidthRule'))

setGeneric('setEdgeTargetArrowShapeRule',   signature='obj', function(obj, attribute, control.points, shapes) standardGeneric('setEdgeTargetArrowShapeRule'))
setGeneric('setEdgeTargetArrowColorRule',   signature='obj', function(obj, attribute, control.points, colors, mode) standardGeneric('setEdgeTargetArrowColorRule'))

setGeneric('setEdgeSourceArrowShapeRule',   signature='obj', function(obj, attribute, control.points, shapes) standardGeneric('setEdgeSourceArrowShapeRule'))
setGeneric('setEdgeSourceArrowColorRule',   signature='obj', function(obj, attribute, control.points, colors, mode) standardGeneric('setEdgeSourceArrowColorRule'))

setGeneric('layout',              signature='obj', function(obj, strategy) standardGeneric('layout'))
setGeneric('layoutStrategies',    signature='obj', function(obj) standardGeneric('layoutStrategies'))
setGeneric('layoutSelectionInGrid', signature='obj', function(obj, x, y, w, h) standardGeneric('layoutSelectionInGrid'))
setGeneric('layoutSelectionInGridInferAnchor', signature='obj', function(obj, w, h) standardGeneric('layoutSelectionInGridInferAnchor'))
setGeneric('getPosition',         signature='obj', function(obj, nodeIDs=NA) standardGeneric('getPosition'))
setGeneric('setPosition',         signature='obj', function(obj, tbl.pos) standardGeneric('setPosition'))
setGeneric('getLayout',           signature='obj', function(obj) standardGeneric('getLayout'))
setGeneric('saveLayout',          signature='obj', function(obj, filename) standardGeneric('saveLayout'))
setGeneric('getJSON',             signature='obj', function(obj) standardGeneric('getJSON'))
setGeneric('restoreLayout',       signature='obj', function(obj, filename) standardGeneric('restoreLayout'))
setGeneric('setZoom',             signature='obj', function(obj, newValue) standardGeneric('setZoom'))
setGeneric('getZoom',             signature='obj', function(obj) standardGeneric('getZoom'))
setGeneric('setBackgroundColor',  signature='obj', function(obj, newValue) standardGeneric ('setBackgroundColor'))
setGeneric('fit',                 signature='obj', function(obj, padding=30) standardGeneric('fit'))
setGeneric('fitContent',          signature='obj', function(obj, padding=30) standardGeneric('fitContent'))
setGeneric('fitSelectedContent',  signature='obj', function(obj, padding=30) standardGeneric('fitSelectedContent'))
setGeneric('selectNodes',         signature='obj', function(obj, nodeIDs) standardGeneric('selectNodes'))
setGeneric('sfn',                 signature='obj', function(obj) standardGeneric('sfn'))

setGeneric('hideAllEdges',        signature='obj', function(obj) standardGeneric('hideAllEdges'))
setGeneric('showAllEdges',        signature='obj', function(obj) standardGeneric('showAllEdges'))
setGeneric('hideEdges',           signature='obj', function(obj, edgeType) standardGeneric('hideEdges'))
setGeneric('showEdges',           signature='obj', function(obj, edgeType) standardGeneric('showEdges'))
setGeneric('vAlign',              signature='obj', function(obj) standardGeneric('vAlign'))
setGeneric('hAlign',              signature='obj', function(obj) standardGeneric('hAlign'))

setGeneric("setDefaultNodeSize",  signature='obj', function(obj, newValue) standardGeneric('setDefaultNodeSize'))
setGeneric("setDefaultNodeWidth", signature='obj', function(obj, newValue) standardGeneric('setDefaultNodeWidth'))
setGeneric("setDefaultNodeHeight", signature='obj', function(obj, newValue) standardGeneric('setDefaultNodeHeight'))
setGeneric("setDefaultNodeColor", signature='obj', function(obj, newValue) standardGeneric('setDefaultNodeColor'))
setGeneric("setDefaultNodeShape", signature='obj', function(obj, newValue) standardGeneric('setDefaultNodeShape'))
setGeneric("setDefaultNodeFontColor", signature='obj', function(obj, newValue) standardGeneric('setDefaultNodeFontColor'))
setGeneric("setDefaultNodeFontSize", signature='obj', function(obj, newValue) standardGeneric('setDefaultNodeFontSize'))
setGeneric("setDefaultNodeBorderWidth", signature='obj', function(obj, newValue) standardGeneric('setDefaultNodeBorderWidth'))
setGeneric("setDefaultNodeBorderColor", signature='obj', function(obj, newValue) standardGeneric('setDefaultNodeBorderColor'))


setGeneric("setDefaultEdgeFontSize", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeFontSize"))
setGeneric("setDefaultEdgeTargetArrowShape", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeTargetArrowShape"))
setGeneric("setDefaultEdgeColor", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeColor"))
setGeneric("setDefaultEdgeTargetArrowColor", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeTargetArrowColor"))
setGeneric("setDefaultEdgeFontSize", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeFontSize"))
setGeneric("setDefaultEdgeWidth", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeWidth"))
setGeneric("setDefaultEdgeLineColor", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeLineColor"))
setGeneric("setDefaultEdgeFont", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeFont"))
setGeneric("setDefaultEdgeFontWeight", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeFontWeight"))
setGeneric("setDefaultEdgeTextOpacity", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeTextOpacity"))
setGeneric("setDefaultEdgeLineStyle", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeLineStyle"))
setGeneric("setDefaultEdgeOpacity", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeOpacity"))
setGeneric("setDefaultEdgeSourceArrowColor", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeSourceArrowColor"))
setGeneric("setDefaultEdgeSourceArrowShape", signature="obj", function(obj, newValue) standardGeneric("setDefaultEdgeSourceArrowShape"))

#----------------------------------------------------------------------------------------------------
# constructor
RCyjs = function(portRange, host="localhost", title="RCyjs", graph=graphNEL(), hideEdges=FALSE, quiet=TRUE)
{
  
  obj <- .RCyjs(BrowserViz(portRange, host, title, quiet, browserFile=cyjsBrowserFile,
                           httpQueryProcessingFunction=myQP),
                graph=graph)

  while (!browserResponseReady(obj)){
      Sys.sleep(.1)
      }
   if(!quiet) {
      message(sprintf("BrowserViz ctor called from RCyjs ctor got browser response"))
      print(getBrowserResponse(obj))
      }

   if(length(nodes(graph)) > 0)
      setGraph(obj, graph, hideEdges=hideEdges)
      
   obj

} # RCyjs: constructor
#----------------------------------------------------------------------------------------------------
setMethod('setGraph', 'RCyjsClass',

  function (obj, graph, hideEdges=FALSE) {
     g.json <- as.character(biocGraphToCytoscapeJSON(graph))
     #printf("RCyjs.setGraph sending g.json with %d chars", nchar(g.json))
     
     send(obj, list(cmd="setGraph", callback="handleResponse", status="request",
                    payload=list(graph=g.json, hideEdges=hideEdges)))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     getBrowserResponse(obj);
     })

#----------------------------------------------------------------------------------------------------
setMethod('addGraph', 'RCyjsClass',

  function (obj, graph) {
     printf("RCyjs::addGraph");
     print(graph)
     g.json <- as.character(biocGraphToCytoscapeJSON(graph))
     printf("about to send g.json: %d chars", nchar(g.json));
     send(obj, list(cmd="addGraph", callback="handleResponse", status="request",
                    payload=g.json))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     printf("browserResponseReady")
     getBrowserResponse(obj);
     })

#----------------------------------------------------------------------------------------------------
setMethod('httpAddGraph', 'RCyjsClass',

  function (obj, graph) {
     printf("RCyjs::httpAddGraph");
     print(graph)
     g.json <- paste("network = ", as.character(biocGraphToCytoscapeJSON(graph)))
     filename <- "g.json"
     write(g.json, file=filename)
     send(obj, list(cmd="httpAddGraph", callback="handleResponse", status="request",
                    payload=filename))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     printf("browserResponseReady")
     getBrowserResponse(obj);
     })

#----------------------------------------------------------------------------------------------------
setMethod('httpSetStyle', 'RCyjsClass',

  function (obj, filename) {
     printf("RCyjs::httpSetStyle");
     send(obj, list(cmd="httpSetStyle", callback="handleResponse", status="request",
                    payload=filename))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     printf("browserResponseReady")
     getBrowserResponse(obj);
     })

#----------------------------------------------------------------------------------------------------
setMethod('getNodes', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="getNodes", callback="handleResponse", status="request", payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     result <- getBrowserResponse(obj)
     if(nchar(result) > 0)
       return(fromJSON(getBrowserResponse(obj)))
     else
       return("")
     })

#----------------------------------------------------------------------------------------------------
setMethod('getNodeCount', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="getNodeCount", callback="handleResponse", status="request",
                                  payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     result <- getBrowserResponse(obj)
     if(nchar(result) > 0)
       return(fromJSON(getBrowserResponse(obj)))
     else
       return("")
     })

#----------------------------------------------------------------------------------------------------
setMethod('getEdgeCount', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="getEdgeCount", callback="handleResponse", status="request", payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     result <- getBrowserResponse(obj)
     if(nchar(result) > 0)
       return(fromJSON(getBrowserResponse(obj)))
     else
       return("")
     })

#----------------------------------------------------------------------------------------------------
setMethod('clearSelection', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="clearSelection", callback="handleResponse", status="request",
                                  payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     return("")
     })

#----------------------------------------------------------------------------------------------------
setMethod('getSelectedNodes', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="getSelectedNodes", callback="handleResponse", status="request",
                                  payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     result <- getBrowserResponse(obj)
     if(nchar(result) > 0)
       return(fromJSON(getBrowserResponse(obj)))
     else
       return("")
     })

#----------------------------------------------------------------------------------------------------
setMethod('invertNodeSelection', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="invertNodeSelection", callback="handleResponse", status="request",
                    payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     result <- getBrowserResponse(obj)
     if(nchar(result) > 0)
       return(fromJSON(getBrowserResponse(obj)))
     else
       return("")
     })

#----------------------------------------------------------------------------------------------------
setMethod('hideSelectedNodes', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="hideSelectedNodes", callback="handleResponse", status="request",
                    payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     result <- getBrowserResponse(obj)
     if(nchar(result) > 0)
       return(fromJSON(getBrowserResponse(obj)))
     else
       return("")
     })

#----------------------------------------------------------------------------------------------------
setMethod('deleteSelectedNodes', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="deleteSelectedNodes", callback="handleResponse", status="request",
                    payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     result <- getBrowserResponse(obj)
     if(nchar(result) > 0)
       return(fromJSON(getBrowserResponse(obj)))
     else
       return("")
     })

#----------------------------------------------------------------------------------------------------
setMethod('setNodeAttributes', 'RCyjsClass',

   function(obj, attribute, nodes, values){

     if (length (nodes) == 0)
       return ()
     
     if(length(values) == 1)
        values <- rep(values, length(nodes))

     payload <- list(attribute=attribute, nodes=nodes, values=values)
     send(obj, list(cmd="setNodeAttributes", callback="handleResponse", status="request",
                    payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     result <- getBrowserResponse(obj)
     if(nchar(result) > 0)
       return(fromJSON(getBrowserResponse(obj)))
     else
       invisible("")
     }) # setNodeAttributes

#------------------------------------------------------------------------------------------------------------------------
#setMethod('setEdgeAttributes', 'RCyjsClass',
#
#   function(obj, attribute, edges, values){
#     }) # setEdgeAttributes
#
#------------------------------------------------------------------------------------------------------------------------
setMethod('redraw', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="redraw", callback="handleResponse", status="request",
                                  payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('setNodeLabelRule', 'RCyjsClass',

  function (obj, attribute) {
     send(obj, list(cmd="setNodeLabelRule", callback="handleResponse", status="request",
                                  payload=attribute))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setNodeLabelAlignment', 'RCyjsClass',

  function (obj, horizontal, vertical) {
     stopifnot(vertical %in% c("top", "center", "bottom"))
     stopifnot(horizontal %in% c("left", "center", "right"))
     payload = list(vertical=vertical, horizontal=horizontal)
     send(obj, list(cmd="setNodeLabelAlignment", callback="handleResponse", status="request",
                    payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setNodeSizeRule', 'RCyjsClass',

  function (obj, attribute, control.points, node.sizes) {
     payload <- list(attribute=attribute,
                     controlPoints=control.points,
                     nodeSizes=node.sizes)
     send(obj, list(cmd="setNodeSizeRule", callback="handleResponse", status="request",
                                  payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setNodeColorRule', 'RCyjsClass',

  function (obj, attribute, control.points, colors, mode="interpolate") {

     if (!mode %in% c ('interpolate', 'lookup')) {
       write("Error! RCyjs:setNodeColorRule.  mode must be 'interpolate' (the default) or 'lookup'.", stderr ())
       return ()
       }

     payload <- list(attribute=attribute,
                     controlPoints=control.points,
                     nodeColors=colors,
                     mode=mode)
     send(obj, list(cmd="setNodeColorRule", callback="handleResponse", status="request",
                                  payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setNodeShapeRule', 'RCyjsClass',

  function (obj, attribute, control.points, node.shapes) {

     payload <- list(attribute=attribute,
                     controlPoints=control.points,
                     nodeShapes=node.shapes,
                     mode=mode)
     send(obj, list(cmd="setNodeShapeRule", callback="handleResponse", status="request",
                                  payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setEdgeStyle', 'RCyjsClass',

  function (obj, mode) {

     payload <- mode
     send(obj, list(cmd="setEdgeStyle", callback="handleResponse", status="request",
                    payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setEdgeColorRule', 'RCyjsClass',

  function (obj, attribute, control.points, colors, mode="interpolate") {

     if (!mode %in% c ('interpolate', 'lookup')) {
       write("Error! RCyjs:setEdgeColorRule.  mode must be 'interpolate' (the default) or 'lookup'.", stderr ())
       return ()
       }

     payload <- list(attribute=attribute,
                     controlPoints=control.points,
                     edgeColors=colors,
                     mode=mode)
     send(obj, list(cmd="setEdgeColorRule", callback="handleResponse", status="request",
                     payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setEdgeWidthRule', 'RCyjsClass',

  function (obj, attribute, control.points, widths, mode="interpolate") {

     if (!mode %in% c ('interpolate', 'lookup')) {
       write("Error! RCyjs:setEdgeWidthRule.  mode must be 'interpolate' (the default) or 'lookup'.", stderr ())
       return ()
       }

     payload <- list(attribute=attribute,
                     controlPoints=control.points,
                     widths=widths,
                     mode=mode)
     send(obj, list(cmd="setEdgeWidthRule", callback="handleResponse", status="request",
                     payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setEdgeTargetArrowShapeRule', 'RCyjsClass',

  function (obj, attribute, control.points, shapes) {

     payload <- list(attribute=attribute,
                     controlPoints=control.points,
                     edgeShapes=shapes)
     send(obj, list(cmd="setEdgeTargetArrowShapeRule", callback="handleResponse", status="request",
                     payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setEdgeSourceArrowShapeRule', 'RCyjsClass',

  function (obj, attribute, control.points, shapes) {

     payload <- list(attribute=attribute,
                     controlPoints=control.points,
                     edgeShapes=shapes,
                     mode=mode)
     send(obj, list(cmd="setEdgeSourceArrowShapeRule", callback="handleResponse", status="request",
                     payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setEdgeTargetArrowColorRule', 'RCyjsClass',

  function (obj, attribute, control.points, colors, mode="interpolate") {

     if (!mode %in% c ('interpolate', 'lookup')) {
       write("Error! RCyjs:setEdgeTargetArrowColorRule.  mode must be 'interpolate' (the default) or 'lookup'.", stderr ())
       return ()
       }

     payload <- list(attribute=attribute,
                     controlPoints=control.points,
                     colors=colors,
                     mode=mode)
     send(obj, list(cmd="setEdgeTargetArrowColorRule", callback="handleResponse", status="request",
                     payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('setEdgeSourceArrowColorRule', 'RCyjsClass',

  function (obj, attribute, control.points, colors, mode="interpolate") {

     if (!mode %in% c ('interpolate', 'lookup')) {
       write("Error! RCyjs:setEdgeSourceArrowColorRule.  mode must be 'interpolate' (the default) or 'lookup'.", stderr ())
       return ()
       }

     payload <- list(attribute=attribute,
                     controlPoints=control.points,
                     colors=colors,
                     mode=mode)
     send(obj, list(cmd="setEdgeSourceArrowColorRule", callback="handleResponse", status="request",
                     payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));  # the empty string.
     })

#----------------------------------------------------------------------------------------------------
setMethod('layoutStrategies', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="layoutStrategies", callback="handleResponse", status="request",
                                  payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     getBrowserResponse(obj)     
     })
          
#----------------------------------------------------------------------------------------------------
setMethod('layout', 'RCyjsClass',

  function (obj, strategy="random") {
     send(obj, list(cmd="doLayout", callback="handleResponse", status="request",
                                  payload=strategy))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     getBrowserResponse(obj)     
     })
          
#----------------------------------------------------------------------------------------------------
setMethod('layoutSelectionInGrid', 'RCyjsClass',

   function(obj, x, y, w, h){
     payload <- list(x=x, y=y, w=w, h=h)
     send(obj, list(cmd="layoutSelectionInGrid", callback="handleResponse", status="request",
                    payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     getBrowserResponse(obj)     
     
     })

#----------------------------------------------------------------------------------------------------
# anchor (the top left) of the grid is the location of the topmost/leftmost node
setMethod('layoutSelectionInGridInferAnchor', 'RCyjsClass',

   function(obj, w, h){
     payload <- list(w=w, h=h)
     send(obj, list(cmd="layoutSelectionInGridInferAnchor", callback="handleResponse", status="request",
                    payload=payload))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     getBrowserResponse(obj)     
     
     })

#----------------------------------------------------------------------------------------------------
setMethod('getPosition', 'RCyjsClass',

  function (obj, nodeIDs=NA) {
     if(all(is.na(nodeIDs)))
        nodeIDs <- ""
     send(obj, list(cmd="getPosition", callback="handleResponse", status="request",
                                  payload=nodeIDs))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     fromJSON(getBrowserResponse(obj))
     })
          
#----------------------------------------------------------------------------------------------------
setMethod('setPosition', 'RCyjsClass',

  function (obj, tbl.pos) {
     send(obj, list(cmd="setPosition", callback="handleResponse", status="request", payload=tbl.pos))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     getBrowserResponse(obj)
     })
          
#----------------------------------------------------------------------------------------------------
setMethod('getLayout', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="getLayout", callback="handleResponse", status="request",
                                  payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     fromJSON(getBrowserResponse(obj))
     })
          
#----------------------------------------------------------------------------------------------------
setMethod('saveLayout', 'RCyjsClass',

  function (obj, filename="layout.RData") {
     tbl.layout <- getPosition(obj)
     save(tbl.layout, file=filename)
     })
          
#----------------------------------------------------------------------------------------------------
setMethod('restoreLayout', 'RCyjsClass',

  function (obj, filename="layout.RData") {
     tbl.layout <- NA
     load(filename)
     if(!all(is.na(tbl.layout)))
        x <- setPosition(obj, tbl.layout)
     })
          
#----------------------------------------------------------------------------------------------------
setMethod('getJSON', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="getJSON", callback="handleResponse", status="request",
                                  payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     getBrowserResponse(obj)
     })
          
#----------------------------------------------------------------------------------------------------
noaNames = function (graph)
{
  return (names (nodeDataDefaults (graph)))
}
#------------------------------------------------------------------------------------------------------------------------
edaNames = function (graph)
{
  return (names (edgeDataDefaults (graph)))
}
#------------------------------------------------------------------------------------------------------------------------
noa = function (graph, node.attribute.name)
{
  if (!node.attribute.name %in% noaNames (graph))
    return (NA)

  return (unlist (nodeData (graph, attr=node.attribute.name)))

} # noa
#------------------------------------------------------------------------------------------------------------------------
eda = function (graph, edge.attribute.name)
{
  if (!edge.attribute.name %in% edaNames (graph))
    return (NA)

  return (unlist (edgeData (graph, attr=edge.attribute.name)))

} # eda
#------------------------------------------------------------------------------------------------------------------------
setMethod('fit', 'RCyjsClass',

  function (obj, padding=30) {
     fitContent(obj, padding);
     })

#----------------------------------------------------------------------------------------------------
setMethod('fitContent', 'RCyjsClass',

  function (obj, padding=30) {
     send(obj, list(cmd="fit", callback="handleResponse", status="request", payload=padding))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('fitSelectedContent', 'RCyjsClass',

  function (obj, padding=30) {
     send(obj, list(cmd="fitSelected", callback="handleResponse", status="request", payload=padding))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('selectNodes', 'RCyjsClass',

  function (obj, nodeIDs) {
     send(obj, list(cmd="selectNodes", callback="handleResponse", status="request",
                    payload=nodeIDs))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('sfn', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="sfn", callback="handleResponse", status="request", payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('hideAllEdges', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="hideAllEdges", callback="handleResponse", status="request",
                    payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('showAllEdges', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="showAllEdges", callback="handleResponse", status="request",
                    payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('hideEdges', 'RCyjsClass',

  function (obj, edgeType) {
     send(obj, list(cmd="hideEdges", callback="handleResponse", status="request",
                    payload=edgeType))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('showEdges', 'RCyjsClass',

  function (obj, edgeType) {
     send(obj, list(cmd="showEdges", callback="handleResponse", status="request",
                    payload=edgeType))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('getZoom', 'RCyjsClass',

  function (obj) {
     send(obj, list(cmd="getZoom", callback="handleResponse", status="request",
                    payload=""))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('setZoom', 'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setZoom", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod('setBackgroundColor', 'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setBackgroundColor", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })

#----------------------------------------------------------------------------------------------------
setMethod("setDefaultNodeSize",  'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeSize", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultNodeWidth",   'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeWidth", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultNodeHeight",   'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeHeight", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultNodeColor",   'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeColor", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultNodeShape",   'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeShape", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultNodeFontColor",   'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeFontColor", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultNodeFontSize",  'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeFontSize", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultNodeBorderWidth",  'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeBorderWidth", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     getBrowserResponse(obj);
     })

#----------------------------------------------------------------------------------------------------
setMethod("setDefaultNodeBorderColor",  'RCyjsClass',

  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeBorderColor", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     getBrowserResponse(obj);
     })

#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeFontSize", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultNodeFontSize", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeTargetArrowShape", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeTargetArrowShape", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeColor", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeColor", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeTargetArrowColor", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeTargetArrowColor", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeFontSize", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeFontSize", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeWidth", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeWidth", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeLineColor", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeLineColor", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeFont", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeFont", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeFontWeight", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeFontWeight", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeTextOpacity", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeTextOpacity", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeLineStyle", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeLineStyle", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeOpacity", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeOpacity", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeSourceArrowColor", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeSourceArrowColor", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("setDefaultEdgeSourceArrowShape", "RCyjsClass",
  function (obj, newValue) {
     send(obj, list(cmd="setDefaultEdgeSourceArrowShape", callback="handleResponse", status="request",
                    payload=newValue))
     while (!browserResponseReady(obj)){
        Sys.sleep(.1)
        }
     invisible(getBrowserResponse(obj));    # the empty string
     })
#----------------------------------------------------------------------------------------------------
setMethod("vAlign", "RCyjsClass",
   function(obj) {
     .alignSelectedNodes(obj, "vertical")
     }) 
#------------------------------------------------------------------------------------------------------------------------
setMethod("hAlign", "RCyjsClass",
   function(obj) {
     .alignSelectedNodes(obj, "horizontal")
     }) 
#------------------------------------------------------------------------------------------------------------------------
.alignSelectedNodes <- function(rcy, axis) {
  
   selectedNodes <- getSelectedNodes(rcy)$id
   if(length(selectedNodes) < 2){
      printf("select 2 or more nodes");
      return;
      }
    tbl.pos <- getPosition(rcy, selectedNodes)
   if(axis == "vertical"){
      x.mean <- sum(tbl.pos$x)/nrow(tbl.pos)
      tbl.pos$x <- x.mean
      }
   else{
     y.mean <- sum(tbl.pos$y)/nrow(tbl.pos)
     tbl.pos$y <- y.mean
     }
    setPosition(rcy, tbl.pos)

} # .alignSelectedNodes
#------------------------------------------------------------------------------------------------------------------------
myQP <- function(queryString)
{
   printf("=== RCYjs-class::myQP");
   print(queryString)
     # for reasons not quite clear, the query string comes in with extra characters
     # following the expected filename:
     #
     #  "?sampleStyle.js&_=1443650062946"
     #
     # check for that, cleanup the string, then see if the file can be found

   ampersand.loc <- as.integer(regexpr("&", queryString, fixed=TRUE))
   #printf("ampersand.loc: %d", ampersand.loc)
   
   if(ampersand.loc > 0){
      queryString <- substring(queryString, 1, ampersand.loc - 1);
      }
       
   questionMark.loc <- as.integer(regexpr("?", queryString, fixed=TRUE));
   #printf("questionMark.loc: %d", questionMark.loc)
   
   if(questionMark.loc == 1)
      queryString <- substring(queryString, 2, nchar(queryString))

   filename <- queryString;
   #printf("myQP filename: '%s'", filename)
   #printf("       exists?  %s", file.exists(filename));

   stopifnot(file.exists(filename))
   
   printf("--- about to scan %s", filename);
      # reconstitute linefeeds though collapsing file into one string, so json
      # structure is intact, and any "//" comment tokens only affect one line
   text <- paste(scan(filename, what=character(0), sep="\n", quiet=TRUE), collapse="\n")
   printf("%d chars read from %s", nchar(text), filename);
   
   return(text);

} # myQP
#----------------------------------------------------------------------------------------------------
