
########################################################################     Step 1: Load Reference Tables/Files  ########################################################################
rm(list=ls(all=TRUE))
options(stringsAsFactors=FALSE)
library(RUnit)
library(R.utils)
library(stringr)
library(plyr)


setwd('/Volumes/homes/Oncoscape/dataPackages/scripts')
source("TCGAinit.R")
source("TCGAClasses.R")
source("TCGAEnums.R")

########################################################################     Step 2: Mappping ########################################################################
#---------------------- Patient Table Mapping Starts Here      -----------------------
os.import.table.patient <- function(fileInput, fileOutput){		   
		 df  <- os.data.load(fileInput, 
		              list(
		                    'bcr_patient_barcode' = list(name = "PatientID", data = "os.class.tcgaId"),
		                   	'initial_pathologic_dx_year' = list(name = "dxyear", data = "os.class.tcgaDate"),
		                   	#Birth Table
		                   	'birth_days_to' = list(name = "dob", data = "numeric"),
		                  	'gender' = list(name = "gender", data = "os.class.gender"),
		                   	'ethnicity' = list(name = "ethnicity", data ="os.class.ethnicity"),
		                    'race' = list(name = "race", data = "os.class.race"),
		                    #Diagnosis Table
		                	'tumor_tissue_site' = list(name = "disease", data ="os.class.disease"),
					     	'tissue_source_site' = list(name = "tissueSourceSiteCode", data = "os.class.tcgaCharacter")
				      		#Status Table
					     	'vital_status' = list(name = "vital", data = "os.class.vital"),
						    'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
						    'last_contact_days_to' = list(name = "lastContact", data = "numeric"),
						    'death_days_to' = list(name = "deathDate", data = "numeric"),
         					#Encounter Table
         					'performance_status_timing' = list(name = "encType", data = "os.class.encType"),
	                        'karnofsky_score'= list(name = "KPS", data = "numeric"),
	         				'ecog_score' = list(name = "ECOG", data = "numeric"),
	                        	#coad/read only
	         				'height_cm_at_diagnosis' = list(name = "height", data = "numeric"),
	                        'weight_kg_at_diagnosis' = list(name = "weight", data = "numeric"),
	                         	#lung only
	                        'fev1_fvc_ratio_prebroncholiator'= list(name = "prefev1.ratio", data = "numeric"),
	                        'fev1_percent_ref_prebroncholiator'= list(name = "prefev1.percent", data = "numeric"),
	                        'fev1_fvc_ratio_postbroncholiator'= list(name = "postfev1.ratio", data = "numeric"),
	                        'fev1_percent_ref_postbroncholiator'= list(name = "postfev1.percent", data = "numeric"),
	                        'carbon_monoxide_diffusion_dlco'= list(name = "carbon.monoxide.diffusion", data = "numeric")
	                        #Procedure Table
	                        'laterality'  = list(name = "side", data = "os.class.tcgaCharacter"), 
	                        'tumor_site' = list(name = "site", data = "os.class.tcgaCharacter"),  
	                        'supratentorial_localization'= list(name = "site", data = "os.class.tcgaCharacter"), 
	                        'surgical_procedure_first'= list(name = "surgery_name", data = "os.class.tcgaCharacter"), 
	                        'first_surgical_procedure_other'= list(name = "surgery_name", data = "os.class.tcgaCharacter"), 
	                        #Pathology Table
         					'days_to_initial_pathologic_diagnosis'  = list(name = "date", data = "numeric"), 
		         			'tumor_tissue_site' = list(name = "pathDisease", data = "os.class.tcgaCharacter"),  
		         			'histological_type'= list(name = "pathHistology", data = "os.class.tcgaCharacter"), 
		         			'prospective_collection'= list(name = "prospective_collection", data = "os.class.prospective_collection"),
		         			'retrospective_collection'= list(name = "retrospective_collection", data = "os.class.retrospective_collection"), 
		         			'method_initial_path_dx' = list(name = "pathMethod", data = "os.class.tcgaCharacter"),
		         			'ajcc_tumor_pathologic_pt' = list(name = "T.Stage", data = "os.class.tcgaCharacter"),
		         			'ajcc_nodes_pathologic_pn' = list(name = "N.Stage", data = "os.class.tcgaCharacter"),
		         			'ajcc_metastasis_pathologic_pm' = list(name = "M.Stage", data = "os.class.tcgaCharacter"),
		         			'ajcc_pathologic_tumor_stage'= list(name = "S.Stage", data = "os.class.tcgaCharacter"),
		         			'ajcc_staging_edition' = list(name = "staging.System", data = "os.class.tcgaCharacter"),
		         			'tumor_grade' = list(name = "grade", data = "os.class.tcgaCharacter"),
		         			#Absent Table
		         			'pulmonary_function_test_indicator' = list(name = "pulInd", data = "os.class.tcgaCharacter"),
		         			#Test Table
		         			'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
						   	'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
						   	'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
						   	'days_to_mri' = list(name = "mriDate", data = "numeric"),
						    'idh1_mutation_test_method' =  list(name = "idh1Method", data = "os.class.tcgaCharacter"),
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

		                ))
				 os.data.save(df, file=fileOutput)
			 rm(df)		
 } # End of Patient Table mapping 
#---------------------- Drug Table Mapping Starts Here   ----------------------
os.import.table.drug <- function(fileInput, fileOutput){		   
	  df  <- os.data.load(uri, 
	               list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						'pharmaceutical_tx_started_days_to' = list(name = "drugStart", data = "numeric"),
						'pharmaceutical_tx_ended_days_to' = list(name = "drugEnd", data = "numeric"),
						'pharmaceutical_therapy_drug_name' = list(name = "agent", data = "os.class.tcgaCharacter"),
						'pharmaceutical_therapy_type' = list(name = "therapyType", data = "os.class.tcgaCharacter"),
						'therapy_regimen' = list(name = "intent", data = "os.class.tcgaCharacter"),
						'prescribed_dose' = list(name = "dose", data = "os.class.tcgaCharacter"),
						'total_dose' = list(name = "totalDose", data = "os.class.tcgaCharacter"),
						'pharmaceutical_tx_dose_units' = list(name = "units", data = "os.class.tcgaCharacter"),
						'pharmaceutical_tx_total_dose_units' = list(name = "totalDoseUnits", data = "os.class.tcgaCharacter"),
						'route_of_administration' = list(name = "route", data = "os.class.route"),
						'pharma_adjuvant_cycles_count' = list(name = "cycle", data = "os.class.tcgaCharacter")	     
					   ))	  
	

		                ))
				 os.data.save(df, file=fileOutput)
			 rm(df)		
 } # End of Drug Table mapping 
#---------------------- Radiation Table Mapping Starts Here   ----------------------
os.import.table.rad <- function(fileInput, fileOutput){		   
	 df  <- os.data.load(uri,   				  
	  				list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'radiation_therapy_started_days_to' = list(name = "radStart", data = "numeric"),
					     'radiation_therapy_ended_days_to' = list(name = "radEnd", data = "numeric"),
						 'radiation_therapy_type' = list(name = "radType", data = "os.class.tcgaCharacter"),
						 'radiation_type_other' = list(name = "radTypeOther", data = "os.class.tcgaCharacter"),
					     'therapy_regimen' = list(name = "intent", data = "os.class.tcgaCharacter"),
						 'radiation_therapy_site' = list(name = "target", data = "os.class.tcgaCharacter"),
						 'radiation_total_dose' = list(name = "totalDose", data = "os.class.tcgaCharacter"),
						 'radiation_adjuvant_units' = list(name = "totalDoseUnits", data = "os.class.tcgaCharacter"),
						 'radiation_adjuvant_fractions_total' = list(name = "numFractions", data = "os.class.tcgaCharacter")
						))
							     
				 os.data.save(df, file=fileOutput)
			 rm(df)		
 } # End of Radiation Table mapping 
#---------------------- Follow_up_1 Table Mapping Starts Here   ----------------------
os.import.table.f1 <- function(fileInput, fileOutput){		   
	 df  <- os.data.load(uri,   				  
	  				list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						 #Status Table
						 'vital_status' = list(name = "vital", data = "os.class.vital"),
					     'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
					     'last_contact_days_to' = list(name = "lastContact", data = "numeric"),
					     'death_days_to' = list(name = "deathDate", data = "numeric"),
						 #Progression Table
						 'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "numeric"),
						 'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
						 'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
						 #Encounter Table
						 'performance_status_timing' = list(name = "encType", data = "os.class.encType"),
                         'karnofsky_score'= list(name = "KPS", data = "numeric"),
                         'ecog_score' = list(name = "ECOG", data = "numeric"),
                         #Absent Table
                         'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "numeric"),
					     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "os.class.radInd"),
					     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "os.class.drugInd"),
                         #Test Table
                         'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
					   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
					   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
					   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
						))
							     
				 os.data.save(df, file=fileOutput)
			 rm(df)		
 } # End of Follow_up_1 Table mapping 
#---------------------- Follow_up_2 Table Mapping Starts Here   ----------------------
os.import.table.f2 <- function(fileInput, fileOutput){		   
	 df  <- os.data.load(uri,   				  
	  				list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						 #Status Table
						 'vital_status' = list(name = "vital", data = "os.class.vital"),
					     'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
					     'last_contact_days_to' = list(name = "lastContact", data = "numeric"),
					     'death_days_to' = list(name = "deathDate", data = "numeric")
						 #Progression Table
						 'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "numeric"),
						 'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
						 'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor")
						 #Encounter Table
						 'performance_status_timing' = list(name = "encType", data = "os.class.encType"),
                         'karnofsky_score'= list(name = "KPS", data = "numeric"),
                         'ecog_score' = list(name = "ECOG", data = "numeric")
                         #Absent Table
                         'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "numeric"),
					     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "os.class.radInd"),
					     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "os.class.drugInd")
                         #Test Table
                         'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
					   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
					   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
					   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
						))
							     
				 os.data.save(df, file=fileOutput)
			 rm(df)		
 } # End of Follow_up_2 Table mapping 
#---------------------- Follow_up_3 Table Mapping Starts Here   ----------------------
os.import.table.f3 <- function(fileInput, fileOutput){		   
	 df  <- os.data.load(uri,   				  
	  				list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     #Status Table
						     'vital_status' = list(name = "vital", data = "os.class.vital"),
						     'tumor_status' = list(name = "tumorStatus", data = "os.class.status"),
						     'last_contact_days_to' = list(name = "lastContact", data = "numeric"),
						     'death_days_to' = list(name = "deathDate", data = "numeric"),
						     #Absent Table
						     'new_tumor_event_dx_days_to' = list(name = "omfdx", data = "numeric"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "os.class.tcgaCharacter"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "os.class.tcgaCharacter"),
						     #Test Table
			                 'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
						))
							     
				 os.data.save(df, file=fileOutput)
			 rm(df)		
 } # End of Follow_up_3 Table mapping 
#---------------------- omf Table Mapping Starts Here   ----------------------
os.import.table.omf <- function(fileInput, fileOutput){		   
	 df  <- os.data.load(uri,   				  
	  				list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     #drug Table
					     'drug_name' = list(name = "agent", data = "os.class.tcgaCharacter"),
					     'days_to_drug_therapy_start' = list(name = "drugStart", data = "numeric"),
					     'malignancy_type' = list(name = "intent", data = "os.class.tcgaCharacter"),
						 #Radiation Table
						 'radiation_tx_extent' = list(name = "target", data = "os.class.tcgaCharacter"),
						 'rad_tx_to_site_of_primary_tumor' = list(name = "targetAddition", data = "os.class.tcgaCharacter"),
						 'days_to_radiation_therapy_start' = list(name = "radStart", data = "numeric")
						 #Procedure Table
						 'days_to_surgical_resection' = list(name = "date", data = "numeric"), 
                         'other_malignancy_laterality' = list(name = "side", data = "os.class.side"), 
                         'surgery_type' = list(name = "surgery_name", data = "os.class.tcgaCharacter"),  
						#Pathology Table
						'other_malignancy_anatomic_site' = list(name = "pathDisease", data = "os.class.tcgaCharacter"), 
				         'days_to_other_malignancy_dx' = list(name = "date_other_malignancy", data = "numeric"),
				         'other_malignancy_histological_type' = list(name = "pathHistology", data = "os.class.tcgaCharacter"),
				         'other_malignancy_histological_type_text' = list(name = "pathHistology", data = "os.class.tcgaCharacter"),
						#Absent Table
						'days_to_other_malignancy_dx' = list(name = "omfdx", data = "numeric"),
					     'radiation_tx_indicator' = list(name = "radInd", data = "os.class.radInd"),
					     'drug_tx_indicator' = list(name = "drugInd", data = "os.class.drugInd")

						))
							     
				 os.data.save(df, file=fileOutput)
			 rm(df)		
 } # End of omf Table mapping 
#---------------------- nte Table Mapping Starts Here   ----------------------
os.import.table.nte <- function(fileInput, fileOutput){		   
	 df  <- os.data.load(uri,   				  
	  				list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     'days_to_new_tumor_event_after_initial_treatment' = list(name = "omfdx", data = "numeric"),
					     'new_tumor_event_dx_days_to'  = list(name = "omfdx", data = "numeric"),
					     'additional_radiation_therapy' = list(name = "radInd", data = "os.class.radInd"),
					     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "os.class.radInd"),
					     'additional_pharmaceutical_therapy' = list(name = "drugInd", data = "os.class.drugInd"),
					     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "os.class.drugInd"),
					     #Test Table
					     'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
					   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
					   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
					   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
					   	 'nte_cent17_her2_other_scale' = list(name = "nteCent17Her2OtherScale", data = "os.class.tcgaCharacter")
						 #Progression Table
						 'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "numeric"),
						 'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
						 'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor")
						 #Procedure Table
						 'new_tumor_event_surgery_days_to_loco' = list(name = "date_locoregional", data = "numeric"), 
                         'new_tumor_event_surgery_days_to_met'= list(name = "date_metastatic", data = "numeric"), 
                         'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "os.class.tcgaCharacter"), 
                         'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date", data = "numeric"), 
                         'new_neoplasm_event_type'  = list(name = "site", data = "os.class.tcgaCharacter"), 
                         'new_tumor_event_type'  = list(name = "site", data = "os.class.tcgaCharacter") 
                         'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "os.class.tcgaCharacter") 
						))
							     
				 os.data.save(df, file=fileOutput)
			 rm(df)		
 } # End of nte Table mapping 
#---------------------- nte_f1 Table Mapping Starts Here   ----------------------
os.import.table.nte_f1 <- function(fileInput, fileOutput){		   
	 df  <- os.data.load(uri,   				  
	  				list('bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
					     #Progression Table
					     'new_tumor_event_dx_days_to' = list(name = "newTumorDate", data = "numeric"),
						     'new_neoplasm_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
						     'new_tumor_event_type' = list(name = "newTumor", data = "os.class.newTumor"),
						     #Procedure Table
						     'new_tumor_event_surgery' = list(name = "new_tumor_event_surgery", data = "os.class.tcgaCharacter"), 
	                           'days_to_new_tumor_event_additional_surgery_procedure'  = list(name = "date", data = "numeric"), 
	                           'new_neoplasm_event_type'  = list(name = "site", data = "os.class.tcgaCharacter"), 
	                           'new_tumor_event_type'  = list(name = "site", data = "os.class.tcgaCharacter"), 
	                           'new_tumor_event_additional_surgery_procedure'  = list(name = "new_tumor_event_additional_surgery_procedure", data = "os.class.tcgaCharacter"),
	                           #Absent Table
	                           'days_to_new_tumor_event_after_initial_treatment' = list(name = "omfdx", data = "numeric"),
						     'new_tumor_event_dx_days_to'  = list(name = "omfdx", data = "numeric"),
						     'additional_radiation_therapy' = list(name = "radInd", data = "os.class.tcgaCharacter"),
						     'new_tumor_event_radiation_tx' = list(name = "radInd", data = "os.class.tcgaCharacter"),
						     'additional_pharmaceutical_therapy' = list(name = "drugInd", data = "os.class.tcgaCharacter"),
						     'new_tumor_event_pharmaceutical_tx' = list(name = "drugInd", data = "os.class.tcgaCharacter"),
						     #Test Table
						     'bcr_patient_barcode' = list(name = "PatientID", data = "tcgaId"),
						     'days_to_psa_most_recent' = list(name = "psaDate", data = "numeric"),
						   	 'days_to_bone_scan' = list(name = "boneScanDate", data = "numeric"),
						   	 'days_to_ct_scan_ab_pelvis' = list(name = "ctAbPelDate", data = "numeric"),
						   	 'days_to_mri' = list(name = "mriDate", data = "numeric"),
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
						))			     
				 os.data.save(df, file=fileOutput)
			 rm(df)		
 } # End of nte_f1 Table mapping 

########################################################################     Step 3: Load fileInput/Output function ########################################################################	            

