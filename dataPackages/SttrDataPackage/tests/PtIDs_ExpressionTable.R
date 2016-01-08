#Script to compare patients across the different manifest categories 
#----------------------------------------------------------------------------------------------------------------------------
#load libraries 
library("TCGAbrain")
library("TCGAbrca")
library("TCGAprad")
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

#Create a variable of all the datapackages available for testing
datapackages<-c("TCGAbrain","TCGAbrca","DEMOdz","TCGAgbm","TCGAhnsc","TCGAlgg","TCGAluad","TCGAlung","TCGAlusc","TCGAprad","TCGAcoadread")

#function to read in all the manifest files from the different data packages
Data<-function(dp){
  dir <- system.file(package=dp,"extdata")
  file <- file.path(dir, "manifest.tsv") 
  manifest <- read.table(file, sep="\t", as.is=TRUE)
  return(manifest)
}

#Compare Function-loops datapackage manifests and grabs (sampleIDs)
CompareFunction<-function(LegitManifest,filenames,dp){
  eval(parse(text=sprintf("Loadeddp <- %s()", dp)))
  dir <- system.file(package=dp,"extdata")
  Final<-sapply(1:length(filenames), function(i){
    rowA<-LegitManifest[i,]  
    fileA<- file.path(dir, rownames(rowA))
    load(fileA)
    
    eval(parse(text=sprintf("matrixA <- %s", rowA[[1]])))
    IDsA<-rownames(matrixA)
    PtIDsA<-unique(canonicalizePatientIDs (Loadeddp,IDsA)) 
    
    
     NumberPtIDs<-sapply(1:length(filenames), function(j){
       rowB<-LegitManifest[j,]  
       fileB<- file.path(dir, rownames(rowB))
       load(fileB)
      
       eval(parse(text=sprintf("matrixB <- %s", rowB[[1]])))
       IDsB<-rownames(matrixB)
       PtIDsB<-unique(canonicalizePatientIDs (Loadeddp,IDsB)) 
       intersectionPtIDs<-length(intersect(PtIDsA, PtIDsB)) 
       (intersectionPtIDs/length(PtIDsB))*100 
     })
    NumberPtIDs [i]<-length(PtIDsA)
    round(NumberPtIDs)
  })
  #name columns and rows
  rownames(Final)<-filenames
  colnames(Final)<-filenames
  print(Final)
}

#Final lapply for results 
ExpressionTables<-lapply(datapackages,function(dp){
  manifest<-Data(dp)
  #create variable of only the desired categories from the manifests
  LegitManifest<-subset(manifest,(grepl("copy number|mutations|protein abundance|methylation|mrna expression",category ,ignore.case = TRUE)))
  print(paste("This datapackage is", dp))
  #set files names as a variable
  filenames<-rownames(LegitManifest)
  CompareFunction(LegitManifest, filenames, dp)
})
names(ExpressionTables)=datapackages
#--------------------------------------------------------------------------------------------------------------------------------------
