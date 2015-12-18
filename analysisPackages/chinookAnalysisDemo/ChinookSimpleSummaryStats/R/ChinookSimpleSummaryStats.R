#----------------------------------------------------------------------------------------------------
.ChinookSimpleSummaryStats <- setClass ("ChinookSimpleSummaryStats", 
                                        representation = representation(impl="SimpleSummaryStats"),
                                        contains = "ChinookAnalysis"
                                       )

#----------------------------------------------------------------------------------------------------
# constructor
ChinookSimpleSummaryStats <- function(server)
{
    printf("starting ChinookSimpleSummaryStats ctor")
    obj <- .ChinookSimpleSummaryStats(ChinookAnalysis(name="SimpleSummaryStats"),
                                      impl=SimpleSummaryStats())
    setServer(obj, server)
    registerMessageHandlers(obj)

    printf("leaving ChinookSimpleSummaryStats ctor")
    obj

} # SummaryStats constructor
#----------------------------------------------------------------------------------------------------
setMethod("registerMessageHandlers", "ChinookSimpleSummaryStats",

  function (obj) {
     addMessageHandler(getServer(obj), "numericVectorSummaryStats", "SummaryStats.calculate")
     })

#----------------------------------------------------------------------------------------------------
SummaryStats.calculate <- function(channel, msg)
{
   print(msg)

   callback <- msg$callback
   vector <- as.numeric(msg$payload)
   printf("vector: %d, %f", length(vector), sum(vector))
   print(vector)
   
   stats <- SimpleSummaryStats(vector)
   x <- calculate(stats)
   printf("---- about to return stats result:")
   print(x)

   return.msg <- list(cmd=msg$callback, status="success", callback="", payload=x)
   result <- toJSON(return.msg)
   
   printf("class(channel): %s", class(channel))

   if("WebSocket" %in% is(channel))
      channel$send(result)
   else
      return(result)

} # SummaryStats.calculate
#----------------------------------------------------------------------------------------------------
