// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Simple example motivated by StackOverflow question on using sample() from C
//
// Copyright (C) 2012  Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside

int main(int argc, char *argv[]) {

    RInside R(argc, argv);		// create an embedded R instance

    std::string cmd = "set.seed(123); sample(LETTERS[1:5], 10, replace=TRUE)";

    Rcpp::CharacterVector res = R.parseEval(cmd); // parse, eval + return result

    for (int i=0; i<res.size(); i++) {  // loop over vector and output
	std::cout << res[i];
    }
    std::cout << std::endl;

    std::copy(res.begin(), res.end(), 	// or use STL iterators 
	      std::ostream_iterator<char*>(std::cout));
    std::cout << std::endl;
    
    exit(0);
}

