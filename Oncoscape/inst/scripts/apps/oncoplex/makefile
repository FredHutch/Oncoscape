default:
	which R
	echo $$R_LIBS
	m4 -E index.pre > index.html
	R CMD INSTALL ../../../..
#	R --vanilla -f runOncoplexAsServer.R
	nohup R --vanilla -f runOncoplexAsServer.R &


pid:
	ps aux | grep runOncoplexAsServer | egrep -v grep


test:
	m4 -E index.pre > index.html
	R CMD INSTALL ../../..
	R --vanilla -f runOncoplexAsServer.R

