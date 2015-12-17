#----------------------------------------------------------------------------------------------------
.ChinookSimpleSummaryStats <- setClass ("ChinookSimpleSummaryStats", 
                                        representation = representation(impl="SimpleSummaryStats"),
                                        contains = "ChinookAnalysis"
                                       )

#----------------------------------------------------------------------------------------------------
# constructor
ChinookSimpleSummaryStats <- function(server)
{
    printf("starting ChinookSimpleSummaryStats ctor")
    obj <- .ChinookSimpleSummaryStats(ChinookAnalysis(name="SimpleSummaryStats", server=server),
                                      impl=SimpleSummaryStats())

    printf("leaving ChinookSimpleSummaryStats ctor")
    obj

} # SummaryStats constructor
#----------------------------------------------------------------------------------------------------
setMethod("registerHandlers", "ChinookSimpleSummaryStats",

  function (obj) {
      return(list(mean=mean(obj@data, na.rm=TRUE),
                  sd=sd(obj@data, na.rm=TRUE),
                  min=min(obj@data, na.rm=TRUE),
                  max=max(obj@data, na.rm=TRUE)))
     })

#----------------------------------------------------------------------------------------------------
