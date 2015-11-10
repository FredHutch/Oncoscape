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
setMethod("calculateSimilarityMatrix", "NetworkMaker",

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
     tbl.pos
     })

#----------------------------------------------------------------------------------------------------
