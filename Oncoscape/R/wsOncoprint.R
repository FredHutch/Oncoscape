#                   incoming message          function to call                 return.cmd
#                   -------------------       ----------------                -------------
addRMessageHandler("oncoprint_data_selection",     "oncoprint_data_selection")            # displayOncoprint
#----------------------------------------------------------------------------------------------------
oncoprint_data_selection <- function(ws, msg)
{
   printf("=== entering oncoprint_data_selection")

   currentDataSetName <- state[["currentDatasetName"]]
   ds <- state[[currentDataSetName]];
   ds.matrices = SttrDataPackage:::matrices(ds)
   cnv <- ds.matrices$mtx.cn
   mut <- ds.matrices$mtx.mut
   if("mtx.mrna" %in% names(ds.matrices)){
   	mrna <- ds.matrices$mtx.mrna
   }else{    	mrna <- ds.matrices$mtx.mrna.bc }
    
   printf("test1")
   payload_str <- msg$payload$sampleIDs
   patients <- payload_str[grepl("TCGA",payload_str)]
   non_patients <- payload_str[!grepl("TCGA",payload_str)]
   non_gene_strings <- c("chr1","chr2","chr3","chr4","chr5","chr6","chr7","chr8",
                         "chr9","chr10","chr11","chr12","chr13","chr14","chr15",
                         "chr16","chr17","chr18","chr19","chr20","chr21","chr22","chrX","chrY",
						 "chr1q","chr2q","chr3q","chr4q","chr5q","chr6q","chr7q","chr8q",
                         "chr9q","chr10q","chr11q","chr12q","chr13q","chr14q","chr15q",
                         "chr16q","chr17q","chr18q","chr19q","chr20q","chr21q","chr22q","chrXq","chrYq",
						 "chr1p","chr2p","chr3p","chr4p","chr5p","chr6p","chr7p","chr8p",
                         "chr9p","chr10p","chr11p","chr12p","chr13p","chr14p","chr15p",
                         "chr16p","chr17p","chr18p","chr19p","chr20p","chr21p","chr22p","chrXp","chrYp",
                         "1","2","3","4","5","6","7","8",
                         "9","10","11","12","13","14","15",
                         "16","17","18","19","20","21","22","X","Y",
                         "Mesenchymal","Neural","Classical","Proneural",
                         "start.1","start.2","start.3","start.4","start.5","start.6","start.7","start.8",
                         "start.9","start.10","start.11","start.12","start.13","start.14","start.15",
                         "start.16","start.17","start.18","start.19","start.20","start.21","start.22","start.X","start.Y",
                         "end.1","end.2","end.3","end.4","end.5","end.6","end.7","end.8",
                         "end.9","end.10","end.11","end.12","end.13","end.14","end.15",
                         "end.16","end.17","end.18","end.19","end.20","end.21","end.22","end.X","end.Y")

   genes <- non_patients[which(!(non_patients %in% non_gene_strings))]
   
   printf("removed start end values")
   
   patients_processed_cnv <- intersect(patients, substring(rownames(cnv),1,12))
   pos_cnv <- match(patients_processed_cnv,substring(rownames(cnv),1,12))
   genes_processed_cnv <- intersect(genes, colnames(cnv))
   
   patients_processed_mrna <- intersect(patients, substring(rownames(mrna),1,12))
   pos_mrna <- match(patients_processed_mrna,substring(rownames(mrna),1,12))
   genes_processed_mrna <- intersect(genes, colnames(mrna))

   patients_processed_mut <- intersect(patients, substring(rownames(mut),1,12))
   pos_mut <- match(patients_processed_mut,substring(rownames(mut),1,12))
   genes_processed_mut <- intersect(genes, colnames(mut))
   
   all_samples <- unique(union(union(rownames(cnv)[pos_cnv],rownames(mrna)[pos_mrna]),rownames(mut)[pos_mut]))
   res_m <- list()
   merge(all_samples,genes) -> col2
   cbind(col2,cna=rep(NA,nrow(col2)),mrna=rep(NA,nrow(col2)),mut=rep(NA,nrow(col2)))->col5
   colnames(col5) <- c("patient","gene","cna","mrna","mut_type")
   
   
   if(length(patients_processed_cnv)> 0 && length(genes_processed_cnv)>0){
       
               cnv_res <- cnv[pos_cnv, genes_processed_cnv]
               if(length(genes_processed_cnv)==1){
                   cnv_res <- as.data.frame(cnv_res)
                   rownames(cnv_res) <- rownames(cnv)[pos_cnv]
                   colnames(cnv_res) <- genes_processed_cnv
                   printf("test311-cnv")
                   cnv_res_m <- cbind(rownames(cnv_res),rep(genes_processed_cnv,nrow(cnv_res)),cnv_res,rep("cnv",nrow(cnv_res)))
                   colnames(cnv_res_m) <- c("sample","gene","value","datatype")
               }else if(length(pos_cnv)==1){
                   cnv_res <- as.data.frame(cnv_res)
                   printf("test312-cnv")
                   cnv_res_m <- cbind(rownames(cnv_res),rep(genes_processed_cnv,nrow(cnv_res)),cnv_res,rep("cnv",nrow(cnv_res)))
                   colnames(cnv_res_m) <- c("sample","gene","value","datatype")
               }else{
                   cnv_res_m <- melt(cnv_res, varnames=c("sample","gene"))
                   cnv_res_m <- cbind(cnv_res_m,datatype = rep("cnv", nrow(cnv_res_m)))
                   printf("test313-cnv")
               }
               res_m <- cnv_res_m
               cnv_res_m <- cnv_res_m[which(cnv_res_m$value != 0),]
               
   }
   
   if(length(patients_processed_mrna)> 0 && length(genes_processed_mrna)>0){
               mrna_res <- mrna[pos_mrna, genes_processed_mrna]
               if(length(genes_processed_mrna)==1){
                   mrna_res <- as.data.frame(mrna_res)
                   rownames(mrna_res) <- rownames(mrna)[pos_mrna]
                   colnames(mrna_res) <- genes_processed_mrna
                   printf("test311-mrna")
                   mrna_res_m <- cbind(rownames(mrna_res),rep(genes_processed_mrna,nrow(mrna_res)),mrna_res,rep("mrna",nrow(mrna_res)))
                   colnames(mrna_res_m) <- c("sample","gene","value","datatype")
               }else if(length(pos_mrna)==1){
                   mrna_res <- as.data.frame(mrna_res)
                   printf("test312-mrna")
                   mrna_res_m <- cbind(rep(rownames(mrna)[pos_mrna],nrow(mrna_res)),rownames(mrna_res),mrna_res,rep("mrna",nrow(mrna_res)))
                   colnames(mrna_res_m) <- c("sample","gene","value","datatype")
               }else{
                   mrna_res_m <- melt(mrna_res, varnames=c("sample","gene"))
                   mrna_res_m <- cbind(mrna_res_m,datatype = rep("mrna", nrow(mrna_res_m)))
                   printf("test313-mrna")
               }
               res_m <- rbind(res_m,mrna_res_m)
               mrna_res_m <- mrna_res_m[which(mrna_res_m$value>2 | mrna_res_m$value <2),]
    }
   
   if(length(patients_processed_mrna)> 0 && length(genes_processed_mrna)>0){
          
               mut_res <- mut[pos_mut, genes_processed_mut]
               
               if(length(genes_processed_mut)==1){
                   mut_res <- as.data.frame(mut_res)
                   rownames(mut_res) <- rownames(mut)[pos_mut]
                   colnames(mut_res) <- genes_processed_mut
                   printf("test311-mut")
                   mut_res_m <- cbind(rownames(mut_res),rep(genes_processed_mut,nrow(mut_res)),mut_res,rep("mutation",nrow(mut_res)))
                   colnames(mut_res_m) <- c("sample","gene","value","datatype")
               }else if(length(pos_mut)==1){
                   mut_res <- as.data.frame(mut_res)
                   printf("test312-mut")
                   mut_res_m <- cbind(rep(rownames(mut)[pos_mut],nrow(mut_res)),rownames(mut_res),mut_res,rep("mutation",nrow(mut_res)))
                   colnames(mut_res_m) <- c("sample","gene","value","datatype")
               }else{
                   mut_res_m <- melt(mut_res, varnames=c("sample","gene"))
                   mut_res_m <- cbind(mut_res_m,datatype = rep("mutation", nrow(mut_res_m)))
                   printf("test313-mut")
               }
               res_m <- rbind(res_m,mut_res_m)
               mut_res_m <- mut_res_m[mut_res_m$value != "",]
    }
    
    col5[] <- lapply(col5, as.character)
   
        if(exists("cnv_res_m")){
            cnv_res_m[] <- lapply(cnv_res_m, as.character)
            for(i in 1:nrow(cnv_res_m)){
                single_sample = cnv_res_m$sample[i]
                single_gene = cnv_res_m$gene[i]
                if(cnv_res_m[i,3] == 2) col5[col5$patient== single_sample&col5$gene==single_gene,3] = "AMPLIFIED"
                if(cnv_res_m[i,3] == 1) col5[col5$patient== single_sample&col5$gene==single_gene,3] = "GAINED"
                if(cnv_res_m[i,3] == -1) col5[col5$patient== single_sample&col5$gene==single_gene,3] = "HEMIZYGOUSLYDELETED"
                if(cnv_res_m[i,3] == -2) col5[col5$patient== single_sample&col5$gene==single_gene,3] = "HOMODELETED"
            }
        }
        if(exists("mrna_res_m")){
            mrna_res_m[] <- lapply(mrna_res_m, as.character)
            for(i in 1:nrow(mrna_res_m)){
                single_sample = mrna_res_m[i,1]
                single_gene = mrna_res_m[i,2]
                if((!is.na(mrna_res_m[i,3])) & mrna_res_m[i,3] > 2) col5[col5$patient== single_sample&col5$gene==single_gene,4] = "UPREGULATED"
                if((!is.na(mrna_res_m[i,3])) & mrna_res_m[i,3] < -2) col5[col5$patient== single_sample&col5$gene==single_gene,4] = "DOWNREGULATED"
             }
          }
        if(exists("mut_res_m")){
            mut_res_m[] <- lapply(mut_res_m, as.character)
            for(i in 1:nrow(mut_res_m)){
                single_sample = mut_res_m[i,1]
                single_gene = mut_res_m[i,2]
                if(mut_res_m[i,3] != "") col5[col5$patient== single_sample&col5$gene==single_gene,5] = "MISSENSE"
             }
        }
            
    
    
    if(nrow(res_m)>0){
           r <- jsonlite:::toJSON(col5, pretty = TRUE)
           #res = list(r,genes)
           res = list(r,genes)
           printf("=== printing result json file")
           return.cmd <- msg$callback
           return.msg <- toJSON(list(cmd=return.cmd, status="success", payload=toJSON(res)))
    }else{
           res = "No overlapping patients or genes within dataset, please re-select"
           printf("=== printing result json file, result is a string")
           return.cmd <- msg$callback
           return.msg <- toJSON(list(cmd=return.cmd, status="success", payload=res))
    }

   printf("=== before sending out result")
   ws$send(return.msg)

} # data_selection
#-------------------------------------------------------------------------------
