// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 8; -*-
//
// Another simple example inspired by an r-devel mail by Martin Becker
//
// Copyright (C) 2009         Dirk Eddelbuettel 
// Copyright (C) 2010 - 2011  Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside

int main(int argc, char *argv[]) {

    try {
        RInside R(argc, argv);          // create an embedded R instance 

        std::string txt = "myenv <- new.env(hash=TRUE, size=NA)";
        R.parseEvalQ(txt);              // eval string quietly, no result

        txt = "is.environment(myenv)";  // logical value assigned
        Rcpp::LogicalVector V = R.parseEval(txt);  // to logical vector

        std::cout << "We "
                  << (V(0) ? "do" : "do not")
                  << " have an environment." << std::endl;
        
    } catch(std::exception& ex) {
        std::cerr << "Exception caught: " << ex.what() << std::endl;
    } catch(...) {
        std::cerr << "Unknown exception caught" << std::endl;
    }

    exit(0);
}

