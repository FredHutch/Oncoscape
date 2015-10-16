all:  PCA.pkg PLSR.pkg

test: 
	(cd PLSR/inst/unitTests; make)
	(cd PCA/inst/unitTests; make)
	- kill `ps aux | grep runPLSRTestWebSocketServer.R | grep -v grep | awk '{print $$2}'` 
	- kill `ps aux | grep runPCATestWebSocketServer.R | grep -v grep | awk '{print $$2}'` 

PLSR.pkg:
	R --vanilla CMD INSTALL --no-test-load --no-lock PLSR
	(cd PLSR/inst/unitTests; make)

PCA.pkg:
	R --vanilla CMD INSTALL --no-test-load --no-lock PCA
	(cd PCA/inst/unitTests; make)

noSVNall:
	R --vanilla CMD INSTALL --no-test-load --no-lock PLSR
	(cd PLSR/inst/unitTests; make)
	R --vanilla CMD INSTALL --no-test-load --no-lock PCA
	(cd PCA/inst/unitTests; make)
