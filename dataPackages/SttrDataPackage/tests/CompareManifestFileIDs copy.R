library(RUnit)
library(DEMOdz)
library(TCGAgbm)
library(TCGAbrain)


#----------------------------------------------------------------------------------------------------
printf <- function(...) print(noquote(sprintf(...)))
#----------------------------------------------------------------------------------------------------
	# construct these objects just one, for subsequent examination and testing

if(!exists("ddz"))
   ddz <- DEMOdz()

if(!exists("gbm"))
   gbm <- TCGAgbm()

if(!exists("brain"))
   brain <- TCGAbrain()
   
  
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
    category.types<-c("mutations", "copy number", "mRNA expression", "protein abundance", "methylation") 
    for(category.name in category.types){
  
    	exploreExpressionData(ddz, "DEMOdz", category.name)
    	exploreExpressionData(gbm, "TCGAgbm", category.name)
    	exploreExpressionData(brain, "TCGAbrain", category.name)
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
	#WHAT IS THIS DOING
   
   for(name in expression.matrix.names){
       # create a variable mtx using matrices function from STTRDataPackageClass, and grab all the matrices in the package and
       #list them as mtx."name of the matrix" Example:mtx.mrna.ueArray, mtx.mrna.bc
       
       mtx <- matrices(dz)[[name]];
       
       #Print the name of the matrix as a string, the number or rows as a digit, number of cols as a digit of the mtx variables. 
       printf("  * %s: %d x %d", name, nrow(mtx), ncol(mtx))
       
       # create a variable that finds matches in both patient.names (from getpatienttable) and rownames of the any mRNA data packages
       # This is finding exact patient ID matches. intersect returns common values of two vectors
       exact.patientIDs.with.expression <- intersect(patient.names, rownames(mtx))
       
       #create a variable tmp to call the loop as a function (?) and find similar patterns in the patient.names 
       # and the rownames(patient identifies) in all matrices in the package.
       tmp <- sapply(patient.names, function(name) grep(name, rownames(mtx)))
       
       #make this output a variable that returns as a vector 
       matchable.patientIDs.with.expression <- names(which(unlist(tmp) > 0))
       
       
       #print the results as patients with expression data (string), digit (length of exact), digit (length of matchable)
       printf("    patients with expression data in %s: %d exact, %d matchable", name,
              length(exact.patientIDs.with.expression),
              length(matchable.patientIDs.with.expression))
       } # for name