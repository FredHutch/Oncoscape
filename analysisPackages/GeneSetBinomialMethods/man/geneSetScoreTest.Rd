\name{geneSetScoreTest}
\alias{geneSetScoreTest}
\title{
  Score Test Applied to Gene Sets.
}
\description{
  This function uses a score test to test the null hypothesis that none of the genes in a gene set are associated with long versus short survival.
}
\usage{
  geneSetScoreTest(obj, sampleIDsG1, sampleIDsG2, covariates=NULL, geneSet, sampleDescription="", geneSetDescription="")
}
\arguments{
  \item{obj}{Object of class \code{GeneSetBinomialMethods}.}
  \item{sampleIDsG1}{List of IDs to use in group 1.}
  \item{sampleIDsG2}{List of IDs to use in group 2 (set as zero in the logsitic dichotomy).}
  \item{geneSet}{Character string of a geneset in \link{msigdb}.}
  \item{covariates}{A character vector of covariates from \link{tbl.clinical} to include.}
  \item{sampleDescription}{A brief description of the samples used.}
  \item{geneSetDescription}{A brief description of the gene set.}
}
\value{
  Returns a list:
  \item{sampleDescription}{A brief description of the samples used.}
  \item{geneSetDescription}{A brief description of the gene set.}
  \item{unmatchedSamples}{From the samples given in \code{sampleIDsG1} and \code{sampleIDsG2}, this is a character vector of those that are not used in the analysis.}
  \item{unmatchedGenes}{From the genes given in \code{geneSet}, this is a character vector of those that are not used in the analysis.}
  \item{analysisData}{Fully constructed analytic data used in the analysis.}
  \item{null.model}{The model under the null hypothesis.}
  \item{null.warnings}{Warnings reported from the SKAT null model (\link{SKAT_Null_Model}).}
  \item{alternative.model}{The model under the alternative hypothesis.}
  \item{skatRes}{Results summary from \link{SKAT}}
  \item{summary.skatRes}{A string that can be parsed using \link{cat} to give a concise result summary.}
}
\references{
  Wu, M. C., Lee, S., Cai, T., Li, Y., Boehnke, M., & Lin, X. (2011). Rare-variant association testing for sequencing data with the sequence kernel association test. \emph{The American Journal of Human Genetics}, 89(1), 82-93.
}
\author{
  Wade K. Copeland
}
\seealso{
  \link{SKAT}, \link{SKAT_Null_Model}, \link{SKAT_Null_Model_MomentAdjust}, \link{cat}
}
\examples{
  setAll <- randomSample(obj = GeneSetBinomialMethods(), 
    cut = 0.5, all = TRUE)
  
  #No adjusting covariates
  basicRes <- geneSetScoreTest(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = setAll$shortSurvivors,
    sampleIDsG2 = setAll$longSurvivors,
    covariates = NULL,
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
    
  cat(basicRes$summary.skatRes)
  
  #With adjusting covariates
  covariateRes <- geneSetScoreTest(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = setAll$shortSurvivors,
    sampleIDsG2 = setAll$longSurvivors,
    covariates = c("ageAtDx", "ChemoAgent"),
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
    
  cat(covariateRes$summary.skatRes)
  
  #Complete separation
  separationRes <- geneSetScoreTest(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = setAll$shortSurvivors,
    sampleIDsG2 = setAll$longSurvivors,
    covariates = "FirstProgression",
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
    
  cat(separationRes$summary.skatRes)
}
\keyword{documentation}