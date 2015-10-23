# go.R
#------------------------------------------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)
library(org.Hs.eg.db)
library(TxDb.Hsapiens.UCSC.hg19.knownGene)   # for seqinfo access to chromosome lengths
library(GWASTools)   # for data.frame centromeres.hg19
library(TCGAgbm)
library(TCGAlgg)
library(RCyjs)
library(jsonlite)
#------------------------------------------------------------------------------------------------------------------------
# hamid's snp and copynumber multi-dimensional scaling dataset
if(!exists("tbl.tumorCoords")){
   load("MDS.joint.SNA.CNA.allGenes.RData")   # coords.SNA.CNA
   tbl.tumorCoords <- coords.SNA.CNA
}

# our current standard set of genes:
if(!exists("goi"))
  load("goi545.RData")

# read in and prepare the matrices
if(!exists("gbm")){
   load("tbl.dzSubTypes.RData")
   gbm <- TCGAgbm()

   mtx.mut.gbm <- matrices(gbm)$mtx.mut
   names.trimmed <- sub(".0[12]$", "", rownames(mtx.mut.gbm))
   rownames(mtx.mut.gbm) <- names.trimmed

   mtx.cn.gbm <- matrices(gbm)$mtx.cn
   names.trimmed <- sub(".0[12]$", "", rownames(mtx.cn.gbm))
   rownames(mtx.cn.gbm) <- names.trimmed

   }

if(!exists("lgg")){
   lgg <- TCGAlgg()

   mtx.mut.lgg <- matrices(lgg)$mtx.mut
   names.trimmed <- sub(".0[12]$", "", rownames(mtx.mut.lgg))
   rownames(mtx.mut.lgg) <- names.trimmed

   mtx.cn.lgg <- matrices(lgg)$mtx.cn
   names.trimmed <- sub(".0[12]$", "", rownames(mtx.cn.lgg))
   rownames(mtx.cn.lgg) <- names.trimmed
   }

#------------------------------------------------------------------------------------------------------------------------
make <- function()
{
  rcy <<- run()
  viz(rcy)
  hobo.tumor.layout()
  fitContent(rcy)
  tbl.pos <- tbl.all[, c("name", "screen.x", "screen.y")]
  colnames(tbl.pos) <- c("id", "x", "y")
  setPosition(rcy, tbl.pos)
  viz(rcy)
  setEdgeStyle(rcy, "bezier")
  showEdges(rcy, "chromosome")
  load("tbl.pos.orphanGenes.RData");
  setPosition(rcy, tbl.pos.orphanGenes)

} # make
#------------------------------------------------------------------------------------------------------------------------
run <- function(maxNodes=NA)
{
   genes <- goi;
   patients <- sort(unique(c(rownames(mtx.mut.lgg),
                             rownames(mtx.mut.gbm),
                             rownames(mtx.cn.lgg),
                             rownames(mtx.cn.lgg))))  # 807 patients

   patients <- intersect(rownames(tbl.tumorCoords), patients)  # now 731
   tbl.all <<- buildNodeInfoTable(goi)
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
   x <- createBaseGraph(chromosome.nodes, telomeres, genes, patients, maxNodes)
   all.nodes <- x$all.nodes
   genes <- x$genes
   patients <- x$patients
   g <- x$g
   rcy <- x$rcy

   g.chrom <<- createCentromereTelomereEdges(tbl.all)
   print(g.chrom)
   httpAddGraph(rcy, g.chrom)

   fmtx.mut <- mtx.mut.lgg[intersect(rownames(mtx.mut.lgg), patients), intersect(colnames(mtx.mut.lgg), genes)]
   if(nrow(fmtx.mut) > 0 & ncol(fmtx.mut) > 0){
      filter <- function(x) nzchar(x)
      x <- matrix.to.interactionTable(fmtx.mut, as.character(fmtx.mut), filter)
      tbl <- x$tbl
      orphan.genes <- x$orphan.genes
      orphan.patients <- x$orphan.patients
      g.mut <- createMutationGraph(tbl, orphan.patients)
      printf("--- g.mut lgg");
      httpAddGraph(rcy, g.mut)
      }
   

   fmtx.mut <- mtx.mut.gbm[intersect(rownames(mtx.mut.gbm), patients), intersect(colnames(mtx.mut.gbm), genes)]
   if(nrow(fmtx.mut) > 0 & ncol(fmtx.mut) > 0){
      filter <- function(x) nzchar(x)
      x <- matrix.to.interactionTable(fmtx.mut, as.character(fmtx.mut), filter)
      tbl <- x$tbl
      orphan.genes <- x$orphan.genes
      orphan.patients <- x$orphan.patients
      g.mut <- createMutationGraph(tbl, orphan.patients)
      printf("--- g.mut gbm");
      print(g.mut)
      httpAddGraph(rcy, g.mut)
      }
   

   fmtx.cn <- mtx.cn.lgg[intersect(rownames(mtx.cn.lgg), patients), intersect(colnames(mtx.cn.lgg), genes)]
   filter <- function(x) abs(x) == 2;
   x <- matrix.to.interactionTable(fmtx.cn, as.integer(fmtx.cn), filter)
   g.cn <- createCopyNumberGraph(x$tbl)
   printf("--- g.cn lgg");
   print(g.cn)
   httpAddGraph(rcy, g.cn)

   fmtx.cn <- mtx.cn.gbm[intersect(rownames(mtx.cn.gbm), patients), intersect(colnames(mtx.cn.gbm), genes)]
   #filter <- function(x) abs(x) > 1;
   filter <- function(x) abs(x) == 2;
   x <- matrix.to.interactionTable(fmtx.cn, as.integer(fmtx.cn), filter)
   g.cn <- createCopyNumberGraph(x$tbl)
  # browser()
   printf("--- g.cn gbm");
   print(g.cn)
   httpAddGraph(rcy, g.cn)

    rcy

} # run
#----------------------------------------------------------------------------------------------------
viz <- function(rcy)
{
   httpSetStyle(rcy, "style.js")
   #restoreLayout(rcy, "hobo3.layout");
   #load("layout-2015aug03-good.RData")
   #for(i in 1:nrow(tbl.layout))
   #   setPosition(rcy, tbl.layout[i,])

   fit(rcy)

} # viz
#----------------------------------------------------------------------------------------------------
export <- function(rcy)
{
   #hideAllEdges(rcy)

   g.markers.json <- getJSON(rcy);
   print(nchar(g.markers.json));
   save(g.markers.json, file="markers.json.RData")

} # export
#------------------------------------------------------------------------------------------------------------------------
createBaseGraph <- function(chromosome.nodes, telomeres, genes, patients, maxNodes=NA)
{
   all.nodes <- c(patients, genes, chromosome.nodes, telomeres)

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
   nodeData(g, patients, attr="subType") <- as.character(tbl.gbmDzSubTypes[patients, "gbmDzSubType"])

   rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
   setBrowserWindowTitle(rcy, "hobo SNA.CNA")
   g.base <- g   # 879 nodes, no edges

   return(list(all.nodes=all.nodes, patients=patients, genes=genes, g=g, rcy=rcy))

} # createBaseGraph
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
runTests <- function()
{
  #test_createChromList()
  #test_classifyNodes()
  test.createChromosomeTable()
  test.matrix.to.interactionTable()
  test.createMutationGraph()
  test.createCopyNumberGraph()
  test.createChromosomeGraph()

  test.createArmLocChromosomeTable()
  test.buildNodeInfoTable()
  test.extractChromArmFromCytoband()
  test.calculate.screen.X()
  
} # runTests
#------------------------------------------------------------------------------------------------------------------------
oldrun = function (levels)
{
  if (-1 %in% levels) {   # first load the 545 genes used in the old TCGAgbm only network
    setwd("~/oncodev/hbolouri/dataPackages/networks/TCGAbrainMarkersAndTissues/prep/")
    old.dir <- getwd()
    setwd("~/s/data/hamid/repo/hbolouri/oncoDev/prep/tcgaMarkersAndTissues/markers")
    source("go.R");
    loadData();
    goi <<- goi()
    setwd(old.dir)
    save(goi, file="goi545.RData")
    } # 0

  if(0 %in% levels)
    load("goi545.RData", envir=.GlobalEnv)
  
  if (1 %in% levels) { # hamid suggests choosing genes mutant in > 5% of samples
    mutant.counts <<- apply(mtx.mut.gbm, 2, function(column) length(which(column != "")))
    threshold <- 0.02;
    gbm.mutant.genes.sig <<-mutant.counts[as.integer(which(mutant.counts > (threshold * nrow(mtx.mut.gbm))))]
    printf("gbm genes mut (threshold %5.2f): %d", threshold, length(gbm.mutant.genes.sig))
    } # 1


  if (2 %in% levels) {
    mutant.counts <<- apply(mtx.mut.lgg, 2, function(column) length(which(column != "")))
    #print(fivenum(mutant.counts))
       # 0.01: 744
       # 0.02: 102
       # 0.03:  42
       # 0.04:  30
       # 0.05:  16
    threshold <- 0.02;
    lgg.mutant.genes.sig <<- mutant.counts[as.integer(which(mutant.counts > (threshold * nrow(mtx.mut.lgg))))]
    printf("lgg genes mut (threshold %5.2f): %d", threshold, length(lgg.mutant.genes.sig))
    } # 2

  if (3 %in% levels) {
      # now learn gbm genes with non-zero gistic scores.
      # identify for the big list (goi.all) 
    cn.counts <<- colSums(abs(mtx.cn.gbm))
       # 
    #print(fivenum(cn.counts))
       #  1%: 993
       #  2%: 142
       #  3%: 47
       #  4%: 25
       #  5%: 18   
    threshold <- 525
    gbm.cn.genes.sig <<-cn.counts[as.integer(which(cn.counts > threshold))]
    printf("gbm genes cn  (threshold %d): %d", threshold, length(gbm.cn.genes.sig))
    } # 3

  if (4 %in% levels) {
    cn.counts <<- colSums(abs(mtx.cn.lgg))
    #print(fivenum(cn.counts))
       #  1%: 993
       #  2%: 142
       #  3%: 47
       #  4%: 25
       #  5%: 18   
    threshold <- 325
    lgg.cn.genes.sig <<-cn.counts[as.integer(which(cn.counts > threshold))]
    printf("lgg genes cn  (threshold %d): %d", threshold, length(lgg.cn.genes.sig))
    } # 4

  if (5 %in% levels) {  # now combine
    printf("goi: %d", length(goi))
    printf("gbm.mutant.genes.sig: %d", length(gbm.mutant.genes.sig))
    printf("lgg.mutant.genes.sig: %d", length(lgg.mutant.genes.sig))
    printf("lgg.cn.genes.sig:     %d", length(lgg.cn.genes.sig))
    printf("gbm.cn.genes.sig:     %d", length(gbm.cn.genes.sig))

    goi.all <<- sort(unique(c(goi, names(lgg.cn.genes.sig),
                                   names(gbm.cn.genes.sig),
                                   names(gbm.mutant.genes.sig),
                                   names(lgg.mutant.genes.sig))))
    printf("goi.all:              %d", length(goi.all))
    } # 5

  if (6 %in% levels) {
    list.mut.gbm <<- createMutationList(goi.all, mtx.mut.gbm)
    list.mut.lgg <<- createMutationList(goi.all, mtx.mut.lgg)
    } # 6

  if (7 %in% levels) {
    list.cn.gbm <<- createGisticList(goi.all, mtx.cn.gbm)
    list.cn.lgg <<- createGisticList(goi.all, mtx.cn.lgg)
    } # 7

  if (8 %in% levels) {
    list.cnL.gbm <<- createGisticList(goi.all, mtx.cn.gbm, "loss")   # 558
    list.cnG.gbm <<- createGisticList(goi.all, mtx.cn.gbm, "gain")   # 560
    list.cnL.lgg <<- createGisticList(goi.all, mtx.cn.lgg, "loss")   # 491
    list.cnG.lgg <<- createGisticList(goi.all, mtx.cn.lgg, "gain")   # 441
    } # 8

  if (9 %in% levels) {
    list.chrom <<- createChromList(goi.all)
    } # 9


  if (10 %in% levels) {
     list.cat <<- classifyNodes(goi.all, list.chrom,
                                list.cnL.gbm, list.cnG.gbm,
                                list.cnL.lgg, list.cnG.lgg,
                                list.mut.gbm, list.mut.lgg)
    } # 10

  if (11 %in% levels) {
    g.all <<- createGraph(goi.all,
                          list.chrom,
                          list.cnL.gbm, list.cnG.gbm,
                          list.cnL.lgg, list.cnG.lgg,
                          list.mut.gbm, list.mut.lgg)
    save(g.all, file="g.all.RData")
    } # 11

  if (12 %in% levels) {
    if(!exists("g.all"))
       load("g.all.RData")
    cw <<- new.CytoscapeWindow("gbm-lgg", g.all, host="127.0.0.1", overwriteWindow=TRUE)
    displayGraph(cw)
    } # 12

  if (13 %in% levels) {
    } # 13

  if (14 %in% levels) {
    } # 14

  if (15 %in% levels) {
    } # 15

  if (16 %in% levels) {
    } # 16

  if (17 %in% levels) {
    } # 17

  if (18 %in% levels) {
    } # 18

  if (19 %in% levels) {
    } # 19

  if (20 %in% levels) {
    } # 20


} # run
#------------------------------------------------------------------------------------------------------------------------
createMutationList <- function(genes, mtx.mut)
{
  mut.genes <- intersect(genes, colnames(mtx.mut))
  mtx <- mtx.mut[, mut.genes]

  result <- apply(mtx, 1, function(vec) vec[vec != ""])
  keepers <- which(lapply(result, length) > 0)
  result[keepers]

} # createMutationList
#------------------------------------------------------------------------------------------------------------------------
createGisticList <- function(genes, mtx.cn, direction=NA)
{
  cn.genes <- intersect(genes, colnames(mtx.cn))
  mtx <- mtx.cn[, cn.genes]

  if(is.na(direction))
     result <- apply(mtx, 1, function(vec) vec[vec != 0])
  else if(direction=="loss")
     result <- apply(mtx, 1, function(vec) vec[vec < 0])
  else if(direction=="gain")
     result <- apply(mtx, 1, function(vec) vec[vec > 0])
      
  keepers <- which(lapply(result, length) > 0)
  result[keepers]
  
} # createGisticList
#------------------------------------------------------------------------------------------------------------------------
# given gene symbols, create a named list of form c(CUL1="chr7", CD74="chr5")
# cd74 <- "972"
# cul1 <- "8454"
createChromList <- function (geneSyms)
{
  geneIDs <- mget(geneSyms, org.Hs.egSYMBOL2EG, ifnotfound=NA)
  deleters <- which(is.na(geneIDs))
  if(length(deleters) > 0){
    indices <- as.integer(deleters)
    geneIDs <- geneIDs[-indices]
    }

     # eliminate any multiple assignments
  counts <- lapply(geneIDs, length)
  multiples <- as.integer(which(counts > 1))
  for(mult in multiples)
      geneIDs[[mult]] <- geneIDs[[mult]][1]
  
  suppressWarnings(chrom.list <- mget(as.character(geneIDs), org.Hs.egCHR))

    # reduce any double chromosome assignements (eg, CRLF2: XY) to single
  chrom.list.singles <- lapply(chrom.list, "[", 1)

    # now prepend "chr" to each chrom name
  
  chroms <- paste0("chr", as.character(chrom.list.singles))
  names(chroms) <- as.character(mget(names(chrom.list.singles), org.Hs.egSYMBOL))
  
  chroms

} # createChromList
#----------------------------------------------------------------------------------------------------
test_createChromList <- function()
{
   print("--- test_createChromList")

   geneSyms.2 <- c("CUL1", "CD74")
   x <- create.chrom.list(geneSyms.2)
   checkEquals(x[["CUL1"]], "chr7")
   checkEquals(x[["CD74"]], "chr5")

   x <- create.chrom.list(c(geneSyms.2, "bogusGeneSymbol"))
   checkEquals(length(x), 2)
   checkEquals(x[["CUL1"]], "chr7")
   checkEquals(x[["CD74"]], "chr5")

      # look at a short list with some chrX/chrY genes
   xy.genes <- c("TRIM33", "CRLF2", "P2RY8", "TRIP11")
   x <- create.chrom.list(c(xy.genes, "bogusGeneSymbol"))
   checkEquals(names(x), xy.genes)
   checkEquals(as.character(x), c("chr1", "chrX", "chrX","chr14"))

   geneSyms.big <- goi
   checkEquals(length(geneSyms.big), 545)
   x <- create.chrom.list(geneSyms.big)
   checkEquals(x[["CUL1"]], "chr7")
   checkEquals(x[["CD74"]], "chr5")

} # test.createChromList
#----------------------------------------------------------------------------------------------------
createGraph <- function(goi, list.chrom,
                        list.cnL.gbm, list.cnG.gbm,
                        list.cnL.lgg, list.cnG.lgg,
                        list.mut.gbm, list.mut.lgg)
{

  chroms <- sort(unique(as.character(list.chrom)))
  patients <- sort(unique(c(names(list.cnL.gbm),
                            names(list.cnG.gbm),
                            names(list.cnL.lgg),
                            names(list.cnG.lgg),
                            names(list.mut.gbm),
                            names(list.mut.lgg))))
  

  list.cat <- classifyNodes(goi, list.chrom,
                            list.cnL.gbm, list.cnG.gbm,
                            list.cnL.lgg, list.cnG.lgg,
                            list.mut.gbm, list.mut.lgg)

  all.nodes <- names(list.cat$types)
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")
  nodeDataDefaults(g, attr="nodeType") <- "unassigned"
  nodeDataDefaults(g, attr="subType") <- "unassigned"
  nodeDataDefaults(g, attr="label") <- "unassigned"

  edgeDataDefaults(g, attr="edgeType") <- "mutation"
  edgeDataDefaults(g, attr="mutation") <- "unassigned"
  edgeDataDefaults(g, attr="gistic") <- 0


  nodeTypes <- list.cat$types
  nodeData(g, names(nodeTypes), attr="nodeType") <- as.character(nodeTypes)

  subTypes <- list.cat$subtypes
  nodeData(g, names(subTypes), attr="subType") <- as.character(subTypes)

  patients <- names(list.mut.gbm)

  #--------------------------------------------------------------------------------
  #               adding mut gbm
  #--------------------------------------------------------------------------------
  
  printf("--- adding mut gbm")
  size <- length(unlist(list.mut.gbm))
  tbl <- data.frame(a=vector("character", size),
                    b=vector("character", size),
                    edgeType=vector("character", size),
                    mutation=vector("character", size),
                    stringsAsFactors=FALSE)

  i = 0
  for(patient in patients){
     patient.info <- list.mut.gbm[[patient]]
     genes <- names(patient.info)
     for(gene in genes){
       i = i + 1;
       mutation <- patient.info[[gene]]
       new.row <- list(a=gene, b=patient, edgeType="mutantIn", mutation=mutation)
       tbl[i,] <-new.row
       } # for gene
    } # for patient
  
  save(tbl, file="tbl01.RData")
  g <- addEdge(tbl$a, tbl$b, g)
  edgeData(g, tbl$a, tbl$b, attr="edgeType") <- tbl$edgeTypeype
  edgeData(g, tbl$a, tbl$b, attr="mutation") <- tbl$mutation

  save(g, file="g01.RData")

  #--------------------------------------------------------------------------------
  #               adding mut lgg
  #--------------------------------------------------------------------------------

  patients <- names(list.mut.lgg)
  tbl <- data.frame(a=character(0), b=character(0), edgeType=character(0),
                    mutation=character(0), stringsAsFactors=FALSE);

  printf("--- adding mut.lgg")
  size <- length(unlist(list.mut.lgg))
  tbl <- data.frame(a=vector("character", size),
                    b=vector("character", size),
                    edgeType=vector("character", size),
                    mutation=vector("character", size),
                    stringsAsFactors=FALSE)

  i <- 0
  
  for(patient in patients){
     patient.info <- list.mut.lgg[[patient]]
     genes <- names(patient.info)
     for(gene in genes){
       i <- i + 1
       mutation <- patient.info[[gene]]
       new.row <- list(a=gene, b=patient, edgeType="mutantIn", mutation=mutation)
       tbl[i,] <-new.row
       } # for gene
    } # for patient
  
  save(tbl, file="tbl02.RData")
  g <- addEdge(tbl$a, tbl$b, g)
  edgeData(g, tbl$a, tbl$b, attr="edgeType") <- tbl$edgeType
  edgeData(g, tbl$a, tbl$b, attr="mutation") <- tbl$mutation

  save(g, file="g02.RData")


  #--------------------------------------------------------------------------------
  #               adding cnL.gbm
  #--------------------------------------------------------------------------------

  size <- length(unlist(list.cnL.gbm))
  printf("--- adding cnL.gbm: %d rows", size)
  tbl <- data.frame(a=vector("character", size),
                    b=vector("character", size),
                    edgeType=vector("character", size),
                    mutation=vector("character", size),
                    stringsAsFactors=FALSE)

  patients <- names(list.cnL.gbm)

  i <- 0

  for(patient in patients){
     patient.info <- list.cnL.gbm[[patient]]
     genes <- names(patient.info)
     for(gene in genes){
       i <- i + 1;
       gistic.score <- patient.info[[gene]]
       #printf("%12s -> %8s (%d)", patient, gene, gistic.score);
       new.row <- list(a=gene, b=patient, edgeType="copyNumberLoss", score=gistic.score)
       tbl[i,] <- new.row
       } # for gene
    } # for patient
  
  save(tbl, file="tbl03.RData")
  g <- addEdge(tbl$a, tbl$b, g)
  edgeData(g, tbl$a, tbl$b, attr="edgeType") <- "copyNumberLoss"
  edgeData(g, tbl$a, tbl$b, attr="gistic") <- gistic.score

  save(g, file="g03.RData")

  #--------------------------------------------------------------------------------
  #               adding cnG.gbm
  #--------------------------------------------------------------------------------
  size <- length(unlist(list.cnG.gbm))
  printf("--- adding cnG.gbm: %d rows", size)
  
  tbl <- data.frame(a=vector("character", size),
                    b=vector("character", size),
                    edgeType=vector("character", size),
                    mutation=vector("character", size),
                    stringsAsFactors=FALSE)
  patients <- names(list.cnG.gbm)
  i <- 0

  printf("--- adding cnG.gbm")

  for(patient in patients){
     patient.info <- list.cnG.gbm[[patient]]
     genes <- names(patient.info)
     for(gene in genes){
       i <- i + 1
       gistic.score <- patient.info[[gene]]
       #printf("%12s -> %8s (%d)", patient, gene, gistic.score);
       new.row <- list(a=gene, b=patient, edgeType="copyNumberLoss", score=gistic.score)
       tbl[i,]  <- new.row
       } # for gene
    } # for patient
  
  save(tbl, file="tbl04.RData")
  g <- addEdge(tbl$a, tbl$b, g)
  edgeData(g, tbl$a, tbl$b, attr="edgeType") <- "copyNumberGain"
  edgeData(g, tbl$a, tbl$b, attr="gistic") <- gistic.score

  save(g, file="g04.RData")

  #--------------------------------------------------------------------------------
  #               adding cnL.lgg
  #--------------------------------------------------------------------------------

  size <- length(unlist(list.cnL.gbm))
  printf("--- adding cnL.lgg: %d rows", size)
  tbl <- data.frame(a=vector("character", size),
                    b=vector("character", size),
                    edgeType=vector("character", size),
                    mutation=vector("character", size),
                    stringsAsFactors=FALSE)
  i <- 0
  patients <- names(list.cnL.lgg)
  
  for(patient in patients){
     patient.info <- list.cnL.lgg[[patient]]
     genes <- names(patient.info)
     for(gene in genes){
       i <- i + 1
       gistic.score <- patient.info[[gene]]
       printf("%12s -> %8s (%d)", patient, gene, gistic.score);
       new.row <- list(a=gene, b=patient, edgeType="copyNumberLoss", score=gistic.score)
       tbl[i, ] <- new.row
       } # for gene
    } # for patient

  save(tbl, file="tbl05.RData")
  tbl <- subset(tbl, nchar(a) > 0)
  save(tbl, file="tbl05.RData")
  
  g <- addEdge(tbl$a, tbl$b, g)
  edgeData(g, tbl$a, tbl$b, attr="edgeType") <- "copyNumberGain"
  edgeData(g, tbl$a, tbl$b, attr="gistic") <- gistic.score

  save(g, file="g05.RData")

  
  #--------------------------------------------------------------------------------
  #               adding cnG.lgg
  #--------------------------------------------------------------------------------

  patients <- names(list.cnG.lgg)
  size <- length(unlist(list.cnG.lgg))
  printf("--- adding cnG.lgg: %d rows", size)
  tbl <- data.frame(a=vector("character", size),
                    b=vector("character", size),
                    edgeType=vector("character", size),
                    mutation=vector("character", size),
                    stringsAsFactors=FALSE)
  i <- 0
  
  for(patient in patients){
     patient.info <- list.cnG.lgg[[patient]]
     genes <- names(patient.info)
     for(gene in genes){
       i <- i + 1
       gistic.score <- patient.info[[gene]]
       printf("%12s -> %8s (%d)", patient, gene, gistic.score);
       new.row <- list(a=gene, b=patient, edgeType="copyNumberGain", score=gistic.score)
       tbl[i,]  <-  new.row
       } # for gene
    } # for patient
  
  tbl <- subset(tbl, nchar(a) > 0)
  save(tbl, file="tbl06.RData")
  g <- addEdge(tbl$a, tbl$b, g)
  edgeData(g, tbl$a, tbl$b, attr="edgeType") <- "copyNumberGain"
  edgeData(g, tbl$a, tbl$b, attr="gistic") <- gistic.score

  save(g, file="g06.RData")

  #--------------------------------------------------------------------------------
  #               adding chromosomes
  #--------------------------------------------------------------------------------
  genes <- names(list.chrom)

  for (gene in genes){
     chromosome  <- list.chrom[[gene]]
     printf("%s -> %s", gene, chromosome)
     g <- addEdge(gene, chromosome, g)
     edgeData(g, gene, chromosome, attr="edgeType") <- "chromosome"
     } # for gene

  save(g, file="g07.RData")

  g
  
} # createGraph
#----------------------------------------------------------------------------------------------------
# return two lists:
# nodeTypes: nodes are chromomomes, genes,  patients or labels
classifyNodes <- function(goi, list.chrom,
                          list.cnL.gbm, list.cnG.gbm,
                          list.cnL.lgg, list.cnG.lgg,
                          list.mut.gbm, list.mut.lgg)
{
  chrom.names <- sort(unique(as.character(list.chrom)))
  
  file <- "tbl.dzSubTypes.RData"
  if(!exists("tbl.gbmDzSubTypes"))
      load(file, env=.GlobalEnv)

     # combine all of our sources, even though the lists are derived from the matrices
  patients.lgg <- sort(unique(c(names(list.cnL.lgg),   # 516
                                names(list.cnG.lgg),
                                names(list.mut.lgg),
                                rownames(mtx.mut.lgg),
                                rownames(mtx.cn.lgg))))
  patients.gbm <- sort(unique(c(names(list.cnL.gbm),   # 585
                                names(list.cnG.gbm),
                                names(list.mut.gbm),
                                rownames(mtx.mut.gbm),
                                rownames(mtx.cn.gbm),
                                rownames(tbl.gbmDzSubTypes))))
   node.types <- c(rep("chromosome", length(chrom.names)),
                   rep("patient",    length(c(patients.lgg, patients.gbm))),
                   rep("gene",       length(goi)))
                       
   names(node.types) <- c(chrom.names, patients.lgg, patients.gbm, goi)

   patients.classical   <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="Classical"))
   patients.proneural   <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="Proneural"))
   patients.mesenchymal <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="Mesenchymal"))
   patients.neural      <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="Neural"))
   patients.gcimp       <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="G-CIMP"))
   patients.unclassified <- setdiff(patients.gbm, c(patients.classical, patients.proneural, patients.mesenchymal, patients.neural,patients.gcimp))


   node.subTypes <- c(rep("chromosome",  length(chrom.names)),
                      rep("lgg",         length(patients.lgg)),
                      rep("classical",   length(patients.classical)),
                      rep("proneural",   length(patients.proneural)),
                      rep("mesenchymal", length(patients.mesenchymal)),
                      rep("neural",      length(patients.neural)),
                      rep("gcimp",       length(patients.gcimp)),
                      rep("unknown",     length(patients.unclassified)),
                      rep("gene",        length(goi)))

   names(node.subTypes) <- c(chrom.names, patients.lgg, patients.classical, patients.proneural,
                             patients.mesenchymal, patients.neural, patients.gcimp, patients.unclassified, goi)

   return(list(types=node.types, subtypes=node.subTypes));

} # classifyNodes
#----------------------------------------------------------------------------------------------------
test_classifyNodes <- function()
{
  print("--- test_classifyNodes");
  list.cat <<- classifyNodes(goi, list.chrom,
                             list.cnL.gbm, list.cnG.gbm,
                             list.cnL.lgg, list.cnG.lgg,
                             list.mut.gbm, list.mut.lgg)

  checkEquals(names(list.cat), c("types", "subtypes"))
  set.seed(31)
  max <- length(list.cat[[1]])[1]
  
  set <- sort(sample(1:max, 5))
  names1 <- sort(names(list.cat$types))
  names2 <- sort(names(list.cat$subtypes))
  checkEquals(length(names1), length(names2))
  checkEquals(names1, names2)

  checkEquals(as.list(list.cat$types[set]),
              list(TCGA.06.0241="patient", TCGA.06.0410="patient", TCGA.12.1599="patient",
                   SEC61G="gene", SHH="gene"))
  checkEquals(as.list(list.cat$subtypes[set]),
              list(TCGA.06.0174="proneural", TCGA.06.0410="proneural", TCGA.12.0775="mesenchymal",
                   SEC61G="gene", SHH="gene"))


} # test_classifyNodes
#----------------------------------------------------------------------------------------------------
# based upon prior
# save(goi.all, list.cat, list.chrom, list.cnL.gbm, list.cnG.gbm, list.cnL.lgg, list.cnG.lgg,list.mut.gbm, list.mut.lgg, file="allLists.RData")
# and
#  -rw-r--r--  1 pshannon  staff   18069 Mar 20 02:37 tbl01.RData
#  -rw-r--r--  1 pshannon  staff   17043 Mar 20 02:37 tbl02.RData
#  -rw-r--r--  1 pshannon  staff  140958 Mar 20 02:41 tbl03.RData
#  -rw-r--r--  1 pshannon  staff  117055 Mar 20 02:45 tbl04.RData
#  -rw-r--r--  1 pshannon  staff  101739 Mar 20 05:21 tbl05.RData
#  -rw-r--r--  1 pshannon  staff   53158 Mar 20 05:32 tbl06.RData
buildFromTables <- function()
{
  load("allLists.Rdata")
  
  all.nodes <- sort(unique(c(goi.all, names(list.cat$types))))  # 1959
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")
  g <- initNodeAttribute(g, "nodeType", "char", "unassigned")
  g <- initNodeAttribute(g, "subType",  "char", "unassigned")
  g <- initNodeAttribute(g, "label",    "char", "unassigned")

  g <- initEdgeAttribute(g, "edgeType", "char", "mutantIn")
  g <- initEdgeAttribute(g, "mutation", "char", "unassigned")
  g <- initEdgeAttribute(g, "gistic",   "char", "unassigned")

  nodeData(g, all.nodes, attr="label") <- all.nodes
  nodeTypes <- list.cat$types
  nodeData(g, names(nodeTypes), attr="nodeType") <- as.character(nodeTypes)
  checkEquals(as.list(table(noa(g, "nodeType"))), list(chromosome=24, gene=834, patient=1101))

  subTypes <- list.cat$subtypes
  nodeData(g, names(subTypes), attr="subType") <- as.character(subTypes)
  checkEquals(as.list(table(noa(g, "subType"))), list(chromosome=24, 
                                                      classical=146,
                                                      gcimp=39,
                                                      gene=834,
                                                      lgg=516,
                                                      mesenchymal=158,
                                                      neural=87,
                                                      proneural=99,
                                                      unknown=56))

  load("tbl01.RData")   # mut.gbm
  g <- addEdge(tbl$a, tbl$b, g)
  edgeData(g, tbl$a, tbl$b, attr="edgeType") <- tbl$edgeType
  edgeData(g, tbl$a, tbl$b, attr="mutation") <- tbl$mutation

  load("tbl02.RData")  # mut.lgg
  g <- addEdge(tbl$a, tbl$b, g)
  edgeData(g, tbl$a, tbl$b, attr="edgeType") <- tbl$edgeType
  edgeData(g, tbl$a, tbl$b, attr="mutation") <- tbl$mutation
  #save(g, file="g.mut.RData")

  #load("tbl03.RData")  # cnL.gbm
  #load("tbl04.RData")  # cnG.gbm
  load("tbl05.RData")  # cnL.lgg
  
  g <- addEdge(tbl$a, tbl$b, g)
  edgeData(g, tbl$a, tbl$b, attr="edgeType") <- tbl$edgeType
  edgeData(g, tbl$a, tbl$b, attr="gistic") <- tbl$mutation
  save(g, file="g.mut.cn.RData")
  #load("tbl06.RData")  # cnG.lgg
  
} # buildFromTables
#----------------------------------------------------------------------------------------------------
exploreAbundantLggCn <- function()
{
   print(load("tbl05.RData"))  # cnL.lgg, 71,911 rows
   dim(unique(tbl[, c("a", "b")])) # [1] 71911     2
   genes <- length(unique(tbl$a))  # 816 genes
   patients <- length(unique(tbl$b))  # 491 patients
   nrow(tbl)/(genes * patients)  #  0.1794831

   load("tbl03.RData")  # cnL.gbm
   dim(unique(tbl[, c("a", "b")])) # [1] 89078    2
   genes <- length(unique(tbl$a))  # 827 genes
   patients <- length(unique(tbl$b))  # 558 patients
   nrow(tbl)/(genes * patients)  #  0.1930326
   
     # these tables are build from lists, extracted from matrices
     # let's look at tcga gbm cnL
   gbm <- TCGAgbm()
   mtx.cn.gbm <- matrices(gbm)$mtx.cn
   names.trimmed <- sub(".0[12]$", "", rownames(mtx.cn.gbm))
   rownames(mtx.cn.gbm) <- names.trimmed
   dim(mtx.cn.gbm)      #   563 23575
   sum(abs(mtx.cn.gbm)) #  4003763
     # ignoring the contributions of gistic of +2 and -2, 30% of all genes have copy number alteration
   sum(abs(mtx.cn.gbm)) / (nrow(mtx.cn.gbm) * ncol(mtx.cn.gbm)) # 0.3016534

     # can we conclude that just under 20% of gene/patient combinations
     # have copy number alterations?

} # exploreAbundantLggCn
#----------------------------------------------------------------------------------------------------
restoreLayoutFromJSON <- function(cw)
{
  # f <- "ericsLayout-20mar2015-complete.json"
  f <- "layoutBeforeEric.json"
  tbl.layout <- fromJSON(f, simplifyDataFrame=TRUE)
  x <- subset(tbl.layout, name %in% nodes(cw@graph))
  names <- x$name
  xPos <- x$position$x
  yPos <- x$position$y
  checkEquals(length(names), length(xPos))
  checkEquals(length(names), length(yPos))

  setNodePosition(cw, names, xPos, yPos)
  
} # restoreLayoutFromJSON
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

  #browser()
  tbl <- data.frame(row=rownames(mtx)[rows],
                    col=colnames(mtx)[cols],
                    val=vals, stringsAsFactors=FALSE)

  orphan.patients <- setdiff(patients, tbl$row)
  orphan.genes <- setdiff(genes, tbl$col)
  list(tbl=tbl, orphan.patients=orphan.patients, orphan.genes=orphan.genes)
  
} # matrix.to.interactionTable
#----------------------------------------------------------------------------------------------------
oldmatrix.to.interactionTable <- function(mtx, vec, filter.func)
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

  data.frame(row=rownames(mtx)[rows],
             col=colnames(mtx)[cols],
             val=vals, stringsAsFactors=FALSE)
  
} # matrix.to.interactionTable
#----------------------------------------------------------------------------------------------------
test.matrix.to.interactionTable <- function()
{
   print("--- test.matrix.to.interactionTable")
   m <- matrix(c(11, 0, 31,  0, 22, 32, 0, 23, 33, 14, 24, 34), nrow=3,ncol=4, byrow=FALSE, 
               dimnames=list(c("R1", "R2", "R3"), c("C1", "C2", "C3", "C4")))
   filter <- function(x) {x != 0}
   tbl <- matrix.to.interactionTable(m, as.integer(m), filter)
   checkEquals(dim(tbl), c(9, 3))

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
oldcreateMutationGraph <- function(tbl)
{
  patients <- tbl$row
  genes <- tbl$col
  mutations <- tbl$val
  
  all.nodes <- unique(c(patients, genes))
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")
  nodeDataDefaults(g, attr="nodeType") <- "unassigned"
  nodeDataDefaults(g, attr="label") <- "unassigned"
  edgeDataDefaults(g, attr="edgeType") <- "mutation"
  edgeDataDefaults(g, attr="mutation") <- "unassigned"

  g <- addEdge(patients, genes, g)

  nodeData(g, patients, "nodeType") <- "patient"
  nodeData(g, genes,    "nodeType") <- "gene"
  nodeData(g, genes,    "label")    <- genes
  nodeData(g, patients, "label") <- patients

  edgeData(g, patients, genes, "mutation") <- mutations

  g

} # createMutationGraph
#----------------------------------------------------------------------------------------------------
test.createMutationGraph <- function()
{
   print("--- test.createMutationGraph")

     # get 10 frequently mutated genes in gbm
   mtx.mut.gbm <- matrices(gbm)$mtx.mut
   names.trimmed <- sub(".0[12]$", "", rownames(mtx.mut.gbm))
   rownames(mtx.mut.gbm) <- names.trimmed
    
   gene.mutation.counts <- apply(mtx.mut.gbm, 2, function(column) length(which(column != "")))
   genes <- names(tail(sort(gene.mutation.counts), n=10))
   patient.mutation.counts <- apply(mtx.mut.gbm, 1, function(row) length(which(row != "")))
   patients <- names(tail(sort(patient.mutation.counts), n=10))

   mtx <- mtx.mut.gbm[patients, genes]
   filter <- function(x) nchar(x) > 0;
   
   tbl <- matrix.to.interactionTable(mtx, as.character(mtx),filter)
   checkEquals(dim(tbl), c(20, 3))
   g.mut <- createMutationGraph(tbl)
   checkEquals(length(nodes(g.mut)), 17)
   checkEquals(length(unlist(edgeL(g.mut), use.names=FALSE)), 20)
   checkEquals(noaNames(g.mut), c("nodeType", "label"))
   checkEquals(edaNames(g.mut), c("edgeType", "mutation"))

   checkEquals(sort(unique(noa(g.mut, "nodeType"))), c("gene", "patient"))
   checkEquals(sort(unique(eda(g.mut, "edgeType"))), "mutation")

   invisible(g.mut)
   
} # test.createMutationGraph 
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

  losers <- which(gistic.scores < 0)
  gainers <- which(gistic.scores > 0)
  copyNumberTypes <- gistic.scores
  #browser()
  loser.strings <- paste("cnLoss.", abs(copyNumberTypes[losers]), sep="")
  gainer.strings <- paste("cnGain.", abs(copyNumberTypes[gainers]), sep="")
  copyNumberTypes[losers] <- loser.strings
  copyNumberTypes[gainers] <- gainer.strings

  edgeData(g, patients, genes, "edgeType") <- copyNumberTypes
  edgeData(g, patients, genes, "gistic") <- gistic.scores

  g

} # createCopyNumberGraph
#----------------------------------------------------------------------------------------------------
test.createCopyNumberGraph <- function()
{
   print("--- test.creatCopyNumberGraph")

     # get 10 frequently mutated genes in gbm
   mtx.mut.gbm <- matrices(gbm)$mtx.mut
   names.trimmed <- sub(".0[12]$", "", rownames(mtx.mut.gbm))
   rownames(mtx.mut.gbm) <- names.trimmed
    
   gene.mutation.counts <- apply(mtx.mut.gbm, 2, function(column) length(which(column != "")))
   genes <- names(tail(sort(gene.mutation.counts), n=10))
   patient.mutation.counts <- apply(mtx.mut.gbm, 1, function(row) length(which(row != "")))
   patients <- names(tail(sort(patient.mutation.counts), n=10))

   patients <- intersect(patients, rownames(mtx.cn.gbm))

   mtx <- mtx.cn.gbm[patients, genes]
   filter <- function(x) x != 0;
   
   tbl <- matrix.to.interactionTable(mtx, as.integer(mtx), filter)
   checkEquals(dim(tbl), c(38, 3))
   g.cn <- createCopyNumberGraph(tbl)

   checkEquals(length(nodes(g.cn)), 18)
   checkEquals(length(unlist(edgeL(g.cn), use.names=FALSE)), 38)
   checkEquals(noaNames(g.cn), c("nodeType", "label"))
   checkEquals(edaNames(g.cn), c("edgeType", "gistic"))

   checkEquals(sort(unique(noa(g.cn, "nodeType"))), c("gene", "patient"))
   checkEquals(sort(unique(eda(g.cn, "edgeType"))), c("cnGain-1", "cnGain-2", "cnLoss-1"))

   invisible(g.cn)
   
} # test.createCopyNumberGraph 
#----------------------------------------------------------------------------------------------------
createChromosomeTable <- function(geneSyms)
{
  geneIDs <- mget(geneSyms, org.Hs.egSYMBOL2EG, ifnotfound=NA)
  deleters <- which(is.na(geneIDs))

  if(length(deleters) > 0){
    printf("createChromosomeTable, unmapped gene symbols: %d", length(deleters))
    print(deleters)
    indices <- as.integer(deleters)
    geneIDs <- geneIDs[-indices]
    }

     # eliminate any multiple assignments
  counts <- lapply(geneIDs, length)
  multiples <- as.integer(which(counts > 1))
  for(mult in multiples)
      geneIDs[[mult]] <- geneIDs[[mult]][1]
  
  chrom.list <- mget(as.character(geneIDs), org.Hs.egCHR)

    # reduce any double chromosome assignements (eg, CRLF2: XY) to single
  chrom.list.singles <- lapply(chrom.list, "[", 1)

    # now prepend "chr" to each chrom name
  
  chroms <- paste0("chr", as.character(chrom.list.singles))
  names(chroms) <- as.character(mget(names(chrom.list.singles), org.Hs.egSYMBOL))

  vals <- rep("chromosome", length(chroms))

  tbl <- data.frame(row=names(chroms),
                    col=as.character(chroms),
                    val=vals, stringsAsFactors=FALSE)


  tbl

} # createChromosomeTable
#----------------------------------------------------------------------------------------------------
test.createChromosomeTable <- function()
{
   print("--- test.createChromsomeTable")

     # get 10 frequently mutated genes in gbm
   mtx.mut.gbm <- matrices(gbm)$mtx.mut
   names.trimmed <- sub(".0[12]$", "", rownames(mtx.mut.gbm))
   rownames(mtx.mut.gbm) <- names.trimmed
    
   gene.mutation.counts <- apply(mtx.mut.gbm, 2, function(column) length(which(column != "")))
   genes <- names(tail(sort(gene.mutation.counts), n=10))

   tbl <- createChromosomeTable(genes)
   checkEquals(dim(tbl), c(10,3))
   checkEquals(colnames(tbl), c ("row", "col", "val"))
   checkEquals(unique(tbl$val), "chromosome")
   checkEquals(tbl$row, genes)
   print(checkEquals(length(grep("chr", tbl$col)), length(genes)))

   invisible(tbl)

} # test.createChromsomeTable
#----------------------------------------------------------------------------------------------------
createChromosomeGraph <- function(tbl)
{
  genes <- tbl$row
  chromosomes <- tbl$col
  
  all.nodes <- unique(c(genes, chromosomes))
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")
  nodeDataDefaults(g, attr="nodeType") <- "unassigned"
  nodeDataDefaults(g, attr="label") <- "unassigned"
  edgeDataDefaults(g, attr="edgeType") <- "chromosome"

  g <- addEdge(genes, chromosomes, g)

  nodeData(g, genes,       "nodeType") <- "gene"
  nodeData(g, chromosomes, "nodeType") <- "chromosome"
  nodeData(g, genes,       "label")    <- genes
  nodeData(g, chromosomes, "label") <- chromosomes

  g

} # createChromosomeGraph
#----------------------------------------------------------------------------------------------------
test.createChromosomeGraph <- function()
{
   print("--- test.createChromosomeGraph")

   tbl <- test.createChromosomeTable()
   g <- createChromosomeGraph(tbl)

     # get 10 frequently mutated genes in gbm
   checkEquals(length(nodes(g)), 18)   # 10 genes, 3 on chr7
   checkEquals(length(unlist(edgeL(g), use.names=FALSE)), 10)
   checkEquals(noaNames(g), c("nodeType", "label"))
   checkEquals(edaNames(g), "edgeType")

   checkEquals(sort(unique(noa(g, "nodeType"))), c("chromosome", "gene"))
   checkEquals(sort(unique(eda(g, "edgeType"))), "chromosome")

   invisible(g)
   
} # test.createChromosomeGraph 
#----------------------------------------------------------------------------------------------------
# colnames(tbl): "chrom"  "arm"    "loc"    "geneID"
createArmLocChromosomeGraph <- function(tbl)
{
  #browser();
  genes <- rownames(tbl)
  chromosomes <- tbl$arm
  
  all.nodes <- unique(c(genes, chromosomes))
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")
  nodeDataDefaults(g, attr="nodeType") <- "unassigned"
  nodeDataDefaults(g, attr="label") <- "unassigned"
  nodeDataDefaults(g, attr="chromLoc") <- 0
  edgeDataDefaults(g, attr="edgeType") <- "chromosome"

  g <- addEdge(genes, chromosomes, g)

  nodeData(g, genes,       "nodeType") <- "gene"
  nodeData(g, chromosomes, "nodeType") <- "chromosome"
  nodeData(g, genes,       "label")    <- genes
  nodeData(g, chromosomes, "label") <- chromosomes
  nodeData(g, chromosomes, "chromLoc") <- tbl$loc

  g

} # createArmLocChromosomeGraph
#----------------------------------------------------------------------------------------------------
test_cy <- function()
{
  g.mut <- test.createMutationGraph()
  rcy <- RCyjs(portRange=9047:9057, quiet=TRUE, graph=g.mut)

  g.cnv <- test.createCopyNumberGraph()
  addGraph(rcy, g.cnv)

  g.chrom <- test.createChromosomeGraph()
  printf("--- about to add g.chrom")
  addGraph(rcy, g.chrom)
  
  layout(rcy, "cose")
  setNodeLabelRule(rcy, "label");
  setNodeShapeRule(rcy, "nodeType",
                   c("patient", "gene", "chromosome"),
                   c("roundrectangle", "ellipse", "pentagon"))

  setDefaultNodeColor(rcy, "white")
  setDefaultNodeBorderWidth(rcy, 2)
  setDefaultNodeBorderColor(rcy, "black")

  setEdgeColorRule(rcy, "edgeType", c("mutation", "cnGain-1", "cnGain-2", "cnLoss-1", "cnLoss-2", "chromosome"),
                                    c("rgb(0,0,255)",
                                      "rgb(255,0,0)","rgb(255,0,0)",
                                      "rgb(0,100,0)", "rgb(0,100,0)",
                                      "rgb(0,80, 0)"),
                                    mode="lookup")
  setEdgeWidthRule(rcy, "edgeType", c("mutation", "cnGain-1", "cnGain-2", "cnLoss-1", "cnLoss-2", "chromosome"),
                                    c(1, 1, 5, 1, 5, 3), mode="lookup")

  redraw(rcy)
  restoreLayout(rcy, "demoLayout.RData")
  fitContent(rcy)
  setZoom(rcy, 0.8 * getZoom(rcy))
  
  rcy
  
} # test_cy
#----------------------------------------------------------------------------------------------------
runCy <- function()
{
  if(!exists("goi.all"))
      run(0:10)

     #-----------------------------------------------------------------------------------------
     # with so much trouble, maybe graph size related, just use the old gbm 545 genes for now
     #-----------------------------------------------------------------------------------------

  load("goi545.RData")
  goi.all <- goi

     #----------------------------------------------
     # get gbm copynumber, just +2 and -2 for now
     #----------------------------------------------

  goi <- intersect(goi.all, colnames(mtx.cn.gbm))
  mtx <- mtx.cn.gbm[, goi]
  filter <- function(x) x != 0;
  tbl <- matrix.to.interactionTable(mtx, as.character(mtx), filter)
  tbl <- subset(tbl, abs(val) == 2)

  goi <- intersect(goi.all, colnames(mtx.cn.lgg))
  mtx <- mtx.cn.lgg[, goi]
  filter <- function(x) x != 0;
  tbl2 <- matrix.to.interactionTable(mtx, as.character(mtx), filter)
  tbl2 <- subset(tbl2, abs(val) == 2)

  tbl.combined <- rbind(tbl, tbl2)

  checkEquals(ncol(tbl.combined), 3)

  g.cnv <- createCopyNumberGraph(tbl.combined)
  printf("--- gbm copynumber")
  print(g.cnv)
  rcy <- RCyjs(portRange=9047:9057, quiet=TRUE, graph=g.cnv)
  Sys.sleep(5)
  hideAllEdges(rcy);

     #----------------------------------------------
     # add gbm mutations
     #----------------------------------------------

  goi <- intersect(goi.all, colnames(mtx.mut.gbm))
  mtx <- mtx.mut.gbm[, goi]
  filter <- function(x) nchar(x) > 0;

  tbl <- matrix.to.interactionTable(mtx, as.character(mtx), filter)
  checkEquals(ncol(tbl), 3)
  #checkTrue(nrow(tbl) > 2000)
  g.mut <- createMutationGraph(tbl)
  
  printf("--- gbm mutation")
  print(g.mut)
  
  #rcy <- RCyjs(portRange=9047:9057, quiet=TRUE, graph=g.mut)
  addGraph(rcy, g.mut)
  Sys.sleep(5)
  hideAllEdges(rcy);


     #----------------------------------------------
     # add lgg mutations
     #----------------------------------------------

  goi <- intersect(goi.all, colnames(mtx.mut.lgg))
  mtx <- mtx.mut.lgg[, goi]
  filter <- function(x) nchar(x) > 0;

  tbl <- matrix.to.interactionTable(mtx, as.character(mtx), filter)
  checkEquals(ncol(tbl), 3)
  #checkTrue(nrow(tbl) > 2000)
  g.mut <- createMutationGraph(tbl)
  printf("--- lgg mutation")
  print(g.mut)
  addGraph(rcy, g.mut)
  Sys.sleep(5)
  hideAllEdges(rcy);


     #----------------------------------------------
     # set the vizmap
     #----------------------------------------------
  hideAllEdges(rcy);
  setNodeLabelRule(rcy, "label");
  setNodeShapeRule(rcy, "nodeType", c("patient", "gene"), c("roundrectangle", "ellipse"))
  setDefaultNodeColor(rcy, "white")
  setDefaultNodeBorderWidth(rcy, 2)
  setDefaultNodeBorderColor(rcy, "black")

  setEdgeColorRule(rcy, "edgeType", c("mutation", "cnGain-1", "cnGain-2", "cnLoss-1", "cnLoss-2"),
                                    c("rgb(0,0,255)",
                                      "rgb(255,0,0)","rgb(255,0,0)",
                                      "rgb(0,100,0)", "rgb(0,100,0)"),
                                    mode="lookup")
  setEdgeWidthRule(rcy, "edgeType", c("mutation", "cnGain-1", "cnGain-2", "cnLoss-1", "cnLoss-2"),
                                    c(1, 1, 5, 1, 5), mode="lookup")

  redraw(rcy)

  json <- scan("gbm.lgg.layout.json", what=character())
  nchar(json)  # 179028
  x <- fromJSON(json)
  tbl.pos <- x[[3]]
  tbl.ids <- data.frame(id=x[[2]], stringsAsFactors=FALSE)
  tbl.pos <- cbind(tbl.ids, tbl.pos)
  setPosition(rcy, tbl.pos)
  hideAllEdges(rcy)
  fitContent(rcy)
  rcy
  
} # runCy
#----------------------------------------------------------------------------------------------------
# 731 tumors are described in coords.SNA.CNA, with x,y values -9e5 .. 6.6e5
# 807 tumors in the current graph (2 sep 2015)
# all 731 tumors in the mds dataset are in the graph
# 76 in the graph are NOT in the mds dataset - might want to delete them
# classic layout:  y: -1304 .. 4446
#                  x: -4000 .. 5342
# try drawing all the tumors on left, x: -8000, -5000, y: -1300, 4000
hobo.tumor.layout <- function()
{
   expansion.factor <- 1600    # x and y values are spread between +/- 1600
   left.shift <- 2000          # then shifted left by this amount to occupy left-ish
                               # half of screen
   up.shift <- 0               # keep y coordinates centered on zero for now

   pos <- as.data.frame(tbl.tumorCoords)
   colnames(pos) <- c("x", "y")
   pos$id <- rownames(pos)
   pos <- pos[, c("id", "x", "y")]   
   rownames(pos) <- NULL

   x <- pos$x                  # range(x) -9.013847e-05  6.037940e-05

   zero.shift <- (max(x) + min(x)) / 2
   #browser()
   x <- x - zero.shift
   x.scale <- expansion.factor/max(x)   
   x <- x * x.scale            # at this point the x values range -1600:1600
   x <- x - left.shift         # move everything left by this amount

   y <- pos$y                  # range(y)  -7.474737e-05  6.612021e-05
   zero.shift <- (max(y) + min(y)) / 2
   y <- y - zero.shift
   y.scale <- expansion.factor/max(y)   
   y <- y * y.scale
   y <- y + up.shift

   pos.new <- pos
   pos.new$x <- x
   pos.new$y <- y * -1   # everything except for this canvas :} has negative y below, positive y above
   tbl.pos <<- pos.new

     # some simple edge case quality checks, after the coordinates have been powerfully transformed
     #
     #   range(pos$x)[1]   -9.013847e-05  6.037940e-05
     #   range(pos$y)[1]   -7.474737e-05  6.612021e-05
     #   range(tbl.pos$x)  -1600  1600
     #   range(tbl.pos$y)  -1600  1600


   checkEquals(subset(tbl.pos, x == max(tbl.pos$x))$id, subset(pos, x==max(pos$x))$id)
   checkEquals(subset(tbl.pos, x == min(tbl.pos$x))$id, subset(pos, x==min(pos$x))$id)

      # y coordinates are mirrored across x axis to give the expected display
      # so that the transformed data has positive y at the bottom of the screen,
      # negtive y at the top - descartes turned on his head.
   
   checkEquals(subset(tbl.pos, y == max(tbl.pos$y))$id, subset(pos, y==min(pos$y))$id)
   checkEquals(subset(tbl.pos, y == min(tbl.pos$y))$id, subset(pos, y==max(pos$y))$id)

   setPosition(rcy, pos.new)

} # hobo.tumor.layout
#----------------------------------------------------------------------------------------------------
createArmLocChromosomeTable <- function(syms=NA) 
{
  if(all(is.na(syms))){
     if(!exists(goi))
        load("goi545.RData", envir=.GlobalEnv);
      syms <- goi
      } # if is.na(syms): usse goi

  geneID.list <- mget(syms, org.Hs.egSYMBOL2EG, ifnotfound=NA)

  deleter.syms <- c()
  deleter.list <-which(is.na(geneID.list))
  deleter.indices <- as.integer(deleter.list)
  
  if(length(deleter.indices) > 0){
     printf("no geneID for gene sybols %s", paste(names(geneID.list)[deleter.indices], collapse=", "))
     deleter.syms <- names(deleter.list)
     geneID.list <- geneID.list[-deleter.indices]
     }


  geneID <- unlist(geneID.list, use.names=FALSE)

  suppressWarnings(chrom.list <- mget(geneID, org.Hs.egCHR))
  chrom.list2 <- lapply(chrom.list, "[", 1)   

  chrom <- paste("chr", unlist(chrom.list2, use.names=FALSE), sep="")
  suppressWarnings(loc.list <- mget(geneID, org.Hs.egCHRLOC))
  loc.list <- lapply(loc.list, min)
  loc <- abs(unlist(loc.list, use.names=FALSE))
  arm.list <- mget(geneID, org.Hs.egMAP)

     # remove a few duplicate arm assignments
     # eg, arm.list["64109"]  [1] "Xp22.3" "Yp11.3"
     # todo: should not eliminate this information!
  
  arm.list2 <- lapply(arm.list, "[", 1)   
  arm.fullInfo <- unlist(arm.list2, use.names=FALSE)
  match.results <- gregexpr("([0-9,X,Y]+[pq|cen])", arm.fullInfo)
  match.starts <- as.integer(match.results)
  match.lengths <- as.integer(lapply(match.results, function (x) attr(x, "match.length")))
  arm <- unlist(lapply(1:length(match.results),
                       function(i) substring(arm.fullInfo[i], match.starts[i], match.lengths[i])), use.names=FALSE)

  arm <- paste("chr", arm, sep="")
  #browser()
  tbl.chrloc <- data.frame(chrom=chrom, arm=arm, loc=loc, geneID=geneID, stringsAsFactors=FALSE)
  rownames(tbl.chrloc) <- names(geneID.list)
  tbl.chrloc <- tbl.chrloc[order(tbl.chrloc$arm, tbl.chrloc$loc),]

    # eliminate failures (for now)
   
  #browser()
  no.arm <- which(is.na(tbl.chrloc$arm))
  no.arm <- c(no.arm, which(tbl.chrloc$arm == "chrNA"))
  no.loc <- which(is.na(tbl.chrloc$loc))
  deleter.indices <- sort(unique(c(no.arm, no.loc)))
  if(length(deleter.indices) > 0){
     new.deleter.syms <- rownames(tbl.chrloc)[deleter.indices]
     deleter.syms <- sort(unique(c(deleter.syms, new.deleter.syms)))
     tbl.chrloc <- tbl.chrloc[-deleter.indices,]
     }

  list(tbl=tbl.chrloc, failures=deleter.syms)

} # createArmLocChromosomeTablechrom.stacked.gene.layout
#----------------------------------------------------------------------------------------------------
test.createArmLocChromosomeTable <- function()
{
   print("--- test.createArmLocChromosomeTable")

     # some hard cases first
   genes <- c("BAGE5", "DUX4", "POTEB")
   x <- createArmLocChromosomeTable(genes)
   checkEquals(dim(x$tbl), c(1, 4))
   checkEquals(rownames(x$tbl), "BAGE5")
   checkEquals(x$failures, c("DUX4", "POTEB"))

     # now the full 545 genes, 541 of which can be annotated for chr, arm, loc, geneID
   x <- createArmLocChromosomeTable()
   checkEquals(dim(x$tbl), c(541, 4))
   checkEquals(x$failures, c("C2ORF44", "DUX4", "POTEB", "STL"))
   
} # test.createArmLocChromosomeTable
#----------------------------------------------------------------------------------------------------
layout.chromosome.arms <- function()
{

   origin.x <- 2000
   x.spacing <- 300
   origin.y <- 0
   y.spacing <- 30
   y.bottom <- origin.y + y.spacing
   y.top    <- origin.y - y.spacing
   
   x.locs <- as.integer(lapply(1:22, function(i) origin.x + (300 * (i-1))))
   
   tbl.loc <- as.data.frame(list(id=vector("character", 46),
                                 x=vector("numeric", 46),
                                 y=vector("numeric", 46)))
   for(i in 1:22){
      chr.p <- sprintf("chr%dp", i)
      chr.q <- sprintf("chr%dq", i)
      row <- (i * 2) - 1
      tbl.loc[row, ] <- list(id=chr.p, x=x.locs[i], y=y.top)
      row <- (i * 2)
      tbl.loc[row, ] <- list(id=chr.q, x=x.locs[i], y=y.bottom)
      }

   tbl.loc[45, ] <- list(id="chrXp", x=x.locs[22] + x.spacing, y=y.top)
   tbl.loc[46, ] <- list(id="chrXq", x=x.locs[22] + x.spacing, y=y.bottom)
   
   setPosition(rcy, tbl.loc)
   


} # layout.chromosome.arms
#----------------------------------------------------------------------------------------------------
# layout.genes.by.chromosome.arm <- function()
# {
# 
#   chroms <- paste("chr", c(1:22, "X"), sep="")
#   
#   gene.count <- nrow(tbl.armLocChrom)
#   
#   tbl.loc <- as.data.frame(list(id=vector("character", gene.count),
#                                 x=vector("numeric",    gene.count),
#                                 y=vector("numeric",    gene.count)))
# 
# 
#   gene.index = 0;
#   
#   for(i in 1:length(chroms)){
#      arm.p <- sprintf("%sp", chroms[i])
#      arm.q <- sprintf("%sq", chroms[i])
#      genes.p <- rownames(subset(tbl.armLocChrom, arm==arm.p))
#      if(length(genes.p) > 0){
#         pos <- RCyjs::getPosition(rcy, arm.p)
#         base.x <- pos$x
#         base.y <- pos$y - 80
#         for(g in 1:length(genes.p)){
#           gene.index <- gene.index + 1
#           new.row <- list(id=genes.p[g], x=base.x, y=base.y - (g * 60))
#           tbl.loc[gene.index,] <- new.row
#           } # for g
#         } # if length(genes.p)
#    
#      genes.q <- rownames(subset(tbl.armLocChrom, arm==arm.q))
#      if(length(genes.q) > 0){
#         pos <- RCyjs::getPosition(rcy, arm.q)
#         base.x <- pos$x
#         base.y <- pos$y + 80
#         for(g in 1:length(genes.q)){
#            gene.index <- gene.index + 1
#            new.row <- list(id=genes.q[g], x=base.x, y=base.y + (g * 60))
#            tbl.loc[gene.index, ] <- new.row
#            } # for g
#         } # if length(genes.q)
# 
#       } # for i in chroms
# 
#   setPosition(rcy, tbl.loc[1:gene.index,])
# 
# } # layout.genes.by.chromosome.arm
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
test.buildNodeInfoTable <- function()
{
  genes <- c("DUX4", "TTN", "TPM3")
  genes <- c("EGFR", "MUC17")
  set.seed(37); genes <- goi[sample(1:length(goi), 5)];
   #  "MSH6"  "BCL6"  "OR4M1" "LRP2"  "PKM"  

  tbl <- buildNodeInfoTable(genes)
  checkEquals(nrow(subset(tbl, type=="gene")), 5)
  checkEquals(nrow(subset(tbl, type=="arm")), 48)  # 24 p, 24 q
  checkEquals(nrow(subset(tbl, type=="telomere.start")), 24)
  checkEquals(nrow(subset(tbl, type=="telomere.end")), 24)
  checkTrue(all(subset(tbl, type=="telomere.start")$loc == 0))
  checkTrue(all(tbl$chrom %in% as.character(c(1:22, "X", "Y"))))

  tbl <- buildNodeInfoTable(goi)
  expected.colnames <- c("name", "map", "loc", "chrom", "arm", "type", "screen.x", "screen.y")
  checkTrue(all(expected.colnames %in% colnames(tbl)))
  checkEquals(nrow(subset(tbl, type=="gene")), length(goi))
    
} # test.buildNodeInfoTable
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
test.extractChromArmFromCytoband <- function(cytoband)
{
   print("--- test.extractChromArmFromCytoband")
  
   bands <- c("9q31.1", "4q22", "10p11.2", "9q34.1", "13cen", "9q34.1", "2q37.3", NA, "2q34-q35")
   arm <- extractChromArmFromCytoband(bands);
   checkEquals(arm[[1]], "q")
   checkEquals(arm[[3]], "p")
   checkTrue(is.na(arm[[8]]))
   checkEquals(arm[[5]], "cen")

   bands <- c("7p12", "7q22.1")
   arm <- extractChromArmFromCytoband(bands);
   checkEquals(as.character(arm), c("p", "q"))
     
} # test.extractChromArmFromCytoband
#----------------------------------------------------------------------------------------------------
chromosomeLocToCanvas <- function(tbl)
{
   stopifnot(length(unique(tbl$chrom)) == 1)   # just one chromosome at a time

   loc.half.span <- 249250621/2    # a bit more than the length of chrom 1, the longest
   center.y <- 0
   top.y <- 3000                   # drawing is done from zero at center of screen to this pixel height
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
test.chromosomeLocToCanvas <- function()
{
   print("--- test.chromosomeLocToCanvas")

   suppressWarnings (tbl <- buildNodeInfoTable(goi))
   tbl.1 <- subset(tbl, chrom=="1" & type != "gene")
   tbl.1 <- subset(tbl, chrom=="1")
   y.1 <- chromosomeLocToCanvas(tbl.1)
   tbl.1$screen.y <- y.1

     # AKT3 is very near the far end of chr1, and transcribes to the "left"
     # so its loc will be about -24M, but its screen.y should be very close
     # to chr1's "end.1"

   checkTrue(subset(tbl.1, name=="AKT3")$loc < -24000000)
   checkTrue(subset(tbl.1, name=="end.1")$loc > 24000000)

   ratio <- subset(tbl.1, name=="AKT3")$screen.y / subset(tbl.1, name=="end.1")$screen.y
   checkTrue(ratio > 0.95)
   

} # test.chromosomeLocToCanvas
#----------------------------------------------------------------------------------------------------
explore.chromosomeLocToCanvas <- function()
{
   print("--- test.chromosomeLocToCanvas")

   # head(subset(tbl, type=="gene" & chrom=="1"), n=2)
   #
   #     name          map        loc chrom arm type
   #
   #   AKT3           1q44 -243651535     1   q gene
   #   ATP1A1         1p21  116916489     1   p gene

   # subset(tbl, chrom=="1" & type != "gene")
   # start.1            -           0     1   p telomere.start
   #   end.1            -   249250621     1   q   telomere.end
   #   chr1p            -   121535434     1   p            arm
   #   chr1q            -   124535434     1   q            arm

   # subset(tbl, chrom=="20" & type != "gene")
   #  start.20          -           0    20   p telomere.start
   #    end.20          -    63025520    20   q   telomere.end
   #    chr20p          -    26369569    20   p            arm
   #    chr20q          -    29369569    20   q            arm
  
   tbl <- buildNodeInfoTable(goi)
   tbl.1 <- subset(tbl, chrom=="1" & type != "gene")
   tbl.1 <- subset(tbl, chrom=="1")
   y.1 <- chromosomeLocToCanvas(tbl.1)

   tbl.1$screen.y <- y.1

   tbl.X <- subset(tbl, chrom=="X" & type != "gene")
   tbl.X <- subset(tbl, chrom=="X")
   y.X <- chromosomeLocToCanvas(tbl.X)

   tbl.X$screen.y <- y.X


} # explore.chromosomeLocToCanvas
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
test.calculate.screen.X <- function(chrom)
{
  checkEquals(calculate.screen.X("1", base.X=2000, delta=300), 2000)
  checkEquals(calculate.screen.X("X"), 8600)

} # test.calculate.screen.X
#----------------------------------------------------------------------------------------------------
if(!interactive()){
   rcy <- run()
   viz(rcy)
   #export(rcy)
   }
