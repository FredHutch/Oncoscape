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

load(file="../../../../TCGAgbm/inst/extdata/history.RData")
list.TCGAgbm <- history
ptList.TCGAgbm <- ptList
catList.TCGAgbm <- catList
checkEquals(length(list.TCGAgbm), 7644)

load(file="../../../../TCGAlgg/inst/extdata/history.RData")
list.TCGAlgg <- history
ptList.TCGAlgg <- ptList
catList.TCGAlgg <- catList

checkEquals(length(list.TCGAlgg), 4899)

#------------------------------------------------------------------------------------------------------------------------
run <- function()
{
       
    history <- c(list.TCGAgbm, list.TCGAlgg)
   if(length(history)>0)
 	  names(history) <- paste("event", 1:length(history), sep="")
   ptList <- createPatientList(history)
   catList <- createEventTypeList(history)

    checkEquals(class(history), "list")
       
   checkEquals(length(history), length(list.TCGAgbm) + length(list.TCGAlgg))
   checkEquals(as.list(table(unlist(lapply(history, function(e) e["Name"])))), list(`Absent`=448, `Background`=1051,`Birth`=1051, `Diagnosis`=1051,`Drug`=1965,`Encounter`=2124, `Pathology`=1067, `Procedure`=323, `Progression`=542,  `Radiation`=819, `Status`=1051,`Tests`=1051))
      #omf: other malignancy form for 2 patients gives extra pathologies
      # many additional surgeries marked (new_tumor_event_additional_surgery_procedure = YES) but no date given
      
   serialized.file.name <- "../../extdata/events.RData"
   save(history, file=serialized.file.name)
   save(ptList, file="../../extdata/ptHistory.RData")
   save(catList, file="../../extdata/historyTypes.RData")
   

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

run()