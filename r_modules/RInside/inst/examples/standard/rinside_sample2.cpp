// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 8; -*-
//
// Simple example for the repeated r-devel mails by Abhijit Bera
//
// Copyright (C) 2009         Dirk Eddelbuettel 
// Copyright (C) 2010 - 2011  Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside

int main(int argc, char *argv[]) {

    try {
        RInside R(argc, argv);          // create an embedded R instance 

        std::string txt = "suppressMessages(library(fPortfolio))";
        R.parseEvalQ(txt);              // load library, no return value

        txt = "M <- as.matrix(SWX.RET); print(head(M)); M";
        Rcpp::NumericMatrix M = R.parseEval(txt);  // assign mat. M to NumericMatrix

        std::cout << "M has " 
                  << M.nrow() << " rows and " 
                  << M.ncol() << " cols" << std::endl;
        
        txt = "colnames(M)";		// assign columns names of M to ans and
        Rcpp::CharacterVector cnames = R.parseEval(txt);   // into str.vec. cnames

        for (int i=0; i<M.ncol(); i++) {
            std::cout << "Column " << cnames[i] << " in row 42 has " << M(42,i) << std::endl;
        }
    
    } catch(std::exception& ex) {
        std::cerr << "Exception caught: " << ex.what() << std::endl;
    } catch(...) {
        std::cerr << "Unknown exception caught" << std::endl;
    }

    exit(0);
}

