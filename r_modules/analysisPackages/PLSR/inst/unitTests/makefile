default: build Rtests server py

test: Rtests server py

autoTest:
	python testPLSRWebSocketOperations_server.py oncoscape.sttrcancer.org | tee plsrWebsocketOperations_server.log

build:
	(cd ../..; R CMD INSTALL . --no-test-load)

server:
	- kill `ps aux | grep runPLSRTestWebSocketServer.R | grep -v grep | awk '{print $$2}'`
	bash R --no-save --silent -f ./runPLSRTestWebSocketServer.R &

Rtests:
	R -f test_PLSR.R

py:
	(sleep 15; python testPLSRWebSocketOperations.py localhost:9013 | tee  plsrWebsocketOperations.log)

