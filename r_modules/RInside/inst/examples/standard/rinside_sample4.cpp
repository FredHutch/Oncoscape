// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Another simple example inspired by an r-devel mail by Abhijit Bera
//
// Copyright (C) 2009 Dirk Eddelbuettel 
// Copyright (C) 2010 Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside
#include <iomanip>

int main(int argc, char *argv[]) {
    
    try {
        RInside R(argc, argv);          // create an embedded R instance 

        std::string txt = 
            "suppressMessages(library(fPortfolio)); "
            "lppData <- 100 * LPP2005.RET[, 1:6]; "
            "ewSpec <- portfolioSpec(); " 
            "nAssets <- ncol(lppData); ";
        R.parseEvalQ(txt);              // prepare problem
        
        const double dvec[6] = { 0.1, 0.1, 0.1, 0.1, 0.3, 0.3 }; // choose any weights
        const std::vector<double> w(dvec, &dvec[6]);
        R["weightsvec"] = w;            // assign weights
        txt = "setWeights(ewSpec) <- weightsvec";
        R.parseEvalQ(txt);              // evaluate assignment

        txt = 
            "ewPf <- feasiblePortfolio(data=lppData, spec=ewSpec, constraints=\"LongOnly\");"
            "print(ewPf); "
            "vec <- getCovRiskBudgets(ewPf@portfolio)";
        Rcpp::NumericVector   V(     (SEXP) R.parseEval(txt) ); 
        Rcpp::CharacterVector names( (SEXP) R.parseEval("names(vec)"));   

        std::cout << "\n\nAnd now from C++\n\n";
        for (int i=0; i<names.size(); i++) {
            std::cout << std::setw(16) << names[i] << "\t"
                      << std::setw(11) << V[i] << "\n";
        }
        
    } catch(std::exception& ex) {
        std::cerr << "Exception caught: " << ex.what() << std::endl;
    } catch(...) {
        std::cerr << "Unknown exception caught" << std::endl;
    }

    exit(0);
}

