default: build Rtests server delay py

build:
	(cd ../..; R CMD INSTALL . --no-test-load)

test: Rtests server delay py kill

kill: 
	- kill `ps aux | grep runEmptyChinookServer.R | grep -v grep | awk '{print $$2}'`

server: kill
	bash R --no-save --silent -f ./runEmptyChinookServer.R &

Rtests:
	R -f test_ChinookServer.R

delay:
	sleep 10

py:
	python testEmptyChinookServer.py

