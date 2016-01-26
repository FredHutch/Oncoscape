\name{analysisDataSetup}
\alias{analysisDataSetup}
\title{
  Construct An Analytic Data Set to Analyze Gene Set Data
}
\description{
  This function constructs an analytic data set that is used in down-stream analyses.
}
\usage{
  analysisDataSetup(obj, sampleIDsG1, sampleIDsG2, covariates=NULL, geneSet, sampleDescription="", geneSetDescription="")
}
\arguments{
  \item{obj}{Object of class \code{GeneSetBinomialMethods}.}
  \item{sampleIDsG1}{List of IDs to use in group 1.}
  \item{sampleIDsG2}{List of IDs to use in group 2 (set as zero in the logsitic dichotomy).}
  \item{covariates}{A character vector of covariates from \link{tbl.clinical} to include in the data set.}
  \item{geneSet}{Character string of a geneset in \link{msigdb}.}
  \item{sampleDescription}{A brief description of the samples used.}
  \item{geneSetDescription}{A brief description of the gene set.}
}
\value{
  Returns a list:
  \item{sampleDescription}{Same as the argument \code{sampleDescription}.}
  \item{geneSetDescription}{Same as the argument \code{geneSetDescription}.}
  \item{unmatchedSamples}{From the samples given in \code{sampleIDsG1} and \code{sampleIDsG2}, this is a list of samples that do not match from the both \link{tbl.clinical} and \link{tbl.mrna}}
  \item{unmatchedGenes}{From the genes given in \code{geneSet}, this is a character vector of those that are not contained in \link{tbl.mrna}.}
  \item{analysisData}{Fully constructed analytic data.}
}
\author{
  Wade K. Copeland
}
\examples{
  #Some random samples
  set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 40, nG2 = 40, cut = 0.5, all = FALSE, seed = 12345)
  
  #No covariates
  myData_nocov <- analysisDataSetup(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = set40$shortSurvivors,
    sampleIDsG2 = set40$longSurvivors,
    covariates = NULL,
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors (no covariates)",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
    
  #With covariates
  myData_cov <- analysisDataSetup(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = set40$shortSurvivors,
    sampleIDsG2 = set40$longSurvivors,
    covariates = c("ageAtDx", "FirstProgression"),
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors (with covariates)",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
}
\keyword{documentation}