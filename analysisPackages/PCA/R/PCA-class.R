printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.PCA <- setClass ("PCA", 
                   representation = representation(
                        dataPackage="SttrDataPackageClass",
                        dataMatrixName="character")   # eg, "mtx.mrna" or "mtx.mrna.normalized"
                   )
#----------------------------------------------------------------------------------------------------
#setGeneric('show',                  signature='obj', function(obj) standardGeneric ('show'))
setGeneric('pcaDataSummary',        signature='obj', function(obj) standardGeneric ('pcaDataSummary'))
setGeneric('getDataPackage',        signature='obj', function(obj) standardGeneric ('getDataPackage'))
setGeneric('setDataMatrixName',     signature='obj', function(obj, dataMatrixName) standardGeneric ('setDataMatrixName'))
setGeneric('getDataMatrixName',     signature='obj', function(obj) standardGeneric ('getDataMatrixName'))
setGeneric("calculate",             signature='obj', function(obj, genes=NA, samples=NA) standardGeneric("calculate"))
#----------------------------------------------------------------------------------------------------
PCA <- function(sttrDataPackage, dataMatrixName)
{
   obj <- .PCA(dataPackage=sttrDataPackage, dataMatrixName=dataMatrixName)
   
   stopifnot(dataMatrixName %in% names(matrices(sttrDataPackage)))
   obj

} # PCA constructor
#----------------------------------------------------------------------------------------------------
setMethod("pcaDataSummary", "PCA",
  function (obj) {
     msg <- sprintf("PCA package, matrices: %s",
                    paste(names(matrices(getDataPackage(obj))), collapse=","))
     msg
     })

#----------------------------------------------------------------------------------------------------
setMethod("show", "PCA",
  function (obj) {
     #msg <- sprintf("PCA object data '%s'", obj@dataPackage)
     msg <- sprintf("PCA object")
     cat (msg, "\n", sep="")
     })

#----------------------------------------------------------------------------------------------------
setMethod("getDataPackage", "PCA",

   function (obj) {
     obj@dataPackage
     })

#----------------------------------------------------------------------------------------------------
setMethod("setDataMatrixName", "PCA",

  function (obj, dataMatrixName) {
     stopifnot(dataMatrixName %in% names(matrices(obj@dataPackage)))
     obj@dataMatrixName <- dataMatrixName
     invisible(obj)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getDataMatrixName", "PCA",

  function (obj) {
     obj@dataMatrixName
     })

#----------------------------------------------------------------------------------------------------
setMethod("calculate", "PCA",

   function(obj, genes=NA, samples=NA){

   printf("=== entering PCA::calculate");
   mtx <- matrices(getDataPackage(obj))[[getDataMatrixName(obj)]]

   printf("dim(mtx): %d x %d", nrow(mtx), ncol(mtx))
   
   printf("looking at column.sums");
   mtx[is.na(mtx)] <- 0.0
   
   column.sums <- colSums(mtx)
   removers <- as.integer(which(column.sums == 0))
   if(length(removers) > 0) {
       printf("removing %d columns", length(removers))
       mtx <- mtx[, -removers]
       } # if removers

   if(!all(is.na(samples))){
      keepers <- as.integer(unlist(lapply(samples, function(id) grep(id, rownames(mtx)))))
      if(any(is.na(keepers)))
          keepers <- keepers[-is.na(keepers)]
      if(length(keepers) == 0){
         error.msg.1 <- "PCA calculate error: no matches for sampleIDs in the current matrix"
         if(length(samples > 5)) samples <- samples[1:5]
         error.msg.2 <- sprintf("samples: %s", paste(samples, collapse=","))
         stop(cat(error.msg.1, error.msg.2))
         }
      mtx <- mtx[keepers,]
      printf("mtx subsetted on %d keepers, dim: %d, %d", length(keepers), nrow(mtx), ncol(mtx))
      } # some possibly valid samples provided

   if(!all(is.na(genes)))
      mtx <- mtx[, intersect(colnames(mtx), genes)]
   
   printf("before prcomp, %d, %d", nrow(mtx), ncol(mtx))
   
   PCs <- tryCatch(
      prcomp(mtx,center=T,scale=T),
      error=function(error.message){
         print(error.message)
         stop("error with PCA calculation.  See R log");
         })
   
   if(all(is.na(PCs)))
       stop("error with PCA calculation.  See R log");
    
   result <- list()
   result$scores <- as.data.frame(PCs$x)
   result$scores$id <- rownames(result$scores)
   rownames(result$scores) <- NULL
 
   result$loadings <- as.data.frame(PCs$rotation)
   result$loadings$id <- rownames(result$loadings)
   rownames(result$loadings) <- NULL
 
   result$importance <- summary(PCs)$importance
   
   result$method <- list(method = "prcomp", center="True", scale="True")
   result$sampleIDs <- rownames(mtx)
   invisible (result)

   }) # calculate

#----------------------------------------------------------------------------------------------------
          
