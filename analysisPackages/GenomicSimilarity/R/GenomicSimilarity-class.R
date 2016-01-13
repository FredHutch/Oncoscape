#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.GenomicSimilarity <- setClass ("GenomicSimilarity", 
                         representation = representation (
                             pkg="SttrDataPackageClass",
                             matrixNames="character",
                             genes="character",
                             samples="character",
                             state="environment"
                             )
                         )

#----------------------------------------------------------------------------------------------------
setGeneric('getMatrixNames',      signature='obj', function(obj) standardGeneric('getMatrixNames'))
setGeneric('calculate',           signature='obj', function(obj) standardGeneric('calculate'))
setGeneric('getSimilarityTable',  signature='obj', function(obj) standardGeneric('getSimilarityTable'))
#----------------------------------------------------------------------------------------------------
# constructor
GenomicSimilarity <- function(dataPackage, matrixNames, samples=NA_character_, genes=NA_character_,
                              verbose=FALSE)
{
    obj <- .GenomicSimilarity(pkg=dataPackage, matrixNames=matrixNames,
                              samples=samples, genes=genes, state=new.env(parent=emptyenv()))

  obj

} # GenomicSimilarity constructor
#----------------------------------------------------------------------------------------------------
setMethod("getMatrixNames", "GenomicSimilarity",

  function (obj) {
     obj@matrixNames
     })

#----------------------------------------------------------------------------------------------------
.assembleBaseMatrix <- function(obj)
{
    names <- obj@matrixNames
    matrices <- matrices(obj@pkg)[names]
    genes <- c()
    samples <- c()
    features <- c()
    
    for(name in names){
       mtx <- matrices(obj@pkg)[[name]]
       samples <- c(samples, rownames(mtx))
       features <- c(features, paste(name, colnames(mtx), sep="."))
       }
    
    samples <- sort(unique(samples))
    features <- sort(unique(features))
    
    mtx.base <- matrix(NA, nrow=length(samples), ncol=length(features), 
                       dimnames=list(samples, features))

    for(name in names){
       mtx <- matrices(obj@pkg)[[name]]
       if(class(mtx[1,1]) == "character")
           mtx <- .characterMatrixTo01IntegerMatrix(mtx)
      mtx.base[rownames(mtx), paste(name, colnames(mtx), sep=".")] <- mtx
      } # for name

    obj@state[["mtx.base"]] <- mtx.base
    

} # .assembleBaseMatrix
#----------------------------------------------------------------------------------------------------
# samples and genes args are only for testing; in normal operation the full lists from
# .extractSamplesAndGenes is used
setMethod("calculate", "GenomicSimilarity",

  function (obj) {

    if(!"mtx.base" %in% ls(obj@state))
       .assembleBaseMatrix(obj)
    
    mtx.base <- obj@state[["mtx.base"]]
    dmtx <- as.matrix(dist(mtx.base))
    mtx.sim <- as.matrix(cmdscale(dmtx, k=2))
    colnames(mtx.sim) <- c("x", "y")
    obj@state[["mtx.sim"]] <- mtx.sim
    })

#----------------------------------------------------------------------------------------------------
setMethod("getSimilarityTable", "GenomicSimilarity",

   function(obj){
      stopifnot("mtx.sim" %in% ls(obj@state));
      as.data.frame(obj@state[["mtx.sim"]])
      })

#----------------------------------------------------------------------------------------------------
# all NA or empty string elements become 0
# all others become 1
.characterMatrixTo01IntegerMatrix <- function(mtx)
{
     if(any(mtx == "", na.rm=TRUE) && any(is.na(mtx)))
        mtx[mtx==""] <- NA
     
     if(length(which(mtx == "NA")) > 0){
         mtx.01 <- (mtx != "NA") + 0   # coerce to integers by adding zero
     } else if (length(which(is.na(mtx))) > 0){
         mtx.01 <- (!is.na(mtx)) + 0
     } else if (length(which(mtx == "")) > 0){
         mtx.01 <- (mtx != "") + 0
     } else {
         stop("unexpected mtx values")
     }

    mtx.01

} # .characterMatrixTo01IntegerMatrix
#----------------------------------------------------------------------------------------------------
