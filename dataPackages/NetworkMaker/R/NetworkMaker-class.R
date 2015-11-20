#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.NetworkMaker <- setClass ("NetworkMaker", 
                         representation = representation (
                             pkg="SttrDataPackageClass",
                             mtx.mut="matrix",
                             mtx.cn="matrix",
                             state="environment"
                             )
                         )

#----------------------------------------------------------------------------------------------------
setGeneric('calculateSampleSimilarityMatrix',  signature='obj', function(obj, samples=NA, genes=NA)
                                                                standardGeneric('calculateSampleSimilarityMatrix'))
setGeneric('getSampleSimilarityCoordinates',   signature='obj', function(obj) standardGeneric('getSampleSimilarityCoordinates'))
setGeneric('buildChromosomalTable',      signature='obj', function(obj, genes) standardGeneric('buildChromosomalTable'))
setGeneric('getChromosomalInfo',         signature='obj', function(obj) standardGeneric('getChromosomalInfo'))
setGeneric('getSamplesGraph',            signature='obj', function(obj) standardGeneric('getSamplesGraph'))
setGeneric('getChromosomeGraph',         signature='obj', function(obj, genes) standardGeneric('getChromosomeGraph'))
setGeneric('getSampleScreenCoordinates', signature='obj', function(obj, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)
                                                                standardGeneric('getSampleScreenCoordinates'))
setGeneric('getChromosomeScreenCoordinates',  signature='obj', function(obj, xOrigin=1000, yOrigin=0, yMax=2000, chromDelta=200)
                                                                standardGeneric('getChromosomeScreenCoordinates'))
#----------------------------------------------------------------------------------------------------
# constructor
NetworkMaker <- function(dataPackage, verbose=FALSE)
{
  stopifnot("mtx.mut" %in% names(matrices(dataPackage)))
  stopifnot("mtx.cn"  %in% names(matrices(dataPackage)))
  mtx.mut <- matrices(dataPackage)[["mtx.mut"]]
  mtx.cn <- matrices(dataPackage)[["mtx.cn"]]

  obj <- .NetworkMaker(pkg=dataPackage, mtx.mut=mtx.mut, mtx.cn=mtx.cn, state=new.env(parent=emptyenv()))

  obj

} # NetworkMaker constructor
#----------------------------------------------------------------------------------------------------
# our convention:
#   samples (patients) are all those listed in the patientHistory
#   genes are all those mentioned in the package gene lists, combined
.extractSamplesAndGenes <- function(obj)
{
   sample.names <- sort(unique(c(rownames(obj@mtx.mut), rownames(obj@mtx.cn))))
   sample.names <- canonicalizePatientIDs(obj@pkg, sample.names)
   gene.names <- c()
   geneSetNames <- getGeneSetNames(obj@pkg)
   stopifnot(length(geneSetNames) >= 1)
   for(name in geneSetNames){
     gene.names <- c(gene.names, getGeneSetGenes(obj@pkg, name))
     } # for name

   gene.names <- sort(unique(gene.names))
    
   list(samples=sample.names, genes=gene.names)

} # .extractSamplesAndGenes
#----------------------------------------------------------------------------------------------------
# samples and genes args are only for testing; in normal operation the full lists from
# .extractSamplesAndGenes is used
setMethod("calculateSampleSimilarityMatrix", "NetworkMaker",

  function (obj, samples=NA, genes=NA) {

     mut <- obj@mtx.mut

     if(!all(is.na(samples))){
        samples <- intersect(rownames(mut), samples)
        mut <- mut[samples,]
        }

     if(!all(is.na(genes))){
        genes <- intersect(colnames(mut), genes)
        mut <- mut[, genes]
        }

        # coerce mut into a matrix of 0/1
        # mutation matrices indicate wildtype by what token?  "" or NA or "NA"?
        # until this is standardized and enforced check for each

     
     if(length(which(mut == "NA")) > 0){
         mut.01 <- (mut != "NA") + 0   # coerce to integers by adding zero
     } else if (length(which(is.na(mut))) > 0){
         mut.01 <- (!is.na(mut)) + 0
     } else if (length(which(mut == "")) > 0){
         mut.01 <- (mut != "") + 0
     } else {
         stop("unexpected mut values")
     }

     stopifnot(all(sort(unique(as.integer(mut.01))) == c(0,1)))

     cn <- obj@mtx.cn

     if(!all(is.na(samples))){
        samples <- intersect(rownames(cn), samples)
        cn <- cn[samples,]
        }
     if(!all(is.na(genes))){
        genes <- intersect(colnames(cn), genes)
        cn <- cn[, genes]
        }

        # we distinguish between copy number genes, and mutated genes:
     colnames(cn) <-     paste(colnames(cn),     ".cn", sep="");
     colnames(mut.01) <- paste(colnames(mut.01), ".mut", sep="");

     all.genes   <- sort(unique(c(colnames(cn), colnames(mut.01))))
     all.samples <- sort(unique(c(rownames(cn), rownames(mut.01))))
     
     mtx <- matrix(0, nrow=length(all.samples), ncol=length(all.genes), byrow=FALSE,
                   dimnames<-list(all.samples, all.genes))
     mtx[rownames(cn), colnames(cn)] <- cn
     mtx[rownames(mut.01), colnames(mut.01)] <- mut.01

     dmtx <- as.matrix(dist(mtx))
     tbl.pos <- as.data.frame(cmdscale(dmtx, k=3))
     colnames(tbl.pos) <- c("x", "y", "z")
     rownames(tbl.pos) <- canonicalizePatientIDs(obj@pkg, rownames(tbl.pos))
     obj@state[["sampleSimilarityCoordinates"]] <- tbl.pos
     })

#----------------------------------------------------------------------------------------------------
setMethod("getSampleSimilarityCoordinates", "NetworkMaker",

  function(obj){
    stopifnot("sampleSimilarityCoordinates" %in% ls(obj@state))
    return(obj@state[["sampleSimilarityCoordinates"]])
    })

#----------------------------------------------------------------------------------------------------
setMethod("getSamplesGraph", "NetworkMaker",

  function(obj){
    stopifnot("sampleSimilarityCoordinates" %in% ls(obj@state))
    tbl.pos <- obj@state[["sampleSimilarityCoordinates"]]
    all.nodes <- rownames(tbl.pos)
    g <- graphNEL(nodes=all.nodes, edgemode="directed")
    nodeDataDefaults(g, attr="nodeType") <- "sample"
    nodeDataDefaults(g, attr="subType") <- "unassigned"
    nodeDataDefaults(g, attr="id") <- "unassigned"
    nodeDataDefaults(g, attr="x") <- 0
    nodeDataDefaults(g, attr="y") <- 0

    edgeDataDefaults(g, attr="edgeType") <- "unassigned"
    edgeDataDefaults(g, attr="subType") <- "unassigned"

    nodeData(g, all.nodes, "id") <- all.nodes
    nodeData(g, all.nodes, "x") <- tbl.pos$x
    nodeData(g, all.nodes, "y") <- tbl.pos$y + (0.2 * tbl.pos$z)
    return(g)
    })

#----------------------------------------------------------------------------------------------------
setMethod("getChromosomeGraph", "NetworkMaker",

  function(obj, genes){

    tbl.info <- buildChromosomalTable(obj, genes)

    all.nodes <- tbl.info$name
    centromere.nodes <- subset(tbl.info, type=="arm")$name
    telomere.nodes <- tbl.info$name[grep("telomere", tbl.info$type)]
    gene.nodes <- subset(tbl.info, type=="gene")$name
    
    g <- graphNEL(nodes=all.nodes, edgemode="directed")
    nodeDataDefaults(g, attr="nodeType") <- "unassigned"
    nodeDataDefaults(g, attr="landmark")  <- "not"
    nodeDataDefaults(g, attr="id") <- "unassigned"
         # "true" dimenions are used to restore from current dimensions after
         # resizing with zooming
    nodeDataDefaults(g, attr="trueWidth") <- 0
    nodeDataDefaults(g, attr="trueHeight") <- 0
    
    edgeDataDefaults(g, attr="edgeType") <- "unassigned"
    edgeDataDefaults(g, attr="subType") <- "unassigned"

    nodeData(g, all.nodes, "id") <- all.nodes

    nodeData(g, centromere.nodes, "nodeType") <- "centromere"
    nodeData(g, centromere.nodes, "landmark") <- "visible"
    nodeData(g, telomere.nodes,   "nodeType") <- "telomere"
    nodeData(g, gene.nodes,       "nodeType") <- "gene"

    chroms.in.order <- c(1:22, "X", "Y")
    p.arm.nodes <- paste("chr", chroms.in.order, "p", sep="")
    q.arm.nodes <- paste("chr", chroms.in.order, "q", sep="")
    p.telomeres <- paste("start.", chroms.in.order, sep="")
    q.telomeres <- paste("end.", chroms.in.order, sep="")

    g <- addEdge(p.arm.nodes, p.telomeres, g)
    g <- addEdge(q.arm.nodes, q.telomeres, g)
    edgeData(g, p.arm.nodes, p.telomeres, "edgeType") <- "chromosome"
    edgeData(g, q.arm.nodes, q.telomeres, "edgeType") <- "chromosome"

    return(g)
    })

#----------------------------------------------------------------------------------------------------
setMethod("getSampleScreenCoordinates", "NetworkMaker",

  function(obj, xOrigin, yOrigin, xMax, yMax){ # xSpan, ySpan){

     xSpan <- xMax - xOrigin
     ySpan <- yMax - yOrigin

     tbl.pos <- getSampleSimilarityCoordinates(obj)
     # browser()
     x.range <- range(tbl.pos$x)  # [1] -0.6168073  2.8896624
     y.range <- range(tbl.pos$y)  # [1] -3.036395  1.003921

     x <- tbl.pos$x
     x <- x - min(x)  #
     x <- x/max(x)
     x <- (x * xSpan) - (xSpan/2)
     x <- x + xOrigin
   
     y <- tbl.pos$y
     y <- y - min(y)  #
     y <- y/max(y)
     y <- (y * ySpan) - (ySpan/2)
     y <- y + yOrigin

     tbl.pos$x <- x
     tbl.pos$y <- y
     tbl.pos$id <- rownames(tbl.pos)
     tbl.pos
     })

#----------------------------------------------------------------------------------------------------
setMethod("getChromosomeScreenCoordinates", "NetworkMaker",

  function(obj, xOrigin=1000, yOrigin=0, yMax=2000, chromDelta=200){

      tbl <- getChromosomalInfo(obj)
      chroms <- sort(unique(tbl$chrom))

      for(chrom in chroms){
         chrom.indices <- which(tbl$chrom == chrom)
         if(length(chrom.indices) > 0){
            tbl.sub <- tbl[chrom.indices,]
            screen.Y <- chromosomeLocToCanvas(tbl.sub, yOrigin, yMax)
            tbl[chrom.indices, "screen.y"] <- screen.Y
            tbl[chrom.indices, "screen.x"] <- .calculate.screen.X(chrom, xOrigin=xOrigin, delta=chromDelta)
            } # if any genes on this chromosome
         } # for chrom
      
      result <- tbl[, c("name", "screen.x", "screen.y")]
      colnames(result) <- c("id", "x", "y")
      return(result)
      }) 

#----------------------------------------------------------------------------------------------------
setMethod("buildChromosomalTable", "NetworkMaker",
   function(obj, genes) {
      db <- org.Hs.eg.db
      suppressWarnings(
          tbl <- select(db, columns=c("SYMBOL", "MAP", "CHRLOC"), keytype="SYMBOL", keys=genes)
          )
   
          # some genes (e.g., ABL1 have multiple annotations.  we ignore them here, keeping only the first)
      dups <- which(duplicated(tbl$SYMBOL))
      if(length(dups) > 0)
         tbl <- tbl[-dups,]
      stopifnot(nrow(tbl) == length(genes))
      
      tbl$arm <- .extractChromArmFromCytoband(tbl$MAP)
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
        # tbl.seqInfo <- as.data.frame(seqinfo(TxDb.Hsapiens.UCSC.hg19.knownGene))
        # loc <- tbl.seqInfo[paste("chr", chrom, sep=""), "seqlengths"]
   
      require(TxDb.Hsapiens.UCSC.hg19.knownGene)
      loc.list <- seqlengths(seqinfo(TxDb.Hsapiens.UCSC.hg19.knownGene))[paste("chr", c(1:22, "X", "Y"), sep="")]
      loc <- as.integer(loc.list)
      arm <- rep("q", length(chrom))
      type <- rep("telomere.end", length(chrom))
      tbl.end <- data.frame(name=names, map=map, loc=loc, chrom=chrom, arm=arm, type=type, stringsAsFactors=FALSE)
   
         # --- specify data for 48 little "arm mini-nodes" at the centromere of each chromosome, chr[1:22,X,Y].[pq]
      
      require(GWASTools)
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
   
      #sample.indices <- c(head(grep("gene", tbl$type), n=2),
      #                    head(grep("arm", tbl$type), n=2),
      #                    head(grep("telomere.start", tbl$type), n=2),
      #                    head(grep("telomere.end", tbl$type), n=2))
      #print(tbl[sample.indices,])
   
      obj@state[["chromosomalCoordinates"]] <- tbl
      
      tbl
     })   # buildChromosomalTable

#----------------------------------------------------------------------------------------------------
setMethod("getChromosomalInfo", "NetworkMaker",

  function (obj) {
      stopifnot("chromosomalCoordinates" %in% ls (obj@state))
      obj@state[["chromosomalCoordinates"]]
  })

#----------------------------------------------------------------------------------------------------
.extractChromArmFromCytoband <- function(bands)
{
   arm.p <- grep("p", bands)
   arm.q <- grep("q", bands)
   arm.na <- which(is.na(bands))
   arm.cen <- grep("cen", bands)
   browser()
   stopifnot(sum(length(arm.p), length(arm.q),  length(arm.na), length(arm.cen)) >= length(bands))

   result <- vector("character", length(bands))
   result[arm.p] <- "p"
   result[arm.q] <- "q"
   result[arm.cen] <- "cen"
   result[arm.na] <- NA

   names(result) <- bands
   result
   
} # .extractChromArmFromCytoband
#----------------------------------------------------------------------------------------------------
chromosomeLocToCanvas <- function(tbl, yOrigin, yMax)
{
   stopifnot(length(unique(tbl$chrom)) == 1)   # just one chromosome at a time

   loc.half.span <- 249250621/2    # a bit more than the length of chrom 1, the longest

   scale <- loc.half.span / yMax
   
   loc.midpoints <- subset(tbl, type=="arm")$loc
   loc.mid <- sum(loc.midpoints)/2;   # map this to canvas coordinate y=0
   loc.max <- subset(tbl, type=="telomere.end")$loc
   loc.min <- subset(tbl, type=="telomere.start")$loc

   canvas.y <- function(loc){
      y <- abs(loc) - loc.mid
      y <- y /scale
      y <- y * -1
      y <- y - yOrigin
      }

   as.integer(canvas.y(tbl$loc))


} # chromosomeLocToCanvas
# #----------------------------------------------------------------------------------------------------
.calculate.screen.X <- function(chrom, xOrigin, delta)
{
   chroms <- c(1:22, "X", "Y")
   stopifnot(chrom %in% chroms)
   count <- match(chrom, chroms) - 1

   screen.x <- xOrigin + (count * delta)

   screen.x

} # .calculate.screen.X
#----------------------------------------------------------------------------------------------------
