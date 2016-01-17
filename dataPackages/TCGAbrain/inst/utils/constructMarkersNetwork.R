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
   tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=8000, yMax=8000)
   setPosition(rcy, tbl.pos)    
   
   fit(rcy, 100)
   g.chrom <- getChromosomeGraph(netMaker, goi)
   httpAddGraph(rcy, g.chrom)
   httpSetStyle(rcy, styleFile)
   
   tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=5000, yOrigin=0, yMax=4000, chromDelta=300)
   setPosition(rcy, tbl.pos)
   fit(rcy, 100)
   g.mut <- getMutationGraph(netMaker, goi)
   httpAddGraph(rcy, g.mut)
   gistic.scores <- c(-2, 2)
   
     # track down a bug in the build of TCGAbrain
     # expect a cnGain.2 edge between "TCGA.E1.5318" and PIK3R2
<<<<<<< HEAD
   mtx.cn <- getItem(dz, "mtx.cn")
=======
   mtx.cn <- matrices(dz)$mtx.cn
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
   gene <- "PIK3R2"
   sample <- "TCGA.E1.5318.01"
   mtx.cn[sample, gene]  # [1] -1, should be +2
   
   
   g.cn <- getCopyNumberGraph(netMaker, goi, gistic.scores)
   httpAddGraph(rcy, g.cn)
   hideAllEdges(rcy)
   showEdges(rcy, "chromosome")
   httpSetStyle(rcy, "../../../DEMOdz/inst/utils/style.js")
   fit(rcy)

   unpositioned.nodes <- names(which(!noa(g, "positioned")))
   selectNodes(rcy, unpositioned.nodes)
   layoutSelectionInGrid(rcy, x=-3000, y=2800, w=1400, h=400)
   fit(rcy)

   return(list(rcy=rcy, g=g, g.mut=g.mut, g.cn=g.cn, unpositioned=unpositioned.nodes))

} # create.and.display
#------------------------------------------------------------------------------------------------------------------------
saveGraph <- function(rcy)
{
<<<<<<< HEAD
   g.markers.char <- getJSON(rcy)

     # a convoluted way to get an actual json object to save via serialization
     # todo: will explore changing RCyjs::getJSON to produce json directly at another
     # todo:  time (pshannon, 12 jan 2016)

   g.markers.json <- toJSON(fromJSON(g.markers.char))
=======
   g.markers.json <- getJSON(rcy)
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
   filename <- "../extdata/markers.json.RData"
   printf("saving as %s, %d nodes, %d edges", filename, getNodeCount(rcy), getEdgeCount(rcy))
   save(g.markers.json, file=filename)

<<<<<<< HEAD


=======
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261
} # saveGraph
#------------------------------------------------------------------------------------------------------------------------
x <- create.and.display()
rcy <- x$rcy
<<<<<<< HEAD
hideAllEdges(rcy)
showEdges(rcy, "chromosome")
clearSelection(rcy)
selectNodes(rcy, c("C2ORF44", "DAXX", "DUX4", "FRG1B", "STL"))
layoutSelectionInGrid(rcy, x=7700, y=2000, w=800, h=400)
fit(rcy)
=======
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261

# some genes are not yet mapped because they use obsolete symbols.  until this is fixed, look
# for them at 0,0, move them to i.e., below chr 12, make sure they are selected, then
# layoutSelectionInGrid(rcy, x=7700, y=2000, w=800, h=400)


# when you are satisifed with the layout, deselect any selections, then
#  fit(rcy)
#  saveGraph(rcy)

