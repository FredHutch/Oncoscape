default:
	svn up .
	R --vanilla CMD INSTALL --no-test-load --no-lock .
	(cd inst/unitTests; make)
