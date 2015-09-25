#                   incoming message          function to call                 return.cmd
#                   -------------------       ----------------                -------------
addRMessageHandler("oncoprint_data_selection",     "oncoprint_data_selection")            # displayOncoprint
#----------------------------------------------------------------------------------------------------
library(SttrDataPackage)
library(TCGAgbm)
oncoprint_data_selection <- function(ws, msg)
{
   printf("=== entering oncoprint_data_selection")

   currentDataSet <- state[["currentDatasetName"]]
   gbm <- TCGAgbm()
   cnv <- SttrDataPackage:::matrices(gbm)$mtx.cn
   mut <- SttrDataPackage:::matrices(gbm)$mtx.mut
   mrna <- SttrDataPackage:::matrices(gbm)$mtx.mrna
  
   
   printf("test1")
   #patients <- msg$payload$sampleIDs
   #gene <- msg$payload$gene
   payload_str <- msg$payload$sampleIDs
   patients <- payload_str[grepl("TCGA",payload_str)]
   non_patients <- payload_str[!grepl("TCGA",payload_str)]
   non_gene_strings <- c("1","2","3","4","5","6","7","8",
                         "9","10","11","12","13","14","15",
                         "16","17","18","19","20","21","22","X","Y",
                         "Mesenchymal","Neural","Classical","Proneural")
   genes <- non_patients[which(!(non_patients %in% non_gene_strings))]
   
   printf("test2")
   
   patients_processed_cnv <- intersect(patients, substring(rownames(cnv),1,12))
   pos_cnv <- match(patients_processed_cnv,substring(rownames(cnv),1,12))
   genes_processed_cnv <- intersect(genes, colnames(cnv))
   
   patients_processed_mrna <- intersect(patients, substring(rownames(mrna),1,12))
   pos_mrna <- match(patients_processed_mrna,substring(rownames(mrna),1,12))
   genes_processed_mrna <- intersect(genes, colnames(mrna))

   patients_processed_mut <- intersect(patients, substring(rownames(mut),1,12))
   pos_mut <- match(patients_processed_mut,substring(rownames(mut),1,12))
   genes_processed_mut <- intersect(genes, colnames(mut))

   res_m <- list()
   
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
                   mrna_res_m <- cbind(rep(rownames(mrna)[pos_mrna],nrow(mrna_res)),rownames(mrna_res),mut_res,rep("mrna",nrow(mrna_res)))
                   colnames(mrna_res_m) <- c("sample","gene","value","datatype")
               }else{
                   mrna_res_m <- melt(mrna_res, varnames=c("sample","gene"))
                   mrna_res_m <- cbind(mrna_res_m,datatype = rep("mrna", nrow(mrna_res_m)))
                   printf("test313-mrna")
               }
               res_m <- rbind(res_m,mrna_res_m)
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
    }
    
    
    if(nrow(res_m)>0){
           r <- jsonlite:::toJSON(res_m, pretty = TRUE)
           #res = list(r,genes)
           res = list(cnv_res_m,mrna_res_m, mut_res_m,genes)
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
