# createEventList.R
#
# some clinical events (or laboratory events) may recur, and different events will have different numbers
# of, and kinds of, attributes.   so a data.frame is not a good container for these events.
#
# instead, each item (date of birth, diagnosis, chemo and radiation treatments, recurrence, status reports)
# gets its own entry in the list, with as many named fields as we extract from the input data (about which more below)
# each event has a name.  currently we extract (in alphabetical order)
#
#     Drug         DOB   Diagnosis Progression   Radiation      Status Pathology Procedure Encounter
#
# These events are use variously, downstream by the Oncoscape clinical datatable, and the patient timelines.
# The clinical data table uses a data.frame-like structure; patient timelines uses events.
#
# --- how the input data was obtained:
#
#  general data download site:
#     https://tcga-data.nci.nih.gov/tcga/
#      choose read, #cases with data (528 on 2/10/15)
#      choose "Biotab"
#      click "build archive" 
#      download tar.gz file (renaming it for clarity)  
#
#  As specified in file_manifest.txt - included files:
#
#      biospecimen_aliquot_read.txt
#      biospecimen_analyte_read.txt
#      biospecimen_cqcf_read.txt                 cqcf: case quality control form
#      biospecimen_diagnostic_slides_read.txt
#      biospecimen_normal_control_read.txt
#      biospecimen_portion_read.txt
#      biospecimen_protocol_read.txt
#      biospecimen_sample_read.txt
#      biospecimen_shipment_portion_read.txt
#      biospecimen_slide_read.txt
#      biospecimen_tumor_sample_read.txt
#      clinical_drug_read.txt
#      clinical_follow_up_v1.0_read.txt
#      clinical_follow_up_v1.0_nte_read.txt
#      clinical_nte_read.txt
#      clinical_omf_v4.0_read.txt
#      clinical_patient_read.txt
#      clinical_radiation_read.txt
#
# from these only the following clinical tables were used:
#
#   clinical_patient_read.txt
#   clinical_drug_read.txt
#   clinical_radiation_read.txt
#   clinical_follow_up_v1.0_read.txt
#   clinical_follow_up_v1.0_nte_read.txt      nte: new tumor event
#   clinical_nte_read.txt
#   clinical_omf_v4.0_read.txt                omf: other malignancy form
#
#------------------------------------------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)

#------------------------------------------------------------------------------------------------------------------------
# format(strptime("2009-08-11", "%Y-%m-%d"), "%m/%d/%Y") # ->  "08/11/2009"
reformatDate <- function(dateString)
{
   format(strptime(dateString, "%Y-%m-%d"), "%m/%d/%Y")

} # reformatDate

#------------------------------------------------------------------------------------------------------------------------
# sloppy ad hoc design currently requires these variables at global scope

currDir <- getwd()
setwd("../../../../RawData/TCGAread/Clinical_05-21-15/")

study="TCGAread"

tbl.pt <- read.table("clinical_patient_read.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)
tbl.pt <- tbl.pt[3:nrow(tbl.pt),]
tcga.ids <- unique(tbl.pt$bcr_patient_barcode)
id.map <- 1:length(tcga.ids)
fixed.ids <- gsub("-", ".", tcga.ids, fixed=TRUE)
names(id.map) <- fixed.ids
tbl.drug <- read.table("clinical_drug_read.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)
tbl.drug <- tbl.drug[3:nrow(tbl.drug),]
tbl.rad <- read.table("clinical_radiation_read.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)
tbl.rad <- tbl.rad[3:nrow(tbl.rad),]
tbl.f1 <- read.table("clinical_follow_up_v1.0_read.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)
tbl.f1 <- tbl.f1[3:nrow(tbl.f1),]
tbl.f2 <- read.table("clinical_follow_up_v1.0_nte_read.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)
tbl.f2 <- tbl.f2[3:nrow(tbl.f2),]
tbl.nte <- read.table("clinical_nte_read.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)
tbl.nte <- tbl.nte[3:nrow(tbl.nte),]
tbl.omf <- read.table("clinical_omf_v4.0_read.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)
tbl.omf <- tbl.omf[3:nrow(tbl.omf),]

setwd(currDir)

#------------------------------------------------------------------------------------------------------------------------
run <- function()
{
      
      # the patient clinical annotation data use IDs in this style
      #     "TCGA-02-0001" "TCGA-02-0003" "TCGA-02-0006" "TCGA-02-0007"
      # whereas we prefer
      #     "TCGA.02.0001" "TCGA.02.0003" "TCGA.02.0006" "TCGA.02.0007"
      # adapt the incoming patients to the tcga patient clinical style
      # the patient ids are returned to the dot form in the functions
      # defined and called below.

   patients <- tcga.ids
   
   patients <- gsub("\\.", "\\-", patients)
   checkTrue(all(patients %in% tbl.pt[,2]))
   
   history <- parseEvents(patients)
   if(length(history)>0)
    names(history) <- paste("event", 1:length(history), sep="")
   ptList <- createPatientList(history)
   catList <- createEventTypeList(history)
   tbl.ptHistory <- createPatientTable(history)

   print(paste("history ", length(history)))
   print(paste("ptList ", length(ptList)))
   print(paste("catList ", length(catList)))
   print(paste("tbl.ptHistory ", dim(tbl.ptHistory)))
 
   checkEquals(length(history), 1608)
   checkEquals(as.list(table(unlist(lapply(history, function(e) e["Name"])))), list(`Absent`=17,`Background`=171, `Birth`=171, `Diagnosis`=171,`Drug`=158,`Encounter`=171, `Pathology`=187, `Procedure`=20, `Progression`=30,  `Radiation`=25, `Status`=171, `Tests`=316))
      #omf: other malignancy form for 2 patients gives extra pathologies
      # many additional surgeries marked (new_tumor_event_additional_surgery_procedure = YES) but no date given
      
    serialized.file.name <- "../../extdata/events.RData"
   save(history, file=serialized.file.name)
   save(ptList, file="../../extdata/ptHistory.RData")
   save(catList, file="../../extdata/historyTypes.RData")
   save(tbl.ptHistory, file="../../extdata/tbl.ptHistory.RData")
} # run
#------------------------------------------------------------------------------------------------------------------------
parseEvents = function(patient.ids=NA)
{
    dob.events <- lapply(patient.ids, function(id) create.DOB.record(id))
    diagnosis.events <- create.all.Diagnosis.records(patient.ids)
    chemo.events <- create.all.Chemo.records(patient.ids)
    radiation.events <- create.all.Radiation.records(patient.ids)
    
    encounter.events <- create.all.Encounter.records(patient.ids)
    pathology.events <- create.all.Pathology.records(patient.ids)
    progression.events <- create.all.Progression.records(patient.ids)
    status.events <- lapply(patient.ids, create.status.record)
    background.events <- lapply(patient.ids, create.Background.record)
    tests.events <- create.all.Tests.records(patient.ids)
    procedure.events <- create.all.Procedure.records(patient.ids)
    absent.events <- create.all.Absent.records (patient.ids)
    # coad surgery at time of Dx & not reported, but other post/pre surgeries in other tables
    
    events <- append(dob.events, chemo.events)
    events <- append(events, diagnosis.events)
    events <- append(events, status.events)
    events <- append(events, progression.events)
    events <- append(events, radiation.events)
    events <- append(events, procedure.events)
    events <- append(events, encounter.events)
    events <- append(events, pathology.events)
    events <- append(events, absent.events)
    events <- append(events, tests.events)
    events <- append(events,background.events)
    
    #    printf("found %d events for %d patients", length(events), length(patient.ids))
    print(table(unlist(lapply(events, function(e) e["Name"]))))
    
    events
    
} # parseEvents
#---------------------------------------------------------------------------
runTests <- function()
{
   test_create.DOB.record()
   test_create.Chemo.record()
   test_create.Diagnosis.record()
   test_create.status.record()
   test_create.Progression.record()
   test_create.Radiation.record()
   test_create.Procedure.record()
   test_create.Encounter.record()
   test_create.Pathology.record()
   test_create.Absent.record()
   test_create.Tests.record()
   test_create.Background.record()

} # runTests
#------------------------------------------------------------------------------------------------------------------------
# emulate this:      $PatientID: "TCGA.02.0001"  $PtNum  1 $Name "DOB"  $Fields $date "5/14/1940" $gender Female $race white $ethnicity Hispanic or Latino
#
# from this:     head(tbl.pt[-(1:2), c(1, 8, 27, 13)])
#        bcr_patient_barcode birth_days_to age_at_initial_pathologic_diagnosis days_to_initial_pathologic_diagnosis initial_pathologic_dx_year
#      3        TCGA-02-0001        -16179                                  44                                    0                       2002
create.DOB.record <- function(patient.id)
{
   tbl.pt.row <- subset(tbl.pt, bcr_patient_barcode==patient.id)
   patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
   patient.number <- as.integer(id.map[patient.id])
   diagnosis.year <- tbl.pt.row$initial_pathologic_dx_year
   diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
   if(tbl.pt.row$birth_days_to == "[Not Available]"){ dob= NA
   } else{   birth.offset <-   as.integer(tbl.pt.row$birth_days_to)
   dob <- reformatDate(format(diagnosis.date + birth.offset))
   }

   race <- tbl.pt.row$race
   ethnicity <- tbl.pt.row$ethnicity
   gender <- tbl.pt.row$gender
   
   if(gender == "Unspecified") gender = "absent"
   if(gender == "Unknown") gender = NA
   if(!is.na(gender)) gender= tolower(gender)
   
   if(race == "Not reported") race = "absent"
   if(race == "Unknown" || race == "[Not Available]" || race == "[Not Evaluated]" || race == "[Unknown]") race = NA
   if(!is.na(race)) race=tolower(race)

   if(ethnicity == "Not reported") ethnicity  = "absent"
   if(ethnicity == "Unknown" || ethnicity == "[Not Available]" || ethnicity == "[Not Evaluated]" || ethnicity == "[Unknown]") ethnicity  = NA
   if(!is.na(ethnicity)) ethnicity=tolower(ethnicity)
   
   return(list(PatientID=patient.id, PtNum=patient.number, study="TCGAread", Name="Birth", Fields= list(date=c(dob), gender=gender, race=race, ethnicity=ethnicity)))
   
} # create.DOB.record
#------------------------------------------------------------------------------------------------------------------------
test_create.DOB.record <- function()
{
    print("--- test_create.DOB.record")
    x <- create.DOB.record(tcga.ids[15])
    checkTrue(is.list(x))
    checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
    checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
    checkEquals(x, list(PatientID="TCGA.AF.6672", PtNum=15, study="TCGAread", Name="Birth", Fields=list(date="04/17/1967", gender="male", race="white", ethnicity="not hispanic or latino")))
    x <- create.DOB.record(tcga.ids[13])
    checkEquals(x, list(PatientID="TCGA.AF.6136", PtNum=13, study="TCGAread", Name="Birth", Fields=list(date="06/23/1938", gender="female", race="white", ethnicity="not hispanic or latino")))
        
    # check # of unspecified & unknown for gender
    # check # of not reported & unknown for race
    # check # of not reported, unknown and Not Available for ethnicity

} # test_create.DOB.record
#------------------------------------------------------------------------------------------------------------------------
#
# $PatientID [1] "P1"
# $PtNum [1] 1
# $Name [1] "Chemo"
# $Fields
#    $date        ["7/12/2006", "8/22/2006"]
#    $therapyType "Chemo"
#    $disease     "Brain"
#    $intent      "Concurrent"  (or "Palliative" etc)
#    $dose        5
#    $totalDose   20
#    $units       mg mg/m2  mg/kg
#    $totalDoseUnits       mg mg/m2  mg/kg
#    $route       Orally, IV
#    $schedule    5/28, every 2 weeks
#    $cycle       3-4
#    $agent       Temozolomide
#    $treatment   neoadjuvant, adjuvant
#
# use these fields in the drug table, possibly finding many rows per patient
#   pharmaceutical_therapy_drug_name    "Celebrex"
#   pharmaceutical_tx_started_days_to    92
#   pharmaceutical_tx_ended_days_to     278
create.Chemo.record <- function(patient.id)
{

   tbl.drugSub <- subset(tbl.drug, bcr_patient_barcode==patient.id )
    tbl.omf.row <- subset(tbl.omf, bcr_patient_barcode==patient.id & drug_tx_indicator=="YES")

   if(nrow(tbl.drugSub) == 0 && nrow(tbl.omf.row) == 0)
       return(list())
   
   diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
   diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))

   patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
   patient.number <- as.integer(id.map[patient.id])

   name <- "Drug"

   result <- vector("list", nrow(tbl.drugSub) +nrow(tbl.omf.row))
   good.records.found <- 0
   
     # to look at the subset:
     # tbl.drugSub[, c("pharmaceutical_therapy_type", "pharmaceutical_therapy_drug_name", "pharmaceutical_tx_started_days_to", "pharmaceutical_tx_ended_days_to", 
     #                 "pharma_adjuvant_cycles_count", "pharmaceutical_tx_dose_units", "pharmaceutical_tx_total_dose_units", "prescribed_dose", 
     #                 "regimen_number", "route_of_administration", "therapy_regimen", "therapy_regimen_other", "total_dose")]

   if(nrow(tbl.drugSub)>0){
     for(chemoEvent in 1:nrow(tbl.drugSub)){
      start.chemoDate <- tbl.drugSub$pharmaceutical_tx_started_days_to[chemoEvent]
      end.chemoDate <- tbl.drugSub$pharmaceutical_tx_ended_days_to[chemoEvent]

      if(start.chemoDate !="[Not Available]"){      
         start.date.unformatted <- diagnosis.date + as.integer(start.chemoDate)
         start.date <- reformatDate(start.date.unformatted)
      } else{ start.date = NA }
      if( end.chemoDate !="[Not Available]") {
         end.date.unformatted <- diagnosis.date + as.integer(end.chemoDate)
         end.date <- reformatDate(end.date.unformatted)
      } else{  end.date = NA }

      date= c(start.date, end.date)
      
      drug <- tbl.drugSub$pharmaceutical_therapy_drug_name[chemoEvent]

# drug <- tbl.drug$pharmaceutical_therapy_drug_name
# t<-  sapply(tbl.drug$pharmaceutical_therapy_drug_name, function(drug){ 
      if( grepl("Cis Retinoic Acid", drug, ignore.case=TRUE) | drug == "Cis-retinoic acid" | drug =="Reinoid/CIS retinoic acid") { drug = "CRA"}
      if( drug == "Temozomide" | drug == "Temozolamide" | drug == "Temozolomoide" | drug =="temozolomide"| drug =="Temoxolomide" | drug =="Temozlomide" | drug =="Temozolomode" || drug=="Temazolomide" || drug=="TEMOZOLOMIDE" || drug=="Themozolomide") { drug = "Temozolomide" }
      if( drug == "Irintocean" | drug =="Irintotecan" | drug =="irinotecan" | drug =="Irunotecan") { drug = "Irinotecan" }
      if( drug == "dc Vax (Dendritic Cell Vaccine)" | drug == "Dendritic Cell Vaccine (dcvax)"){ drug = "dcVax" }
      if( drug == "ch81c6" | drug == "81C6" | drug =="mu81c6" | drug =="MU81C6") {drug = "81c6"}
      if( drug == "MAB I 131" | drug == "MABI131" | drug =="MAb I-131" | drug =="MAB I131") { drug = "MAB I-131"}
      if( drug == "O6BG" | drug == "06-BG (NABTT 0803)" | drug == "06BG" | drug == "06GB" | drug =="O6B6" | drug =="06-BG")    { drug = "O6-BG"}
      if( drug == "SCH66336" | drug =="SCH63666"){ drug = "SCH6636"}
      if( drug == "Temador" | drug == "Temodor" | drug == "Temudar" | drug =="temodar" | drug =="Temodor" | drug =="Temodar (escalation)") { drug = "Temodar"}
      if( drug == "Gliadel Wafer (BCNU)" | drug == "Gliadel Waters" | drug =="Gliadel" | drug == "Gliadel Wafers" | drug =="BCNU" | drug =="Gliadel BCNU" | drug =="Gliadle Wafer"| drug =="Gliadel wafers" | drug =="Gliadel wafer carmustine" | drug =="Gliadel Wafer"){ drug = "Gliadel wafer"}
      if( drug == "Dexamethazone" | drug == "Dexamethsone" | drug =="Dexamethasome" |  drug== "Dexaethasone" | drug =="Dexmethasone") { drug = "Dexamethasone"}
      if( drug == "ABT-888 Parp Inhibitor") { drug = "ABT-888"}
      if( drug == "Bevacozimab" | drug == "Bevacizumab Avastin" | drug =="Bevcizumab"){ drug = "Bevacizumab"}
      if( drug == "Hydroxurea" | drug =="Hyroxyurea" | drug=="Hyrdroxyurea" | drug == "Hydroxyuerea"| drug =="Hydoxyurea" || drug == "Hydroyurea") { drug = "Hydroxyurea"}
      if( drug == "CI 980" | drug == "CI980") {drug = "CI-980"}
      if( drug == "VP16" | drug =="VP 16 (Etoposide)" | drug =="Vp 16" | drug =="VP 16") { drug = "VP-16"}
      if( drug == "Rapamcyin") { drug ="Rapamycin"}
      if( drug == "6 Thiguanine") { drug = "6 Thioguanine"}
      if( drug == "Acctuane" || drug=="Isotrectinoin (acccutane)"){ drug =  "Accutane"}
      if( drug == "Arsenic Tnoxide" | drug == "Arsenic Trioxide (ATO)"){ drug = "Arsenic Trioxide"}
      if( drug == "BIBW2992"){ drug = "BIBW 2992"}
      if( drug == "BS1-201"){ drug ="BSI-201"}
      if( drug == "CAI (NABTT 97212)" | drug == "CAI (NABTT 9712)") { drug = "CAI NABTT 9712"}
      if( drug == "Carmustin" | drug == "Carmustine (BCNU)" | drug == "Carmustine BCNU") { drug = "Carmustine"}
      if( drug == "CCNu" || drug =="CeeNU") { drug = "CCNU"}
      if( drug == "Celbrex"){ drug = "Celebrex"}
      if( drug == "Cilengtide") { drug = "Cilengitide"}
      if( drug == "Cisplatain"){ drug = "Cisplatin"}
      if( drug == "CPT 11" | drug == "CPT11" | drug =="cpt-11"){ drug = "CPT-11"}
      if( drug == "Erlotinib (Tarceva)") { drug ="Erlotinib"}
      if( drug == "Gleevac" ){ drug = "Gleevec" }
      if( drug == "IL-13 with Pseudomonas exotoxin" | drug =="IL-13 with Pseudomonas Exotoxin" | drug =="IL-13 Pseudomonas exotoxin" ){ drug ="IL-13PE" }
      if( drug == "Levenracetam") { drug = "Levetiracetam"}
      if( drug == "Lumustine" | drug =="Lomustine CCNU" || drug=="lomustine" || drug=="LOMUSTINE" || drug=="LOMUSTINE (CCNU)"){ drug ="Lomustine"}
      if( drug == "Metexafin Gadolinium" | drug =="Motexatin Gadoinium"){ drug = "Motexafin Gadolinium"}
      if( drug == "Procarbizine" || drug=="procarbazine" || drug=="PROCARBAZINE" ){ drug ="Procarbazine" }
      if( drug == "Tamoxiten"){ drug = "Tamoxifen"}
      if( drug == "Tanceva" | drug == "Tarveca"){ drug ="Tarceva"}
      if( drug == "Topecan" ){ drug ="Topotecan" }
      if( drug == "Vincristin" || drug=="vincristine" || drug=="VINCRISTINE") { drug ="Vincristine"}
      if( drug == "XL 184" | drug =="XL184"){ drug ="XL-184" }
      if( drug == "procarbazine"){ drug = "Procarbazine"}
      if( drug == "PS 341"){ drug ="PS-341"}
      if( drug == "Tipfarnib (R115777)"){ drug ="Tipifarnib (R115777)"}
      if( drug == "Valproic acid"){ drug="Valproic Acid"}
      if( drug == "[Not Available]"){ drug = NA}
#            drug
#      })
#t<- unique(t); t<- t[order(t)]

     therapyType     <- tbl.drugSub$pharmaceutical_therapy_type[chemoEvent] 
     intent          <- tbl.drugSub$therapy_regimen[chemoEvent] 
     dose            <- tbl.drugSub$prescribed_dose[chemoEvent] 
     totalDose       <- tbl.drugSub$total_dose[chemoEvent] 
     units           <- tbl.drugSub$pharmaceutical_tx_dose_units[chemoEvent] 
     totalDoseUnits  <- tbl.drugSub$pharmaceutical_tx_total_dose_units[chemoEvent] 
     route           <- tbl.drugSub$route_of_administration[chemoEvent] 
     cycle           <- tbl.drugSub$pharma_adjuvant_cycles_count[chemoEvent] 
#    $treatment   neoadjuvant, adjuvant
#    $disease     "Brain"
#    $schedule    5/28, every 2 weeks


    if(therapyType == "[Discrepancy]") therapyType = NA
    if(intent == "OTHER: SPECIFY IN NOTES") intent <- tbl.drugSub$therapy_regimen_other[chemoEvent]
    if(intent == "Adjuvant and progression") intent <- "Adjuvant and Progression"
    if(intent == "Concurrent chemoradiation" || intent == "Concurrent Chemoradiation") intent <- "Concurrent"
    if(intent == "Maintainence") intent <- "Maintenance"
    if(intent == "[Not Available]" || intent == "[Not Applicable]") intent = NA
    if(!is.na(intent)) intent <- tolower(intent)
    
    if(dose == "[Not Available]") dose <- NA
    if(grepl("^\\d+$", dose)) dose <- as.integer(dose) 
    if(totalDose == "[Not Available]") totalDose <- NA
    if(grepl("^\\d+$", totalDose)) totalDose <- as.integer(totalDose) 
    if(totalDoseUnits == "[Not Available]") totalDoseUnits <- NA
    if(units == "[Not Available]") units <- NA
    
    if(route == "Intra-peritoneal (IP)|Intravenous (IV)") route <- "IP or IV"
    if(route == "Other (specify below)") route <- "Other"
    if(route == "[Not Available]") route <- NA
 
    if(cycle == "[Not Available]") cycle <- NA
    if(grepl("^\\d+$", cycle)) cycle <- as.integer(cycle) 

    
      new.event <- list(PatientID=patient.id,
                        PtNum=patient.number,
                        study=study,
                        Name="Drug",
                        Fields = list(date=date, therapyType=therapyType, agent=drug, intent=intent, dose=dose, units=units, 
                                      totalDose=totalDose, totalDoseUnits=totalDoseUnits, route=route, cycle=cycle)
                        )
      good.records.found <- good.records.found + 1
      result[[good.records.found]] <- new.event
      }} # for chemoEvent

    if(nrow(tbl.omf.row)>0){
    for(omfEvent in 1:nrow(tbl.omf.row)){
      drug <- tbl.omf.row$drug_name[omfEvent]
      if(drug == "[Not Available]") drug = NA
      omfOffset = tbl.omf.row$days_to_drug_therapy_start[omfEvent]
      if(omfOffset == "[Not Available]"){ omf.date = c(NA, NA)
      }else{  omf.date = reformatDate(as.Date(diagnosis.date, "%m/%d/%Y") + as.integer(omfOffset))      }
      intent = tbl.omf.row$malignancy_type[omfEvent]
      if(intent == "[Not Available]") intent = NA      
        new.event <- list(PatientID=patient.id,
                        PtNum=patient.number,
                        study=study,
                        Name="Drug",
                        Fields = list(date=omf.date, therapyType=NA, agent=drug, intent=intent, dose=NA, units=NA, 
                                      totalDose=NA, totalDoseUnits=NA, route=NA, cycle=NA)
                        )
   
       good.records.found <- good.records.found + 1
       result[[good.records.found]] <- new.event
   } }


   result[1:good.records.found]
   
} # create.Chemo.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Chemo.record <- function()
{
    print("--- test_create.Chemo.record")
    x <- create.Chemo.record("TCGA-AF-A56N")
    checkTrue(is.list(x))
    checkEquals(length(x), 2)
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[2]][["Fields"]]), c("date", "therapyType", "agent", "intent", "dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
    checkEquals(x[[2]], list(PatientID= "TCGA.AF.A56N", PtNum=18, study=study, Name="Drug", Fields=list(date=c("06/08/2012", "12/13/2012"), therapyType="Chemotherapy", agent="xeloda", intent=NA, dose=NA, units=NA, totalDose=NA, totalDoseUnits=NA, route=NA, cycle=NA)))
    
   x <- create.Chemo.record("TCGA-AG-3999")  #no start date
   checkEquals(length(x), 1)
   checkEquals(x[[1]], list(PatientID="TCGA.AG.3999", PtNum=67, study=study, Name="Drug", Fields=list(date=c(NA, NA), therapyType="Chemotherapy", agent=NA, intent=NA  , dose=NA, units=NA, totalDose=NA, totalDoseUnits=NA, route=NA, cycle=NA)))
   x <- create.Chemo.record("TCGA-DC-6156")  # no end date
   checkEquals(length(x), 9)
   checkEquals(x[[9]], list(PatientID="TCGA.DC.6156", PtNum=122, study=study, Name="Drug", Fields=list(date=c("01/01/2011",NA), therapyType="Chemotherapy", agent="Leucovorin", intent="palliative", dose=100, units="mg", totalDose=740, totalDoseUnits="mg", route="Intravenous (IV)", cycle=8)))
  
   x <- create.Chemo.record("TCGA-AF-3913")  # omf chemo
   checkEquals(length(x), 3)
   checkEquals(x[[1]], list(PatientID= "TCGA.AF.3913", PtNum=9, study=study, Name="Drug", Fields=list(date=c( "08/20/2009", "11/10/2009"), therapyType="Chemotherapy", agent="Oxaliplatin", intent="palliative", dose=NA, units=NA, totalDose=NA, totalDoseUnits=NA, route="Intravenous (IV)", cycle=3)))
   
 
} # test_create.Chemo.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Chemo.records <- function(patient.ids)
{
   tbl.drugSub <- subset(tbl.drug, bcr_patient_barcode %in% patient.ids)
   tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode %in% patient.ids & drug_tx_indicator=="YES")
   ids <- unique(c(tbl.drugSub$bcr_patient_barcode,tbl.omfSub$bcr_patient_barcode ) )  

  count <- 1
  result <- vector("list", length(ids))
  for(id in ids){
     #printf("id: %s", id)
     new.list <- create.Chemo.record(id)
     range <- count:(count+length(new.list)-1)
     result[range] <- new.list
     count <- count + length(new.list)
     } # for id

     # some number of the expected events will fail, often (always?) because
     # one or both dates is "[Not Available]".  count tells us how many good 
     # we found
    if(length(result) == 0)
        return(list())
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
        result <- result[-deleters]

    result

} # create.all.Chemo.records
#------------------------------------------------------------------------------------------------------------------------
#   $PatientID [1] "P1"
#   $PtNum   [1] 1
#   $Name   [1] "Diagnosis"
#   $date   [1] "6/15/2006"
#   $disease   [1] "Brain"
#
# very simple-minded solution here:
#   date is supplied as tbl.pt$initial_pathologic_dx_year
#   1989 1990 1991 1992 1993 1994 1995 1996 1997 1998 1999 2000 2001 2002 2003 2004 2005 2006 2007 2008 2009 2010 2011 2012 2013 
#      3    3    2    5    5    9   15   10   14   20   12   17   20   29   28   30   57   40   41   66   78   58   17    3    1 
# hamid says that all tcga samples are implicitly G4
create.Diagnosis.record <- function(patient.id)
{
   tbl.pt.row <- subset(tbl.pt, bcr_patient_barcode==patient.id)
   diagnosis.year <- tbl.pt.row$initial_pathologic_dx_year[1]
   diagnosis.date <- reformatDate(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))

   patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
   patient.number <- as.integer(id.map[patient.id])

   name <- "Diagnosis"

   result <- vector("list", nrow(tbl.pt.row) )
   good.records.found <- 0
   
   disease <- tbl.pt.row$tumor_tissue_site
   tissueSourceSiteCode <- tbl.pt.row$tissue_source_site
   #pathMethod <-tbl.pt.row$method_initial_path_dx
   
   # if(pathMethod == "Cytology (e.g. Peritoneal or pleural fluid)") pathMethod = "Cytology"
   #  if(pathMethod == "Fine needle aspiration biopsy") pathMethod = "Aspirate"
   #  if(pathMethod == "Core needle biopsy") pathMethod = "Core Biopsy"
   #  if(pathMethod == "Other method, specify:") pathMethod = "Other"
   #  if(pathMethod == "Unknown") pathMethod = NA
   
   if(disease == "[Not Available]") disease = NA
   new.event <- list(PatientID=patient.id,
                     PtNum=patient.number,
                     study=study,
                     Name=name,
                     Fields = list(date=diagnosis.date, disease=disease, siteCode=tissueSourceSiteCode))
   
    good.records.found <- good.records.found + 1
    result[[good.records.found]] <- new.event

   result[1:good.records.found]
   
} # create.Diagnosis.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Diagnosis.record <- function()
{
   print("--- test_create.Diagnosis.record")
 
   x <- create.Diagnosis.record(tcga.ids[1])
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
    checkEquals(x[[1]], list(PatientID= "TCGA.AF.2687", PtNum=1, study=study, Name="Diagnosis", Fields=list(date="01/01/2009", disease="Rectum", siteCode= "AF")))

} # test_create.Diagnosis.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Diagnosis.records <- function(patient.ids)
{
    # 171 good rows
    tbl.good <- subset(tbl.pt, bcr_patient_barcode %in% patient.ids)
    ids <- unique(tbl.good$bcr_patient_barcode)
    
    count <- 1
    result <- vector("list", nrow(tbl.good))
    for(id in ids){
        #printf("id: %s", id)
        new.list <- create.Diagnosis.record(id)
        range <- count:(count+length(new.list)-1)
        result[range] <- new.list
        count <- count + length(new.list)
    } # for id
    
    # some number of the expected events will fail, often (always?) because
    # one or both dates is "[Not Available]".  count tells us how many good
    # we found
    if(length(result) == 0)
    return(list())
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
    result <- result[-deleters]
    
    result
    
} # create.all.Diagnosis.records
#------------------------------------------------------------------------------------------------------------------------

# elold[[ head(which(unlist(lapply(elold, function(element) element$Name=="Death"))), n=1) ]]
# emulate this:      $PatientID [1] "P1"  $PtNum [1] 1 $Name [1] "Status"  $date [1] "10/25/2007" $Type [1] "Dead"
#
# from this:     head(tbl.pt[-(1:2), c(1, 16,17,18)])
#   bcr_patient_barcode vital_status last_contact_days_to death_days_to
#	5         TCGA-02-0006         Dead                  558           558

create.status.record <- function(patient.id)
{
    diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    tbl.pt.row <- subset(tbl.pt, bcr_patient_barcode==patient.id)
    
    name <- "Status"
    
    vital <- tbl.pt.row$vital_status
    tumorStatus <- tbl.pt.row$tumor_status
    
    if(vital == "Dead"){
        status.offset <-   as.integer(tbl.pt.row$death_days_to)
    } else{
        status.offset <-   as.integer(tbl.pt.row$last_contact_days_to)
        tbl.fu.rows <- subset(tbl.f1, bcr_patient_barcode==patient.id)
        if(nrow(tbl.fu.rows) != 0 ){
            for(i in 1:nrow(tbl.fu.rows)){
                row <- tbl.fu.rows[i, ]
                if(row["vital_status"]=="Dead"){
                    vital= row[["vital_status"]]; status.offset <-   as.integer(row["death_days_to"])
                } else{ if(is.na(status.offset) || row["last_contact_days_to"] > status.offset) {
                    vital= row[["vital_status"]]; status.offset <-   as.integer(row["last_contact_days_to"]) }
                }
                tumorStatus = row["tumor_status"]
            }}
        if(vital == "[Not Available]" || vital == "Unknown") vital=NA
    }
    
    if(tumorStatus == "[Not Available]" || tumorStatus == "[Unknown]"){ tumorStatus=NA
    }else{ tumorStatus = tolower(tumorStatus) }
    if(is.na(status.offset)) date = NA
    else{ date <- reformatDate(format(diagnosis.date + status.offset))}
    
    
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    return(list(PatientID=patient.id, PtNum=patient.number, study=study, Name=name, Fields=list(date=date, status= vital, tumorStatus=tumorStatus)))
    
} # create.status.record
#------------------------------------------------------------------------------------------------------------------------
test_create.status.record <- function()
{
    print("--- test_create.status.record")
    x <- create.status.record(tcga.ids[1])
    checkTrue(is.list(x))
    checkEquals(names(x), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x$Fields), c("date", "status", "tumorStatus"))
    checkEquals(x, list(PatientID="TCGA.AF.2687", PtNum=1, study=study, Name="Status", Fields=list(date="01/05/2011", status="Alive", tumorStatus="tumor free")))
	x <- create.status.record("TCGA-AG-3583")
    checkEquals(x, list(PatientID= "TCGA.AG.3583", PtNum=25, study=study, Name="Status", Fields=list(date="09/02/2009", status="Dead", tumorStatus=NA)))
    x <- create.status.record("TCGA-BM-6198")
    checkEquals(x, list(PatientID="TCGA.BM.6198", PtNum=106, study=study, Name="Status", Fields=list(date="11/07/2010", status="Alive", tumorStatus="tumor free")))
} # test_create.status.record
#------------------------------------------------------------------------------------------------------------------------
# emulate this:  elold[[ head(which(unlist(lapply(elold, function(element) element$Name=="Progression"))), n=1) ]]
#
# $PatientID [1] "P1"
# $PtNum [1] 1
# $Name [1] "Progression"
# $date [1] "3/21/2007"
#
create.Progression.record <- function(patient.id)
{
    
    diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    tbl.fu.rows <- subset(tbl.f2, bcr_patient_barcode==patient.id)
    tbl.nte.rows <- subset(tbl.nte, bcr_patient_barcode==patient.id)
    
    if(nrow(tbl.fu.rows) == 0 & nrow(tbl.nte.rows)==0 )
    return(list())
    
    tbl.fu.rows <- tbl.fu.rows[, c("new_neoplasm_event_type","new_tumor_event_dx_days_to")  ]
    if(nrow(tbl.nte.rows)>0) {
        nte <- tbl.nte.rows[,c("new_neoplasm_event_type","new_tumor_event_dx_days_to")]
        tbl.fu.rows <- rbind(tbl.fu.rows, nte)
    }
    
    duplicates <- which(duplicated(tbl.fu.rows[,"new_tumor_event_dx_days_to"]))
    if(length(duplicates)>0){
        dupVals <- unique(tbl.fu.rows[duplicates, "new_tumor_event_dx_days_to"])
        originals <- match(dupVals, tbl.fu.rows$new_tumor_event_dx_days_to)
        allVals <- sapply(dupVals, function(val) {
            t<- paste(tbl.fu.rows[which(tbl.fu.rows$new_tumor_event_dx_days_to == val), "new_neoplasm_event_type"], collapse=";")
            t<- gsub("\\[Unknown\\]", "", t)
            t<- gsub("\\[Not Available\\]", "", t)
            t<- gsub("NA", "", t)
            while(grepl(";;", t)){ t<- gsub(";;", ";", t)}
            gsub(";$", "", t)
        })
        tbl.fu.rows[originals, "new_neoplasm_event_type"] <- allVals
        tbl.fu.rows <- tbl.fu.rows[-duplicates,]
    }
    
    name <- "Progression"
    result <- vector("list", nrow(tbl.fu.rows) )
    good.records.found <- 0
    tbl.fu.rows <- tbl.fu.rows[order(as.integer(tbl.fu.rows$new_tumor_event_dx_days_to)),]
    
    if(nrow(tbl.fu.rows)>0){
        for(i in 1:nrow(tbl.fu.rows)){
            row <- tbl.fu.rows[i, ]
            eventtype <- row[["new_neoplasm_event_type"]]
            if(!is.na(eventtype) ){ if(eventtype == "[Unknown]" | eventtype == "[Not Available]" | eventtype == "") eventtype = NA }
            
            if(row["new_tumor_event_dx_days_to"] != "[Not Available]"){
                progression.offset <-   as.integer(row["new_tumor_event_dx_days_to"])
                patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
                patient.number <- as.integer(id.map[patient.id])
                progression <- reformatDate(format(diagnosis.date + progression.offset))
                
                new.event <- list(PatientID=patient.id,
                PtNum=patient.number,
                study=study,
                Name=name,
                Fields=list(date=progression, event=eventtype, number=good.records.found+1))
                
                good.records.found <- good.records.found + 1
                result[[good.records.found]] <- new.event
            }
        }
    }
    
    
    result[1:good.records.found]
    
} # create.Progression.record
#-----------------------------------------------------------------------------------------------------------------------------------------------------
test_create.Progression.record <- function()
{
    print("--- test_create.Progression.record")
    x <- create.Progression.record("TCGA-AF-2689")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
    checkEquals(x[[1]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study, Name="Progression", Fields=list(date="10/29/2009", event=NA, number=1)))
    
    
    x <- create.Progression.record("TCGA-AF-A56K")  #in nte table
    checkEquals(length(x), 1)
    checkEquals(x[[1]], list(PatientID="TCGA.AF.A56K", PtNum=16, study=study, Name="Progression", Fields=list(date="05/02/2009", event="Locoregional Disease", number=1)))
   
   
    x <- create.Progression.record("TCGA-AF-3911")  #2 progression events
    checkEquals(length(x), 2)
    checkEquals(x[[2]], list(PatientID="TCGA.AF.3911", PtNum=8, study=study, Name="Progression", Fields=list(date="10/18/2011", event=NA, number=2)))
    checkEquals(x[[1]], list(PatientID="TCGA.AF.3911", PtNum=8, study=study, Name="Progression", Fields=list(date="11/27/2010", event=NA, number=1)))
   
} # test_create.Progression.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Progression.records <- function(patient.ids)
{
      # 32 good rows
   tbl.good <- subset(tbl.f2, bcr_patient_barcode %in% patient.ids )
   tbl.nteSub <- subset(tbl.nte, bcr_patient_barcode %in% patient.ids & new_tumor_event_dx_days_to != "[Not Available]")
   ids <- unique(c(tbl.good$bcr_patient_barcode, tbl.nteSub$bcr_patient_barcode))   

  count <- 1
  result <- vector("list", nrow(tbl.good))
  for(id in ids){
     new.list <- create.Progression.record(id)
     range <- count:(count+length(new.list)-1)
     result[range] <- new.list
     count <- count + length(new.list)
     } # for id

     # Count tells us how many good events we found
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
        result <- result[-deleters]

    result

} # create.all.Progression.records
#------------------------------------------------------------------------------------------------------------------------
# emulate this:  elold[[ head(which(unlist(lapply(elold, function(element) element$Name=="Radiation"))), n=1) ]]
#
# $PatientID [1] "P1"
# $PtNum [1] 1
# $Name [1] "Radiation"
# $date [1] "7/12/2006" "8/22/2006"
# $Type [1] "External Beam"
#
create.Radiation.record <- function(patient.id)
{

   tbl.radSub <- subset(tbl.rad, bcr_patient_barcode==patient.id & radiation_therapy_ongoing_indicator != "YES")
   tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode==patient.id & radiation_tx_indicator == "YES")
   if(nrow(tbl.radSub) == 0 & nrow(tbl.omfSub) == 0)
       return(list())  
    # check ABSENT table in Caisis for UW/MSK data
   
   diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
   diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))

   patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
   patient.number <- as.integer(id.map[patient.id])

   name <- "Radiation"

   result <- vector("list", nrow(tbl.radSub)+nrow(tbl.omfSub))
   good.records.found <- 0
   
     # to look at the subset:
     # tbl.radSub[, c("radiation_therapy_type", "radiation_therapy_started_days_to", "radiation_therapy_ongoing_indicator", "radiation_therapy_ended_days_to")]

   if(nrow(tbl.radSub)>0){
   for(radEvent in 1:nrow(tbl.radSub)){
      start.radDate <- tbl.radSub$radiation_therapy_started_days_to[radEvent]
      end.radDate <- tbl.radSub$radiation_therapy_ended_days_to[radEvent]

      if(start.radDate != "[Not Available]"){
        start.date.unformatted <- diagnosis.date + as.integer(start.radDate)
        start.date <- reformatDate(start.date.unformatted)
      } else { start.date = NA }     
      if(end.radDate != "[Not Available]"){
        end.date.unformatted <- diagnosis.date + as.integer(end.radDate)
        end.date <- reformatDate(end.date.unformatted)
      } else { end.date = NA}

      date=c(start.date, end.date)

      radType <- tbl.radSub$radiation_therapy_type[radEvent]
      if(radType == "OTHER: SPECIFY IN NOTES"){
      		radType = tbl.radSub$radiation_type_other[radEvent]
      	}

           if( grepl("Stereotactic Radiosurgery", radType, ignore.case=TRUE) | 
               radType == "Sterotactic radiosurgery" | radType == "steriostatic Radiosurgery" | 
               radType == "sterotactic radiosurgery" | radType == "Stereotatic Radiosurgery" | radType == "Sterotactic Radiosurgery" |
               radType == "Stereotactic Radio Surgery" | radType =="Sterotactic Radiosurger") { radType = "Stereotactic Radiosurgery"
      } else if(grepl("Stereotactic radiotherapy", radType, ignore.case=TRUE)){ radType = "Stereotactic Radiotherapy"
      } else if (grepl("Fractionated Stereotactic Radiosurgery", radType, ignore.case=TRUE) | 
               radType == "Fractionated Stereotactic Radiosuergery" | 
               radType == "Fractionated stereotactic radiosurger"){ radType = "Fractionated Stereotactic Radiosurgery"
      } else if (grepl("Fractionated stereotactic radiotherapy", radType, ignore.case=TRUE)){ radType = "Fractionated Stereotactic Radiotherapy"
      } else if (radType == "Cyberknife"){ radType = "Cyber Knife"
      } else if (grepl("G-Knife", radType, ignore.case=TRUE) | grepl("gamma knife", radType, ignore.case=TRUE)){ radType = "Gamma Knife"
      } else if (grepl("Knife", radType, ignore.case=TRUE)){ radType = "Knife"
      } else if (radType == "Brachtherapy"){ radType = "Brachytherapy"
      } else if (radType == "Intensity modulated radiation"){ radType = "IMRT"
      } else if (radType == "SRS"){ radType = "Stereotactic Radiosurgery"}
   	 if(radType == "[Not Available]") radType=NA
   	 if(!is.na(radType)) radType = tolower(radType)
   	
     intent          <- tbl.radSub$therapy_regimen[radEvent] 
     target          <- tbl.radSub$radiation_therapy_site[radEvent]
     totalDose       <- tbl.radSub$radiation_total_dose[radEvent] 
     totalDoseUnits  <- tbl.radSub$radiation_adjuvant_units[radEvent] 
     NumFractions    <- tbl.radSub$radiation_adjuvant_fractions_total[radEvent]
#    $treatment   neoadjuvant, adjuvant
#    $disease     "Brain"
   	
   	if(target == "[Not Available]") target = NA
   	if(intent == "OTHER: SPECIFY IN NOTES") intent = tbl.radSub$therapy_regimen_other[radEvent]
   	if(intent == "[Unknown]" || intent == "[Not Available]") intent = NA
    if(!is.na(intent)) intent = tolower(intent)
    if(NumFractions == "[Not Available]") NumFractions = NA
    if(grepl("^\\d+\\.*\\d*$",NumFractions)) NumFractions = as.double(NumFractions)

    if(totalDose == "[Not Available]") totalDose = NA
   	if(totalDoseUnits == "[Not Available]") totalDoseUnits = NA
   	if(grepl("^\\d+$",totalDose)) totalDose = as.integer(totalDose)
   	    
   	# 1Gy = 100cGy
   	if(!is.na(totalDoseUnits) && totalDoseUnits == "Gy" && is.integer(totalDose) )  {
   	   totalDose = 100 * totalDose
   	   totalDoseUnits = "cGy"
   	}
   	    
      new.event <- list(PatientID=patient.id,
                        PtNum=patient.number,
                        study=study,
                        Name=name,
                        Fields = list(date=date, therapyType=radType, intent=intent, target=target, 
                                      totalDose=totalDose, totalDoseUnits=totalDoseUnits, numFractions=NumFractions))
      good.records.found <- good.records.found + 1
      result[[good.records.found]] <- new.event
      }} # for radEvent

    if(nrow(tbl.omfSub)>0){
    for(omfEvent in 1:nrow(tbl.omfSub)){
      target <- tbl.omfSub$radiation_tx_extent[omfEvent]
      if(target == "[Not Available]") target = NA
      atTumorsite <- tbl.omfSub$rad_tx_to_site_of_primary_tumor[omfEvent]
      if(atTumorsite == "[Not Available]") atTumorsite = NA
      if(!is.na(target) & !is.na(atTumorsite)) target = paste(target, ", at primary tumor site: ", tolower(atTumorsite), sep="")
      omfOffset = tbl.omfSub$days_to_radiation_therapy_start[omfEvent]
      if(omfOffset == "[Not Available]"){ omf.date = NA
      }else{  omf.date = reformatDate(diagnosis.date + as.integer(omfOffset))      }
      therapyType = tbl.omfSub$malignancy_type[omfEvent]
      if(therapyType == "[Not Available]") therapyType = NA      
      new.event <- list(PatientID=patient.id,
                        PtNum=patient.number,
                        study=study,
                        Name=name,
                        Fields = list(date=omf.date, therapyType=therapyType, intent=NA, target=target,
                                      totalDose=NA, totalDoseUnits=NA, numFractions=NA))
   
       good.records.found <- good.records.found + 1
       result[[good.records.found]] <- new.event
   } }

   result[1:good.records.found]
   
} # create.Radiation.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Radiation.record <- function()
{
    print("--- test_create.Radiation.record")
    x <- create.Radiation.record("TCGA-G5-6233") #tbl.omf
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(x[[1]], list(PatientID="TCGA.G5.6233", PtNum=168, study=study, Name="Radiation", Fields=list(date=NA, therapyType="Prior Malignancy", intent=NA, target="Locoregional, at primary tumor site: no", totalDose=NA, totalDoseUnits=NA, numFractions=NA)))

   x <- create.Radiation.record("TCGA-AF-2692")  #no start date
   checkEquals(x[[1]], list(PatientID="TCGA.AF.2692", PtNum=5, study=study, Name="Radiation", Fields=list(date=c("02/23/2010", "03/12/2010"), therapyType="external beam", intent= "palliative", target="Distant site", totalDose=3500, totalDoseUnits="cGy", numFractions=14)))
   checkEquals(x[[2]], list(PatientID="TCGA.AF.2692", PtNum=5, study=study, Name="Radiation", Fields=list(date=c("12/17/2009", "01/21/2010"), therapyType="external beam", intent= "recurrence", target="Primary Tumor Field", totalDose=5000, totalDoseUnits="cGy", numFractions=25)))
   
} # test_create.Radiation.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Radiation.records <- function(patient.ids)
{
   tbl.good <- subset(tbl.rad, bcr_patient_barcode %in% patient.ids & radiation_therapy_ongoing_indicator != "YES")
   tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode %in% patient.ids &  radiation_tx_indicator == "YES")
   ids <- unique(c(tbl.good$bcr_patient_barcode, tbl.omfSub$bcr_patient_barcode))   # 432

  count <- 1
  result <- vector("list", nrow(tbl.good))
  for(id in ids){
     #printf("id: %s", id)
     new.list <- create.Radiation.record(id)
     range <- count:(count+length(new.list)-1)
     result[range] <- new.list
     count <- count + length(new.list)
     } # for id

     # some number of the expected events will fail, often (always?) because
     # one or both dates is "[Not Available]".  count tells us how many good 
     # we found
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
        result <- result[-deleters]

    result

} # create.all.Radiation.records

#------------------------------------------------------------------------------------------------------------------------
# $PatientID [1] "P1"
# $PtNum [1] 1
# $Name [1] "Encounter"
# $Fields
#   $date [1] "7/12/2006"
#   $Type NV FR Consult MDTX
#   $KPS [1] 90
#   $ECOG [1] 90
#   $systolic [1] 90
#   $diastolic [1] 90
#   $height, $weight, BSA, BMI, Zubrod
create.Encounter.record <- function(patient.id)
{
    
    tbl.encSub <- subset(tbl.pt, bcr_patient_barcode==patient.id)
    #tbl.nteSub <- subset(tbl.f1, bcr_patient_barcode==patient.id)
    if(nrow(tbl.encSub) == 0)
    return(list())
    
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    name <- "Encounter"
    
    result <- vector("list", nrow(tbl.encSub))
    good.records.found <- 0
    
    if(nrow(tbl.encSub)>0){
        for(encEvent in 1:nrow(tbl.encSub)){
            diagnosis.year <- tbl.encSub$initial_pathologic_dx_year[encEvent]
            diagnosis.date <- reformatDate(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
            #encType <- tbl.encSub$performance_status_timing[encEvent]
            #if(encType == "Preoperative") encType = "Pre-Operative"
            #if(encType == "[Not Evaluated]") encType = "absent"
            #if(encType == "[Not Available]" || encType == "Unknown") encType = NA
            
            #KPS    <- tbl.encSub$karnofsky_score[encEvent]
            #ECOG   <- tbl.encSub$ecog_score[encEvent]
            
            #if(KPS == "[Not Evaluated]") KPS = "absent"
            # if(KPS == "[Not Available]" || KPS == "Unknown") KPS = NA
            # if(ECOG == "[Not Evaluated]") ECOG = "absent"
            # if(ECOG == "[Not Available]" || ECOG == "Unknown") ECOG = NA
            
            # if(grepl("^\\d+$",KPS)) KPS = as.integer(KPS)
            #if(grepl("^\\d+$",ECOG)) ECOG = as.integer(ECOG)
            
            height  <- tbl.encSub$height_cm_at_diagnosis[encEvent]
            weight  <- tbl.encSub$weight_kg_at_diagnosis[encEvent]
            
            if(height == "[Not Available]") height = NA
            if(weight == "[Not Available]") weight = NA
            new.event <- list(PatientID=patient.id,
            PtNum=patient.number,
            study=study,
            Name=name,
            Fields = list(type=NA, kps=NA, ecog=NA, date = diagnosis.date,height = height, weight = weight,
            BSA = NA, BMI = NA, ZubrodScore=NA))
            good.records.found <- good.records.found + 1
            result[[good.records.found]] <- new.event
        }
    } # for encEvent
    
    result[1:good.records.found]
    
} # create.Encounter.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Encounter.record <- function()
{
    print("--- test_create.Encounter.record")
    x <- create.Encounter.record(tcga.ids[1])
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("type", "kps", "ecog","date","height","weight","BSA","BMI","ZubrodScore"))
    checkEquals(x[[1]], list(PatientID="TCGA.AF.2687", PtNum=1, study=study, Name="Encounter", Fields=list(type=NA, kps=NA, ecog=NA,date="01/01/2009", height="163",weight="68.2",BSA=NA, BMI=NA, ZubrodScore=NA)))
    x <- create.Encounter.record("TCGA-F5-6814")
    checkEquals(x[[1]], list(PatientID="TCGA.F5.6814", PtNum=164, study=study, Name="Encounter", Fields=list(type=NA, kps=NA, ecog=NA,date= "01/01/2011", height="175",weight="61",BSA=NA, BMI=NA, ZubrodScore=NA)))
    
} # test_create.Encounter.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Encounter.records <- function(patient.ids)
{
      # 530 good rows
  tbl.ptSub <- subset(tbl.pt, bcr_patient_barcode %in% patient.ids )
  #tbl.fuSub <- subset(tbl.f1, bcr_patient_barcode %in% patient.ids)
  ids <- unique(c(tbl.ptSub$bcr_patient_barcode))   # 432

  count <- 1
  result <- vector("list", length(ids))
  for(id in ids){
     #printf("id: %s", id)
     new.list <- create.Encounter.record(id)
     range <- count:(count+length(new.list)-1)
     result[range] <- new.list
     count <- count + length(new.list)
     } # for id

     # some number of the expected events will fail, often (always?) because
     # one or both dates is "[Not Available]".  count tells us how many good 
     # we found
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
        result <- result[-deleters]

    result

} # create.all.Encounter.records
#------------------------------------------------------------------------------------------------------------------------
# $PatientID [1] "P1"
# $PtNum [1] 1
# $Name [1] "Procedure"
# $Fields
#   $date [1] "7/12/2006"
#   $Service  Neurosurgery Thoracic
#   $Name     Craniotomay, Biopsy
#   $Site     Frontal, Temporal
#   $Side     L R Bilateral
create.Procedure.record <- function(patient.id)
{
    
    tbl.procSub <- subset(tbl.f2, bcr_patient_barcode==patient.id & new_tumor_event_additional_surgery_procedure == "YES")
    tbl.nteSub <- subset(tbl.nte, bcr_patient_barcode==patient.id & days_to_new_tumor_event_additional_surgery_procedure != "[Not Available]")
    tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode==patient.id & days_to_surgical_resection != "[Not Available]")
    
    if(nrow(tbl.procSub) == 0 && nrow(tbl.nteSub) ==0 && nrow(tbl.omfSub) ==0)
    return(list())
    
    diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    name <- "Procedure"
    
    result <- vector("list", nrow(tbl.procSub) + nrow(tbl.nteSub) + nrow(tbl.omfSub))
    good.records.found <- 0
    
    if(nrow(tbl.procSub)>0){
        for(Event in 1:nrow(tbl.procSub)){
            date <- tbl.procSub$days_to_new_tumor_event_additional_surgery_procedure[Event]
            if(date == "[Not Available]"){ date = NA
            } else { date = reformatDate(diagnosis.date + as.integer(date)) }
            site = tbl.procSub$new_neoplasm_event_type[Event]
            if(site == "[Not Available") site = NA
            
            new.event <- list(PatientID=patient.id,
            PtNum=patient.number,
            study=study,
            Name=name,
            Fields = list(date=date, service=NA, name = NA, site = site, side = NA))
            good.records.found <- good.records.found + 1
            result[[good.records.found]] <- new.event
        }} # for encEvent
    
    if(nrow(tbl.nteSub)>0){
        for(Event in 1:nrow(tbl.nteSub)){
            date <- tbl.nteSub$days_to_new_tumor_event_additional_surgery_procedure[Event]
            date = reformatDate(diagnosis.date + as.integer(date))
            site = tbl.nteSub$new_neoplasm_event_type[Event]
            if(site == "[Not Available]") site = NA
            
            new.event <- list(PatientID=patient.id,
            PtNum=patient.number,
            study=study,
            Name=name,
            Fields = list(date=date, service=NA, name = NA, site = site, side = NA))
            good.records.found <- good.records.found + 1
            result[[good.records.found]] <- new.event
        }} # for encEvent
    if(nrow(tbl.omfSub)>0){
        for(Event in 1:nrow(tbl.omfSub)){
            date <- tbl.omfSub$days_to_surgical_resection[Event]
            if(date == "[Not Available]" | date == "[Pending]"){ date = NA
            } else { date = reformatDate(diagnosis.date + as.integer(date)) }
            Surgeryname <- tbl.omfSub$surgery_type[Event]
            if(Surgeryname == "[Not Available]") Surgeryname = NA
            
            new.event <- list(PatientID=patient.id,
            PtNum=patient.number,
            study=study,
            Name=name,
            Fields = list(date=date, service=NA, name = Surgeryname, site = NA, side = NA))
            good.records.found <- good.records.found + 1
            result[[good.records.found]] <- new.event
        }} # for encEvent
    
    
    result[1:good.records.found]
    
} # create.Procedure.record
#----------------------------------------------------------------------------------------------------------------------
test_create.Procedure.record <- function()
{
    print("--- test_create.Procedure.record")
    x <- create.Procedure.record("TCGA-AF-A56K") #from nte table
   checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("date", "service", "name", "site", "side"))
    checkEquals(x[[1]], list(PatientID="TCGA.AF.A56K", PtNum=16, study=study, Name="Procedure", Fields=list(date="12/29/2009", service=NA, name=NA, site="Locoregional Disease", side=NA)))
    x <- create.Procedure.record("TCGA-G5-6233") #from omf table
    checkEquals(x[[1]], list(PatientID="TCGA.G5.6233", PtNum=168, study=study, Name="Procedure", Fields=list(date="07/24/2004", service=NA, name=NA, site=NA, side=NA)))

 
} # test_create.Procedure.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Procedure.records <- function(patient.ids)
{

   tbl.procSub <- subset(tbl.f2, bcr_patient_barcode %in% patient.ids & new_tumor_event_additional_surgery_procedure == "YES")
   tbl.nteSub <- subset(tbl.nte, bcr_patient_barcode %in% patient.ids & days_to_new_tumor_event_additional_surgery_procedure != "[Not Available]")
   tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode %in% patient.ids & days_to_surgical_resection != "[Not Available]")
  ids <- unique(c(tbl.procSub$bcr_patient_barcode,tbl.omfSub$bcr_patient_barcode,tbl.nteSub$bcr_patient_barcode ) )  # 592

  count <- 1
  result <- vector("list", length(ids))
  for(id in ids){
     #printf("id: %s", id)
     new.list <- create.Procedure.record(id)
     range <- count:(count+length(new.list)-1)
     result[range] <- new.list
     count <- count + length(new.list)
     } # for id

     # some number of the expected events will fail, often (always?) because
     # one or both dates is "[Not Available]".  count tells us how many good 
     # we found
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
        result <- result[-deleters]

    result

} # create.all.Procedure.records
#------------------------------------------------------------------------------------------------------------------------
# $PatientID [1] "P1"
# $PtNum [1] 1
# $Name [1] "Pathology"
# $Fields
#   $date [1] "7/12/2006"
#   $specimenType brain, RL tumor
#   $site temporal frontal
#   $histology  read LGG
#   $histology2  Gliosarcoma
#   $Test      1p/q19,  PTEN, EGFR
#   $Result    Deletion, invalid, amplification, Negative, 100 
#   $Disease   Brain
#   $Grade     G1, G2/G3
create.Pathology.record <- function(patient.id)
{
    
    tbl.pathSub <- subset(tbl.pt, bcr_patient_barcode==patient.id)
    tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode==patient.id)
    if(nrow(tbl.pathSub) == 0 & nrow(tbl.omfSub) == 0)
    return(list())
    
    diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    name <- "Pathology"
    
    result <- vector("list", nrow(tbl.pathSub)+nrow(tbl.omfSub))
    good.records.found <- 0
    
    if(nrow(tbl.pathSub) >0){
        for(pathEvent in 1:nrow(tbl.pathSub)){
            
            pathology.offset <-   as.integer(tbl.pathSub$days_to_initial_pathologic_diagnosis[pathEvent])
            patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
            patient.number <- as.integer(id.map[patient.id])
            date <- reformatDate(format(diagnosis.date + pathology.offset))
            
            pathDisease <- tbl.pathSub$tumor_tissue_site[pathEvent]
            pathHistology <- tbl.pathSub$histologic_diagnosis[pathEvent]
            collection <- tbl.pathSub$prospective_collection[pathEvent]
            T.Stage <- tbl.pathSub$ajcc_tumor_pathologic_pt[pathEvent]
            N.Stage <- tbl.pathSub$ajcc_nodes_pathologic_pn[pathEvent]
            M.Stage <- tbl.pathSub$ajcc_metastasis_pathologic_pm[pathEvent]
            S.Stage <- tbl.pathSub$ajcc_pathologic_tumor_stage[pathEvent]
            staging.System <- tbl.pathSub$ajcc_staging_edition[pathEvent]
            
            if(grepl("-",pathHistology)) pathHistology <- strsplit(pathHistology,"-")[[1]][1]
            
            if(collection == "YES"){ collection = "prospective"
            } else if( tbl.pathSub$retrospective_collection  == "YES"){ collection = "retrospective"
            } else { collection = NA }
            
            if (T.Stage == "[Not Available]") T.Stage = NA
            if (N.Stage == "[Not Available]") N.Stage = NA
            if (M.Stage == "[Not Available]") M.Stage = NA
            if (S.Stage == "[Not Available]") S.Stage = NA
            if (staging.System == "[Not Available]") staging.System = NA
            new.event <- list(PatientID=patient.id,
            PtNum=patient.number,
            study=study,
            Name=name,
            Fields = list(date=date, disease=pathDisease, histology=pathHistology,histology.category=NA, collection=collection, T.Stage=T.Stage, N.Stage=N.Stage, M.Stage=M.Stage,
            S.Stage=S.Stage,staging.System=staging.System))
            good.records.found <- good.records.found + 1
            result[[good.records.found]] <- new.event
        }
    } # for pathEvent
    
    if(nrow(tbl.omfSub)>0){
        for(omfEvent in 1:nrow(tbl.omfSub)){
            disease <- tbl.omfSub$other_malignancy_anatomic_site[omfEvent]
            omfOffset = tbl.omfSub$days_to_other_malignancy_dx[omfEvent]
            histology <- tbl.omfSub$other_malignancy_histological_type[omfEvent]
            
            if(disease   == "[Not Available]") disease = NA
            if(histology == "[Not Available]") histology = NA
            if(omfOffset == "[Not Available]"){ omf.date = NA
            }else{  omf.date = reformatDate(as.Date(diagnosis.date, "%m/%d/%Y") + as.integer(omfOffset))}
            
            new.event <- list(PatientID=patient.id,
            PtNum=patient.number,
            study=study,
            Name=name,
            Fields = list(date=omf.date, disease=disease, histology=histology,histology.category=NA, collection=NA, T.Stage=NA, N.Stage=NA, M.Stage=NA,S.Stage=NA,staging.System=NA))
            
            good.records.found <- good.records.found + 1
            result[[good.records.found]] <- new.event
        } }
    
    
    result[1:good.records.found]
    
} # create.Pathology.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Pathology.record <- function()
{
    print("--- test_create.Pathology.record")
    x <- create.Pathology.record("TCGA-AF-2687")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category","collection","T.Stage","N.Stage","M.Stage","S.Stage", "staging.System"))
    checkEquals(x[[1]], list(PatientID="TCGA.AF.2687", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2009", disease="Rectum", histology="Rectal Adenocarcinoma",histology.category=NA, collection="prospective", T.Stage="T3",N.Stage="N2",M.Stage="M0",S.Stage="Stage IIIC", staging.System=NA)))
    
    x <- create.Pathology.record("TCGA-AG-A00H") #has omf
    checkEquals(x[[1]], list(PatientID="TCGA.AG.A00H", PtNum=79, study=study, Name="Pathology",Fields=list(date="01/01/2008",disease="Rectum", histology="Rectal Adenocarcinoma", histology.category=NA, collection="retrospective", T.Stage="T3",N.Stage="N0",M.Stage="M0",S.Stage="Stage IIA", staging.System="6th")))


} # test_create.Pathology.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Pathology.records <- function(patient.ids)
{
    tbl.good <- subset(tbl.pt, bcr_patient_barcode %in% patient.ids )
    tbl.omfSub <- subset(tbl.omf,bcr_patient_barcode %in% patient.ids )
    ids <- unique(tbl.good$bcr_patient_barcode)   # 432
    
    count <- 1
    result <- vector("list", nrow(tbl.good))
    for(id in ids){
        #printf("id: %s", id)
        new.list <- create.Pathology.record(id)
        range <- count:(count+length(new.list)-1)
        result[range] <- new.list
        count <- count + length(new.list)
    } # for id
    
    # some number of the expected events will fail, often (always?) because
    # one or both dates is "[Not Available]".  count tells us how many good
    # we found
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
    result <- result[-deleters]
    
    result
} # create.all.Pathology.records
#------------------------------------------------------------------------------------------------------------------------
# $PatientID [1] "P1"
# $PtNum [1] 1
# $Name [1] "Pathology"
# $Fields
#   $date [1] "7/12/2006"
#   $specimenType brain, RL tumor
#   $site temporal frontal
#   $histology  read LGG
#   $histology2  Gliosarcoma
#   $Test      1p/q19,  PTEN, EGFR
#   $Result    Deletion, invalid, amplification, Negative, 100 
#   $Disease   Brain
#   $Grade     G1, G2/G3

create.Absent.record <- function(patient.id)
{
    
    tbl.nteSub <- subset(tbl.nte, bcr_patient_barcode==patient.id & new_tumor_event_dx_days_to != "[Not Available]" & (new_tumor_event_pharmaceutical_tx == "NO" | new_tumor_event_radiation_tx == "NO"))
    tbl.f2Sub  <- subset(tbl.f2,  bcr_patient_barcode==patient.id & new_tumor_event_dx_days_to != "[Not Available]" & (new_tumor_event_pharmaceutical_tx == "NO" | new_tumor_event_radiation_tx == "NO"))
    tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode==patient.id & days_to_other_malignancy_dx != "[Not Available]" & (drug_tx_indicator == "NO" | radiation_tx_indicator == "NO"))
    if(nrow(tbl.nteSub) == 0 && nrow(tbl.omfSub) == 0 && nrow(tbl.f2Sub) == 0)
    return(list())
    diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    name <- "Absent"
    
    tbl.rows <- tbl.nteSub[, c("new_tumor_event_dx_days_to", "new_tumor_event_radiation_tx", "new_tumor_event_pharmaceutical_tx")  ]
    if(nrow(tbl.f2Sub)>0) {
        f2 <- tbl.f2Sub[, c("new_tumor_event_dx_days_to", "new_tumor_event_radiation_tx", "new_tumor_event_pharmaceutical_tx")  ]
        tbl.rows <- rbind(tbl.rows, f2)
    }
    if(nrow(tbl.omfSub)>0) {
        omf <- tbl.omfSub[, c("days_to_other_malignancy_dx", "radiation_tx_indicator", "drug_tx_indicator")  ]
        colnames(omf) <- c("new_tumor_event_dx_days_to", "new_tumor_event_radiation_tx", "new_tumor_event_pharmaceutical_tx")
        tbl.rows <- rbind(tbl.rows, omf)
    }
    colnames(tbl.rows) <- c("new_tumor_event_dx_days_to", "new_tumor_event_radiation_tx", "new_tumor_event_pharmaceutical_tx")
    
    duplicates <- which(duplicated(tbl.rows))
    if(length(duplicates)>0)
    tbl.rows <- tbl.rows[-duplicates,]
    
    result <- vector("list", nrow(tbl.rows))
    good.records.found <- 0
    
    if(nrow(tbl.rows) >0){
        for(Event in 1:nrow(tbl.rows)){
            if(tbl.rows$new_tumor_event_dx_days_to[Event]=="[Pending]"){
                date = NA
            }else{
                dx.offset <-   as.integer(tbl.rows$new_tumor_event_dx_days_to[Event])
                date <- reformatDate(format(diagnosis.date + dx.offset))
            }
            drug <- tbl.rows$new_tumor_event_pharmaceutical_tx[Event]
            Rx <- tbl.rows$new_tumor_event_radiation_tx[Event]
            if(drug == "NO"){ drug = "TRUE"
            } else if (drug == "YES") { drug = "FALSE"
            } else { drug = NA }
            if(Rx == "NO"){ Rx = "TRUE"
            } else if (Rx == "YES") { Rx = "FALSE"
            } else { Rx = NA }
            
            if(Rx=="TRUE" | drug=="TRUE"){
                new.event <- list(PatientID=patient.id,
                PtNum=patient.number,
                study=study,
                Name=name,
                Fields = list(date=date, Radiation=Rx, Drug=drug))
                good.records.found <- good.records.found + 1
                result[[good.records.found]] <- new.event
            }
        }
    } # for AbsentEvent
    
    
    result[1:good.records.found]
    
} # create.Absent.record
#-----------------------------------------------------------------------------------------------------------------------------------------------
test_create.Absent.record <- function()
{
    print("--- test_create.Absent.record")
    x <- create.Absent.record("TCGA-AF-2689")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug"))
    checkEquals(length(x),3)
    checkEquals(x[[1]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study, Name="Absent", Fields=list(date="10/29/2009", Radiation="TRUE", Drug="FALSE")))
    checkEquals(x[[2]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study, Name="Absent", Fields=list(date="04/07/2010", Radiation="TRUE", Drug="FALSE")))
    checkEquals(x[[3]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study, Name="Absent", Fields=list(date="02/09/2012", Radiation="TRUE", Drug="TRUE")))
    
} # test_create.Absent.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Absent.records <- function(patient.ids)
{
   tbl.nteSub <- subset(tbl.nte, bcr_patient_barcode %in% patient.ids & new_tumor_event_dx_days_to != "[Not Available]" & (new_tumor_event_pharmaceutical_tx == "NO" | new_tumor_event_radiation_tx == "NO"))
   tbl.f2Sub  <- subset(tbl.f2,  bcr_patient_barcode %in% patient.ids & new_tumor_event_dx_days_to != "[Not Available]" & (new_tumor_event_pharmaceutical_tx == "NO" | new_tumor_event_radiation_tx == "NO"))
   tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode %in% patient.ids & days_to_other_malignancy_dx != "[Not Available]" & (drug_tx_indicator == "NO" | radiation_tx_indicator == "NO"))
  ids <- unique(c(tbl.nteSub$bcr_patient_barcode, tbl.f2Sub$bcr_patient_barcode, tbl.omfSub$bcr_patient_barcode))   

  count <- 1
  result <- vector("list", length(ids))
  for(id in ids){
     #printf("id: %s", id)
     new.list <- create.Absent.record(id)
     range <- count:(count+length(new.list)-1)
     result[range] <- new.list
     count <- count + length(new.list)
     } # for id

    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
        result <- result[-deleters]

    result

} # create.all.Absent.records
#------------------------------------------------------------------------------------------------------------------------
create.Tests.record <- function(patient.id)
{
    tbl.ptSub <- subset(tbl.pt, bcr_patient_barcode==patient.id & (kras_mutation_found != "[Not Available]" |
    braf_gene_analysis_indicator != "[Not Available]" | cea_level_pretreatment != "[Not Available]" |
    loci_tested_count == "[Not Available]" | mismatch_rep_proteins_tested_by_ihc =="YES" ))
    
    if(nrow(tbl.ptSub) == 0) return(list())
    
    #diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
    #diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    name <- "Tests"
    
    result <- vector("list", nrow(tbl.ptSub))
    good.records.found <- 0
    
    for(Event in 1:nrow(tbl.ptSub)){
        if(tbl.ptSub[Event,]$kras_mutation_found != "[Not Available]"){
            test = "kras"
            
            if( tbl.ptSub[Event,]$kras_mutation_found == "NO" ) res = "Not found"
            else res = tbl.ptSub[Event,]$kras_mutation_codon
            if(res == "[Not Available]") res=NA
            new.event <- list(PatientID=patient.id, PtNum=patient.number,study=study, Name=name, Fields = list(Date = NA, Type = NA, Test=test, Result=res))
            good.records.found <- good.records.found +1
            result[[good.records.found]] <- new.event
        }
        if(tbl.ptSub[Event,]$braf_gene_analysis_indicator != "[Not Available]"){
            test="braf"
            
            res = tbl.ptSub[Event,]$braf_gene_analysis_result
            if(res == "[Not Available]") res=NA
            new.event <- list(PatientID=patient.id, PtNum=patient.number,study=study, Name=name, Fields = list(Date = NA, Type = NA,Test=test, Result=res))
            good.records.found <- good.records.found +1
            result[[good.records.found]] <- new.event
        }
        if(tbl.ptSub[Event,]$cea_level_pretreatment != "[Not Available]"){
            test="cea"
            
            res = tbl.ptSub[Event,]$cea_level_pretreatment
            if(res == "[Not Available]") res=NA
            new.event <- list(PatientID=patient.id, PtNum=patient.number,study=study, Name=name, Fields = list(Date = NA, Type = NA,Test=test, Result=res))
            good.records.found <- good.records.found +1
            result[[good.records.found]] <- new.event
        }
        if(tbl.ptSub[Event,]$loci_tested_count != "[Not Available]"){
            test="loci"
            
            tested <- tbl.ptSub[Event,]$loci_tested_count
            res_loci <- tbl.ptSub[Event,]$loci_abnormal_count
            
            if(res_loci == "[Not Available]")res_loci=NA
            res = paste("tested:",tested,"; abnormal count:",res_loci)
            
            new.event <- list(PatientID=patient.id, PtNum=patient.number,study=study, Name=name, Fields = list(Date = NA, Type = NA,Test=test, Result=res))
            good.records.found <- good.records.found +1
            result[[good.records.found]] <- new.event
        }
        if(tbl.ptSub[Event,]$mismatch_rep_proteins_tested_by_ihc == "YES"){
          test="mismatched protein"
          
          tested <- tbl.ptSub[Event,]$mismatch_rep_proteins_tested_by_ihc
          res_pr <- tbl.ptSub[Event,]$mismatch_rep_proteins_loss_ihc
          
          if(res_pr == "[Not Available]")res_pr=NA
          res = paste("tested:",tested,"; mismatch proteins loss:",res_pr)
          
          new.event <- list(PatientID=patient.id, PtNum=patient.number,study=study, Name=name, Fields = list(Date = NA, Type = "IHC",Test=test, Result=res))
          good.records.found <- good.records.found +1
          result[[good.records.found]] <- new.event
      }
    }
    result[1:good.records.found]
} # create.Tests.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Tests.record <- function()
{
    print("--- test_create.Tests.record")
    x <- create.Tests.record("TCGA-DY-A1DE") #has two mutations
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("Date","Type","Test", "Result"))
    checkEquals(x[[1]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study, Name="Tests", Fields=list(Date=NA, Type=NA,Test="kras", Result="61")))
    checkEquals(x[[2]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study, Name="Tests", Fields=list(Date=NA, Type=NA,Test="braf", Result="Normal")))
    checkEquals(x[[3]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study, Name="Tests", Fields=list(Date=NA, Type=NA,Test="loci", Result="tested: 5 ; abnormal count: 0")))
    
    x <- create.Tests.record("TCGA-AG-4021")
    checkEquals(x[[1]], list(PatientID="TCGA.AG.4021", PtNum=74, study=study, Name="Tests",Fields=list(Date=NA, Type=NA,Test="braf", Result=NA)))
    checkEquals(x[[2]], list(PatientID="TCGA.AG.4021", PtNum=74, study=study, Name="Tests",Fields=list(Date=NA, Type=NA,Test="cea", Result="3101")))
    
    x <- create.Tests.record("TCGA-AF-6136")
    checkEquals(x[[1]], list(PatientID="TCGA.AF.6136", PtNum=13, study=study, Name="Tests",Fields=list(Date=NA, Type=NA,Test="cea", Result="18.3")))
    checkEquals(x[[2]], list(PatientID="TCGA.AF.6136", PtNum=13, study=study, Name="Tests",Fields=list(Date=NA, Type=NA,Test="loci", Result="tested: 5 ; abnormal count: 0")))
    checkEquals(x[[3]], list(PatientID="TCGA.AF.6136", PtNum=13, study=study, Name="Tests",Fields=list(Date=NA, Type="IHC",Test="mismatched protein", Result="tested: YES ; mismatch proteins loss: MLH1 Expressed|MSH2 Expressed|PMS2 Expressed|MSH6 Expressed")))
} # test_create.Tests.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Tests.records <- function(patient.ids)
{
    tbl.ptSub <- subset(tbl.pt, bcr_patient_barcode %in% patient.ids & (kras_mutation_found != "[Not Available]" |
    braf_gene_analysis_indicator != "[Not Available]" | cea_level_pretreatment != "[Not Available]"|
    loci_tested_count != "[Not Available]" | mismatch_rep_proteins_tested_by_ihc == "YES"))

    
    ids <- unique(tbl.ptSub$bcr_patient_barcode)
    
    count <- 1
    result <- vector("list", length(ids))
    for(id in ids){
        #printf("id: %s", id)
        new.list <- create.Tests.record(id)
        range <- count:(count+length(new.list)-1)
        result[range] <- new.list
        count <- count + length(new.list)
    } # for id
    
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
    result <- result[-deleters]
    
    result
    
} # create.all.Tests.records
#------------------------------------------------------------------------------------------------------------------------

create.Background.record <- function(patient.id)
{
    tbl.pt.Sub <- subset(tbl.pt, bcr_patient_barcode==patient.id)
    #tbl.f1.Sub <- subset(tbl.f1, bcr_patient_barcode==patient.id && (treatment_outcome_first_course != "[Not Applicable]"
    #|| treatment_outcome_first_course != "[Not Available]" || treatment_outcome_first_course != "[Unkonwn]"))
    
    if(nrow(tbl.pt.Sub) == 0)
    return(list())
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    name <- "Background"
    
    result <- vector("list", nrow(tbl.pt.Sub))
    good.records.found <- 0
    
    YES= c()
    NO = c()
    #his_lgg          <- tbl.pt.Sub$history_lgg_dx_of_brain_tissue
    his_om           <- tbl.pt.Sub$history_other_malignancy
    his_op           <- tbl.pt.Sub$history_colon_polyps
    First_Tx_Outcome <- tbl.pt.Sub$treatment_outcome_first_course
    family.colorec.history <- tbl.pt.Sub$family_history_colorectal_cancer
    neoadjuvant.treatment  <- tbl.pt.Sub$history_neoadjuvant_treatment
    
    if(is.na(his_om) || his_om == "[Not Available]"){ his_om = NA
    }else{ if (his_om == "NO") NO = c(NO,"history of other malignancy")
        else YES = c(YES, "history of other malignancy")
    }
    if(is.na(his_op) || his_op == "[Not Available]"){ his_op = NA
    }else{ if (his_op == "NO") NO = c(NO,"history of colon polyps")
        else YES = c(YES, "history of colon polyps")
    }
    if(family.colorec.history  == "[Not Available]" |family.colorec.history  == "[Unknown]"){
      family.colorec.history =NA
    }else{
      if(family.colorec.history == "NO") NO = c(NO, "family history of colorectal cancer")
      else YES = c(YES, "family history of colorectal cancer")
    }
    if(length(YES)==0) YES=NA
    if(length(NO)==0) NO=NA
    history = list(YES=YES, NO=NO)
    
    if(First_Tx_Outcome == "[Not Available]") First_Tx_Outcome = NA
    return(list(PatientID=patient.id, PtNum=patient.number, study=study, Name=name, 
      Fields = list(History = history, neoadjuvant.treatment=neoadjuvant.treatment,
      First_Tx_Outcome=First_Tx_Outcome,tobacco.usages=NA, smoking.status=NA, 
      num.packs.years=NA,num.packs.day=NA, alcohol.usage.yrs=NA, alcohol.amount=NA)))
    
} #create.Background.record
#---------------------------------------------------------------------------------------------------
test_create.Background.record <- function()
{
    x <- create.Background.record(tcga.ids[1])
    checkTrue(is.list(x))
    checkEquals(names(x), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[["Fields"]]), c("History", "neoadjuvant.treatment","First_Tx_Outcome",
      "tobacco.usages","smoking.status","num.packs.years","num.packs.day","alcohol.usage.yrs", "alcohol.amount"))
    checkEquals(x, list(PatientID="TCGA.AF.2687", PtNum=1, study=study, Name="Background", 
      Fields=list(History=list(YES=c("history of other malignancy","family history of colorectal cancer"),
        NO=c("history of colon polyps")), neoadjuvant.treatment="No", First_Tx_Outcome=NA,
        tobacco.usages=NA, smoking.status=NA, num.packs.years=NA,num.packs.day=NA, alcohol.usage.yrs=NA, alcohol.amount=NA)))
    
    x <- create.Background.record("TCGA-AH-6547") # treatment_outment_first_course == "[discrepancy]"
    checkEquals(x, list(PatientID="TCGA.AH.6547", PtNum=100, study=study, Name="Background", 
      Fields=list(History=list(YES=c("history of other malignancy","history of colon polyps", 
        "family history of colorectal cancer"),NO=NA), neoadjuvant.treatment="No", 
        First_Tx_Outcome=NA,tobacco.usages=NA, smoking.status=NA, num.packs.years=NA,num.packs.day=NA, 
        alcohol.usage.yrs=NA, alcohol.amount=NA)))
    
} #test_create.Background.record
#---------------------------------------------------------------------------------------------------
createPatientList <- function(Allevents=NA){

    if(all(is.na(Allevents)))
       return(list())

    list.events <- Allevents

    ptIDs = unique(unlist(lapply(list.events, function(e) e$PatientID)))
    
    ptList <- lapply(ptIDs, function(id){
        orderedEvents <- data.frame()
        noDateEvents <- data.frame()
        calcEvents <- data.frame()
        birth = death = diagnosis = progression = ""
        
        ptEvents <- list.events[sapply(list.events, function(ev) {ev$PatientID == id })]
        for(evID in names(ptEvents)){
            if(is.null(ptEvents[[evID]]$Fields$date)){
              noDateEvents  =  rbind(noDateEvents, data.frame(name=ptEvents[[evID]]$Name, eventID = evID))
          } else 
          if(any(is.na(ptEvents[[evID]]$Fields$date))){
              noDateEvents  =  rbind(noDateEvents, data.frame(name=ptEvents[[evID]]$Name, eventID = evID))
          } else if(length(ptEvents[[evID]]$Fields$date) == 1){
             orderedEvents <- rbind(orderedEvents, data.frame(name=ptEvents[[evID]]$Name, date = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y"), eventOrder="single", eventID = evID))
             if(ptEvents[[evID]]$Name == "Birth") birth = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
             else if(ptEvents[[evID]]$Name == "Status") death = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
             else if(ptEvents[[evID]]$Name == "Diagnosis") diagnosis = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
             else if(ptEvents[[evID]]$Name == "Progression") progression = as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y")
          } else {
           
             if(as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y") > as.Date(ptEvents[[evID]]$Fields$date[2], format="%m/%d/%Y")){
                 noDateEvents  <- rbind(noDateEvents, data.frame(name=ptEvents[[evID]]$Name, eventID = evID))            
             } else {
                 orderedEvents <- rbind(orderedEvents, data.frame(name=ptEvents[[evID]]$Name, date =  as.Date(ptEvents[[evID]]$Fields$date[1], format="%m/%d/%Y"), eventOrder="start", eventID = evID))
                 orderedEvents <- rbind(orderedEvents, data.frame(name=ptEvents[[evID]]$Name, date =  as.Date(ptEvents[[evID]]$Fields$date[2], format="%m/%d/%Y"), eventOrder="end", eventID = evID))
             }
          } 
      }
#    printf("Birth: %s Death: %s Diagnosis %s Progression %s", birth, death, diagnosis, progression)
      OneDay = 1000 *60 * 60*24;

    AgeDx   <- data.frame(name="Age at Diagnosis", value =NA, units="Years"); 
    Survival  <- data.frame(name="Survival", value =NA, units="Years");
    Dx2Prog <- data.frame(name="Diagnosis to Progression", value =NA,units="Months");
    ProgDeath <- data.frame(name="Progression to Status", value =NA, units="Months"); 
      if(class(birth) == "Date" && class(diagnosis) == "Date") AgeDx$value = as.numeric(diagnosis - birth)/365.25
      if(class(death) == "Date" && class(diagnosis) == "Date") Survival$value = as.numeric(death - diagnosis)/365.25
      if(class(progression) == "Date" && class(diagnosis) == "Date") Dx2Prog$value = as.numeric(progression - diagnosis)/30.425
      if(class(progression) == "Date" && class(death) == "Date")     ProgDeath$value = as.numeric(death - progression)/30.425

    calcEvents <- rbind(AgeDx, Survival, Dx2Prog, ProgDeath)

      if(nrow(orderedEvents)>0) orderedEvents <- orderedEvents[order(orderedEvents$date),]
      list(dateEvents = orderedEvents, noDateEvents=noDateEvents, calcEvents = calcEvents)
    })
       
    names(ptList) <- ptIDs
    ptList
}
#----------------------------------------------------------------------------------------------------
createEventTypeList <- function(Allevents=NA){

    if(all(is.na(Allevents)))
       return(list())

    list.events <- Allevents

    catNames = unique(unlist(lapply(list.events, function(e) e$Name)))
    
    categoryList <- lapply(catNames, function(name){
        fieldNames <- data.frame()
        hasDateEvents = FALSE
      catEvents <- list.events[sapply(list.events, function(ev) {ev$Name == name })]
        catFrame <- t(sapply(catEvents, function(ev) { ev$Fields }))
        if("date" %in% colnames(catFrame)){
        catFrame = catFrame[,-which(colnames(catFrame)=="date")]
        hasDateEvents = TRUE
        }
        if(name == "Background" && "History" %in% colnames(catFrame)){          ## NOT CURRENTLY HANDLED
#       evNames = unique(unlist(catFrame[,which(colnames(catFrame)=="History")]))
        catFrame = catFrame[,-which(colnames(catFrame)=="History")]
        }
        if(name == "Background" && "Symptoms" %in% colnames(catFrame)){
#     evNames = unique(unlist(catFrame[,which(colnames(catFrame)=="Symptoms")]))        
      catFrame = catFrame[,-which(colnames(catFrame)=="Symptoms")]
    }
        fieldList <- apply(catFrame, 2, function(field) {
          fieldTypes = unlist(unique(field))
          evList <- lapply(fieldTypes, function(evType){
            if(is.na(evType))
              evNames <- rownames(catFrame)[is.na(field)] 
            else
              evNames <- rownames(catFrame)[ which(field == evType)] 
            evNames
          })
          
          names(evList) <- fieldTypes
          evList
        })
        fieldList$dateIndicator = hasDateEvents
        fieldList
    })
       
    names(categoryList) <- catNames
  categoryList
}

#----------------------------------------------------------------------------------------------------
createPatientTable <- function(events=NA){

    if(all(is.na(events)))
       return(data.frame())

    list.events <- events

    ptIDs = unique(gsub("(\\w+\\.\\w+\\.\\w+).*", "\\1" , unlist(lapply(list.events, function(e) e$PatientID))))

     table <- data.frame(ptID=ptIDs, ptNum=NA, study=NA)
    rownames(table) <- ptIDs
    
    new.list <-lapply(list.events, function(event){  # remove "Fields" label and use value of 'Name' for unique headers
      id <- gsub("(\\w+\\.\\w+\\.\\w+).*", "\\1" , event$PatientID)
      a<- list(ptID=id, ptNum=event$PtNum, study=event$study)
      #if(length(event$Fields) != length(unlist(event$Fields))
      a[[event$Name]]<- as.list(unlist(event$Fields))  # for fields with multiple elements, e.g. date c(start, end) -> date1 date2
      a
    })
    
    for(event in new.list){
     if(is.na(table[event$ptID,"ptNum"])){                        # new pt now stored
       table[event$ptID, "ptNum"] <- event$ptNum 
       table[event$ptID, "study"] <- event$study 
     }  
     new.event<- data.frame(event[4], stringsAsFactors=F)
     if(all(colnames(new.event) %in% colnames(table))){           # not new event type overall
        if(all(is.na(table[event$ptID, colnames(new.event)]))) {  # fields not yet defined for this patient
          table[event$ptID, colnames(new.event)] <- unlist(new.event)
        } else{                                                   # iterate until new column label available
          
          count =2
          add.columns = paste(colnames(new.event), count, sep=".")
          while(all(add.columns %in% colnames(table)) && any(!is.na(table[event$ptID, add.columns]))) {
            count = count + 1;
            add.columns = paste(colnames(new.event), count, sep=".")
          }
          if(!all(add.columns %in% colnames(table))) table[, add.columns] <- NA
          table[event$ptID, add.columns] <- unlist(new.event)
        }
     } else{                                                     # create/add new set of event names
       table[, colnames(new.event)] <- NA
       table[event$ptID, colnames(new.event)] <- unlist(new.event)
     }
    }
    table$ptNum <- as.numeric(table$ptNum)
    
    table <- addCalculatedEvents(table)
    table

} # createTable
#----------------------------------------------------------------------------------------------------
addCalculatedEvents <- function(table= data.frame()){

     if(all(dim(table) == c(0,0))) return(table)

    if(all(c("Diagnosis.date","Status.date") %in% colnames(table)))
       table[ ,"Survival"] <- as.numeric(apply(table, 1, function(row){getDateDifference(row["Diagnosis.date"],row["Status.date"]) }) )
    if(all(c("Birth.date", "Diagnosis.date") %in% colnames(table)))
       table[ ,"AgeDx"] <- as.numeric(apply(table, 1, function(row){getDateDifference(row["Birth.date"], row["Diagnosis.date"]) }) )
    if(all(c("Diagnosis.date","Progression.date") %in% colnames(table))){
       allProgressionCols <- which(grepl("Progression.date", colnames(table)))
       table[ ,"TimeFirstProgression"] <- as.numeric(
           apply(table, 1, function(row){getDateDifference(row["Diagnosis.date"], row[allProgressionCols]) }))
    }
    
    table
}
#----------------------------------------------------------------------------------------------------
getDateDifference <- function(date1, date2, instance1=1, instance2=1){
   ## returns a single date difference for date2 - date1 by creating orded dates by first, second, ..,  or linked date pairs 
   ## instance  = 1, 2, ..., last, linked

   stopifnot(grepl("\\d+",instance1) | instance1 %in% c("last", "linked"))
   stopifnot(grepl("\\d+",instance2) | instance2 %in% c("last", "linked"))
         
   if(grepl("last", instance1)) instance1 = length(date1)
   if(grepl("last", instance2)) instance2 = length(date2)

   stopifnot(is.numeric(instance1) | is.numeric(instance2))
     # need at least one instance to define relationship 

   if(is.numeric(instance1)) stopifnot(instance1 <= length(date1))
   if(is.numeric(instance2)) stopifnot(instance2 <= length(date2))

   if(instance1 == "linked") stopifnot(length(date1) == length(date2))
   if(instance2 == "linked") stopifnot(length(date1) == length(date2))
     # for linked dates, lengths must be equal for matching

   #stopifnot( all(sapply(date1, isValidDate)))
   #stopifnot( all(sapply(date2, isValidDate)))

   date1 <- as.Date(as.character(date1), format="%m/%d/%Y")
   date2 <- as.Date(as.character(date2), format="%m/%d/%Y")

   if(is.numeric(instance1) & instance2 == "linked"){
     first.date  = date1[order(date1)][instance1]  # NAs ordered at end
     second.date = date2[order(date1)][instance1]
   } else if(is.numeric(instance2) & instance1 == "linked"){
     first.date = date1[order(date2)][instance2]
     second.date  = date2[order(date2)][instance2]
   } else if(is.numeric(instance1) & is.numeric(instance2)){
     first.date  = date1[order(date1)][instance1]
     second.date = date2[order(date2)][instance2]
   } 
   
   stopifnot(exists("first.date") & exists("second.date"))

   datediff = second.date - first.date
   
   as.numeric(datediff)   # will return NA if either value is NA
}

runTests()
run()