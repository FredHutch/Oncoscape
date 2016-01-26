\name{getGeneSets}
\alias{getGeneSets}
\title{
  MSigDB Accessor Function
}
\description{
  Accessor function that invisibly returns the MSigDB gene sets from an object of class \code{GeneSetBinomialMethods}.
}
\usage{
  getGeneSets(obj)
}
%- maybe also 'usage' for other objects documented here.
\arguments{
  \item{obj}{object of class code{GeneSetBinomialMethods}}
}
\author{
Wade K. Copeland
}
\seealso{
  \link{genesets}, \link{GeneSetBinomialMethods-class}
}
\examples{
  obj <- GeneSetBinomialMethods()
  head(names(getGeneSets(obj)))
  getGeneSets(obj)[["CYTOPLASMIC_VESICLE_MEMBRANE"]]
}
\keyword{data}
\keyword{datasets}