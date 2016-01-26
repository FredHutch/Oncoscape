// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Triggering errors, and surviving to tell the tale
//
// Copyright (C) 2012  Dirk Eddelbuettel and GPL'ed 

#include <RInside.h>                    // for the embedded R via RInside

int main(int argc, char *argv[]) {

    RInside R(argc, argv);              // create an embedded R instance 
    
    try {
        std::string cmd = "cat(doesNotExist))"; // simple parse error due to double "))"
        R.parseEvalQNT(cmd); 		        // eval quietly, does not throw on error
        					// parseEvalQ would throw on the error

        cmd = "try(cat(doesNotExist))"; 	// works also as the try() moderates
        R.parseEvalQ(cmd); 		        // eval quietly, no error thrown
        					// without try() we'd have an error and exit

        cmd = "cat(\"End of main part\\n\")";
        R.parseEval(cmd); 		        // eval the string, ignoring any returns

    } catch( std::exception &ex ) {
	std::cerr << "Exception caught: " << ex.what() << std::endl;
    } catch(...) { 
	std::cerr << "C++ exception (unknown reason)" << std::endl;
    }
    std::cout << "All done, past catch()\n";

    exit(0);
}

