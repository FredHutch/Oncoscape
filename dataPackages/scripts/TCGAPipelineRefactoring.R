#Reference Table#------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)

stopifnot(file.exists("TCGA_Reference_Filenames.txt")) 
TCGAfilename<-read.table("TCGA_Reference_Filenames.txt", sep="\t", header=TRUE)
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

setClass("tcgaId");
setAs("character","tcgaId", function(from) {
  as.character(str_replace_all(from,"-","." )) 
});
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
  toupper(from)
});
#--------------------------------------------------------------------------------
rawTablesRequest <- function(study, table){
	if(table == "DOB" || table == "Diagnosis"){
		return(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"))
	}
	if(table == "Drug"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),
				 paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$drug, sep="/"),
				 paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$omf, sep="/")))
	}
	if(table == "Radiation"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),
				 paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$rad, sep="/"),
				 paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
			         TCGAfilename[TCGAfilename$study==study,]$omf, sep="/")))
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
		         paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
		               TCGAfilename[TCGAfilename$study==study,]$f1, sep="/")))
	}
	if(table == "Procedure"){
		return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
		               TCGAfilename[TCGAfilename$study==study,]$nte, sep="/"),
		         paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
		               TCGAfilename[TCGAfilename$study==study,]$omf, sep="/"),
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
		         paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
		               TCGAfilename[TCGAfilename$study==study,]$omf, sep="/")))
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
#----------------------     DOB functions Start Here      -----------------------
if(DOB){
	DOB.unique.request <- function(study_name){
	  uri <- rawTablesRequest(study_name, "DOB")
	  df  <- loadData(uri, 
	               list(
	                    'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                    'birth_days_to' = list(name = "dob", data = "character"),
	                    'gender' = list(name = "gender", data = "upperCharacter"),
	                    'ethnicity' = list(name = "ethnicity", data ="upperCharacter"),
	                    'race' = list(name = "race", data = "upperCharacter"),
	                    'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
	                ))
	  unique.dob <- unique(df$dob)
	  unique.gender <- unique(df$gender)
	  unique.ethnicity <- unique(df$ethnicity)
	  unique.race <- unique(df$race)
	  result = list(unique.dob=unique.dob, unique.gender=unique.gender, 
	  				unique.ethnicity=unique.ethnicity, unique.race=unique.race)
	  return(result)
	}
	#--------------------------------------------------------------------------------
	DOB.unique.aggregate <- function(res1, res2){
		res = list(unique.dob=unique(c(res1$unique.dob,res2$unique.dob)),
				   unique.gender=unique(c(res1$unique.gender,res2$unique.gender)),
				   unique.ethnicity=unique(c(res1$unique.ethnicity,res2$unique.ethnicity)),
				   unique.race=unique(c(res1$unique.race, res2$unique.race)))
	    return(res)
	}
	#--------------------------------------------------------------------------------
	DOB.unique.values <- Reduce(DOB.unique.aggregate, lapply(studies, DOB.unique.request))
	DOB.mapping.dob <- function(df){
		from <- DOB.unique.values$unique.race
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$dob <- mapvalues(df$dob, from = from, to = to, warn_missing = F)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	DOB.mapping.dob.Calculation <- function(df){
		df$date <- format(as.Date(df$dxyear, "%m/%d/%Y") + as.integer(df$dob), "%m/%d/%Y")
		return(df)
	}	
	#--------------------------------------------------------------------------------
	DOB.mapping.gender <- function(df){
		from <- DOB.unique.values$unique.race
		to 	 <- from 
		to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]"), to)] <- NA
		df$gender <- mapvalues(df$gender, from = from, to = to, warn_missing = F)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	DOB.mapping.race <- function(df){
		from <- DOB.unique.values$unique.race
		to 	 <- from 
		to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]"), to)] <- NA
		df$race <- mapvalues(df$race, from = from, to = to, warn_missing = F)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	DOB.mapping.ethnicity <- function(df){
		from <- DOB.unique.values$unique.ethnicity 
		to 	 <- from 
		to[match(c("[NOT EVALUATED]","[NOT AVAILABLE]","[UNKNOWN]"), to)] <- NA
		df$ethnicity <- mapvalues(df$ethnicity, from = from, to = to, warn_missing = F)
		return(df)
	}	
} # End of DOB Native Functions
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
		tbl.omf <- loadData(uri[3], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'drug_name' = list(name = "agent", data = "upperCharacter"),
						     'days_to_drug_therapy_start' = list(name = "drugStart", data = "character"),
						     'malignancy_type' = list(name = "intent", data = "upperCharacter")
						   ))

	    # reorganize three tbls 
	    tbl.drug <- rbind.fill(tbl.drug, tbl.omf)
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
	#--------------------------------------------------------------------------------
	Drug.unique.aggregate <- function(res1, res2){
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
	}
	#--------------------------------------------------------------------------------
	Drug.unique.values <- Reduce(Drug.unique.aggregate, lapply(studies, Drug.unique.request))
	Drug.mapping.date <- function(df){
		df$drugStart[which(df$drugStart %in% c("[Not Available]","[Pending]"))] <- NA
		df$drugEnd[which(df$drugEnd == "[Not Available]")] <- NA

		df$start[which(is.na(df$drugStart))] <- NA
		df$end[which(is.na(df$drugEnd))] <- NA
		df[which(is.na(df$dxyear)), c("drugStart","drugEnd")] <- NA
	   
	    df$start <- format(as.Date(df$dxyear, "%m/%d/%Y") + as.integer(df$drugStart), "%m/%d/%Y")
	    df$end <- format(as.Date(df$dxyear, "%m/%d/%Y") + as.integer(df$drugEnd), "%m/%d/%Y")
			
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.agent <- function(df){
		df$agent <- drug_ref[match(df$agent,drug_ref$COMMON.NAMES),]$STANDARDIZED.NAMES	
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
		tbl.omf <- loadData(uri[3], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'radiation_tx_extent' = list(name = "target", data = "upperCharacter"),
						     'rad_tx_to_site_of_primary_tumor' = list(name = "targetAddition", data = "upperCharacter"),
						     'days_to_radiation_therapy_start' = list(name = "radStart", data = "character")
						   ))

	    # reorganize three tbls 
	    tbl.rad <- rbind.fill(tbl.rad, tbl.omf)
	    data.Rad <- merge(tbl.rad, tbl.pt, by = "PatientID", all.x = T)
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
	#--------------------------------------------------------------------------------
	Rad.unique.aggregate <- function(res1, res2){
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
		tbl.f1 <- loadData(uri[2], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'vital_status' = list(name = "vital", data = "upperCharacter"),
						     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
						     'last_contact_days_to' = list(name = "lastContact", data = "upperCharacter"),
						     'death_days_to' = list(name = "deathDate", data = "upperCharacter")
						   ))

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
			tbl.f2 <- loadData(uri[4], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'vital_status' = list(name = "vital", data = "upperCharacter"),
						     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
						     'last_contact_days_to' = list(name = "lastContact", data = "upperCharacter"),
						     'death_days_to' = list(name = "deathDate", data = "upperCharacter")
						   ))
		}

		tbl.f <- rbind.fill(tbl.pt, tbl.f1)
		if(exists("tbl.f2")) tbl.f <- rbind.fill(tbl.f, tbl.f2)
		if(exists("tbl.f3")) tbl.f <- rbind.fill(tbl.f, tbl.f3)

		df <- tbl.f
		unique.deathDate <- unique(df$deathDate)
		unique.lastContact <- unique(df$lastContact)
	  	unique.vital <- unique(df$vital)
	  	unique.tumorStatus <- unique(df$tumorStatus)
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
} # End of Status Native Functions
if(PROGRESSION){
	Progression.unique.request <- function(study_name){
	  	uri <- rawTablesRequest(study_name, "Progression")
	  	rm(list=ls(pattern="tbl"))
	  	tbl.pt <- loadData(uri[1], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
						   ))
		tbl.f1 <- loadData(uri[2], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "upperCharacter"),
						     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
						     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
						   ))
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
		
		tbl.f <- tbl.nte
		if(exists("tbl.f1")) tbl.f <- rbind.fill(tbl.f, tbl.f1)
		if(exists("tbl.f2")) tbl.f <- rbind.fill(tbl.f, tbl.f2)
		if(exists("tbl.nte_f1")) tbl.f <- rbind.fill(tbl.f, tbl.nte_f1)
		df <- merge(tbl.f, tbl.pt)

		unique.newTumor <- unique(df$newTumor)
		unique.newTumorDate <- unique(df$newTumorDate)
	   	result = list(unique.newTumor=unique.newTumor, unique.newTumorDate=unique.newTumorDate)
	  	return(result)
	}
	#--------------------------------------------------------------------------------
	Progression.unique.aggregate <- function(res1, res2){
		res = list(unique.newTumor=unique(c(res1$unique.newTumor,res2$unique.newTumor)),
				   unique.newTumorDate=unique(c(res1$unique.newTumorDate, res2$unique.newTumorDate)))
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
	                               list(
	                                 'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
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
	                         #'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), #(in brca,hnsc but not being collected...)
	                         'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date", data = "upperCharacter"), #(only in gbm,coad,read)
	                         'new_neoplasm_event_type'  = list(name = "site", data = "upperCharacter"), #(only in gbm, coad, read)
	                         'new_tumor_event_type'  = list(name = "site", data = "upperCharacter") #(only in hnsc, prad, luad, lusc)
	                         #'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") #(gbm,coad,read but not being collected...) YES/NO
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
	    	
	    if(!("pulInd" %in%  colnames(tbl.pt))) tbl.pt$pulInd = rep(NA, nrow(tbl.pt))
	    tbl <- rbind.fill(tbl.pt[,c("PatientID", "pulInd")], tbl.omf)
	    if(exists("tbl.nte")) tbl <- rbind.fill(tbl, tbl.nte)
	    if(exists("tbl.f1")) tbl <- rbind.fill(tbl, tbl.f1)
	    if(exists("tbl.f2")) tbl <- rbind.fill(tbl, tbl.f2)
	    if(exists("tbl.f3")) tbl <- rbind.fill(tbl, tbl.f3)
	    if(exists("tbl.nte_f1")) tbl <- rbind.fill(tbl, tbl.nte_f1)
	    df <- merge(tbl.pt[,c("PatientID", "dxyear"),], tbl)
	   
		unique.omfdx <- unique(df$omfdx)
		unique.radInd <- unique(df$radInd)
		unique.drugInd <- unique(df$drugInd)
		unique.pulInd <- unique(df$pulInd)
	   	result = list(unique.omfdx=unique.omfdx, unique.radInd=unique.radInd,
	   		   		  unique.drugInd=unique.drugInd, unique.pulInd=unique.pulInd)
	  	return(result)
	}
	#--------------------------------------------------------------------------------
	Absent.unique.aggregate <- function(res1, res2){
		res = list(unique.omfdx=unique(c(res1$unique.omfdx,res2$unique.omfdx)),
				   unique.radInd=unique(c(res1$unique.radInd, res2$unique.radInd)),
				   unique.drugInd=unique(c(res1$unique.drugInd, res2$unique.drugInd)),
				   unique.pulInd=unique(c(res1$unique.pulInd, res2$unique.pulInd)))
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
					return(df)
				}
			}
			if(!exists("type")){
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
			}
	
			df$Type <- rep(type, nrow(df))
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
				    'birth_days_to' = list(name = "dob", data = "character"),
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
	tbl.pt <- loadData(uri[1], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
					   ))
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
	tbl.omf <- loadData(uri[3], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'drug_name' = list(name = "agent", data = "upperCharacter"),
					     'days_to_drug_therapy_start' = list(name = "drugStart", data = "character"),
					     'malignancy_type' = list(name = "intent", data = "upperCharacter")
					   ))

    # reorganize three tbls 
    tbl.drug <- rbind.fill(tbl.drug, tbl.omf)
    data.Chemo <- merge(tbl.drug, tbl.pt, by = "PatientID", all.x = T)
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
#--------------------------------------------------------------------------------------------------------------------------
create.Rad.records <- function(study_name,  ptID){
	uri <- rawTablesRequest(study_name, "Radiation")
	rm(list=ls(pattern="tbl"))
	tbl.pt <- loadData(uri[1], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
					   ))
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
	tbl.omf <- loadData(uri[3], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'radiation_tx_extent' = list(name = "target", data = "upperCharacter"),
					     'rad_tx_to_site_of_primary_tumor' = list(name = "targetAddition", data = "upperCharacter"),
					     'days_to_radiation_therapy_start' = list(name = "radStart", data = "character")
					   ))

    # reorganize three tbls 
    tbl.rad <- rbind.fill(tbl.rad, tbl.omf)
    data.Rad <- merge(tbl.rad, tbl.pt, by = "PatientID", all.x = T)
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
	tbl.f1 <- loadData(uri[2], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'vital_status' = list(name = "vital", data = "upperCharacter"),
					     'tumor_status' = list(name = "tumorStatus", data = "upperCharacter"),
					     'last_contact_days_to' = list(name = "lastContact", data = "upperCharacter"),
					     'death_days_to' = list(name = "deathDate", data = "upperCharacter")
					   ))

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

	tbl.f <- rbind.fill(tbl.pt[,c("PatientID","vital","tumorStatus","lastContact","deathDate")], tbl.f1)
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
	data.Status <- data.Status[,c("PatientID", "vital", "tumorStatus", "dxyear", "date")]
	data.Status <- data.Status[-which(duplicated(data.Status)),]

	#more computation to determine the most recent contacted/death date, then find the matching vital & tumorStatus
	#need group function by patient and determin.
	#recentDatetbl <- aggregate(date ~ PatientID, data.Status, function(x){max(x)})
	

 	recentTbl <- c()

 	for(i in 1:nrow(tbl.pt)){
 		tmpDF <- subset(data.Status, PatientID == tbl.pt$PatientID[i], select = c(PatientID, vital, tumorStatus, dxyear, as.integer(date)))
 		tmpDF <- tmpDF[order(as.integer(tmpDF$date), decreasing=TRUE, na.last=TRUE),]
 		if(nrow(tmpDF[which(tmpDF$date == tmpDF[1,]$date), ]) > 1){
 			tmpDup <- tmpDF[which(tmpDF$date == tmpDF[1,]$date), ]
 			tmpDF[1, "vital"] 		= 	ifelse(any(duplicated(tmpDup[,"vital"])), tmpDup[1, "vital"], paste(tmpDup[, "vital"]))
			tmpDF[1, "tumorStatus"] = 	ifelse(any(duplicated(tmpDup[,"tumorStatus"])), tmpDup[1, "tumorStatus"], paste(tmpDup[, "tumorStatus"], collapse=";"))
 		}
		recentTbl <- rbind.fill(recentTbl, tmpDF[1,])
 	}

 	data.Status <- Status.mapping.date.Calculation(recentTbl)

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
	tbl.f1 <- loadData(uri[2], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "upperCharacter"),
					     'new_neoplasm_event_type' = list(name = "newTumor", data = "upperCharacter"),
					     'new_tumor_event_type' = list(name = "newTumor", data = "upperCharacter")
					   ))
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
	
	tbl.f <- tbl.nte
	if(exists("tbl.f1")) tbl.f <- rbind.fill(tbl.f, tbl.f1)
	if(exists("tbl.f2")) tbl.f <- rbind.fill(tbl.f, tbl.f2)
	if(exists("tbl.nte_f1")) tbl.f <- rbind.fill(tbl.f, tbl.nte_f1)
	data.Progression <- Progression.mapping.newTumor(tbl.f)
	data.Progression <- Progression.mapping.newTumorDate(data.Progression)
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
    	
    if(!("pulInd" %in%  colnames(tbl.pt))) tbl.pt$pulInd = rep(NA, nrow(tbl.pt))
    
    tbl <- rbind.fill(tbl.pt[,c("PatientID", "pulInd")], tbl.omf)
    if(exists("tbl.nte")) tbl <- rbind.fill(tbl, tbl.nte)
    if(exists("tbl.f1")) tbl <- rbind.fill(tbl, tbl.f1)
    if(exists("tbl.f2")) tbl <- rbind.fill(tbl, tbl.f2)
    if(exists("tbl.f3")) tbl <- rbind.fill(tbl, tbl.f3)
    if(exists("tbl.nte_f1")) tbl <- rbind.fill(tbl, tbl.nte_f1)
    tbl <- merge(tbl.pt[,c("PatientID", "dxyear"),], tbl)
    tbl$date = rep(NA, nrow(tbl))
    data.Absent <- Absent.mapping.omfdx(tbl)
    data.Absent <- Absent.mapping.omfdx.Calculation(data.Absent)
    data.Absent <- Absent.mapping.radInd(data.Absent)
    data.Absent <- Absent.mapping.drugInd(data.Absent)
    data.Absent <- Absent.mapping.pulInd(data.Absent)
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

 	ptNumMap <- ptNumMapUpdate(tbl.pt)
 	if(missing(ptID)){
 		result <- apply(data.Absent, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "date")
    				rad = getElement(x, "radInd")
    				drug = getElement(x, "drugInd")
    				pul = getElement(x, "pulInd")
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
    				pul = getElement(x, "pulInd")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Absent", 
    				 			Fields=list(date=date, Radiation=rad, Drug=drug, Pulmonary=pul)))
    				})
		print(result)
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
	    
	    #data.Tests$Result <- str_replace_all(data.Tests$Result,"^/","")

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
				print(result)
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

# run through all studies by Feature
lapply(studies, create.DOB.records)
lapply(studies, create.Diagnosis.records)
lapply(studies, create.Chemo.records)
lapply(studies, create.Rad.records)
lapply(studies, create.Status.records)
lapply(studies, create.Progression.records)
lapply(studies, create.Absent.records)
lapply(studies, create.Procedure.records)
lapply(studies, create.Encounter.records)
lapply(studies, create.Pathology.records) 
lapply(studies, create.Tests.records) 

###########################################    Step 6: UnitTests By Feature  ###############################################
test_create.DOB.records <- function(study_name)
{
  print("--- test_create.DOB.record")
  if(study_name == "TCGAbrca"){
		x <- create.DOB.records(study_name, "TCGA.A1.A0SI")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.A1.A0SI", PtNum=15, study="TCGAbrca", Name="Birth", Fields=list(date="04/19/1954", gender="FEMALE", race="WHITE", ethnicity= "NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.A2.A259")[[1]]
		checkEquals(x, list(PatientID="TCGA.A2.A259", PtNum=100, study="TCGAbrca", Name="Birth", Fields=list(date="09/24/1936", gender="FEMALE", race="BLACK OR AFRICAN AMERICAN", ethnicity= "NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.HN.A2NL")[[1]]
		checkEquals(x, list(PatientID="TCGA.HN.A2NL", PtNum=1009, study="TCGAbrca", Name="Birth", Fields=list(date=as.character(NA), gender="FEMALE", race=as.character(NA), ethnicity=as.character(NA))))
  	}
  if(study_name == "TCGAcoad"){
		x <- create.DOB.records(study_name, "TCGA.A6.2682")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.A6.2682", PtNum=15, study="TCGAcoad", Name="Birth", Fields=list(date="09/08/1938", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.A6.2680")[[1]]
		checkEquals(x, list(PatientID="TCGA.A6.2680", PtNum=13, study="TCGAcoad", Name="Birth", Fields=list(date="05/11/1936", gender="FEMALE", race="BLACK OR AFRICAN AMERICAN", ethnicity="NOT HISPANIC OR LATINO")))
  	}
  if(study_name == "TCGAgbm"){
		x <- create.DOB.records(study_name, "TCGA.02.0037")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.02.0037", PtNum=15, study="TCGAgbm", Name="Birth", Fields=list(date="11/27/1929", gender="FEMALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.02.0033")[[1]]
		checkEquals(x, list(PatientID="TCGA.02.0033", PtNum=13, study="TCGAgbm", Name="Birth", Fields=list(date="01/20/1948", gender="MALE", race="WHITE", ethnicity=as.character(NA))))
  	}
  if(study_name == "TCGAhnsc"){
		x <- create.DOB.records(study_name, "TCGA.BA.5559")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.BA.5559", PtNum=15, study="TCGAhnsc", Name="Birth", Fields=list(date="01/13/1934", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.CN.6017")[[1]]
		checkEquals(x, list(PatientID="TCGA.CN.6017", PtNum=100, study="TCGAhnsc", Name="Birth", Fields=list(date="04/07/1954", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
  	}
  if(study_name == "TCGAlgg"){
		x <- create.DOB.records(study_name, "TCGA.CS.6290")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.CS.6290", PtNum=1, study="TCGAlgg", Name="Birth", Fields=list(date="01/23/1977", gender="MALE", race=as.character(NA), ethnicity=as.character(NA))))
		x <- create.DOB.records(study_name, "TCGA.W9.A837")[[1]]
		checkEquals(x, list(PatientID="TCGA.W9.A837", PtNum=425, study="TCGAlgg", Name="Birth", Fields=list(date=as.character(NA), gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
  	}
  if(study_name == "TCGAluad"){
		x <- create.DOB.records(study_name, "TCGA.05.4405")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.05.4405", PtNum=15, study="TCGAluad", Name="Birth", Fields=list(date="06/03/1931", gender="FEMALE", race=as.character(NA), ethnicity=as.character(NA))))
		x <- create.DOB.records(study_name, "TCGA.49.4486")[[1]]
		checkEquals(x, list(PatientID="TCGA.49.4486", PtNum=100, study="TCGAluad", Name="Birth", Fields=list(date="09/06/1919", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
	}
  if(study_name == "TCGAlusc"){
		x <- create.DOB.records(study_name, "TCGA.18.4086")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.18.4086", PtNum=15, study="TCGAlusc", Name="Birth", Fields=list(date="01/12/1944", gender="MALE", race=as.character(NA), ethnicity=as.character(NA))))
		x <- create.DOB.records(study_name, "TCGA.34.5231")[[1]]
		checkEquals(x, list(PatientID="TCGA.34.5231", PtNum=100, study="TCGAlusc", Name="Birth", Fields=list(date="05/19/1933", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.63.A5MR")[[1]] #race == "[Not Evaluated]", diagnosis.year == "[Not Available]"
		checkEquals(x, list(PatientID="TCGA.63.A5MR", PtNum=269, study="TCGAlusc", Name="Birth", Fields=list(date=as.character(NA), gender="FEMALE", race=as.character(NA), ethnicity=as.character(NA))))
	}
  if(study_name == "TCGAprad"){
		x <- create.DOB.records(study_name, "TCGA.CH.5740")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.CH.5740", PtNum=15, study="TCGAprad", Name="Birth", Fields=list(date="11/02/1951", gender="MALE", race="WHITE", ethnicity= "NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.EJ.7789")[[1]]
		checkEquals(x, list(PatientID="TCGA.EJ.7789", PtNum=100, study="TCGAprad", Name="Birth", Fields=list(date="12/31/1944", gender="MALE", race="BLACK OR AFRICAN AMERICAN", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.V1.A8MF")[[1]]
		checkEquals(x, list(PatientID="TCGA.V1.A8MF", PtNum=367, study="TCGAprad", Name="Birth", Fields=list(date=as.character(NA), gender="MALE", race=as.character(NA), ethnicity=as.character(NA))))
	}
  if(study_name == "TCGAread"){
		x <- create.DOB.records(study_name, "TCGA.AF.6672")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.AF.6672", PtNum=15, study="TCGAread", Name="Birth", Fields=list(date="04/17/1967", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.AF.6136")[[1]]
		checkEquals(x, list(PatientID="TCGA.AF.6136", PtNum=13, study="TCGAread", Name="Birth", Fields=list(date="06/23/1938", gender="FEMALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
	}
}
lapply(studies, test_create.DOB.records)
#--------------------------------------------------------------------------------------------------------------------------  
test_create.Diagnosis.records <- function(study_name)
{
  print("--- test_create.Diagnosis.record")
  if(study_name == "TCGAbrca"){
		x <- create.Diagnosis.records(study_name, "TCGA.3C.AAAU")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Diagnosis", Fields=list(date="01/01/2004", disease="BREAST", siteCode="3C")))
   	}
  if(study_name == "TCGAcoad"){
		x <- create.Diagnosis.records(study_name, "TCGA.3L.AA1B")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.3L.AA1B", PtNum=1, study="TCGAcoad", Name="Diagnosis", Fields=list(date="01/01/2013", disease="COLON", siteCode="3L")))
	}
  if(study_name == "TCGAgbm"){
		x <- create.Diagnosis.records(study_name, "TCGA.02.0001")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study="TCGAgbm", Name="Diagnosis", Fields=list(date="01/01/2002", disease="BRAIN", siteCode="02")))
	}
  if(study_name == "TCGAhnsc"){
		x <- create.Diagnosis.records(study_name,  "TCGA.4P.AA8J")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.4P.AA8J", PtNum=1, study="TCGAhnsc", Name="Diagnosis", Fields=list(date="01/01/2013", disease="HEAD AND NECK", siteCode="4P")))
 	}
  if(study_name == "TCGAlgg"){
		x <- create.Diagnosis.records(study_name,  "TCGA.CS.6290")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study_name, Name="Diagnosis", Fields=list(date="01/01/2009", disease="CENTRAL NERVOUS SYSTEM", siteCode="CS")))
    }
  if(study_name == "TCGAluad"){
		x <- create.Diagnosis.records(study_name,  "TCGA.05.4244")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.05.4244", PtNum=1, study=study_name, Name="Diagnosis", Fields=list(date="01/01/2009", disease="LUNG", siteCode="05")))
	}
  if(study_name == "TCGAlusc"){
		x <- create.Diagnosis.records(study_name,  "TCGA.18.3406")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.18.3406", PtNum=1, study=study_name, Name="Diagnosis", Fields=list(date= "01/01/2003", disease="LUNG", siteCode="18")))
		x <- create.Diagnosis.records(study_name,  "TCGA.63.A5MI") #diagnosis. year == "[Not Available]"
		checkEquals(x[[1]], list(PatientID="TCGA.63.A5MI", PtNum=263, study=study_name, Name="Diagnosis", Fields=list(date=as.character(NA), disease="LUNG", siteCode="63")))
	}
  if(study_name == "TCGAprad"){
		x <- create.Diagnosis.records(study_name,  "TCGA.2A.A8VL")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study="TCGAprad", Name="Diagnosis", Fields=list(date="01/01/2010", disease="PROSTATE", siteCode="2A")))
	}
  if(study_name == "TCGAread"){
		x <- create.Diagnosis.records(study_name,  "TCGA.AF.2687")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID= "TCGA.AF.2687", PtNum=1, study=study_name, Name="Diagnosis", Fields=list(date="01/01/2009", disease="RECTUM", siteCode= "AF")))
	}
}
lapply(studies, test_create.Diagnosis.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Chemo.records <- function(study_name)
{
  print("--- test_create.Chemo.record")
  if(study_name == "TCGAbrca"){
		x <- create.Chemo.records(study_name, "TCGA.3C.AAAU")
		checkTrue(is.list(x))
		checkEquals(length(x), 1)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Drug", 
						Fields=list(date=c("01/02/2009",NA), agent="GOSERELIN",therapyType="CHEMOTHERAPY",  
							       intent=as.character(NA), dose=as.character(NA), units=as.character(NA), 
							       totalDose=as.character(NA), totalDoseUnits=as.character(NA), route=as.character(NA), 
							       cycle=as.character(NA))))

		x <- create.Chemo.records(study_name, "TCGA.C8.A8HR") # recurrence
		checkTrue(is.list(x))
		checkEquals(length(x), 3)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x[[3]], list(PatientID="TCGA.C8.A8HR", PtNum=711, study="TCGAbrca", Name="Drug", 
						Fields=list(date=c("02/13/2013", "08/26/2013"), agent="FLUOROURACIL", therapyType="CHEMOTHERAPY",  
									intent=as.character(NA), dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
      	}
  if(study_name == "TCGAcoad"){
		x <- create.Chemo.records(study_name, "TCGA.A6.2671")
		checkTrue(is.list(x))
		checkEquals(length(x), 22)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[16]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[15]], list(PatientID="TCGA.A6.2671", PtNum=5, study="TCGAcoad", Name="Drug", 
						Fields=list(date=c("07/06/2010","01/10/2011"), agent="BEVACIZUMAB",therapyType="TARGETED MOLECULAR THERAPY",  
							       intent="PROGRESSION", dose="300-325", units="MG", 
							       totalDose="3775", totalDoseUnits="MG", route="INTRAVENOUS (IV)", 
							       cycle="12")))

		x <- create.Chemo.records(study_name, "TCGA.A6.A565")  #no start date
		checkEquals(length(x), 3)
		checkEquals(x[[1]], list(PatientID="TCGA.A6.A565", PtNum=51, study="TCGAcoad", Name="Drug", 
						Fields=list(date=c(as.character(NA), as.character(NA)), agent="FLUOROURACIL", therapyType="CHEMOTHERAPY", 
							        intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), 
							        totalDose=as.character(NA), totalDoseUnits=as.character(NA), route=as.character(NA), 
							        cycle=as.character(NA))))

		x <- create.Chemo.records(study_name, "TCGA.AA.3516") # omf chemo
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.AA.3516", PtNum=68, study="TCGAcoad", Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)),agent=as.character(NA),  
										therapyType=as.character(NA), intent="PRIOR MALIGNANCY", dose=as.character(NA), 
										units=as.character(NA), totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
										route=as.character(NA), cycle=as.character(NA))))

		}
  if(study_name == "TCGAgbm"){
		x <- create.Chemo.records(study_name, "TCGA.02.0001")
		checkTrue(is.list(x))
		checkEquals(length(x), 4)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Drug", 
							Fields=list(date=c("04/03/2002", "10/06/2002"),  agent="CELEBREX", therapyType="CHEMOTHERAPY", 
										intent="ADJUVANT"  , dose=as.character(NA), units=as.character(NA) , totalDose="400", totalDoseUnits="MG", 
										route=as.character(NA), cycle="4")))
		checkEquals(x[[2]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Drug", 
							Fields=list(date=c("04/03/2002", "10/06/2002"),  agent="CRA", therapyType="CHEMOTHERAPY", 
										intent="ADJUVANT"  , dose=as.character(NA), units=as.character(NA), totalDose="75",  
										totalDoseUnits="MG/M2", route=as.character(NA), cycle="4")))
		checkEquals(x[[3]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)), agent="CRA", therapyType="CHEMOTHERAPY",  
										intent="RECURRENCE", dose=as.character(NA), units=as.character(NA) , totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route="ORAL", cycle=as.character(NA))))
		checkEquals(x[[4]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)),  agent="CELEBREX", therapyType="CHEMOTHERAPY", 
										intent="RECURRENCE", dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route="ORAL", cycle=as.character(NA))))

		x <- create.Chemo.records(study_name, "TCGA.76.4928")  #no start date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.76.4928", PtNum=559, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), "03/12/2005"),  agent="TEMOZOLOMIDE", therapyType="CHEMOTHERAPY", 
										intent="ADJUVANT"  , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route="ORAL", cycle="01")))
		x <- create.Chemo.records(study_name, "TCGA.02.0014")  # no end date
		checkEquals(length(x), 2)
		checkEquals(x[[2]], list(PatientID="TCGA.02.0014", PtNum=8, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)),  agent="TEMOZOLOMIDE", therapyType="CHEMOTHERAPY",
										intent="RECURRENCE" , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route="ORAL", cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.06.0209")  # omf chemo
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.06.0209", PtNum=372, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)),  agent=as.character(NA), therapyType=as.character(NA),
										intent="PRIOR MALIGNANCY", dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route=as.character(NA), cycle=as.character(NA))))
      	}
  if(study_name == "TCGAhnsc"){
		x <- create.Chemo.records(study_name, "TCGA.BA.4075")
		checkTrue(is.list(x))
		checkEquals(length(x), 3)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study_name, Name="Drug", 
						Fields=list(date=c("09/21/2004","10/19/2004"), agent="CARBOPLATIN", therapyType="CHEMOTHERAPY", 
									intent="PALLIATIVE"  , dose="2", units="AUC",totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA) , route=as.character(NA), cycle=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study_name, Name="Drug", 
						Fields=list(date=c("09/21/2004","10/19/2004"), agent="PACLITAXEL",therapyType="CHEMOTHERAPY", 
									intent="PALLIATIVE"  , dose="45", units="MG/M2",totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA) , route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.CR.6474")  #no start date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.CR.6474", PtNum=185, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent=as.character(NA), therapyType="CHEMOTHERAPY", 
									intent="PALLIATIVE", dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.KU.A6H8") # no end date
		checkEquals(length(x), 3)
		checkEquals(x[[3]], list(PatientID="TCGA.KU.A6H8", PtNum=452, study=study_name, Name="Drug", 
						Fields=list(date=c("07/30/2013", NA), agent="CARBOPLATIN", therapyType="CHEMOTHERAPY", 
							 		intent=as.character(NA),dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA) , route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.CV.5430") # recurrence
		checkEquals(length(x), 3)
		checkEquals(x[[3]], list(PatientID="TCGA.CV.5430", PtNum=229, study=study_name, Name="Drug", 
						Fields=list(date=c("06/30/2003","08/30/2003"),agent="IRINOTECAN", therapyType="CHEMOTHERAPY", 
									intent="RECURRENCE",dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA), route="INTRAVENOUS (IV)", cycle="4")))
		x <- create.Chemo.records(study_name, "TCGA.BA.4075") # omf chemo
		checkEquals(length(x),3)
		checkEquals(x[[1]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study_name, Name="Drug", 
						Fields=list(date=c("09/21/2004", "10/19/2004"), agent="CARBOPLATIN", therapyType="CHEMOTHERAPY", 
								intent="PALLIATIVE" , dose="2", units="AUC", totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
								route=as.character(NA), cycle=as.character(NA))))
		}
  if(study_name == "TCGAlgg"){
		x <- create.Chemo.records(study_name, "TCGA.CS.6290")
		checkTrue(is.list(x))
		checkEquals(length(x), 1)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),"05/20/2010"),  agent="TEMOZOLOMIDE", therapyType="CHEMOTHERAPY", 
									intent="ADJUVANT"  , dose="400", units="MG", totalDose=as.character(NA), totalDoseUnits= as.character(NA), 
									route="ORAL", cycle="12")))

		x <- create.Chemo.records(study_name, "TCGA.DU.6402")
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.DU.6402", PtNum=20, study=study_name, Name="Drug", 
						Fields=list(date=c("04/28/1998", "05/03/1998"), agent="TEMOZOLOMIDE", therapyType="CHEMOTHERAPY", 
									intent="PROGRESSION"  , dose="100", units="MG/M2", totalDose="200", 
									totalDoseUnits="MG", route="ORAL", cycle="01")))

		}
  if(study_name == "TCGAluad"){
		x <- create.Chemo.records(study_name, "TCGA.75.7030")
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[2]], list(PatientID="TCGA.75.7030", PtNum=336, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent="VINORELBINE",  therapyType="CHEMOTHERAPY", 
									intent="ADJUVANT", dose="46", units="MG/DAY", totalDose="552", totalDoseUnits="MG", 
									route="INTRAVENOUS (IV)", cycle="4")))
		checkEquals(x[[1]], list(PatientID="TCGA.75.7030", PtNum=336, study=study_name, Name="Drug",
						 Fields=list(date=c(as.character(NA),as.character(NA)), agent="CISPLATIN", therapyType="CHEMOTHERAPY", 
						             intent="ADJUVANT"  , dose="92", units="MG/DAY", totalDose="736",  totalDoseUnits="MG", route="INTRAVENOUS (IV)", cycle="4")))


		x <- create.Chemo.records(study_name, "TCGA.95.7039") #no start date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.95.7039", PtNum=432, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent=as.character(NA), therapyType=as.character(NA), 
									intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.05.4424")  # no end date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.05.4424", PtNum=22, study=study_name, Name="Drug", 
						Fields=list(date=c("11/30/2009", NA), agent="ERLOTINI", therapyType="IMMUNOTHERAPY", 
									intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.38.7271") # recurrence
		checkEquals(length(x), 4)
		checkEquals(x[[1]], list(PatientID="TCGA.38.7271", PtNum=49, study=study_name, Name="Drug", 
						Fields=list(date=c( "07/29/2007", "07/29/2007"),  agent="CARBOPLATIN", therapyType="CHEMOTHERAPY",
									intent="PALLIATIVE", dose=as.character(NA), units=as.character(NA), totalDose="798", totalDoseUnits="MG", 
									route="INTRAVENOUS (IV)", cycle="1")))
		x <- create.Chemo.records(study_name, "TCGA.05.4245") # omf chemo
		checkEquals(x[[1]], list(PatientID="TCGA.05.4245", PtNum=2, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent=as.character(NA), therapyType=as.character(NA), 
									intent="PRIOR MALIGNANCY" ,dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		}
  if(study_name == "TCGAlusc"){
		x <- create.Chemo.records(study_name, "TCGA.18.3412")
		checkTrue(is.list(x))
		checkEquals(length(x), 3)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[3]], list(PatientID="TCGA.18.3412", PtNum=7, study=study_name, Name="Drug", 
					Fields=list(date=c("02/25/2005","04/28/2005"), agent="VINORELBINE", therapyType="CHEMOTHERAPY", 
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.NC.A5HT") #no start date
		checkEquals(length(x), 4)
		checkEquals(x[[3]], list(PatientID="TCGA.NC.A5HT", PtNum=483, study=study_name, Name="Drug", 
					Fields=list(date=c("08/01/2013", "11/08/2013"), agent="CARBOPLATIN", therapyType="CHEMOTHERAPY", 
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
      	}
  if(study_name == "TCGAprad"){
		x <- create.Chemo.records(study_name, "TCGA.V1.A8MU")
		checkTrue(is.list(x))
		checkEquals(length(x), 1)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.V1.A8MU", PtNum=373, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent= "LHRH AGONIST", therapyType="HORMONE THERAPY",
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
    
      	}
  if(study_name == "TCGAread"){
		x <- create.Chemo.records(study_name, "TCGA.AF.A56N")
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID= "TCGA.AF.A56N", PtNum=18, study=study_name, Name="Drug", 
						Fields=list(date=c("06/08/2012", "12/13/2012"), agent="XELODA", therapyType="CHEMOTHERAPY", 
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
    

		x <- create.Chemo.records(study_name, "TCGA.AG.3999")  #no start date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.AG.3999", PtNum=67, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent=as.character(NA), therapyType="CHEMOTHERAPY", 
									intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.DC.6156")  # no end date
		checkEquals(length(x), 9)
		checkEquals(x[[7]], list(PatientID="TCGA.DC.6156", PtNum=122, study=study_name, Name="Drug", 
						Fields=list(date=c("01/01/2011", as.character(NA)), agent="LEUCOVORIN", therapyType="CHEMOTHERAPY", 
									intent="PALLIATIVE", dose="100", units="MG", totalDose="740", 
									totalDoseUnits="MG", route="INTRAVENOUS (IV)", cycle="8")))

		x <- create.Chemo.records(study_name, "TCGA.AF.3913")   # omf chemo
		checkEquals(length(x), 3)
		checkEquals(x[[1]], list(PatientID= "TCGA.AF.3913", PtNum=9, study=study_name, Name="Drug",
						Fields=list(date=c( "08/20/2009", "11/10/2009"), agent="OXALIPLATIN", therapyType="CHEMOTHERAPY",   
									intent="PALLIATIVE", dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route="INTRAVENOUS (IV)", cycle="3")))
   
      	}
}
lapply(studies, test_create.Chemo.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Rad.records <- function(study_name)
{
  print("--- test_create.Rad.record")
  if(study_name == "TCGAbrca"){
		x <- create.Rad.records(study_name, "TCGA.HN.A2OB")
		checkTrue(is.list(x)) 
		checkEquals(x[[1]], list(PatientID="TCGA.HN.A2OB", PtNum=1010, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA),as.character(NA)), therapyType="EXTERNAL", 
							intent=as.character(NA), target="PRIMARY TUMOR FIELD", totalDose="5000", 
							totalDoseUnits="CGY", numFractions="25")))

		x <- create.Rad.records(study_name, "TCGA.D8.A1JG") # TotalDose = "42.5 + 10" 
		checkEquals(x[[1]], list(PatientID="TCGA.D8.A1JG", PtNum=730, study=study_name, Name="Radiation", 
							Fields=list(date=c( "05/12/2010", "06/06/2010"), therapyType="EXTERNAL BEAM", 
							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="42.5+10", totalDoseUnits="CGY", numFractions="21")))

		x <- create.Rad.records(study_name, "TCGA.BH.A0AU")# radType == "[Unknown]"
		checkEquals(x[[1]], list(PatientID="TCGA.BH.A0AU", PtNum=513, study=study_name, Name="Radiation", 
							Fields=list(date=c( "03/06/2008", as.character(NA)), therapyType=as.character(NA), 
							intent=as.character(NA), target=as.character(NA), totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
							numFractions=as.character(NA))))
	}
  if(study_name == "TCGAcoad"){
		x <- create.Rad.records(study_name, "TCGA.AA.3713")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x[[1]], list(PatientID="TCGA.AA.3713", PtNum=123, study=study_name, Name="Radiation", 
							Fields=list(date=c("10/03/2005","11/03/2005"), therapyType="EXTERNAL", 
							intent=as.character(NA), target="PRIMARY TUMOR FIELD", totalDose="5000", 
							totalDoseUnits="CGY", numFractions=as.character(NA))))

		x <- create.Rad.records(study_name, "TCGA.AD.6901")  #no units
		checkEquals(x[[1]], list(PatientID="TCGA.AD.6901", PtNum=237, study=study_name, Name="Radiation", 
							Fields=list(date=c("05/03/2012", "05/18/2012"), therapyType="EXTERNAL", 
							intent=as.character(NA), target= "DISTANT RECURRENCE", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))

		x <- create.Rad.records(study_name, "TCGA.DM.A285") #tbl.omf
		checkEquals(x[[1]], list(PatientID="TCGA.DM.A285", PtNum=385, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA),as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
							target="LOCOREGIONAL, AT PRIMARY TUMOR SITE: NO", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
	}
  if(study_name == "TCGAgbm"){
		x <- create.Rad.records(study_name, "TCGA.02.0001")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/19/2002", "03/22/2002"), therapyType="EXTERNAL BEAM", 
							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="4500", totalDoseUnits="CGY", numFractions="20")))

		x <- create.Rad.records(study_name, "TCGA.06.0152")  #no start date
		checkEquals(x[[1]], list(PatientID="TCGA.06.0152", PtNum=513, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA), "05/04/1995"), therapyType="EXTERNAL BEAM",
						    intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose=as.character(NA), 
						    totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		x <- create.Rad.records(study_name, "TCGA.32.4213") # mCi
		checkEquals(x[[1]], list(PatientID="TCGA.32.4213", PtNum=504, study=study_name, Name="Radiation", 
							Fields=list(date=c("01/25/2009", "03/09/2009"), therapyType="EXTERNAL BEAM",
						    intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="6000", totalDoseUnits="CGY", numFractions="30")))
		checkEquals(x[[2]], list(PatientID="TCGA.32.4213", PtNum=504, study=study_name, Name="Radiation", 
							Fields=list(date=c("12/18/2009", "12/18/2009"), therapyType="RADIOISOTOPES", 
							intent="PROGRESSION", target="LOCAL RECURRENCE", totalDose="71", totalDoseUnits="MCI", numFractions="1")))

		x <- create.Rad.records(study_name, "TCGA.32.2494") #no units
		checkEquals(x[[1]], list(PatientID="TCGA.32.2494", PtNum=498, study=study_name, Name="Radiation", 
							Fields=list(date=c("01/22/2008", "03/03/2008"), therapyType="EXTERNAL BEAM", 
							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="6000", totalDoseUnits="CGY", numFractions="30")))
		checkEquals(x[[3]], list(PatientID="TCGA.32.2494", PtNum=498, study=study_name, Name="Radiation", 
							Fields=list(date=c("01/22/2008", "03/03/2008"), therapyType="RADIOISOTOPES", 
							intent="ADJUVANT", target=as.character(NA), totalDose="354", totalDoseUnits=as.character(NA), numFractions="30")))
		checkEquals(x[[2]], list(PatientID="TCGA.32.2494", PtNum=498, study=study_name, Name="Radiation", 
							Fields=list(date=c("05/16/2009", "06/02/2009"), therapyType="EXTERNAL BEAM", 
							intent="PROGRESSION", target="LOCAL RECURRENCE", totalDose="3900", totalDoseUnits="CGY", numFractions="12")))
		x <- create.Rad.records(study_name, "TCGA.4W.AA9S")  #55Gy
		checkEquals(x[[1]], list(PatientID="TCGA.4W.AA9S", PtNum=385, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/26/2013", "04/16/2013"), therapyType="EXTERNAL", 
							intent=as.character(NA), target="PRIMARY TUMOR FIELD", totalDose="5500", totalDoseUnits="CGY", numFractions="25")))
	}
  if(study_name == "TCGAhnsc"){
		x <- create.Rad.records(study_name, "TCGA.CX.7082")
		checkTrue(is.list(x))
		checkEquals(x[[1]], list(PatientID="TCGA.CX.7082", PtNum=364, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA), as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
							target="LOCOREGIONAL, AT PRIMARY TUMOR SITE: NO", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		
		x <- create.Rad.records(study_name, "TCGA.BA.5153")  # rad two records
		checkEquals(x[[1]], list(PatientID="TCGA.BA.5153", PtNum=10, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/11/2005", "04/02/2005"), therapyType=as.character(NA), 
							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.BA.5153", PtNum=10, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA), as.character(NA)), therapyType=as.character(NA), 
							intent="PALLIATIVE", target="DISTANT RECURRENCE", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))

		x <- create.Rad.records(study_name, "TCGA.CV.A6JN")  # omf two records
		checkEquals(x[[2]], list(PatientID="TCGA.CV.A6JN", PtNum=355, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/09/2011", "03/19/2011"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="PRIMARY TUMOR FIELD", totalDose="6000", totalDoseUnits="CGY", numFractions="30")))
		checkEquals(x[[1]], list(PatientID="TCGA.CV.A6JN", PtNum=355, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/09/2011", "03/19/2011"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="REGIONAL SITE", totalDose="5700", totalDoseUnits="CGY", numFractions="30")))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Rad.records(study_name, "TCGA.CS.6290")
		checkTrue(is.list(x))
		checkEquals(length(x), 1)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA), "04/26/2009"), therapyType="EXTERNAL BEAM", intent="ADJUVANT", 
							target="PRIMARY TUMOR FIELD", totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
							numFractions=as.character(NA))))
		x <- create.Rad.records(study_name, "TCGA.FG.A4MY")
		checkEquals(x[[1]], list(PatientID="TCGA.FG.A4MY", PtNum=200, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/06/2012", "03/18/2012"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="PRIMARY TUMOR FIELD", totalDose="5700", totalDoseUnits="CGY", numFractions="30")))
		x <- create.Rad.records(study_name, "TCGA.HT.A619")
		checkEquals(x[[1]], list(PatientID="TCGA.HT.A619", PtNum=260, study=study_name, Name="Radiation", 
							Fields=list(date=c("08/19/2001", as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
							target="LOCOREGIONAL, AT PRIMARY TUMOR SITE: YES", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
	}
  if(study_name == "TCGAluad"){
		x <- create.Rad.records(study_name, "TCGA.05.4382")
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.05.4382", PtNum=5, study=study_name, Name="Radiation", 
							Fields=list(date=c("01/01/2010", "01/29/2010"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="DISTANT RECURRENCE", totalDose=as.character(NA), totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		x <- create.Rad.records(study_name, "TCGA.44.7669")  # cCi
		checkEquals(x[[1]], list(PatientID="TCGA.44.7669", PtNum=86, study=study_name, Name="Radiation", 
							Fields=list(date=c( "04/20/2011", "04/20/2011"), therapyType="CYBER KNIFE", 
							intent="PROGRESSION", target="DISTANT SITE", totalDose="2000", totalDoseUnits="CGY", numFractions="1")))
		checkEquals(x[[2]], list(PatientID="TCGA.44.7669", PtNum=86, study=study_name, Name="Radiation", 
							Fields=list(date=c("06/11/2011", "06/17/2011"), therapyType="EXTERNAL BEAM", 
							intent="PALLIATIVE", target="DISTANT RECURRENCE", totalDose="2000", totalDoseUnits="CGY", numFractions="5")))
		x <- create.Rad.records(study_name, "TCGA.49.AAR4")  #in totalDosage is 4,500 cGy
		checkEquals(x[[1]], list(PatientID="TCGA.49.AAR4", PtNum=122, study=study_name, Name="Radiation", 
							Fields=list(date=c( "04/29/2006", "06/03/2006"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="PRIMARY TUMOR FIELD", totalDose="4,500", totalDoseUnits="CGY", numFractions=as.character(NA))))
	}
  if(study_name == "TCGAlusc"){
		x <- create.Rad.records(study_name, "TCGA.18.3407")
	    checkTrue(is.list(x))
	    checkEquals(x[[1]], list(PatientID="TCGA.18.3407", PtNum=2, study=study_name, Name="Radiation", 
	    					Fields=list(date=c(as.character(NA),as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
	    					target="LOCOREGIONAL", totalDose=as.character(NA), totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
   		x <- create.Rad.records(study_name, "TCGA.46.6026")  # tbl.rad has both dates
   		checkEquals(x[[1]], list(PatientID="TCGA.46.6026", PtNum=170, study=study_name, Name="Radiation", 
   							Fields=list(date=c("03/05/2010", "04/20/2010"), therapyType="EXTERNAL BEAM", 
   							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="6,120", totalDoseUnits="CGY", numFractions="34")))
	}
  if(study_name == "TCGAprad"){
		x <- create.Rad.records(study_name, "TCGA.EJ.5524")
	    checkTrue(is.list(x))
   		checkEquals(x[[1]], list(PatientID="TCGA.EJ.5524", PtNum=70, study=study_name, Name="Radiation", 
   							Fields=list(date=c("04/23/2010","04/23/2010"), therapyType=as.character(NA), intent=as.character(NA), 
   							target="LOCAL RECURRENCE", totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
   							numFractions=as.character(NA)))) 
    }
  if(study_name == "TCGAread"){
		x <- create.Rad.records(study_name, "TCGA.G5.6233")
		checkTrue(is.list(x))
  	    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
        checkEquals(x[[1]], list(PatientID="TCGA.G5.6233", PtNum=168, study=study_name, Name="Radiation", 
        					Fields=list(date=c(as.character(NA),as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
        					target="LOCOREGIONAL, AT PRIMARY TUMOR SITE: NO", totalDose=as.character(NA), 
        					totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		x <- create.Rad.records(study_name, "TCGA.AF.2692")  #no start date
		checkEquals(x[[1]], list(PatientID="TCGA.AF.2692", PtNum=5, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/23/2010", "03/12/2010"), therapyType="EXTERNAL BEAM", 
							intent= "PALLIATIVE", target="DISTANT SITE", totalDose="3500", totalDoseUnits="CGY", numFractions="14")))
		checkEquals(x[[2]], list(PatientID="TCGA.AF.2692", PtNum=5, study=study_name, Name="Radiation", 
							Fields=list(date=c("12/17/2009", "01/21/2010"), therapyType="EXTERNAL BEAM", 
							intent= "RECURRENCE", target="PRIMARY TUMOR FIELD", totalDose="5000", totalDoseUnits="CGY", numFractions="25")))
   }
}
lapply(studies, test_create.Rad.records)
#--------------------------------------------------------------------------------------------------------------------------
test_create.Status.records <- function(study_name)
{
  print("--- test_create.Status.record")
  if(study_name == "TCGAbrca"){
		x <- create.Status.records(study_name, "TCGA.HN.A2OB")[[1]]
		checkTrue(is.list(x)) 
		checkEquals(names(x), c("PatientID", "PtNum", "study", "Name", "Fields"))
  		checkEquals(names(x$Fields), c("date", "status", "tumorStatus"))
  		checkEquals(x, list(PatientID="TCGA.HN.A2OB", PtNum=1010, study=study_name, Name="Status", 
  						Fields=list(date=as.character(NA), status="DEAD", tumorStatus=as.character(NA))))
  		x <- create.Status.records(study_name, "TCGA.3C.AAAU")[[1]]
		checkEquals(x, list(PatientID="TCGA.3C.AAAU", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="10/03/2014", status="ALIVE", tumorStatus="WITH TUMOR")))
  		x <- create.Status.records(study_name, "TCGA.GM.A2DO")[[1]]
  		checkEquals(x, list(PatientID="TCGA.GM.A2DO", PtNum=1000, study=study_name, Name="Status", 
  						Fields=list(date="02/09/2013", status="ALIVE", tumorStatus="TUMOR FREE")))
	}
  if(study_name == "TCGAcoad"){
		x <- create.Status.records(study_name, "TCGA.3L.AA1B")[[1]]
		checkEquals(x, list(PatientID="TCGA.3L.AA1B", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="12/16/2013", status="ALIVE", tumorStatus=as.character(NA))))
    	x <- create.Status.records(study_name, "TCGA.CK.6746")[[1]]
    	checkEquals(x, list(PatientID="TCGA.CK.6746", PtNum=298, study=study_name, Name="Status", 
    					Fields=list(date="12/30/2008", status="ALIVE", tumorStatus="TUMOR FREE")))
	}
  if(study_name == "TCGAgbm"){
		x <- create.Status.records(study_name, "TCGA.02.0001")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x, list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="12/25/2002", status="DEAD", tumorStatus="WITH TUMOR")))
		x <- create.Status.records(study_name, "TCGA.06.0877")[[1]]
   		checkEquals(x, list(PatientID="TCGA.06.0877", PtNum=28, study=study_name, Name="Status", 
   						Fields=list(date="07/23/2008", status="ALIVE", tumorStatus="WITH TUMOR")))
   		x <- create.Status.records(study_name, "TCGA.12.1091")[[1]]
   		checkEquals(x, list(PatientID="TCGA.12.1091", PtNum=133, study=study_name, Name="Status", 
   						Fields=list(date="10/08/2003", status="DEAD", tumorStatus="WITH TUMOR")))
	}
  if(study_name == "TCGAhnsc"){
		x <- create.Status.records(study_name, "TCGA.4P.AA8J")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.4P.AA8J", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="04/13/2013", status="ALIVE", tumorStatus="TUMOR FREE")))
		x <- create.Status.records(study_name, "TCGA.CN.6017")
		checkEquals(x[[1]], list(PatientID="TCGA.CN.6017", PtNum=100, study=study_name, Name="Status", 
						Fields=list(date="05/03/2012", status="DEAD", tumorStatus="TUMOR FREE")))

		x <- create.Status.records(study_name, "TCGA.BA.4074")
		checkEquals(x[[1]], list(PatientID="TCGA.BA.4074", PtNum=2, study=study_name, Name="Status", 
						Fields=list(date="04/07/2004", status="DEAD", tumorStatus="WITH TUMOR")))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Status.records(study_name, "TCGA.CS.6290")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="07/01/2010", status="ALIVE", tumorStatus="NA;WITH TUMOR")))
	}
  if(study_name == "TCGAluad"){
  		x <- create.Status.records(study_name, "TCGA.05.4244")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x[[1]], list(PatientID="TCGA.05.4244", PtNum=1, study=study_name, Name="Status", 
							Fields=list(date="01/01/2009", status="ALIVE", tumorStatus="TUMOR FREE")))
		x <- create.Status.records(study_name, "TCGA.49.4486")
    	checkEquals(x[[1]], list(PatientID="TCGA.49.4486", PtNum=100, study=study_name, Name="Status", 
    						Fields=list(date="05/07/1998", status="DEAD", tumorStatus="WITH TUMOR")))
	}
  if(study_name == "TCGAlusc"){
		x <- create.Status.records(study_name, "TCGA.18.3406")	
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.18.3406", PtNum=1, study=study_name, Name="Status", 
							Fields=list(date="01/07/2004", status="DEAD", tumorStatus="WITH TUMOR")))    
		x <- create.Status.records(study_name, "TCGA.63.5128") #tbl.pt.row$death_days_to == "[Not Available]"
		checkEquals(x[[1]], list(PatientID="TCGA.63.5128", PtNum=253, study=study_name, Name="Status", 
							Fields=list(date=as.character(NA), status="DEAD", tumorStatus="WITH TUMOR")))
		x <- create.Status.records(study_name, "TCGA.NC.A5HI")
		checkEquals(x[[1]], list(PatientID="TCGA.NC.A5HI", PtNum=473, study=study_name, Name="Status", 
							Fields=list(date="10/12/2012", status="ALIVE", tumorStatus="TUMOR FREE")))
	}
  if(study_name == "TCGAprad"){
		x <- create.Status.records(study_name, "TCGA.2A.A8VL")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="09/14/2011", status="ALIVE", tumorStatus="TUMOR FREE")))
		x <- create.Status.records(study_name, "TCGA.V1.A8MF")
		checkEquals(x[[1]], list(PatientID="TCGA.V1.A8MF", PtNum=367, study=study_name, Name="Status", 
						Fields=list(date=as.character(NA), status="ALIVE", tumorStatus=as.character(NA))))
	}
  if(study_name == "TCGAread"){
		x <- create.Status.records(study_name, "TCGA.AF.2687")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.AF.2687", PtNum=1, study=study_name, Name="Status", 
					Fields=list(date="01/05/2011", status="ALIVE", tumorStatus="TUMOR FREE")))
		x <- create.Status.records(study_name, "TCGA.AG.3583")
		checkEquals(x[[1]], list(PatientID= "TCGA.AG.3583", PtNum=25, study=study_name, Name="Status", 
					Fields=list(date="09/02/2009", status="DEAD", tumorStatus=as.character(NA))))
		x <- create.Status.records(study_name, "TCGA.BM.6198")
		checkEquals(x[[1]], list(PatientID="TCGA.BM.6198", PtNum=106, study=study_name, Name="Status", 
					Fields=list(date="11/07/2010", status="ALIVE", tumorStatus="NA;TUMOR FREE")))
	}
}
lapply(studies, test_create.Status.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Progression.records <- function(study_name)
{
  print("--- test_create.Progression.record")
  if(study_name == "TCGAbrca"){
		x <- create.Progression.records(study_name, "TCGA.A7.A13E")
		checkTrue(is.list(x))
		checkEquals(length(x), 1) 
	    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    	checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
    	checkEquals(x[[1]], list(PatientID="TCGA.A7.A13E", PtNum=135, study=study_name, Name="Progression", 
    						Fields=list(date="07/11/2011", event="DISTANT METASTASIS", number=1)))
    	x <- create.Progression.records(study_name, "TCGA.E2.A152")
    	checkEquals(x[[1]], list(PatientID="TCGA.E2.A152", PtNum=815, study=study_name, Name="Progression", 
    						Fields=list(date="02/24/2009", event="DISTANT METASTASIS", number=1)))
	}
  if(study_name == "TCGAcoad"){
	  	x <- create.Progression.records(study_name, "TCGA.NH.A6GA")
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.NH.A6GA", PtNum=442, study=study_name, Name="Progression", 
							Fields=list(date="01/07/2013", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.NH.A6GA", PtNum=442, study=study_name, Name="Progression", 
							Fields=list(date="04/17/2013", event=as.character(NA), number=2)))
		x <- create.Progression.records(study_name, "TCGA.A6.2674")  #2 progression events
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.A6.2674", PtNum=7, study=study_name, Name="Progression", 
							Fields=list(date="01/06/2011", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.A6.2674", PtNum=7, study=study_name, Name="Progression", 
							Fields=list(date="05/04/2012", event=as.character(NA), number=2)))
	}
  if(study_name == "TCGAgbm"){
		x <- create.Progression.records(study_name, "TCGA.02.0007")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.02.0007", PtNum=4, study=study_name, Name="Progression", 
							Fields=list(date="06/03/2003", event="PROGRESSION OF DISEASE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.02.0001")
		checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Progression", 
							Fields=list(date="05/18/2002", event="RECURRENCE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.15.1444")  #in nte table
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.15.1444", PtNum=68, study=study_name, Name="Progression", 
							Fields=list(date="03/30/2008", event="PROGRESSION OF DISEASE", number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.15.1444", PtNum=68, study=study_name, Name="Progression", 
							Fields=list(date="03/30/2008", event="RECURRENCE", number=2)))
		x <- create.Progression.records(study_name, "TCGA.06.A5U0")  #in  table
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.06.A5U0", PtNum=303, study=study_name, Name="Progression", 
							Fields=list(date="04/10/2012", event="PROGRESSION OF DISEASE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.06.0939") #2 progression events
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.06.0939", PtNum=485, study=study_name, Name="Progression", 
							Fields=list(date="11/25/2008", event="PROGRESSION OF DISEASE", number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.06.0939", PtNum=485, study=study_name, Name="Progression", 
							Fields=list(date="12/26/2008", event=as.character(NA), number=2)))
	}
  if(study_name == "TCGAhnsc"){
		x <- create.Progression.records(study_name, "TCGA.BA.A4IF")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.BA.A4IF", PtNum=23, study=study_name, Name="Progression", 
					Fields=list(date="04/08/2012", event="NEW PRIMARY TUMOR", number=1)))
		x <- create.Progression.records(study_name, "TCGA.UF.A7JV")
		checkEquals(x[[1]], list(PatientID="TCGA.UF.A7JV", PtNum=523, study=study_name, Name="Progression", 
					Fields=list(date="02/25/2011", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.QK.A6IH") # two records in follow up nte
		checkEquals(length(x),2)
		checkEquals(x[[1]], list(PatientID="TCGA.QK.A6IH", PtNum=482, study=study_name, Name="Progression", 
					Fields=list(date="08/17/2013", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.QK.A6IH", PtNum=482, study=study_name, Name="Progression", 
					Fields=list(date="09/06/2013", event="DISTANT METASTASIS", number=2)))
		x <- create.Progression.records(study_name, "TCGA.BA.A6DB") # only in nte
		checkEquals(x[[1]], list(PatientID="TCGA.BA.A6DB", PtNum=29, study=study_name, Name="Progression", 
					Fields=list(date="07/27/2012", event="LOCOREGIONAL DISEASE", number=1)))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Progression.records(study_name, "TCGA.DU.6407")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.DU.6407", PtNum=25, study=study_name, Name="Progression", 
							Fields=list(date="07/26/2007", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.DU.5852")
		checkEquals(x[[1]], list(PatientID="TCGA.DU.5852", PtNum=4, study=study_name, Name="Progression", 
							Fields=list(date="01/25/2010", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.HT.8564")  #in nte table
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.HT.8564", PtNum=188, study=study_name, Name="Progression", 
							Fields=list(date="04/30/2012", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.FG.5963")  #2 progression events
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.FG.5963", PtNum=27, study=study_name, Name="Progression", 
							Fields=list(date="01/31/2010", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.FG.5963", PtNum=27, study=study_name, Name="Progression", 
							Fields=list(date="05/13/2010", event=as.character(NA), number=2)))
	}	
  if(study_name == "TCGAluad"){
		x <- create.Progression.records(study_name, "TCGA.49.AAQV")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.49.AAQV", PtNum=118, study=study_name, Name="Progression", 
							Fields=list(date="05/24/2013", event="DISTANT METASTASIS", number=1)))
		x <- create.Progression.records(study_name, "TCGA.MP.A4TE")
		checkEquals(length(x), 3)
		checkEquals(x[[1]], list(PatientID="TCGA.MP.A4TE", PtNum=504, study=study_name, Name="Progression", 
							Fields=list(date="08/15/2010", event="LOCOREGIONAL RECURRENCE", number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.MP.A4TE", PtNum=504, study=study_name, Name="Progression", 
							Fields=list(date="02/16/2011", event="LOCOREGIONAL RECURRENCE", number=2)))
		checkEquals(x[[3]], list(PatientID="TCGA.MP.A4TE", PtNum=504, study=study_name, Name="Progression", 
							Fields=list(date="04/25/2012", event="DISTANT METASTASIS", number=3)))
	}
  if(study_name == "TCGAlusc"){
		x <- create.Progression.records(study_name, "TCGA.33.AASB")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.33.AASB", PtNum=89, study=study_name, Name="Progression", 
							Fields=list(date="01/31/2002", event="DISTANT METASTASIS", number=1)))
		x <- create.Progression.records(study_name, "TCGA.O2.A52Q")
		checkEquals(x[[1]], list(PatientID="TCGA.O2.A52Q", PtNum=490, study=study_name, Name="Progression", 
							Fields=list(date="03/29/2005", event="DISTANT METASTASIS", number=1)))
	}
  if(study_name == "TCGAprad"){
		x <- create.Progression.records(study_name, "TCGA.CH.5791")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.CH.5791", PtNum=41, study=study_name, Name="Progression", 
							Fields=list(date="02/01/2007", event="NEW PRIMARY TUMOR", number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.CH.5791", PtNum=41, study=study_name, Name="Progression", 
							Fields=list(date="09/01/2008", event="NEW PRIMARY TUMOR", number=2)))
		x <- create.Progression.records(study_name, "TCGA.YL.A9WK")
		checkEquals(x[[1]], list(PatientID="TCGA.YL.A9WK", PtNum=470, study=study_name, Name="Progression", 
							Fields=list(date="10/06/2010", event="BIOCHEMICAL EVIDENCE OF DISEASE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.YL.A8SP")
		checkEquals(x[[1]], list(PatientID="TCGA.YL.A8SP", PtNum=464, study=study_name, Name="Progression", 
							Fields=list(date="07/29/2013", event="BIOCHEMICAL EVIDENCE OF DISEASE", number=1)))
	}
  if(study_name == "TCGAread"){
		x <- create.Progression.records(study_name, "TCGA.AF.2689")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study_name, Name="Progression", 
							Fields=list(date="10/29/2009", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.AF.A56K")  #in nte table
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.AF.A56K", PtNum=16, study=study_name, Name="Progression", 
							Fields=list(date="05/02/2009", event="LOCOREGIONAL DISEASE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.AF.3911")  #2 progression events
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.AF.3911", PtNum=8, study=study_name, Name="Progression", 
							Fields=list(date="11/27/2010", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.AF.3911", PtNum=8, study=study_name, Name="Progression", 
							Fields=list(date="10/18/2011", event=as.character(NA), number=2)))
	}
}
lapply(studies, test_create.Progression.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Absent.records <- function(study_name)
{
  print("--- test_create.Absent.record")
  if(study_name == "TCGAbrca"){
		x <- create.Absent.records(study_name, "TCGA.Z7.A8R5")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(length(x),2)
		checkEquals(x[[1]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study=study_name, Name="Absent", 
					Fields=list(date="01/02/1996", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study=study_name, Name="Absent", 
					Fields=list(date="07/01/2005", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.W8.A86G") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.W8.A86G", PtNum=1082, study=study_name, Name="Absent",
					Fields=list(date="02/24/2013", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAcoad"){
	  	x <- create.Absent.records(study_name, "TCGA.A6.A565")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[2]], list(PatientID="TCGA.A6.A565", PtNum=51, study=study_name, Name="Absent", 
					Fields=list(date="10/28/2008", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		checkEquals(x[[1]], list(PatientID="TCGA.A6.A565", PtNum=51, study=study_name, Name="Absent", 
			        Fields=list(date="03/15/2009", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.AD.6888") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.AD.6888", PtNum=232, study=study_name, Name="Absent", 
			        Fields=list(date=as.character(NA), Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.A6.2674") #has f2: no radiation
		checkEquals(x[[2]], list(PatientID="TCGA.A6.2674", PtNum=7, study=study_name, Name="Absent", 
					Fields=list(date="01/06/2011", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		checkEquals(x[[1]], list(PatientID="TCGA.A6.2674", PtNum=7, study=study_name, Name="Absent", 
					Fields=list(date="05/04/2012", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAgbm"){
  		x <- create.Absent.records(study_name, "TCGA.06.1806")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[1]], list(PatientID="TCGA.06.1806", PtNum=91, study=study_name, Name="Absent", 
					Fields=list(date="09/14/2009", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.19.A6J4") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.19.A6J4", PtNum=308, study=study_name, Name="Absent",
					Fields=list(date="11/06/2004", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.02.0009") #has f2: no radiation
		checkEquals(x[[1]], list(PatientID="TCGA.02.0009", PtNum=5, study=study_name, Name="Absent",
					Fields=list(date=as.character(NA), Radiation="TRUE", Drug=as.character(NA), Pulmonary=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.02.0009", PtNum=5, study=study_name, Name="Absent",
					Fields=list(date="09/22/2003", Radiation="TRUE", Drug=as.character(NA), Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAhnsc"){
	  	x <- create.Absent.records(study_name, "TCGA.BA.A6DI")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
	    checkEquals(x[[1]], list(PatientID="TCGA.BA.A6DI", PtNum=34, study=study_name, Name="Absent", 
	    			Fields=list(date="09/23/2012", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Absent.records(study_name, "TCGA.DB.A4X9")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[1]], list(PatientID="TCGA.DB.A4X9", PtNum=193, study=study_name, Name="Absent", 
				 	Fields=list(date="05/17/2011", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.FG.A60K") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.FG.A60K", PtNum=254, study=study_name, Name="Absent",
					Fields=list(date="02/11/2009", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.FG.A4MT") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.FG.A4MT", PtNum=197, study=study_name, Name="Absent",
					Fields=list(date="05/15/2011", Radiation="FALSE", Drug="TRUE", Pulmonary=as.character(NA))))
	}	
  if(study_name == "TCGAluad"){
		x <- create.Absent.records(study_name, "TCGA.62.A46O")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[1]], list(PatientID="TCGA.62.A46O", PtNum=261, study=study_name, Name="Absent", 
    				Fields=list(date=as.character(NA), Radiation=as.character(NA), Drug=as.character(NA), Pulmonary="FALSE")))
    	checkEquals(x[[2]], list(PatientID="TCGA.62.A46O", PtNum=261, study=study_name, Name="Absent", 
    				Fields=list(date="08/01/2008", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAlusc"){
	  	x <- create.Absent.records(study_name, "TCGA.33.AASJ")
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
	  	checkEquals(x[[2]], list(PatientID="TCGA.33.AASJ", PtNum=92, study=study_name, Name="Absent", 
	  				Fields=list(date="02/09/2002", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	  	checkEquals(x[[1]], list(PatientID="TCGA.33.AASJ", PtNum=92, study=study_name, Name="Absent", 
	  				Fields=list(date=as.character(NA), Radiation=as.character(NA), Drug=as.character(NA), Pulmonary="FALSE")))
	}
  if(study_name == "TCGAprad"){
		x <- create.Absent.records(study_name, "TCGA.KK.A7B4")
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[1]], list(PatientID="TCGA.KK.A7B4", PtNum=330, study=study_name, Name="Absent", 
					Fields=list(date="05/10/1999", Radiation="FALSE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.EJ.A6RC") #nte & omf
		checkEquals(x[[2]], list(PatientID="TCGA.EJ.A6RC", PtNum=126, study=study_name, Name="Absent",
					Fields=list(date=as.character(NA), Radiation=as.character(NA), Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAread"){
		x <- create.Absent.records(study_name, "TCGA.AF.2689")
		checkTrue(is.list(x))
		checkEquals(length(x),3)
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[1]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study_name, Name="Absent", 
					Fields=list(date="10/29/2009", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study_name, Name="Absent", 
					Fields=list(date="04/07/2010", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		checkEquals(x[[3]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study_name, Name="Absent", 
					Fields=list(date="02/09/2012", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
}
lapply(studies, test_create.Absent.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Tests.records <- function(study_name)
{
  print("--- test_create.Tests.record")
  if(study_name == "TCGAbrca"){
		x <- create.Tests.records(study_name, "TCGA.A2.A0YC")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
	    checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
	    checkEquals(length(x),9)
	    checkEquals(x[[1]], list(PatientID="TCGA.A2.A0YC", PtNum=80, study=study_name, Name="Tests", 
	    					Fields=list(date=as.character(NA), Type="IHC", Test="CENTROMERE_17",Result="her2Cent17Ratio:1.18")))
		checkEquals(x[[8]], list(PatientID="TCGA.A2.A0YC", PtNum=80, study=study_name, Name="Tests", 
	    					Fields=list(date=as.character(NA), Type="FISH", Test="HER2",
	    					Result="her2FishMethod:ENUMERATE 60 TUMOR CELLS; RATIO OF HER2/CENTROMERE 17 >= 2.1 IS AMPLIFIED")))
	}
  if(study_name == "TCGAcoad"){
		x <- create.Tests.records(study_name, "TCGA.DM.A28E")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
		checkEquals(length(x),4) #has two mutations
		checkEquals(x[[3]], list(PatientID="TCGA.DM.A28E", PtNum=389, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="KRAS", Result="krasInd:YES")))
		checkEquals(x[[4]], list(PatientID="TCGA.DM.A28E", PtNum=389, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type=as.character(NA), Test="BRAF", Result="brafRes:NORMAL")))

		x <- create.Tests.records(study_name, "TCGA.NH.A8F8")
		checkEquals(x[[3]], list(PatientID="TCGA.NH.A8F8", PtNum=446, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="KRAS", Result="krasCodon:12")))
		x <- create.Tests.records(study_name, "TCGA.A6.5662")
		checkEquals(length(x), 7)
		checkEquals(x[[2]], list(PatientID="TCGA.A6.5662", PtNum=31, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="LOCI", Result="lociAbnormalCount:0")))
		checkEquals(x[[3]], list(PatientID="TCGA.A6.5662", PtNum=31, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="LOCI", Result="lociTestCount:5")))
  	}
  if(study_name == "TCGAgbm"){
  		x <- create.Tests.records(study_name, "TCGA.02.0001")
  		checkEquals(x[2], "Result is empty.")
    }
  if(study_name == "TCGAhnsc"){	
		x <- create.Tests.records(study_name, "TCGA.QK.A6V9") #nte
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
		checkEquals(x[[1]], list(PatientID="TCGA.QK.A6V9", PtNum=485, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type="ISH",Test="HPV_ISH", Result="hpvIsh:POSITIVE")))
		checkEquals(x[[2]], list(PatientID="TCGA.QK.A6V9", PtNum=485, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type="P16",Test="HPV_P16", Result="hpvP16:POSITIVE")))
		
		x <- create.Tests.records(study_name, "TCGA.CN.A497")
		checkEquals(length(x), 3)
		checkEquals(x[[2]], list(PatientID="TCGA.CN.A497", PtNum=116, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="EGFR", Result="egfrAmp:UNAMPLIFIED")))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Tests.records(study_name, "TCGA.HW.7489") 
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
		checkEquals(x[[1]], list(PatientID="TCGA.HW.7489", PtNum=86, study=study_name, Name="Tests",
					Fields=list(date=as.character(NA), Type="SEQUENCE ANALYSIS", Test="IDH1",Result="idh1Found:YES")))
		x <- create.Tests.records(study_name, "TCGA.TM.A84C") 
		checkEquals(x[[1]], list(PatientID="TCGA.TM.A84C", PtNum=402, study=study_name, Name="Tests",
					Fields=list(date=as.character(NA),Type="IHC", Test="IDH1",Result="idh1Found:NO")))
  	}	
  if(study_name == "TCGAluad"){
		x <- create.Tests.records(study_name, "TCGA.69.7761") #nte
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
		checkEquals(x[[1]], list(PatientID="TCGA.69.7761", PtNum=294, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="EGFR", Result="egfrStatus:YES")))
		checkEquals(x[[3]], list(PatientID="TCGA.69.7761", PtNum=294, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type="PULMONARY",Test="Pulmonary_function", Result="pulInd:YES")))
		x <- create.Tests.records(study_name, "TCGA.49.AAQV")#has two mutations
		checkEquals(x[[2]], list(PatientID="TCGA.49.AAQV", PtNum=118, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EGFR", Result="egfrStatus:YES")))
		checkEquals(x[[4]], list(PatientID="TCGA.49.AAQV", PtNum=118, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EGFR", Result="egfrType:EXON 19 DELETION")))
		
		checkEquals(x[[1]], list(PatientID="TCGA.49.AAQV", PtNum=118, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EML4_ALK", Result="elm4AlkStatus:YES")))
	}
  if(study_name == "TCGAlusc"){
		x <- create.Tests.records(study_name, "TCGA.21.5783")
		checkTrue(is.list(x))
		checkEquals(length(x), 3)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date","Type","Test", "Result"))
		checkEquals(x[[1]], list(PatientID="TCGA.21.5783", PtNum=32, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EGFR", Result="egfrStatus:NO")))
		checkEquals(x[[3]], list(PatientID="TCGA.21.5783", PtNum=32, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="EML4_ALK", Result="elm4AlkStatus:NO")))
		checkEquals(x[[2]], list(PatientID="TCGA.21.5783", PtNum=32, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type="PULMONARY",Test="Pulmonary_function", Result="pulInd:YES")))
		x <- create.Tests.records(study_name, "TCGA.60.2710") #has two mutations
		checkEquals(x[[2]], list(PatientID="TCGA.60.2710", PtNum=238, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EGFR", Result="egfrStatus:NO")))
		checkEquals(x[[1]], list(PatientID="TCGA.60.2710", PtNum=238, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EML4_ALK", Result="elm4AlkStatus:NO")))
	}
  if(study_name == "TCGAprad"){
		x <- create.Tests.records(study_name, "TCGA.2A.A8VL")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date","Type","Test", "Result"))
		checkEquals(length(x),2)
		checkEquals(x[[2]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study=study_name, Name="Tests", 
							Fields=list(date="08/09/2011",Type="PSA",Test="PSA", Result="psaRes:0.05")))
		checkEquals(x[[1]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study=study_name, Name="Tests", 
							Fields=list(date="01/22/2010",Type="BONE SCAN",Test="BONE_SCAN", Result="boneScaneRes:NORMAL (NO EVIDENCE OF PROSTATE CANCER) [CM0]")))
	}
  if(study_name == "TCGAread"){
		x <- create.Tests.records(study_name, "TCGA.DY.A1DE") #has two mutations
		checkTrue(is.list(x))
		checkEquals(length(x), 6)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date","Type","Test", "Result"))
		checkEquals(x[[6]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="KRAS", Result="krasInd:YES")))
		checkEquals(x[[4]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="BRAF", Result="brafRes:NORMAL")))
		checkEquals(x[[1]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="LOCI", Result="lociTestCount:5")))
		checkEquals(x[[5]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="LOCI", Result="lociAbnormalCount:0")))

	    x <- create.Tests.records(study_name, "TCGA.AG.4021")
	    checkEquals(length(x), 3)
	    checkEquals(x[[1]], list(PatientID="TCGA.AG.4021", PtNum=74, study=study_name, Name="Tests",
					    	Fields=list(date=as.character(NA),Type=as.character(NA),Test="CEA", Result="ceaTx:3101")))
	    checkEquals(x[[2]], list(PatientID="TCGA.AG.4021", PtNum=74, study=study_name, Name="Tests",
					    	Fields=list(date=as.character(NA),Type="IHC",Test="MISMATCHED_PROTEIN", Result="mismatchProteinTestIhc:NO")))
	    checkEquals(x[[3]], list(PatientID="TCGA.AG.4021", PtNum=74, study=study_name, Name="Tests",
					    	Fields=list(date=as.character(NA),Type=as.character(NA),Test="BRAF", Result="brafInd:YES")))
	   
		x <- create.Tests.records(study_name, "TCGA.AF.6136")
		checkEquals(x[[3]], list(PatientID="TCGA.AF.6136", PtNum=13, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="CEA", Result="ceaTx:18.3")))
		checkEquals(x[[4]], list(PatientID="TCGA.AF.6136", PtNum=13, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="LOCI", Result="lociAbnormalCount:0")))
		checkEquals(x[[1]], list(PatientID="TCGA.AF.6136", PtNum=13, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA), Type="IHC",Test="MISMATCHED_PROTEIN", 
								Result="mismatchProteinLossIhc:MLH1 EXPRESSED|MSH2 EXPRESSED|PMS2 EXPRESSED|MSH6 EXPRESSED")))
	}
}
lapply(studies, test_create.Tests.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Encounter.records <- function(study_name) 
{
  if(study_name == "TCGAbrca"){
		print("--- TCGAbrca_test_create.Encounter.records")
	x <- create.Encounter.records(study_name, "TCGA.3C.AAAU")
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG",height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    #checkEquals(x[[1]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Encounter", Fields=list(encType=NA, KPS=NA, ECOG=NA,date=as.character(NA), height=NA, weight=NA, 
    	                     #prefev1.ratio=NA, prefev1.percent=NA, postfev1.ratio=NA,postfev1.percent=NA,carbon.monoxide.diffusion=NA)))
      	}
  if(study_name == "TCGAcoad"){
		print("--- TCGAcoad_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.3L.AA1B")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG", "height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.3L.AA1B", PtNum=1, study="TCGAcoad", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height="173",weight="63.3",
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    x <- create.Encounter.records(study_name, "TCGA.AA.3970")
    checkEquals(x[[1]], list(PatientID="TCGA.AA.3970", PtNum=171, study="TCGAcoad", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA),height=as.character(NA),weight=as.character(NA),
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
		}
  if(study_name == "TCGAgbm"){
		print("--- TCGAgbm_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.02.0001")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG", "height", "weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study="TCGAgbm", Name="Encounter", Fields=list(encType=as.character(NA), KPS="80", ECOG=as.character(NA),height=as.character(NA),weight=as.character(NA),
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    x <- create.Encounter.records(study_name, "TCGA.06.0875") 
    checkEquals(x[[1]], list(PatientID="TCGA.06.0875", PtNum=26, study="TCGAgbm", Name="Encounter", Fields=list(encType="PRE-OPERATIVE", KPS="80", ECOG=as.character(NA),height=as.character(NA),weight=as.character(NA),
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))								
      	}
  if(study_name == "TCGAhnsc"){
		print("--- TCGAhnsc_test_create.Encounter.records")
	x <- create.Encounter.records(study_name, "TCGA.4P.AA8J")
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]$Fields), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("encType", "KPS", "ECOG", ,"height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    #checkEquals(x[[1]], list(PatientID="TCGA.4P.AA8J", PtNum=1, study="TCGAhnsc", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height=as.character(NA), weight=as.character(NA), 
    	                     #prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))   
		}
  if(study_name == "TCGAlgg"){
		print("--- TCGAlgg_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.CS.6290")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields")) 
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG","height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study="TCGAlgg",  Name="Encounter", Fields=list(encType="PRE-OPERATIVE", KPS="90", ECOG="1", height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    checkEquals(x[[2]], list(PatientID="TCGA.CS.6290", PtNum=1, study="TCGAlgg", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    x <- create.Encounter.records(study_name,"TCGA.FG.6691") 
    checkEquals(x[[1]], list(PatientID="TCGA.FG.6691", PtNum=49, study="TCGAlgg", Name="Encounter", Fields=list(encType="PRE-OPERATIVE", KPS="100", ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    checkEquals(x[[2]], list(PatientID="TCGA.FG.6691", PtNum=49, study="TCGAlgg", Name="Encounter", Fields=list(encType="PREOPERATIVE", KPS="90", ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    checkEquals(x[[3]], list(PatientID="TCGA.FG.6691", PtNum=49, study="TCGAlgg", Name="Encounter", Fields=list(encType="ADJUVANT THERAPY", KPS="80", ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    checkEquals(x[[4]], list(PatientID="TCGA.FG.6691", PtNum=49, study="TCGAlgg", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
		}
  if(study_name == "TCGAluad"){
		print("--- TCGAluad_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.05.4244")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields")) 
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG","height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.05.4244", PtNum=1, study="TCGAluad", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
		}
  if(study_name == "TCGAlusc"){
		print("--- TCGAlusc_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.18.3406")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG","height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.18.3406", PtNum=1, study="TCGAlusc", Name="Encounter", Fields=list(encType=as.character(NA), KPS="0", ECOG=as.character(NA), height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
      	}
  if(study_name == "TCGAprad"){
    	print("--- TCGAprad_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.2A.A8VL")
    print(x)
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]$Fields), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("encType", "KPS", "ECOG", ,"height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    #checkEquals(x[[1]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study="TCGAprad", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height=as.character(NA), weight=as.character(NA), 
    						 #prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))   
    
      	}
  if(study_name == "TCGAread"){
		print("--- TCGAread_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.AF.2687")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields")) 
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG","height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.AF.2687", PtNum=1, study="TCGAread", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height="163",weight="68.2",
    						prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    x <- create.Encounter.records(study_name,"TCGA.F5.6814")
    checkEquals(x[[1]], list(PatientID="TCGA.F5.6814", PtNum=164, study="TCGAread", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height="175",weight="61",
    						prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
      	}
}
lapply(studies, test_create.Encounter.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Procedure.records <- function(study_name)
{
   if(study_name == "TCGAbrca"){
	print("--- TCGAbrca_test_create.Procedure.records")
    x <- create.Procedure.records(study_name, "TCGA.3C.AAAU")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[1]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site="DISTANT METASTASIS",side=as.character(NA)))) 
    #checkEquals(x[[2]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name="MODIFIED RADICAL MASTECTOMY",site=as.character(NA), side=as.character(NA)))) 
    #x <- create.Procedure.records(study_name,"TCGA.Z7.A8R5")
    #checkTrue(is.list(x))
    #checkEquals(x[[1]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site="LOCOREGIONAL RECURRENCE",side=as.character(NA))))
    #checkEquals(x[[2]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study="TCGAbrca", Name="Procedure", Fields=list(date="01/02/1996", name="GROSS TOTAL RESECTION",site=as.character(NA),side=as.character(NA))))
    #checkEquals(x[[3]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site="LOCOREGIONAL RECURRENCE",side=as.character(NA))))
 	#checkEquals(x[[4]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site=as.character(NA),side=as.character(NA))))
    #x <- create.Procedure.records(study_name,"TCGA.A7.A13G")
    #checkTrue(is.list(x))
    #checkEquals(x[[1]], list(PatientID="TCGA.A7.A13G", PtNum=137, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name="SIMPLE MASTECTOMY",site=as.character(NA),side=as.character(NA))))
    #checkEquals(x[[2]], list(PatientID="TCGA.A7.A13G", PtNum=137, study="TCGAbrca", Name="Procedure", Fields=list(date="04/28/1999", name=as.character(NA),site=as.character(NA),side="LEFT")))
    #checkEquals(x[[3]], list(PatientID="TCGA.A7.A13G", PtNum=137, study="TCGAbrca", Name="Procedure", Fields=list(date="01/03/2006", name=as.character(NA),site=as.character(NA),side="LEFT")))   
    #checkEquals(x[[4]], list(PatientID="TCGA.A7.A13G", PtNum=137, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site="NEW PRIMARY TUMOR",side=as.character(NA))))
      	#}
  if(study_name == "TCGAcoad"){
	print("--- TCGAcoad_test_create.Procedure.records")
    x <- create.Procedure.records(study_name, "TCGA.AD.6895")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[1]], list(PatientID="TCGA.AD.6895", PtNum=235, study="TCGAcoad", Name="Procedure", Fields=list(date="01/15/2011", name=as.character(NA),site=as.character(NA),side=as.character(NA)))) 
    #x <- create.Procedure.records(study_name,"TCGA.A6.A567") 
    #checkEquals(x[[1]], list(PatientID="TCGA.A6.A567", PtNum=53, study="TCGAcoad", Name="Procedure", Fields=list(date="11/17/2008", name=as.character(NA), site="METASTATIC", side=as.character(NA))))
    #checkEquals(x[[2]], list(PatientID="TCGA.A6.A567", PtNum=53, study="TCGAcoad", Name="Procedure", Fields=list(date="02/11/2010", name=as.character(NA), site="METASTATIC", side=as.character(NA))))
		#}
  if(study_name == "TCGAgbm"){
	print("--- TCGAgbm_test_create.Procedure.records")
   	x <- create.Procedure.records(study_name, "TCGA.06.1806")
	checkTrue(is.list(x))
   	checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "name", "site", "side"))
    
    #checkEquals(x[[1]], list(PatientID="TCGA.06.1806", PtNum=91, study="TCGAgbm", Name="Procedure", Fields=list(date=as.character(NA),name=as.character(NA), site="PROGRESSION OF DISEASE", side=as.character(NA))))
    #checkEquals(x[[2]], list(PatientID="TCGA.06.1806", PtNum=91, study="TCGAgbm", Name="Procedure", Fields=list(date=as.character(NA),name=as.character(NA), site="RECURRENCE", side=as.character(NA))))
    #checkEquals(x[[3]], list(PatientID="TCGA.06.1806", PtNum=91, study="TCGAgbm", Name="Procedure", Fields=list(date="09/28/2009",name=as.character(NA), site="LOCOREGIONAL DISEASE", side=as.character(NA))))
    #x <- create.Procedure.records(study_name,"TCGA.19.5958") 
    #checkEquals(x[[1]], list(PatientID="TCGA.19.5958", PtNum=76, study="TCGAgbm", Name="Procedure", Fields=list(date=as.character(NA),name=as.character(NA), site="RECURRENCE", side=as.character(NA))))
    #checkEquals(x[[2]], list(PatientID="TCGA.19.5958", PtNum=76, study="TCGAgbm", Name="Procedure", Fields=list(date="12/24/2010",name=as.character(NA), site="LOCOREGIONAL DISEASE", side=as.character(NA))))									
      	#}
  if(study_name == "TCGAhnsc"){
	print("--- TCGAhnsc_test_create.Procedure.records")
    #CORRECT!
    x <- create.Procedure.records(study_name,"TCGA.BA.5149") 
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
  	#checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkTrue(is.list(x))
    #checkEquals(x[[1]], list(PatientID="TCGA.BA.5149", PtNum=7, study="TCGAhnsc", Name="Procedure", Fields=list(date="02/14/2011",name=NA, site="METASTASIS", side=as.character(NA))))
 
    x <- create.Procedure.records(study_name,"TCGA.BA.A4IF") 
    #checkEquals(x[[1]], list(PatientID="TCGA.BA.A4IF", PtNum=23, study="TCGAhnsc", Name="Procedure", Fields=list(date= "04/08/2012", name=as.character(NA), site=as.character(NA), side=as.character(NA))))
    
    x <- create.Procedure.records(study_name,"TCGA.CN.6997") 
    #checkEquals(x[[2]], list(PatientID="TCGA.CN.6997", PtNum=114, study="TCGAhnsc", Name="Procedure", Fields=list(date= "01/22/2011",  name="TOTAL LARYNGECTOMY PARTIAL PHARYNGECTOMY L THYROID LOBECTOMY BILATERAL SELECTIVE NECK DISSECTION L CENTRAL COMPARTMENT NECK DISSECTION", site=as.character(NA), side=as.character(NA))))
    #[1],[3].[4]= NA
    #x <- create.Procedure.records(study_name,"TCGA.CQ.7063") 
    #checkEquals(x[[1]], list(PatientID="TCGA.CQ.7063", PtNum=157, study="TCGAhnsc", Name="Procedure", Fields=list(date= "03/05/2008",  name="RIGHT PARTIAL GLOSSECTOMY", site=as.character(NA), side="RIGHT")))
    #checkEquals(x[[2]], list(PatientID="TCGA.CQ.7063", PtNum=157, study="TCGAhnsc", Name="Procedure", Fields=list(date= "05/14/2001",  name="LEFT PARTIAL GLOSSECTOMY", site=as.character(NA), side="LEFT")))
    #checkEquals(x[[3]], list(PatientID="TCGA.CQ.7063", PtNum=157, study="TCGAhnsc", Name="Procedure", Fields=list(date= "05/05/2011",  name=as.character(NA), site="LOCOREGIONAL DISEASE", side=as.character(NA))))
	#checkEquals(x[[4]], list(PatientID="TCGA.CQ.7063", PtNum=157, study="TCGAhnsc", Name="Procedure", Fields=list(date=as.character(NA),  name=as.character(NA), site=as.character(NA), side="RIGHT")))
		#}
  if(study_name == "TCGAlgg"){
	print("--- TCGAlgg_test_create.Procedure.records")
    #CHECK!! 
    x <- create.Procedure.records(study_name, "TCGA.CS.6290")
    checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkTrue(is.list(x))
    #checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study="TCGAlgg", Name="Procedure", Fields=list(date=as.character(NA),  name=as.character(NA), site="SUPRATENTORIAL, TEMPORAL LOBE: CEREBRAL CORTEX", side="LEFT")))
    
    #CORRECT old script forced LOCOREGIONAL if there was a date
    x <- create.Procedure.records(study_name, "TCGA.HT.8564")
    #checkEquals(x[[1]], list(PatientID="TCGA.HT.8564", PtNum=188, study="TCGAlgg", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA), site="SUPRATENTORIAL, TEMPORAL LOBE", side="LEFT")))
    #checkEquals(x[[2]], list(PatientID="TCGA.HT.8564", PtNum=188, study="TCGAlgg", Name="Procedure", Fields=list(date="04/30/2012", name=as.character(NA), site="LOCOREGIONAL", side=as.character(NA))))
		#}
  if(study_name == "TCGAluad"){
		print("--- TCGAluad_test_create.Procedure.records")
    x <- create.Procedure.records(study_name, "TCGA.05.4245")
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[2]], list(PatientID="TCGA.05.4245", PtNum=2, study="TCGAluad", Name="Procedure", Fields=list(date="01/31/2006", name=as.character(NA), site=as.character(NA), side=as.character(NA))))
    
    #CORRECT site is forced 
    #slight collection change, [2] has combined site [1] is NA
    x <- create.Procedure.records(study_name,"TCGA.MP.A4T9")
    #checkEquals(x[[2]], list(PatientID= "TCGA.MP.A4T9", PtNum=500, study="TCGAluad", Name="Procedure", Fields=list(date= "06/09/2009", name=as.character(NA), site=as.character(NA), side=as.character(NA)))
    #checkEquals(x[[1]], list(PatientID= "TCGA.MP.A4T9", PtNum=500, study="TCGAluad", Name="Procedure", Fields=list(date="07/27/2008", name=as.character(NA), site="LOCOREGIONAL RECURRENCE|DISTANT METASTASIS", side=as.character(NA))))
		#}
  if(study_name == "TCGAlusc"){
	print("--- TCGAlusc_test_create.Procedure.records")
    x <- create.Procedure.records(study_name,"TCGA.NK.A7XE")
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[1]], list(PatientID="TCGA.NK.A7XE", PtNum=488, study="TCGAlusc", Name="Procedure", Fields=list(date="06/12/2004", name="PROSTECTOMY", site=as.character(NA), side=as.character(NA))))
    #CORRECT old script forced LOCOREGIONAL if there was a date
    #x <- create.Procedure.records(study_name,"TCGA.21.5786")
    #checkEquals(x[[1]], list(PatientID= "TCGA.21.5786", PtNum=34, study="TCGAlusc", Name="Procedure", Fields=list(date="04/19/2011", name=as.character(NA), site="LOCOREGIONAL", side=as.character(NA))))
      	#}
  if(study_name == "TCGAprad"){
    print("--- TCGAprad_test_create.Procedure.records")
    #CORRECT! New is CORRECT, SITE was forced NA in old script
    x <- create.Procedure.records(study_name, "TCGA.CH.5763")
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.CH.5763", PtNum=29, study="TCGAprad", Name="Procedure", Fields=list(date= "10/02/2007",  name=as.character(NA), site=as.character(NA), side=as.character(NA)))))
    
    #CORRECT! New is CORRECT, SITE was forced NA in old script
    x <- create.Procedure.records(study_name,"TCGA.KK.A8IB")
    #checkEquals(x[[1]], list(PatientID= "TCGA.KK.A8IB", PtNum=338, study="TCGAprad", Name="Procedure", Fields=list(date= "02/25/2006", name=as.character(NA), site=as.character(NA), side=as.character(NA)))))
      	#}
  if(study_name == "TCGAread"){
	print("--- TCGAread_test_create.Procedure.records")
    x <- create.Procedure.records(study_name,"TCGA.AF.A56K") 
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[1]], list(PatientID="TCGA.AF.A56K", PtNum=16, study="TCGAread", Name="Procedure", Fields=list(date="12/29/2009", name=as.character(NA), site="LOCOREGIONAL DISEASE", side=as.character(NA))))
    #x <- create.Procedure.records(study_name,"TCGA.G5.6233") 
    #checkEquals(x[[1]], list(PatientID="TCGA.G5.6233", PtNum=168, study="TCGAread", Name="Procedure", Fields=list(date="07/24/2004", name=as.character(NA), site=as.character(NA), side=as.character(NA))))
      	#}
}
lapply(studies, test_create.Procedure.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Pathology.records <- function(study_name)
{
  if(study_name == "TCGAbrca"){
	print("--- TCGAbrca_test_create.Pathology.records")
    x <- create.Pathology.records(study_name,"TCGA.3C.AAAU")
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.3C.AAAU", PtNum=1, study=study_name, Name="Pathology", Fields=list(date="01/01/2004", disease="Breast", 
    #histology="Infiltrating Lobular Carcinoma", histology.category=NA, collection="retrospective", T.Stage="TX",N.Stage="NX",M.Stage="MX",
    #S.Stage="Stage X",staging.System="6th", method=NA)))
    
    x <- create.Pathology.records(study_name,"TCGA.AO.A124")
    #checkEquals(x[[1]], list(PatientID="TCGA.AO.A124", PtNum=357, study=study_name, Name="Pathology", Fields=list(date="01/01/2002", disease="Breast", 
    #histology="Other  specify",  histology.category=NA, collection="retrospective", T.Stage="T2",N.Stage="N0 (i-)",M.Stage="M0",S.Stage="Stage IIA",
    #staging.System="5th", method="Core Biopsy")))

    x <- create.Pathology.records(study_name,"TCGA.B6.A0I8")
    #checkEquals(x[[1]], list(PatientID="TCGA.B6.A0I8", PtNum=459, study=study_name, Name="Pathology",Fields=list(date="01/01/1992", disease="Breast", 
      #histology="Infiltrating Ductal Carcinoma", histology.category=NA, collection="retrospective",T.Stage="T1",N.Stage="NX",M.Stage="M0",
      #S.Stage="Stage X",staging.System=NA, method="Other")))
    #checkEquals(x[[2]], list(PatientID="TCGA.B6.A0I8", PtNum=459, study=study_name, Name="Pathology",Fields=list(date=NA, disease="Breast", 
      #histology="Adenocarcinoma, Not Otherwise Specified", histology.category="Adenocarcinoma", collection=NA,T.Stage="T2",N.Stage="N0",M.Stage="M0",
      #S.Stage="Stage II",staging.System="2nd", method=NA)))
      	}
  if(study_name == "TCGAcoad"){
		print("--- test_create.Pathology.records")
    x <- create.Pathology.records(study_name,"TCGA.AA.3660")
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category","collection","T.Stage","N.Stage","M.Stage","S.Stage", "staging.System"))
    #checkEquals(x[[1]], list(PatientID="TCGA.AA.3660", PtNum=100, study=study, Name="Pathology", Fields=list(date="01/01/2005", disease="Colon", histology="Colon Adenocarcinoma",histology.category=NA, 
    						 #collection= "retrospective", T.Stage="T3",N.Stage="N0",M.Stage="M0",S.Stage="Stage II", staging.System="5th")))

    
    #x <- create.Pathology.records(study_name,"TCGA.A6.2677") 
    #checkEquals(x[[1]], list(PatientID="TCGA.A6.2677", PtNum=10, study=study, Name="Pathology",Fields=list(date="01/01/2009",  disease="Colon", histology="Colon Adenocarcinoma",histology.category=NA, 
    						#collection="prospective", T.Stage="T3",N.Stage="N2",M.Stage="M0",S.Stage="Stage IIIC", staging.System="6th")))
    #checkEquals(x[[2]], list(PatientID="TCGA.A6.2677", PtNum=10, study=study, Name="Pathology",Fields=list(date=NA,  disease="Kidney", histology="Kidney Clear Cell Renal Carcinoma",histology.category="Kidney Clear Cell Renal Carcinoma", 
    						 #collection=NA, T.Stage=NA,N.Stage=NA,M.Stage=NA,S.Stage=NA, staging.System=NA)))
		}
  if(study_name == "TCGAgbm"){
		print("--- TCGAgbm_test_create.Pathology.record")
    x <- create.Pathology.records(study_name,"TCGA.02.0001")
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category","collection", "grade", "method"))
    #checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2002", disease="Brain", histology="Untreated primary (de novo) GBM", histology.category="High Grade Glioma", 
    						 #collection=NA, grade="G4", method="Tumor resection")))
    
    x <- create.Pathology.records(study_name,"TCGA.06.0209") 
    #checkEquals(x[[1]], list(PatientID="TCGA.06.0209", PtNum=372, study=study, Name="Pathology",Fields=list(date="01/01/1997", disease="Brain", histology="Untreated primary (de novo) GBM", histology.category="High Grade Glioma",
    						 #collection=NA, grade="G4", method="Tumor resection")))
    #checkEquals(x[[2]], list(PatientID="TCGA.06.0209", PtNum=372, study=study, Name="Pathology",Fields=list(date=NA, disease="Prostate", histology="Adenocarcinoma, Not Otherwise Specified",histology.category="Adenocarcinoma",  
    						 #collection=NA, grade="G4", method=NA)))									
      	}
  if(study_name == "TCGAhnsc"){
		print("--- TCGAhnsc_test_create.Pathology.record")
    x <- create.Pathology.record(tcga.ids[1])
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology", "histology.category", 
      #"collection", "T.Stage", "N.Stage","M.Stage","S.Stage","staging.System"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.4P.AA8J", PtNum=1, study=study, Name="Pathology", 
      #Fields=list(date="01/01/2013", disease="Head and Neck", histology="Head and Neck Squamous Cell Carcinoma", 
      #histology.category=NA, collection="retrospective", T.Stage="T4a",N.Stage="N2a",M.Stage="M0",
      #S.Stage="Stage IVA",staging.System="7th")))
    
    x <- create.Pathology.record("TCGA-BA-4075") 
    #checkEquals(length(x),2)
    #checkEquals(x[[1]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study, Name="Pathology",
      #Fields=list(date="01/01/2004", disease="Head and Neck", histology="Head and Neck Squamous Cell Carcinoma",  
      #histology.category=NA, collection="retrospective",T.Stage="T4a",N.Stage="N1",M.Stage="M0",
      #S.Stage="Stage IVA",staging.System="6th")))
    #checkEquals(x[[2]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study, Name="Pathology",
      #Fields=list(date=NA, disease="Tongue, Base of tongue", histology="Squamous Cell Carcinoma, Not Otherwise Specified",  
      #histology.category="Squamous Cell Carcinoma",collection=NA,T.Stage=NA,N.Stage=NA,M.Stage=NA,S.Stage=NA,staging.System=NA)))
		}
  if(study_name == "TCGAlgg"){
		print("--- TCGAlgg_test_create.Pathology.record")
    x <- create.Pathology.record(tcga.ids[1])
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category", "collection", "grade"))
    #checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2009", disease="Central nervous system", histology="Astrocytoma", histology.category="High Grade Glioma", collection="retrospective", grade="G3")))
    x <- create.Pathology.record("TCGA-FG-8187")
    #checkEquals(x[[1]], list(PatientID="TCGA.FG.8187", PtNum=130, study=study, Name="Pathology", Fields=list(date="01/01/2011", disease="Central nervous system", histology="Oligoastrocytoma", histology.category="Low Grade Glioma", collection="prospective", grade="G2")))
    #checkEquals(x[[2]], list(PatientID="TCGA.FG.8187", PtNum=130, study=study, Name="Pathology", Fields=list(date=NA, disease="Testicle", histology="Other, specify:Germ Cell", histology.category=NA, collection=NA, grade=NA)))
		}
  if(study_name == "TCGAluad"){
    print("--- TCGAluad_test_create.Pathology.record")
    x <- create.Pathology.record(tcga.ids[1])
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology", "histology.category", "collection", "T.Stage", "N.Stage","M.Stage","S.Stage","staging.System"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.05.4244", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2009", disease="Lung", histology="Lung Adenocarcinoma", histology.category="Lung Adenocarcinoma", collection="retrospective", T.Stage="T2",N.Stage="N2",M.Stage="M1",S.Stage="Stage IV",staging.System="6th")))
    
    x <- create.Pathology.record("TCGA-05-4382") #has omf
    #checkEquals(x[[1]], list(PatientID="TCGA.05.4382", PtNum=5, study=study, Name="Pathology",Fields=list(date="01/01/2009", disease="Lung", histology="Lung Adenocarcinoma Mixed Subtype", histology.category="Lung Adenocarcinoma", collection="retrospective",T.Stage="T2",N.Stage="N0",M.Stage="M0",S.Stage="Stage IB",staging.System="6th")))
    #checkEquals(x[[2]], list(PatientID="TCGA.05.4382", PtNum=5, study=study, Name="Pathology",Fields=list(date=NA, disease="Penis", histology="Other, specify:carcinoma in situ of penis", histology.category=NA, collection=NA, T.Stage=NA, N.Stage=NA, M.Stage=NA, S.Stage=NA, staging.System=NA)))
		}
  if(study_name == "TCGAlusc"){
		print("--- TCGAlusc_test_create.Pathology.record")
    x <- create.Pathology.record(tcga.ids[1])
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(x[[1]], list(PatientID="TCGA.18.3406", PtNum=1, study=study, Name="Pathology",Fields=list(date= "01/01/2003", disease="Lung", histology= "Lung Squamous Cell Carcinoma", histology.category="Lung Squamous Cell Carcinoma", collection="retrospective",T.Stage="T1",N.Stage="N0",M.Stage="M0",S.Stage="Stage IA",staging.System=NA,method=NA)))
    #checkEquals(x[[2]], list(PatientID="TCGA.18.3406", PtNum=1, study=study, Name="Pathology",Fields=list(date= NA, disease="Lung", histology="Squamous Cell Carcinoma, Not Otherwise Specified" ,histology.category="Squamous Cell Carcinoma,", collection=NA,T.Stage=NA,N.Stage=NA,M.Stage=NA,S.Stage=NA,staging.System=NA,method=NA)))
    x <- create.Pathology.record("TCGA-66-2769") #has omf
    #checkEquals(x[[1]], list(PatientID="TCGA.66.2769", PtNum=293, study=study, Name="Pathology",Fields=list(date= "01/01/2007", disease="Lung", histology= "Lung Squamous Cell Carcinoma",  histology.category="Lung Squamous Cell Carcinoma", collection="retrospective",T.Stage="T4",N.Stage="N0",M.Stage="M0",S.Stage="Stage IIIB",staging.System="6th",method=NA)))
      	}
  if(study_name == "TCGAprad"){
    	print("--- TCGAprad_test_create.Pathology.record")
    x <- create.Pathology.record("TCGA-CH-5753")
    checkTrue(is.list(x)) #have both pt and omf
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category", 
        #"collection", "T.Stage", "N.Stage","M.Stage","S.Stage","staging.System", "method"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.CH.5753", PtNum=25, study=study, Name="Pathology", 
        #Fields=list(date="01/01/2008", disease="Prostate", histology="Prostate Adenocarcinoma Acinar Type", 
        #histology.category=NA, collection="prospective", T.Stage=NA,N.Stage=NA,M.Stage="M0",S.Stage=NA,
        #staging.System=NA, method="Core Biopsy")))
    #checkEquals(x[[2]], list(PatientID= "TCGA.CH.5753", PtNum=25, study=study, Name="Pathology", 
        #Fields=list(date=NA, disease="Lymph node(s)", histology="Other, specify:Non-Hodgkin's", histology.category=NA, 
        #collection=NA, T.Stage=NA,N.Stage=NA,M.Stage=NA,S.Stage=NA,staging.System=NA, method=NA)))
    x <- create.Pathology.record("TCGA-CH-5791")
      	}
  if(study_name == "TCGAread"){
		print("--- TCGA_read_test_create.Pathology.record")
    x <- create.Pathology.record("TCGA-AF-2687")
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category","collection","T.Stage","N.Stage","M.Stage","S.Stage", "staging.System"))
    #checkEquals(x[[1]], list(PatientID="TCGA.AF.2687", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2009", disease="Rectum", histology="Rectal Adenocarcinoma",histology.category=NA, collection="prospective", T.Stage="T3",N.Stage="N2",M.Stage="M0",S.Stage="Stage IIIC", staging.System=NA)))
    
    x <- create.Pathology.record("TCGA-AG-A00H") #has omf
    #checkEquals(x[[1]], list(PatientID="TCGA.AG.A00H", PtNum=79, study=study, Name="Pathology",Fields=list(date="01/01/2008",disease="Rectum", histology="Rectal Adenocarcinoma", histology.category=NA, collection="retrospective", T.Stage="T3",N.Stage="N0",M.Stage="M0",S.Stage="Stage IIA", staging.System="6th")))
      	}
}
lapply(studies, test_create.Pathology.records)








