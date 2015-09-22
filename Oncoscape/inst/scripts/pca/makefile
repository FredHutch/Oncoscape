default:
	m4 index.pre > index.html
	R CMD INSTALL  ../../..
	R -f runPcaApp.R

tabs:
	m4 indexTabs.pre > index.html
	R CMD INSTALL  ../../..
	R -f runPcaApp.R

release:
	m4 index.pre > index.html
	R CMD INSTALL  ../../..
	R -f run.R

test:
	m4 indexTabs.pre > index.html
	R --vanilla CMD INSTALL --no-test-load --no-lock ../../..
	- kill `ps aux | grep runPcaTest.R | egrep -v grep | awk '{print $$2}'`
	nohup R --vanilla -f runPcaTest.R &


pid:
	ps aux | grep runPcaAppr | egrep -v grep
