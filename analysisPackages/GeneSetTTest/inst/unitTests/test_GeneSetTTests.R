library(GeneSetTTests)
library(RUnit)
library(GMD)
#------------------------------------------------------------------------------------------------------------------------
# patient history file needed in order to pick good candidates, e.g., those with extreme survival, long and short

if(!exists("tbl.ptHistory")){
   file <- system.file(package="GeneSetTTests", "extdata", "tbl.ptHistory.RData")
   checkTrue(file.exists(file))
   printf("loading %s", load(file))
   checkTrue(exists("tbl.ptHistory"))
   }
#------------------------------------------------------------------------------------------------------------------------
runTests <- function()
{
  suppressWarnings({
     test_constructor()
     test_.trimMatrix()
     test_score_1_geneset()
     test_score_2_genesets()
    
    #test_score_bugs()
     test_score_good_genesets()
     test_score_good_genesets_3()
     test_cancerRelatedGeneSets()
     #test_score_cancer_related_genesets_meanSD_only()
     #test_score_cancer_related_genesets_meanSD_only_meanThresold()
     test_drawHeatmap()
     })
  
} # runTests
#------------------------------------------------------------------------------------------------------------------------
test_constructor = function ()
{
   printf("--- test_constructor")

     # first, the no-args constructor
   gstt <- GeneSetTTests()
   checkEquals(dim(getExpressionData(gstt)), c(315, 11864))
   checkTrue(length(getGeneSets(gstt)) > 10000)   # 10295 on (3 feb 2015)
   checkEquals(head(getGeneSetNames(gstt), n=3), 
               c("NUCLEOPLASM", "EXTRINSIC_TO_PLASMA_MEMBRANE","ORGANELLE_PART"))
   checkEquals(names(head(which(getGeneSetLengths(gstt) < 10), n=3)),
               c("INTERCALATED_DISC", "V$SEF1_C", "TCGATGG,MIR-213"))
   checkEquals(length(which(getGeneSetLengths(gstt) <= 10)), 575)

} # test_constructor
#------------------------------------------------------------------------------------------------------------------------
# test the internal function (note leading ".") which subsets the supplied expression matrix by the acutal existing
# gene names and sampleIDs
test_.trimMatrix <- function()
{
   printf("--- test_.trimMatrix")

   gstt <- GeneSetTTests()
   samples <- list("TCGA.02.0439", "TCGA.06.0140", "TCGA.06.0201", "TCGA.06.0213", "TCGA.06.0402",
                   "TCGA.12.0657", "TCGA.14.3476", "TCGA.19.2624", "TCGA.32.1976", "TCGA.41.4097")
   
   samples.recognized <- intersect(samples, rownames(getExpressionData(gstt)))
   checkEquals(length(samples.recognized), 5)

   all.geneset.genes <- unique(unlist(getGeneSets(gstt), use.names=FALSE))
   set.seed(123)
   test.genes <- all.geneset.genes[sample(1:length(all.geneset.genes), 40)]
   genes.recognized <- intersect(test.genes, colnames(getExpressionData(gstt)))
   checkEquals(length(genes.recognized), 9)

   mtx.trimmed <- GeneSetTTests:::.trimMatrix(getExpressionData(gstt), samples, test.genes, "unit testing")
   checkEquals(dim(mtx.trimmed), c(5, 9))
   checkTrue(all(samples.recognized %in% rownames(mtx.trimmed)))
   checkTrue(all(genes.recognized %in% colnames(mtx.trimmed)))
   
} # test_.trimMatrix
#------------------------------------------------------------------------------------------------------------------------
shortSurvivors <- function(count=20)
{
   tbl.ptHistory[order(tbl.ptHistory$survival, decreasing=FALSE),]$ID[1:count]

} # shortSurvivors
#------------------------------------------------------------------------------------------------------------------------
longSurvivors <- function(count=20)
{
   tbl.ptHistory[order(tbl.ptHistory$survival, decreasing=TRUE),]$ID[1:20]

} # longSurvivors
#------------------------------------------------------------------------------------------------------------------------
geneSetsOfInterest <- function()
{
   gstt <- GeneSetTTests()
   genesets <- getGeneSets(gstt)
   gliomas <- grep("GLIOMA", names(genesets), ignore.case=TRUE, value=TRUE)
   cancers <-grep("CANCER", names(genesets), ignore.case=TRUE, value=TRUE)
   pathways <-grep("PATHWAY", names(genesets), ignore.case=TRUE, value=TRUE)

   additional <- c(
                   "AKL_HTLV1_INFECTION_UP",
                   "BIOCARTA_MCM_PATHWAY",
                   "BIOCARTA_RANMS_PATHWAY",
                   "BROWNE_INTERFERON_RESPONSIVE_GENES",
                   "BUDHU_LIVER_CANCER_METASTASIS_UP",
                   "CALCIUM_MEDIATED_SIGNALING",
                   "COFACTOR_TRANSPORTER_ACTIVITY",
                   "COURTOIS_SENESCENCE_TRIGGERS",
                   "CROONQUIST_NRAS_SIGNALING_DN",
                   "DER_IFN_ALPHA_RESPONSE_DN",
                   "EGUCHI_CELL_CYCLE_RB1_TARGETS",
                   "FARMER_BREAST_CANCER_CLUSTER_8",
                   "FINETTI_BREAST_CANCER_KINOME_RED",
                   "GCM_PPM1D",
                   "GLINSKY_CANCER_DEATH_UP",
                   "GNF2_BUB1",
                   "GNF2_BUB1B",
                   "GNF2_CCNA2",
                   "GNF2_CCNB2",
                   "GNF2_CDC2",
                   "GNF2_CDC20",
                   "GNF2_CENPE",
                   "GNF2_CENPF",
                   "GNF2_CKS2",
                   "GNF2_CYP2B6",
                   "GNF2_ESPL1",
                   "GNF2_FEN1",
                   "GNF2_H2AFX",
                   "GNF2_HMMR",
                   "GNF2_MCM4",
                   "GNF2_MKI67",
                   "GNF2_MSH2",
                   "GNF2_PCNA",
                   "GNF2_RRM2",
                   "GNF2_TTK",
                   "GRAHAM_CML_QUIESCENT_VS_CML_DIVIDING_DN",
                   "GROWTH_CONE",
                   "GUTIERREZ_WALDENSTROEMS_MACROGLOBULINEMIA_2",
                   "HETEROGENEOUS_NUCLEAR_RIBONUCLEOPROTEIN_COMPLEX",
                   "IWANAGA_E2F1_TARGETS_NOT_INDUCED_BY_SERUM",
                   "KANG_DOXORUBICIN_RESISTANCE_UP",
                   "KARAKAS_TGFB1_SIGNALING",
                   "KASLER_HDAC7_TARGETS_2_UP",
                   "KUMAMOTO_RESPONSE_TO_NUTLIN_3A_DN",
                   "LIANG_SILENCED_BY_METHYLATION_DN",
                   "LUDWICZEK_TREATING_IRON_OVERLOAD",
                   "MIKKELSEN_NPC_ICP_WITH_H3K27ME3",
                   "MITOTIC_SPINDLE_ORGANIZATION_AND_BIOGENESIS",
                   "MODULE_143",
                   "MODULE_293",
                   "MODULE_315",
                   "MODULE_457",
                   "MODULE_543",
                   "MONTERO_THYROID_CANCER_POOR_SURVIVAL_UP",
                   "MOSERLE_IFNA_RESPONSE",
                   "NAISHIRO_CTNNB1_TARGETS_WITH_LEF1_MOTIF",
                   "NIKOLSKY_BREAST_CANCER_10Q22_AMPLICON",
                   "NOUSHMEHR_GBM_SILENCED_BY_METHYLATION",
                   "NUCLEAR_CHROMATIN",
                   "ODONNELL_TARGETS_OF_MYC_AND_TFRC_DN",
                   "OHASHI_AURKA_TARGETS",
                   "OHASHI_AURKB_TARGETS",
                   "OXFORD_RALA_OR_RALB_TARGETS_UP",
                   "PARK_OSTEOBLAST_DIFFERENTIATION_BY_PHENYLAMIL_DN",
                   "PID_P38GAMMADELTAPATHWAY",
                   "PROTEIN_EXPORT_FROM_NUCLEUS",
                   "RAMJAUN_APOPTOSIS_BY_TGFB1_VIA_MAPK1_DN",
                   "REACTOME_ACTIVATION_OF_THE_PRE_REPLICATIVE_COMPLEX",
                   "REACTOME_ASSOCIATION_OF_LICENSING_FACTORS_WITH_THE_PRE_REPLICATIVE_COMPLEX",
                   "REACTOME_CDC6_ASSOCIATION_WITH_THE_ORC_ORIGIN_COMPLEX",
                   "REACTOME_ENDOSOMAL_VACUOLAR_PATHWAY",
                   "REACTOME_KINESINS",
                   "REACTOME_NEGATIVE_REGULATION_OF_THE_PI3K_AKT_NETWORK",
                   "REACTOME_REGULATION_OF_INSULIN_SECRETION_BY_ACETYLCHOLINE",
                   "REACTOME_TRAF3_DEPENDENT_IRF_ACTIVATION_PATHWAY",
                   "SANCHEZ_MDM2_TARGETS",
                   "SIMBULAN_PARP1_TARGETS_DN",
                   "SPINDLE_ORGANIZATION_AND_BIOGENESIS",
                   "SULFUR_COMPOUND_BIOSYNTHETIC_PROCESS",
                   "SYNAPTOGENESIS",
                   "UROSEVIC_RESPONSE_TO_IMIQUIMOD",
                   "VERHAAK_GLIOBLASTOMA_PRONEURAL",
                   "WHITESIDE_CISPLATIN_RESISTANCE_UP",
                   "WONG_IFNA2_RESISTANCE_UP",
                   "YANG_MUC2_TARGETS_COLON_3MO_DN",
                   "ZERBINI_RESPONSE_TO_SULINDAC_DN",
                   "ZERBINI_RESPONSE_TO_SULINDAC_UP",
                   "ZHAN_EARLY_DIFFERENTIATION_GENES_UP",
                   "ZHENG_FOXP3_TARGETS_IN_THYMUS_DN")

   return(sort(unique(c(gliomas, cancers, pathways, additional))))
 
} # geneSetsOfInterest
#------------------------------------------------------------------------------------------------------------------------
test_cancerRelatedGeneSets <- function()
{
   printf("--- test_cancerRelatedGeneSets")
   gstt <- GeneSetTTests()
   x <- cancerRelatedGeneSets(gstt)
   checkTrue(length(x) > 1000)
   checkTrue(length(grep("PATHWAY", x)) > 500)
   checkTrue(length(grep("METHYLATION", x)) > 30)
   checkTrue(length(grep("CANCER", x)) > 400)

} # test_cancerRelatedGeneSets
#------------------------------------------------------------------------------------------------------------------------
test_score_1_geneset <- function()
{
   printf("--- test_score_1_geneset")
   gstt <- GeneSetTTests()
   short.survivors <- shortSurvivors(20)
   long.survivors <- longSurvivors(20)
   checkEquals(length(intersect(short.survivors, long.survivors)), 0)

   gsoi <- "FARMER_BREAST_CANCER_CLUSTER_8" # nice separation with this small set
   score <- score(gstt, short.survivors, long.survivors, gsoi)
   checkEquals(length(score), 1)
   checkEquals(names(score), gsoi)
   vals <- score[[gsoi]]
   checkEqualsNumeric(vals, c(ERBB2=0.0125547, PNMT=0.09726957, GRB7=0.1191358,
                              MED1=0.2958729, mean=0.1312082, sd=0.1190108, count=4.0),
                      tolerance=1e-5)
   
} # test_score_1_geneset
#------------------------------------------------------------------------------------------------------------------------
test_score_2_genesets <- function()
{
   printf("--- test_score_2_genesets")
   gstt <- GeneSetTTests()
   short.survivors <- shortSurvivors(20)
   long.survivors <- longSurvivors(20)
   checkEquals(length(intersect(short.survivors, long.survivors)), 0)

   gsoi <- c("FARMER_BREAST_CANCER_CLUSTER_8",
             "TCGA_GLIOBLASTOMA_COPY_NUMBER_DN")

   score <- score(gstt, short.survivors, long.survivors, gsoi)
   checkEquals(length(score), 2)
   checkEquals(names(score), gsoi)
   vals.1 <- score[[gsoi[1]]]
   checkEqualsNumeric(vals.1, c(ERBB2=0.0125547, PNMT=0.09726957, GRB7=0.1191358,
                                MED1=0.2958729, mean=0.1312082, sd=0.1190108,
                                count=4.0),
                      tolerance=1e-5)

   vals.2 <- score[[gsoi[2]]]
   checkEquals(length(vals.2), 26)
   checkEqualsNumeric(as.numeric(vals.2[c("mean", "sd")]), c(0.3974112, 0.2306051), tolerance=1e-5)

} # test_score_2_genesets
#------------------------------------------------------------------------------------------------------------------------
# check for lasting fixes to edge cases encountered when running through all genesets
test_score_bugs <- function()
{
   gsoi <- "chr21p11"    # only one gene in our current data, insufficient for t.test
   gstt <- GeneSetTTests()
   short.survivors <- shortSurvivors(20)
   long.survivors <- longSurvivors(20)
   score <- score(gstt, short.survivors, long.survivors, gsoi)
   checkEquals(length(score), 0)
  
} # test_score_bugs
#------------------------------------------------------------------------------------------------------------------------
# of possible interest: some apparent under expression in ORC/MCM
# REACTOME_CDC6_ASSOCIATION_WITH_THE_ORC_ORIGIN_COMPLEX	0.11	0.07	4
# BIOCARTA_MCM_PATHWAY	0.09	0.07	12
# see http://www.broadinstitute.org/gsea/msigdb/cards/BIOCARTA_MCM_PATHWAY for the relation between these two
test_score_good_genesets <- function(plot=FALSE)
{
   printf("--- test_score_good_genesets")
   gstt <- GeneSetTTests()
   short.survivors <- shortSurvivors(20)
   long.survivors <- longSurvivors(20)
   checkEquals(length(intersect(short.survivors, long.survivors)), 0)

   gsoi <- c("VERHAAK_GLIOBLASTOMA_PRONEURAL",
             "HETEROGENEOUS_NUCLEAR_RIBONUCLEOPROTEIN_COMPLEX",
             "BIOCARTA_MCM_PATHWAY",
             "MODULE_143",
             "REACTOME_ENDOSOMAL_VACUOLAR_PATHWAY",
             "MODULE_543",
             "REACTOME_CDC6_ASSOCIATION_WITH_THE_ORC_ORIGIN_COMPLEX",
             "REACTOME_NEGATIVE_REGULATION_OF_THE_PI3K_AKT_NETWORK",
             "LUDWICZEK_TREATING_IRON_OVERLOAD")

   #gsoi <- gsoi[1:1]
   
   score <- score(gstt, short.survivors, long.survivors, gsoi, quiet=TRUE)

   checkEquals(length(score), length(gsoi))
   checkEquals(names(score), gsoi)

   tbl.mrna <- getExpressionData(gstt)
   genesets <- getGeneSets(gstt)
   if (plot) for(geneset.name in gsoi){
     #geneset.name <- gsoi[1]
     genes <- genesets[[geneset.name]]
     short.survivors.with.mrna <- intersect(short.survivors, rownames(tbl.mrna))
     long.survivors.with.mrna  <- intersect(long.survivors,  rownames(tbl.mrna))
     mtx <- GeneSetTTests:::.trimMatrix(tbl.mrna, c(short.survivors, long.survivors), genes, geneset.name)
     x11()
     drawHeatmap(geneset.name, genes,
                 short.survivors.with.mrna,
                 long.survivors.with.mrna,
                 mtx)
    } # for geneset.name
   
} # test_score_good_genesets
#------------------------------------------------------------------------------------------------------------------------
# BUDHU_LIVER_CANCER_METASTASIS_UP, MODULE_143, MODULE_293
# Demo Button Test: p value 0.05, participation 0.7, group1 10 shortsurvival, group2 10, long survival
#
test_score_good_genesets_3 <- function(plot=FALSE)
{
    printf("--- test_score_good_genesets_3")
    gstt <- GeneSetTTests()
    short.survivors <- c("TCGA.02.0439", "TCGA.06.0140", "TCGA.06.0201", "TCGA.06.0213", "TCGA.06.0402",
    "TCGA.12.0657", "TCGA.14.3476", "TCGA.19.2624", "TCGA.32.1976", "TCGA.41.4097");
    long.survivors <- c("TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0080", "TCGA.02.0114",
    "TCGA.06.6693", "TCGA.08.0344", "TCGA.12.0656", "TCGA.12.0818", "TCGA.12.1088");
    checkEquals(length(intersect(short.survivors, long.survivors)), 0)
    
    gsoi <- c("BUDHU_LIVER_CANCER_METASTASIS_UP",
    "MODULE_143",
    "MODULE_293")
    
    #gsoi <- gsoi[1:1]
    
    score <- score(gstt, short.survivors, long.survivors, gsoi, quiet=TRUE,participation.threshold=0.7, mean.threshold=0.05)
    
    checkEquals(length(score), length(gsoi))
    checkEquals(names(score), gsoi)
    
    tbl.mrna <- getExpressionData(gstt)
    genesets <- getGeneSets(gstt)
    if (plot) for(geneset.name in gsoi){
        #geneset.name <- gsoi[1]
        genes <- genesets[[geneset.name]]
        short.survivors.with.mrna <- intersect(short.survivors, rownames(tbl.mrna))
        long.survivors.with.mrna  <- intersect(long.survivors,  rownames(tbl.mrna))
        mtx <- GeneSetTTests:::.trimMatrix(tbl.mrna, c(short.survivors, long.survivors), genes, geneset.name)
        x11()
        drawHeatmap(geneset.name, genes,
        short.survivors.with.mrna,
        long.survivors.with.mrna,
        mtx)
    } # for geneset.name
    
} # test_score_good_genesets_3
#------------------------------------------------------------------------------------------------------------------------

# by ad hoc means about 1000 genesets possibly related to cancer have been selected
test_score_cancer_related_genesets <- function(plot=FALSE)
{
   printf("--- test_score_cancer_related_genesets")
   gstt <- GeneSetTTests()
   short.survivors <- shortSurvivors(30)
   long.survivors <- longSurvivors(10)
   checkEquals(length(intersect(short.survivors, long.survivors)), 0)

   score <- score(gstt, short.survivors, long.survivors, quiet=FALSE)

   checkEquals(length(score), length(gsoi))
   checkEquals(names(score), gsoi)

   tbl.mrna <- getExpressionData(gstt)
   genesets <- getGeneSets(gstt)

   if (plot) for(geneset.name in gsoi){
     #geneset.name <- gsoi[1]
     genes <- genesets[[geneset.name]]
     short.survivors.with.mrna <- intersect(short.survivors, rownames(tbl.mrna))
     long.survivors.with.mrna  <- intersect(long.survivors,  rownames(tbl.mrna))
     mtx <- GeneSetTTests:::.trimMatrix(tbl.mrna, c(short.survivors, long.survivors), genes, geneset.name)
     x11()
     drawHeatmap(geneset.name, genes,
                 short.survivors.with.mrna,
                 long.survivors.with.mrna,
                 mtx)
    } # for geneset.name
   
} # test_score_genesets_with_promising_names
#------------------------------------------------------------------------------------------------------------------------
# by ad hoc means about 1000 genesets possibly related to cancer have been selected
test_score_cancer_related_genesets_meanSD_only <- function(plot=FALSE)
{
   printf("--- test_score_cancer_related_genesets")
   gstt <- GeneSetTTests()
   short.survivors <- shortSurvivors(20)
   long.survivors <- longSurvivors(20)
   checkEquals(length(intersect(short.survivors, long.survivors)), 0)

   score <- score(gstt, short.survivors, long.survivors, byGene=FALSE, quiet=TRUE)
   tbl.score <- as.data.frame(t(as.data.frame(score)))
   checkTrue(nrow(tbl.score) > 1000)
   checkEquals(colnames(tbl.score), c("mean", "sd", "count"))

} # test_score_cancer_related_genesets_meanSD_only
#------------------------------------------------------------------------------------------------------------------------
test_drawHeatmap <- function()
{
   print("--- test_drawHeatmap")

   gstt <- GeneSetTTests()
   group1 <- shortSurvivors(20)
   group2 <- longSurvivors(20)
   geneset.name <- "NIKOLSKY_BREAST_CANCER_10Q22_AMPLICON"
   fn <- tempfile()
   pdf(fn)
   message(sprintf("writing heatmap to %s", fn))
   drawHeatmap(gstt, geneset.name, group1, group2, cluster.patients=FALSE);
   dev.off()
   checkTrue(file.exists(fn))
   
} # test_drawHeatmap
#------------------------------------------------------------------------------------------------------------------------
test_score_cancer_related_genesets_meanSD_only_meanThresold <- function(plot=FALSE)
{
   printf("--- test_score_cancer_related_genesets_meanSD_only_meanThresold")
   gstt <- GeneSetTTests()
   short.survivors <- shortSurvivors(20)
   long.survivors <- longSurvivors(20)

   score <- score(gstt, short.survivors, long.survivors, quiet=TRUE, byGene=FALSE,  mean.threshold=0.15)

   tbl.score <- as.data.frame(t(as.data.frame(score)))
   tbl.score <- tbl.score[order(tbl.score$mean, decreasing=FALSE),]
   checkEquals(dim(tbl.score), c (25, 3))
   checkEquals(colnames(tbl.score), c("mean", "sd", "count"))

     # single out  the mcm pathway for a direct and detailed check
   
   mcm <- as.list(tbl.score["BIOCARTA_MCM_PATHWAY",])
   checkEqualsNumeric(mcm$mean, 0.08904308, tol=1e-5)
   checkEqualsNumeric(mcm$sd, 0.06718839, tol=1e-5)
   checkEquals(mcm$count, 12)

} # test_score_cancer_related_genesets_meanSD_only_meanThresold
#------------------------------------------------------------------------------------------------------------------------
prolonged_score_all_genesets <- function()
{
   printf("--- test_score_all_genesets")
   gstt <- GeneSetTTests()
   short.survivors <- shortSurvivors(20)
   long.survivors <- longSurvivors(20)
   checkEquals(length(intersect(short.survivors, long.survivors)), 0)

   genesets <- getGeneSetNames(gstt)
   #gsoi <- genesets[1:3430]
   gsoi <- names(genesets)
   score <- score(gstt, short.survivors, long.survivors, gsoi, quiet=TRUE, byGene=FALSE,  mean.threshold=0.15)
} # prolonged_score_all_genesets
 #ptm <- proc.time()
 #score <- score(gstt, short.survivors, long.survivors, gsoi, quiet=TRUE, byGene=FALSE,  mean.threshold=0.15)
 #interval <- proc.time() - ptm

#------------------------------------------------------------------------------------------------------------------------
# figure out how to write scoring function
dev_score <- function()
{
   printf("--- dev_score")
   gstt <- GeneSetTTests()
   short.survivors <- shortSurvivors(20)
   long.survivors <- longSurvivors(20)
   checkEquals(length(intersect(short.survivors, long.survivors)), 0)
   
   tbl.mrna <- getExpressionData(gstt)
   genesets <- getGeneSets(gstt)
   glio.related.geneset.names <- grep("GLIO", getGeneSetNames(gstt), ignore.case=TRUE, value=TRUE)
   cancer.related.geneset.names <- grep("CANCER", getGeneSetNames(gstt), ignore.case=TRUE, value=TRUE)
   genesets.of.interest <- unique(c(glio.related.geneset.names, cancer.related.geneset.names))

   result <- vector(mode="list", length=length(genesets.of.interest))

   count <- 0
   for(geneset.name in genesets.of.interest){
      genes <- genesets[[geneset.name]]
   
      mtx <- GeneSetTTests:::.trimMatrix(tbl.mrna, c(short.survivors, long.survivors), genes, geneset.name)
   
         # get 5 patients from the two tails of the survival distribution
         # too small a sample size to be robustly interesting
         # but good for testing
         # get more than 5: not all patients are in the expression data
   
      #checkEquals(dim(mtx), c(25, 8))
      short.survivors.with.mrna <- intersect(short.survivors, rownames(tbl.mrna))
      long.survivors.with.mrna  <- intersect(long.survivors,  rownames(tbl.mrna))
   
      ttest.row.by.group <- function(row){
         t.test(row[short.survivors.with.mrna], row[long.survivors.with.mrna])$p.value
         }
   
      count <- count + 1
      result[[count]] <- apply(mtx, 2, ttest.row.by.group)
      mean <- mean(result[[count]])
      sd   <- sd(result[[count]])
      if(mean < 0.15 & sd < 0.2)
         printf("%50s: %5.3f, %5.3f", geneset.name, mean, sd)
      genesets.to.plot <- c("FARMER_BREAST_CANCER_CLUSTER_8",
                            "VERHAAK_GLIOBLASTOMA_PRONEURAL")
      if(geneset.name %in% genesets.to.plot){
         x11(); # quartz();
         drawHeatmap(geneset.name, genes,
                     short.survivors.with.mrna,
                     long.survivors.with.mrna,
                     mtx)
         }
       } # for geneset.name
   
   
} # dev_score
#------------------------------------------------------------------------------------------------------------------------
# participation.threshold is a new (11 feb 2015) argument to score, designed to discover genesets with
# strongly contrasting expression between the two patient groups without requiring that all members of
# the geneset be taken into account.
# for example
# x1 <- score(gstt, short.survivors, long.survivors, quiet=TRUE, byGene=TRUE,  participation.threshold=0.7, mean.threshold=0.05)
# returns these genesets:
# [1] "HETEROGENEOUS_NUCLEAR_RIBONUCLEOPROTEIN_COMPLEX" "MITOTIC_SPINDLE_ORGANIZATION_AND_BIOGENESIS"    
# [3] "MODULE_143"                                      "MODULE_293"                                     
# [5] "MOSERLE_IFNA_RESPONSE"                           "NIKOLSKY_BREAST_CANCER_10Q22_AMPLICON"          
# [7] "NOUSHMEHR_GBM_SILENCED_BY_METHYLATION"           "NUCLEAR_CHROMATIN"                              
# [9] "VERHAAK_GLIOBLASTOMA_PRONEURAL"                 
#
# just one geneset from pt=0.5, mt=0.01:
# $NIKOLSKY_BREAST_CANCER_10Q22_AMPLICON
#       DLG5       RPS24        PPIF       ZMIZ1      KCNMA1        mean          sd       count 
# 0.002777523 0.006469775 0.010673571 0.024791976 0.724522249 0.006640290 0.003950785 5.000000000 

explore_pt <- function()
{

   gsoi <- "NIKOLSKY_BREAST_CANCER_10Q22_AMPLICON"
   gstt <- GeneSetTTests()
   group1 <- shortSurvivors(20)
   group2 <- longSurvivors(20)
   nbc10a <- score(gstt, group1, group2, gsoi,
                   quiet=TRUE, byGene=TRUE,
                   participation.threshold=0.5, mean.threshold=0.01)[[1]]
   
   genes <- names(nbc10a[1:5])

   drawHeatmap(gsoi, genes, group1, group2, mtx, cluster.patients=FALSE)

   if(!exists("x1"))
      x1 <<- score(gstt, short.survivors, long.survivors, quiet=TRUE, byGene=FALSE,
                    participation.threshold=0.5, mean.threshold=0.05)



} # explore_pt
#------------------------------------------------------------------------------------------------------------------------
 if(!interactive())
    runTests()

