// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 8; -*-
//
// Simple mpi example: simulate sampling/averaging on multiple nodes and gathering the results.
//
// This file was contributed by Jianping Hua 
//
// Copyright (C) 2010 - 2011  Jianping Hua, Dirk Eddelbuettel and Romain Francois
//
// GPL'ed 

#include <mpi.h>     // mpi header file
#include <RInside.h> // for the embedded R via RInside

int main(int argc, char *argv[]) {

    // mpi related
    int myrank, nodesize;                       // node information
    int sndcnt = 1, rcvcnt = 1;                 // # of elements in send/recv buffer
    MPI_Init(&argc,&argv);                      // mpi initialization
    MPI_Comm_rank(MPI_COMM_WORLD, &myrank);     // obtain current node rank
    MPI_Comm_size(MPI_COMM_WORLD, &nodesize);   // obtain total nodes running.
    double sendValue;                           // value to be collected in current node
    double *allvalues = new double[nodesize];   // to save all results

    // simulation info
    // to sample from a uniform distribution
    int rangeMin = 0, rangeMax = 10; // range of uniform distribution
    int sampleSize = 2;              // points in each sample

    try {
        RInside R(argc, argv);              // create an embedded R instance

        std::stringstream txt;
	txt << "x <- " << rangeMin << std::endl;
        R.parseEvalQ( txt.str() );      // assign x with lower range of uniform distribution

        txt << "y <- " << rangeMax << std::endl;
        R.parseEvalQ( txt.str() );      // assign y with upper range of uniform distribution

        txt << "n <- " << sampleSize << std::endl;
        R.parseEvalQ( txt.str() );      // assign n with the size of sample

        std::string evalstr = "mean(runif(n,x,y))";	// sampling, compute the mean
        Rcpp::NumericVector m = R.parseEval(evalstr);	// eval str, convert result to NumericVector
        sendValue = m( 0 );             // assign the return value to the variable to be gathered

        //gather together values from all processes to allvalues
        MPI_Gather(&sendValue, sndcnt, MPI_DOUBLE, allvalues, rcvcnt, MPI_DOUBLE, 0, MPI_COMM_WORLD);

        // show what inidividual node's contribution
        std::cout << "node " << myrank << " has mean " << m(0) << std::endl;

    } catch(std::exception& ex) {
        std::cerr << "Exception caught: " << ex.what() << std::endl;
    } catch(...) {
        std::cerr << "Unknown exception caught" << std::endl;
    }

    // show gathered results in node 0
    if ( myrank == 0 ) {
        std::cout << "values of all " << nodesize << " trials: " << std::endl;
        for ( int i = 0; i < nodesize; i++ )
            std::cout << allvalues[ i ] << ", ";
        std::cout << std::endl;
    }

    // clean up
    delete[] allvalues;

    MPI_Finalize();             // mpi finalization

    exit(0);
}

