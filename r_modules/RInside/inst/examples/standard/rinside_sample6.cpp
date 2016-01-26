// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 8; -*-
//
// Showing off some of the templated conversion due to Rcpp
//
// Copyright (C) 2009        Dirk Eddelbuettel 
// Copyright (C) 2010 - 2011 Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside

int main(int argc, char *argv[]) {

    try {

        RInside R(argc, argv);          // create an embedded R instance 

	double d1 = 1.234;		// scalar double
	R["d1"] = d1;			// or R.assign(d1, "d1")

	std::vector<double> d2;		// vector of doubles
	d2.push_back(1.23);
	d2.push_back(4.56);
	R["d2"] = d2;			// or R.assign(d2, "d2");

	std::map< std::string, double > d3; // map of doubles
	d3["a"] = 7.89;
	d3["b"] = 7.07;
	R["d3"] = d3;			// or R.assign(d3, "d3");

	std::list< double > d4; 	// list of doubles
	d4.push_back(1.11);
	d4.push_back(4.44);
	R["d4"] = d4;			// or R.assign(d4, "d4");

	std::string txt = 		// now access in R
	    "cat('\nd1=', d1, '\n'); print(class(d1));"
	    "cat('\nd2=\n'); print(d2); print(class(d2));"
	    "cat('\nd3=\n'); print(d3); print(class(d3));"
	    "cat('\nd4=\n'); print(d4); print(class(d4));";
        R.parseEvalQ(txt);
        
    } catch(std::exception& ex) {
        std::cerr << "Exception caught: " << ex.what() << std::endl;
    } catch(...) {
        std::cerr << "Unknown exception caught" << std::endl;
    }

    exit(0);
}

