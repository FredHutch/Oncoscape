library(RUnit)
library(TCGAread)
library(org.Hs.eg.db)
Sys.setlocale("LC_ALL", "C")
  ## to prevent issues with different sort calls (3/3/15)
#--------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#--------------------------------------------------------------------------------
OnlyClinical = TRUE
runTests <- function()
{
    # first tests are concerned with reading, parsing, and transforming
    # data to -create- a TCGAread data package

  printf("=== test_TCGAread.R, runTests()")
  testConstructor();
  testManifest()
  testHistoryList()
  testHistoryTable()
  } # runTests
#--------------------------------------------------------------------------------
testConstructor <- function()#
{
   printf("--- testConstructor")

   dp <- TCGAread();
   checkEquals(dim(manifest(dp)), c(1, 11))
   checkEquals(length(matrices(dp)), 0)
   #checkEquals(names(matrices(dp)), c("mtx.cn","mtx.mrna", "mtx.mut", "mtx.prot", "mtx.meth"))
   checkEquals(eventCount(history(dp)), 1608)
   
} # testConstructor
#--------------------------------------------------------------------------------
testManifest <- function()
{
    printf("--- testManifest")
    dir <- system.file(package="TCGAread", "extdata")
    checkTrue(file.exists(dir))
    
    file <- file.path(dir, "manifest.tsv")
    checkTrue(file.exists(file))
    
    tbl <- read.table(file, sep="\t", as.is=TRUE)
    checkEquals(dim(tbl), c(1, 11))
    checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
    "entity.count", "feature.count", "entity.type",
    "feature.type", "minValue", "maxValue", "provenance"))
    
    checkEquals(tbl$category, c( "history"))
    checkEquals(rownames(tbl), c( "history.RData"))
    checkEquals(sort(tbl$class), c("list"))
    checkProvenance <- function(var){
        return(tbl[tbl$variable==var,11])
    }
    
    for(i in 1:nrow(tbl)){
        file.name <- rownames(tbl)[i]
        full.name <- file.path(dir, file.name)
        variable.name <- tbl$variable[i]
        checkEquals(load(full.name), variable.name)
        # get a handle on the variable, "x"
        eval(parse(text=sprintf("%s <- %s", "x", variable.name)))
        class <- tbl$class[i]
        category <- tbl$category[i]
        subcategory <- tbl$subcategory[i]
        entity.count <- tbl$entity.count[i]
        feature.count <- tbl$feature.count[i]
        checkEquals(class(x), class)
        if(class %in% c("matrix", "data.frame")){
            checkEquals(entity.count, nrow(x))
            checkEquals(feature.count, ncol(x))
        }
        if(class == "list"){
            checkEquals(entity.count, length(x))
            checkTrue(is.na(feature.count))
        }
        entity.type <- tbl$entity.type[i]
        feature.type <- tbl$feature.type[i]
        minValue <- tbl$minValue[i]
        maxValue <- tbl$maxValue[i]
        if(class == "matrix" && !is.na(minValue)){
            checkEqualsNumeric(min(x, na.rm=T), minValue, tolerance=10e-4)
            checkEqualsNumeric(max(x, na.rm=T), maxValue, tolerance=10e-4)
        }
        provenance <- tbl$provenance[i];
        checkEquals(checkProvenance(tbl[i,1]),provenance)
        
    } # for i
    
    TRUE
    
   
} # testManifest
#--------------------------------------------------------------------------------
testHistoryList <- function()
{
   printf("--- testHistoryList")
   dp <- TCGAread();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getList(ptHistory)
   checkEquals(length(events), 1608)
    
   event.counts <- as.list(table(unlist(lapply(events,
                           function(element) element$Name), use.names=FALSE)))
   checkEquals(event.counts,
               list(Absent=17,
                    Background=171,
                    Birth=171,
                    Diagnosis=171,
                    Drug=158,
                    Encounter=171,
                    Pathology=187,
                    Procedure=20,
                    Progression=30,
                    Radiation=25,
                    Status=171,
                    Tests=316))

} # testHistoryList
#--------------------------------------------------------------------------------
testHistoryTable <- function()
{
   printf("--- testHistoryTable")
   dp <- TCGAread();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getTable(ptHistory)
   checkEquals(class(events),"data.frame")
   checkEquals(dim(events), c(171, 285))
   checkEquals(colnames(events)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))
   checkEquals(unique(events$study), "TCGAread")
   checkEquals(as.character(events[1,4]),"03/29/1951")
   checkEquals(as.character(events[1,c("Survival", "AgeDx", "TimeFirstProgression")]), c("734", "21098", "NA"))

} # testHistoryList
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
