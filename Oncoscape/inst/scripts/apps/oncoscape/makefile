run: kill
	which R
	m4 -E index.pre > index.html
	R CMD INSTALL ../../../..
	nohup R --vanilla -f runOncoscapeApp-7777.R &


kill:
	- kill -9 `ps aux | grep runOncoscapeApp-7777 | egrep -v grep | awk  '{print $$1}'`

runLocal: kill
	which R
	m4 -E index.pre > index.html
	R CMD INSTALL -l $(R_LIBS) ../../../..
	nohup R --vanilla -f runOncoscapeApp-7777.R &

runWin:
	M4 -E index.pre > index.html
	R CMD INSTALL ../../../..
	R --vanilla -f runOncoscapeApp-7777.R

runWinLocal:
	m4 -E index.pre > index.html
	R CMD INSTALL -l %R_LIBS% ../../../..
	R --vanilla -f runOncoscapeApp-7777.R

runDocker: kill
	which R
	m4 -E index.pre > index.html
	R CMD INSTALL ../../../..
	R --vanilla -f runOncoscapeApp-7777.R
