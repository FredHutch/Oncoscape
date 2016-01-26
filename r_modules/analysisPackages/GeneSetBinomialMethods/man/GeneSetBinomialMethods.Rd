\name{GeneSetBinomialMethods}
\alias{GeneSetBinomialMethods}
\title{
  Constructor Function For Objects of Class \code{GeneSetBinomialMethods}
}
\description{
  \code{GeneSetBinomialMethods()} is a constructor function for \link{GeneSetBinomialMethods-class}.
}
\usage{
  GeneSetBinomialMethods()
}
\value{
  Returns an object of class \code{GeneSetBinomialMethods} that contains all the data \link{tbl.mrna}, \link{tbl.clinical} and \link{genesets}.
}
\author{
  Wade K. Copeland
}
\seealso{
  \link{tbl.mrna}, \link{tbl.clinical}, \link{genesets}
}
\examples{
  #Create the object
  obj <- GeneSetBinomialMethods()
  
  #clinical data
  dim(obj@tbl.clinical)
  obj@tbl.clinical[1:5, 1:5]
  
  #gene expression data
  dim(obj@tbl.mrna)
  obj@tbl.mrna[1:5, 1:5]
  
  #genesets from MSigDB
  head(names(obj@genesets))
  obj@genesets[["CYTOPLASMIC_VESICLE_MEMBRANE"]]
}
\keyword{data}
\keyword{datasets}
