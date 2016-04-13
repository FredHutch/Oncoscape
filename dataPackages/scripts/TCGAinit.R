########################################################################     Step 1: Load in Reference files ########################################################################

stopifnot(file.exists("TCGA_Reference_Filenames_gh.txt")) 
TCGAfilename<-read.table("TCGA_Reference_Filenames_gh.txt", sep="\t", header=TRUE)

#stopifnot(file.exists("TCGA_Reference_Filenames_zager.txt")) 
#TCGAfilename<-read.table("TCGA_Reference_Filenames_zager.txt", sep="\t", header=TRUE)

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

########################################################################     Step 2: Loading Raw Tables & Data Columns  ########################################################################
os.data.load <- function(uri, columns){
  header <- unlist(strsplit(readLines(uri, n=1),'\t'));
  intersect(header, columns)
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

os.data.save <- function(df, file){
  save(df, file=file)
}
#--------------------------------------------------------------------------------
ptNumMapUpdate <- function(df){
  return(data.frame(PatientID=df$PatientID, 
                    PatientNumber=(seq(1:length(df$PatientID)))))
}
#--------------------------------------------------------------------------------
# fns<-as.character(TCGAfilename[1,3:ncol(TCGAfilename)])
# diseases<-TCGAfilename[2:nrow(TCGAfilename),1]
# files<-TCGAfilename[2:nrow(TCGAfilename),j]



#   for(i in 1:length(fns)){
#     print(fns[i])
#   for (j in 1:length(diseases)){
#     #print(diseases[j])
#     files<-TCGAfilename[i,j]
#     print(files)
#     } 
#   }



# os.import.table.patient <- function(fileInput, fileOutput){ 
#       #important for diseases like LAML that only have a patient table
#    if (length(TCGAfilename[i,"pt"])>0){
#      tbl.pt <- read.table(paste(directory,TCGAfilename[i,"pt"],sep="/") #, quote="", sep="\t", header=TRUE, as.is=TRUE)
    
   

  

# os.data.save <- function(df, file){
# serialized.file.path <-paste("..",study,"inst/extdata",sep="/")
# save(foobar, file=paste(serialized.file.path,"os.mapping.patient.RData",sep="/"))
#    }

