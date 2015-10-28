default:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	R -f runMarkers.R  demo@fhcrc.org "DEMOdz"

test:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	#R -f runMarkers.R  autotest.2@nowhere.org.exitOnCompletion "DEMOdz"
	#R -f runMarkers.R  autotest.1@nowhere.org.exitnOCompletion "DEMOdz;TCGAgbm"
	#R -f runMarkers.R  autotest.3@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"
	#R -f runMarkers.R  autotest.2@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"
	R -f runMarkers.R  autotest.10@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"


