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

load(file="../../../../TCGAgbm/inst/extdata/events.RData")
load(file="../../../../TCGAgbm/inst/extdata/ptHistory.RData")
load(file="../../../../TCGAgbm/inst/extdata/historyTypes.RData")
load(file="../../../../TCGAgbm/inst/extdata/tbl.ptHistory.RData")
list.TCGAgbm <- history
ptList.TCGAgbm <- ptList
catList.TCGAgbm <- catList
ptTable.TCGAgbm <- tbl.ptHistory
checkEquals(length(list.TCGAgbm), 7644)

load(file="../../../../TCGAlgg/inst/extdata/events.RData")
load(file="../../../../TCGAlgg/inst/extdata/ptHistory.RData")
load(file="../../../../TCGAlgg/inst/extdata/historyTypes.RData")
load(file="../../../../TCGAlgg/inst/extdata/tbl.ptHistory.RData")
list.TCGAlgg <- history
ptList.TCGAlgg <- ptList
catList.TCGAlgg <- catList
ptTable.TCGAlgg <- tbl.ptHistory
checkEquals(length(list.TCGAlgg), 4899)

#------------------------------------------------------------------------------------------------------------------------
run <- function()
{
       
    history <- c(list.TCGAgbm, list.TCGAlgg)
   if(length(history)>0)
 	  names(history) <- paste("event", 1:length(history), sep="")
   ptList <- createPatientList(history)
   catList <- createEventTypeList(history)
   tbl.ptHistory <- createPatientTable(history)

    print(paste("history ", length(history)))
    print(paste("ptList ", length(ptList)))
    print(paste("catList ", length(catList)))
    print(paste("tbl.ptHistory ", dim(tbl.ptHistory)))


    checkEquals(class(history), "list")
       
    checkEquals(length(history), length(list.TCGAgbm) + length(list.TCGAlgg))
    checkEquals(as.list(table(unlist(lapply(history, function(e) e["Name"])))), list(`Absent`=448, `Background`=1051,`Birth`=1051, `Diagnosis`=1051,`Drug`=1965,`Encounter`=2124, `Pathology`=1067, `Procedure`=323, `Progression`=542,  `Radiation`=819, `Status`=1051,`Tests`=1051))
      #omf: other malignancy form for 2 patients gives extra pathologies
      # many additional surgeries marked (new_tumor_event_additional_surgery_procedure = YES) but no date given
      
   serialized.file.name <- "../../extdata/events.RData"
   save(history, file=serialized.file.name)
   save(ptList, file="../../extdata/ptHistory.RData")
   save(catList, file="../../extdata/historyTypes.RData")
   save(tbl.ptHistory, file="../../extdata/tbl.ptHistory.RData")
   

} # run

#------------------------------------------------------------------------------------------------------------------------
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
#		 printf("Birth: %s Death: %s Diagnosis %s Progression %s", birth, death, diagnosis, progression)
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

    	orderedEvents <- orderedEvents[order(orderedEvents$date),]
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
        if(name == "Background" && "History" %in% colnames(catFrame)){					## NOT CURRENTLY HANDLED
#    		evNames = unique(unlist(catFrame[,which(colnames(catFrame)=="History")]))
    		catFrame = catFrame[,-which(colnames(catFrame)=="History")]
        }
        if(name == "Background" && "Symptoms" %in% colnames(catFrame)){
#			evNames = unique(unlist(catFrame[,which(colnames(catFrame)=="Symptoms")]))        
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
}

#----------------------------------------------------------------------------------------------------
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
    
    for(event in new.list){
     if(is.na(table[event$ptID,"ptNum"])){                        # new pt now stored
       table[event$ptID, "ptNum"] <- event$ptNum 
       table[event$ptID, "study"] <- event$study 
     }  
     new.event<- data.frame(event[4], stringsAsFactors=F)
     if(all(colnames(new.event) %in% colnames(table))){           # not new event type overall
        if(all(is.na(table[event$ptID, colnames(new.event)]))) {  # fields not yet defined for this patient
          table[event$ptID, colnames(new.event)] <- unlist(new.event)
        } else{                                                   # iterate until new column label available
          
          count =2
          add.columns = paste(colnames(new.event), count, sep=".")
          while(all(add.columns %in% colnames(table)) && any(!is.na(table[event$ptID, add.columns]))) {
            count = count + 1;
            add.columns = paste(colnames(new.event), count, sep=".")
          }
          if(!all(add.columns %in% colnames(table))) table[, add.columns] <- NA
          table[event$ptID, add.columns] <- unlist(new.event)
        }
     } else{                                                     # create/add new set of event names
       table[, colnames(new.event)] <- NA
       table[event$ptID, colnames(new.event)] <- unlist(new.event)
     }
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

run()