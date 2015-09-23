default: build Rtests kill server delay py

build:
	(cd ../..; R CMD INSTALL . --no-test-load)

kill:
	- kill `ps aux | grep runWsTestGSTT.R | grep -v grep | awk '{print $$2}'`

server:
	bash R --no-save --silent -f ./runWsTestGSTT.R &

Rtests:
	R -f test_GeneSetTTests.R

delay:
	sleep 30

py:
	python testGSTTwrapper.py

