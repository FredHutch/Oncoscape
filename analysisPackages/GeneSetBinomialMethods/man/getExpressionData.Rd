\name{getExpressionData}
\alias{getExpressionData}
\title{
  TCGA Gene Expression Accessor Function
}
\description{
  Accessor function that invisibly returns the TCGA gene expression data from an object of class \code{GeneSetBinomialMethods}.
}
\usage{
  getExpressionData(obj)
}
%- maybe also 'usage' for other objects documented here.
\arguments{
  \item{obj}{object of class \code{GeneSetBinomialMethods}}
}
\author{
Wade K. Copeland
}
\seealso{
  \link{tbl.mrna}, \link{GeneSetBinomialMethods-class}
}
\examples{
  obj <- GeneSetBinomialMethods()
  dim(getExpressionData(obj))
  getExpressionData(obj)[1:5, 1:5]
}
\keyword{data}
\keyword{datasets}