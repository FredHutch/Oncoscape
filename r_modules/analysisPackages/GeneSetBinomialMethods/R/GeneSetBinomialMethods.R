#------------------------------------------------------------------------------------------------------------------------
.GeneSetBinomialMethods <- setClass ("GeneSetBinomialMethods", 
                            representation = representation (tbl.mrna="matrix",
                                                             tbl.clinical="data.frame",
                                                             genesets="list")
)

#------------------------------------------------------------------------------------------------------------------------
GeneSetBinomialMethods <- function()
{
  obj <- .GeneSetBinomialMethods()
  
  file <- system.file(package="GeneSetBinomialMethods", "data", "tbl.mrnaUnified.TCGA.GBM.RData")
  stopifnot(file.exists(file))
  load(file)
  obj@tbl.mrna <- tbl.mrna
  
  file <- system.file(package="GeneSetBinomialMethods", "data", "tbl.ptHistory.RData")
  load(file)
  obj@tbl.clinical <- tbl.clinical
  
  file <- system.file(package="GeneSetBinomialMethods", "data", "msigdb.RData")
  load(file)
  obj@genesets <- genesets

  return(obj)
} # GeneSetBinomialMethods constructor

#------------------------------------------------------------------------------------------------------------------------
setGeneric('getExpressionData', signature='obj', function(obj) standardGeneric ('getExpressionData'))
setGeneric('getClinicalData', signature='obj', function(obj) standardGeneric ('getClinicalData'))
setGeneric('getGeneSets', signature='obj', function(obj) standardGeneric ('getGeneSets'))
setGeneric("randomSample", signature='obj', function(obj, nG1 = NULL, nG2 = NULL, cut  = 0.5, all = FALSE, seed = sample(.Random.seed, 1)) standardGeneric ('randomSample'))
setGeneric("analysisDataSetup", signature='obj', function(obj, sampleIDsG1, sampleIDsG2, covariates = NULL, geneSet, sampleDescription="", geneSetDescription="") standardGeneric ('analysisDataSetup'))
setGeneric("geneSetScoreTest", signature='obj', function(obj, sampleIDsG1, sampleIDsG2, covariates = NULL, geneSet, sampleDescription="", geneSetDescription="") standardGeneric ('geneSetScoreTest'))

#------------------------------------------------------------------------------------------------------------------------
setMethod ('getExpressionData', signature = 'GeneSetBinomialMethods',
           function (obj) { 
             invisible(obj@tbl.mrna)
           })

#------------------------------------------------------------------------------------------------------------------------
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

            msigdbGeneList <- getGeneSets(obj)[geneSet][[1]]
              
            if(length(which(colnames(getExpressionData(obj)) %in% msigdbGeneList)) == 0) {
              stop("None of the genes in the specified gene sets are contained in the TCGA gene expression data.")
            }
            
            clinicalG1 <- data.frame(getClinicalData(obj)[which(getClinicalData(obj)$ID %in% sampleIDsG1), c("ID", covariates)], stringsAsFactors = FALSE)
            clinicalG1$group <- 1
            colnames(clinicalG1)[1] <- "ID"
              
            clinicalG2 <-  data.frame(getClinicalData(obj)[which(getClinicalData(obj)$ID %in% sampleIDsG2), c("ID", covariates)], stringsAsFactors = FALSE)
            clinicalG2$group <- 0 #Group 2 is treated as the referent.
            colnames(clinicalG2)[1] <- "ID"
  
            clinical <- rbind(clinicalG1, clinicalG2)
              #which(clinical$ID %in% sampleIDsG1)
              #which(clinical$ID %in% sampleIDsG2)

            if(length(which(colnames(getExpressionData(obj)) %in% msigdbGeneList)) > 1) {
              geneExpression <- getExpressionData(obj)[, which(colnames(getExpressionData(obj)) %in% msigdbGeneList)]
                #dim(geneExpression)
              
              unmatchedGenes = setdiff(msigdbGeneList, colnames(geneExpression))
            } else {
              geneExpression <- getExpressionData(obj)[, which(colnames(getExpressionData(obj)) %in% msigdbGeneList)]
                #length(geneExpression)
              
              geneExpression <- matrix(geneExpression, 
                dimnames = list(rownames(getExpressionData(obj)), 
                colnames(getExpressionData(obj))[which(colnames(getExpressionData(obj)) %in% msigdbGeneList)]))
              
              unmatchedGenes = setdiff(msigdbGeneList, colnames(geneExpression))
            }
            
            analysisData <- merge(clinical, geneExpression, by.x = "ID", by.y = "row.names")
                     
            unmatchedSamples = setdiff(unlist(c(sampleIDsG1, sampleIDsG2)), analysisData$ID)
               
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

            skatData <- analysisDataSetup(
              obj = obj,
              sampleIDsG1 = sampleIDsG1,
              sampleIDsG2 = sampleIDsG2,
              geneSet = geneSet,
              covariates = covariates,
              sampleDescription = sampleDescription,
              geneSetDescription = geneSetDescription)

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
              summary.skatRes = summary.skatRes
              )
            
            return(res)
          }) #geneSetScoreTest
#------------------------------------------------------------------------------------------------------------------------