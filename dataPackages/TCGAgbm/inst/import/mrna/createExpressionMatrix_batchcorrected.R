load("../../../../RawData/TCGAbrain/combatAdjustedExp654gdBatchesNormLGGNormGBM.RData")
table.mrna <- adjustedExpCombat
## 18641 genes x 654 samples 

load("../../../../RawData/TCGAgbm/allExp172SampleIDsGBM.RData")
gbm.exp.samples <- intersect(colnames(table.mrna), samplesGBM)

table.mrna <- table.mrna[,gbm.exp.samples]
mtx.mrna.bc <- t(table.mrna)

checkEquals(dim(mtx.mrna.bc), c(141, 18641))
  # all good values
checkEquals(length(which(is.na(mtx.mrna.bc))), 0)
checkEquals(fivenum(mtx.mrna.bc), c(-0.7501015,  0.5033209,  1.0399559,  1.4946679,  2.8348106))
                                 
save(mtx.mrna.bc, file="../../extdata/mtx.mrna.bc.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna), ncol(mtx.mrna))
