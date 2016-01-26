// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; tab-width: 8; -*-
//
// Simple example with data in C++ that is passed to R, processed and a result is extracted
//
// Copyright (C) 2009         Dirk Eddelbuettel 
// Copyright (C) 2010 - 2011  Dirk Eddelbuettel and Romain Francois
//
// GPL'ed 

#include <RInside.h>                            // for the embedded R via RInside

Rcpp::NumericMatrix createMatrix(const int n) {
    Rcpp::NumericMatrix M(n,n);
    for (int i=0; i<n; i++) {
        for (int j=0; j<n; j++) {
            M(i,j) = i*10 + j; 
        }
    }
    return(M);
}

int main(int argc, char *argv[]) {

    RInside R(argc, argv);                      // create an embedded R instance 
    
    const int mdim = 4;                         // let the matrices be 4 by 4; create, fill 
    R["M"] = createMatrix(mdim);                // then assign data Matrix to R's 'M' var

    std::string str = 
        "cat('Running ls()\n'); print(ls()); "
        "cat('Showing M\n'); print(M); "
        "cat('Showing colSums()\n'); Z <- colSums(M); print(Z); "
        "Z";                     // returns Z

    
    Rcpp::NumericVector v = R.parseEval(str);   // eval string, Z then assigned to num. vec              

    for (int i=0; i< v.size(); i++) {           // show the result
        std::cout << "In C++ element " << i << " is " << v[i] << std::endl;
    }
    exit(0);
}


