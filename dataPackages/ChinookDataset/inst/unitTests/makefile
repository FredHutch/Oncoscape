SERVER = runChinookDatasetServer.R
default: kill server delay py

kill: 
	- kill `ps x | grep $(SERVER) | grep -v grep | awk '{print $$1}'`

server: kill
	bash R --no-save --silent -f $(SERVER) &

delay:
	sleep 10

py: pyWS

pyWS:
	python testWebSocketOperations.py

pyHTTP:
	python testHttpOperations.py
        
