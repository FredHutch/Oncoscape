
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
  intersect(header, columns)
  # colNames <- unlist(lapply(header, function(x) {
  #   for (name in names(columns)){
  #     if (name==x) return(columns[[name]]$name)
  #   }
  #   return(x);
  # }));
  
  # Columns :: Specify Data Type For Columns
  colData <- unlist(lapply(header, function(x) {
    for (name in names(columns)){
      if (name==x) return(columns[[name]]$data)
    }
    return("NULL");
  }));
  
  # Table :: Read Table From URL
  read.delim(uri,
             header = FALSE, 
             skip = 3,
             dec = ".", 
             sep = "\t",
             strip.white = TRUE,
             numerals = "warn.loss",
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