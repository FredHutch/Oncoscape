# go.R
#------------------------------------------------------------------------------------------------------------------------
# here we still liberally from
#
#  ~/s/data/hamid/repo/hbolouri/oncoDev/prep/tcgaMarkersAndTissues/markers/go.R (20 apr 2015)
#
# needed for httpSetStyle(rcy, "style.js")   and httpAddGraph
#   python -m SimpleHTTPServer   
#   selectNodes(rcy, names(which(noa(rcy@graph, 'dzSubType') == "lgg")))
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
#  (cd ~/oncodev/hbolouri/oncoDev14/Oncoscape/inst/scripts/markersAndSamples; make tabs)
#
#  -- in the chrome console:
#
#  cy.nodes().map(function(node){return (node.degree())})
#  cy.nodes().map(function(node){node.data({degree: node.degree()})});
#
# get the old layout from oncodev 1.2.28
#
#   1) go to oncoscape.sttrcancer.org
#   2) in the js console:
#        cy = cwMarkers
#        JSON.stringify(cy.filter("node:selected").map(function(node){return ({name: node.data().name, pos: node.position()})}))
#   3) go to the new rcy session created here with this script
#      x = [copy and paste into gbmprep js console] 
#      for(var i=0; i < x.length; i++){
#        name = x[i].name
#        pos = x[i].pos
#        //console.log(name + ": " + pos.x + ", " + pos.y);
#        filterString = "node[name='" + name + "']";
#        cy.filter(filterString).position({x: pos.x, y: pos.y});
#        }
#
# when this looks good
#   4) saveLayout(rcy, "layout-from-oncodev1.2.28")
#   5) reload("viz") does this:
#        restoreLayout(rcy, "layout-from-oncodev1.2.28")
#        fitContent(rcy); setZoom(rcy, 0.9 * getZoom(rcy))
#        httpSetStyle(rcy, "style.js")
#
#
# 

#------------------------------------------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)
library(org.Hs.eg.db)
library(RCyjs)
library(jsonlite)
#------------------------------------------------------------------------------------------------------------------------
debug.small <- FALSE
#------------------------------------------------------------------------------------------------------------------------
if(!exists("mtx.mut")){
  load("../../../TCGAgbm/inst/extdata/mtx.mut.RData")
  rownames(mtx.mut) <- sub("\\.01$", "", rownames(mtx.mut))
  }
if(!exists("mtx.cn")){
   load("../../../TCGAgbm/inst/extdata/mtx.cn.RData")
   rownames(mtx.cn) <- sub("\\.01$", "", rownames(mtx.cn))
   }

if(!exists("tbl.gbmDzSubTypes"))
    load("tbl.dzSubTypes.RData")  # 548 patients

#------------------------------------------------------------------------------------------------------------------------
run = function(maxNodes=NA)
{
   x <- createBaseGraph(maxNodes)
   all.nodes <- x$all.nodes
   genes <- x$genes
   patients <- x$patients
   g <- x$g
   rcy <- x$rcy

   suppressWarnings(tbl.chrom <<- createChromosomeTable(genes))
   g.chrom <<- createChromosomeGraph(tbl.chrom)
   httpAddGraph(rcy, g.chrom)

   fmtx.mut <- mtx.mut[intersect(rownames(mtx.mut), patients), intersect(colnames(mtx.mut), genes)]
   if(nrow(fmtx.mut) > 0 & ncol(fmtx.mut) > 0){
      filter <- function(x) nzchar(x)
      x <- matrix.to.interactionTable(fmtx.mut, as.character(fmtx.mut), filter)
      tbl <- x$tbl
      orphan.genes <- x$orphan.genes
      orphan.patients <- x$orphan.patients
      g.mut <- createMutationGraph(tbl, orphan.patients)
      httpAddGraph(rcy, g.mut)
      }
   
   fmtx.cn <- mtx.cn[intersect(rownames(mtx.cn), patients), intersect(colnames(mtx.cn), genes)]
   filter <- function(x) abs(x) > 1;
   if(!is.na(maxNodes))
      filter <- function(x) abs(x) >= 1;
    x <- matrix.to.interactionTable(fmtx.cn, as.integer(fmtx.cn), filter)
    g.cn <- createCopyNumberGraph(x$tbl)
    httpAddGraph(rcy, g.cn)
    print(g.cn)

    rcy

} # run
#------------------------------------------------------------------------------------------------------------------------
viz <- function(rcy)
{
  restoreLayout(rcy, "layout-from-oncodev1.2.28")
  fitContent(rcy); setZoom(rcy, 0.9 * getZoom(rcy))
  httpSetStyle(rcy, "style.js")

} # viz
#------------------------------------------------------------------------------------------------------------------------
export <- function(rcy)
{
   fitContent(rcy); setZoom(rcy, 0.75 * getZoom(rcy))
   hideAllEdges(rcy)
   g.markers.json <- getJSON(rcy);
   print(nchar(g.markers.json));
   save(g.markers.json, file="markers.json.RData")
   print("optionally: cp markers.json.RData ../../../TCGAgbm/inst/extdata/")

} # export
#------------------------------------------------------------------------------------------------------------------------
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
test.createMutationGraph <- function()
{
   print("--- test.createMutationGraph")

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
  
  chroms <- paste0("", as.character(chrom.list.singles))
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
  nodeData(g, genes,    "label")    <- genes
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
createBaseGraph <- function(maxNodes)
{
   all.nodes <- fromJSON(scan("nodes.json", what=character(0), sep="\n",quiet=TRUE))
   chromosomes <- as.character(c(1:22, "X", "Y"))
   all.nodes <- c(all.nodes, chromosomes)
   patients <- grep("^TCGA", all.nodes, v=TRUE)  # 304
   genes <- setdiff(all.nodes, patients)

   if(!is.na(maxNodes)){
     genes <- genes[1:maxNodes]
     patients <- patients[1:maxNodes]
     all.nodes <- c(genes, patients, chromosomes)
     }
   
   g <- graphNEL(nodes=all.nodes, edgemode="directed")
   nodeDataDefaults(g, attr="nodeType") <- "unassigned"
   nodeDataDefaults(g, attr="subType") <- "unassigned"
   nodeDataDefaults(g, attr="label") <- "unassigned"
   edgeDataDefaults(g, attr="edgeType") <- "mutation"
   edgeDataDefaults(g, attr="mutation") <- "unassigned"
   nodeData(g, patients, attr="nodeType") <- "patient"
   nodeData(g, genes, attr="nodeType") <- "gene"
   nodeData(g, chromosomes, attr="nodeType") <- "chromosome"
   nodeData(g, patients, attr="subType") <- as.character(tbl.gbmDzSubTypes[patients, "gbmDzSubType"])
   rcy <- RCyjs(portRange=9047:9057, quiet=TRUE, graph=g, hideEdges=TRUE)
   g.base <- g   # 879 nodes, no edges

   return(list(all.nodes=all.nodes, patients=patients, genes=genes, g=g, rcy=rcy))

} # createBaseGraph
#----------------------------------------------------------------------------------------------------
rcy <- run()
print("make sure 'python -m SimpleHTTPServer' is running out of the current directory")
viz(rcy)
export(rcy)
