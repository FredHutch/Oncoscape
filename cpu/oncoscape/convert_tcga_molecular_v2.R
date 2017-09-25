library(jsonlite)
library(mongolite)

db <- "tcga"
user="oncoscape"
#password = Sys.getenv("dev_oncoscape_pw")
host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017",sep="")


lookup = mongo("lookup_oncoscape_datasources", db="tcga", url=host)
dataType = mongo("lookup_dataTypes", db="tcga", url=host)


datasets = lookup$find()
datatypes = dataType$find()
hugo_sample_types = subset(datatypes, schema == "hugo_sample")

### Use cursor to copy over rows for each dataset from TCGA db
# for(i in 1:nrow(datasets)){
#   ds = datasets[i,]
#   print(ds$disease)
#   mol_df = subset(ds$molecular[[1]], type %in% hugo_sample_types$dataType)
#   print(nrow(mol_df))
#   for(j in 1:nrow(mol_df)){
#     mol = mol_df[j,]
#     if(mongo(mol[["collection"]],db="v2", url=host)$count() == 0)
#       iterate_transformation(mol[["collection"]], in_db="tcga", out_db="v2")
#   }
# }

mol_df = fromJSON("~/Desktop/Oncoscape/cpu/oncoscape/tcga_molecular_lookup.json")
mol_df = subset(mol_df, schema == "hugo_sample")

# ### Copy individual Molecular tables of Hugo_Sample type into common molecular collection
#   for(j in 1:nrow(mol_df)){
#     mol = mol_df[j,]
#     m_type = "hugo"
#     if(grepl( "protein", mol[["name"]]))
#       m_type = "protein"
    
#     print(mol[["collection"]])
#     # Original data not yet copied over
#     if(nrow(mongo(paste(mol[["dataset"]],"_molecular_matrix",sep=""),db="v2", url=host)$find(toJSON(list("name"=mol[["name"]]),auto_unbox=T), limit=1)) == 0) { # data not copied into molecular table
#       iterate_transformation(mol[["collection"]],paste(mol$dataset, "molecular_matrix", sep="_") ,mol[["name"]] ,mol[["type"]], in_db="tcga", out_db="v2")
#     }
#     mongo(paste(mol[["dataset"]],"_molecular_matrix",sep=""), db="v2",url=host)$index(toJSON(list("name"=1, "m"=1), auto_unbox = T))
#   }


### Copy over clinical tables
for(i in 1:nrow(datasets)){
  ds = datasets[i,]
  print(ds$disease)
  out_collection_name = paste(ds$disease, "phenotype",sep="_")
  # for(j in 1:length(ds$clinical)){
  #   print(names(ds$clinical[j]))
  #   if(names(ds$clinical[j]) %in% c("samplemap", "patient", "events"))
  #     next
  #   con = mongo(ds$clinical[[j]],db="tcga", url=host)
  #   cursor = con$iterate()
  #   if(names(ds$clinical[j]) %in% c("diagnosis")){
  #     while(!is.null(x <- cursor$one())){
  #         names(x) = gsub("\\.", "\\-", names(x))
  #         mongo(out_collection_name, db="v2",url=host)$update(toJSON(list("patient_ID"=x$patient_ID),auto_unbox=T), gsub("\\{\\}","null",toJSON(list("$set"= x), auto_unbox=T)), upsert= TRUE)
  #     }
  #   } else{
  #     category = gsub("\\s+","_",names(ds$clinical[j]))
  #     eventID = "followup"
  #     if(category =="drug" ){ eventID = "drug"
  #     } else if(category =="radiation" ){ eventID = "radiation"
  #     } else if(category =="other_malignancy" ){ eventID = "omf"}
  #     while(!is.null(x <- cursor$one())){
  #         names(x) = gsub("\\.", "\\-", names(x))
          
  #         y = list(); query = list("patient_ID"=x$patient_ID); query[[category]]= list("$exists"=TRUE)
  #         res = mongo(out_collection_name, db="v2",url=host)$find(toJSON(query,auto_unbox=T))
          
  #         if(nrow(res) > 0 ){
  #           uid_col = paste("bcr",eventID,"barcode", sep="_")
  #           if(category != "new_tumor" && x[uid_col] %in% unlist(res[[category]][[1]][uid_col]))
  #             next; #event item already inserted
  #           currVal <- apply(res[[category]][[1]],1, function(x) as.list(x)); 
  #           currVal[[length(currVal)+1]] =x
  #           names(currVal) <- NULL
  #           y[[category]]=currVal
  #         } else { 
  #           y[[category]] = list(x) }
  #         mongo(out_collection_name, db="v2",url=host)$update(toJSON(list("patient_ID"=x$patient_ID),auto_unbox=T), gsub("\\{\\}","null",toJSON(list("$set"= y), auto_unbox=T)), upsert= TRUE)
  #     }
  #   }
  # }
    
   clin_json = list("dataset"= ds$disease, "req"=list("patient_id"="patient_ID","days_to_death"="days_to_death","days_to_last_followup"="days_to_last_follow_up" ), schema="clinical")
   write(toJSON(clin_json, auto_unbox=T),'~/Desktop/Oncoscape/cpu/oncoscape/tcga_clinical_lookup.json', append=T);
}

### Copy over cluster collections for cached lookup
# for(i in 1:nrow(datasets)){
#   ds = datasets[i,]
#   print(ds$disease)
#   collection_name = paste(ds$disease, "cluster",sep="_")
#   con = mongo(collection_name,db="tcga", url=host)
#   cursor = con$iterate()
#   while(!is.null(x <- cursor$one())){
#     mongo(collection_name, db="v2",url=host)$insert(toJSON(x, auto_unbox=T))
#   }
# }

###### FUNCTIONS ######


iterate_transformation <- function(in_collection_name,out_collection_name, name, type, in_db, out_db){
  con = mongo(in_collection_name, db=in_db, url=host)
  cursor = con$iterate()
  print(paste(in_collection_name,Sys.time()))
  then = Sys.time()
  while(!is.null(x <- cursor$one())){
    rec = list(name=name , m=x$id, m_type=m_type, s=names(x$data), d=as.numeric(x$data), d_type=type)
    #rec = list(name=name , m=x$id, d=as.numeric(x$data))
    mongo(out_collection_name, db=out_db,url=host)$insert(toJSON(rec, auto_unbox=T))
  }
  print(Sys.time() -then)
  
}

### 
# transform_molecular <- function(collection_name, db){
#   con = mongo(collection_name, db=db, url=host)
#   data = con$find()
#   d = lapply(1:nrow(data$data), function(i){ list(id=data[i,"id"], m=names(data$data[i,]), d=as.numeric(data$data[i,]))})
#   return(d)
# }

# write_collection <- function(data, collection_name, db){
#   lapply(data, function(rec){mongo(collection_name, db=db,url=host)$insert(toJSON(rec,auto_unbox=T))})
# }
