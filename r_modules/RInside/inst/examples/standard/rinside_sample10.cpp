// Simple example motivated by post from Wayne.Zhang@barclayscapital.com
// to r-devel on 28 Jan 2011
//
// Copyright (C) 2011  Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside

void show(const Rcpp::List & L) {
    // this function is cumbersome as we haven't defined << operators
    std::cout << "Showing list content:\n";
    std::cout << "L[0] " << Rcpp::as<int>(L[0]) << std::endl;
    std::cout << "L[1] " << Rcpp::as<double>(L[1]) << std::endl;
    Rcpp::IntegerVector v = Rcpp::as<Rcpp::IntegerVector>(L[2]);
    std::cout << "L[2][0] " << v[0] << std::endl;
    std::cout << "L[2][1] " << v[1] << std::endl;
}

int main(int argc, char *argv[]) {

    // create an embedded R instance
    RInside R(argc, argv);               

    Rcpp::List mylist(3);
    mylist[0] = 1;
    mylist[1] = 2.5;
    Rcpp::IntegerVector v(2); v[0] = 10; v[1] = 11; // with C++0x we could assign directly
    mylist[2] = v;
    show(mylist);

    R["myRlist"] = mylist;
    std::string r_code = "myRlist[[1]] = 42; myRlist[[2]] = 42.0; myRlist[[3]][2] = 42; myRlist";
    
    Rcpp::List reslist = R.parseEval(r_code);
    show(reslist);

    exit(0);
}

