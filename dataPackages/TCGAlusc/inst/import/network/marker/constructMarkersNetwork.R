library(NetworkMaker)
library(SttrDataPackage)
library(TCGAlusc)

printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors=FALSE)

dz <- TCGAlusc() 
netMaker <- NetworkMaker(dz)
#----------------------------------------------------------------------------------------------------
create.and.display <- function()
{
   load(system.file(package="NetworkMaker", "extdata", "genesets.RData"))
   goi <- sort(unique(genesets$tcga.GBM.classifiers, genesets$marker.genes.545))
   gistic.scores <-c(-2, 2)
   
   calculateSampleSimilarityMatrix(netMaker, genes=goi, copyNumberValues=gistic.scores)
   #filename <- "MDS.SNV.CNV.tsv"
   #usePrecalculatedSampleSimilarityMatrix(netMaker, filename)

   g <- getSamplesGraph(netMaker)
   rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
   httpSetStyle(rcy, system.file(package="NetworkMaker", "extdata", "style.js"))
   tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=6000, yMax=6000)
   setPosition(rcy, tbl.pos)    
   fit(rcy, 100)
   g.chrom <- getChromosomeGraph(netMaker, goi)
   httpAddGraph(rcy, g.chrom)
   httpSetStyle(rcy, system.file(package="NetworkMaker", "extdata", "style.js"))
   tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=3400, yOrigin=0, yMax=3000, chromDelta=200)
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
   httpSetStyle(rcy, system.file(package="NetworkMaker", "extdata", "style.js")) 
   # temporary fix, accomodating orphan genes (not mapped to chromosomes):

   unpositioned.nodes <- names(which(!noa(g, "positioned")))
   selectNodes(rcy, unpositioned.nodes)
   layoutSelectionInGrid(rcy, x=-2000, y=3300, w=1400, h=400)
   fit(rcy)

   return(list(rcy=rcy, g=g, g.mut=g.mut, g.cn=g.cn, unpositioned=unpositioned.nodes))

} # create.and.display
#----------------------------------------------------------------------------------------------------
saveGraph <- function(rcy)
{
   g.markers.json <- getJSON(rcy)   # about 1M
   filename <- "../../../extdata/markers.json.RData"
   printf("saving as %s, %d nodes, %d edges", filename, getNodeCount(rcy), getEdgeCount(rcy))
   save(g.markers.json, file=filename)

} # saveGraph
#----------------------------------------------------------------------------------------------------
x <- create.and.display() 
rcy <- x$rcy
# some genes are not yet mapped because they use obsolete symbols.  until this is fixed, look
# for them at 0,0, move them to i.e., below chr 12, make sure they are selected, then
# layoutSelectionInGrid(rcy, x=5800, y=2000, w=800, h=400)


# when you are satisifed with the layout
  hideAllEdges(rcy)  # deselect any selections
  showEdges(rcy, "chromosome")
  saveGraph(rcy)
