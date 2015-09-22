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

load(file="../../../../TCGAluad/inst/extdata/history.RData")
list.TCGAluad <- history
checkEquals(length(list.TCGAluad), 5502)

load(file="../../../../TCGAlusc/inst/extdata/history.RData")
list.TCGAlusc <- history
checkEquals(length(list.TCGAlusc), 5235)

#------------------------------------------------------------------------------------------------------------------------
run <- function()
{
       
    history <- c(list.TCGAluad, list.TCGAlusc)
    checkEquals(class(history), "list")
       
   checkEquals(length(history), length(list.TCGAluad) + length(list.TCGAlusc))
   checkEquals(as.list(table(unlist(lapply(history, function(e) e["Name"])))), list(`Absent`=85, `Background` = 996,`Birth`=1015, `Diagnosis`=1015,`Drug`=675,`Encounter`=2863,`Pathology`=1195, `Procedure`=166, `Progression`=55,  `Radiation`=181, `Status`=1015,`Tests`=1476))
      #omf: other malignancy form for 2 patients gives extra pathologies
      # many additional surgeries marked (new_tumor_event_additional_surgery_procedure = YES) but no date given
      
   serialized.file.name <- "../../extdata/history.RData"
   #printf("saving history to %s", serialized.file.name)
   
   save(history, file=serialized.file.name)

} # run

run()