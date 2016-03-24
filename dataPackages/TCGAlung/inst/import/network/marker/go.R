# go.R
#----------------------------------------------------------------------------------------------------
# cribsheet
#   selectNodes(rcy, names(which(noa(rcy@graph, 'dzSubType') == "lgg")))
#   saveLayout(rcy, filename=sprintf("layout.%s", as.numeric(Sys.time())))
#   restoreLayout(rcy, tail(sort(grep("^layout", dir(), value=TRUE)), n=1))
#   getPosition(rcy, getSelectedNodes(rcy)[1,]$name)[1, c("x", "y")]
#              x        y
#    1 -1581.371 1027.434
#
#   layoutSelectionInGrid(rcy, -1621.371, 987.4343, 800, 800)
#
#   g.markers.json <- getJSON(rcy);
#   print(nchar(g.markers.json));
#   save(g.markers.json, file="../../../extdata/markers.json.RData")
#   
#   R CMD build TCGAbrain
#  (cd ~/oncodev/hbolouri/oncoDev14/Oncoscape/inst/scripts/markersAndSamples; make tabs)
#----------------------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)
library(org.Hs.eg.db)
library(DEMOdz)
library(TCGAbrain)
library(RCyjs)
#----------------------------------------------------------------------------------------------------
if(!exists("dz")){
   dz <- TCGAbrain()
   bmtx.mut <- matrices(dz)$mtx.mut
   bmtx.cn  <- matrices(dz)$mtx.cn
   }
if(!exists("ddz")){
   ddz <- DEMOdz()
   mtx.mut <- matrices(ddz)$mtx.mut
   mtx.cn  <- matrices(ddz)$mtx.cn
   }
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test_matrix.to.interactionTable()
  test_matrix.to.interactionTable.restrictedByGenesOfInterest()

  test_createMutationGraph()

  test_createChromosomeTable()
  test_createChromosomeGraph()
  
  test_createGisticGraph()
  
} # runTests
#----------------------------------------------------------------------------------------------------
run <- function()
{
  filter <- function(x){!is.na(x)}
  result <- matrix.to.interactionTable(mtx.mut, as.character(mtx.mut), filter)
  tbl <- result$tbl
  patient.orphans <- result$row.orphans
  gene.orphans <- result$col.orphans

  g <- createMutationGraph (tbl, patient.orphans, gene.orphans)
  rcy <- displayMutationGraph(g)
  all.genes <- nodes(g)[which(nchar(nodes(g)) < 12)]

  tbl.chrom <- createChromosomeTable(all.genes)
  g.chrom <- createChromosomeGraph(tbl.chrom)
  addGraph(rcy, g.chrom)

  filter <- function(x){abs(x) == 2}
  gistic.2 <- matrix.to.interactionTable(mtx.cn, as.integer(mtx.cn), filter)
  tbl <- gistic.2$tbl
  patient.orphans <- gistic.2$row.orphans
  gene.orphans <- gistic.2$col.orphans
  
  g.p2 <- createGisticGraph(tbl, include.orphans=FALSE, patient.orphans, gene.orphans)
  addGraph(rcy, g.p2)
  
  vizmap(rcy)
  rcy

} # run
#----------------------------------------------------------------------------------------------------
# all genes with mutations, a good assortment of all 4 gistic scores
goi <- function()
{
      # mutant genes
   filter <- function(x){x != ""}
   result <- matrix.to.interactionTable(bmtx.mut, as.character(bmtx.mut), filter)
   tbl <- result$tbl
   length(unique(tbl$col))  # 6698
   tbl.mut.freq <- as.data.frame(table(tbl$col), stringsAsFactors=FALSE)
   tbl.mut.freq <- tbl.mut.freq[order(tbl.mut.freq$Freq, decreasing=TRUE),]
   fivenum(tbl.mut.freq$Freq)   # [1]   1   2   3   4 280
   dim(subset(tbl.mut.freq, Freq > 20)) # [1] 24  2
   mutant.genes <- head(tbl.mut.freq$Var1, n=20)   

     # gistic 2 genes
   filter <- function(x){x == 2}
   result <- matrix.to.interactionTable(bmtx.cn, as.integer(bmtx.cn), filter)
   tbl <- result$tbl
   dim(tbl)   # 123211      3
   xtab.gain2 <- as.data.frame(table(tbl$col), stringsAsFactors=FALSE)
   xtab.gain2 <- xtab.gain2[order(xtab.gain2$Freq, decreasing=TRUE),]
   gain2.genes <- xtab.gain2$Var1[1:20]
   
     # gistic 1 genes
   filter <- function(x){x == 1}
   result <- matrix.to.interactionTable(bmtx.cn, as.integer(bmtx.cn), filter)
   tbl <- result$tbl
   dim(tbl)   # 2435083       3
   xtab.gain1 <- as.data.frame(table(tbl$col), stringsAsFactors=FALSE)
   xtab.gain1 <- xtab.gain1[order(xtab.gain1$Freq, decreasing=TRUE),]
   gain1.genes <- xtab.gain1$Var1[1:20]
   
     # gistic -2 genes
   filter <- function(x){x == -2}
   result <- matrix.to.interactionTable(bmtx.cn, as.integer(bmtx.cn), filter)
   tbl <- result$tbl
   dim(tbl)  # 95773 3
   xtab.loss2 <- as.data.frame(table(tbl$col), stringsAsFactors=FALSE)
   xtab.loss2 <- xtab.loss2[order(xtab.loss2$Freq, decreasing=TRUE),]
   loss2.genes <- xtab.loss2$Var1[1:20]
      
     # gistic -1 genes
   filter <- function(x){x == -1}
   result <- matrix.to.interactionTable(bmtx.cn, as.integer(bmtx.cn), filter)
   tbl <- result$tbl
   dim(tbl)  # 3380402 3
   xtab.loss1 <- as.data.frame(table(tbl$col), stringsAsFactors=FALSE)
   xtab.loss1 <- xtab.loss1[order(xtab.loss1$Freq, decreasing=TRUE),]
   loss1.genes <- xtab.loss1$Var1[1:20]

   set.seed(31)
   x <- sort(unique(c(mutant.genes, gain2.genes, loss2.genes)))
   x <- c(x, gain1.genes[sample(1:length(gain1.genes), 10)])
   x <- c(x, loss1.genes[sample(1:length(loss1.genes), 10)])
   x <- sort(unique(x))

   x

} # goi
#----------------------------------------------------------------------------------------------------
# get 'n' patients from each of the 5 gbm groups, 'n' from the lgg group
poi <- function(n)
{
   file <- "/Users/pshannon/oncodev/hbolouri/oncoDev12/Oncoscape/inst/extdata/tcgaGBM/tbl.dzSubTypes.RData"
   print(load(file, env=.GlobalEnv))
   pts.classical <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="Classical"))  # 146
   pts.mesenchymal <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="Mesenchymal"))  # 158
   pts.neural <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="Neural"))  # 87
   pts.proneural <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="Proneural"))  # 99
   pts.gcimp <- rownames(subset(tbl.gbmDzSubTypes, gbmDzSubType=="G-CIMP"))  # 39

   pts.all <- sort(unique(c(rownames(bmtx.mut), rownames(bmtx.cn))))
   pts.all <- sub("\\.0[1-9]$", "", pts.all)   # 1089
   pts.gbm <- sort(unique(c(pts.classical, pts.mesenchymal, pts.neural, pts.proneural, pts.gcimp)))  # 529
   pts.lgg <- setdiff(pts.all, pts.gbm)  # 571

   if(is.na(n))
      return(list(lgg=pts.lgg,
        classical=pts.classical,
        mesenchymal=pts.mesenchymal,
        neural=pts.neural,
        proneural=pts.proneural,
        gcimp=pts.gcimp))


   return(list(lgg=pts.lgg[1:n],
               classical=pts.classical[1:n],
               mesenchymal=pts.mesenchymal[1:n],
               neural=pts.neural[1:n],
               proneural=pts.proneural[1:n],
               gcimp=pts.gcimp[1:n]))
    
} # poi
#----------------------------------------------------------------------------------------------------
# our standard function, matrix.to.interaction.table, won't work here because gene-to-chromsome
# relationships have to be carved out of org.Hs.egCHR.
# standard results actually have 3 fields:
# $tbl
#            row   col         val
# 1 TCGA.06.0747  EGFR       A289V
# 2 TCGA.06.0749  EGFR A289T,V774M
# 3 TCGA.06.0140   ELN       G122E
# ...
# 
# $row.orphans
#  [1] "TCGA.02.0014" "TCGA.02.0021" "TCGA.02.0028" "TCGA.02.0033" "TCGA.02.0037"
#  [6] "TCGA.02.0080" "TCGA.02.0114" "TCGA.02.0432" "TCGA.06.0182" "TCGA.06.0201"
#  ...
# 
# $col.orphans
#  [1] "EDIL3"   "EED"     "EEF2"    "EFEMP2"  "EHD2"    "EIF4A2"  "ELAVL1" 
#  [8] "ELAVL2"  "ELF4"    "ELK4"    "ELL"     "ELOVL2"  "EML4"    "EMP3"   
#  ...
# here, however, they are rendered into the same 3-column table which the standard function
# returns:
#      row   col        val
# 1   UPF1 chr19 chromosome
# 2   UROS chr10 chromosome
# 3  USH2A  chr1 chromosome
# 4  USP33  chr1 chromosome
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
test_createChromosomeTable <- function()
{
   print("--- test_createChromsomeTable")

   gene.mutation.counts <- apply(mtx.mut, 2, function(column) length(which(column != "")))
   genes <- names(tail(sort(gene.mutation.counts), n=10))
   genes # [1] "UPF1"  "UROS"  "USH2A" "USP33" "USP6"  "ELN"   "PTCH1" "TTN"   "EGFR"  "PTEN" 

   tbl <- createChromosomeTable(genes)
   checkEquals(dim(tbl), c(10,3))
   checkEquals(colnames(tbl), c ("row", "col", "val"))
   checkEquals(unique(tbl$val), "chromosome")
   checkEquals(tbl$row, genes)
   print(checkEquals(length(grep("chr", tbl$col)), length(genes)))

   invisible(tbl)

} # test_createChromsomeTable
#----------------------------------------------------------------------------------------------------
createChromosomeGraph <- function(tbl, chrom.orphans)
{
  genes <- tbl$row
  chroms <- tbl$col

  all.nodes <- unique(c(genes, chroms, chrom.orphans))
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")

  nodeDataDefaults(g, "nodeType") <- ""
  nodeDataDefaults(g, "label") <- ""
  edgeDataDefaults(g, "edgeType") <- "chromosome"

  g <- addEdge(genes, chroms,  g)
  
  nodeData(g, genes,    "nodeType") <- "gene"
  nodeData(g, unique(chroms),   "nodeType")    <- "chromosome"
  #nodeData(g, chrom.orphans,    "nodeType")    <- "chromosome"
  nodeData(g, all.nodes, "label") <- all.nodes

  g

} # createChromosomeGraph
#----------------------------------------------------------------------------------------------------
test_createChromosomeGraph <- function()
{
   print("--- test_createChromosomeGraph")
   tbl <- test_createChromosomeTable()
   g <- createChromosomeGraph(tbl)

   node.count <- length(nodes(g))
   checkEquals(node.count, 17)

   edge.count <- length(edgeNames(g))
   checkEquals(edge.count, 10)
   
   chromosome.count <- length(grep("^chr", nodes(g)))
     # edges are a list named by the gene nodes, due to the way we assigned edges above
     # thus the edge count should be equal to the gene count
   checkEquals(edge.count + chromosome.count, node.count)

   checkEquals(unique(eda(g, "edgeType")), "chromosome")
   checkEquals(sort(unique(noa(g, "nodeType"))), c("chromosome", "gene"))

} # test_createChromsomeGraph
#----------------------------------------------------------------------------------------------------
createGisticGraph <- function(tbl, include.orphans=TRUE, patient.orphans=list(), gene.orphans=list())
{
  #browser()
  edgeTypes <- list("-2"= "cnLoss.2", "-1" = "cnLoss.1", "1"="cnGain.1", "2"="cnGain.2")

  patients <- tbl$row
  all.patients <- patients
  if(include.orphans)
     all.patients <- c(patients, patient.orphans)
  genes <- tbl$col
  all.genes <- genes
  if(include.orphans)
     all.genes <- c(genes, gene.orphans)
  
  all.nodes <- unique(c(all.patients, all.genes))
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")

  nodeDataDefaults(g, "nodeType") <- ""
  nodeDataDefaults(g, "label") <- ""
  edgeDataDefaults(g, "edgeType") <- "" 

  g <- addEdge(patients, genes,  g)

  edgeTypes <- unlist(lapply(as.character(tbl$val), function(val) edgeTypes[[val]]))
  edgeData(g, patients, genes, "edgeType") <- edgeTypes
  
  nodeData(g, genes,  "nodeType") <- "gene"
  nodeData(g, patients,    "nodeType")    <- "patient"
  nodeData(g, all.nodes, "label") <- all.nodes

  g

} # createGisticGraph
#----------------------------------------------------------------------------------------------------
test_createGisticGraph <- function()
{
  print("--- test_createGisticGraph")
  
     #----------------------------------------------------------------------
     # create one graph for gistic score +2, include orphans (the default)
     #---------------------------------------------------------------------
  
  filter <- function(x){x==2}
  gistic.2 <- matrix.to.interactionTable(mtx.cn, as.integer(mtx.cn), filter)
  tbl <- gistic.2$tbl
  patient.orphans <- gistic.2$row.orphans
  gene.orphans <- gistic.2$col.orphans
  
  g.p2 <- createGisticGraph(tbl, include.orphans=TRUE, patient.orphans, gene.orphans)

  node.count <- length(nodes(g.p2))
  checkEquals(node.count, length(unique(c(tbl$row, tbl$col, patient.orphans, gene.orphans))))
  
    # spot check a few patients
  checkEquals(sort(edges(g.p2)$TCGA.02.0432), c("ELN", "PIK3CG", "PTPN11"))
  checkEquals(sort(edges(g.p2)$TCGA.06.0402), c("EGFR", "PIK3CA"))
   
     #----------------------------------------------------------------------
     # create one graph for gistic score +2, exclude orphans
     #---------------------------------------------------------------------
  
  filter <- function(x){x==2}
  gistic.2 <- matrix.to.interactionTable(mtx.cn, as.integer(mtx.cn), filter)
  tbl <- gistic.2$tbl
  patient.orphans <- gistic.2$row.orphans
  gene.orphans <- gistic.2$col.orphans
  
  g.p2 <- createGisticGraph(tbl, include.orphans=FALSE)

  node.count <- length(nodes(g.p2))
  checkEquals(node.count, length(unique(c(tbl$row, tbl$col))))
  
    # spot check a few patients
  checkEquals(sort(edges(g.p2)$TCGA.02.0432), c("ELN", "PIK3CG", "PTPN11"))
  checkEquals(sort(edges(g.p2)$TCGA.06.0402), c("EGFR", "PIK3CA"))
   
     #------------------------------------------------------------
     # create one graph for all gistic != 0
     #------------------------------------------------------------
  
  filter <- function(x){x!=0}
  gistic.all <- matrix.to.interactionTable(mtx.cn, as.integer(mtx.cn), filter)
  tbl <- gistic.all$tbl
  patient.orphans <- gistic.all$row.orphans
  gene.orphans <- gistic.all$col.orphans
  
  g <- createGisticGraph(tbl, include.orphans=TRUE, patient.orphans, gene.orphans)

  node.count <- length(nodes(g))
  checkEquals(node.count, length(unique(c(tbl$row, tbl$col, patient.orphans, gene.orphans))))
  
    # spot check a few patients
  checkEquals(sort(edges(g)$TCGA.02.0432),
              c("EHD2", "ELAVL2", "ELN", "EMP3", "PIK3CG", "PLAUR", "PSIP1", "PTPN11", "TTYH1", "UGT8"))
  checkEquals(length(sort(edges(g)$TCGA.06.0402)), 27)

} # test_createGisticGraph
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

  tbl$row <- sub("\\.0[0-9]$", "", tbl$row)
  row.orphans <- sort(setdiff(rownames(mtx), tbl$row))
  col.orphans <- sort(setdiff(colnames(mtx), unique(tbl$col)))
                      
  list(tbl=tbl, row.orphans=row.orphans, col.orphans=col.orphans)
  
} # matrix.to.interactionTable
#----------------------------------------------------------------------------------------------------
test_matrix.to.interactionTable <- function()
{
   print("--- test_matrix.to.interactionTable")
   m <- matrix(c(11, 0, 31,  0, 22, 32, 0, 23, 33, 14, 24, 34), nrow=3,ncol=4, byrow=FALSE, 
               dimnames=list(c("R1", "R2", "R3"), c("C1", "C2", "C3", "C4")))
   filter <- function(x) {x != 0}
   result <- matrix.to.interactionTable(m, as.integer(m), filter)
   tbl <- result$tbl
   row.orphans <- result$row.orphans
   checkEquals(length(row.orphans), 0)
   col.orphans <- result$col.orphans
   checkEquals(length(col.orphans), 0)

   checkEquals(dim(tbl), c(9, 3))

       # now try with a mutation matrix
   filter <- function(x){!is.na(x)}
   result <- matrix.to.interactionTable(mtx.mut, as.character(mtx.mut), filter)
   checkEquals(sort(names(result)), c("col.orphans", "row.orphans", "tbl"))
   tbl <- result$tbl
   row.orphans <- result$row.orphans
   checkEquals(row.orphans, c("TCGA.02.0014","TCGA.02.0021","TCGA.02.0028","TCGA.02.0033","TCGA.02.0037","TCGA.02.0080",
                              "TCGA.02.0114","TCGA.02.0432","TCGA.06.0182","TCGA.06.0201","TCGA.06.0402","TCGA.06.0409",
                              "TCGA.06.0413", "TCGA.08.0344", "TCGA.12.0656", "TCGA.12.0657"))
   col.orphans <- result$col.orphans
   checkEquals(length(col.orphans), 59)

   good.values <- which(!is.na(mtx.mut))
   checkEquals(dim(tbl), c(length(good.values), 3))

     # make sure all row and col names from mtx.mut.gbm are either in the tbl
     # or got identified as orphan
   checkEquals(sort(unique(c(tbl$row, tbl$col, row.orphans, col.orphans))),
               sort(c(rownames(mtx.mut), colnames(mtx.mut))))

} # test_matrix.to.interactionTable
#----------------------------------------------------------------------------------------------------
test_matrix.to.interactionTable.restrictedByGenesOfInterest <- function()
{
   print("--- test_matrix.to.interactionTable.restrictedByGenesOfInterest")

       # now try with a mutation matrix
   filter <- function(x){!is.na(x)}
   genes.of.interest <- c("EGFR", "PTEN")
   mtx <- mtx.mut[, intersect(colnames(mtx.mut), genes.of.interest)]
   result <- matrix.to.interactionTable(mtx, as.character(mtx), filter) # , genes.of.interest)
   checkEquals(sort(names(result)), c("col.orphans", "row.orphans", "tbl"))
   tbl <- result$tbl
   row.orphans <- result$row.orphans
   checkEquals(row.orphans, c("TCGA.02.0014","TCGA.02.0021","TCGA.02.0028","TCGA.02.0033","TCGA.02.0037",
                              "TCGA.02.0080","TCGA.02.0114","TCGA.02.0432","TCGA.06.0140","TCGA.06.0182",
                              "TCGA.06.0201","TCGA.06.0402","TCGA.06.0409","TCGA.06.0413","TCGA.08.0344",
                              "TCGA.12.0656","TCGA.12.0657"))
   col.orphans <- result$col.orphans
   checkEquals(length(col.orphans), 0)  # matrix was already trimmed to just two columns

   good.values <- which(!is.na(mtx))
   checkEquals(dim(tbl), c(length(good.values), 3))

     # make sure all row and col names from mtx.mut.gbm are either in the tbl
     # or got identified as orphan
   checkEquals(sort(unique(c(tbl$row, tbl$col, row.orphans, col.orphans))),
               sort(c(rownames(mtx), colnames(mtx))))

} # test_matrix.to.interactionTable.restrictedByGenesOfInterest
#----------------------------------------------------------------------------------------------------
createMutationGraph <- function(tbl, patient.orphans, gene.orphans)
{
  patients <- tbl$row
  genes <- tbl$col
  mutations <- tbl$val
  
  all.patients <- c(patients, patient.orphans)
  all.genes <- c(genes, gene.orphans)
  all.nodes <- unique(c(all.patients, all.genes))

    
  g <- graphNEL(nodes=all.nodes, edgemode="directed")

  nodeDataDefaults(g, "nodeType") <- ""
  nodeDataDefaults(g, "label") <- ""
  edgeDataDefaults(g, "edgeType") <- "mutation"
  edgeDataDefaults(g, "mutation") <- ""

  g <- addEdge(patients, genes, g)

  
  nodeData(g, all.patients, "nodeType") <- "patient"
  nodeData(g, all.genes,    "nodeType") <- "gene"
  nodeData(g, all.genes,    "label")    <- all.genes
  nodeData(g, all.patients, "label") <- all.patients

  edgeData(g, patients, genes, "mutation") <- mutations

  g

} # createMutationGraph
#----------------------------------------------------------------------------------------------------
test_createMutationGraph <- function()
{
   print("--- test_createMutationGraph")

   filter <- function(x){!is.na(x)}
   result <- matrix.to.interactionTable(mtx.mut, as.character(mtx.mut), filter)
   tbl <- result$tbl
   patient.orphans <- result$row.orphans
   gene.orphans <- result$col.orphans

   g.mut <- createMutationGraph(tbl, patient.orphans, gene.orphans)
   checkEquals(length(nodes(g.mut)), sum(dim(mtx.mut)))
   checkEquals(length(unlist(edgeL(g.mut), use.names=FALSE)), nrow(tbl))
   checkEquals(noaNames(g.mut), c("nodeType", "label"))
   checkEquals(edaNames(g.mut), c("edgeType", "mutation"))

   checkEquals(sort(unique(noa(g.mut, "nodeType"))), c("gene", "patient"))
   checkEquals(sort(unique(eda(g.mut, "edgeType"))), "mutation")

   invisible(g.mut)
   
} # test_createMutationGraph
#----------------------------------------------------------------------------------------------------
displayMutationGraph <- function(g, title="DEMOdz mutations")
{
  rcy <- RCyjs(portRange=9047:9057, quiet=TRUE, graph=g)
  # restoreLayout(rcy, "xxxLayout.RData")
  
  rcy

} # displayMutationGraph
#----------------------------------------------------------------------------------------------------
vizmap <- function(rcy)
{
  setNodeLabelRule(rcy, "label");
  setNodeShapeRule(rcy, "nodeType",
                   c("patient", "gene", "chromosome"),
                   c("ellipse", "ellipse", "roundrect"))

  setNodeSizeRule(rcy, "nodeType",
                  c("patient", "gene", "chromosome"),
                  c(50, 40, 100))

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
  fitContent(rcy)
  setZoom(rcy, 0.8 * getZoom(rcy))

} # vizmap
#----------------------------------------------------------------------------------------------------
displayGistic <- function()
{
  filter <- function(x){x==2}
  gistic.2 <- matrix.to.interactionTable(mtx.cn, as.integer(mtx.cn), filter)
  tbl <- gistic.2$tbl
  patient.orphans <- gistic.2$row.orphans
  gene.orphans <- gistic.2$col.orphans
  
  g <- createGisticGraph(tbl, include.orphans=FALSE, patient.orphans, gene.orphans)
  rcy <-  RCyjs(portRange=9047:9057, quiet=TRUE, graph=g)

} # displayChromGraph
#----------------------------------------------------------------------------------------------------
addChromosomes <- function(rcy)
{
  nodes <- nodes(rcy@graph)
  genes <- nodes[which(nchar(nodes) < 12)]
  
  tbl.chrom <- createChromosomeTable(genes)
  g.chrom <- createChromosomeGraph(tbl.chrom)
  addGraph(rcy, g.chrom)
  showAllEdges(rcy)
  fitContent(rcy)

} # addChromosomes
#----------------------------------------------------------------------------------------------------
addGistic <- function(rcy, score)
{
  nodes <- nodes(rcy@graph)
  genes <- nodes[which(nchar(nodes) < 12)]
  deleters <- grep("^chr", genes)
  if(length(deleters) > 0)
      genes <- genes[-deleters]
  
  filter <- function(x){x==-2}
  x <- matrix.to.interactionTable(mtx.cn, as.integer(mtx.cn), filter)
  tbl <- x$tbl
  keepers <- match(genes, tbl$col)
  keepers <- keepers[!is.na(keepers)]
  stopifnot(length(keepers) > 0)
  tbl <- tbl[keepers,]
      
  g <- createGisticGraph(tbl, include.orphans=FALSE)
  addGraph(rcy, g)
  showAllEdges(rcy)
  fitContent(rcy)

} # addChromosomes
#----------------------------------------------------------------------------------------------------
# to experiement with loading json from the javascript console.  
emptyFrame <- function()
{

} # display
#----------------------------------------------------------------------------------------------------
# "patient.gene.subset" - the tricky part of which is that the matrices may have
# sample rownames ("TCGA.28.5219.01") which must be matched by patient id ("TCGA.28.5219")
pg.subset <- function(mtx, patients, genes)
{
  #browser()
  row.indices <- unlist(lapply(patients, function(p) grep(p, rownames(mtx))))
  target.hits <- rownames(mtx)[row.indices]
  target.hits <- sub("\\.0[0-9]$", "", target.hits)
  patient.orphans <- setdiff(patients, target.hits)
  gene.orphans <- setdiff(genes, colnames(mtx))
  list(mtx=mtx[row.indices, intersect(genes, colnames(mtx))],
       patient.orphans=patient.orphans,
       gene.orphans=gene.orphans)

} 
#----------------------------------------------------------------------------------------------------
test_pg.subset <- function(mtx, patients, genes)
{
  print("--- test_pg.subset")

     # last patient not in matrix
  poi <- c("TCGA.27.2519", "TCGA.76.4925", "TCGA.06.0165", "TCGA.06.02091", "bogus")
     # first two are NOT in matrix
  genes <- c("BRI3", "CCL26",  "GNAT3", "TCHH")  
  x <- pg.subset(bmtx.mut, poi, genes)
  checkEquals(sort(names(x)), c("gene.orphans", "mtx", "patient.orphans"))
  checkEquals(dim(x$mtx), c(3,2))
  checkEquals(sort(x$gene.orphans), c("BRI3", "CCL26"))
  checkEquals(sort(x$patient.orphans), c("TCGA.06.02091", "bogus"))
  
} # test_pg.subset
#----------------------------------------------------------------------------------------------------
# all patients, all chromsomes, specified genes
basicGraph <- function(genes)
{
  patients <- poi(n=NA)
  chroms <- paste0("chr", c(1:22, "X","Y"))
  
  all.patients <- unlist(patients, use.names=FALSE)
  all.patients <- sort(unique(sub("\\.0[1-9]$", "", all.patients)))

  all.nodes <- unique(c(chroms, all.patients, genes))
  
  g <- graphNEL(nodes=all.nodes, edgemode="directed")

  nodeDataDefaults(g, "nodeType") <- ""
  nodeDataDefaults(g, "dzSubType") <- ""
  nodeDataDefaults(g, "label") <- ""
  edgeDataDefaults(g, "edgeType") <- ""
  edgeDataDefaults(g, "mutation") <- ""

  nodeData(g, all.patients, "nodeType") <- "patient"
  nodeData(g, genes,        "nodeType") <- "gene"
  nodeData(g, chroms,       "nodeType") <- "chromosome"

  nodeData(g, all.patients, "label") <- all.patients
  nodeData(g, genes,        "label") <- genes
  nodeData(g, chroms,       "label") <- chroms

  nodeData(g, patients$lgg, "dzSubType") <- "lgg"
  nodeData(g, patients$classical, "dzSubType") <- "classical"
  nodeData(g, patients$mesenchymal, "dzSubType") <- "mesenchymal"
  nodeData(g, patients$neural, "dzSubType") <- "neural"
  nodeData(g, patients$proneural, "dzSubType") <- "proneural"
  nodeData(g, patients$gcimp, "dzSubType") <- "gcimp"

  rcy <- RCyjs(portRange=9047:9057, quiet=TRUE, graph=g)
  restoreLayout(rcy, tail(sort(grep("^layout\\.[0-9]+", dir(), value=TRUE)), n=1))
  httpSetStyle(rcy, "style.js")
  fitContent(rcy)
  setZoom(rcy, 0.85 * getZoom(rcy))

  rcy

} # basicGraph
#----------------------------------------------------------------------------------------------------
demo <- function()
{
  if(!exists("all.genes")){
    goi.file <- "all.genes.RData"
    if(file.exists(goi.file))
       load(goi.file, env=.GlobalEnv)
    else{
      all.genes <<- goi()    # currently 79
      save(all.genes, file=goi.file)
      }
    } # all.genes not defined

  load("goi834.RData")
  all.genes <- goi.834
  
  rcy <- basicGraph(all.genes) # all patients, all chromsomes, specified genes
  
  #patients.from.all.groups <- poi(5)
  patients.from.all.groups <- poi(NA)
  patients.of.interest <- unlist(patients.from.all.groups, use.names=FALSE)
  
  filter <- function(x){x != ""}
  pgs <- pg.subset(bmtx.mut, patients.of.interest, all.genes)
  mtx.oi <- pgs$mtx
  result <- matrix.to.interactionTable(mtx.oi, as.character(mtx.oi), filter)
  tbl <- result$tbl
  patient.orphans <- c(result$row.orphans, pgs$patient.orphans)
  gene.orphans <- c(result$col.orphans, pgs$gene.orphans)

  g.mut <- createMutationGraph (tbl, c(), c()) # patient.orphans, gene.orphans)
  httpAddGraph(rcy, g.mut)
  #showEdges(rcy, "mutation")
  restoreLayout(rcy, tail(sort(grep("^layout\\.[0-9]+", dir(), value=TRUE)), n=1))
  httpSetStyle(rcy, "style.js")
  fitContent(rcy)

  tbl.chrom <- createChromosomeTable(all.genes)
  all.chroms <- paste0("chr", c(1:22, "X","Y"))
  chrom.orphans <- setdiff(all.chroms, tbl.chrom$col)
  g.chrom <- createChromosomeGraph(tbl.chrom, c()) #chrom.orphans)
  print(g.chrom)
  httpAddGraph(rcy, g.chrom)
  #showEdges(rcy, "chromosome")
  restoreLayout(rcy, tail(sort(grep("^layout\\.[0-9]+", dir(), value=TRUE)), n=1))
  httpSetStyle(rcy, "style.js")
  fitContent(rcy)

     #------------------------------------------------------------
     # add copy number gain edges, gistic 2
     #------------------------------------------------------------

  filter <- function(x){x == 2}
  pgs <- pg.subset(bmtx.cn, patients.of.interest, all.genes)
  mtx.oi <- pgs$mtx
  result <- matrix.to.interactionTable(mtx.oi, as.character(mtx.oi), filter)
  tbl <- result$tbl
  patient.orphans <- c(result$row.orphans, pgs$patient.orphans)
  gene.orphans <- c(result$col.orphans, pgs$gene.orphans)
  
  g.p2 <- createGisticGraph(tbl, include.orphans=FALSE, patient.orphans, gene.orphans)
  httpAddGraph(rcy, g.p2)
  
  restoreLayout(rcy, tail(sort(grep("^layout\\.[0-9]+", dir(), value=TRUE)), n=1))
  httpSetStyle(rcy, "style.js")
  fitContent(rcy)
  #showEdges(rcy, "cnGain.2")

     #------------------------------------------------------------
     # add copy number loss edges, gistic -2
     #------------------------------------------------------------

  filter <- function(x){x == -2}
  pgs <- pg.subset(bmtx.cn, patients.of.interest, all.genes)
  mtx.oi <- pgs$mtx
  result <- matrix.to.interactionTable(mtx.oi, as.character(mtx.oi), filter)
  tbl <- result$tbl
  patient.orphans <- c(result$row.orphans, pgs$patient.orphans)
  gene.orphans <- c(result$col.orphans, pgs$gene.orphans)
  
  g.m2 <- createGisticGraph(tbl, include.orphans=FALSE, patient.orphans, gene.orphans)
  httpAddGraph(rcy, g.m2)
  
  restoreLayout(rcy, tail(sort(grep("^layout\\.[0-9]+", dir(), value=TRUE)), n=1))
  httpSetStyle(rcy, "style.js")
  fitContent(rcy)
  #showEdges(rcy, "cnLoss.2")

  return(rcy)

     #------------------------------------------------------------
     # add copy number gain edges, gistic 1
     #------------------------------------------------------------

  filter <- function(x){x == 1}
  pgs <- pg.subset(bmtx.cn, patients.of.interest, all.genes)
  mtx.oi <- pgs$mtx
  result <- matrix.to.interactionTable(mtx.oi, as.character(mtx.oi), filter)
  tbl <- result$tbl
  patient.orphans <- c(result$row.orphans, pgs$patient.orphans)
  gene.orphans <- c(result$col.orphans, pgs$gene.orphans)
  
  g.p1 <- createGisticGraph(tbl, include.orphans=FALSE, patient.orphans, gene.orphans)
  httpAddGraph(rcy, g.p1)
  
  restoreLayout(rcy, tail(sort(grep("^layout\\.[0-9]+", dir(), value=TRUE)), n=1))
  httpSetStyle(rcy, "style.js")
  fitContent(rcy)
  #showEdges(rcy, "cnGain.1")

     #------------------------------------------------------------
     # add copy number loss edges, gistic -1
     #------------------------------------------------------------

  filter <- function(x){x == -1}
  pgs <- pg.subset(bmtx.cn, patients.of.interest, all.genes)
  mtx.oi <- pgs$mtx
  result <- matrix.to.interactionTable(mtx.oi, as.character(mtx.oi), filter)
  tbl <- result$tbl
  patient.orphans <- c(result$row.orphans, pgs$patient.orphans)
  gene.orphans <- c(result$col.orphans, pgs$gene.orphans)
  
  g.m1 <- createGisticGraph(tbl, include.orphans=FALSE, patient.orphans, gene.orphans)
  httpAddGraph(rcy, g.m1)
  
  restoreLayout(rcy, tail(sort(grep("^layout\\.[0-9]+", dir(), value=TRUE)), n=1))
  httpSetStyle(rcy, "style.js")
  fitContent(rcy)
  #showEdges(rcy, "cnLoss.1")

  fitContent(rcy)
  setZoom(rcy, 0.9 * getZoom(rcy))
  rcy


} # demo
#----------------------------------------------------------------------------------------------------
