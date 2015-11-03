tbl.dgi <- read.table("DGIdb-interactions.tsv", sep="\t", header=TRUE, as.is=TRUE, quote="")
genes.dgi <- sort(unique(tbl.dgi[,1]))
#genes.dgi.onco <- intersect(genes.oncoplex, genes.dgi)
#tbl.dgi <- subset(tbl.dgi, entrez_gene_symbol %in% genes.dgi.onco)

# colnames(tbl.dgi)
# [1] "entrez_gene_symbol"       "gene_long_name"           "interaction_claim_source"
# [4] "interaction_types"        "drug_name"                "drug_primary_name"       

tbl.dgi <- tbl.dgi[,c("entrez_gene_symbol",  "drug_primary_name", "drug_name",
                      "interaction_types", "interaction_claim_source")]
colnames(tbl.dgi) <- c("gene", "drug", "drugID", "interaction", "source")
save(tbl.dgi, file="tbl.dgi.RData")
