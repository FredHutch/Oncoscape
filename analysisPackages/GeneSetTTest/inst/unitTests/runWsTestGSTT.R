library(httpuv)
library(RJSONIO)
library(GeneSetTTests)
library(base64enc)
library(genefilter)

#----------------------------------------------------------------------------------------------------
deploy <- function(port=9003, quiet=FALSE)
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
       body = "<h4> hello from ~/lopez/oncoscape/v1.4.60/analysisPackages/GeneSetTTest/inst/unitTests/runWsTestGSTT.R</h4>")
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
   addRMessageHandler("echo", "echoHandler")
   addRMessageHandler("score", "scoreHandler")
   addRMessageHandler("fetchHeatMap", "heatMapHandler")

} # setupMessageHandlers
#----------------------------------------------------------------------------------------------------
echoHandler <- function(ws, msg)
{
   printf("received echo request");
   if("payload" %in% names(msg))
      outgoing.payload <- paste(msg$payload, msg$payload, sep="-")
   else
      outgoing.payload <- "no incoming payload"
   
   ws$send(toJSON(list(cmd="echoBack", callback="", status="response", payload=outgoing.payload)))

} # echoHandler
#----------------------------------------------------------------------------------------------------
scoreHandler <- function(ws, msg)
{
   printf("=== received score request");
   print(msg)   
   payload <- msg$payload
   
   group1 <- payload$group1
   group2 <- payload$group2
   genesets <- payload$genesets
   
   
   #gstt@genesets<-gstt@genesets[c("BUDHU_LIVER_CANCER_METASTASIS_UP","MODULE_143","MODULE_293")];
   if ("geneset.name" %in% names(payload))
      geneset.name <- payload$geneset.name;
   
   quiet <- TRUE
   if("quiet" %in% names(payload))
      quiet <- payload$quiet

   byGene <- FALSE
   if("byGene" %in% names(payload))
      byGene <- payload$byGene

   mean.threshold = 1.0
   if("meanThreshold" %in% names(payload))
      mean.threshold = payload$meanThreshold
   
   participation.threshold = 1.0
   if("participationThreshold" %in% names(payload))
      participation.threshold = payload$participationThreshold
   
   printf("group1 (%d)", length(group1))
   printf("group2 (%d)", length(group2))
   #printf("genesetsPool (%d)", length(genesetsPool))
   printf("genesets (%d)", length(genesets))
   printf("quiet (%s)", quiet)
   printf("byGene (%s)", byGene)
   printf("mean.threshold (%5.3f)", mean.threshold)
   printf("participation.threshold (%5.3f)", participation.threshold)

   # score <- score(gstt, group1, group2, genesets)
   # group1, group2, geneset.names=NA, byGene=TRUE, mean.threshold=1.0, quiet=TRUE)
   score <- score(gstt, group1, group2, geneset.names=genesets, quiet=quiet, byGene=byGene,
                  mean.threshold=mean.threshold,participation.threshold)

   #print(score)
   
   ws$send(toJSON(list(cmd=msg$callback, callback="", status="response", payload=toJSON(score))))

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
    printf("group1 (%d)", length(group1))
    printf("group2 (%d)", length(group2))
    printf("geneset (%s)", geneset)#hopefully, get the name of the genesets
    
    
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
#----------------------------------------------------------------------------------------------------
wsCon <- new.env(parent=emptyenv())
dispatchMap <- new.env(parent=emptyenv())
gstt <- GeneSetTTests()
if(!interactive())
   deploy(port=11003)

