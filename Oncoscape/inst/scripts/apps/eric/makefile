test:
	which R
	m4 -E index.pre > index.html
	R CMD INSTALL ../../../..
	nohup R --vanilla -f runEricAsServer-port11995.R  &

deploy: 
	which R
	m4 -E index.pre > index.html
	R CMD INSTALL ../../../..
	nohup R --vanilla -f runEricAsServer-port11005.R  &



pid:
	ps aux | grep runEricAsServer-port11995 | egrep -v grep

privateBrain11005:
	which R
	m4 -E index_private.pre > index.html
	R CMD INSTALL -l /home/sttrweb/lopez/oncoscape/v1.4.60/Rlibs_private/x86_64-unknown-linux-gnu-library/3.2 ../../..
	nohup R --vanilla -l /home/sttrweb/lopez/oncoscape/v1.4.60/Rlibs_private/x86_64-unknown-linux-gnu-library/3.2 -f runEricAsServer.R &

kill:
	- kill -9 `ps aux | grep runEricAsServer | egrep -v grep | awk  '{print $$2}'`



