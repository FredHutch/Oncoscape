library(NetworkMaker)
library(SttrDataPackage)
library(org.Hs.eg.db)

printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors=FALSE)

#install.packages("/Volumes/homes/Lisa/oncoscape/OncoGit/Oncoscape/dataPackages/RCyjs", type="source", repos=NULL)
#browserFile = "/Library/Frameworks/R.framework/Versions/3.2/Resources/library/RCyjs/scripts/rcyjs.html"
#http://oncoscape-static.s3-website-us-west-2.amazonaws.com/

#--------------------------------- make plot data -----------------------------#
diseaseAbbr <-c("BRCA", "LUNG", "LUAD","PRAD","LGG","GBM","LGG.GBM")
diseaseDataP <- c("TCGAbrca", "TCGAlung","TCGAluad","TCGAprad","TCGAlgg","TCGAgbm","TCGAbrain")

#----------------------------------------------------------------------------------------------------
create.and.display <- function(includeUnpositionedSamples=TRUE)
{
   load(system.file(package="NetworkMaker", "extdata", "genesets.RData"))
   goi <- sort(unique(c(genesets$tcga.GBM.classifiers, genesets$marker.genes.545)))
   db <- org.Hs.eg.db
   tbl <- select(db, columns=c("SYMBOL", "MAP", "CHRLOC"), keytype="SYMBOL", keys=goi)
   goi <- unique(tbl[!is.na(tbl$MAP),"SYMBOL"]);
   goi <- goi[-which(goi=="MAPT")]
 
 #	goi <- getAlteredGeneNames(netMaker)
   gistic.scores <-c(-2, 2)
   
   #calculateSampleSimilarityMatrix(netMaker, genes=goi, copyNumberValues=gistic.scores)
   filename <- "MDS.SNV.CNV.tsv"
   usePrecalculatedSampleSimilarityMatrix(netMaker, filename)

   g <- getSamplesGraph(netMaker, includeUnpositionedSamples)
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

   poi <- names(which(noa(g, "positioned")))
   g.mut <- getMutationGraph(netMaker, goi, poi)
   httpAddGraph(rcy, g.mut)
   hideAllEdges(rcy)

   g.cn <- getCopyNumberGraph(netMaker, goi, poi, gistic.scores)
   httpAddGraph(rcy, g.cn)
   hideAllEdges(rcy)

#   g.splice <- getSplicingGraph(netMaker, goi)
#   httpAddGraph(rcy, g.splice)
#   hideAllEdges(rcy)
   showEdges(rcy, "chromosome")
   fit(rcy)

   httpSetStyle(rcy, system.file(package="NetworkMaker", "extdata", "style.js")) 
   # temporary fix, accomodating orphan genes (not mapped to chromosomes):
   
   unpositioned.nodes <- names(which(!noa(g, "positioned")))
#   selectNodes(rcy, unpositioned.nodes)
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

for(i in 1:length(diseaseAbbr)){
	diseaseName= diseaseAbbr[i]
	dataFolderName = diseaseDataP[i]
	
	print(diseaseName)

	setwd(paste("/Volumes/homes/Lisa/oncoscape/OncoGit/Oncoscape/dataPackages",dataFolderName, "inst/import/network/marker/", sep="/"))
#	filePath <- paste0("/Volumes/homes/HollandLabShared/Hamid/Oncoscape2015/", diseaseName)

#	MDS.SNV.CNV.OV <- get(load(paste0(filePath,"/MDS.SNV.CNV.OV.RData")))

#	write.table(MDS.SNV.CNV.OV, file="MDS.SNV.CNV.tsv", quote=F, sep="\t", col.names=c("x","y"))

	eval(parse(text=sprintf("library(%s)", dataFolderName)))
	eval(parse(text=sprintf("dz <- %s()" , dataFolderName)))

	netMaker <- NetworkMaker(dz)
	
	x <- create.and.display(includeUnpositionedSamples=FALSE) 
	rcy <- x$rcy

	hideAllEdges(rcy)  # deselect any selections
	showEdges(rcy, "chromosome")
	saveGraph(rcy)

}
