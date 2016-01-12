library(NetworkMaker)
library(DEMOdz)
options(stringsAsFactors=FALSE)

dz <- DEMOdz() 
netMaker <- NetworkMaker(dz)
#------------------------------------------------------------------------------------------------------------------------
create.and.display <- function()
{

   gistic.scores <-c(-2, -1, 1, 2)
   calculateSampleSimilarityMatrix(netMaker, copyNumberValues=gistic.scores)
   g <- getSamplesGraph(netMaker)
   rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
   httpSetStyle(rcy, "style.js")
   tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)
   setPosition(rcy, tbl.pos)    
   fit(rcy, 100)
   goi <- colnames(getItem(dz, "mtx.mut"))
   #goi <- colnames(matrices(dz)$mtx.mut)
   g.chrom <- getChromosomeGraph(netMaker, goi)
   httpAddGraph(rcy, g.chrom)
   httpSetStyle(rcy, "style.js")
   tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1400, yOrigin=000, yMax=2000, chromDelta=200)
   setPosition(rcy, tbl.pos)
   fit(rcy, 100)
   g.mut <- getMutationGraph(netMaker, goi)
   httpAddGraph(rcy, g.mut)
   g.cn <- getCopyNumberGraph(netMaker, goi, gistic.scores)
   httpAddGraph(rcy, g.cn)
   hideAllEdges(rcy)
   showEdges(rcy, "chromosome")
   fit(rcy)

   return(list(rcy=rcy, g=g, g.mut=g.mut, g.cn=g.cn, unpositioned=c()))

} # create.and.display
#------------------------------------------------------------------------------------------------------------------------
saveGraph <- function(rcy)
{
   g.markers.char <- getJSON(rcy)

     # a convoluted way to get an actual json object to save via serialization
     # todo: will explore changing RCyjs::getJSON to produce json directly at another
     # todo:  time (pshannon, 12 jan 2016)

   g.markers.json <- toJSON(fromJSON(g.markers.char))
   filename <- "../extdata/markers.json.RData"
   printf("saving as %s, %d nodes, %d edges", filename, getNodeCount(rcy), getEdgeCount(rcy))
   save(g.markers.json, file=filename)

} # saveGraph
#------------------------------------------------------------------------------------------------------------------------
x <- create.and.display()
rcy <- x$rcy
 
