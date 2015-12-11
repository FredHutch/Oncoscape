default: install test

# by default removeInstalledOncoscapePackages.R will recursively remove any R package from all libraries
# for matching subdirectory names with a DESCRIPTION file.  To specify certain directories for recursive package
#  removal, include an additional argument specifying the relative paths using a colon separated string, eg
# "dataPackages;analysisPackages;." where the "." includes the current directory.
clean:
	R --vanilla -f removeInstalledOncoscapePackages.R "dataPackages;analysisPackages;Oncoscape"

####
#  INSTALL
#>make
# 1. installs all dependencies, data, and analysis packages
#
# Install R packages using biocLite, including:
#    'pls', 'limma', 'org.Hs.eg.db', 'BiocInstaller', 'AnnotationDbi', 'BiocGenerics'
# Installs analysis package: PCA, PLSR
# Installs data packages: PatientHistory, SttrDataPackage, DEMOdz, TCGAgbm, TCGAlgg, TCGAbrain, DGI
# Install Oncoscape
#
# 2. Tests that datapackages are properly installed and accessible
#
# Tests Oncoscape unit tests
#    Runs test_OncoDev14.R: tests json Operations, load data packages, expression matrix, patientHistoryTable 
#    Runs test_UserDataStore.R: add and remove data from DataStore
#
#  EXECUTE
#>make oncoApp7777
# 1. Kills potential running process then starts Oncoscape R server using DEMOdz & TCGAgbm data on port 7777

install: 
	. ./installRpackages_global.sh

installLocal: 
	mkdir -p $(R_LIBS)
	. ./installRpackages_local.sh

test:
	(cd dataPackages/; make test)
	(cd analysisPackages/; make test)
	(cd Oncoscape/inst/unitTests; make test)
	#(cd Oncoscape/inst/scripts; make check)
		
# launches Oncoscape on the provided port then tests modules using websocket requests	
testWS:
	python testAllWebsocketOperations.py localhost:7777 | tee testAllWebsocketOperations_7777.log &

autoTest:
	(cd analysisPackages/; make autoTest)
	(cd Oncoscape/inst/unitTests; make autoTest)

cleanupTests:
	- kill `ps aux | grep runPLSRTestWebSocketServer.R | grep -v grep | awk '{print $$2}'` 
	- kill `ps aux | grep runPCATestWebSocketServer.R | grep -v grep | awk '{print $$2}'` 
	- kill `ps aux | grep runWsTestOnco.R | grep -v grep | awk '{print $$2}'`

# installOncoscape
####
installOncoscape:
	(cd Oncoscape; R  --vanilla CMD INSTALL --no-test-load --no-lock .)

installOncoscapeLocal:
	(cd Oncoscape; R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock .)
	(cd Oncoscape; sudo R --vanilla CMD BUILD .)

# oncoApp7777: kills then launches R server: public Brain datasets on port 7777
####
#   kills current process and starts new one
#   runs Oncoscape on port 7777 with DEMOdz & TCGAgbm
#   using all (9) current tabs
oncoAppLocal7777:
	(cd Oncoscape/inst/scripts/apps/oncoscape/; make runLocal;)

oncoApp7777:
	(cd Oncoscape/inst/scripts/apps/oncoscape/; make run;)

oncoAppLocal7788:
	(cd Oncoscape/inst/scripts/apps/oncotest/; make runLocal;)

oncoApp7788:
	(cd Oncoscape/inst/scripts/apps/oncotest/; make run;)

oncoWin:
	(cd Oncoscape/inst/scripts/apps/oncoscape/; make runWin;)

oncoWinLocal:
	(cd Oncoscape/inst/scripts/apps/oncoscape/; make runWinLocal;)

oncoDocker:
	(cd Oncoscape/inst/scripts/apps/oncoscape/; make runDocker;)
