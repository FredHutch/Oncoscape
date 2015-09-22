# createMatrix.R
# this simple script creates an intentionally small numerical matrix with highly variable
# genes, 10 long surviving patients, and 10 short.
# the patients were obtained manually from the oncoscape demo clinical data table.
# the mrna comes from the set the "unified" TCGA GBM expression data set
# the serialized result is written to extdata, as a numerical matrix  conforming to
# oncoscape protocols:
#
#   NA for missing values
#   sample names for rownames
#   gene symbols for colnames
#   policies yet to be worked out for gene isoforms and multiple measurements for each sample
#
#----------------------------------------------------------------------------------------------------
library(RUnit)
load("../sharedPatientsAndGenes.RData")
load("../../../../../oncoDev12/Oncoscape/inst/extdata/tcgaGBM/mutGBM-574patients-1582genes.RData")
mtx.mut <- as.matrix(tbl.mut)
mtx.mut[mtx.mut == "NaN"] = NA
mtx.mut <- mtx.mut[patients, genes]
  # which genes are most mutated?
checkEquals(dim(mtx.mut), c(20, 64))
checkEquals(length(which(!is.na(mtx.mut))), 7)   # only 7 mutations

#tbl.mut <- as.data.frame(mtx.mut, stringsAsFactors=FALSE)
#checkTrue(all(unlist(lapply(tbl.mut, class), use.names=FALSE) == "character"))
#save(tbl.mut, file="../../extdata/tbl.mut.RData")

### using matrix for mutation data 2-27-15
checkTrue(all(unlist(lapply(mtx.mut, class), use.names=FALSE) == "character"))
save(mtx.mut, file="../../extdata/mtx.mut.RData")

