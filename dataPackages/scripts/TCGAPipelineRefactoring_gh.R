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

#Reference Table#------------------------------------------------------------------------------------
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
##################################################################################
########################         Refactoring         #############################
##################################################################################

########################   Step 1: Set Classes for the fields    #################
# define factors
os.enum.na <- c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER","pending", "[not available]","[pending]","OTHER: SPECIFY IN NOTES","[NotAvailable]")
os.enum.gender <- c("MALE", "FEMALE")
os.enum.race <- c("WHITE","BLACK OR AFRICAN AMERICAN","ASIAN","AMERICAN INDIAN OR ALASKA NATIVE")
os.enum.ethnicity <- c("HISPANIC OR LATINO","NOT HISPANIC OR LATINO")                      
#--------------------------------------------------------------------------------
#set classes

setClass("os.class.gender")
setAs("factor", "os.class.gender", function(from){

	toupper(from)	
	
	if(from %in% os.enum.gender){ 
		return(from)
	} else if (from %in% os.enum.na){
		 return(NA)
	} else {
		print("UKNOWN VALUE IN:os.class.gender")
	}

})

#--------------------------------------------------------------------------------
setClass("os.class.race")
setAs("factor", "os.class.race", function(from){
	
	toupper(from)	
	
	if(from %in% os.enum.race){ 
		return(from)
	} else if (from %in% os.enum.na){
		 return(NA)
	} else {
		print("UKNOWN VALUE IN:os.class.race")
	}

})
#--------------------------------------------------------------------------------

setClass("os.class.ethnicity")
setAs("factor", "os.class.ethnicity", function(from){
	
	toupper(from)	
	
	if(from %in% os.enum.ethnicity){ 
		return(from)
	} else if (from %in% os.enum.na){
		 return(NA)
	} else {
		print("UKNOWN VALUE IN:os.class.ethnicity")
	}

})
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
setClass("upperCharacter")
setAs("character","upperCharacter", function(from){
	from <- from.toupper()
	if (from in os.enum.na) return (NA)
  	from
})
#--------------------------------------------------------------------------------

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
###################     Step 2: Get Unique Values & Mapping  ####################
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
#----------------------     DOB Mapping Starts Here      -----------------------
if(DOB){
	DOB.unique.request <- function(study_name){
	  uri <- rawTablesRequest(study_name, "DOB") 
	  df  <- loadData(uri, 
	               list(
	                    'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                   	#'birth_days_to' = list(name = "dob", data = "integer"), 
	                    'gender' = list(name = "gender", data = "os.class.gender"),
	                    'ethnicity' = list(name = "ethnicity", data ="os.class.ethnicity"),
	                    'race' = list(name = "race", data = "os.class.race")
	                    #'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
	                ))

} # End of DOB mapping 
#----------------------   Diagnosis functions Start Here   ----------------------
if(DIAGNOSIS){
	Diagnosis.unique.request <- function(study_name){
	  uri <- rawTablesRequest(study_name, "Diagnosis")
	  df  <- loadData(uri, 
	               list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'tumor_tissue_site' = list(name = "disease", data ="upperCharacter"),
					     'tissue_source_site' = list(name = "tissueSourceSiteCode", data = "upperCharacter"),
					     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
					   ))
	  unique.disease <- unique(df$disease)
	  unique.tissueSourceSiteCode <- unique(df$tissueSourceSiteCode)
	  result = list(unique.disease=unique.disease, 
	  				unique.tissueSourceSiteCode=unique.tissueSourceSiteCode)
	  return(result)
	}
	#--------------------------------------------------------------------------------
	Diagnosis.unique.aggregate <- function(res1, res2){
		res = list(unique.disease=unique(c(res1$unique.disease ,res2$unique.disease )),
				   unique.tissueSourceSiteCode=unique(c(res1$unique.tissueSourceSiteCode, 
				   	res2$unique.tissueSourceSiteCode)))
	    return(res)
	}
	#--------------------------------------------------------------------------------
	Diagnosis.unique.values <- Reduce(Diagnosis.unique.aggregate, lapply(studies, Diagnosis.unique.request))
	
	Diagnosis.mapping.disease <- function(df){
		from <- Diagnosis.unique.values$unique.disease
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$disease <- mapvalues(df$disease, from = from, to = to, warn_missing = F)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Diagnosis.mapping.tissueSourceSiteCode <- function(df){
		from <- Diagnosis.unique.values$unique.tissueSourceSiteCode
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$tissueSourceSiteCode <- mapvalues(df$tissueSourceSiteCode, from = from, 
								  			 to = to, warn_missing = F)
		return(df)
	}
} # End of Diagnosis Native Functions
#----------------------   Drug functions Start Here   ---------------------------
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
							     'pharmaceutical_tx_started_days_to' = list(name = "drugStart", data = "character"),
							     'pharmaceutical_tx_ended_days_to' = list(name = "drugEnd", data = "character"),
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
		  	print(study_name)
		  	return(result)
	    }
	}        
	#--------------------------------------------------------------------------------
	Drug.unique.aggregate <- function(res1, res2){
		if(res2 != "Drug data is empty."){
			res = list(unique.drugStart=unique(c(res1$unique.drugStart, res2$unique.drugStart)),
			       unique.drugEnd=unique(c(res1$unique.drugEnd, res2$unique.drugEnd)),
				   unique.therapyType=unique(c(res1$unique.therapyType, res2$unique.therapyType)),
				   unique.intent=unique(c(res1$unique.intent, res2$unique.intent)),
				   unique.dose=unique(c(res1$unique.dose, res2$unique.dose)),
				   unique.units=unique(c(res1$unique.units, res2$unique.units)),
				   unique.totalDose=unique(c(res1$unique.totalDose, res2$unique.totalDose)),
				   unique.totalDoseUnits=unique(c(res1$unique.totalDoseUnits, res2$unique.totalDoseUnits)),
				   unique.route=unique(c(res1$unique.route, res2$unique.route)),
				   unique.cycle=unique(c(res1$unique.cycle, res2$unique.cycle)))
	    	return(res)
		}else{
			res = res1
		}	
		return(res)
	}
	#--------------------------------------------------------------------------------
	Drug.unique.values <- Reduce(Drug.unique.aggregate, lapply(studies, Drug.unique.request))
	Drug.mapping.date <- function(df){
		df$drugStart[which(df$drugStart %in% c("[NOT AVAILABLE]","[Not Available]","[Pending]"))] <- NA
		df$drugEnd[which(df$drugEnd == "[NOT AVAILABLE]")] <- NA

		df$start[which(is.na(df$drugStart))] <- NA
		df$end[which(is.na(df$drugEnd))] <- NA
		df[which(is.na(df$dxyear)), c("drugStart","drugEnd")] <- NA
	   
	    df$start <- format(as.Date(df$dxyear, "%m/%d/%Y") + as.integer(df$drugStart), "%m/%d/%Y")
	    df$end <- format(as.Date(df$dxyear, "%m/%d/%Y") + as.integer(df$drugEnd), "%m/%d/%Y")
			
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.agent <- function(df){
		if(length(which(df$agent %in% drug_ref$COMMON.NAMES)) > 0 ) {
			df$agent <- drug_ref[match(df$agent,drug_ref$COMMON.NAMES),]$STANDARDIZED.NAMES	
		}
		if(length(which(!df$agent %in% drug_ref$COMMON.NAMES)) > 0){
			common.names <- df$agent[which(!df$agent %in% drug_ref$COMMON.NAMES)]
			standardized.names <- rep("REQUIRE MANUAL CHECK", length(common.names))
			m <- data.frame(COMMON.NAMES=common.names, STANDARDIZED.NAMES=standardized.names)
			drug_ref <- rbind(drug_ref, m)
			write.csv(drug_ref, file=paste("drug_ref_", study_name,".csv", sep=""))
		}
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.therapyType <- function(df){
		from <- Drug.unique.values$unique.therapyType
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[DISCREPANCY]"), to)] <- NA
		df$therapyType <- mapvalues(df$therapyType, from = from, to = to, warn_missing = F)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.intent <- function(df){
		from <- Drug.unique.values$unique.intent
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$intent <- mapvalues(df$intent, from = from, to = to, warn_missing = F)
		return(df)
	}
	#--------------------------------------------------------------------------------
	Drug.mapping.dose <- function(df){
		from <- Drug.unique.values$unique.dose
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[UNKNOWN]"), to)] <- NA
		df$dose <- mapvalues(df$dose, from = from, to = to, warn_missing = F)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.units <- function(df){
		from <- Drug.unique.values$unique.units
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$units <- mapvalues(df$units, from = from, to = to, warn_missing = F)
		df$units[which(is.na(df$dose))] <- NA
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.totalDose <- function(df){
		from <- Drug.unique.values$unique.totalDose
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$totalDose <- mapvalues(df$totalDose, from = from, to = to, warn_missing = F)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.totalDoseUnits <- function(df){
		from <- Drug.unique.values$unique.totalDoseUnits
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$totalDoseUnits <- mapvalues(df$totalDoseUnits, from = from, 
							to = to, warn_missing = F)
		df$totalDoseUnits[which(is.na(df$totalDose))] <- NA
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.route <- function(df){
		from <- Drug.unique.values$unique.route
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$route <- mapvalues(df$route, from = from, 
							to = to, warn_missing = F)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.cycle <- function(df){
		from <- Drug.unique.values$unique.cycle
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$cycle <- mapvalues(df$cycle, from = from, 
							to = to, warn_missing = F)
		return(df)
	}
	#--------------------------------------------------------------------------------
	Drug.mapping.filling <- function(df){
		requiredFields <- c("PatientID", "start", "end", "agent", "therapyType", "intent", "dose",
							"units", "totalDose", "totalDoseUnits", "route", "cycle")   				
		m <- matrix(nrow=nrow(df), ncol=length(which(!requiredFields %in% colnames(df))))
	    m <- as.data.frame(m)
	    colnames(m) <- requiredFields[(which(!(requiredFields) %in% colnames(df)))]
	    df <- cbind(df, m)     				
		return(df)
	}		
} # End of Drug Native Functions
#----------------------   Radiation functions Start Here   ----------------------
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
	    
		  	
		  	df <- data.Rad
		  	unique.radStart <- unique(df$radStart)
		  	unique.radEnd <- unique(df$radEnd)
			unique.radType <- unique(df$radType)
			unique.radTypeOther <- unique(df$radTypeOther)
			unique.intent <- unique(df$intent)
			unique.target <- unique(df$target)
			unique.targetAddition <- unique(df$targetAddition)
			unique.totalDose <- unique(df$totalDose)
			unique.totalDoseUnits <- unique(df$totalDoseUnits)
			unique.numFractions <- unique(df$numFractions)
		  	result = list(unique.radStart=unique.radStart, 
						  unique.radEnd=unique.radEnd, 
		  				  unique.radType=unique.radType,
		  				  unique.radTypeOther=unique.radTypeOther, 
		  				  unique.intent=unique.intent,
		  				  unique.target=unique.target,
		  				  unique.targetAddition=unique.targetAddition,
		  				  unique.totalDose=unique.totalDose,
		  				  unique.totalDoseUnits=unique.totalDoseUnits,
		  				  unique.numFractions=unique.numFractions)
		  	print(study_name)
		  	return(result)
	    }   
	}
	#--------------------------------------------------------------------------------
	Rad.unique.aggregate <- function(res1, res2){
		if(res2 != "Radiation data is empty."){
			res = list(unique.radStart=unique(c(res1$unique.radStart, res2$unique.radStart)),
				       unique.radEnd=unique(c(res1$unique.radEnd, res2$uunique.radEnd)),
					   unique.radType=unique(c(res1$unique.radType, res2$unique.radType)),
					   unique.radTypeOther=unique(c(res1$unique.radTypeOther, res2$unique.radTypeOther)),
					   unique.intent=unique(c(res1$unique.intent, res2$unique.intent)),
					   unique.target=unique(c(res1$unique.target, res2$unique.target)),
					   unique.targetAddition=unique(c(res1$unique.targetAddition, res2$unique.targetAddition)),
					   unique.totalDose=unique(c(res1$unique.totalDose, res2$unique.totalDose)),
					   unique.totalDoseUnits=unique(c(res1$unique.totalDoseUnits, res2$unique.totalDoseUnits)),
					   unique.numFractions=unique(c(res1$unique.numFractions, res2$unique.numFractions)))
		}else{
			res = res1
		}
		return(res)
	}
	#--------------------------------------------------------------------------------
	Rad.unique.values <- Reduce(Rad.unique.aggregate, lapply(studies, Rad.unique.request))
	Rad.mapping.date <- function(df){
		df$radStart[which(df$radStart %in% c("[Not Available]","[Pending]"))] <- NA
		df$radEnd[which(df$radEnd == "[Not Available]")] <- NA

		df$start[which(is.na(df$radStart))] <- NA
		df$end[which(is.na(df$radEnd))] <- NA
		df[which(is.na(df$dxyear)), c("radStart","radEnd")] <- NA
	   
	    df$start <- format(as.Date(df$dxyear, "%m/%d/%Y") + as.integer(df$radStart), "%m/%d/%Y")
	    df$end <- format(as.Date(df$dxyear, "%m/%d/%Y") + as.integer(df$radEnd), "%m/%d/%Y")
			
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Rad.mapping.radType <- function(df){
		from <- Rad.unique.values$unique.radType
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[NOT APPLICABLE]","[UNKNOWN]"), to)] <- NA
		df$radType <- mapvalues(df$radType, from = from, to = to, warn_missing = F)

		from <- Rad.unique.values$unique.radTypeOther
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[UNKNOWN]", "[NOT APPLICABLE]"), to)] <- NA
		df$radTypeOther <- mapvalues(df$radTypeOther, from = from, to = to, warn_missing = F)

		tmpRadType <-rad_ref[match(df$radType,rad_ref$COMMON.RADTYPE),]$STANDARDIZED.RADTYPE
		tmpRadTypeOther <-rad_ref[match(df$radTypeOther,rad_ref$COMMON.OTHERRADTYPE),]$STANDARDIZED.OTHERRADTYPE
		tmpRadType[which(tmpRadType == "OTHER: SPECIFY IN NOTES")] <- tmpRadTypeOther[which(tmpRadType == "OTHER: SPECIFY IN NOTES")]


		df$radType <- tmpRadType
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Rad.mapping.intent <- function(df){
		from <- Rad.unique.values$unique.intent
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$intent <- mapvalues(df$intent, from = from, to = to, warn_missing = F)
		return(df)
	}
	#--------------------------------------------------------------------------------
	Rad.mapping.target <- function(df){
		from <- Rad.unique.values$unique.target
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]", "[UNKNOWN]", "[DISCREPANCY]"), to)] <- NA
		df$target <- mapvalues(df$target, from = from, to = to, warn_missing = F)
		from <- Rad.unique.values$unique.targetAddition
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]", "[UNKNOWN]"), to)] <- NA
		df$targetAddition <- mapvalues(df$targetAddition, from = from, to = to, warn_missing = F)
		updatePos <- which(!is.na(df$targetAddition))
		df$target[updatePos] <- paste(df$target[updatePos], ", AT PRIMARY TUMOR SITE: ", df$targetAddition[updatePos], sep="")

		return(df)
	}	
	#--------------------------------------------------------------------------------
	Rad.mapping.totalDose <- function(df){
		from <- Rad.unique.values$unique.totalDose
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$totalDose <- mapvalues(df$totalDose, from = from, to = to, warn_missing = F)

		#******need to strip 'CGY' and re-assign it to totalDoseUnit
		df$totalDoseUnits[grep("CGY", df$totalDose)] <- "CGY"
		df$totalDose[grep("CGY", df$totalDose)] <- str_extract(df$totalDose[grep("CGY", df$totalDose)],"[0-9,]+")
		
		df$totalDose[which(df$totalDoseUnits == "GY")] <- 
					as.integer(df$totalDose[which(df$totalDoseUnits == "GY")]) * 100

		df$totalDoseUnits[which(df$totalDoseUnits == "GY")] <- "CGY"
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Rad.mapping.totalDoseUnits <- function(df){
		from <- Rad.unique.values$unique.totalDoseUnits
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$totalDoseUnits <- mapvalues(df$totalDoseUnits, from = from, 
							to = to, warn_missing = F)
		df$totalDoseUnits[which(is.na(df$totalDose))] <- NA
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Rad.mapping.numFractions <- function(df){
		from <- Rad.unique.values$unique.numFractions
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$numFractions <- mapvalues(df$numFractions, from = from, 
							to = to, warn_missing = F)
		return(df)
	}
	#--------------------------------------------------------------------------------
	Rad.mapping.filling <- function(df){	
		requiredFields <- c("PatientID", "start", "end", "radType", "intent", "target",
							 "totalDose", "totalDoseUnits", "numFractions")   				
		m <- matrix(nrow=nrow(df), ncol=length(which(!requiredFields %in% colnames(df))))
	    m <- as.data.frame(m)
	    colnames(m) <- requiredFields[(which(!(requiredFields) %in% colnames(df)))]
	    df <- cbind(df, m)     				
		return(df)
	}			
} # End of Radition Native Functions
#----------------------     Status functions Start Here      --------------------
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
		df <- tbl.f
		unique.deathDate <- unique(df$deathDate)
		unique.lastContact <- unique(df$lastContact)
	  	unique.vital <- unique(df$vital)
	  	if("tumorStatus" %in% colnames(df)){
	  		unique.tumorStatus <- unique(df$tumorStatus)
	  		}else{
	  			unique.tumorStatus <- NA
	  		}
	  	
	  	result = list(unique.deathDate=unique.deathDate, unique.lastContact=unique.lastContact, 
	  				  unique.vital=unique.vital, unique.tumorStatus=unique.tumorStatus)
	  	return(result)
	}
	#--------------------------------------------------------------------------------
	Status.unique.aggregate <- function(res1, res2){
		res = list(unique.deathDate=unique(c(res1$unique.deathDate,res2$unique.deathDate)),
				   unique.lastContact=unique(c(res1$unique.lastContact,res2$unique.lastContact)),
				   unique.vital=unique(c(res1$unique.vital,res2$unique.vital)),
				   unique.tumorStatus=unique(c(res1$tumorStatus.race, res2$unique.tumorStatus)))
	    return(res)
	}
	#--------------------------------------------------------------------------------
	Status.unique.values <- Reduce(Status.unique.aggregate, lapply(studies, Status.unique.request))
	Status.mapping.date <- function(df){
		from <- Status.unique.values$unique.lastContact
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[DISCREPANCY]", "[COMPLETED]"), to)] <- NA
		df$lastContact <- mapvalues(df$lastContact, from = from, to = to, warn_missing = F)
		
		from <- Status.unique.values$unique.deathDate
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[DISCREPANCY]", "[NOT APPLICABLE]"), to)] <- NA
		df$deathDate <- mapvalues(df$deathDate, from = from, to = to, warn_missing = F)
		

		return(df)
	}	
	#--------------------------------------------------------------------------------
	Status.mapping.date.Check <- function(df){
		
		if(length(which(as.numeric(df$lastContact) > as.numeric(df$deathDate)))) {
			lastContactGreaterThanDeath  = paste(df[which(df$lastContact > df$deathDate),]$PatientID)
			warning("last contact occured after death: ", lastContactGreaterThanDeath)
		}
        df[which(!(is.na(df$lastContact))),]$date <- df[which(!(is.na(df$lastContact))),]$lastContact
        df[which(!(is.na(df$deathDate))),]$date <- df[which(!(is.na(df$deathDate))),]$deathDate

		return(df)
	}	
	#--------------------------------------------------------------------------------
	Status.mapping.date.Calculation <- function(df){
		df$date <- format(as.Date(df$dxyear, "%m/%d/%Y") + as.integer(df$date), "%m/%d/%Y")
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Status.mapping.vital <- function(df){
		from <- Status.unique.values$unique.vital
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$vital <- mapvalues(df$vital, from = from, to = to, warn_missing = F)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Status.mapping.tumorStatus <- function(df){
		from <- Status.unique.values$unique.tumorStatus 
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[UNKNOWN]"), to)] <- NA
		df$tumorStatus <- mapvalues(df$tumorStatus, from = from, to = to, warn_missing = F)
		return(df)
	}
	#--------------------------------------------------------------------------------
	Status.mapping.filling <- function(df){	
		requiredFields <- c("PatientID", "date", "vital", "tumorStatus")   				
		m <- matrix(nrow=nrow(df), ncol=length(which(!requiredFields %in% colnames(df))))
	    m <- as.data.frame(m)
	    colnames(m) <- requiredFields[(which(!(requiredFields) %in% colnames(df)))]
	    df <- cbind(df, m)     				
		return(df)
	}			
} # End of Status Native Functions
#----------------------   PROGRESSION functions Start Here   ----------------------
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
		if(nrow(tbl.f) == 0){
			return ("Progression data is empty.")
		}else{
			df <- merge(tbl.f, tbl.pt)
			unique.newTumor <- unique(df$newTumor)
			unique.newTumorDate <- unique(df$newTumorDate)
		   	result = list(unique.newTumor=unique.newTumor, unique.newTumorDate=unique.newTumorDate)
		  	return(result)
		}
	}
	#--------------------------------------------------------------------------------
	Progression.unique.aggregate <- function(res1, res2){
		if(res2 != "Progression data is empty."){
			res = list(unique.newTumor=unique(c(res1$unique.newTumor,res2$unique.newTumor)),
				   unique.newTumorDate=unique(c(res1$unique.newTumorDate, res2$unique.newTumorDate)))	
		}else{
			res = res1
		}	
	    return(res)
	}
	#--------------------------------------------------------------------------------
	Progression.unique.values <- Reduce(Progression.unique.aggregate, lapply(studies, Progression.unique.request))
	Progression.mapping.newTumor <- function(df){
		from <- Progression.unique.values$unique.newTumor
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[UNKNOWN]"), to)] <- NA
		df$newTumor <- mapvalues(df$newTumor, from = from, to = to, warn_missing = F)
		return(df)
	}
	#--------------------------------------------------------------------------------
	Progression.mapping.newTumorNaRM <- function(df){
		rmList <- apply(df, 1, function(x){
					pt = getElement(x, "PatientID")
					newTumorType = getElement(x, "newTumor")
					newTumorDateVal = getElement(x, "newTumorDate")
					tmp <- subset(df, PatientID == pt & newTumorDate == newTumorDateVal)
					if(nrow(tmp) > 1 && any(is.na(tmp$newTumor))){
						return(which(df$PatientID == pt & df$newTumorDate == newTumorDateVal & is.na(df$newTumor)))
					}
				})
		if(is.null(rmList)){
			return(df)
		}else{
			#print(unlist(rmList))
			df <- df[-(unlist(rmList)),]
		}
	}
	#--------------------------------------------------------------------------------	
	Progression.mapping.newTumorDate <- function(df){
		from <- Progression.unique.values$unique.newTumorDate 
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[NOT APPLICABLE]"), to)] <- NA
		df$newTumorDate <- mapvalues(df$newTumorDate, from = from, to = to, warn_missing = F)
		return(df)
	}
	#--------------------------------------------------------------------------------
	Progression.mapping.date.Calculation <- function(df){
		df$date <- format(as.Date(df$dxyear, "%m/%d/%Y") + as.integer(df$newTumorDate), "%m/%d/%Y")
		return(df)
	}		
} # End of Progression Native Functions
#----------------------   Encounter functions Start Here   ----------------------
if(ENCOUNTER){ 
  # brca, hnsc, prad DO NOT HAVE ENCOUNTER RECORDS!
  Encounter.unique.request <- function(study_name){   
	    uri <- rawTablesRequest(study_name, "Encounter")
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
	                       list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                            'performance_status_timing' = list(name = "encType", data = "upperCharacter"),
	                            'karnofsky_score'= list(name = "KPS", data = "upperCharacter"),
	                            'ecog_score' = list(name = "ECOG", data = "upperCharacter")
	                       ))
	                           
	    
	    # reorganize two tbls

	    data.Encounter <- rbind.fill(tbl.pt, tbl.f1)
	    #colnames(data.Encounter)
	    
	    df <- data.Encounter
	    unique.encType<- unique(df$encType)
	    unique.KPS <- unique(df$KPS)
	    unique.ECOG <- unique(df$ECOG)
	    #coad/read only
	    unique.height <- unique(df$height)
	    unique.weight <- unique(df$weight)
	    #lung only
	    unique.prefev1.ratio <- unique(df$prefev1.ratio)
	    unique.prefev1.percent <- unique(df$prefev1.percent)
	    unique.postfev1.ratio<- unique(df$postfev1.ratio)
	    unique.postfev1.percent <- unique(df$postfev1.percent)
	    unique.carbon.monoxide.diffusion<- unique(df$carbon.monoxide.diffusion)
	    
	    
	    result = list(unique.encType=unique.encType, 
	                  unique.KPS=unique.KPS,
	                  unique.ECOG=unique.ECOG,
	                  unique.height=unique.height,
	                  unique.weight=unique.weight,
	                  unique.prefev1.ratio=unique.prefev1.ratio,
	                  unique.prefev1.percent=unique.prefev1.percent,
	                  unique.postfev1.ratio=unique.postfev1.ratio,
	                  unique.postfev1.percent=unique.postfev1.percent,
	                  unique.carbon.monoxide.diffusion=unique.carbon.monoxide.diffusion)
	    print(study_name)
	    return(result)
  }
  #--------------------------------------------------------------------------------
  Encounter.unique.aggregate <- function(res1, res2){
	    res = list(unique.encType=unique(c(res1$unique.encType,res2$unique.encType)),
	               unique.KPS=unique(c(res1$unique.KPS, res2$unique.KPS)),
	               unique.ECOG=unique(c(res1$unique.ECOG, res2$unique.ECOG)),
	               #coad/read only
	               unique.height=unique(c(res1$unique.height, res2$unique.height)),
	               unique.weight=unique(c(res1$unique.weight, res2$unique.weight)),
	               #lung only
	               unique.prefev1.ratio=unique(c(res1$unique.prefev1.ratio, res2$unique.prefev1.ratio)),
	               unique.prefev1.percent=unique(c(res1$unique.prefev1.percent, res2$unique.prefev1.percent)),
	               unique.postfev1.ratio=unique(c(res1$unique.postfev1.ratio, res2$unique.postfev1.ratio)),
	               unique.postfev1.percent=unique(c(res1$unique.postfev1.percent, res2$unique.postfev1.percent)),
	               unique.carbon.monoxide.diffusion=unique(c(res1$unique.carbon.monoxide.diffusion, res2$unique.carbon.monoxide.diffusion)))
	    return(res)
  }
  #-------------------------------------------------------------------------------------------------------------------------
  Encounter.unique.values <- Reduce(Encounter.unique.aggregate, lapply(studies,Encounter.unique.request))
  Encounter.unique.encType <- Encounter.unique.values$unique.encType
  #[1] "[NOT AVAILABLE]"      "PRE-OPERATIVE"         "PRE-ADJUVANT THERAPY"  "POST-ADJUVANT THERAPY"
  #[5] "OTHER"                "[NOT EVALUATED]"       "ADJUVANT THERAPY"      "[DISCREPANCY]" 
  #[9] "[UNKNOWN]"            "PREOPERATIVE" 
         
  Encounter.unique.KPS<- Encounter.unique.values$unique.KPS
  #output was a list of acceptable integers including:
  #[1] "[NOT AVAILABLE]"     [2] "[UNKNOWN]"           "[NOT EVALUATED]"  

  Encounter.unique.ECOG<- Encounter.unique.values$unique.ECOG
  #output was a list of acceptable integers including:
  #[1] "[NOT AVAILABLE]"     [2] "[UNKNOWN]"           "[NOT EVALUATED]"     
  #------------------------------------------------------------------------------------------------------------------------
  #coad/read only
  Encounter.unique.height<- Encounter.unique.values$unique.height
  #[1] "[Not Available]"  
  Encounter.unique.weight<- Encounter.unique.values$unique.weight
  #[1] "[Not Available]"
  #------------------------------------------------------------------------------------------------------------------------
  #lung only
  Encounter.unique.prefev1.ratio<- Encounter.unique.values$unique.prefev1.ratio
  #[1] "[Not Available]"
  Encounter.unique.prefev1.percent <- Encounter.unique.values$unique.prefev1.percent
  #[1] "[Not Available]"
  Encounter.unique.postfev1.ratio<- Encounter.unique.values$unique.postfev1.ratio
  #[1] "[Not Available]"
  Encounter.unique.postfev1.percent <- Encounter.unique.values$unique.postfev1.percent
  #[1] "[Not Available]"
  Encounter.unique.carbon.monoxide.diffusion <- Encounter.unique.values$unique.carbon.monoxide.diffusion
  #[1] "[Not Available]"
  #-------------------------------------------------------------------------------------------------------------------------
  Encounter.mapping.encType <- function(df){
	    from <- Encounter.unique.encType
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","UKNOWN","[DISCREPANCY]","OTHER"), to)] <- NA
	    df$encType <- mapvalues(df$encType, from = from, to = to, warn_missing = F)
	    return(df)
  }	
  #--------------------------------------------------------------------------------
  Encounter.mapping.KPS<- function(df){
	    from <- Encounter.unique.KPS
	    to 	 <- from 
	    to[match(c("[NOT EVALUATED]","[NOT AVAILABLE]","[UNKNOWN]","UNKNOWN"), to)] <- NA
	    df$KPS <- mapvalues(df$KPS, from = from, to = to, warn_missing = F)
	    return(df)
  }
  #--------------------------------------------------------------------------------
  Encounter.mapping.ECOG<- function(df){
	    from <- Encounter.unique.ECOG
	    to 	 <- from 
	    to[match(c("[NOT EVALUATED]","[NOT AVAILABLE]","[UNKNOWN]","UNKNOWN"), to)] <- NA
	    df$ECOG <- mapvalues(df$ECOG, from = from, to = to, warn_missing = F)
	    return(df)
  }
  #--------------------------------------------------------------------------------
  #only coad/read
  Encounter.mapping.height<- function(df){
	    from <- Encounter.unique.height
	    to 	 <- from 
	    to[match("[NOT AVAILABLE]", to)] <- NA
	    df$height <- mapvalues(df$height, from = from, to = to, warn_missing = F)
	    return(df)
  }
  #--------------------------------------------------------------------------------
  #only coad/read
  Encounter.mapping.weight<- function(df){
	    from <- Encounter.unique.weight
	    to 	 <- from 
	    to[match("[NOT AVAILABLE]", to)] <- NA
	    df$weight <- mapvalues(df$weight, from = from, to = to, warn_missing = F)
	    return(df)
  } 
  #--------------------------------------------------------------------------------
  #lung only
  Encounter.mapping.prefev1.ratio<- function(df){
	    from <- Encounter.unique.prefev1.ratio
	    to 	 <- from 
	    to[match("[NOT AVAILABLE]", to)] <- NA
	    df$prefev1.ratio <- mapvalues(df$prefev1.ratio, from = from, to = to, warn_missing = F)
	    return(df)
  } 
  #--------------------------------------------------------------------------------
  #lung only
  Encounter.mapping.prefev1.percent<- function(df){
	    from <- Encounter.unique.prefev1.percent
	    to 	 <- from 
	    to[match("[NOT AVAILABLE]", to)] <- NA
	    df$prefev1.percent <- mapvalues(df$prefev1.percent, from = from, to = to, warn_missing = F)
	    return(df)
  } 
  #--------------------------------------------------------------------------------
  #lung only
  Encounter.mapping.postfev1.ratio <- function(df){
	    from <- Encounter.unique.postfev1.ratio
	    to 	 <- from 
	    to[match("[NOT AVAILABLE]", to)] <- NA
	    df$postfev1.ratio  <- mapvalues(df$postfev1.ratio, from = from, to = to, warn_missing = F)
	    return(df)
  } 
  #--------------------------------------------------------------------------------
  #lung only
  Encounter.mapping.postfev1.percent <- function(df){
	    from <- Encounter.unique.postfev1.percent
	    to 	 <- from 
	    to[match("[NOT AVAILABLE]", to)] <- NA
	    df$postfev1.percent  <- mapvalues(df$postfev1.percent, from = from, to = to, warn_missing = F)
	    return(df)
  } 
  #--------------------------------------------------------------------------------
  #lung only
  Encounter.mapping.carbon.monoxide.diffusion <- function(df){
	    from <- Encounter.unique.carbon.monoxide.diffusion
	    to 	 <- from 
	    to[match("[NOT AVAILABLE]", to)] <- NA
	    df$carbon.monoxide.diffusion  <- mapvalues(df$carbon.monoxide.diffusion, from = from, to = to, warn_missing = F)
	    return(df)
  } 
  #----------------------     Encounter functions End Here      --------------------------
} # End of Encounter Native Functions
#----------------------   Procedure functions Start Here   ----------------------
if(PROCEDURE){
  	Procedure.unique.request <- function(study_name){
	    uri <- rawTablesRequest(study_name, "Procedure")
	    rm(list=ls(pattern="tbl"))
	    tbl.nte <- loadData(uri[1],
	                       list(
	                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                         'new_tumor_event_surgery_days_to_loco' = list(name = "date_locoregional", data = "upperCharacter"), #(only in lgg,luad,lusc)
	                         'new_tumor_event_surgery_days_to_met'= list(name = "date_metastatic", data = "upperCharacter"), #(only in lgg,luad,lusc)
	                         'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), #(in brca,hnsc but not being collected...) #YES/NO
	                         'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date", data = "upperCharacter"), #(only in gbm,coad,read)
	                         'new_neoplasm_event_type'  = list(name = "site", data = "upperCharacter"), #(only in gbm, coad, read)
	                         'new_tumor_event_type'  = list(name = "site", data = "upperCharacter") #(only in hnsc, prad, luad, lusc)
	                         'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") #(gbm,coad,read but not being collected...) YES/NO
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
	      
	 	df <- data.Procedure
	  	unique.dxyear<- unique(df$dxyear)
	  	unique.side<- unique(df$side)
	  	unique.site <- unique(df$site)
	  	unique.surgery_name <- unique(df$surgery_name)	  	
		unique.date<- unique(df$date)
		unique.date_locoregional<- unique(df$date_locoregional)  
		unique.date_metastatic<- unique(df$date_metastatic)

		result = list(unique.dxyear=unique.dxyear, 
	                unique.side=unique.side,
	                unique.site=unique.site,
	                unique.surgery_name=unique.surgery_name,
	                unique.date=unique.date,
					unique.date_locoregional=unique.date_locoregional,
					unique.date_metastatic=unique.date_metastatic)
	 	print(study_name)
		return(result)
	}
  #--------------------------------------------------------------------------------------------------------------------
  	Procedure.unique.aggregate <- function(res1, res2){
    	res = list(unique.dxyear=unique(c(res1$unique.dxyear, res2$unique.dxyear)),
	               unique.side=unique(c(res1$unique.side, res2$unique.side)),
	               unique.site=unique(c(res1$unique.site, res2$unique.site)),
	               unique.surgery_name=unique(c(res1$unique.surgery_name, res2$unique.surgery_name)),       	               
	               unique.date=unique(c(res1$unique.date, res2$unique.date)),              
    			   unique.date_locoregional=unique(c(res1$unique.date_locoregional, res2$unique.date_locoregional)),
    			   unique.date_metastatic=unique(c(res1$unique.date_metastatic, res2$unique.date_metastatic)))

    	return(res)
	}
  #--------------------------------------------------------------------------------
	Procedure.unique.values <- Reduce(Procedure.unique.aggregate, lapply(studies, Procedure.unique.request))	    
	Procedure.unique.side <- Procedure.unique.values$unique.side
	Procedure.unique.site <- Procedure.unique.values$unique.site
	Procedure.unique.surgery_name <- Procedure.unique.values$unique.surgery_name
	Procedure.unique.date <- Procedure.unique.values$unique.date 
  	Procedure.unique.date_locoregional <- Procedure.unique.values$unique.date_locoregional
	Procedure.unique.date_metastatic <- Procedure.unique.values$unique.date_metastatic 
  #------------------------------------------------------------------------------------------------------------------------------------------------------------
  	Procedure.mapping.side<- function(df){
    	from <- Procedure.unique.side
    	to 	 <- from 
    	to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER"), to)] <- NA
    	df$side <- mapvalues(df$side, from = from, to = to, warn_missing = F)
    	return(df)
  	}	
  #------------------------------------------------------------------------------------------------------------------------------------------
  	Procedure.mapping.site<- function(df){
	    from <- Procedure.unique.site
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER"), to)] <- NA
	    df$site<- mapvalues(df$site, from = from, to = to, warn_missing = F)
	    return(df)
  	}	
  #-----------------------------------------------------------------------------------------------------------------------------------------
  	Procedure.mapping.surgery_name<- function(df){
	    from <- Procedure.unique.surgery_name
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER"), to)] <- NA
	    df$surgery_name<- mapvalues(df$surgery_name, from = from, to = to, warn_missing = F)
	    return(df)
  	}	
  #-------------------------------------------------------------------------------------------------------------------------
 	Procedure.mapping.date <- function(df){
	    from <- Procedure.unique.date
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER"), to)] <- NA
	    df$date <- mapvalues(df$date, from = from, to = to, warn_missing = F)
	    return(df)
  	}	
 		Procedure.mapping.date_locoregional <- function(df){
	    from <- Procedure.unique.date_locoregional
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER"), to)] <- NA
	    df$date_locoregional <- mapvalues(df$date_locoregional, from = from, to = to, warn_missing = F)
	    return(df)
  	}	
		Procedure.mapping.date_metastatic <- function(df){
	    from <- Procedure.unique.date_met
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER"), to)] <- NA
	    df$date_metastatic <- mapvalues(df$date_metastatic, from = from, to = to, warn_missing = F)
	    return(df)
  	}
 #------------------------------------------------------------------------------------------------------------------------------------------
		Procedure.mapping.Calculation.date  <- function(df){
	    df$date <- format(as.Date(df$dxyear,"%m/%d/%Y") + as.integer(df$date), "%m/%d/%Y")
	    return(df)
  	}
		Procedure.mapping.Calculation.date_locoregional  <- function(df){
	    df$date_locoregional <- format(as.Date(df$dxyear,"%m/%d/%Y") + as.integer(df$date_locoregional), "%m/%d/%Y")
	    return(df)
  	}
		Procedure.mapping.Calculation.date_metastatic  <- function(df){
	    df$date_metastatic <- format(as.Date(df$dxyear,"%m/%d/%Y") + as.integer(df$date_metastatic), "%m/%d/%Y")
	    return(df)
  	}
  #------------------------------------------------------------------------------------------------------------------------------------------
}  # End of Procedure Native Functions
#----------------------   Pathology functions Start Here   ----------------------
if(PATHOLOGY){
  Pathology.unique.request <- function(study_name){
		uri <- rawTablesRequest(study_name, "Pathology")
		rm(list=ls(pattern="tbl"))
		tbl.pt <- loadData(uri[1], 
		       list(
		         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
		         'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"), 
		         'days_to_initial_pathologic_diagnosis'  = list(name = "date", data = "upperCharacter"), #date
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
		         'days_to_other_malignancy_dx' = list(name = "date_other_malignancy", data = "upperCharacter"), #date
		         'other_malignancy_histological_type' = list(name = "pathHistology", data = "upperCharacter"),
		         'other_malignancy_histological_type_text' = list(name = "pathHistology", data = "upperCharacter")
		          ))
		# reorganize two tbls 
		data.Pathology <- rbind.fill(tbl.pt[,-match("dxyear", colnames(tbl.pt))], tbl.omf)
		data.Pathology <- merge(data.Pathology, tbl.pt[,c("PatientID", "dxyear")])
		if(any(duplicated(data.Pathology))){
		  data.Pathology <- data.Pathology[-which(duplicated(data.Pathology)), ]
		}

		df <- data.Pathology
		unique.dxyear <- unique(df$dxyear)
		unique.pathDisease<- unique(df$pathDisease)
  		unique.pathHistology <- unique(df$pathHistology)
		unique.prospective_collection <- unique(df$prospective_collection)
		unique.retrospective_collection <- unique(df$retrospective_collection)
		unique.pathMethod <- unique(df$pathMethod)
		unique.T.Stage <- unique(df$T.Stage)
		unique.N.Stage <- unique(df$N.Stage)
		unique.M.Stage<- unique(df$M.Stage)
		unique.S.Stage<- unique(df$S.Stage)
		unique.staging.System <- unique(df$staging.System)
		unique.grade<- unique(df$grade)		
		unique.date<- unique(df$date)
   	   	unique.date_other_malignancy<-unique(df$unique.date_other_malignancy)
		 result = list(unique.dxyear=unique.dxyear,
		               unique.pathDisease=unique.pathDisease, 
                 	   unique.pathHistology=unique.pathHistology,
                 	   unique.prospective_collection=unique.prospective_collection,
                 	   unique.retrospective_collection=unique.retrospective_collection,
                 	   unique.pathMethod=unique.pathMethod,
                 	   unique.T.Stage=unique.T.Stage,
                       unique.N.Stage=unique.N.Stage,
                 	   unique.M.Stage=unique.M.Stage,
                       unique.S.Stage=unique.S.Stage,
                       unique.staging.System=unique.staging.System,
                       unique.grade=unique.grade,
                       unique.date=unique.date,
                       unique.date_other_malignancy=unique.date_other_malignancy)         
               			
               print(study_name)
  			return(result)
  }
  #--------------------------------------------------------------------------------
  Pathology.unique.aggregate <- function(res1, res2){
	  res = list(unique.dxyear=unique(c(res1$unique.dxyear, res2$unique.dxyear)),
	             unique.pathDisease=unique(c(res1$unique.pathDisease,res2$unique.pathDisease)),
	             unique.pathHistology=unique(c(res1$unique.pathHistology, res2$unique.pathHistology)),
	             unique.prospective_collection=unique(c(res1$unique.prospective_collection, res2$unique.prospective_collection)),
	             unique.retrospective_collection=unique(c(res1$unique.retrospective_collection, res2$unique.retrospective_collection)),
	             unique.pathMethod=unique(c(res1$unique.pathMethod, res2$unique.pathMethod)),
	             unique.T.Stage=unique(c(res1$unique.T.Stage, res2$unique.T.Stage)),
	             unique.N.Stage=unique(c(res1$unique.N.Stage, res2$unique.N.Stage)),
	             unique.M.Stage=unique(c(res1$unique.M.Stage, res2$unique.M.Stage)),
	             unique.S.Stage=unique(c(res1$unique.S.Stage, res2$unique.S.Stage)),
	             unique.staging.System=unique(c(res1$unique.staging.System, res2$unique.staging.System)),
	             unique.date=unique(c(res1$unique.date, res2$unique.date)),
				 unique.date_other_malignancy=unique(c(res1$unique.date_other_malignancy, res2$unique.date_other_malignancy)),
	             unique.grade=unique(c(res1$unique.grade, res2$unique.grade)))

	  return(res)
  }
  #-------------------------------------------------------------------------------------------------------------------------
  Pathology.unique.values <- Reduce(Pathology.unique.aggregate, lapply(studies,Pathology.unique.request))

  Pathology.unique.pathDisease <- Pathology.unique.values$unique.pathDisease
  Pathology.unique.pathHistology <- Pathology.unique.values$unique.pathHistology
  Pathology.unique.prospective_collection <- Pathology.unique.values$unique.prospective_collection
  Pathology.unique.retrospective_collection <- Pathology.unique.values$unique.retrospective_collection
  Pathology.unique.pathMethod <- Pathology.unique.values$unique.pathMethod
  Pathology.unique.T.Stage <- Pathology.unique.values$unique.T.Stage
  Pathology.unique.N.Stage <- Pathology.unique.values$unique.N.Stage
  Pathology.unique.M.Stage <- Pathology.unique.values$unique.M.Stage
  Pathology.unique.S.Stage <- Pathology.unique.values$unique.S.Stage
  Pathology.unique.staging.System <- Pathology.unique.values$unique.staging.System
  Pathology.unique.grade <- Pathology.unique.values$unique.grade
  Pathology.unique.date <- Pathology.unique.values$unique.date
  Pathology.unique.date_other_malignancy <- Pathology.unique.values$unique.unique.date_other_malignancy
  #-----------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.pathDisease<- function(df){
	    from <- Pathology.unique.pathDisease
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$pathDisease <- mapvalues(df$pathDisease, from = from, to = to, warn_missing = F)
	    return(df)
	}		 
  #------------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.pathHistology<- function(df){
	    from <- Pathology.unique.pathHistology
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$pathHistology <- mapvalues(df$pathHistology, from = from, to = to, warn_missing = F)
	    return(df)
	}		  
  #------------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.prospective_collection<- function(df){
	    from <- Pathology.unique.prospective_collection
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$prospective_collection <- mapvalues(df$prospective_collection, from = from, to = to, warn_missing = F)
	    return(df)
	}	  
     #------------------------------------------------------------------------------------------------------------------------------------------
    Pathology.mapping.retrospective_collection<- function(df){
	    from <- Pathology.unique.retrospective_collection
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$retrospective_collection <- mapvalues(df$retrospective_collection, from = from, to = to, warn_missing = F)
	    return(df)
	}	
  #------------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.pathMethod<- function(df){
	    from <- Pathology.unique.pathMethod
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$pathMethod <- mapvalues(df$pathMethod, from = from, to = to, warn_missing = F)
	    return(df)
	}	  
  #------------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.T.Stage<- function(df){
	    from <- Pathology.unique.T.Stage
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$T.Stage <- mapvalues(df$T.Stage, from = from, to = to, warn_missing = F)
	    return(df)
	}	  
  #------------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.N.Stage<- function(df){
	    from <- Pathology.unique.N.Stage
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$N.Stage <- mapvalues(df$N.Stage, from = from, to = to, warn_missing = F)
	    return(df)
	}	  
  #------------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.M.Stage<- function(df){
	    from <- Pathology.unique.M.Stage
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$M.Stage <- mapvalues(df$M.Stage, from = from, to = to, warn_missing = F)
	    return(df)
	}	
  #------------------------------------------------------------------------------------------------------------------------------------------
    Pathology.mapping.S.Stage<- function(df){
	    from <- Pathology.unique.S.Stage
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$S.Stage <- mapvalues(df$S.Stage, from = from, to = to, warn_missing = F)
	    return(df)
	}	
 #------------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.staging.System<- function(df){
	    from <- Pathology.unique.staging.System
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$staging.System <- mapvalues(df$staging.System, from = from, to = to, warn_missing = F)
	    return(df)
	}	 
  #------------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.grade<- function(df){
	    from <- Pathology.unique.grade
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$grade <- mapvalues(df$grade, from = from, to = to, warn_missing = F)
	    return(df)
	}	 
  #------------------------------------------------------------------------------------------------------------------------------------------
  Pathology.mapping.date <- function(df){
	    from <- Pathology.unique.date
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$date  <- mapvalues(df$date , from = from, to = to, warn_missing = F)
	    return(df)
	}	 
  Pathology.mapping.Calculation.date <- function(df){
    	df$date <- format(as.Date(df$dxyear,"%m/%d/%Y") + as.integer(df$date), "%m/%d/%Y")
    	return(df)
  	}	
  	#------------------------------------------------------------------------------------------------------------------------------------------
 Pathology.mapping.date_other_malignancy <- function(df){
	    from <- Pathology.unique.date_other_malignancy
	    to 	 <- from 
	    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","[COMPLETED]"), to)] <- NA
	    df$date_other_malignancy  <- mapvalues(df$date_other_malignancy , from = from, to = to, warn_missing = F)
	    return(df)
	}	 
  Pathology.mapping.Calculation.date_other_malignancy <- function(df){
    	df$date_other_malignancy <- format(as.Date(df$dxyear,"%m/%d/%Y") + as.integer(df$date_other_malignancy), "%m/%d/%Y")
    	return(df)
  	}
} # End of Pathology Native Functions
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
	    		result = list(unique.omfdx=NA, unique.radInd=NA,
		   		   		  unique.drugInd=NA, unique.pulInd=NA)
	    }else{
	    	df <- merge(tbl.pt[,c("PatientID", "dxyear"),], tbl.f)
			unique.omfdx <- unique(df$omfdx)
			unique.radInd <- unique(df$radInd)
			unique.drugInd <- unique(df$drugInd)
			if("pulInd" %in% colnames(df)){
				unique.pulInd <- unique(df$pulInd)
			}else{
				unique.pulInd <- NA
			}
			
		   	result = list(unique.omfdx=unique.omfdx, unique.radInd=unique.radInd,
		   		   		  unique.drugInd=unique.drugInd, unique.pulInd=unique.pulInd)
	    }   
	    return(result)
	}
	#--------------------------------------------------------------------------------
	Absent.unique.aggregate <- function(res1, res2){
		if(res2 != "Progression data is empty."){
			res = list(unique.omfdx=unique(c(res1$unique.omfdx,res2$unique.omfdx)),
				   unique.radInd=unique(c(res1$unique.radInd, res2$unique.radInd)),
				   unique.drugInd=unique(c(res1$unique.drugInd, res2$unique.drugInd)),
				   unique.pulInd=unique(c(res1$unique.pulInd, res2$unique.pulInd)))
		}else{
			res = res1
		}	
	    return(res)
	}
	#--------------------------------------------------------------------------------
	Absent.unique.values <- Reduce(Absent.unique.aggregate, lapply(studies, Absent.unique.request))
	Absent.mapping.omfdx <- function(df){
		from <- Absent.unique.values$unique.omfdx
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[NOT APPLICABLE]","[PENDING]"), to)] <- NA
		df$omfdx <- mapvalues(df$omfdx, from = from, to = to, warn_missing = F)
		return(df)
	}
	#--------------------------------------------------------------------------------
	Absent.mapping.omfdx.Calculation <- function(df){
		df$date <- format(as.Date(df$dxyear,"%m/%d/%Y") + as.integer(df$omfdx), "%m/%d/%Y")
		return(df)
	}
	#--------------------------------------------------------------------------------
	Absent.mapping.radInd <- function(df){
		from <- Absent.unique.values$unique.radInd
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[UNKNOWN]"), to)] <- NA
		df$radInd <- mapvalues(df$radInd, from = from, to = to, warn_missing = F)
		df$radInd[which(df$radInd == "NO")] <- "TRUE"
		df$radInd[which(df$radInd == "YES")] <- "FALSE"
		return(df)
	}
	#--------------------------------------------------------------------------------
	Absent.mapping.drugInd <- function(df){
		from <- Absent.unique.values$unique.drugInd
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[UNKNOWN]"), to)] <- NA
		df$drugInd <- mapvalues(df$drugInd, from = from, to = to, warn_missing = F)
		df$drugInd[which(df$drugInd == "NO")] <- "TRUE"
		df$drugInd[which(df$drugInd == "YES")] <- "FALSE"
		return(df)
	}
	#--------------------------------------------------------------------------------
	Absent.mapping.pulInd <- function(df){
		from <- Absent.unique.values$unique.pulInd
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$pulInd <- mapvalues(df$pulInd, from = from, to = to, warn_missing = F)
		df$pulInd[which(df$pulInd == "NO")] <- "TRUE"
		df$pulInd[which(df$pulInd == "YES")] <- "FALSE"
		return(df)
	}
	#--------------------------------------------------------------------------------	
} # End of Absent Native Functions
#----------------------   Tests functions Start Here   --------------------------
if(TESTS){
	Tests.unique.request <- function(study_name){
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
	  	if(length(tbl.pt) > 2){
	  		tbl <- tbl.pt[,-match("dxyear", colnames(tbl.pt))]
	  	}
	  	if(exists("tbl.f1") && length(tbl.f1) > 1) tbl <- rbind.fill(tbl, tbl.f1)
	  	if(exists("tbl.f2") && length(tbl.f2) > 1) tbl <- rbind.fill(tbl, tbl.f2)
	  	if(exists("tbl.f3") && length(tbl.f3) > 1) tbl <- rbind.fill(tbl, tbl.f3)
	  	if(exists("tbl.nte") && length(tbl.nte) > 1) tbl <- rbind.fill(tbl, tbl.nte)
	  	if(exists("tbl.nte_f1") && length(tbl.nte_f1) > 1) tbl <- rbind.fill(tbl, tbl.nte_f1)
	    if(length(tbl) == 0){
	    	print(c(study_name, length(tbl)))
	    	return(tbl)
	    }else{	
			unique.Result <- unique(unlist(tbl[,-1]))
		   	result = list(unique.Result=unique.Result)
		  	return(result)
		}
	}
	#--------------------------------------------------------------------------------
	Tests.unique.aggregate <- function(res1, res2){
		res = list(unique.Result=unique(c(res1$unique.Result,res2$unique.Result)))
	    return(res)
	}
	#--------------------------------------------------------------------------------
	Tests.unique.values <- Reduce(Tests.unique.aggregate, lapply(studies, Tests.unique.request))
	Tests.mapping.testResult <- function(vec){
		from <- Tests.unique.values$unique.Result
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[NOT EVALUATED]","[UNKNOWN]"), to)] <- NA
		vec <- mapvalues(vec, from = from, to = to, warn_missing = F)
		return(vec)
	}
	#--------------------------------------------------------------------------------
	Tests.mapping.type <- function(df, df.methods){
		if(exists("type")){
			rm(type)		
		}
		type <- NA
		if(missing(df.methods)){
			if(length(grep("psa", colnames(df[2]), ignore.case=TRUE)) > 0 ) {type <- "PSA"}
			if(length(grep("boneScan", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- "BONE SCAN"}
			if(length(grep("ctAbPel", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- "CT SCAN"}
			if(length(grep("mri", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- "MRI"}
			if(length(grep("ihc", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- "IHC"}
			if(length(grep("pul", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- "PULMONARY"}
			if(length(grep("p16", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- "P16"}
			if(length(grep("ish", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- "ISH"}
			if(length(grep("fish", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- "FISH"}
			if(length(grep("cellsCount", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- "CELLS COUNT"}
			if(!exists("type")) type <- NA
			df$Type <- rep(type, nrow(df))
			return(df)
		}else{
				methods <- gsub("Method", "", colnames(df.methods))
				for(i in 1:length(methods)){
					if(length(grep(methods[i], colnames(df)[2], ignore.case=TRUE)) > 0){
						type <- df.methods[,i]
					}
				}
				if(is.na(type)){
					if(length(grep("psa", colnames(df[2]), ignore.case=TRUE)) > 0 ) {type <- rep("PSA", nrow(df))}
					if(length(grep("boneScan", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- rep("BONE SCAN", nrow(df))}
					if(length(grep("ctAbPel", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- rep("CT SCAN", nrow(df))}
					if(length(grep("mri", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- rep("MRI", nrow(df))}
					if(length(grep("ihc", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- rep("IHC", nrow(df))}
					if(length(grep("pul", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- rep("PULMONARY", nrow(df))}
					if(length(grep("p16", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- rep("P16", nrow(df))}
					if(length(grep("ish", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- rep("ISH", nrow(df))}
					if(length(grep("fish", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- rep("FISH", nrow(df))}
					if(length(grep("cellsCount", colnames(df[2]), ignore.case=TRUE)) > 0 ){type <- rep("CELLS COUNT", nrow(df))}
				}
				df$Type <- type
				return(df)
		}
	}
	#--------------------------------------------------------------------------------
	Tests.mapping.testAndDate <- function(df, df.dates){
		testNames <- c("KRAS", "EGFR", "Pulmonary_function", "IDH1", "EML4_ALK", "BRAF", "CEA", "LOCI", "MISMATCHED_PROTEIN",
  					"HPV_P16", "HPV_ISH", "PSA", "BONE_SCAN", "CT_SCAN_AB_PELVIS", "MRI", "HER2", "ESTROGEN", 
  					"PROGESTERONE_RECEPTOR", "CENTROMERE_17")
	    searchKeyWords <- c("kras", "egfr", "pul", "idh1", "elm4Alk", "braf", "cea", "loci", "mismatchProtein", 
	    					"hpvP16", "hpvIsh", "psa", "boneScan", "ctAbPel", "mri", "her2", "estro", "prog", "cent17")
	    test <- NA
	    key <- NA
	    for(i in 1:length(searchKeyWords)) {
	    	if(length(grep(searchKeyWords[i], colnames(df[2]),ignore.case=TRUE)) > 0){
	    		key <- searchKeyWords[i]
	    		test <- testNames[i]
	    	}
	    }
	    if(!missing(df.dates)) {
			if(length(grep(key, colnames(df.dates))) > 0) {
	    		df$Date <- df.dates[,grep(key, colnames(df.dates))]
	    		df$Test <- rep(test, nrow(df))
				return(df)
			}
		}else{
			df$Test <- rep(test, nrow(df))
			return(df)
		}
	}
	#--------------------------------------------------------------------------------
	Tests.mapping.date.Calculation <- function(df){
		df$Date <- format(as.Date(df$dxyear,"%m/%d/%Y") + as.integer(df$Date), "%m/%d/%Y")
		return(df)
	}
	#--------------------------------------------------------------------------------	
} # End of Absent Native Functions
################################################     Step 4: Generate Result    ###########################################
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
######################################    Step 5: Generate Result By Organ Site   #########################################
create.STUDY.records <- function(study_name){
	dob.events <- create.DOB.records(study_name)
	diagnosis.events <- create.Diagnosis.records(study_name)
	chemo.events <- create.Chemo.records(study_name)
	radiation.events <- create.Rad.records(study_name)
	status.events <- create.Status.records(study_name)
	progression.events <- create.Progression.records(study_name)
	absent.events <- create.Absent.records(study_name)
	tests.events <- create.Tests.records(study_name)
	encounter.events <- create.Encounter.records(study_name)
	procedure.events <- create.Procedure.records(study_name)
	pathology.events <- create.Pathology.records(study_name)

	events <- append(dob.events, chemo.events)
    events <- append(events, diagnosis.events)
    events <- append(events, status.events)
    events <- append(events, progression.events)
    events <- append(events, radiation.events)
    events <- append(events, procedure.events)
    events <- append(events, encounter.events)
    events <- append(events, pathology.events)
    events <- append(events, absent.events)
    events <- append(events, tests.events)
    print(table(unlist(lapply(events, function(e) e["Name"]))))
    events
}

brca <- create.STUDY.records(studies[1])
coad <- create.STUDY.records(studies[2])
gbm  <- create.STUDY.records(studies[3])
hnsc <- create.STUDY.records(studies[4])
lgg  <- create.STUDY.records(studies[5])
luad <- create.STUDY.records(studies[6])
lusc <- create.STUDY.records(studies[7])
prad <- create.STUDY.records(studies[8])
read <- create.STUDY.records(studies[9])
sarc <- create.STUDY.records(studies[10])
laml <- create.STUDY.records(studies[11])
blca <- create.STUDY.records(studies[12])
paad <- create.STUDY.records(studies[13])

# run through all studies by Feature
lapply(studies, create.DOB.records)
lapply(studies, create.Diagnosis.records)
lapply(studies, create.Chemo.records) #equipped with filling func
lapply(studies, create.Rad.records) #equipped with filling func
lapply(studies, create.Status.records) #equipped with filling func
lapply(studies, create.Progression.records)
lapply(studies, create.Absent.records)
lapply(studies, create.Procedure.records)
lapply(studies, create.Encounter.records)
lapply(studies, create.Pathology.records) 
lapply(studies, create.Tests.records) 

###########################################    Step 6: UnitTests By Feature  ###############################################
source("TCGAPipelingRefactoring_testingSuite.R")