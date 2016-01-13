#                   incoming message          function to call                 return.cmd
#                   -------------------       ----------------                -------------
addRMessageHandler("calculateSurvivalCurves", "calculateSurvivalCurves")      # displaySurvivalCurves
#----------------------------------------------------------------------------------------------------
calculateSurvivalCurves <- function(ws, msg)
{
   #printf("=== entering calculateSurvivalCurves")

   currentDataSet <- state[["currentDatasetName"]] 
   tbl.history <- .getPatientHistory(currentDataSet)
   
   temp.file <- tempfile(fileext="jpg")

   
   patients <- msg$payload$sampleIDs
   title <- msg$payload$title
   if(nchar(title) == 0)
       title <- NA
   
   if(all(nchar(patients) == 0))
      patients <- NA
       
   fit <- survivalCurveByAttribute(tbl.history, patients, filename=temp.file, title=title)

   p = base64encode(readBin(temp.file, what="raw", n=1e6))

   p = paste("data:image/jpg;base64,\n", p, sep="")

   return.cmd <- msg$callback

   return.msg <- toJSON(list(cmd=return.cmd, status="success", payload=p))

   ws$send(return.msg)

   file.remove(temp.file)

} # calculateSurvivalCurves
#-------------------------------------------------------------------------------
