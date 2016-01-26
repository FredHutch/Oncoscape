addRMessageHandler("getDataSetNames", "getAllDataSetNames");
addRMessageHandler("getDataManifest", "getDataManifest");
#----------------------------------------------------------------------------------------------------
getAllDataSetNames <- function(msg)
{
  printf("=== getDataSetNames R message handler called");
  print(msg);
  names <- ls(datasets)
  print(names)
  
  payload <- names;
  return.msg <- list(cmd=msg$callback, status="response", callback="", payload=payload)
  toJSON(return.msg)
} # getAllDataSetNames
#----------------------------------------------------------------------------------------------------
getDataManifest <- function(msg)
{
  datasetName <- msg$payload;

  printf("=== getDataManifest, datasetName: %s", datasetName);
  
  if(!datasetName %in% ls(datasets)){
     return.msg <- list(cmd=msg$callback, status="error", callback="",
                        payload=sprintf("unknown dataset '%s'", datasetName))
     toJSON(return.msg)
     return;
     }

  tbl <- manifest(datasets[[datasetName]])

    # the first two columns, "variable" and "class" are not so relevant for the oncoscape display
  tbl <- tbl[, -c(1,2)]
    # make some column names more friendly
  column.titles <- colnames(tbl)
  column.titles <- sub("entity.count", "rows", column.titles)
  column.titles <- sub("feature.count", "cols", column.titles)
  column.titles <- sub("entity.", "row ", column.titles)
  column.titles <- sub("feature.", "column ", column.titles, fixed=TRUE)
  
  matrix <- as.matrix(tbl)
  colnames(matrix) <- NULL
  
  
  payload <- list(colnames=column.titles, mtx=matrix)
  return.msg <- list(cmd=msg$callback, status="success", callback="",
                     payload=toJSON(payload))

  toJSON(return.msg)
} # getDataManifest
#----------------------------------------------------------------------------------------------------
