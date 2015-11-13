devel:
#	jshint Module.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	R -f runDevel.R

tabs:
#	jshint Module.js
	m4 indexTabs.pre > index.html
	R CMD INSTALL --no-test-load --no-lock ../../..
	R -f runDevel.R



release:
#	jshint Module.js
	m4 index.pre > index.html
	R CMD INSTALL --no-test-load --no-lock ../../..
	R -f run.R



test:
	m4 indexTabs.pre > index.html
	R --vanilla CMD INSTALL --no-test-load --no-lock ../../..
	- kill `ps aux | grep runBlankTabTest.R | egrep -v grep | awk '{print $$2}'`
	nohup R --vanilla -f runBlankTabTest.R &


