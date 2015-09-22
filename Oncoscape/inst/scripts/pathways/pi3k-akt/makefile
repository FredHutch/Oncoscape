devel:
	m4 index.pre > index.html
	R CMD INSTALL --no-test-load --no-lock ../../../..
	R -f runDevel.R

tabs:
	m4 indexTabs.pre > index.html
	R CMD INSTALL --no-test-load --no-lock ../../../..
	R -f runPathwayApp.R



release:
	m4 index.pre > index.html
	R CMD INSTALL --no-test-load --no-lock ../../../..
	R -f run.R




pid:
	ps aux | grep runPathwayApp | egrep -v grep
