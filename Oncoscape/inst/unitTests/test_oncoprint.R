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
genes_all = unique(union(union(colnames(cnv),colnames(mut)),colnames(mrna)))
patients_all = unique(union(union(rownames(cnv),rownames(mut)),rownames(mrna)))
patients_all = substring(patients_all, 1, 12)

#  created thus"," on (Oct 21st, 2015)
# 
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  survey.data()
  demo()
  #test.oneGene()
  #test.onePatient()
  #test.oneGeneOnePatient()
  #test.purePatients()
  #test.pureGenes()
  #test.missingDatatype()
  #timing.oncoprint()
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
   printf("--- demo")
   string <- c("ZNF713","SEPT14","SEC61G","LANCL2","ETV1","VSTM2A","VOPP1","EGFR","TCGA.14.1402","TCGA.12.0820",
    "TCGA.06.0876.01","TCGA.16.0861.01","TCGA.06.0879","TCGA.14.0787","TCGA.06.0743","TCGA.15.0742","TCGA.12.0657",
    "TCGA.12.0656","TCGA.12.0703","TCGA.12.0780","TCGA.12.0692","TCGA.06.0747","TCGA.12.0688","TCGA.06.0744",
    "TCGA.08.0358","TCGA.06.0127","TCGA.08.0375","TCGA.08.0244","TCGA.08.0357","TCGA.02.0070","TCGA.02.0023",
    "TCGA.08.0356","TCGA.02.0068","TCGA.02.0016","TCGA.08.0355","TCGA.02.0015","TCGA.08.0354","TCGA.08.0246",
    "TCGA.08.0511","TCGA.06.0402","TCGA.02.0333","TCGA.02.0317","TCGA.02.0260","TCGA.08.0521","TCGA.02.0290",
    "TCGA.06.0394","TCGA.02.0430","TCGA.02.0289","TCGA.08.0514","TCGA.02.0269","TCGA.08.0518","TCGA.06.0157")
    result <- OncoDev14:::create.oncoprint.input(string, "TCGAgbm", "unitTest")
    checkEquals(length(result), 3)
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
  printf("--- test one gene")
  string <- c("EGFR","TCGA.14.1402","TCGA.12.0820",
    "TCGA.06.0876","TCGA.16.0861","TCGA.06.0879","TCGA.14.0787","TCGA.06.0743","TCGA.15.0742","TCGA.12.0657",
    "TCGA.12.0656","TCGA.12.0703","TCGA.12.0780","TCGA.12.0692","TCGA.06.0747","TCGA.12.0688","TCGA.06.0744",
    "TCGA.08.0358","TCGA.06.0127","TCGA.08.0375","TCGA.08.0244","TCGA.08.0357","TCGA.02.0070","TCGA.02.0023",
    "TCGA.08.0356","TCGA.02.0068","TCGA.02.0016","TCGA.08.0355","TCGA.02.0015","TCGA.08.0354","TCGA.08.0246",
    "TCGA.08.0511","TCGA.06.0402","TCGA.02.0333","TCGA.02.0317","TCGA.02.0260","TCGA.08.0521","TCGA.02.0290",
    "TCGA.06.0394","TCGA.02.0430","TCGA.02.0289","TCGA.08.0514","TCGA.02.0269","TCGA.08.0518","TCGA.06.0157")
    result <- OncoDev14:::create.oncoprint.input(string, "TCGAgbm", "unitTest")
    checkEquals(length(result), 3)
    payload <- fromJSON(result$payload)
    checkEquals(length(payload),2)
    df <- fromJSON(payload[[1]])
    checkEquals(dim(df), c(43,5))
    checkEquals(as.character(df[42,]), c("TCGA.15.0742.01", "EGFR","AMPLIFIED","UPREGULATED","MISSENSE"))
} # test.oneGene
#----------------------------------------------------------------------------------------------------
test.onePatient <- function()
{
    printf("--- test one patient")
    string <- c("ZNF713","SEPT14","SEC61G","LANCL2","ETV1","VSTM2A","VOPP1","EGFR","TCGA.12.0820")
    result <- OncoDev14:::create.oncoprint.input(string, "TCGAgbm", "unitTest")
    checkEquals(length(result), 3)
    payload <- fromJSON(result$payload)
    checkEquals(length(payload),2)
    df <- fromJSON(payload[[1]])
    checkEquals(dim(df), c(8,3))
    checkEquals(as.character(df[8,]), c("TCGA.12.0820.01","EGFR","GAINED"))
} # test.oneGene
#----------------------------------------------------------------------------------------------------
test.oneGeneOnePatient <- function()
{
    printf("--- test one gene one patient")
    string <- c("EGFR","TCGA.06.0876")
    result <- OncoDev14:::create.oncoprint.input(string, "TCGAgbm", "unitTest")
    checkEquals(length(result), 3)
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
    result <- OncoDev14:::create.oncoprint.input(string, "TCGAgbm", "unitTest")
    checkEquals(length(result), 3)
    checkEquals(result$status, "error")
    payload <- fromJSON(result$payload)
    checkEquals(payload, "No overlapping patients or genes within dataset, please re-select")
} # test.purePatients
#----------------------------------------------------------------------------------------------------
test.pureGenes <- function()
{
    string <- c("ZNF713","SEPT14","SEC61G","LANCL2","ETV1","VSTM2A","VOPP1","EGFR")
    result <- OncoDev14:::create.oncoprint.input(string, "TCGAgbm", "unitTest")
    checkEquals(length(result), 3)
    checkEquals(result$status, "error")
    payload <- fromJSON(result$payload)
    checkEquals(payload, "No overlapping patients or genes within dataset, please re-select")
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
    result <- OncoDev14:::create.oncoprint.input(string, ds_truncated, "unitTest")
    checkEquals(length(result), 3)
    payload <- fromJSON(result$payload)
    checkEquals(length(payload),2)
    df <- fromJSON(payload[[1]])
    checkEquals(dim(df), c(344,4))
    checkEquals(as.character(df[344,]), c("TCGA.06.0157.01","EGFR","AMPLIFIED","MISSENSE"))
} # test.missingDatatype
#----------------------------------------------------------------------------------------------------
timing.oncoprint <- function()
{
    # use dataset TCGAgbm
    # Scenario 1: Number of genes: 1; Number of patients: 1;
    start_1 <- proc.time();
    string_1 <- c("EGFR", patients_all[300]);
    result_1 <- OncoDev14:::create.oncoprint.input(string_1, "TCGAgbm", "unitTest")
    computing_time_1 <- proc.time() - start_1; 
    printf("1 gene 1 patient, computations takes:%f sec",computing_time_1[1]);
    # Scenario 2: Number of genes: 1; Number of patients: 10;
    start_2 <- proc.time();
    string_2 <- c("EGFR", patients_all[c(200:210)]);
    result_2 <- OncoDev14:::create.oncoprint.input(string_2, "TCGAgbm", "unitTest")
    computing_time_2 <- proc.time() - start_2; 
    printf("1 gene 10 patients, computations takes:%f sec",computing_time_2[1]);
    # Scenario 3:  Number of genes: 10; Number of patients: 1;
    start_3 <- proc.time();
    string_3 <- c(genes_all[c(200:209)], patients_all[300]);
    result_3 <- OncoDev14:::create.oncoprint.input(string_3, "TCGAgbm", "unitTest")
    computing_time_3 <- proc.time() - start_3; 
    printf("10 genes 1 patient, computations takes:%f sec",computing_time_3[1]); 
    # Scenario 4:  Number of genes: 10; Number of patients: 100;
    start_4 <- proc.time();
    string_4 <- c(genes_all[c(200:209)], patients_all[c(200:299)]);
    result_4 <- OncoDev14:::create.oncoprint.input(string_4, "TCGAgbm", "unitTest")
    computing_time_4 <- proc.time() - start_4; 
    printf("10 genes 100 patients, computations takes:%f sec",computing_time_4[1]);
    # Scenario 5:  Number of genes: 100; Number of patients: 10;
    start_5 <- proc.time();
    string_5 <- c(genes_all[c(200:299)], patients_all[c(200:209)]);
    result_5<- OncoDev14:::create.oncoprint.input(string_5, "TCGAgbm", "unitTest")
    computing_time_5 <- proc.time() - start_5; 
    printf("100 genes 10 patients, computations takes:%f sec",computing_time_5[1]);
    # Scenario 6:  Number of genes: Max number of nodes minors 1 (449); Number of patients: 1;
    start_6 <- proc.time();
    string_6 <- c(genes_all[c(20100:20549)], patients_all[349]);
    result_6 <- OncoDev14:::create.oncoprint.input(string_6, "TCGAgbm", "unitTest")
    computing_time_6 <- proc.time() - start_6; 
    printf("449 genes 1 patient, computations takes:%f sec",computing_time_6[1]);
    # Scenario 7:  Number of genes: 1; Number of patients: Max number of nodes minors 1 (449);
    start_7 <- proc.time();
    string_7 <- c("EGFR", patients_all[c(1:449)]);
    result_7 <- OncoDev14:::create.oncoprint.input(string_7, "TCGAgbm", "unitTest")
    computing_time_7 <- proc.time() - start_7; 
    printf("1 gene 449 patients, computations takes:%f sec",computing_time_7[1]); 
    # Scenario 8: Number of genes: 2000; Number of patients: 100;  
    start_8 <- proc.time();
    string_8 <- c(genes_all[c(1:2000)], patients_all[c(1:100)]);
    result_8 <- OncoDev14:::create.oncoprint.input(string_8, "TCGAgbm", "unitTest")
    computing_time_8 <- proc.time() - start_8; 
    printf("20000 gene 100 patients, computations takes:%f sec",computing_time_8[1]); 
    # Scenario 9: Number of genes: 20000; Number of patients: 100;  
    start_9 <- proc.time();
    string_9 <- c(genes_all[c(1:20000)], patients_all[c(1:100)]);
    result_9 <- OncoDev14:::create.oncoprint.input(string_9, "TCGAgbm", "unitTest")
    computing_time_9 <- proc.time() - start_9; 
    printf("20000 gene 100 patients, computations takes:%f sec",computing_time_9[1]); 

    gene_selectedNum <- c(1, 1, 10, 10, 100, 449, 1, 2000, 20000);
    patient_selectedNum <- c(1, 10, 1, 100, 10, 1, 449, 100, 100);
    time_consumed <- c(computing_time_1[3], computing_time_2[3], computing_time_3[3], 
                       computing_time_4[3],computing_time_5[3], computing_time_6[3], 
                       computing_time_7[3], computing_time_8[3], computing_time_9[3]);
    result_length <- c(dim(fromJSON(fromJSON(result_1$payload)[[1]]))[1],
        dim(fromJSON(fromJSON(result_2$payload)[[1]]))[1],
        dim(fromJSON(fromJSON(result_3$payload)[[1]]))[1],
        dim(fromJSON(fromJSON(result_4$payload)[[1]]))[1],
        dim(fromJSON(fromJSON(result_5$payload)[[1]]))[1],
        dim(fromJSON(fromJSON(result_6$payload)[[1]]))[1],
        dim(fromJSON(fromJSON(result_7$payload)[[1]]))[1],
        dim(fromJSON(fromJSON(result_8$payload)[[1]]))[1],
        dim(fromJSON(fromJSON(result_9$payload)[[1]]))[1])
    timing_table <- data.frame(gene_selectedNum,patient_selectedNum, time_consumed, result_length);
    print(timing_table);
    #gene_selectedNum patient_selectedNum time_consumed result_length
    #1                1                   1         0.015             1
    #2                1                  10         0.027            11
    #3               10                   1         0.016            10
    #4               10                 100         0.031          1000
    #5              100                  10         0.033          1000
    #6              449                   1         1.592           450
    #7                1                 449         0.022           449
    #8             2000                 100         1.848        200000
    #9            20000                 100        28.267       2000000
   
} # timing.oncoprint
#----------------------------------------------------------------------------------------------------
#runTests()
