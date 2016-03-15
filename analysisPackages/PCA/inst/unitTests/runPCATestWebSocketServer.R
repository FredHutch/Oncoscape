library(httpuv)
library(jsonlite)
library(PCA)
library(DEMOdz)
#----------------------------------------------------------------------------------------------------
wsCon <- new.env(parent=emptyenv())
dispatchMap <- new.env(parent=emptyenv())
#---------------------------------------------------------------------------------------------------
addRMessageHandler <- function(key, function.name)
{
   printf("OncoDev14 addRMessageHandler: '%s'", key);
   dispatchMap[[key]] <- function.name
    
} # addRMessageHandler
#---------------------------------------------------------------------------------------------------
deploy <- function(port=9014, quiet=FALSE)
{
  setupMessageHandlers()

  wsCon <- .connect(wsCon)

  errorFunction <- function(e){
     stop(sprintf("failed to open websocket on port %d", port));
     }
  finallyFunction <- function(e){
     message(sprintf("daemonized web socket server finalized"));
     }

  if(!quiet)
     message(sprintf("running server on port %d", port))

  wsCon$wsID <- tryCatch(runServer("0.0.0.0", port, wsCon),
                         error=errorFunction, finally=finallyFunction);
  
  wsCon

} # deploy
#----------------------------------------------------------------------------------------------------
.connect <- function(wsCon)
{
   wsCon$open <- FALSE
   wsCon$wsID <- NULL
   wsCon$ws <- NULL
   wsCon$result <- NULL
     # process http requests
   wsCon$call = function(req) {
      wsUrl = paste(sep='', '"', "ws://",
                   ifelse(is.null(req$HTTP_HOST), req$SERVER_NAME, req$HTTP_HOST),
                   '"')
     list(
       status = 200L,
       headers = list('Content-Type' = 'text/html'),
       body = c(file=browserFile))
       }

      # called whenever a websocket connection is opened
   wsCon$onWSOpen = function(ws) {   
      #printf("---- wsCon$onWSOpen");
      wsCon$ws <- ws
      ws$onMessage(function(binary, rawMessage) {
         message <- as.list(fromJSON(rawMessage))
         printf("-- new message arrived")
         print(message)
         wsCon$lastMessage <- message
         if(!is(message, "list")){
            message("message: new websocket message is not a list");
            return;
            }
         if (! "cmd" %in% names(message)){
            message("error: new websocket messages has no 'cmd' field");
            return;
            }
         cmd <- message$cmd
         dispatchMessage(ws, message);
         printf("mesage received, cmd: %s", cmd);
         }) # onMessage
       wsCon$open <- TRUE
       } # onWSOpen

   wsCon

} # .connect
#--------------------------------------------------------------------------------
close <- function()
{
  if(!wsCon$open){
      warning("websocket server is not open, cannot close");
      return()
      }
  wsCon$open <- FALSE
  stopServer(wsCon$wsID)
  wsCon$ws <- NULL
  wsCon$ws <- -1

} # close
#--------------------------------------------------------------------------------
addRMessageHandler <- function(key, functionName)
{
   dispatchMap[[key]] <- functionName
    
} # addRMessageHandler
#---------------------------------------------------------------------------------------------------
dispatchMessage <- function(ws, msg)
{
   printf("entering dispatchMessage")
   print(msg)
   
   if(!msg$cmd %in% ls(dispatchMap)){
       message(sprintf("dispatchMessage error!  the incoming cmd '%s' is not recognized", msg$cmd))
       return()
       }

   function.name <- dispatchMap[[msg$cmd]]
   printf("function.name found: %s", function.name)
   success <- TRUE   

   if(is.null(function.name)){
       message(sprintf("dispatchMessage error!  cmd ('%s') not recognized", msg.cmd))
       success <- FALSE
       return()
       }
   
   tryCatch(func <- get(function.name), error=function(m) func <<- NULL)

   if(is.null(func)){
       message(printf("dispatchMessage error!  cmd ('%s') recognized but no corresponding function",
              msg$cmd))
       success <- FALSE
       }

   if(success)
       do.call(func, list(ws, msg))

} # dispatchMessage
#---------------------------------------------------------------------------------------------------
setupMessageHandlers <- function()
{
  addRMessageHandler("echo", "ws.pcaEchoHandler")
  addRMessageHandler("createPCA", "ws.createPCA")
  addRMessageHandler("calculatePCA", "ws.calculatePCA")

} # setupMessageHandlers
#----------------------------------------------------------------------------------------------------
ws.pcaEchoHandler <- function(ws, msg)
{
   printf("received echo request");

   if("payload" %in% names(msg))
      outgoing.payload <- sprintf("echo from PCA/inst/unitTests/runPCATestWebSocketServer.R: %s", msg$payload)
   else
      outgoing.payload <- "no incoming payload"
   

   json <- toJSON(list(cmd="echoBack", callback="", status="response", payload=outgoing.payload))
   
   ws$send(json)

} # ws.echoHandler
#----------------------------------------------------------------------------------------------------
# for accurate testing, and subsequent reliable use, all code below here should
# be reproduced exactly in the Oncoscape package in which the PLSR class is needed.
# a better way is needed to make these functions available here, for testing, and elsewhere,
# for deployment.
ws.createPCA <- function(ws, msg)
{
   printf("=== ws.createPCA, full msg:");
   print(msg)
   
   #print(msg$payload)
   dataPackageName = msg$payload$dataPackage
   matrixName = msg$payload$matrixName
   require(dataPackageName, character.only=TRUE)
      # a bit of R magic: create and run an R expression from text
      # this creates a real variable, ds, which is an object of whatever dataSetName names
   eval(parse(text=sprintf("ds <- %s()", dataPackageName)))

   cmd <- sprintf("mypca <<- PCA(ds, '%s')", matrixName);
   eval(parse(text=cmd))

   response <- pcaDataSummary(mypca)
   json <- toJSON(list(cmd=msg$callback, callback="", status="response", payload=response))
   
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
      samples <- msg$payload$samples
   if(exists("ds") == FALSE) {
      datasetName <- "DEMOdz"
      eval(parse(text=sprintf("ds <- %s()", datasetName)))
   }
   matrixName = msg$payload$expressionDataSet
   cmd <- sprintf("mypca <- PCA(ds, '%s')", matrixName);
   printf("*****cmd is: %s", cmd)
   eval(parse(text=cmd))

   x <- calculate(mypca, genes, samples)
     # fashion a 3-column data.frame nicely suited to use with d3: gene, PC1, PC2
     # add two more scalar field: pc1.varianceAccountedFor, pc2.varianceAccounted for
   
   mtx.loadings <- as.matrix(x$loadings[, 1:2])
   ids <- x$loadings$id
   max.value <- max(abs(c(x$loadings[,1], x$loadings[,2])))
   importance.PC1 = x$importance["Proportion of Variance", "PC1"]
   importance.PC2 = x$importance["Proportion of Variance", "PC2"]
   
   payload <- list(loadings=mtx.loadings, ids=ids, maxValue=max.value,
                   importance.PC1=importance.PC1,
                   importance.PC2=importance.PC2)



   json <- toJSON(list(cmd=msg$callback, callback="", status="success", payload=payload))
   
   ws$send(json)

} # ws.calculatePCA
#----------------------------------------------------------------------------------------------------
deploy()
