default:
	jshint Module.js
	R -f runDatasets.R

test:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	#R -f runDatasets.R  autotest.2@nowhere.org.exitOnCompletion "DEMOdz"
	#R -f runDatasets.R  autotest.1@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm"
	#R -f runDatasets.R  autotest.3@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"
	R -f runDatasets.R  autotest.5@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAlgg;TCGAbrain;TCGAbrca;TCGAprad;TCGAlusc;TCGAluad;TCGAlung;TCGAhnsc;TCGAcoadread"

check:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	R -f runDatasets.R  autotest.5@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAlgg;TCGAbrain;TCGAbrca;TCGAprad;TCGAlusc;TCGAluad;TCGAlung;TCGAhnsc;TCGAcoadread"
