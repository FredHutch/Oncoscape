library(jsonlite)
options(stringsAsFactors=FALSE)
read.delim("rad_ref_02232016.txt")->rad_ref

#######
rad_ref[c(1:11), c(5,6)]->RadType

uniqueStRadType = unique(RadType$STANDARDIZED.RADTYPE)
uniqueCoRadType = list()
for(i in 1:length(uniqueStRadType)){
	vec = paste(subset(RadType, STANDARDIZED.RADTYPE == uniqueStRadType[i], 1), sep="", collapse="/")
	uniqueCoRadType[[i]] = vec
}

RadTypeDF <- cbind(as.list(uniqueStRadType), uniqueCoRadType)
RadTypeDF <- as.data.frame(RadTypeDF)
RadTypeLL <- as.list(setNames(RadTypeDF$uniqueCoRadType, RadTypeDF$V1))
RadTypeJSON<- toJSON(RadTypeLL)

########

OtherRadType <- rad_ref[c(1:45),c(7,8)]

uniqueStRadTypeOther = unique(OtherRadType$STANDARDIZED.OTHERRADTYPE)
uniqueCoRadTypeOther = list()
for(i in 1:length(uniqueStRadTypeOther)){
	vec = paste(subset(OtherRadType, STANDARDIZED.OTHERRADTYPE == uniqueStRadTypeOther[i], 1), sep="", collapse="/")
	uniqueCoRadTypeOther[[i]] = vec
}

RadTypeOtherDF <- cbind(as.list(uniqueStRadTypeOther), uniqueCoRadTypeOther)
RadTypeOtherDF <- as.data.frame(RadTypeOtherDF)
RadTypeOtherLL <- as.list(setNames(RadTypeOtherDF$uniqueCoRadTypeOther, RadTypeOtherDF$V1))
RadTypeOtherJSON<- toJSON(RadTypeOtherLL)

########

read.delim("drug_names_10272015.txt") -> drug_ref
drug_ref -> Drug

uniqueStDrug = unique(Drug$STANDARDIZED.NAMES)
uniqueCoDrug = list()
for(i in 1:length(uniqueStDrug)){
	vec = paste(subset(Drug, STANDARDIZED.NAMES == uniqueStDrug[i], 1), sep="", collapse="/")
	uniqueCoDrug[[i]] = vec
}

DrugDF <- cbind(as.list(uniqueStDrug), uniqueCoDrug)
DrugDF <- as.data.frame(DrugDF)
DrugLL <- as.list(setNames(DrugDF$uniqueCoDrug, DrugDF$V1))
DrugJSON<- toJSON(DrugLL)
