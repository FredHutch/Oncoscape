#all NA (if all set toupper then fix list)
os.enum.na <- c("[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","Uknown","[Discrepancy]","Other","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER","pending", "[not available]","[pending]","OTHER: SPECIFY IN NOTES","[NotAvailable]","OTHER (SPECIFY BELOW)","OTHER", "SPECIFY")

#--------------------------------------------------------------------------------
#BIRTH TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.gender <- c("MALE", "FEMALE")
os.enum.race <- c("WHITE","BLACK OR AFRICAN AMERICAN","ASIAN","AMERICAN INDIAN OR ALASKA NATIVE")
os.enum.ethnicity <- c("HISPANIC OR LATINO","NOT HISPANIC OR LATINO")  
#------------------------------------------------------------------------------
#DIAGNOSIS TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.disease <- c("BREAST","COLON","BRAIN","RECTUM","PROSTATE","LUNG","BLADDER","HEAD AND NECK","PANCREAS","SARCOMA")
#--------------------------------------------------------------------------------
#DRUG TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.route <- c("ORAL","INTRAVENOUS (IV)","INTRATUMORAL","INTRAVESICAL","INTRA-PERITONEAL (IP)|INTRAVENOUS (IV)","SUBCUTANEOUS (SC)","INTRAVENOUS (IV)|ORAL","INTRAMUSCULAR (IM)","INTRAMUSCULAR (IM)|INTRAVENOUS (IV)")                                 

#--------------------------------------------------------------------------------
#STATUS TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.vital <- c("DEAD","ALIVE")  
os.enum.status <- c("WITH TUMOR","TUMOR FREE") 
#--------------------------------------------------------------------------------
#PROGRESSION TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.newTumor <- c("LOCOREGIONAL DISEASE","RECURRENCE" ,"PROGRESSION OF DISEASE","METASTATIC","DISTANT METASTASIS","LOCOREGIONAL RECURRENCE","NEW PRIMARY TUMOR","BIOCHEMICAL EVIDENCE OF DISEASE")                                 
#--------------------------------------------------------------------------------
#ENCOUNTER TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.encType <- c("[NOT AVAILABLE]","PRE-OPERATIVE","PRE-ADJUVANT THERAPY" ,"POST-ADJUVANT THERAPY","ADJUVANT THERAPY","PREOPERATIVE")                                 
#--------------------------------------------------------------------------------
#PROCEDURE TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.side <- c("RIGHT","LEFT", "BILATERAL")    
os.enum.site <- c("RECURRENCE" ,"PROGRESSION OF DISEASE","LOCOREGIONAL DISEASE","METASTATIC","DISTANT METASTASIS","NEW PRIMARY TUMOR", "LOCOREGIONAL RECURRENCE","BIOCHEMICAL EVIDENCE OF DISEASE")                           

#--------------------------------------------------------------------------------
#PATHOLOGY TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.prospective_collection <- c("YES","NO") 
os.enum.retrospective_collection <- c("YES","NO") 

#--------------------------------------------------------------------------------
#ABSENT TABLE VECTORS
#--------------------------------------------------------------------------------
os.enum.radInd <- c("YES","NO")   
os.enum.drugInd <- c("YES","NO")  