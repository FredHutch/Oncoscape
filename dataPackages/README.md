# **Generating and Testing Data Packages for Oncoscape** 
###### :pushpin: To avoid the change of format, only open/edit with plain text editors

Oncoscape transforms and hosts TCGA level 3 data within the public site [oncoscape.sttrcancer.org](http://oncoscape.sttrcancer.org).  The following description explains how to obtain and transform TCGA data into the necessary data structures and classes for Oncoscape.

## Clinical Data
1. Create a new folder within [Oncoscape/dataPackages](https://github.com/FredHutch/Oncoscape/tree/develop/dataPackages)/RawData/ using a name that describes the dataset.  For example, TCGAgbm includes the TCGA glioblastoma multiforme data, TCGAlgg includes the lower grade glioma, and TCGAbrain encompasses TCGAgbm and TCGAlgg.  Note that the RawData folder is not currently tracked within git in order to reduce the datapackage size.  This may change if/when data is separated into a subModule or there is sufficient need expressed by collaborators.
2. Download [TCGA data](https://tcga-data.nci.nih.gov/tcga/)
	* Choose the desired dataset and select the link of clinical cases within the cancer details.  For example, [TCGAgbm](https://tcga-data.nci.nih.gov/tcga/tcgaCancerDetails.jsp?diseaseType=GBM&diseaseName=Glioblastoma%20multiforme) has 523 cases as of 11/16/15
	* Click on the "BioTab" header to select all samples in that format, and click "Build Archive."  For example, the [TCGAgbm data matrix](https://tcga-data.nci.nih.gov/tcga/dataAccessMatrix.htm?mode=ApplyFilter&showMatrix=true&diseaseType=GBM&tumorNormal=TN&tumorNormal=T&tumorNormal=NT&platformType=-999).
	* Enter your email and download the files to the directory created in step 1.
3. Create a new directory as the basis for the data package under  [Oncoscape/dataPackages/](https://github.com/FredHutch/Oncoscape/tree/develop/dataPackages/)
	* The easiest method is to copy [Oncoscape/dataPackages/TCGAgbm](https://github.com/FredHutch/Oncoscape/tree/develop/dataPackages/TCGAgbm) as a template then replace all instances of "TCGAgbm" with the new package name within all the files under the directory.```>grep -rl 'TCGAgbm' TCGAgbm/ | xargs sed -i "" 's/TCGAgbm/TCGA_newPackage/g'``` [See more details on string matching here](http://vasir.net/blog/ubuntu/replace_string_in_multiple_files) 
	


4. Transform and save the clinical data tables as R objects
	* Update the TCGA_newPackage/inst/import/history/createEventList.R file.  One example is [TCGAgbm createEventList.R](https://github.com/FredHutch/Oncoscape/blob/develop/dataPackages/TCGAgbm/inst/import/history/createEventList.R)
	* Reference and Update [PatientHistory_ReferenceTable.xlsx](https://github.com/FredHutch/Oncoscape/blob/develop/dataPackages/PatientHistory_ReferenceTable.xlsx) with the file names and column headers indicating the source of each field
	* Generate and save 3 R Objects in inst/extdata/ ```>Rscript createEventList.R```
		* Different organ sites may have slightly different arrangments of raw data tables, and column names. The createEventList.R needs to be updated to grab the accurate content.
		* Missing Value Update: convert values such as '[Unavailable]', '[Unapplicable]', '[Unknown]', '[Pending]', 'unknown' to NA
		* Name standardization: ie. convert the chemo drugs to standard chemo drug names 
		* Update all the values in the testing functions. Design the tests to reflect all the updates and value increments (e.g. in Progression)
		
6. Update manifest.tsv:pushpin: at TCGA_newPackage/inst/extdata 
 	 
## Molecular Data
1. Molecular data is obtained from the [Cancer Genomic Data Server](http://www.cbioportal.org/web_api.jsp) hosted by MSKCC cBioportal.
2. Select the disease-related molecular data by finding the associated cancer_study_id
3. Save raw data for various datatypes by querying for: Copy Number Aberration, Mutation, Expression, Methylation and Protein
	* Store the molecular data at RawData/TCGA_newPackage/ along with the updated _mysql_cBio_TCGA_calls.txt_:pushpin: 
4. Create R objects storing matrices of molecular profiles
	* Update the import & testing script for each molecular data type. For example, [TCGAgbm copy number](https://github.com/FredHutch/Oncoscape/tree/develop/dataPackages/TCGAgbm/inst/import/copyNumber)
	* Generate and save each R Object in inst/extdata/, e.g. ```>Rscript createCopyNumberMatrix.R```
5. Update the manifest file to recognize and load each data type.  For example,  [TCGAgbm](https://github.com/FredHutch/Oncoscape/tree/develop/dataPackages/TCGAgbm/inst/extdata/manifest.tsv):pushpin: 

## Data Package
Each disease type accesses the clinical and molecular profiles through it's instance of the SttrDataPackage constructor class.  To add and link a new data package to Oncoscape, it must be added to the install, test and build targets as described here.

1. Update files linked to test/install targets:
	* [install R packages globally](https://github.com/FredHutch/Oncoscape/tree/develop/installRpackages_global.sh)
	* [install R packages locally](https://github.com/FredHutch/Oncoscape/tree/develop/installRpackages_local.sh)
	* [uninstall R packages](https://github.com/FredHutch/Oncoscape/tree/develop/removeInstalledOncoscapePackages.R)
	* [Oncoscape/dataPackages/makefile](https://github.com/FredHutch/Oncoscape/blob/develop/dataPackages/makefile)
	* [run develop branch](https://github.com/FredHutch/Oncoscape/blob/develop/Oncoscape/inst/scripts/apps/oncoscape/runOncoscapeApp-7777.R)
2.  Build and Install new data package from Oncoscape/dataPackages/:
	* `R CMD Build <TCGA_newPackage>`
	* `R CMD Install <TCGA_newPackage>`
3. Update and run unit tests at _inst/unitTests/test_TCGAnewPackage.R_
4. Check new data package:
	* `R CMD Check <TCGA_newPackage>`

## Testing before submission
1.	Update the content from current develop branch
	* `git pull`
2.  switch to the current feature branch
```
	>git checkout <current feature>
	>cd Oncoscape
	>make clean
	>make install
	>make test
```

