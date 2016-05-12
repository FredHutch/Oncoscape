# handlers for the GeneSetBinomialMethods module
#----------------------------------------------------------------------------------------------------
addRMessageHandler("geneSetScoreTest", "ws.scoreHandler")
addRMessageHandler("fetchHeatMap", "ws.heatMapHandler")
#---------------------------------------------------------------------------------------------------   
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
   set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = nG1, nG2 = nG2, cut = 0.5, all = FALSE, seed = 12345)
   
   skat_nocov <- geneSetScoreTest(
                 obj = GeneSetBinomialMethods(),
                 sampleIDsG1 = group1,
                 sampleIDsG2 = group2,
                 covariates = NULL,
                 geneSet = geneset,
                 sampleDescription ="TCGA GBM long vs. short survivors",
                 geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
   print(skat_nocov$summary.skatRes)
   toJSON(list(cmd=msg$callback, callback="", status="response", payload=toJSON(skat_nocov$summary.skatRes)))

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
    drawHeatmap(gstt, geneset.name=geneset, group1=group1, group2=group2, cluster.patients=FALSE);
    dev.off()
    p = base64encode(readBin(temp.file,what="raw",n=1e6))
    p = paste("data:image/jpg;base64,\n",p,sep="")
    return.cmd <- msg$callback
    
    toJSON(list(cmd=return.cmd, status="success", payload=p))
    
    file.remove(temp.file)
    
}