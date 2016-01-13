oldrun = function (levels)
{
  if("redo" %in% levels){
    run(c(0,1,3,4,"viz"))
    }

  if(0 %in% levels){
    patients.lacking.essential.data <- c("UW.LU.0028",  # from direct inspection
                                         "UW.LU.0031",
                                         "UW.LU.0049",
                                         "UW.LU.0076",
                                         "UW.LU.0082",
                                         "UW.LU.0087",
                                         "UW.LU.0102")
    deleters <- intersect(patients.lacking.essential.data, rownames(mtx.mut))
    if(length(deleters) > 0){
      indices <- match(deleters, rownames(mtx.mut))
      mtx.mut <- mtx.mut[-indices,]
      }
    filter <- function(x) nzchar(x)
    x <- matrix.to.interactionTable(mtx.mut, as.character(mtx.mut), filter)
    tbl <<- x$tbl
    orphan.genes <<- x$orphan.genes
    orphan.patients <<- x$orphan.patients
    g.mut <<- createMutationGraph(tbl, orphan.patients)
    }
  
  if (1 %in% levels) {
    rcy <<- RCyjs(portRange=9047:9057, quiet=TRUE, graph=g.mut)
    } # 1


  if ("viz" %in% levels) {
     #restoreLayout(rcy, tail(sort(grep("layout", dir(), value=TRUE)),n=1))
     restoreLayout(rcy, "layout.current")
     fitContent(rcy); setZoom(rcy, 0.9 * getZoom(rcy))
     httpSetStyle(rcy, "style.js")
     } # viz

  if(3 %in% levels){
     load("../../../UWlung/inst/extdata/mtx.cn.RData", env=.GlobalEnv)
     keepers <- intersect(rownames(mtx.mut), rownames(mtx.cn))
     mtx.cn <<- mtx.cn[keepers,]   # 83 x 43; 28 unique genes for cn, 30 for mut
     filter <- function(x) x != 0;
     x <- matrix.to.interactionTable(mtx.cn, as.integer(mtx.cn), filter)
     g.cn <<- createCopyNumberGraph(x$tbl)
     } # 3

  if (4 %in% levels) {
     addGraph(rcy, g.cn)
     } # 4

  if ("export" %in% levels) {
    fitContent(rcy); setZoom(rcy, 0.75 * getZoom(rcy))
    hideAllEdges(rcy)
    g.markers.json <- getJSON(rcy);
    print(nchar(g.markers.json));
    save(g.markers.json, file="../../../UWlung/inst/extdata/markers.json.RData")
    } # export

} # run
#------------------------------------------------------------------------------------------------------------------------
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

  tbl <- data.frame(row=rownames(mtx)[rows],
                    col=colnames(mtx)[cols],
                    val=vals, stringsAsFactors=FALSE)

  browser()
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
  nodeData(g, genes,    "label")    <- genes
  nodeData(g, chromosomes, "label") <- chromosomes

  g

} # createChromosomeGraph
#----------------------------------------------------------------------------------------------------
