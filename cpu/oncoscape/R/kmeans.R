

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

oheatmap = function(data, colnames, rownames){

        library(heatmap3)

        colnames(data)<-colnames
        rownames(data)<-rownames
        ColSideColors<-cbind(Group1=c(rep("steelblue2",5), rep(c("brown1", "mediumpurple2"),10)),
                             Group2=sample(c("steelblue2","brown1", "mediumpurple2"),25,replace=TRUE))
        colorCell<-data.frame(row=c(1,3,5),col=c(2,4,6),color=c("green4","black","orange2"),
                              stringsAsFactors=FALSE)
        highlightCell<-data.frame(row=c(2,4,6),col=c(1,3,5),color=c("black","green4","orange2"),
                                  lwd=1:3,stringsAsFactors=FALSE)

        #A simple example
        heatmap3(rnormData,ColSideColors=ColSideColors,showRowDendro=FALSE,colorCell=colorCell,
                 highlightCell=highlightCell)

        #A more detail example
        ColSideAnn<-data.frame(Information=rnorm(25),Group=c(rep("Control",5), rep(c("TrtA", "TrtB"),10)))
        row.names(ColSideAnn)<-colnames(rnormData)
        RowSideColors<-colorRampPalette(c("chartreuse4", "white", "firebrick"))(40)
        result<-heatmap3(rnormData,ColSideCut=1.2,ColSideAnn=ColSideAnn,ColSideFun=function(x)
                showAnn(x),ColSideWidth=0.8,RowSideColors=RowSideColors,
                col=colorRampPalette(c("green","black", "red"))(1024),
                RowAxisColors=1,
                legendfun=function() showLegend(legend=c("Low",
                                                                                                                                                                               "High"),col=c("chartreuse4","firebrick")),verbose=TRUE)
        #annotations distribution in different clusters and the result of statistic tests
        result$cutTable
}
