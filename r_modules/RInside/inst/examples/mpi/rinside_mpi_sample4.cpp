// -*- mode: C++; c-indent-level: 4; c-basic-offset: 4;  tab-width: 8; -*-
//
// Simple mpi example: Usage of RInside with a Master-Slave Model with worker
//
// MPI C API version of file contributed by Nicholas Pezolano and Martin Morgan 
//
// Copyright (C) 2010 - 2013  Dirk Eddelbuettel
// Copyright (C)        2013  Nicholas Pezolano
// Copyright (C)        2013  Martin Morgan
//
// GPL'ed 

#include <mpi.h>
#include <RInside.h>
#include <string>
#include <vector>
#include <iostream>

#define WORKTAG 1
#define DIETAG 2

/* Local functions */
static void master(void);
static void slave(RInside &R);
static int get_next_work_item(int &work, const int size_work, std::vector<int> &data);
static void do_work(int work,int &result,RInside &R);
static void initalize(RInside &R);

int itr = 0;

int main(int argc, char **argv){
    int myrank;
    MPI_Init(&argc, &argv);
    MPI_Comm_rank(MPI_COMM_WORLD, &myrank);
    RInside R(argc, argv); 


    if (myrank == 0) {
	master();
    } else {
	initalize(R);
	slave(R);
    }

    MPI_Finalize();
    return 0;
}

static void initalize(RInside &R){
    //load the following R library on every R instance
    std::string R_libs ="suppressMessages(library(random));";
    R.parseEvalQ(R_libs); 
}

static void master(void){
    int ntasks, rank;
    std::vector<int> data;
    int work;
    int result;
    int sum;
    MPI_Status status;

    //create some test "data" to pass around
    for(int i = 0; i< 10; i++){
	data.push_back(i);
    }

    const int size_work = (int)data.size();
    
    MPI_Comm_size(MPI_COMM_WORLD, &ntasks);

    for (rank = 1; rank < ntasks; ++rank) {
	get_next_work_item(work,size_work,data);
	MPI_Send(&work,1,MPI_INT,rank, WORKTAG,MPI_COMM_WORLD);
    }

    int ret = get_next_work_item(work,size_work,data);
    while (ret == 0) {
	MPI_Recv(&result,1,MPI_INT,MPI_ANY_SOURCE,MPI_ANY_TAG,MPI_COMM_WORLD,&status);
	sum += result;
	MPI_Send(&work,1,MPI_INT,status.MPI_SOURCE,WORKTAG,MPI_COMM_WORLD);

	ret = get_next_work_item(work,size_work,data);
    }

    for (rank = 1; rank < ntasks; ++rank) {
	MPI_Recv(&result, 1, MPI_INT, MPI_ANY_SOURCE,
		 MPI_ANY_TAG, MPI_COMM_WORLD, &status);
	sum += result;
    }

    for (rank = 1; rank < ntasks; ++rank) {
	MPI_Send(0, 0, MPI_INT, rank, DIETAG, MPI_COMM_WORLD);
    }
  
    std::cout << "sum of all iterations = " << sum << std::endl;
}

static void slave(RInside &R) {
    int work;
    int result;
    MPI_Status status;

    while (1) {

	MPI_Recv(&work, 1, MPI_INT, 0, MPI_ANY_TAG,
		 MPI_COMM_WORLD, &status);

	if (status.MPI_TAG == DIETAG) {
	    return;
	}

	do_work(work,result,R);

	MPI_Send(&result, 1, MPI_INT, 0, 0, MPI_COMM_WORLD);
    }
}


static int get_next_work_item(int &work,const int size_work, std::vector<int> &data) {
    if (itr >= size_work) {
	return -1;
    }

    work = data[itr];  
    
    itr++;
    std::cout << "iteration = " << itr << std::endl;  

    return 0;
}

static void do_work(int work,int &result,RInside &R){

    //create a random number on every slave iteration
    R["work"] = work;
    std::string Rcmd = "work <- sample(1:10, 1)";
    Rcpp::NumericVector M = R.parseEval(Rcmd);
    
    result = M(0);
}
