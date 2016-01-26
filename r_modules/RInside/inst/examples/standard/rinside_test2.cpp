// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Show the search path to check if package methods is loaded
//
// Copyright (C) 2012  Dirk Eddelbuettel and GPL'ed 

#include <RInside.h>                    // for the embedded R via RInside

int main(int argc, char *argv[]) {

    RInside R(argc, argv);              // create an embedded R instance 
    
    std::string cmd = "print(search())";
    R.parseEval(cmd); 		        // eval the init string, ignoring any returns

    exit(0);
}

