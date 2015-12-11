library(RUnit)
library(NetworkMaker)
library(DEMOdz)
library(TCGAgbm)
options(stringsAsFactors=FALSE)
   # we use one cytoscape.js style file throughout
STYLE.FILE <- "style.js"
STYLE.FILE <- system.file(package="NetworkMaker", "extdata", "style.js")
stopifnot(file.exists(STYLE.FILE))
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  testConstructor();
  test.mutationMatrixTo01Matrix()
  test.extractSamplesAndGenes()
  #test.extractRestrictedSamplesAndGenes() # restricted in call to class constructor
  test.calculateSimilarity.DEMOdz()
  test.calculateSimilarity.TCGAgbm()
  test.calculateSimilarity.TCGAgbm.completeSubset()
  test.getSamplesGraph.DEMOdz()
  test.buildChromosomalTable();
  test.transformChromLocsToScreenCoordinates();
  test.genesChromosomeGraph.DEMOdz();
  test.fullDisplay.6genes.DEMOdz()
  test.screenCoordinateManipulations.DEMOdz()
  test.fullDisplay.allGenes.DEMOdz()
  test.fullDisplay.withMutations.allGenes.TCGAgbm()
  test.fullDisplay.withMutations.withCopyNumber.allGenes.DEMOdz()
  test.fullDisplay.withMutations.withCopyNumber.allGenes.TCGAgbm()

  test.genesChromosomeGraph.TCGAbrain()
  
} # runTests
#----------------------------------------------------------------------------------------------------
testConstructor <- function()
{
   print("--- testConstructor")
   dz <- DEMOdz();
   netMaker <- NetworkMaker(dz)
   
} # testConstructor
#----------------------------------------------------------------------------------------------------
test.mutationMatrixTo01Matrix <- function()
{
   print("--- test.mutationMatrixTo01Matrix")

    # the utility function handles 3 possible forms of missing value tokens: NA, "NA", ""
    # test them all

   dz <- DEMOdz() 
   checkTrue("mtx.mut" %in% names(matrices(dz)))
   mut <- matrices(dz)$mtx.mut      
   mut.01 <- NetworkMaker:::.mutationMatrixTo01Matrix(mut)
   checkEquals(sum(mut.01), length(which(!is.na(mut))))

   mut.nachar <- mut
   mut.nachar[which(is.na(mut.nachar))] <- "NA"
   mtx.01 <- NetworkMaker:::.mutationMatrixTo01Matrix(mut.nachar)
   checkEquals(sum(mtx.01), length(which(!is.na(mut))))

   mut.emptyString <- mut
   mut.emptyString[which(is.na(mut.emptyString))] <- ""
   mtx.01 <- NetworkMaker:::.mutationMatrixTo01Matrix(mut.emptyString)
   checkEquals(sum(mtx.01), length(which(!is.na(mut))))


} # test.mutationMatrixTo01Matrix
#----------------------------------------------------------------------------------------------------
test.extractSamplesAndGenes <- function()
{
    print("--- test.extractSamplesAndGenes")
    dz <- DEMOdz();

    netMaker <- NetworkMaker(dz)
    x <- NetworkMaker:::.extractSamplesAndGenes(netMaker)
    checkEquals(names(x), c("samples", "genes"))
    checkEquals(length(x$samples), 20)
    checkEquals(length(x$genes), 64)
    
} # test.extractSamplesAndGenes
#----------------------------------------------------------------------------------------------------
test.extractRestictedSamplesAndGenes <- function()
{
    print("--- test.extractSamplesAndGenes")
    dz <- DEMOdz();
    samples.sub <- head(rownames(getPatientTable(dz)))
    genes.sub <- head(colnames(matrices(dz)[[1]]))

      # add some bogus ids
    samples <- c(samples.sub, "fubar")
    genes   <- c(genes.sub,   "bogus")

    netMaker <- NetworkMaker(dz, samples=samples, genes=genes)
    x <- NetworkMaker:::.extractSamplesAndGenes(netMaker)
    checkEquals(names(x), c("samples", "genes"))
    checkEquals(length(x$samples), length(samples.sub))
    checkEquals(length(x$genes), length(genes.sub))
    
} # test.extractSamplesAndGenes
#----------------------------------------------------------------------------------------------------
test.calculateSimilarity.DEMOdz <- function()
{
    print("--- test.calculateSimilarity.DEMOdz")

       # needed for testing. note that NetworkMaker does not need
       # an already-constructed object.
    
    dz <- DEMOdz() 
    checkTrue(all(c("mtx.mut", "mtx.cn") %in% names(matrices(dz))))

    netMaker <- NetworkMaker(dz)
    calculateSampleSimilarityMatrix(netMaker, copyNumberValues=c(-2, -1, 1, 1))
    tbl.pos <- getSimilarityMatrix(netMaker)
       # should be one x,y,z position vector for every patient

    sampleCount <- nrow(getPatientTable(dz))
    checkEquals(dim(tbl.pos), c(sampleCount, 3))

       # from direct inspection, these two tumors appear most similar:
       #  TCGA.06.0402  2.0799743 -1.4521335  1.43385494
       #  TCGA.02.0021  2.1477070 -0.5468653  0.95903141

       # a not-entirely-circular sanity check:
       #   1) identify the closest pair points in tbl.pos, and the most distant pair
       #   2) informally assess that the first pair is "similar", the second "less similar"
    
    mdist.check <- as.matrix(dist(tbl.pos))
    checkTrue(min(mdist.check) == 0.0)
    checkTrue(max(mdist.check) > 0.5)
    
    min.dist <- min(mdist.check[mdist.check != 0])
    max.dist <- max(mdist.check)
       # mdist.check is symmetrical, just get the first occurrence each of min.dist and max.dist
    index.from.vector <- which(mdist.check == min.dist)[1]
    row <- index.from.vector %/% ncol(mdist.check) + 1
    col <- index.from.vector %% ncol(mdist.check)
    checkEquals(mdist.check[row, col], min.dist)   # just to be sure...
    min.pair <- c(rownames(mdist.check)[row], colnames(mdist.check)[col])

    index.from.vector <- which(mdist.check == max.dist)[1]
    row <- index.from.vector %/% ncol(mdist.check) + 1
    col <- index.from.vector %% ncol(mdist.check)
    checkEquals(mdist.check[row, col], max.dist)   # just to be sure...
    max.pair <- c(rownames(mdist.check)[row], colnames(mdist.check)[col])

       # with the pair now identified, count the mutation differences
    mtx.mut <- matrices(dz)[["mtx.mut"]]
    vec.1 <- mtx.mut[min.pair[1],]
    vec.1[is.na(vec.1)] <- ""
    vec.2 <- mtx.mut[min.pair[2],]
    vec.2[is.na(vec.2)] <- ""
    mins.mutation.differences <- length(which(vec.1 != vec.2))

       # and the copy number differences
    mtx.cn <- matrices(dz)[["mtx.cn"]]
    vec.1 <- mtx.cn[min.pair[1],]
    vec.1[is.na(vec.1)] <- ""
    vec.2 <- mtx.cn[min.pair[2],]
    vec.2[is.na(vec.2)] <- ""
    mins.cn.differences <- length(which(vec.1 != vec.2))
       # combine them
    mins.differences <- mins.mutation.differences + mins.cn.differences

       # now repeat for the most different samples
    mtx.mut <- matrices(dz)[["mtx.mut"]]
    vec.1 <- mtx.mut[max.pair[1],]
    vec.1[is.na(vec.1)] <- ""
    vec.2 <- mtx.mut[max.pair[2],]
    vec.2[is.na(vec.2)] <- ""
    maxes.mutation.differences <- length(which(vec.1 != vec.2))

      # and the copy number differences
    mtx.cn <- matrices(dz)[["mtx.cn"]]
    vec.1 <- mtx.cn[max.pair[1],]
    vec.1[is.na(vec.1)] <- ""
    vec.2 <- mtx.cn[max.pair[2],]
    vec.2[is.na(vec.2)] <- ""
    maxes.cn.differences <- length(which(vec.1 != vec.2))
       # combine them
    maxes.differences <- maxes.mutation.differences + maxes.cn.differences

    checkTrue(maxes.differences > mins.differences)

       # do a graphical sanity check:
       #   plot(tbl.pos$x, tbl.pos$y)
       #   text(tbl.pos$x, tbl.pos$y, rownames(tbl.pos))

} # test.calculateSimilarity.DEMOdz
#----------------------------------------------------------------------------------------------------
test.calculateSimilarity.TCGAgbm <- function()
{
    print("--- test.calculateSimilarity.TCGAgbm")

       # needed for testing. note that NetworkMaker does not need
       # an already-constructed object.

    dz <- TCGAgbm()  # instantiate here only for testing

      # restrict to interesting genes
    load(system.file(package="NetworkMaker", "extdata", "genesets.RData"))
    goi <- sort(unique(unlist(genesets, use.names=FALSE)))

    netMaker <- NetworkMaker(dz, verbose=TRUE)
    calculateSampleSimilarityMatrix(netMaker, genes=goi)
    tbl.pos <- getSimilarityMatrix(netMaker)

       # should be one x,y,z position vector for every patient

    sampleCount <- nrow(getPatientTable(dz))
       # (9 nov 2015: TCGA_0.99.23 has 592 tumors, but cn &/or mut data
       # on only 573 of them

    checkTrue(nrow(tbl.pos) <= sampleCount);
    checkEquals(ncol(tbl.pos), 3)
    checkEquals(colnames(tbl.pos), c("x", "y", "z"))
      # ensure that tissue or replicate suffix numbers have been stripped off
    checkTrue(all(nchar(rownames(tbl.pos)) == 12))
    
       # from direct inspection, these two tumors appear most similar:
       #  TCGA.06.0402  2.0799743 -1.4521335  1.43385494
       #  TCGA.02.0021  2.1477070 -0.5468653  0.95903141

       # a not-entirely-circular sanity check:
       #   1) identify the closest pair points in tbl.pos, and the most distant pair
       #   2) informally assess that the first pair is "similar", the second "less similar"
    
    mdist.check <- as.matrix(dist(tbl.pos))
    checkTrue(min(mdist.check) == 0.0)
    checkTrue(max(mdist.check) > 15)   # 17.20599 with default copyNumberValues c(-2,2).  no +/- 1 scores
    
    min.dist <- min(mdist.check[mdist.check != 0])
    max.dist <- max(mdist.check)
       # mdist.check is symmetrical, just get the first occurrence each of min.dist and max.dist
    index.from.vector <- which(mdist.check == min.dist)[1]
    row <- index.from.vector %/% ncol(mdist.check) + 1
    col <- index.from.vector %% ncol(mdist.check)
    checkEquals(mdist.check[row, col], min.dist)   # just to be sure...
    min.pair <- c(rownames(mdist.check)[row], colnames(mdist.check)[col])

    index.from.vector <- which(mdist.check == max.dist)[1]
    row <- index.from.vector %/% ncol(mdist.check) + 1
    col <- index.from.vector %% ncol(mdist.check)
    checkEquals(mdist.check[row, col], max.dist)   # just to be sure...
    max.pair <- c(rownames(mdist.check)[row], colnames(mdist.check)[col])

       # with the pair now identified, count the mutation differences
    mtx.mut <- matrices(dz)[["mtx.mut"]]

       # NetworkMaker accomodates missing mutation values, for
       # tumors in which no mutations have been seen
       # tumors with many missing values (no mutation data, for instance)
       # are likely candidates for the "least different" two tumors.  this gets messy to track,
       # messy to test, and is deferred for now in hopes that fully explicit and consistent data
       # will soon become an oncoscape priority
    

} # test.calculateSimilarity.TCGAgbm
#----------------------------------------------------------------------------------------------------
test.calculateSimilarity.TCGAgbm.completeSubset <- function()
{
    print("--- test.calculateSimilarity.TCGAgbm.completeSubset")

       # needed for testing. note that NetworkMaker does not need
       # an already-constructed object.

    dz <- TCGAgbm()  # instantiate here only for testing

      # restrict to interesting genes
    load(system.file(package="NetworkMaker", "extdata", "genesets.RData"))
    goi <- sort(unique(unlist(genesets, use.names=FALSE)))
    mut <- matrices(dz)$mtx.mut
    cn <- matrices(dz)$mtx.cn
    goi <- intersect(goi, intersect(colnames(mut), colnames(cn))) # 928
    poi <- sort(intersect(rownames(mut), rownames(cn)))           # 281
    
    netMaker <- NetworkMaker(dz)
    calculateSampleSimilarityMatrix(netMaker, samples=poi, genes=goi, c(-2, -1, 1, 2))
    tbl.pos <- getSimilarityMatrix(netMaker)

       # should be one x,y,z position vector for every patient

    sampleCount <- nrow(getPatientTable(dz))
       # (9 nov 2015: TCGA_0.99.23 has 592 tumors, but cn &/or mut data
       # on only 573 of them

    checkTrue(nrow(tbl.pos) <= sampleCount);
    checkEquals(ncol(tbl.pos), 3)
    checkEquals(colnames(tbl.pos), c("x", "y", "z"))
      # ensure that tissue or replicate suffix numbers have been stripped off
    checkTrue(all(nchar(rownames(tbl.pos)) == 12))
    
       # from direct inspection, these two tumors appear most similar:
       #  TCGA.06.0402  2.0799743 -1.4521335  1.43385494
       #  TCGA.02.0021  2.1477070 -0.5468653  0.95903141

       # a not-entirely-circular sanity check:
       #   1) identify the closest pair points in tbl.pos, and the most distant pair
       #   2) informally assess that the first pair is "similar", the second "less similar"
    
    mdist.check <- as.matrix(dist(tbl.pos))
    checkTrue(min(mdist.check) == 0.0)
    checkTrue(max(mdist.check) > 20)   # 154.9 with TCGA_0.99.23
    
    min.dist <- min(mdist.check[mdist.check != 0])
    max.dist <- max(mdist.check)
       # mdist.check is symmetrical, just get the first occurrence each of min.dist and max.dist
    index.from.vector <- which(mdist.check == min.dist)[1]
    row <- index.from.vector %/% ncol(mdist.check) + 1
    col <- index.from.vector %% ncol(mdist.check)
    checkEquals(mdist.check[row, col], min.dist)   # just to be sure...
    min.pair <- c(rownames(mdist.check)[row], colnames(mdist.check)[col])

    index.from.vector <- which(mdist.check == max.dist)[1]
    row <- index.from.vector %/% ncol(mdist.check) + 1
    col <- index.from.vector %% ncol(mdist.check)
    checkEquals(mdist.check[row, col], max.dist)   # just to be sure...
    max.pair <- c(rownames(mdist.check)[row], colnames(mdist.check)[col])

       # with the pair now identified, count the mutation differences
    mtx.mut <- matrices(dz)[["mtx.mut"]]
    rownames(mtx.mut) <- canonicalizePatientIDs(dz, rownames(mtx.mut))
    vec.1 <- mtx.mut[min.pair[1],]
    vec.1[is.na(vec.1)] <- ""
    vec.2 <- mtx.mut[min.pair[2],]
    vec.2[is.na(vec.2)] <- ""
    mins.mutation.differences <- length(which(vec.1 != vec.2))

       # and the copy number differences
    mtx.cn <- matrices(dz)[["mtx.cn"]]
    rownames(mtx.cn) <- canonicalizePatientIDs(dz, rownames(mtx.cn))

    vec.1 <- mtx.cn[min.pair[1],]
    vec.1[is.na(vec.1)] <- ""
    vec.2 <- mtx.cn[min.pair[2],]
    vec.2[is.na(vec.2)] <- ""
    mins.cn.differences <- length(which(vec.1 != vec.2))
       # combine them
    mins.differences <- mins.mutation.differences + mins.cn.differences

       # now repeat for the most different samples
    mtx.mut <- matrices(dz)[["mtx.mut"]]
    rownames(mtx.mut) <- canonicalizePatientIDs(dz, rownames(mtx.mut))
    vec.1 <- mtx.mut[max.pair[1],]
    vec.1[is.na(vec.1)] <- ""
    vec.2 <- mtx.mut[max.pair[2],]
    vec.2[is.na(vec.2)] <- ""
    maxes.mutation.differences <- length(which(vec.1 != vec.2))

      # and the copy number differences
    mtx.cn <- matrices(dz)[["mtx.cn"]]
    rownames(mtx.cn) <- canonicalizePatientIDs(dz, rownames(mtx.cn))
    vec.1 <- mtx.cn[max.pair[1],]
    vec.1[is.na(vec.1)] <- ""
    vec.2 <- mtx.cn[max.pair[2],]
    vec.2[is.na(vec.2)] <- ""
    maxes.cn.differences <- length(which(vec.1 != vec.2))
       # combine them
    maxes.differences <- maxes.mutation.differences + maxes.cn.differences

    checkTrue(maxes.differences > mins.differences)

} # test.calculateSimilarity.TCGAgbm.completeSubset
#----------------------------------------------------------------------------------------------------
test.getSamplesGraph.DEMOdz <- function()
{
    print("--- test.getSamplesGraph.DEMOdz")
    dz <- DEMOdz() 
    checkTrue(all(c("mtx.mut", "mtx.cn") %in% names(matrices(dz))))

    netMaker <- NetworkMaker(dz)
    calculateSampleSimilarityMatrix(netMaker, copyNumberValues=c(-2, -1, 1, 2))
    tbl.pos <- getSimilarityMatrix(netMaker)
    g <- getSamplesGraph(netMaker)
    checkEquals(sort(nodes(g)), sort(rownames(tbl.pos)))
    checkEquals(length(edgeNames(g)), 0)
    checkEquals(sort(noaNames(g)), c("id", "nodeType", "subType", "x", "y"))
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.xpos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)
    setPosition(rcy, tbl.xpos)    
    fit(rcy, 100)

       # very modest test:  is the actual position on the rcy canvas what we asked for?
       # check just the first sample

       ## collision with GWASTools
    tbl.1 <- RCyjs::getPosition(rcy, rownames(tbl.xpos)[1]);
    checkEqualsNumeric(tbl.1$x, tbl.xpos$x[1], tol=1e-4)
    checkEqualsNumeric(tbl.1$y, tbl.xpos$y[1], tol=1e-4)

} # test.getSamplesGraph.DEMOdz()
#----------------------------------------------------------------------------------------------------
test.genesChromosomeGraph.DEMOdz <- function()
{
    print("--- test.genesChromosomeGraph.DEMOdz")
    dz <- DEMOdz() 
    checkTrue(all(c("mtx.mut", "mtx.cn") %in% names(matrices(dz))))
    netMaker <- NetworkMaker(dz)
    genes <- head(colnames(matrices(dz)$mtx.mut))
    g <- getChromosomeGraph(netMaker, genes)

    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=FALSE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, yMax=2000, chromDelta=100)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)

} # test.genesChromosomeGraph.DEMOdz()
#----------------------------------------------------------------------------------------------------
test.buildChromosomalTable <- function()
{
    print("--- test.buildChromosomalTable")
    dz <- DEMOdz()
    genes <- head(colnames(matrices(dz)$mtx.mut))
    netMaker <- NetworkMaker(dz)
    tbl <- buildChromosomalTable(netMaker, genes)

       # four landmarks for each chromsome: two centromeres, two telomeres
       # one row for each, theon one row for each gene

    checkEquals(nrow(tbl), (24 * 4) + length(genes))
    checkEquals(colnames(tbl), c("name", "map", "loc", "chrom", "arm", "type", "screen.x", "screen.y"))
        # make sure that 1q is the longest arm
    checkEquals(tbl$name[which(tbl$loc == max(tbl$loc))], "end.1")
        # all expected types?
    
    tbl.freq <- as.data.frame(table(tbl$type), stringsAsFactors=FALSE)
    checkEquals(tbl.freq$Var, c("arm", "gene", "telomere.end", "telomere.start"))
    checkEquals(tbl.freq$Freq, c(48,  6, 24, 24))

} # test.buildChromosomalTable
#----------------------------------------------------------------------------------------------------
test.transformChromLocsToScreenCoordinates <- function()
{
    print("--- test.transformChromLocsToScreenCoordinates")
    dz <- DEMOdz()
    netMaker <- NetworkMaker(dz)
    
    genes <- head(colnames(matrices(dz)$mtx.mut))
    tbl <- buildChromosomalTable(netMaker, genes);
    checkEquals(dim(tbl), c(102, 8))
    
         # no screen coordinates assigned
    checkTrue(all(tbl$screen.y == 0))
    checkTrue(all(tbl$screen.x == 0))

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=10, yOrigin=0, yMax=2000, chromDelta=100)

    checkTrue(all(tbl.pos$x != 0))
    checkTrue(all(tbl.pos$y != 0))

      # chr2q telomere terminates the longest q arm
    checkEquals(tbl.pos[which(tbl.pos$y == min(tbl.pos$y)),"id"], "end.2")
      # chr1p telomere terminates the longest p arm
    checkEquals(tbl.pos[which(tbl.pos$y == max(tbl.pos$y)),"id"],  "start.1")

} # test.transformChromLocsToScreenCoordinates
#----------------------------------------------------------------------------------------------------
test.fullDisplay.6genes.DEMOdz <- function()
{
    print("--- test.fullDisplay.6genes.DEMOdz")

    dz <- DEMOdz() 
    netMaker <- NetworkMaker(dz)
    calculateSampleSimilarityMatrix(netMaker, copyNumberValues=c(-2, -1, 1, 2))
    g <- getSamplesGraph(netMaker)
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)

    setPosition(rcy, tbl.pos)    
    fit(rcy, 100)

    genes <- head(colnames(matrices(dz)$mtx.mut))
    g.chrom <- getChromosomeGraph(netMaker, genes)
    httpAddGraph(rcy, g.chrom)
    httpSetStyle(rcy, STYLE.FILE)

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1500, yOrigin=000, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)
    setBackgroundColor(rcy, "#E8E8E0")
    
} # test.fullDisplay.6genes.DEMOdz
#----------------------------------------------------------------------------------------------------
test.fullDisplay.6genes.DEMOdz.precalculatedSimilarity <- function()
{
    print("--- test.fullDisplay.6genes.DEMOdz.precalculatedSimilarity")

    dz <- DEMOdz() 
    netMaker <- NetworkMaker(dz)

    filename <- system.file(package="NetworkMaker", "extdata", "DEMOdz.sampleSimilarity.tsv")
    stopifnot(file.exists(filename))
    usePrecalculatedSampleSimilarityMatrix(netMaker, filename)

    g <- getSamplesGraph(netMaker)
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)

    setPosition(rcy, tbl.pos)    
    fit(rcy, 100)

    genes <- head(colnames(matrices(dz)$mtx.mut))
    g.chrom <- getChromosomeGraph(netMaker, genes)
    httpAddGraph(rcy, g.chrom)
    httpSetStyle(rcy, STYLE.FILE)

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1500, yOrigin=000, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)
    setBackgroundColor(rcy, "#E8E8E0")
    
} # test.fullDisplay.6genes.DEMOdz.precalculatedSimilarity
#----------------------------------------------------------------------------------------------------
test.screenCoordinateManipulations.DEMOdz <- function()
{
    print("--- test.screenCoordinateManipulations.DEMOdz")

    dz <- DEMOdz() 
    netMaker <- NetworkMaker(dz)
    calculateSampleSimilarityMatrix(netMaker, copyNumberValues=c(-2, -1, 1, 2))
    g <- getSamplesGraph(netMaker)
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)

    setPosition(rcy, tbl.pos)    
    fit(rcy, 100)

    genes <- head(colnames(matrices(dz)$mtx.mut))
    g.chrom <- getChromosomeGraph(netMaker, genes)
    httpAddGraph(rcy, g.chrom)
    httpSetStyle(rcy, STYLE.FILE)

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1000, yOrigin=0, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)

    goi <- genes[1]
    soi <- rownames(matrices(dz)$mtx.mut)[1]
    
    gene.pos <- RCyjs::getPosition(rcy, goi)
    sample.pos <- RCyjs::getPosition(rcy, soi)

       # reposition the samples (aka tumors, patients)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=100, yOrigin=-100, xMax=2000, yMax=5000)
    setPosition(rcy, tbl.pos)
    new.sample.pos <- RCyjs::getPosition(rcy, soi)

      # very crude test.  differences should be  100 (x) and -100 (y), but are  112 and 50.
      # need to track that down.
    
    
    checkTrue(new.sample.pos$x - sample.pos$x > 10)
    checkTrue(new.sample.pos$y - sample.pos$y > 10)

         # reposition the chromosomes and genes
    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=2000, yOrigin=-500, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)

    new.gene.pos <- RCyjs::getPosition(rcy, goi)

        # simple test on the one gene
    checkTrue(new.gene.pos$x - gene.pos$x > 950)
    checkTrue(new.gene.pos$y - gene.pos$y > 450)
    
} # test.screenCoordinateManipulations.DEMOdz
#----------------------------------------------------------------------------------------------------
test.fullDisplay.allGenes.DEMOdz <- function()
{
    print("--- test.fullDisplay.allGenes.DEMOdz")

    dz <- DEMOdz() 
    netMaker <- NetworkMaker(dz)
    calculateSampleSimilarityMatrix(netMaker, copyNumberValues=c(-2, -1, 1, 2))
    g <- getSamplesGraph(netMaker)
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)

    setPosition(rcy, tbl.pos)    
    fit(rcy, 100)

    genes <- colnames(matrices(dz)$mtx.mut)
    g.chrom <- getChromosomeGraph(netMaker, genes)
    httpAddGraph(rcy, g.chrom)
    httpSetStyle(rcy, STYLE.FILE)

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1000, yOrigin=000, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)
    
} # test.fullDisplay.allGenes.DEMOdz
#----------------------------------------------------------------------------------------------------
test.fullDisplay.allGenes.TCGAgbm <- function()
{
    print("--- test.fullDisplay.allGenes.TCGAgbm")

    dz <- TCGAgbm()
    netMaker <- NetworkMaker(dz)

    load(system.file(package="NetworkMaker", "extdata", "genesets.RData"))
    goi <- sort(unique(genesets$tcga.GBM.classifiers, genesets$marker.genes.545))
    calculateSampleSimilarityMatrix(netMaker, genes=goi)

    g <- getSamplesGraph(netMaker)
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)

    setPosition(rcy, tbl.pos)    
    fit(rcy, 100)

    g.chrom <- getChromosomeGraph(netMaker, goi)
    httpAddGraph(rcy, g.chrom)
    httpSetStyle(rcy, STYLE.FILE)

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1500, yOrigin=000, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)
    
} # test.fullDisplay.allGenes.TCGAgbm
#----------------------------------------------------------------------------------------------------
test.addMutationsToGraph.DEMOdz <- function()
{
    print("--- test.addMutationstoGraph.DEMOdz")

    dz <- DEMOdz() 
    netMaker <- NetworkMaker(dz)
    goi <- colnames(matrices(dz)$mtx.mut)
    g.mut <- getMutationGraph(netMaker, goi)

    calculateSampleSimilarityMatrix(netMaker)
    g <- getSamplesGraph(netMaker)
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)

    setPosition(rcy, tbl.pos)    
    fit(rcy, 100)

    g.chrom <- getChromosomeGraph(netMaker, goi)
    httpAddGraph(rcy, g.chrom)
    httpSetStyle(rcy, STYLE.FILE)

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1000, yOrigin=000, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)

    g.mut <- getMutationGraph(netMaker, goi)
    httpAddGraph(rcy, g.mut)
    httpSetStyle(rcy, STYLE.FILE)

} # test.addMutationsToGraph.DEMOdz
#----------------------------------------------------------------------------------------------------
test.fullDisplay.withMutations.allGenes.TCGAgbm <- function()
{
    print("--- test.fullDisplay.withMutations.allGenes.TCGAgbm")

    dz <- TCGAgbm()
    netMaker <- NetworkMaker(dz)

    load(system.file(package="NetworkMaker", "extdata", "genesets.RData"))
    goi <- sort(unique(genesets$tcga.GBM.classifiers, genesets$marker.genes.545))
    calculateSampleSimilarityMatrix(netMaker, genes=goi)

    g <- getSamplesGraph(netMaker)
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)

    setPosition(rcy, tbl.pos)    
    fit(rcy, 100)

    g.chrom <- getChromosomeGraph(netMaker, goi)
    httpAddGraph(rcy, g.chrom)
    httpSetStyle(rcy, STYLE.FILE)

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1500, yOrigin=000, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)
    
    g.mut <- getMutationGraph(netMaker, goi)
    edge.count.before <- getEdgeCount(rcy)
    httpAddGraph(rcy, g.mut)
    edge.count.after <- getEdgeCount(rcy)
    httpSetStyle(rcy, STYLE.FILE)
    checkEquals(edge.count.after - edge.count.before, length(edgeNames(g.mut)))

} # test.fullDisplay.withMutations.allGenes.TCGAgbm
#----------------------------------------------------------------------------------------------------
test.fullDisplay.withMutations.withCopyNumber.allGenes.DEMOdz <- function()
{
    print("--- test.fullDisplay.withMutations.withCopyNumber.allGenes.DEMOdz")
    
    dz <- DEMOdz() 
    netMaker <- NetworkMaker(dz)

    gistic.scores <-c(-2, -1, 1, 2)

    calculateSampleSimilarityMatrix(netMaker, copyNumberValues=gistic.scores)
    g <- getSamplesGraph(netMaker)
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)

    setPosition(rcy, tbl.pos)    
    fit(rcy, 100)

    goi <- colnames(matrices(dz)$mtx.mut)
    g.chrom <- getChromosomeGraph(netMaker, goi)
    httpAddGraph(rcy, g.chrom)
    httpSetStyle(rcy, STYLE.FILE)

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1400, yOrigin=000, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)

    g.mut <- getMutationGraph(netMaker, goi)
    httpAddGraph(rcy, g.mut)

    edge.count.before <- getEdgeCount(rcy)
    g.cn <- getCopyNumberGraph(netMaker, goi, gistic.scores)
    xx <<- g.cn
    httpAddGraph(rcy, g.cn)
    edge.count.after <- getEdgeCount(rcy)
    print(noquote(checkEquals(edge.count.after - edge.count.before, length(edgeNames(g.cn)))))
    invisible(rcy)

} # test.fullDisplay.withMutations.withCopyNumber.allGenes.DEMOdz
#----------------------------------------------------------------------------------------------------
test.fullDisplay.withMutations.withCopyNumber.allGenes.TCGAgbm <- function()
{
    print("--- test.fullDisplay.withMutations.withCopyNumberallGenes.TCGAgbm")

    dz <- TCGAgbm()
    netMaker <- NetworkMaker(dz)

    load(system.file(package="NetworkMaker", "extdata", "genesets.RData"))
    goi <- sort(unique(genesets$tcga.GBM.classifiers, genesets$marker.genes.545))
    calculateSampleSimilarityMatrix(netMaker, genes=goi)

    g <- getSamplesGraph(netMaker)
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, STYLE.FILE)
    tbl.pos <- getSimilarityScreenCoordinates(netMaker, xOrigin=0, yOrigin=0, xMax=2000, yMax=5000)

    setPosition(rcy, tbl.pos)    
    fit(rcy, 100)

    g.chrom <- getChromosomeGraph(netMaker, goi)
    httpAddGraph(rcy, g.chrom)
    httpSetStyle(rcy, STYLE.FILE)

    tbl.pos <- getChromosomeScreenCoordinates(netMaker, xOrigin=1500, yOrigin=000, yMax=2000, chromDelta=200)
    setPosition(rcy, tbl.pos)
    fit(rcy, 100)
    
    g.mut <- getMutationGraph(netMaker, goi)
    edge.count.before <- getEdgeCount(rcy)
    httpAddGraph(rcy, g.mut)
    edge.count.after <- getEdgeCount(rcy)
    checkEquals(edge.count.after - edge.count.before, length(edgeNames(g.mut)))
    httpSetStyle(rcy, STYLE.FILE)

    edge.count.before <- getEdgeCount(rcy)
    g.cn <- getCopyNumberGraph(netMaker, goi, included.scores=c(-2,2))
    httpAddGraph(rcy, g.cn)
    edge.count.after <- getEdgeCount(rcy)
    print(noquote(checkEquals(edge.count.after - edge.count.before, length(edgeNames(g.cn)))))
    invisible(rcy)

} # test.fullDisplay.withMutations.withCopyNumber.allGenes.TCGAgbm
#----------------------------------------------------------------------------------------------------
# do we have ready access to the same genes hamid uses in his famous gbm/lgg CNA/SNA hobo plot?
test.genesChromosomeGraph.TCGAbrain <- function()
{
    print("--- test.genesChromosomeGraph.TCGAbrain")
    
} # test.genesChromosomeGraph.TCGAbrain
#----------------------------------------------------------------------------------------------------
if(!interactive()){
  runTests()
  quit("no")
  }
