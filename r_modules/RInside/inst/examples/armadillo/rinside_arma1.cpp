// -*- c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Simple example using Armadillo on matrix data generated in R
//
// Copyright (C) 2012 - 2013  Dirk Eddelbuettel and Romain Francois

#include <RcppArmadillo.h>      	// for Armadillo as well as Rcpp 
#include <RInside.h>                    // for the embedded R via RInside

int main(int argc, char *argv[]) {

    RInside R(argc, argv);		// create an embedded R instance

    std::string cmd = "set.seed(42); matrix(rnorm(9),3,3)"; 	// create a random Matrix in r 

    arma::mat m = Rcpp::as<arma::mat>(R.parseEval(cmd)); // parse, eval + return result
    arma::mat n = m.t() * m;
    double nacc = arma::accu(n);
    double nrnk = arma::rank(n);

    m.print("Initial Matrix m"); 			// initial random matrix
    n.print("Product n = m' * m");		 	// product of m' * m
    std::cout << "accu(n) " << nacc << " " 
	      << "rank(n) " << nrnk << std::endl; 	// accu() and rank()

    exit(0);
}

