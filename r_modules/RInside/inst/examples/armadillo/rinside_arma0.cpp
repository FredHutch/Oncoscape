// -*- c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Simple example using Armadillo classes
//
// Copyright (C) 2012 - 2013  Dirk Eddelbuettel and Romain Francois

#include <RcppArmadillo.h>      	// for Armadillo as well as Rcpp 
#include <RInside.h>                    // for the embedded R via RInside

int main(int argc, char *argv[]) {

    RInside R(argc, argv);		// create an embedded R instance

    std::string cmd = "diag(3)"; 	// create a Matrix in r 

    arma::mat m = Rcpp::as<arma::mat>(R.parseEval(cmd)); // parse, eval + return result

    std::cout << m << std::endl; 	// and use Armadillo i/o  

    exit(0);
}
