#------------------------------------------------------------------------------------------------------------------------
.GeneSetBinomialMethods <- setClass ("GeneSetBinomialMethods", 
                            representation = representation (
                              dataPackage="SttrDataPackageClass",
                              dataMatrixName="character",
                              tbl.mrna="matrix",
                              tbl.clinical="data.frame",
                              genesets="list")
)

#------------------------------------------------------------------------------------------------------------------------
GeneSetBinomialMethods <- function(sttrDataPackage, dataMatrixName,
                                   sampleIDs=list(), geneSet=list(),
                         sampleDescription="", geneSetDescription="")
{
   
   obj <- .GeneSetBinomialMethods(dataPackage=sttrDataPackage, dataMatrixName=dataMatrixName)
  
   # file <- system.file(package="GeneSetBinomialMethods", "data", "tbl.mrnaUnified.TCGA.GBM.RData")
   # stopifnot(file.exists(file))
   # load(file)
   # obj@tbl.mrna <- tbl.mrna
   # obj <- .GeneSetBinomialMethods()
   # #obj@sampleIDs <- sampleIDs
   # obj@tbl.mrna <- matrix()
   # file <- system.file(package="GeneSetBinomialMethods", "data", "tbl.ptHistory.RData")
   # load(file)
   # obj@tbl.clinical <- tbl.clinical
  
   
   stopifnot(dataMatrixName %in% names(matrices(sttrDataPackage)))
   dataPackageObj <- sttrDataPackage
   mtx <- matrices(dataPackageObj)[[dataMatrixName]]
   obj@tbl.mrna <- mtx
   clinical <- getPatientTable(dataPackageObj)
   obj@tbl.clinical = clinical 
   file <- system.file(package="GeneSetBinomialMethods", "data", "msigdb.RData")
   load(file)
   obj@genesets <- c(genesets, dataPackageObj@genesets)
   return(obj)
} # GeneSetBinomialMethods constructor

#------------------------------------------------------------------------------------------------------------------------
setGeneric('getExpressionData', signature='obj', function(obj) standardGeneric ('getExpressionData'))
setGeneric('geneSetDataSummary',           signature='obj', function(obj) standardGeneric ('geneSetDataSummary'))
setGeneric('getClinicalData', signature='obj', function(obj) standardGeneric ('getClinicalData'))
setGeneric('getGeneSets', signature='obj', function(obj) standardGeneric ('getGeneSets'))
setGeneric("randomSample", signature='obj', function(obj, nG1 = NULL, nG2 = NULL, cut  = 0.5, all = FALSE, seed = sample(.Random.seed, 1)) standardGeneric ('randomSample'))
setGeneric("analysisDataSetup", signature='obj', function(obj, sampleIDsG1, sampleIDsG2, covariates = NULL, geneSet, sampleDescription="", geneSetDescription="") standardGeneric ('analysisDataSetup'))
setGeneric("geneSetScoreTest", signature='obj', function(obj, sampleIDsG1, sampleIDsG2, covariates = NULL, geneSet, sampleDescription="", geneSetDescription="") standardGeneric ('geneSetScoreTest'))
setGeneric("drawHeatmap", signature='obj',
       function(obj, geneset.name,  group1, group2,cluster.patients=FALSE) standardGeneric('drawHeatmap'))
#------------------------------------------------------------------------------------------------------------------------
setMethod ('getExpressionData', signature = 'GeneSetBinomialMethods',
           function (obj) { 
             invisible(obj@tbl.mrna)
           })

#------------------------------------------------------------------------------------------------------------------------
setMethod("geneSetDataSummary", "GeneSetBinomialMethods",
  function (obj) {
     msg <- sprintf("GeneSetBinomialMethods package, matrices: %s",
                    paste(names(obj), collapse=","))
     msg
     })

#----------------------------------------------------------------------------------------------------
setMethod ('getClinicalData', signature = 'GeneSetBinomialMethods',
           function (obj) { 
             invisible(obj@tbl.clinical)
           })

#------------------------------------------------------------------------------------------------------------------------
setMethod ('getGeneSets', signature = 'GeneSetBinomialMethods',
           function (obj) { 
             invisible(obj@genesets)
           })

#------------------------------------------------------------------------------------------------------------------------
setMethod("randomSample", signature = "GeneSetBinomialMethods",
          function (obj, nG1 = NULL, nG2 = NULL, cut  = 0.5, all = FALSE, seed = sample(.Random.seed, 1)) {
            
            if((is.null(nG1) | is.null(nG2)) & all == FALSE)  stop("If either of the arguments nG1 or nG2 is null, then all must equal TRUE")
            
            if((length(which(getClinicalData(obj)$survival <= cut)) == 0 | length(which(getClinicalData(obj)$survival > cut)) == 0) == TRUE) {
              stop(paste("Either one or both groups contain no subjects for the given cut value.  The TCGA survival range is [", 
                         range(na.omit(getClinicalData(obj)$survival))[1], ", ", range(na.omit(getClinicalData(obj)$survival))[2], "].", sep = ""))
            }
            
            range(na.omit(getClinicalData(obj)$survival))
            
            if(all == FALSE) {
              if(length(which(getClinicalData(obj)$survival <= cut)) < nG1) {
                nG1 <- length(which(getClinicalData(obj)$survival <= cut))
                warning(paste("nG1 is truncated to have length", nG1)) 
              }
              
              if(length(which(getClinicalData(obj)$survival > cut)) < nG2) {
                nG2 <- length(which(getClinicalData(obj)$survival > cut))
                warning(paste("nG2 is truncated to have length", nG2)) 
              }
              
              set.seed(seed)
              shortSurvivors <- as.list(getClinicalData(obj)[sample(which(getClinicalData(obj)$survival <= cut), nG1), "ID"])
              
              set.seed(seed)
              longSurvivors <- as.list(getClinicalData(obj)[sample(which(getClinicalData(obj)$survival > cut), nG2), "ID"])
              
              return(list(shortSurvivors = shortSurvivors, longSurvivors = longSurvivors, seed = seed))
            } else {
              shortSurvivors.all <- as.list(getClinicalData(obj)[which(getClinicalData(obj)$survival <= cut), "ID"])
              longSurvivors.all <- as.list(getClinicalData(obj)[which(getClinicalData(obj)$survival > cut), "ID"]) 
              return(list(shortSurvivors = shortSurvivors.all, longSurvivors = longSurvivors.all))
            }
          }) #randomSample

#------------------------------------------------------------------------------------------------------------------------
setMethod("analysisDataSetup", signature = "GeneSetBinomialMethods",
          function (obj, sampleIDsG1, sampleIDsG2, covariates = NULL, geneSet, sampleDescription="", geneSetDescription="") {
            print("***** within analysisDataSetup")
            msigdbGeneList <- getGeneSets(obj)[geneSet][[1]]
            
            if(length(which(colnames(getExpressionData(obj)) %in% msigdbGeneList)) == 0) {
              print("which(colnames(getExpressionData(obj)) %in% msigdbGeneList)) == 0")
              return("None of the genes in the specified gene sets are contained in the TCGA gene expression data.")
            }
            if(nchar(getClinicalData(obj)$ptID[1]) == 12){
              print("nchar of clinical ptID is 12")
              sampleIDsG1 <- substring(sampleIDsG1, 1, 12)
              sampleIDsG2 <- substring(sampleIDsG2, 1, 12)

            }
        
            clinicalG1 <- data.frame(getClinicalData(obj)[which(getClinicalData(obj)$ptID %in% sampleIDsG1), c("ptID", covariates)], stringsAsFactors = FALSE)
            clinicalG1$group <- 1
            colnames(clinicalG1)[1] <- "ID"
            clinicalG2 <-  data.frame(getClinicalData(obj)[which(getClinicalData(obj)$ptID %in% sampleIDsG2), c("ptID", covariates)], stringsAsFactors = FALSE)
            clinicalG2$group <- 0 #Group 2 is treated as the referent.
            colnames(clinicalG2)[1] <- "ID"
            print("test3")
            clinical <- rbind(clinicalG1, clinicalG2)
              #which(clinical$ID %in% sampleIDsG1)
              #which(clinical$ID %in% sampleIDsG2)
            if(length(which(colnames(getExpressionData(obj)) %in% msigdbGeneList)) > 1) {
              print("test4")
              print(colnames(getExpressionData(obj))[c(1:10)])
              printf("dim(getExpressionData(obj)): %d x %d", nrow(getExpressionData(obj)), ncol(getExpressionData(obj)))
              print(which(colnames(getExpressionData(obj)) %in% msigdbGeneList))
              geneExpression <- getExpressionData(obj)[, which(colnames(getExpressionData(obj)) %in% msigdbGeneList)]
                  print("test5")
              unmatchedGenes = setdiff(msigdbGeneList, colnames(geneExpression))
            } else {
              print("test6")
              geneExpression <- getExpressionData(obj)[, which(colnames(getExpressionData(obj)) %in% msigdbGeneList)]
                length(geneExpression)
              print("test7")
              geneExpression <- matrix(geneExpression, 
                dimnames = list(rownames(getExpressionData(obj)), 
                colnames(getExpressionData(obj))[which(colnames(getExpressionData(obj)) %in% msigdbGeneList)]))
              
              unmatchedGenes = setdiff(msigdbGeneList, colnames(geneExpression))
            } 
            print("test8")   
            rownames(geneExpression) <- substring(rownames(geneExpression), 1, 12)
            print(rownames(geneExpression)[c(1:10)])
            analysisData <- merge(clinical, geneExpression, by.x = "ID", by.y = "row.names")
            print(colnames(analysisData))
            print(rownames(analysisData))
            print("test9")          
            unmatchedSamples = setdiff(unlist(c(sampleIDsG1, sampleIDsG2)), analysisData$ID)
            printf("dim(analysisData): %d x %d", nrow(analysisData), ncol(analysisData))

            output <- list(sampleDescription = sampleDescription,
                        geneSetDescription = geneSetDescription,
                        unmatchedSamples = unmatchedSamples,
                        unmatchedGenes = unmatchedGenes,
                        analysisData = analysisData)
            
            #analysisDataSetup_nocov <- output
            #save(analysisDataSetup_nocov, file = "/shared/cs_researcher/He_C/QH_HOPP/Wade_C/oncoscape/code/GeneSetBinomialMethods_package/GeneSetBinomialMethods/inst/extdata/analysisDataSetup_nocov.Rdata")

            #analysisDataSetup_singlecov <- output
            #save(analysisDataSetup_singlecov, file = "/shared/cs_researcher/He_C/QH_HOPP/Wade_C/oncoscape/code/GeneSetBinomialMethods_package/GeneSetBinomialMethods/inst/extdata/analysisDataSetup_singlecov.Rdata")
            
            #analysisDataSetup_twocov <- output
            #save(analysisDataSetup_twocov, file = "/shared/cs_researcher/He_C/QH_HOPP/Wade_C/oncoscape/code/GeneSetBinomialMethods_package/GeneSetBinomialMethods/inst/extdata/analysisDataSetup_twocov.Rdata")
            
            #analysisDataSetup_singleGene <- output
            #save(analysisDataSetup_singleGene, file = "/shared/cs_researcher/He_C/QH_HOPP/Wade_C/oncoscape/code/GeneSetBinomialMethods_package/GeneSetBinomialMethods/inst/extdata/analysisDataSetup_singleGene.Rdata")
            
            return(output)
          }) # analysisDataSetup

#------------------------------------------------------------------------------------------------------------------------
setMethod("geneSetScoreTest", signature = "GeneSetBinomialMethods",
          function (obj, sampleIDsG1, sampleIDsG2, covariates = NULL, geneSet, sampleDescription="", geneSetDescription="") {
              print("***** within geneSetScoreTest function")
              #print("***** obj structure 1: ", str(obj, max.level=1))
              skatData <- analysisDataSetup(
                  obj = obj,
                  sampleIDsG1 = sampleIDsG1,
                  sampleIDsG2 = sampleIDsG2,
                  geneSet = geneSet,
                  covariates = covariates,
                  sampleDescription = sampleDescription,
                  geneSetDescription = geneSetDescription)
              if(is.character(skatData)){
                print("receive skatData string, should be an error.")
                print(skatData)
                return(skatData)
              }
              printf("dim(skatData$analysisData): %d x %d", nrow(skatData$analysisData), ncol(skatData$analysisData))
              for(i in length(covariates)) {
                skatData$analysisData[which(skatData$analysisData[, covariates[i]] == ""), covariates[i]] <- NA
              }
              
              skatData$analysisData <- na.omit(skatData$analysisData)
              
              myGenes <- data.matrix(skatData$analysisData[, (-1)*which(colnames(skatData$analysisData) %in% c(covariates, "ID", "group"))])
            
              #Function to retrieve warnings without sending them to the standard output
              withWarnings <- function(expr) {
                  myWarnings <- NULL
                  
                  wHandler <- function(w) {
                    myWarnings <<- c(myWarnings, list(w))
                    invokeRestart("muffleWarning")
                  }
                  
                  val <- withCallingHandlers(expr, warning = wHandler)
                  
                  return(list(value = val, warnings = myWarnings))
              }
    
              if(!is.null(covariates)) {
                  myformula <- as.formula(paste("skatData$analysisData[, 'group'] ~ 1 +",  paste("skatData$analysisData[ ,'", covariates, "']", sep = "", collapse = " + ")))
                  
                  sink("/dev/null")
                    null <- withWarnings(SKAT_Null_Model(myformula, out_type = "D", Adjustment = FALSE))
                    skatRes <- SKAT(myGenes, null$value, kernel = "linear", is_check_genotype = FALSE)
                  sink()
                  
                  mNull <- paste("group ~ 1 + ", paste(covariates, collapse = " + "), sep = "")
                
                  mAlt <- paste("group ~ 1 + ", paste(covariates, collapse = " + "), " + ", paste(colnames(myGenes), collapse = " + "), sep = "")
              } else {
        
                  myformula <- as.formula(paste("skatData$analysisData[, 'group'] ~ 1"))
        
                  sink("/dev/null")
                    null <- withWarnings(SKAT_Null_Model(myformula, out_type = "D", Adjustment = FALSE))
                    skatRes <- SKAT(myGenes, null$value, kernel = "linear", is_check_genotype = FALSE)
                  sink()
        
                  mNull <- paste("group ~ 1", sep = "")
                  
                  mAlt <- paste("group ~ 1 + ", paste(colnames(myGenes), collapse = " + "), sep = "")
              }
  

              if(is.null(null$warnings)) {
                  summary.skatRes <- paste("Null Model: ", mNull, "\nAlternative Model: ", mAlt, "\n\nP-value:", round(skatRes$p.value, 4))
  
              } else {
                  summary.skatRes <- paste("Null Model: ", mNull, "\nAlternative Model: ", mAlt, "\n\nP-value:", round(skatRes$p.value, 4), 
                                         "\n\nNull Model Warnings:", unlist(null$warnings)) 
                  
              }
                
              res <- list(
                  sampleDescription = sampleDescription, 
                  geneSetDescription = geneSetDescription, 
                  unmatchedSamples = skatData$unmatchedSamples, 
                  unmatchedGenes = skatData$unmatchedGenes, 
                  analysisData = skatData$analysisData, 
                  null.model = mNull, 
                  null.warnings = unlist(null$warnings),
                  alternative.model = mAlt, 
                  skatRes = skatRes,
                  summary.skatRes = summary.skatRes,
                  pValue = round(skatRes$p.value, 4)
                  )
            
            return(res)
          }) #geneSetScoreTest
#------------------------------------------------------------------------------------------------------------------------
