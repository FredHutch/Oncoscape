library(RUnit)
library(NetworkMaker)
library(SttrDataPackage)
library(DEMOdz)
library(TCGAgbm)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  testConstructor();
  test.extractSamplesAndGenes()
  test.calculateSimilarity.DEMOdz()
  test.calculateSimilarity.TCGAgbm()
  test.calculateSimilarity.TCGAgbm.completeSubset()
  test.samplesToGraph.DEMOdz()
  
} # runTests
#----------------------------------------------------------------------------------------------------
testConstructor <- function()
{
   print("--- testConstructor")
   dzName <- "DEMOdz"
   netMaker <- NetworkMaker(dzName)
   checkEquals(getPackage(netMaker), dzName)
   
} # testConstructor
#----------------------------------------------------------------------------------------------------
test.extractSamplesAndGenes <- function()
{
    print("--- test.extractSamplesAndGenes")
    dzName <- "DEMOdz"
    netMaker <- NetworkMaker(dzName)
    x <- NetworkMaker:::.extractSamplesAndGenes(netMaker)
    checkEquals(names(x), c("samples", "genes"))
    checkEquals(length(x$samples), 20)
    checkEquals(length(x$genes), 64)
    
} # test.extractSamplesAndGenes
#----------------------------------------------------------------------------------------------------
test.calculateSimilarity.DEMOdz <- function()
{
    print("--- test.calculateSimilarity.DEMOdz")

       # needed for testing. note that NetworkMaker does not need
       # an already-constructed object.
    
    dz <- DEMOdz() 
    checkTrue(all(c("mtx.mut", "mtx.cn") %in% names(matrices(dz))))

    dzName <- "DEMOdz"
    netMaker <- NetworkMaker(dzName)
    calculateSimilarityMatrix(netMaker)
    tbl.pos <- getSampleCoordinates(netMaker)
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

    dzName <- "TCGAgbm"
    netMaker <- NetworkMaker(dzName, verbose=TRUE)
    calculateSimilarityMatrix(netMaker, genes=goi)
    tbl.pos <- getSampleCoordinates(netMaker)

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
    checkTrue(max(mdist.check) > 20)   # 30.3037 with TCGA_0.99.23
    
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
    
    dzName <- "TCGAgbm"
    netMaker <- NetworkMaker(dzName)
    calculateSimilarityMatrix(netMaker, samples=poi, genes=goi)
    tbl.pos <- getSampleCoordinates(netMaker)

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
test.samplesToGraph.DEMOdz <- function()
{
    print("--- test.samplesToGraph.DEMOdz")
    dz <- DEMOdz() 
    checkTrue(all(c("mtx.mut", "mtx.cn") %in% names(matrices(dz))))

    dzName <- "DEMOdz"
    netMaker <- NetworkMaker(dzName)
    calculateSimilarityMatrix(netMaker)
    tbl.pos <- getSampleCoordinates(netMaker)
    g <- samplesToGraph(netMaker)
    checkEquals(sort(nodes(g)), sort(rownames(tbl.pos)))
    checkEquals(length(edgeNames(g)), 0)
    checkEquals(sort(noaNames(g)), c("id", "nodeType", "subType", "x", "y"))
    rcy <- RCyjs(portRange=6047:6100, quiet=TRUE, graph=g, hideEdges=TRUE)
    httpSetStyle(rcy, "style.js")
    tbl.xpos <- transformSimilarityToScreenCoordinates(netMaker, xSpan=2000, ySpan=5000)
    setPosition(rcy, tbl.xpos)    
    fit(rcy, 100)

       # very modest test:  is the actual position on the rcy canvas what we asked for?
       # check just the first sample

       ## collision with GWASTools
    tbl.1 <- RCyjs::getPosition(rcy, rownames(tbl.xpos)[1]);
    checkEqualsNumeric(tbl.1$x, tbl.xpos$x[1], tol=1e-4)
    checkEqualsNumeric(tbl.1$y, tbl.xpos$y[1], tol=1e-4)

} # test.samplesToGraph.DEMOdz()
#----------------------------------------------------------------------------------------------------
test.genesChromosomeGraph.DEMOdz <- function()
{
    print("--- test.genesChromosomeGraph.DEMOdz")
    dz <- DEMOdz() 
    checkTrue(all(c("mtx.mut", "mtx.cn") %in% names(matrices(dz))))

    dzName <- "DEMOdz"
    netMaker <- NetworkMaker(dzName)
    g <- geneChromosomeGraph(netMaker)


} # test.genesChromosomeGraph.DEMOdz()
#----------------------------------------------------------------------------------------------------
test.buildChromosomalTable <- function()
{
    print("--- test.buildChromosomalTable")
    dz <- DEMOdz()
    genes <- head(colnames(matrices(dz)$mtx.mut))
    netMaker <- NetworkMaker("DEMOdz")
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
    netMaker <- NetworkMaker("DEMOdz")
    
    genes <- head(colnames(matrices(dz)$mtx.mut))
    tbl <- buildChromosomalTable(netMaker, genes);

         # no screen coordinates assigned
    checkTrue(all(tbl$screen.y == 0))
    checkTrue(all(tbl$screen.x == 0))

    tbl.pos <- transformChromLocsToScreenCoordinates(netMaker, centerY=0, topY=2000)

    checkTrue(all(tbl.pos$x != 0))
    checkTrue(all(tbl.pos$y != 0))

      # chr2q telomere terminates the longest q arm
    checkEquals(tbl.pos[which(tbl.pos$y == min(tbl.pos$y)),"id"], "end.2")
      # chr1p telomere terminates the longest p arm
    checkEquals(tbl.xpos[which(tbl.pos$y == max(tbl.pos$y)),"id"],  "start.1")

} # test.transformChromLocsToScreenCoordinates
#----------------------------------------------------------------------------------------------------
if(!interactive())
    runTests()
    
