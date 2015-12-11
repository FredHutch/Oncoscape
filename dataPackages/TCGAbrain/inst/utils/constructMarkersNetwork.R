library(NetworkMaker)
library(TCGAbrain)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
# run this script one command at a time, waiting for each to complete before moving on to the
# next:  some of them (the httpAddGraph commands in particular) take many seconds to complete.
#----------------------------------------------------------------------------------------------------
dz <- TCGAbrain() 
netMaker <- NetworkMaker(dz)

# load(system.file(package="NetworkMaker", "extdata", "genesets.RData"))
# flawed!goi <- sort(unique(genesets$tcga.GBM.classifiers, genesets$marker.genes.545))
print(load("goi545.from.approvedHoboPlot25sep2015.RData"))
stopifnot(all(c("MDM2", "MDM4") %in% goi))
          
filename <- "MDS.joint.SNA.CNA.allBenes.tsv"
usePrecalculatedSampleSimilarityMatrix(netMaker, filename)

g <- getSamplesGraph(netMaker)
rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
styleFile <- "/Users/pshannon/oncogit/Oncoscape/dataPackages/TCGAgbm/inst/utils/style.js"
#styleFile <- "style.js"
httpSetStyle(rcy, styleFile)
tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)
setPosition(rcy, tbl.pos)    

fit(rcy, 100)
g.chrom <- getChromosomeGraph(netMaker, goi)
httpAddGraph(rcy, g.chrom)
httpSetStyle(rcy, styleFile)

tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1400, yOrigin=000, yMax=2000, chromDelta=200)
setPosition(rcy, tbl.pos)
fit(rcy, 100)
g.mut <- getMutationGraph(netMaker, goi)
httpAddGraph(rcy, g.mut)
gistic.scores <- c(-2, 2)
g.cn <- getCopyNumberGraph(netMaker, goi, gistic.scores)
httpAddGraph(rcy, g.cn)
hideAllEdges(rcy)
showEdges(rcy, "chromosome")
httpSetStyle(rcy, "../../../DEMOdz/inst/utils/style.js")
fit(rcy)
g.markers.json <- getJSON(rcy)
filename <- "../extdata/markers.json.TCGAbrain.RData"
printf("saving as %s, %d nodes, %d edges", filename, getNodeCount(rcy), getEdgeCount(rcy))
save(g.markers.json, file=filename)
 
