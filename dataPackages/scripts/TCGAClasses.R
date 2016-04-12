source("TCGAEnums.R")



#--------------------------------------------------------------------------------
#GENERAL CLASSES (tcgaId, tcgaDate, upperCharacter, numeric)
#--------------------------------------------------------------------------------
setClass("os.class.tcgaId")
setAs("character","os.class.tcgaId", function(from) {
  as.character(str_replace_all(from,"-","." )) 
})



#--------------------------------------------------------------------------------
setClass("os.class.tcgaDate");
setAs("character","os.class.tcgaDate", function(from){
  # If 4 Year Date
  if ((str_length(from)==4) && !is.na(as.integer(from) ) ){
    return(format(as.Date(paste(from, "-1-1", sep=""), "%Y-%m-%d"), "%m/%d/%Y"))
  }
  return(NA)
})



#--------------------------------------------------------------------------------
setClass("os.class.tcgaCharacter");
setAs("character","os.class.tcgaCharacter", function(from){
  
  # Convert Input Character Vector To Uppercase
  from<-toupper(from)	
  
  # Get Indexes Of Fram Where Value Is In NA
  from.na<-which(from %in% os.enum.na)
  
  # Set From Indexes Values To NA
  from[from.na]<-NA	
  
  return(from)
})



#--------------------------------------------------------------------------------
#BIRTH TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.gender")
setAs("character", "os.class.gender", function(from){
  
  from<-toupper(from)	
  
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.gender, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.gender, NA)))	
})

setClass("os.class.race")
setAs("character", "os.class.race", function(from){
  
  from<-toupper(from)	
  
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.race, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.race, NA)))	
})

setClass("os.class.ethnicity")
setAs("character", "os.class.ethnicity", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.ethnicity, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.ethnicity, NA)))	
})

#--------------------------------------------------------------------------------
#DIAGNOSIS TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.disease")
setAs("character", "os.class.disease", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.disease, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.disease, NA)))	
})


#--------------------------------------------------------------------------------
#DRUG TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.route")
setAs("character", "os.class.route", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.route, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.route, NA)))	
})

#--------------------------------------------------------------------------------
#RAD TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum. <- c()                                 
#--------------------------------------------------------------------------------
#RAD TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.")
setAs("character", "os.class.", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum., NA)))
    return(from)	
  stop(setdiff(from,c(os.enum., NA)))	
})


#--------------------------------------------------------------------------------
#STATUS TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.vital")
setAs("character", "os.class.vital", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.vital, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.vital, NA)))	
})
setClass("os.class.status")
setAs("character", "os.class.status", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.status, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.status, NA)))	
})


#--------------------------------------------------------------------------------
#PROGRESSION TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.newTumor")
setAs("character", "os.class.newTumor", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.newTumor, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.newTumor, NA)))	
})

#--------------------------------------------------------------------------------
#ENCOUNTER TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.encType")
setAs("character", "os.class.encType", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.encType, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.encType, NA)))	
})


#--------------------------------------------------------------------------------
#PROCEDURE TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.side")
setAs("character", "os.class.side", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.side, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.side, NA)))	
})

setClass("os.class.site")
setAs("character", "os.class.site", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.site, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.site, NA)))	
})


#--------------------------------------------------------------------------------
#PATHOLOGY TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.prospective_collection")
setAs("character", "os.class.prospective_collection", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.prospective_collection, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.prospective_collection, NA)))	
})

setClass("os.class.retrospective_collection")
setAs("character", "os.class.retrospective_collection", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.retrospective_collection, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.retrospective_collection, NA)))	
})


#--------------------------------------------------------------------------------
#ABSENT TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.radInd")
setAs("character", "os.class.radInd", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.radInd, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.radInd, NA)))	
})

setClass("os.class.drugInd")
setAs("character", "os.class.drugInd", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum.drugInd, NA)))
    return(from)	
  stop(setdiff(from,c(os.enum.drugInd, NA)))	
})

#--------------------------------------------------------------------------------
#TESTS TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum. <- c()                                 
#--------------------------------------------------------------------------------
#TESTS TABLE CLASSES
#--------------------------------------------------------------------------------
setClass("os.class.")
setAs("character", "os.class.", function(from){
  
  from<-toupper(from)	
  from.na<-which(from %in% os.enum.na)
  from[from.na]<-NA	
  
  if(all (from %in% c(os.enum., NA)))
    return(from)	
  stop(setdiff(from,c(os.enum., NA)))	
})