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

#----------------------     DOB functions Start Here      --------------------------
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
	DOB.unique.race <- DOB.unique.values$unique.race
	DOB.unique.ethnicity <- DOB.unique.values$unique.ethnicity
	#[1] "WHITE"                            "BLACK OR AFRICAN AMERICAN"       
	#[3] "ASIAN"                            "[NOT AVAILABLE]"                 
	#[5] "AMERICAN INDIAN OR ALASKA NATIVE" "[NOT EVALUATED]"                 
	#[7] "[UNKNOWN]"   

	#[1] "NOT HISPANIC OR LATINO" "HISPANIC OR LATINO"     "[NOT AVAILABLE]"       
	#[4] "[NOT EVALUATED]"        "[UNKNOWN]"   
	#-------------------
	DOB.mapping.race <- function(df){
		from <- DOB.unique.race
		to 	 <- from 
		to[match(c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]"), to)] <- NA
		df$race <- mapvalues(df$race, from = from, to = to, warn_missing = T)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	DOB.mapping.ethnicity <- function(df){
		from <- DOB.unique.ethnicity 
		to 	 <- from 
		to[match(c("[NOT EVALUATED]","[NOT AVAILABLE]","[UNKNOWN]"), to)] <- NA
		df$ethnicity <- mapvalues(df$ethnicity, from = from, to = to, warn_missing = T)
		return(df)
	}
	#----------------------     DOB functions End Here      --------------------------
}
#----------------------   Diagnosis functions Start Here   -----------------------
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
	#[1] "BREAST"                 "COLON"                  "[NOT AVAILABLE]"       
	#[4] "BRAIN"                  "HEAD AND NECK"          "CENTRAL NERVOUS SYSTEM"
	#[7] "LUNG"                   "PROSTATE"               "RECTUM"   
	#[1] "3C" "4H" "5L" "5T" "A1" "A2" "A7" "A8" "AC" "AN" "AO" "AQ" "AR" "B6" "BH"
	# [16] "C8" "D8" "E2" "E9" "EW" "GI" "GM" "HN" "JL" "LD" "LL" "LQ" "MS" "OK" "OL"
	# [31] "PE" "PL" "S3" "UL" "UU" "W8" "WT" "XX" "Z7" "3L" "4N" "4T" "A6" "AA" "AD"
	# [46] "AM" "AU" "AY" "AZ" "CA" "CK" "CM" "D5" "DM" "F4" "G4" "NH" "QG" "QL" "RU"
	# [61] "WS" "02" "06" "12" "14" "16" "15" "19" "26" "28" "32" "41" "76" "81" "87"
	# [76] "74" "27" "OX" "RR" "4W" "08" "4P" "BA" "BB" "C9" "CN" "CQ" "CR" "CV" "CX"
	# [91] "D6" "DQ" "F7" "H7" "HD" "HL" "IQ" "KU" "MT" "MZ" "P3" "QK" "RS" "T2" "T3"
	#[106] "TN" "UF" "UP" "WA" "CS" "DU" "FG" "E1" "EZ" "HT" "HW" "FN" "IK" "DB" "P5"
	#[121] "DH" "QH" "KT" "R8" "S9" "TM" "VW" "F6" "VM" "VV" "W9" "WH" "WY" "05" "35"
	#[136] "38" "44" "49" "4B" "50" "53" "55" "62" "64" "67" "69" "71" "73" "75" "78"
	#[151] "80" "83" "86" "91" "93" "95" "97" "99" "J2" "L4" "L9" "MN" "MP" "NJ" "S2"
	#[166] "18" "21" "22" "33" "34" "37" "39" "43" "46" "51" "52" "56" "58" "60" "63"
	#[181] "66" "68" "6A" "70" "77" "79" "85" "90" "92" "94" "96" "98" "J1" "L3" "LA"
	#[196] "MF" "NC" "NK" "O2" "XC" "2A" "4L" "CH" "EJ" "FC" "G9" "H9" "HC" "HI" "J4"
	#[211] "J9" "KC" "KK" "M7" "MG" "QU" "SU" "TK" "TP" "V1" "VN" "VP" "WW" "X4" "XA"
	#[226] "XJ" "XK" "XQ" "Y6" "YJ" "YL" "ZG" "AF" "AG" "AH" "BM" "CI" "CL" "DC" "DT"
	#[241] "DY" "EF" "EI" "F5" "G5"
	#-------------------
	Diagnosis.mapping.disease <- function(df){
		from <- Diagnosis.unique.values$unique.disease
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$disease <- mapvalues(df$disease, from = from, to = to, warn_missing = T)
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Diagnosis.mapping.tissueSourceSiteCode <- function(df){
		from <- Diagnosis.unique.values$unique.tissueSourceSiteCode
		to 	 <- from 
		to[match("[NOT AVAILABLE]", to)] <- NA
		df$tissueSourceSiteCode <- mapvalues(df$tissueSourceSiteCode, from = from, 
								  			 to = to, warn_missing = T)
		return(df)
	}
	#----------------------     Diagnosis functions End Here      --------------------	
}
#----------------------   Drug functions Start Here   ----------------------------
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
		df[which(is.na(df$dxyear)), c(14, 15)] <- NA
	   
	    df$start <- df$dxyear + as.integer(df$drugStart)
	    df$end <- df$dxyear + as.integer(df$drugEnd)	
			
		return(df)
	}	
	#--------------------------------------------------------------------------------
	Drug.mapping.agent <- function(df){
		tbl.drug$agent <- drug_ref[match(tbl.drug$agent,drug_ref$COMMON.NAMES),]$STANDARDIZED.NAMES	
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
	#--------------------------------------------------------------------------------
	#----------------------     Drug functions End Here      --------------------
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




























#################################################    Step 5: Unit Test   #########################################################
# use Filter function, index 479 is a good option

#----------------------------------------------------------------------------------------------------
loadRawFiles <- function()	{ 
	  
  RawTables <- list()
  if (length(TCGAfilename[i,"pt"])>0){
	  print(paste(TCGAfilename[i,"pt"] , "being loaded for tbl.pt", study))
	  tbl.pt <- read.table(paste(directory,TCGAfilename[i,"pt"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
	  tbl.pt <- tbl.pt[3:nrow(tbl.pt),]
	  RawTables[["tbl.pt"]] <- tbl.pt
	  #print(paste(colnames(tbl.pt))) 
	  }else{
	  print(paste("tbl.pt does not exist for: ", study, sep=""))
  }
  if (length(TCGAfilename[i,"f1"])>0){
    print(paste(TCGAfilename[i,"f1"] , "being loaded for tbl.followup_1", study))
    tbl.followup_1 <- read.table(paste(directory,TCGAfilename[i,"f1"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.followup_1 <- tbl.followup_1[3:nrow(tbl.followup_1),]
    RawTables[["tbl.followup_1"]] <- tbl.followup_1
    #print(paste(colnames(tbl.followup_1))) 
    }else{
    print(paste("tbl.followup_1 does not exist for: ", study, sep=""))
  }
  if (length(TCGAfilename[i,"rad"])>0){
    print(paste(TCGAfilename[i,"rad"] , "being loaded for tbl.rad", study))
    tbl.rad <- read.table(paste(directory,TCGAfilename[i,"rad"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.rad <- tbl.rad[3:nrow(tbl.rad),]
    RawTables[["tbl.rad"]] <- tbl.rad
  }else{
    print(paste("tbl.rad does not exist for: ", study, sep=""))
  }
  if (length(TCGAfilename[i,"omf"])>0){
    print(paste(TCGAfilename[i,"omf"] , "being loaded for tbl.omf", study))
    tbl.omf <- read.table(paste(directory,TCGAfilename[i,"omf"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.omf <- tbl.omf[3:nrow(tbl.omf),]
    RawTables[["tbl.omf"]] <- tbl.omf
  }else{
    print(paste("tbl.omf does not exist for: ", study, sep=""))
  }
  #if (length(TCGAfilename[i,"f2"])>0){
  if (!is.na(TCGAfilename[i,"f2"])){
    print(paste(TCGAfilename[i,"f2"] , "being loaded for tbl.followup_2", study))
    tbl.followup_2 <- read.table(paste(directory,TCGAfilename[i,"f2"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.followup_2 <- tbl.followup_2[3:nrow(tbl.followup_2),]
    RawTables[["tbl.followup_2"]] <- tbl.followup_2
    #print(paste(colnames(tbl.followup_2))) 	  
    }else{
    print(paste("tbl.followup_2 does not exist for: ", study, sep=""))
    }
  #if (length(TCGAfilename[i,"nte_f1"])>0){
  if (!is.na(TCGAfilename[i,"nte_f1"])){  
    print(paste(TCGAfilename[i,"nte_f1"] , "being loaded for tbl.nte_followup_1", study))
    tbl.nte_followup_1 <- read.table(paste(directory,TCGAfilename[i,"nte_f1"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.nte_followup_1 <- tbl.nte_followup_1[3:nrow(tbl.nte_followup_1),]
    RawTables[["tbl.nte_followup_1"]] <- tbl.nte_followup_1
    #print(paste(colnames(tbl.nte_followup_1)))  
    }else{
    print(paste("tbl.nte_followup_1 does not exist for: ", study, sep=""))
  }

  if (!is.na(TCGAfilename[i,"f3"])){  
    print(paste(TCGAfilename[i,"f3"] , "being loaded for tbl.followup_3", study))
    tbl.followup_3 <- read.table(paste(directory,TCGAfilename[i,"f3"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.followup_3 <- tbl.followup_3[3:nrow(tbl.followup_3),]
    RawTables[["tbl.followup_3"]] <- tbl.followup_3
    #print(paste(colnames(tbl.followup_3))) 
    }else{
    print(paste("tbl.followup_3 does not exist for: ", study, sep=""))
  }
  if (length(TCGAfilename[i,"nte"])>0){ 
    print(paste(TCGAfilename[i,"nte"] , "being loaded for tbl.nte", study))
    tbl.nte <- read.table(paste(directory,TCGAfilename[i,"nte"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.nte <- tbl.nte[3:nrow(tbl.nte),]
    RawTables[["tbl.nte"]] <- tbl.nte
    #print(paste(colnames(tbl.nte)))  
    }else{
    print(paste("tbl.nte does not exist for: ", study, sep=""))
  }

  if (!is.na(TCGAfilename[i,"drug"])){  
    print(paste(TCGAfilename[i,"drug"] , "being loaded for tbl.drug", study))
    tbl.drug <- read.table(paste(directory,TCGAfilename[i,"drug"],sep="/"), quote="", sep="\t", header=TRUE, as.is=TRUE)
    tbl.drug <- tbl.drug[3:nrow(tbl.drug),]
    RawTables[["tbl.drug"]] <- tbl.drug
  }else{
    print(paste("tbl.drug does not exist for: ", study, sep=""))
  }
	 
	RawTables

} # loadRawFiles
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
