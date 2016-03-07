#Reference Table#------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)
library(R.utils)
library(stringr)

args <- commandArgs(trailingOnly = TRUE)
stopifnot(length(args) ==1)
study <- args[1]; 
print(paste("Creating Processed data for", study))

stopifnot(file.exists("TCGA_Reference_Filenames.txt"))
TCGAfilename<-read.table("TCGA_Reference_Filenames.txt", sep="\t", header=TRUE)

i<- which(TCGAfilename$study == study)
directory <- TCGAfilename[i,"directory"]
	stopifnot(file.exists(directory))

source(paste(directory,TCGAfilename[i,"test"],sep="/"), local=TRUE)
##===load drug reference table ===
drug_ref <- read.table("drug_names_10272015.txt", sep="\t", header=TRUE)
rad_ref <- read.table("rad_ref_02232016.txt", sep="\t", header=TRUE)
#----------------------------------------------------------------------------------------------------
loadRawFiles <- function()	{ 
	  
  RawTables <- list()
  if (length(TCGAfilename[i,"pt"])>0){
	  print(paste(TCGAfilename[i,"pt"] , "being loaded for tbl.pt", study))
	  tbl.pt <- read.table(paste(directory,TCGAfilename[i,"pt"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
	  tbl.pt <- tbl.pt[3:nrow(tbl.pt),]
	  RawTables[["tbl.pt"]] <- tbl.pt
	  #print(paste(colnames(tbl.pt))) 
	  }else{
	  print(paste("tbl.pt does not exist for: ", study, sep=""))
  }
  if (length(TCGAfilename[i,"f1"])>0){
    print(paste(TCGAfilename[i,"f1"] , "being loaded for tbl.followup_1", study))
    tbl.followup_1 <- read.table(paste(directory,TCGAfilename[i,"f1"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.followup_1 <- tbl.followup_1[3:nrow(tbl.followup_1),]
    RawTables[["tbl.followup_1"]] <- tbl.followup_1
    #print(paste(colnames(tbl.followup_1))) 
    }else{
    print(paste("tbl.followup_1 does not exist for: ", study, sep=""))
  }
  if (length(TCGAfilename[i,"rad"])>0){
    print(paste(TCGAfilename[i,"rad"] , "being loaded for tbl.rad", study))
    tbl.rad <- read.table(paste(directory,TCGAfilename[i,"rad"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.rad <- tbl.rad[3:nrow(tbl.rad),]
    RawTables[["tbl.rad"]] <- tbl.rad
  }else{
    print(paste("tbl.rad does not exist for: ", study, sep=""))
  }
  if (length(TCGAfilename[i,"omf"])>0){
    print(paste(TCGAfilename[i,"omf"] , "being loaded for tbl.omf", study))
    tbl.omf <- read.table(paste(directory,TCGAfilename[i,"omf"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.omf <- tbl.omf[3:nrow(tbl.omf),]
    RawTables[["tbl.omf"]] <- tbl.omf
  }else{
    print(paste("tbl.omf does not exist for: ", study, sep=""))
  }
  #if (length(TCGAfilename[i,"f2"])>0){
  if (!is.na(TCGAfilename[i,"f2"])){
    print(paste(TCGAfilename[i,"f2"] , "being loaded for tbl.followup_2", study))
    tbl.followup_2 <- read.table(paste(directory,TCGAfilename[i,"f2"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.followup_2 <- tbl.followup_2[3:nrow(tbl.followup_2),]
    RawTables[["tbl.followup_2"]] <- tbl.followup_2
    #print(paste(colnames(tbl.followup_2))) 	  
    }else{
    print(paste("tbl.followup_2 does not exist for: ", study, sep=""))
    }
  #if (length(TCGAfilename[i,"nte_f1"])>0){
  if (!is.na(TCGAfilename[i,"nte_f1"])){  
    print(paste(TCGAfilename[i,"nte_f1"] , "being loaded for tbl.nte_followup_1", study))
    tbl.nte_followup_1 <- read.table(paste(directory,TCGAfilename[i,"nte_f1"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.nte_followup_1 <- tbl.nte_followup_1[3:nrow(tbl.nte_followup_1),]
    RawTables[["tbl.nte_followup_1"]] <- tbl.nte_followup_1
    #print(paste(colnames(tbl.nte_followup_1)))  
    }else{
    print(paste("tbl.nte_followup_1 does not exist for: ", study, sep=""))
  }

  if (!is.na(TCGAfilename[i,"f3"])){  
    print(paste(TCGAfilename[i,"f3"] , "being loaded for tbl.followup_3", study))
    tbl.followup_3 <- read.table(paste(directory,TCGAfilename[i,"f3"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.followup_3 <- tbl.followup_3[3:nrow(tbl.followup_3),]
    RawTables[["tbl.followup_3"]] <- tbl.followup_3
    #print(paste(colnames(tbl.followup_3))) 
    }else{
    print(paste("tbl.followup_3 does not exist for: ", study, sep=""))
  }
  if (length(TCGAfilename[i,"nte"])>0){ 
    print(paste(TCGAfilename[i,"nte"] , "being loaded for tbl.nte", study))
    tbl.nte <- read.table(paste(directory,TCGAfilename[i,"nte"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.nte <- tbl.nte[3:nrow(tbl.nte),]
    RawTables[["tbl.nte"]] <- tbl.nte
    #print(paste(colnames(tbl.nte)))  
    }else{
    print(paste("tbl.nte does not exist for: ", study, sep=""))
  }

  if (!is.na(TCGAfilename[i,"drug"])){  
    print(paste(TCGAfilename[i,"drug"] , "being loaded for tbl.drug", study))
    tbl.drug <- read.table(paste(directory,TCGAfilename[i,"drug"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.drug <- tbl.drug[3:nrow(tbl.drug),]
    RawTables[["tbl.drug"]] <- tbl.drug
  }else{
    print(paste("tbl.drug does not exist for: ", study, sep=""))
  }
	 
	RawTables

} # loadRawFiles
#----------------------------------------------------------------------------------------------------
run <- function(RawTables, tcga.ids)
{
  
  # the patient clinical annotation data use IDs in this style
  #     "TCGA-02-0001" "TCGA-02-0003" "TCGA-02-0006" "TCGA-02-0007"
  # whereas we prefer
  #     "TCGA.02.0001" "TCGA.02.0003" "TCGA.02.0006" "TCGA.02.0007"
  # adapt the incoming patients to the tcga patient clinical style
  # the patient ids are returned to the dot form in the functions
  # defined and called below.
  
  patients <- tcga.ids
  print(paste("---- parse Events for", length(patients), "patients"))

  
  patients <- gsub("\\.", "\\-", patients)
  checkTrue(all(patients %in% RawTables[["tbl.pt"]][,"bcr_patient_barcode"]))
  
  history <- parseEvents(patients)
  if(length(history)>0)
    names(history) <- paste("event", 1:length(history), sep="")
  ptList <- createPatientList(history)
  catList <- createEventTypeList(history)
  tbl.ptHistory <- createPatientTable(history)
  
  ProcessedData <- list(history=history, ptList=ptList, catList=catList, tbl.ptHistory=tbl.ptHistory)
  
} # run
#----------------------------------------------------------------------------------------------------
saveRData <- function(finalData){

  print(paste("---- saving files for ", paste(names(finalData), collapse=",")))
  history <- finalData$history; ptList <- finalData$ptList; 
  catList <- finalData$catList; tbl.ptHistory <- finalData$tbl.ptHistory;
  
  serialized.file.path <-paste("..",study,"inst/extdata",sep="/")
  save(history, file=paste(serialized.file.path,"events.RData",sep="/"))
  save(ptList, file=paste(serialized.file.path, "ptHistory.RData",sep="/"))
  save(catList, file=paste(serialized.file.path,"historyTypes.RData", sep="/"))
  save(tbl.ptHistory, file=paste(serialized.file.path,"tbl.ptHistory.RData", sep="/"))
}
#--------------------------------------------------------------------------------------------------
# format(strptime("2009-08-11", "%Y-%m-%d"), "%m/%d/%Y") # ->  "08/11/2009"
reformatDate <- function(dateString)
{
  format(strptime(dateString, "%Y-%m-%d"), "%m/%d/%Y")
} # reformatDate
#----------------------------------------------------------------------------------------------------
parseEvents = function(patient.ids=NA)
{
  dob.events <- lapply(patient.ids, function(id) create.DOB.record(id))
  diagnosis.events <- create.all.Diagnosis.records(patient.ids)
  chemo.events <- create.all.Chemo.records(patient.ids)
  radiation.events <- create.all.Radiation.records(patient.ids)
  encounter.events <- create.all.Encounter.records(patient.ids)
  #pathology.events <- create.all.Pathology.records(patient.ids)
  progression.events <- create.all.Progression.records(patient.ids)
  status.events <- lapply(patient.ids, create.status.record)
  #background.events <- lapply(patient.ids, create.Background.record)
  #tests.events <- lapply(patient.ids, create.Tests.record)
  #procedure.events <- create.all.Procedure.records(patient.ids)
  #absent.events <- create.all.Absent.records (patient.ids)
  events <- append(dob.events, diagnosis.events)
  events <- append(events, status.events)
  events <- append(events, progression.events)
  events <- append(events, chemo.events)
  events <- append(events, radiation.events)
  events <- append(events, encounter.events)
  #events <- append(events, procedure.events)
  
  #events <- append(events, pathology.events)
  #events <- append(events, absent.events)
  #events <- append(events, tests.events)
  #events <- append(events,background.events)
      #printf("found %d events for %d patients", length(events), length(patient.ids))
  print(table(unlist(lapply(events, function(e) e["Name"]))))
  
  events
  
} # parseEvents
#----------------------------------------------------------------------------------------------------
create.DOB.record <- function(patient.id)
{
  tbl.pt.row <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode==patient.id) 
  patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
  patient.number <- as.integer(id.map[patient.id])
  diagnosis.year <- tbl.pt.row$initial_pathologic_dx_year

  #from lusc
   if(diagnosis.year == "[Not Available]"){
      diagnosis.date = NA #typo in orginal! diangosis.date = NA
      dob = NA
  }else{
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    if(tbl.pt.row$birth_days_to == "[Not Available]"){ dob= NA
    }else{
      birth.offset <-   as.integer(tbl.pt.row$birth_days_to)
      dob <- reformatDate(format(diagnosis.date + birth.offset))
    }
  }

  #from lgg
  #diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
  #if(tbl.pt.row$birth_days_to == "[Not Available]"){ dob= NA
  #} else{   birth.offset <-   as.integer(tbl.pt.row$birth_days_to)
  #dob <- reformatDate(format(diagnosis.date + birth.offset))
  #}

  race <- tbl.pt.row$race
  ethnicity <- tbl.pt.row$ethnicity
  gender <- tbl.pt.row$gender
  #check
  if(gender == "Unspecified") gender = "absent"
  if(gender == "Unknown") gender = NA
  if(!is.na(gender)) gender= tolower(gender)
  
  if(race == "Not reported") race = "absent"
  if(race == "Unknown" || race == "[Not Available]" || race == "[Not Evaluated]" || race == "[Unknown]") race = NA
  if(!is.na(race)) race=tolower(race)
  
  if(ethnicity == "Not reported") ethnicity  = "absent"
  if(ethnicity == "Unknown" || ethnicity == "[Not Available]" || ethnicity == "[Not Evaluated]" || ethnicity == "[Unknown]") ethnicity  = NA
  if(!is.na(ethnicity)) ethnicity=tolower(ethnicity)
  
  return(list(PatientID=patient.id, PtNum=patient.number, study=study, Name="Birth", Fields= list(date=c(dob), gender=gender, race=race, ethnicity=ethnicity)))

} # create.DOB.record
#----------------------------------------------------------------------------------------------------
create.all.Diagnosis.records <- function(patient.id)
{
	 
	 tbl.good <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode==patient.id)         
	 ids <- unique(tbl.good$bcr_patient_barcode)   
	  
	 count <- 1
	 result <- vector("list", nrow(tbl.good))
	 for(id in ids){
	   #printf("id: %s", id)
	   new.list <- create.Diagnosis.record(id)
	   range <- count:(count+length(new.list)-1)
	   result[range] <- new.list
	   count <- count + length(new.list)
	 } # for id
	  
	 # some number of the expected events will fail, often (always?) because
	 # one or both dates is "[Not Available]".  count tells us how many good 
	 # we found
	 if(length(result) == 0)
	  return(list())
	 deleters <- which(unlist(lapply(result, is.null)))
	 if(length(deleters) > 0)
	  result <- result[-deleters]
	  
	 result
	  
} # create.all.Diagnosis.records

#----------------------------------------------------------------------------------------------------
create.Diagnosis.record <- function(patient.id)
{
	 tbl.pt.row <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode==patient.id) 
	 diagnosis.year <- tbl.pt.row$initial_pathologic_dx_year[1]
	 if(diagnosis.year == "[Not Available]"){
	   diagnosis.date = NA
	 }else{
	   diagnosis.date <- reformatDate(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
	 }
	 patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
	 patient.number <- as.integer(id.map[patient.id])
	 
	 #from lgg
	 #diagnosis.date <- reformatDate(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
	 #patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
	 #patient.number <- as.integer(id.map[patient.id])
	  
	 name <- "Diagnosis"
	  
	 result <- vector("list", nrow(tbl.pt.row))
	 good.records.found <- 0
	  
	 disease <- tbl.pt.row$tumor_tissue_site
	 if(disease == "[Not Available]") disease = NA
	 tissueSourceSiteCode <- tbl.pt.row$tissue_source_site
	 new.event <- list(PatientID=patient.id,
	                   PtNum=patient.number,
	                   study=study,
	                   Name=name,
	                   Fields = list(date=diagnosis.date, disease=disease, siteCode=tissueSourceSiteCode))
	  
	 good.records.found <- good.records.found + 1
	 result[[good.records.found]] <- new.event
	  
	 result[1:good.records.found]
		  
} # create.Diagnosis.record
	
#------------------------------------------------------------------------------------------------------------------------	
create.status.record <- function(patient.id)
{
  tbl.pt.row <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode==patient.id) 
  
  name <- "Status"
  
  diagnosis.year <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
  if( diagnosis.year == "[Not Available]" || is.na(diagnosis.year)){
    diagnosis.year = NA
    diagnosis.date = NA
  }else{
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
  }
  vital <- tbl.pt.row$vital_status
  tumorStatus <- tbl.pt.row$tumor_status
  
  if(vital == "Dead"){
    if (tbl.pt.row$death_days_to == "[Not Available]" || tbl.pt.row$death_days_to == "[Not Applicable]"){
      status.offset = NA
    }else{
      status.offset <-   as.integer(tbl.pt.row$death_days_to)
    }
    tumorStatus = tbl.pt.row["tumor_status"]
  }else{
    if(tbl.pt.row$last_contact_days_to == "[Not Available]" || tbl.pt.row$last_contact_days_to == "[Completed]"){
      status.offset = NA
    }else{status.offset <-   as.integer(tbl.pt.row$last_contact_days_to)}
  
    tbl.fu.rows <- subset(RawTables[["tbl.followup_1"]], bcr_patient_barcode==patient.id)
    if(nrow(tbl.fu.rows) != 0 ){
      for(i in 1:nrow(tbl.fu.rows)){
        row <- tbl.fu.rows[i, ]
        if(row["vital_status"]=="Dead"){ 
          vital= row[["vital_status"]]
          if (row$death_days_to == "[Not Available]" || row$death_days_to == "[Not Applicable]"){
            status.offset = NA
          }else{status.offset <- as.integer(row["death_days_to"])}
          tumorStatus = row["tumor_status"]
          break
        }else{
          #fix
          if(is.na(status.offset) || row["last_contact_days_to"] > status.offset) {
            vital= row[["vital_status"]]
            if(row$last_contact_days_to == "[Not Available]" || row$last_contact_days_to  == "[Discrepancy]"){
              status.offset = NA
              #}else if(!is.na(status.offset) && (row$last_contact_days_to > status.offset)){
              #if(row$last_contact_days_to > status.offset) 
              #    status.offset = NA 
            }else{status.offset <- as.integer(row["last_contact_days_to"])}
          }
          tumorStatus = row["tumor_status"]
        }}}
    
    if(exists("tbl.followup_2")){ #all added
    tbl.fu.rows <- subset(RawTables[["tbl.followup_2"]], bcr_patient_barcode==patient.id)
    if(nrow(tbl.fu.rows) != 0 ){
      for(i in 1:nrow(tbl.fu.rows)){
        row <- tbl.fu.rows[i, ]
        if(row["vital_status"]=="Dead"){ 
          vital= row[["vital_status"]]
          if (row$death_days_to == "[Not Available]" || row$death_days_to == "[Not Applicable]"){
            status.offset = NA
          }else{status.offset <-   as.integer(row["death_days_to"])}
          tumorStatus = row["tumor_status"]
          break
        }else{
          #fix
          if(is.na(status.offset) || row["last_contact_days_to"] > status.offset) {
            vital= row[["vital_status"]]
            if(row$last_contact_days_to == "[Not Available]" || row$last_contact_days_to  == "[Discrepancy]"){
              status.offset = NA
              #}else if(!is.na(status.offset) && (row$last_contact_days_to > status.offset)){
              #if(row$last_contact_days_to > status.offset) 
              #    status.offset = NA 
            }else{status.offset <- as.integer(row["last_contact_days_to"])}
          }
          tumorStatus = row["tumor_status"]
        }
      }}}
    if(exists("tbl.followup_3")){ 
    tbl.fu.rows <- subset(RawTables[["tbl.followup_3"]], bcr_patient_barcode==patient.id)
    if(nrow(tbl.fu.rows) != 0 ){
      for(i in 1:nrow(tbl.fu.rows)){
        row <- tbl.fu.rows[i, ]
        if(row["vital_status"]=="Dead"){ 
          vital= row[["vital_status"]]
          if (row$death_days_to == "[Not Available]" || row$death_days_to == "[Not Applicable]"){
            status.offset = NA
          }else{status.offset <-   as.integer(row["death_days_to"])}
          tumorStatus = row["tumor_status"]
          break
        }else{
          #fix
          if(is.na(status.offset) || row["last_contact_days_to"] > status.offset) {
            vital= row[["vital_status"]]
            if(row$last_contact_days_to == "[Not Available]" || row$last_contact_days_to  == "[Discrepancy]"){
              status.offset = NA
              #}else if(!is.na(status.offset) && (row$last_contact_days_to > status.offset)){
              #if(row$last_contact_days_to > status.offset) 
              #    status.offset = NA 
            }else{status.offset <- as.integer(row["last_contact_days_to"])}
          }
          tumorStatus = row["tumor_status"]
        }
      }}}
    if(vital == "[Not Available]" || vital == "Unknown") vital=NA
    }
  if(is.na(diagnosis.date) || is.na(status.offset)){
    date = NA
  }else{
    date <- reformatDate(format(diagnosis.date + status.offset))
  }
  if(tumorStatus == "[Not Available]" || tumorStatus == "[Unknown]" || tumorStatus == "[Discrepancy]" ){ tumorStatus=NA
  }else{ tumorStatus = tolower(tumorStatus) }
  
  patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
  patient.number <- as.integer(id.map[patient.id])
  
  return(list(PatientID=patient.id, PtNum=patient.number, study=study, Name=name, Fields=list(date=date, status= vital, tumorStatus=tumorStatus)))

}# create.status.record  
#------------------------------------------------------------------------------------------------------------------------
create.all.Progression.records <- function(patient.ids)
{
  #//orginal script
  #tbl.good <- subset(RawTables[["tbl.nte_followup_1"]], bcr_patient_barcode %in% patient.ids )
  #tbl.nteSub <- subset(RawTables[["tbl.nte"]], bcr_patient_barcode %in% patient.ids & new_tumor_event_dx_days_to != "[Not Available]")
  #ids <- unique(c(tbl.good$bcr_patient_barcode, tbl.nteSub$bcr_patient_barcode))  
  
  
  tbl.good <- subset(RawTables[["tbl.nte"]], bcr_patient_barcode %in% patient.ids)
                      #& new_tumor_event_dx_days_to != "[Not Available]" || new_tumor_event_dx_days_to != "[Not Applicable]")
  
  ids <- tbl.good$bcr_patient_barcode
  
  if("tbl.nte_followup_1" %in% names(RawTables)){
       tbl.good0 <- subset(RawTables[["tbl.nte_followup_1"]], bcr_patient_barcode %in% patient.ids) 
                          #& new_tumor_event_dx_days_to != "[Not Available]" || new_tumor_event_dx_days_to != "[Not Applicable]") 
       ids <- c(ids, tbl.good0$bcr_patient_barcode)
  }
  if("tbl.followup_1" %in% names(RawTables) && 
     (any(c("new_tumor_event_type", "new_tumor_event_dx_days_to", "new_neoplasm_event_type") %in% 
      colnames(RawTables[["tbl.followup_1"]])))){
      tbl.good1 <- subset(RawTables[["tbl.followup_1"]], bcr_patient_barcode %in% patient.ids) 
                          #& new_tumor_event_dx_days_to != "[Not Available]" || new_tumor_event_dx_days_to != "[Not Applicable]")
      ids <- c(ids, tbl.good1$bcr_patient_barcode)
  }
  if("tbl.followup_2" %in% names(RawTables)){
    tbl.good2 <- subset(RawTables[["tbl.followup_2"]], bcr_patient_barcode %in% patient.ids)  
                        #& new_tumor_event_dx_days_to != "[Not Available]" || new_tumor_event_dx_days_to != "[Not Applicable]")
    ids <- c(ids, tbl.good2$bcr_patient_barcode)
  }
  
  
  ids <- unique(ids)  
  print("*****")
  print(length(ids))

  count <- 1
  result <- vector("list", nrow(tbl.good))
  emptyProEle <- c()
  for(id in ids){
    new.list <- create.Progression.record(id)
    range <- count:(count+length(new.list)-1)
    #if(length(new.list) == 0){
    #   emptyProEle <- c(emptyProEle, id)
    #   next
    #} 
    result[range] <- new.list
    count <- count + length(new.list)
  } # for id
  
  # Count tells us how many good events we found
  deleters <- which(unlist(lapply(result, is.null)))
  if(length(deleters) > 0)
    result <- result[-deleters]

  result
} # create.all.Progression.records
#------------------------------------------------------------------------------------------------------------------------
create.Progression.record <- function(patient.id)
{
  diagnosis.year <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
  if( diagnosis.year == "[Not Available]" || is.na(diagnosis.year)){
    diagnosis.year = NA
    diagnosis.date = NA
  }else{
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
  }
  
  if("tbl.nte" %in% names(RawTables) && 
     (any(c("new_tumor_event_type", "new_tumor_event_dx_days_to", "new_neoplasm_event_type") %in% 
          colnames(RawTables[["tbl.nte"]])))){
    if("new_tumor_event_type" %in% colnames(RawTables[["tbl.nte"]])){
      tbl.fu.rows <- subset(RawTables[["tbl.nte"]], bcr_patient_barcode == patient.id, select=c("new_tumor_event_type", "new_tumor_event_dx_days_to"))
      colnames(tbl.fu.rows) <- c("new_tumor_event_type", "new_tumor_event_dx_days_to")
    }else if("new_neoplasm_event_type" %in% colnames(RawTables[["tbl.nte"]])){
      tbl.fu.rows <- subset(RawTables[["tbl.nte"]], bcr_patient_barcode == patient.id, select=c("new_neoplasm_event_type", "new_tumor_event_dx_days_to"))
      colnames(tbl.fu.rows) <- c("new_tumor_event_type", "new_tumor_event_dx_days_to")
    }else{
      tbl.fu.rows <- subset(RawTables[["tbl.nte"]], bcr_patient_barcode == patient.id, select="new_tumor_event_dx_days_to")
      tbl.fu.rows <- cbind(rep(NA, nrow(tbl.fu.rows)), tbl.fu.rows)
      colnames(tbl.fu.rows) <- c("new_tumor_event_type", "new_tumor_event_dx_days_to")
    }
  }   
 
  if("tbl.nte_followup_1" %in% names(RawTables) && 
    (any(c("new_tumor_event_type", "new_tumor_event_dx_days_to", "new_neoplasm_event_type") %in% 
           colnames(RawTables[["tbl.nte_followup_1"]])))){
    if("new_tumor_event_type" %in% colnames(RawTables[["tbl.nte_followup_1"]])){
        tbl.good0.rows <- subset(RawTables[["tbl.nte_followup_1"]], bcr_patient_barcode == patient.id, 
                               select=c("new_tumor_event_type", "new_tumor_event_dx_days_to"))
        colnames(tbl.good0.rows) <- colnames(tbl.fu.rows)
        tbl.fu.rows <- rbind(tbl.fu.rows, tbl.good0.rows)
    }else if("new_neoplasm_event_type" %in% colnames(RawTables[["tbl.nte_followup_1"]])){
        tbl.good0.rows <- subset(RawTables[["tbl.nte_followup_1"]], bcr_patient_barcode == patient.id, 
                               select=c("new_neoplasm_event_type", "new_tumor_event_dx_days_to"))
        colnames(tbl.good0.rows) <- colnames(tbl.fu.rows)
        tbl.fu.rows <- rbind(tbl.fu.rows, tbl.good0.rows)
    }else{
        tbl.good0.rows <- subset(RawTables[["tbl.nte_followup_1"]], bcr_patient_barcode == patient.id, 
                               select="new_tumor_event_dx_days_to")
        tbl.good0.rows <- cbind(rep(NA, nrow(tbl.good0.rows)), tbl.good1.rows)
        colnames(tbl.good0.rows) <- colnames(tbl.fu.rows)
        tbl.fu.rows <- rbind(tbl.fu.rows, tbl.good0.rows)
    } 
  }
  
  if("tbl.followup_1" %in% names(RawTables) && 
     (any(c("new_tumor_event_type", "new_tumor_event_dx_days_to", "new_neoplasm_event_type") %in% 
      colnames(RawTables[["tbl.followup_1"]])))){
    
    if("new_tumor_event_type" %in% colnames(RawTables[["tbl.followup_1"]])){
      tbl.good1.rows <- subset(RawTables[["tbl.followup_1"]], bcr_patient_barcode == patient.id, 
                               select=c("new_tumor_event_type", "new_tumor_event_dx_days_to"))
      colnames(tbl.good1.rows) <- colnames(tbl.fu.rows)
      tbl.fu.rows <- rbind(tbl.fu.rows, tbl.good1.rows)
    }else if("new_neoplasm_event_type" %in% colnames(RawTables[["tbl.followup_1"]])){
      tbl.good1.rows <- subset(RawTables[["tbl.followup_1"]], bcr_patient_barcode == patient.id, 
                               select=c("new_neoplasm_event_type", "new_tumor_event_dx_days_to"))
      colnames(tbl.good1.rows) <- colnames(tbl.fu.rows)
      tbl.fu.rows <- rbind(tbl.fu.rows, tbl.good1.rows)
    }else{
      tbl.good1.rows <- subset(RawTables[["tbl.followup_1"]], bcr_patient_barcode == patient.id, 
                               select="new_tumor_event_dx_days_to")
      tbl.good1.rows <- cbind(rep(NA, nrow(tbl.good1.rows)), tbl.good1.rows)
      colnames(tbl.good1.rows) <- colnames(tbl.fu.rows)
      tbl.fu.rows <- rbind(tbl.fu.rows, tbl.good1.rows)
    }
  }
  
  if("tbl.followup_2" %in% names(RawTables) && 
     (any(c("new_tumor_event_type", "new_tumor_event_dx_days_to", "new_neoplasm_event_type") %in% 
      colnames(RawTables[["tbl.followup_2"]])))){
    
    if("new_tumor_event_type" %in% colnames(RawTables[["tbl.followup_2"]])){
      tbl.good2.rows <- subset(RawTables[["tbl.followup_2"]], bcr_patient_barcode == patient.id, 
                               select=c("new_tumor_event_type", "new_tumor_event_dx_days_to"))
      colnames(tbl.good2.rows) <- colnames(tbl.fu.rows)
      tbl.fu.rows <- rbind(tbl.fu.rows, tbl.good2.rows)
    }else if("new_neoplasm_event_type" %in% colnames(RawTables[["tbl.followup_2"]])){
      tbl.good2.rows <- subset(RawTables[["tbl.followup_2"]], bcr_patient_barcode == patient.id, 
                               select=c("new_neoplasm_event_type", "new_tumor_event_dx_days_to"))
      colnames(tbl.good2.rows) <- colnames(tbl.fu.rows)
      tbl.fu.rows <- rbind(tbl.fu.rows, tbl.good2.rows)
    }else{
      tbl.good2.rows <- subset(RawTables[["tbl.followup_2"]], bcr_patient_barcode == patient.id, 
                               select="new_tumor_event_dx_days_to")
      tbl.good2.rows <- cbind(rep(NA, nrow(tbl.good2.rows)), tbl.good2.rows)
      colnames(tbl.good2.rows) <- colnames(tbl.fu.rows)
      tbl.fu.rows <- rbind(tbl.fu.rows, tbl.good2.rows)
    }
  }
  
  
  
 if(nrow(tbl.fu.rows)==0)
 return(list())

  
  #not in all dp scripts-needed for hnsc
  tbl.fu.rows <- tbl.fu.rows[with(tbl.fu.rows, order(new_tumor_event_dx_days_to)),] 
  
  #dup handeling-event="Progression of Disease;Recurrence"
  duplicates <- which(duplicated(tbl.fu.rows[,"new_tumor_event_dx_days_to"]))
  if(length(duplicates)>0){
    dupVals <- unique(tbl.fu.rows[duplicates, "new_tumor_event_dx_days_to"])
    originals <- match(dupVals, tbl.fu.rows$new_tumor_event_dx_days_to)
    allVals <- sapply(dupVals, function(val) {
      t<- paste(tbl.fu.rows[which(tbl.fu.rows$new_tumor_event_dx_days_to == val), "new_tumor_event_type"], collapse=";")
      t<- gsub("\\[Unknown\\]", "", t)
      t<- gsub("\\[Not Available\\]", "", t)
      t<- gsub("NA", "", t)
      while(grepl(";;", t)){ t<- gsub(";;", ";", t)}
      gsub(";$", "", t)
    })
    tbl.fu.rows[originals, "new_tumor_event_type"] <- allVals
    tbl.fu.rows <- tbl.fu.rows[-duplicates,]
  }
  
  name <- "Progression"
  result <- vector("list", nrow(tbl.fu.rows) )
  good.records.found <- 0
  good.number <- 0
  #if(all(tbl.fu.rows$new_tumor_event_dx_days_to != "[Not Available]")) #added from coad
    #tbl.fu.rows <- tbl.fu.rows[order(as.integer(tbl.fu.rows$new_tumor_event_dx_days_to)),] #added from coad
  
  #setting tumor event type 
  if(nrow(tbl.fu.rows)>0){
    for(i in 1:nrow(tbl.fu.rows)){
      row <- tbl.fu.rows[i, ]
      eventtype <- row[["new_tumor_event_type"]]
      if(!is.na(eventtype) ){ if(eventtype == "[Unknown]" | eventtype == "[Not Available]" | eventtype == "") eventtype = NA }
      
      #setting dx days to: what if the field is "[Not Available]"? set to NA
      if(row["new_tumor_event_dx_days_to"] != "[Not Available]" && row["new_tumor_event_dx_days_to"] != "[Not Applicable]"){
        progression.offset <-   as.integer(row["new_tumor_event_dx_days_to"])
        patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
        patient.number <- as.integer(id.map[patient.id])
        progression <- reformatDate(format(diagnosis.date + progression.offset))
        
        new.event <- list(PatientID=patient.id,
                          PtNum=patient.number,
                          study=study,
                          Name=name,
                          Fields=list(date=progression, event=eventtype, number=good.number+1))
        good.number <- good.number + 1
        good.records.found <- good.records.found + 1
        result[[good.records.found]] <- new.event
      }else if(!is.na(eventtype)){
      	progression.offset <-   as.integer(row["new_tumor_event_dx_days_to"])
        patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
        patient.number <- as.integer(id.map[patient.id])
        progression <- reformatDate(format(diagnosis.date + progression.offset))
        
        new.event <- list(PatientID=patient.id,
                          PtNum=patient.number,
                          study=study,
                          Name=name,
                          Fields=list(date=progression, event=eventtype, number=NA))
        good.records.found <- good.records.found + 1
        result[[good.records.found]] <- new.event
      }
    }}
  
  
  result[1:good.records.found]
  
} # create.Progression.record
#------------------------------------------------------------------------------------------------------------------------
#Chemo records here!
create.Chemo.record <- function(patient.id)
{

   tbl.drugSub <- subset(RawTables[["tbl.drug"]], bcr_patient_barcode==patient.id )
   tbl.omf.row <- subset(RawTables[["tbl.omf"]], bcr_patient_barcode==patient.id & drug_tx_indicator=="YES")

   if(nrow(tbl.drugSub) == 0 && nrow(tbl.omf.row) == 0)
       return(list())
   
   diagnosis.year <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
   if( diagnosis.year == "[Not Available]" || is.na(diagnosis.year)){
     diagnosis.year = NA
     diagnosis.date = NA
   }else{
     diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
   }

   patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
   patient.number <- as.integer(id.map[patient.id])

   name <- "Drug"

   result <- vector("list", nrow(tbl.drugSub) +nrow(tbl.omf.row))
   good.records.found <- 0
   
     # to look at the subset:
     # tbl.drugSub[, c("pharmaceutical_therapy_type", "pharmaceutical_therapy_drug_name", "pharmaceutical_tx_started_days_to", "pharmaceutical_tx_ended_days_to", 
     #                 "pharma_adjuvant_cycles_count", "pharmaceutical_tx_dose_units", "pharmaceutical_tx_total_dose_units", "prescribed_dose", 
     #                 "regimen_number", "route_of_administration", "therapy_regimen", "therapy_regimen_other", "total_dose")]

   if(nrow(tbl.drugSub)>0){
   		for(chemoEvent in 1:nrow(tbl.drugSub)){
		 	  start.chemoDate <- tbl.drugSub$pharmaceutical_tx_started_days_to[chemoEvent]
		  	end.chemoDate <- tbl.drugSub$pharmaceutical_tx_ended_days_to[chemoEvent]
			   
        if(!is.na(diagnosis.date)){
            if(start.chemoDate !="[Not Available]"){
                start.date.unformatted <- diagnosis.date + as.integer(start.chemoDate)
                start.date <- reformatDate(start.date.unformatted)
            } else{ start.date = NA }
            if( end.chemoDate !="[Not Available]") {
                end.date.unformatted <- diagnosis.date + as.integer(end.chemoDate)
                end.date <- reformatDate(end.date.unformatted)
            } else{  end.date = NA }
            
            date= c(start.date, end.date)
        }else{
            date= c(NA, NA)
        }

			drug <- tbl.drugSub$pharmaceutical_therapy_drug_name[chemoEvent]
			if(drug %in% drug_ref[,1]) drug <- drug_ref[drug_ref$Common.Names == drug,]$Standardized.Names
			if(is.na(drug)) drug <- NA # to conver character NA to logical NA
		    therapyType     <- tbl.drugSub$pharmaceutical_therapy_type[chemoEvent] 
		    intent          <- tbl.drugSub$therapy_regimen[chemoEvent] 
		    dose            <- tbl.drugSub$prescribed_dose[chemoEvent] 
		    totalDose       <- tbl.drugSub$total_dose[chemoEvent] 
		    units           <- tbl.drugSub$pharmaceutical_tx_dose_units[chemoEvent] 
		    totalDoseUnits  <- tbl.drugSub$pharmaceutical_tx_total_dose_units[chemoEvent] 
		    route           <- tbl.drugSub$route_of_administration[chemoEvent] 
		    cycle           <- tbl.drugSub$pharma_adjuvant_cycles_count[chemoEvent] 


		    if(therapyType == "[Discrepancy]" || therapyType == "[Not Available]") therapyType = NA
		    if(intent == "OTHER: SPECIFY IN NOTES") intent <- tbl.drugSub$therapy_regimen_other[chemoEvent]
		    if(intent == "Adjuvant and progression") intent <- "Adjuvant and Progression"
		    if(intent == "Concurrent chemoradiation" || intent == "Concurrent Chemoradiation") intent <- "Concurrent"
		    if(intent == "Maintainence") intent <- "Maintenance"
		    if(intent == "[Not Available]" || intent == "[Not Applicable]") intent = NA
		    if(!is.na(intent)) intent <- tolower(intent)
		    
		    if(dose == "[Not Available]") dose <- NA
		    if(grepl("^\\d+$", dose)) dose <- as.integer(dose) 
		    if(totalDose == "[Not Available]") totalDose <- NA
		    if(grepl("^\\d+$", totalDose)) totalDose <- as.integer(totalDose) 
		    if(totalDoseUnits == "[Not Available]") totalDoseUnits <- NA
		    if(units == "[Not Available]") units <- NA
		    
		    if(route == "Intra-peritoneal (IP)|Intravenous (IV)") route <- "IP or IV"
		    if(route == "Other (specify below)") route <- "Other"
		    if(route == "[Not Available]") route <- NA
		 
		    if(cycle == "[Not Available]") cycle <- NA
		    if(grepl("^\\d+$", cycle)) cycle <- as.integer(cycle) 
		    
			new.event <- list(PatientID=patient.id,
			                    PtNum=patient.number,
			                    study=study,
			                    Name="Drug",
			                    Fields = list(date=date, therapyType=therapyType, agent=drug, intent=intent, dose=dose, units=units, 
			                                  totalDose=totalDose, totalDoseUnits=totalDoseUnits, route=route, cycle=cycle)
			                    )
	        good.records.found <- good.records.found + 1
	        result[[good.records.found]] <- new.event
      	}} # for chemoEvent

	    if(nrow(tbl.omf.row)>0){
	    	for(omfEvent in 1:nrow(tbl.omf.row)){
			      drug <- tbl.omf.row$drug_name[omfEvent]
			      if(drug %in% drug_ref[,1]) drug <- drug_ref[drug_ref$Common.Names == drug,]$Standardized.Names
			      if(is.na(drug)){
			      	 drug <- NA # to conver character NA to logical NA
			  	  }
			      omfOffset = tbl.omf.row$days_to_drug_therapy_start[omfEvent]
			      if(omfOffset == "[Not Available]" || omfOffset == "[Pending]"){ omf.date = c(NA, NA)
			      }else{  omf.date = reformatDate(as.Date(diagnosis.date, "%m/%d/%Y") + as.integer(omfOffset))      }
			      intent = tbl.omf.row$malignancy_type[omfEvent]
			      if(intent == "[Not Available]") intent = NA      
			        new.event <- list(PatientID=patient.id,
			                        PtNum=patient.number,
			                        study=study,
			                        Name="Drug",
			                        Fields = list(date=omf.date, therapyType=NA, agent=drug, intent=intent, dose=NA, units=NA, 
			                                      totalDose=NA, totalDoseUnits=NA, route=NA, cycle=NA)
			                        )
		   
		    good.records.found <- good.records.found + 1
		    result[[good.records.found]] <- new.event
   		}}

   result[1:good.records.found]
   
} # create.Chemo.record
#----------------------------------------------------------------------------------------------------
create.all.Chemo.records <- function(patient.ids)
{
   tbl.drugSub <- subset(RawTables[["tbl.drug"]], bcr_patient_barcode %in% patient.ids)
   tbl.omfSub <- subset(RawTables[["tbl.omf"]], bcr_patient_barcode %in% patient.ids & drug_tx_indicator=="YES")

   ids <- unique(c(tbl.drugSub$bcr_patient_barcode,tbl.omfSub$bcr_patient_barcode ) )  
   count <- 1
   result <- vector("list", length(ids))
   for(id in ids){
     #printf("id: %s", id)
     new.list <- create.Chemo.record(id)
     range <- count:(count+length(new.list)-1)
     result[range] <- new.list
     count <- count + length(new.list)
     } # for id

     # some number of the expected events will fail, often (always?) because
     # one or both dates is "[Not Available]".  count tells us how many good 
     # we found
   if(length(result) == 0)
        return(list())
   deleters <- which(unlist(lapply(result, is.null)))
   if(length(deleters) > 0)
   result <- result[-deleters]
   result

} # create.all.Chemo.records
#-----------------------------------------------------------------------------------------------
create.Radiation.record <- function(patient.id)
{

   tbl.radSub <- subset(RawTables[["tbl.rad"]], bcr_patient_barcode==patient.id & radiation_therapy_ongoing_indicator != "YES")
   tbl.omfSub <- subset(RawTables[["tbl.omf"]], bcr_patient_barcode==patient.id & radiation_tx_indicator == "YES")
   if(nrow(tbl.radSub) == 0 & nrow(tbl.omfSub) == 0)
       return(list())  
    # check ABSENT table in Caisis for UW/MSK data
   
   diagnosis.year <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
   if( diagnosis.year == "[Not Available]" || is.na(diagnosis.year)){
     diagnosis.year = NA
     diagnosis.date = NA
   }else{
     diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
   }

   patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
   patient.number <- as.integer(id.map[patient.id])

   name <- "Radiation"

   result <- vector("list", nrow(tbl.radSub)+nrow(tbl.omfSub))
   good.records.found <- 0
   
     # to look at the subset:
     # tbl.radSub[, c("radiation_therapy_type", "radiation_therapy_started_days_to", "radiation_therapy_ongoing_indicator", "radiation_therapy_ended_days_to")]

   if(nrow(tbl.radSub)>0){
      for(radEvent in 1:nrow(tbl.radSub)){
        start.radDate <- tbl.radSub$radiation_therapy_started_days_to[radEvent]
        end.radDate <- tbl.radSub$radiation_therapy_ended_days_to[radEvent]

        if(!is.na(diagnosis.date)){
              if(start.radDate != "[Not Available]"){
                  start.date.unformatted <- diagnosis.date + as.integer(start.radDate)
                  start.date <- reformatDate(start.date.unformatted)
              }else{ start.date = NA }
              if(end.radDate != "[Not Available]") {
                  end.date.unformatted <- diagnosis.date + as.integer(end.radDate)
                  end.date <- reformatDate(end.date.unformatted)
              }else{ end.date = NA } 
              date= c(start.date, end.date)
        }else{
            date= c(NA, NA)
        }

    radTypeRaw <- tbl.radSub$radiation_therapy_type[radEvent]
    radType <- rad_ref[rad_ref$Common.RadType==radTypeRaw,2]
    if(!is.na(radType) && radType == "Other: Specify in Notes"){
        radTypeRaw <- tbl.radSub$radiation_type_other[radEvent]
        radType    <- rad_ref[rad_ref$Common.OtherRadType==radTypeRaw,4]
    }
    if(is.na(radType)){radType <- NA}
  
    intent          <- tbl.radSub$therapy_regimen[radEvent] 
    target          <- tbl.radSub$radiation_therapy_site[radEvent]
    totalDose       <- tbl.radSub$radiation_total_dose[radEvent] 
    totalDoseUnits  <- tbl.radSub$radiation_adjuvant_units[radEvent] 
    NumFractions    <- tbl.radSub$radiation_adjuvant_fractions_total[radEvent]

    
    if(target == "[Not Available]" || target == "[Unknown]") target = NA
    if(intent == "OTHER: SPECIFY IN NOTES") intent = tbl.radSub$therapy_regimen_other[radEvent]
    if(intent == "[Unknown]" || intent == "[Not Available]") intent = NA
    if(!is.na(intent)) intent = tolower(intent)
    if(NumFractions == "[Not Available]") NumFractions = NA
    if(grepl("^\\d+\\.*\\d*$",NumFractions)) NumFractions = as.double(NumFractions)

    if(totalDose == "[Not Available]") totalDose = NA
    if(totalDoseUnits == "[Not Available]") totalDoseUnits = NA
    if(grepl("^\\d+$",totalDose)) totalDose = as.integer(totalDose)
        
    # 1Gy = 100cGy
    if(!is.na(totalDoseUnits) && totalDoseUnits == "Gy" && is.integer(totalDose)) {
       totalDose = 100 * totalDose
       totalDoseUnits = "cGy"
    }

    if(grepl("[A-Za-z]", totalDose)){
        if(is.na(totalDoseUnits)){
           totalDoseUnits <- str_extract(totalDose, "[A-Za-z]+")
        }
        totalDose <- str_extract(totalDose,"[0-9,]+")
        totalDose <- as.integer(gsub(",","",totalDose))
    }
    
    
    new.event <- list(PatientID=patient.id,
                      PtNum=patient.number,
                      study=study,
                      Name=name,
                      Fields = list(date=date, therapyType=radType, intent=intent, target=target, 
                                    totalDose=totalDose, totalDoseUnits=totalDoseUnits, numFractions=NumFractions))
    good.records.found <- good.records.found + 1
    result[[good.records.found]] <- new.event
    }} # for radEvent

    if(nrow(tbl.omfSub)>0){
      for(omfEvent in 1:nrow(tbl.omfSub)){
        target <- tbl.omfSub$radiation_tx_extent[omfEvent]
        if(target == "[Not Available]" || target == "[Unknown]") target = NA
        atTumorsite <- tbl.omfSub$rad_tx_to_site_of_primary_tumor[omfEvent]
        if(atTumorsite == "[Not Available]") atTumorsite = NA
        if(!is.na(target) & !is.na(atTumorsite)) target = paste(target, ", at primary tumor site: ", tolower(atTumorsite), sep="")
        omfOffset = tbl.omfSub$days_to_radiation_therapy_start[omfEvent]
        if(omfOffset == "[Not Available]" | omfOffset == "[Pending]"){ omf.date = NA
        }else{  omf.date = reformatDate(diagnosis.date + as.integer(omfOffset))      }
        #therapyType = tbl.omfSub$malignancy_type[omfEvent]
        #if(therapyType == "[Not Available]") therapyType = NA      
        new.event <- list(PatientID=patient.id,
                          PtNum=patient.number,
                          study=study,
                          Name=name,
                          Fields = list(date=c(omf.date, NA), therapyType=NA, intent=NA, target=target,
                                        totalDose=NA, totalDoseUnits=NA, numFractions=NA))
     
        good.records.found <- good.records.found + 1
        result[[good.records.found]] <- new.event
      }}

   result[1:good.records.found]
   
} # create.Radiation.record
#----------------------------------------------------------------------------------------------------
create.all.Radiation.records <- function(patient.ids)
{
    #501 good records
   tbl.good <- subset(RawTables[["tbl.rad"]], bcr_patient_barcode %in% patient.ids & radiation_therapy_ongoing_indicator != "YES")
   tbl.omfSub <- subset(RawTables[["tbl.omf"]], bcr_patient_barcode %in% patient.ids &  radiation_tx_indicator == "YES")
   ids <- unique(c(tbl.good$bcr_patient_barcode, tbl.omfSub$bcr_patient_barcode))   # 432

   count <- 1
   result <- vector("list", nrow(tbl.good))
   for(id in ids){
     #printf("id: %s", id)
     new.list <- create.Radiation.record(id)
     range <- count:(count+length(new.list)-1)
     result[range] <- new.list
     count <- count + length(new.list)
     } # for id

     # some number of the expected events will fail, often (always?) because
     # one or both dates is "[Not Available]".  count tells us how many good 
     # we found
   deleters <- which(unlist(lapply(result, is.null)))
   if(length(deleters) > 0)
     result <- result[-deleters]
    
   result  
} # create.all.Radiation.records
#----------------------------------------------------------------------------------------------------
create.all.Encounter.records <- function(patient.ids)
{
  #create Encounter tables
  tbl.ptSub <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode %in% patient.ids)
  tbl.fuSub <- subset(RawTables[["tbl.followup_1"]], bcr_patient_barcode %in% patient.ids)
  
  #set up a search string
  string <- c("karnofsky_score","ecog_score","systolic","diastolic","height_cm_at_diagnosis","weight_kg_at_diagnosis","bsa","bmi",
              "zubrod","fev1_fvc_ratio_prebroncholiator", "fev1_percent_ref_prebroncholiator","fev1_fvc_ratio_postbroncholiator",
              "fev1_percent_ref_postbroncholiator", "carbon_monoxide_diffusion_dlco")
  
  #create a blank vector for Ids
  ids <- c()
  
  #if any of the "" in the string are in the table save the bcr_barcodes in ids
  if(any(string %in% tolower(colnames(tbl.ptSub)))==TRUE){
    ids <- c(ids,tbl.ptSub$bcr_patient_barcode)
  }
  if(any(string %in% tolower(colnames(tbl.fuSub)))==TRUE){
    ids <- c(ids,tbl.fuSub$bcr_patient_barcode)
  }

  #grab all the unique ids
  ids <- unique(ids)
  if(length(ids) == 0){
    return(list())
  }else{
    count <- 1
    result <- vector("list", length(ids))
    for(id in ids){
      printf("id: %s", id)
      new.list <- create.Encounter.record(id)
      range <- count:(count+length(new.list)-1)
      result[range] <- new.list
      count <- count + length(new.list)
    } # for id
    
    # some number of the expected events will fail, often (always?) because
    # one or both dates is "[Not Available]".  count tells us how many good
    # we found
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
      result <- result[-deleters]
    
    result
  }

} # create.all.Encounter.records
#------------------------------------------------------------------------------------------------------------------------
create.Encounter.record <- function(patient.id)
{
  
  tbl.encSub <- subset(RawTables[["tbl.pt"]], bcr_patient_barcode==patient.id)
  tbl.fuSub <- subset(RawTables[["tbl.followup_1"]], bcr_patient_barcode==patient.id)
  
  if(nrow(tbl.encSub) == 0 & nrow(tbl.fuSub) ==0)
    return(list())  
  
  patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
  patient.number <- as.integer(id.map[patient.id])   
  name <- "Encounter"
  
  result <- vector("list", nrow(tbl.encSub)+nrow(tbl.fuSub))
  good.records.found <- 0
  
  if(nrow(tbl.encSub)>0){
    for(encEvent in 1:nrow(tbl.encSub)){
      encType <- tbl.encSub$performance_status_timing[encEvent]
      if(encType == "Preoperative") encType = "Pre-Operative"
      if(encType == "[Not Evaluated]") encType = "absent"
      if(encType == "[Not Available]" | encType == "Unknown" | encType == "[Unknown]") encType = NA
      
      KPS    <- tbl.encSub$karnofsky_score[encEvent]
      ECOG   <- tbl.encSub$ecog_score[encEvent]
  
      if(KPS == "[Not Evaluated]") KPS = "absent"
      if(KPS == "[Not Available]" | KPS == "Unknown" | KPS == "[Unknown]" ) KPS = NA
      if(ECOG == "[Not Evaluated]") ECOG = "absent"
      if(ECOG == "[Not Available]" | ECOG == "Unknown" | ECOG == "[Unknown]" ) ECOG = NA
      
      if(grepl("^\\d+$",KPS)) KPS = as.integer(KPS)
      if(grepl("^\\d+$",ECOG)) ECOG = as.integer(ECOG)
      
      #lung only
      if("fev1_fvc_ratio_prebroncholiator" %in% colnames(tbl.encSub)){
        prefev1.ratio <- tbl.encSub$fev1_fvc_ratio_prebroncholiator[encEvent]
        if(prefev1.ratio  == "[Not Available]") prefev1.ratio = NA
      }
      if("fev1_percent_ref_prebroncholiator" %in% colnames(tbl.encSub)){
        prefev1.percent <- tbl.encSub$fev1_percent_ref_prebroncholiator[encEvent]
        if(prefev1.percent == "[Not Available]") prefev1.percent = NA
      }
      if("fev1_fvc_ratio_postbroncholiator" %in% colnames(tbl.encSub)){
        postfev1.ratio <- tbl.encSub$fev1_fvc_ratio_postbroncholiator[encEvent]
        if(postfev1.ratio  == "[Not Available]") postfev1.ratio = NA
      }
      if("fev1_percent_ref_postbroncholiator" %in% colnames(tbl.encSub)){
        postfev1.percent <- tbl.encSub$fev1_percent_ref_postbroncholiator[encEvent]
        if(postfev1.percent == "[Not Available]") postfev1.percent = NA
      }
      if("carbon_monoxide_diffusion_dlco" %in% colnames(tbl.encSub)){
        carbon.monoxide.diffusion <- tbl.encSub$carbon_monoxide_diffusion_dlco[encEvent]
        if(carbon.monoxide.diffusion == "[Not Available]") carbon.monoxide.diffusion = NA
      }
      
      #coad/read only
      if("height_cm_at_diagnosis" %in% colnames(tbl.encSub)){
        height  <- tbl.encSub$height_cm_at_diagnosis[encEvent]
        if(height == "[Not Available]") height = NA
      }
      if("weight_kg_at_diagnosis" %in% colnames(tbl.encSub)){
        weight  <- tbl.encSub$weight_kg_at_diagnosis[encEvent]
        if(weight == "[Not Available]") weight = NA
      }

      new.event <- list(PatientID=patient.id,
                        PtNum=patient.number,
                        study=study,
                        Name=name,
                        Fields = list(type=encType, kps=KPS, ecog=ECOG, date=NA,
                                      fev1.ratio=NA,fev1.percent=NA, carbon.monoxide.diffusion=NA, 
                                      systolic=NA, diastolic=NA,height=NA,weight=NA,BSA=NA, BMI=NA, ZubrodScore=NA))
      good.records.found <- good.records.found + 1
      result[[good.records.found]] <- new.event
      
      
      if((!(is.na(prefev1.ratio))) | (!(is.na(prefev1.percent)))){
        new.event <- list(PatientID=patient.id,
                          PtNum=patient.number,
                          study=study,
                          Name=name,
                          Fields = list(type="prebroncholiator", kps=NA, ecog=NA, date=NA,
                                        fev1.ratio=prefev1.ratio,fev1.percent=prefev1.percent, carbon.monoxide.diffusion=NA, 
                                        systolic=NA, diastolic=NA,height=NA,weight=NA,BSA=NA, BMI=NA, ZubrodScore=NA))
        good.records.found <- good.records.found + 1
        result[[good.records.found]] <- new.event
      }
      if((!(is.na(postfev1.ratio))) | (!(is.na(postfev1.percent)))){
        new.event <- list(PatientID=patient.id,
                          PtNum=patient.number,
                          study=study,
                          Name=name,
                          Fields = list(type="postbroncholiator", kps=NA, ecog=NA, date=NA,
                                        fev1.ratio=postfev1.ratio,fev1.percent=postfev1.percent, carbon.monoxide.diffusion=NA, 
                                        systolic=NA, diastolic=NA,height=NA,weight=NA,BSA=NA, BMI=NA, ZubrodScore=NA))
        good.records.found <- good.records.found + 1
        result[[good.records.found]] <- new.event
      }
      if(!(is.na(carbon.monoxide.diffusion))){
        new.event <- list(PatientID=patient.id,
                          PtNum=patient.number,
                          study=study,
                          Name=name,
                          Fields = list(type=NA, kps=NA, ecog=NA, date=NA,
                                        fev1.ratio=prefev1.ratio,fev1.percent=prefev1.percent, carbon.monoxide.diffusion=carbon.monoxide.diffusion, 
                                        systolic=NA, diastolic=NA,height=NA,weight=NA,BSA=NA, BMI=NA, ZubrodScore=NA))
        good.records.found <- good.records.found + 1
        result[[good.records.found]] <- new.event
      }
      
      
    }} # for encEvent
  
  if(nrow(tbl.fuSub)>0){
    for(encEvent in 1:nrow(tbl.fuSub)){
      encType <- tbl.fuSub$performance_status_timing[encEvent]
      if(encType == "Preoperative") encType = "Pre-Operative"
      if(encType == "[Not Evaluated]") encType = "absent"
      if(encType == "[Not Available]" || encType == "Unknown") encType = NA
      
      KPS    <- tbl.fuSub$karnofsky_score[encEvent]
      ECOG   <- tbl.fuSub$ecog_score[encEvent]
      
      
      if(KPS == "[Not Evaluated]") KPS = "absent"
      if(KPS == "[Not Available]" || KPS == "Unknown") KPS = NA
      if(ECOG == "[Not Evaluated]") ECOG = "absent"
      if(ECOG == "[Not Available]" || ECOG == "Unknown") ECOG = NA
      
      if(grepl("^\\d+$",KPS)) KPS = as.integer(KPS)
      if(grepl("^\\d+$",ECOG)) ECOG = as.integer(ECOG)
      
      
      new.event <- list(PatientID=patient.id,
                        PtNum=patient.number,
                        study=study,
                        Name=name,
                        Fields = list(type=encType, kps=KPS, ecog=ECOG, date=NA,
                                      fev1.ration=NA,fev1.percent=NA, carbon.monoxide.diffusion=NA, systolic=NA, 
                                      diastolic=NA,height=NA,weight=NA,BSA=NA,
                                      BMI=NA, ZubrodScore=NA))
      good.records.found <- good.records.found + 1
      result[[good.records.found]] <- new.event
    }} # for encEvent
  
  
  result[1:good.records.found]
  
} # create.Encounter.record
#----------------------------------------------------------------------------------------------------

createPatientList <- function(Allevents=NA){
  
  if(all(is.na(Allevents)))
    return(list())
  
  list.events <- Allevents
  
  ptIDs = unique(unlist(lapply(list.events, function(e) e$PatientID)))
  
  ptList <- lapply(ptIDs, function(id){
    orderedEvents <- data.frame()
    noDateEvents <- data.frame()
    calcEvents <- data.frame()
    birth = death = diagnosis = progression = ""
    
    ptEvents <- list.events[sapply(list.events, function(ev) {ev$PatientID == id })]
    for(evID in names(ptEvents)){
      if(is.null(ptEvents[[evID]]$Fields$date)){
        noDateEvents  =  rbind(noDateEvents, data.frame(name=ptEvents[[evID]]$Name, eventID = evID))
      } else 
        if(any(is.na(ptEvents[[evID]]$Fields$date))){
          noDateEvents  =  rbind(noDateEvents, data.frame(name=ptEvents[[evID]]$Name, eventID = evID))
        } else if(length(ptEvents[[evID]]$Fields$date) == 1){
          orderedEvents <- rbind(orderedEvents, data.frame(name=ptEvents[[evID]]$Name, date = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y"), eventOrder="single", eventID = evID))
          if(ptEvents[[evID]]$Name == "Birth") birth = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
          else if(ptEvents[[evID]]$Name == "Status") death = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
          else if(ptEvents[[evID]]$Name == "Diagnosis") diagnosis = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
          else if(ptEvents[[evID]]$Name == "Progression") progression = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
        } else {
          
          if(as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y") > as.Date(ptEvents[[evID]]$Fields$date[2], format="%m/%d/%Y")){
            noDateEvents  <- rbind(noDateEvents, data.frame(name=ptEvents[[evID]]$Name, eventID = evID))            
          } else {
            orderedEvents <- rbind(orderedEvents, data.frame(name=ptEvents[[evID]]$Name, date =  as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y"), eventOrder="start", eventID = evID))
            orderedEvents <- rbind(orderedEvents, data.frame(name=ptEvents[[evID]]$Name, date =  as.Date(ptEvents[[evID]]$Fields$date[2], format="%m/%d/%Y"), eventOrder="end", eventID = evID))
          }
        } 
    }
    #    printf("Birth: %s Death: %s Diagnosis %s Progression %s", birth, death, diagnosis, progression)
    OneDay = 1000 *60 * 60*24;
    
    AgeDx   <- data.frame(name="Age at Diagnosis", value =NA, units="Years"); 
    Survival  <- data.frame(name="Survival", value =NA, units="Years");
    Dx2Prog <- data.frame(name="Diagnosis to Progression", value =NA,units="Months");
    ProgDeath <- data.frame(name="Progression to Status", value =NA, units="Months"); 
    if(class(birth) == "Date" && class(diagnosis) == "Date") AgeDx$value = as.numeric(diagnosis - birth)/365.25
    if(class(death) == "Date" && class(diagnosis) == "Date") Survival$value = as.numeric(death - diagnosis)/365.25
    if(class(progression) == "Date" && class(diagnosis) == "Date") Dx2Prog$value = as.numeric(progression - diagnosis)/30.425
    if(class(progression) == "Date" && class(death) == "Date")     ProgDeath$value = as.numeric(death - progression)/30.425
    
    calcEvents <- rbind(AgeDx, Survival, Dx2Prog, ProgDeath)
    
    if(nrow(orderedEvents)>0) orderedEvents <- orderedEvents[order(orderedEvents$date),]
    list(dateEvents = orderedEvents, noDateEvents=noDateEvents, calcEvents = calcEvents)
  })
  
  names(ptList) <- ptIDs
  ptList
}
#----------------------------------------------------------------------------------------------------
createEventTypeList <- function(Allevents=NA){
  
  if(all(is.na(Allevents)))
    return(list())
  
  list.events <- Allevents
  
  catNames = unique(unlist(lapply(list.events, function(e) e$Name)))
  
  categoryList <- lapply(catNames, function(name){
    fieldNames <- data.frame()
    hasDateEvents = FALSE
    catEvents <- list.events[sapply(list.events, function(ev) {ev$Name == name })]
    catFrame <- t(sapply(catEvents, function(ev) { ev$Fields }))
    if("date" %in% colnames(catFrame)){
      catFrame = catFrame[,-which(colnames(catFrame)=="date")]
      hasDateEvents = TRUE
    }
    if(name == "Background" && "History" %in% colnames(catFrame)){          ## NOT CURRENTLY HANDLED
      #       evNames = unique(unlist(catFrame[,which(colnames(catFrame)=="History")]))
      catFrame = catFrame[,-which(colnames(catFrame)=="History")]
    }
    if(name == "Background" && "Symptoms" %in% colnames(catFrame)){
      #     evNames = unique(unlist(catFrame[,which(colnames(catFrame)=="Symptoms")]))        
      catFrame = catFrame[,-which(colnames(catFrame)=="Symptoms")]
    }
    fieldList <- apply(catFrame, 2, function(field) {
      fieldTypes = unlist(unique(field))
      evList <- lapply(fieldTypes, function(evType){
        if(is.na(evType))
          evNames <- rownames(catFrame)[is.na(field)] 
        else
          evNames <- rownames(catFrame)[ which(field == evType)] 
        evNames
      })
      
      names(evList) <- fieldTypes
      evList
    })
    fieldList$dateIndicator = hasDateEvents
    fieldList
  })
  
  names(categoryList) <- catNames
  categoryList

  } # createEventTypeList 
#--------------------------------------------------------------------------------------------------
createPatientTable <- function(events=NA){
  
  if(all(is.na(events)))
    return(data.frame())
  
  list.events <- events
  
  ptIDs = unique(gsub("(\\w+\\.\\w+\\.\\w+).*", "\\1" , unlist(lapply(list.events, function(e) e$PatientID))))
  
  table <- data.frame(ptID=ptIDs, ptNum=NA, study=NA)
  rownames(table) <- ptIDs
  
  new.list <-lapply(list.events, function(event){  # remove "Fields" label and use value of 'Name' for unique headers
    id <- gsub("(\\w+\\.\\w+\\.\\w+).*", "\\1" , event$PatientID)
    a<- list(ptID=id, ptNum=event$PtNum, study=event$study)
    #if(length(event$Fields) != length(unlist(event$Fields))
    a[[event$Name]]<- as.list(unlist(event$Fields))  # for fields with multiple elements, e.g. date c(start, end) -> date1 date2
    a
  })
  
  index = 1
  for(event in new.list){
    if(is.na(table[event$ptID,"ptNum"])){                        # new pt now stored
      table[event$ptID, "ptNum"] <- event$ptNum 
      table[event$ptID, "study"] <- event$study 
    }  

    new.event<- data.frame(event[4], stringsAsFactors=F)

    if(all(colnames(new.event) %in% colnames(table))){           # not new event type overall
      if(all(is.na(table[event$ptID, colnames(new.event)]))) {  # fields not yet defined for this patient
        table[event$ptID, colnames(new.event)] <- unlist(new.event)
      }else{                                                   # iterate until new column label available
        count =2
        add.columns = paste(colnames(new.event), count, sep=".")
        while(all(add.columns %in% colnames(table)) && any(!is.na(table[event$ptID, add.columns]))) {
          count = count + 1
          add.columns = paste(colnames(new.event), count, sep=".")
        }
        if(!all(add.columns %in% colnames(table))) table[, add.columns] <- NA
        table[event$ptID, add.columns] <- unlist(new.event)
      }
    }else{                                                     # create/add new set of event names
      table[, colnames(new.event)] <- NA
      table[event$ptID, colnames(new.event)] <- unlist(new.event)
    }
    index = index + 1
  }
  table$ptNum <- as.numeric(table$ptNum)
  
  table <- addCalculatedEvents(table)
  table
  
} # createTable
#----------------------------------------------------------------------------------------------------
addCalculatedEvents <- function(table= data.frame()){
  
  if(all(dim(table) == c(0,0))) return(table)
  
  if(all(c("Diagnosis.date","Status.date") %in% colnames(table)))
    table[ ,"Survival"] <- as.numeric(apply(table, 1, function(row){getDateDifference(row["Diagnosis.date"],row["Status.date"]) }) )
  if(all(c("Birth.date", "Diagnosis.date") %in% colnames(table)))
    table[ ,"AgeDx"] <- as.numeric(apply(table, 1, function(row){getDateDifference(row["Birth.date"], row["Diagnosis.date"]) }) )
  if(all(c("Diagnosis.date","Progression.date") %in% colnames(table))){
    allProgressionCols <- which(grepl("Progression.date", colnames(table)))
    table[ ,"TimeFirstProgression"] <- as.numeric(
      apply(table, 1, function(row){getDateDifference(row["Diagnosis.date"], row[allProgressionCols]) }))
  }
  
  table
}
#----------------------------------------------------------------------------------------------------
getDateDifference <- function(date1, date2, instance1=1, instance2=1){
  ## returns a single date difference for date2 - date1 by creating orded dates by first, second, ..,  or linked date pairs 
  ## instance  = 1, 2, ..., last, linked
  
  stopifnot(grepl("\\d+",instance1) | instance1 %in% c("last", "linked"))
  stopifnot(grepl("\\d+",instance2) | instance2 %in% c("last", "linked"))
  
  if(grepl("last", instance1)) instance1 = length(date1)
  if(grepl("last", instance2)) instance2 = length(date2)
  
  stopifnot(is.numeric(instance1) | is.numeric(instance2))
  # need at least one instance to define relationship 
  
  if(is.numeric(instance1)) stopifnot(instance1 <= length(date1))
  if(is.numeric(instance2)) stopifnot(instance2 <= length(date2))
  
  if(instance1 == "linked") stopifnot(length(date1) == length(date2))
  if(instance2 == "linked") stopifnot(length(date1) == length(date2))
  # for linked dates, lengths must be equal for matching
  
  #stopifnot( all(sapply(date1, isValidDate)))
  #stopifnot( all(sapply(date2, isValidDate)))
  
  date1 <- as.Date(as.character(date1), format="%m/%d/%Y")
  date2 <- as.Date(as.character(date2), format="%m/%d/%Y")
  
  if(is.numeric(instance1) & instance2 == "linked"){
    first.date  = date1[order(date1)][instance1]  # NAs ordered at end
    second.date = date2[order(date1)][instance1]
  } else if(is.numeric(instance2) & instance1 == "linked"){
    first.date = date1[order(date2)][instance2]
    second.date  = date2[order(date2)][instance2]
  } else if(is.numeric(instance1) & is.numeric(instance2)){
    first.date  = date1[order(date1)][instance1]
    second.date = date2[order(date2)][instance2]
  } 
  
  stopifnot(exists("first.date") & exists("second.date"))
  
  datediff = second.date - first.date
  
  as.numeric(datediff)   # will return NA if either value is NA
}
#----------------------------------------------------------------------------------------------------
RawTables <- loadRawFiles()
	tcga.ids <- unique(RawTables[["tbl.pt"]]$bcr_patient_barcode)
	id.map <- 1:length(tcga.ids)
	fixed.ids <- gsub("-", ".", tcga.ids, fixed=TRUE)
	names(id.map) <- fixed.ids

ProcessedData <- run(RawTables, tcga.ids)
runTests()
saveRData(ProcessedData)
