# handlers for the PCA module
#----------------------------------------------------------------------------------------------------
addRMessageHandler("echo", "ws.pcaEchoHandler")
addRMessageHandler("createPCA", "ws.createPCA")
addRMessageHandler("calculatePCA", "ws.calculatePCA")
addRMessageHandler("requestDataTableMeta", "ws.requestDataTableMeta")
#----------------------------------------------------------------------------------------------------
ws.pcaEchoHandler <- function(ws, msg)
{
   printf("received echo request");

   if("payload" %in% names(msg))
      outgoing.payload <- sprintf("echo from PCA/inst/unitTests/runPCATestWebSocketServer.R: %s", msg$payload)
   else
      outgoing.payload <- "no incoming payload"
   

   json <- jsonlite::toJSON(list(cmd="echoBack", callback="", status="response", payload=outgoing.payload),
                            auto_unbox=TRUE)
   
   ws$send(json)

} # ws.echoHandler
#----------------------------------------------------------------------------------------------------
ws.createPCA <- function(ws, msg)
{
   printf("=== ws.createPCA, full msg:");
   print(msg)
   
   currentDataSetName <- state[["currentDatasetName"]]
   ds <- datasets[[currentDataSetName]];
   matrixName = msg$payload$matrixName
   cmd <- sprintf("mypca <- PCA(ds, '%s')", matrixName);
   eval(parse(text=cmd))
   state[["mypca"]] <- mypca
   printf("ws.createPCA just executed '%s'", cmd)
   printf("resulting mypca object:")
   print(pcaDataSummary(mypca))
   
   response <- pcaDataSummary(mypca)
   json <- jsonlite::toJSON(list(cmd=msg$callback, callback="", status="response", payload=response),
                            auto_unbox=TRUE)
   
   ws$send(json)

} # ws.createPCA
#----------------------------------------------------------------------------------------------------
ws.calculatePCA <- function(ws, msg)
{
   printf("=== ws.calculatePCA");
   print(msg)

   genes <- NA
   if("genes" %in% names(msg$payload)){
      genes <- msg$payload$genes;
      printf("gene count for calculatePCA (%d)", length(genes))
      #print(genes)
      # an artful(?) dodge:  if this is a list of genes, then they are literal genes
      # if just one, then it must be a geneSetName, and we must retrieve the genes
      if(length(genes) == 1){
         geneSetName <- genes   # to reduce ambiguity
         datasetName <- state[["currentDatasetName"]]
         dataset <- datasets[[datasetName]]
         geneSetNames <- getGeneSetNames(dataset)
         stopifnot(geneSetName %in% geneSetNames)
         genes <- getGeneSetGenes(dataset, geneSetName)
         }
      } # genes explicitly specified
   
   printf("genes for calculatePCA after possible lookup(%d)", length(genes))

   samples <- NA
   if("samples" %in% names(msg$payload))
      samples <- msg$payload$samples;
  
   currentDataSetName <- state[["currentDatasetName"]]
   ds <- datasets[[currentDataSetName]]
   matrixName = msg$payload$expressionDataSet
   cmd <- sprintf("mypca <- PCA(ds, '%s')", matrixName)
   printf("*****cmd is: %s", cmd)
   eval(parse(text=cmd))
   state[["mypca"]] <- mypca


   x <- calculate(mypca, genes, samples)
     # fashion a 3-column data.frame nicely suited to use with d3: gene, PC1, PC2
     # add two more scalar field: pc1.varianceAccountedFor, pc2.varianceAccounted for
   
   mtx.scores <- as.matrix(x$scores[, 1:2])
   ids <- x$sampleIDs
   max.value <- max(abs(c(x$scores[,1], x$scores[,2])))
   importance.PC1 = x$importance["Proportion of Variance", "PC1"]
   importance.PC2 = x$importance["Proportion of Variance", "PC2"]
   
   payload <- list(scores=mtx.scores, ids=ids, maxValue=max.value,
                   importance.PC1=importance.PC1,
                   importance.PC2=importance.PC2, geneSetName=genes)


   json <- jsonlite::toJSON(list(cmd=msg$callback, callback="", status="success", payload=payload),
                            auto_unbox=TRUE)
   ws$send(json)

} # ws.calculatePCA
#----------------------------------------------------------------------------------------------------
