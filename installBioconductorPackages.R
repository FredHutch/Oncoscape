source("http://bioconductor.org/biocLite.R")
list.of.packages <- c('pls', 'limma', 'org.Hs.eg.db', 'BiocInstaller', 'AnnotationDbi', 
						'BiocGenerics', 'httpuv', 'RUnit', 'jsonlite', 
						'base64enc','GMD', 'genefilter', 'RJSONIO', 'reshape2')
new.packages <- list.of.packages[!(list.of.packages %in% installed.packages()[,"Package"])]
if(length(new.packages)) 
	biocLite(new.packages, ask=FALSE)
