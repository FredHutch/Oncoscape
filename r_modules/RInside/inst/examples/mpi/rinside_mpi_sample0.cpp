// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 8; -*-
//
// Simple example showing in R console information about current node
//
// This file was contributed by Jianping Hua 
//
// Copyright (C) 2010 - 2011  Jianping Hua, Dirk Eddelbuettel and Romain Francois
//
// GPL'ed 

#include <mpi.h>     // mpi header
#include <RInside.h> // for the embedded R via RInside

int main(int argc, char *argv[]) {

    // mpi related
    int myrank, nodesize;                       // node information
    MPI_Init(&argc,&argv);                      // mpi initialization
    MPI_Comm_rank(MPI_COMM_WORLD, &myrank);     // obtain current node rank
    MPI_Comm_size(MPI_COMM_WORLD, &nodesize);   // obtain total nodes running.

    RInside R(argc, argv);                      // create an embedded R instance

    std::stringstream txt;
    txt << "Hello from node " << myrank         // node information
	<< " of " << nodesize << " nodes!" << std::endl;

    R["txt"] = txt.str();	                // assign string var to R variable 'txt'

    R.parseEvalQ("cat(txt)");                   // eval init string, ignoring any returns

    MPI_Finalize();                             // mpi finalization

    exit(0);
}
