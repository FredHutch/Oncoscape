default:  pkgs
	(export M4PATH=../../Oncoscape/inst/scripts;m4 index.pre > index.html)
	R -f runPCA.R nobody@nowhere.org "DEMOdz"

pkgs:
	R CMD install ../../dataPackages/ChinookDataset/
	R CMD install ../../Oncoscape/
