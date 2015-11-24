#                   incoming message          function to call                 return.cmd
#                   -------------------       ----------------                -------------
addRMessageHandler("oncoprint_data_selection",     "oncoprint_data_selection")            # displayOncoprint
#----------------------------------------------------------------------------------------------------
library(SttrDataPackage)
library(TCGAgbm)
oncoprint_data_selection <- function(ws, msg)
{
    printf("=== entering oncoprint_data_selection")
    
    currentDataSetName <- state[["currentDatasetName"]]
    ds <- state[[currentDataSetName]];
    
    
    printf("=== after obtaining datasets from datapackage constructor, next is processing received ws msg")
    payload_str <- msg$payload$sampleIDs
    partial_msg <- create.oncoprint.input(payload_str, ds) 
    return.msg <-toJSON(c(cmd=msg$callback, partial_msg))
    printf("=== before sending out result")
    ws$send(return.msg)
    
} # data_selection
#-------------------------------------------------------------------------------
