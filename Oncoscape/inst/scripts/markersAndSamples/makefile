default:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD install --no-test-load --no-lock ../../..
	R -f runMarkers.R
#	nohup R -f runPLSR.R &

kill:
	- kill `ps aux | grep runMarkers.R | grep -v grep | awk '{print $$2}'`

