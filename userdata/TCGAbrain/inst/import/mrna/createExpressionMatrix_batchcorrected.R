require(RUnit)
load("../../../../RawData/TCGAbrain/combatAdjustedExp654gdBatchesNormLGGNormGBM.RData")
table.mrna <- adjustedExpCombat
## 18641 genes x 654 samples 

mtx.mrna.bc <- t(table.mrna)

checkEquals(dim(mtx.mrna.bc), c(654, 18641))
  # all good values
checkEquals(length(which(is.na(mtx.mrna.bc))), 0)
checkEquals(fivenum(mtx.mrna.bc), c(-0.7501015, 0.4935667, 1.0289391, 1.5074960, 2.8348106), tolerance=1e-5)
                                 
save(mtx.mrna.bc, file="../../extdata/mtx.mrna.bc.RData")
printf("saved mtx.mrna (%d, %d) to parent directory", nrow(mtx.mrna), ncol(mtx.mrna))
