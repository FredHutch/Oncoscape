default:  test

clean: 
	R --vanilla -f ../removeInstalledOncoscapePackages.R

installAndTest: install test

install:
	R --vanilla CMD INSTALL --no-test-load --no-lock PatientHistory
	R --vanilla CMD INSTALL --no-test-load --no-lock SttrDataPackage
	R --vanilla CMD INSTALL --no-test-load --no-lock DEMOdz
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlgg
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAgbm
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrain
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrca
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAprad
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlusc
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAluad
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlung
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAhnsc
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAcoad
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAread
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAcoadread

installLocal:
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock PatientHistory
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock SttrDataPackage
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock DEMOdz
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAlgg
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAgbm
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAbrain
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAbrca
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAprad
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAlusc
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAluad
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAlung
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAhnsc
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAcoad
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAread
	R --vanilla CMD INSTALL -l $(R_LIBS) --no-test-load --no-lock TCGAcoadread

test:
	R --vanilla -f PatientHistory/inst/unitTests/test_PatientHistory.R
	R --vanilla -f SttrDataPackage/inst/unitTests/test_SttrDataPackage.R
	R --vanilla -f DEMOdz/inst/unitTests/test_DEMOdz.R
	R --vanilla -f TCGAlgg/inst/unitTests/test_TCGAlgg.R
	R --vanilla -f TCGAgbm/inst/unitTests/test_TCGAgbm.R
	R --vanilla -f TCGAbrain/inst/unitTests/test_TCGAbrain.R
	R --vanilla -f TCGAbrca/inst/unitTests/test_TCGAbrca.R
	R --vanilla -f TCGAprad/inst/unitTests/test_TCGAprad.R
	R --vanilla -f TCGAlusc/inst/unitTests/test_TCGAlusc.R
	R --vanilla -f TCGAluad/inst/unitTests/test_TCGAluad.R
	R --vanilla -f TCGAlung/inst/unitTests/test_TCGAlung.R
	R --vanilla -f TCGAhnsc/inst/unitTests/test_TCGAhnsc.R
	R --vanilla -f TCGAcoad/inst/unitTests/test_TCGAcoad.R
	R --vanilla -f TCGAread/inst/unitTests/test_TCGAread.R
	R --vanilla -f TCGAcoadread/inst/unitTests/test_TCGAcoadread.R

testPatientHistory:
	R --vanilla CMD INSTALL --no-test-load --no-lock PatientHistory
	R --vanilla -f PatientHistory/inst/unitTests/test_PatientHistory.R

testSttrDataPackage:
	R --vanilla CMD INSTALL --no-test-load --no-lock SttrDataPackage
	R --vanilla -f SttrDataPackage/inst/unitTests/test_SttrDataPackage.R

testDEMOdz:
	R --vanilla CMD INSTALL --no-test-load --no-lock DEMOdz
	R --vanilla -f DEMOdz/inst/unitTests/test_DEMOdz.R

testTCGAgbm:
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAgbm
	R --vanilla -f TCGAgbm/inst/unitTests/test_TCGAgbm.R

testTCGAlgg:
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlgg
	R --vanilla -f TCGAlgg/inst/unitTests/test_TCGAlgg.R

testTCGAbrain:
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrain
	R --vanilla -f TCGAbrain/inst/unitTests/test_TCGAbrain.R

noSVNall:
	R --vanilla CMD INSTALL --no-test-load --no-lock PatientHistory
	R --vanilla -f PatientHistory/inst/unitTests/test_PatientHistory.R
	R --vanilla CMD INSTALL --no-test-load --no-lock SttrDataPackage
	R --vanilla -f SttrDataPackage/inst/unitTests/test_SttrDataPackage.R
	R --vanilla CMD INSTALL --no-test-load --no-lock DEMOdz
	R --vanilla -f DEMOdz/inst/unitTests/test_DEMOdz.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAgbm
	R --vanilla -f TCGAgbm/inst/unitTests/test_TCGAgbm.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlgg
	R --vanilla -f TCGAlgg/inst/unitTests/test_TCGAlgg.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAbrain
	R --vanilla -f TCGAbrain/inst/unitTests/test_TCGAbrain.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAcoadread
	R --vanilla -f TCGAcoadread/inst/unitTests/test_TCGAcoadread.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlusc
	R --vanilla -f TCGAlusc/inst/unitTests/test_TCGAlusc.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAluad
	R --vanilla -f TCGAluad/inst/unitTests/test_TCGAluad.R
	R --vanilla CMD INSTALL --no-test-load --no-lock TCGAlung
	R --vanilla -f TCGAlung/inst/unitTests/test_TCGAlung.R
