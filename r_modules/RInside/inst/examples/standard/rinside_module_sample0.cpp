// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 4; -*-
//
// Simple example showing how expose a C++ function
//
// Copyright (C) 2010 - 2012  Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside

// a c++ function we wish to expose to R
const char* hello( std::string who ){
    std::string result( "hello " ) ;
    result += who ;
    return result.c_str() ;
} 

// RCPP_MODULE(bling){
//     using namespace Rcpp ;
//     function( "hello", &hello );
// }

int main(int argc, char *argv[]) {

    // create an embedded R instance -- and load Rcpp so that modules work
    RInside R(argc, argv, true);               
        
    // load the bling module
    // R["bling"] = LOAD_RCPP_MODULE(bling) ;
    
    // call it and display the result
    Rcpp::Rcout << "** rinside_module_sample0 is currently disabled.\n";
    if (FALSE) {
		std::string result = R.parseEval("bling$hello('world')") ;
		std::cout << "bling$hello( 'world') =  '" << result << "'" << std::endl ; 
	}
    exit(0);
}

