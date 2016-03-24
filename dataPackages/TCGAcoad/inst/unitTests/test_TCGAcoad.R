library(RUnit)
library(TCGAcoad)
library(org.Hs.eg.db)
Sys.setlocale("LC_ALL", "C")
  ## to prevent issues with different sort calls (3/3/15)
#--------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#--------------------------------------------------------------------------------

runTests <- function()
{
    # first tests are concerned with coading, parsing, and transforming
    # data to -create- a TCGAcoad data package

  printf("=== test_TCGAcoad.R, runTests()")
  testConstructor();
  testManifest()
  testHistoryList()
  testHistoryTable()
  testCanonicalizePatientIDs()
  
} # runTests
#--------------------------------------------------------------------------------
testManifest <- function()
{
    printf("--- testManifest")
    dir <- system.file(package="TCGAcoad", "extdata")
    checkTrue(file.exists(dir))
    
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
#--------------------------------------------------------------------------------------------------
testConstructor <- function()#
{
   printf("--- testConstructor")

   dp <- TCGAcoad();
   checkEquals(ncol(manifest(dp)), 11)
   checkTrue(nrow(manifest(dp)) >= 4)
   checkTrue(length(matrices(dp)) >= 0)
   checkTrue(eventCount(history(dp)) > 4000)
   
} # testConstructor
#--------------------------------------------------------------------------------

testHistoryList <- function()
{
   printf("--- testHistoryList")
   dp <- TCGAcoad();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- geteventList(ptHistory)
   checkEquals(length(events), 4467)
    
   event.counts <- as.list(table(unlist(lapply(events,
                           function(element) element$Name), use.names=FALSE)))
   checkEquals(event.counts,
               list(Absent=67,
                    Background=454,
                    Birth=454,
                    Diagnosis=454,
                    Drug=550,
                    Encounter=454,
                    Pathology=529,
                    Procedure=76,
                    Progression=96,
                    Radiation=31,
                    Status=454,
                    Tests=848))

} # testHistoryList
#--------------------------------------------------------------------------------
testHistoryTable <- function()
{
   printf("--- testHistoryTable")
   dp <- TCGAcoad();
   checkTrue("history" %in% manifest(dp)$variable)
   ptHistory <- history(dp)
   checkTrue(is(ptHistory, "PatientHistoryClass"))

   events <- getTable(ptHistory)
   checkEquals(class(events),"data.frame")
   checkEquals(dim(events), c(454, 407))
   checkEquals(colnames(events)[1:10], 
           c("ptID", "ptNum", "study", "Birth.date", "Birth.gender", "Birth.race", "Birth.ethnicity",
             "Drug.date1", "Drug.date2", "Drug.therapyType"))
   checkEquals(unique(events$study), "TCGAcoad")
   checkEquals(as.character(events[1,4]),"09/25/1951")
   checkEquals(as.character(events[1,c("Survival", "AgeDx", "TimeFirstProgression")]), c("349", "22379", "NA"))

} # testHistoryList
#----------------------------------------------------------------------------------------------------
testCanonicalizePatientIDs <- function()
{
   printf("--- testCanonicalizePatientIDs")
   dp <- TCGAcoad()
   IDs <- names(getPatientList(dp))
   ptIDs <- canonicalizePatientIDs(dp, IDs)
   
   checkTrue(all(grepl("^TCGA\\.\\w\\w\\.\\w\\w\\w\\w$", ptIDs)))

}
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
