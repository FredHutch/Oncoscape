#----------------------------------------------------------------------------------------------------
.ChinookPCA <- setClass ("ChinookPCA", 
                           contains = "ChinookAnalysis"
                           )

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
    printf("starting ChinookPCA ctor")
    obj <- .ChinookPCA(ChinookAnalysis(name="PCA"))
    setServer(obj, server)
    registerMessageHandlers(obj)

    printf("leaving ChinookPCA ctor")
    local.state[["self"]] <- obj
    obj

} # Chinook constructor
#----------------------------------------------------------------------------------------------------
setMethod("registerMessageHandlers", "ChinookPCA",

  function (obj) {
     addMessageHandler(getServer(obj), "createPCA",    "PCA.create")
     addMessageHandler(getServer(obj), "calculatePCA", "PCA.calculate")
     })

#----------------------------------------------------------------------------------------------------
PCA.create <- function(channel, msg)
{
   printf("--- entering PCA.create");
   datasetName <- msg$payload$datasetName
   matrixName  <- msg$payload$matrixName

      # need to instantiate dataset
      # might want to store (cache) the instantiation on the Chinook server

   server <- getServer(local.state[["self"]])
   
   printf("%s loaded in server? ", datasetName %in% getDatasetNames(server))
          
   dataset <- getDataset(server, datasetName)
   cmd <- sprintf("mypca <- PCA(dataset, '%s')",  matrixName);
   printf("   PCA.create cmd: |%s|", cmd)
   eval(parse(text=cmd))
   local.state[["pca"]] <- mypca
   
   payload <- sprintf("PCA(%s(), '%s') version %s created", datasetName, matrixName,
                      sessionInfo()$otherPkgs$PCA$Version)
   response <- jsonlite::toJSON(list(cmd=msg$callback, callback="", status="success", payload=payload),
                                auto_unbox=TRUE)

   if("WebSocket" %in% is(channel))
      channel$send(response)
   else
      return(response)

} # PCA.create
#----------------------------------------------------------------------------------------------------
PCA.calculate <- function(channel, msg)
{
   mypca <- local.state[["pca"]]

   genes <- NA
   samples <- NA
   
   x <- calculate(mypca, genes, samples)
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
