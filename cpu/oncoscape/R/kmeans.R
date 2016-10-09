kmeans = function(x, centers=2, algorithm=c("Hartigan-Wong", "Lloyd", "Forgy","MacQueen")) {
        result = stats::kmeans(x, centers, algorithm = algorithm)
        jsonlite::toJSON(result[c("cluster","centers")])
}


heatmap = function(data){
        htmlwidgets::saveWidget(d3heatmap::d3heatmap(data))
}

oheatmap = function(data){
        pheatmap::pheatmap(data)
}
