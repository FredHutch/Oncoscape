library(NetworkMaker)
library(TCGAbrain)
options(stringsAsFactors=FALSE)

dz <- TCGAbrain() 
netMaker <- NetworkMaker(dz)

#------------------------------------------------------------------------------------------------------------------------
create.and.display <- function()
{
   print(load("goi545.from.approvedHoboPlot25sep2015.RData"))
   stopifnot(all(c("MDM2", "MDM4") %in% goi))  # sanity check
          
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
   
     # track down a bug in the build of TCGAbrain
     # expect a cnGain.2 edge between "TCGA.E1.5318" and PIK3R2
   mtx.cn <- matrices(dz)$mtx.cn
   gene <- "PIK3R2"
   sample <- "TCGA.E1.5318.01"
   mtx.cn[sample, gene]  # [1] -1, should be +2
   
   
   g.cn <- getCopyNumberGraph(netMaker, goi, gistic.scores)
   httpAddGraph(rcy, g.cn)
   hideAllEdges(rcy)
   showEdges(rcy, "chromosome")
   httpSetStyle(rcy, "../../../DEMOdz/inst/utils/style.js")
   hideAllEdges(rcy)
   fit(rcy)

   unpositioned.nodes <- names(which(!noa(g, "positioned")))
   selectNodes(rcy, unpositioned.nodes)
   layoutSelectionInGrid(rcy, x=2300, y=1400, w=1000, h=500)
   fit(rcy)

   return(list(rcy=rcy, g=g, g.mut=g.mut, g.cn=g.cn, unpositioned=unpositioned.nodes))

} # create.and.display
#------------------------------------------------------------------------------------------------------------------------
saveGraph <- function()
{
   g.markers.json <- getJSON(rcy)
   filename <- "../extdata/markers.json.TCGAbrain.RData"
   printf("saving as %s, %d nodes, %d edges", filename, getNodeCount(rcy), getEdgeCount(rcy))
   save(g.markers.json, file=filename)

} # saveGraph
#------------------------------------------------------------------------------------------------------------------------
x <- create.and.display()

 
