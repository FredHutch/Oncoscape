#Reference Table#------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)

stopifnot(file.exists("TCGA_Reference_Filenames_gh.txt")) 
TCGAfilename<-read.table("TCGA_Reference_Filenames_gh.txt", sep="\t", header=TRUE)
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
    i<- which(TCGAfilename$study == study)
    directory <- TCGAfilename[i,"directory"]
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
  if ( (str_length(from)==4) && !is.na(as.integer(from) ) ){
    return(as.Date( paste(from, "-1-1", sep=""), "%Y-%d-%m"))
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
	if(table == "Encounter"){
	    return(c(paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
	                   TCGAfilename[TCGAfilename$study==study,]$pt, sep="/"),
	             paste(TCGAfilename[TCGAfilename$study==study,]$directory, 
	                   TCGAfilename[TCGAfilename$study==study,]$f1, sep="/")))
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
DOB <- T
DIAGNOSIS <- T
DRUG <- T
RAD <- T
STATUS <- T
ENCOUNTER <- T
PROGRESSION <- T
PROCEDURE <- T
#----------------------     DOB functions Start Here      -----------------------
if(DOB){
	DOB.unique.request <- function(study_name){
	  uri <- rawTablesRequest(study_name, "DOB")
	  df  <- loadData(uri, 
	               list(
	                    'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
	                    'gender' = list(name = "gender", data = "upperCharacter"),
	                    'ethnicity' = list(name = "ethnicity", data ="upperCharacter"),
	                    'race' = list(name = "race", data = "upperCharacter"),
	                    'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
	                ))
	  unique.ethnicity <- unique(df$ethnicity)
	  unique.race <- unique(df$race)
	  result = list(unique.ethnicity=unique.ethnicity, unique.race=unique.race)
	  return(result)
	}
	#--------------------------------------------------------------------------------
	res_list. = lapply(studies, DOB.unique.request)

	DOB.unique.aggregate <- function(res1, res2){
		res = list(unique.ethnicity=unique(c(res1$unique.ethnicity,res2$unique.ethnicity)),
				   unique.race=unique(c(res1$unique.race, res2$unique.race)))
	    return(res)
	}
	#--------------------------------------------------------------------------------
	DOB.unique.values <- Reduce(DOB.unique.aggregate, lapply(studies, DOB.unique.request))
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
	   
	    df$start <- df$dxyear + as.integer(df$drugStart)
	    df$end <- df$dxyear + as.integer(df$drugEnd)	
			
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
						     'radiation_adjuvant_fractions_total' = list(name = "numFractions", data = "character")
						   ))
		tbl.omf <- loadData(uri[3], 
			              list(
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'radiation_tx_extent' = list(name = "target", data = "upperCharacter"),
						     'rad_tx_to_site_of_primary_tumor' = list(name = "targetAddition", data = "character"),
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
		unique.totalDose <- unique(df$totalDose)
		unique.totalDoseUnits <- unique(df$totalDoseUnits)
		unique.numFractions <- unique(df$numFractions)
	  	result = list(unique.radStart=unique.radStart, 
					  unique.radEnd=unique.radEnd, 
	  				  unique.radType=unique.radType,
	  				  unique.radTypeOther=unique.radTypeOther, 
	  				  unique.intent=unique.intent,
	  				  unique.target=unique.target,
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
	   
	    df$start <- df$dxyear + as.integer(df$radStart)
	    df$end <- df$dxyear + as.integer(df$radEnd)	
			
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
		to[match(c("[NOT AVAILABLE]","[UNKNOWN]", "[DISCREPANCY]"), to)] <- NA
		df$units <- mapvalues(df$units, from = from, to = to, warn_missing = F)
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
		
		df$totalDose[which(df$totalDoseUnits == "CGY")] <- 
					as.integer(df$totalDose[which(df$totalDoseUnits == "CGY")]) * 100

		df$totalDoseUnits[which(df$totalDoseUnits == "CGY")] <- "GY"
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
		df$NumFractions <- mapvalues(df$NumFractions, from = from, 
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
		
		if(length(which(df$lastContact > df$deathDate))){
			lastContactGreaterThanDeath  = paste(df[which(df$lastContact > df$deathDate),]$PatientID)
			warning("last contact occured after death: ", lastContactGreaterThanDeath)
		}
        df[which(!(is.na(df$lastContact))),]$date <- df[which(!(is.na(df$lastContact))),]$lastContact
        df[which(!(is.na(df$deathDate))),]$date <- df[which(!(is.na(df$deathDate))),]$deathDate

		return(df)
	}	
	#--------------------------------------------------------------------------------
	Status.mapping.date.Calculation <- function(df){
		df$date <- df$dxyear + as.integer(df$date)
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
#----------------------   Progression functions Start Here   --------------------
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
			print(unlist(rmList))
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
		df$newTumorDate <- df$dxyear + as.integer(df$newTumorDate)
		return(df)
	}		
} # End of Progression Native Functions
#----------------------   Encounter functions Start Here   ------------------------
#----------------------   brca, hnsc, prad DO NOT HAVE ENCOUNTER RECORDS! ------------------------
if(ENCOUNTER){
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
  res_list. = lapply(studies, Encounter.unique.request) 
  

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
}
#----------------------     Procedure functions End Here      --------------------------
if(PROCEDURE){
  Procedure.unique.request <- function(study_name){
    uri <- rawTablesRequest(study_name, "Procedure")
    tbl.nte <- loadData(uri[1], 
                       list(
                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                         'new_tumor_event_surgery_days_to_loco' = list(name = "date_loco", data = "upperCharacter"), #(only in lgg,luad,lusc)
                         'new_tumor_event_surgery_days_to_met'= list(name = "date_met", data = "upperCharacter"), #(only in lgg,luad,lusc)
                         'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), #(in brca,hnsc but not being collected...)
                         'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date_additional_surgery_procedure", data = "upperCharacter"), #(only in gbm,coad,read)
                         'new_neoplasm_event_type'  = list(name = "new_neoplasm_site", data = "upperCharacter"), #(only in gbm, coad, read)
                         'new_tumor_event_type'  = list(name = "new_tumor_site", data = "upperCharacter"), #(only in hnsc, pProcedure, luad, lusc)
                         'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") #(gbm,coad,read but not being collected...)
                       ))
    tbl.omf <- loadData(uri[2], 
                       list(
                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                         'days_to_surgical_resection' = list(name = "surgical_resection_date", data = "upperCharacter"), #(gbm,lgg,hnsc,brca,pProcedure,luad,lusc,coad,read)
                         'other_malignancy_laterality' = list(name = "other_malignancy_side", data = "upperCharacter"), #(brca)
                         'surgery_type' = list(name = "surgery_name", data = "upperCharacter") #(gbm,lgg,hnsc,brca,pProcedure,lusc,luad,coad,read) 
                       ))
    
      tbl.pt <- loadData(uri[3], 
                         list(
                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                           'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
                           'laterality'  = list(name = "side", data = "upperCharacter"), #(only in lgg, hnsc, pProcedure)
                           'tumor_site' = list(name = "site", data = "upperCharacter"),  #(only in lgg)
                           'supratentorial_localization'= list(name = "local", data = "upperCharacter") #(only in lgg)
                         ))

    if(!is.na(uri[4])) {
      tbl.f1 <- loadData(uri[4], 
                         list(
                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                           'new_tumor_event_surgery_days_to_loco' = list(name = "date_loco", data = "upperCharacter"), #(only in lgg,hnsc,luad,lusc)
                           'new_tumor_event_surgery_days_to_met'= list(name = "date_met", data = "upperCharacter"), #(only in lgg,hnsc,luad,lusc)
                           'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter") #(In lgg,luad,lusc) but not being collected...)
                         ))
    }
    if(!is.na(uri[5])) {
      tbl.nte_f1 <- loadData(uri[5], 
                         list(
                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                           'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), #(used to build hnsc tables but is also a column in brca that is not being collected)
                           'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "days_to_new_tumor_event_additional_surgery_procedure", data = "upperCharacter"), #(only in gbm,hnsc,coad,read)
                           'new_neoplasm_event_type'  = list(name = "new_neoplasm_site", data = "upperCharacter"), #(only in gbm, coad, read)
                           'new_tumor_event_type'  = list(name = "new_tumor_site", data = "upperCharacter"), #(only in hnsc, brca)
                           'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") #(hnsc)
                         ))
    }

      
    data.Procedure <- rbind.fill(tbl.nte, tbl.omf)
      if(exists("tbl.f1")) data.Procedure <- rbind.fill(data.Procedure, tbl.f1)
      if(exists("tbl.nte_f1")) data.Procedure <- rbind.fill(data.Procedure, tbl.nte_f1)
      if(exists("tbl.pt")) data.Procedure <- rbind.fill(data.Procedure, tbl.pt)
      colnames(data.Procedure)  
    
      #some of these columns are in multipe tables but listed below is only unique column names 
      df <- data.Procedure
      unique.dxyear<- unique(df$dxyear)
      unique.side<- unique(df$side)
      unique.site <- unique(df$site)
      unique.local <- unique(df$local)
      unique.date_loco<- unique(df$date_loco)
      unique.date_met <- unique(df$date_met )
      unique.new_tumor_event_surgery<- unique(df$new_tumor_event_surgery)
      unique.days_to_new_tumor_event_additional_surgery_procedure<- unique(df$days_to_new_tumor_event_additional_surgery_procedure)
      unique.new_neoplasm_site <- unique(df$new_neoplasm_site)
      unique.new_tumor_site<- unique(df$new_tumor_site)
      unique.new_tumor_event_additional_surgery_procedure<- unique(df$new_tumor_event_additional_surgery_procedure)
      unique.surgical_resection_date <- unique(df$surgical_resection_date)
      unique.other_malignancy_side<- unique(df$other_malignancy_side)
      unique.surgery_name <- unique(df$surgery_name)
      
      result = list(unique.dxyear=unique.dxyear, 
                    unique.side=unique.side,
                    unique.site=unique.site,
                    unique.local=unique.local,
                    unique.date_loco=unique.date_loco,
                    unique.date_met =unique.date_met,
                    unique.new_tumor_event_surgery=unique.new_tumor_event_surgery,
                    unique.days_to_new_tumor_event_additional_surgery_procedure=unique.days_to_new_tumor_event_additional_surgery_procedure,
                    unique.new_neoplasm_site=unique.new_neoplasm_site,
                    unique.new_tumor_site=unique.new_tumor_site,
                    unique.new_tumor_event_additional_surgery_procedure=unique.new_tumor_event_additional_surgery_procedure,
                    unique.surgical_resection_date=unique.surgical_resection_date,
                    unique.other_malignancy_side=unique.other_malignancy_side,
                    unique.surgery_name=unique.surgery_name)
      
      print(study_name)
      return(result)
  }
  #--------------------------------------------------------------------------------------------------------------------
  res_list. = lapply(studies, Procedure.unique.request) 
  
  Procedure.unique.aggregate <- function(res1, res2){
    
    res = list(unique.initial_pathologic_dx_year=unique(c(res1$unique.dxyear, res2$unique.dxyear)),
               unique.side=unique(c(res1$unique.side, res2$unique.side)),
               unique.site=unique(c(res1$unique.site, res2$unique.site)),
               unique.local=unique(c(res1$unique.local, res2$unique.local)),
               unique.date_loco=unique(c(res1$unique.date_loco, res2$unique.date_loco)),
               unique.date_met=unique(c(res1$unique.date_met, res2$unique.date_met)),
               unique.new_tumor_event_surgery=unique(c(res1$unique.new_tumor_event_surgery, res2$unique.new_tumor_event_surgery)),
               unique.days_to_new_tumor_event_additional_surgery_procedure=unique(c(res1$unique.days_to_new_tumor_event_additional_surgery_procedure, res2$unique.days_to_new_tumor_event_additional_surgery_procedure)),
               unique.new_neoplasm_site=unique(c(res1$unique.new_neoplasm_site, res2$unique.new_neoplasm_site)),
               unique.new_tumor_site=unique(c(res1$unique.new_tumor_site, res2$unique.new_tumor_site)),
               unique.new_tumor_event_additional_surgery_procedure=unique(c(res1$unique.new_tumor_event_additional_surgery_procedure, res2$unique.new_tumor_event_additional_surgery_procedure)),
               unique.surgical_resection_date=unique(c(res1$unique.surgical_resection_date, res2$unique.surgical_resection_date)),
               unique.other_malignancy_side=unique(c(res1$unique.other_malignancy_side, res2$unique.other_malignancy_side)),
               unique.surgery_name=unique(c(res1$unique.surgery_name, res2$unique.surgery_name)))
    return(res)
  }
  #--------------------------------------------------------------------------------
  
  Procedure.unique.values <- Reduce(Procedure.unique.aggregate, lapply(studies, Procedure.unique.request))
  
  Procedure.unique.side <- Procedure.unique.values$unique.side
  Procedure.unique.site <- Procedure.unique.values$unique.site
  Procedure.unique.local <- Procedure.unique.values$unique.local
  Procedure.unique.date_loco <- Procedure.unique.values$unique.date_loco
  Procedure.unique.date_met <- Procedure.unique.values$unique.date_met
  Procedure.unique.new_tumor_event_surgery <- Procedure.unique.values$unique.new_tumor_event_surgery
  Procedure.unique.days_to_new_tumor_event_additional_surgery_procedure   <- Procedure.unique.values$unique.days_to_new_tumor_event_additional_surgery_procedure
  Procedure.unique.new_neoplasm_site  <- Procedure.unique.values$unique.new_neoplasm_site
  Procedure.unique.new_tumor_site   <- Procedure.unique.values$unique.new_tumor_site
  Procedure.unique.new_tumor_event_additional_surgery_procedure   <- Procedure.unique.values$unique.new_tumor_event_additional_surgery_procedure
  Procedure.unique.surgical_resection_date   <- Procedure.unique.values$unique.surgical_resection_date
  Procedure.unique.other_malignancy_side  <- Procedure.unique.values$unique.other_malignancy_side
  Procedure.unique.surgery_name   <- Procedure.unique.values$unique.surgery_name
  #-------------------------------------------------------------------------------------------------------------------------
  Procedure.mapping.side<- function(df){
    from <- Procedure.unique.side
    to 	 <- from 
    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]" ), to)] <- NA
    df$side <- mapvalues(df$side, from = from, to = to, warn_missing = T)
    return(df)
  }	
  #--------------------------------------------------------------------------------
  Procedure.mapping.site<- function(df){
    from <- Procedure.unique.site
    to 	 <- from 
    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]" ), to)] <- NA
    df$site<- mapvalues(df$site, from = from, to = to, warn_missing = T)
    return(df)
  }	
  #--------------------------------------------------------------------------------
  Procedure.mapping.local<- function(df){
    from <- Procedure.unique.local
    to 	 <- from 
    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]" ), to)] <- NA
    df$site<- mapvalues(df$local, from = from, to = to, warn_missing = T)
    return(df)
  }	
  #--------------------------------------------------------------------------------
  Procedure.mapping.new_tumor_event_surgery<- function(df){
    from <- Procedure.unique.new_tumor_event_surgery
    to 	 <- from 
    to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]" ), to)] <- NA
    df$site<- mapvalues(df$new_tumor_event_surgery, from = from, to = to, warn_missing = T)
    return(df)
  }	
  #--------------------------------------------------------------------------------
  
  
  
  
  
  
  }
      
################################################     Step 4: Generate Result    ##################################################
create.all.DOB.records <- function(study_name){
	uri <- rawTablesRequest(study_name, "DOB")
	data.DOB <- loadData(uri, 
	             list(
				    'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
				    'gender' = list(name = "gender", data = "upperCharacter"),
				    'ethnicity' = list(name = "ethnicity", data ="upperCharacter"),
				    'race' = list(name = "race", data = "upperCharacter"),
				    'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate")
				  )
		)
    data.DOB <- DOB.mapping.ethnicity(data.DOB)
    data.DOB <- DOB.mapping.race(data.DOB)
    ptNumMap <- ptNumMapUpdate(data.DOB)
    result <- apply(data.DOB, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "dxyear")
    				gender = getElement(x, "gender")
    				race = getElement(x, "race")
    				ethnicity = getElement(x, "ethnicity")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Birth", 
    				 			Fields=list(date=date, gender=gender, race=race, ethnicity=ethnicity)))	
    				})
	#return(result)
	print(c(study_name, dim(data.DOB), length(result)))
}
lapply(studies, create.all.DOB.records)
#--------------------------------------------------------------------------------------------------------------------------------
create.all.Diagnosis.records <- function(study_name){
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
    result <- apply(data.Diagnosis, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "dxyear")
    				disease = getElement(x, "disease")
    				siteCode = getElement(x, "tissueSourceSiteCode")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Diagnosis", 
    				 			Fields=list(date=date, disease=disease, siteCode=siteCode)))
    				})
	#return(result)
	print(c(study_name, dim(data.Diagnosis), length(result)))
}
lapply(studies, create.all.Diagnosis.records)
#--------------------------------------------------------------------------------------------------------------------------------
create.all.Chemo.records <- function(study_name){
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
   

    # result
    ptNumMap <- ptNumMapUpdate(tbl.pt)
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
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Diagnosis", 
    				 			Fields=list(date=date, agent=agent, therapyType=therapyType, intent=intent,
    				 				        dose=dose, units=units, totalDose=totalDose, totalDoseUnits=totalDoseUnits,
    				 				        route=route,cycle=cycle)))
    				})
	#return(result)
	print(c(study_name, dim(data.Chemo), length(result)))
}
lapply(studies, create.all.Chemo.records)
#--------------------------------------------------------------------------------------------------------------------------------
create.all.Rad.records <- function(study_name){
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
					     'radiation_adjuvant_fractions_total' = list(name = "numFractions", data = "character")
					   ))
	tbl.omf <- loadData(uri[3], 
		              list(
					     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'radiation_tx_extent' = list(name = "target", data = "upperCharacter"),
					     'rad_tx_to_site_of_primary_tumor' = list(name = "targetAddition", data = "character"),
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
    				 			Fields=list(date=date, radType=radType, intent=intent, 
    				 						target=target, totalDose=totalDose, totalDoseUnits=totalDoseUnits, 
    				 						numFractions=numFractions)))
    				})
	print(c(study_name, dim(data.Rad), length(result)))
}
lapply(studies, create.all.Rad.records)
#--------------------------------------------------------------------------------------------------------------------------------
create.all.Status.records <- function(study_name){
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
	recentDatetbl <- aggregate(date ~ PatientID, data.Status, function(x){max(x)})
	

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

    result <- apply(data.Status, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "date")
    				vital = getElement(x, "vital")
    				tumorStatus = getElement(x, "tumorStatus")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Status", 
    				 			Fields=list(date=date, vital=vital, tumorStatus=tumorStatus)))
    				})
	print(c(study_name, dim(data.Status), length(result)))
}
lapply(studies, create.all.Status.records)
#--------------------------------------------------------------------------------------------------------------------------
create.all.Progression.records <- function(study_name){
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
	data.Progression <- merge(tbl.f, tbl.pt)
	data.Progression <- Progression.mapping.newTumor(data.Progression)
	data.Progression <- Progression.mapping.newTumorDate(data.Progression)
	data.Progression <- data.Progression[-which(duplicated(data.Progression)), ]
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

    result <- apply(data.Progression, 1, function(x){
    				PatientID = getElement(x, "PatientID")
    				PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
    				date = getElement(x, "newTumorDate")
    				event = getElement(x, "newTumor")
    				number = getElement(x, "Number")
    				return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Progression", 
    				 			Fields=list(date=date, event=event, number=number)))
    				})
	print(c(study_name, dim(data.Progression), length(result)))
}
lapply(studies, create.all.Progression.records)
#--------------------------------------------------------------------------------------------------------------------------
create.all.Encounter.records <- function(study_name){
  uri <- rawTablesRequest(study_name, "Encounter")
  #rm(list=ls(pattern="tbl"))
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
  
  data.Encounter <- rbind.fill(tbl.pt, tbl.f1)
  
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
  #return(result)
  print(c(study_name, dim(data.Encounter), length(result)))
}
lapply(studies, create.all.Encounter.records)
#--------------------------------------------------------------------------------------------------------------------------
create.all.Procedure.records <- function(study_name){
    uri <- rawTablesRequest(study_name, "Procedure")
    tbl.nte <- loadData(uri[1], 
                        list(
                          'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                          'new_tumor_event_surgery_days_to_loco' = list(name = "date_loco", data = "upperCharacter"), #(only in lgg,luad,lusc)
                          'new_tumor_event_surgery_days_to_met'= list(name = "date_met", data = "upperCharacter"), #(only in lgg,luad,lusc)
                          'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), #(in brca,hnsc but not being collected...)
                          'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date_additional_surgery_procedure", data = "upperCharacter"), #(only in gbm,coad,read)
                          'new_neoplasm_event_type'  = list(name = "new_neoplasm_site", data = "upperCharacter"), #(only in gbm, coad, read)
                          'new_tumor_event_type'  = list(name = "new_tumor_site", data = "upperCharacter"), #(only in hnsc, pProcedure, luad, lusc)
                          'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") #(gbm,coad,read but not being collected...)
                        ))
    tbl.omf <- loadData(uri[2], 
                        list(
                          'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                          'days_to_surgical_resection' = list(name = "surgical_resection_date", data = "upperCharacter"), #(gbm,lgg,hnsc,brca,pProcedure,luad,lusc,coad,read)
                          'other_malignancy_laterality' = list(name = "other_malignancy_side", data = "upperCharacter"), #(brca)
                          'surgery_type' = list(name = "surgery_name", data = "upperCharacter") #(gbm,lgg,hnsc,brca,pProcedure,lusc,luad,coad,read) 
                        ))
    
    tbl.pt <- loadData(uri[3], 
                       list(
                         'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                         'initial_pathologic_dx_year' = list(name = "dxyear", data = "tcgaDate"),
                         'laterality'  = list(name = "side", data = "upperCharacter"), #(only in lgg, hnsc, pProcedure)
                         'tumor_site' = list(name = "site", data = "upperCharacter"),  #(only in lgg)
                         'supratentorial_localization'= list(name = "local", data = "upperCharacter") #(only in lgg)
                       ))
    
    if(!is.na(uri[4])) {
      tbl.f1 <- loadData(uri[4], 
                         list(
                           'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                           'new_tumor_event_surgery_days_to_loco' = list(name = "date_loco", data = "upperCharacter"), #(only in lgg,hnsc,luad,lusc)
                           'new_tumor_event_surgery_days_to_met'= list(name = "date_met", data = "upperCharacter"), #(only in lgg,hnsc,luad,lusc)
                           'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter") #(In lgg,luad,lusc) but not being collected...)
                         ))
    }
    if(!is.na(uri[5])) {
      tbl.nte_f1 <- loadData(uri[5], 
                             list(
                               'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
                               'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "upperCharacter"), #(used to build hnsc tables but is also a column in brca that is not being collected)
                               'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "days_to_new_tumor_event_additional_surgery_procedure", data = "upperCharacter"), #(only in gbm,hnsc,coad,read)
                               'new_neoplasm_event_type'  = list(name = "new_neoplasm_site", data = "upperCharacter"), #(only in gbm, coad, read)
                               'new_tumor_event_type'  = list(name = "new_tumor_site", data = "upperCharacter"), #(only in hnsc, brca)
                               'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "upperCharacter") #(hnsc)
                             ))
    }
    
    data.Procedure <- rbind.fill(tbl.nte, tbl.omf)
    if(exists("tbl.f1")) data.Procedure <- rbind.fill(data.Procedure, tbl.f1)
    if(exists("tbl.nte_f1")) data.Procedure <- rbind.fill(data.Procedure, tbl.nte_f1)
    if(exists("tbl.pt")) data.Procedure <- rbind.fill(data.Procedure, tbl.pt)
    colnames(data.Procedure)  

    #create columns for column that are not captured
    procedureColNames <- c("PatientID", "date_loco", "date_met", "new_tumor_event_surgery", "date_additional_surgery_procedure", "new_neoplasm_site", "new_tumor_site", "new_tumor_event_additional_surgery_procedure", "surgical_resection_date", "other_malignancy_side", "surgery_name","dxyear","side","site","local")
    m <- matrix(nrow=nrow(data.Procedure), ncol=length(which(!(procedureColNames) %in% colnames(data.Procedure))))
    df <- as.data.frame(m)
    colnames(df) <- procedureColNames[(which(!(procedureColNames) %in% colnames(data.Procedure)))]
    data.Procedure<- cbind(data.Procedure, df) 

    # mapping
    data.Procedure <- Procedure.mapping.date_loco(data.Procedure)
    data.Procedure <- Procedure.mapping.date_met(data.Procedure)
    data.Procedure <- Procedure.mapping.new_tumor_event_surgery(data.Procedure)
    data.Procedure <- Procedure.mapping.date_additional_surgery_procedure(data.Procedure)
    data.Procedure <- Procedure.mapping.new_neoplasm_site(data.Procedure)
    data.Procedure <- Procedure.mapping.new_tumor_site(data.Procedure)
    data.Procedure <- Procedure.mapping.new_tumor_event_additional_surgery_procedure(data.Procedure)
    data.Procedure <- Procedure.mapping.surgical_resection_date(data.Procedure)
    data.Procedure <- Procedure.mapping.other_malignancy_side(data.Procedure)
    data.Procedure <- Procedure.mapping.surgery_name(data.Procedure)
    data.Procedure <- Procedure.mapping.side(data.Procedure)
    data.Procedure <- Procedure.mapping.site(data.Procedure)
    
    
    # result
    ptNumMap <- ptNumMapUpdate(tbl.pt)
    result <- apply(data.Procedure, 1, function(x){
      PatientID = getElement(x, "PatientID")
      PtNum = ptNumMap[ptNumMap$PatientID == PatientID,]$PatientNumber
      date_loco = getElement(x, "date_loco")
      date_met = getElement(x, "date_met")
      new_tumor_event_surgery = getElement(x, "new_tumor_event_surgery")
      date_additional_surgery_procedure = getElement(x, "date_additional_surgery_procedure")
      new_neoplasm_site = getElement(x, "new_neoplasm_site")
      new_tumor_site = getElement(x, "new_tumor_site")
      new_tumor_event_additional_surgery_procedure = getElement(x, "new_tumor_event_additional_surgery_procedure")
      surgical_resection_date = getElement(x, "surgical_resection_date")
      other_malignancy_side  = getElement(x, "other_malignancy_side")
      surgery_name  = getElement(x, "surgery_name")
      side  = getElement(x, "side")
      site  = getElement(x, "site")
      return(list(PatientID=PatientID, PtNum=PtNum, study=study_name, Name="Procedure", 
                  Fields=list(date_loco=date_loco,date_met=date_met,new_tumor_event_surgery=new_tumor_event_surgery,date_additional_surgery_procedure=date_additional_surgery_procedure,new_neoplasm_site=new_neoplasm_site,new_tumor_site=new_tumor_site,new_tumor_event_additional_surgery_procedure=new_tumor_event_additional_surgery_procedure,surgical_resection_date=surgical_resection_date,other_malignancy_side=other_malignancy_side,surgery_name=surgery_name,side=,side, site=site)))
    })
    return(result)
    print(c(study_name, dim(data.Procedure), length(result)))
  }
lapply(studies, create.all.Procedure.records) 
#--------------------------------------------------------------------------------------------------------------------------  
  #################################################    Step 5: Unit Test   #########################################################
# use Filter function, index 479 is a good option
#----------------------------------------------------------------------------------------------------
run <- function(RawTables, tcga.ids)
{
  
  # the patient clinical annotation data use IDs in this style
  #     "TCGA-02-0001" "TCGA-02-0003" "TCGA-02-0006" "TCGA-02-0007"
  # whereas we prefer
  #     "TCGA.02.0001" "TCGA.02.0003" "TCGA.02.0006" "TCGA.02.0007"
  # adapt the incoming patients to the tcga patient clinical style
  # the patient ids are returned to the dot form in the functions
  # defined and called below.
  
  patients <- tcga.ids
  print(paste("---- parse Events for", length(patients), "patients"))

  
  patients <- gsub("\\.", "\\-", patients)
  checkTrue(all(patients %in% RawTables[["tbl.pt"]][,"bcr_patient_barcode"]))
  
  history <- parseEvents(patients)
  if(length(history)>0)
    names(history) <- paste("event", 1:length(history), sep="")
  ptList <- createPatientList(history)
  catList <- createEventTypeList(history)
  tbl.ptHistory <- createPatientTable(history)
  
  ProcessedData <- list(history=history, ptList=ptList, catList=catList, tbl.ptHistory=tbl.ptHistory)
  
} # run
#----------------------------------------------------------------------------------------------------
saveRData <- function(finalData){

  print(paste("---- saving files for ", paste(names(finalData), collapse=",")))
  history <- finalData$history; ptList <- finalData$ptList; 
  catList <- finalData$catList; tbl.ptHistory <- finalData$tbl.ptHistory;
  
  serialized.file.path <-paste("..",study,"inst/extdata",sep="/")
  save(history, file=paste(serialized.file.path,"events.RData",sep="/"))
  save(ptList, file=paste(serialized.file.path, "ptHistory.RData",sep="/"))
  save(catList, file=paste(serialized.file.path,"historyTypes.RData", sep="/"))
  save(tbl.ptHistory, file=paste(serialized.file.path,"tbl.ptHistory.RData", sep="/"))
}
#--------------------------------------------------------------------------------------------------
# format(strptime("2009-08-11", "%Y-%m-%d"), "%m/%d/%Y") # ->  "08/11/2009"
reformatDate <- function(dateString)
{
  format(strptime(dateString, "%Y-%m-%d"), "%m/%d/%Y")
} # reformatDate
#----------------------------------------------------------------------------------------------------
parseEvents <- function(patient.ids=NA)
{
  dob.events <- lapply(patient.ids, function(id) create.DOB.record(id))
  diagnosis.events <- create.all.Diagnosis.records(patient.ids)
  chemo.events <- create.all.Chemo.records(patient.ids)
  radiation.events <- create.all.Radiation.records(patient.ids)
  encounter.events <- create.all.Encounter.records(patient.ids)
  #pathology.events <- create.all.Pathology.records(patient.ids)
  progression.events <- create.all.Progression.records(patient.ids)
  status.events <- lapply(patient.ids, create.status.record)
  #background.events <- lapply(patient.ids, create.Background.record)
  #tests.events <- lapply(patient.ids, create.Tests.record)
  #procedure.events <- create.all.Procedure.records(patient.ids)
  #absent.events <- create.all.Absent.records (patient.ids)
  events <- append(dob.events, diagnosis.events)
  events <- append(events, status.events)
  events <- append(events, progression.events)
  events <- append(events, chemo.events)
  events <- append(events, radiation.events)
  events <- append(events, encounter.events)
  #events <- append(events, procedure.events)
  
  #events <- append(events, pathology.events)
  #events <- append(events, absent.events)
  #events <- append(events, tests.events)
  #events <- append(events,background.events)
      #printf("found %d events for %d patients", length(events), length(patient.ids))
  print(table(unlist(lapply(events, function(e) e["Name"]))))
  
  events
  
} # parseEvents
#----------------------------------------------------------------------------------------------------
createPatientList <- function(Allevents=NA){
  
  if(all(is.na(Allevents)))
    return(list())
  
  list.events <- Allevents
  
  ptIDs = unique(unlist(lapply(list.events, function(e) e$PatientID)))
  
  ptList <- lapply(ptIDs, function(id){
    orderedEvents <- data.frame()
    noDateEvents <- data.frame()
    calcEvents <- data.frame()
    birth = death = diagnosis = progression = ""
    
    ptEvents <- list.events[sapply(list.events, function(ev) {ev$PatientID == id })]
    for(evID in names(ptEvents)){
      if(is.null(ptEvents[[evID]]$Fields$date)){
        noDateEvents  =  rbind(noDateEvents, data.frame(name=ptEvents[[evID]]$Name, eventID = evID))
      } else 
        if(any(is.na(ptEvents[[evID]]$Fields$date))){
          noDateEvents  =  rbind(noDateEvents, data.frame(name=ptEvents[[evID]]$Name, eventID = evID))
        } else if(length(ptEvents[[evID]]$Fields$date) == 1){
          orderedEvents <- rbind(orderedEvents, data.frame(name=ptEvents[[evID]]$Name, date = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y"), eventOrder="single", eventID = evID))
          if(ptEvents[[evID]]$Name == "Birth") birth = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
          else if(ptEvents[[evID]]$Name == "Status") death = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
          else if(ptEvents[[evID]]$Name == "Diagnosis") diagnosis = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
          else if(ptEvents[[evID]]$Name == "Progression") progression = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
        } else {
          
          if(as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y") > as.Date(ptEvents[[evID]]$Fields$date[2], format="%m/%d/%Y")){
            noDateEvents  <- rbind(noDateEvents, data.frame(name=ptEvents[[evID]]$Name, eventID = evID))            
          } else {
            orderedEvents <- rbind(orderedEvents, data.frame(name=ptEvents[[evID]]$Name, date =  as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y"), eventOrder="start", eventID = evID))
            orderedEvents <- rbind(orderedEvents, data.frame(name=ptEvents[[evID]]$Name, date =  as.Date(ptEvents[[evID]]$Fields$date[2], format="%m/%d/%Y"), eventOrder="end", eventID = evID))
          }
        } 
    }
    #    printf("Birth: %s Death: %s Diagnosis %s Progression %s", birth, death, diagnosis, progression)
    OneDay = 1000 *60 * 60*24;
    
    AgeDx   <- data.frame(name="Age at Diagnosis", value =NA, units="Years"); 
    Survival  <- data.frame(name="Survival", value =NA, units="Years");
    Dx2Prog <- data.frame(name="Diagnosis to Progression", value =NA,units="Months");
    ProgDeath <- data.frame(name="Progression to Status", value =NA, units="Months"); 
    if(class(birth) == "Date" && class(diagnosis) == "Date") AgeDx$value = as.numeric(diagnosis - birth)/365.25
    if(class(death) == "Date" && class(diagnosis) == "Date") Survival$value = as.numeric(death - diagnosis)/365.25
    if(class(progression) == "Date" && class(diagnosis) == "Date") Dx2Prog$value = as.numeric(progression - diagnosis)/30.425
    if(class(progression) == "Date" && class(death) == "Date")     ProgDeath$value = as.numeric(death - progression)/30.425
    
    calcEvents <- rbind(AgeDx, Survival, Dx2Prog, ProgDeath)
    
    if(nrow(orderedEvents)>0) orderedEvents <- orderedEvents[order(orderedEvents$date),]
    list(dateEvents = orderedEvents, noDateEvents=noDateEvents, calcEvents = calcEvents)
  })
  
  names(ptList) <- ptIDs
  ptList
}
#----------------------------------------------------------------------------------------------------
createEventTypeList <- function(Allevents=NA){
  
  if(all(is.na(Allevents)))
    return(list())
  
  list.events <- Allevents
  
  catNames = unique(unlist(lapply(list.events, function(e) e$Name)))
  
  categoryList <- lapply(catNames, function(name){
    fieldNames <- data.frame()
    hasDateEvents = FALSE
    catEvents <- list.events[sapply(list.events, function(ev) {ev$Name == name })]
    catFrame <- t(sapply(catEvents, function(ev) { ev$Fields }))
    if("date" %in% colnames(catFrame)){
      catFrame = catFrame[,-which(colnames(catFrame)=="date")]
      hasDateEvents = TRUE
    }
    if(name == "Background" && "History" %in% colnames(catFrame)){          ## NOT CURRENTLY HANDLED
      #       evNames = unique(unlist(catFrame[,which(colnames(catFrame)=="History")]))
      catFrame = catFrame[,-which(colnames(catFrame)=="History")]
    }
    if(name == "Background" && "Symptoms" %in% colnames(catFrame)){
      #     evNames = unique(unlist(catFrame[,which(colnames(catFrame)=="Symptoms")]))        
      catFrame = catFrame[,-which(colnames(catFrame)=="Symptoms")]
    }
    fieldList <- apply(catFrame, 2, function(field) {
      fieldTypes = unlist(unique(field))
      evList <- lapply(fieldTypes, function(evType){
        if(is.na(evType))
          evNames <- rownames(catFrame)[is.na(field)] 
        else
          evNames <- rownames(catFrame)[ which(field == evType)] 
        evNames
      })
      
      names(evList) <- fieldTypes
      evList
    })
    fieldList$dateIndicator = hasDateEvents
    fieldList
  })
  
  names(categoryList) <- catNames
  categoryList

  } # createEventTypeList 
#--------------------------------------------------------------------------------------------------
createPatientTable <- function(events=NA){
  
  if(all(is.na(events)))
    return(data.frame())
  
  list.events <- events
  
  ptIDs = unique(gsub("(\\w+\\.\\w+\\.\\w+).*", "\\1" , unlist(lapply(list.events, function(e) e$PatientID))))
  
  table <- data.frame(ptID=ptIDs, ptNum=NA, study=NA)
  rownames(table) <- ptIDs
  
  new.list <-lapply(list.events, function(event){  # remove "Fields" label and use value of 'Name' for unique headers
    id <- gsub("(\\w+\\.\\w+\\.\\w+).*", "\\1" , event$PatientID)
    a<- list(ptID=id, ptNum=event$PtNum, study=event$study)
    #if(length(event$Fields) != length(unlist(event$Fields))
    a[[event$Name]]<- as.list(unlist(event$Fields))  # for fields with multiple elements, e.g. date c(start, end) -> date1 date2
    a
  })
  
  index = 1
  for(event in new.list){
    if(is.na(table[event$ptID,"ptNum"])){                        # new pt now stored
      table[event$ptID, "ptNum"] <- event$ptNum 
      table[event$ptID, "study"] <- event$study 
    }  

    new.event<- data.frame(event[4], stringsAsFactors=F)

    if(all(colnames(new.event) %in% colnames(table))){           # not new event type overall
      if(all(is.na(table[event$ptID, colnames(new.event)]))) {  # fields not yet defined for this patient
        table[event$ptID, colnames(new.event)] <- unlist(new.event)
      }else{                                                   # iterate until new column label available
        count =2
        add.columns = paste(colnames(new.event), count, sep=".")
        while(all(add.columns %in% colnames(table)) && any(!is.na(table[event$ptID, add.columns]))) {
          count = count + 1
          add.columns = paste(colnames(new.event), count, sep=".")
        }
        if(!all(add.columns %in% colnames(table))) table[, add.columns] <- NA
        table[event$ptID, add.columns] <- unlist(new.event)
      }
    }else{                                                     # create/add new set of event names
      table[, colnames(new.event)] <- NA
      table[event$ptID, colnames(new.event)] <- unlist(new.event)
    }
    index = index + 1
  }
  table$ptNum <- as.numeric(table$ptNum)
  
  table <- addCalculatedEvents(table)
  table
  
} # createTable
#----------------------------------------------------------------------------------------------------
addCalculatedEvents <- function(table= data.frame()){
  
  if(all(dim(table) == c(0,0))) return(table)
  
  if(all(c("Diagnosis.date","Status.date") %in% colnames(table)))
    table[ ,"Survival"] <- as.numeric(apply(table, 1, function(row){getDateDifference(row["Diagnosis.date"],row["Status.date"]) }) )
  if(all(c("Birth.date", "Diagnosis.date") %in% colnames(table)))
    table[ ,"AgeDx"] <- as.numeric(apply(table, 1, function(row){getDateDifference(row["Birth.date"], row["Diagnosis.date"]) }) )
  if(all(c("Diagnosis.date","Progression.date") %in% colnames(table))){
    allProgressionCols <- which(grepl("Progression.date", colnames(table)))
    table[ ,"TimeFirstProgression"] <- as.numeric(
      apply(table, 1, function(row){getDateDifference(row["Diagnosis.date"], row[allProgressionCols]) }))
  }
  
  table
}
#----------------------------------------------------------------------------------------------------
getDateDifference <- function(date1, date2, instance1=1, instance2=1){
  ## returns a single date difference for date2 - date1 by creating orded dates by first, second, ..,  or linked date pairs 
  ## instance  = 1, 2, ..., last, linked
  
  stopifnot(grepl("\\d+",instance1) | instance1 %in% c("last", "linked"))
  stopifnot(grepl("\\d+",instance2) | instance2 %in% c("last", "linked"))
  
  if(grepl("last", instance1)) instance1 = length(date1)
  if(grepl("last", instance2)) instance2 = length(date2)
  
  stopifnot(is.numeric(instance1) | is.numeric(instance2))
  # need at least one instance to define relationship 
  
  if(is.numeric(instance1)) stopifnot(instance1 <= length(date1))
  if(is.numeric(instance2)) stopifnot(instance2 <= length(date2))
  
  if(instance1 == "linked") stopifnot(length(date1) == length(date2))
  if(instance2 == "linked") stopifnot(length(date1) == length(date2))
  # for linked dates, lengths must be equal for matching
  
  #stopifnot( all(sapply(date1, isValidDate)))
  #stopifnot( all(sapply(date2, isValidDate)))
  
  date1 <- as.Date(as.character(date1), format="%m/%d/%Y")
  date2 <- as.Date(as.character(date2), format="%m/%d/%Y")
  
  if(is.numeric(instance1) & instance2 == "linked"){
    first.date  = date1[order(date1)][instance1]  # NAs ordered at end
    second.date = date2[order(date1)][instance1]
  } else if(is.numeric(instance2) & instance1 == "linked"){
    first.date = date1[order(date2)][instance2]
    second.date  = date2[order(date2)][instance2]
  } else if(is.numeric(instance1) & is.numeric(instance2)){
    first.date  = date1[order(date1)][instance1]
    second.date = date2[order(date2)][instance2]
  } 
  
  stopifnot(exists("first.date") & exists("second.date"))
  
  datediff = second.date - first.date
  
  as.numeric(datediff)   # will return NA if either value is NA
}
#----------------------------------------------------------------------------------------------------
RawTables <- loadRawFiles()
tcga.ids <- unique(RawTables[["tbl.pt"]]$bcr_patient_barcode)
id.map <- 1:length(tcga.ids)
fixed.ids <- gsub("-", ".", tcga.ids, fixed=TRUE)
names(id.map) <- fixed.ids

ProcessedData <- run(RawTables, tcga.ids)
runTests()
saveRData(ProcessedData)

#--------------------------------------------------------------------------------------------------------------------------------
return()
