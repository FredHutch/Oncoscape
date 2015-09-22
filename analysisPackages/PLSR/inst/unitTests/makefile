default: build Rtests server py

build:
	(cd ../..; R CMD INSTALL . --no-test-load)

server:
	- kill `ps aux | grep runPLSRTestWebSocketServer.R | grep -v grep | awk '{print $$2}'`
	bash R --no-save --silent -f ./runPLSRTestWebSocketServer.R &

Rtests:
	R -f test_PLSR.R

py:
	(sleep 15; python testPLSRWebSocketOperations.py | tee  plsrWebsocketOperations.log)

