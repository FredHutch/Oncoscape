// Simple example motivated by post from Paul Smith <phhs80@gmail.com>
// to r-help on 06 Mar 2011
//
// Copyright (C) 2011 - 2012  Dirk Eddelbuettel and Romain Francois

#include <RInside.h>                    // for the embedded R via RInside
#include <unistd.h>

int main(int argc, char *argv[]) {

  // create an embedded R instance
  RInside R(argc, argv);               

  // evaluate an R expression with curve() 
  // because RInside defaults to interactive=false we use a file
  std::string cmd = "tmpf <- tempfile('curve'); "  
    "png(tmpf); "
    "curve(x^2, -10, 10, 200); "
    "dev.off();"
    "tmpf";
  // by running parseEval, we get the last assignment back, here the filename
  std::string tmpfile = R.parseEval(cmd);

  std::cout << "Could now use plot in " << tmpfile << std::endl;
  unlink(tmpfile.c_str());		// cleaning up

  // alternatively, by forcing a display we can plot to screen
  cmd = "x11(); curve(x^2, -10, 10, 200); Sys.sleep(30);";
  // parseEvalQ evluates without assignment
  R.parseEvalQ(cmd);
    
  exit(0);
}

