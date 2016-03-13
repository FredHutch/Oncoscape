### R code from vignette source 'RCyjs.Rnw'

###################################################
### code chunk number 1: style
###################################################
BiocStyle::latex()


###################################################
### code chunk number 2: simpleExample
###################################################
library(RCyjs)
g <- simpleDemoGraph()
noaNames(g)
edaNames(g)
noa(g, "type")
noa(g, "lfc")
eda(g, "edgeType")
eda(g, "score")


###################################################
### code chunk number 3: simpleRender
###################################################
g <- simpleDemoGraph()
rcy <- RCyjs(portRange=9047:9067, quiet=TRUE, graph=g);
title <- "simple graph"
setBrowserWindowTitle(rcy, title)


###################################################
### code chunk number 4: colors
###################################################
green <- "rgb(0,255,0)"
white <- "rgb(255,255,255)"
red <- "rgb(255,0,0)"
blue <- "rgb(0,0,255)"
black <- "rgb(0,0,0)"
darkGreen <- "rgb(0,200,0)"
darkerGreen <- "rgb(0,120,0)"
darkRed <- "rgb(221,0,0)"
darkerRed <- "rgb(170,0,0)"
purple <- "rgb(221,221,0)"
darkBlue <- "rgb(0,0,170)"
darkerBlue <- "rgb(0,0,136)"
lightGray="rgb(230,230,230)"



###################################################
### code chunk number 5: defaultRendering
###################################################
setDefaultNodeShape(rcy, "ellipse")
setNodeLabelRule(rcy, "label")  # we DO want a different label on each node.  this rule ensures that
setDefaultNodeSize(rcy, 70)
setDefaultNodeColor(rcy, "white")
setDefaultNodeBorderColor(rcy, "black")
setDefaultNodeBorderWidth(rcy, 1)
setDefaultEdgeColor(rcy, blue)
setNodeLabelAlignment(rcy, "center", "center");
layout(rcy, "circle")
fitContent(rcy)
setZoom(rcy, 0.75 * getZoom(rcy))
setDefaultEdgeSourceArrowShape(rcy, "tee")
setDefaultEdgeTargetArrowShape(rcy, "triangle")
setDefaultEdgeSourceArrowColor(rcy, blue)
setDefaultEdgeTargetArrowColor(rcy, blue)
redraw(rcy)


###################################################
### code chunk number 6: firstRules
###################################################
noa(g, "lfc")
setNodeColorRule(rcy, "lfc", c(-5, 0, 5), c(green, white, red), mode="interpolate")
setEdgeColorRule(rcy, "edgeType",
                 c("phosphorylates", "synthetic lethal", "undefined"),
                 c(red, green, blue), mode="lookup")

redraw(rcy)


###################################################
### code chunk number 7: RCyjs.Rnw:130-147
###################################################
refnetToGraphNEL <- function(tbl)
{
  g = new ("graphNEL", edgemode="directed")
  nodeDataDefaults(g, attr="type") <- "undefined"
  nodeDataDefaults(g, attr="label") <- "default node label"
  nodeDataDefaults(g, attr="expression") <-  1.0
  nodeDataDefaults(g, attr="gistic") <-  0
  nodeDataDefaults(g, attr="mutation") <-  "none"
  edgeDataDefaults(g, attr="edgeType") <- "undefined"
  edgeDataDefaults(g, attr= "pubmedID") <- ""
  all.nodes <- sort(unique(c(tbl$A, tbl$B)))
  g = graph::addNode (all.nodes, g)
  nodeData (g, all.nodes, "label") = all.nodes
  g = graph::addEdge (tbl$A, tbl$B, g)
  edgeData (g, tbl$A, tbl$B, "edgeType") = tbl$type
  g
  }


###################################################
### code chunk number 8: hypozia0
###################################################
library(org.Hs.eg.db)
library(RefNet)
refnet <- RefNet();
tbl.hypoxia <- interactions(refnet,provider="hypoxiaSignaling-2006")
g.hypoxia <- refnetToGraphNEL(tbl.hypoxia)


###################################################
### code chunk number 9: hypoxia1
###################################################
all.nodes <- nodes(g.hypoxia)
gene.nodes <- intersect(all.nodes, keys(org.Hs.egSYMBOL2EG))
process.nodes <- setdiff(all.nodes, gene.nodes)
nodeData(g.hypoxia, gene.nodes, attr="type") <- "gene"
nodeData(g.hypoxia, process.nodes, attr="type") <- "process"


###################################################
### code chunk number 10: hypoxia2
###################################################
rcy <- RCyjs(portRange=9047:9067, quiet=TRUE, graph=g.hypoxia);
setBackgroundColor(rcy, lightGray)
setDefaultNodeSize(rcy, 60)
setDefaultNodeColor(rcy, white)
setDefaultNodeBorderColor(rcy, black)
setDefaultNodeBorderWidth(rcy, 3)
setNodeLabelRule(rcy, "label");
setNodeShapeRule(rcy, "type", c("gene", "process"), c("ellipse", "roundrectangle"))
redraw(rcy)
title <- "Hypoxia Signaling: Pouyssegur 2006"
setBrowserWindowTitle(rcy, title)


###################################################
### code chunk number 11: hypoxia3
###################################################
saved.layout.file <- system.file(package="RCyjs", "extdata", "hypoxiaLayout.RData")
stopifnot(file.exists(saved.layout.file))
restoreLayout(rcy, saved.layout.file)
fitContent(rcy)
setZoom(rcy, 0.9 *getZoom(rcy))


###################################################
### code chunk number 12: hypoxia4
###################################################
edgeColors <- list(activates = darkerGreen,
                   inhibits = darkRed,
                   inactivates = darkRed,
                   hydroxylates = black,
                   "TF cofactor" = darkBlue,
                   "TF binding" = darkBlue,
                   hydroxylated = black,
                   stabilizes.mrna = darkerBlue,
                   preserves = darkGreen,
                   proteolyzes = darkRed)

setEdgeColorRule(rcy, "edgeType", names(edgeColors), as.character(edgeColors), mode="lookup")
setEdgeTargetArrowColorRule(rcy, "edgeType", names(edgeColors), as.character(edgeColors),
                            mode="lookup")

edgeTargetShapes <- list(activates = "triangle",
                         inhibits = "tee",
                         inactivates = "tee",
                         hydroxylates = "triangle",
                         "TF cofactor" = "none",
                         "TF binding" = "triangle",
                         hydroxylated = "none",
                         stabilizes.mrna = "triangle",
                         preserves = "triangle",
                         proteolyzes = "triangle")

setEdgeTargetArrowShapeRule(rcy, "edgeType", names(edgeTargetShapes), as.character(edgeTargetShapes))

redraw(rcy)




