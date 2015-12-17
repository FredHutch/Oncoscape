#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.ChinookAnalysis <- setClass ("ChinookAnalysis", 
                         representation = representation(
                                            name="character",
                                            server="ChinookServer",
                                            state="environment"
                                            )
                         )

#----------------------------------------------------------------------------------------------------
setGeneric('getName',          signature='obj', function (obj) standardGeneric ('getName'))
setGeneric('registerHandlers', signature='obj', function (obj) standardGeneric ('registerHandlers'))
#----------------------------------------------------------------------------------------------------
# constructor
ChinookAnalysis <- function(name="", server=ChinookServer())
{
  obj <- .ChinookAnalysis(name=name, server=server)

  obj

} # SttrDataPackage constructor
#----------------------------------------------------------------------------------------------------
setMethod("getName", "ChinookAnalysis",

  function (obj) {
     return(obj@name)
     })

#----------------------------------------------------------------------------------------------------
