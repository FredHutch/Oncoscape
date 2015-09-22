# test_survival.R
#----------------------------------------------------------------------------------------------------
library(RUnit)
library(OncoDev14)
#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
if (!exists("tbl.history"))
  load("../extdata/tbl.history-592-patients-9-columns.RData")

tbl <- tbl.history

#  created thus, on (14 mar 2015)
# 
#   scriptDir <- NA_character_
#   userID <- "test@nowhere.net"
# 
#   PORT <- 7777
#   dataset <- "TCGAgbm"
#   onco <- OncoDev14(port=PORT, scriptDir=scriptDir, userID=userID, datasetNames=dataset)
#   ds <- getDataSets(onco)
#   checkTrue(is(ds, "environment"))
#   checkTrue(dataset %in% ls(ds))
#   ddz <- ds[[dataset]]
#   tbl.history <- getPatientTable(ddz)
#   coi <- c("ptID", "study", "Birth.gender", "Survival", "AgeDx", "TimeFirstProgression","Status.status",
#            "Status.status", "Status.tumorStatus");
#  tbl.history <- tbl.history[, coi]
#  tbl.history$ptID <- as.character(tbl.history$ptID)
#  save(tbl.history, file="../extdata/tbl.history-592-patients-9-columns.RData")
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  survey.data()
  test.longSurvivors()
  test.fiftyShortSurvivors()
  test.hundredAtRandom()
  test.unknownIDs()
  
} # runTests
#----------------------------------------------------------------------------------------------------
# characterize the sampe data: range of values, number of NAs
survey.data <- function(tb)
{
   printf("--- survey.data")
   checkEquals(max(tbl.history$Survival, na.rm=TRUE), 3881)
   checkEquals(min(tbl.history$Survival, na.rm=TRUE), 3)
   checkEquals(length(which(is.na(tbl.history$Survival))), 0)
   checkEquals(length(tbl.history$Survival), 592)

} # survey.data
#----------------------------------------------------------------------------------------------------
# show(fit) returns
#      
#         records n.max n.start events median 0.95LCL 0.95UCL
# group=1       4     4       4      2   6.67    6.47      NA
# group=2     579   579     579    441   0.98    0.89    1.05
# the "events" column for group 1 and 2 describes how many real survival values were used.
# but alas:  i cannot figure out how to extract that information from the fit value returned
# in each of the test below.  thus these tests are a bit less that what I hope for.
#----------------------------------------------------------------------------------------------------
# I used this to figure out how survfit & Surv work.
demo <- function()
{
   long.ids <- subset(tbl, Survival > 2500)$ptID[1:10]
   long.indices <- match(long.ids, tbl$ptID)

      # all other patients
   other.indices <- setdiff(1:nrow(tbl), long.indices)
   
   groups <- c(rep(1, length(long.indices)), rep(2, length(other.indices)))
   times <- c(tbl$Survival[long.indices], tbl$Survival[other.indices])
   status <- c(tbl$Status.status[long.indices], tbl$Status.status[other.indices])
   status.int <- rep(0, length(status))
   status.int[status=="Dead"] <- 1
   status.int[status=="Alive"] <- 0

   df <- data.frame(group=groups, time=times, status=status.int, stringsAsFactors=FALSE)
   fit <- survfit(Surv(time, status)~group, data=df)
   mainTitle <- sprintf ("Kaplan-Meier Survival");
   plot(fit,col=c(4,2),conf.int=FALSE,lty=c(1,3),lwd=3,
        xlab="Days",ylab="Fraction alive", main=mainTitle,
        cex.main=2, cex.lab=1.4);

   
   tbl2 <- subset(tbl, ptID %in% c(long.ids, short.ids))
   filename <- tempfile()


} # demo
#----------------------------------------------------------------------------------------------------
test.longSurvivors <- function()
{
   printf("--- test.longSurvivors")
   ids <- subset(tbl, Survival > 2800)$ptID

      # make sure all ids are real ids
   checkEquals(length(which(is.na(ids))), 0)
     # check that all have real numerical Survival values
   checkTrue(all(is.numeric(subset(tbl, ptID %in% ids)$Survival)))

     # now we call the survival function, confident of good ids and good survival values
     # use a simple variable 'f' as shorthand for the hidden (unexported) function
   f <- OncoDev14:::survivalCurveByAttribute

   filename <- tempfile()
   
   fit <- f(tbl, ids, attribute="Survival", filename=filename, title="long survivors")

     # one of many fields returned in fit is n, a vector of two integers
     # giving the number of samples selected, and the size of the remainder
   sampleCount <- length(ids)
   checkEquals(fit$n, c(sampleCount, nrow(tbl) - sampleCount))   # 3, 589

     # with a little footwork, we can get counts for useful, non-NA values
   event.counts <- as.integer(summary(fit)$table[, "events"])
   # checkEquals(event.counts, c (5, 447))   # new, with the new tcga from lisa (14 mar 2015)
   na.count <- length(which(is.na(tbl$Survival)))
     # the na.count + sample events (3) + 'remainder' events (440) should total nrow(tbl)
   #checkEquals(sum(na.count, event.counts), nrow(tbl))
   
     # was a plot file written?
   checkTrue(file.exists(filename))
      # view the plot, on macos:
   if(interactive())
      system(sprintf("open %s", filename))

} # test.longSurvivors
#----------------------------------------------------------------------------------------------------
test.fiftyShortSurvivors <- function()
{
   printf("--- test.fiftyShortSurvivors")
   sampleCount <- 50
   ids <- subset(tbl, Survival < 100)$ptID[1:sampleCount]

      # make sure all ids are real ids
   checkEquals(length(which(is.na(ids))), 0)
     # check that all have real numerical survival values
   checkTrue(all(is.numeric(subset(tbl, ptID %in% ids)$Survival)))

     # now we call the survival function, confident of good ids and good survival values
   f <- OncoDev14:::survivalCurveByAttribute
   filename <- tempfile()
   fit <- f(tbl, ids, filename=filename)

      # convoluted extraction of the counts of non-NA values in sample and remainder
   event.counts <- as.integer(summary(fit)$table[, "events"])
   #checkEquals(event.counts, c (4, 106))
   #na.count <- length(which(is.na(tbl$Survival)))
     # the na.count + sample events (5) + 'remainder' events (438) should total nrow(tbl)
   #checkEquals(sum(na.count, event.counts), nrow(tbl))

     # one of many fields returned in fit is n, a vector of two integers
     # giving the number of samples selected, and the size of the remainder
   checkEquals(fit$n, c(sampleCount, nrow(tbl) - sampleCount))
   checkTrue(file.exists(filename))
      # view the plot, on macos:
   if(interactive())
        system(sprintf("open %s", filename))

} # test.fiftyShortSurvivors
#----------------------------------------------------------------------------------------------------
test.hundredAtRandom <- function()
{
   printf("--- test.hundredAtRandom")
   sampleCount <- 100
   indices <- sample(1:nrow(tbl), 100)
   ids <- tbl$ptID[indices]

      # make sure all ids are real ids
   checkEquals(length(which(is.na(ids))), 0)
     # check that all have real numerical survival values
   checkTrue(all(is.numeric(subset(tbl, ptID %in% ids)$Survival)))

     # now we call the survival function, confident of good ids and good survival values
   f <- OncoDev14:::survivalCurveByAttribute
   filename <- tempfile()
   fit <- f(tbl, ids, filename=filename)

      # convoluted extraction of the counts of non-NA values in sample and remainder
   event.counts <- as.integer(summary(fit)$table[, "events"])
   #checkEquals(event.counts, c (4, 106))
   #na.count <- length(which(is.na(tbl$Survival)))
     # the na.count + sample events (5) + 'remainder' events (438) should total nrow(tbl)
   #checkEquals(sum(na.count, event.counts), nrow(tbl))

     # one of many fields returned in fit is n, a vector of two integers
     # giving the number of samples selected, and the size of the remainder
   checkEquals(fit$n, c(sampleCount, nrow(tbl) - sampleCount))
   checkTrue(file.exists(filename))
      # view the plot, on macos:
   if(interactive())
        system(sprintf("open %s", filename))

} # test.fiftyShortSurvivors
#----------------------------------------------------------------------------------------------------
# lisa's new parse of TCGAgbm patient data has no NAs in the Survival field.
# TODO: should replace this test with something similar
# test.twoLongSurvivorsWith2NAs <- function()
# {
#    printf("--- test.twoLongSurvivorsWith2NAs")
# 
#      # identify 2 samples for whom survival is not reported.  NA is found in this field for them
# 
#    ids.na <- tbl$ptID[head(which(is.na(tbl$Survival)), n=2)]
#    checkTrue(all(is.na(subset(tbl, ptID %in% ids.na)$Survival)))
# 
#    sampleCount <- 2
#    ids.good <- subset(tbl, Survival > 5.0)$ptID[1:sampleCount]
# 
#       # make sure all ids are real ids
#    checkEquals(length(which(is.na(ids.good))), 0)
#      # check that all have real numerical survival values
#    checkTrue(all(is.numeric(subset(tbl, ptID %in% ids.good)$Survival)))
# 
#    ids <- c(ids.good, ids.na)
# 
#      # now we call the survival function, confident of good ids and good survival values
#    f <- OncoDev14:::survivalCurveByAttribute
#    filename <- tempfile()
#    fit <- f(tbl, ids, filename=filename)
# 
#      # with a little footwork, we can get counts for useful, non-NA values, in the two groups
#    event.counts <- as.integer(summary(fit)$table[, "events"])
#    checkEquals(event.counts, c (2, 441))   # only 2/4 good samples in the ids
#    na.count <- length(which(is.na(tbl$Survival)))
#      # the na.count + sample events (2) + 'remainder' events (441) should total nrow(tbl)
#    checkEquals(sum(na.count, event.counts), nrow(tbl))
# 
#    checkTrue(file.exists(filename))
# 
#       # view the plot, on macos:
#    if(interactive())
#       system(sprintf("open %s", filename))
# 
# } # test.twoLongSurvivorsWith2NAs
#----------------------------------------------------------------------------------------------------
# lisa's new parse of TCGAgbm patient data has no NAs in the Survival field.
# TODO: should replace this test with something similar
# test.fourNAs <- function()
# {
#    printf("--- test.fourNAs");
# 
#      # identify 4 samples for whom survival is not reported.  NA is found in this field for them
#    ids <- tbl$ptID[head(which(is.na(tbl$Survival)), n=4)]
#    checkTrue(all(is.na(subset(tbl, ptID %in% ids)$Survival)))
# 
#      # now we call the survival function, confident of good ids and good survival values
#    f <- OncoDev14:::survivalCurveByAttribute
#    filename <- tempfile()
#    fit <- f(tbl, ids, filename=filename)
# 
#       # convoluted extraction of the counts of non-NA values in sample and remainder
#    event.counts <- as.integer(summary(fit)$table[, "events"])
#    checkEquals(event.counts, c (0, 443))
#    na.count <- length(which(is.na(tbl$Survival)))
#      # the na.count + sample events (5) + 'remainder' events (438) should total nrow(tbl)
#    checkEquals(sum(na.count, event.counts), nrow(tbl))
# 
# 
#      # one of many fields returned in fit is n, a vector of two integers
#      # giving the number of samples selected, and the size of the remainder
# 
#    checkTrue(file.exists(filename))
# 
#       # view the plot, on macos:
#    if(interactive())
#       system(sprintf("open %s", filename))
# 
# } # test.fourNAs
#----------------------------------------------------------------------------------------------------
test.unknownIDs <- function()
{
   printf("--- test.unknownIDs")

     # make up some identifiers
   ids <- c("bogus", "magus", "moo", "ludicrous", "phoebus",  "omnibus", "box");

     # now we call the survival function, confident of good ids and good survival values
   f <- OncoDev14:::survivalCurveByAttribute
   filename <- tempfile()
   fit <- f(tbl, ids, filename=filename)
   checkTrue(is.na(fit))

   checkTrue(file.exists(filename))

      # view the plot, on macos:
   if(interactive())
      system(sprintf("open %s", filename))

   
} # test.unknownIDs
#----------------------------------------------------------------------------------------------------
