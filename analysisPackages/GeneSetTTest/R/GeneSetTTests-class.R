printf = function (...) print (noquote (sprintf (...)))
#------------------------------------------------------------------------------------------------------------------------
.GeneSetTTests <- setClass ("GeneSetTTests", 
          representation = representation (tbl.mrna="matrix",
                                           genesets="list",
                                           cancerRelatedGeneSets="character")
          )

#------------------------------------------------------------------------------------------------------------------------
GeneSetTTests <- function(sampleIDs=list(), geneSet=list(),
                         sampleDescription="", geneSetDescription="")
{
   obj <- .GeneSetTTests()
   file <- system.file(package="GeneSetTTests", "extdata", "tbl.mrnaUnified.315patients.11864genes.RData")
   stopifnot(file.exists(file))
   load(file)
   obj@tbl.mrna <- tbl.mrna

   file <- system.file(package="GeneSetTTests", "extdata", "msigdb.RData")
   load(file)
   obj@genesets <- genesets
   obj@cancerRelatedGeneSets <- .discoverCancerRelatedGeneSets(genesets)

   obj

} # GeneSetTTest constructor
#------------------------------------------------------------------------------------------------------------------------
setGeneric('getExpressionData',     signature='obj', function(obj) standardGeneric ('getExpressionData'))
setGeneric('getGeneSets',           signature='obj', function(obj) standardGeneric ('getGeneSets'))
setGeneric('getGeneSetNames',       signature='obj', function(obj) standardGeneric ('getGeneSetNames'))
setGeneric('getGeneSetLengths',     signature='obj', function(obj) standardGeneric ('getGeneSetLengths'))
setGeneric("score",                 signature='obj',
       function(obj, group1, group2, geneset.names=NA, byGene=TRUE,
                mean.threshold=1.0, participation.threshold=1.0, quiet=TRUE) standardGeneric ('score'))
setGeneric("cancerRelatedGeneSets", signature='obj', function(obj) standardardGeneric('cancerRelatedGeneSets'))
setGeneric("drawHeatmap", signature='obj',
       function(obj, geneset.name,  group1, group2,cluster.patients=FALSE) standardGeneric('drawHeatmap'))
#------------------------------------------------------------------------------------------------------------------------
setMethod ('getExpressionData', signature = 'GeneSetTTests',
  function (obj) { 
    invisible(obj@tbl.mrna)
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod ('getGeneSets', signature = 'GeneSetTTests',
  function (obj) { 
    invisible(obj@genesets)
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod ('getGeneSetNames', signature = 'GeneSetTTests',
  function (obj) { 
    names(obj@genesets)
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod ('getGeneSetLengths', signature = 'GeneSetTTests',
  function (obj) { 
    lapply(obj@genesets, length)
    })

#------------------------------------------------------------------------------------------------------------------------
.discoverCancerRelatedGeneSets <- function(genesets)
{
   gliomas <- grep("GLIOMA", names(genesets), ignore.case=TRUE, value=TRUE)
   cancers <-grep("CANCER", names(genesets), ignore.case=TRUE, value=TRUE)
   pathways <-grep("PATHWAY", names(genesets), ignore.case=TRUE, value=TRUE)
   methylation <-grep("METHYLATION", names(genesets), ignore.case=TRUE, value=TRUE)

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


   return(sort(unique(c(gliomas, cancers, pathways, methylation, additional))))


} # .discoverCancerRelatedGenesets
#------------------------------------------------------------------------------------------------------------------------
setMethod ('cancerRelatedGeneSets', signature = 'GeneSetTTests',
  function (obj) { 
    obj@cancerRelatedGeneSets
    })

#------------------------------------------------------------------------------------------------------------------------
setMethod("score", signature = "GeneSetTTests",

function (obj, group1, group2, geneset.names=NA, byGene=TRUE,mean.threshold=1.0, participation.threshold=1.0, quiet=TRUE) {
    if(all(is.na(geneset.names)))
    geneset.names <- c(cancerRelatedGeneSets(obj), getGeneSetNames(obj))#geneset.names <- cancerRelatedGeneSets(obj)
    result <- vector(mode="list", length=length(geneset.names))
    count <- 0
    mtx.full <- getExpressionData(obj)
    #geneset.names_o <- cancerRelatedGeneSets(obj)
    #geneset.names <- geneset.names_o[1:1000]
    #1-10: 0.088   0.032   1.825
    #1-100: 0.343   0.042   2.082
    #900-1000: 0.371   0.047   2.169
    #1-1000: 3.206   0.402   5.538
    # june 17th: case I
    # group1 <- rownames(mtx.full)[1:150]; group2 <- rownames(mtx.full)[151:315]
    # geneset.name <- geneset.names[1107]
    # 0.007   0.010   0.121
    # case II
    # total patients: 25; running through 10295 genesets)
    # #Get 10295 geneset names
    # geneset.names <- getGeneSetNames(obj)
    # five warnings: chr4p11, chr21p11, CAFFAREL_RESPONSE_TO_THC_8HR_3_UP, FIGUEROA_AML_METHYLATION_CLUTER_7_DN and CHENG_TAF7L_TARGETS
    # user  system elapsed     39.686   2.103  43.711
    # user  system elapsed(1101 cancer genesets)     4.334   0.285   6.575
    # genesets: 10295, group1 1:150, group2 151:315: 76.061  11.346  89.970
    
    # Experiment with apply to entire mtx.full
    # geneset.names <- c(cancerRelatedGeneSets(obj), getGeneSetNames(obj))
    mtx <- mtx.full[rownames(mtx.full) %in% c(group1, group2),]
    mtx_pval <- rowFtests(t(mtx),factor(rownames(mtx) %in% group1),var.equal=FALSE)$p.value
    for(geneset.name in geneset.names){
        genes <- getGeneSets(obj)[[geneset.name]]
        count <- count + 1
        if(all(!genes %in% colnames(mtx.full))) result[[count]] <- NA
        else{
            pvals.by.gene <- sort(mtx_pval[match(genes,colnames(mtx.full))])
            
            keepers <- 1:length(pvals.by.gene)
            # but user can request just the best fraction of the pvals
            if(participation.threshold < 1.0){
                keepers.max <- as.integer(ceiling(length(pvals.by.gene) * participation.threshold))
                keepers <- 1:keepers.max
            } # identify only the lowest pvals
            #browser()
            pvals.subset <- pvals.by.gene[keepers]
            mean <- mean(pvals.subset)
            sd   <- sd(pvals.subset)
            if(mean > mean.threshold){
                result[[count]] <- NA
            }else{
                result[[count]] <- c(pvals.by.gene, mean=mean, sd=sd, count=length(pvals.by.gene))
            } # else: mean pvalue meets threshold
            # else: a good trimmed matrix (trimmed from full matrix) was found
            names(result)[count] <- geneset.name
        }
    }
    
    deleters <- which(is.na(result))
    if(length(deleters) > 0)
    result <- result[-deleters]
    
    result
    
}) # score

#------------------------------------------------------------------------------------------------------------------------
# create a trimmed-down matrix with only the genes and samples suppled to the score method
# 
.trimMatrix <- function(tbl.mrna, sampleIDs, geneNames, geneset.name="", quiet=TRUE)
{
   overlapping.sampleIDs <- intersect(sampleIDs, rownames(tbl.mrna))
   overlapping.genes <- intersect(geneNames, colnames(tbl.mrna))
   
   if(length(overlapping.sampleIDs) == 0){
      warning(sprintf("no matching sampleIDs in tbl.mrna for %s", geneset.name));
      return(NA)
      }
   if (length(overlapping.genes) < 2) {
      warning(sprintf("no or only one matching gene in tbl.mrna for %s", geneset.name));
      return(NA)
      }
   
   mtx.trimmed <- tbl.mrna[overlapping.sampleIDs, overlapping.genes];
   msg <- sprintf("found %d/%d overlapping samples in the expession data, %d/%d overlapping genes in %s",
                  nrow(mtx.trimmed), length(sampleIDs), ncol(mtx.trimmed), length(geneNames), geneset.name)
   if(!quiet)
      message(msg)
   
   invisible(mtx.trimmed)
   
} # .trimMatrix
#------------------------------------------------------------------------------------------------------------------------
setMethod("drawHeatmap", signature = "GeneSetTTests",

    function(obj, geneset.name, group1, group2,cluster.patients=FALSE){
      tbl.mrna <- getExpressionData(obj)
      genes <- getGeneSets(obj)[[geneset.name]]
      mtx <- GeneSetTTests:::.trimMatrix(tbl.mrna, c(group1, group2), genes, geneset.name)
      group1.known <- intersect(group1, rownames(mtx))
      group2.known <- intersect(group2, rownames(mtx))
      colors <- colorRampPalette (c ('green', 'white', 'red')) (10)   # built in, namespace:grDevices
      predefined.class.index <- c(rep(1, length(group1.known)), rep(2, length(group2.known)))
      rowIndividualColors <- c("magenta", "blue")[c(predefined.class.index)]
      my.colors <- function (x) {colorRampPalette (c ('green', 'white', 'red')) (x)}

      heatmap.3(mtx,
                scale="column",
                color.FUN=my.colors,
                RowIndividualColors=rowIndividualColors,
                main=geneset.name,
                Rowv=FALSE,
                dendrogram="col",
                cluster.by.col=TRUE, 
                srtCol=45)
      })  # drawHeatmap    
#----------------------------------------------------------------------------------------------------

