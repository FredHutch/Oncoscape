source("http://bioconductor.org/biocLite.R")
list.of.packages <- c('pls', 'limma', 'org.Hs.eg.db', 'BiocInstaller', 'AnnotationDbi', 
						'BiocGenerics', 'httpuv', 'RUnit', 'jsonlite', 
<<<<<<< HEAD
						'base64enc','GMD', 'genefilter', 'RJSONIO', 'reshape2')
=======
						'base64enc','GMD', 'genefilter', 'RJSONIO'), ask=FALSE)
>>>>>>> ff8af0a99122d8b3786eb6d256c05119f9cf4163
new.packages <- list.of.packages[!(list.of.packages %in% installed.packages()[,"Package"])]
if(length(new.packages)) 
	biocLite(new.packages, ask=FALSE)
