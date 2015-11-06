#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.NetworkMaker <- setClass ("NetworkMaker", 
                         representation = representation (
                             packageName="character",
                             pkg="SttrDataPackageClass",
                             mtx.mut="matrix",
                             mtx.cn="matrix"
                             )
                         )

#----------------------------------------------------------------------------------------------------
setGeneric('getPackage',                 signature='obj', function (obj) standardGeneric ('getPackage'))
setGeneric('calculateSimilarityMatrix',  signature='obj', function (obj, samples=NA, genes=NA)
           standardGeneric ('calculateSimilarityMatrix'))
#----------------------------------------------------------------------------------------------------
# constructor
NetworkMaker <- function(packageName="", verbose=FALSE)
{
   diskImage <- sprintf("~/oncoscapeDiskImages/%s.diskImage", packageName)

   if(verbose)
      printf("diskImage '%s' exists? %s", diskImage, file.exists(diskImage))
    
   if(file.exists(diskImage)){
      varName <- load(diskImage)
      eval(parse(text=sprintf("pkg <- %s", varName)))        
      }
   else{
      eval(parse(text=sprintf("pkg <- %s()", packageName)))
      }

  if(verbose)
     printf("data package %s loaded", packageName)
  
  stopifnot("mtx.mut" %in% names(matrices(pkg)))
  stopifnot("mtx.cn"  %in% names(matrices(pkg)))
  mtx.mut <- matrices(pkg)[["mtx.mut"]]
  mtx.cn <- matrices(pkg)[["mtx.cn"]]

  obj <- .NetworkMaker(packageName=packageName, pkg=pkg, mtx.mut=mtx.mut, mtx.cn=mtx.cn)

  obj

} # NetworkMaker constructor
#----------------------------------------------------------------------------------------------------
setMethod("getPackage", "NetworkMaker",

  function (obj) {
     obj@packageName
     })

#----------------------------------------------------------------------------------------------------
# our convention:
#   samples (patients) are all those listed in the patientHistory
#   genes are all those mentioned in the package gene lists, combined
.extractSamplesAndGenes <- function(obj)
{
   sample.names <- sort(unique(c(rownames(obj@mtx.mut), rownames(obj@mtx.cn))))
   sample.names <- getPatientIDs(obj@pkg, sample.names)
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
setMethod("calculateSimilarityMatrix", "NetworkMaker",

  function (obj, samples=NA, genes=NA) {
     ids <- .extractSamplesAndGenes(obj)
     m0.mut <- 
     browser()
     x <- 99
     })

#----------------------------------------------------------------------------------------------------
