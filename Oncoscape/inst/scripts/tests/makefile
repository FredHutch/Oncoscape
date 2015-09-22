OPTS = 

tabs:
	m4 indexTabs.pre > index.html
	R CMD INSTALL $(OPTS) ../../..
	R -f runDevel.R



release:
	m4 index.pre > index.html
	R CMD INSTALL $(OPTS) ../../..
	R -f run.R



