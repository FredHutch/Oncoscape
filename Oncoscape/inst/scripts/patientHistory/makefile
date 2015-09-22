devel:
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	R -f runDevel.R

tabs:
	m4 indexTabs.pre > index.html
	R CMD INSTALL ../../..
	R -f runDevel.R



release:
	jshint Module.js
	m4 index.pre > index.html
	R CMD INSTALL  ../../..
	R -f run.R



