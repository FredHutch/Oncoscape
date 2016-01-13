library(RUnit)
file <- "../../../TCGAbrain/inst/extdata/metabolicExpressionStemness.RData"
print(load(file))
table(tbl.expression$color)
color.fixed <- sub("red", "lime", tbl.expression$color)
table(color.fixed)
tbl.expression$color <- color.fixed
save(tbl.expression, file=file)
