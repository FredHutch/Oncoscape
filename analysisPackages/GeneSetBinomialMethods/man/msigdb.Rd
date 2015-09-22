\name{msigdb}
\alias{msigdb}
\alias{genesets}
\docType{data}
\title{
  Genesets From MSigDB
}
\description{
  A list of all of the genesets from MSigDB.
}
\usage{data("msigdb")}
\format{
  A list of length 10,295.
}
\source{
\url{http://www.broadinstitute.org/gsea/msigdb/index.jsp}
}
\examples{
  data("msigdb")
  head(names(genesets))
  genesets[["CYTOPLASMIC_VESICLE_MEMBRANE"]]
}
\keyword{datasets}