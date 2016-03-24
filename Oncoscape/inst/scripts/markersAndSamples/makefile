default:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	#R -f runMarkers.R  demo@fhcrc.org "DEMOdz"
	R -f runMarkers.R  demo@fhcrc.org "DEMOdz;TCGAbrain"
	#R -f runMarkers.R  demo@fhcrc.org "DEMOdz;TCGAgbm"
	#R -f runMarkers.R  demo@fhcrc.org "DEMOdz;TCGAgbm;TCGAbrain"

kill:
	- kill -9 `ps aux | grep runOncoscape | egrep -v grep | awk  '{print $$1}'`

test:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	#R -f runMarkers.R  autotest.1@nowhere.org.exitnOCompletion "TCGAgbm"
	#R -f runMarkers.R  autotest.10@nowhere.org.exitNOnCompletion "DEMOdz"
	#R -f runMarkers.R  autotest.1@nowhere.org.exitnOCompletion "DEMOdz;TCGAgbm"
	R -f runMarkers.R  autotest.2@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"
	#R -f runMarkers.R  autotest.10@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"

check:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R -f runMarkers.R  autotest.10@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAlgg;TCGAbrain;TCGAbrca;TCGAprad;TCGAlusc;TCGAluad;TCGAlung;TCGAhnsc;TCGAcoadread"

runDocker: kill
	which R
	m4 -E index.pre > index.html
	R CMD INSTALL ../../..
	R --vanilla -f runOncoscape.R

