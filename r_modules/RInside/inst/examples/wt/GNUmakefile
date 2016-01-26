
## This Makefile is __very__ barebones with respect to Wt. 
##
## It works on Debian/Ubuntu. On other systems, add -I and -L flags as needed. See the cmake use in Wt.


## comment this out if you need a different version of R, 
## and set set R_HOME accordingly as an environment variable
R_HOME := 		$(shell R RHOME)

## include headers and libraries for R 
RCPPFLAGS := 		$(shell $(R_HOME)/bin/R CMD config --cppflags)
RLDFLAGS := 		$(shell $(R_HOME)/bin/R CMD config --ldflags)
RBLAS := 		$(shell $(R_HOME)/bin/R CMD config BLAS_LIBS)
RLAPACK := 		$(shell $(R_HOME)/bin/R CMD config LAPACK_LIBS)

## if you need to set an rpath to R itself, also uncomment
#RRPATH :=		-Wl,-rpath,$(R_HOME)/lib

## include headers and libraries for Rcpp interface classes
RCPPINCL := 		$(shell echo 'Rcpp:::CxxFlags()' | $(R_HOME)/bin/R --vanilla --slave)
RCPPLIBS := 		$(shell echo 'Rcpp:::LdFlags()'  | $(R_HOME)/bin/R --vanilla --slave)

## include headers and libraries for RInside embedding classes
## note that RCPPLIBS will be empty with Rcpp (>= 0.11.0) and can be omitted
RINSIDEINCL := 		$(shell echo 'RInside:::CxxFlags()' | $(R_HOME)/bin/R --vanilla --slave)
RINSIDELIBS := 		$(shell echo 'RInside:::LdFlags()'  | $(R_HOME)/bin/R --vanilla --slave)


## minimal Wt libs -- works for me on Ubuntu, may need -L switches elsewhere...
WITTYLIBS :=		-lwt -lwthttp -lboost_signals 


## compiler etc settings used in default make rules
CXX := 			$(shell $(R_HOME)/bin/R CMD config CXX)
CPPFLAGS := 		-Wall $(shell $(R_HOME)/bin/R CMD config CPPFLAGS)
CXXFLAGS := 		$(RCPPFLAGS) $(RCPPINCL) $(RINSIDEINCL) $(shell $(R_HOME)/bin/R CMD config CXXFLAGS)
LDLIBS := 		$(RLDFLAGS) $(RRPATH) $(RBLAS) $(RLAPACK) $(RCPPLIBS) $(RINSIDELIBS) $(WITTYLIBS)



all:			wtdensity wtdensityPlain

wtdensityPlain:		wtdensityPlain.cpp
			$(CXX) $(CPPFLAGS) $(CXXFLAGS) -o $@ $^ $(LDLIBS) 
			strip $@

wtdensity:		wtdensity.cpp
			$(CXX) $(CPPFLAGS) $(CXXFLAGS) -o $@ $^ $(LDLIBS) 
			strip $@

run:			wtdensity
                        ## Wt resources location on Debian/Ubuntu; adjust as needed
			test -L resources || ln -s /usr/lib/Wt/resources .
			./$< --docroot "." --http-addr 127.0.0.1 --http-port 8080

runPlain:		wtdensityPlain
                        ## Wt resources location on Debian/Ubuntu; adjust as needed
			test -L resources || ln -s /usr/lib/Wt/resources .
			./$< --docroot "." --http-addr 127.0.0.1 --http-port 8081

clean:
			rm -f wtdensity wtdensityPlain resources
