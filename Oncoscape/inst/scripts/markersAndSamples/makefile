default:
	m4 indexTabs.pre > index.html
	R CMD INSTALL --no-test-load --no-lock ../../..
	R -f runMarkersApp.R

pid:
	ps aux | grep runMarkersApp | egrep -v grep


test:
	m4 indexTabs.pre > index.html
	R --vanilla CMD INSTALL --no-test-load  ../../..
	R --vanilla -f runMarkersTest.R
