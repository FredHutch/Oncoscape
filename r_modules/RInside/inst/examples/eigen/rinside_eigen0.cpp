// -*- c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Simple example using Eigen classes
//
// Copyright (C) 2012  Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside
#include <RcppEigen.h>

int main(int argc, char *argv[]) {

    RInside R(argc, argv);		// create an embedded R instance

    std::string cmd = "diag(3)"; 	// create a Matrix in r 

    const Eigen::Map<Eigen::MatrixXd>  m = // parse, eval + return result
      Rcpp::as<Eigen::Map<Eigen::MatrixXd> >(R.parseEval(cmd));

    std::cout << m << std::endl; 	// and use Eigen i/o  

    exit(0);
}
