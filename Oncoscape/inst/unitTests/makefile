default: build Rtests server delay py

build:
	(cd ../..; R CMD INSTALL . --no-test-load)

server:
	- kill `ps aux | grep runWsTestOnco.R | grep -v grep | awk '{print $$2}'`
	bash R --no-save --silent -f ./runWsTestOnco.R &

Rtests:
	R -f test_OncoDev14.R
	R -f test_UserDataStore.R

delay:
	sleep 30

py:
	python testWebSocketOperations.py | tee  websocketOperations.log

