printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
.PLSR <- setClass ("PLSR", 
                   representation = representation(
                        dataPackage="SttrDataPackageClass",
                        dataMatrixName="character")   # eg, "mtx.mrna" or "mtx.mrna.normalized"
                   )
#----------------------------------------------------------------------------------------------------
setGeneric('setDataMatrixName',     signature='obj', function(obj, dataMatrixName) standardGeneric ('setDataMatrixName'))
setGeneric('getDataMatrixName',     signature='obj', function(obj) standardGeneric ('getDataMatrixName'))
setGeneric('plsrDataSummary',       signature='obj', function (obj) standardGeneric ('plsrDataSummary'))
setGeneric('getDataPackage',        signature='obj', function (obj) standardGeneric ('getDataPackage'))
setGeneric('createClassificationMatrix',   signature='obj', function (obj, factors) standardGeneric ('createClassificationMatrix'))
setGeneric("calculatePLSR",         signature='obj', function(obj, factors, genes=NA, patients=NA) standardGeneric("calculatePLSR"))
setGeneric("summarizeNumericPatientAttributes", signature="obj", function(obj, factorNames) standardGeneric("summarizeNumericPatientAttributes"))
#----------------------------------------------------------------------------------------------------
PLSR <- function(sttrDataPackage, dataMatrixName)
{
   obj <- .PLSR(dataPackage=sttrDataPackage, dataMatrixName=dataMatrixName)

      # just very minimal tests on requisite data for now (6 may 2015)
      # a more robust test for the future:
      #    - minimum gene & patient counts
      #    - most expression data samples (patients) also in tbl.patientHistory
   
   stopifnot(dataMatrixName %in% names(matrices(sttrDataPackage)))
   stopifnot(nrow(getPatientTable(sttrDataPackage)) > 0)  
   obj

} # PLSR constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "PLSR",
     function (obj){
        msg <- sprintf("PLSR object with dataPackage named '%s'", obj@dataPackage@name)
        cat(msg, "\n", sep = "")
        msg <- sprintf("                 dataSet named:    '%s'", obj@dataMatrixName)
        cat(msg, "\n", sep = "")
        })

#----------------------------------------------------------------------------------------------------
setMethod("setDataMatrixName", "PLSR",
  function (obj, dataMatrixName) {
     stopifnot(dataMatrixName %in% names(matrices(obj@dataPackage)))
     obj@dataMatrixName <- dataMatrixName
     invisible(obj)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getDataMatrixName", "PLSR",
  function (obj) {
     obj@dataMatrixName
     })

#----------------------------------------------------------------------------------------------------
setMethod("plsrDataSummary", "PLSR",
  function (obj) {
     msg <- sprintf("PLSR package, matrices: %s",
                    paste(names(matrices(getDataPackage(obj))), collapse=","))
     msg
     })

#----------------------------------------------------------------------------------------------------
setMethod("show", "PLSR",
  function (object) {
     msg <- sprintf("PLSR object with DataPackage '%s' and dataset '%s'",
                    object@dataPackage@name, object@dataMatrixName)
     cat(msg, "\n", sep="")
     #show(object@dataPackage)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getDataPackage", "PLSR",

   function (obj) {
     obj@dataPackage
     })

#----------------------------------------------------------------------------------------------------
# clients of this class will want to now how crucial phenotypic variables (AgeDx, Survival, etc.)
# vary.   a precaution: there may be more patient clinical data than patient expression (or other
# molecular measurement) data. it is only the ranges of, for instance, patient survival data from
# patients for whom we have expression  data that will be interesting, and for which contrasting
# values (short vs long survival) might be correlated with gene expression.  do the interesection
# of patient groups here, so the user can easily discern how those values vary for acutally
# relevant patients
setMethod("summarizeNumericPatientAttributes", "PLSR",

   function(obj, factorNames){
      tbl.pt <- getPatientTable(getDataPackage(obj))
      mtx.mrna <- matrices(getDataPackage(obj))[[getDataMatrixName(obj)]]
      mrna.patients <- rownames(mtx.mrna)
      mrna.patients <- sub("\\.0[12]$", "", mrna.patients)
      overlapping.patients <- intersect(rownames(tbl.pt), mrna.patients)
      tbl.ptSub <- tbl.pt[overlapping.patients,]
      result <- vector("list", length(factorNames))
      names(result) <- factorNames;
      for(factorName in factorNames){
         result[[factorName]] <- NA   # be pessimistic
         if(!factorName %in% colnames(tbl.ptSub)){
            warning(sprintf("unrecognized patient history attribute: '%s'", factorName))
            next;
            }
         factorClass <- class(tbl.ptSub[, factorName])
         if(!factorClass %in% c("integer", "numeric")){
            warning(sprintf("attribute '%s' is neither integer or numeric, cannot summarize.", factorName))
            next;             
            }
         result[[factorName]] <- fivenum(tbl.ptSub[, factorName])
         }
      return(result);
      })

#----------------------------------------------------------------------------------------------------
setMethod("createClassificationMatrix", "PLSR",

  function(obj, factors) {

     tbl.pt <- getPatientTable(getDataPackage(obj))
     factor.names <- unlist(lapply(factors, function(factor) factor$name))
     for(name in factor.names)
       stopifnot(name %in% colnames(tbl.pt))
    
     tbl.sub <- tbl.pt[, factor.names, drop=FALSE]

     rowNames <- rownames(tbl.sub)
        # a little footwork needed to have column titles alphatetical -and- have .lo preceed .hi
     colNames <- sort(c(paste(factor.names, "t1", sep="."), paste(factor.names, "t2", sep=".")))
     colNames <- sub(".t1", ".lo", colNames, fixed=TRUE)
     colNames <- sub(".t2", ".hi", colNames, fixed=TRUE)
     mtx <- matrix(0, nrow(tbl.sub), ncol=length(colNames), dimnames=list(rowNames, colNames))
     
        # identify the rows, for each factor, which are less than low, greater than high
     for(i in 1:length(factors)){
        factor <- factors[[i]]
        factor.lo.rows <- which(tbl.sub[, factor$name] <= factor$low)
        factor.hi.rows <- which(tbl.sub[, factor$name] >= factor$high)
        colname <- colNames[(2 *(i-1)) + 1]
        mtx[factor.lo.rows, colname] <- mtx[factor.lo.rows, colname] + 1
        colname <- colNames[(2 *(i-1)) + 2]
        mtx[factor.hi.rows, colname] <- mtx[factor.hi.rows, colname] + 1
        } # for i
     mtx
     }) # createClassificationMatrix

#----------------------------------------------------------------------------------------------------
setMethod("calculatePLSR", "PLSR",

   function(obj, factors, genes, patients=NA){

     mtx.classify <- createClassificationMatrix(obj, factors)

     mtx.mrna <- matrices(getDataPackage(obj))[[getDataMatrixName(obj)]]

     genes.to.use <- intersect(genes, colnames(mtx.mrna))
     mtx.mrna <- mtx.mrna[, genes.to.use]
     rownames(mtx.mrna) <- sub("\\.0[12]$", "", rownames(mtx.mrna))
     patients.in.both.matrices <- intersect(rownames(mtx.classify), rownames(mtx.mrna))
     mtx.classify <- mtx.classify[patients.in.both.matrices,]
     mtx.mrna <- mtx.mrna[patients.in.both.matrices,]
     na.genes <- as.integer(which(apply(mtx.mrna, 2, function(col) all(is.na(col)))))
     if(length(na.genes) > 0)
        mtx.mrna <- mtx.mrna[, -na.genes]

     fit <- plsr(mtx.classify ~ mtx.mrna, ncomp=2, scale=TRUE, validation="none")

     categories <- names(fit$Yloadings[,1]) # ageAtDxLow, ageAtDxHigh, survivalLow, survivalHigh
     
     load.vectors <- matrix(c(fit$Yloadings[,1], fit$Yloadings[,2]),
                            nrow=length(categories),
                            dimnames=list(categories, c("x", "y")))
     tbl.loadings <- fit$loadings[,1:2]
     colnames(tbl.loadings) <- c("x", "y")

       # the load.vectors are often stubby little things.
       # scale them up so that the largest extends beyond the most extreme gene location

       # we want the longest vector to project beyond the furthest point by
       # about a factor of 1.2
    
     scale <- 1.2 *  max(abs(tbl.loadings))/max(abs(load.vectors))
     load.vectors <- load.vectors * scale

        # maximum.value is used for scaling the eventual d3 plot
     maximum.value <- max(abs(c(as.numeric(tbl.loadings), as.numeric(load.vectors))))
     return(list(loadings=tbl.loadings,
                 loadVectors=load.vectors,
                 maxValue=maximum.value))

     }) # calculatePLSR

#----------------------------------------------------------------------------------------------------
