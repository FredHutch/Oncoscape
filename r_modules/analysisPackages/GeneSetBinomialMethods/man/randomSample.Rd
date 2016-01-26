\name{randomSample}
\alias{randomSample}
\title{
  Take a Random Sample From The TCGA Gene Expression Data
}
\description{
  This is a utility function to create random samples from the TCGA data to use with methods in \pkg{GeneSetBinomialMethods}.
}
\usage{
  randomSample(obj, nG1 = NULL, nG2 = NULL, cut  = 0.5, all = FALSE, seed = sample(.Random.seed, 1))
}
\arguments{
  \item{obj}{Object of class code{GeneSetBinomialMethods}.}
  \item{nG1}{Integer specifying the sample size of group 1.}
  \item{nG2}{Integer specifying the sample size of group 2.}
  \item{cut}{Real value specifying the long versus short survival cut point.}
  \item{all}{Logical value to use all of the subjects instead of fixed group sizes.}
  \item{seed}{Used in the function \link{set.seed}.}
}
\details{
  The intervals created by the cut values are [a,b] and (b,c] respectively.
}
\value{
  Returns a list:
  \item{shortSurvivors}{List of short survivors.}
  \item{longSurvivors}{List of long survivors.}
  \item{seed}{If the \code{all = FALSE} this displays the seed used in the random sampling.}
}
\author{
  Wade K. Copeland
}
  \examples{
  obj <- GeneSetBinomialMethods()
  
  #All samples
  setAll <- randomSample(obj = GeneSetBinomialMethods(), cut = 0.5, all = TRUE)
  
  #40 subjects in each group
  set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 40, nG2 = 40, cut = 0.5, all = FALSE, seed = 123)
  
  #nG1 and nG2 are truncated
  nG1_nG2_truncated <- suppressWarnings(randomSample(obj = GeneSetBinomialMethods(), nG1 = 500, nG2 = 500, cut = 0.5, all = FALSE, seed = 123))
}
\keyword{documentation}