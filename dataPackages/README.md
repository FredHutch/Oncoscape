# **Generating and Testing Data Packages for Oncoscape** 
###### :pushpin: To avoid the change of format, only open/edit with plain text editors
## Clinical Data
1. Download [TCGA data](https://tcga-data.nci.nih.gov/tcga/)
	* Save the files at [Oncoscape/dataPackages](https://github.com/FredHutch/Oncoscape/tree/develop/dataPackages)/RawData/TCGA_newPackage/:pushpin:
2. Use TCGAgbm as an example to create a new directory 
	* Create [Oncoscape/dataPackages](https://github.com/FredHutch/Oncoscape/tree/develop/dataPackages)/TCGA_newPackage
	* Change string "TCGAgbm" to the new package name within all the files under the directory
3. cd TCGA_newPackage/inst/import/history
	* Update [createEventList.R](https://github.com/FredHutch/Oncoscape/blob/develop/dataPackages/TCGAgbm/inst/import/history/createEventList.R)
	* Run the R file to generate clinical Data Type R Object  and store it at inst/extdata/
4. Update [PatientHistory_ReferenceTable.xlsx](https://github.com/FredHutch/Oncoscape/blob/develop/dataPackages/PatientHistory_ReferenceTable.xlsx)
5. Update manifest.tsv:pushpin: at TCGA_newPackage/inst/extdata 
 	 
## Molecular Data
1. Install cBio MySQL database cgds_public
2. To select the disease-related molecular data by finding out the cancer_study_id
	* `select stable_id, cancer_Study_id from genetic_profile`
3. Run mysql calls at command line to populate the raw data for various datatypes including: Copy Number Aberration, Mutation, Expression, Methylation and Protein
	* Store the molecular data at RawData/TCGA_newPackage/ along with the updated _mysql_cBio_TCGA_calls.txt_:pushpin: 
4. cd [TCGA_newPackages/inst/import/molecularDataType](https://github.com/FredHutch/Oncoscape/tree/develop/dataPackages/TCGAgbm/inst/import/copyNumber)
	* Update create R Object document 
	* Run the R file to generate molecular Data Type R Object and store it at inst/extdata/
5. Update [Oncoscape/dataPackages](https://github.com/FredHutch/Oncoscape/tree/develop/dataPackages)/TCGA_newPackage/inst/extdata/manifest.tsv:pushpin: 

## Data Package
1. Update files linked to test/install targets:
	* _[Oncoscape](https://github.com/FredHutch/Oncoscape/tree/develop)/installRpackages_global.sh_
	* _[Oncoscape](https://github.com/FredHutch/Oncoscape/tree/develop)/installRpackages_local.sh_
	* _[Oncoscape](https://github.com/FredHutch/Oncoscape/tree/develop)/removeInstalledOncoscapePackages.R_
	* [_Oncoscape/dataPackages/makefile_](https://github.com/FredHutch/Oncoscape/blob/develop/dataPackages/makefile)
	* [_Oncoscape/inst/scripts/apps/oncotest/runOncoscapeApp-7788.R_](https://github.com/FredHutch/Oncoscape/blob/develop/Oncoscape/inst/scripts/apps/oncoscape/runOncoscapeApp-7777.R)
2.  Build and Install new data package:
	* `R CMD Build <TCGA_newPackage>`
	* `R CMD Install <TCGA_newPackage>`
3. Update and RUN unit tests at _inst/unitTests/test_TCGAnewPackage.R_
4. Check new data package:
	* `R CMD Check <TCGA_newPackage>`

## Testing before submission
1.	Update the content from current develop branch
	* `git pull`
2.  switch to the current feature branch
	* `git checkout <current feature>`
	* cd Oncoscape
	* `make clean`
	* `make install`
	* `make test`

	_
