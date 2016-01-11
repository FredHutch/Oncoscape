#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
# SubjectHistory supports two different kinds of catalogs of history events.
# The simpler of the two is a data.frame, whose rows are subject IDs, and whose columns are
# events (i.e., date of birth, date of diagnosis, tumor status, ethnicity for human subjects)
# However, the use of "subject" rather than "patient" for the name of the class 
# highlights the flexibility we intend.  Subjects could be census tracts, cell lines, lab mice
# dog breeds, jet planes, galapagos islands, galaxies.
# "events" can be dated occurences ("date of birth") or broadly applicable fixed attributes (gender, 
# latitude and longitude, galactic shape, wing span, ...)
#
# objects of this class may be constructed with a table (aka data.frame) in the form of a tab-delimited
# file.  they may also be created with an eventList which, in our usage, is a list of lists, with
# the sublists of variable length. variable length sublists are awkward to present in a single table;
# patient data (i.e., a long and complicated medical history) can be more naturally represented
# by lists of lists.  The inspiration for this form of data representation is CAISIS; see
# http://www.caisis.org/
# 
# class policies:
#   - a SubjectHistory may be created with a table, with an event list, or both
#   - if only one of these is used, the supplied form will be treated as BOTH a
#     a table and as an event list.  Thus the event list can be flattened into a table;
#     and a table can be viewed as a (very simple) event list
#   - if both kinds of data are used in construction, then the "table-ish" accessors (getTable
#     in particular) return data from the table, and "event-ish" accessors return data
#     from the event list
#----------------------------------------------------------------------------------------------------
.SubjectHistory <- setClass ("SubjectHistory", 
                             representation = representation (table="data.frame", eventList="list")
                             )
#----------------------------------------------------------------------------------------------------
setGeneric('getSubjectIDs', signature='obj', function (obj) standardGeneric ('getSubjectIDs'))
setGeneric('getEventNames', signature='obj', function (obj) standardGeneric ('getEventNames'))
setGeneric('getTable',      signature='obj', function (obj, subjectIDs=NA, eventNames=NA) standardGeneric ('getTable'))
setGeneric('getEventList',  signature='obj', function (obj, subjectIDs=NA, eventNames=NA) standardGeneric ('getEventList'))
#----------------------------------------------------------------------------------------------------
# constructor
SubjectHistory <- function(table=data.frame(), eventList=list())
{
   obj <- .SubjectHistory(table=table, eventList=eventList)
   obj

} # SubjectHistory constructor
#----------------------------------------------------------------------------------------------------
setMethod("show", "SubjectHistory",

  function (object) {
      contents <- sprintf("%d subjects, %d events", length(getSubjectIDs(object)),
                          length(getEventNames(object)))
     msg <- sprintf("SubjectHistory with %s", contents);
     cat (msg, "\n", sep="")
     })

#----------------------------------------------------------------------------------------------------
setMethod("getSubjectIDs", "SubjectHistory",

    function(obj){
       rownames(obj@table)
       })

#----------------------------------------------------------------------------------------------------
setMethod("getEventNames", "SubjectHistory",

    function(obj){
       if(length(obj@eventList) == 0)
          colnames(obj@table)
       })

#----------------------------------------------------------------------------------------------------
setMethod("getTable", "SubjectHistory",

  function (obj, subjectIDs=NA, eventNames=NA) {

    tbl <- obj@table

    if(all(dim(tbl) == 0))
       return(tbl)
  
    if(all(is.na(subjectIDs)))
      subjectIDs <- rownames(tbl)
    else{
      subjectIDs <- intersect(rownames(tbl), subjectIDs)
      }
     
    if(all(is.na(eventNames)))
      columnIDs <- colnames(tbl)
    else{
      columnIDs <- intersect(colnames(tbl), eventNames)
      }
    
    tbl[subjectIDs, columnIDs]

    }) # getTable
#----------------------------------------------------------------------------------------------------
setMethod("getEventList", "SubjectHistory",

   function (obj, subjectIDs=NA, eventNames=NA) {
       obj@eventList
       })

#----------------------------------------------------------------------------------------------------
      
