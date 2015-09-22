\name{tbl.mrnaUnified.TCGA.GBM}
\alias{tbl.mrnaUnified.TCGA.GBM}
\alias{tbl.mrna}
\docType{data}
\title{
  TCGA Gene Expression Data For GBM
}
\description{
  Gene expression data (mRNA) from The Cancer Genome Atlas (TCGA) for glioblastoma multiforme (GBM).
}
\usage{data("tbl.mrnaUnified.TCGA.GBM")}
\format{
  A data frame with 315 observations and 11,864 genes with their associated gene expression.
}
\source{
  \url{https://tcga-data.nci.nih.gov/tcga/}
}
\examples{
  data("tbl.mrnaUnified.TCGA.GBM")
  dim(tbl.mrna)
  tbl.mrna[1:5, 1:5]
}
\keyword{datasets}
