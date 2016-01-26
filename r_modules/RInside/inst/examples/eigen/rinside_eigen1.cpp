// -*- c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Simple example using Eigen classes on matrix data generated in R
//
// Copyright (C) 2012  Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside
#include <RcppEigen.h>

int main(int argc, char *argv[]) {

    RInside R(argc, argv);		// create an embedded R instance

    std::string cmd = "set.seed(42); matrix(rnorm(9),3,3)"; 	// create a random Matrix in r 

    const Eigen::Map<Eigen::MatrixXd>  m = 		// parse, eval + return result
      Rcpp::as<Eigen::Map<Eigen::MatrixXd> >(R.parseEval(cmd));
    Eigen::MatrixXd n = m.transpose() * m;
    Eigen::ColPivHouseholderQR<Eigen::MatrixXd> nqr(n);

    std::cout << "Initial Matrix m\n" << m << std::endl;
    std::cout << "Product n = m' * m\n" << n << std::endl;
    std::cout << "n.sum() " << n.sum() << std::endl;
    std::cout << "nrq.rank() " << nqr.rank() << std::endl; 	

    exit(0);
}
