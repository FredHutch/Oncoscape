
devel:
	m4 index.pre > index.html
	R CMD install --no-test-load --no-lock ../../..
	R -f runDevel.R
release:
	m4 index.pre > index.html
	R CMD install --no-test-load --no-lock ../../..
	R -f run.R


