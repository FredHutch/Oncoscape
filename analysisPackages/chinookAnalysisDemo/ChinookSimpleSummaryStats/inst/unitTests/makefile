SERVER = runChinookSimpleSummaryStatsServer.R
default: kill server delay py


kill: 
	- kill `ps aux | grep $(SERVER) | grep -v grep | awk '{print $$2}'`

server: kill
	bash R --no-save --silent -f $(SERVER) &

delay:
	sleep 10

py:
	python testWebSocketOperations.py

