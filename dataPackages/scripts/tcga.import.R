###
#
#       This Script Executes Basic Processing On TCGA Files
#       Specifically It Types, Uppercases and In Cases Enforces Enumeration Types
#       
###

# Configuration -----------------------------------------------------------
rm(list = ls(all = TRUE))
options(stringsAsFactors = FALSE)
os.data.batch.inputFile <- "tcga.filename.manifest.txt"
os.data.batch.outputDir <- "../tcga.clean/"

os.data.batch.inputFile.fileCols <- c("pt", "drug", "rad","f1","f2", "f3","nte","omf","nte_f1")
os.data.batch.inputFile.studyCol <- "study"
os.data.batch.inputFile.dirCol   <- "directory"

dir.create(file.path(os.data.batch.outputDir), showWarnings = FALSE)


# Library Imports ---------------------------------------------------------
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)
library(jsonlite)

#os.tcga.batch.inputFile    <- fromJSON("os.tcga.file.manifest.json")
os.tcga.field.enumerations  <- fromJSON("os.tcga.field.enumerations.json")
os.tcga.column.enumerations <- fromJSON("os.tcga.column.enumerations.json")

# Class Definitions :: Enumerations -------------------------------------------------------
os.enum.na <- c("", "NA", "[NOTAVAILABLE]","[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","UKNOWN","[DISCREPANCY]","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","PENDING", "[NOT AVAILABLE]","[PENDING]","[NOTAVAILABLE]","NOT SPECIFIED","[NOT AVAILABLE]|[NOT AVAILABLE]","[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]","[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]","[NOT AVAILABLE]|[NOT AVAILABLE]|[NOT AVAILABLE]")
#os.enum.other <- c( "OTHER","OTHER: SPECIFY IN NOTES","OTHER (SPECIFY BELOW)","SPECIFY")
os.enum.logical.true  <- c("TRUE","YES","1","Y")
os.enum.logical.false <- c("FALSE","NO","0","N")
os.tcga.ignore.columns <- c("bcr_patient_uuid", 
                            "bcr_drug_uuid","bcr_drug_barcode",
                            "bcr_followup_uuid","bcr_followup_barcode",
                            "bcr_radiation_uuid","bcr_radiation_barcode", 
                            "bcr_omf_uuid", "bcr_omf_barcode",
                            "informed_consent_verified", "form_completion_date", 
                            "project_code", "patient_id")


Map( function(key, value, env=parent.frame()){
        setClass(key)
        setAs("character", key, function(from){ 
                # Convert To Upper + Set NAs  
                from<-toupper(from)	
                from.na<-which(from %in% os.enum.na)
                from[from.na]<-NA    
                
                # Return Enum or NA
                standardVals <- names(os.tcga.field.enumerations[[key]])
                for(fieldName in standardVals){
                  values <-os.tcga.field.enumerations[[key]][[fieldName]]
                  from[ which(from %in% values)] <- fieldName
                }
                
                if(all(from %in% c(standardVals, NA)))
                  return(from)
                
                # Kill If Not In Enum or Na
                stop(paste(key, " not set due to: ", paste(setdiff(from,c(standardVals, NA)), collapse=";"), " not belonging to ", paste(standardVals, collapse=";")))
        })
}, names(os.tcga.field.enumerations), os.tcga.field.enumerations);

# Class Definitions :: TCGA [ID | DATE | CHAR | NUM | BOOL] -------------------------------------------------------

### TCGA ID
setClass("os.class.tcgaId")
setAs("character","os.class.tcgaId", function(from) {
        as.character(str_replace_all(from,"-","." )) 
})

### TCGA Date
setClass("os.class.tcgaDate");
setAs("character","os.class.tcgaDate", function(from){
        
        # Convert Input Character Vector To Uppercase
        from<-toupper(from)	
        
        # Validate Format + Convert Day-Month to 1-1
        if ((str_length(from)==4) && !is.na(as.integer(from) ) ){
                return(format(as.Date(paste(from, "-1-1", sep=""), "%Y-%m-%d"), "%m/%d/%Y"))
        }
        
        # Return NA If Validation Fails
        return(NA)
})

### TCGA Character
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


### TCGA Numeric
setClass("os.class.tcgaNumeric");
setAs("character","os.class.tcgaNumeric", function(from){
  
        # Convert Input Character Vector To Uppercase
        from<-toupper(from)	
        
        # Get Indexes Of Fram Where Value Is In NA
        from.na<-which(from %in% os.enum.na)
        
        # Set From Indexes Values To NA
        from[from.na]<-NA	
        
        from <- as.numeric(from)
        
        if(all(is.numeric(from))) return (from)
        
        # Kill If Not In Enum or Na
        stop(paste("os.class.tcgaNumeric not properly set: ", from[!is.numeric(from)], collapse=";"))
        
})

### TCGA Boolean
setClass("os.class.tcgaBoolean");
setAs("character","os.class.tcgaBoolean", function(from){

        from<-toupper(from)	
        
        from.na<-which(from %in% os.enum.na)
        from[from.na]<-NA  
        
        from.true <- which( from %in% os.enum.logical.true )
        from[from.true] <- "TRUE"
        
        from.false <- which(from %in% os.enum.logical.false )
        from[from.false] <- "FALSE"
        
        from <- as.logical(from)

        # Return Enum or NA        
        if( all(from %in% c( TRUE, FALSE, NA))) return( from )
        
        # Kill If Not In Enum or Na
        stop(paste("os.class.tcgaBoolean not properly set: ", setdiff(from,c( TRUE, FALSE, NA )), collapse=";"))
})

# IO Utility Functions :: [Batch, Load, Save]  -------------------------------------------------------

### Save Function Takes A matrix/data.frame + Base File Path (w/o extension) & Writes to Disk In Multiple (optionally specified) Formats
os.data.save <- function(df, file, format = c("tsv", "csv", "RData")){
  
  # Write Tab Delimited
  if("tsv" %in% format)
    write.table(df, file=paste(file,".tsv", sep = ""), quote=F, sep="\t")
  
  # Write CSV Delimited
  if("csv" %in% format)
    write.csv(df, file=paste(file,".csv",sep = ""), quote = F)
  
  # Write RData File
  if("RData" %in% format)
    save(df, file=paste(file,".RData", sep = "") )
  
  # Return DataFrame For Chaining
  return(df)
}

### Load Function Takes An Import File + Column List & Returns A DataFrame
os.data.load <- function(inputFile, checkEnumerations=FALSE, checkClassType = "character"){
        
        # Columns :: Create List From Url
    columns <- unlist(strsplit(readLines(inputFile, n=1),'\t'));
    if(checkEnumerations) { column.type <- rep("character", length(columns))}
    else                  { column.type <- rep("NULL", length(columns)) }
    
    os.tcga.classes <- names(os.tcga.column.enumerations)
    for(class.type in os.tcga.classes){
      for(colName in names(os.tcga.column.enumerations[[class.type]])){
          values <-os.tcga.column.enumerations[[class.type]][[colName]]
          matching.values <- which(columns %in% values)
          columns[matching.values ] <- colName
          column.type[ matching.values] <- class.type
        }
    }
    
        # Table :: Read Table From URL
      mappedTable<-read.delim(inputFile,
                   header = FALSE, 
                   skip = 3,
                   dec = ".", 
                   sep = "\t",
                   strip.white = TRUE,
                   numerals = "warn.loss",
                   col.names = columns,
                   colClasses = column.type
        );

      if(checkEnumerations) {
        headerWithData <- columns[column.type == checkClassType]
        ignoreCols <- which(headerWithData %in% os.tcga.ignore.columns)
        if(length(ignoreCols > 0))       headerWithData <- headerWithData[- ignoreCols ]
        if(length(headerWithData) == 0)  return(mappedTable);
        
        DataIndicator <- sapply(headerWithData, function(colName){!all(toupper(mappedTable[,colName]) %in% os.enum.na)})
        headerWithData <- headerWithData[DataIndicator]
        if(length(headerWithData) == 0) return(mappedTable);
        
        unMappedData <- lapply(headerWithData, function(colName){ unique(mappedTable[,colName])})
        names(unMappedData) <- headerWithData
        print("---Unused columns")
        print(unMappedData)
      }

      return(mappedTable)
}

### Batch Is Used To Process Multiple TCGA Files Defined 
os.data.batch <- function(inputFile, outputDirectory, ...){
        
        # Load Input File 
        inputFiles <- read.delim(inputFile, sep="\t", header=TRUE)
                        
        # Loop Column Wise: for each file type
        for (currentTable in os.data.batch.inputFile.fileCols)
        {
		        # Loop Row Wise: for each disease type
                for (rowIndex in 1:nrow(inputFiles))
                {
                    currentDisease   <- inputFiles[ rowIndex, os.data.batch.inputFile.studyCol ];
                    currentDirectory <- inputFiles[ rowIndex, os.data.batch.inputFile.dirCol ]
				          	currentDataFile  <- inputFiles[ rowIndex, currentTable]
					if (is.na(currentDataFile)) next()
				          	cat(currentDisease, currentTable,"\n")
					inputFile <- paste(currentDirectory, currentDataFile, sep = "")
					outputFile <- paste(outputDirectory, currentDisease, "_", currentTable, sep="")
					
					# Load Data Frame - map and filter by named columns
					df <- os.data.load( inputFile = inputFile, ...)

					# Save Data Frame
					os.data.save(
							df = df,
							file = outputFile)
					
					# Remove Df From Memory
					rm(df)
                }
        }
}

# Run Block  -------------------------------------------------------
os.data.batch(
        inputFile = os.data.batch.inputFile,
        outputDirectory = os.data.batch.outputDir,
        checkEnumerations = TRUE,
        checkClassType = "os.class.tcgaCharacter")