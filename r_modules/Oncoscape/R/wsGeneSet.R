# handlers for the GeneSetBinomialMethods module
#----------------------------------------------------------------------------------------------------
addRMessageHandler("createGeneSetTest", "ws.createGeneSetTest")
addRMessageHandler("geneSetScoreTest", "ws.scoreHandler")
addRMessageHandler("fetchHeatMap", "ws.heatMapHandler")
#---------------------------------------------------------------------------------------------------
ws.createGeneSetTest <- function(msg)
{
   printf("=== ws.createGeneSetTest, full msg:");
   print(msg)
   
   currentDataSetName <- state[["currentDatasetName"]]
   ds <- datasets[[currentDataSetName]];
   matrixName = msg$payload$matrixName
   cmd <- sprintf("myGeneSetBinomialMethods <- GeneSetBinomialMethods(ds, '%s')", matrixName);
   eval(parse(text=cmd))
   state[["myGeneSetBinomialMethods"]] <- myGeneSetBinomialMethods
   printf("ws.createGeneSetBinomialMethods just executed '%s'", cmd)
   printf("resulting myGeneSetBinomialMethods object:")
   print(geneSetDataSummary(myGeneSetBinomialMethods))
   
   response <- geneSetDataSummary(myGeneSetBinomialMethods)
   toJSON(list(cmd=msg$callback, callback="", status="response", payload=response),
                            auto_unbox=TRUE)
   
   

} # ws.createGeneSetBinomialMethods
#----------------------------------------------------------------------------------------------------   
ws.scoreHandler <- function(msg)
{
   print("=== received score request");
   print(msg)   
   payload <- msg$payload
   
   group1 <- payload$group1
   group2 <- payload$group2
   nG1 <- length(group1)#
   nG2 <- length(group2)#
   geneset <- payload$geneset#
   
   print("group1")
   print(length(group1))
   print("group2")
   print(length(group2))
   print("geneset")
   print(geneset)
  
   #set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 40, nG2 = 40, cut = 0.5, all = FALSE, seed = 12345)
   #set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = nG1, nG2 = nG2, cut = 0.5, all = FALSE, seed = 12345)
   # obj = GeneSetBinomialMethods()
   # file <- system.file(package="GeneSetBinomialMethods", "data", "tbl.mrnaUnified.TCGA.GBM.RData")
   # stopifnot(file.exists(file))
   # load(file)
   # obj@tbl.mrna <- tbl.mrna
   #obj@tbl.mrna <- matrix()
   myGeneSetBinomialMethods <- state[["myGeneSetBinomialMethods"]] 
   skat_nocov <- geneSetScoreTest(
                 myGeneSetBinomialMethods, group1, group2, covariates = NULL, geneset)
                 # sampleIDsG1 = group1,
                 # sampleIDsG2 = group2,
                 # covariates = NULL,
                 # geneSet = geneset,
                 # sampleDescription ="TCGA GBM long vs. short survivors",
                 # geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
   if(is.character(skat_nocov)){
      payload = skat_nocov
      print(payload)
      toJSON(list(cmd=msg$callback, callback="", status="error", payload=payload),
                            auto_unbox=TRUE)
   }else{
      payload$pValue = skat_nocov$pValue
      m = as.data.frame(skat_nocov$analysisData[order(skat_nocov$analysisData[,2]),])
      payload$group = m[,2]
      print(payload$group)
      payload$pt = m[,1]
      print(payload$pt)
      md = as.data.frame(m[,-c(1,2)])
      payload$genes = colnames(m)[-c(1,2)]
      print(payload$genes)
      md <- as.matrix(md)
      print("test before flatten_md")
      flatten_md <- ramify:::flatten(md, across = "rows")
      if(ncol(md) > 1){
        d <- data.frame(i=rep(seq(0:(ncol(md)-1)),nrow(md)),
                      j=rep(seq(0:(nrow(md)-1)),each=ncol(md)),
                      score=flatten_md)
        d$i <- d$i -1
        d$j <- d$j -1
      }else{
        d <- data.frame(i=rep(0, nrow(md)),
                        j=rep(seq(0:(nrow(md)-1)), each=1),
                        score=flatten_md)
        #d$i <- d$i -1
        d$j <- d$j -1
      } 
      print(d$i)
      print(d$j)
      print(names(d))
      print(nrow(d))
      payload$analysisData = toJSON(as.matrix(d), pretty=TRUE)
      print(names(payload))
      toJSON(list(cmd=msg$callback, callback="", status="response", payload=payload),
                            auto_unbox=TRUE)
   }
  
   
} # scoreHandler
#----------------------------------------------------------------------------------------------------
ws.heatMapHandler <- function (msg)
{
    print(msg)
    payload <- msg$payload
    
    group1 <- payload$group1
    group2 <- payload$group2
    geneset <- payload$geneSet
    
    print("=== entering heatMapHandler")
    
    temp.file <- tempfile(fileext="jpg")
    
    #payload must be a list
    payload <-msg$payload
    print("group1")
    print(length(group1))
    print("group2")
    print(length(group2))
    print("geneset")
    print(geneset)#hopefully, get the name of the genesets
    
    
    #if(!is.na(filename))
    jpeg(file=temp.file, width=650,height=650,res=80)
    myGeneSetBinomialMethods <- state[["myGeneSetBinomialMethods"]] 
    drawHeatmap(myGeneSetBinomialMethods, geneset.name=geneset, group1=group1, group2=group2, cluster.patients=FALSE);
    dev.off()
    p = base64encode(readBin(temp.file,what="raw",n=1e6))
    p = paste("data:image/jpg;base64,\n",p,sep="")
    return.cmd <- msg$callback
    
    toJSON(list(cmd=return.cmd, status="success", payload=p))
    
    file.remove(temp.file)
    
}