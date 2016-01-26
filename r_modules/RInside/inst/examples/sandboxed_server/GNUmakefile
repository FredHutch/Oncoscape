## -*- mode: make; tab-width: 8; -*-
##
## Simple Makefile
##
## TODO: 
##  proper configure for non-Debian file locations,   [ Done ]
##  allow RHOME to be set for non-default R etc

## comment this out if you need a different version of R, 
## and set set R_HOME accordingly as an environment variable
R_HOME := 		$(shell R RHOME)

sources_datatypes := $(wildcard datatypes/*.cpp)
objects_datatypes := $(sources_datatypes:.cpp=.o)
sources_server    := $(wildcard server/*.cpp)
objects_server    := $(sources_server:.cpp=.o)
sources_client    := $(wildcard client/*.cpp)
objects_client    := $(sources_client:.cpp=.o)
sources_common    := $(wildcard common/*.cpp)
objects_common    := $(sources_common:.cpp=.o)
server := 		example_server
client := 		example_client

## include headers and libraries for R 
RCPPFLAGS := 		$(shell $(R_HOME)/bin/R CMD config --cppflags)
RLDFLAGS := 		$(shell $(R_HOME)/bin/R CMD config --ldflags)
RBLAS := 		$(shell $(R_HOME)/bin/R CMD config BLAS_LIBS)
RLAPACK := 		$(shell $(R_HOME)/bin/R CMD config LAPACK_LIBS)

## if you need to set an rpath to R itself, also uncomment
#RRPATH :=		-Wl,-rpath,$(R_HOME)/lib

## include headers and libraries for Rcpp interface classes
## note that RCPPLIBS will be empty with Rcpp (>= 0.11.0) and can be omitted
RCPPINCL := 		$(shell echo 'Rcpp:::CxxFlags()' | $(R_HOME)/bin/R --vanilla --slave)
RCPPLIBS := 		$(shell echo 'Rcpp:::LdFlags()'  | $(R_HOME)/bin/R --vanilla --slave)


## include headers and libraries for RInside embedding classes
RINSIDEINCL := 		$(shell echo 'RInside:::CxxFlags()' | $(R_HOME)/bin/R --vanilla --slave)
RINSIDELIBS := 		$(shell echo 'RInside:::LdFlags()'  | $(R_HOME)/bin/R --vanilla --slave)

## compiler etc settings used in default make rules
CXX := 			$(shell $(R_HOME)/bin/R CMD config CXX)
CPPFLAGS := 		-std=c++11 -Wall $(shell $(R_HOME)/bin/R CMD config CPPFLAGS)
CXXFLAGS := 		$(RCPPFLAGS) $(RCPPINCL) $(RINSIDEINCL) $(shell $(R_HOME)/bin/R CMD config CXXFLAGS)
LDLIBS := 		$(RLDFLAGS) $(RRPATH) $(RBLAS) $(RLAPACK) $(RCPPLIBS) $(RINSIDELIBS)

all: 			$(server) $(client)
			echo "\n\nCompilation finished.\nRun ./example_server in one shell, then run ./example_client in another."

$(server): 			$(objects_server) $(objects_common) $(objects_datatypes) example_server.o
			$(CXX) $+ $(LDLIBS) -o $@

$(client): 			$(objects_client) $(objects_common) $(objects_datatypes) example_client.o
			$(CXX) $+ $(LDLIBS) -o $@

%.o: 			%.cpp
			$(CXX) $(CPPFLAGS) $(CXXFLAGS) -I. -c $+ -o $@

clean:
			rm -vf $(server) $(client) $(objects_server) $(objects_client) $(objects_common) $(objects_datatypes) example_server.o example_client.o
