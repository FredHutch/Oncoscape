addRMessageHandler("getUserInfo", "getUserInfo");
#----------------------------------------------------------------------------------------------------
getUserInfo <- function(msg)
{
  printf("getUserInfo R message handler called");
  print(msg);
  printf("  state fields: %s", paste(ls(state), collapse=", "))
  
  datasetNames <- strsplit(state$rawDatasetNames, ";")[[1]];
  
  payload <- list(userID=state$userID,
                  datasets=datasetNames)
  
  return.msg <- list(cmd=msg$callback, status="response", callback="", payload=payload)
  toJSON(return.msg)
} # getUserInfo
#----------------------------------------------------------------------------------------------------
