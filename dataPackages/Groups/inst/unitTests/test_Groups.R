library(RUnit)
library(Groups)
options(stringsAsFactors=FALSE)
#----------------------------------------------------------------------------------------------------
Sys.setlocale("LC_ALL", "C")   # set sort order, used by some tests
#----------------------------------------------------------------------------------------------------
runTests <- function()
{
  test.loadFiles()
  test.constructor();
  test.categorization.of.DEMOdz.tumors()
  #test.color.categorization.of.DEMOdz.tumors()
  test.createColorList.verhaak()
  test.createColorList.glioma8()
  
} # runTests
#----------------------------------------------------------------------------------------------------
test.loadFiles <- function()
{
   printf("--- test.loadFiles")
   dir <- system.file(package="Groups", "extdata")
   checkTrue(file.exists(dir))
   x <- Groups:::.loadFiles(dir)
   checkEquals(x$test4, c("ELF4", "PIK3C2B", "EMP3", "PLAG1"))
   
} # test.loadFiles
#----------------------------------------------------------------------------------------------------
test.constructor <- function()
{
   printf("--- testConstructor")
   g <- Groups()
   group.names <- getGroupNames(g)
   group.1 <- getGroup(g, group.names[1])
   checkTrue(length(group.1) > 0)
   
} # test.constructor
#----------------------------------------------------------------------------------------------------
test.categorization.of.DEMOdz.tumors <- function()
{
   printf("--- test.categorization.of.DEMOdz.tumors")
    
   require(DEMOdz)
   dataset <- DEMOdz()
   gdb <- Groups()
   ids <- getTable(getSubjectHistory(dataset))$ID
   tumorGroups <- getItem(dataset, "tumorGroups")
   checkTrue(all(c("verhaak.2010.gbm", "glioma8") %in% names(tumorGroups)))

   metagroupName <- "verhaak.2010.gbm"
       # make sure this name is truly the stem of multiple actual groups
   checkTrue(length(grep(metagroupName, getGroupNames(gdb))) > 1)   
   meta.group <- tumorGroups[[metagroupName]];  # i.e., all glimoa8 groups, or all verhaak.2010.gbmp groups
   member.group.names <- unlist(meta.group, use.names=FALSE)
   ids.by.group <- lapply(member.group.names, function(group) intersect(ids, getGroup(gdb, group)))
   names(ids.by.group) <- member.group.names
   checkEquals(ids.by.group$verhaak.2010.gbm.Classical,
      c("TCGA.02.0021","TCGA.02.0037","TCGA.06.0125","TCGA.06.0402","TCGA.06.0747","TCGA.12.0656","TCGA.12.0657"))
   checkEquals(ids.by.group$verhaak.2010.gbm.Proneural, "TCGA.06.0413")
   checkEquals(ids.by.group$verhaak.2010.gbm.unclassified, character(0))

   metagroupName <- "glioma8"
   checkTrue(length(grep(metagroupName, getGroupNames(gdb))) > 1)   
   meta.group <- tumorGroups[[metagroupName]];  # i.e., all glimoa8 groups, or all verhaak.2010.gbmp groups
   member.group.names <- unlist(meta.group, use.names=FALSE)
   ids.by.group <- lapply(member.group.names, function(group) intersect(ids, getGroup(gdb, group)))
   names(ids.by.group) <- member.group.names
   checkEquals(ids.by.group$glioma8.nonCIMP.wtNRAS.wtTP53, c("TCGA.06.0140", "TCGA.06.0747", "TCGA.06.0749"))
   checkEquals(ids.by.group$glioma8.nonCIMP.wtNRAS.mutTP53, "TCGA.02.0033")
   checkEquals(ids.by.group$glioma8.lggCIMP.not1p19q.wtATRX.mutTP53, character(0))

   tbl.viz <- getItem(dataset, "tbl.groupVizProps")

} # test.nonOverlapping.categorization.of.DEMOdz.tumors
#----------------------------------------------------------------------------------------------------
test.createColorList.verhaak <- function()
{
   printf("--- test.createColorList.verhaak")
   require(DEMOdz)
   dataset <- DEMOdz()
   groupsDB <- Groups()
   ids <- getTable(getSubjectHistory(dataset))$ID
   ids <- c(ids, "bogus")
   target.group <- "verhaak.2010.gbm"
   checkTrue(length(grep(target.group, getGroupNames(groupsDB))) > 0)
   tbl.viz <- getItem(dataset, "tbl.groupVizProps")

   x <- createColorList(ids, target.group, groupsDB, tbl.viz)

   checkEquals(length(x), length(ids))
   checkEquals(x$bogus, "lightgray")
   tbl.xtab <- as.data.frame(table(unlist(x)))
   xtab <- tbl.xtab$Freq
   names(xtab) <- tbl.xtab$Var1
   checkEquals(xtab[["blue"]], 6)
   checkEquals(xtab[["chocolate"]], 7)
   checkEquals(xtab[["green"]], 4)
   checkEquals(xtab[["purple"]], 2)
   checkEquals(xtab[["turquoise"]], 1)

      # spot check the assignments.  a verhaak.2010.gbm Classical tumor is chocolate in color
   tumor.type <- subset(tbl.viz, group==target.group & color=="chocolate")$id  # "Classical"
      # we should therefore find 7 of our ids in the verhaak.2010.gbm.Classical subgroup
   count <- length(intersect(ids, getGroup(groupsDB, "verhaak.2010.gbm.Classical")))
   checkEquals(count, 7)
   tumor.type <- subset(tbl.viz, group==target.group & color=="turquoise")$id  # "Proneural"
      # we should therefore find 7 of our ids in the verhaak.2010.gbm.Classical subgroup
   count <- length(intersect(ids, getGroup(groupsDB, "verhaak.2010.gbm.Proneural")))
   checkEquals(count, 1)

} # test.createColorList.verhaak
#----------------------------------------------------------------------------------------------------
test.createColorList.glioma8 <- function()
{
   printf("--- test.createColorList.glioma8")
   require(DEMOdz)
   dataset <- DEMOdz()
   groupsDB <- Groups()
   ids <- getTable(getSubjectHistory(dataset))$ID
   ids <- c(ids, "bogus")
   target.group <- "glioma8"
   checkTrue(length(grep(target.group, getGroupNames(groupsDB))) > 0)
   tbl.viz <- getItem(dataset, "tbl.groupVizProps")

   x <- createColorList(ids, target.group, groupsDB, tbl.viz)

   checkEquals(length(x), length(ids))
   checkEquals(x$bogus, "lightgray")
   tbl.xtab <- as.data.frame(table(unlist(x)))
   xtab <- tbl.xtab$Freq
   names(xtab) <- tbl.xtab$Var1
   checkEquals(xtab[["lightgray"]], 17)
   checkEquals(xtab[["magenta"]], 1)
   checkEquals(xtab[["orange"]], 3)

      # spot check the assignments.  do color count and group membership count agree?
   tumor.type <- subset(tbl.viz, group==target.group & color=="magenta")$id  # "nonCIMP.wtNRAS.mutTP53" 
   full.name <- sprintf("%s.%s", "glioma8", tumor.type)
   checkEquals(length(intersect(ids, getGroup(groupsDB, full.name))), 1)

   tumor.type <- subset(tbl.viz, group==target.group & color=="orange")$id  # "nonCIMP.wtNRAS.wtTP53"
   full.name <- sprintf("%s.%s", "glioma8", tumor.type)
   checkEquals(length(intersect(ids, getGroup(groupsDB, full.name))), 3)

     # 17 ids did not map.  correctly?
   subgroups <- grep("glioma8", getGroupNames(groupsDB), v=TRUE)
   mapped.count <- 0
   for(group in subgroups){
      mapped.count <- mapped.count + length(intersect(ids, getGroup(groupsDB, group)))
      }

  checkEquals(mapped.count, 4)

} # test.createColorList.glioma8
#----------------------------------------------------------------------------------------------------
createColorList <- function(ids, target.group, groupsDB, tbl.viz)
{
   subgroups <- grep(target.group, unlist(getGroupNames(groupsDB), use.names=FALSE), value=TRUE)

   ids.by.group <- lapply(subgroups, function(group) intersect(ids, getGroup(groupsDB, group)))
   names(ids.by.group) <- subgroups

   tbl.work <- data.frame(id=ids, meta.group=target.group, group="", color="lightgray")

   groups.for.ids <- rep("unassigned", length(ids))
   colors         <- rep("lightgray", length(ids))
   
   names(groups.for.ids) <- ids
   names(colors) <- ids
   
   for(id in tbl.work$id){
      index <- which(as.logical(lapply(subgroups, function(name) id %in% getGroup(groupsDB, name))))
      if(length(index) == 1){
        group <- subgroups[index]
        target.groupWithTrailingDot <- sprintf("%s.", target.group)
        group.shortened <- gsub(target.groupWithTrailingDot, "", group)
        groups.for.ids[[id]] <- group.shortened
        color <- tbl.viz$color[match(group.shortened, tbl.viz$id)]
        if(!is.na(color))
           colors[[id]] <- color
        #printf("%s: %d: %s   %s -> %s", id, index, subgroups[index], target.group, group.shortened)
        } # if  id found in a groupsDB list
      } # for id

   tbl.work$group <- groups.for.ids
   tbl.work$color <- colors

        # to convert to a json-friendly list
   tumor.colors <- tbl.work$color
   names(tumor.colors) <- tbl.work$id

   as.list(tumor.colors)

} # createColorList
#----------------------------------------------------------------------------------------------------
test.color.categorization.of.DEMOdz.tumors <- function()
{
   printf("--- test.color.categorization.of.DEMOdz.tumors")
   require(DEMOdz)
   dataset <- DEMOdz()
   gdb <- Groups()
   ids <- getTable(getSubjectHistory(dataset))$ID
   tumorGroups <- getItem(dataset, "tumorGroups")
   checkTrue(all(c("verhaak.2010.gbm", "glioma8") %in% names(tumorGroups)))

   metagroupName <- "verhaak.2010.gbm"
       # make sure this name is truly the stem of multiple actual groups
   checkTrue(length(grep(metagroupName, getGroupNames(gdb))) > 1)   
   meta.group <- tumorGroups[[metagroupName]];  # i.e., all glimoa8 groups, or all verhaak.2010.gbmp groups
   member.group.names <- unlist(meta.group, use.names=FALSE)
   ids.by.group <- lapply(member.group.names, function(group) intersect(ids, getGroup(gdb, group)))
   names(ids.by.group) <- member.group.names

   tbl.viz <- getItem(dataset, "tbl.groupVizProps")
   tbl.tmp <- data.frame(id=ids, meta.group=metagroupName, group="", color="lightgray")
   #which(as.logical(lapply(getGroupNames(gdb), function(name) "TCGA.12.0657" %in% getGroup(gdb, name))))

   groups.for.ids <- rep("unassigned", length(ids))
   colors <- rep("lightgray", length(ids))
   
   names(groups.for.ids) <- ids
   names(colors) <- ids
   
   for(id in tbl.tmp$id){
      index <- which(as.logical(lapply(member.group.names, function(name) id %in% getGroup(gdb, name))))
      group <- member.group.names[index]
      metagroupNameWithTrailingDot <- sprintf("%s.", metagroupName)
      group.shortened <- gsub(metagroupNameWithTrailingDot, "", group)
      groups.for.ids[[id]] <- group.shortened
      color <- tbl.viz$color[match(group.shortened, tbl.viz$id)]
      if(!is.na(color))
         colors[[id]] <- color
      printf("%s: %d: %s   %s -> %s", id, index, member.group.names[index], metagroupName, group.shortened)
      }
   tbl.tmp$group <- groups.for.ids
   tbl.tmp$color <- colors
   checkEquals(nrow(tbl.tmp), length(ids))
   checkEquals(unique(tbl.tmp$meta.group), "verhaak.2010.gbm")
   checkEquals(sort(unique(tbl.tmp$group)), c("Classical", "GCIMP", "Mesenchymal", "Neural", "Proneural"))
   checkEquals(sort(subset(tbl.viz, group==metagroupName)$color),
               sort(unique(tbl.tmp$color)))

     # now be sure that each tumor is actually in the group we say that it is
   for(i in 1:nrow(tbl.tmp)){
     full.group.name <- sprintf("%s.%s", tbl.tmp$meta.group[i], tbl.tmp$group[i])
     id <- tbl.tmp$id[i]
     checkTrue(id %in% getGroup(gdb, full.group.name))
     } # for i

     # to convert to a json-friendly list
   tumor.colors <- tbl.tmp$color
   names(tumor.colors) <- tbl.tmp$id
   tumor.colors <- as.list(tumor.colors)
   
} # test.color.categorization.of.DEMOdz.tumors
#----------------------------------------------------------------------------------------------------
if(!interactive())
   runTests()
