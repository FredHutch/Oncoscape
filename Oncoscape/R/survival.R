#----------------------------------------------------------------------------------------------------
survivalCurveByAttribute <- function(tbl, samples, attribute="Survival", filename, title=NA)
{
   if(!is.na(filename))
      jpeg(file=filename, width=1600,height=1000,quality=100)

  useable.samples <- intersect(tbl$ptID, samples)
 
  if(length(useable.samples) == 0) {
     plot(1, type="n", xlab="", ylab="", xlim=c(0, 10), ylim=c(0, 10), axes=FALSE,
          main="Survival Inputs Error:  \nNone of your identifiers were recognized",
          cex.main=2)
     max <- length(samples)
     if(max > 5)
        max <- 5
     samples.to.display <- c(samples[1:max])
     if(max < length(samples))
        samples.to.display <- c(samples.to.display, "...")
        
     unmatched.ids.msg <- paste(samples.to.display, collapse=", ");
     text(2.5, 7, unmatched.ids.msg, cex=1.6)
     dev.off()
     return(NA)
     } # if no recognized ids
 
   if(!attribute %in% colnames(tbl)){
      message <- sprintf ("No attribute named '%s'", attribute);
      text(2.5, 7, message, cex=1.6)
      dev.off()
      return(NA)
      }

   samples <- useable.samples
   
   sample.indices <- match(samples, tbl$ptID)

      # all other samples
   other.indices <- setdiff(1:nrow(tbl), sample.indices)
   
   groups <- c(rep(1, length(sample.indices)), rep(2, length(other.indices)))
   times  <- c(tbl$Survival[sample.indices], tbl$Survival[other.indices])
   status <- c(tbl$Status.status[sample.indices], tbl$Status.status[other.indices])
   status.int <- rep(0, length(status))
   status.int[status=="Dead"] <- 1
   status.int[status=="Alive"] <- 0

   df <- data.frame(group=groups, time=times, status=status.int, stringsAsFactors=FALSE)
   fit <- survfit(Surv(time, status)~group, data=df)
   mainTitle <- sprintf ("Kaplan-Meier Survival");
   if(!is.na(title))
       mainTitle <- sprintf("%s (%s)", mainTitle, title)
   

   plot(fit,col=c(4,2),conf.int=FALSE,lty=c(1,3),lwd=3,
        xlab="Days",ylab="Fraction alive", main=mainTitle,
        cex.main=2, cex.lab=1.4);

   legend.1 <- sprintf("%4d Selected", length(sample.indices))
   legend.2 <- sprintf("%4d Remaining", length(other.indices))

   #if(samples.which.are.NA > 0)
   #  legend.1 <- sprintf("%s (%d NA)", legend.1, samples.which.are.NA)

    
   l=legend("topright",legend=c(legend.1, legend.2), lty=c(1,3), col=c(4,2),lwd=3, cex=1.4)

   if(!is.na(filename))
       dev.off()
   
   invisible(fit)

} # survivalCurveByAttribute
#-------------------------------------------------------------------------------
