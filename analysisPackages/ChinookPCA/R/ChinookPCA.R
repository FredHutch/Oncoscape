#----------------------------------------------------------------------------------------------------
.ChinookPCA <- setClass ("ChinookPCA", contains = "ChinookAnalysis")
#----------------------------------------------------------------------------------------------------
# only functions - not methods - can be dispatched to in a web socket handler.
# since these functions sometimes need information and operations which properly belong
# to instances of the class specified here, we create (and seal within this package) 
# the "local.state" environment, so that called-back functions have access to all that they need

local.state <- new.env(parent=emptyenv())
#----------------------------------------------------------------------------------------------------
# constructor
ChinookPCA <- function(server)
{
    #printf("starting ChinookPCA ctor")
    obj <- .ChinookPCA(ChinookAnalysis(name="PCA"))
    setServer(obj, server)
    registerMessageHandlers(obj)

    #printf("leaving ChinookPCA ctor")
    local.state[["self"]] <- obj
    obj

} # Chinook constructor
#----------------------------------------------------------------------------------------------------
setMethod("registerMessageHandlers", "ChinookPCA",

  function (obj) {
     addMessageHandler(getServer(obj), "calculatePCA", "PCA.calculate")
     })

#----------------------------------------------------------------------------------------------------
PCA.calculate <- function(channel, msg)
{
   #printf("---- entering PCA.calculate")
   #print(msg)
   datasetName <- msg$payload$datasetName
   matrixName  <- msg$payload$matrixName
   genesetName <- msg$payload$geneset
   if(length(genesetName) == 0)
      genesetName <- NA
   else if(nchar(genesetName) == 0)
       genesetName <- NA
   
   #print(genesetName)
   #print(length(genesetName))
   #print(nchar(genesetName))
   #printf("datasetName: %s", datasetName)
   #printf(" matrixName: %s", matrixName)
   #printf("    geneset: %s", genesetName)

      # need to instantiate dataset
      # might want to store (cache) the instantiation on the Chinook server

   server <- getServer(local.state[["self"]])
   #printf("   server:")
   #print(server)
   #printf("   --- getDatasetNames(server)")
   #print(getDatasetNames(server))
   
   #printf("%s loaded in server? ", datasetName %in% getDatasetNames(server))
          
   dataset <- getDatasetByName(server, datasetName)
   pca <- PCA(dataset, matrixName)
   groupManager <- Groups()
   if(length(genesetName) == 0)
     genes <- NA
   else if(!is.na(genesetName))
      genes <- getGroup(groupManager, genesetName)
   else
      genes <- NA
   
   x <- calculate(pca, genes, samples)
     # fashion a 3-column data.frame nicely suited to use with d3: gene, PC1, PC2
     # add two more scalar field: pc1.varianceAccountedFor, pc2.varianceAccounted for
   
   mtx.loadings <- as.matrix(x$scores[, 1:2])
   ids = x$sampleIDs;
   max.value <- max(abs(c(x$scores[,1], x$scores[,2])))
   importance.PC1 = x$importance["Proportion of Variance", "PC1"]
   importance.PC2 = x$importance["Proportion of Variance", "PC2"]
   
   payload <- list(scores=mtx.loadings, ids=ids, maxValue=max.value,
                   importance.PC1=importance.PC1,
                   importance.PC2=importance.PC2)


   response <- jsonlite::toJSON(list(cmd=msg$callback, callback="", status="success", payload=payload),
                                auto_unbox=TRUE)

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # PCA.calculate
#----------------------------------------------------------------------------------------------------
