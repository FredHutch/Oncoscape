devel:
#	jshint Module.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	R -f runDevel.R

tabs:
#	jshint Module.js
	m4 indexTabs.pre > index.html
	R CMD install  ../../..
	R -f runDevel.R

release:
	m4 index.pre > index.html
	R CMD install ../../..
	R -f run.R



