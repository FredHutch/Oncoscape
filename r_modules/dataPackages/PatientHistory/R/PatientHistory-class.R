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
setGeneric('geteventTypeList',  signature='obj', function (obj) standardGeneric ('geteventTypeList'))
setGeneric('getpatientList',    signature='obj', function (obj) standardGeneric ('getpatientList'))
setGeneric('geteventList',    signature='obj', function (obj) standardGeneric ('geteventList'))
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

	  obj <- .PatientHistory(eventlist=events)

	  obj

} # PatientHistory constructor
#----------------------------------------------------------------------------------------------------
setMethod('seteventList', 'PatientHistoryClass',
  function (obj, eventList=list()) {
	  stopifnot(class(eventList)=="list")
      obj@eventlist = eventList

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
