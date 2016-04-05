\name{GeneSetBinomialMethods-class}
\Rdversion{1.1}
\docType{class}
\alias{GeneSetBinomialMethods-class}
\title{
  Class \code{GeneSetBinomialMethods}
}
\description{
  Use \code{GeneSetBinomialMethods()} to create and object of class \code{GeneSetBinomialMethods} that contains all supported data, including \link{tbl.mrna}, \link{tbl.clinical} and \link{genesets}.
}
\section{Objects from the Class}{
  Objects can be created by calls of the form \code{new("GeneSetBinomialMethods", ...)}. 
}
\section{Slots}{
  \describe{
    \item{\code{tbl.mrna}:}{Object of class \code{"matrix"}}
    \item{\code{tbl.clinical}:}{Object of class \code{"data.frame"}}
    \item{\code{genesets}:}{Object of class \code{"list"}}
  }
}
\section{Methods}{
  \describe{
    \item{analysisDataSetup}{\code{signature(obj = "GeneSetBinomialMethods")}: ... }
    \item{getClinicalData}{\code{signature(obj = "GeneSetBinomialMethods")}: ... }
    \item{getExpressionData}{\code{signature(obj = "GeneSetBinomialMethods")}: ... }
    \item{getGeneSets}{\code{signature(obj = "GeneSetBinomialMethods")}: ... }
    \item{randomSample}{\code{signature(obj = "GeneSetBinomialMethods")}: ... }
	 }
}
\author{
  Wade K. Copeland
}
\seealso{
  \link{GeneSetBinomialMethods}
}
\examples{
  showClass("GeneSetBinomialMethods")
}
\keyword{classes}
