#                   incoming message          function to call                 return.cmd
#                   -------------------       ----------------                -------------
addRMessageHandler("oncoprint_data_selection",     "oncoprint_data_selection")            # displayOncoprint
#----------------------------------------------------------------------------------------------------
<<<<<<< HEAD:r_modules/Oncoscape/R/wsOncoprint.R
library(SttrDataPackage)
library(TCGAgbm)
oncoprint_data_selection <- function(msg)
=======
oncoprint_data_selection <- function(ws, msg)
>>>>>>> ae59845bfcccb430e4981f1a0e7f84fd035a3def:Oncoscape/R/wsOncoprint.R
{
    printf("=== entering oncoprint_data_selection")
    
    currentDataSetName <- state[["currentDatasetName"]]
    printf("***** currentDatasetName: %s", currentDataSetName)
    if(!is.null(msg$payload$ds)){
        ds <- msg$payload$ds
    }else{
        ds <- currentDataSetName
    }
    printf("=== after obtaining datasets from datapackage constructor, next is processing received ws msg")
    payload_str <- msg$payload$sampleIDs
    #payload_mode <- msg$payload$testing
    
    #partial_msg <- create.oncoprint.input(payload_str, ds, payload_mode) 
    partial_msg <- create.oncoprint.input(payload_str, ds)
    return.msg <-toJSON(c(cmd=msg$callback, partial_msg))
    printf("=== before sending out result")
    return.msg
    
} # data_selection
#-------------------------------------------------------------------------------

