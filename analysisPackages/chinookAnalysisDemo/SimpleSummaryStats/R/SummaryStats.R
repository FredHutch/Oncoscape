#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
options(stringsAsFactors = FALSE)
#----------------------------------------------------------------------------------------------------
.SimpleSummaryStats <- setClass ("SimpleSummaryStats", 
                         representation = representation(
                                            data="numeric"
                                            )
                        )

#----------------------------------------------------------------------------------------------------
setGeneric('calculate', signature='obj', function (obj, data) standardGeneric ('calculate'))
#----------------------------------------------------------------------------------------------------
# constructor
SimpleSummaryStats <- function(data=0)
{
  stopifnot(is(data, "numeric"))
  obj <- .SimpleSummaryStats(data=data)

  obj

} # SummaryStats constructor
#----------------------------------------------------------------------------------------------------
setMethod("calculate", "SimpleSummaryStats",

  function (obj) {
      return(list(mean=mean(obj@data, na.rm=TRUE),
                  sd=sd(obj@data, na.rm=TRUE),
                  min=min(obj@data, na.rm=TRUE),
                  max=max(obj@data, na.rm=TRUE)))
     })

#----------------------------------------------------------------------------------------------------
