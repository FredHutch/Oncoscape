\name{tbl.ptHistory}
\alias{tbl.ptHistory}
\alias{tbl.clinical}
\docType{data}
\title{
  TCGA Clinical Data For GBM
}
\description{
  Clinical data from The Cancer Genome Atlas (TCGA) for glioblastoma multiforme (GBM).
}
\usage{data("tbl.ptHistory")}
\format{
  A data frame with 583 observations and 13 clinical data variables.
}
\source{
  \url{https://tcga-data.nci.nih.gov/tcga/}
}
\examples{
  data("tbl.ptHistory")
  dim(tbl.clinical)
  tbl.clinical[1:5, 1:5]
}
\keyword{datasets}
