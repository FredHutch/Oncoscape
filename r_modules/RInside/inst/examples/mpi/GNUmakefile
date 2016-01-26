## -*- mode: make; tab-width: 8; -*-
##
## Simple Makefile for MPI use of RInside
##
## TODO: 
##  proper configure for non-Debian file locations,   [ Done ]
##  allow RHOME to be set for non-default R etc       [ Done ]

## comment this out if you need a different version of R, 
## and set set R_HOME accordingly as an environment variable
R_HOME := 		$(shell R RHOME)

sources := 		$(wildcard *.cpp)
programs := 		$(sources:.cpp=)


# OpenMPI header and libraries
MPICPPFLAGS :=		$(shell mpic++ -showme:compile)
MPILIBS :=		$(shell mpic++ -showme:link)

## include headers and libraries for R 
RCPPFLAGS := 		$(shell $(R_HOME)/bin/R CMD config --cppflags)
RLDFLAGS := 		$(shell $(R_HOME)/bin/R CMD config --ldflags)
RBLAS := 		$(shell $(R_HOME)/bin/R CMD config BLAS_LIBS)
RLAPACK := 		$(shell $(R_HOME)/bin/R CMD config LAPACK_LIBS)


## include headers and libraries for Rcpp interface classes
## note that RCPPLIBS will be empty with Rcpp (>= 0.11.0) and can be omitted
RCPPINCL := 		$(shell echo 'Rcpp:::CxxFlags()' | $(R_HOME)/bin/R --vanilla --slave)
RCPPLIBS := 		$(shell echo 'Rcpp:::LdFlags()'  | $(R_HOME)/bin/R --vanilla --slave)


## include headers and libraries for RInside embedding classes
RINSIDEINCL := 		$(shell echo 'RInside:::CxxFlags()' | $(R_HOME)/bin/R --vanilla --slave)
RINSIDELIBS := 		$(shell echo 'RInside:::LdFlags()'  | $(R_HOME)/bin/R --vanilla --slave)


## compiler etc settings used in default make rules
CXX := 			$(shell $(R_HOME)/bin/R CMD config CXX)
CPPFLAGS := 		-Wall $(shell $(R_HOME)/bin/R CMD config CPPFLAGS)
CXXFLAGS := 		$(MPICPPFLAGS) $(RCPPFLAGS) $(RCPPINCL) $(RINSIDEINCL) $(shell $(R_HOME)/bin/R CMD config CXXFLAGS)
LDLIBS := 		$(MPILIBS) $(RLDFLAGS) $(RBLAS) $(RLAPACK) $(RCPPLIBS) $(RINSIDELIBS)

all : 			$(programs)
			@test -x /usr/bin/strip && strip $^

run :			$(programs)
			@test -x /usr/bin/mpirun && for p in $(programs); do echo; echo "Running $$p:"; mpirun -n 4 ./$$p; done

clean:
			rm -vf $(programs)

