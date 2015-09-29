default: kill
	which R
	m4 -E index.pre > index.html
	R CMD INSTALL ../../../..
	nohup R --vanilla -f runOncoscapeApp-7788.R &


kill:
	- kill -9 `ps aux | grep runOncoscapeApp-7788 | egrep -v grep | awk  '{print $$2}'`

local: kill
	which R
	m4 -E index.pre > index.html
	nohup R --vanilla -f runOncoscapeApp-7788.R &
