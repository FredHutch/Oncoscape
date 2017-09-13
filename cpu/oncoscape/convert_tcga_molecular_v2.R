library(jsonlite)
library(mongolite)

db <- "tcga"
user="oncoscape"
password = Sys.getenv("dev_oncoscape_pw")
host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017",sep="")


lookup = mongo("lookup_oncoscape_datasources", db="tcga", url=host)
dataType = mongo("lookup_dataTypes", db="tcga", url=host)

datasets = lookup$find()
datatypes = dataType$find()

hugo_sample_types = subset(datatypes, schema == "hugo_sample")

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

iterate_transformation <- function(collection_name, in_db, out_db){
  con = mongo(collection_name, db=in_db, url=host)
  cursor = con$iterate()
  print(paste(collection_name,Sys.time()))
  then = Sys.time()
  while(!is.null(x <- cursor$one())){
    rec = list(id=x$id, m=names(x$data), d=as.numeric(x$data))
    mongo(collection_name, db=out_db,url=host)$insert(toJSON(rec, auto_unbox=T))
  }
  print(Sys.time() -then)
  
}

for(i in 1:nrow(datasets)){
  ds = datasets[i,]
  print(ds$disease)
  collection_name = paste(ds$disease, "cluster",sep="_")
  con = mongo(collection_name,db="tcga", url=host)
  cursor = con$iterate()
  while(!is.null(x <- cursor$one())){
    mongo(collection_name, db="v2",url=host)$insert(toJSON(x, auto_unbox=T))
  }
}


# transform_molecular <- function(collection_name, db){
#   con = mongo(collection_name, db=db, url=host)
#   data = con$find()
#   d = lapply(1:nrow(data$data), function(i){ list(id=data[i,"id"], m=names(data$data[i,]), d=as.numeric(data$data[i,]))})
#   return(d)
# }

# write_collection <- function(data, collection_name, db){
#   lapply(data, function(rec){mongo(collection_name, db=db,url=host)$insert(toJSON(rec,auto_unbox=T))})
# }
