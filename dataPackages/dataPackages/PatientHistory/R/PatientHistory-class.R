#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.PatientHistory <- setClass ("PatientHistoryClass", 
                         representation = representation (
                                               eventlist="list",
                                               eventTypelist = "list",
                                               patientlist = "list",
                                               eventtable= "data.frame"
                                               )
                         )

#----------------------------------------------------------------------------------------------------
setGeneric('eventCount',        signature='obj', function (obj) standardGeneric ('eventCount'))
setGeneric('eventlist',         signature='obj', function (obj) standardGeneric ('eventlist'))
setGeneric('eventtable',        signature='obj', function (obj) standardGeneric ('eventtable'))
setGeneric('geteventList',      signature='obj', function (obj) standardGeneric ('geteventList'))
setGeneric('geteventTypeList',  signature='obj', function (obj) standardGeneric ('geteventTypeList'))
setGeneric('getpatientList',    signature='obj', function (obj) standardGeneric ('getpatientList'))
setGeneric('seteventList',      signature='obj', function (obj, eventList = list()) standardGeneric ('seteventList'))
setGeneric('setpatientList',    signature='obj', function (obj, ptList = list()) standardGeneric ('setpatientList'))
setGeneric('seteventTypeList',  signature='obj', function (obj, eventTypeList = list()) standardGeneric ('seteventTypeList'))
setGeneric('setTable', 		    signature='obj', function (obj, tbl = data.frame()) standardGeneric ('setTable'))
setGeneric('getTable',          signature='obj', function (obj, patient.ids=NA, selectCols=NA) standardGeneric ('getTable'))

#----------------------------------------------------------------------------------------------------
# constructor
PatientHistory <- function(events=list())
{
	  stopifnot(class(events)=="list")

#	  tbl <- .createTable(events)
#	  stopifnot(class(tbl)=="data.frame")
#	  tbl <- .addCalculatedEvents(tbl)

	  obj <- .PatientHistory(eventlist=events)

	  obj

} # PatientHistory constructor
#----------------------------------------------------------------------------------------------------
setMethod('seteventList', 'PatientHistoryClass',
  function (obj, eventList=list()) {
	  stopifnot(class(eventList)=="list")
      obj@eventlist = eventList

	  tbl <- .createTable(eventList)
	  stopifnot(class(tbl)=="data.frame")
	  tbl <- .addCalculatedEvents(tbl)

	  obj@eventtable = tbl;
	obj
     })
#----------------------------------------------------------------------------------------------------
setMethod('setpatientList', 'PatientHistoryClass',
  function (obj, ptList=list()) {
     obj@patientlist = ptList
     
     obj
     })
#----------------------------------------------------------------------------------------------------
setMethod('seteventTypeList', 'PatientHistoryClass',
  function (obj, eventTypeList=list()) {
     obj@eventTypelist = eventTypeList
     
     obj
     })
#----------------------------------------------------------------------------------------------------
setMethod('setTable', 'PatientHistoryClass',
  function (obj, tbl=data.frame()) {
     obj@eventtable = tbl
     
     obj
     })

#----------------------------------------------------------------------------------------------------
setMethod('eventCount', 'PatientHistoryClass',
  function (obj) {
     length((obj@eventlist))
     })

#----------------------------------------------------------------------------------------------------
setMethod('eventlist', 'PatientHistoryClass',
  function (obj) {
     obj@eventlist
     })
#----------------------------------------------------------------------------------------------------
setMethod('eventtable', 'PatientHistoryClass',
  function (obj) {
     obj@eventtable
     })

 #----------------------------------------------------------------------------------------------------
setMethod("geteventList", "PatientHistoryClass",
   function (obj) {

    stopifnot(class(obj@eventlist) == "list")
      # test that the slot is not null

    obj@eventlist
    })
 #----------------------------------------------------------------------------------------------------
setMethod("geteventTypeList", "PatientHistoryClass",
   function (obj) {

    stopifnot(class(obj@eventTypelist) == "list")
      # test that the slot is not null

    obj@eventTypelist
    })
 #----------------------------------------------------------------------------------------------------
setMethod("getpatientList", "PatientHistoryClass",
   function (obj) {

    stopifnot(class(obj@patientlist) == "list")
      # test that the slot is not null

    obj@patientlist
    })

#----------------------------------------------------------------------------------------------------
setMethod("getTable", "PatientHistoryClass",
  function (obj, patient.ids=NA, selectCols=NA) {

   tbl <- obj@eventtable
   stopifnot(class(tbl) == "data.frame")
   
   if(all(dim(tbl) == c(0,0))) return(tbl)

   ptIDs <- rownames(tbl)
   
   if(any(!is.na(patient.ids))){
       if(length(setdiff(patient.ids, ptIDs))>0){
            ## TODO: alert that not all pts returned???
            ##       or add pt ids to bottom with NAs??
       }
       ptIDs <- intersect(patient.ids, ptIDs)
       stopifnot(!is.na(ptIDs))
    }

   colNames <- colnames(tbl)

   if(all(!is.na(selectCols))){
       if(length(setdiff(selectCols, colNames))>0){
          ## TODO: alert that not all columns returned???
          ##       add cols with NAs???
       }
       colNames <- intersect(selectCols, colNames)
       stopifnot(!is.na(colNames))
    }
    
    tbl[ptIDs, colNames]

})    
#----------------------------------------------------------------------------------------------------
.createTable <- function(events=NA){

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
    
    table

} # createTable
#----------------------------------------------------------------------------------------------------
.addCalculatedEvents <- function(table= data.frame()){

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

