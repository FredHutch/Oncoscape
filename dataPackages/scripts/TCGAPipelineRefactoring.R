#Reference Table#------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)
library(R.utils)
library(stringr)

stopifnot(file.exists("TCGA_Reference_Filenames.txt"))
TCGAfilename<-read.table("TCGA_Reference_Filenames.txt", sep="\t", header=TRUE)
##===load drug reference table ===
drug_ref <- read.table("drug_names_10272015.txt", sep="\t", header=TRUE)
rad_ref <- read.table("rad_ref_02232016.txt", sep="\t", header=TRUE)

if(!interactive()){
  args <- commandArgs(trailingOnly = TRUE)
  stopifnot(length(args) ==1)
  study <- args[1]; 
  print(paste("Creating Processed data for", study))
}else{
  for(study in TCGAfilename$study){
    i<- which(TCGAfilename$study == study)
    directory <- TCGAfilename[i,"directory"]
    stopifnot(file.exists(directory))
    loadRawFiles()
  }
  #source(paste(directory,TCGAfilename[i,"test"],sep="/"), local=TRUE)
}

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
