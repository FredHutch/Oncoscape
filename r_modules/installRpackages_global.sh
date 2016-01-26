#!/bin/bash
# run with . ./setupLocalR.sh to prevent forking a subshell
Rscript installBioconductorPackages.R



cd dataPackages
R --vanilla CMD INSTALL --no-test-load --no-lock PatientHistory
R --vanilla CMD INSTALL --no-test-load --no-lock SttrDataPackage
R --vanilla CMD INSTALL --no-test-load --no-lock DEMOdz
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAgbm
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlgg
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrain
R --vanilla CMD INSTALL --no-test-load --no-lock DGI
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrca
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAprad
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlusc
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAluad
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlung
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAhnsc
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAcoad
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAread
R --vanilla CMD INSTALL --no-test-load --no-lock TCGAcoadread

cd ../analysisPackages
R --vanilla CMD INSTALL --no-test-load --no-lock PCA
R --vanilla CMD INSTALL --no-test-load --no-lock PLSR

cd ../RInside
R --vanilla CMD INSTALL --no-test-load --no-lock .

cd ../Oncoscape
R --vanilla CMD INSTALL --no-test-load --no-lock .

