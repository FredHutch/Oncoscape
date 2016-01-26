library(GeneSetBinomialMethods)
require(RUnit)
require(foreach)

printf = function (...) print (noquote (sprintf (...)))
#------------------------------------------------------------------------------------------------------------------------
runTests <- function()
{
  test_constructor()
  test_randomSample()
  test_analysisDataSetup()
  test_geneSetScoreTest()
} # runTests
#------------------------------------------------------------------------------------------------------------------------
test_constructor = function ()
{
  printf("--- test_constructor")
  
  # first, the no-args constructor
  gslr <- GeneSetBinomialMethods()
  
  checkIdentical(slotNames(gslr), c("tbl.mrna", "tbl.clinical", "genesets"))
  
  checkEquals(dim(getExpressionData(gslr)), c(315, 11864))
  checkEquals(dim(getClinicalData(gslr)), c(583, 13))

  checkTrue(length(getGeneSets(gslr)) == 10295)   # 3 feb 2015
  checkEquals(names(head(getGeneSets(gslr))),   c("NUCLEOPLASM", "EXTRINSIC_TO_PLASMA_MEMBRANE", "ORGANELLE_PART", "CELL_PROJECTION_PART", "CYTOPLASMIC_VESICLE_MEMBRANE", "GOLGI_MEMBRANE"))
  checkEquals(names(head(which(lapply(getGeneSets(gslr), length) < 10))), c("INTERCALATED_DISC", "V$SEF1_C", "TCGATGG,MIR-213", "CGGTGTG,MIR-220", "ACGCACA,MIR-210", "GTCGATC,MIR-369-5P"))
  
  checkEquals(length(which(lapply(getGeneSets(gslr), length) <= 10)), 575)
  
  checkTrue(is.numeric(getClinicalData(gslr)$FirstProgression))
  checkTrue(is.numeric(getClinicalData(gslr)$ageAtDx))
  checkTrue(is.numeric(getClinicalData(gslr)$FirstProgression))
  checkTrue(is.numeric(getClinicalData(gslr)$survival))
} # test_constructor
#------------------------------------------------------------------------------------------------------------------------
test_randomSample = function()
{
  printf("--- test_randomSample")
  
  #########################################
  #For a fixed seed get the same samples  #
  #########################################
  set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 40, nG2 = 40, cut = 0.5, all = FALSE, seed = 123)
  
  checkEquals(unlist(set40$shortSurvivors), c("TCGA.16.1047", "TCGA.08.0359", "TCGA.06.2557", "TCGA.08.0345", "TCGA.28.5218", "TCGA.14.0787", "TCGA.06.A5U1", "TCGA.06.0127", "TCGA.06.A6S1",
                                              "TCGA.06.2567", "TCGA.08.0373", "TCGA.06.2559", "TCGA.06.0173", "TCGA.06.A6S0", "TCGA.06.5412", "TCGA.08.0392", "TCGA.76.6656", "TCGA.02.0060",
                                              "TCGA.14.1453", "TCGA.19.1790", "TCGA.08.0510", "TCGA.41.3392", "TCGA.OX.A56R", "TCGA.32.4210", "TCGA.41.3393", "TCGA.41.2571", "TCGA.27.2526",
                                              "TCGA.06.0140", "TCGA.76.6657", "TCGA.06.6391", "TCGA.06.0413", "TCGA.06.0162", "TCGA.76.4928", "TCGA.06.0157", "TCGA.02.0037", "TCGA.14.1795",
                                              "TCGA.19.2621", "TCGA.76.6193", "TCGA.12.0657", "TCGA.81.5910"))
  
  checkEquals(unlist(set40$longSurvivors), c("TCGA.02.0114", "TCGA.08.0245", "TCGA.27.2528", "TCGA.41.2572", "TCGA.28.5207", "TCGA.02.0046", "TCGA.06.0138", "TCGA.12.0776", "TCGA.06.0160",
                                             "TCGA.06.0133", "TCGA.28.5204", "TCGA.06.0129", "TCGA.02.0337", "TCGA.06.0168", "TCGA.14.0789", "TCGA.32.2491", "TCGA.16.1045", "TCGA.02.0038",
                                             "TCGA.12.1600", "TCGA.08.0358", "TCGA.08.0389", "TCGA.02.0332", "TCGA.02.0106", "TCGA.26.5135", "TCGA.02.0260", "TCGA.02.0338", "TCGA.19.2629",
                                             "TCGA.06.0165", "TCGA.02.0075", "TCGA.19.5952", "TCGA.32.4719", "TCGA.08.0355", "TCGA.02.0289", "TCGA.08.0511", "TCGA.02.0014", "TCGA.06.0124",
                                             "TCGA.02.0446", "TCGA.12.1094", "TCGA.02.0089", "TCGA.14.0736"))
  
  ##########################
  #nG1 or nG2 is truncated #
  ##########################
  nG1_truncated <- suppressWarnings(randomSample(obj = GeneSetBinomialMethods(), nG1 = 30, nG2 = 20, cut = 0.1, all = FALSE, seed = 123))
  checkEquals(length(nG1_truncated$shortSurvivors), 25)
  checkEquals(length(nG1_truncated$longSurvivors), 20)
  
  nG2_truncated <- suppressWarnings(randomSample(obj = GeneSetBinomialMethods(), nG1 = 30, nG2 = 20, cut = 10, all = FALSE, seed = 123))
  checkEquals(length(nG2_truncated$shortSurvivors), 30)
  checkEquals(length(nG2_truncated$longSurvivors), 2)
  
  nG1_nG2_truncated <- suppressWarnings(randomSample(obj = GeneSetBinomialMethods(), nG1 = 500, nG2 = 500, cut = 0.5, all = FALSE, seed = 123))
  checkEquals(length(nG1_nG2_truncated$shortSurvivors), 130)
  checkEquals(length(nG1_nG2_truncated$longSurvivors), 313)
  
  ########################################################
  #Get all of the subjects when nG1 and nG2 are the same #
  ########################################################
  setAll <- randomSample(obj = GeneSetBinomialMethods(), cut = 0.5, all = TRUE)
  checkEquals(length(unlist(setAll$shortSurvivors)), 130)
  checkEquals(length(unlist(setAll$longSurvivors)), 313)
  
  ##############################################
  #Verify that random samples are not the same #
  ##############################################
  checkSeed <- vector(mode = "logical")
  checkDiffShort <- vector(mode = "logical")
  checkDiffLong <- vector(mode = "logical")
  
  for(i in 1:5) {
    setRand1 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 20, nG2 = 30, cut = 0.5, all = FALSE)
    setRand2 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 20, nG2 = 20, cut = 0.5, all = FALSE)
    
    checkSeed[[i]] = (setRand1$seed != setRand2$seed)
    checkDiffShort[[i]] = any(setdiff(unlist(setRand1$shortSurvivors), unlist(setRand2$shortSurvivors)) > 0)
    checkDiffLong[[i]] = any(setdiff(unlist(setRand1$longSurvivors), unlist(setRand2$longSurvivors)) > 0)
  }

  checkEquals(length(unlist(setRand1$shortSurvivors)), 20)
  checkEquals(length(unlist(setRand1$longSurvivors)), 30)
  
  checkTrue(any(checkSeed == TRUE))
  checkTrue(any(checkDiffShort == TRUE))
  checkTrue(any(checkDiffLong == TRUE))
  
  ###############
  #Null values  #
  ###############
  setErr1 <- try(randomSample(obj = GeneSetBinomialMethods(), cut = 0.5, all = FALSE), silent = TRUE)
  checkEquals(setErr1[1], "Error in randomSample(obj = GeneSetBinomialMethods(), cut = 0.5, all = FALSE) : \n  If either of the arguments nG1 or nG2 is null, then all must equal TRUE\n")
  
  setErr2 <- try(randomSample(obj = GeneSetBinomialMethods(), nG1 = NULL, nG2 = 30, cut = 0.5, all = FALSE), silent = TRUE)
  checkEquals(setErr2[1], "Error in randomSample(obj = GeneSetBinomialMethods(), nG1 = NULL, nG2 = 30,  : \n  If either of the arguments nG1 or nG2 is null, then all must equal TRUE\n")
  
  ###############
  #No Samples   #
  ###############
  noSamples1 <- try(randomSample(obj = GeneSetBinomialMethods(), nG1 = 30, nG2 = 20, cut = -2, all = FALSE, seed = 123), silent = TRUE)
  checkEquals(noSamples1[[1]], 
              "Error in randomSample(obj = GeneSetBinomialMethods(), nG1 = 30, nG2 = 20,  : \n  Either one or both groups contain no subjects for the given cut value.  The TCGA survival range is [0.01, 10.63].\n")
  
  noSamples2 <- try(randomSample(obj = GeneSetBinomialMethods(), nG1 = 10, nG2 = 50, cut = 11, all = FALSE, seed = 123), silent = TRUE)
  checkEquals(noSamples2[[1]], 
              "Error in randomSample(obj = GeneSetBinomialMethods(), nG1 = 10, nG2 = 50,  : \n  Either one or both groups contain no subjects for the given cut value.  The TCGA survival range is [0.01, 10.63].\n")
} #test_randomSample
#------------------------------------------------------------------------------------------------------------------------
test_analysisDataSetup = function()
{
  printf("--- test_analysisDataSetup")
  
  ########################
  #No Covariates         #
  ########################
  set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 40, nG2 = 40, cut = 0.5, all = FALSE, seed = 12345)
  
  analysisDataSetup_nocov_chk <- analysisDataSetup(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = set40$shortSurvivors,
    sampleIDsG2 = set40$longSurvivors,
    covariates = NULL,
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors (no covariates)",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
  
  checkTrue(analysisDataSetup_nocov_chk$sampleDescription == "TCGA GBM long vs. short survivors (no covariates)")
  checkTrue(analysisDataSetup_nocov_chk$geneSetDescription == "msgidb:KANG_CISPLATIN_RESISTANCE_DN")
  checkEquals(dim(analysisDataSetup_nocov_chk$analysisData), c(38, 8))
  
  checkEquals(analysisDataSetup_nocov_chk$unmatchedSamples,  c("TCGA.28.1747", "TCGA.76.6193", "TCGA.02.0071", "TCGA.76.4925", "TCGA.32.1980", "TCGA.14.1795", "TCGA.06.2559", "TCGA.14.1794", "TCGA.06.5418",
                                                               "TCGA.19.1790", "TCGA.19.1789", "TCGA.14.3476", "TCGA.41.3392", "TCGA.19.A6J4", "TCGA.76.4934", "TCGA.19.2624", "TCGA.27.2526", "TCGA.14.0862",
                                                               "TCGA.19.1788", "TCGA.12.5299", "TCGA.28.5218", "TCGA.06.A6S0", "TCGA.41.4097", "TCGA.06.5856", "TCGA.41.2572", "TCGA.76.6286", "TCGA.14.0866",
                                                               "TCGA.19.1787", "TCGA.12.0662", "TCGA.06.1806", "TCGA.14.0790", "TCGA.06.2558", "TCGA.27.1835", "TCGA.12.1599", "TCGA.27.1834", "TCGA.12.0769",
                                                               "TCGA.12.0653", "TCGA.76.4932", "TCGA.14.1823", "TCGA.14.1037", "TCGA.06.0165", "TCGA.06.5408"))
  
  checkEquals(analysisDataSetup_nocov_chk$unmatchedGenes, c("TMX4", "UBE2K"))
  
  file <- system.file(package="GeneSetBinomialMethods", "extdata", "analysisDataSetup_nocov.Rdata")
  stopifnot(file.exists(file))
  load(file)
  
  checkEquals(colnames(analysisDataSetup_nocov_chk$analysisData), colnames(analysisDataSetup_nocov$analysisData))
  
  for(i in 1:length(colnames(analysisDataSetup_nocov_chk$analysisData))) {
    checkEquals(analysisDataSetup_nocov_chk$analysisData[, i], analysisDataSetup_nocov$analysisData[, i])
  }
  
  ###########################
  #Single Covariate         #
  ###########################
  set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 40, nG2 = 40, cut = 0.5, all = FALSE, seed = 12345)
  
  analysisDataSetup_singlecov_chk <- analysisDataSetup(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = set40$shortSurvivors,
    sampleIDsG2 = set40$longSurvivors,
    covariates = "ageAtDx",
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors (single covariate)",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
  
  checkTrue(analysisDataSetup_singlecov_chk$sampleDescription == "TCGA GBM long vs. short survivors (single covariate)")
  checkTrue(analysisDataSetup_singlecov_chk$geneSetDescription == "msgidb:KANG_CISPLATIN_RESISTANCE_DN")
  checkEquals(dim(analysisDataSetup_singlecov_chk$analysisData), c(38, 9))
  
  checkEquals(analysisDataSetup_singlecov_chk$unmatchedSamples,  c("TCGA.28.1747", "TCGA.76.6193", "TCGA.02.0071", "TCGA.76.4925", "TCGA.32.1980", "TCGA.14.1795", "TCGA.06.2559", "TCGA.14.1794", "TCGA.06.5418",
                                                               "TCGA.19.1790", "TCGA.19.1789", "TCGA.14.3476", "TCGA.41.3392", "TCGA.19.A6J4", "TCGA.76.4934", "TCGA.19.2624", "TCGA.27.2526", "TCGA.14.0862",
                                                               "TCGA.19.1788", "TCGA.12.5299", "TCGA.28.5218", "TCGA.06.A6S0", "TCGA.41.4097", "TCGA.06.5856", "TCGA.41.2572", "TCGA.76.6286", "TCGA.14.0866",
                                                               "TCGA.19.1787", "TCGA.12.0662", "TCGA.06.1806", "TCGA.14.0790", "TCGA.06.2558", "TCGA.27.1835", "TCGA.12.1599", "TCGA.27.1834", "TCGA.12.0769",
                                                               "TCGA.12.0653", "TCGA.76.4932", "TCGA.14.1823", "TCGA.14.1037", "TCGA.06.0165", "TCGA.06.5408"))
  
  checkEquals(analysisDataSetup_singlecov_chk$unmatchedGenes, c("TMX4", "UBE2K"))
  
  file <- system.file(package="GeneSetBinomialMethods", "extdata", "analysisDataSetup_singlecov.Rdata")
  stopifnot(file.exists(file))
  load(file)
  
  checkEquals(colnames(analysisDataSetup_singlecov_chk$analysisData), colnames(analysisDataSetup_singlecov$analysisData))
  
  for(i in 1:length(colnames(analysisDataSetup_singlecov_chk$analysisData))) {
    checkEquals(analysisDataSetup_singlecov_chk$analysisData[, i], analysisDataSetup_singlecov$analysisData[, i])
  }
  
  ###########################
  #Two Covariates           #
  ###########################
  set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 40, nG2 = 40, cut = 0.5, all = FALSE, seed = 12345)
  
  analysisDataSetup_twocov_chk <- analysisDataSetup(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = set40$shortSurvivors,
    sampleIDsG2 = set40$longSurvivors,
    covariates = c("ageAtDx", "FirstProgression"),
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors (two covariates)",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
  
  checkTrue(analysisDataSetup_twocov_chk$sampleDescription == "TCGA GBM long vs. short survivors (two covariates)")
  checkTrue(analysisDataSetup_twocov_chk$geneSetDescription == "msgidb:KANG_CISPLATIN_RESISTANCE_DN")
  checkEquals(dim(analysisDataSetup_twocov_chk$analysisData), c(38, 10))
  
  checkEquals(analysisDataSetup_twocov_chk$unmatchedSamples,  c("TCGA.28.1747", "TCGA.76.6193", "TCGA.02.0071", "TCGA.76.4925", "TCGA.32.1980", "TCGA.14.1795", "TCGA.06.2559", "TCGA.14.1794", "TCGA.06.5418",
                                                                   "TCGA.19.1790", "TCGA.19.1789", "TCGA.14.3476", "TCGA.41.3392", "TCGA.19.A6J4", "TCGA.76.4934", "TCGA.19.2624", "TCGA.27.2526", "TCGA.14.0862",
                                                                   "TCGA.19.1788", "TCGA.12.5299", "TCGA.28.5218", "TCGA.06.A6S0", "TCGA.41.4097", "TCGA.06.5856", "TCGA.41.2572", "TCGA.76.6286", "TCGA.14.0866",
                                                                   "TCGA.19.1787", "TCGA.12.0662", "TCGA.06.1806", "TCGA.14.0790", "TCGA.06.2558", "TCGA.27.1835", "TCGA.12.1599", "TCGA.27.1834", "TCGA.12.0769",
                                                                   "TCGA.12.0653", "TCGA.76.4932", "TCGA.14.1823", "TCGA.14.1037", "TCGA.06.0165", "TCGA.06.5408"))
  
  checkEquals(analysisDataSetup_twocov_chk$unmatchedGenes, c("TMX4", "UBE2K"))
  
  file <- system.file(package="GeneSetBinomialMethods", "extdata", "analysisDataSetup_twocov.Rdata")
  stopifnot(file.exists(file))
  load(file)
  
  checkEquals(colnames(analysisDataSetup_twocov_chk$analysisData), colnames(analysisDataSetup_twocov$analysisData))
  
  for(i in 1:length(colnames(analysisDataSetup_twocov_chk$analysisData))) {
    checkEquals(analysisDataSetup_twocov_chk$analysisData[, i], analysisDataSetup_twocov$analysisData[, i])
  }
  
  ###########################################################################################
  #Only a single gene is shared between the specified gene set and the TCGA expression data #
  ###########################################################################################
  file <- system.file(package="GeneSetBinomialMethods", "extdata", "analysisDataSetup_singleGene.Rdata")
  stopifnot(file.exists(file))
  load(file)
  
  set_20_30 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 20, nG2 = 30, cut = 0.5, all = FALSE, seed = -1684486789)
  
  obj_chk = GeneSetBinomialMethods()
  
  analysisDataSetup_singleGene_chk <- analysisDataSetup(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = set_20_30$shortSurvivors,
    sampleIDsG2 = set_20_30$longSurvivors,
    covariates = NULL,
    geneSet = "CAFFAREL_RESPONSE_TO_THC_8HR_3_UP",
    sampleDescription ="TCGA GBM long vs. short survivors (single gene)",
    geneSetDescription ="msgidb:CAFFAREL_RESPONSE_TO_THC_8HR_3_UP")
  
  checkEquals(colnames(analysisDataSetup_singleGene_chk$analysisData), colnames(analysisDataSetup_singleGene$analysisData))
  
  for(i in 1:length(colnames(analysisDataSetup_singleGene_chk$analysisData))) {
    checkEquals(analysisDataSetup_singleGene_chk$analysisData[, i], analysisDataSetup_singleGene$analysisData[, i])
  }
  
  ###########################################################################
  #No shared genes between specified gene set and the TCGA expression data  #
  ###########################################################################
  checkEquals(which(names(getGeneSets(obj_chk)) == "chr4p11"), 3315)
  checkEquals(length(which(colnames(getExpressionData(obj_chk)) %in% getGeneSets(obj_chk)["chr4p11"][[1]])), 0)
  
  analysisDataSetup_noGene_chk <- try(analysisDataSetup(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = set_20_30$shortSurvivors,
    sampleIDsG2 = set_20_30$longSurvivors,
    covariates = NULL,
    geneSet = "chr4p11",
    sampleDescription ="TCGA GBM long vs. short survivors (no shared genes)",
    geneSetDescription ="msgidb:chr4p11"), silent = TRUE)
  
  checkEquals(analysisDataSetup_noGene_chk[[1]],   "Error in analysisDataSetup(obj = GeneSetBinomialMethods(), sampleIDsG1 = set_20_30$shortSurvivors,  : \n  None of the genes in the specified gene sets are contained in the TCGA gene expression data.\n")
} #test_analysisDataSetup
#------------------------------------------------------------------------------------------------------------------------
test_geneSetScoreTest = function()
{
  printf("--- test_geneSetScoreTest")

  ############################################################
  #Basic test with a subset of the samples and no covariates #
  ############################################################
  set40 <- randomSample(obj = GeneSetBinomialMethods(), nG1 = 40, nG2 = 40, cut = 0.5, all = FALSE, seed = 12345)
  
  skat_nocov <- geneSetScoreTest(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = set40$shortSurvivors,
    sampleIDsG2 = set40$longSurvivors,
    covariates = NULL,
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
  
  checkEquals(skat_nocov$summary.skatRes, "Null Model:  group ~ 1 \nAlternative Model:  group ~ 1 + ASB8 + COL9A2 + GPR172A + NBN + RPS6KA4 + SEMA3C \n\nP-value: 0.3837")

  #######################################################
  #Basic test with all of the samples and no covariates #
  #######################################################
  setAll <- randomSample(obj = GeneSetBinomialMethods(), cut = 0.5, all = TRUE)
  
  skatAll <- geneSetScoreTest(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = setAll$shortSurvivors,
    sampleIDsG2 = setAll$longSurvivors,
    covariates = NULL,
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
  
  checkEquals(skatAll$summary.skatRes, "Null Model:  group ~ 1 \nAlternative Model:  group ~ 1 + ASB8 + COL9A2 + GPR172A + NBN + RPS6KA4 + SEMA3C \n\nP-value: 0.3711")
  
  ##########################################################################
  #Basic test with all of the samples and first progression as a covariate #
  ##########################################################################
  setAll <- randomSample(obj = GeneSetBinomialMethods(), cut = 0.5, all = TRUE)
  
  skatAll <- geneSetScoreTest(
    obj = GeneSetBinomialMethods(),
    sampleIDsG1 = setAll$shortSurvivors,
    sampleIDsG2 = setAll$longSurvivors,
    covariates = "FirstProgression",
    geneSet = "KANG_CISPLATIN_RESISTANCE_DN",
    sampleDescription ="TCGA GBM long vs. short survivors",
    geneSetDescription ="msgidb:KANG_CISPLATIN_RESISTANCE_DN")
  
  checkEquals(as.character(skatAll$null.warnings), "glm.fit: fitted probabilities numerically 0 or 1 occurred")
  
  checkEquals(skatAll$summary.skatRes, "Null Model:  group ~ 1 + FirstProgression \nAlternative Model:  group ~ 1 + FirstProgression + ASB8 + COL9A2 + GPR172A + NBN + RPS6KA4 + SEMA3C \n\nP-value: 0.5193 \n\nNull Model Warnings: glm.fit: fitted probabilities numerically 0 or 1 occurred")
  
  #############################################################
  #Random gene sets with all of the samples and no covariates #
  #############################################################
  setAll <- randomSample(obj = GeneSetBinomialMethods(), cut = 0.5, all = TRUE)
  all.geneSets <- getGeneSets(GeneSetBinomialMethods())
  
  set.seed(-1327681546)
  samp.geneSets <- sample(all.geneSets, 10)
  
  res <- list()
  run.start.genesets <- proc.time()
  skatRes <- foreach(i = 1:length(samp.geneSets), .errorhandling="pass") %do% {  
    res[[i]] <- geneSetScoreTest(
      obj = GeneSetBinomialMethods(),
      sampleIDsG1 = setAll$shortSurvivors,
      sampleIDsG2 = setAll$longSurvivors,
      covariates = NULL,
      geneSet = names(samp.geneSets)[i],
      sampleDescription = "TCGA GBM long vs. short survivors (random gene set, all samples)",
      geneSetDescription = names(samp.geneSets)[i]) 
  }
  names(skatRes) <- names(samp.geneSets)
  run.time.genesets <- proc.time() - run.start.genesets  
  
  checkEquals(names(skatRes), names(samp.geneSets))
  
  checkEquals(length(skatRes), 10)
  checkEquals(any(!unlist(lapply(skatRes, class)) == "list"), FALSE)
  
  checkEquals(skatRes[[1]]$summary.skatRes, 
              "Null Model:  group ~ 1 \nAlternative Model:  group ~ 1 + CASP10 + CDH2 + IGFBP2 + SEPT7 + TFG \n\nP-value: 0.2439")
  checkEquals(skatRes[[2]]$summary.skatRes, 
              "Null Model:  group ~ 1 \nAlternative Model:  group ~ 1 + AMFR + ATP6V0A2 + ATRX + BAHD1 + BPHL + BRCA1 + BTD + CAMK2G + CCNF + CETN3 + CHD3 + CLP1 + CLPX + CPSF4 + CSTF3 + CYP4F12 + EIF5B + EP400 + ERAL1 + ERCC2 + EXTL3 + FANCG + FANCI + FDXR + FNTB + FOXD1 + FRYL + GALNT2 + GRIK5 + GRIP2 + GSK3B + HNRNPL + HTR7 + ILVBL + IMPA1 + INPP5E + JRK + KIAA0195 + KIAA0586 + KLHL18 + KRT33A + MC2R + MEA1 + MFN1 + MSH3 + MTX1 + MUTYH + NFRKB + NFYB + NKRF + NMT1 + NR2C1 + PAXIP1 + PCGF1 + PDXDC1 + PFDN6 + PHF10 + PIGB + PIGF + PIK3R2 + PLEKHB1 + POP4 + PPP5C + RAP1A + RBBP8 + REV3L + RFC5 + RPS6KB2 + SCAMP1 + SH2B1 + SLC24A1 + SLC25A11 + SLC30A3 + SPAST + SPRED2 + SSR1 + SYNJ2 + TAF2 + TMEM11 + TRIM27 + UBE4B + WDR62 + ZNF500 + ZNF592 \n\nP-value: 0.745")
  checkEquals(skatRes[[10]]$summary.skatRes, 
              "Null Model:  group ~ 1 \nAlternative Model:  group ~ 1 + ABCC9 + ABCE1 + ABHD14A + ADAMTS1 + ADRB3 + ALCAM + ANXA4 + APEX1 + AQP9 + ARMCX1 + ATIC + ATP10A + BAZ2B + BMP15 + BMX + BRIP1 + CA6 + CASP1 + CCDC102B + CD55 + CD74 + CDH8 + CDKAL1 + CFH + CIDEB + CKAP4 + CLCA4 + CLIP3 + CREB3L2 + CRTAP + CTNNA3 + CUL1 + DHODH + DSC3 + DTX4 + DUSP22 + EEF1G + EIF2B3 + EIF4EBP1 + ELF2 + ELN + EMD + ERAL1 + ERLIN1 + ETF1 + ETFB + EXOSC5 + FAIM + FAM49A + FXYD2 + FZD6 + GAS6 + GNG11 + GNL2 + GPD1L + GPRC5A + GPX1 + GPX7 + GRB14 + GSTM3 + GUCY1A3 + GUCY1B3 + HDGFRP3 + HES1 + HLA-DMA + IFI44 + IFI44L + IGLL1 + IL19 + IMPACT + IMPDH1 + INTS7 + KCNK10 + LAMC1 + LARS2 + LDB1 + LILRA4 + LUZP2 + MALL + MAP9 + MCTP2 + MDFIC + MEP1B + MEST + METTL8 + MFAP4 + MINA + MRE11A + MRPL11 + MRTO4 + MS4A5 + MSRB2 + MTCP1 + MYOZ2 + NBN + NEK11 + NOS1 + NOTCH1 + NUBPL + OBFC1 + PAICS + PBX1 + PCCB + PCNA + PDE3B + PDZRN3 + PFKM + PIM1 + PKD2 + PKIG + PLA2G4C + PLAC8 + POFUT1 + POLR3B + PON2 + PPAP2B + PPEF2 + PRDX4 + PRKCA + PRMT5 + PTGER3 + PTPLA + RAB40B + RNF130 + RNF144A + RPS8 + RRAS2 + RRP1 + RUVBL1 + S100G + SAMM50 + SAMSN1 + SCN3A + SCN9A + SEC31B + SELL + SH3BGR + SLC15A3 + SND1 + SOCS2 + STK3 + STOM + STOML2 + TBCE + TCF7L2 + TFAM + TFRC + TIMP1 + TIMP4 + TLR7 + TMED3 + TNFSF4 + TRIM29 + TUBA1A + TUFT1 + TYRP1 + UCHL5 + UCK2 + ULK4 + VIM + WDR3 + WDR41 + XKR8 + XPOT + XYLT1 + ZCCHC14 + ZMYND10 + ZNF132 + ZNF282 + ZNF550 + ZNF643 \n\nP-value: 0.6569")
  
  #############################################################
  #Random gene sets with all of the samples and one covariate #
  #############################################################
  setAll <- randomSample(obj = GeneSetBinomialMethods(), cut = 0.5, all = TRUE)
  all.geneSets <- getGeneSets(GeneSetBinomialMethods())
  
  set.seed(-1327681546)
  samp.geneSets <- sample(all.geneSets, 10)
  
  res <- list()
  run.start.genesets <- proc.time()
  skatRes <- foreach(i = 1:length(samp.geneSets), .errorhandling="pass") %do% {  
    res[[i]] <- geneSetScoreTest(
      obj = GeneSetBinomialMethods(),
      sampleIDsG1 = setAll$shortSurvivors,
      sampleIDsG2 = setAll$longSurvivors,
      covariates = "ageAtDx",
      geneSet = names(samp.geneSets)[i],
      sampleDescription = "TCGA GBM long vs. short survivors (random gene set, all samples)",
      geneSetDescription = names(samp.geneSets)[i]) 
  }
  names(skatRes) <- names(samp.geneSets)
  run.time.genesets <- proc.time() - run.start.genesets  
  
  checkEquals(names(skatRes), names(samp.geneSets))
  
  checkEquals(length(skatRes), 10)
  checkEquals(any(!unlist(lapply(skatRes, class)) == "list"), FALSE)
  
  checkEquals(skatRes[[1]]$summary.skatRes,
              "Null Model:  group ~ 1 + ageAtDx \nAlternative Model:  group ~ 1 + ageAtDx + CASP10 + CDH2 + IGFBP2 + SEPT7 + TFG \n\nP-value: 0.3061")
  checkEquals(skatRes[[2]]$summary.skatRes, 
              "Null Model:  group ~ 1 + ageAtDx \nAlternative Model:  group ~ 1 + ageAtDx + AMFR + ATP6V0A2 + ATRX + BAHD1 + BPHL + BRCA1 + BTD + CAMK2G + CCNF + CETN3 + CHD3 + CLP1 + CLPX + CPSF4 + CSTF3 + CYP4F12 + EIF5B + EP400 + ERAL1 + ERCC2 + EXTL3 + FANCG + FANCI + FDXR + FNTB + FOXD1 + FRYL + GALNT2 + GRIK5 + GRIP2 + GSK3B + HNRNPL + HTR7 + ILVBL + IMPA1 + INPP5E + JRK + KIAA0195 + KIAA0586 + KLHL18 + KRT33A + MC2R + MEA1 + MFN1 + MSH3 + MTX1 + MUTYH + NFRKB + NFYB + NKRF + NMT1 + NR2C1 + PAXIP1 + PCGF1 + PDXDC1 + PFDN6 + PHF10 + PIGB + PIGF + PIK3R2 + PLEKHB1 + POP4 + PPP5C + RAP1A + RBBP8 + REV3L + RFC5 + RPS6KB2 + SCAMP1 + SH2B1 + SLC24A1 + SLC25A11 + SLC30A3 + SPAST + SPRED2 + SSR1 + SYNJ2 + TAF2 + TMEM11 + TRIM27 + UBE4B + WDR62 + ZNF500 + ZNF592 \n\nP-value: 0.5352")
  checkEquals(skatRes[[10]]$summary.skatRes, 
              "Null Model:  group ~ 1 + ageAtDx \nAlternative Model:  group ~ 1 + ageAtDx + ABCC9 + ABCE1 + ABHD14A + ADAMTS1 + ADRB3 + ALCAM + ANXA4 + APEX1 + AQP9 + ARMCX1 + ATIC + ATP10A + BAZ2B + BMP15 + BMX + BRIP1 + CA6 + CASP1 + CCDC102B + CD55 + CD74 + CDH8 + CDKAL1 + CFH + CIDEB + CKAP4 + CLCA4 + CLIP3 + CREB3L2 + CRTAP + CTNNA3 + CUL1 + DHODH + DSC3 + DTX4 + DUSP22 + EEF1G + EIF2B3 + EIF4EBP1 + ELF2 + ELN + EMD + ERAL1 + ERLIN1 + ETF1 + ETFB + EXOSC5 + FAIM + FAM49A + FXYD2 + FZD6 + GAS6 + GNG11 + GNL2 + GPD1L + GPRC5A + GPX1 + GPX7 + GRB14 + GSTM3 + GUCY1A3 + GUCY1B3 + HDGFRP3 + HES1 + HLA-DMA + IFI44 + IFI44L + IGLL1 + IL19 + IMPACT + IMPDH1 + INTS7 + KCNK10 + LAMC1 + LARS2 + LDB1 + LILRA4 + LUZP2 + MALL + MAP9 + MCTP2 + MDFIC + MEP1B + MEST + METTL8 + MFAP4 + MINA + MRE11A + MRPL11 + MRTO4 + MS4A5 + MSRB2 + MTCP1 + MYOZ2 + NBN + NEK11 + NOS1 + NOTCH1 + NUBPL + OBFC1 + PAICS + PBX1 + PCCB + PCNA + PDE3B + PDZRN3 + PFKM + PIM1 + PKD2 + PKIG + PLA2G4C + PLAC8 + POFUT1 + POLR3B + PON2 + PPAP2B + PPEF2 + PRDX4 + PRKCA + PRMT5 + PTGER3 + PTPLA + RAB40B + RNF130 + RNF144A + RPS8 + RRAS2 + RRP1 + RUVBL1 + S100G + SAMM50 + SAMSN1 + SCN3A + SCN9A + SEC31B + SELL + SH3BGR + SLC15A3 + SND1 + SOCS2 + STK3 + STOM + STOML2 + TBCE + TCF7L2 + TFAM + TFRC + TIMP1 + TIMP4 + TLR7 + TMED3 + TNFSF4 + TRIM29 + TUBA1A + TUFT1 + TYRP1 + UCHL5 + UCK2 + ULK4 + VIM + WDR3 + WDR41 + XKR8 + XPOT + XYLT1 + ZCCHC14 + ZMYND10 + ZNF132 + ZNF282 + ZNF550 + ZNF643 \n\nP-value: 0.8078")
              
  ##############################################################
  #Random gene sets with all of the samples and two covariates #
  ##############################################################
  setAll <- randomSample(obj = GeneSetBinomialMethods(), cut = 0.5, all = TRUE)
  all.geneSets <- getGeneSets(GeneSetBinomialMethods())
  
  set.seed(-1327681546)
  samp.geneSets <- sample(all.geneSets, 10)
  
  res <- list()
  run.start.genesets <- proc.time()
  skatRes <- foreach(i = 1:length(samp.geneSets), .errorhandling="pass") %do% {  
    res[[i]] <- geneSetScoreTest(
      obj = GeneSetBinomialMethods(),
      sampleIDsG1 = setAll$shortSurvivors,
      sampleIDsG2 = setAll$longSurvivors,
      covariates = c("ageAtDx", "ChemoAgent"),
      geneSet = names(samp.geneSets)[i],
      sampleDescription = "TCGA GBM long vs. short survivors (random gene set, all samples)",
      geneSetDescription = names(samp.geneSets)[i]) 
  }
  names(skatRes) <- names(samp.geneSets)
  run.time.genesets <- proc.time() - run.start.genesets  
  
  checkEquals(names(skatRes), names(samp.geneSets))
  
  checkEquals(length(skatRes), 10)
  checkEquals(any(!unlist(lapply(skatRes, class)) == "list"), FALSE)
  
  checkEquals(skatRes[[1]]$summary.skatRes,
              "Null Model:  group ~ 1 + ageAtDx + ChemoAgent \nAlternative Model:  group ~ 1 + ageAtDx + ChemoAgent + CASP10 + CDH2 + IGFBP2 + SEPT7 + TFG \n\nP-value: 0.6578")
  checkEquals(skatRes[[2]]$summary.skatRes, 
              "Null Model:  group ~ 1 + ageAtDx + ChemoAgent \nAlternative Model:  group ~ 1 + ageAtDx + ChemoAgent + AMFR + ATP6V0A2 + ATRX + BAHD1 + BPHL + BRCA1 + BTD + CAMK2G + CCNF + CETN3 + CHD3 + CLP1 + CLPX + CPSF4 + CSTF3 + CYP4F12 + EIF5B + EP400 + ERAL1 + ERCC2 + EXTL3 + FANCG + FANCI + FDXR + FNTB + FOXD1 + FRYL + GALNT2 + GRIK5 + GRIP2 + GSK3B + HNRNPL + HTR7 + ILVBL + IMPA1 + INPP5E + JRK + KIAA0195 + KIAA0586 + KLHL18 + KRT33A + MC2R + MEA1 + MFN1 + MSH3 + MTX1 + MUTYH + NFRKB + NFYB + NKRF + NMT1 + NR2C1 + PAXIP1 + PCGF1 + PDXDC1 + PFDN6 + PHF10 + PIGB + PIGF + PIK3R2 + PLEKHB1 + POP4 + PPP5C + RAP1A + RBBP8 + REV3L + RFC5 + RPS6KB2 + SCAMP1 + SH2B1 + SLC24A1 + SLC25A11 + SLC30A3 + SPAST + SPRED2 + SSR1 + SYNJ2 + TAF2 + TMEM11 + TRIM27 + UBE4B + WDR62 + ZNF500 + ZNF592 \n\nP-value: 0.2776")
  checkEquals(skatRes[[10]]$summary.skatRes, 
              "Null Model:  group ~ 1 + ageAtDx + ChemoAgent \nAlternative Model:  group ~ 1 + ageAtDx + ChemoAgent + ABCC9 + ABCE1 + ABHD14A + ADAMTS1 + ADRB3 + ALCAM + ANXA4 + APEX1 + AQP9 + ARMCX1 + ATIC + ATP10A + BAZ2B + BMP15 + BMX + BRIP1 + CA6 + CASP1 + CCDC102B + CD55 + CD74 + CDH8 + CDKAL1 + CFH + CIDEB + CKAP4 + CLCA4 + CLIP3 + CREB3L2 + CRTAP + CTNNA3 + CUL1 + DHODH + DSC3 + DTX4 + DUSP22 + EEF1G + EIF2B3 + EIF4EBP1 + ELF2 + ELN + EMD + ERAL1 + ERLIN1 + ETF1 + ETFB + EXOSC5 + FAIM + FAM49A + FXYD2 + FZD6 + GAS6 + GNG11 + GNL2 + GPD1L + GPRC5A + GPX1 + GPX7 + GRB14 + GSTM3 + GUCY1A3 + GUCY1B3 + HDGFRP3 + HES1 + HLA-DMA + IFI44 + IFI44L + IGLL1 + IL19 + IMPACT + IMPDH1 + INTS7 + KCNK10 + LAMC1 + LARS2 + LDB1 + LILRA4 + LUZP2 + MALL + MAP9 + MCTP2 + MDFIC + MEP1B + MEST + METTL8 + MFAP4 + MINA + MRE11A + MRPL11 + MRTO4 + MS4A5 + MSRB2 + MTCP1 + MYOZ2 + NBN + NEK11 + NOS1 + NOTCH1 + NUBPL + OBFC1 + PAICS + PBX1 + PCCB + PCNA + PDE3B + PDZRN3 + PFKM + PIM1 + PKD2 + PKIG + PLA2G4C + PLAC8 + POFUT1 + POLR3B + PON2 + PPAP2B + PPEF2 + PRDX4 + PRKCA + PRMT5 + PTGER3 + PTPLA + RAB40B + RNF130 + RNF144A + RPS8 + RRAS2 + RRP1 + RUVBL1 + S100G + SAMM50 + SAMSN1 + SCN3A + SCN9A + SEC31B + SELL + SH3BGR + SLC15A3 + SND1 + SOCS2 + STK3 + STOM + STOML2 + TBCE + TCF7L2 + TFAM + TFRC + TIMP1 + TIMP4 + TLR7 + TMED3 + TNFSF4 + TRIM29 + TUBA1A + TUFT1 + TYRP1 + UCHL5 + UCK2 + ULK4 + VIM + WDR3 + WDR41 + XKR8 + XPOT + XYLT1 + ZCCHC14 + ZMYND10 + ZNF132 + ZNF282 + ZNF550 + ZNF643 \n\nP-value: 0.3497")
  } #test_geneSetScoreTest
#------------------------------------------------------------------------------------------------------------------------