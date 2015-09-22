printf = function (...) print (noquote (sprintf (...)))
#------------------------------------------------------------------------------------------------------------------------
.AnalysisDemo <- setClass ("AnalysisDemo", 
          representation = representation (sampleIDs="list",
                                           geneSet="list",
                                           tbl.mrna="matrix",
                                           sampleDescription="character",
                                           geneSetDescription="character")
          )

#------------------------------------------------------------------------------------------------------------------------
AnalysisDemo <- function(sampleIDs=list(), geneSet=list(),
                         sampleDescription="", geneSetDescription="")
{
   obj <- .AnalysisDemo()
   obj@sampleIDs <- sampleIDs
   obj@geneSet <- geneSet
   obj@tbl.mrna <- matrix()
   obj@sampleDescription = sampleDescription
   obj@geneSetDescription = geneSetDescription
   
   obj

} # AnalysisDemo constructor
#------------------------------------------------------------------------------------------------------------------------
setGeneric('getSampleIDs',        signature='obj', function(obj) standardGeneric ('getSampleIDs'))
setGeneric('getGeneSet',           signature='obj', function(obj) standardGeneric ('getGeneSet'))
setGeneric('setExpressionData',    signature='obj', function(obj, tbl.mrna) standardGeneric ('setExpressionData'))
setGeneric('getExpressionData',    signature='obj', function(obj) standardGeneric ('getExpressionData'))
setGeneric("score",                signature='obj', function(obj) standardGeneric ('score'))
#------------------------------------------------------------------------------------------------------------------------
setMethod ('getSampleIDs', signature = 'AnalysisDemo',
  function (obj) { 
    return (obj@sampleIDs);
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod ('getGeneSet', signature = 'AnalysisDemo',
  function (obj) { 
    return (obj@geneSet);
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod ('setExpressionData', signature = 'AnalysisDemo',
  function (obj, tbl.mrna) { 
    obj@tbl.mrna <- tbl.mrna;
    obj
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod ('getExpressionData', signature = 'AnalysisDemo',
  function (obj) { 
    invisible(obj@tbl.mrna)
    })

#------------------------------------------------------------------------------------------------------------------------
.trimMatrix <- function(tbl.mrna, sampleIDs, geneNames)
{
   overlapping.sampleIDs <- intersect(sampleIDs, rownames(tbl.mrna))
   overlapping.genes <- intersect(geneNames, colnames(tbl.mrna))
   
   stopifnot(length(overlapping.sampleIDs) > 0)
   stopifnot(length(overlapping.genes) > 0)
   
   mtx.trimmed <- tbl.mrna[overlapping.sampleIDs, overlapping.genes];
   msg <- sprintf("found %d/%d overlapping samples in the expession data, %d/%d overlapping genes",
                  nrow(mtx.trimmed), length(sampleIDs), ncol(mtx.trimmed), length(geneNames))
   message(msg)
   
   invisible(mtx.trimmed)
   
} # .trimMatrix
#------------------------------------------------------------------------------------------------------------------------
setMethod("score", signature = "AnalysisDemo",

     function (obj) { 
        candidate.genes <- unlist(obj@geneSet)
        candidate.samples <- unlist(obj@sampleIDs)
        mtx.full <- obj@tbl.mrna
        mtx <- .trimMatrix(mtx.full, candidate.samples, candidate.genes)
        genes <- intersect(candidate.genes, colnames(mtx))
        samples <- intersect(candidate.samples, rownames(mtx))
        all.other.genes <- setdiff(colnames(mtx.full), genes)
        random.background.genes <- all.other.genes[sample(1:length(all.other.genes), length(genes))]
        #printf("---------- random.background.genes count: %d", length(random.background.genes))
        #print(random.background.genes)
        scoring.function <- function(sample) {
          vec.1 <- mtx.full[sample, genes];
          vec.2 <- mtx.full[sample, random.background.genes];
          t.test(vec.1, vec.2)$p.value
          }

       pvals.by.sample <- lapply(samples, scoring.function)
       names(pvals.by.sample) <- samples
       result <- list(sample.title=obj@sampleDescription,
                      geneSet.title=obj@geneSetDescription,
                      actual.samples.used=samples,
                      actual.genes.used=genes,
                      unmatched.samples=setdiff(candidate.samples, samples),
                      unmatched.genes=setdiff(candidate.genes, genes),
                      pvals=pvals.by.sample)
                      
       return(result)
          
    }) # score
#------------------------------------------------------------------------------------------------------------------------

