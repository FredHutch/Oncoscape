devel:
	m4 -E index.pre > index.html
	R CMD INSTALL ../../..
	R --vanilla -f runDevel.R

release:
	m4 -E index.pre > index.html
	R CMD INSTALL ../../..
	R --vanilla -f run.R

indirectData:
	m4 -E index.pre > index.html
	R CMD INSTALL ../../..
	R --vanilla -f runSQLdata.R

