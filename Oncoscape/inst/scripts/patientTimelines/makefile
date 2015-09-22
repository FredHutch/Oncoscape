default:
	jshint Module.js
	m4 indexTabs.pre > index.html
	R CMD install --no-test-load --no-lock ../../..
	R -f runDevel.R

tabs:
	jshint Module.js
	m4 indexTabs.pre > index.html
	R CMD install --no-test-load --no-lock ../../..
	R -f runDevel.R

release:
	m4 index.pre > index.html
	R CMD install --no-test-load --no-lock ../../..
	R -f run.R
