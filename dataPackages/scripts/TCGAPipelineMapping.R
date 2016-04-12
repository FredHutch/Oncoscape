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

	if(is.numeric(from))
	return(from)
})
#--------------------------------------------------------------------------------
	#BIRTH TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.na <- c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER","pending", "[not available]","[pending]","OTHER: SPECIFY IN NOTES","[NotAvailable]","OTHER (SPECIFY BELOW)","OTHER, SPECIFY")
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
#--------------------------------------------------------------------------------
setClass("os.class.race")
setAs("character", "os.class.race", function(from){

	from<-toupper(from)	
		
		from.na<-which(from %in% os.enum.na)
		from[from.na]<-NA	
		
		if(all (from %in% c(os.enum.race, NA)))
			return(from)	
		stop(setdiff(from,c(os.enum.race, NA)))	
})
#--------------------------------------------------------------------------------
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
os.enum. <- c()                                 
#--------------------------------------------------------------------------------
	#STATUS TABLE CLASSES
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
	#PROGRESSION TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum. <- c()                                 
#--------------------------------------------------------------------------------
	#PROGRESSION TABLE CLASSES
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
	#ENCOUNTER TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum. <- c()                                 
#--------------------------------------------------------------------------------
	#ENCOUNTER TABLE CLASSES
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
	#PROCEDURE TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum. <- c()                                 
#--------------------------------------------------------------------------------
	#PROCEDURE TABLE CLASSES
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
	#PATHOLOGY TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum. <- c()                                 
#--------------------------------------------------------------------------------
	#PATHOLOGY TABLE CLASSES
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
	#ABSENT TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum. <- c()                                 
#--------------------------------------------------------------------------------
	#ABSENT TABLE CLASSES
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
    return(NA);
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
	  uri <- rawTablesRequest(study_name, "DOB") 
	  df  <- loadData(uri, 
	               list(
	                    'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                   	'birth_days_to' = list(name = "dob", data = "numeric"), 
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
							     'pharmaceutical_tx_started_days_to' = list(name = "drugStart", data = "numeric"),
							     'pharmaceutical_tx_ended_days_to' = list(name = "drugEnd", data = "numeric"),
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
							     'days_to_drug_therapy_start' = list(name = "drugStart", data = "numeric"),
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
							     'radiation_therapy_started_days_to' = list(name = "radStart", data = "numeric"),
							     'radiation_therapy_ended_days_to' = list(name = "radEnd", data = "numeric"),
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
							     'days_to_radiation_therapy_start' = list(name = "radStart", data = "numeric")
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
						     'vital_status' = list(name = "vital", data = "upperCharacter"),
						     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
						     'last_contact_days_to' = list(name = "lastContact", data = "numeric"),
						     'death_days_to' = list(name = "deathDate", data = "numeric")

						   ))
		if(!is.na(uri[2])){
			tbl.f1 <- loadData(uri[2], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'vital_status' = list(name = "vital", data = "upperCharacter"),
						     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
						     'last_contact_days_to' = list(name = "lastContact", data = "numeric"),
						     'death_days_to' = list(name = "deathDate", data = "numeric")
						   ))
		}
		

		if(!is.na(uri[3])) {
			tbl.f2 <- loadData(uri[3], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'vital_status' = list(name = "vital", data = "upperCharacter"),
						     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
						     'last_contact_days_to' = list(name = "lastContact", data = "numeric"),
						     'death_days_to' = list(name = "deathDate", data = "numeric")
						   ))
		}
		if(!is.na(uri[4])) {
			tbl.f3 <- loadData(uri[4], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'vital_status' = list(name = "vital", data = "upperCharacter"),
						     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
						     'last_contact_days_to' = list(name = "lastContact", data = "numeric"),
						     'death_days_to' = list(name = "deathDate", data = "numeric")
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
						     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "numeric"),
						     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
						     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
						   ))
	  	}
		if(!is.na(uri[3])){
			tbl.f2 <- loadData(uri[3], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "numeric"),
						     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
						     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
						   ))
		}
		if(!is.na(uri[4])){
			tbl.nte <- loadData(uri[4], 
				              list(
							     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
							     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "numeric"),
							     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
							     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
							   ))
		}
		if(!is.na(uri[5])){
			tbl.nte_f1 <- loadData(uri[5], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "numeric"),
						     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
						     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
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
	                         'performance_status_timing' = list(name = "encType", data = "upperCharacter"),
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
	                            'performance_status_timing' = list(name = "encType", data = "upperCharacter"),
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
	                         'new_tumor_event_surgery_days_to_loco' = list(name = "date_locoregional", data = "numeric"), 
	                         'new_tumor_event_surgery_days_to_met'= list(name = "date_metastatic", data = "numeric"), 
	                         'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), 
	                         'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date", data = "numeric"), 
	                         'new_neoplasm_event_type'  = list(name = "site", data = "upperCharacter"), 
	                         'new_tumor_event_type'  = list(name = "site", data = "upperCharacter") 
	                         'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") 
	                        ))
	    tbl.omf <- loadData(uri[2],
	                       list(
	                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                         'days_to_surgical_resection' = list(name = "date", data = "numeric"), 
	                         'other_malignancy_laterality' = list(name = "side", data = "upperCharacter"), 
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
	                           'new_tumor_event_surgery_days_to_loco' = list(name = "date_locoregional", data = "numeric"), 
	                           'new_tumor_event_surgery_days_to_met'= list(name = "date_metastatic", data = "numeric"), 
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
		         'days_to_initial_pathologic_diagnosis'  = list(name = "date", data = "numeric"), #date
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
		         'days_to_other_malignancy_dx' = list(name = "date_other_malignancy", data = "numeric"), #date
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
						     'days_to_other_malignancy_dx' = list(name = "omfdx", data = "numeric"),
						     'radiation_tx_indicator' = list(name = "radInd", data = "upperCharacter"),
						     'drug_tx_indicator' = list(name = "drugInd", data = "upperCharacter")
						   ))
	    }
	    if(!is.na(uri[3])){
			tbl.nte <- loadData(uri[3], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_new_tumor_event_after_initial_treatment' = list(name = "omfdx", data = "numeric"),
						     'new_tumor_event_dx_days_to'  = list(name = "omfdx", data = "numeric"),
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
						     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "numeric"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
						   ))
	    }
	    if(!is.na(uri[5])){
	    	tbl.f2 <- loadData(uri[5], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "numeric"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
						   ))
	    }
	    if(!is.na(uri[6])){
	    	tbl.f3 <- loadData(uri[6], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "numeric"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "upperCharacter"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "upperCharacter")
						   ))
	    }
	    if(!is.na(uri[7])){
	    	tbl.nte_f1 <- loadData(uri[7], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_new_tumor_event_after_initial_treatment' = list(name = "omfdx", data = "numeric"),
						     'new_tumor_event_dx_days_to'  = list(name = "omfdx", data = "numeric"),
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
						   	 'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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

