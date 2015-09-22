default: build Rtests server py

build:
	(cd ../..; R CMD INSTALL . --no-test-load)

server:
	- kill `ps aux | grep runPCATestWebSocketServer.R | grep -v grep | awk '{print $$2}'`
	bash R --no-save --silent -f ./runPCATestWebSocketServer.R &

Rtests:
	R -f test_PCA.R

py:
	(sleep 60; python testPCAWebSocketOperations.py | tee pcaWebsocketOperations.log)

