default: build Rtests server delay py

build:
	(cd ../..; R CMD INSTALL . --no-test-load)

test: Rtests server delay py kill

autoTest:
	python testWebSocketOperations_server.py oncoscape.sttrcancer.org | tee  websocketOperations_server.log

kill: 
	- kill `ps aux | grep runWsTestOnco.R | grep -v grep | awk '{print $$2}'`

server: kill
	bash R --no-save --silent -f ./runWsTestOnco.R &

Rtests:
	R -f test_OncoDev14.R
	R -f test_UserDataStore.R
	R -f test_survival.R
	R -f test_PCA.R
	R -f test_oncoscape.R

delay:
	sleep 30

py:
	python testWebSocketOperations.py

