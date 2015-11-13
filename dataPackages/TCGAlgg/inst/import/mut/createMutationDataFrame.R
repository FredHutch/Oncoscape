# createMatrix.R
# the mrna comes from cBio 2013 TCGA gbm expression data set
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

table.mut <- read.table(file="../../../../RawData/TCGAgbm/mysql_cbio_mut.txt", header=T, as.is=T)
## 10572 samples x gene protein changes

samples <- unique(table.mut[,"sample_id"])
sample.tbl <- read.delim(file="../../../../RawData/TCGAgbm/mysql_cbio_samples.txt", header=T, as.is=T, sep="\t")
BarcodeSample <- sample.tbl[match(samples, sample.tbl[,1]), 2]
BarcodeSample <- gsub("\\-", "\\.", BarcodeSample)
## 289 samples

EntrezGenes <- unique(table.mut[,"entrez_gene_id"])
genes.tbl <- read.delim(file="../../../../RawData/mysql_cbio_genes.txt", header=T, as.is=T, sep="\t")
HugoGenes <- genes.tbl[match(EntrezGenes, genes.tbl[,1]), 2]
## 6154 genes

mtx.mut <- matrix("", nrow = length(samples),ncol=length(EntrezGenes))
dimnames(mtx.mut) <- list(samples,EntrezGenes)

for(pt in samples){
  changes <- which(table.mut$sample_id == pt)
  pt.genes <- table.mut[changes, "entrez_gene_id"]
  pt.mut <- table.mut[changes, "protein_change"]

  duplicated.genes <- which(duplicated(pt.genes))
  if(length(duplicated.genes) >0){

    dup.gene.ids <- unique(pt.genes[duplicated.genes])
    orig.gene <- sapply(dup.gene.ids, function(gene){
      which(pt.genes == gene)[1]
    })
    uniq.mut <- sapply(dup.gene.ids, function(gene) {
       paste(pt.mut[which(pt.genes == gene)], collapse=";")
    })
    
    pt.mut[orig.gene] <- uniq.mut
    pt.genes <- pt.genes[-duplicated.genes]
    pt.mut <- pt.mut[-duplicated.genes]
  }
  mtx.mut[as.character(pt),sapply(pt.genes, as.character)] <- pt.mut 
}

dimnames(mtx.mut) <- list(BarcodeSample,HugoGenes)

checkEquals(mtx.mut["TCGA.DU.6402.01", "EXPH5"], "T1234R;L1517I")
checkEquals(mtx.mut["TCGA.DU.6402.01", "HCN4"], "P890S;P890L")
checkEquals(mtx.mut["TCGA.DU.6402.01", "NF1"], "D559fs;L2081*")
checkEquals(mtx.mut["TCGA.E1.5322.01", "TULP4"], "")

checkEquals(dim(mtx.mut), c(289, 6154))
checkEquals(length(which(is.na(mtx.mut))), 0)   # all null values stored as emptry strings - no NAs

checkTrue(all(unlist(lapply(mtx.mut, class), use.names=FALSE) == "character"))
save(mtx.mut, file="../../extdata/mtx.mut.RData")
