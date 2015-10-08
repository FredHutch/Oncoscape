#                   incoming message          function to call                 return.cmd
#                   -------------------       ----------------                -------------
addRMessageHandler("oncoprint_data_selection",     "oncoprint_data_selection")            # displayOncoprint
#----------------------------------------------------------------------------------------------------
library(SttrDataPackage)
library(TCGAgbm)
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
    
    
    printf("=== after obtaining datasets from datapackage constructor, next is processing received ws msg")
    payload_str <- msg$payload$sampleIDs
    genes_all = unique(union(union(colnames(cnv),colnames(mut)),colnames(mrna)))
    patients_all = unique(union(union(rownames(cnv),rownames(mut)),rownames(mrna)))
    if(any(payload_str %in% genes_all) && any(payload_str %in% substring(patients_all,1,12))){
        #patients <- payload_str[grepl("TCGA",payload_str)]
        #non_patients <- payload_str[!grepl("TCGA",payload_str)]
        #non_gene_strings <- c("1","2","3","4","5","6","7","8",
        #                      "9","10","11","12","13","14","15",
        #                      "16","17","18","19","20","21","22","X","Y",
        #                      "Mesenchymal","Neural","Classical","Proneural")
        #genes <- non_patients[which(!(non_patients %in% non_gene_strings))]
        patient_core_Ids <- payload_str[payload_str %in% substring(patients_all,1,12)]
        patients <- patients_all[match(patient_core_Ids,substring(patients_all,1,12))]#locate back to the original patient IDs
        genes <- payload_str[payload_str %in% genes_all]
        
        printf("=== entering into data processing")
        
        patients_cnv <- intersect(patients, rownames(cnv))
        genes_cnv <- intersect(genes, colnames(cnv))
        
        patients_mrna <- intersect(patients, rownames(mrna))
        genes_mrna <- intersect(genes, colnames(mrna))
        
        patients_mut <- intersect(patients, rownames(mut))
        genes_mut <- intersect(genes, colnames(mut))
        
        if(length(patients_cnv) > 0 && length(genes_cnv) > 0){
            
            cnv_res <- cnv[patients_cnv, genes_cnv]
            if(length(genes_cnv)==1){ #also take care of the situation with one gene and one patient
                cnv_res <- as.data.frame(cnv_res)
                printf("cnv only one gene selected")
                cnv_res_flattened <- cbind(patients_cnv,rep(genes_cnv,ncol(cnv_res)),cnv_res)
                colnames(cnv_res_flattened) <- c("sample","gene","value")
            }else if(length(patients_cnv)==1){
                cnv_res <- as.data.frame(cnv_res)
                printf("cnv only one patient selected")
                cnv_res_flattened <- cbind(rep(patients_cnv,nrow(cnv_res)),genes_cnv,cnv_res)
                colnames(cnv_res_flattened) <- c("sample","gene","value")
            }else{
                cnv_res_flattened <- melt(cnv_res, varnames=c("sample","gene"))
                printf("cnv multiple genes and multiple patients selected")
            }
            #res_flattened <- cnv_res_flattened
            cnv_res_flattened$value[which(cnv_res_flattened$value == 0)] <- NA #otherwise, oncoscape.sort()doesn't work
            cnv_res_flattened[,3] <- gsub(-1,"HEMIZYGOUSLYDELETED",cnv_res_flattened[,3])
            cnv_res_flattened[,3] <- gsub(-2,"HOMODELETED",cnv_res_flattened[,3])
            cnv_res_flattened[,3] <- gsub(2,"AMPLIFIED",cnv_res_flattened[,3])
            cnv_res_flattened[,3] <- gsub(1,"GAINED",cnv_res_flattened[,3])
        }
        
        
        if(length(patients_mrna) > 0 && length(genes_mrna) > 0){
            
            mrna_res <- mrna[patients_mrna, genes_mrna]
            if(length(genes_mrna)==1){
                mrna_res <- as.data.frame(mrna_res)
                printf("mrna only one gene selected")
                mrna_res_flattened <- cbind(patients_mrna,rep(genes_mrna,ncol(mrna_res)), mrna_res)
                colnames(mrna_res_flattened) <- c("sample","gene","value")
            }else if(length(patients_mrna)==1){
                mrna_res <- as.data.frame(mrna_res)
                printf("mrna only one patient selected")
                mrna_res_flattened <- cbind(rep(patients_mrna,nrow(mrna_res)),genes_mrna, mrna_res)
                colnames(mrna_res_flattened) <- c("sample","gene","value")
            }else{
                mrna_res_flattened <- melt(mrna_res, varnames=c("sample","gene"))
                printf("mrna multiple genes and multiple patients selected")
            }
            #res_flattened <- cbind(res_flattened,mrna_res_flattened)
            mrna_res_flattened <- mrna_res_flattened[c(which(mrna_res_flattened$value>2),which(mrna_res_flattened$value< -2)),]
            if(length(which(mrna_res_flattened$value > 2)) > 0){
                mrna_res_flattened$value[which(mrna_res_flattened$value > 2)] <- "UPREGULATED"
            }else if(length(which(mrna_res_flattened$value < -2)) > 0){
                mrna_res_flattened$value[which(mrna_res_flattened$value < -2)] <- "DOWNREGULATED"
            }
        }
        
        
        if(length(patients_mut) > 0 && length(genes_mut) > 0){
            
            mut_res <- mut[patients_mut, genes_mut]
            mut_res[is.na(mut_res)] <- ""
            if(length(genes_mut)==1){
                mut_res <- as.data.frame(mut_res)
                printf("mut only one gene selected")
                mut_res_flattened <- cbind(patients_mut,rep(genes_mut,ncol(mut_res)), mut_res)
                colnames(mut_res_flattened) <- c("sample","gene","value")
            }else if(length(patients_mut)==1){
                mut_res <- as.data.frame(mut_res)
                printf("mut only one patient selected")
                mut_res_flattened <- cbind(rep(patients_mut,nrow(mut_res)),genes_mut, mut_res)
                colnames(mut_res_flattened) <- c("sample","gene","value")
            }else{
                mut_res_flattened <- melt(mut_res, varnames=c("sample","gene"))
                mut_res_flattened[] <- lapply(mut_res_flattened, as.character)
                printf("mut multiple genes and multiple patients selected")
            }
            #res_flattened <- cbind(res_flattened,mrna_res_flattened)
            #mut_res_flattened$value <- gsub("",NA,mut_res_flattened$value)
            mut_res_flattened <- mut_res_flattened[which(mut_res_flattened$value != ""),]
            mut_res_flattened$value <- rep("MISSENSE",nrow(mut_res_flattened)) #need to update with more features, such as truncated etc.
            
        }
        
        if(T){
            if(exists("cnv_res_flattened") & dim(cnv_res_flattened)[1] > 0 & exists("mrna_res_flattened") & dim(mrna_res_flattened)[1] > 0){
                cnv_mrna_res_flattened <- merge(cnv_res_flattened, mrna_res_flattened,c('sample','gene'),all.x=T,all.y=T)
                if(exists("mut_res_flattened") & dim(mut_res_flattened)[1] > 0){
                    res_flattened <- merge(cnv_mrna_res_flattened,mut_res_flattened,c('sample','gene'),all.x=T,all.y=T)
                    colnames(res_flattened) <- c("patient","gene","cna","mrna","mut_type")
                }else{
                    res_flattened <- cnv_mrna_res_flattened
                    colnames(res_flattened) <- c("patient","gene","cna","mrna")
                }
            }else if(exists("cnv_res_flattened") & dim(cnv_res_flattened)[1] > 0 & exists("mut_res_flattened") & dim(mut_res_flattened)[1] > 0){
                res_flattened <- merge(cnv_res_flattened, mut_res_flattened,c('sample','gene'),all.x=T,all.y=T)
                colnames(res_flattened) <- c("patient","gene","cna","mut_type")
            }else if(exists("mrna_res_flattened") & dim(mrna_res_flattened)[1] > 0 & exists("mut_res_flattened") & dim(mut_res_flattened)[1] > 0){
                res_flattened <- merge(mrna_res_flattened, mut_res_flattened,c('sample','gene'),all.x=T,all.y=T)
                colnames(res_flattened) <- c("patient","gene","mrna","mut_type")
            }else if(exists("cnv_res_flattened") & dim(cnv_res_flattened)[1] > 0){
                res_flattened <- cnv_res_flattened
                colnames(res_flattened) <- c("patient","gene","cna")
            }else if(exists("mrna_res_flattened") & dim(mrna_res_flattened)[1] > 0){
                res_flattened <- mrna_res_flattened
                colnames(res_flattened) <- c("patient","gene","mrna")
            }else if(exists("mut_res_flattened") & dim(mut_res_flattened)[1] > 0){
                res_flattened <- mut_res_flattened
                colnames(res_flattened) <- c("patient","gene","mut_type")
            }
        }else if(exists("mrna_res_flattened") & dim(mrna_res_flattened)[1] > 0 & exists("mut_res_flattened") & dim(mut_res_flattened)[1] > 0){ #example to see the short data.frame merge effect, need to convert NA to 0 or  ""
            res_flattened <- merge(mrna_res_flattened, mut_res_flattened,c('sample','gene'),all.x=T,all.y=T)
            colnames(res_flattened) <- c("patient","gene","mrna","mut_type")
        }
        
        #if(any(grepl("cnv",colnames(res_flattened)))) res_flattened$cnv[is.na(res_flattened$cnv)] = 0
        #if(any(grepl("mrna", colnames(res_flattened)))) res_flattened$mrna[is.na(res_flattened$mrna)] = 0
        #if(any(grepl("mut_type",colnames(res_flattened)))) res_flattened$mut_type[is.na(res_flattened$mut_type)] = ""
        
        
        
        if(exists("res_flattened")){
            r <- jsonlite:::toJSON(res_flattened, pretty = TRUE)
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
    }else{
        res = "It seems you only selected either patients or genes, please re-select to include both information"
        printf("=== only genes or patients are selected, status failed")
        return.cmd <- msg$callback
        return.msg <- toJSON(list(cmd=return.cmd, status="failed", payload=res))
    }
    
    printf("=== before sending out result")
    ws$send(return.msg)
    
} # data_selection
#-------------------------------------------------------------------------------
