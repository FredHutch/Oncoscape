\name{kmeans}
\alias{kmeans}
\title{Oncoscape}
\usage{
kmeans(data, centers, method)
}
\description{
Exports Points +
}
\examples{
Javascript
ocpu.rpc("kmeans",
        {x:[[-0.196,0.2004],[-0.117,-0.0841],[-0.2377,0.0021]],centers:2},            function(d){
	        console.dir(JSON.parse(d));
        });
}
