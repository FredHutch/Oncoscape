# Oncoscape - PCA
## Authors
Lisa McFerrin, Paul Shannon, Hamid Bolouri, Jenny Zhang
## Manual
* The PCA tab computes Principal Component Analysis on the provided geneset and dataset by calling the internally developed PCA package located under the analysisPackage directory.  Default settings call prcomp() setting both center and scale to TRUE.
* To initially populate the display, choose a geneset from the gene set dropdown menu then click "Calculate". After calculation, users will see the pca plot of the received patients according to their expression profile. 
* This tab can both receive/send patient IDs. Drag a rectagular box to select a patient set then choose a destination from the "Send selection..." menu to continue analyzing the patients IDs in another oncoscape tab.
* If the current plot is not representing the entire cohort of patients in the expression dataset, the "Use All Samples in the Current Dataset" button will be enabled. By clicking this button, the entire cohort of this dataset will be used in the recalculation and display.
* When sending patient IDs from aother tab, users have the option to either recalculate PCA using just this cohort (send to "PCA") or highlight these IDs in the current display (send to "PCA highlight").

## Test
###### [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) is used to monitor the changes of DOM for testing purpose. 
###### To run the test, 
   ```
   cd Oncoscape/inst/script/pca
   make check
   ```
###### Features tested include:
1. Iterate through each available data package
2. Randomly select a geneset within each data package
3. Trigger calculation button on the PCA tab
4. Randomly check that the plotted circle features include proper location and css in both the send to "PCA" and "PCA highlight" options

