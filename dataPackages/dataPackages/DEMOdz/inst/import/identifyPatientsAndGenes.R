# identifyPatientsAndGenes.R
# for this example data package, we need a small number of patients and genes.
# the data is drawn from the TCGA GBM data used in oncoscape 1.1 and 1.2
#   the genes contain at least a few mutations
#   and their expression exhibits some variability
#   the patients were picked so that half of them are short survivors, half of them long
#
#   NA for missing values
#   sample names for rownames
#   gene symbols for colnames
#   policies yet to be worked out for gene isoforms and multiple measurements for each sample
#
#----------------------------------------------------------------------------------------------------
library(RUnit)

# hand-chosen sample ids which are found in mrna, mut, and copy number data
long.survivors <- c("TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0080", "TCGA.02.0114",
                    "TCGA.06.0409", "TCGA.08.0344", "TCGA.12.0656", "TCGA.06.0125", "TCGA.02.0432")


short.survivors <- c("TCGA.12.0657", "TCGA.06.0140", "TCGA.06.0402", "TCGA.06.0201", "TCGA.06.0747",
                     "TCGA.06.0749", "TCGA.02.0033", "TCGA.06.0413", "TCGA.02.0037", "TCGA.06.0182")

# find all common genes, all common samples
print(load("~/oncodev/hbolouri/oncoDev12/Oncoscape/inst/extdata/tcgaGBM/mrnaGBM-304patients-1375genes.RData"))
print(load("~/oncodev/hbolouri/oncoDev12/Oncoscape/inst/extdata/tcgaGBM/mutGBM-574patients-1582genes.RData"))
print(load("~/oncodev/hbolouri/oncoDev12/Oncoscape/inst/extdata/tcgaGBM/cnvGBM-563patients-1582genes.RData"))

goi <- sort(intersect(colnames(tbl.mrna), intersect(colnames(tbl.mut), colnames(tbl.cn))))
checkEquals(length(goi), 1290)



soi <- sort(intersect(rownames(tbl.mrna), intersect(rownames(tbl.mut), rownames(tbl.cn))))
checkEquals(length(soi), 297)

checkTrue(all(short.survivors %in% soi))
checkTrue(all(long.survivors %in% soi))

patients <- sort(c(short.survivors, long.survivors))

mtx.mrna <- as.matrix(tbl.mrna[patients,])
checkEquals(dim(mtx.mrna), c(20, 1375))
  # all good values
checkEquals(length(which(is.na(mtx.mrna))), 0)
checkEquals(fivenum(mtx.mrna), c(-4.1935652, -0.7241125, -0.0369353,  0.6967585, 7.8256909))
                                 
  # identify the most variable genes
sd <- apply(mtx.mrna[, goi], 2, function(row) sd(row, na.rm=TRUE))

 # get the 54 most variable genes
genes <- sort(names(sort(sd, decreasing=TRUE))[1:54])
mtx.mut <- as.matrix(tbl.mut)
most.mutated.genes <- names(head(sort(apply(mtx.mut, 2, function(col) length(which(!is.na(col)))), decreasing=TRUE), n=80))
genes <- sort(intersect(most.mutated.genes, goi)[1:64])

checkEquals(length(genes), 64)
save(patients, genes, file="sharedPatientsAndGenes.RData")
printf("saved patients (%d), genes (%d)", length(patients), length(genes))
