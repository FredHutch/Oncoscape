
## Use R's internal knowledge of path settings to find the lib/ directory
## plus optinally an arch-specific directory on system building multi-arch
RInsideLdPath <- function() {
    if (nzchar(.Platform$r_arch)) {     ## eg amd64, ia64, mips
        system.file("lib",.Platform$r_arch,package="RInside")
    } else {
        system.file("lib",package="RInside")
    }
}

## Provide linker flags -- i.e. -L/path/to/libRInside -- as well as an
## optional rpath call needed to tell the Linux dynamic linker about the
## location.  This is not needed on OS X where we encode this as library
## built time (see src/Makevars) or Windows where we use a static library
## Updated Jan 2010:  We now default to static linking but allow the use
##                    of rpath on Linux if static==FALSE has been chosen
##                    Note that this is probably being called from LdFlags()
RInsideLdFlags <- function(static=TRUE) {
    rinsidedir <- RInsideLdPath()
    if (static) {                               # static is default on Windows and OS X
        flags <- paste(rinsidedir, "/libRInside.a", sep="")
        if (.Platform$OS.type=="windows") {
            flags <- shQuote(flags)
        }
    } else {					# else for dynamic linking
        flags <- paste("-L", rinsidedir, " -lRInside", sep="") # baseline setting
        if ((.Platform$OS.type == "unix") &&    # on Linux, we can use rpath to encode path
            (length(grep("^linux",R.version$os)))) {
            flags <- paste(flags, " -Wl,-rpath,", rinsidedir, sep="")
        }
    }
    invisible(flags)
}


## Provide compiler flags -- i.e. -I/path/to/RInside.h
RInsideCxxFlags <- function() {
    path <- system.file( "include", package = "RInside" )
    # if (.Platform$OS.type=="windows") {
    #     path <- shQuote(path)
    # }
    sprintf('-I%s', path)
}

## Shorter names, and call cat() directly
CxxFlags <- function() {
    cat(RInsideCxxFlags())
}

## LdFlags defaults to static linking on the non-Linux platforms Windows and OS X
LdFlags <- function(static=ifelse(length(grep("^linux",R.version$os))==0, TRUE, FALSE)) {
    cat(RInsideLdFlags(static=static))
}




# ## Use R's internal knowledge of path settings to find the lib/ directory
# ## plus optinally an arch-specific directory on system building multi-arch
# RInsideLdPath <- function() {
#     Rcpp:::packageLibPath( package = "RInside" )
# }

## Provide linker flags -- i.e. -L/path/to/libRInside -- as well as an
## optional rpath call needed to tell the Linux dynamic linker about the
## location.  This is not needed on OS X where we encode this as library
## built time (see src/Makevars) or Windows where we use a static library
# RInsideLdFlags <- function(static=Rcpp:::staticLinking()) {
#    Rcpp:::packageLdFlags( "RInside", static )
# }

## Provide compiler flags -- i.e. -I/path/to/RInside.h
# RInsideCxxFlags <- function() {
#	Rcpp:::includeFlag( package = "RInside" )
# }

## Shorter names, and call cat() directly
# CxxFlags <- function() cat(RInsideCxxFlags())
# LdFlags <- function(static=Rcpp:::staticLinking()) cat(RInsideLdFlags(static))

