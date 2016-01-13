# go.R
#------------------------------------------------------------------------------------------------------------------------
# to rerun:
#   python -m SimpleHTTPServer   # neeed for httpSetStyle(rcy, "style.js")
#   x <- run()
#   rcy <- x$rcy
#   names(x)   # "all.nodes" "patients"  "genes"     "drugs"     "g"         "rcy"      
#
# to adjust style:
#   make changes to style.js in this directory
#   httpSetStyle(rcy, "style.js")
#
# to update the UWlung package with your changes:
#   export(rcy)
#   
#   cd ../../../UWlung;
#   bump version number in DESCRIPTION file
#   R CMD install .
#
# --- other tips
#
#   fitContent(rcy); setZoom(rcy, 0.9 * getZoom(rcy)); saveLayout(rcy, filename=sprintf("layout.%s", as.numeric(Sys.time())))
#   restoreLayout(rcy, tail(sort(grep("^layout", dir(), value=TRUE)), n=1))
#   getPosition(rcy, getSelectedNodes(rcy)[1,]$name)[1, c("x", "y")]
#              x        y
#    1 -1581.371 1027.434
#
#   layoutSelectionInGrid(rcy, -1621.371, 987.4343, 800, 800)
#
#   hideAllEdges(rcy)
#   g.markers.json <- getJSON(rcy);
#   print(nchar(g.markers.json));
#   save(g.markers.json, file="../../../UWlung/inst/extdata/markers.json.RData")
#   
#   R CMD build UWlung
#   (cd ~/oncodev/hbolouri/oncoDev14/Oncoscape/inst/scripts/markersAndSamples; make tabs)
#
#  -- in the chrome console:
#
#  cy.nodes().map(function(node){return (node.degree())})
#  cy.nodes().map(function(node){node.data({degree: node.degree()})});
#
#------------------------------------------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)
library(org.Hs.eg.db)
library(RCyjs)
library(jsonlite)
library(stats)
library(TxDb.Hsapiens.UCSC.hg19.knownGene)   # for seqinfo access to chromosome lengths
library(GWASTools)   # for data.frame centromeres.hg19
#------------------------------------------------------------------------------------------------------------------------
baseDir <- system.file(package="UWlung", "extdata")
if(!exists("mtx.mut"))
  load(file.path(baseDir, "mtx.mut.RData"))

if(!exists("mtx.cn"))
  load(file.path(baseDir, "mtx.cn.RData"))

if(!exists("genes.oncoplex"))
   genes.oncoplex <- scan("oncoplexGenes.txt", what=character(0), sep="\n", quiet=TRUE)
   #genes.oncoplex <- read.table("oncogplexGenes.tsv", sep="\t", as=TRUE)[,1]

#------------------------------------------------------------------------------------------------------------------------
make <- function()
{
  reload();
  run()

  tbl.all <<- buildNodeInfoTable(genes.oncoplex)
  chroms <- sort(unique(tbl.all$chrom))

  for(chrom in chroms){
     chrom.indices <- which(tbl.all$chrom == chrom)
     printf("finding %d screen.y coords for chrom %s", length(chrom.indices), chrom)
     if(length(chrom.indices) > 0){
        tbl.sub <- tbl.all[chrom.indices,]
        screen.Y <- chromosomeLocToCanvas(tbl.sub)
        tbl.all[chrom.indices, "screen.y"] <<- screen.Y
        tbl.all[chrom.indices, "screen.x"] <<- calculate.screen.X(chrom, base.X=1500, delta=100)
        } # if any genes on this chromosome
     } # for chrom
   
   #y.X <- chromosomeLocToCanvas(tbl.X)
   telomeres <- subset(tbl.all, type %in% c("telomere.start", "telomere.end"))$name
   chroms <- paste("chr", c(1:22, "X", "Y"), sep="")
   
   chromosome.nodes <- sort(unique(subset(tbl.all, type=="arm")$name))
   #x <- createBaseGraph(chromosome.nodes, telomeres, genes, patients, maxNodes)
   all.nodes <- x$all.nodes
   genes <- x$genes
   patients <- x$patients
   g <- x$g
   rcy <- x$rcy

   g.chrom <<- createCentromereTelomereEdges(tbl.all)
   print(g.chrom)
   httpAddGraph(rcy, g.chrom)


  calculate.similarity()
  mds.layout()

  tbl.pos <- tbl.all[, c("name", "screen.x", "screen.y")]
  colnames(tbl.pos) <- c("id", "x", "y")
  setPosition(rcy, tbl.pos)
  showEdges(rcy, "chromosome")

  httpSetStyle(rcy, "style-brain.js")

  layout.file <- "layout.Sun.Sep.27.13:26:57.2015"
  restoreLayout(rcy, layout.file)
  

  fit(rcy)
  
} # make
#------------------------------------------------------------------------------------------------------------------------
run <- function ()
{
   x <<- oldcreateBaseGraph();
   
   patients <<- x$patients
   genes <- x$genes
   rcy <<- x$rcy

   viz(rcy)

   mtx.mut <- fix.gene.fusions() # reads in matrix, collapses gene fusions to "head" gene
   fmtx.mut <- mtx.mut[intersect(rownames(mtx.mut), patients), intersect(colnames(mtx.mut), genes)]
   if(nrow(fmtx.mut) > 0 & ncol(fmtx.mut) > 0){
      filter <- function(x) nzchar(x)
      xx <- matrix.to.interactionTable(fmtx.mut, as.character(fmtx.mut), filter)
      tbl <- xx$tbl
      orphan.genes <- xx$orphan.genes
      orphan.patients <- xx$orphan.patients
      g.mut <- createMutationGraph(tbl, orphan.patients)
      httpAddGraph(rcy, g.mut)
      }

   fmtx.cn <- mtx.cn[intersect(rownames(mtx.cn), patients), intersect(colnames(mtx.cn), genes)]
   filter <- function(x) abs(x) >= 1;
   xx <- matrix.to.interactionTable(fmtx.cn, as.integer(fmtx.cn), filter)
   g.cn <- createCopyNumberGraph(xx$tbl)
   httpAddGraph(rcy, g.cn)
   print(g.cn)

   invisible(x)
   
} # run
#------------------------------------------------------------------------------------------------------------------------
viz <- function(rcy)
{
   httpSetStyle(rcy, "style.js")
   restoreLayout(rcy, "layout")
   fitContent(rcy)
   setZoom(rcy, 0.85 * getZoom(rcy))

} # viz
#------------------------------------------------------------------------------------------------------------------------
export <- function(rcy)
{
   hideAllEdges(rcy)
   showEdges(rcy, "chromosome")
   g.markers.json <- getJSON(rcy);
   print(nchar(g.markers.json));
   destination.file <- "~/oncodev/hbolouri/dataPackages/UWlung/inst/extdata/markers.json.RData"
   save(g.markers.json, file=destination.file)
    
} # export
#------------------------------------------------------------------------------------------------------------------------
createCentromereTelomereEdges <- function(tbl)
{

   chroms.in.order <- c(1:22, "X", "Y")
   p.arm.nodes <- paste("chr", chroms.in.order, "p", sep="")
   q.arm.nodes <- paste("chr", chroms.in.order, "q", sep="")
   p.telomeres <- paste("start.", chroms.in.order, sep="")
   q.telomeres <- paste("end.", chroms.in.order, sep="")
    
   all.nodes <- c(p.arm.nodes, q.arm.nodes, p.telomeres, q.telomeres);

   g <- graphNEL(nodes=all.nodes, edgemode="directed")

   nodeDataDefaults(g, attr="nodeType") <- "unassigned"
   nodeDataDefaults(g, attr="subType") <- "unassigned"
   nodeDataDefaults(g, attr="label") <- "unassigned"

   
   edgeDataDefaults(g, attr="edgeType") <- "chromosome"

   #nodeData(g, patients, attr="nodeType") <- "patient"
   #nodeData(g, genes, attr="nodeType") <- "gene"
   #nodeData(g, chromosome.nodes, attr="nodeType") <- "chromosome"
   #nodeData(g, telomeres, attr="nodeType") <- "telomere"
   #nodeData(g, patients, attr="subType") <- as.character(tbl.gbmDzSubTypes[patients, "gbmDzSubType"])

  g <- addEdge(p.arm.nodes, p.telomeres, g)
  g <- addEdge(q.arm.nodes, q.telomeres, g)

  g

} # createCentromereTelomereEdges
#------------------------------------------------------------------------------------------------------------------------
createBaseGraph <- function(chromosome.nodes, telomeres, genes, patients, maxNodes=NA)
{
   patients.all <- sort(unique(c(rownames(mtx.mut), rownames(mtx.cn))))
   patients.lacking.essential.data <- c("UW.LU.0028",  # from direct inspection
                                        "UW.LU.0031",
                                        "UW.LU.0049",
                                        "UW.LU.0076",
                                        "UW.LU.0082",
                                        "UW.LU.0087",
                                        "UW.LU.0102")
   deleters <- intersect(patients.lacking.essential.data, patients.all)
   if(length(deleters) > 0){
      indices <- match(deleters, patients.all)
      patients.all <- patients.all[-indices]   # 97
      }

   all.nodes <- c(patients.all, genes, chromosome.nodes, telomeres)

   g <- graphNEL(nodes=all.nodes, edgemode="directed")

   nodeDataDefaults(g, attr="nodeType") <- "unassigned"
   nodeDataDefaults(g, attr="subType") <- "unassigned"
   nodeDataDefaults(g, attr="label") <- "unassigned"

   edgeDataDefaults(g, attr="edgeType") <- "mutation"
   edgeDataDefaults(g, attr="mutation") <- "unassigned"

   nodeData(g, patients, attr="nodeType") <- "patient"
   nodeData(g, genes, attr="nodeType") <- "gene"
   nodeData(g, chromosome.nodes, attr="nodeType") <- "chromosome"
   nodeData(g, telomeres, attr="nodeType") <- "telomere"
   #nodeData(g, patients, attr="subType") <- as.character(tbl.gbmDzSubTypes[patients, "gbmDzSubType"])

   rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
   setBrowserWindowTitle(rcy, "hobo SNA.CNA")
   g.base <- g   # 879 nodes, no edges

   return(list(all.nodes=all.nodes, patients=patients, genes=genes, g=g, rcy=rcy))

} # createBaseGraph
#------------------------------------------------------------------------------------------------------------------------
oldcreateBaseGraph <- function()
{
   patients.all <- sort(unique(c(rownames(mtx.mut), rownames(mtx.cn))))
   patients.lacking.essential.data <- c("UW.LU.0028",  # from direct inspection
                                        "UW.LU.0031",
                                        "UW.LU.0049",
                                        "UW.LU.0076",
                                        "UW.LU.0082",
                                        "UW.LU.0087",
                                        "UW.LU.0102")
   deleters <- intersect(patients.lacking.essential.data, patients.all)
   if(length(deleters) > 0){
      indices <- match(deleters, patients.all)
      patients.all <- patients.all[-indices]   # 97
      }

   #drugs.all <- sort(unique(tbl.dgi$drug_name))#[1:1880]
   #deleters <- which(is.na(drugs.all))
   #if(length(deleters) > 0)
   #    drugs.all <- drugs.all[-deleters]

   all.nodes <- c(patients.all, genes.oncoplex)

   g <- graphNEL(nodes=all.nodes, edgemode="directed")
   nodeDataDefaults(g, attr="nodeType") <- "unassigned"
   nodeDataDefaults(g, attr="subType") <- "unassigned"
   nodeDataDefaults(g, attr="id") <- "unassigned"
   nodeDataDefaults(g, attr="label") <- "unassigned"
   edgeDataDefaults(g, attr="edgeType") <- "mutation"
   edgeDataDefaults(g, attr="mutation") <- "unassigned"

   nodeData(g, patients.all, attr="nodeType") <- "patient"
   nodeData(g, genes.oncoplex, attr="nodeType") <- "gene"

   #gene.fusion.matches <- as.integer(gregexpr("[0-9,A-Z]{2,}\\-[0-9,A-Z]{2,}", genes.oncoplex, perl=TRUE))
   gene.fusion.matches <- grep("-fusion", genes.oncoplex, fixed=TRUE)
   gene.fusion.genes <- genes.oncoplex[gene.fusion.matches]

   nodeData(g, gene.fusion.genes, attr="nodeType") <- "gene fusion"

   nodeData(g, patients.all, attr="label") <- gsub("UW.LU.", "", patients.all, fixed=TRUE)
   nodeData(g, genes.oncoplex, attr="label") <- genes.oncoplex

   printf("== about to create rcy")
   print(g)
   rcy <- RCyjs(portRange=9047:9097, quiet=TRUE, graph=g, hideEdges=TRUE)

   return(list(all.nodes=all.nodes, patients=patients.all, genes=genes.oncoplex,
               drugs=c(), g=g, rcy=rcy))

                 

} # oldcreateBaseGraph
#----------------------------------------------------------------------------------------------------
# jenny came up with these names
# EML-ALK EPHB1-FGFR2 EZR-ROS1 RET-FRMD4A RET-KIF5B ROS1-CD74
# but the oncoplex team uses
# ALK-EML ROS1-EZR
fix.gene.fusion.names <- function()
{
   eml.alk <- grep("EML-ALK", colnames(mtx.mut))
   if(length(eml.alk) == 1)
       colnames(mtx.mut)[eml.alk] <- "ALK-EML"

   ezr.ros1 <- grep("EZR-ROS1", colnames(mtx.mut))
   if(length(ezr.ros1) == 1)
       colnames(mtx.mut)[ezr.ros1] <- "ROS1-EZR"
      
   #save(mtx.mut, file="~/oncodev/hbolouri/dataPackages/UWlung/inst/extdata/mtx.mut.RData")
   
} # fix.gene.fusion.names
#----------------------------------------------------------------------------------------------------
matrix.to.interactionTable <- function(mtx, vec, filter.func)
{
  indices <- which(filter.func(vec))
  count <- length(indices)
  patients <- rownames(mtx)
  patient.count <- length(patients)
  genes <- colnames(mtx)
  gene.count <- length(genes)
  
     # identify the row,col of every non-empty value
  rows <- 1 + (indices - 1) %% nrow(mtx)
  cols <- 1 + (indices -1) %/% nrow(mtx)
  vals = unlist(lapply(1:length(indices), function(i) mtx[rows[i], cols[i]]))

  tbl <- data.frame(row=rownames(mtx)[rows],
                    col=colnames(mtx)[cols],
                    val=vals, stringsAsFactors=FALSE)

  orphan.patients <- setdiff(patients, tbl$row)
  orphan.genes <- setdiff(genes, tbl$col)
  list(tbl=tbl, orphan.patients=orphan.patients, orphan.genes=orphan.genes)
  
} # matrix.to.interactionTable
#----------------------------------------------------------------------------------------------------
test.matrix.to.interactionTable <- function()
{
   print("--- test.matrix.to.interactionTable")
   m <- matrix(c(11, 0, 31,  0, 22, 32, 0, 23, 33, 14, 24, 34), nrow=3,ncol=4, byrow=FALSE, 
               dimnames=list(c("R1", "R2", "R3"), c("C1", "C2", "C3", "C4")))
   filter <- function(x) {x != 0}
   x <- matrix.to.interactionTable(m, as.integer(m), filter)
   tbl <- x$tbl

   checkEquals(dim(tbl), c(9, 3))
   checkEquals(length(x$orphan.patients), 0)
   checkEquals(length(x$orphan.genes), 0)

} # test.matrix.to.interactionTable
#----------------------------------------------------------------------------------------------------
createMutationGraph <- function(tbl, orphan.patients)
{
  patients <- tbl$row
  genes <- tbl$col
  mutations <- tbl$val
  
  all.nodes <- unique(c(patients, genes, orphan.patients))
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")
  nodeDataDefaults(g, attr="nodeType") <- "unassigned"
  nodeDataDefaults(g, attr="label") <- "unassigned"
  nodeDataDefaults(g, attr="id") <- "unassigned"
  edgeDataDefaults(g, attr="edgeType") <- "mutation"
  edgeDataDefaults(g, attr="mutation") <- "unassigned"

  g <- addEdge(patients, genes, g)

  all.patients <- c(patients, orphan.patients)
  
  nodeData(g, all.patients, "nodeType") <- "patient"
  nodeData(g, genes,    "nodeType") <- "gene"
  nodeData(g, genes,    "label")    <- genes
  nodeData(g, genes,    "id")    <- genes
  nodeData(g, all.patients, "label") <- gsub("UW.LU.", "", all.patients, fixed=TRUE)
  nodeData(g, all.patients, "id") <- all.patients

  edgeData(g, patients, genes, "mutation") <- mutations

  g

} # createMutationGraph
#----------------------------------------------------------------------------------------------------
createCopyNumberGraph <- function(tbl)
{
  patients <- tbl$row
  genes <- tbl$col
  gistic.scores <- tbl$val
  
  all.nodes <- unique(c(patients, genes))
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")
  
  nodeDataDefaults(g, attr="nodeType") <- "unassigned"
  nodeDataDefaults(g, attr="label") <- "unassigned"
  edgeDataDefaults(g, attr="edgeType") <- "unassigned"
  edgeDataDefaults(g, attr="gistic") <- 0

  g <- addEdge(patients, genes, g)

  nodeData(g, patients, "nodeType") <- "patient"
  nodeData(g, genes,    "nodeType") <- "gene"
  nodeData(g, genes,    "label")    <- genes
  nodeData(g, patients, "label") <- patients

     # create edgeType values which distinguish among the 4 non-neutral gistic scores +/- 1 and 2

  cnLoss.1 <- which(gistic.scores == -1)
  cnLoss.2 <- which(gistic.scores == -2)
  cnGain.1 <- which(gistic.scores == 1)
  cnGain.2 <- which(gistic.scores == 2)

  edgeData(g, patients[cnLoss.1], genes[cnLoss.1], "edgeType") <- "cnLoss.1"
  edgeData(g, patients[cnLoss.2], genes[cnLoss.2], "edgeType") <- "cnLoss.2"

  edgeData(g, patients[cnGain.1], genes[cnGain.1], "edgeType") <- "cnGain.1"
  edgeData(g, patients[cnGain.2], genes[cnGain.2], "edgeType") <- "cnGain.2"
  
  g

} # createCopyNumberGraph
#----------------------------------------------------------------------------------------------------
# colin and company one only one node per gene fusion base gene. so rather than the six reported
# in jenny's latest version, we now have only 4
# ALK-EML                 ALK
# EPHB1-FGFR2             EPHB1
# RET-FRMD4A              RET
# RET-KIF5B
# ROS1-CD74               ROS1
# ROS1-EZR
#
# the information thereby lost ends up in the mutation table, of which a local copy is kept here
# pending a more systematic approach.

fix.gene.fusions <- function()
{
   print(load("mtx.mut-beforeFusionCollapse.RData"))
   
   fusion.names <- c("ALK-EML", "EPHB1-FGFR2", "RET-FRMD4A",
                     "RET-KIF5B", "ROS1-CD74", "ROS1-EZR")

   # sapply(fusion.names, function(n) length(grep(n, colnames(mtx.mut))))
   #  ALK-EML EPHB1-FGFR2  RET-FRMD4A   RET-KIF5B   ROS1-CD74    ROS1-EZR 
   #        1           1           1           1           1           1
   # sapply(fusion.names, function(n) length(which(mtx.mut[, n] > 0)))
   # ALK-EML EPHB1-FGFR2  RET-FRMD4A   RET-KIF5B   ROS1-CD74    ROS1-EZR 
   #       2           1           0           1           1           2 
   
      # add the fusion name into the text for these 6 
   for(fusion.name in fusion.names){
      col.number <- grep(fusion.name, colnames(mtx.mut))
      stopifnot(length(col.number) == 1)
      fixes <- as.integer(which(mtx.mut[ , fusion.name] != ""))
      for(patient.row in fixes){
         current.text <- mtx.mut[patient.row, fusion.name] 
         new.text <- sprintf("%s: %s", fusion.name, current.text);
         printf("inserting %s into mtx.mut[%s, %s]", new.text, patient.row, fusion.name)
         mtx.mut[patient.row, fusion.name] <- new.text
         } # for patient.row   
      } # for fusion.row

    # no prior mtx.mut column for gene ALK
    # rename ALK-EML to simply ALK-fusion
   alk.hits <- which(nchar(mtx.mut[, "ALK-EML"]) > 0)
   if(length(alk.hits) > 0){
      col.number <- grep("ALK-EML", colnames(mtx.mut))
      colnames(mtx.mut)[col.number] <- "ALK-fusion"
      }
   
    # same for EPHB1
   fusion <- "EPHB1-FGFR2"   
   hits <- as.integer(which(nchar(mtx.mut[, fusion]) > 0))
   if(length(hits) > 0){
      col.number <- grep(fusion, colnames(mtx.mut))
      colnames(mtx.mut)[col.number] <- "EPHB1-fusion"
      }

       
    # RET-FRMD4A
   fusion <- fusion.names[3]  # no hits at present in UWlung
   hits <- as.integer(which(nchar(mtx.mut[, fusion]) > 0))
   col.number <- grep(fusion, colnames(mtx.mut))
   if(length(hits) > 0){
      printf("%d hits for %s", length(hits), fusion);
   } else{ # get rid of the column
      mtx.mut <- mtx.mut[, -col.number]   # being empty, get rid of this separate fusion column
      }

    # RET-KIF5B: just rename the column to RET-fusion
   fusion <- fusion.names[4]
   hits <- as.integer(which(nchar(mtx.mut[, fusion]) > 0))
   if(length(hits) > 0){
      col.number <- grep(fusion, colnames(mtx.mut))
      colnames(mtx.mut)[col.number] <- "RET-fusion"
      }


    # ROS1-CD74 just rename the column to  ROS1-fusion
   fusion <- fusion.names[5]
   hits <- as.integer(which(nchar(mtx.mut[, fusion]) > 0))
   if(length(hits) > 0){
      col.number <- grep(fusion, colnames(mtx.mut))
      colnames(mtx.mut)[col.number] <- "ROS1-fusion"
      }

    # ROS1-EZR:  add these into ROS1-fusion
   fusion <- fusion.names[6]
   hits <- as.integer(which(nchar(mtx.mut[, fusion]) > 0))
   if(length(hits) > 0){
      mtx.mut[hits, "ROS1-fusion"] <- mtx.mut[hits, fusion]
      col.number <- grep(fusion, colnames(mtx.mut))
      mtx.mut <- mtx.mut[, -col.number]   # now that the ROS1 columns are merged, get rid of this separate fusion column
      }

   expected.names <- c("ALK-fusion", "EPHB1-fusion", "RET-fusion", "ROS1-fusion")
   checkEquals(length(match(expected.names, colnames(mtx.mut))), 4)
   # sapply(expected.names, function(n) length(which(mtx.mut[, n] > 0)))
   #   ALK-fusion EPHB1-fusion   RET-fusion  ROS1-fusion 
   #            2            1            1            3 

   mtx.mut

} # fix.gene.fusions
#----------------------------------------------------------------------------------------------------
calculate.similarity <- function()
{
  mtx.mut.01 <-  (nchar(mtx.mut) > 0) + 0
    # most.mutated.tumors <- names(head(sort(apply(mtx.mut.01, 1, sum), decreasing=TRUE)))

  tumors.of.interest <- names(head(sort(apply(mtx.mut.01, 1, sum), decreasing=TRUE)))
  tumors.of.interest <- sort(intersect(rownames(mtx.mut), rownames(mtx.cn)))  # 104
  m0 <- mtx.mut.01[tumors.of.interest, ]
  colnames(m0) <- paste(colnames(m0), ".mut", sep="")
  m1 <- as.matrix(dist(m0))

  c0 <- mtx.cn[tumors.of.interest,]
  colnames(c0) <- paste(colnames(c0), ".cn", sep="")
  c1 <- as.matrix(dist(c0))

  mc0 <<- cbind(m0, c0)
  mc1 <<- as.matrix(dist(mc0))
  tbl.pos <<- as.data.frame(cmdscale(mc1, k=2))
  colnames(tbl.pos) <<- c("x", "y")
  tbl.pos3 <<- as.data.frame(cmdscale(mc1, k=3))
  colnames(tbl.pos3) <<- c("x", "y", "z")
  
} # calculate.similarity
#----------------------------------------------------------------------------------------------------
mds.layout <- function()
{
   tbl.pos <- tbl.pos3
   tbl.pos$y <- tbl.pos$y + (0.2 * tbl.pos$z)
   tbl.pos <- tbl.pos[, c("x", "y")]

   x.span = 2000
   y.span = 5000 

   x.range <- range(tbl.pos$x)  # [1] -0.6168073  2.8896624
   y.range <- range(tbl.pos$y)  # [1] -3.036395  1.003921

   x <- tbl.pos$x
   x <- x - min(x)  #
   x <- x/max(x)
   x <- (x * x.span) - (x.span/2)
   
   y <- tbl.pos$y
   y <- y - min(y)  #
   y <- y/max(y)
   y <- (y * y.span) - (y.span/2)

   tbl.pos$x <- x
   tbl.pos$y <- y
   tbl.pos$id <- rownames(tbl.pos)

   setPosition(rcy, tbl.pos)

} # mds.layout
#----------------------------------------------------------------------------------------------------
inspect <- function()
{
  x <- mc0[getSelectedNodes(rcy)$id,];
  x <- x[, which(colSums(x) != 0), drop=FALSE];
  x

} # inspect
#----------------------------------------------------------------------------------------------------
# genes, telomeres, p/q arm nodes at the centromere ends 
buildNodeInfoTable <- function(genes)
{
   db <- org.Hs.eg.db
   tbl <- select(db, columns=c("SYMBOL", "MAP", "CHRLOC"), keytype="SYMBOL", keys=genes)

       # some genes (e.g., ABL1 have multiple annotations.  we ignore them here, keeping only the first)
   dups <- which(duplicated(tbl$SYMBOL))
   if(length(dups) > 0)
      tbl <- tbl[-dups,]
   stopifnot(nrow(tbl) == length(genes))
   
   tbl$arm <- extractChromArmFromCytoband(tbl$MAP)
   tbl$type <- rep("gene", nrow(tbl))
   colnames(tbl) <- c("name", "map", "loc", "chrom", "arm", "type")

   chrom <- c(1:22, "X", "Y")
   names <- paste("start", chrom, sep=".")
   loc <- rep(0, length(names))
   arm <- rep("p", length(names))
   map <- rep("", length(names))
   type <- rep("telomere.start", length(names))
   
   tbl.start <- data.frame(name=names, map=map, loc=loc, chrom=chrom, arm=arm, type=type, stringsAsFactors=FALSE)
      
   names <- paste("end", chrom, sep=".")
   tbl.seqInfo <- as.data.frame(seqinfo(TxDb.Hsapiens.UCSC.hg19.knownGene))
   loc <- tbl.seqInfo[paste("chr", chrom, sep=""), "seqlengths"]
   arm <- rep("q", length(chrom))
   type <- rep("telomere.end", length(chrom))
   tbl.end <- data.frame(name=names, map=map, loc=loc, chrom=chrom, arm=arm, type=type, stringsAsFactors=FALSE)

      # --- specify data for 48 little "arm mini-nodes" at the centromere of each chromosome, chr[1:22,X,Y].[pq]
   
   if(!exists("centromeres.hg19"))
      data(centromeres.hg19)
   c.19 <- centromeres.hg19  
   names <- c(paste("chr", c.19$chrom, "p", sep=""), paste("chr", c.19$chrom, "q", sep=""))
   loc   <- c(c.19$left.base, c.19$right.base)  
   chrom <- rep(c(1:22, "X", "Y"),  2)
   arm <- c(rep("p", nrow(c.19)), rep("q", nrow(c.19)))
   type <- rep("arm", length(arm))
   tbl.arms <- data.frame(name=names, map=map, loc=loc, chrom=chrom, arm=arm, type=type, stringsAsFactors=FALSE)


   tbl <- rbind(tbl, tbl.start, tbl.end, tbl.arms)
   tbl <- cbind(tbl, list(screen.x=rep(0,nrow(tbl)),
                          screen.y=rep(0,nrow(tbl))),
                   stringsAsFactors=FALSE)
   
   badly.mapped <- which(!tbl$chrom %in% c(0:22, "X", "Y"))
   if(length(badly.mapped) > 0){
      badly.mapped.gene.names <- tbl$name[badly.mapped]
      warning(sprintf("failed to map these genes to chromosomes: %s", paste(badly.mapped.gene.names, collapse=", ")))
      tbl <- tbl[-badly.mapped,]
      } # some genes failed to map to chromosomes

   sample.indices <- c(head(grep("gene", tbl$type), n=2),
                       head(grep("arm", tbl$type), n=2),
                       head(grep("telomere.start", tbl$type), n=2),
                       head(grep("telomere.end", tbl$type), n=2))
   print(tbl[sample.indices,])

   tbl

} # buildNnodeInfoTable
#----------------------------------------------------------------------------------------------------
extractChromArmFromCytoband <- function(bands)
{
   arm.p <- grep("p", bands)
   arm.q <- grep("q", bands)
   arm.na <- which(is.na(bands))
   arm.cen <- grep("cen", bands)
   stopifnot(sum(length(arm.p), length(arm.q),  length(arm.na), length(arm.cen)) == length(bands))

   result <- vector("character", length(bands))
   result[arm.p] <- "p"
   result[arm.q] <- "q"
   result[arm.cen] <- "cen"
   result[arm.na] <- NA

   names(result) <- bands
   result
   
} # extractChromArmFromCytoband
#----------------------------------------------------------------------------------------------------
chromosomeLocToCanvas <- function(tbl)
{
   stopifnot(length(unique(tbl$chrom)) == 1)   # just one chromosome at a time

   loc.half.span <- 249250621/2    # a bit more than the length of chrom 1, the longest
   center.y <- 0
   top.y <- 2000                   # drawing is done from zero at center of screen to this pixel height
   scale <- loc.half.span / top.y
   
   loc.midpoints <- subset(tbl, type=="arm")$loc
   loc.mid <- sum(loc.midpoints)/2;   # map this to canvas coordinate y=0
   loc.max <- subset(tbl, type=="telomere.end")$loc
   loc.min <- subset(tbl, type=="telomere.start")$loc
   canvas.y <- function(loc){
      y <- abs(loc) - loc.mid
      y <- y /scale
      y * -1
      }

   as.integer(canvas.y(tbl$loc))


} # chromosomeLocToCanvas
#----------------------------------------------------------------------------------------------------
calculate.screen.X <- function(chrom, base.X=2000, delta=300)
{
   chroms <- c(1:22, "X", "Y")
   stopifnot(chrom %in% chroms)
   count <- match(chrom, chroms) - 1

   screen.x <- base.X + (count * delta)

   screen.x

} # calculate.screen.X
#----------------------------------------------------------------------------------------------------
createGenesOnChromsomesGraph <- function()
{
   tbl.all <<- buildNodeInfoTable(genes.oncoplex)
   chroms <- sort(unique(tbl.all$chrom))

   for(chrom in chroms){
      chrom.indices <- which(tbl.all$chrom == chrom)
      printf("finding %d screen.y coords for chrom %s", length(chrom.indices), chrom)
      if(length(chrom.indices) > 0){
         tbl.sub <- tbl.all[chrom.indices,]
         screen.Y <- chromosomeLocToCanvas(tbl.sub)
         tbl.all[chrom.indices, "screen.y"] <<- screen.Y
         tbl.all[chrom.indices, "screen.x"] <<- calculate.screen.X(chrom, base.X=1000, delta=300)
         } # if any genes on this chromosome
      } # for chrom
   
   #y.X <- chromosomeLocToCanvas(tbl.X)
   telomeres <- subset(tbl.all, type %in% c("telomere.start", "telomere.end"))$name
   chroms <- paste("chr", c(1:22, "X", "Y"), sep="")
   
   chromosome.nodes <- sort(unique(subset(tbl.all, type=="arm")$name))
   #x <- createBaseGraph(chromosome.nodes, telomeres, genes, patients, maxNodes)
   all.nodes <- x$all.nodes
   genes <- x$genes
   patients <- x$patients
   g <- x$g
   rcy <- x$rcy

   g.chrom <<- createCentromereTelomereEdges(tbl.all)
   print(g.chrom)
   httpAddGraph(rcy, g.chrom)

} # createGenesOnChromosomesGraph
#----------------------------------------------------------------------------------------------------
if(!interactive()){
  x <- run()
  rcy <- x$rcy
  #viz (rcy)
  export(rcy)
  }
