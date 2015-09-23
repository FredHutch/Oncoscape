#                   incoming message          function to call                 return.cmd
#                   -------------------       ----------------                -------------
addRMessageHandler("cnv_data_selection",     "cnv_data_selection")            # displayOncoprint
#----------------------------------------------------------------------------------------------------
library(SttrDataPackage)
library(TCGAgbm)
cnv_data_selection <- function(ws, msg)
{
   printf("=== entering cnv_data_selection")

   currentDataSet <- state[["currentDatasetName"]]
   gbm <- TCGAgbm()
   cnv <- SttrDataPackage:::matrices(gbm)$mtx.cn
   #mut <- SttrDataPackage:::matrices(currentDataSet)$mtx.mut
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

   
   
   
   
   if(length(patients_processed_cnv)> 0 && length(genes_processed_cnv)>0){
           if(length(genes)==1){
               cnv_res <- cnv[pos_cnv, genes_processed_cnv]
               cnv_res <- as.data.frame(cnv_res)
               colnames(cnv_res) <- genes
               printf("test31")
               cnv_res_m <- cbind(rownames(cnv_res),melt(cnv_res))
               colnames(cnv_res_m) <- c("sample","gene","value")
               
               mrna_res <- cnv[pos_mrna, genes_processed_mrna]
               mrna_res <- as.data.frame(mrna_res)
               colnames(mrna_res) <- genes
               printf("test31-mrna")
               mrna_res_m <- cbind(rownames(mrna_res),melt(mrna_res))
               colnames(mrna_res_m) <- c("sample","gene","value")
              
               res_m <- rbind(cnv_res_m,mrna_res_m)
           }else{
               cnv_res <- cnv[pos_cnv, genes]
               cnv_res_m <- melt(cnv_res, varnames=c("sample","gene"))
               printf("test312")
               
               mrna_res <- cnv[pos_mrna, genes]
               mrna_res_m <- melt(mrna_res, varnames=c("sample","gene"))
               printf("test312-mrna")
               
               res_m <- rbind(cnv_res_m,mrna_res_m)
           }
           r <- jsonlite:::toJSON(res_m, pretty = TRUE)
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
