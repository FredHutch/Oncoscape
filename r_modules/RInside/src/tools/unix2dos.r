
## simple 0d 0a -> 0a converter to suppress a warning on Windows

filename <- commandArgs(trailingOnly=TRUE)[1]
if (!file.exists(filename)) q()

con <- file(filename, "rb")
bin <- readBin(con, raw(), 100000)
bin <- bin[ which(bin != "0d") ]
close(con)

Sys.sleep(1)

con <- file(filename, "wb")
writeBin(bin, con)
close(con)

