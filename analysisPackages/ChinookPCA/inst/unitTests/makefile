SERVER = runChinookPCAServer.R
<<<<<<< HEAD
default: kill server delay pyWS
=======
default: kill server delay py
>>>>>>> 81395fd01ecbef350decba460ce0f8a9d9333261


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
        
