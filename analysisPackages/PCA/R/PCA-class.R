printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.PCA <- setClass ("PCA", 
                   representation = representation(
                        dataset="Dataset",
                        matrixName="character")   # eg, "mtx.mrna" or "mtx.mrna.normalized"
                   )
#----------------------------------------------------------------------------------------------------
setGeneric('pcaDataSummary',        signature='obj', function(obj) standardGeneric ('pcaDataSummary'))
#setGeneric('getDataPackage',        signature='obj', function(obj) standardGeneric ('getDataPackage'))
#setGeneric('setDataMatrixName',     signature='obj', function(obj, dataMatrixName) standardGeneric ('setDataMatrixName'))
#setGeneric('getDataMatrixName',     signature='obj', function(obj) standardGeneric ('getDataMatrixName'))
setGeneric("calculate",             signature='obj', function(obj, genes=NA, samples=NA) standardGeneric("calculate"))
#----------------------------------------------------------------------------------------------------
PCA <- function(dataset,  matrixName)
{
   stopifnot(matrixName %in% .recognized.matrix.names(dataset))
   obj <- .PCA(dataset=dataset, matrixName=matrixName)
   obj

} # PCA constructor
#----------------------------------------------------------------------------------------------------
.recognized.matrix.names <- function(dataset)
{
   subset(getManifest(dataset), class=="matrix")$variable

} # .recognized.matrix.names
#----------------------------------------------------------------------------------------------------
setMethod("pcaDataSummary", "PCA",

  function (obj) {
     msg <- sprintf("PCA object for object %s, matrix %s", getName(obj@dataset), obj@matrixName)
     msg
     })

#----------------------------------------------------------------------------------------------------
setMethod("show", "PCA",
  function (obj) {
     cat (pcaDataSummary(ob), "\n", sep="")
     })

#----------------------------------------------------------------------------------------------------
#setMethod("getDataset", "PCA",
#
#   function (obj) {
#     obj@dataset
#     })
#
##----------------------------------------------------------------------------------------------------
#setMethod("setMatrixByName", "PCA",
#
#  function (obj, matrixName) {
#     stopifnot(matrixName %in% .recognized.matrix.names(obj)
#     obj@matrixName <- matrixName
#     invisible(obj)
#     })
#
##----------------------------------------------------------------------------------------------------
#setMethod("getMatrixName", "PCA",
#
#  function (obj) {
#     obj@matrixName
#     })
#
#----------------------------------------------------------------------------------------------------
setMethod("calculate", "PCA",

   function(obj, genes=NA, samples=NA){

   printf("=== entering PCA::calculate");
   mtx <- getItem(obj@dataset, obj@matrixName)

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
          
