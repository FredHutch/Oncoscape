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
	}q
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
	#--------------------------------------------------------------------------------
	#----------------------    Radiation functions End Here      --------------------
} # End of Radition Native Functions
#----------------------     Status functions Start Here      --------------------
if(STATUS){
	Status.unique.request <- function(study_name){
	  	uri <- rawTablesRequest(study_name, "Status")
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
	Status.mapping.date.preCheck <- function(df){
		
		if(length(which(df$lastContact > df$deathDate))){
			lastContactGreaterThanDeath  = paste(df[which(df$lastContact > df$deathDate),]$PatientID)
			warning("last contact occured after death: ", lastContactGreaterThanDeath)
		}
        df[which(!(is.na(df$lastContact))),]$date <- df[which(!(is.na(df$lastContact))),]$lastContact
        df[which(!(is.na(df$deathDate))),]$date <- df[which(!(is.na(df$deathDate))),]$deathDate

		return(df)
	}	
	#--------------------------------------------------------------------------------
	Status.mapping.date <- function(df){
		from <- Status.unique.values$unique.lastContact
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[DISCREPANCY]", "[COMPLETED]"), to)] <- NA
		df$lastContact <- mapvalues(df$lastContact, from = from, to = to, warn_missing = F)
		
		from <- Status.unique.values$unique.deathDate
		to 	 <- from 
		to[match(c("[NOT AVAILABLE]","[DISCREPANCY]", "[NOT APPLICABLE]"), to)] <- NA
		df$deathDate <- mapvalues(df$deathDate, from = from, to = to, warn_missing = F)
		
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
	tbl.f$date <- rep(NA, nrow(tbl.f))

	data.Status <- tbl.f
	
	data.Status <- Status.mapping.date.preCheck(data.Status)

	#more computation to determin the date, the vital status and the tumor status...
	data.Status <- data.Status[,c("PatientID", "vital", "tumorStatus", "date")]
	data.Status <- data.Status[-which(duplicated(data.Status)),]
	
################# double check if the aggregate lose any information, doesn't handle NA ########################
################# So no mapping at this stage to preserve the value in the field ###############################
	# only grab the most recent record from each patient
	recentDatetbl <- aggregate(date ~ PatientID, data.Status, function(x){max(x)})
    # use merge() to grab the matching fields
    data.Status <- merge(recentDatetbl, data.Status)

    # double-entry records are found using this method: need clean up 
    dupPatients <- data.Status[which(duplicated(data.Status$PatientID)),]$PatientID

    #   14 duplicated in the data.Status, dim(data.Status) is 1102, 4; unique PatientID is 1088
    #   1102 - 1088 = 14, those 14 have double entries... 
							# TCGA.A2.A04Q 2385 ALIVE  TUMOR FREE, <NA>
							# TCGA.AN.A041    7 ALIVE  TUMOR FREE, <NA>
							#		.		.		.			.
							#		.		.		.			.
							#		.		.		.			.
							#466  TCGA.AR.A5QQ  322  DEAD  TUMOR FREE, WITH TUMOR
							#		.		.		.			.
							#		.		.		.			.

 	# seperate the data.Status into two sections: with no double-entry and double-entry 
	noDubData  <- data.Status[-which(data.Status$PatientID %in% dupPatients), ] # temporarily remove the double-entry records
	dubRecrods <- data.Status[which(data.Status$PatientID %in% dupPatients), ]
	dubRecrodsCollapsedToSingle <- aggregate(tumorStatus ~ PatientID + date + vital, dubRecrods, function(x){return(paste(x))})
    # combine the them back 
	data.Status <- rbind(noDubData, dubRecrodsCollapsedToSingle)


	# in TCGAhnsc, TCGAluad, TCGAlusc have less patients...
	StatusMissingPT <- tbl.pt$PatientID[which(!(tbl.pt$PatientID %in% data.Status$PatientID))]


	#data.Status <- Status.mapping.vital(data.Status)
	#data.Status <- Status.mapping.tumorStatus(data.Status)
	#data.Status <- Status.mapping.date(data.Status)

	print(study_name)
	print(dim(data.Status))
}
lapply(studies, create.all.Status.records)
#--------------------------------------------------------------------------------------------------------------------------------
return()


