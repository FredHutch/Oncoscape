// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4; indent-tabs-mode: nil; -*-
//
// Creating a lattice plot from RInside
// cf http://stackoverflow.com/questions/24378223/saving-lattice-plots-with-rinside-and-rcpp/
//
// Copyright (C) 2014  Dirk Eddelbuettel and GPL'ed 

#include <RInside.h>                    // for the embedded R via RInside
#include <unistd.h>

int main(int argc, char *argv[]) {

    // create an embedded R instance
    RInside R(argc, argv);               

    // evaluate an R expression with curve() 
    // because RInside defaults to interactive=false we use a file
    std::string cmd = "library(lattice); "
        "tmpf <- tempfile('xyplot', fileext='.png'); "  
        "png(tmpf); "
        "print(xyplot(Girth ~ Height | equal.count(Volume), data=trees)); "
        "dev.off();"
        "tmpf";

    // by running parseEval, we get the last assignment back, here the filename
    std::string tmpfile = R.parseEval(cmd);
    std::cout << "Can now use plot in " << tmpfile << std::endl;
    
    exit(0);
}

