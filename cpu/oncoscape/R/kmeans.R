
kmeans = function(x, centers=2, algorithm=c("Hartigan-Wong", "Lloyd", "Forgy","MacQueen")) {
        result = stats::kmeans(x, centers, algorithm = algorithm)
        jsonlite::toJSON(result[c("cluster","centers")])
}



heatmap = function(data){
        x <- d3heatmap(data, scale = "column", colors = "Blues")
        htmlwidgets:::toJSON(x)
}

oheatmap = function(data){
        pheatmap::pheatmap(data, kmeans_k = 3)
}
