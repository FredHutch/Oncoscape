#------------------------------------------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)

#------------------------------------------------------------------------------------------------------------------------
# format(strptime("2009-08-11", "%Y-%m-%d"), "%m/%d/%Y") # ->  "08/11/2009"
reformatDate <- function(dateString)
{
   format(strptime(dateString, "%Y-%m-%d"), "%m/%d/%Y")

} # reformatDate

#------------------------------------------------------------------------------------------------------------------------
# sloppy ad hoc design currently requires these variables at global scope

load(file="../../../../TCGAcoad/inst/extdata/history.RData")
list.TCGAcoad <- history
checkEquals(length(list.TCGAcoad), 4467)

load(file="../../../../TCGAread/inst/extdata/history.RData")
list.TCGAread <- history
checkEquals(length(list.TCGAread), 1608)

#------------------------------------------------------------------------------------------------------------------------
run <- function()
{
       
    history <- c(list.TCGAcoad, list.TCGAread)
    checkEquals(class(history), "list")
       
   checkEquals(length(history), length(list.TCGAcoad) + length(list.TCGAread))
   checkEquals(as.list(table(unlist(lapply(history, function(e) e["Name"])))), list(`Absent`=84, `Background` = 625, `Birth`=625, `Diagnosis`=625,`Drug`=708,`Encounter`=625, `Pathology`=716, `Procedure`=96, `Progression`=126,  `Radiation`=56, `Status`=625, `Tests` = 1164))
      #omf: other malignancy form for 2 patients gives extra pathologies
      # many additional surgeries marked (new_tumor_event_additional_surgery_procedure = YES) but no date given
      
   serialized.file.name <- "../../extdata/history.RData"
   #printf("saving history to %s", serialized.file.name)
   
   save(history, file=serialized.file.name)

} # run

run()