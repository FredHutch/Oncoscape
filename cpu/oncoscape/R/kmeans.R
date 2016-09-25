

kmeans = function(x, centers=2, algorithm=c("Hartigan-Wong", "Lloyd", "Forgy","MacQueen")) {
        result = stats::kmeans(x, centers, algorithm = algorithm)
        jsonlite::toJSON(result[c("cluster","centers")])
}

d = function(){
        set.seed(1234)
        dat <- data.frame(cond = factor(rep(c("A","B"), each=200)), rating = c(rnorm(200),rnorm(200, mean=.8)))
        ggplot2::ggplot(dat, ggplot2::aes(x=rating)) +
        ggplot2::geom_histogram(ggplot2::aes(y=..density..), binwidth=.5, colour="black", fill="white") +
        ggplot2::geom_density(alpha=.2, fill="#FF6666")
}

oheatmap = function(data){





        #A simple example
        #heatmap3(data)
        pheatmap::pheatmap(data)


}
