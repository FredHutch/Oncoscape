#Step 1 - Create Clean Data Set
	  # Read File
	  # Set Column Types
	  # Normalize Column Names
	  # Remove Invalid Values
	  # Write To Disk

# Step 2 - Create Custom Data Sets

	# Read File
	# Create Calculated "Date" Field (Dx Year + Days To)
	# Remove Days To + Dx Field
	# Write To Disk

########################################################################     Step 1: Load Reference Tables  ########################################################################

options(stringsAsFactors=FALSE)
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)


stopifnot(file.exists("TCGA_Reference_Filenames_gh.txt")) 
TCGAfilename<-read.table("TCGA_Reference_Filenames_gh.txt", sep="\t", header=TRUE)

#stopifnot(file.exists("TCGA_Reference_Filenames_jz.txt")) 
#TCGAfilename<-read.table("TCGA_Reference_Filenames_jz.txt", sep="\t", header=TRUE)

##===load drug reference table ===
drug_ref <- read.table("drug_names_10272015.txt", sep="\t", header=TRUE)
rad_ref <- read.table("rad_ref_02232016.txt", sep="\t", header=TRUE)

if(!interactive()){
  args <- commandArgs(trailingOnly = TRUE)
  stopifnot(length(args) ==1)
  study <- args[1]; 
  print(paste("Creating Processed data for", study))
}else{
  for(study in TCGAfilename$study){
    directory <- TCGAfilename[which(TCGAfilename$study == study), "directory"]
    stopifnot(file.exists(directory))
  }
}
########################################################################     Step 2: Set Classes for the fields  ########################################################################

#all NA (if all set toupper then fix list)
os.enum.na <- c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER","pending", "[not available]","[pending]","OTHER: SPECIFY IN NOTES","[NotAvailable]","OTHER (SPECIFY BELOW)","OTHER", "SPECIFY")


#--------------------------------------------------------------------------------
	#GENERAL CLASSES (tcgaId, tcgaDate, upperCharacter, numeric)
#--------------------------------------------------------------------------------
setClass("tcgaId")
setAs("character","tcgaId", function(from) {
  as.character(str_replace_all(from,"-","." )) 
})
#--------------------------------------------------------------------------------
setClass("tcgaDate");
setAs("character","tcgaDate", function(from){
  # If 4 Year Date
  if ((str_length(from)==4) && !is.na(as.integer(from) ) ){
    return(format(as.Date(paste(from, "-1-1", sep=""), "%Y-%m-%d"), "%m/%d/%Y"))
  }
  return(NA)
});
#--------------------------------------------------------------------------------
setClass("upperCharacter");
setAs("character","upperCharacter", function(from){

	from<-toupper(from)	

})
#--------------------------------------------------------------------------------
setClass("tcgaNumeric");
setAs("numeric","tcgaNumeric", function(from){

	
})

#--------------------------------------------------------------------------------
	#BIRTH TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.gender <- c("MALE", "FEMALE")
os.enum.race <- c("WHITE","BLACK OR AFRICAN AMERICAN","ASIAN","AMERICAN INDIAN OR ALASKA NATIVE")
os.enum.ethnicity <- c("HISPANIC OR LATINO","NOT HISPANIC OR LATINO")                      
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
	#DIAGNOSIS TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.disease <- c("BREAST","COLON","BRAIN","RECTUM","PROSTATE","LUNG","BLADDER","HEAD AND NECK","PANCREAS","SARCOMA")
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
	#DRUG TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.route <- c("ORAL","INTRAVENOUS (IV)","INTRATUMORAL","INTRAVESICAL","INTRA-PERITONEAL (IP)|INTRAVENOUS (IV)","SUBCUTANEOUS (SC)","INTRAVENOUS (IV)|ORAL","INTRAMUSCULAR (IM)","INTRAMUSCULAR (IM)|INTRAVENOUS (IV)")                                 
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
	#STATUS TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.vital <- c("DEAD","ALIVE")  
os.enum.status <- c("WITH TUMOR","TUMOR FREE")                               
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
	#PROGRESSION TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.newTumor <- c("LOCOREGIONAL DISEASE","RECURRENCE" ,"PROGRESSION OF DISEASE","METASTATIC","DISTANT METASTASIS","LOCOREGIONAL RECURRENCE","NEW PRIMARY TUMOR","BIOCHEMICAL EVIDENCE OF DISEASE")                                 
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
	#ENCOUNTER TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.encType <- c("[NOT AVAILABLE]","PRE-OPERATIVE","PRE-ADJUVANT THERAPY" ,"POST-ADJUVANT THERAPY","ADJUVANT THERAPY","PREOPERATIVE")                                 
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
	#PROCEDURE TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.side <- c("RIGHT","LEFT", "BILATERAL")    
os.enum.site <- c("RECURRENCE" ,"PROGRESSION OF DISEASE","LOCOREGIONAL DISEASE","METASTATIC","DISTANT METASTASIS","NEW PRIMARY TUMOR", "LOCOREGIONAL RECURRENCE","BIOCHEMICAL EVIDENCE OF DISEASE")                           
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
	#PATHOLOGY TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.prospective_collection <- c("YES","NO") 
os.enum.retrospective_collection <- c("YES","NO")                                
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
	#ABSENT TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.radInd <- c("YES","NO")   
os.enum.drugInd <- c("YES","NO")                              
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
########################################################################     Step 3: Loading Raw Tables & Data Class Columns  ########################################################################

rawTablesRequest <- function(study, table){
	if(table == "DOB" || table == "Diagnosis"){
		return(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"))
	}
	if(table == "Drug"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$drug), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$drug, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$omf), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$omf, sep="/"))))
	}
	if(table == "Radiation"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$rad), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$rad, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$omf), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$omf, sep="/"))))
	}
	if(table == "Status"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),

				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f1), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f1, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f2), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f2, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f3), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f3, sep="/"))))
	}
	if(table == "Encounter"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
		               TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),
		          ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f1), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f1, sep="/"))))
	}
	if(table == "Procedure"){
		return(c(ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$nte), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$nte, sep="/")),
		         ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$omf), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$omf, sep="/")),
		         ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$pt), 
		                NA,
		                paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
		                      TCGAfilename[TCGAfilename$study==study,]$pt, sep="/")),
		         ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f1), 
		                NA,
		                paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
		                      TCGAfilename[TCGAfilename$study==study,]$f1, sep="/")),
		         ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$nte_f1), 
		                NA,
		                paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
		                      TCGAfilename[TCGAfilename$study==study,]$nte_f1, sep="/"))))
	}
	if(table == "Progression"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),

				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f1), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f1, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f2), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f2, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$nte), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$nte, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$nte_f1), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$nte_f1, sep="/"))))
	}
	if(table == "Absent"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),

				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$omf), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$omf, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$nte), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$nte, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f1), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f1, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f2), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f2, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f3), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f3, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$nte_f1), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$nte_f1, sep="/"))))
	}
	if(table == "Tests"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f1), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f1, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f2), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f2, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$f3), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$f3, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$nte), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$nte, sep="/")),
				 ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$nte_f1), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$nte_f1, sep="/"))))
	}
	if(table == "Pathology"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
		               TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),
		         ifelse(is.na(TCGAfilename[TCGAfilename$study==study,]$omf), 
				 		NA,
				 		paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         	TCGAfilename[TCGAfilename$study==study,]$omf, sep="/"))))
	}
}
#--------------------------------------------------------------------------------
loadData <- function(uri, columns){
  
  # Columns :: Create List From Url
  header <- unlist(strsplit(readLines(uri, n=1),'\t'));
  
  # Columns :: Change Names Of Columns
  colNames <- unlist(lapply(header, function(x) {
    for (name in names(columns)){
      if (name==x) return(columns[[name]]$name)
    }
    return(x);
  }));
  
  # Columns :: Specify Data Type For Columns
  colData <- unlist(lapply(header, function(x) {
    for (name in names(columns)){
      if (name==x) return(columns[[name]]$data)
    }
    return("NULL");
  }));
  
  # Table :: Read Table From URL
  read.delim(uri,
				    header=FALSE, 
				    skip=3,
				    dec=".", 
				    strip.white=TRUE,
				    numerals="warn.loss",
				    col.names = colNames,
				    colClasses = colData
				  )
}
#--------------------------------------------------------------------------------
ptNumMapUpdate <- function(df){
	return(data.frame(PatientID=df$PatientID, 
		              PatientNumber=(seq(1:length(df$PatientID)))))
}
#--------------------------------------------------------------------------------
studies <- TCGAfilename$study 
DOB <- TRUE
DIAGNOSIS <- TRUE
DRUG <- TRUE
RAD <- TRUE
STATUS <- TRUE
ENCOUNTER <- TRUE
PROGRESSION <- TRUE
PROCEDURE <- TRUE
PATHOLOGY <- TRUE
ABSENT <- TRUE
TESTS <- TRUE


########################################################################     Step 4: Mappping ########################################################################

#---------------------- DOB Mapping Starts Here      -----------------------
if(DOB){
	DOB.unique.request <- function(study_name){
		  rm(list=ls(pattern="tbl"))
		  uri <- rawTablesRequest(study_name, "DOB") 
		  df  <- loadData(uri, 
		               list(
		                    'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
		                   	'birth_days_to' = list(name = "dob", data = "tcgaNumeric"), 
		                   	'gender' = list(name = "gender", data = "os.class.gender"),
		                   	'ethnicity' = list(name = "ethnicity", data ="os.class.ethnicity"),
		                    'race' = list(name = "race", data = "os.class.race"),
		                    'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
		                ))
} # End of DOB mapping 
#---------------------- Diagnosis Mapping Starts Here   ----------------------
if(DIAGNOSIS){
	Diagnosis.unique.request <- function(study_name){
	  uri <- rawTablesRequest(study_name, "Diagnosis")
	  df  <- loadData(uri, 
	               list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'tumor_tissue_site' = list(name = "disease", data ="os.class.disease"),
					     'tissue_source_site' = list(name = "tissueSourceSiteCode", data = "upperCharacter"),
					     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
					   ))	  
} # End of Diagnosis mapping
#---------------------- Drug Mapping Starts Here   ---------------------------
if(DRUG){
	Drug.unique.request <- function(study_name){
	  	uri <- rawTablesRequest(study_name, "Drug")
	  	rm(list=ls(pattern="tbl"))
		tbl.pt <- loadData(uri[1], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
						   ))
		if(!is.na(uri[2])){
				tbl.drug <- loadData(uri[2], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'pharmaceutical_tx_started_days_to' = list(name = "drugStart", data = "tcgaNumeric"),
							     'pharmaceutical_tx_ended_days_to' = list(name = "drugEnd", data = "tcgaNumeric"),
							     'pharmaceutical_therapy_drug_name' = list(name = "agent", data = "upperCharacter"),
							     'pharmaceutical_therapy_type' = list(name = "therapyType", data = "upperCharacter"),
							     'therapy_regimen' = list(name = "intent", data = "upperCharacter"),
							     'prescribed_dose' = list(name = "dose", data = "upperCharacter"),
							     'total_dose' = list(name = "totalDose", data = "upperCharacter"),
							     'pharmaceutical_tx_dose_units' = list(name = "units", data = "upperCharacter"),
							     'pharmaceutical_tx_total_dose_units' = list(name = "totalDoseUnits", data = "upperCharacter"),
							     'route_of_administration' = list(name = "route", data = "os.class.route"),
							     'pharma_adjuvant_cycles_count' = list(name = "cycle", data = "upperCharacter")
							   ))
			}
		
		if(!is.na(uri[3])){
				tbl.omf <- loadData(uri[3], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'drug_name' = list(name = "agent", data = "upperCharacter"),
							     'days_to_drug_therapy_start' = list(name = "drugStart", data = "tcgaNumeric"),
							     'malignancy_type' = list(name = "intent", data = "upperCharacter")
							   ))
			}
			    # reorganize three tbls 
	    tbl.f <- data.frame()
	    if(exists("tbl.drug")){
	    	tbl.f <- rbind.fill(tbl.f, tbl.drug)
	    }
	    if(exists("tbl.omf")){
	    	tbl.f <- rbind.fill(tbl.f, tbl.omf)
	    }
	    if(nrow(tbl.f) == 0){
	    	return ("Drug data is empty.")
	    }else{
	    	data.Chemo <- merge(tbl.drug, tbl.pt, by = "PatientID", all.x = T)
		    data.Chemo$start <- rep(NA,nrow(data.Chemo))
		    data.Chemo$end <- rep(NA,nrow(data.Chemo))
		  	
		  	df <- data.Chemo
		  	unique.drugStart <- unique(df$drugStart)
		  	unique.drugEnd <- unique(df$drugEnd)
			unique.therapyType <- unique(df$therapyType)
			unique.intent <- unique(df$intent)
			unique.dose <- unique(df$dose)
			unique.units <- unique(df$units)
			unique.totalDose <- unique(df$totalDose)
			unique.totalDoseUnits <- unique(df$totalDoseUnits)
			unique.route <- unique(df$route)
			unique.cycle <- unique(df$cycle)
		  	result = list(unique.drugStart=unique.drugStart, 
						  unique.drugEnd=unique.drugEnd, 
		  				  unique.therapyType=unique.therapyType, 
		  				  unique.intent=unique.intent,
		  				  unique.dose=unique.dose,
		  				  unique.units=unique.units,
		  				  unique.totalDose=unique.totalDose,
		  				  unique.totalDoseUnits=unique.totalDoseUnits,
		  				  unique.route=unique.route,
		  				  unique.cycle=unique.cycle)	   
} # End of Drug mapping
#---------------------- Radiation Mapping Starts Here   ----------------------
if(RAD){
	Rad.unique.request <- function(study_name){
	  	uri <- rawTablesRequest(study_name, "Radiation")
	  	rm(list=ls(pattern="tbl"))
				tbl.pt <- loadData(uri[1], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
						   ))
		if(!is.na(uri[2])){
				tbl.rad <- loadData(uri[2], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'radiation_therapy_started_days_to' = list(name = "radStart", data = "tcgaNumeric"),
							     'radiation_therapy_ended_days_to' = list(name = "radEnd", data = "tcgaNumeric"),
							     'radiation_therapy_type' = list(name = "radType", data = "upperCharacter"),
							     'radiation_type_other' = list(name = "radTypeOther", data = "upperCharacter"),
							     'therapy_regimen' = list(name = "intent", data = "upperCharacter"),
							     'radiation_therapy_site' = list(name = "target", data = "upperCharacter"),
							     'radiation_total_dose' = list(name = "totalDose", data = "upperCharacter"),
							     'radiation_adjuvant_units' = list(name = "totalDoseUnits", data = "upperCharacter"),
							     'radiation_adjuvant_fractions_total' = list(name = "numFractions", data = "upperCharacter")
							   ))
		}
		if(!is.na(uri[3])){
				tbl.omf <- loadData(uri[3], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'radiation_tx_extent' = list(name = "target", data = "upperCharacter"),
							     'rad_tx_to_site_of_primary_tumor' = list(name = "targetAddition", data = "upperCharacter"),
							     'days_to_radiation_therapy_start' = list(name = "radStart", data = "tcgaNumeric")
							   ))
		}	
} # End of Radition Mapping
#---------------------- Status Mapping Starts Here      --------------------
if(STATUS){
	Status.unique.request <- function(study_name){
	  	uri <- rawTablesRequest(study_name, "Status")
		rm(list=ls(pattern="tbl"))
		tbl.pt <- loadData(uri[1], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
						     'vital_status' = list(name = "vital", data = "os.class.vital"),
						     'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
						     'last_contact_days_to' = list(name = "lastContact", data = "tcgaNumeric"),
						     'death_days_to' = list(name = "deathDate", data = "tcgaNumeric")

						   ))
		if(!is.na(uri[2])){
			tbl.f1 <- loadData(uri[2], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'vital_status' = list(name = "vital", data = "os.class.vital"),
						     'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
						     'last_contact_days_to' = list(name = "lastContact", data = "tcgaNumeric"),
						     'death_days_to' = list(name = "deathDate", data = "tcgaNumeric")
						   ))
		}
		

		if(!is.na(uri[3])) {
			tbl.f2 <- loadData(uri[3], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'vital_status' = list(name = "vital", data = "os.class.vital"),
						     'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
						     'last_contact_days_to' = list(name = "lastContact", data = "tcgaNumeric"),
						     'death_days_to' = list(name = "deathDate", data = "tcgaNumeric")
						   ))
		}
		if(!is.na(uri[4])) {
			tbl.f3 <- loadData(uri[4], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'vital_status' = list(name = "vital", data = "os.class.vital"),
						     'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
						     'last_contact_days_to' = list(name = "lastContact", data = "tcgaNumeric"),
						     'death_days_to' = list(name = "deathDate", data = "tcgaNumeric")
						   ))
		}		
} # End of Status Mapping
#---------------------- Progression Mapping Starts Here   ----------------------
if(PROGRESSION){
	Progression.unique.request <- function(study_name){
	  	uri <- rawTablesRequest(study_name, "Progression")
	  	rm(list=ls(pattern="tbl"))
	  	tbl.pt <- loadData(uri[1], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
						   ))
	  	if(!is.na(uri[2])){
	  		tbl.f1 <- loadData(uri[2], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "tcgaNumeric"),
						     'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
						     'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor")
						   ))
	  	}
		if(!is.na(uri[3])){
			tbl.f2 <- loadData(uri[3], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "tcgaNumeric"),
						     'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
						     'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor")
						   ))
		}
		if(!is.na(uri[4])){
			tbl.nte <- loadData(uri[4], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "tcgaNumeric"),
							     'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
							     'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor")
							   ))
		}
		if(!is.na(uri[5])){
			tbl.nte_f1 <- loadData(uri[5], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "tcgaNumeric"),
						     'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
						     'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor")
						   ))
		}	
} # End of Progression Mappping
#---------------------- Encounter Mapping Starts Here   ----------------------
if(ENCOUNTER){ 
  # brca, hnsc, prad DO NOT HAVE ENCOUNTER RECORDS!
  Encounter.unique.request <- function(study_name){   
	    uri <- rawTablesRequest(study_name, "Encounter")
	    #(tbl.pt 'encType','karnofsky_score','ECOG only in gbm,lgg,luad,lusc)
	    tbl.pt <- loadData(uri[1],  
	                       list(
	                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                         'performance_status_timing' = list(name = "encType", data = "os.class.encType"),
	                         'karnofsky_score'= list(name = "KPS", data = "tcgaNumeric"),
	                         'ecog_score' = list(name = "ECOG", data = "tcgaNumeric"),
	                         #coad/read only
	                         'height_cm_at_diagnosis' = list(name = "height", data = "tcgaNumeric"),
	                         'weight_kg_at_diagnosis' = list(name = "weight", data = "tcgaNumeric"),
	                         #lung only
	                         'fev1_fvc_ratio_prebroncholiator'= list(name = "prefev1.ratio", data = "tcgaNumeric"),
	                         'fev1_percent_ref_prebroncholiator'= list(name = "prefev1.percent", data = "tcgaNumeric"),
	                         'fev1_fvc_ratio_postbroncholiator'= list(name = "postfev1.ratio", data = "tcgaNumeric"),
	                         'fev1_percent_ref_postbroncholiator'= list(name = "postfev1.percent", data = "tcgaNumeric"),
	                         'carbon_monoxide_diffusion_dlco'= list(name = "carbon.monoxide.diffusion", data = "tcgaNumeric")
	                       ))
	    #(tbl.f1'encType','karnofsky_score','ECOG only in gbm,lgg,luad,lusc)
	    tbl.f1 <- loadData(uri[2], 
	                       list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                            'performance_status_timing' = list(name = "encType", data = "os.class.encType"),
	                            'karnofsky_score'= list(name = "KPS", data = "tcgaNumeric"),
	                            'ecog_score' = list(name = "ECOG", data = "tcgaNumeric")
	                       ))
	                              
  #----------------------     Encounter functions End Here      --------------------------
} # End of Encounter Mapping
#----------------------   Procedure functions Start Here   ----------------------
if(PROCEDURE){
  	Procedure.unique.request <- function(study_name){
	    uri <- rawTablesRequest(study_name, "Procedure")
	    rm(list=ls(pattern="tbl"))
	    tbl.nte <- loadData(uri[1],
	                       list(
	                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                         'new_tumor_event_surgery_days_to_loco' = list(name = "date_locoregional", data = "tcgaNumeric"), 
	                         'new_tumor_event_surgery_days_to_met'= list(name = "date_metastatic", data = "tcgaNumeric"), 
	                         'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), 
	                         'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date", data = "tcgaNumeric"), 
	                         'new_neoplasm_event_type'  = list(name = "site", data = "upperCharacter"), 
	                         'new_tumor_event_type'  = list(name = "site", data = "upperCharacter") 
	                         'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") 
	                        ))
	    tbl.omf <- loadData(uri[2],
	                       list(
	                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                         'days_to_surgical_resection' = list(name = "date", data = "tcgaNumeric"), 
	                         'other_malignancy_laterality' = list(name = "side", data = "os.class.side"), 
	                         'surgery_type' = list(name = "surgery_name", data = "upperCharacter")  
	                        ))
	    tbl.pt <- loadData(uri[3], 
	                         list(
	                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                           'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
	                           'laterality'  = list(name = "side", data = "upperCharacter"), 
	                           'tumor_site' = list(name = "site", data = "upperCharacter"),  
	                           'supratentorial_localization'= list(name = "site", data = "upperCharacter"), 
	                           'surgical_procedure_first'= list(name = "surgery_name", data = "upperCharacter"), 
	                           'first_surgical_procedure_other'= list(name = "surgery_name", data = "upperCharacter") 
	                        ))
	    tbl.f1 <- loadData(uri[4], 
	                         list(
	                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                           'new_tumor_event_surgery_days_to_loco' = list(name = "date_locoregional", data = "tcgaNumeric"), 
	                           'new_tumor_event_surgery_days_to_met'= list(name = "date_metastatic", data = "tcgaNumeric"), 
	                           'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter") 
	                        ))
	 	tbl.f2 <- loadData(uri[5], 
	                         list(
	                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                           'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter") 
	                        ))
	    
	    if(!is.na(uri[6])) {
	      tbl.nte_f1 <- loadData(uri[5], 
	                         list(
	                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                           'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), 
	                           'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date", data = "numeric"), 
	                           'new_neoplasm_event_type'  = list(name = "site", data = "upperCharacter"), 
	                           'new_tumor_event_type'  = list(name = "site", data = "upperCharacter"), 
	                           'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") 
	                         ))
	    }		
}  # End of Procedure Mapping
#----------------------   Pathology functions Start Here   ----------------------
if(PATHOLOGY){
  Pathology.unique.request <- function(study_name){
		uri <- rawTablesRequest(study_name, "Pathology")
		rm(list=ls(pattern="tbl"))
		tbl.pt <- loadData(uri[1], 
		       list(
		         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
		         'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"), 
		         'days_to_initial_pathologic_diagnosis'  = list(name = "date", data = "tcgaNumeric"), #date
		         'tumor_tissue_site' = list(name = "pathDisease", data = "upperCharacter"),  
		         'histological_type'= list(name = "pathHistology", data = "upperCharacter"), 
		         'prospective_collection'= list(name = "prospective_collection", data = "os.class.prospective_collection"),
		         'retrospective_collection'= list(name = "retrospective_collection", data = "os.class.retrospective_collection"), 
		         'method_initial_path_dx' = list(name = "pathMethod", data = "upperCharacter"),
		         'ajcc_tumor_pathologic_pt' = list(name = "T.Stage", data = "upperCharacter"),
		         'ajcc_nodes_pathologic_pn' = list(name = "N.Stage", data = "upperCharacter"),
		         'ajcc_metastasis_pathologic_pm' = list(name = "M.Stage", data = "upperCharacter"),
		         'ajcc_pathologic_tumor_stage'= list(name = "S.Stage", data = "upperCharacter"),
		         'ajcc_staging_edition' = list(name = "staging.System", data = "upperCharacter"),
		         'tumor_grade' = list(name = "grade", data = "upperCharacter")
		          ))
		tbl.omf <- loadData(uri[2], 
		       list(
		         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
		         'other_malignancy_anatomic_site' = list(name = "pathDisease", data = "upperCharacter"), 
		         'days_to_other_malignancy_dx' = list(name = "date_other_malignancy", data = "tcgaNumeric"), #date
		         'other_malignancy_histological_type' = list(name = "pathHistology", data = "upperCharacter"),
		         'other_malignancy_histological_type_text' = list(name = "pathHistology", data = "upperCharacter")
		          ))
} # End of Pathology Mapping
#----------------------   Absent functions Start Here   -------------------------
if(ABSENT){
	Absent.unique.request <- function(study_name){
		uri <- rawTablesRequest(study_name, "Absent")
	  	rm(list=ls(pattern="tbl"))
	  	tbl.pt <- loadData(uri[1], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
						   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter")
						   ))
	    if(!is.na(uri[2])){
			tbl.omf <- loadData(uri[2], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_other_malignancy_dx' = list(name = "omfdx", data = "tcgaNumeric"),
						     'radiation_tx_indicator' = list(name = "radInd", data = "os.class.radInd"),
						     'drug_tx_indicator' = list(name = "drugInd", data = "os.class.drugInd")
						   ))
	    }
	    if(!is.na(uri[3])){
			tbl.nte <- loadData(uri[3], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_new_tumor_event_after_initial_treatment' = list(name = "omfdx", data = "tcgaNumeric"),
						     'new_tumor_event_dx_days_to'  = list(name = "omfdx", data = "tcgaNumeric"),
						     'additional_radiation_therapy' = list(name = "radInd", data = "os.class.radInd"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "os.class.radInd"),
						     'additional_pharmaceutical_therapy' = list(name = "drugInd", data = "os.class.drugInd"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "os.class.drugInd")
						   ))
	    }
	    if(!is.na(uri[4])){
			tbl.f1 <- loadData(uri[4], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "tcgaNumeric"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "os.class.radInd"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "os.class.drugInd")
						   ))
	    }
	    if(!is.na(uri[5])){
	    	tbl.f2 <- loadData(uri[5], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "tcgaNumeric"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "os.class.radInd"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
						   ))
	    }
	    if(!is.na(uri[6])){
	    	tbl.f3 <- loadData(uri[6], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "tcgaNumeric"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
						   ))
	    }
	    if(!is.na(uri[7])){
	    	tbl.nte_f1 <- loadData(uri[7], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_new_tumor_event_after_initial_treatment' = list(name = "omfdx", data = "tcgaNumeric"),
						     'new_tumor_event_dx_days_to'  = list(name = "omfdx", data = "tcgaNumeric"),
						     'additional_radiation_therapy' = list(name = "radInd", data = "upperCharacter"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
						     'additional_pharmaceutical_therapy' = list(name = "drugInd", data = "upperCharacter"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
						   ))
	    }
} # End of Absent Native Mapping
#----------------------   Tests functions Start Here   --------------------------
if(TESTS){
	Tests.unique.request <- function(study_name){
		uri <- rawTablesRequest(study_name, "Tests")
	  	rm(list=ls(pattern="tbl"))
	  	tbl.pt <- loadData(uri[1], 
			               list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
						   	 'days_to_psa_most_recent' = list(name = "psaDate", data = "tcgaNumeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "tcgaNumeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "tcgaNumeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "tcgaNumeric"),
						   	 'idh1_mutation_test_method' =  list(name = "idh1Method", data = "upperCharacter"),
						   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
						   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
						   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
						   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
						   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
						   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
						   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
						   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
						   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
						   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
						   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
						   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
						   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
						   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
						   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
						   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
						   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
						   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
						   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
						   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
						   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
						   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
						   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
						   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
						   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
						   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
						   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
						   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
						   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
						   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
						   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
						   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
						   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
						   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
						   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
						   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
						   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
						   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
						   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
						   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
						   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
						   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
						   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
						   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
						   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
						   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
						   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
						   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
						   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
						   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
						   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
						   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
						   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
						   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
						   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
						   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
						   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
						   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
						   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
						   ))
	  	if(!is.na(uri[2])){
	  		tbl.f1 <- loadData(uri[2], 
			               list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "tcgaNumeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "tcgaNumeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "tcgaNumeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "tcgaNumeric"),
						   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
						   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
						   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
						   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
						   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
						   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
						   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
						   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
						   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
						   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
						   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
						   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
						   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
						   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
						   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
						   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
						   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
						   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
						   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
						   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
						   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
						   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
						   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
						   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
						   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
						   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
						   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
						   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
						   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
						   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
						   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
						   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
						   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
						   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
						   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
						   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
						   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
						   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
						   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
						   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
						   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
						   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
						   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
						   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
						   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
						   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
						   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
						   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
						   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
						   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
						   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
						   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
						   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
						   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
						   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
						   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
						   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
						   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
						   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
						   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
						   ))
	  	}
	  	if(!is.na(uri[3])){
	  		tbl.f2 <- loadData(uri[3], 
			               list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "tcgaNumeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "tcgaNumeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "tcgaNumeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "tcgaNumeric"),
						   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
						   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
						   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
						   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
						   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
						   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
						   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
						   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
						   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
						   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
						   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
						   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
						   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
						   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
						   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
						   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
						   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
						   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
						   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
						   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
						   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
						   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
						   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
						   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
						   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
						   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
						   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
						   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
						   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
						   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
						   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
						   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
						   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
						   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
						   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
						   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
						   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
						   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
						   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
						   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
						   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
						   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
						   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
						   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
						   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
						   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
						   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
						   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
						   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
						   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
						   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
						   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
						   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
						   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
						   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
						   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
						   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
						   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
						   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
						   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
						   ))
	  	}
	  	if(!is.na(uri[4])){
	  		tbl.f3 <- loadData(uri[4], 
			               list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "tcgaNumeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "tcgaNumeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "tcgaNumeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "tcgaNumeric"),
						   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
						   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
						   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
						   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
						   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
						   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
						   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
						   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
						   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
						   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
						   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
						   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
						   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
						   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
						   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
						   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
						   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
						   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
						   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
						   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
						   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
						   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
						   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
						   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
						   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
						   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
						   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
						   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
						   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
						   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
						   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
						   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
						   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
						   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
						   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
						   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
						   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
						   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
						   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
						   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
						   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
						   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
						   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
						   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
						   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
						   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
						   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
						   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
						   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
						   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
						   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
						   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
						   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
						   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
						   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
						   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
						   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
						   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
						   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
						   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
						   ))
	  	}
	  	if(!is.na(uri[5])){
	  		tbl.nte <- loadData(uri[5], 
			               list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "tcgaNumeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "tcgaNumeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "tcgaNumeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "tcgaNumeric"),
						   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
						   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
						   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
						   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
						   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
						   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
						   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
						   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
						   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharater"),
						   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
						   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
						   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
						   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
						   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
						   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
						   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
						   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
						   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
						   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
						   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
						   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
						   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
						   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
						   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
						   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
						   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
						   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
						   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
						   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
						   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
						   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
						   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
						   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
						   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
						   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
						   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
						   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
						   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
						   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
						   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
						   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
						   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
						   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
						   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
						   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
						   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
						   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
						   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
						   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
						   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
						   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
						   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
						   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
						   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
						   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
						   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
						   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
						   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
						   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
						   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
						   ))
	  	}
	  	if(!is.na(uri[6])){
	  		tbl.nte_f1 <- loadData(uri[6], 
			               list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "tcgaNumeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "tcgaNumeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "tcgaNumeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "tcgaNumeric"),
						   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
						   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
						   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
						   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
						   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
						   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
						   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
						   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
						   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
						   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
						   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
						   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
						   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
						   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
						   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
						   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
						   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
						   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
						   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
						   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
						   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
						   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
						   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
						   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
						   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
						   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
						   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
						   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
						   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
						   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
						   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
						   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
						   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
						   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
						   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
						   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
						   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
						   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
						   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
						   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
						   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
						   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
						   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
						   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
						   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
						   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
						   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
						   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
						   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
						   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
						   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
						   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
						   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
						   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
						   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
						   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
						   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
						   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
						   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
						   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
						   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
						   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
						   ))
	  	}
} # End of Test Mapping
################################################     Step 5: Save cleaned Mapped results to disk   ###########################################

#OLD SCRIPT
create.DOB.records <- function(study_name, ptID){
	uri <- rawTablesRequest(study_name, "DOB")
	data.DOB <- loadData(uri, 
	             list(
				    'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
				    'birth_days_to' = list(name = "dob", data = "upperCharacter"),
				    'gender' = list(name = "gender", data = "upperCharacter"),
				    'ethnicity' = list(name = "ethnicity", data ="upperCharacter"),
				    'race' = list(name = "race", data = "upperCharacter"),
				    'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
				  ))
	data.DOB$date <- rep(NA, nrow(data.DOB))
	data.DOB <- DOB.mapping.dob(data.DOB)
	data.DOB <- DOB.mapping.dob.Calculation(data.DOB)
	data.DOB <- DOB.mapping.gender(data.DOB)
    data.DOB <- DOB.mapping.ethnicity(data.DOB)
    data.DOB <- DOB.mapping.race(data.DOB)
    ptNumMap <- ptNumMapUpdate(data.DOB)
    result = list()
    if(missing(ptID)){
    	result <- apply(data.DOB, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "date")
    				gender = getElement(x, "gender")
    				race = getElement(x, "race")
    				ethnicity = getElement(x, "ethnicity")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Birth", 
    				 			Fields=list(date=date, gender=gender, race=race, ethnicity=ethnicity)))	
    				})
    	print(c(study_name, dim(data.DOB), length(result)))
    	return(result)
	}else{
		print(ptID)
		subSet.data.DOB <- subset(data.DOB, PatientID==ptID)
		result <- apply(subSet.data.DOB, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "date")
    				gender = getElement(x, "gender")
    				race = getElement(x, "race")
    				ethnicity = getElement(x, "ethnicity")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Birth", 
    				 			Fields=list(date=date, gender=gender, race=race, ethnicity=ethnicity)))	
    				})
		 print(result)
	}	
}
#--------------------------------------------------------------------------------------------------------------------------
create.Diagnosis.records <- function(study_name, ptID){
	uri <- rawTablesRequest(study_name, "Diagnosis")
	data.Diagnosis <- loadData(uri, 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'tumor_tissue_site' = list(name = "disease", data ="upperCharacter"),
					     'tissue_source_site' = list(name = "tissueSourceSiteCode", data = "upperCharacter"),
					     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
					   ))
	data.Diagnosis <- Diagnosis.mapping.disease(data.Diagnosis)
    data.Diagnosis <- Diagnosis.mapping.tissueSourceSiteCode(data.Diagnosis)
    ptNumMap <- ptNumMapUpdate(data.Diagnosis)
    if(missing(ptID)){
    	result <- apply(data.Diagnosis, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "dxyear")
    				disease = getElement(x, "disease")
    				siteCode = getElement(x, "tissueSourceSiteCode")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Diagnosis", 
    				 			Fields=list(date=date, disease=disease, siteCode=siteCode)))
    				})
		print(c(study_name, dim(data.Diagnosis), length(result)))
		return(result)
    }else{
    	print(ptID)
		subSet.data.Diagnosis <- subset(data.Diagnosis, PatientID==ptID)
		result <- apply(subSet.data.Diagnosis, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "dxyear")
    				disease = getElement(x, "disease")
    				siteCode = getElement(x, "tissueSourceSiteCode")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Diagnosis", 
    				 			Fields=list(date=date, disease=disease, siteCode=siteCode)))
    				})
		print(result)
    }    
}
#--------------------------------------------------------------------------------------------------------------------------
create.Chemo.records <- function(study_name,  ptID){
		uri <- rawTablesRequest(study_name, "Drug")
	  	rm(list=ls(pattern="tbl"))
		tbl.pt <- loadData(uri[1], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
						   ))
		if(!is.na(uri[2])){
				tbl.drug <- loadData(uri[2], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'pharmaceutical_tx_started_days_to' = list(name = "drugStart", data = "upperCharacter"),
							     'pharmaceutical_tx_ended_days_to' = list(name = "drugEnd", data = "upperCharacter"),
							     'pharmaceutical_therapy_drug_name' = list(name = "agent", data = "upperCharacter"),
							     'pharmaceutical_therapy_type' = list(name = "therapyType", data = "upperCharacter"),
							     'therapy_regimen' = list(name = "intent", data = "upperCharacter"),
							     'prescribed_dose' = list(name = "dose", data = "upperCharacter"),
							     'total_dose' = list(name = "totalDose", data = "upperCharacter"),
							     'pharmaceutical_tx_dose_units' = list(name = "units", data = "upperCharacter"),
							     'pharmaceutical_tx_total_dose_units' = list(name = "totalDoseUnits", data = "upperCharacter"),
							     'route_of_administration' = list(name = "route", data = "upperCharacter"),
							     'pharma_adjuvant_cycles_count' = list(name = "cycle", data = "upperCharacter")
							   ))
			}
		if(!is.na(uri[3])){
				tbl.omf <- loadData(uri[3], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'drug_name' = list(name = "agent", data = "upperCharacter"),
							     'days_to_drug_therapy_start' = list(name = "drugStart", data = "character"),
							     'malignancy_type' = list(name = "intent", data = "upperCharacter")
							   ))
			}
	    # reorganize three tbls 
	    tbl.f <- data.frame()
	    if(exists("tbl.drug")){
	    	tbl.f <- rbind.fill(tbl.f, tbl.drug)
	    }
	    if(exists("tbl.omf")){
	    	tbl.f <- rbind.fill(tbl.f, tbl.omf)
	    }
	    if(nrow(tbl.f) == 0){
	    	return ("Drug data is empty.")
	    }else{
	    	data.Chemo <- merge(tbl.f, tbl.pt, by = "PatientID", all.x = T)
		    data.Chemo$start <- rep(NA,nrow(data.Chemo))
		    data.Chemo$end <- rep(NA,nrow(data.Chemo))
		    # mapping
		    data.Chemo <- Drug.mapping.date(data.Chemo)
			data.Chemo <- Drug.mapping.agent(data.Chemo)
		    data.Chemo <- Drug.mapping.therapyType(data.Chemo)
		    data.Chemo <- Drug.mapping.intent(data.Chemo)
		    data.Chemo <- Drug.mapping.dose(data.Chemo)
		    data.Chemo <- Drug.mapping.units(data.Chemo)
		    data.Chemo <- Drug.mapping.totalDose(data.Chemo)
		    data.Chemo <- Drug.mapping.totalDoseUnits(data.Chemo)
		    data.Chemo <- Drug.mapping.route(data.Chemo)
		    data.Chemo <- Drug.mapping.cycle(data.Chemo)
		    if(length(which(duplicated(data.Chemo))) > 0){
		    	data.Chemo <- data.Chemo[-which(duplicated(data.Chemo)), ]
		    }
		    data.Chemo <- Drug.mapping.filling(data.Chemo)
		    # result
		    ptNumMap <- ptNumMapUpdate(tbl.pt)
		    if(missing(ptID)){
		    	result <- apply(data.Chemo, 1, function(x){
		    				PatientID = getElement(x, "PatientID")
		    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
		    				date = c(getElement(x, "start"), getElement(x, "end"))
		    				agent = getElement(x, "agent")
		    				therapyType = getElement(x, "therapyType")
		    				intent = getElement(x, "intent")
		    				dose = getElement(x, "dose")
		    				units = getElement(x, "units")
		    				totalDose = getElement(x, "totalDose")
		    				totalDoseUnits = getElement(x, "totalDoseUnits")
		    				route = getElement(x, "route")
		    				cycle  = getElement(x, "cycle")		
		    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Drug", 
		    				 			Fields=list(date=date, agent=agent, therapyType=therapyType, intent=intent,
		    				 				        dose=dose, units=units, totalDose=totalDose, totalDoseUnits=totalDoseUnits,
		    				 				        route=route,cycle=cycle)))
		    				})
				print(c(study_name, dim(data.Chemo), length(result)))
				return(result)
		    }else{
		    	print(ptID)
				subSet.data.Chemo <- subset(data.Chemo, PatientID==ptID)
				result <- apply(subSet.data.Chemo, 1, function(x){
		    				PatientID = getElement(x, "PatientID")
		    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
		    				date = c(getElement(x, "start"), getElement(x, "end"))
		    				agent = getElement(x, "agent")
		    				therapyType = getElement(x, "therapyType")
		    				intent = getElement(x, "intent")
		    				dose = getElement(x, "dose")
		    				units = getElement(x, "units")
		    				totalDose = getElement(x, "totalDose")
		    				totalDoseUnits = getElement(x, "totalDoseUnits")
		    				route = getElement(x, "route")
		    				cycle  = getElement(x, "cycle")		
		    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Drug", 
		    				 			Fields=list(date=date, agent=agent, therapyType=therapyType, intent=intent,
		    				 				        dose=dose, units=units, totalDose=totalDose, totalDoseUnits=totalDoseUnits,
		    				 				        route=route,cycle=cycle)))
		    				})
				print(result)
		    }	    
    	}
}
#--------------------------------------------------------------------------------------------------------------------------
create.Rad.records <- function(study_name,  ptID){
		uri <- rawTablesRequest(study_name, "Radiation")
	  	rm(list=ls(pattern="tbl"))
		tbl.pt <- loadData(uri[1], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
						   ))
		if(!is.na(uri[2])){
				tbl.rad <- loadData(uri[2], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'radiation_therapy_started_days_to' = list(name = "radStart", data = "character"),
							     'radiation_therapy_ended_days_to' = list(name = "radEnd", data = "character"),
							     'radiation_therapy_type' = list(name = "radType", data = "upperCharacter"),
							     'radiation_type_other' = list(name = "radTypeOther", data = "upperCharacter"),
							     'therapy_regimen' = list(name = "intent", data = "upperCharacter"),
							     'radiation_therapy_site' = list(name = "target", data = "upperCharacter"),
							     'radiation_total_dose' = list(name = "totalDose", data = "upperCharacter"),
							     'radiation_adjuvant_units' = list(name = "totalDoseUnits", data = "upperCharacter"),
							     'radiation_adjuvant_fractions_total' = list(name = "numFractions", data = "upperCharacter")
							   ))
		}
		if(!is.na(uri[3])){
				tbl.omf <- loadData(uri[3], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'radiation_tx_extent' = list(name = "target", data = "upperCharacter"),
							     'rad_tx_to_site_of_primary_tumor' = list(name = "targetAddition", data = "upperCharacter"),
							     'days_to_radiation_therapy_start' = list(name = "radStart", data = "character")
							   ))
		}
		 tbl.f <- data.frame()
	    if(exists("tbl.rad")){
	    	tbl.f <- rbind.fill(tbl.f, tbl.rad)
	    }
	    if(exists("tbl.omf")){
	    	tbl.f <- rbind.fill(tbl.f, tbl.omf)
	    }
	    if(nrow(tbl.f) == 0){
	    	return ("Radiation data is empty.")
	    }else{
	    # reorganize three tbls 
	    	data.Rad <- merge(tbl.f, tbl.pt, by = "PatientID", all.x = T)
		    data.Rad$start <- rep(NA,nrow(data.Rad))
		    data.Rad$end <- rep(NA,nrow(data.Rad))
		    # mapping
		    data.Rad  <- Rad.mapping.date(data.Rad)
		    data.Rad  <- Rad.mapping.radType(data.Rad)
		    data.Rad  <- Rad.mapping.intent(data.Rad)
		    data.Rad  <- Rad.mapping.target(data.Rad)
		    data.Rad  <- Rad.mapping.totalDose(data.Rad)
		    data.Rad  <- Rad.mapping.totalDoseUnits(data.Rad)
		    data.Rad  <- Rad.mapping.numFractions(data.Rad)
		    data.Rad  <- Rad.mapping.filling(data.Rad)

		    # result
		    ptNumMap <- ptNumMapUpdate(tbl.pt)
		    if(missing(ptID)){
		    	result <- apply(data.Rad, 1, function(x){
		    				PatientID = getElement(x, "PatientID")
		    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
		    				date = c(getElement(x, "start"), getElement(x, "end"))
		    				radType = getElement(x, "radType")
		    				intent = getElement(x, "intent")
	    					target = getElement(x, "target")
		    				totalDose = getElement(x, "totalDose")
		    				totalDoseUnits = getElement(x, "totalDoseUnits")
		    				numFractions = getElement(x, "numFractions")
		    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Radiation", 
		    				 			Fields=list(date=date, therapyType=radType, intent=intent, 
		    				 						target=target, totalDose=totalDose, totalDoseUnits=totalDoseUnits, 
		    				 						numFractions=numFractions)))
		    				})
				print(c(study_name, dim(data.Rad), length(result)))
				return(result)
		    }else{
		    	print(ptID)
				subSet.data.Rad <- subset(data.Rad, PatientID==ptID)
				result <- apply(subSet.data.Rad, 1, function(x){
		    				PatientID = getElement(x, "PatientID")
		    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
		    				date = c(getElement(x, "start"), getElement(x, "end"))
		    				radType = getElement(x, "radType")
		    				intent = getElement(x, "intent")
		    				target = getElement(x, "target")
		    				totalDose = getElement(x, "totalDose")
		    				totalDoseUnits = getElement(x, "totalDoseUnits")
		    				numFractions = getElement(x, "numFractions")
		    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Radiation", 
		    				 			Fields=list(date=date, therapyType=radType, intent=intent, 
		    				 						target=target, totalDose=totalDose, totalDoseUnits=totalDoseUnits, 
		    				 						numFractions=numFractions)))
		    				})
				print(result)
		    }	
		}
}
#--------------------------------------------------------------------------------------------------------------------------
create.Status.records <- function(study_name,  ptID){
	uri <- rawTablesRequest(study_name, "Status")
	rm(list=ls(pattern="tbl"))
	tbl.pt <- loadData(uri[1], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
					     'vital_status' = list(name = "vital", data = "upperCharacter"),
					     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
					     'last_contact_days_to' = list(name = "lastContact", data = "upperCharacter"),
					     'death_days_to' = list(name = "deathDate", data = "upperCharacter")

					   ))
	if(!is.na(uri[2])){
		tbl.f1 <- loadData(uri[2], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'vital_status' = list(name = "vital", data = "upperCharacter"),
					     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
					     'last_contact_days_to' = list(name = "lastContact", data = "upperCharacter"),
					     'death_days_to' = list(name = "deathDate", data = "upperCharacter")
					   ))
	}
	if(!is.na(uri[3])) {
		tbl.f2 <- loadData(uri[3], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'vital_status' = list(name = "vital", data = "upperCharacter"),
					     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
					     'last_contact_days_to' = list(name = "lastContact", data = "upperCharacter"),
					     'death_days_to' = list(name = "deathDate", data = "upperCharacter")
					   ))
	}
	if(!is.na(uri[4])) {
		tbl.f3 <- loadData(uri[4], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'vital_status' = list(name = "vital", data = "upperCharacter"),
					     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
					     'last_contact_days_to' = list(name = "lastContact", data = "upperCharacter"),
					     'death_days_to' = list(name = "deathDate", data = "upperCharacter")
					   ))
	}
	tbl.f <- tbl.pt[,-grep("dxyear", colnames(tbl.pt))]
	if(exists("tbl.f1")){
		tbl.f <- rbind.fill(tbl.f, tbl.f1)
	}
	if(exists("tbl.f2")) tbl.f <- rbind.fill(tbl.f, tbl.f2)
	if(exists("tbl.f3")) tbl.f <- rbind.fill(tbl.f, tbl.f3)

	data.Status <- tbl.f
	data.Status$date <- rep(NA, nrow(data.Status))
	data.Status <- Status.mapping.date(data.Status)
	data.Status <- Status.mapping.date.Check(data.Status)
	data.Status <- Status.mapping.vital(data.Status)
	data.Status <- Status.mapping.tumorStatus(data.Status)
	DX <- tbl.pt[,c("PatientID", "dxyear")]	
	data.Status <- merge(data.Status, DX)
	data.Status <- Status.mapping.filling(data.Status)
	if(length(which(duplicated(data.Status))) > 0){
		data.Status <- data.Status[-which(duplicated(data.Status)),]
	}
	#more computation to determine the most recent contacted/death date, then find the matching vital & tumorStatus
	#need group function by patient and determin.
	#recentDatetbl <- aggregate(date ~ PatientID, data.Status, function(x){max(x)})
	

 	recentTbl <- c()

 	for(i in 1:nrow(tbl.pt)){
 		tmpDF <- subset(data.Status, PatientID == tbl.pt$PatientID[i])
 		tmpDF <- tmpDF[order(as.integer(tmpDF$date), decreasing=TRUE, na.last=TRUE),]
 		if(nrow(tmpDF[which(tmpDF$date == tmpDF[1,]$date), ]) > 1){
 			tmpDup <- tmpDF[which(tmpDF$date == tmpDF[1,]$date), ]
 			tmpDF[1, "vital"] 		= 	ifelse(any(duplicated(tmpDup[,"vital"])), tmpDup[1, "vital"], paste(tmpDup[, "vital"]))
 			tmpDF[1, "tumorStatus"] = 	ifelse(any(duplicated(tmpDup[,"tumorStatus"])), tmpDup[1, "tumorStatus"], paste(tmpDup[, "tumorStatus"], collapse=";"))
		}
		recentTbl <- rbind.fill(recentTbl, tmpDF[1,])
 	}

 	data.Status <- Status.mapping.date.Calculation(recentTbl)
 	data.Status[order(data.Status$PatientID, data.Status$date, data.Status$vital, data.Status$tumorStatus),] -> data.Status

 	ptNumMap <- ptNumMapUpdate(tbl.pt)
 	if(missing(ptID)){
 		result <- apply(data.Status, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "date")
    				vital = getElement(x, "vital")
    				tumorStatus = getElement(x, "tumorStatus")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Status", 
    				 			Fields=list(date=date, status=vital, tumorStatus=tumorStatus)))
    				})
		print(c(study_name, dim(data.Status), length(result)))
		return(result)
 	}else{
 		print(ptID)
		subSet.data.Status <- subset(data.Status, PatientID==ptID)
 		result <- apply(subSet.data.Status, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "date")
    				vital = getElement(x, "vital")
    				tumorStatus = getElement(x, "tumorStatus")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Status", 
    				 			Fields=list(date=date, status=vital, tumorStatus=tumorStatus)))
    				})
		print(result)
 	}
}
#--------------------------------------------------------------------------------------------------------------------------
create.Progression.records <- function(study_name,  ptID){
	uri <- rawTablesRequest(study_name, "Progression")
  	rm(list=ls(pattern="tbl"))
  	tbl.pt <- loadData(uri[1], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
					   ))
  	if(!is.na(uri[2])){
  		tbl.f1 <- loadData(uri[2], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "upperCharacter"),
					     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
					     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
					   ))
  	}
	if(!is.na(uri[3])){
		tbl.f2 <- loadData(uri[3], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "upperCharacter"),
					     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
					     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
					   ))
	}
	if(!is.na(uri[4])){
		tbl.nte <- loadData(uri[4], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "upperCharacter"),
						     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
						     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
						   ))
	}
	if(!is.na(uri[5])){
		tbl.nte_f1 <- loadData(uri[5], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "upperCharacter"),
					     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
					     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
					   ))
	}

	tbl.f <- data.frame()
	if(exists("tbl.nte")) tbl.f <- rbind.fill(tbl.f, tbl.nte)
	if(exists("tbl.f1")) tbl.f <- rbind.fill(tbl.f, tbl.f1)
	if(exists("tbl.f2")) tbl.f <- rbind.fill(tbl.f, tbl.f2)
	if(exists("tbl.nte_f1")) tbl.f <- rbind.fill(tbl.f, tbl.nte_f1)
	if(nrow(tbl.f) == 0 ){
		return("Progression data is empty.")
	}else{
		data.Progression <- Progression.mapping.newTumor(tbl.f)
		data.Progression <- Progression.mapping.newTumorDate(data.Progression)
		if(length(which(duplicated(data.Progression))) > 0)
			data.Progression <- data.Progression[-which(duplicated(data.Progression)), ]

		rmPos <- c()
		for(i in 1:nrow(data.Progression)){
			if(all(is.na(data.Progression[i, c("newTumorDate", "newTumor")]))){
				rmPos <- c(rmPos, i)
			}
		}
	    if(length(rmPos) > 0 ){
	    	data.Progression <- data.Progression[-rmPos, ]
	    }

		data.Progression <- merge(data.Progression, tbl.pt)
		
		data.Progression$date <- rep(NA, nrow(data.Progression))
		data.Progression$Number <- rep(NA, nrow(data.Progression))
		data.Progression <- Progression.mapping.newTumorNaRM(data.Progression)

		uniquePt.Progression <- unique(data.Progression$PatientID)

		df <- data.frame()
		for(i in 1:length(uniquePt.Progression)){
			tmpDF <- subset(data.Progression, PatientID == uniquePt.Progression[i])
			tmpDF <- tmpDF[order(as.integer(tmpDF$newTumorDate), na.last=T, decreasing=F), ]
			tmpDF$Number <- seq(1:nrow(tmpDF))
			tmpDF$Number[which(is.na(tmpDF$newTumorDate))] <- NA
			df <- rbind.fill(tmpDF, df)
		}
	    
		data.Progression <- df
		data.Progression <- Progression.mapping.date.Calculation(data.Progression)

	 	ptNumMap <- ptNumMapUpdate(tbl.pt)
	 	if(missing(ptID)){
	 		result <- apply(data.Progression, 1, function(x){
	    				PatientID = getElement(x, "PatientID")
	    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
	    				date = getElement(x, "date")
	    				event = getElement(x, "newTumor")
	    				number = as.numeric(getElement(x, "Number"))
	    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Progression", 
	    				 			Fields=list(date=date, event=event, number=number)))
	    				})
			print(c(study_name, dim(data.Progression), length(result)))
			return(result)
	 	}else{
	 		print(ptID)
	 		subSet.data.Progression <- subset(data.Progression, PatientID==ptID)
	 		result <- apply(subSet.data.Progression, 1, function(x){
	    				PatientID = getElement(x, "PatientID")
	    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
	    				date = getElement(x, "date")
	    				event = getElement(x, "newTumor")
	    				number = as.numeric(getElement(x, "Number"))
	    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Progression", 
	    				 			Fields=list(date=date, event=event, number=number)))
	    				})
			print(result)
	 	}	   
	}	
}
#--------------------------------------------------------------------------------------------------------------------------
create.Absent.records <- function(study_name,  ptID){
	uri <- rawTablesRequest(study_name, "Absent")
  	rm(list=ls(pattern="tbl"))
  	tbl.pt <- loadData(uri[1], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
					   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter")
					   ))
    if(!is.na(uri[2])){
		tbl.omf <- loadData(uri[2], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'days_to_other_malignancy_dx' = list(name = "omfdx", data = "upperCharacter"),
					     'radiation_tx_indicator' = list(name = "radInd", data = "upperCharacter"),
					     'drug_tx_indicator' = list(name = "drugInd", data = "upperCharacter")
					   ))
    }
    if(!is.na(uri[3])){
		tbl.nte <- loadData(uri[3], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'days_to_new_tumor_event_after_initial_treatment' = list(name = "omfdx", data = "upperCharacter"),
					     'new_tumor_event_dx_days_to'  = list(name = "omfdx", data = "upperCharacter"),
					     'additional_radiation_therapy' = list(name = "radInd", data = "upperCharacter"),
					     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
					     'additional_pharmaceutical_therapy' = list(name = "drugInd", data = "upperCharacter"),
					     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
					   ))
    }
    if(!is.na(uri[4])){
		tbl.f1 <- loadData(uri[4], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "upperCharacter"),
					     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
					     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
					   ))
    }
    if(!is.na(uri[5])){
    	tbl.f2 <- loadData(uri[5], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "upperCharacter"),
					     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
					     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
					   ))
    }
    if(!is.na(uri[6])){
    	tbl.f3 <- loadData(uri[6], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "upperCharacter"),
					     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
					     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
					   ))
    }
    if(!is.na(uri[7])){
    	tbl.nte_f1 <- loadData(uri[7], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'days_to_new_tumor_event_after_initial_treatment' = list(name = "omfdx", data = "upperCharacter"),
					     'new_tumor_event_dx_days_to'  = list(name = "omfdx", data = "upperCharacter"),
					     'additional_radiation_therapy' = list(name = "radInd", data = "upperCharacter"),
					     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
					     'additional_pharmaceutical_therapy' = list(name = "drugInd", data = "upperCharacter"),
					     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
					   ))
    } 	
   
    tbl.f <- data.frame()
    if("pulInd" %in% colnames(tbl.f)) tbl.f <- rbind.fill(tbl.f, tbl.f[,c("PatientID", "pulInd")])
    if(exists("tbl.omf")) tbl.f <- rbind.fill(tbl.f, tbl.omf)   
    if(exists("tbl.nte")) tbl.f <- rbind.fill(tbl.f, tbl.nte)
    if(exists("tbl.f1")) tbl.f <- rbind.fill(tbl.f, tbl.f1)
    if(exists("tbl.f2")) tbl.f <- rbind.fill(tbl.f, tbl.f2)
    if(exists("tbl.f3")) tbl.f <- rbind.fill(tbl.f, tbl.f3)
    if(exists("tbl.nte_f1")) tbl.f <- rbind.fill(tbl.f, tbl.nte_f1)
    if(nrow(tbl.f) == 0){
    	return("Absent data is empty.")
    }else{
    	tbl.f <- merge(tbl.pt[,c("PatientID", "dxyear"),], tbl.f)
	    tbl.f$date = rep(NA, nrow(tbl.f))
	    data.Absent <- Absent.mapping.omfdx(tbl.f)
	    data.Absent <- Absent.mapping.omfdx.Calculation(data.Absent)
	    data.Absent <- Absent.mapping.radInd(data.Absent)
	    data.Absent <- Absent.mapping.drugInd(data.Absent)
	    if(!("pulInd" %in% colnames(data.Absent)))
	    	data.Absent$pulInd <- rep(NA, nrow(data.Absent))
	    data.Absent <- Absent.mapping.pulInd(data.Absent)
	    if(length(which(duplicated(data.Absent))) > 0)
		    data.Absent <- data.Absent[-which(duplicated(data.Absent)),]
	    rmPos <- c()
		for(i in 1:nrow(data.Absent)){
			if(all(is.na(data.Absent[i, c("pulInd", "drugInd", "radInd")]))){
				rmPos <- c(rmPos, i)
			}
		}
	    if(length(rmPos) > 0 ){
	    	data.Absent <- data.Absent[-rmPos, ]
	    }

	    data.Absent <- data.Absent[order(data.Absent$PatientID, data.Absent$date, data.Absent$omfdx, data.Absent$drugInd, data.Absent$radInd), ]
	 	ptNumMap <- ptNumMapUpdate(tbl.pt)
	 	if(missing(ptID)){
	 		result <- apply(data.Absent, 1, function(x){
	    				PatientID = getElement(x, "PatientID")
	    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
	    				date = getElement(x, "date")
	    				rad = getElement(x, "radInd")
	    				drug = getElement(x, "drugInd")
	    				if("pulInd" %in% names(x)){
	    					pul = getElement(x, "pulInd")
    					}else{
    						pul = NA
    					}	
	    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Absent", 
	    				 			Fields=list(date=date, Radiation=rad, Drug=drug, Pulmonary=pul)))
	    				})
			print(c(study_name, dim(data.Absent), length(result)))
			return(result)
	 	}else{
	 		print(ptID)
	 		subSet.data.Absent <- subset(data.Absent, PatientID==ptID)
	 		result <- apply(subSet.data.Absent, 1, function(x){
	    				PatientID = getElement(x, "PatientID")
	    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
	    				date = getElement(x, "date")
	    				rad = getElement(x, "radInd")
	    				drug = getElement(x, "drugInd")
	    				if("pulInd" %in% names(x)){
	    					pul = getElement(x, "pulInd")
    					}else{
    						pul = NA
    					}	
	    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Absent", 
	    				 			Fields=list(date=date, Radiation=rad, Drug=drug, Pulmonary=pul)))
	    				})
			print(result)
	 	}	   
    }
}
#--------------------------------------------------------------------------------------------------------------------------
create.Tests.records <- function(study_name,  ptID){
	uri <- rawTablesRequest(study_name, "Tests")
	rm(list=ls(pattern="tbl"))
  	tbl.pt <- loadData(uri[1], 
		               list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
					   	 'days_to_psa_most_recent' = list(name = "psaDate", data = "upperCharacter"),
					   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "upperCharacter"),
					   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "upperCharacter"),
					   	 'days_to_mri' = list(name = "mriDate", data = "upperCharacter"),
					   	 'idh1_mutation_test_method' =  list(name = "idh1Method", data = "upperCharacter"),
					   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
					   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
					   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
					   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
					   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
					   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
					   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
					   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
					   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
					   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
					   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
					   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
					   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
					   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
					   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
					   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
					   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
					   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
					   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
					   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
					   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
					   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
					   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
					   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
					   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
					   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
					   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
					   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
					   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
					   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
					   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
					   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
					   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
					   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
					   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
					   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
					   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
					   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
					   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
					   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
					   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
					   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
					   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
					   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
					   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
					   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
					   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
					   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
					   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
					   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
					   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
					   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
					   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
					   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
					   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
					   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
					   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
					   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
					   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
					   ))
  	if(!is.na(uri[2])){
  		tbl.f1 <- loadData(uri[2], 
		               list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'days_to_psa_most_recent' = list(name = "psaDate", data = "upperCharacter"),
					   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "upperCharacter"),
					   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "upperCharacter"),
					   	 'days_to_mri' = list(name = "mriDate", data = "upperCharacter"),
					   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
					   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
					   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
					   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
					   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
					   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
					   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
					   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
					   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
					   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
					   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
					   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
					   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
					   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
					   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
					   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
					   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
					   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
					   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
					   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
					   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
					   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
					   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
					   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
					   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
					   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
					   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
					   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
					   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
					   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
					   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
					   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
					   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
					   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
					   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
					   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
					   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
					   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
					   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
					   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
					   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
					   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
					   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
					   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
					   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
					   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
					   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
					   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
					   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
					   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
					   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
					   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
					   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
					   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
					   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
					   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
					   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
					   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
					   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
					   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
					   ))
  	}
  	if(!is.na(uri[3])){
  		tbl.f2 <- loadData(uri[3], 
		               list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'days_to_psa_most_recent' = list(name = "psaDate", data = "upperCharacter"),
					   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "upperCharacter"),
					   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "upperCharacter"),
					   	 'days_to_mri' = list(name = "mriDate", data = "upperCharacter"),
					   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
					   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
					   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
					   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
					   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
					   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
					   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
					   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
					   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
					   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
					   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
					   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
					   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
					   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
					   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
					   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
					   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
					   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
					   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
					   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
					   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
					   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
					   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
					   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
					   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
					   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
					   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
					   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
					   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
					   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
					   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
					   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
					   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
					   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
					   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
					   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
					   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
					   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
					   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
					   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
					   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
					   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
					   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
					   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
					   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
					   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
					   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
					   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
					   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
					   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
					   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
					   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
					   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
					   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
					   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
					   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
					   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
					   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
					   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
					   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
					   ))
  	}
  	if(!is.na(uri[4])){
  		tbl.f3 <- loadData(uri[4], 
		               list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'days_to_psa_most_recent' = list(name = "psaDate", data = "upperCharacter"),
					   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "upperCharacter"),
					   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "upperCharacter"),
					   	 'days_to_mri' = list(name = "mriDate", data = "upperCharacter"),
					   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
					   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
					   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
					   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
					   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
					   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
					   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
					   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
					   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
					   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
					   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
					   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
					   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
					   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
					   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
					   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
					   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
					   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
					   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
					   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
					   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
					   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
					   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
					   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
					   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
					   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
					   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
					   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
					   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
					   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
					   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
					   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
					   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
					   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
					   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
					   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
					   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
					   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
					   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
					   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
					   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
					   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
					   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
					   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
					   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
					   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
					   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
					   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
					   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
					   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
					   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
					   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
					   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
					   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
					   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
					   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
					   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
					   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
					   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
					   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
					   ))
  	}
  	if(!is.na(uri[5])){
  		tbl.nte <- loadData(uri[5], 
		               list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'days_to_psa_most_recent' = list(name = "psaDate", data = "upperCharacter"),
					   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "upperCharacter"),
					   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "upperCharacter"),
					   	 'days_to_mri' = list(name = "mriDate", data = "upperCharacter"),
					   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
					   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
					   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
					   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
					   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
					   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
					   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
					   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
					   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharater"),
					   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
					   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
					   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
					   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
					   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
					   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
					   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
					   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
					   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
					   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
					   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
					   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
					   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
					   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
					   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
					   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
					   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
					   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
					   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
					   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
					   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
					   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
					   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
					   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
					   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
					   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
					   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
					   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
					   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
					   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
					   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
					   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
					   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
					   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
					   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
					   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
					   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
					   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
					   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
					   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
					   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
					   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
					   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
					   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
					   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
					   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
					   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
					   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
					   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
					   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
					   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
					   ))
  	}
  	if(!is.na(uri[6])){
  		tbl.nte_f1 <- loadData(uri[6], 
		               list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'days_to_psa_most_recent' = list(name = "psaDate", data = "upperCharacter"),
					   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "upperCharacter"),
					   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "upperCharacter"),
					   	 'days_to_mri' = list(name = "mriDate", data = "upperCharacter"),
					   	 'idh1_mutation_test_method' = list(name = "idh1Method", data = "upperCharacter"),
					   	 'idh1_mutation_found' = list(name = "idh1Found", data = "upperCharacter"),
					   	 'IHC' = list(name = "ihc", data = "upperCharacter"),
					   	 'kras_mutation_found' = list(name = "krasInd", data = "upperCharacter"),
					   	 'kras_mutation_identified_type' = list(name = "krasType", data = "upperCharacter"),
					   	 'egfr_mutation_status' = list(name = "egfrStatus", data = "upperCharacter"),
					   	 'egfr_mutation_identified_type' = list(name = "egfrType", data = "upperCharacter"),
					   	 'egfr_amplification_status' = list(name = "egfrAmp", data = "upperCharacter"),
					   	 'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharacter"),
					   	 'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "upperCharacter"),
					   	 'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "upperCharacter"),
					   	 'kras_mutation_codon' = list(name = "krasCodon", data = "upperCharacter"),
					   	 'braf_gene_analysis_indicator' = list(name = "brafInd", data = "upperCharacter"),
					   	 'braf_gene_analysis_result' = list(name = "brafRes", data = "upperCharacter"),
					   	 'cea_level_pretreatment' = list(name = "ceaTx", data = "upperCharacter"),
					   	 'loci_tested_count' = list(name = "lociTestCount", data = "upperCharacter"),
					   	 'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "upperCharacter"),
					   	 'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "upperCharacter"),
					   	 'hpv_status_p16' = list(name = "hpvP16", data = "upperCharacter"),
					   	 'hpv_status_ish' = list(name = "hpvIsh", data = "upperCharacter"),
					   	 'psa_most_recent_results' = list(name = "psaRes", data = "upperCharacter"),
					   	 'bone_scan_results' = list(name = "boneScaneRes", data = "upperCharacter"),
					   	 'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "upperCharacter"),
					   	 'mri_results' = list(name = "mriRes", data = "upperCharacter"),
					   	 'her2_copy_number' = list(name = "her2CNV", data = "upperCharacter"),
					   	 'her2_fish_method' = list(name = "her2FishMethod", data = "upperCharacter"),
					   	 'her2_fish_status' = list(name = "her2FishStatus", data = "upperCharacter"),
					   	 'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "upperCharacter"),
					   	 'her2_ihc_score' = list(name = "her2IhcScore", data = "upperCharacter"),
					   	 'her2_positivity_method_text' = list(name = "her2PosMethod", data = "upperCharacter"),
					   	 'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "upperCharacter"),
					   	 'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "upperCharacter"),
					   	 'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "upperCharacter"),
					   	 'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "upperCharacter"),
					   	 'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "upperCharacter"),
					   	 'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "upperCharacter"),
					   	 'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "upperCharacter"),
					   	 'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "upperCharacter"),
					   	 'nte_her2_status' = list(name = "nteHer2Status", data = "upperCharacter"),
					   	 'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "upperCharacter"),
					   	 'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "upperCharacter"),
					   	 'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "upperCharacter"),
					   	 'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "upperCharacter"),
					   	 'nte_er_status' = list(name = "nteEstroStatus", data = "upperCharacter"),
					   	 'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "upperCharacter"),
					   	 'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "upperCharacter"),
					   	 'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "upperCharacter"),
					   	 'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "upperCharacter"),
					   	 'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "upperCharacter"),
					   	 'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "upperCharacter"),
					   	 'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "upperCharacter"), 
					   	 'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "upperCharacter"),
					   	 'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "upperCharacter"),
					   	 'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "upperCharacter"),
					   	 'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "upperCharacter"),
					   	 'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "upperCharacter"),
					   	 'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "upperCharacter"),
					   	 'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "upperCharacter"),
					   	 'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "upperCharacter"),
					   	 'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "upperCharacter"),
					   	 'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "upperCharacter"),
					   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "upperCharacter")
					   ))
  	}

  	tbl <- list()
  	if(ncol(tbl.pt) > 2){
  		tbl <- tbl.pt[,-match("dxyear", colnames(tbl.pt))]
  	}
  	if(exists("tbl.f1") && ncol(tbl.f1) > 1) tbl <- rbind.fill(tbl, tbl.f1)
  	if(exists("tbl.f2") && ncol(tbl.f2) > 1) tbl <- rbind.fill(tbl, tbl.f2)
  	if(exists("tbl.f3") && ncol(tbl.f3) > 1) tbl <- rbind.fill(tbl, tbl.f3)
  	if(exists("tbl.nte") && ncol(tbl.nte) > 1) tbl <- rbind.fill(tbl, tbl.nte)
  	if(exists("tbl.nte_f1") && ncol(tbl.nte_f1) > 1) tbl <- rbind.fill(tbl, tbl.nte_f1)
    if(length(tbl) == 0){
    	return(print(c(study_name, ncol(tbl), "Result is empty.")))
    }else{
	    tbl <- apply(tbl, 2, Tests.mapping.testResult)
	    tbl <- as.data.frame(tbl)
	    if(length(grep("Date", colnames(tbl))) > 0){
	    	tbl.dates <- tbl[,colnames(tbl)[grep("Date", colnames(tbl))]]
	    	tbl.result <- tbl[, -grep("Date", colnames(tbl))]
	    }else{
	    	tbl.result <- tbl
	    }

	    if(length(grep("Method", colnames(tbl.result))) > 0){
	    	tbl.methods <- as.data.frame(tbl[, colnames(tbl.result)[grep("Method", colnames(tbl.result))]])
	    	colnames(tbl.methods) <- colnames(tbl.result)[grep("Method", colnames(tbl.result))]
	    	tbl.result <- tbl.result[, -grep("Method", colnames(tbl.result))]
	    }

	    data.Tests <- data.frame()
        for(i in 2:ncol(tbl.result)){
        	tmpTB <- tbl.result[,c(1,i)]
        	tmpTB$Date <- rep(NA, nrow(tmpTB))
        	if(exists("tbl.dates")){
        		tmpTB <- Tests.mapping.testAndDate(tmpTB, tbl.dates)	
        	}else{
        		tmpTB <- Tests.mapping.testAndDate(tmpTB)
        	}
        	
        	if(exists("tbl.methods")){
        		tmpTB <- Tests.mapping.type(tmpTB, tbl.methods)
        	}else{
        		tmpTB <- Tests.mapping.type(tmpTB)	
        	}

        	if(length(which(is.na(tmpTB[,2]))) > 0){
        		tmpTB <- tmpTB[-which(is.na(tmpTB[,2])),]
        	}
        	if(nrow(tmpTB) > 0){
        		tmpTB[,2] <- paste(colnames(tmpTB)[2], tmpTB[,2], sep=":")
        		tmpTB <- tmpTB[,c(1,3,5,4,2)]
        		colnames(tmpTB)[5] <- "Result"
        		data.Tests <- rbind(data.Tests, tmpTB)
        	}
        }
        
	    data.Tests  <- merge(tbl.pt[, c("PatientID", "dxyear")], data.Tests)
	    data.Tests  <- Tests.mapping.date.Calculation(data.Tests)
	    if(length(which(duplicated(data.Tests))) > 0 ){
	    	data.Tests <- data.Tests[-which(duplicated(data.Tests)),]
	    }
	    
	    data.Tests[order(data.Tests$PatientID, data.Tests$Test, data.Tests$Result),] -> data.Tests

	 	ptNumMap <- ptNumMapUpdate(tbl.pt)
	 	if(missing(ptID)){
	 		result <- apply(data.Tests, 1, function(x){
	    				PatientID = getElement(x, "PatientID")
	    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
	    				date = getElement(x, "Date")
	    				type = getElement(x, "Type")
	    				test = getElement(x, "Test")
	    				result = getElement(x, "Result")
	    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Tests", 
	    				 			Fields=list(date=date, Type=type, Test=test, Result=result)))
	    				})
			print(c(study_name, dim(data.Tests), length(result)))
			return(result)
	 	}else{
	 		print(ptID)
	 		subSet.data.Tests <- subset(data.Tests, PatientID==ptID)
	 		result <- apply(subSet.data.Tests, 1, function(x){
	    				PatientID = getElement(x, "PatientID")
	    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
	    				date = getElement(x, "Date")
	    				type = getElement(x, "Type")
	    				test = getElement(x, "Test")
	    				result = getElement(x, "Result")
	    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Tests", 
	    				 			Fields=list(date=date, Type=type, Test=test, Result=result)))
	    				})
			return(result)	 
		 }	   
    } 	
}
#--------------------------------------------------------------------------------------------------------------------------
create.Encounter.records <- function(study_name,  ptID){
  uri <- rawTablesRequest(study_name, "Encounter")
  rm(list=ls(pattern="tbl"))
  #(tbl.pt 'encType','karnofsky_score','ECOG only in gbm,lgg,luad,lusc)
  tbl.pt <- loadData(uri[1],  
                     list(
                       'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                       'performance_status_timing' = list(name = "encType", data = "upperCharacter"),
                       'karnofsky_score'= list(name = "KPS", data = "upperCharacter"),
                       'ecog_score' = list(name = "ECOG", data = "upperCharacter"),
                       #coad/read only
                       'height_cm_at_diagnosis' = list(name = "height", data = "upperCharacter"),
                       'weight_kg_at_diagnosis' = list(name = "weight", data = "upperCharacter"),
                       #lung only
                       'fev1_fvc_ratio_prebroncholiator'= list(name = "prefev1.ratio", data = "upperCharacter"),
                       'fev1_percent_ref_prebroncholiator'= list(name = "prefev1.percent", data = "upperCharacter"),
                       'fev1_fvc_ratio_postbroncholiator'= list(name = "postfev1.ratio", data = "upperCharacter"),
                       'fev1_percent_ref_postbroncholiator'= list(name = "postfev1.percent", data = "upperCharacter"),
                       'carbon_monoxide_diffusion_dlco'= list(name = "carbon.monoxide.diffusion", data = "upperCharacter")
                     ))
  #(tbl.f1'encType','karnofsky_score','ECOG only in gbm,lgg,luad,lusc)
  tbl.f1 <- loadData(uri[2], 
                     list(
                       'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                       'performance_status_timing' = list(name = "encType", data = "upperCharacter"),
                       'karnofsky_score'= list(name = "KPS", data = "upperCharacter"),
                       'ecog_score' = list(name = "ECOG", data = "upperCharacter")
                             ))
  
  #brca, prad, hnsc do not have any Encounter records!
  data.Encounter <- rbind.fill(tbl.pt, tbl.f1)
  
  if(ncol(data.Encounter) == 1){
	  return(print(c(study_name, ncol(data.Encounter), "Result is empty")))
  }else{
	  #create columns for column that are not captured
	  encounterColNames <- c("PatientID", "encType", "KPS", "ECOG", "height", "weight", "prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion")
	  
	  m <- matrix(nrow=nrow(data.Encounter), ncol=length(which(!(encounterColNames) %in% colnames(data.Encounter))))
	  df <- as.data.frame(m)
	  colnames(df) <- encounterColNames[(which(!(encounterColNames) %in% colnames(data.Encounter)))]
	  data.Encounter<- cbind(data.Encounter, df) 
	  

	  # mapping
	  data.Encounter <- Encounter.mapping.encType(data.Encounter)
	  data.Encounter <- Encounter.mapping.KPS(data.Encounter)
	  data.Encounter <- Encounter.mapping.ECOG(data.Encounter)
	  data.Encounter <- Encounter.mapping.height(data.Encounter)
	  data.Encounter <- Encounter.mapping.weight(data.Encounter)
	  data.Encounter <- Encounter.mapping.prefev1.ratio(data.Encounter)
	  data.Encounter <- Encounter.mapping.prefev1.percent(data.Encounter)
	  data.Encounter <- Encounter.mapping.postfev1.ratio(data.Encounter)
	  data.Encounter <- Encounter.mapping.postfev1.percent(data.Encounter)
	  data.Encounter <- Encounter.mapping.carbon.monoxide.diffusion(data.Encounter)
	  
	  
	  # result
	  ptNumMap <- ptNumMapUpdate(tbl.pt)
	  if(missing(ptID)){
		  result <- apply(data.Encounter, 1, function(x){
			    PatientID = getElement(x, "PatientID")
			    PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
			    encType = getElement(x, "encType")
			    KPS = getElement(x, "KPS")
			    ECOG = getElement(x, "ECOG")
			    height = getElement(x, "height")
			    weight = getElement(x, "weight")
			    prefev1.ratio = getElement(x, "prefev1.ratio")
			    prefev1.percent = getElement(x, "prefev1.percent")
			    postfev1.ratio = getElement(x, "postfev1.ratio")
			    postfev1.percent  = getElement(x, "postfev1.percent")
			    carbon.monoxide.diffusion  = getElement(x, "carbon.monoxide.diffusion")
			    return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Encounter", 
			                Fields=list(encType=encType, KPS=KPS, ECOG=ECOG, height=height,
			                            weight=weight, prefev1.ratio=prefev1.ratio, prefev1.percent=prefev1.percent, postfev1.ratio=postfev1.ratio,
			                            postfev1.percent=postfev1.percent,carbon.monoxide.diffusion=carbon.monoxide.diffusion)))
			    })
	  			print(c(study_name, dim(data.Encounter), length(result)))
	  			return(result)
	  }else{
			print(ptID)
				subSet.data.Encounter <- subset(data.Encounter, PatientID==ptID)
				result <- apply(subSet.data.Encounter, 1, function(x){
						PatientID = getElement(x, "PatientID")
					    PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
					    encType = getElement(x, "encType")
					    KPS = getElement(x, "KPS")
					    ECOG = getElement(x, "ECOG")
					    height = getElement(x, "height")
					    weight = getElement(x, "weight")
					    prefev1.ratio = getElement(x, "prefev1.ratio")
					    prefev1.percent = getElement(x, "prefev1.percent")
					    postfev1.ratio = getElement(x, "postfev1.ratio")
					    postfev1.percent  = getElement(x, "postfev1.percent")
					    carbon.monoxide.diffusion  = getElement(x, "carbon.monoxide.diffusion")
					    return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Encounter", 
					                Fields=list(encType=encType, KPS=KPS, ECOG=ECOG, height=height,
					                            weight=weight, prefev1.ratio=prefev1.ratio, prefev1.percent=prefev1.percent, postfev1.ratio=postfev1.ratio,
					                            postfev1.percent=postfev1.percent,carbon.monoxide.diffusion=carbon.monoxide.diffusion)))
					    })
			print(result)
	  }
  }	
}
#--------------------------------------------------------------------------------------------------------------------------
create.Procedure.records <- function(study_name,  ptID){
    uri <- rawTablesRequest(study_name, "Procedure")
    rm(list=ls(pattern="tbl"))
    tbl.nte <- loadData(uri[1],
	                       list(
	                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                         'new_tumor_event_surgery_days_to_loco' = list(name = "date_locoregional", data = "upperCharacter"), #(only in lgg,luad,lusc)
	                         'new_tumor_event_surgery_days_to_met'= list(name = "date_metastatic", data = "upperCharacter"), #(only in lgg,luad,lusc)
	                         #'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), #(in brca,hnsc but not being collected...)
	                         'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date", data = "upperCharacter"), #(only in gbm,coad,read)
	                         'new_neoplasm_event_type'  = list(name = "site", data = "upperCharacter"), #(only in gbm, coad, read)
	                         'new_tumor_event_type'  = list(name = "site", data = "upperCharacter") #(only in hnsc, prad, luad, lusc)
	                         #'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") #(gbm,coad,read but not being collected...)
	                        ))
	    tbl.omf <- loadData(uri[2],
	                       list(
	                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                         'days_to_surgical_resection' = list(name = "date", data = "upperCharacter"), #(gbm,lgg,hnsc,brca,prad,luad,lusc,coad,read)
	                         'other_malignancy_laterality' = list(name = "side", data = "upperCharacter"), #(brca)
	                         'surgery_type' = list(name = "surgery_name", data = "upperCharacter") #(gbm,lgg,hnsc,brca,pProcedure,lusc,luad,coad,read) 
	                        ))
	    tbl.pt <- loadData(uri[3], 
	                         list(
	                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                           'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
	                           'laterality'  = list(name = "side", data = "upperCharacter"), #(only in lgg, hnsc, prad)
	                           'tumor_site' = list(name = "site", data = "upperCharacter"),  #(only in lgg)
	                           'supratentorial_localization'= list(name = "site", data = "upperCharacter"), #(only in lgg)
	                           'surgical_procedure_first'= list(name = "surgery_name", data = "upperCharacter"), #only in brca
	                           'first_surgical_procedure_other'= list(name = "surgery_name", data = "upperCharacter") #only in brca
	                        ))
	    tbl.f1 <- loadData(uri[4], 
	                         list(
	                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                           'new_tumor_event_surgery_days_to_loco' = list(name = "date_locoregional", data = "upperCharacter"), #(only in lgg,hnsc,luad,lusc)
	                           'new_tumor_event_surgery_days_to_met'= list(name = "date_metastatic", data = "upperCharacter") #(only in lgg,hnsc,luad,lusc)
	                           #'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter") #(In lgg,luad,lusc but not being collected...)
	                        ))
	 
	  						#f2
	                           #'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                           #'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter") #(only in brca)
	                           
	    if(!is.na(uri[5])) {
	      tbl.nte_f1 <- loadData(uri[5], 
	                         list(
	                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                           #'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), #(used to build hnsc tables but is also a column in brca that is not being collected)
	                           'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date", data = "upperCharacter"), #(only in gbm,hnsc,coad,read)
	                           'new_neoplasm_event_type'  = list(name = "site", data = "upperCharacter"), #(only in gbm, coad, read)
	                           'new_tumor_event_type'  = list(name = "site", data = "upperCharacter") #(only in hnsc, brca)
	                           #'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") #(hnsc)
	                         ))
	    }

    data.Procedure <- data.frame()
	if(ncol(tbl.pt) > 2){
		data.Procedure <- rbind.fill(tbl.pt[, -match("dxyear", colnames(tbl.pt))], data.Procedure)
	}
	if(ncol(tbl.omf) > 1){
		data.Procedure <- rbind.fill(tbl.omf, data.Procedure)
	}
	if(ncol(tbl.nte) > 1){
		data.Procedure <- rbind.fill(tbl.nte, data.Procedure)
	}
	if(ncol(tbl.f1) > 1){
		data.Procedure <- rbind.fill(tbl.f1, data.Procedure)
	}
 	#if(exists("tbl.f2"))  data.Procedure <- rbind.fill(data.Procedure, tbl.f2)
	if(exists("tbl.nte_f1")) data.Procedure <- rbind.fill(data.Procedure, tbl.nte_f1)  
	data.Procedure <- merge(data.Procedure, tbl.pt[, c("PatientID", "dxyear")]) 
	  
    #create columns for column that are not captured
    procedureColNames <- c("date","surgery_name","side","site", "date_locoregional","date_metastatic")
    
    m <- matrix(nrow=nrow(data.Procedure), ncol=length(which(!(procedureColNames) %in% colnames(data.Procedure))))
    df <- as.data.frame(m)
    colnames(df) <- procedureColNames[(which(!(procedureColNames) %in% colnames(data.Procedure)))]
    data.Procedure<- cbind(data.Procedure, df) 
    #colnames(data.Procedure) 

    # mapping
    data.Procedure <- Procedure.mapping.Calculation.date(data.Procedure)
    data.Procedure <- Procedure.mapping.Calculation.date_locoregional(data.Procedure)
    data.Procedure <- Procedure.mapping.Calculation.date_metastatic(data.Procedure)
    data.Procedure <- Procedure.mapping.site(data.Procedure)
    data.Procedure <- Procedure.mapping.surgery_name(data.Procedure)
    data.Procedure <- Procedure.mapping.side(data.Procedure)

    # result
    ptNumMap <- ptNumMapUpdate(tbl.pt)
    if(missing(ptID)){
		    result <- apply(data.Procedure, 1, function(x){
		      			PatientID = getElement(x, "PatientID")
		      			PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
		      			date = getElement(x, "date")
		      			date_locoregional = getElement(x, "date_locoregional")
						date_metastatic = getElement(x, "date_metastatic")
		      			site  = getElement(x, "site")
		      			name  = getElement(x, "surgery_name")
		      			side  = getElement(x, "side")
		      			return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Procedure", 
		                  			Fields=list(date=date,date_locoregional=date_locoregional,date_metastatic=date_metastatic,name=name,site=site,side=side)))
		    })
		    print(c(study_name, dim(data.Procedure), length(result)))
		    return(result)	
		}else{
				print(ptID)
				subSet.data.Procedure <- subset(data.Procedure, PatientID==ptID)
				result <- apply(subSet.data.Procedure, 1, function(x){
						PatientID = getElement(x, "PatientID")
		      			PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
		      			date = getElement(x, "date")	
		      			date_locoregional = getElement(x, "date_locoregional")
						date_metastatic = getElement(x, "date_metastatic")
		      			site  = getElement(x, "site")
		      			name  = getElement(x, "surgery_name")
		      			side  = getElement(x, "side")
		      			return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Procedure", 
		                  			Fields=list(date=date,date_locoregional=date_locoregional,date_metastatic=date_metastatic,name=name,site=site,side=side)))
			    		})
			print(result)
		}
}
#--------------------------------------------------------------------------------------------------------------------------  
create.Pathology.records <- function(study_name,  ptID){
  uri <- rawTablesRequest(study_name, "Pathology")
  rm(list=ls(pattern="tbl"))
  tbl.pt <- loadData(uri[1], 
                     list(
                       'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                       'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"), 
                       'days_to_initial_pathologic_diagnosis'  = list(name = "date", data = "upperCharacter"), 
                       'tumor_tissue_site' = list(name = "pathDisease", data = "upperCharacter"),  
                       'histological_type'= list(name = "pathHistology", data = "upperCharacter"), 
                       'prospective_collection'= list(name = "prospective_collection", data = "upperCharacter"),
                       'retrospective_collection'= list(name = "retrospective_collection", data = "upperCharacter"), 
                       'method_initial_path_dx' = list(name = "pathMethod", data = "upperCharacter"),
                       'ajcc_tumor_pathologic_pt' = list(name = "T.Stage", data = "upperCharacter"),
                       'ajcc_nodes_pathologic_pn' = list(name = "N.Stage", data = "upperCharacter"),
                       'ajcc_metastasis_pathologic_pm' = list(name = "M.Stage", data = "upperCharacter"),
                       'ajcc_pathologic_tumor_stage'= list(name = "S.Stage", data = "upperCharacter"),
                       'ajcc_staging_edition' = list(name = "staging.System", data = "upperCharacter"),
                       'tumor_grade' = list(name = "grade", data = "upperCharacter")
                     ))
  tbl.omf <- loadData(uri[2], 
                      list(
                        'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                        'other_malignancy_anatomic_site' = list(name = "pathDisease", data = "upperCharacter"), 
                        'days_to_other_malignancy_dx' = list(name = "date_other_malignancy", data = "upperCharacter"),
                        'other_malignancy_histological_type' = list(name = "pathHistology", data = "upperCharacter"),
                        'other_malignancy_histological_type_text' = list(name = "pathHistology", data = "upperCharacter")
                      ))
  # reorganize two tbls 
  data.Pathology <- rbind.fill(tbl.pt[,-match("dxyear", colnames(tbl.pt))], tbl.omf)
  data.Pathology <- merge(data.Pathology, tbl.pt[,c("PatientID", "dxyear")])
  if(any(duplicated(data.Pathology))){
    data.Pathology <- data.Pathology[-which(duplicated(data.Pathology)), ]
  }

  #create columns for column that are not captured
  PathologyColNames <- c("pathDisease", "pathHistology", "prospective_collection","retrospective_collection", "pathMethod", "T.Stage", "N.Stage", "M.Stage","S.Stage","staging.System","grade","date","date_other_malignancy")
  m <- matrix(nrow=nrow(data.Pathology), ncol=length(which(!(PathologyColNames) %in% colnames(data.Pathology))))
  df <- as.data.frame(m)
  colnames(df) <- PathologyColNames[(which(!(PathologyColNames) %in% colnames(data.Pathology)))]
  data.Pathology<- cbind(data.Pathology, df) 

  # mapping
  data.Pathology <- Pathology.mapping.pathDisease(data.Pathology)
  data.Pathology <- Pathology.mapping.pathHistology(data.Pathology)
  data.Pathology <- Pathology.mapping.prospective_collection(data.Pathology)
  data.Pathology <- Pathology.mapping.retrospective_collection(data.Pathology)
  data.Pathology <- Pathology.mapping.pathMethod(data.Pathology)
  data.Pathology <- Pathology.mapping.T.Stage(data.Pathology)
  data.Pathology <- Pathology.mapping.N.Stage(data.Pathology)
  data.Pathology <- Pathology.mapping.M.Stage(data.Pathology)
  data.Pathology <- Pathology.mapping.S.Stage(data.Pathology)
  data.Pathology <- Pathology.mapping.staging.System(data.Pathology)
  data.Pathology <- Pathology.mapping.grade(data.Pathology)
  data.Pathology <- Pathology.mapping.Calculation.date(data.Pathology)
  data.Pathology <- Pathology.mapping.Calculation.date_other_malignancy(data.Pathology)
  
  ptNumMap <- ptNumMapUpdate(tbl.pt)
  if(missing(ptID)){
	  	result <- apply(data.Pathology, 1, function(x){
		    PatientID = getElement(x, "PatientID")
		    PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
		    pathDisease = getElement(x, "pathDisease")
		    pathHistology = getElement(x, "pathHistology")
		    prospective_collection = getElement(x, "prospective_collection")
		    retrospective_collection = getElement(x, "retrospective_collection")
		    pathMethod = getElement(x, "pathMethod")
		    T.Stage = getElement(x, "T.Stage")
		    N.Stage = getElement(x, "N.Stage")
		    M.Stage = getElement(x, "M.Stage")
		    S.Stage = getElement(x, "S.Stage")
		    staging.System  = getElement(x, "staging.System")
		    grade  = getElement(x, "grade")
		    date  = getElement(x, "date")
		    date_other_malignancy= getElement(x, "date_other_malignancy")
		    return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Pathology", 
		                Fields=list(pathDisease=pathDisease,
		                            pathHistology=pathHistology,
		                            prospective_collection=prospective_collection,
		                            retrospective_collection = retrospective_collection,
		                            pathMethod=pathMethod,
		                            T.Stage=T.Stage,
		                            N.Stage=N.Stage,
		                            M.Stage=M.Stage,
		                            S.Stage=S.Stage,
		                            staging.System=staging.System,
		                            grade=grade,
		                            date=date,
									date_other_malignancy=date_other_malignancy)))            
		  })
		  #return(result)
		  print(c(study_name, dim(data.Pathology), length(result)))
		  return(result)
		  }else{
		  		print(ptID)
				subSet.data.Pathology <- subset(data.Pathology, PatientID==ptID)
		  		result <- apply(subSet.data.Pathology, 1, function(x){
			PatientID = getElement(x, "PatientID")
		    PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
		    pathDisease = getElement(x, "pathDisease")
		    pathHistology = getElement(x, "pathHistology")
		    prospective_collection = getElement(x, "prospective_collection")
		    retrospective_collection = getElement(x, "retrospective_collection")
		    pathMethod = getElement(x, "pathMethod")
		    T.Stage = getElement(x, "T.Stage")
		    N.Stage = getElement(x, "N.Stage")
		    M.Stage = getElement(x, "M.Stage")
		    S.Stage = getElement(x, "S.Stage")
		    staging.System  = getElement(x, "staging.System")
		    grade  = getElement(x, "grade")
		    date  = getElement(x, "date")
		    date_other_malignancy= getElement(x, "date_other_malignancy")
							    return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Pathology", 
		                Fields=list(pathDisease=pathDisease,
		                            pathHistology=pathHistology,
		                            prospective_collection=prospective_collection,
		                            retrospective_collection = retrospective_collection,
		                            pathMethod=pathMethod,
		                            T.Stage=T.Stage,
		                            N.Stage=N.Stage,
		                            M.Stage=M.Stage,
		                            S.Stage=S.Stage,
		                            staging.System=staging.System,
		                            grade=grade, 
		                            date=date,
		                            date_other_malignancy=date_other_malignancy)))
							  })
				print(result)
	    }  
}
