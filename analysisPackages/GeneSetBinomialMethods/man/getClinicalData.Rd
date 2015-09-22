\name{getClinicalData}
\alias{getClinicalData}
\title{
  TCGA Clinical Data Accessor Function
}
\description{
  Accessor function that invisibly returns the TCGA clinical data from an object of class \code{GeneSetBinomialMethods}.
}
\usage{
  getClinicalData(obj)
}
%- maybe also 'usage' for other objects documented here.
\arguments{
  \item{obj}{object of class \code{GeneSetBinomialMethods}}
}
\author{
Wade K. Copeland
}
\seealso{
  \link{tbl.clinical}, \link{GeneSetBinomialMethods-class}
}
\examples{
  obj <- GeneSetBinomialMethods()
  dim(getClinicalData(obj))
  getClinicalData(obj)[1:5, 1:5]
}
\keyword{data}
\keyword{datasets}