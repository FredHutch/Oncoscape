#                   incoming message          function to call                 return.cmd
#                   -------------------       ----------------                -------------
addRMessageHandler("oncoprint_data_selection",     "oncoprint_data_selection")            # displayOncoprint
#----------------------------------------------------------------------------------------------------

oncoprint_data_selection <- function(msg)

{
    printf("=== entering oncoprint_data_selection")
    
    currentDataSetName <- state[["currentDatasetName"]]
    printf("***** currentDatasetName: %s", currentDataSetName)
    printf("test2")
    print(msg)
    #msg
    printf("test3")
    if(!is.null(msg$payload$ds)){
        ds <- msg$payload$ds
    }else{
        ds <- datasets[[currentDataSetName]]
    }
    print(ds)
    ds <- msg$ds
    print(ds)
    printf("test4")
    printf("=== after obtaining datasets from datapackage constructor, next is processing received ws msg")
    payload_str <- msg$payload$patientIdsAndGenes
    #payload_mode <- msg$payload$testing
    printf("test5")
    #partial_msg <- create.oncoprint.input(payload_str, ds, payload_mode) 
    partial_msg <- create.oncoprint.input(payload_str, ds)
    toJSON(list(cmd=msg$callback, callback="", status="response", 
            payload=partial_msg),
                            auto_unbox=TRUE)
   
    #return.msg <- toJSON(c(cmd=msg$callback, partial_msg))
    #printf("=== before sending out result")
    #return.msg
    
} # data_selection
#-------------------------------------------------------------------------------

