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
ds <- TCGAgbm()
ds.matrices = SttrDataPackage:::matrices(ds)
cnv <- ds.matrices$mtx.cn
mut <- ds.matrices$mtx.mut
if("mtx.mrna" %in% names(ds.matrices)){
    mrna <- ds.matrices$mtx.mrna
}else{      
    mrna <- ds.matrices$mtx.mrna.bc }

#  created thus"," on (Oct 21st, 2015)
# 
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
#-------------------------------------------------------------------------------------------
survey.data <- function()
{
   printf("--- survey.data")
   checkEquals(dim(cnv), c(563, 23575))
   checkEquals(dim(mut), c(291, 6698))
   checkEquals(dim(mrna), c(154, 20457))
} # survey.data
#----------------------------------------------------------------------------------------------------
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
    checkEquals(dim(df), c(8,3))
    checkEquals(as.character(df[8,]), c("TCGA.12.0820.01","EGFR","GAINED"))
} # test.oneGene
#----------------------------------------------------------------------------------------------------
test.oneGeneOnePatient <- function()
{
    string <- c("EGFR","TCGA.06.0876")
    result <- create.oncoprint.input(string, ds)
    checkEquals(length(result), 2)
    checkEquals(result$status, "success")
    payload <- fromJSON(result$payload)
    df <- fromJSON(payload[[1]])
    checkEquals(dim(df), c(1,4))
    checkEquals(as.character(df[1,]), c("TCGA.06.0876.01","EGFR","AMPLIFIED","MISSENSE"))
} # test.oneGeneOnePatient
#----------------------------------------------------------------------------------------------------
test.purePatients <- function()
{
    string <- c("TCGA.06.0876","TCGA.16.0861","TCGA.06.0879","TCGA.14.0787","TCGA.06.0743","TCGA.15.0742","TCGA.12.0657",
    "TCGA.12.0656","TCGA.12.0703","TCGA.12.0780","TCGA.12.0692","TCGA.06.0747","TCGA.12.0688","TCGA.06.0744",
    "TCGA.08.0358","TCGA.06.0127","TCGA.08.0375","TCGA.08.0244","TCGA.08.0357","TCGA.02.0070","TCGA.02.0023",
    "TCGA.08.0356","TCGA.02.0068","TCGA.02.0016","TCGA.08.0355","TCGA.02.0015","TCGA.08.0354","TCGA.08.0246",
    "TCGA.08.0511","TCGA.06.0402","TCGA.02.0333","TCGA.02.0317","TCGA.02.0260","TCGA.08.0521","TCGA.02.0290",
    "TCGA.06.0394","TCGA.02.0430","TCGA.02.0289","TCGA.08.0514","TCGA.02.0269","TCGA.08.0518","TCGA.06.0157")
    result <- create.oncoprint.input(string, ds)
    checkEquals(length(result), 2)
    checkEquals(result$status, "failed")
    payload <- fromJSON(result$payload)
    checkEquals(payload, "It seems you only selected either patients or genes, please re-select to include both information")
} # test.purePatients
#----------------------------------------------------------------------------------------------------
test.pureGenes <- function()
{
    string <- c("ZNF713","SEPT14","SEC61G","LANCL2","ETV1","VSTM2A","VOPP1","EGFR")
    result <- create.oncoprint.input(string, ds)
    checkEquals(length(result), 2)
    checkEquals(result$status, "failed")
    payload <- fromJSON(result$payload)
    checkEquals(payload, "It seems you only selected either patients or genes, please re-select to include both information")
} # test.pureGenes
#----------------------------------------------------------------------------------------------------
test.missingDatatype <- function()
{
    string <- c("ZNF713","SEPT14","SEC61G","LANCL2","ETV1","VSTM2A","VOPP1","EGFR","TCGA.14.1402","TCGA.12.0820",
    "TCGA.06.0876","TCGA.16.0861","TCGA.06.0879","TCGA.14.0787","TCGA.06.0743","TCGA.15.0742","TCGA.12.0657",
    "TCGA.12.0656","TCGA.12.0703","TCGA.12.0780","TCGA.12.0692","TCGA.06.0747","TCGA.12.0688","TCGA.06.0744",
    "TCGA.08.0358","TCGA.06.0127","TCGA.08.0375","TCGA.08.0244","TCGA.08.0357","TCGA.02.0070","TCGA.02.0023",
    "TCGA.08.0356","TCGA.02.0068","TCGA.02.0016","TCGA.08.0355","TCGA.02.0015","TCGA.08.0354","TCGA.08.0246",
    "TCGA.08.0511","TCGA.06.0402","TCGA.02.0333","TCGA.02.0317","TCGA.02.0260","TCGA.08.0521","TCGA.02.0290",
    "TCGA.06.0394","TCGA.02.0430","TCGA.02.0289","TCGA.08.0514","TCGA.02.0269","TCGA.08.0518","TCGA.06.0157")
    #create a scenario when one data type is missing: mut in this case
    ds_truncated <- ds
    ds_truncated@matrices$mtx.mrna <- NULL
    ds_truncated@matrices$mtx.mrna.bc <- NULL
    result <- create.oncoprint.input(string, ds_truncated)
    checkEquals(length(result), 2)
    payload <- fromJSON(result$payload)
    checkEquals(length(payload),2)
    df <- fromJSON(payload[[1]])
    checkEquals(dim(df), c(344,4))
    checkEquals(as.character(df[344,]), c("TCGA.06.0157.01","EGFR","AMPLIFIED","MISSENSE"))
} # test.missingDatatype
#----------------------------------------------------------------------------------------------------
runTests()