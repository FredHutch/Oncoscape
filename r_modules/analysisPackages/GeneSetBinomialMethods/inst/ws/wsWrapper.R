library(httpuv)
library(RJSONIO)
library(GeneSetBinomialMethods)
library(SKAT)
library(base64enc)

#----------------------------------------------------------------------------------------------------
wsCon <- new.env(parent=emptyenv())
dispatchMap <- new.env(parent=emptyenv())
#gstt <- GeneSetTTests()

#----------------------------------------------------------------------------------------------------
deploy <- function(port=9006, quiet=FALSE)
{
  setupMessageHandlers()

  wsCon <- .connect(wsCon)

  errorFunction <- function(e){
     stop(sprint("failed to open websocket on port %d", port));
     }
  finallyFunction <- function(e){
     message(sprint("daemonized web socket server finalized"));
     }



  #wsCon$wsID <- tryCatch(startDaemonizedServer("0.0.0.0", port, wsCon),
  #                       error=errorFunction, finally=finallyFunction);
  #wsCon$wsID <- tryCatch(startServer("0.0.0.0", port, wsCon),
  #                       error=errorFunction, finally=finallyFunction);
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
      #print("---- wsCon$onWSOpen");
      wsCon$ws <- ws
      ws$onMessage(function(binary, rawMessage) {
         message <- as.list(fromJSON(rawMessage))
         print("-- new message arrived")
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
         print("mesage received, cmd:")
         print(cmd);
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
   print("entering dispatchMessage")
   print(msg)
   
   if(!msg$cmd %in% ls(dispatchMap)){
       message(sprint("dispatchMessage error!  the incoming cmd '%s' is not recognized", msg$cmd))
       return()
       }

   function.name <- dispatchMap[[msg$cmd]]
   #print("function.name found: %s", function.name)
   success <- TRUE   

   if(is.null(function.name)){
       message(sprint("dispatchMessage error!  cmd ('%s') not recognized", msg.cmd))
       success <- FALSE
       return()
       }
   
   tryCatch(func <- get(function.name), error=function(m) func <<- NULL)

   if(is.null(func)){
       message(print("dispatchMessage error!  cmd ('%s') recognized but no corresponding function",
              msg$cmd))
       success <- FALSE
       }

   if(success)
       do.call(func, list(ws, msg))

} # dispatchMessage
#---------------------------------------------------------------------------------------------------
setupMessageHandlers <- function()
{
   addRMessageHandler("echo", "echoHandler")
   addRMessageHandler("geneSetScoreTest", "scoreHandler")
   addRMessageHandler("fetchHeatMap", "heatMapHandler")

} # setupMessageHandlers
#----------------------------------------------------------------------------------------------------
echoHandler <- function(ws, msg)
{
   print("received echo request");
   if("payload" %in% names(msg))
      outgoing.payload <- paste(msg$payload, msg$payload, sep="-")
   else
      outgoing.payload <- "no incoming payload"
   
   ws$send(toJSON(list(cmd="echoBack", callback="", status="response", payload=outgoing.payload)))

} # echoHandler
#----------------------------------------------------------------------------------------------------
scoreHandler <- function(ws, msg)
{
   print("=== received score request");
   print(msg)   
   payload <- msg$payload
   
   group1 <- payload$group1
   group2 <- payload$group2
   nG1 <- length(group1)#
   nG2 <- length(group2)#
   geneset <- payload$geneset#
   
   print("group1")
   print(length(group1))
   print("group2")
   print(length(group2))
   print("geneset")
   print(geneset)
  
   set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 40, nG2 = 40, cut = 0.5, all = FALSE, seed = 12345)
  
   skat_nocov <- geneSetScoreTest(
   obj = GeneSetBinomialMethods(),
   sampleIDsG1 = group1,
   sampleIDsG2 = group2,
   covariates = NULL,
   geneSet = geneset,
   sampleDescription ="TCGA GBM long vs. short survivors",
   geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")

   ws$send(toJSON(list(cmd=msg$callback, callback="", status="response", payload=toJSON(skat_nocov$summary.skatRes))))

} # scoreHandler
#----------------------------------------------------------------------------------------------------
heatMapHandler <- function (ws, msg)
{
    print(msg)
    payload <- msg$payload
    
    group1 <- payload$group1
    group2 <- payload$group2
    geneset <- payload$geneSet
    
    print("=== entering heatMapHandler")
    
    temp.file <- tempfile(fileext="jpg")
    
    #payload must be a list
    payload <-msg$payload
    print("group1")
    print(length(group1))
    print("group2")
    print(length(group2))
    print("geneset")
    print(geneset)#hopefully, get the name of the genesets
    
    
    #if(!is.na(filename))
    jpeg(file=temp.file, width=650,height=650,res=80)
    drawHeatmap(gstt, geneset.name=geneset, group1=group1, group2=group2, cluster.patients=FALSE);
    dev.off()
    p = base64encode(readBin(temp.file,what="raw",n=1e6))
    #p = base64encode(readBin("wisdom.png", what="raw",n=1e6))
    #p = base64encode(readBin("heatMapDemo.png", what="raw",n=1e6))
    p = paste("data:image/jpg;base64,\n",p,sep="")
    return.cmd <- msg$callback
    
    
    #return.msg <- toJSON(list(cmd=return.cmd, status="success", payload="Happy New Year!"))
    return.msg <- toJSON(list(cmd=return.cmd, status="success", payload=p))
    ws$send(return.msg)
    
    file.remove(temp.file)
    
}