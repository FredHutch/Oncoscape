default:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	#R -f runMarkers.R  demo@fhcrc.org "DEMOdz"
	R -f runMarkers.R  demo@fhcrc.org "DEMOdz;TCGAbrain"
	#R -f runMarkers.R  demo@fhcrc.org "DEMOdz;TCGAgbm"
	#R -f runMarkers.R  demo@fhcrc.org "DEMOdz;TCGAgbm;TCGAbrain"

test:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	#R -f runMarkers.R  autotest.1@nowhere.org.exitnOCompletion "TCGAgbm"
	R -f runMarkers.R  autotest.1@nowhere.org.exitNOnCompletion "DEMOdz"
	#R -f runMarkers.R  autotest.1@nowhere.org.exitnOCompletion "DEMOdz;TCGAgbm"
	#R -f runMarkers.R  autotest.1@nowhere.org.exitNOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"
	#R -f runMarkers.R  autotest.10@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"
	#R -f runMarkers.R  autotest.10@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"

check:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R -f runMarkers.R  autotest.10@nowhere.org.exitOnCompletion "DEMOdz;TCGAgbm;TCGAbrain"


