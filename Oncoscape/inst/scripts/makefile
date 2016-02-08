default: check
	
install:
	R CMD INSTALL ../..

check:
	(cd datasets; make check;)
	(cd markersAndSamples; make check;)
	(cd plsr; make check;)