// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; tab-width: 8; -*-
//
// Simple example for using lm() using the example from help(swiss)
//
// Copyright (C) 2009 Dirk Eddelbuettel 
// Copyright (C) 2010 Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside
#include <iomanip>

int main(int argc, char *argv[]) {

    RInside R(argc, argv);              // create an embedded R instance 

    std::string txt =                   // load library, run regression, create summary
        "suppressMessages(require(stats));"     
        "swisssum <- summary(lm(Fertility ~ . , data = swiss));" 
        "print(swisssum)";             
    R.parseEvalQ(txt);                  // eval command, no return

    // evaluate R expressions, and assign directly into Rcpp types
    Rcpp::NumericMatrix     M( (SEXP) R.parseEval("swcoef <- coef(swisssum)"));  	        
    Rcpp::StringVector cnames( (SEXP) R.parseEval("colnames(swcoef)"));
    Rcpp::StringVector rnames( (SEXP) R.parseEval("rownames(swcoef)")); 

    std::cout << "\n\nAnd now from C++\n\n\t\t\t";
    for (int i=0; i<cnames.size(); i++) {
        std::cout << std::setw(11) << cnames[i] << "\t";
    }
    std::cout << std::endl;
    for (int i=0; i<rnames.size(); i++) {
        std::cout << std::setw(16) << rnames[i] << "\t";
        for (int j=0; j<cnames.size(); j++) {
            std::cout << std::setw(11) << M(i,j) << "\t";
        }
        std::cout << std::endl;
    }
    std::cout << std::endl;

    exit(0);
}

