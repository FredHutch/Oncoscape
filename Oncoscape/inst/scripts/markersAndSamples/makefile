default:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	R -f runMarkers.R
#	nohup R -f runPLSR.R &

onLopez: 
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	nohup R -f runMarkers.R &

kill:
	- kill `ps aux | grep runMarkers.R | grep -v grep | awk '{print $$2}'`

