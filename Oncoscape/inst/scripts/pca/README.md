# Oncoscape - PCA
## Authors
Lisa McFerrin PhD
## Manual
* The PCA tab within Oncoscape is designed to compute Principal component analysis on the selected dataset with selected geneset. 
* This tab can both receive/send patient IDs. And according to the geneset selected from select gene set dropdown menu (and then click "Calculate" button), users will see the pca plot of the received patient according to their expression profile. 
* Users can also drag a rectagular box to select and then send the patients IDs to another oncoscape tab to continue the calculation.
* If the current displayed patients are not the entire cohort, the "Use All Samples in the Current Dataset" button will be enabled. By clicking this button, the entire cohort of this dataset will be displayed.
* When sending patient IDs from aother tab, there will be option to display them on PCA as either regular or the highlight fashion. **PCA highlight** feature could highlight the selected patients against another cohort in the background.  

## Test
1. Iterate through all the data packages 
	* dataSetSpecified
	* ```testCalculate()```
	* chose first geneSet (**need to be updated to interation through all the genesets**)
	*  make a websocket call to return the dimension of the expression dataset, which includes the number of patient and genes as well as a list of patient IDs (could be maxmum). The returned value is stored as a global variable.
	* ```testContent()```
		* ```$('circle').length >= 120``` - need to be updated 
		* xPos, yPox, radius defined and radius === 3
		* x,y, min, max * 1.1 should map to the score
2. Test select/send IDs on regular PCA plot
3. Test select/send IDs on highligh PCA plot
