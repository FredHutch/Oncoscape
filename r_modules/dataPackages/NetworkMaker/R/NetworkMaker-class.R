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
setGeneric('calculateSampleSimilarityMatrix',  signature='obj', function(obj, samples=NA, genes=NA, copyNumberValues=c(-2, 2))
                                                                standardGeneric('calculateSampleSimilarityMatrix'))
setGeneric('usePrecalculatedSampleSimilarityMatrix',  signature='obj', function(obj, filename)
                                                                standardGeneric('usePrecalculatedSampleSimilarityMatrix'))
setGeneric('getSimilarityMatrix',        signature='obj', function(obj) standardGeneric('getSimilarityMatrix'))
setGeneric('buildChromosomalTable',      signature='obj', function(obj, genes) standardGeneric('buildChromosomalTable'))
setGeneric('getAlteredGeneNames',        signature='obj', function(obj) standardGeneric('getAlteredGeneNames'))
setGeneric('getChromosomalInfo',         signature='obj', function(obj) standardGeneric('getChromosomalInfo'))
setGeneric('getSamplesGraph',            signature='obj', function(obj, includeUnpositionedSamples) standardGeneric('getSamplesGraph'))
setGeneric('getChromosomeGraph',         signature='obj', function(obj, genes) standardGeneric('getChromosomeGraph'))
setGeneric('getMutationGraph',           signature='obj', function(obj, genes, patients) standardGeneric('getMutationGraph'))
setGeneric('getSplicingGraph',           signature='obj', function(obj, genes) standardGeneric('getSplicingGraph'))
setGeneric('getCopyNumberGraph',         signature='obj', function(obj, genes, patients, included.scores=c(-2, 2)) standardGeneric('getCopyNumberGraph'))
setGeneric('getSimilarityScreenCoordinates', signature='obj', function(obj, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)
                                                                standardGeneric('getSimilarityScreenCoordinates'))
setGeneric('getChromosomeScreenCoordinates',  signature='obj', function(obj, xOrigin=1000, yOrigin=0, yMax=2000,
                                                                        chromDelta=200, spaceAroundCentromere=100)
                                                               standardGeneric('getChromosomeScreenCoordinates'))
#----------------------------------------------------------------------------------------------------
# constructor
NetworkMaker <- function(dataPackage, samples=NA, genes=NA, verbose=FALSE)
{
  stopifnot("mtx.mut" %in% names(matrices(dataPackage)))
  stopifnot("mtx.cn"  %in% names(matrices(dataPackage)))
  mtx.mut <- matrices(dataPackage)[["mtx.mut"]]
  mtx.cn <- matrices(dataPackage)[["mtx.cn"]]
#  mtx.splice <- matrices(dataPackage)[["mtx.splice"]]
  all.known.samples <- .allKnownSampleIDsCanonicalized(dataPackage)

  if(!all(is.na(samples))){
      recognized.samples <- intersect(samples, all.known.samples)
      if(verbose)
          warning(sprintf("%d of %d samples found in both mut and cn matrices",
                          length(recognized.samples), length(samples)))
      
         # allow for incoming samples like "TCGA.FG.A6J3" and matrices with rownames "TCGA.FG.A6J3.01"
      mut.sample.indices <- as.integer(lapply(recognized.samples, function(s) grep(s, rownames(mtx.mut))))
      mut.sample.indices <- mut.sample.indices[which(!is.na(mut.sample.indices))]
      stopifnot(length(mut.sample.indices) >= 2)   # a bare minimum
      mtx.mut <- mtx.mut[mut.sample.indices,]

      cn.sample.indices <- as.integer(lapply(recognized.samples, function(s) grep(s, rownames(mtx.cn))))
      cn.sample.indices <- cn.sample.indices[which(!is.na(cn.sample.indices))]
      stopifnot(length(cn.sample.indices) >= 2)   # a bare minimum
      mtx.cn <- mtx.cn[cn.sample.indices,]
      } # samples specfied in constructor call

  if(!all(is.na(genes))){
      recognized.genes <- intersect(genes, intersect(colnames(mtx.mut), colnames(mtx.cn)))
      if(verbose)
          warning(sprintf("%d of %d genes found in both mut and cn matrices",
                          length(recognized.genes), length(genes)))
      stopifnot(length(recognized.genes) >= 5)   # arbitrary but not unreasonable threshold
      mtx.mut <- mtx.mut[,recognized.genes]
      mtx.cn  <- mtx.cn[,recognized.genes]
      } # genes specfied in constructor call

  #browser()
  obj <- .NetworkMaker(pkg=dataPackage, mtx.mut=mtx.mut, mtx.cn=mtx.cn, state=new.env(parent=emptyenv()))

  obj

} # NetworkMaker constructor
#----------------------------------------------------------------------------------------------------
.allKnownSampleIDsCanonicalized <- function(pkg)
{
   all.ids <- c(rownames(matrices(pkg)$mtx.mut),
                rownames(matrices(pkg)$mtx.cn),
                rownames(getPatientTable(pkg)))

   canonicalizePatientIDs(pkg, sort(unique(all.ids)))

} # .allKnownSampleIDsCanonicalized
#----------------------------------------------------------------------------------------------------
setMethod("usePrecalculatedSampleSimilarityMatrix", "NetworkMaker",

    function(obj, filename){
       stopifnot(file.exists(filename))
       tbl.pos <- read.table(filename, comment.char="#", sep="\t", as.is=TRUE)
           # discovering (questionably?) that mdscale in two dimensions lost
           # information found in three, i have instituted an ad hoc policy
           # in which a 3rd dimension "z" is used to weight (factor 0.2) the y coordinate.
           # if there is no z column add it in.
       if(ncol(tbl.pos) == 2)
          tbl.pos$z <- rep(0.0, nrow(tbl.pos))
       obj@state[["similarityMatrix"]] <- tbl.pos
       })

#----------------------------------------------------------------------------------------------------
# samples and genes args are only for testing; in normal operation the full lists from
setMethod("calculateSampleSimilarityMatrix", "NetworkMaker",

  function (obj, samples=NA, genes=NA, copyNumberValues=c(-2, 2)) {

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

     mut.01 <- .mutationMatrixTo01Matrix(mut)

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

    cn[!cn %in% copyNumberValues] <- 0

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
     obj@state[["similarityMatrix"]] <- tbl.pos
     })

#----------------------------------------------------------------------------------------------------
setMethod("getSimilarityMatrix", "NetworkMaker",

   function(obj){
      stopifnot("similarityMatrix" %in% ls(obj@state));
      return (obj@state[["similarityMatrix"]])
      })
                    
#----------------------------------------------------------------------------------------------------
setMethod("getSamplesGraph", "NetworkMaker",

  function(obj, includeUnpositionedSamples=TRUE){

    stopifnot("similarityMatrix" %in% ls(obj@state))
    tbl.pos <- obj@state[["similarityMatrix"]]

      # in an ideal study, we would receive, or be able to calculate, a similarity matrix
      # for all samples.  since that is often not the case, we trawl here all
      # samples, designate them as unpositioned, so that client code
      # (for instance TCGAbrain/inst/utils/constructMarkersNetwork.R) can identify them
      # and position them as the map maker sees fit.

    positioned.samples <- rownames(tbl.pos)
    positioned.patients <- canonicalizePatientIDs(obj@pkg,positioned.samples)

    cn.patients<- canonicalizePatientIDs(obj@pkg, rownames(obj@mtx.cn))
    mut.patients <- canonicalizePatientIDs(obj@pkg, rownames(obj@mtx.mut))
#   splice.patients <- canonicalizePatientIDs(obj@pkg, rownames(obj@mtx.splice))
    patient.ids <- rownames(getPatientTable(obj@pkg))

	all.nodes <- positioned.patients
	if(includeUnpositionedSamples){
		unpositioned.cn.patients     <- setdiff(cn.patients, positioned.patients)
		unpositioned.mut.patients    <- setdiff(mut.patients, positioned.patients)
	#   unpositioned.splice.patients <- setdiff(splice.patients, positioned.patients)
		unpositioned.pt.patients     <- setdiff(patient.ids, positioned.patients)
	
		unpositioned.patients <- unique(c(unpositioned.cn.patients, unpositioned.mut.patients,
	#                                     unpositioned.splice.patients,unpositioned.pt.patients))
										 unpositioned.pt.patients))
                                     
    	all.nodes <- c(positioned.patients, unpositioned.patients)
    }

    g <- graphNEL(nodes=all.nodes, edgemode="directed")
     # change nodeType to "sample" later, updating all networks at once, and the markers/Test.js
    nodeDataDefaults(g, attr="nodeType") <- "patient"   
    nodeDataDefaults(g, attr="subType") <- "unassigned"
    nodeDataDefaults(g, attr="id") <- "unassigned"
    nodeDataDefaults(g, attr="x") <- 0
    nodeDataDefaults(g, attr="y") <- 0
    nodeDataDefaults(g, attr="positioned") <- FALSE

    edgeDataDefaults(g, attr="edgeType") <- "unassigned"
    edgeDataDefaults(g, attr="subType") <- "unassigned"

    nodeData(g, all.nodes, "id") <- all.nodes
    nodeData(g, positioned.patients, "x") <- tbl.pos$x
    nodeData(g, positioned.patients, "y") <- tbl.pos$y
    nodeData(g, positioned.patients, "positioned") <- TRUE
    return(g)
    })

#----------------------------------------------------------------------------------------------------
setMethod("getChromosomeGraph", "NetworkMaker",

  function(obj, genes){

    tbl.info <- buildChromosomalTable(obj, genes)

    all.nodes <- tbl.info$name
    centromere.nodes <- subset(tbl.info, type=="arm")$name

         # experiment: just one centromere per chromosome, rather than
         # two "half-centromeres" one for each arm
    centromere.nodes <- sub("p", "", centromere.nodes)
    centromere.nodes <- sub("q", "", centromere.nodes)
    centromere.nodes <- unique(centromere.nodes)
    
    telomere.nodes <- tbl.info$name[grep("telomere", tbl.info$type)]
    gene.nodes <- subset(tbl.info, type=="gene")$name
    
    all.nodes <- c(centromere.nodes, telomere.nodes, gene.nodes)
    g <- graphNEL(nodes=all.nodes, edgemode="directed")
    nodeDataDefaults(g, attr="nodeType") <- "unassigned"
    nodeDataDefaults(g, attr="landmark")  <- FALSE
    nodeDataDefaults(g, attr="id") <- "unassigned"
         # "true" dimenions are used to restore from current dimensions after
         # resizing with zooming
    nodeDataDefaults(g, attr="trueWidth") <- 0
    nodeDataDefaults(g, attr="trueHeight") <- 0
    nodeDataDefaults(g, attr="positioned") <- TRUE
    
    edgeDataDefaults(g, attr="edgeType") <- "unassigned"
    edgeDataDefaults(g, attr="subType") <- "unassigned"

    nodeData(g, all.nodes, "id") <- all.nodes

    nodeData(g, centromere.nodes, "nodeType") <- "centromere"
    nodeData(g, centromere.nodes, "landmark") <- TRUE
    nodeData(g, telomere.nodes,   "nodeType") <- "telomere"
    nodeData(g, telomere.nodes,   "landmark") <- TRUE
    nodeData(g, gene.nodes,       "nodeType") <- "gene"

    chroms.in.order <- c(1:22, "X", "Y")
    p.arm.nodes <- paste(chroms.in.order, "p", sep="")
    q.arm.nodes <- paste(chroms.in.order, "q", sep="")

    p.telomeres <- paste("start.", chroms.in.order, sep="")
    q.telomeres <- paste("end.", chroms.in.order, sep="")

    g <- addEdge(centromere.nodes, p.telomeres, g)
    g <- addEdge(centromere.nodes, q.telomeres, g)
    edgeData(g, centromere.nodes, p.telomeres, "edgeType") <- "chromosome"
    edgeData(g, centromere.nodes, q.telomeres, "edgeType") <- "chromosome"

    return(g)
    })

#----------------------------------------------------------------------------------------------------
setMethod("getMutationGraph", "NetworkMaker",

  function(obj, genes=NA, patients=NA){

    mut <- obj@mtx.mut
    samples <- rownames(mut)
    if(!is.na(patients)){ samples <- samples[match(patients, canonicalizePatientIDs(obj@pkg, samples))]; samples <- samples[!is.na(samples)] }
    stopifnot(samples > 0)

    if(is.na(genes)) genes <- colnames(mut)
    goi <- intersect(genes, colnames(mut))
    stopifnot(goi > 0)
    mut <- mut[samples, goi]

       # standardize the matrix to zeroes and ones, providing painless search
       # for non-null (not missing) values
    mut.01 <- .mutationMatrixTo01Matrix(mut)
    indices <- which(mut.01 == 1)
    
    rows <- 1 + (indices - 1) %% nrow(mut.01)
    cols <- 1 + (indices -1) %/% nrow(mut.01)
       # with row/column sample/gene pairs, now retrieve the mutations themselves
    vals = unlist(lapply(1:length(indices), function(i) mut[rows[i], cols[i]]))

    tbl <- data.frame(sample=rownames(mut)[rows],
                      gene=colnames(mut)[cols],
                      val=vals, stringsAsFactors=FALSE)

    sample.nodes <- canonicalizePatientIDs(obj@pkg, tbl$sample)
    gene.nodes <- tbl$gene
    all.nodes <- unique(c(sample.nodes, gene.nodes))
    
    g <- graphNEL(nodes=all.nodes, edgemode="directed")
    nodeDataDefaults(g, attr="id") <- "unassigned"
    edgeDataDefaults(g, attr="edgeType") <- "unassigned"
    edgeDataDefaults(g, attr="subType") <- "unassigned"

    nodeData(g, all.nodes, "id") <- all.nodes
    g <- addEdge(sample.nodes, gene.nodes, g)
    edgeData(g, sample.nodes, gene.nodes, "edgeType") <- "mutation"
    edgeData(g, sample.nodes, gene.nodes, "subType") <- tbl$val

    return(g)
    })

#----------------------------------------------------------------------------------------------------
setMethod("getCopyNumberGraph", "NetworkMaker",

  function(obj, genes=NA, patients=NA, included.scores=c(-2, 2)){

    cn <- obj@mtx.cn
    samples <- rownames(cn)
    if(!is.na(patients)){ samples <- samples[match(patients, canonicalizePatientIDs(obj@pkg, samples))]; samples <- samples[!is.na(samples)] }
    stopifnot(samples > 0)

    if(is.na(genes)) genes <- colnames(cn)
    goi <- intersect(genes, colnames(cn))
    stopifnot(goi > 0)
    cn <- cn[samples, goi]

        # create an edge table for the copy number (gistic) scores explicitly
        # included by method argument
    
    indices <- which(cn %in% included.scores)
    rows <- 1 + (indices - 1) %% nrow(cn)
    cols <- 1 + (indices -1) %/% nrow(cn)

       # with row/column sample/gene pairs, now retrieve the mutations themselves
    vals = unlist(lapply(1:length(indices), function(i) cn[rows[i], cols[i]]))
    tbl <- data.frame(sample=rownames(cn)[rows],
                      gene=colnames(cn)[cols],
                      val=vals, stringsAsFactors=FALSE)

    sample.nodes <- canonicalizePatientIDs(obj@pkg, tbl$sample)
    gene.nodes <- tbl$gene
    all.nodes <- unique(c(sample.nodes, gene.nodes))
    
    g <- graphNEL(nodes=all.nodes, edgemode="directed")
    nodeDataDefaults(g, attr="id") <- "unassigned"
    nodeDataDefaults(g, attr="nodeType")  <- "unassigned"
    
    edgeDataDefaults(g, attr="edgeType") <- "unassigned"
    edgeDataDefaults(g, attr="subType") <- "unassigned"

    nodeData(g, all.nodes, "id") <- all.nodes

    g <- addEdge(sample.nodes, gene.nodes, g)
    edgeData(g, sample.nodes, gene.nodes, "edgeType") <- ""

    cnLoss.1 <- which(tbl$val == -1)
    cnLoss.2 <- which(tbl$val == -2)
    cnGain.1 <- which(tbl$val == 1)
    cnGain.2 <- which(tbl$val == 2)
  
    samples.corrected <- canonicalizePatientIDs(obj@pkg, tbl$sample[cnLoss.1])
    edgeData(g, samples.corrected, tbl$gene[cnLoss.1], "edgeType") <- "cnLoss.1"
                                                
    samples.corrected <- canonicalizePatientIDs(obj@pkg, tbl$sample[cnLoss.2])
    edgeData(g, samples.corrected, tbl$gene[cnLoss.2], "edgeType") <- "cnLoss.2"

    samples.corrected <- canonicalizePatientIDs(obj@pkg, tbl$sample[cnGain.1])
    edgeData(g, samples.corrected, tbl$gene[cnGain.1], "edgeType") <- "cnGain.1"

    samples.corrected <- canonicalizePatientIDs(obj@pkg, tbl$sample[cnGain.2])
    edgeData(g, samples.corrected, tbl$gene[cnGain.2], "edgeType") <- "cnGain.2"

    return(g)

    })

#----------------------------------------------------------------------------------------------------
setMethod("getSimilarityScreenCoordinates", "NetworkMaker",

  function(obj, xOrigin, yOrigin, xMax, yMax){ # xSpan, ySpan){

     xSpan <- xMax - xOrigin
     ySpan <- yMax - yOrigin

     tbl.pos <- getSimilarityMatrix(obj)
     #browser()
     x.range <- range(tbl.pos$x)  # [1] -0.6168073  2.8896624
     y.range <- range(tbl.pos$y)  # [1] -3.036395  1.003921

     x <- tbl.pos$x
     x <- x - min(x)  #
     x <- x/max(x)
     x <- (x * xSpan) - (xSpan/2)
     x <- x + xOrigin
   
     y <- tbl.pos$y
     y <- y - min(y) 
     y <- y/max(y)
     y <- (y * ySpan) - (ySpan/2)
     y <- y + yOrigin

     tbl.pos$x <- x
     tbl.pos$y <- -y   # screen coordinates have origin at top left corner.  "normal" is lower left
     tbl.pos$id <- canonicalizePatientIDs(obj@pkg, rownames(tbl.pos))
     tbl.pos
     })

#----------------------------------------------------------------------------------------------------
setMethod("getChromosomeScreenCoordinates", "NetworkMaker",

  function(obj, xOrigin=1000, yOrigin=0, yMax=2000, chromDelta=200, spaceAroundCentromere=100){

      tbl <- getChromosomalInfo(obj)
         # collapse centromere pairs (one pair for each arm on each chromsome) into a single
         # centromere per chromosome, centered at the midpoint between the two
         # members of the pair

      chroms <- sort(unique(tbl$chrom))

      for(chrom in chroms){ # "1", "2", ... "X", "Y"
         regex <- sprintf("^chr%s[pq]$", chrom);
         indices <- grep(regex, tbl$name)
         stopifnot(length(indices) == 2)
         centromere.center <- sum(tbl[indices, "loc"])/2
         chrom.name <- sprintf("chr%s", chrom)
         new.row <- list(name=chrom.name, map=chrom, loc=centromere.center, chrom=chrom, arm=NA,
                         type="centromere", screen.x=0, screen.y=0)
         tbl <- tbl[-(indices),]
         tbl <- rbind(tbl, as.data.frame(new.row, stringsAsFactors=FALSE))
         } # for chrom
      
      for(chrom in chroms){
         chrom.indices <- which(tbl$chrom == chrom)
         if(length(chrom.indices) > 0){
            tbl.sub <- tbl[chrom.indices,]
            screen.Y <- chromosomeLocToCanvas(tbl.sub, yOrigin, yMax, spaceAroundCentromere)
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
setMethod("getAlteredGeneNames", "NetworkMaker",
   function(obj){
   mut    <- obj@mtx.mut
   cn    <- obj@mtx.cn
#   splice <- obj@mtx.splice
   
   
   genes.mut <- apply(mut, 2, function(gene){ any(gene != "")})
   genes.cn <- apply(cn, 2, function(gene){ any(gene != "")})
#   genes.splice <- apply(splice, 2, function(gene){ any(gene != "")})
   
#   unique(c(colnames(splice)[genes.splice], colnames(mut)[genes.mut],colnames(cn)[genes.cn]))
   unique( c(colnames(mut)[genes.mut],colnames(cn)[genes.cn]))
   })
    
#----------------------------------------------------------------------------------------------------
.extractChromArmFromCytoband <- function(bands)
{
   arm.p <- grep("p", bands)
   arm.q <- grep("q", bands)
   arm.na <- which(is.na(bands))
   arm.cen <- grep("cen", bands)
   #browser()
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
chromosomeLocToCanvas <- function(tbl, yOrigin, yMax, spaceAroundCentromere=100)
{
   stopifnot(length(unique(tbl$chrom)) == 1)   # just one chromosome at a time

   loc.half.span <- 249250621/2    # a bit more than the length of chrom 1, the longest

   scale <- loc.half.span / yMax
   
   # loc.midpoints <- subset(tbl, type=="arm")$loc
   loc.mid <- subset(tbl, type=="centromere")$loc    # map this to canvas coordinate y=0
   loc.max <- subset(tbl, type=="telomere.end")$loc
   loc.min <- subset(tbl, type=="telomere.start")$loc

   canvas.y <- function(loc){
      y <- abs(loc) - loc.mid
      y <- y /scale
      y <- y * -1
      y <- y - yOrigin
         # move all genes and telomeres a fixed amount away from the centromere, for less crowded
         # and more readable display
      if(y != 0){
         delta <- sign(y) * spaceAroundCentromere
         y <- y + delta;
         } # if not a centromere
      y
      } # canvas.y function

   as.integer(lapply(tbl$loc, canvas.y))


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
.mutationMatrixTo01Matrix <- function(mtx.mut)
{
     if(any(mtx.mut == "", na.rm=TRUE) && any(is.na(mtx.mut)))
        mtx.mut[mtx.mut==""] <- NA
     
     if(length(which(mtx.mut == "NA")) > 0){
         mtx.mut.01 <- (mtx.mut != "NA") + 0   # coerce to integers by adding zero
     } else if (length(which(is.na(mtx.mut))) > 0){
         mtx.mut.01 <- (!is.na(mtx.mut)) + 0
     } else if (length(which(mtx.mut == "")) > 0){
         mtx.mut.01 <- (mtx.mut != "") + 0
     } else {
         stop("unexpected mtx.mut values")
     }

    mtx.mut.01

} # .mutationMatrixTo01Matrix
#----------------------------------------------------------------------------------------------------
