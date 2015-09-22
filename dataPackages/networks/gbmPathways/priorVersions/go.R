library(jsonlite)
#------------------------------------------------------------------------------------------------------------------------
# we have the json file, and the tsv file from which it was apparently generated.
# both are read here; i hope that the tsv file reflects what we see in oncoDev12, in the gbmPathways tab
# here we write out the same two files used for the egfr network script:
#     interactions.tsv:  a, b, type
#     nodeTypes.tsv:  node, type (for each of the unique(c(a, b)) from interactions.tsv)
digest.raw.data.from.tsv <- function()
{
   f <- "curatedGBMpathways.adaptedForReadingInR"
   x <- fromJSON(f)
   names(x) #  "format_version", "generated_by", "target_cytoscapejs_version", "data", "elements"
   names(x$elements) # "nodes" "edges"
   dim(x$elements$nodes$data)  # [1] 156  12
   tbl.raw <- x$elements$nodes$data
   colnames(tbl.raw)
     #  [1] "id"            "mut"           "SUID"          "cnv"           "score"         "label"        
     #  [7] "selected"      "canonicalName" "name"          "geneSymbol"    "nodeType"      "shared_name"
   dim(x$elements$edges$data)  # [1] 201  13

   tbl.raw <- read.table("network.tsv", sep="\t", header=TRUE, as.is=TRUE)
   tbl <- tbl.raw[, 1:3]
   colnames(tbl) <- c("a", "b", "type")
   printf("writing interactions.tsv, %d rows, %d cols: %s", nrow(tbl), ncol(tbl), paste(colnames(tbl), collapse=","))
   write.table(tbl, file="interactions.tsv", sep="\t", row.names=FALSE, quote=FALSE)
   nodeTypes.a <- tbl.raw[, c("a", "a.type")]
   colnames(nodeTypes.a) <- c("node", "type")
   nodeTypes.b <- tbl.raw[, c("b", "b.type")]
   colnames(nodeTypes.b) <- c("node", "type")
   nodeTypes <- unique(rbind(nodeTypes.a, nodeTypes.b))
   printf("writing    nodeTypes.tsv, %d rows, %d cols: %s", nrow(nodeTypes), ncol(nodeTypes), paste(colnames(nodeTypes), collapse=","))
   write.table(nodeTypes, file="nodeTypes.tsv", sep="\t", quote=FALSE, row.names=FALSE)

} # digest.raw.data.from.tsv
#------------------------------------------------------------------------------------------------------------------------
extract.positions.from.json <- function()
{
   f <- "curatedGBMpathways.adaptedForReadingInR"
   x <- fromJSON(f)
   names(x) #  "format_version", "generated_by", "target_cytoscapejs_version", "data", "elements"
   names(x$elements) # "nodes" "edges"
   dim(x$elements$nodes$data)  # [1] 156  12
   tbl.raw <- x$elements$nodes$data
   colnames(tbl.raw)
     #  [1] "id"            "mut"           "SUID"          "cnv"           "score"         "label"        
     #  [7] "selected"      "canonicalName" "name"          "geneSymbol"    "nodeType"      "shared_name"
   dim(x$elements$edges$data)  # [1] 201  13
   tbl.pos <- cbind(x$elements[[1]]$data, x$elements[[1]]$position, stringsAsFactors=FALSE)[, c("name", "x", "y")]
   printf("writing    positions.tsv, %d rows, %d cols: %s", nrow(tbl.pos), ncol(tbl.pos), paste(colnames(tbl.pos), collapse=","))   
   write.table(tbl.pos, file="positions.tsv", sep="\t", quote=FALSE, row.names=FALSE)
    
} # extract.positions.from.json
#------------------------------------------------------------------------------------------------------------------------
if(!interactive()){
   digest.raw.data.from.tsv()
   extract.positions.from.json()
   }
