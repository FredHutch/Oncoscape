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
  testCanonicalizePatientIDs()
  
  } # runTests
#--------------------------------------------------------------------------------
testConstructor <- function()#
{
   printf("--- testConstructor")

   dp <- TCGAread();
   checkEquals(ncol(manifest(dp)), 11)
   checkTrue(nrow(manifest(dp)) >= 4)
   checkTrue(length(matrices(dp)) >= 0)
   checkTrue(eventCount(history(dp)) > 1600)
   
} # testConstructor
#--------------------------------------------------------------------------------
testManifest <- function()
{
    printf("--- testManifest")
    dir <- system.file(package="TCGAread", "extdata")
    checkTrue(file.exists(dir))
    
    file <- file.path(dir, "manifest.tsv")
    checkTrue(file.exists(file))
    
    file <- file.path(dir, "manifest.tsv")
   checkTrue(file.exists(file))
   
   tbl <- read.table(file, sep="\t", as.is=TRUE)
   checkEquals(ncol(tbl), 11)
   checkTrue(nrow(tbl) >= 4)

   checkEquals(colnames(tbl), c("variable", "class", "category", "subcategory",
                                "entity.count", "feature.count", "entity.type",
                                "feature.type", "minValue", "maxValue", "provenance"))
 
   expected.categories <- c("history")
   
   checkTrue(all(expected.categories %in% tbl$category))
   expected.rownames <- c("events.RData","ptHistory.RData","historyTypes.RData", "tbl.ptHistory.RData")
   checkTrue(all(expected.rownames %in% rownames(tbl)))
    
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
        checkEquals(provenance, "tcga")
        
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

   events <- geteventList(ptHistory)
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
   checkEquals(dim(events), c(171, 284))
   checkEquals(colnames(events)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))
   checkEquals(unique(events$study), "TCGAread")
   checkEquals(as.character(events[1,4]),"03/29/1951")
   checkEquals(as.character(events[1,c("Survival", "AgeDx", "TimeFirstProgression")]), c("734", "21098", "NA"))

} # testHistoryList
#----------------------------------------------------------------------------------------------------
testCanonicalizePatientIDs <- function()
{
   printf("--- testCanonicalizePatientIDs")
   dp <- TCGAread()
   IDs <- names(getPatientList(dp))
   ptIDs <- canonicalizePatientIDs(dp, IDs)
   
   checkTrue(all(grepl("^TCGA\\.\\w\\w\\.\\w\\w\\w\\w$", ptIDs)))

}
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
