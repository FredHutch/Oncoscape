addRMessageHandler("createTimelines", "createTimelines")
addRMessageHandler("calculateTimelines", "calculateTimelines")
#----------------------------------------------------------------------------------------------------
# for accurate testing, and subsequent reliable use, all code below here should
# be reproduced exactly in the Oncoscape package in which the Timelines class is needed.
# a better way is needed to make these functions available here, for testing, and elsewhere,
# for deployment.
createTimelines <- function(msg)
{
   printf("=== createTimelines");

   printf("    callback: %s", msg$callback)
   print(msg$payload)

   currentDataSetName <- state[["currentDatasetName"]]
   printf("    using current Dataset: %s", currentDataSetName)

   ds <- datasets[[currentDataSetName]];
   events <- getEventList(ds)
   pts <- getPatientList(ds)
   eventTypes <- getEventTypeList(ds)
   return.msg <- list(cmd=msg$callback, callback="", status="response", payload=list(events=events, pts=pts, eventTypes=eventTypes))
   
   printf("createTimelines about to send msg: %s", return.msg$cmd)
   
   toJSON(return.msg)

} # createTimelines

#----------------------------------------------------------------------------------------------------
calculateTimelines <- function(msg)
{
   printf("=== calculateTimelines");

   printf("    callback: %s", msg$callback)
   print(msg$payload)
   pts = msg$payload

   if(length(pts) > 0){
      
      datasetName <- state[["currentDatasetName"]]
      dataset <- datasets[[datasetName]]
      events <- getEventList(dataset)
      pts <- getPatientList(dataset)
      cats <- getEventTypeList(dataset)
      }

   return.msg <- list(cmd=msg$callback, callback="", status="response", payload=list(events=events, pts=pts, eventTypes=cats))
   
   printf("calculateTimelines about to send msg: %s", return.msg$cmd)
   
   toJSON(return.msg)

} # createTimelines
