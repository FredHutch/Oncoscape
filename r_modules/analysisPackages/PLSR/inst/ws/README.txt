To Run Python Tester:

1. Ensure websocket module for python installed
	https://pypi.python.org/pypi/websocket-client
2. Start R server from ws folder
	>cd <repo Source>/analysisPackages/PLSR/inst/ws/
	>R
	>source("wsWrapper.R")
	>deploy()
3. Run python test script
	python testWrapper.py 
#    For python3 syntax:	python3 testWrapper3.py 
#4. Open browser to view results
#	http://localhost:9003/