# Oncoscape - PCA
## Authors
Lisa McFerrin, Paul Shannon, and Hamid Bolouri
## Manual
* The PCA tab within Oncoscape is designed to compute Principal component analysis on the selected dataset with selected geneset. 
* This tab can both receive/send patient IDs. And according to the geneset selected from select gene set dropdown menu (and then click "Calculate" button), users will see the pca plot of the received patient according to their expression profile. 
* Users can also drag a rectagular box to select and then send the patients IDs to another oncoscape tab to continue the calculation.
* If the current displayed patients are not the entire cohort, the "Use All Samples in the Current Dataset" button will be enabled. By clicking this button, the entire cohort of this dataset will be displayed.
* When sending patient IDs from aother tab, there will be option to display them on PCA as either regular or the highlight fashion. **PCA highlight** feature could highlight the selected patients against another cohort in the background.  

## Test
###### [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) is used to monitor the changes of DOM for testing purpose. 
###### To run the test, 
   ```
   cd Oncoscape/inst/script/pca
   make check
   ```
###### Features tested include:
1. Iteration through all the data packages 
2. randomly geneset selection within each data package
3. calculation button on the PCA tab
4. On the regular PCA plot, randomly checking the plotted circle features including location, css  
5. On the highlight PCA plot, randomly checking the plotted circle features including location, css  

