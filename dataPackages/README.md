# **Generating and Testing Data Packages for Oncoscape** 
## Clinical Data
1. Download [TCGA data](https://tcga-data.nci.nih.gov/tcga/)
	* Save the files at Oncoscape/dataPackages/RawData/TCGA_newPackage/:pushpin:
2. Use TCGAgbm as an example to create a new directory 
	* Create Oncoscape/dataPackages/TCGA_newPackage
	* Change string "TCGAgbm" to the new package name within all the files under the directory
3. cd Oncoscape/dataPackages/TCGA_newPackage/inst/import/history
	* Update _createEventList.R_
	* Run the R file to generate clinical Data Type R Object  and store it at inst/extdata/
4. Update _PatientHistory_ReferenceTable.xlsx_ at RawData/
5. Update _manifest.tsv_:pushpin: at Oncoscape/dataPackages/TCGA_newPackage/inst/extdata/ 
 	 
## Molecular Data
1. Install cBio MySQL database cgds_public
2. To select the disease-related molecular data by finding out the cancer_study_id
	* `select stable_id, cancer_Study_id from genetic_profile`
3. Run mysql calls at command line to populate the raw data for various datatypes including: Copy Number Aberration, Mutation, Expression, Methylation and Protein
	* Store the molecular data at RawData/TCGA_newPackage/ along with the updated _mysql_cBio_TCGA_calls.txt_:pushpin: 
4. cd Oncoscape/dataPackages/TCGA_newPackages/inst/import/molecularDataType/
	* Update create R Object document 
	* Run the R file to generate molecular Data Type R Object and store it at inst/extdata/
5. Update Oncoscape/dataPackages/TCGA_newPackage/inst/extdata/manifest.tsv:pushpin: 

## Data Package
1. Update 
2. 