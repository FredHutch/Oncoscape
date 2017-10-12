library(jsonlite)
library(mongolite)

db <- "tcga"
user="oncoscape"
#password = Sys.getenv("dev_oncoscape_pw")
host<- paste("mongodb://",user,":",password,"@oncoscape-dev-db1.sttrcancer.io:27017,oncoscape-dev-db2.sttrcancer.io:27017,oncoscape-dev-db3.sttrcancer.io:27017",sep="")


mol_df = fromJSON("~/Desktop/Oncoscape/cpu/oncoscape/tcga_molecular_lookup.json")

mol_df = subset(mol_df, schema == "hugo_sample")
mol_df = subset(mol_df, dataset %in% c("brain", "gbm", "lgg", "brca"))


### Use aggregate fn in Mongo to copy collections into new format
for(j in 1:nrow(mol_df)){
    mol = mol_df[j,]
    m_type = "hugo"
    if(grepl( "protein", mol[["name"]]))
      m_type = "protein"
    print(mol[["collection"]])
    
    # Original data not yet copied over into combined molecular collection
    merge_collection_name = paste(mol[["dataset"]], "molecular_matrix", sep="_")
    idx = mongo(merge_collection_name, db="tcga", url=host)$index()
    if(! "name" %in% idx$name)
      mongo(merge_collection_name, db="tcga", url=host)$index(add="name")
    
    finddocs = toJSON(list("name"=mol[["name"]]),auto_unbox=T)
    if(nrow(mongo(merge_collection_name,db="tcga", url=host)$find(finddocs, limit=1)) == 0) { 
        
      # copy over into distinct collection, if not already there
        out_collection_name = gsub("tcga_", "", mol[["collection"]])
        if(mongo(out_collection_name,db="tcga", url=host)$count() == 0)
          copy_samedb_transformation(in_collection_name=mol[["collection"]],out_collection_name, name=mol[["name"]], type=mol[["type"]], m_type=m_type, db="tcga")
      
      ###NO NO NO  # then copy documents into merged collection --- DOESN"T WORK - $out clobbers previous insert
#        mongo(out_collection_name, db="tcga", url=host)$aggregate(
#          toJSON(list(list("$out"=merge_collection_name)), auto_unbox = T)
#        )
    }
    
}

lookup = mongo("lookup_oncoscape_datasources", db="tcga", url=host)
datasets = lookup$find()
datasets = subset(datasets, disease %in% c("brca", "lgg", "gbm", "brain"))


### Copy over clinical tables
for(i in 1:nrow(datasets)){
  ds = datasets[i,]
  print(ds$disease)
  out_collection_name = paste(ds$disease, "phenotype",sep="_")
  collections = sort(ds$clinical)  #hack so diagnosis is first and '$out' doesn't clobber others
  
  for(j in 1:length(collections)){
    print(names(collections[j]))
    if(names(collections[j]) %in% c("samplemap", "patient", "events"))
      next
 
    if(names(collections[j]) %in% c("diagnosis")){
      con = mongo(collections[[j]],db="tcga", url=host)
      cmds = list(list("$out"=out_collection_name))
      con$aggregate(toJSON(cmds, auto_unbox=T))
    } else{
      con = mongo(out_collection_name,db="tcga", url=host)
      cmds = list(
        list("$lookup"= list(
          "from"= collections[[j]],
          "localField"= "patient_ID",
          "foreignField"= "patient_ID",
          "as"= names(collections[j])
          )),
        list("$out"=out_collection_name))
       
      con$aggregate(toJSON(cmds, auto_unbox=T))
      
    }
  }
    
   clin_json = list("dataset"= ds$disease, 
                    "req"=list( "patient_id"="patient_ID",
                                "days_to_death"="days_to_death",
                                "days_to_last_followup"="days_to_last_follow_up",
                                "status_vital"="status_vital" ), schema="clinical")
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
copy_samedb_transformation <- function(in_collection_name,out_collection_name, name, type,m_type, db){
  con = mongo(in_collection_name, db=db, url=host)
  el = con$find(limit=1)
  smpls = names(el$data)
  print(paste(in_collection_name,Sys.time()))
  then = Sys.time()
  
  query = list("$project"= list( "m"= "$id", d= paste("$data", smpls, sep=".")))
  cmd = list(query,list("$out"=out_collection_name))
  mongo(in_collection_name, db=db,url=host)$aggregate(toJSON(cmd, auto_unbox=T))
  
  constants = list("$set"= list("name"=name,"m_type"=m_type,s=smpls, d_type=type))
  mongo(out_collection_name, db=db,url=host)$update(query="{}",update=toJSON(constants, auto_unbox=T), multiple=T)
  
  print(Sys.time() -then)
  
}

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
