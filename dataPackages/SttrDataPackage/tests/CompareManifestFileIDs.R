#load libraries 

dataPackageNames <- c("TCGAbrain", "TCGAbrca", "DEMOdz", "TCGAgbm", "TCGAhnsc", "TCGAlgg", "TCGAluad", "TCGAlung", "TCGAlusc", "TCGAprad", "TCGAcoadread")
for(name in dataPackageNames){
  library(name,character.only = TRUE)
}

#----------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#----------------------------------------------------------------------------------------------------
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
    category.types<-c("mutations", "copy number", "mRNA expression", "protein abundance", "methylation") 
    for(dpName in dataPackageNames){
      eval(parse(text=sprintf("dp <- %s()",dpName)))
      for(category.name in category.types){
       	exploreExpressionData(dp, dpName, category.name)
    	}
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
