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
os.data.batch.inputFile.studyCol <- "study"
os.data.batch.inputFile.dirCol   <- "directory"
os.data.batch.inputFile.fileCols <- c("pt", "drug", "rad","f1","f2", "f3","nte","omf","nte_f1")
os.data.batch.outputDir <- "../tcga.clean/"

dir.create(file.path(os.data.batch.outputDir), showWarnings = FALSE)


# Library Imports ---------------------------------------------------------
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)
library(jsonlite)

json_data <- fromJSON("JSONEnumerations.json")

# Class Definitions :: Enumerations -------------------------------------------------------
os.enum.na <- c("[NOTAVAILABLE]","[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","UKNOWN","[DISCREPANCY]","OTHER","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER","PENDING", "[NOT AVAILABLE]","[PENDING]","OTHER: SPECIFY IN NOTES","[NOTAVAILABLE]","OTHER (SPECIFY BELOW)","OTHER", "SPECIFY", "NOT SPECIFIED")
os.enum.logical.true  <- c("TRUE","YES","1","Y")
os.enum.logical.false <- c("FALSE","NO","0","N")

#os.enum.classes <- list(
     #    "os.class.gender" = c("MALE", "FEMALE"),
     #    "os.class.race" = c("WHITE","BLACK OR AFRICAN AMERICAN","ASIAN","AMERICAN INDIAN OR ALASKA NATIVE"),
     #    "os.class.ethnicity" = c("HISPANIC OR LATINO","NOT HISPANIC OR LATINO"),
	 #    "os.class.tissueSite" = c("BREAST","COLON","BRAIN","RECTUM","PROSTATE","LUNG","BLADDER","HEAD AND NECK","PANCREAS","SARCOMA", "CENTRAL NERVOUS SYSTEM"),
     #    "os.class.route" = c(names"ORAL","INTRAVENOUS (IV)","INTRATUMORAL","INTRAVESICAL","INTRA-PERITONEAL (IP)|INTRAVENOUS (IV)","SUBCUTANEOUS (SC)","INTRAVENOUS (IV)|ORAL","INTRAMUSCULAR (IM)","INTRAMUSCULAR (IM)|INTRAVENOUS (IV)","IV","PO","IM","SC","IV|PO","IM|IV", "IH", "INTUM","IP|IV"),
     #    "os.class.vital" = c("DEAD","ALIVE"),
     #    "os.class.status" = c("WITH TUMOR","TUMOR FREE"),
     #    "os.class.newTumor" = c("LOCOREGIONAL DISEASE","RECURRENCE" ,"PROGRESSION OF DISEASE","METASTATIC","DISTANT METASTASIS","LOCOREGIONAL RECURRENCE","NEW PRIMARY TUMOR","BIOCHEMICAL EVIDENCE OF DISEASE", "LOCOREGIONAL RECURRENCE|DISTANT METASTASIS", "DISTANT METASTASIS|NEW PRIMARY TUMOR", "NO NEW TUMOR EVENT", "LOCOREGIONAL (UROTHELIAL TUMOR EVENT)"),
     #    "os.class.encType" = c("PRE-OPERATIVE","PRE-ADJUVANT THERAPY" ,"POST-ADJUVANT THERAPY","ADJUVANT THERAPY","PREOPERATIVE"),
     #    "os.class.side" = c("RIGHT","LEFT", "BILATERAL", "BOTH", "6TH"),
     #    #"os.class.site" = c("RECURRENCE" ,"PROGRESSION OF DISEASE","LOCOREGIONAL DISEASE","METASTATIC","DISTANT METASTASIS","NEW PRIMARY TUMOR", "LOCOREGIONAL RECURRENCE","BIOCHEMICAL EVIDENCE OF DISEASE")
#)
Map( function(key, value, env=parent.frame()){
        setClass(key)
        setAs("character", key, function(from){ 
                # Convert To Upper + Set NAs  
                from<-toupper(from)	
                from.na<-which(from %in% os.enum.na)
                from[from.na]<-NA    
                
                # Return Enum or NA
                standardVals <- names(json_data[[key]])
                for(fieldName in standardVals){
                  values <-json_data[[key]][[fieldName]]
                  from[ which(from %in% values)] <- fieldName
                }
                
                if(all(from %in% c(standardVals, NA)))
                  return(from)
#                if(all(from %in% c(value, NA))) return(from)	
                
                # Kill If Not In Enum or Na
                stop(paste(key, " not set due to: ", paste(setdiff(from,c(standardVals, NA)), collapse=";"), " not belonging to ", paste(standardVals, collapse=";")))
        })
}, names(json_data), json_data);

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

# Table Mapping Definitions -------------------------------------------------
os.table.mappings <- list(
        "pt" = list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
	                'initial_pathologic_dx_year' = list(name = "dxYear", data = "os.class.tcgaDate"), 
	                #Birth Table 
	                'birth_days_to' = list(name = "dob", data = "os.class.tcgaNumeric"),
	                'gender' = list(name = "gender", data = "os.class.gender"),
	                'ethnicity' = list(name = "ethnicity", data = "os.class.ethnicity"),
	                'race' = list(name = "race", data = "os.class.race"), 
	                #Diagnosis Table 
	                #'tumor_tissue_site' = list(name = "tumorTissueSite", data = "os.class.tissueSite"),
	                'tumor_tissue_site' = list(name = "tumorTissueSite", data = "os.class.tcgaCharacter"),
	                'tissue_source_site' = list(name = "tissueSourceSiteCode", data = "os.class.tcgaCharacter"), 
	                #Status Table 
	                'vital_status' = list(name = "vitalStatus", data = "os.class.vital"),
	                'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
	                'last_contact_days_to' = list(name = "lastContact", data = "os.class.tcgaNumeric"),
	                'death_days_to' = list(name = "deathDate", data = "os.class.tcgaNumeric"), 
	                #Encounter Table 
	                'performance_status_timing' = list(name = "encType", data = "os.class.encType"),
	                'karnofsky_score' = list(name = "KPS", data = "os.class.tcgaNumeric"),
	                'ecog_score' = list(name = "ECOG", data = "os.class.tcgaNumeric"), 
	                #coad / read only 
	                'height_cm_at_diagnosis' = list(name = "height", data = "os.class.tcgaNumeric"),
	                'weight_kg_at_diagnosis' = list(name = "weight", data = "os.class.tcgaNumeric"),
	                #lung only 
	                'fev1_fvc_ratio_prebroncholiator' = list(name = "prefev1Ratio", data = "os.class.tcgaNumeric"),
	                'fev1_percent_ref_prebroncholiator' = list(name = "prefev1Percent", data = "os.class.tcgaNumeric"),
	                'fev1_fvc_ratio_postbroncholiator' = list(name = "postfev1Ratio", data = "os.class.tcgaNumeric"),
	                'fev1_percent_ref_postbroncholiator' = list(name = "postfev1Percent", data = "os.class.tcgaNumeric"),
	                'carbon_monoxide_diffusion_dlco' = list(name = "carbonMonoxideDiffusion", data = "os.class.tcgaNumeric"),
	                # Procedure Table 
	                'laterality' = list(name = "laterality", data = "os.class.tcgaCharacter"),
	                'tumor_site' = list(name = "tumorSite", data = "os.class.tcgaCharacter"),
	                'supratentorial_localization' = list(name = "supratentorialLocalization", data = "os.class.tcgaCharacter"),
	                'surgical_procedure_first' = list(name = "surgicalProcedureFirst", data = "os.class.tcgaCharacter"),
	                'first_surgical_procedure_other' = list(name = "firstSurgicalProcedureOther", data = "os.class.tcgaCharacter"), 
	                #Pathology Table 
	                'days_to_initial_pathologic_diagnosis' = list(name = "initialPathologicDiagnosis", data = "os.class.tcgaNumeric"),
	                'tumor_tissue_site' = list(name = "tumorTissueSite", data = "os.class.tcgaCharacter"),
	                'histological_type' = list(name = "histologicalType", data = "os.class.tcgaCharacter"),
	                'prospective_collection' = list(name = "prospectiveCollection", data = "os.class.tcgaBoolean"),
	                'retrospective_collection' = list(name = "retrospectiveCollection", data = "os.class.tcgaBoolean"),
	                'method_initial_path_dx' = list(name = "pathMethod", data = "os.class.tcgaCharacter"),
	                'ajcc_tumor_pathologic_pt' = list(name = "TStage", data = "os.class.tcgaCharacter"),
	                'ajcc_nodes_pathologic_pn' = list(name = "NStage", data = "os.class.tcgaCharacter"),
	                'ajcc_metastasis_pathologic_pm' = list(name = "MStage", data = "os.class.tcgaCharacter"),
	                'ajcc_pathologic_tumor_stage' = list(name = "SStage", data = "os.class.tcgaCharacter"),
	                'ajcc_staging_edition' = list(name = "stagingSystem", data = "os.class.tcgaCharacter"),
	                'tumor_grade' = list(name = "grade", data = "os.class.tcgaCharacter"), 
	                #Absent Table 
	                'pulmonary_function_test_indicator' = list(name = "pulmonaryFunctionTestIndicator", data = "os.class.tcgaCharacter"), 
	                #Test Table 
	                'days_to_psa_most_recent' = list(name = "psaDate", data = "os.class.tcgaNumeric"),
	                'days_to_bone_scan' = list(name = "boneScanDate", data = "os.class.tcgaNumeric"),
	                'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "os.class.tcgaNumeric"),
	                'days_to_mri' = list(name = "mriDate", data = "os.class.tcgaNumeric"),
	                'idh1_mutation_test_method' = list(name = "idh1Method", data = "os.class.tcgaCharacter"),
	                'idh1_mutation_found' = list(name = "idh1Found", data = "os.class.tcgaCharacter"),
	                'IHC' = list(name = "ihc", data = "os.class.tcgaCharacter"),
	                'kras_mutation_found' = list(name = "krasInd", data = "os.class.tcgaCharacter"),
	                'kras_mutation_identified_type' = list(name = "krasType", data = "os.class.tcgaCharacter"),
	                'egfr_mutation_status' = list(name = "egfrStatus", data = "os.class.tcgaCharacter"),
	                'egfr_mutation_identified_type' = list(name = "egfrType", data = "os.class.tcgaCharacter"),
	                'egfr_amplification_status' = list(name = "egfrAmp", data = "os.class.tcgaCharacter"),
	                'pulmonary_function_test_indicator' = list(name = "pulInd", data = "os.class.tcgaCharacter"),
	                'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "os.class.tcgaCharacter"),
	                'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "os.class.tcgaCharacter"),
	                'kras_mutation_codon' = list(name = "krasCodon", data = "os.class.tcgaCharacter"),
	                'braf_gene_analysis_indicator' = list(name = "brafInd", data = "os.class.tcgaCharacter"),
	                'braf_gene_analysis_result' = list(name = "brafRes", data = "os.class.tcgaCharacter"),
	                'cea_level_pretreatment' = list(name = "ceaTx", data = "os.class.tcgaCharacter"),
	                'loci_tested_count' = list(name = "lociTestCount", data = "os.class.tcgaCharacter"),
	                'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "os.class.tcgaCharacter"),
	                'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "os.class.tcgaCharacter"),
	                'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "os.class.tcgaCharacter"),
	                'hpv_status_p16' = list(name = "hpvP16", data = "os.class.tcgaCharacter"),
	                'hpv_status_ish' = list(name = "hpvIsh", data = "os.class.tcgaCharacter"),
	                'psa_most_recent_results' = list(name = "psaRes", data = "os.class.tcgaCharacter"),
	                'bone_scan_results' = list(name = "boneScaneRes", data = "os.class.tcgaCharacter"),
	                'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "os.class.tcgaCharacter"),
	                'mri_results' = list(name = "mriRes", data = "os.class.tcgaCharacter"),
	                'her2_copy_number' = list(name = "her2CNV", data = "os.class.tcgaCharacter"),
	                'her2_fish_method' = list(name = "her2FishMethod", data = "os.class.tcgaCharacter"),
	                'her2_fish_status' = list(name = "her2FishStatus", data = "os.class.tcgaCharacter"),
	                'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "os.class.tcgaCharacter"),
	                'her2_ihc_score' = list(name = "her2IhcScore", data = "os.class.tcgaCharacter"),
	                'her2_positivity_method_text' = list(name = "her2PosMethod", data = "os.class.tcgaCharacter"),
	                'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "os.class.tcgaCharacter"),
	                'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "os.class.tcgaCharacter"),
	                'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "os.class.tcgaCharacter"),
	                'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "os.class.tcgaCharacter"),
	                'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "os.class.tcgaCharacter"),
	                'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "os.class.tcgaCharacter"),
	                'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "os.class.tcgaCharacter"),
	                'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "os.class.tcgaCharacter"),
	                'nte_her2_status' = list(name = "nteHer2Status", data = "os.class.tcgaCharacter"),
	                'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "os.class.tcgaCharacter"),
	                'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "os.class.tcgaCharacter"),
	                'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "os.class.tcgaCharacter"),
	                'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "os.class.tcgaCharacter"),
	                'nte_er_status' = list(name = "nteEstroStatus", data = "os.class.tcgaCharacter"),
	                'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "os.class.tcgaCharacter"),
	                'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "os.class.tcgaCharacter"),
	                'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "os.class.tcgaCharacter"),
	                'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "os.class.tcgaCharacter"),
	                'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "os.class.tcgaCharacter"),
	                'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "os.class.tcgaCharacter"),
	                'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "os.class.tcgaCharacter"),
	                'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "os.class.tcgaCharacter"),
	                'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "os.class.tcgaCharacter"),
	                'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "os.class.tcgaCharacter"),
	                'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "os.class.tcgaCharacter"),
	                'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "os.class.tcgaCharacter"),
	                'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "os.class.tcgaCharacter"),
	                'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "os.class.tcgaCharacter"),
	                'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "os.class.tcgaCharacter"),
	                'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "os.class.tcgaCharacter"),
	                'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "os.class.tcgaCharacter"),
	                'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "os.class.tcgaCharacter"),
	                'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter"),
	           		#not in original capture
	               	#brca
	                'menopause_status'= list(name = "menopause_status", data = "os.class.tcgaCharacter"),
					'history_other_malignancy'= list(name = "history_other_malignancy", data = "os.class.tcgaCharacter"),
					'history_neoadjuvant_treatment'= list(name = "history_neoadjuvant_treatment", data = "os.class.tcgaCharacter"),
					'radiation_treatment_adjuvant'= list(name = "radiation_treatment_adjuvant", data = "os.class.tcgaCharacter"),
					'pharmaceutical_tx_adjuvant'= list(name = "pharmaceutical_tx_adjuvant", data = "os.class.tcgaCharacter"),
					'histologic_diagnosis_other'= list(name = "histologic_diagnosis_other", data = "os.class.tcgaCharacter"),
					'age_at_diagnosis'= list(name = "age_at_diagnosis", data = "os.class.tcgaCharacter"),
					'method_initial_path_dx_other'= list(name = "method_initial_path_dx_other", data = "os.class.tcgaCharacter"),
					'margin_status'= list(name = "margin_status", data = "os.class.tcgaCharacter"),
					'surgery_for_positive_margins'= list(name = "surgery_for_positive_margins", data = "os.class.tcgaCharacter"),
					'surgery_for_positive_margins_other'= list(name = "surgery_for_positive_margins_other", data = "os.class.tcgaCharacter"),
					'margin_status_reexcision'= list(name = "margin_status_reexcision", data = "os.class.tcgaCharacter"),
					'axillary_staging_method'= list(name = "axillary_staging_method", data = "os.class.tcgaCharacter"),
					'axillary_staging_method_other'= list(name = "axillary_staging_method_other", data = "os.class.tcgaCharacter"),
					'micromet_detection_by_ihc'= list(name = "micromet_detection_by_ihc", data = "os.class.tcgaCharacter"),
					'lymph_nodes_examined'= list(name = "lymph_nodes_examined", data = "os.class.tcgaCharacter"),
					'lymph_nodes_examined_count'= list(name = "lymph_nodes_examined_count", data = "os.class.tcgaCharacter"),
					'lymph_nodes_examined_he_count'= list(name = "lymph_nodes_examined_he_count", data = "os.class.tcgaCharacter"),
					'lymph_nodes_examined_ihc_count'= list(name = "lymph_nodes_examined_ihc_count", data = "os.class.tcgaCharacter"),
					'metastasis_site'= list(name = "metastasis_site", data = "os.class.tcgaCharacter"),
					'metastasis_site_other'= list(name = "metastasis_site_other", data = "os.class.tcgaCharacter"),
					'er_status_by_ihc'= list(name = "er_status_by_ihc", data = "os.class.tcgaCharacter"),
					'er_status_ihc_Percent_Positive'= list(name = "er_status_ihc_Percent_Positive", data = "os.class.tcgaCharacter"),
					'er_positivity_scale_used'= list(name = "er_positivity_scale_used", data = "os.class.tcgaCharacter"),
					'er_ihc_score'= list(name = "er_ihc_score", data = "os.class.tcgaCharacter"),
					'er_positivity_scale_other'= list(name = "er_positivity_scale_other", data = "os.class.tcgaCharacter"),
					'er_positivity_method'= list(name = "er_positivity_method", data = "os.class.tcgaCharacter"),
					'pr_status_ihc_percent_positive'= list(name = "pr_status_ihc_percent_positive", data = "os.class.tcgaCharacter"),
					'cent17_copy_number'= list(name = "cent17_copy_number", data = "os.class.tcgaCharacter"),
					'new_tumor_event_dx_indicator'= list(name = "new_tumor_event_dx_indicator", data = "os.class.tcgaCharacter"),
					'nte_er_status_ihc__positive'= list(name = "nte_er_status_ihc__positive", data = "os.class.tcgaCharacter"),
					'nte_pr_status_ihc__positive'= list(name = "nte_pr_status_ihc__positive", data = "os.class.tcgaCharacter"),
					'nte_her2_status_ihc__positive'= list(name = "nte_her2_status_ihc__positive", data = "os.class.tcgaCharacter"),
					'anatomic_neoplasm_subdivision'= list(name = "anatomic_neoplasm_subdivision", data = "os.class.tcgaCharacter"),
					'metastatic_tumor_indicator'= list(name = "metastatic_tumor_indicator", data = "os.class.tcgaCharacter"),
					#coad
					'histologic_diagnosis'= list(name = "histologic_diagnosis", data = "os.class.tcgaCharacter"),
					'history_other_malignancy'= list(name = "history_other_malignancy", data = "os.class.tcgaCharacter"),
					'history_neoadjuvant_treatment'= list(name = "history_neoadjuvant_treatment", data = "os.class.tcgaCharacter"),
					'residual_tumor'= list(name = "residual_tumor", data = "os.class.tcgaCharacter"),
					'specimen_non_node_tumor_deposits'= list(name = "specimen_non_node_tumor_deposits", data = "os.class.tcgaCharacter"),
					'circumferential_resection_margin_crm'= list(name = "circumferential_resection_margin_crm", data = "os.class.tcgaCharacter"),
					'vascular_invasion_indicator'= list(name = "vascular_invasion_indicator", data = "os.class.tcgaCharacter"),
					'lymphovascular_invasion_indicator'= list(name = "lymphovascular_invasion_indicator", data = "os.class.tcgaCharacter"),
					'perineural_invasion'= list(name = "perineural_invasion", data = "os.class.tcgaCharacter"),
					'microsatellite_instability'= list(name = "microsatellite_instability", data = "os.class.tcgaCharacter"),
					'kras_gene_analysis_indicator'= list(name = "kras_gene_analysis_indicator", data = "os.class.tcgaCharacter"),
					'history_colon_polyps'= list(name = "history_colon_polyps", data = "os.class.tcgaCharacter"),
					'colon_polyps_at_procurement_indicator'= list(name = "colon_polyps_at_procurement_indicator", data = "os.class.tcgaCharacter"),
					'family_history_colorectal_cancer'= list(name = "family_history_colorectal_cancer", data = "os.class.tcgaCharacter"),
					'treatment_outcome_first_course'= list(name = "treatment_outcome_first_course", data = "os.class.tcgaCharacter"),
					'age_at_initial_pathologic_diagnosis'= list(name = "age_at_initial_pathologic_diagnosis", data = "os.class.tcgaCharacter"),
					'initial_pathologic_diagnosis_method'= list(name = "initial_pathologic_diagnosis_method", data = "os.class.tcgaCharacter"),
	        		#gbm
	                'history_lgg_dx_of_brain_tissue'= list(name = "history_lgg_dx_of_brain_tissue", data = "os.class.tcgaCharacter"),
	    	 		#hnsc
					'anatomic_organ_subdivision'= list(name = "anatomic_organ_subdivision", data = "os.class.tcgaCharacter"),
					'lymph_node_neck_dissection_indicator'= list(name = "lymph_node_neck_dissection_indicator", data = "os.class.tcgaCharacter"),
					'lymph_node_dissection_method'= list(name = "lymph_node_dissection_method", data = "os.class.tcgaCharacter"),
					'extracapsular_spread_pathologic'= list(name = "extracapsular_spread_pathologic", data = "os.class.tcgaCharacter"),
					'tobacco_smoking_history_indicator'= list(name = "tobacco_smoking_history_indicator", data = "os.class.tcgaCharacter"),
					'tobacco_smoking_year_started'= list(name = "tobacco_smoking_year_started", data = "os.class.tcgaCharacter"),
					'tobacco_smoking_year_stopped'= list(name = "tobacco_smoking_year_stopped", data = "os.class.tcgaCharacter"),
					'tobacco_smoking_pack_years_smoked'= list(name = "tobacco_smoking_pack_years_smoked", data = "os.class.tcgaCharacter"),
					'alcohol_history_documented'= list(name = "alcohol_history_documented", data = "os.class.tcgaCharacter"),
					'alcohol_consumption_frequency'= list(name = "alcohol_consumption_frequency", data = "os.class.tcgaCharacter"),
					'alcohol_consumption_per_day'= list(name = "alcohol_consumption_per_day", data = "os.class.tcgaCharacter"),
					'clinical_M'= list(name = "clinical_M", data = "os.class.tcgaCharacter"),
					'clinical_N'= list(name = "clinical_N", data = "os.class.tcgaCharacter"),
					'clinical_T'= list(name = "clinical_T", data = "os.class.tcgaCharacter"),
					'clinical_stage'= list(name = "clinical_stage", data = "os.class.tcgaCharacter"),
					'lymphovascular_invasion'= list(name = "lymphovascular_invasion", data = "os.class.tcgaCharacter"),
					#lgg
					'history_ionizing_rt_to_head'= list(name = "history_ionizing_rt_to_head", data = "os.class.tcgaCharacter"),
					'history_seizures'= list(name = "history_seizures", data = "os.class.tcgaCharacter"),
					'history_headaches'= list(name = "history_headaches", data = "os.class.tcgaCharacter"),
					'symp_changes_mental_status'= list(name = "symp_changes_mental_status", data = "os.class.tcgaCharacter"),
					'symp_changes_visual'= list(name = "symp_changes_visual", data = "os.class.tcgaCharacter"),
					'symp_changes_sensory'= list(name = "symp_changes_sensory", data = "os.class.tcgaCharacter"),
					'symp_changes_motor_movement'= list(name = "symp_changes_motor_movement", data = "os.class.tcgaCharacter"),
					'related_symptom_first_present'= list(name = "related_symptom_first_present", data = "os.class.tcgaCharacter"),
					'first_symptom_longest_duration'= list(name = "first_symptom_longest_duration", data = "os.class.tcgaCharacter"),
					'history_asthma'= list(name = "history_asthma", data = "os.class.tcgaCharacter"),
					'history_eczema'= list(name = "history_eczema", data = "os.class.tcgaCharacter"),
					'histor_hay_fever'= list(name = "history_hay_fever", data = "os.class.tcgaCharacter"),
					'history_dust_mold_allergy'= list(name = "history_dust_mold_allergy", data = "os.class.tcgaCharacter"),
					'asthma_eczema_allergy_first_dx'= list(name = "asthma_eczema_allergy_first_dx", data = "os.class.tcgaCharacter"),
					'allergy_food_dx_indicator'= list(name = "allergy_food_dx_indicator", data = "os.class.tcgaCharacter"),
					'allergy_food_dx_type'= list(name = "allergy_food_dx_type", data = "os.class.tcgaCharacter"),
					'allergy_food_dx_age'= list(name = "allergy_food_dx_age", data = "os.class.tcgaCharacter"),
					'allergy_animals_insects_dx_indicator'= list(name = "allergy_animals_insects_dx_indicator", data = "os.class.tcgaCharacter"),
					'allergy_animals_insects_dx_type'= list(name = "allergy_animals_insects_dx_type", data = "os.class.tcgaCharacter"),
					'allergy_animals_insects_dx_age'= list(name = "allergy_animals_insects_dx_age", data = "os.class.tcgaCharacter"),
					'history_neoadjuvant_steroid_tx'= list(name = "history_neoadjuvant_steroid_tx", data = "os.class.tcgaCharacter"),
					'history_neoadjuvant_medication'= list(name = "history_neoadjuvant_medication", data = "os.class.tcgaCharacter"),
					'family_history_cancer_indicator'= list(name = "family_history_cancer_indicator", data = "os.class.tcgaCharacter"),
					'family_history_brain_tumor'= list(name = "family_history_brain_tumor", data = "os.class.tcgaCharacter"),
					'idh1_mutation_test_indicator'= list(name = "idh1_mutation_test_indicator", data = "os.class.tcgaCharacter"),
					'inherited_genetic_syndrome_indicator'= list(name = "inherited_genetic_syndrome_indicator", data = "os.class.tcgaCharacter"),
					'inherited_genetic_syndrome_specified'= list(name = "inherited_genetic_syndrome_specified", data = "os.class.tcgaCharacter"),
					'performance_status_days_to'= list(name = "performance_status_days_to", data = "os.class.tcgaNumeric"),
					'targeted_molecular_therapy'= list(name = "targeted_molecular_therapy", data = "os.class.tcgaCharacter"),
					#luad
					'submitted_tumor_site'= list(name = "submitted_tumor_site", data = "os.class.tcgaCharacter"),
					'anatomic_organ_subdivision'= list(name = "anatomic_organ_subdivision", data = "os.class.tcgaCharacter"),
					'location_lung_parenchyma'= list(name = "location_lung_parenchyma", data = "os.class.tcgaCharacter"),
					'eml4_alk_analysis_type'= list(name = "eml4_alk_analysis_type", data = "os.class.tcgaCharacter"),
					'anatomic_neoplasm_subdivision_other'= list(name = "anatomic_neoplasm_subdivision_other", data = "os.class.tcgaCharacter"),
					#lusc all listed
					#prad
					'zone_of_origin'= list(name = "zone_of_origin", data = "os.class.tcgaCharacter"),
					'gleason_pattern_primary'= list(name = "gleason_pattern_primary", data = "os.class.tcgaCharacter"),
					'leason_pattern_secondary'= list(name = "leason_pattern_secondary", data = "os.class.tcgaCharacter"),
					'gleason_score'= list(name = "gleason_score", data = "os.class.tcgaCharacter"),
					'gleason_pattern_tertiary'= list(name = "gleason_pattern_tertiary", data = "os.class.tcgaCharacter"),
					'tumor_level'= list(name = "tumor_level", data = "os.class.tcgaCharacter"),
					'ct_scan_ab_pelvis_indicator'= list(name = "ct_scan_ab_pelvis_indicator", data = "os.class.tcgaCharacter"),
					'mri_at_diagnosis'= list(name = "mri_at_diagnosis", data = "os.class.tcgaCharacter"),
					'cause_of_death'= list(name = "cause_of_death", data = "os.class.tcgaCharacter"),
					'cause_of_death_source'= list(name = "cause_of_death_source", data = "os.class.tcgaCharacter"),
					'biochemical_recurrence_indicator'= list(name = "biochemical_recurrence_indicator", data = "os.class.tcgaCharacter"),
					'days_to_biochemical_recurrence_first'= list(name = "days_to_biochemical_recurrence_first", data = "os.class.tcgaNumeric"),
					'pathologic_N'= list(name = "pathologic_N", data = "os.class.tcgaCharacter"),
					'pathologic_T'= list(name = "pathologic_T", data = "os.class.tcgaCharacter"),
					'gleason_pattern_secondary'= list(name = "gleason_pattern_secondary", data = "os.class.tcgaCharacter"),
					#read all listed
					#sarc 
					'histologic_subtype'= list(name = "histologic_subtype", data = "os.class.tcgaCharacter"),
					'leiomyosarcoma_uterine_involvement'= list(name = "leiomyosarcoma_uterine_involvement", data = "os.class.tcgaCharacter"),
					'leiomyo_major_vessel_involvement'= list(name = "leiomyo_major_vessel_involvement", data = "os.class.tcgaCharacter"),
					'synovial_ss18ssx_fusion_status'= list(name = "synovial_ss18ssx_fusion_status", data = "os.class.tcgaCharacter"),
					'synovial_ss18ssx_testing_method'= list(name = "synovial_ss18ssx_testing_method", data = "os.class.tcgaCharacter"),
					'mpnst_nf_indicator'= list(name = "mpnst_nf_indicator", data = "os.class.tcgaCharacter"),
					'mpnst_nf_familial_or_sporadic'= list(name = "mpnst_nf_familial_or_sporadic", data = "os.class.tcgaCharacter"),
					'mpnst_plexiform_neurofibroma_site'= list(name = "mpnst_plexiform_neurofibroma_site", data = "os.class.tcgaCharacter"),
					'mpnst_nf1_genetic_testing_indicator'= list(name = "mpnst_nf1_genetic_testing_indicator", data = "os.class.tcgaCharacter"),
					'mpnst_nf1_mutations_identified'= list(name = "mpnst_nf1_mutations_identified", data = "os.class.tcgaCharacter"),
					'tumor_total_depth'= list(name = "tumor_total_depth", data = "os.class.tcgaCharacter"),
					'site_of_primary_tumor_other'= list(name = "site_of_primary_tumor_other", data = "os.class.tcgaCharacter"),
					'tumor_total_necrosis'= list(name = "tumor_total_necrosis", data = "os.class.tcgaCharacter"),
					'necrosis_percent'= list(name = "necrosis_percent", data = "os.class.tcgaCharacter"),
					'mitotic_count'= list(name = "mitotic_count", data = "os.class.tcgaCharacter"),
					'disease_multifocal_indicator'= list(name = "disease_multifocal_indicator", data = "os.class.tcgaCharacter"),
					'discontinuous_lesions_count'= list(name = "discontinuous_lesions_count", data = "os.class.tcgaCharacter"),
					'tumor_burden_radiologic'= list(name = "tumor_burden_radiologic", data = "os.class.tcgaCharacter"),
					'tumor_burden_pathologic'= list(name = "tumor_burden_pathologic", data = "os.class.tcgaCharacter"),
					'locoregional_recurrence_indicator'= list(name = "locoregional_recurrence_indicator", data = "os.class.tcgaCharacter"),
					'metastatic_disease_confirmed'= list(name = "metastatic_disease_confirmed", data = "os.class.tcgaCharacter"),
					'contiguous_organ_resection'= list(name = "contiguous_organ_resection", data = "os.class.tcgaCharacter"),
					'contiguous_organ_resection_other'= list(name = "contiguous_organ_resection_other", data = "os.class.tcgaCharacter"),
					'contiguous_organ_invaded'= list(name = "contiguous_organ_invaded", data = "os.class.tcgaCharacter"),
					'well_diff_liposarc_prior_dx_indicator'= list(name = "well_diff_liposarc_prior_dx_indicator", data = "os.class.tcgaCharacter"),
					'well_diff_liposarc_prior_dx_days_to'= list(name = "well_diff_liposarc_prior_dx_days_to", data = "os.class.tcgaNumeric"),
					'well_diff_liposarc_resection_days_to'= list(name = "well_diff_liposarc_resection_days_to", data = "os.class.tcgaNumeric"),
					'nte_lesion_radiologic_length'= list(name = "nte_lesion_radiologic_length", data = "os.class.tcgaCharacter"),
					'nte_lesion_radiologic_width'= list(name = "nte_lesion_radiologic_width", data = "os.class.tcgaCharacter"),
					'nte_lesion_radiologic_depth'= list(name = "nte_lesion_radiologic_depth", data = "os.class.tcgaCharacter"),
					'nte_lesion_pathologic_length'= list(name = "nte_lesion_pathologic_length", data = "os.class.tcgaCharacter"),
					'nte_lesion_pathologic_width'= list(name = "nte_lesion_pathologic_width", data = "os.class.tcgaCharacter"),
					'nte_lesion_pathologic_depth'= list(name = "nte_lesion_pathologic_depth", data = "os.class.tcgaCharacter"),
					#laml
					'history_hematologic_disorder'= list(name = "history_hematologic_disorder", data = "os.class.tcgaCharacter"),
					'history_neoadjuvant_hydroxyurea_tx'= list(name = "history_neoadjuvant_hydroxyurea_tx", data = "os.class.tcgaCharacter"),
					'hydroxyurea_tx_days'= list(name = "hydroxyurea_tx_days", data = "os.class.tcgaNumeric"),
					'total_dose'= list(name = "total_dose", data = "os.class.tcgaCharacter"),
					'history_exposure_leukemogenic_agents'= list(name = "history_exposure_leukemogenic_agents", data = "os.class.tcgaCharacter"),
					'cells_used_for_analysis_source'= list(name = "cells_used_for_analysis_source", data = "os.class.tcgaCharacter"),
					'percent_blasts_peripheral_blood'= list(name = "percent_blasts_peripheral_blood", data = "os.class.tcgaCharacter"),
					'fab_category'= list(name = "fab_category", data = "os.class.tcgaCharacter"),
					'cyto_and_immuno_test_performed'= list(name = "cyto_and_immuno_test_performed", data = "os.class.tcgaCharacter"),
					'cyto_and_immuno_test_percentage'= list(name = "cyto_and_immuno_test_percentage", data = "os.class.tcgaCharacter"),
					'percent_cellularity'= list(name = "percent_cellularity", data = "os.class.tcgaCharacter"),
					'wbc_24hr_of_banking'= list(name = "wbc_24hr_of_banking", data = "os.class.tcgaCharacter"),
					'hemoglobin_24hr_of_banking'= list(name = "hemoglobin_24hr_of_banking", data = "os.class.tcgaCharacter"),
					'hematocrit_24hr_of_banking'= list(name = "hematocrit_24hr_of_banking", data = "os.class.tcgaCharacter"),
					'platelet_count_preresection'= list(name = "platelet_count_preresection", data = "os.class.tcgaCharacter"),
					'blast_count'= list(name = "blast_count", data = "os.class.tcgaCharacter"),
					'promyelocytes_count'= list(name = "promyelocytes_count", data = "os.class.tcgaCharacter"),
					'myelocytes_24hr_of_banking'= list(name = "myelocytes_24hr_of_banking", data = "os.class.tcgaCharacter"),
					'metamyelocytes_24hr_of_banking'= list(name = "metamyelocytes_24hr_of_banking", data = "os.class.tcgaCharacter"),
					'bands_24hr_of_banking'= list(name = "bands_24hr_of_banking", data = "os.class.tcgaCharacter"),
					'segs_24hr_of_banking'= list(name = "segs_24hr_of_banking", data = "os.class.tcgaCharacter"),
					'basophils_count'= list(name = "basophils_count", data = "os.class.tcgaCharacter"),
					'lymphocytes_count'= list(name = "lymphocytes_count", data = "os.class.tcgaCharacter"),
					'monocytes_count'= list(name = "monocytes_count", data = "os.class.tcgaCharacter"),
					'prolymphocytes_24hr_of_banking'= list(name = "prolymphocytes_24hr_of_banking", data = "os.class.tcgaCharacter"),
					'promonocytes_24hr_of_banking'= list(name = "promonocytes_24hr_of_banking", data = "os.class.tcgaCharacter"),
					'abnormal_lymphocyte_percent'= list(name = "abnormal_lymphocyte_percent", data = "os.class.tcgaCharacter"),
					'cytogenetics_testing_performed'= list(name = "cytogenetics_testing_performed", data = "os.class.tcgaCharacter"),
					'metaphases_count'= list(name = "metaphases_count", data = "os.class.tcgaCharacter"),
					'cyto_risk_group'= list(name = "cyto_risk_group", data = "os.class.tcgaCharacter"),
					'cytogenetic_abnormality_type'= list(name = "cytogenetic_abnormality_type", data = "os.class.tcgaCharacter"),
					'cyto_abnormality_type_other'= list(name = "cyto_abnormality_type_other", data = "os.class.tcgaCharacter"),
					'fish_performed_indicator'= list(name = "fish_performed_indicator", data = "os.class.tcgaCharacter"),
					'fish_abnormality_detected'= list(name = "fish_abnormality_detected", data = "os.class.tcgaCharacter"),
					'test_performed_indicator'= list(name = "test_performed_indicator", data = "os.class.tcgaCharacter"),
					'fish_performed_outcome'= list(name = "fish_performed_outcome", data = "os.class.tcgaCharacter"),
					'molecular_studies_others_performed'= list(name = "molecular_studies_others_performed", data = "os.class.tcgaCharacter"),
					'molecular_analysis_method_type'= list(name = "molecular_analysis_method_type", data = "os.class.tcgaCharacter"),
					'molecular_abnormality_detected'= list(name = "molecular_abnormality_detected", data = "os.class.tcgaCharacter"),
					'molecular_abnormality_results'= list(name = "molecular_abnormality_results", data = "os.class.tcgaCharacter"),
					'molecular_abnormality_percent'= list(name = "molecular_abnormality_percent", data = "os.class.tcgaCharacter"),
					'atra_exposure'= list(name = "atra_exposure", data = "os.class.tcgaCharacter"),
					'initial_pathologic_dx_days_to'= list(name = "initial_pathologic_dx_days_to", data = "os.class.tcgaNumeric"),
					'pharmaceutical_tx_total_dose_units'= list(name = "pharmaceutical_tx_total_dose_units", data = "os.class.tcgaCharacter"),
					'steroid_therapy_administered'= list(name = "steroid_therapy_administered", data = "os.class.tcgaCharacter"),
					#blca
					'noninvasive_bladder_history'= list(name = "noninvasive_bladder_history", data = "os.class.tcgaCharacter"),
					'noninvasive_bladder_ca_tx_type'= list(name = "noninvasive_bladder_ca_tx_type", data = "os.class.tcgaCharacter"),
					'bcg_tx_90_days_prior_to_resection'= list(name = "bcg_tx_90_days_prior_to_resection", data = "os.class.tcgaNumeric"),
					'bcg_tx_complete_response'= list(name = "bcg_tx_complete_response", data = "os.class.tcgaCharacter"),
					'bcg_tx_induction_courses_indicator'= list(name = "bcg_tx_induction_courses_indicator", data = "os.class.tcgaCharacter"),
					'bcg_tx_maintenance_courses_indicator'= list(name = "bcg_tx_maintenance_courses_indicator", data = "os.class.tcgaCharacter"),
					'bcg_complete_response_months'= list(name = "bcg_complete_response_months", data = "os.class.tcgaCharacter"),
					'occupation_current'= list(name = "occupation_current", data = "os.class.tcgaCharacter"),
					'occupation_primary'= list(name = "occupation_primary", data = "os.class.tcgaCharacter"),
					'occupation_primary_chemical_exposure'= list(name = "occupation_primary_chemical_exposure", data = "os.class.tcgaCharacter"),
					'occupation_primary_industry'= list(name = "occupation_primary_industry", data = "os.class.tcgaCharacter"),
					'occupation_primary_years_worked'= list(name = "occupation_primary_years_worked", data = "os.class.tcgaCharacter"),
					'family_history_cancer_relationship'= list(name = "family_history_cancer_relationship", data = "os.class.tcgaCharacter"),
					'family_history_cancer_type'= list(name = "family_history_cancer_type", data = "os.class.tcgaCharacter"),
					'extracapsular_extension'= list(name = "extracapsular_extension", data = "os.class.tcgaCharacter"),
					'extracapsular_extension_present'= list(name = "extracapsular_extension_present", data = "os.class.tcgaCharacter"),
					'metastatic_site_other'= list(name = "metastatic_site_other", data = "os.class.tcgaCharacter"),
					'incidental_prostate_cancer_indicator'= list(name = "incidental_prostate_cancer_indicator", data = "os.class.tcgaCharacter"),
					'ajcc_path_pt_incidental_prostate'= list(name = "ajcc_path_pt_incidental_prostate", data = "os.class.tcgaCharacter"),
					'neoplasm_histologic_grade'= list(name = "steroid_therapy_administered", data = "os.class.tcgaCharacter"),
					'tobacco_smoking_age_started'= list(name = "tobacco_smoking_age_started", data = "os.class.tcgaCharacter"),
					#paad
					'invasive_adenocarcinoma_indicator'= list(name = "invasive_adenocarcinoma_indicator", data = "os.class.tcgaCharacter"),
					'tumor_sample_type'= list(name = "tumor_sample_type", data = "os.class.tcgaCharacter"),
					'surgical_procedure'= list(name = "surgical_procedure", data = "os.class.tcgaCharacter"),
					'grade_tier_system'= list(name = "grade_tier_system", data = "os.class.tcgaCharacter"),
					'tumor_resected_max_dimension'= list(name = "tumor_resected_max_dimension", data = "os.class.tcgaCharacter"),
					'alcohol_exposure_intensity'= list(name = "alcohol_exposure_intensity", data = "os.class.tcgaCharacter"),
					'diabetes_diagnosis_indicator'= list(name = "diabetes_diagnosis_indicator", data = "os.class.tcgaCharacter"),
					'diabetes_diagnosis_days_to'= list(name = "diabetes_diagnosis_days_to", data = "os.class.tcgaNumeric"),
					'history_chronic_pancreatitis'= list(name = "history_chronic_pancreatitis", data = "os.class.tcgaCharacter"),
					'history_chronic_pancreatitis_days_to'= list(name = "history_chronic_pancreatitis_days_to", data = "os.class.tcgaNumeric")
        ),
        "drug"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
                     'pharmaceutical_tx_started_days_to' = list(name = "drugStart", data = "os.class.tcgaNumeric"),
                     'pharmaceutical_tx_ended_days_to' = list(name = "drugEnd", data = "os.class.tcgaNumeric"),
                     'pharmaceutical_therapy_drug_name' = list(name = "DrugTherapyName", data = "os.class.drugAgent"),
                     'pharmaceutical_therapy_type' = list(name = "drugType", data = "os.class.tcgaCharacter"),
                     'therapy_regimen' = list(name = "drugTherapyRegimen", data = "os.class.tcgaCharacter"),
                     'prescribed_dose' = list(name = "drugDose", data = "os.class.tcgaCharacter"),
                     'total_dose' = list(name = "drugTotalDose", data = "os.class.tcgaCharacter"),
                     'pharmaceutical_tx_dose_units' = list(name = "drugUnits", data = "os.class.tcgaCharacter"),
                     'pharmaceutical_tx_total_dose_units' = list(name = "drugTotalDoseUnits", data = "os.class.tcgaCharacter"),
                     'route_of_administration' = list(name = "drugAdministration", data = "os.class.route"),
                     'pharma_adjuvant_cycles_count' = list(name = "drugCycles", data = "os.class.tcgaCharacter"),
        			 #not in original (shared among datasets)
        			 'clinical_trial_drug_classification'= list(name = "clinical_trial_drug_classification", data = "os.class.tcgaCharacter"),
					 'pharmaceutical_tx_ongoing_indicator'= list(name = "pharmaceutical_tx_ongoing_indicator", data = "os.class.tcgaCharacter"),
					 'treatment_best_response'= list(name = "treatment_best_response", data = "os.class.tcgaCharacter"),
					 'pharma_type_other'= list(name = "pharma_type_other", data = "os.class.tcgaCharacter"),
					 'regimen_number'= list(name = "regimen_number", data = "os.class.tcgaCharacter"),
					 'therapy_regimen_other'= list(name = "therapy_regimen_other", data = "os.class.tcgaCharacter"),
					 'tx_on_clinical_trial' = list(name = "tx_on_clinical_trial", data = "os.class.tcgaCharacter")

        ),
        "rad"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
                    'radiation_therapy_started_days_to' = list(name = "radStart", data = "os.class.tcgaNumeric"),
                    'radiation_therapy_ended_days_to' = list(name = "radEnd", data = "os.class.tcgaNumeric"),
                    'radiation_therapy_type' = list(name = "radType", data = "os.class.radiationType"),
                    'radiation_type_other' = list(name = "radTypeOther", data = "os.class.radiationTypeOther"),
                    'therapy_regimen' = list(name = "radiationTherapyRegimen", data = "os.class.tcgaCharacter"),
                    'radiation_therapy_site' = list(name = "radiationTherapySite", data = "os.class.tcgaCharacter"),
                    'radiation_total_dose' = list(name = "radiationTotalDose", data = "os.class.tcgaCharacter"),
                    'radiation_adjuvant_units' = list(name = "radiationTotalDoseUnits", data = "os.class.tcgaCharacter"),
                    'radiation_adjuvant_fractions_total' = list(name = "radiationNumFractions", data = "os.class.tcgaCharacter"),
        			#not in original (shared among datasets)
        			'radiation_therapy_ongoing_indicator' = list(name = "radiation_therapy_ongoing_indicator", data = "os.class.tcgaCharacter"),
					'treatment_best_response' = list(name = "treatment_best_response", data = "os.class.tcgaCharacter"),
					'course_number' = list(name = "course_number", data = "os.class.tcgaCharacter"),
					'therapy_regimen_other'  = list(name = "therapy_regimen_other", data = "os.class.tcgaCharacter")


        ),
        "f1"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"), 
                   #Status Table 
                   'vital_status' = list(name = "vitalStatus", data = "os.class.vital"),
                   'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
                   'last_contact_days_to' = list(name = "lastContact", data = "os.class.tcgaNumeric"),
                   'death_days_to' = list(name = "deathDate", data = "os.class.tcgaNumeric"), 
                   #Progression Table 
                   'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "os.class.tcgaNumeric"),
                   'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
                   'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor"), 
                   #Encounter Table 
                   'performance_status_timing' = list(name = "encType", data = "os.class.encType"),
                   'karnofsky_score' = list(name = "KPS", data = "os.class.tcgaNumeric"),
                   'ecog_score' = list(name = "ECOG", data = "os.class.tcgaNumeric"), 
                   #Absent Table 
                   'new_tumor_event_dx_days_to' = list(name = "newTumorEventDxDaysTo", data = "os.class.tcgaNumeric"),
                   'new_tumor_event_radiation_tx' = list(name = "newTumorEventRadiationTx", data = "os.class.tcgaBoolean"),
                   'new_tumor_event_pharmaceutical_tx' = list(name = "newTumorEventPharmaceuticalTx", data = "os.class.tcgaBoolean"), 
                   # Procedure Table 
                    'new_tumor_event_surgery_days_to_loco' = list(name = "dateLocoregional", data = "os.class.tcgaNumeric"),
                    'new_tumor_event_surgery_days_to_met' = list(name = "dateMetastatic", data = "os.class.tcgaNumeric"),
                    'new_tumor_event_surgery' = list(name = "newTumorEventSurgery", data = "os.class.tcgaCharacter"),
                   #Test Table 
                   'days_to_psa_most_recent' = list(name = "psaDate", data = "os.class.tcgaNumeric"),
                   'days_to_bone_scan' = list(name = "boneScanDate", data = "os.class.tcgaNumeric"),
                   'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "os.class.tcgaNumeric"),
                   'days_to_mri' = list(name = "mriDate", data = "os.class.tcgaNumeric"),
                   'idh1_mutation_test_method' = list(name = "idh1Method", data = "os.class.tcgaCharacter"),
                   'idh1_mutation_found' = list(name = "idh1Found", data = "os.class.tcgaCharacter"),
                   'IHC' = list(name = "ihc", data = "os.class.tcgaCharacter"),
                   'kras_mutation_found' = list(name = "krasInd", data = "os.class.tcgaCharacter"),
                   'kras_mutation_identified_type' = list(name = "krasType", data = "os.class.tcgaCharacter"),
                   'egfr_mutation_status' = list(name = "egfrStatus", data = "os.class.tcgaCharacter"),
                   'egfr_mutation_identified_type' = list(name = "egfrType", data = "os.class.tcgaCharacter"),
                   'egfr_amplification_status' = list(name = "egfrAmp", data = "os.class.tcgaCharacter"),
                   'pulmonary_function_test_indicator' = list(name = "pulInd", data = "os.class.tcgaCharacter"),
                   'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "os.class.tcgaCharacter"),
                   'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "os.class.tcgaCharacter"),
                   'kras_mutation_codon' = list(name = "krasCodon", data = "os.class.tcgaCharacter"),
                   'braf_gene_analysis_indicator' = list(name = "brafInd", data = "os.class.tcgaCharacter"),
                   'braf_gene_analysis_result' = list(name = "brafRes", data = "os.class.tcgaCharacter"),
                   'cea_level_pretreatment' = list(name = "ceaTx", data = "os.class.tcgaCharacter"),
                   'loci_tested_count' = list(name = "lociTestCount", data = "os.class.tcgaCharacter"),
                   'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "os.class.tcgaCharacter"),
                   'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "os.class.tcgaCharacter"),
                   'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "os.class.tcgaCharacter"),
                   'hpv_status_p16' = list(name = "hpvP16", data = "os.class.tcgaCharacter"),
                   'hpv_status_ish' = list(name = "hpvIsh", data = "os.class.tcgaCharacter"),
                   'psa_most_recent_results' = list(name = "psaRes", data = "os.class.tcgaCharacter"),
                   'bone_scan_results' = list(name = "boneScaneRes", data = "os.class.tcgaCharacter"),
                   'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "os.class.tcgaCharacter"),
                   'mri_results' = list(name = "mriRes", data = "os.class.tcgaCharacter"),
                   'her2_copy_number' = list(name = "her2CNV", data = "os.class.tcgaCharacter"),
                   'her2_fish_method' = list(name = "her2FishMethod", data = "os.class.tcgaCharacter"),
                   'her2_fish_status' = list(name = "her2FishStatus", data = "os.class.tcgaCharacter"),
                   'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "os.class.tcgaCharacter"),
                   'her2_ihc_score' = list(name = "her2IhcScore", data = "os.class.tcgaCharacter"),
                   'her2_positivity_method_text' = list(name = "her2PosMethod", data = "os.class.tcgaCharacter"),
                   'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "os.class.tcgaCharacter"),
                   'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "os.class.tcgaCharacter"),
                   'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "os.class.tcgaCharacter"),
                   'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "os.class.tcgaCharacter"),
                   'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "os.class.tcgaCharacter"),
                   'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "os.class.tcgaCharacter"),
                   'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "os.class.tcgaCharacter"),
                   'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "os.class.tcgaCharacter"),
                   'nte_her2_status' = list(name = "nteHer2Status", data = "os.class.tcgaCharacter"),
                   'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "os.class.tcgaCharacter"),
                   'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "os.class.tcgaCharacter"),
                   'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "os.class.tcgaCharacter"),
                   'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "os.class.tcgaCharacter"),
                   'nte_er_status' = list(name = "nteEstroStatus", data = "os.class.tcgaCharacter"),
                   'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "os.class.tcgaCharacter"),
                   'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "os.class.tcgaCharacter"),
                   'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "os.class.tcgaCharacter"),
                   'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "os.class.tcgaCharacter"),
                   'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "os.class.tcgaCharacter"),
                   'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "os.class.tcgaCharacter"),
                   'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "os.class.tcgaCharacter"),
                   'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "os.class.tcgaCharacter"),
                   'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "os.class.tcgaCharacter"),
                   'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "os.class.tcgaCharacter"),
                   'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "os.class.tcgaCharacter"),
                   'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "os.class.tcgaCharacter"),
                   'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "os.class.tcgaCharacter"),
                   'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "os.class.tcgaCharacter"),
                   'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "os.class.tcgaCharacter"),
                   'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "os.class.tcgaCharacter"),
                   'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "os.class.tcgaCharacter"),
                   'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "os.class.tcgaCharacter"),
                   'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter"),
	    			#not in original (shared among datasets)
	    			'followup_reason'= list(name = "followup_reason", data = "os.class.tcgaCharacter"),
				    'followup_lost_to'= list(name = "followup_lost_to", data = "os.class.tcgaCharacter"),
					'radiation_treatment_adjuvant'= list(name = "radiation_treatment_adjuvant", data = "os.class.tcgaCharacter"),
					'pharmaceutical_tx_adjuvant'= list(name = "pharmaceutical_tx_adjuvant", data = "os.class.tcgaCharacter"),
					'treatment_outcome_first_course'= list(name = "treatment_outcome_first_course", data = "os.class.tcgaCharacter"),
					'new_tumor_event_dx_indicator'= list(name = "new_tumor_event_dx_indicator", data = "os.class.tcgaCharacter"),
					'treatment_outcome_at_tcga_followup'= list(name = "treatment_outcome_at_tcga_followup", data = "os.class.tcgaCharacter"),
			        'targeted_molecular_therapy'= list(name = "targeted_molecular_therapy", data = "os.class.tcgaCharacter"),
			        'new_tumor_event_site'= list(name = "new_tumor_event_site", data = "os.class.tcgaCharacter"),
					'new_tumor_event_site_other'= list(name = "new_tumor_event_site_other", data = "os.class.tcgaCharacter"),
					'additional_surgery_locoregional_procedure'= list(name = "additional_surgery_locoregional_procedure", data = "os.class.tcgaCharacter"),
					'new_tumor_event_surgery_met'= list(name = "new_tumor_event_surgery_met", data = "os.class.tcgaCharacter"),
					'days_to_performance_status_assessment'= list(name = "days_to_performance_status_assessment", data = "os.class.tcgaNumeric"),
					'new_tumor_event_dx_evidence'= list(name = "new_tumor_event_dx_evidence", data = "os.class.tcgaCharacter"),
					'cause_of_death'= list(name = "cause_of_death", data = "os.class.tcgaCharacter"),
					'cause_of_death_source'= list(name = "cause_of_death_source", data = "os.class.tcgaCharacter"),
					'days_to_biochemical_recurrence_first'= list(name = "days_to_biochemical_recurrence_first", data = "os.class.tcgaNumeric"),
					'progression_after_hormone_tx'= list(name = "progression_after_hormone_tx", data = "os.class.tcgaCharacter"),
					'progression_after_hormone_tx_type'= list(name = "progression_after_hormone_tx_type", data = "os.class.tcgaCharacter"),
					'days_to_biochemical_recurrence_second'= list(name = "days_to_biochemical_recurrence_second", data = "os.class.tcgaNumeric"),
					'days_to_biochemical_recurrence_third'= list(name = "days_to_biochemical_recurrence_third", data = "os.class.tcgaNumeric"),
					'days_to_additional_surgery_metastatic_procedure'= list(name = "days_to_additional_surgery_metastatic_procedure", data = "os.class.tcgaNumeric"),
			        #brca only
			        'nte_er_status_ihc__positive'= list(name = "nte_er_status_ihc__positive", data = "os.class.tcgaCharacter"),
			        'nte_pr_status_ihc__positive'= list(name = "nte_pr_status_ihc__positive", data = "os.class.tcgaCharacter"),
			        'nte_her2_status_ihc__positive'= list(name = "nte_her2_status_ihc__positive", data = "os.class.tcgaCharacter"),
			        'cent17_copy_number'= list(name = "cent17_copy_number", data = "os.class.tcgaCharacter"),
			        'days_to_additional_surgery_locoregional_procedure'= list(name = "days_to_additional_surgery_locoregional_procedure", data = "os.class.tcgaNumeric"),
			        'days_to_additional_surgery_metastatic_procedure'= list(name = "days_to_additional_surgery_metastatic_procedure", data = "os.class.tcgaNumeric"),
			        'days_to_last_known_alive'= list(name = "days_to_last_known_alive", data = "os.class.tcgaNumeric"),
			        'er_ihc_score'= list(name = "er_ihc_score", data = "os.class.tcgaCharacter"),
			        'er_status_by_ihc'= list(name = "er_status_by_ihc", data = "os.class.tcgaCharacter"),
			        'er_status_ihc_Percent_Positive'= list(name = "er_status_ihc_Percent_Positive", data = "os.class.tcgaCharacter"),
			        'new_tumor_event_surgery_met'= list(name = "new_tumor_event_surgery_met", data = "os.class.tcgaCharacter"),
			        'pr_status_ihc_percent_positive'= list(name = "pr_status_ihc_percent_positive", data = "os.class.tcgaCharacter")
        ),
        "f2"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"), 
                   #Status Table 
                   'vital_status' = list(name = "vitalStatus", data = "os.class.vital"),
                   'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
                   'last_contact_days_to' = list(name = "lastContact", data = "os.class.tcgaNumeric"),
                   'death_days_to' = list(name = "deathDate", data = "os.class.tcgaNumeric"),
                   # Progression Table 
                   'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "os.class.tcgaNumeric"),
                   'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
                   'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
                   # Encounter Table 
                   'performance_status_timing' = list(name = "encType", data = "os.class.encType"),
                   'karnofsky_score' = list(name = "KPS", data = "os.class.tcgaNumeric"),
                   'ecog_score' = list(name = "ECOG", data = "os.class.tcgaNumeric"),
                   #Procedure Table
                   'new_tumor_event_surgery' = list(name = "newTumorEventSurgery", data = "os.class.tcgaCharacter"),
                   # Absent Table 
                   'new_tumor_event_dx_days_to' = list(name = "newTumorEventDxDaysTo", data = "os.class.tcgaNumeric"),
                   'new_tumor_event_radiation_tx' = list(name = "newTumorEventRadiationTx", data = "os.class.tcgaBoolean"),
                   'new_tumor_event_pharmaceutical_tx' = list(name = "newTumorEventPharmaceuticalTx", data = "os.class.tcgaBoolean"),
                   # Test Table 
                   'days_to_psa_most_recent' = list(name = "psaDate", data = "os.class.tcgaNumeric"),
                   'days_to_bone_scan' = list(name = "boneScanDate", data = "os.class.tcgaNumeric"),
                   'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "os.class.tcgaNumeric"),
                   'days_to_mri' = list(name = "mriDate", data = "os.class.tcgaNumeric"),
                   'idh1_mutation_test_method' = list(name = "idh1Method", data = "os.class.tcgaCharacter"),
                   'idh1_mutation_found' = list(name = "idh1Found", data = "os.class.tcgaCharacter"),
                   'IHC' = list(name = "ihc", data = "os.class.tcgaCharacter"),
                   'kras_mutation_found' = list(name = "krasInd", data = "os.class.tcgaCharacter"),
                   'kras_mutation_identified_type' = list(name = "krasType", data = "os.class.tcgaCharacter"),
                   'egfr_mutation_status' = list(name = "egfrStatus", data = "os.class.tcgaCharacter"),
                   'egfr_mutation_identified_type' = list(name = "egfrType", data = "os.class.tcgaCharacter"),
                   'egfr_amplification_status' = list(name = "egfrAmp", data = "os.class.tcgaCharacter"),
                   'pulmonary_function_test_indicator' = list(name = "pulInd", data = "os.class.tcgaCharacter"),
                   'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "os.class.tcgaCharacter"),
                   'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "os.class.tcgaCharacter"),
                   'kras_mutation_codon' = list(name = "krasCodon", data = "os.class.tcgaCharacter"),
                   'braf_gene_analysis_indicator' = list(name = "brafInd", data = "os.class.tcgaCharacter"),
                   'braf_gene_analysis_result' = list(name = "brafRes", data = "os.class.tcgaCharacter"),
                   'cea_level_pretreatment' = list(name = "ceaTx", data = "os.class.tcgaCharacter"),
                   'loci_tested_count' = list(name = "lociTestCount", data = "os.class.tcgaCharacter"),
                   'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "os.class.tcgaCharacter"),
                   'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "os.class.tcgaCharacter"),
                   'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "os.class.tcgaCharacter"),
                   'hpv_status_p16' = list(name = "hpvP16", data = "os.class.tcgaCharacter"),
                   'hpv_status_ish' = list(name = "hpvIsh", data = "os.class.tcgaCharacter"),
                   'psa_most_recent_results' = list(name = "psaRes", data = "os.class.tcgaCharacter"),
                   'bone_scan_results' = list(name = "boneScaneRes", data = "os.class.tcgaCharacter"),
                   'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "os.class.tcgaCharacter"),
                   'mri_results' = list(name = "mriRes", data = "os.class.tcgaCharacter"),
                   'her2_copy_number' = list(name = "her2CNV", data = "os.class.tcgaCharacter"),
                   'her2_fish_method' = list(name = "her2FishMethod", data = "os.class.tcgaCharacter"),
                   'her2_fish_status' = list(name = "her2FishStatus", data = "os.class.tcgaCharacter"),
                   'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "os.class.tcgaCharacter"),
                   'her2_ihc_score' = list(name = "her2IhcScore", data = "os.class.tcgaCharacter"),
                   'her2_positivity_method_text' = list(name = "her2PosMethod", data = "os.class.tcgaCharacter"),
                   'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "os.class.tcgaCharacter"),
                   'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "os.class.tcgaCharacter"),
                   'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "os.class.tcgaCharacter"),
                   'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "os.class.tcgaCharacter"),
                   'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "os.class.tcgaCharacter"),
                   'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "os.class.tcgaCharacter"),
                   'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "os.class.tcgaCharacter"),
                   'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "os.class.tcgaCharacter"),
                   'nte_her2_status' = list(name = "nteHer2Status", data = "os.class.tcgaCharacter"),
                   'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "os.class.tcgaCharacter"),
                   'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "os.class.tcgaCharacter"),
                   'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "os.class.tcgaCharacter"),
                   'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "os.class.tcgaCharacter"),
                   'nte_er_status' = list(name = "nteEstroStatus", data = "os.class.tcgaCharacter"),
                   'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "os.class.tcgaCharacter"),
                   'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "os.class.tcgaCharacter"),
                   'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "os.class.tcgaCharacter"),
                   'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "os.class.tcgaCharacter"),
                   'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "os.class.tcgaCharacter"),
                   'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "os.class.tcgaCharacter"),
                   'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "os.class.tcgaCharacter"),
                   'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "os.class.tcgaCharacter"),
                   'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "os.class.tcgaCharacter"),
                   'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "os.class.tcgaCharacter"),
                   'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "os.class.tcgaCharacter"),
                   'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "os.class.tcgaCharacter"),
                   'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "os.class.tcgaCharacter"),
                   'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "os.class.tcgaCharacter"),
                   'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "os.class.tcgaCharacter"),
                   'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "os.class.tcgaCharacter"),
                   'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "os.class.tcgaCharacter"),
                   'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "os.class.tcgaCharacter"),
                   'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter"),
                   #not in orginal script (shared among datasets)
                   'radiation_treatment_adjuvant'= list(name = "radiation_treatment_adjuvant", data = "os.class.tcgaCharacter"),
					'new_tumor_event_dx_indicator'= list(name = "new_tumor_event_dx_indicator", data = "os.class.tcgaCharacter"),
					'new_tumor_event_site'= list(name = "new_tumor_event_site", data = "os.class.tcgaCharacter"),
					'new_tumor_event_site_other'= list(name = "new_tumor_event_site_other", data = "os.class.tcgaCharacter"),
					'nte_er_status_ihc__positive'= list(name = "nte_er_status_ihc__positive", data = "os.class.tcgaCharacter"),
					'nte_er_positivity_scale_used'= list(name = "nte_er_positivity_scale_used", data = "os.class.tcgaCharacter"),
					'nte_pr_status_ihc__positive'= list(name = "nte_pr_status_ihc__positive", data = "os.class.tcgaCharacter"),
					'nte_pr_positivity_scale_used'= list(name = "nte_pr_positivity_scale_used", data = "os.class.tcgaCharacter"),
					'nte_her2_status_ihc__positive'= list(name = "nte_her2_status_ihc__positive", data = "os.class.tcgaCharacter"),
					'days_to_additional_surgery_metastatic_procedure'= list(name = "days_to_additional_surgery_metastatic_procedure", data = "os.class.tcgaNumeric"),
					'followup_reason'= list(name = "followup_reason", data = "os.class.tcgaCharacter"),
					'targeted_molecular_therapy'= list(name = "targeted_molecular_therapy", data = "os.class.tcgaCharacter"),
					'treatment_outcome_first_course'= list(name = "treatment_outcome_first_course", data = "os.class.tcgaCharacter"),
					'treatment_outcome_at_tcga_followup'= list(name = "treatment_outcome_at_tcga_followup", data = "os.class.tcgaCharacter"),
					'tobacco_smokeless_use_at_dx'= list(name = "tobacco_smokeless_use_at_dx", data = "os.class.tcgaCharacter"),
					'tobacco_smokeless_regular_use'= list(name = "tobacco_smokeless_regular_use", data = "os.class.tcgaCharacter"),
					'tobacco_smokeless_average_per_day'= list(name = "tobacco_smokeless_average_per_day", data = "os.class.tcgaCharacter"),
					'tobacco_smokeless_age_use_started'= list(name = "tobacco_smokeless_age_use_started", data = "os.class.tcgaCharacter"),
					'tobacco_smokeless_age_use_ended'= list(name = "tobacco_smokeless_age_use_ended", data = "os.class.tcgaCharacter"),
					'definitive_tx_method'= list(name = "definitive_tx_method", data = "os.class.tcgaCharacter"),
					'definitive_tx_evidence_disease_after'= list(name = "definitive_tx_evidence_disease_after", data = "os.class.tcgaCharacter"),
					'cause_of_death'= list(name = "cause_of_death", data = "os.class.tcgaCharacter"),
					'days_to_completion_of_curative_tx'= list(name = "days_to_completion_of_curative_tx", data = "os.class.tcgaNumeric"),
					'followup_lost_to'= list(name = "followup_lost_to", data = "os.class.tcgaCharacter"),
					'pharmaceutical_tx_adjuvant'= list(name = "pharmaceutical_tx_adjuvant", data = "os.class.tcgaCharacter")
        ),
        "f3"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"), 
                   #Status Table 
                   'vital_status' = list(name = "vitalStatus", data = "os.class.vital"),
                   'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
                   'last_contact_days_to' = list(name = "lastContact", data = "os.class.tcgaNumeric"),
                   'death_days_to' = list(name = "deathDate", data = "os.class.tcgaNumeric"), 
                   #Absent Table 
                   'new_tumor_event_dx_days_to' = list(name = "newTumorEventDxDaysTo", data = "os.class.tcgaNumeric"),
                   'new_tumor_event_radiation_tx' = list(name = "newTumorEventRadiationTx", data = "os.class.tcgaCharacter"),
                   'new_tumor_event_pharmaceutical_tx' = list(name = "newTumorEventPharmaceuticalTx", data = "os.class.tcgaCharacter"), 
                   #Test Table 
                   'days_to_psa_most_recent' = list(name = "psaDate", data = "os.class.tcgaNumeric"),
                   'days_to_bone_scan' = list(name = "boneScanDate", data = "os.class.tcgaNumeric"),
                   'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "os.class.tcgaNumeric"),
                   'days_to_mri' = list(name = "mriDate", data = "os.class.tcgaNumeric"),
                   'idh1_mutation_test_method' = list(name = "idh1Method", data = "os.class.tcgaCharacter"),
                   'idh1_mutation_found' = list(name = "idh1Found", data = "os.class.tcgaCharacter"),
                   'IHC' = list(name = "ihc", data = "os.class.tcgaCharacter"),
                   'kras_mutation_found' = list(name = "krasInd", data = "os.class.tcgaCharacter"),
                   'kras_mutation_identified_type' = list(name = "krasType", data = "os.class.tcgaCharacter"),
                   'egfr_mutation_status' = list(name = "egfrStatus", data = "os.class.tcgaCharacter"),
                   'egfr_mutation_identified_type' = list(name = "egfrType", data = "os.class.tcgaCharacter"),
                   'egfr_amplification_status' = list(name = "egfrAmp", data = "os.class.tcgaCharacter"),
                   'pulmonary_function_test_indicator' = list(name = "pulInd", data = "os.class.tcgaCharacter"),
                   'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "os.class.tcgaCharacter"),
                   'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "os.class.tcgaCharacter"),
                   'kras_mutation_codon' = list(name = "krasCodon", data = "os.class.tcgaCharacter"),
                   'braf_gene_analysis_indicator' = list(name = "brafInd", data = "os.class.tcgaCharacter"),
                   'braf_gene_analysis_result' = list(name = "brafRes", data = "os.class.tcgaCharacter"),
                   'cea_level_pretreatment' = list(name = "ceaTx", data = "os.class.tcgaCharacter"),
                   'loci_tested_count' = list(name = "lociTestCount", data = "os.class.tcgaCharacter"),
                   'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "os.class.tcgaCharacter"),
                   'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "os.class.tcgaCharacter"),
                   'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "os.class.tcgaCharacter"),
                   'hpv_status_p16' = list(name = "hpvP16", data = "os.class.tcgaCharacter"),
                   'hpv_status_ish' = list(name = "hpvIsh", data = "os.class.tcgaCharacter"),
                   'psa_most_recent_results' = list(name = "psaRes", data = "os.class.tcgaCharacter"),
                   'bone_scan_results' = list(name = "boneScaneRes", data = "os.class.tcgaCharacter"),
                   'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "os.class.tcgaCharacter"),
                   'mri_results' = list(name = "mriRes", data = "os.class.tcgaCharacter"),
                   'her2_copy_number' = list(name = "her2CNV", data = "os.class.tcgaCharacter"),
                   'her2_fish_method' = list(name = "her2FishMethod", data = "os.class.tcgaCharacter"),
                   'her2_fish_status' = list(name = "her2FishStatus", data = "os.class.tcgaCharacter"),
                   'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "os.class.tcgaCharacter"),
                   'her2_ihc_score' = list(name = "her2IhcScore", data = "os.class.tcgaCharacter"),
                   'her2_positivity_method_text' = list(name = "her2PosMethod", data = "os.class.tcgaCharacter"),
                   'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "os.class.tcgaCharacter"),
                   'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "os.class.tcgaCharacter"),
                   'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "os.class.tcgaCharacter"),
                   'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "os.class.tcgaCharacter"),
                   'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "os.class.tcgaCharacter"),
                   'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "os.class.tcgaCharacter"),
                   'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "os.class.tcgaCharacter"),
                   'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "os.class.tcgaCharacter"),
                   'nte_her2_status' = list(name = "nteHer2Status", data = "os.class.tcgaCharacter"),
                   'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "os.class.tcgaCharacter"),
                   'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "os.class.tcgaCharacter"),
                   'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "os.class.tcgaCharacter"),
                   'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "os.class.tcgaCharacter"),
                   'nte_er_status' = list(name = "nteEstroStatus", data = "os.class.tcgaCharacter"),
                   'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "os.class.tcgaCharacter"),
                   'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "os.class.tcgaCharacter"),
                   'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "os.class.tcgaCharacter"),
                   'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "os.class.tcgaCharacter"),
                   'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "os.class.tcgaCharacter"),
                   'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "os.class.tcgaCharacter"),
                   'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "os.class.tcgaCharacter"),
                   'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "os.class.tcgaCharacter"),
                   'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "os.class.tcgaCharacter"),
                   'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "os.class.tcgaCharacter"),
                   'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "os.class.tcgaCharacter"),
                   'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "os.class.tcgaCharacter"),
                   'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "os.class.tcgaCharacter"),
                   'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "os.class.tcgaCharacter"),
                   'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "os.class.tcgaCharacter"),
                   'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "os.class.tcgaCharacter"),
                   'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "os.class.tcgaCharacter"),
                   'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "os.class.tcgaCharacter"),
                   'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter"),
        			#brca only
        			'followup_lost_to'= list(name = "followup_lost_to", data = "os.class.tcgaCharacter"),
					'radiation_treatment_adjuvant'= list(name = "radiation_treatment_adjuvant", data = "os.class.tcgaCharacter"),
					'pharmaceutical_tx_adjuvant'= list(name = "pharmaceutical_tx_adjuvant", data = "os.class.tcgaCharacter"),
					'new_tumor_event_dx_indicator' = list(name = "new_tumor_event_dx_indicator", data = "os.class.tcgaCharacter")

        ),
        "omf"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"), 
                    #drug Table 
                    'drug_name' = list(name = "drugName", data = "os.class.tcgaCharacter"),
                    'days_to_drug_therapy_start' = list(name = "drugStart", data = "os.class.tcgaNumeric"),
                    'malignancy_type' = list(name = "malignancyType", data = "os.class.tcgaCharacter"), 
                    #Radiation Table 
                    'radiation_tx_extent' = list(name = "radiationTxExtent", data = "os.class.tcgaCharacter"),
                    'rad_tx_to_site_of_primary_tumor' = list(name = "radTxToSiteOfPrimaryTumor", data = "os.class.tcgaCharacter"),
                    'days_to_radiation_therapy_start' = list(name = "radStart", data = "os.class.tcgaNumeric"),
                    # Procedure Table 
                    'days_to_surgical_resection' = list(name = "daysToSurgicalResection", data = "os.class.tcgaNumeric"),
                    'other_malignancy_laterality' = list(name = "otherMalignancyLaterality", data = "os.class.tcgaCharacter"),
                    'surgery_type' = list(name = "surgeryType", data = "os.class.tcgaCharacter"), 
                    #Pathology Table 
                    'other_malignancy_anatomic_site' = list(name = "otherMalignancyAnatomicSite", data = "os.class.tcgaCharacter"),
                    'days_to_other_malignancy_dx' = list(name = "dateOtherMalignancy", data = "os.class.tcgaNumeric"),
                    'other_malignancy_histological_type' = list(name = "otherMalignancyHistologicalType", data = "os.class.tcgaCharacter"),
                    'other_malignancy_histological_type_text' = list(name = "otherMalignancyHistologicalTypeText", data = "os.class.tcgaCharacter"), 
                    #Absent Table 
                    'days_to_other_malignancy_dx' = list(name = "daysToOtherMalignancyDx", data = "os.class.tcgaNumeric"),
                    'radiation_tx_indicator' = list(name = "radiationTxIndicator", data = "os.class.tcgaBoolean"),
                    'drug_tx_indicator' = list(name = "drugTxIndicator", data = "os.class.tcgaBoolean"),
					#not in orginal script
					'other_malignancy_dx_days_to'= list(name = "other_malignancy_dx_days_to", data = "os.class.tcgaNumeric"),
					'surgery_indicator'= list(name = "surgery_indicator", data = "os.class.tcgaCharacter"),
					'other_malignancy_surgery_type'= list(name = "other_malignancy_surgery_type", data = "os.class.tcgaCharacter"),
					'other_malignancy_surgery_days_to'= list(name = "other_malignancy_surgery_days_to", data = "os.class.tcgaCharacter"),
					'pharmaceutical_therapy_indicator'= list(name = "pharmaceutical_therapy_indicator", data = "os.class.tcgaCharacter"),
					'pharmaceutical_therapy_extent'= list(name = "pharmaceutical_therapy_extent", data = "os.class.tcgaCharacter"),
					'pharmaceutical_therapy_drug_name'= list(name = "pharmaceutical_therapy_drug_name", data = "os.class.tcgaCharacter"),
					'pharmaceutical_tx_started_days_to'= list(name = "pharmaceutical_tx_started_days_to", data = "os.class.tcgaCharacter"),
					'radiation_therapy_indicator'= list(name = "radiation_therapy_indicator", data = "os.class.tcgaCharacter"),
					'radiation_therapy_extent'= list(name = "radiation_therapy_extent", data = "os.class.tcgaCharacter"),
					'history_rt_tx_to_site_of_tcga_tumor'= list(name = "history_rt_tx_to_site_of_tcga_tumor", data = "os.class.tcgaCharacter"),
					'radiation_therapy_started_days_to'= list(name = "radiation_therapy_started_days_to", data = "os.class.tcgaCharacter"),
					'ajcc_staging_edition'= list(name = "ajcc_staging_edition", data = "os.class.tcgaCharacter"),
					'ajcc_tumor_pathologic_pt'= list(name = "ajcc_tumor_pathologic_pt", data = "os.class.tcgaCharacter"),
					'ajcc_nodes_pathologic_pn'= list(name = "ajcc_nodes_pathologic_pn", data = "os.class.tcgaCharacter"),
					'ajcc_metastasis_pathologic_pm'= list(name = "ajcc_metastasis_pathologic_pm", data = "os.class.tcgaCharacter"),
					'ajcc_pathologic_tumor_stage'= list(name = "ajcc_pathologic_tumor_stage", data = "os.class.tcgaCharacter"),
					'clinical_stage'= list(name = "clinical_stage", data = "os.class.tcgaCharacter"),
					'stage_other' = list(name = "stage_other", data = "os.class.tcgaCharacter"),
					'other_malignancy_anatomic_site_text'= list(name = "other_malignancy_anatomic_site_text", data = "os.class.tcgaCharacter")
        ),
        "nte"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
                    'days_to_new_tumor_event_after_initial_treatment' = list(name = "daysToNewTumorEventAfterInitialTreatment", data = "os.class.tcgaNumeric"),
                    'new_tumor_event_dx_days_to' = list(name = "newTumorEventDxDaysTo", data = "os.class.tcgaNumeric"),
                    'additional_radiation_therapy' = list(name = "additionalRadiationTherapy", data = "os.class.tcgaBoolean"),
                    'new_tumor_event_radiation_tx' = list(name = "newTumorEventRadiationTx", data = "os.class.tcgaBoolean"),
                    'additional_pharmaceutical_therapy' = list(name = "additionalPharmaceuticalTherapy", data = "os.class.tcgaBoolean"),
                    'new_tumor_event_pharmaceutical_tx' = list(name = "newTumorEventPharmaceuticalTx", data = "os.class.tcgaBoolean"), 
                    #Test Table 
                    'days_to_psa_most_recent' = list(name = "psaDate", data = "os.class.tcgaNumeric"),
                    'days_to_bone_scan' = list(name = "boneScanDate", data = "os.class.tcgaNumeric"),
                    'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "os.class.tcgaNumeric"),
                    'days_to_mri' = list(name = "mriDate", data = "os.class.tcgaNumeric"),
                    'idh1_mutation_test_method' = list(name = "idh1Method", data = "os.class.tcgaCharacter"),
                    'idh1_mutation_found' = list(name = "idh1Found", data = "os.class.tcgaCharacter"),
                    'IHC' = list(name = "ihc", data = "os.class.tcgaCharacter"),
                    'kras_mutation_found' = list(name = "krasInd", data = "os.class.tcgaCharacter"),
                    'kras_mutation_identified_type' = list(name = "krasType", data = "os.class.tcgaCharacter"),
                    'egfr_mutation_status' = list(name = "egfrStatus", data = "os.class.tcgaCharacter"),
                    'egfr_mutation_identified_type' = list(name = "egfrType", data = "os.class.tcgaCharacter"),
                    'egfr_amplification_status' = list(name = "egfrAmp", data = "os.class.tcgaCharacter"),
                    'pulmonary_function_test_indicator' = list(name = "pulInd", data = "upperCharater"),
                    'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "os.class.tcgaCharacter"),
                    'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "os.class.tcgaCharacter"),
                    'kras_mutation_codon' = list(name = "krasCodon", data = "os.class.tcgaCharacter"),
                    'braf_gene_analysis_indicator' = list(name = "brafInd", data = "os.class.tcgaCharacter"),
                    'braf_gene_analysis_result' = list(name = "brafRes", data = "os.class.tcgaCharacter"),
                    'cea_level_pretreatment' = list(name = "ceaTx", data = "os.class.tcgaCharacter"),
                    'loci_tested_count' = list(name = "lociTestCount", data = "os.class.tcgaCharacter"),
                    'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "os.class.tcgaCharacter"),
                    'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "os.class.tcgaCharacter"),
                    'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "os.class.tcgaCharacter"),
                    'hpv_status_p16' = list(name = "hpvP16", data = "os.class.tcgaCharacter"),
                    'hpv_status_ish' = list(name = "hpvIsh", data = "os.class.tcgaCharacter"),
                    'psa_most_recent_results' = list(name = "psaRes", data = "os.class.tcgaCharacter"),
                    'bone_scan_results' = list(name = "boneScaneRes", data = "os.class.tcgaCharacter"),
                    'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "os.class.tcgaCharacter"),
                    'mri_results' = list(name = "mriRes", data = "os.class.tcgaCharacter"),
                    'her2_copy_number' = list(name = "her2CNV", data = "os.class.tcgaCharacter"),
                    'her2_fish_method' = list(name = "her2FishMethod", data = "os.class.tcgaCharacter"),
                    'her2_fish_status' = list(name = "her2FishStatus", data = "os.class.tcgaCharacter"),
                    'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "os.class.tcgaCharacter"),
                    'her2_ihc_score' = list(name = "her2IhcScore", data = "os.class.tcgaCharacter"),
                    'her2_positivity_method_text' = list(name = "her2PosMethod", data = "os.class.tcgaCharacter"),
                    'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "os.class.tcgaCharacter"),
                    'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "os.class.tcgaCharacter"),
                    'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "os.class.tcgaCharacter"),
                    'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "os.class.tcgaCharacter"),
                    'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "os.class.tcgaCharacter"),
                    'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "os.class.tcgaCharacter"),
                    'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "os.class.tcgaCharacter"),
                    'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "os.class.tcgaCharacter"),
                    'nte_her2_status' = list(name = "nteHer2Status", data = "os.class.tcgaCharacter"),
                    'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "os.class.tcgaCharacter"),
                    'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "os.class.tcgaCharacter"),
                    'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "os.class.tcgaCharacter"),
                    'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "os.class.tcgaCharacter"),
                    'nte_er_status' = list(name = "nteEstroStatus", data = "os.class.tcgaCharacter"),
                    'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "os.class.tcgaCharacter"),
                    'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "os.class.tcgaCharacter"),
                    'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "os.class.tcgaCharacter"),
                    'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "os.class.tcgaCharacter"),
                    'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "os.class.tcgaCharacter"),
                    'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "os.class.tcgaCharacter"),
                    'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "os.class.tcgaCharacter"),
                    'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "os.class.tcgaCharacter"),
                    'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "os.class.tcgaCharacter"),
                    'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "os.class.tcgaCharacter"),
                    'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "os.class.tcgaCharacter"),
                    'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "os.class.tcgaCharacter"),
                    'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "os.class.tcgaCharacter"),
                    'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "os.class.tcgaCharacter"),
                    'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "os.class.tcgaCharacter"),
                    'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "os.class.tcgaCharacter"),
                    'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "os.class.tcgaCharacter"),
                    'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "os.class.tcgaCharacter"),
                    'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter"),
                    # Progression Table 
                    'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "os.class.tcgaNumeric"),
                    'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
                    'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
                    # Procedure Table 
                    'new_tumor_event_surgery_days_to_loco' = list(name = "dateLocoregional", data = "os.class.tcgaNumeric"),
                    'new_tumor_event_surgery_days_to_met' = list(name = "dateMetastatic", data = "os.class.tcgaNumeric"),
                    'new_tumor_event_surgery' = list(name = "newTumorEventSurgery", data = "os.class.tcgaCharacter"),
                    'days_to_new_tumor_event_additional_surgery_procedure' = list(name = "daysToNewTumorEventAdditionalSurgeryProcedure", data = "os.class.tcgaNumeric"),
                    'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.tcgaCharacter"),
                    'new_tumor_event_type' = list(name = "newTumor", data = "os.class.tcgaCharacter"),
                    'new_tumor_event_additional_surgery_procedure' = list(name = "new_tumor_event_additional_surgery_procedure", data = "os.class.tcgaCharacter"),
					#not in original script
					'new_tumor_event_surgery_days_to'= list(name = "new_tumor_event_surgery_days_to", data = "os.class.tcgaNumeric"),
					'nte_er_status_ihc__positive'= list(name = "nte_er_status_ihc__positive", data = "os.class.tcgaCharacter"),
					'nte_er_positivity_scale_used'= list(name = "nte_er_positivity_scale_used", data = "os.class.tcgaCharacter"),
					'nte_pr_status_ihc__positive'= list(name = "nte_pr_status_ihc__positive", data = "os.class.tcgaCharacter"),
					'nte_pr_positivity_scale_used'= list(name = "nte_pr_positivity_scale_used", data = "os.class.tcgaCharacter"),
					'nte_her2_status_ihc__positive' = list(name = "nte_her2_status_ihc__positive", data = "os.class.tcgaCharacter"),
					'new_tumor_event_site_surgery' = list(name = "new_tumor_event_site_surgery", data = "os.class.tcgaCharacter"),
					'new_tumor_event_site'= list(name = "new_tumor_event_site", data = "os.class.tcgaCharacter"),
					'new_tumor_event_site_other'= list(name = "new_tumor_event_site_other", data = "os.class.tcgaCharacter"),
					'new_tumor_event_dx_evidence'  = list(name = "new_tumor_event_dx_evidence", data = "os.class.tcgaCharacter"),
					'new_tumor_event_surgery_met' = list(name = "new_tumor_event_surgery_met", data = "os.class.tcgaCharacter"),
					'progression_after_hormone_tx'= list(name = "progression_after_hormone_tx", data = "os.class.tcgaCharacter"),
					'progression_after_hormone_tx_type'  = list(name = "progression_after_hormone_tx_type", data = "os.class.tcgaCharacter"), 
					'disease_multifocal_indicator'= list(name = "disease_multifocal_indicator", data = "os.class.tcgaCharacter"),
					'discontinuous_lesions_count'= list(name = "discontinuous_lesions_count", data = "os.class.tcgaCharacter"),
					'tumor_burden_radiologic'= list(name = "tumor_burden_radiologic", data = "os.class.tcgaCharacter"),
					'tumor_burden_pathologic'= list(name = "tumor_burden_pathologic", data = "os.class.tcgaCharacter"),
					'nte_well_or_dedifferentiated_indicator'= list(name = "nte_well_or_dedifferentiated_indicator", data = "os.class.tcgaCharacter"),
					'residual_disease_post_new_tumor_event_margin_status' = list(name = "residual_disease_post_new_tumor_event_margin_status", data = "os.class.tcgaCharacter"),
					'new_tumor_event_residual_tumor' = list(name = "new_tumor_event_residual_tumor", data = "os.class.tcgaCharacter")

        ),
        "nte_f1"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"), 
                       #Progression Table 
                       'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "os.class.tcgaNumeric"),
                       'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
                       'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor"), 
                        #Procedure Table 
                       'new_tumor_event_surgery' = list(name = "newTumorEventSurgery", data = "os.class.tcgaCharacter"),
                       'days_to_new_tumor_event_additional_surgery_procedure' = list(name = "daysToNewTumorEventAdditionalSurgeryProcedure", data = "os.class.tcgaNumeric"),
                       'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.tcgaCharacter"),
                       'new_tumor_event_type' = list(name = "newTumor", data = "os.class.tcgaCharacter"),
                       'new_tumor_event_additional_surgery_procedure' = list(name = "newTumorEventAdditionalSurgeryProcedure", data = "os.class.tcgaCharacter"), 
                       #Absent Table 
                       'days_to_new_tumor_event_after_initial_treatment' = list(name = "daysToNewTumorEventAfterInitialTreatment", data = "os.class.tcgaNumeric"),
                       'new_tumor_event_dx_days_to' = list(name = "newTumorEventDxDaysTo", data = "os.class.tcgaNumeric"),
                       'additional_radiation_therapy' = list(name = "additionalRadiationTherapy", data = "os.class.tcgaCharacter"),
                       'new_tumor_event_radiation_tx' = list(name = "newTumorEventRadiationTx", data = "os.class.tcgaCharacter"),
                       'additional_pharmaceutical_therapy' = list(name = "additionalPharmaceuticalTherapy", data = "os.class.tcgaCharacter"),
                       'new_tumor_event_pharmaceutical_tx' = list(name = "newTumorEventPharmaceuticalTx", data = "os.class.tcgaCharacter"), 
                       #Test Table 
                       'days_to_psa_most_recent' = list(name = "psaDate", data = "os.class.tcgaNumeric"),
                       'days_to_bone_scan' = list(name = "boneScanDate", data = "os.class.tcgaNumeric"),
                       'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "os.class.tcgaNumeric"),
                       'days_to_mri' = list(name = "mriDate", data = "os.class.tcgaNumeric"),
                       'idh1_mutation_test_method' = list(name = "idh1Method", data = "os.class.tcgaCharacter"),
                       'idh1_mutation_found' = list(name = "idh1Found", data = "os.class.tcgaCharacter"),
                       'IHC' = list(name = "ihc", data = "os.class.tcgaCharacter"),
                       'kras_mutation_found' = list(name = "krasInd", data = "os.class.tcgaCharacter"),
                       'kras_mutation_identified_type' = list(name = "krasType", data = "os.class.tcgaCharacter"),
                       'egfr_mutation_status' = list(name = "egfrStatus", data = "os.class.tcgaCharacter"),
                       'egfr_mutation_identified_type' = list(name = "egfrType", data = "os.class.tcgaCharacter"),
                       'egfr_amplification_status' = list(name = "egfrAmp", data = "os.class.tcgaCharacter"),
                       'pulmonary_function_test_indicator' = list(name = "pulInd", data = "os.class.tcgaCharacter"),
                       'eml4_alk_translocation_status' = list(name = "elm4AlkStatus", data = "os.class.tcgaCharacter"),
                       'eml4_alk_translocation_variant' = list(name = "elm4AlkVar", data = "os.class.tcgaCharacter"),
                       'kras_mutation_codon' = list(name = "krasCodon", data = "os.class.tcgaCharacter"),
                       'braf_gene_analysis_indicator' = list(name = "brafInd", data = "os.class.tcgaCharacter"),
                       'braf_gene_analysis_result' = list(name = "brafRes", data = "os.class.tcgaCharacter"),
                       'cea_level_pretreatment' = list(name = "ceaTx", data = "os.class.tcgaCharacter"),
                       'loci_tested_count' = list(name = "lociTestCount", data = "os.class.tcgaCharacter"),
                       'loci_abnormal_count' = list(name = "lociAbnormalCount", data = "os.class.tcgaCharacter"),
                       'mismatch_rep_proteins_tested_by_ihc' = list(name = "mismatchProteinTestIhc", data = "os.class.tcgaCharacter"),
                       'mismatch_rep_proteins_loss_ihc' = list(name = "mismatchProteinLossIhc", data = "os.class.tcgaCharacter"),
                       'hpv_status_p16' = list(name = "hpvP16", data = "os.class.tcgaCharacter"),
                       'hpv_status_ish' = list(name = "hpvIsh", data = "os.class.tcgaCharacter"),
                       'psa_most_recent_results' = list(name = "psaRes", data = "os.class.tcgaCharacter"),
                       'bone_scan_results' = list(name = "boneScaneRes", data = "os.class.tcgaCharacter"),
                       'ct_scan_ab_pelvis_results' = list(name = "ctAbPelRes", data = "os.class.tcgaCharacter"),
                       'mri_results' = list(name = "mriRes", data = "os.class.tcgaCharacter"),
                       'her2_copy_number' = list(name = "her2CNV", data = "os.class.tcgaCharacter"),
                       'her2_fish_method' = list(name = "her2FishMethod", data = "os.class.tcgaCharacter"),
                       'her2_fish_status' = list(name = "her2FishStatus", data = "os.class.tcgaCharacter"),
                       'her2_ihc_percent_positive' = list(name = "her2IhcPercentagePos", data = "os.class.tcgaCharacter"),
                       'her2_ihc_score' = list(name = "her2IhcScore", data = "os.class.tcgaCharacter"),
                       'her2_positivity_method_text' = list(name = "her2PosMethod", data = "os.class.tcgaCharacter"),
                       'her2_positivity_scale_other' = list(name = "her2PosScaleOther", data = "os.class.tcgaCharacter"),
                       'her2_status_by_ihc' = list(name = "her2StatusIhc", data = "os.class.tcgaCharacter"),
                       'nte_her2_fish_define_method' = list(name = "nteHer2FishMethod", data = "os.class.tcgaCharacter"),
                       'nte_her2_fish_status' = list(name = "nteHer2FishStatus", data = "os.class.tcgaCharacter"),
                       'nte_her2_positivity_ihc_score' = list(name = "nteHer2PosIhcScore", data = "os.class.tcgaCharacter"),
                       'nte_her2_positivity_method' = list(name = "nteHer2PosMethod", data = "os.class.tcgaCharacter"),
                       'nte_her2_positivity_other_scale' = list(name = "nteHer2PosOtherScale", data = "os.class.tcgaCharacter"),
                       'nte_her2_signal_number' = list(name = "nteHer2SignalNum", data = "os.class.tcgaCharacter"),
                       'nte_her2_status' = list(name = "nteHer2Status", data = "os.class.tcgaCharacter"),
                       'nte_her2_status_ihc_positive' = list(name = "nteHer2StatusIhcPos", data = "os.class.tcgaCharacter"),
                       'nte_er_ihc_intensity_score' = list(name = "nteEstroIhcScore", data = "os.class.tcgaCharacter"),
                       'nte_er_positivity_define_method' = list(name = "nteEstroPosMethod", data = "os.class.tcgaCharacter"),
                       'nte_er_positivity_other_scale' = list(name = "nteEstroPosOtherScale", data = "os.class.tcgaCharacter"),
                       'nte_er_status' = list(name = "nteEstroStatus", data = "os.class.tcgaCharacter"),
                       'nte_er_status_ihc_positive' = list(name = "nteEstroStatusIhcPos", data = "os.class.tcgaCharacter"),
                       'nte_pr_ihc_intensity_score' = list(name = "nteProgIhcScore", data = "os.class.tcgaCharacter"),
                       'nte_pr_positivity_define_method' = list(name = "nteProgPosMethod", data = "os.class.tcgaCharacter"),
                       'nte_pr_positivity_other_scale' = list(name = "nteProgPosOtherScale", data = "os.class.tcgaCharacter"),
                       'nte_pr_status_by_ihc' = list(name = "nteProgStatusIhc", data = "os.class.tcgaCharacter"),
                       'nte_pr_status_ihc_positive' = list(name = "nteProgStatusIhcPos", data = "os.class.tcgaCharacter"),
                       'pr_positivity_define_method' = list(name = "ProgPosMethod", data = "os.class.tcgaCharacter"),
                       'pr_positivity_ihc_intensity_score' = list(name = "ProgPosIhcScore", data = "os.class.tcgaCharacter"),
                       'pr_positivity_scale_other' = list(name = "ProgPosScaleOther", data = "os.class.tcgaCharacter"),
                       'pr_positivity_scale_used' = list(name = "ProgPosScaleUsed", data = "os.class.tcgaCharacter"),
                       'pr_status_by_ihc' = list(name = "ProgStatusIhc", data = "os.class.tcgaCharacter"),
                       'pr_status_ihc_percent_positiv' = list(name = "ProgStatusIhcPercentagePos", data = "os.class.tcgaCharacter"),
                       'her2_and_cent17_cells_count' = list(name = "her2Cent17CellsCount", data = "os.class.tcgaCharacter"),
                       'her2_and_cent17_scale_other' = list(name = "her2Cent17ScaleOther", data = "os.class.tcgaCharacter"),
                       'her2_cent17_counted_cells_count' = list(name = "her2Cent17CountedCellsCount", data = "os.class.tcgaCharacter"),
                       'her2_cent17_ratio' = list(name = "her2Cent17Ratio", data = "os.class.tcgaCharacter"),
                       'nte_cent_17_her2_ratio' = list(name = "nteCent17Her2Ratio", data = "os.class.tcgaCharacter"),
                       'nte_cent_17_signal_number' = list(name = "nteCent17SignalNum", data = "os.class.tcgaCharacter"),
                       'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter"),
        				#not in orginal script
        				'new_tumor_event_site'= list(name = "new_tumor_event_site", data = "os.class.tcgaCharacter"),
						'new_tumor_event_site'= list(name = "new_tumor_event_site", data = "os.class.tcgaCharacter"),
						'new_tumor_event_surgery_days_to'= list(name = "new_tumor_event_surgery_days_to", data = "os.class.tcgaNumeric"),
						'nte_er_status_ihc__positive'= list(name = "nte_er_status_ihc__positive", data = "os.class.tcgaCharacter"),
						'nte_er_positivity_scale_used'= list(name = "nte_er_positivity_scale_used", data = "os.class.tcgaCharacter"),
						'nte_pr_status_ihc__positive'= list(name = "nte_pr_status_ihc__positive", data = "os.class.tcgaCharacter"),
						'nte_pr_positivity_scale_used'= list(name = "nte_pr_positivity_scale_used", data = "os.class.tcgaCharacter"),
						'nte_her2_status_ihc__positive'= list(name = "nte_her2_status_ihc__positive", data = "os.class.tcgaCharacter"),
						'new_tumor_event_site_surgery'= list(name = "new_tumor_event_site_surgery", data = "os.class.tcgaCharacter"),
						'residual_disease_post_new_tumor_event_margin_status' = list(name = "residual_disease_post_new_tumor_event_margin_status", data = "os.class.tcgaCharacter"),
						'new_tumor_event_dx_evidence'= list(name = "new_tumor_event_dx_evidence", data = "os.class.tcgaCharacter"),
						'tumor_multifocal'= list(name = "tumor_multifocal", data = "os.class.tcgaCharacter"),
						'new_tumor_event_residual_tumor'= list(name = "new_tumor_event_residual_tumor", data = "os.class.tcgaCharacter"),
						'nte_well_or_dedifferentiated_indicator'= list(name = "nte_well_or_dedifferentiated_indicator", data = "os.class.tcgaCharacter"),
						'nte_lesion_radiologic_length'= list(name = "nte_lesion_radiologic_length", data = "os.class.tcgaCharacter"),
						'nte_lesion_radiologic_width'= list(name = "nte_lesion_radiologic_width", data = "os.class.tcgaCharacter"),
						'nte_lesion_radiologic_depth'= list(name = "nte_lesion_radiologic_depth", data = "os.class.tcgaCharacter"),
						'nte_lesion_pathologic_length'= list(name = "nte_lesion_pathologic_length", data = "os.class.tcgaCharacter"),
						'nte_lesion_pathologic_width'= list(name = "nte_lesion_pathologic_width", data = "os.class.tcgaCharacter"),
						'nte_lesion_pathologic_depth'= list(name = "nte_lesion_pathologic_depth", data = "os.class.tcgaCharacter"),
						'discontiguous_lesion_count'= list(name = "discontiguous_lesion_count", data = "os.class.tcgaCharacter"),
						'pathologic_tumor_burden'= list(name = "pathologic_tumor_burden", data = "os.class.tcgaCharacter"),
						'radiologic_tumor_burden'= list(name = "radiologic_tumor_burden", data = "os.class.tcgaCharacter"),
						'new_tumor_event_site_other'= list(name = "new_tumor_event_site_other", data = "os.class.tcgaCharacter")
        )
)

# IO Utility Functions :: [Batch, Load, Save]  -------------------------------------------------------

### Load Function Takes An Import File + Column List & Returns A DataFrame
os.data.load <- function(inputFile, columns){
        
        # Columns :: Create List From Url
    header <- unlist(strsplit(readLines(inputFile, n=1),'\t'));
        
		colIndicator <- which(header %in% names(columns))
		colOverlapNames <- header[colIndicator]
		
        # Columns :: Change Names Of Columns
		colNames <- header
		colNames[colIndicator] <- unlist(lapply(columns[colOverlapNames], function(col){ col$name}))

        # Columns :: Specify Data Type For Columns
#		colData <- rep("NULL", length(header))
		colData <- rep("character", length(header))
		colData[colIndicator]  <- unlist(lapply(columns[colOverlapNames], function(col){ col$data}))
				        
        # Table :: Read Table From URL
      mappedTable<-  read.delim(inputFile,
                   header = FALSE, 
                   skip = 3,
                   dec = ".", 
                   sep = "\t",
                   strip.white = TRUE,
                   numerals = "warn.loss",
                   col.names = colNames,
                   colClasses = colData
        );
   
      headerWithData <- setdiff(header, names(columns))
      DataIndicator <- sapply(headerWithData, function(colName){!all(toupper(mappedTable[,colName]) %in% os.enum.na)})
      headerWithData <- headerWithData[DataIndicator]
            cat("---Unused columns: ", paste(headerWithData ,collapse=";"), "\n")
      
      return(mappedTable[,colNames[colIndicator]])
}

### Save Function Takes An DataFrame + Base File Path (w/o extendsion) & Writes DF Disk In Multiple Formats
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

### Batch Is Used To Process Multiple TCGA Files Defined 
os.data.batch <- function(inputFile, outputDirectory){
        
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
					df <- os.data.load( 
							inputFile = inputFile, 
							columns = os.table.mappings[[currentTable]])
					
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
        outputDirectory = os.data.batch.outputDir)