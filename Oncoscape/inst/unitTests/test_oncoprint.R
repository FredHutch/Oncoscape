# test_oncoprint.R
#----------------------------------------------------------------------------------------------------
library(RUnit)
library(R.utils)
library(OncoDev14)
library(TCGAgbm)
library(DEMOdz)
library(reshape2)
library(jsonlite)
#----------------------------------------------------------------------------------------------------
printf = function (...) print (noquote (sprintf (...)))
#----------------------------------------------------------------------------------------------------
#if (!exists("tbl.history"))
#  load("../extdata/tbl.history-592-patients-9-columns.RData")
#tbl <- tbl.history
if (!exists(ds))
    ds <- TCGAgbm()

ds.matrices = SttrDataPackage:::matrices(ds)
cnv <- ds.matrices$mtx.cn
mut <- ds.matrices$mtx.mut
if("mtx.mrna" %in% names(ds.matrices)){
    mrna <- ds.matrices$mtx.mrna
}else{      
    mrna <- ds.matrices$mtx.mrna.bc }

#  created thus"," on (14 mar 2015)
# 
#   scriptDir <- NA_character_
#   userID <- "test@nowhere.net"
# 
#   PORT <- 7777
#   dataset <- "TCGAgbm"
#   onco <- OncoDev14(port=PORT"," scriptDir=scriptDir"," userID=userID"," datasetNames=dataset)
#   ds <- getDataSets(onco)
#   checkTrue(is(ds"," "environment"))
#   checkTrue(dataset %in% ls(ds))
#   ddz <- ds[[dataset]]
#   tbl.history <- getPatientTable(ddz)
#   coi <- c("ptID""," "study""," "Birth.gender""," "Survival""," "AgeDx""," "TimeFirstProgression"",""Status.status"","
#            "Status.status""," "Status.tumorStatus");
#  tbl.history <- tbl.history["," coi]
#  tbl.history$ptID <- as.character(tbl.history$ptID)
#  save(tbl.history"," file="../extdata/tbl.history-592-patients-9-columns.RData")
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  survey.data()
  demo()
  test.oneGene()
  test.onePatient()
  test.oneGeneOnePatient()
  test.purePatients()
  test.pureGenes()
  test.missingDatatype()
} # runTests
#----------------------------------------------------------------------------------------------------
# characterize the sampe data: range of values"," number of NAs
survey.data <- function()
{
   printf("--- survey.data")
   checkEquals(dim(cnv), c(563, 23575))
   checkEquals(dim(mut), c(291, 6698))
   checkEquals(dim(mrna), c(154, 20457))
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
   string <- c("ZNF713","SEPT14","SEC61G","LANCL2","ETV1","VSTM2A","VOPP1","EGFR","TCGA.14.1402","TCGA.12.0820",
    "TCGA.06.0876","TCGA.16.0861","TCGA.06.0879","TCGA.14.0787","TCGA.06.0743","TCGA.15.0742","TCGA.12.0657",
    "TCGA.12.0656","TCGA.12.0703","TCGA.12.0780","TCGA.12.0692","TCGA.06.0747","TCGA.12.0688","TCGA.06.0744",
    "TCGA.08.0358","TCGA.06.0127","TCGA.08.0375","TCGA.08.0244","TCGA.08.0357","TCGA.02.0070","TCGA.02.0023",
    "TCGA.08.0356","TCGA.02.0068","TCGA.02.0016","TCGA.08.0355","TCGA.02.0015","TCGA.08.0354","TCGA.08.0246",
    "TCGA.08.0511","TCGA.06.0402","TCGA.02.0333","TCGA.02.0317","TCGA.02.0260","TCGA.08.0521","TCGA.02.0290",
    "TCGA.06.0394","TCGA.02.0430","TCGA.02.0289","TCGA.08.0514","TCGA.02.0269","TCGA.08.0518","TCGA.06.0157")
    result <- create.oncoprint.input(string, ds)
    checkEquals(length(result), 2)
    payload <- fromJSON(result$payload)
    checkEquals(length(payload),2)
    df <- fromJSON(payload[[1]])
    checkEquals(dim(df), c(344,5))
    checkEquals(as.character(df[344,]), c("TCGA.06.0157.01", "EGFR","AMPLIFIED","MISSENSE",
      "UPREGULATED"))
} # demo
#----------------------------------------------------------------------------------------------------
test.oneGene <- function()
{
  string <- c("EGFR","TCGA.14.1402","TCGA.12.0820",
    "TCGA.06.0876","TCGA.16.0861","TCGA.06.0879","TCGA.14.0787","TCGA.06.0743","TCGA.15.0742","TCGA.12.0657",
    "TCGA.12.0656","TCGA.12.0703","TCGA.12.0780","TCGA.12.0692","TCGA.06.0747","TCGA.12.0688","TCGA.06.0744",
    "TCGA.08.0358","TCGA.06.0127","TCGA.08.0375","TCGA.08.0244","TCGA.08.0357","TCGA.02.0070","TCGA.02.0023",
    "TCGA.08.0356","TCGA.02.0068","TCGA.02.0016","TCGA.08.0355","TCGA.02.0015","TCGA.08.0354","TCGA.08.0246",
    "TCGA.08.0511","TCGA.06.0402","TCGA.02.0333","TCGA.02.0317","TCGA.02.0260","TCGA.08.0521","TCGA.02.0290",
    "TCGA.06.0394","TCGA.02.0430","TCGA.02.0289","TCGA.08.0514","TCGA.02.0269","TCGA.08.0518","TCGA.06.0157")
    result <- create.oncoprint.input(string, ds)
    checkEquals(length(result), 2)
    payload <- fromJSON(result$payload)
    checkEquals(length(payload),2)
    df <- fromJSON(payload[[1]])
    checkEquals(dim(df), c(43,5))
    checkEquals(as.character(df[42,]), c("TCGA.15.0742.01", "EGFR","AMPLIFIED","UPREGULATED","MISSENSE"))
} # test.oneGene
#----------------------------------------------------------------------------------------------------
test.onePatient <- function()
{
  string <- c("ZNF713","SEPT14","SEC61G","LANCL2","ETV1","VSTM2A","VOPP1","EGFR","TCGA.12.0820")
    result <- create.oncoprint.input(string, ds)
    checkEquals(length(result), 2)
    payload <- fromJSON(result$payload)
    checkEquals(length(payload),2)
    df <- fromJSON(payload[[1]])
    checkEquals(dim(df), c(43,5))
    checkEquals(as.character(df[42,]), c("TCGA.15.0742.01", "EGFR","AMPLIFIED","UPREGULATED","MISSENSE"))
} # test.oneGene
#----------------------------------------------------------------------------------------------------
