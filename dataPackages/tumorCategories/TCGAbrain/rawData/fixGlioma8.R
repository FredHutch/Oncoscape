library(RUnit)
new.names <- c("nonCIMP.gainNRAS.mutTP53",
               "nonCIMP.gainNRAS.wtTP53",
               "nonCIMP.wtNRAS.wtTP53",
               "nonCIMP.wtNRAS.mutTP53",
               "lggCIMP.not1p19q.mutATRX.mutTP53",
               "lggCIMP.not1p19q.wtATRX.mutTP53",
               "lggCIMP.del1p19q.mutCIC.mutFUBP1",
               "lggCIMP.del1p19q.wtCIC.wtFUBP1")

file <- "../../../TCGAbrain/inst/extdata/ericsEightGliomaClusters.RData"
checkTrue(file.exists(file))
print(load(file))
table(tbl.glioma8$cluster)
tbl.glioma8$cluster <- as.integer(tbl.glioma8$cluster)  # 
checkEquals(sort(unique(tbl.glioma8$cluster)), 1:(length(new.names)))
tbl.glioma8$cluster <- new.names[tbl.glioma8$cluster]


# now change any red or reddish colors to something which won't be taken as the cyjs selection color
color <- tbl.glioma8$color
table(color)
unique(grep("red", color, v=TRUE, ignore.case=TRUE))
color <- sub("darkred", "chartreuse", color)
color <- sub("red",     "aquamarine", color)

tbl.glioma8$color <- color
# take a look at some random rows
tbl.glioma8[sample(1:nrow(tbl.glioma8), 10),]

save(tbl.glioma8, file=file)
