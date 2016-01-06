default: check
	
install:
	R CMD INSTALL ../..

check:
	(cd datasets; make check;)
	(cd markersAndSamples; make check;)
	(cd oncoprint; make check;)