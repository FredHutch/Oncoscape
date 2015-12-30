#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.SubjectHistory <- setClass ("SubjectHistory", 
                             representation = representation (table="data.frame")
                            )
#----------------------------------------------------------------------------------------------------
setGeneric('getSubjectIDs', signature='obj', function (obj) standardGeneric ('getSubjectIDs'))
setGeneric('getEventNames', signature='obj', function (obj) standardGeneric ('getEventNames'))
setGeneric('getTable', signature='obj', function (obj, selected.subjects=NA, selected.events=NA) standardGeneric ('getTable'))
setGeneric('setTable', signature='obj', function (obj, newTable) standardGeneric ('setTable'))
#----------------------------------------------------------------------------------------------------
# constructor
SubjectHistory <- function(table=data.frame())
{
   obj <- .SubjectHistory(table=table)
   obj

} # SubjectHistory constructor
#----------------------------------------------------------------------------------------------------
setMethod("getSubjectIDs", "SubjectHistory",

    function(obj){
       rownames(obj@table)
       })

#----------------------------------------------------------------------------------------------------
setMethod("getEventNames", "SubjectHistory",

    function(obj){
       colnames(obj@table)
       })

#----------------------------------------------------------------------------------------------------
setMethod("setTable", "SubjectHistory",

    function (obj, newTable) {
      obj@table <- newTable
      obj
      })

#----------------------------------------------------------------------------------------------------
setMethod("getTable", "SubjectHistory",

  function (obj, selected.subjects=NA, selected.events=NA) {

    tbl <- obj@table

    if(all(dim(tbl) == 0))
       return(tbl)
  
    if(all(is.na(selected.subjects)))
      subjectIDs <- rownames(tbl)
    else{
      subjectIDs <- intersect(rownames(tbl), selected.subjects)
      }
     
    if(all(is.na(selected.events)))
      columnIDs <- colnames(tbl)
    else{
      columnIDs <- intersect(colnames(tbl), selected.events)
      }
    
    tbl[subjectIDs, columnIDs]

    }) # getTable
#----------------------------------------------------------------------------------------------------
