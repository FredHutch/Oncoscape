#------------------------------------------------------------------------------------------------------------------------
library(org.Hs.eg.db)
library(RCyjs)
#------------------------------------------------------------------------------------------------------------------------
tbl <- read.table("interactions.tsv", sep="\t", header=TRUE, as.is=TRUE)
nodeTypes <- read.table("nodeTypes.tsv", sep="\t", header=TRUE, as.is=TRUE)
tbl.pos <- read.table("positions.tsv", sep="\t", header=TRUE, as.is=TRUE)
colnames(tbl.pos) <- c("id", "x", "y")
tbl.pos$x <- as.numeric(tbl.pos$x)
tbl.pos$y <- as.numeric(tbl.pos$y)
#oncoplex.genes <- scan("../../UWlungMarkersAndTissues/prep/oncoplexGenes.txt", what=character(0), sep="\n", quiet=TRUE)
#load("~/s/examples/clustering/ttest.msigdb/msigdb.RData")
#reactome.egfr.genes <- genesets[["REACTOME_SIGNALING_BY_EGFR_IN_CANCER"]]
#------------------------------------------------------------------------------------------------------------------------
make <- function()
{
   reload();
   run(c(0:2))
   #export()
   #run(c(0, 1, 3, 2))

} # make
#------------------------------------------------------------------------------------------------------------------------
run <- function(levels)
{
  if(0 %in% levels){
    g <<- createGraphFromTable(tbl);
    }

  if(1 %in% levels){
     rcy <<- RCyjs(portRange=9047:9087, quiet=TRUE, graph=g)
     }

  if(2 %in% levels){
     restoreLayout(rcy, "contractedLayout")
     fitContent(rcy); setZoom(rcy, 0.9 * getZoom(rcy))
     httpSetStyle(rcy, "style.js")
     }
  
  if(3 %in% levels){
    for(i in 1:nrow(tbl.pos))
       setPosition(rcy, tbl.pos[i,])
    } # 3

  if ("export" %in% levels) {
    fitContent(rcy); setZoom(rcy, 0.85 * getZoom(rcy))
    #hideAllEdges(rcy)
    g.egfr.json <- getJSON(rcy);
    print(nchar(g.egfr.json));
    save(g.egfr.json, file="egfr.json.RData")
    } # export

} # run
#------------------------------------------------------------------------------------------------------------------------
createGraphFromTable <- function(tbl)
{

  all.nodes <- sort(unique(c(tbl$a, tbl$b)))
  g <- graphNEL(nodes=all.nodes, edgemode="directed")
  
  nodeDataDefaults(g, attr="nodeType") <- "unassigned"
  nodeDataDefaults(g, attr="label") <- "unassigned"
  nodeDataDefaults(g, attr="parent") <- ""
  edgeDataDefaults(g, attr="edgeType") <- "unassigned"
  edgeDataDefaults(g, attr="pmid") <- "unassigned"

  tbl.filtered <- subset(tbl, type != "contains");
  g <- addEdge(tbl$a, tbl$b, g)
  nodeData(g, nodeTypes$node, "nodeType") <- nodeTypes$type
     # allow multiple instances of the same molecule, distinguished by ".n" suffix to have the same label
  labels <- gsub("\\.[1-9]$", "", nodeTypes$node) 
  nodeData(g, nodeTypes$node,  "label") <- labels

  tbl.compound <- subset(tbl, type == "contains");
  if(nrow(tbl.compound) > 0)
     nodeData(g, tbl.compound$b, "parent") <- tbl.compound$a

  edgeData(g, tbl$a, tbl$b, "edgeType") <- tbl$type
  edgeData(g, tbl$a, tbl$b, "pmid") <- tbl$pmid

  g

} # createGraphFromTable
#------------------------------------------------------------------------------------------------------------------------
export <- function()
{
  fitContent(rcy); setZoom(rcy, 0.95 * getZoom(rcy))
  g.gbmPathways.json <- getJSON(rcy);
  print(nchar(g.gbmPathways.json));
  save(g.gbmPathways.json, file="gbmPathways.json.RData")

} # export
#------------------------------------------------------------------------------------------------------------------------
vAlign <- function()
{
  alignSelectedNodes("vertical")
  
} # vAlign
#------------------------------------------------------------------------------------------------------------------------
hAlign <- function()
{
  alignSelectedNodes("horizontal")
  
} # hAlign
#------------------------------------------------------------------------------------------------------------------------
alignSelectedNodes <- function(axis)
{
  
   selectedNodes <- getSelectedNodes(rcy)$id

   if(length(selectedNodes) < 2){
     printf("select 2 or more nodes");
     return;
      }
   
  tbl.pos <- getPosition(rcy, selectedNodes)
  if(axis == "vertical"){
     x.mean <- sum(tbl.pos$x)/nrow(tbl.pos)
     tbl.pos$x <- x.mean
     }

  else{
     y.mean <- sum(tbl.pos$y)/nrow(tbl.pos)
     tbl.pos$y <- y.mean
    }
   
  setPosition(rcy, tbl.pos)

    
} # alignSelectedNodes
#------------------------------------------------------------------------------------------------------------------------
readPrior <- function()
{
   library(jsonlite)
   f <- "../priorVersions/curatedGBMpathways.adaptedForReadingInR"
   x <- fromJSON(f)
   names(x) #  "format_version", "generated_by", "target_cytoscapejs_version", "data", "elements"
   names(x$elements) # "nodes" "edges"
   dim(x$elements$nodes$data)  # [1] 156  12
   tbl <- x$elements$nodes$data
   colnames(tbl)
     #  [1] "id"            "mut"           "SUID"          "cnv"           "score"         "label"        
     #  [7] "selected"      "canonicalName" "name"          "geneSymbol"    "nodeType"      "shared_name"
   dim(x$elements$edges$data)  # [1] 201  13
   tbl.edges <- x$elements$edges$data     


} # readPrior
#------------------------------------------------------------------------------------------------------------------------
if(!interactive())
    make()

