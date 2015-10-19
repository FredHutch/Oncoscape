default:
	which R
	m4 -E index.pre > index.html
	R CMD INSTALL ../../../..
	nohup R --vanilla -f runOncoscapeApp-7788.R &


kill:
	- kill -9 `ps x | grep runOncoscapeApp-7788 | egrep -v grep | awk  '{print $$2}'`

local: 
	which R
	m4 -E index.pre > index.html
	R CMD INSTALL -l $(R_LIBS) ../../../..
	nohup R --vanilla -f runOncoscapeApp-7788.R &
