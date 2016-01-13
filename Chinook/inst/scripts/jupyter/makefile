default:
	jshint Module.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	R -f runJupyter.R  demo@fhcrc.org "DEMOdz;TCGAgbm;TCGAbrain"

test:
	jshint Module.js
	jshint Test.js
	m4 index.pre > index.html
	R CMD INSTALL ../../..
	R -f runJupyter.R  autotest.60@nowhere.org.exitOnCompletion "DEMOdz"




