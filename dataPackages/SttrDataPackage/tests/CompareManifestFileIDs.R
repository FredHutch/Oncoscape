#load libraries 
library("TCGAbrain")
library("TCGAbrca")
library("DEMOdz")
library("TCGAgbm")
library("TCGAhnsc")
library("TCGAlgg")
library("TCGAluad")
library("TCGAlung")
library("TCGAlusc")
library("TCGAprad")
library("TCGAcoadread")

#----------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#----------------------------------------------------------------------------------------------------
# construct these objects for subsequent examination and testing

if (!exists("brain"))
  brain <- TCGAbrain()

if (!exists("brca"))
  brca <- TCGAbrca()

if (!exists("ddz"))
  ddz <- DEMOdz()

if (!exists("gbm"))
  gbm <- TCGAgbm()

if (!exists("hnsc"))
  hnsc <- TCGAhnsc()

if (!exists("lgg"))
  lgg <- TCGAlgg()

if (!exists("luad"))
  luad <- TCGAluad()

if (!exists("lung"))
  lung <- TCGAlung()

if (!exists("lusc"))
  lusc <- TCGAlusc()

if (!exists("prad"))
  prad <- TCGAprad()

if (!exists("coadread"))
  coadread <- TCGAcoadread()   
  
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
    category.types<-c("mutations", "copy number", "mRNA expression", "protein abundance", "methylation") 
    for(category.name in category.types){
  
       	exploreExpressionData(ddz, "DEMOdz", category.name)
    	exploreExpressionData(gbm, "TCGAgbm", category.name)
    	exploreExpressionData(brain, "TCGAbrain", category.name)
    	exploreExpressionData(brca, "TCGAbrca", category.name)
    	exploreExpressionData(hnsc, "TCGAhnsc", category.name)
    	exploreExpressionData(lgg, "TCGAlgg", category.name)
    	exploreExpressionData(luad, "TCGAluad", category.name)
    	exploreExpressionData(lung, "TCGAlung", category.name)
    	exploreExpressionData(lusc, "TCGAlusc", category.name)
    	exploreExpressionData(prad, "TCGAprad", category.name)
    	exploreExpressionData(coadread, "TCGAcoadread", category.name)
    }  
} # runTests
#----------------------------------------------------------------------------------------------------
 exploreExpressionData <- function(dz, packageName, category.name)
{
   tbl.manifest <- manifest(dz)
   if (!any(grepl(category.name, tbl.manifest$category,ignore.case=TRUE)))  
   {
   		printf("  %s not found in %s",category.name, packageName)
   		return();
   } 
   expression.matrix.names <- tbl.manifest$variable [grep(category.name, tbl.manifest$category, ignore.case=TRUE)]
   checkTrue(all(expression.matrix.names %in% names(matrices(dz))))

   #create a variable to obtain all the patient ID's from the selected datapackage and print them as--- number of patients (length)
   # in the the selected datapackage
   patient.names <- rownames(getPatientTable(dz))
   printf("--- %d patients in %s", length(patient.names),  packageName)

      # print matrix names and dimensions, make sure we have expression measurements
      # for every patient 

   for(name in expression.matrix.names){
       mtx <- matrices(dz)[[name]];
       printf("  * %s: %d x %d", name, nrow(mtx), ncol(mtx))
       exact.patientIDs.with.expression <- intersect(patient.names, rownames(mtx))
       tmp <- sapply(patient.names, function(name) grep(name, rownames(mtx)))
       matchable.patientIDs.with.expression <- names(which(unlist(tmp) > 0))
       printf("    patients with expression data in %s: %d exact, %d matchable", name,
              length(exact.patientIDs.with.expression),
              length(matchable.patientIDs.with.expression))
       } # for name
  

} # exploreExpressionData 
#----------------------------------------------------------------------------------------------------
