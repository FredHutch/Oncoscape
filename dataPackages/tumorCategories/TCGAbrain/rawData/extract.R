library(RUnit)

tbl.gbm <- read.table("clinical_patient_gbm.txt", sep="\t", header=TRUE, as.is=TRUE)

# eliminate extra column heading info
tbl.gbm <- tbl.gbm[-c(1,2),]
dim(tbl.gbm)

# maybe this is the appropriate column?
table(tbl.gbm$histological_type)
#  Glioblastoma Multiforme (GBM)             Treated primary GBM Untreated primary (de novo) GBM 
#                             27                              20                             545 
# 
checkEquals(sum(as.data.frame(table(tbl.gbm$histological_type))$Freq), nrow(tbl.gbm))


tbl.lgg <- read.table("nationwidechildrens.org_clinical_patient_lgg.txt", sep="\t", header=TRUE, as.is=TRUE)
# eliminate extra column heading info
tbl.lgg <- tbl.lgg[-c(1,2),]
dim(tbl.lgg)
table(tbl.lgg$histologic_diagnosis)
#      Astrocytoma  Oligoastrocytoma Oligodendroglioma 
#              171               114               174
checkEquals(sum(as.data.frame(table(tbl.lgg$histologic_diagnosis))$Freq), nrow(tbl.lgg))

# make a simple table with these four diagnoses: 3 lgg's, one GBM
# follow the form we are already using:
# print(load("../../../TCGAgbm/inst/extdata/verhaakGbmClustersAugmented.RData"))
# [1] "tbl.verhaakPlus1"
#  head(tbl.verhaakPlus1)
#                cluster  color
# TCGA.02.0010    G-CIMP purple
# TCGA.02.0028    G-CIMP purple
# TCGA.02.0102 Classical    red
# TCGA.02.0114    G-CIMP purple
# TCGA.08.0525 Classical    red
# TCGA.12.0615 Classical    red
lgg.ids <- gsub("-", ".", tbl.lgg$bcr_patient_barcode, fixed=TRUE)
# no duplicates
checkEquals(length(lgg.ids), length(unique(lgg.ids)))
# all of the same and proper length, in this form: "TCGA.CS.6290"
checkEquals(unique(nchar(lgg.ids)), 12)
diagnosis <- tbl.lgg$histologic_diagnosis
checkEquals(length(diagnosis), length(lgg.ids))
checkEquals(length(unique(diagnosis)), 3)
# create color vectors
astrocytoma.rows <- which(diagnosis == "Astrocytoma")
oligoastrocytoma.rows <- which(diagnosis == "Oligoastrocytoma")
oligodendroglioma.rows <- which(diagnosis == "Oligodendroglioma")
checkEquals(length(unique(c(astrocytoma.rows, oligoastrocytoma.rows, oligodendroglioma.rows))), nrow(tbl.lgg))
color <- rep("", length(lgg.ids))
color[astrocytoma.rows] <- "blue"
color[oligoastrocytoma.rows] <- "green"
color[oligodendroglioma.rows] <- "goldenrod"
diag <- rep("", length(lgg.ids))
diag[astrocytoma.rows] <- "Astrocytoma"
diag[oligoastrocytoma.rows] <- "Oligoastrocytoma"
diag[oligodendroglioma.rows] <- "Oligodendroglioma"
diagnosis <- data.frame(diagnosis=diag, color=color, stringsAsFactors=FALSE)
rownames(diagnosis) <- lgg.ids


# now work up the gbm ids: with just one diagnosis, just one color
gbm.ids <- gsub("-", ".", tbl.gbm$bcr_patient_barcode, fixed=TRUE)
# no duplicates
checkEquals(length(gbm.ids), length(unique(gbm.ids)))
# all of the same and proper length, in this form: "TCGA.CS.6290"
checkEquals(unique(nchar(gbm.ids)), 12)
color <- rep("DarkViolet", length(gbm.ids))
diag <- rep("GBM", length(gbm.ids))
tbl2 <- data.frame(diagnosis=diag, color=color, stringsAsFactors=FALSE)
rownames(tbl2) <- gbm.ids
diagnosis <- rbind(tbl2, diagnosis)
checkEquals(nrow(diagnosis), sum(length(gbm.ids), length(lgg.ids)))

# spot check one tumor from each group
id <- gsub("-", ".", subset(tbl.lgg, histologic_diagnosis == "Astrocytoma")$bcr_patient_barcode[1], fixed=TRUE)
checkEquals(diagnosis[id, "diagnosis"], "Astrocytoma")
checkEquals(diagnosis[id, "color"], "blue")

id <- gsub("-", ".", subset(tbl.lgg, histologic_diagnosis == "Oligoastrocytoma")$bcr_patient_barcode[1], fixed=TRUE)
checkEquals(diagnosis[id, "diagnosis"], "Oligoastrocytoma")
checkEquals(diagnosis[id, "color"], "green")

id <- gsub("-", ".", subset(tbl.lgg, histologic_diagnosis == "Oligodendroglioma")$bcr_patient_barcode[1], fixed=TRUE)
checkEquals(diagnosis[id, "diagnosis"], "Oligodendroglioma")
checkEquals(diagnosis[id, "color"], "goldenrod")

id <- gsub("-", ".", sample(tbl.gbm$bcr_patient_barcode, 1))
checkEquals(diagnosis[id, "diagnosis"], "GBM")
checkEquals(diagnosis[id, "color"], "DarkViolet")

save(diagnosis, file="../../../TCGAbrain/inst/extdata/tumorDiagnosis.RData")
