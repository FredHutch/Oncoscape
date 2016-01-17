SERVER = runChinookPCAServer.R
default: build kill server delay pyWS

build:
	R CMD INSTALL ../..
        
kill: 
	- kill `ps x | grep $(SERVER) | grep -v grep | awk '{print $$1}'`

server: kill
	bash R --no-save --silent -f $(SERVER) &

delay:
	sleep 10

py: pyWS pyHTTP


pyWS:
	python testWebSocketOperations.py

pyHTTP:
	python testHttpOperations.py
        
