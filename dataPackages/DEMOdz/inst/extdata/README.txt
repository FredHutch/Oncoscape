The demo/test data "sampleJSON" was created thus:

  set.seed(17)
  sampleJSON <- toJSON(list(ints=as.integer(runif(n=3, max=100)), 
                            floats=runif(n=3, max=100), 
                            chars=LETTERS[as.integer(runif(n=3, min=1, max=26))],
                            matrix=matrix(1:9, nrow=3)))
  save(sampleJSON, file="sampleJSON.RData")
   