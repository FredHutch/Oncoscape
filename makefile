default: install
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
	(cd dataPackages/; make test)
	(cd analysisPackages/; make test)
	(cd oncoDev14/Oncoscape/inst/unitTests; make)

cleanupTests:
	- kill `ps aux | grep runPLSRTestWebSocketServer.R | grep -v grep | awk '{print $$2}'` 
	- kill `ps aux | grep runPCATestWebSocketServer.R | grep -v grep | awk '{print $$2}'` 
	- kill `ps aux | grep runWsTestOnco.R | grep -v grep | awk '{print $$2}'`

# installOncoscape
####
installOncoscape:
	(cd oncoDev14/Oncoscape; R  --vanilla CMD INSTALL --no-test-load --no-lock .)

# oncoApp7777: kills then launches R server: public Brain datasets on port 7777
####
#   kills current process and starts new one
#   runs Oncoscape on port 7777 with DEMOdz & TCGAgbm
#   using all (9) current tabs
oncoApp7777:
	- kill -9 `ps aux | grep runOncoscapeApp | egrep -v grep | awk  '{print $$2}'`
	(cd oncoDev14/Oncoscape/inst/scripts/apps/oncoscape/; make local;)

