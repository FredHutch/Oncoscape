default: check
	
install:
	R CMD INSTALL ../..

check:
	(cd datasets; make check;)
	(cd markersAndSamples; make check;)
	(cd oncoprint; make check;)
	(cd plsr; make check;)
	(cd pca; make check;)
