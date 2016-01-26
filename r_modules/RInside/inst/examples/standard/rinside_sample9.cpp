// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 8; -*-
//
// Simple example showing how expose a C++ function -- no longer builds
//
// Copyright (C) 2010 Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside

// a c++ function we wish to expose to R
std::string hello( std::string who ){
    std::string result( "hello " ) ;
    result += who ;
    return result;
} 

int main(int argc, char *argv[]) {

    // create an embedded R instance
    RInside R(argc, argv);               

    // expose the "hello" function in the global environment
    R["hello"] = Rcpp::InternalFunction( &hello ) ;
   
    // call it and display the result
    std::string result = R.parseEvalNT("hello(\"world\")") ;
    std::cout << "hello( 'world') =  " << result << std::endl ; 

    exit(0);
}

