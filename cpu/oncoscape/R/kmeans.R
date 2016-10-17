kmeans = function(x, centers=2, algorithm=c("Hartigan-Wong", "Lloyd", "Forgy","MacQueen")) {
        result = stats::kmeans(x, centers, algorithm = algorithm)
        jsonlite::toJSON(result[c("cluster","centers")])
}

heatmap = function(data){

        # Generate Chart
        chart <- d3heatmap::d3heatmap(data, scale = "column", colors = "Blues")$x

        # Strip Overhead
        chart$image <- NULL
        chart$options <- NULL
        chart$theme <- NULL

        # Transmit JSON
        htmlwidgets:::toJSON(chart)

}
