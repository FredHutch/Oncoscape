addRMessageHandler("createPLSR", "createPLSR")
addRMessageHandler("calculatePLSR", "calculate_plsr")
addRMessageHandler("summarizePLSRPatientAttributes", "summarizePLSRPatientAttributes")
#----------------------------------------------------------------------------------------------------
# for accurate testing, and subsequent reliable use, all code below here should
# be reproduced exactly in the Oncoscape package in which the PLSR class is needed.
# a better way is needed to make these functions available here, for testing, and elsewhere,
# for deployment.
createPLSR <- function(ws, msg)
{
   printf("=== createPLSR");

   printf("    callback: %s", msg$callback)
   print(msg$payload)

   dataPackageName = msg$payload$dataPackage
   matrixName = msg$payload$matrixName

   printf("    dataPackageName: %s", dataPackageName);
   printf("         matrixName: %s", matrixName);
   
   #require(dataPackageName, character.only=TRUE)
      # a bit of R magic: create and run an R expression from text
      # this creates a real variable, ds, which is an object of whatever dataSetName names

   currentDataSetName <- state[["currentDatasetName"]]
   ds <- state[[currentDataSetName]];
   cmd <- sprintf("myplsr <- PLSR(ds, '%s')", matrixName);
   printf("createPLSR about to eval cmd: %s", cmd)
   eval(parse(text=cmd))
   state[["myplsr"]] <- myplsr
   
   response <- plsrDataSummary(myplsr)
   return.msg <- list(cmd=msg$callback, callback="", status="response", payload=response)
      
   printf("createPLSR about to send msg: %s", return.msg$cmd)
   
   ws$send(toJSON(return.msg));

} # createPLSR
#----------------------------------------------------------------------------------------------------
calculate_plsr <- function(ws, msg)
{
   printf("=== calculate_plsr");
   print(msg)
   genes <- msg$payload$genes
   printf("gene count for calculatePLSR (%d)", length(genes))
   #print(genes)
      # an artful(?) dodge:  if this is a list of genes, then they are literal genes
      # if just one, then it must be a geneSetName, and we must retrieve the genes
   if(length(genes) == 1){
      geneSetName <- genes   # to reduce ambiguity
      datasetName <- state[["currentDatasetName"]]
      dataset <- datasets[[datasetName]]
      geneSetNames <- getGeneSetNames(dataset)
      stopifnot(geneSetName %in% geneSetNames)
      genes <- getGeneSetGenes(dataset, geneSetName)
      }
   printf("genes for calculatePLSR after possible lookup(%d)", length(genes))
   print(genes)
   factors.df <- msg$payload$factors
   print(factors.df)
   factors <- vector("list", nrow(factors.df))
   for(r in 1:nrow(factors.df)){
      factors[[r]] <- as.list(factors.df[r,])
      } # for r
   
   printf("--- factors.df assigned from msg$payload$factors");
   
   #factors <- apply(factors.df, 1, as.list)
   #names(factors) <- NULL
   if(!dir.exists("~/tmp"))
	   dir.create("~/tmp")

   save(factors.df, factors, file="~/tmp/factors.bug.RData")
   printf("--- factors after apply on factors.df");
   print(factors)

   printf("--- factors: %d", length(factors))
   for(factor in factors)
       print(factors)
   
   printf("--- genes: %d", length(genes))

   print("------------ myplsr before calculate")
   myplsr <- state[["myplsr"]]
   printf("class(myplsr): %s", class(myplsr))
          
   print(showMethods("calculatePLSR"))

   save(factors, genes, file="~/tmp/calculatePLSR.inputs.RData")

   x <- calculatePLSR(myplsr, factors, genes)
   printf("---- about to print result of calculatePLSR");
   print(x)
   
   payload <- list(loadings=x$loadings,
                   loadingNames=rownames(x$loadings),
                   vectors=x$loadVectors,
                   vectorNames=rownames(x$loadVectors),
                   maxValue=x$maxValue)
   return.msg <- list(cmd=msg$callback, callback="", status="success", payload=payload)

   ws$send(toJSON(return.msg))

} # calculate_plsr
#----------------------------------------------------------------------------------------------------
summarizePLSRPatientAttributes <- function(ws, msg)
{
   printf("=== summarizePLSRPatientAttributes")
   print(msg)
   
   attributes <- msg$payload

   print("------------ myplsr")
   myplsr <- state[["myplsr"]]
   #print(myplsr)
   summary <- summarizeNumericPatientAttributes(myplsr, attributes)
   print("------------ summary returned");
   print(summary)
	status <- "success"
   payload <- summary

   return.msg <- list(cmd=msg$callback, callback="", status=status, payload=payload)
   print(return.msg)

   ws$send(toJSON(return.msg))

} # summarizePLSRPatientAttributes
#----------------------------------------------------------------------------------------------------
