#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.ChinookAnalysis <- setClass ("ChinookAnalysis", 
                         representation = representation(
                                            name="character",
                                            state="environment"
                                            )
                         )

#----------------------------------------------------------------------------------------------------
setGeneric('getName',          signature='obj', function (obj) standardGeneric ('getName'))
setGeneric('setServer',        signature='obj', function (obj, server) standardGeneric ('setServer'))
setGeneric('getServer',        signature='obj', function (obj, server) standardGeneric ('getServer'))
setGeneric('registerMessageHandlers', signature='obj', function (obj) standardGeneric ('registerMessageHandlers'))
#----------------------------------------------------------------------------------------------------
# constructor
ChinookAnalysis <- function(name="")
{

  .ChinookAnalysis(name=name, state=new.env(parent=emptyenv()))

} # SttrDataPackage constructor
#----------------------------------------------------------------------------------------------------
setMethod("setServer", "ChinookAnalysis",

  function (obj, server) {
     obj@state[["server"]] <- server
     })

#----------------------------------------------------------------------------------------------------
setMethod("getServer", "ChinookAnalysis",

  function (obj) {
     if("server" %in% ls(obj@state))
         return(obj@state[["server"]])
     else
         return(NA)
     })

#----------------------------------------------------------------------------------------------------
setMethod("getName", "ChinookAnalysis",

  function (obj) {
     return(obj@name)
     })

#----------------------------------------------------------------------------------------------------
