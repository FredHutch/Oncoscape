addRMessageHandler("calculateHistogramCoordinates", "calculateHistogramCoordinates");
#----------------------------------------------------------------------------------------------------
old.calculateHistogramCoordinates <- function(msg)
{
  printf("--- getHistogramCoordinates")

  return.msg <- list()
  return.msg$cmd <- msg$callback
  return.msg$callback <- ""

  print(1)
  payload <- msg$payload
  print(2)
  print(payload)
  print(is.list(payload))
  
  if(!is.list(payload)){
  print(3)

    return.msg$status <- "error";
    return.msg$payload <- "payload is not a list"
    toJSON(return.msg)
    return()
    }

  print(4)
  if(!all(c("dataset", "dataItem") %in% names(payload))){
  print(5)
    return.msg$status <- "error";
    return.msg$payload <- "payload lacks one or more expected fields: 'dataset', 'dataItem'";
    toJSON(return.msg)
    return()
    }
            
  print(6)
  datasetName = payload$dataset
  print(7)
  dataItemName = payload$dataItem
  print(8)

  if(!datasetName %in% ls(datasets)){
  print(9)
    return.msg$status <- "error";
    return.msg$payload <- sprintf("dataset name not found in current datasets: %s", datasetName);
    toJSON(return.msg)
    return()
    }

  ds <- datasets[[datasetName]];
  print(10)
  
  tbl.manifest <- manifest(ds)
  print(11)

  if(!dataItemName %in% tbl.manifest$variables){
  print(12)
    return.msg$status <- "error";
    return.msg$payload <- sprintf("%s data item not found in %s", dataItemName, datasetName);
    toJSON(return.msg)
    return()
    }
      
    # having reached this far, we are now, with pretty good reliability, ready to extract
    # the data and calculate the histogram coordinates

  errorFunction <- function(e){
    return.msg$status <- "error";
    return.msg$payload <- sprintf("%s data item not found in %s", dataItemName, xdatasetName);
    toJSON(return.msg)
    return()
    }
  
  print(13)
  tryCatch(mtx <- matrices(ds)[[dataItemName]], error=errorFunction)
  print(14)

  result <- hist(mtx)[c("breaks", "counts", "mids")]
  payload <- toJSON(result)
  print(15)
  return.msg$status <- "success";
  return.msg$payload <- sprintf("%s data item not found in %s", dataItemName, xdatasetName);
  print(16)

  toJSON(return.msg)

} # old.calculateHistogramCoordinates
#----------------------------------------------------------------------------------------------------
calculateHistogramCoordinates <- function(msg)
{
  printf("--- getHistogramCoordinates")

  return.msg <- list()
  return.msg$cmd <- msg$callback
  return.msg$callback <- ""

  print(1)
  payload <- as.list(msg$payload)
  print("------- payload")
  print(payload)
  
  if(!is.list(payload))
     stop(sprintf("payload is not a list"))
  
  stopifnot(all(c("dataset", "dataItem") %in% names(payload)))
  
  datasetName = payload$dataset
  dataItemName = payload$dataItem
  stopifnot(datasetName %in% ls(datasets))
  
  ds <- datasets[[datasetName]];
  tbl.manifest <- manifest(ds)
  stopifnot(dataItemName %in% tbl.manifest$variable)
  stopifnot(subset(tbl.manifest, variable==dataItemName)$class == "matrix")
  mtx <- matrices(ds)[[dataItemName]]
  printf("typeof(mtx): %s", typeof(mtx))
  stopifnot(is(mtx, "matrix"))
  stopifnot(typeof(mtx) == "double")
     
  result <- hist(mtx)[c("breaks", "counts", "mids")]
  payload <- toJSON(result)
     print(15)
   return.msg$status <- "success";
   return.msg$payload <- payload
   print(16)

    printf("about to execute normal return");
    toJSON(return.msg)


} # calculateHistogramCoordinates
#----------------------------------------------------------------------------------------------------

