kmeans = function(x, centers=2, algorithm=c("Hartigan-Wong", "Lloyd", "Forgy","MacQueen")) {
        result = stats::kmeans(x, centers, algorithm = algorithm)
        jsonlite::toJSON(result[c("cluster","centers")])
}

heatmap = function(data, scale, krow, kcol){

        # Case Inputs To Appropriate DataType
        krow =  as.integer(krow);
        kcol = as.integer(kcol)

        # Generate Chart
        chart <- d3heatmap::d3heatmap(data, scale = scale, colors = "Blues", k_row = krow, k_col = kcol)$x

        # Strip Overhead
        chart$image <- NULL
        chart$options <- NULL
        chart$theme <- NULL

        # Transmit JSON
        htmlwidgets:::toJSON(chart)
}
