default:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD install --no-test-load --no-lock ../../..
	R -f runPLSR.R
#	- kill `ps aux | grep runPLSR.R | grep -v grep | awk '{print $$2}'`
#	nohup R -f runPLSR.R &

