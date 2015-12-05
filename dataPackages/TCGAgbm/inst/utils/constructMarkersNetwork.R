library(NetworkMaker)
library(SttrDataPackage)
library(TCGAgbm)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
dz <- TCGAgbm() 
netMaker <- NetworkMaker(dz)
load(system.file(package="NetworkMaker", "extdata", "genesets.RData"))
goi <- sort(unique(genesets$tcga.GBM.classifiers, genesets$marker.genes.545))
gistic.scores <-c(-2, 2)
#calculateSampleSimilarityMatrix(netMaker, genes=goi, copyNumberValues=gistic.scores)
filename <- "MDS.SNV.CNV.tsv"
usePrecalculatedSampleSimilarityMatrix(netMaker, filename)

g <- getSamplesGraph(netMaker)
rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
httpSetStyle(rcy, "style.js")
tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)
setPosition(rcy, tbl.pos)    
fit(rcy, 100)
g.chrom <- getChromosomeGraph(netMaker, goi)
httpAddGraph(rcy, g.chrom)
httpSetStyle(rcy, "style.js")
tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1400, yOrigin=000, yMax=2000, chromDelta=200)
setPosition(rcy, tbl.pos)
fit(rcy, 100)
g.mut <- getMutationGraph(netMaker, goi)
httpAddGraph(rcy, g.mut)
hideAllEdges(rcy)
g.cn <- getCopyNumberGraph(netMaker, goi, gistic.scores)
httpAddGraph(rcy, g.cn)
hideAllEdges(rcy)
showEdges(rcy, "chromosome")
fit(rcy)
# httpSetStyle(rcy, "style.js")   # smaller nodes, red on selection
httpSetStyle(rcy, "../../../DEMOdz/inst/utils/style.js")
# temporary fix, accomodating orphan genes (not mapped to chromosomes):
# select those genes, place them below chr12, layoutSelectionInGridInferAnchor(rcy, 100, 100)
g.markers.json <- getJSON(rcy)   # about 1M
filename <- "../extdata/markers.json.TCGAgbm.RData"
printf("saving as %s, %d nodes, %d edges", filename, getNodeCount(rcy), getEdgeCount(rcy))
save(g.markers.json, file=filename)
 
