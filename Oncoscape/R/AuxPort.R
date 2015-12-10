#---------------------------------------------------------------------------------------------------
auxPortState <- new.env(parent=emptyenv())
#---------------------------------------------------------------------------------------------------
AuxPort <- function(primaryWebSocketServer, port)
{
   wsCon <- new.env(parent=emptyenv())
   auxPortState[["wsCon"]] <- .setupAuxPortWebSocketHandlers(primaryWebSocketServer, wsCon, port)
   print(noquote(sprintf("OncoDev14/AuxPort , starting service loop on port %d", port)));
   auxWsID <- startDaemonizedServer("0.0.0.0", port,  wsCon)

   printf ("leaving AuxPort")
   return(auxPortState)

  # while (TRUE) {
  #     service()
  #     Sys.sleep(0.001)
  #     }
  #   }) # run


} # AuxPort
#---------------------------------------------------------------------------------------------------
# the semanitcs of toJSON changed between RJSONIO and jsonlite: in the latter, scalars are
# promoted to arrays of length 1.  rather than change our javascript code, and since such
# promotion -- while sensible in the context of R -- strikes me as gratuitous, I follow
# jeroen ooms suggestion, creating this wrapper
toJSON <- function(..., auto_unbox = TRUE)
{
  jsonlite::toJSON(..., auto_unbox = auto_unbox)
}
#----------------------------------------------------------------------------------------------------
.setupAuxPortWebSocketHandlers <- function(primaryWebSocketServer, wsCon, port)
{
   wsCon$open <- FALSE
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
       body = "<h4>hello from AuxPort.R</h4>")
       }

      # called whenever a websocket connection is opened
   wsCon$onWSOpen = function(ws) {   
      #printf("---- wsCon$onWSOpen");
      wsCon$ws <- ws
      ws$onMessage(function(binary, rawMessage) {
         message <- as.list(fromJSON(rawMessage))
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
         printf("OncoDev14/AuxPort onMessage, cmd: %s ", cmd);
         printf("sending to primaryWebSocketServer, fields %s",
                paste(ls(primaryWebSocketServer), collapse=","))
         primaryWebSocketServer$ws$send(toJSON(message))
         printf("after dispatch to primary");
         #print(rawMessage)
         #printf("OncoDev14:onMessage, cooked ");
         #print(message)
         #dispatchMessage(ws, message);
         }) # onMessage
       wsCon$open <- TRUE
       } # onWSOpen

   wsCon

} # .setupWebSocketHandlers
#--------------------------------------------------------------------------------
