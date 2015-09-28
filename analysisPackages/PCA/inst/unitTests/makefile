default: build Rtests server py

test: Rtests server py

autoTest:
	python testPCAWebSocketOperations_server.py oncoscape.sttrcancer.org | tee pcaWebsocketOperations_server.log

build:
	(cd ../..; R CMD INSTALL . --no-test-load)

server:
	- kill `ps aux | grep runPCATestWebSocketServer.R | grep -v grep | awk '{print $$2}'`
	bash R --no-save --silent -f ./runPCATestWebSocketServer.R &

Rtests:
	R -f test_PCA.R

py:
	(sleep 60; python testPCAWebSocketOperations.py localhost 9014 | tee pcaWebsocketOperations.log)

