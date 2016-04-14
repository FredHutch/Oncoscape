###
#
#       This Script Executes Basic Processing On TCGA Files
#       Specifically It Types, Uppercases and In Cases Enforces Enumeration Types
#       
###

# Configuration -----------------------------------------------------------
rm(list = ls(all = TRUE))
options(stringsAsFactors = FALSE)
setwd('/Users/michaelz/Documents/Projects/git/tcgapipe/Oncoscape/dataPackages/scripts')
os.data.batch.inputFile <- "/Users/michaelz/Documents/Projects/git/tcgapipe/Oncoscape/dataPackages/scripts/TCGA_Reference_Filenames_zager.txt"
os.data.batch.outputDir <- "/Users/michaelz/Documents/Projects/git/tcgapipe/clean"

# Library Imports ---------------------------------------------------------
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)

# Class Definitions :: Enumerations -------------------------------------------------------
os.enum.na <- c("[NOTAVAILABLE]","[UNKNOWN]","[NOT AVAILABLE]","[NOT EVALUATED]","UKNOWN","[DISCREPANCY]","OTHER","NOT LISTED IN MEDICAL RECORD","[NOT APPLICABLE]","[PENDING]","OTHER","PENDING", "[NOT AVAILABLE]","[PENDING]","OTHER: SPECIFY IN NOTES","[NOTAVAILABLE]","OTHER (SPECIFY BELOW)","OTHER", "SPECIFY")
os.enum.logical.true  <- c("TRUE","YES","1","Y")
os.enum.logical.false <- c("FALSE","NO","0","N")

os.enum.classes <- list(
        "os.class.gender" = c("MALE", "FEMALE"),
        "os.class.race" = c("WHITE","BLACK OR AFRICAN AMERICAN","ASIAN","AMERICAN INDIAN OR ALASKA NATIVE"),
        "os.class.ethnicity" = c("HISPANIC OR LATINO","NOT HISPANIC OR LATINO"),
        "os.class.disease" = c("BREAST","COLON","BRAIN","RECTUM","PROSTATE","LUNG","BLADDER","HEAD AND NECK","PANCREAS","SARCOMA"),
        "os.class.route" = c("ORAL","INTRAVENOUS (IV)","INTRATUMORAL","INTRAVESICAL","INTRA-PERITONEAL (IP)|INTRAVENOUS (IV)","SUBCUTANEOUS (SC)","INTRAVENOUS (IV)|ORAL","INTRAMUSCULAR (IM)","INTRAMUSCULAR (IM)|INTRAVENOUS (IV)"),
        "os.class.vital" = c("DEAD","ALIVE"),
        "os.class.status" = c("WITH TUMOR","TUMOR FREE"),
        "os.class.newTumor" = c("LOCOREGIONAL DISEASE","RECURRENCE" ,"PROGRESSION OF DISEASE","METASTATIC","DISTANT METASTASIS","LOCOREGIONAL RECURRENCE","NEW PRIMARY TUMOR","BIOCHEMICAL EVIDENCE OF DISEASE"),
        "os.class.encType" = c("[NOT AVAILABLE]","PRE-OPERATIVE","PRE-ADJUVANT THERAPY" ,"POST-ADJUVANT THERAPY","ADJUVANT THERAPY","PREOPERATIVE"),
        "os.class.side" = c("RIGHT","LEFT", "BILATERAL"),
        "os.class.site" = c("RECURRENCE" ,"PROGRESSION OF DISEASE","LOCOREGIONAL DISEASE","METASTATIC","DISTANT METASTASIS","NEW PRIMARY TUMOR", "LOCOREGIONAL RECURRENCE","BIOCHEMICAL EVIDENCE OF DISEASE")
)
Map( function(key, value, env=parent.frame()){
        setClass(key)
        setAs("character", key, function(from){ 
                # Convert To Upper + Set NAs  
                from<-toupper(from)	
                from.na<-which(from %in% os.enum.na)
                from[from.na]<-NA    
                
                # Return Enum or NA
                if(all(from %in% c(value, NA))) return(from)	
                
                # Kill If Not In Enum or Na
                stop(setdiff(from,c(enum, NA)))
        })
}, names(os.enum.classes), os.enum.classes);

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
setAs("numeric","os.class.tcgaNumeric", function(from){
        
        # Convert Input Character Vector To Uppercase
        from<-toupper(from)	
        
        # Get Indexes Of Fram Where Value Is In NA
        from.na<-which(from %in% os.enum.na)
        
        # Set From Indexes Values To NA
        from[from.na]<-NA	
        
        return(as.numeric(from))
})

### TCGA Boolean
setClass("os.class.tcgaBoolean");
setAs("logical","os.class.tcgaBoolean", function(from){
        
        from<-toupper(from)	
        
        from.na<-which(from %in% os.enum.na)
        from[from.na]<-NA  
        
        from.true <- which( from %in% os.enum.logical.true )
        from[from.true] <- TRUE
        
        from.false <- which(from %in% os.enum.logical.false )
        from[from.false] <- FALSE
        
        # Return Enum or NA
        if( all(from %in% c( os.enum.logical.true, os.enum.logical.false, NA))) return( as.logical(from) )
        
        # Kill If Not In Enum or Na
        stop(setdiff(from,c( os.enum.logical.true, os.enum.logical.false, NA )))
})

# Table Mapping Definitions -------------------------------------------------
os.table.mappings <- list(
        "pt" = list(
                'bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
                'initial_pathologic_dx_year' = list(name = "dxYear", data = "os.class.tcgaDate"), 
                #Birth Table 
                'birth_days_to' = list(name = "dob", data = "os.class.tcgaNumeric"),
                'gender' = list(name = "gender", data = "os.class.gender"),
                'ethnicity' = list(name = "ethnicity", data = "os.class.ethnicity"),
                'race' = list(name = "race", data = "os.class.race"), 
                #Diagnosis Table 
                'tumor_tissue_site' = list(name = "tumorTissueSite", data = "os.class.disease"),
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
                'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter")
        ),
        "drug"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
                     'pharmaceutical_tx_started_days_to' = list(name = "drugStart", data = "os.class.tcgaNumeric"),
                     'pharmaceutical_tx_ended_days_to' = list(name = "drugEnd", data = "os.class.tcgaNumeric"),
                     'pharmaceutical_therapy_drug_name' = list(name = "DrugTherapyName", data = "os.class.tcgaCharacter"),
                     'pharmaceutical_therapy_type' = list(name = "drugType", data = "os.class.tcgaCharacter"),
                     'therapy_regimen' = list(name = "drugTherapyRegimen", data = "os.class.tcgaCharacter"),
                     'prescribed_dose' = list(name = "drugDose", data = "os.class.tcgaCharacter"),
                     'total_dose' = list(name = "drugTotalDose", data = "os.class.tcgaCharacter"),
                     'pharmaceutical_tx_dose_units' = list(name = "drugUnits", data = "os.class.tcgaCharacter"),
                     'pharmaceutical_tx_total_dose_units' = list(name = "drugTotalDoseUnits", data = "os.class.tcgaCharacter"),
                     'route_of_administration' = list(name = "drugAdministration", data = "os.class.route"),
                     'pharma_adjuvant_cycles_count' = list(name = "drugCycles", data = "os.class.tcgaCharacter")
        ),
        "rad"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
                    'radiation_therapy_started_days_to' = list(name = "radStart", data = "os.class.tcgaNumeric"),
                    'radiation_therapy_ended_days_to' = list(name = "radEnd", data = "os.class.tcgaNumeric"),
                    'radiation_therapy_type' = list(name = "radType", data = "os.class.tcgaCharacter"),
                    'radiation_type_other' = list(name = "radTypeOther", data = "os.class.tcgaCharacter"),
                    'therapy_regimen' = list(name = "radiationTherapyRegimen", data = "os.class.tcgaCharacter"),
                    'radiation_therapy_site' = list(name = "radiationTherapySite", data = "os.class.tcgaCharacter"),
                    'radiation_total_dose' = list(name = "radiationTotalDose", data = "os.class.tcgaCharacter"),
                    'radiation_adjuvant_units' = list(name = "radiationTotalDoseUnits", data = "os.class.tcgaCharacter"),
                    'radiation_adjuvant_fractions_total' = list(name = "radiationNumFractions", data = "os.class.tcgaCharacter")
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
                   'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter")
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
                   'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter")
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
                   'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter")
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
                    'other_malignancy_laterality' = list(name = "otherMalignancyLaterality", data = "os.class.side"),
                    'surgery_type' = list(name = "surgeryType", data = "os.class.tcgaCharacter"), 
                    #Pathology Table 
                    'other_malignancy_anatomic_site' = list(name = "otherMalignancyAnatomicSite", data = "os.class.tcgaCharacter"),
                    'days_to_other_malignancy_dx' = list(name = "dateOtherMalignancy", data = "os.class.tcgaNumeric"),
                    'other_malignancy_histological_type' = list(name = "otherMalignancyHistologicalType", data = "os.class.tcgaCharacter"),
                    'other_malignancy_histological_type_text' = list(name = "otherMalignancyHistologicalTypeText", data = "os.class.tcgaCharacter"), 
                    #Absent Table 
                    'days_to_other_malignancy_dx' = list(name = "daysToOtherMalignancyDx", data = "os.class.tcgaNumeric"),
                    'radiation_tx_indicator' = list(name = "radiationTxIndicator", data = "os.class.radInd"),
                    'drug_tx_indicator' = list(name = "drugTxIndicator", data = "os.class.drugInd")
        ),
        "nte"= list('bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
                    'days_to_new_tumor_event_after_initial_treatment' = list(name = "daysToNewTumorEventAfterInitialTreatment", data = "os.class.tcgaNumeric"),
                    'new_tumor_event_dx_days_to' = list(name = "newTumorEventDxDaysTo'", data = "os.class.tcgaNumeric"),
                    'additional_radiation_therapy' = list(name = "additionalRadiationTherapy", data = "os.class.radInd"),
                    'new_tumor_event_radiation_tx' = list(name = "newTumorEventRadiationTx", data = "os.class.radInd"),
                    'additional_pharmaceutical_therapy' = list(name = "additionalPharmaceuticalTherapy", data = "os.class.drugInd"),
                    'new_tumor_event_pharmaceutical_tx' = list(name = "newTumorEventPharmaceuticalTx", data = "os.class.drugInd"), 
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
                    'new_tumor_event_additional_surgery_procedure' = list(name = "newTumorEventAdditionalSurgeryProcedure", data = "os.class.tcgaCharacter")
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
                       'new_tumor_event_dx_days_to' = list(name = "newTumorEventDxDaysTo'", data = "os.class.tcgaNumeric"),
                       'additional_radiation_therapy' = list(name = "additionalRadiationTherapy", data = "os.class.tcgaCharacter"),
                       'new_tumor_event_radiation_tx' = list(name = "newTumorEventRadiationTx", data = "os.class.tcgaCharacter"),
                       'additional_pharmaceutical_therapy' = list(name = "additionalPharmaceuticalTherapy", data = "os.class.tcgaCharacter"),
                       'new_tumor_event_pharmaceutical_tx' = list(name = "newTumorEventPharmaceuticalTx'", data = "os.class.tcgaCharacter"), 
                       #Test Table 
                       'bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
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
                       'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter")
        )
)

# IO Utility Functions :: [Batch, Load, Save]  -------------------------------------------------------

### Load Function Takes An Import File + Column List & Returns A DataFrame
os.data.load <- function(inputFile, columns){
        
        # Columns :: Create List From Url
        header <- unlist(strsplit(readLines(inputFile, n=1),'\t'));
        
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
        read.delim(inputFile,
                   header = FALSE, 
                   skip = 3,
                   dec = ".", 
                   sep = "\t",
                   strip.white = TRUE,
                   numerals = "warn.loss",
                   col.names = colNames,
                   colClasses = colData
        );
}

### Save Function Takes An DataFrame + Base File Path (w/o extendsion) & Writes DF Disk In Multiple Formats
os.data.save <- function(df, file){
        
        # Write Tab Delimited
        write.table(df, file=paste(file,".txt", sep = ""), quote=F, sep="\t")
        
        # Write CSV Delimited
        write.csv(df, file=paste(file,".csv",sep = ""), quote = F)
        
        # Write RData File
        save(df, file=paste(file,".RData", sep = "") )
        
        # Return DataFrame For Chaining
        return(df)
}

### Batch Is Used To Process Multiple TCGA Files Defined 
os.data.batch <- function(inputFile, outputDirectory){
        
        # Load Input File 
        inputFiles <- read.table(inputFile, sep="\t", header=TRUE)
        
        # Get Column Names Of Input Files (Used To Map To Function)
        colNames <- colnames(inputFiles)
        
        # Get Vector Of Disease Names (Used For File Save)
        diseases <- inputFiles[,1]
        
        # Get Vector Of Directories (Used To Prefix Files On Load)
        directories <- inputFiles[,2]
        
        # Loop Column Wise
        for (columnIndex in 3:ncol(inputFiles))
        {
                for (rowIndex in 1:nrow(inputFiles))
                {
                        currentTable <- colNames[columnIndex]
                        currentDisease <- diseases[ rowIndex ];
                        currentDirectory <- directories[ rowIndex ]
                        currentDataFile <- inputFiles[ rowIndex, columnIndex]
                        if (is.na(currentDataFile)) next()
                        inputFile <- paste(currentDirectory, "/", currentDataFile, sep = "")
                        outputFile <- paste(outputDirectory, "/", currentDisease, "_", currentTable, sep="")
                        
                        # Load Data Frame
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