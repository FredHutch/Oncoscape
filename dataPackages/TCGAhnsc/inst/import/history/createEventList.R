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
#      choose hnsc, #cases with data (528 on 2/10/15)
#      choose "Biotab"
#      click "build archive" 
#      download tar.gz file (renaming it for clarity)  
#
#  As specified in file_manifest.txt - included files:
#
#      biospecimen_aliquot_hnsc.txt
#      biospecimen_analyte_hnsc.txt
#      biospecimen_cqcf_hnsc.txt                 cqcf: case quality control form
#      biospecimen_diagnostic_slides_hnsc.txt
#      biospecimen_normal_control_hnsc.txt
#      biospecimen_portion_hnsc.txt
#      biospecimen_protocol_hnsc.txt
#      biospecimen_sample_hnsc.txt
#      biospecimen_shipment_portion_hnsc.txt
#      biospecimen_slide_hnsc.txt
#      biospecimen_tumor_sample_hnsc.txt
#      clinical_drug_hnsc.txt
#      clinical_follow_up_v1.0_hnsc.txt
#      clinical_follow_up_v1.0_nte_hnsc.txt
#      clinical_nte_hnsc.txt
#      clinical_omf_v4.0_hnsc.txt
#      clinical_patient_hnsc.txt
#      clinical_radiation_hnsc.txt
#
# from these only the following clinical tables were used:
#
#   clinical_patient_hnsc.txt
#   clinical_drug_hnsc.txt
#   clinical_radiation_hnsc.txt
#   clinical_follow_up_v1.0_hnsc.txt
#   clinical_follow_up_v1.0_nte_hnsc.txt      nte: new tumor event
#   clinical_nte_hnsc.txt
#   clinical_omf_v4.0_hnsc.txt                omf: other malignancy form
#
#------------------------------------------------------------------------------------------------------------------------
options(stringsAsFactors=FALSE)
library(RUnit)
library(stringr)
library(R.utils)
#------------------------------------------------------------------------------------------------------------------------
# format(strptime("2009-08-11", "%Y-%m-%d"), "%m/%d/%Y") # ->  "08/11/2009"
reformatDate <- function(dateString)
{
   format(strptime(dateString, "%Y-%m-%d"), "%m/%d/%Y")

} # reformatDate

#------------------------------------------------------------------------------------------------------------------------
# sloppy ad hoc design currently requires these variables at global scope

currDir <- getwd()
setwd("../../../../RawData/TCGAhnsc/Clinical_7-15-15/")

study="TCGAhnsc"

tbl.pt <- read.table("clinical_patient_hnsc.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)#read
tbl.pt <- tbl.pt[3:nrow(tbl.pt),]
tcga.ids <- unique(tbl.pt$bcr_patient_barcode)
id.map <- 1:length(tcga.ids)
fixed.ids <- gsub("-", ".", tcga.ids, fixed=TRUE)
names(id.map) <- fixed.ids
tbl.drug <- read.table("clinical_drug_hnsc.txt", quote="", sep="\t", header=TRUE, as.is=TRUE) #read
tbl.drug <- tbl.drug[3:nrow(tbl.drug),]
tbl.rad <- read.table("clinical_radiation_hnsc.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)#read
tbl.rad <- tbl.rad[3:nrow(tbl.rad),]
tbl.f1 <- read.table("clinical_follow_up_v1.0_hnsc.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)#read
tbl.f1 <- tbl.f1[3:nrow(tbl.f1),]
tbl.f2 <- read.table("clinical_follow_up_v4.8_hnsc.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)#read
tbl.f2 <- tbl.f2[3:nrow(tbl.f2),]
tbl.f3 <- read.table("clinical_follow_up_v4.8_nte_hnsc.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)#read
tbl.f3 <-tbl.f3[3:nrow(tbl.f3),]
tbl.nte <- read.table("clinical_nte_hnsc.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)#read
tbl.nte <- tbl.nte[3:nrow(tbl.nte),]
tbl.omf <- read.table("clinical_omf_v4.0_hnsc.txt", quote="", sep="\t", header=TRUE, as.is=TRUE)#read
tbl.omf <- tbl.omf[3:nrow(tbl.omf),]
tbl.cqcf <- read.table("clinical_cqcf_hnsc.txt",quote="",sep="\t",header=TRUE, as.is=TRUE) #read
tbl.cqcf <-tbl.cqcf[3:nrow(tbl.f3),]
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
 
   checkEquals(length(history), 3902)
   checkEquals(as.list(table(unlist(lapply(history, function(e) e["Name"])))), list(`Absent`=47, `Background`= 516,`Birth`=526, `Diagnosis`=526,`Drug`=343,`Pathology`=567,`Procedure`=60, `Progression`=108,  `Radiation`=452, `Status`=526, `Tests`=231))
      #omf: other malignancy form for 2 patients gives extra pathologies
      # many additional surgeries marked (new_tumor_event_additional_surgery_procedure = YES) but no date given
      
   serialized.file.name <- "../../extdata/history.RData"
   #printf("saving Background to %s", serialized.file.name)
   
   save(history, file=serialized.file.name)

} # run
#------------------------------------------------------------------------------------------------------------------------
parseEvents = function(patient.ids=NA)
{
   
    dob.events <- lapply(patient.ids, function(id) create.DOB.record(id))
    diagnosis.events <- create.all.Diagnosis.records(patient.ids)
    chemo.events <- create.all.Chemo.records(patient.ids)#
    radiation.events <- create.all.Radiation.records(patient.ids)
    
    encounter.events <- create.all.Encounter.records(patient.ids)
    pathology.events <- create.all.Pathology.records(patient.ids)
    progression.events <- create.all.Progression.records(patient.ids)
    
    status.events <- lapply(patient.ids, create.status.record)
    procedure.events <- create.all.Procedure.records(patient.ids)
    absent.events <- create.all.Absent.records (patient.ids)
    Background.events <- create.all.Background.records(patient.ids)#
    Tests.events <- create.all.Tests.records(patient.ids)
# hnsc surgery at time of Dx & not reported, but other post/pre surgeries in other tables

    events <- append(dob.events, chemo.events)
    events <- append(events, diagnosis.events)
    events <- append(events, status.events)
    events <- append(events, progression.events)
    events <- append(events, radiation.events)
    events <- append(events, procedure.events)
    events <- append(events, encounter.events)
    events <- append(events, pathology.events)
   
    events <- append(events, absent.events)
    events <- append(events, Background.events)
    events <- append(events, Tests.events)

#    printf("found %d events for %d patients", length(events), length(patient.ids))
    print(table(unlist(lapply(events, function(e) e["Name"]))))
    
    events

} # parseEvents
#------------------------------------------------------------------------------------------------------------------------
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
   test_create.Background.record()
   test_create.Tests.record()

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
   
   #if(gender == "Unspecified") gender = "absent"
   #if(gender == "Unknown") gender = NA
   if(!is.na(gender)) gender= tolower(gender)
   
   if(race == "Not reported") race = "absent"
   if(race == "Unknown" || race == "[Not Available]" || race == "[Not Evaluated]" || race == "[Unknown]") race = NA
   if(!is.na(race)) race=tolower(race)

   if(ethnicity == "Not reported") ethnicity  = "absent"
   if(ethnicity == "Unknown" || ethnicity == "[Not Available]" || ethnicity == "[Not Evaluated]" || ethnicity == "[Unknown]") ethnicity  = NA
   if(!is.na(ethnicity)) ethnicity=tolower(ethnicity)
   
   return(list(PatientID=patient.id, PtNum=patient.number, study="TCGAhnsc", Name="Birth", Fields= list(date=c(dob), gender=gender, race=race, ethnicity=ethnicity)))
   
} # create.DOB.record
#------------------------------------------------------------------------------------------------------------------------
test_create.DOB.record <- function()
{
    print("--- test_create.DOB.record")
    x <- create.DOB.record(tcga.ids[15])
    checkTrue(is.list(x))
    checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
    checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
    checkEquals(x, list(PatientID="TCGA.BA.5559", PtNum=15, study="TCGAhnsc", Name="Birth", Fields=list(date="01/13/1934", gender="male", race="white", ethnicity="not hispanic or latino")))
    x <- create.DOB.record(tcga.ids[100])
    checkEquals(x, list(PatientID="TCGA.CN.6017", PtNum=100, study="TCGAhnsc", Name="Birth", Fields=list(date="04/07/1954", gender="male", race="white", ethnicity="not hispanic or latino")))
        
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
      if( drug == "[Not Available]" || drug == "[Unknown]"){ drug = NA}
      else {
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
          if( drug == "Cisplatain" | drug == "Cisplastin" | drug == "CISplatinum"){ drug = "Cisplatin"}
          if( drug == "CPT 11" | drug == "CPT11" | drug =="cpt-11"){ drug = "CPT-11"}
          if( drug == "Erlotinib (Tarceva)" | drug == "Erlotonib") { drug ="Erlotinib"}
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
          if( drug == "Doxetaxol" | drug == "Taxotere" | drug == "Docetoxel/Taxotere"){ drug="Docetaxel"}
          if( drug == "Navelbine" | drug == "Vinorelbin" | drug == "Vinorelbine Tartrate"){ drug="Vinorelbine"}
          if( drug == "Taxol"){ drug ="Paclitaxel" }
          if( drug == "MDX-1106 clinical trial"){ drug ="nivolumab" }
          if( drug == "gemcitabine"){ drug ="Gemzar" }
          if( drug == "Almita" | drug == "Almita" | drug == "Pemethexed" | drug == "Pemetrexed" | drug == "Pemetrexed disodium" | drug == "Premetrexed"){ drug ="Alimta"}
          if( drug == "Carboplatinum"){ drug ="Carboplatin"}
          if( drug == "rec MAGE 3-AS + AS15 ACS1 / Placebo Vaccine"){ drug=NA}
          }
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


    if(therapyType == "[Discrepancy]" || therapyType == "[Not Available]") therapyType = NA
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
      if(omfOffset == "[Not Available]" || omfOffset == "[Pending]"){ omf.date = c(NA, NA)
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
    x <- create.Chemo.record("TCGA-BA-4075")
    checkTrue(is.list(x))
    checkEquals(length(x), 3)
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[2]][["Fields"]]), c("date", "therapyType", "agent", "intent", "dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
    checkEquals(x[[1]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study, Name="Drug", Fields=list(date=c("09/21/2004","10/19/2004"), therapyType="Chemotherapy", agent="Carboplatin", intent="palliative"  , dose=2, units="AUC", totalDose=NA,  totalDoseUnits=NA, route=NA, cycle=NA)))
    checkEquals(x[[2]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study, Name="Drug", Fields=list(date=c("09/21/2004","10/19/2004"), therapyType="Chemotherapy", agent="Paclitaxel", intent="palliative"  , dose=45, units="mg/m2", totalDose=NA,  totalDoseUnits=NA, route=NA, cycle=NA)))
    

   x <- create.Chemo.record("TCGA-CR-6474")  #no start date
   checkEquals(length(x), 1)
   checkEquals(x[[1]], list(PatientID="TCGA.CR.6474", PtNum=185, study=study, Name="Drug", Fields=list(date=c(NA,NA), therapyType="Chemotherapy", agent=NA, intent="palliative"  , dose=NA, units=NA, totalDose=NA, totalDoseUnits=NA, route=NA, cycle=NA)))
   x <- create.Chemo.record("TCGA-KU-A6H8")  # no end date
   checkEquals(length(x), 3)
   checkEquals(x[[3]], list(PatientID="TCGA.KU.A6H8", PtNum=452, study=study, Name="Drug", Fields=list(date=c("07/30/2013", NA), therapyType="Chemotherapy", agent="Carboplatin", intent=NA, dose=NA, units=NA, totalDose=NA, totalDoseUnits=NA, route=NA, cycle=NA)))
   x <- create.Chemo.record("TCGA-CV-5430") # recurrence
   checkEquals(length(x), 3)
   checkEquals(x[[3]], list(PatientID="TCGA.CV.5430", PtNum=229, study=study, Name="Drug", Fields=list(date=c("06/30/2003","08/30/2003"), therapyType="Chemotherapy", agent="Irinotecan", intent="recurrence", dose=NA, units=NA, totalDose=NA, totalDoseUnits=NA, route="Intravenous (IV)", cycle=4)))
   x <- create.Chemo.record("TCGA-BA-4075") # omf chemo
   checkEquals(length(x),3)
   checkEquals(x[[1]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study, Name="Drug", Fields=list(date=c("09/21/2004", "10/19/2004"), therapyType="Chemotherapy", agent="Carboplatin", intent="palliative" , dose=2, units="AUC", totalDose=NA, totalDoseUnits=NA, route=NA, cycle=NA)))
   
   
   
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
    # if(pathMethod == "Fine needle aspiration biopsy") pathMethod = "Aspirate"
    # if(pathMethod == "Core needle biopsy") pathMethod = "Core Biopsy"
    # if(pathMethod == "Other method, specify:") pathMethod = "Other"
    # if(pathMethod == "Unknown") pathMethod = NA

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
    checkEquals(x[[1]], list(PatientID="TCGA.4P.AA8J", PtNum=1, study=study, Name="Diagnosis", Fields=list(date="01/01/2013", disease="Head and Neck", siteCode="4P")))

} # test_create.Diagnosis.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Diagnosis.records <- function(patient.ids)
{
    # 592 good rows
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
        if(vital != "Dead"){
            tbl.fu2.rows <- subset(tbl.f2, bcr_patient_barcode==patient.id)
            if(nrow(tbl.fu2.rows) != 0 ){
                for(i in 1:nrow(tbl.fu2.rows)){
                    row <- tbl.fu2.rows[i,]
                    if(row["vital_status"]=="Dead"){
                        vital= row[["vital_status"]]; status.offset <- as.integer(row["death_days_to"])
                    }else{ if(is.na(status.offset) || row["last_contact_days_to"] > status.offset){
                        vital=row[["vital_status"]]; status.offset <- as.integer(row["last_contact_days_to"])}
                    }
                     tumorStatus = row["tumor_status"]
                    }
                }
            }
        
		if(vital == "[Not Available]" || vital == "Unknown") vital=NA
	}

    if(tumorStatus == "[Not Available]" || tumorStatus == "Unknown"){ tumorStatus=NA
    }else{ tumorStatus = tolower(tumorStatus) }

   date <- reformatDate(format(diagnosis.date + status.offset))


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
    checkEquals(x, list(PatientID="TCGA.4P.AA8J", PtNum=1, study=study, Name="Status", Fields=list(date="04/13/2013", status="Alive", tumorStatus="tumor free")))
	x <- create.status.record("TCGA-CN-6017")
    checkEquals(x, list(PatientID="TCGA.CN.6017", PtNum=100, study=study, Name="Status", Fields=list(date="05/03/2012", status="Dead", tumorStatus="tumor free")))
   
   x <- create.status.record("TCGA-BA-4074")
    x <- create.status.record("TCGA-BA-4075")
    x <- create.status.record("TCGA-BA-4076")
    

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
   tbl.fu.rows <- subset(tbl.f3, bcr_patient_barcode==patient.id)
   tbl.nte.rows <- subset(tbl.nte, bcr_patient_barcode==patient.id)
   
   if(nrow(tbl.fu.rows) == 0 & nrow(tbl.nte.rows)==0)
       return(list())

  tbl.fu.rows <- tbl.fu.rows[, c("new_tumor_event_type","new_tumor_event_dx_days_to") ]
  if(nrow(tbl.nte.rows)>0) { 
     nte <- tbl.nte.rows[,c("new_tumor_event_type","new_tumor_event_dx_days_to")]
     tbl.fu.rows <- rbind(tbl.fu.rows, nte)
     #tbl.fu.rows <- nte
  }
  tbl.fu.rows <- tbl.fu.rows[with(tbl.fu.rows, order(new_tumor_event_dx_days_to)),]
  duplicates <- which(duplicated(tbl.fu.rows[,"new_tumor_event_dx_days_to"]))
  if(length(duplicates)>0){
     dupVals <- unique(tbl.fu.rows[duplicates, "new_tumor_event_dx_days_to"])
     originals <- match(dupVals, tbl.fu.rows$new_tumor_event_dx_days_to)
     allVals <- sapply(dupVals, function(val) {
       t<- paste(tbl.fu.rows[which(tbl.fu.rows$new_tumor_event_dx_days_to == val), "new_tumor_event_type"], collapse=";")
       t<- gsub("\\[Unknown\\]", "", t)
       t<- gsub("\\[Not Available\\]", "", t)
       t<- gsub("NA", "", t)
       while(grepl(";;", t)){ t<- gsub(";;", ";", t)}
       gsub(";$", "", t)
     })
     tbl.fu.rows[originals, "new_tumor_event_type"] <- allVals
     tbl.fu.rows <- tbl.fu.rows[-duplicates,]
  }

   name <- "Progression"
   result <- vector("list", nrow(tbl.fu.rows) )
   good.records.found <- 0

   if(nrow(tbl.fu.rows)>0){
 	for(i in 1:nrow(tbl.fu.rows)){
	  row <- tbl.fu.rows[i, ]
	  eventtype <- row[["new_tumor_event_type"]]
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
    }}
    
    
   result[1:good.records.found]
   
} # create.Progression.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Progression.record <- function()
{
    print("--- test_create.Progression.record")
    x <- create.Progression.record("TCGA-BA-A4IF")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
    checkEquals(x[[1]], list(PatientID="TCGA.BA.A4IF", PtNum=23, study=study, Name="Progression", Fields=list(date="04/08/2012", event="New Primary Tumor", number=1)))
    x <- create.Progression.record("TCGA-UF-A7JV")
    checkEquals(x[[1]], list(PatientID="TCGA.UF.A7JV", PtNum=523, study=study, Name="Progression", Fields=list(date="02/25/2011", event=NA, number=1)))
    x <- create.Progression.record("TCGA-QK-A6IH") # two records in follow up nte
    checkEquals(length(x),2)
    checkEquals(x[[1]], list(PatientID="TCGA.QK.A6IH", PtNum=482, study=study, Name="Progression", Fields=list(date="08/17/2013", event=NA, number=1)))
    checkEquals(x[[2]], list(PatientID="TCGA.QK.A6IH", PtNum=482, study=study, Name="Progression", Fields=list(date="09/06/2013", event="Distant Metastasis;Distant Metastasis", number=2)))
    x <- create.Progression.record("TCGA-BA-A6DB") # only in nte
    checkEquals(x[[1]], list(PatientID="TCGA.BA.A6DB", PtNum=29, study=study, Name="Progression", Fields=list(date="07/27/2012", event="Locoregional Disease", number=1)))
    
   
} # test_create.Progression.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Progression.records <- function(patient.ids)
{
      # 89 good rows
   tbl.good <- subset(tbl.f3, bcr_patient_barcode %in% patient.ids & new_tumor_event_dx_days_to != "[Not Available]")
   tbl.nteSub <- subset(tbl.nte, bcr_patient_barcode %in% patient.ids & new_tumor_event_dx_days_to != "[Not Available]")
   ids <- unique(c(tbl.good$bcr_patient_barcode, tbl.nteSub$bcr_patient_barcode))
   #ids <- unique(tbl.nteSub$bcr_patient_barcode)

  count <- 1
  #result <- vector("list", nrow(tbl.good))
  result <- vector("list", nrow(tbl.nteSub))
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
#    $disease     "Head and Neck"
   	
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
    if(grepl("[A-Za-z]", totalDose)){
        if(is.na(totalDoseUnits)){
           totalDoseUnits <- str_extract(totalDose, "[A-Za-z]+")
        }
        totalDose <- str_extract(totalDose,"[0-9,]+")
        totalDose <- as.integer(gsub(",","",totalDose))
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
      if(omfOffset == "[Not Available]" || omfOffset == "[Pending]"){ omf.date = NA
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
    x <- create.Radiation.record("TCGA-CX-7082")
    checkTrue(is.list(x))
   checkEquals(x[[1]], list(PatientID="TCGA.CX.7082", PtNum=364, study=study, Name="Radiation", Fields=list(date=c(NA), therapyType="Prior Malignancy", intent=NA, target="Locoregional, at primary tumor site: no", totalDose=NA, totalDoseUnits=NA, numFractions=NA)))
   x <- create.Radiation.record("TCGA-BA-5153")  # rad two records
   checkEquals(x[[1]], list(PatientID="TCGA.BA.5153", PtNum=10, study=study, Name="Radiation", Fields=list(date=c("02/11/2005", "04/02/2005"), therapyType=NA, intent="adjuvant", target="Primary Tumor Field", totalDose=NA, totalDoseUnits=NA, numFractions=NA)))
   checkEquals(x[[2]], list(PatientID="TCGA.BA.5153", PtNum=10, study=study, Name="Radiation", Fields=list(date=c(NA, NA), therapyType=NA, intent="palliative", target="Distant Recurrence", totalDose=NA, totalDoseUnits=NA, numFractions=NA)))

   x <- create.Radiation.record("TCGA-CV-A6JN" )  # omf two records
   checkEquals(x[[1]], list(PatientID="TCGA.CV.A6JN", PtNum=355, study=study, Name="Radiation", Fields=list(date=c("02/09/2011", "03/19/2011"), therapyType="external", intent=NA, target="Primary Tumor Field", totalDose=6000, totalDoseUnits="cGy", numFractions=30)))
   checkEquals(x[[2]], list(PatientID="TCGA.CV.A6JN", PtNum=355, study=study, Name="Radiation", Fields=list(date=c("02/09/2011", "03/19/2011"), therapyType="external", intent=NA, target="Regional site", totalDose=5700, totalDoseUnits="cGy", numFractions=30)))
} # test_create.Radiation.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Radiation.records <- function(patient.ids)
{
   #302 good records
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

   tbl.encSub  <- subset(tbl.pt, bcr_patient_barcode==patient.id)
   tbl.fuSub  <- subset(tbl.f1, bcr_patient_barcode==patient.id)
   tbl.fu2Sub  <- subset(tbl.f2, bcr_patient_barcode==patient.id)
   
   if(nrow(tbl.encSub) == 0 & nrow(tbl.fuSub) ==0 & nrow(tbl.fu2Sub))
       return(list())  

   patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
   patient.number <- as.integer(id.map[patient.id])   
   name <- "Encounter"

   result <- vector("list", nrow(tbl.encSub)+nrow(tbl.nteSub))
   good.records.found <- 0
   
   if(nrow(tbl.encSub)>0){
   for(encEvent in 1:nrow(tbl.encSub)){
       encType <- tbl.encSub$performance_status_timing[encEvent]
       if(encType == "Preoperative") encType = "Pre-Operative"
      if(encType == "[Not Evaluated]") encType = "absent"
      if(encType == "[Not Available]" | encType == "Unknown" | encType == "[Not Evaluated]") encType = NA
            
            KPS    <- tbl.encSub$karnofsky_score[encEvent]
            ECOG   <- tbl.encSub$ecog_score[encEvent]
   	 
     
      if(KPS == "[Not Evaluated]") KPS = "absent"
      if(KPS == "[Not Available]" | KPS == "Unknown" | KPS == "[Not Evaluated]" ) KPS = NA
      if(ECOG == "[Not Evaluated]") ECOG = "absent"
      if(ECOG == "[Not Available]" | ECOG == "Unknown" | ECOG == "[Not Evaluated]" ) ECOG = NA
      
   	  if(grepl("^\\d+$",KPS)) KPS = as.integer(KPS)
   	  if(grepl("^\\d+$",ECOG)) ECOG = as.integer(ECOG)
   	  
      new.event <- list(PatientID=patient.id,
                        PtNum=patient.number,
                        study=study,
                        Name=name,
                        Fields = list(type=NA, kps=NA, ecog=NA, date=NA,Systolic=NA, Diastolic=NA, Height=NA, Weight=NA, BSA=NA, BMI=NA, ZubrodScore=NA))
      good.records.found <- good.records.found + 1
      result[[good.records.found]] <- new.event
      
      
}} # for encEvent

      result[1:good.records.found]
   
} # create.Encounter.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Encounter.record <- function()
{
    print("--- test_create.Encounter.record")
    #x <- create.Encounter.record(tcga.ids[1])
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("type", "kps", "ecog", "date","Systolic","Diastolic","Height","Weight","BSA","BMI","ZubrodScore"))
    #checkEquals(x[[1]], list(PatientID="TCGA.4P.AA8J", PtNum=1, study=study, Name="Encounter", Fields=list(type=NA, kps=NA, ecog=NA,
    #            date=NA,Systolic=NA, Diastolic=NA, Height=NA, Weight=NA, BSA=NA, BMI=NA, ZubrodScore=NA)))
    
    patient.ids <- tcga.ids
    tbl.ptSub  <- subset(tbl.pt, bcr_patient_barcode %in% patient.ids )
    tbl.fuSub  <- subset(tbl.f1, bcr_patient_barcode %in% patient.ids)
    tbl.fu2Sub <- subset(tbl.f2, bcr_patient_barcode %in% patient.ids)
    
    string <- c("kps","ecog","systolic","diastolic","height","weight","bsa","bmi","zubrod")
    ids <- c()
    if(any(string %in% tolower(colnames(tbl.ptSub)))==TRUE){
        ids <- c(ids,tbl.ptSub$bcr_patient_barcode)
    }
    if(any(string %in% tolower(colnames(tbl.fuSub)))==TRUE){
        ids <- c(ids,tbl.fuSub$bcr_patient_barcode)
    }
    if(any(string %in% tolower(colnames(tbl.fu2Sub)))==TRUE){
        ids <- c(ids,tbl.fu2Sub$bcr_patient_barcode)
    }
    
    #ids <- unique(c(tbl.ptSub$bcr_patient_barcode, tbl.fuSub$bcr_patient_barcode,tbl.fu2Sub$bcr_patient_barcode ))
    ids <- unique(ids)
    checkEquals(length(ids),0)
    printf(": %d available encounter record of this organ site\n", length(ids))
    
} # test_create.Encounter.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Encounter.records <- function(patient.ids)
{
      # 526 good rows
  tbl.ptSub  <- subset(tbl.pt, bcr_patient_barcode %in% patient.ids )
  tbl.fuSub  <- subset(tbl.f1, bcr_patient_barcode %in% patient.ids)
  tbl.fu2Sub <- subset(tbl.f2, bcr_patient_barcode %in% patient.ids)
  
  string <- c("kps","ecog","systolic","diastolic","height","weight","bsa","bmi","zubrod")
  ids <- c()
  if(any(string %in% tolower(colnames(tbl.ptSub)))==TRUE){
      ids <- c(ids,tbl.ptSub$bcr_patient_barcode)
  }
  if(any(string %in% tolower(colnames(tbl.fuSub)))==TRUE){
      ids <- c(ids,tbl.fuSub$bcr_patient_barcode)
  }
  if(any(string %in% tolower(colnames(tbl.fu2Sub)))==TRUE){
      ids <- c(ids,tbl.fu2Sub$bcr_patient_barcode)
  }
  
  #ids <- unique(c(tbl.ptSub$bcr_patient_barcode, tbl.fuSub$bcr_patient_barcode,tbl.fu2Sub$bcr_patient_barcode ))
  ids <- unique(ids)
  if(length(ids) == 0){
      return(list())
  }else{
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
  }
  
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
    
    #tbl.ptSub  <- subset(tbl.pt,  bcr_patient_barcode==patient.id)
    tbl.f1Sub  <- subset(tbl.f1,  bcr_patient_barcode==patient.id &
                        (new_tumor_event_surgery_days_to_loco != "[Not Available]"  | new_tumor_event_surgery_days_to_met != "[Not Available]") &
                         (new_tumor_event_surgery_days_to_loco != "[Not Applicable]" | new_tumor_event_surgery_days_to_met != "[Not Applicable]"))
    
    tbl.f3Sub  <- subset(tbl.f3,  bcr_patient_barcode==patient.id &
                         (new_tumor_event_surgery!= "[Not Available]"|
                         new_tumor_event_surgery!="[Unknown]"))
    
    tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode==patient.id & (days_to_surgical_resection != "[Not Available]") & (days_to_surgical_resection != "[Pending]"))
    
    if( nrow(tbl.f1Sub) ==0 && nrow(tbl.f3Sub) ==0 && nrow(tbl.omfSub) ==0)
    return(list())
    
    diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    name <- "Procedure"
    
    result <- vector("list", nrow(tbl.nteSub) + nrow(tbl.omfSub))
    good.records.found <- 0
    
    
    if(nrow(tbl.f1Sub)>0){
        for(Event in 1:nrow(tbl.f1Sub)){
            date <- tbl.f1Sub$new_tumor_event_surgery_days_to_loco[Event]
            if(date != "[Not Available]" & date != "[Not Applicable]"){
                date = reformatDate(diagnosis.date + as.integer(date))
                #site <- tbl.f1Sub$new_tumor_event_site[Event]
                #site_other <- tbl.f1Sub$new_tumor_event_site_other[Event]
                #if(site == "[Not Available]") site <- NA
                #if(site_other == "[Not Available]") site_other <- NA
                #if(!is.na(site_other)){site <- paste(site,site_other, sep=";")
                #}else{
                #    site <- site
                #}
                new.event <- list(PatientID=patient.id,
                PtNum=patient.number,
                study=study,
                Name=name,
                Fields = list(date=date, service=NA, name = NA, site = "locoregional", side = NA, location = NA))
                good.records.found <- good.records.found + 1
                result[[good.records.found]] <- new.event
            }
            date <- tbl.f1Sub$new_tumor_event_surgery_days_to_met[Event]
            if(date != "[Not Available]" & date != "[Not Applicable]"){
                date = reformatDate(diagnosis.date + as.integer(date))
                #site <- tbl.f1Sub$new_tumor_event_site[Event]
                #site_other <- tbl.f1Sub$new_tumor_event_site_other[Event]
                #if(site == "[Not Available]") site <- NA
                #if(site_other == "[Not Available]") site_other <- NA
                #if(!is.na(site_other)){site <- paste(site,site_other, sep=";")
                #}else{
                #    site <- site
                #}
                new.event <- list(PatientID=patient.id,
                PtNum=patient.number,
                study=study,
                Name=name,
                Fields = list(date=date, service=NA, name = NA, site = "metastasis", side = NA, location = NA))
                good.records.found <- good.records.found + 1
                result[[good.records.found]] <- new.event
            }

        }} # for tbl.f1
    
    if(nrow(tbl.f3Sub)>0){
        for(Event in 1:nrow(tbl.f3Sub)){
            date <- tbl.f3Sub$new_tumor_event_surgery_days_to[Event]
            if(date != "[Not Available]" & date != "[Not Applicable]"){
                date = reformatDate(diagnosis.date + as.integer(date))
                site <- tbl.f3Sub$new_tumor_event_site[Event]
                if(site == "[Not Available]") site <- NA
                new.event <- list(PatientID=patient.id,
                PtNum=patient.number,
                study=study,
                Name=name,
                Fields = list(date=date, service=NA, name = NA, site =site, side = NA, location = NA))
                good.records.found <- good.records.found + 1
                result[[good.records.found]] <- new.event
            }
        }} # for tbl.f3
    
    if(nrow(tbl.omfSub)>0){
        for(Event in 1:nrow(tbl.omfSub)){
            date <- tbl.omfSub$days_to_surgical_resection[Event]
            if(date != "[Not Available]" & date != "[Not Applicable]"){
                date = reformatDate(diagnosis.date + as.integer(date))
            Surgeryname <- tbl.omfSub$surgery_type[Event]
            if(Surgeryname == "[Not Available]") Surgeryname = NA
            side <- tbl.omfSub$other_malignancy_laterality[Event]
            if(side == "[Not Available]"|side =="[Not Applicable]" |side =="[Unknown]") side = NA
            
            new.event <- list(PatientID=patient.id,
            PtNum=patient.number,
            study=study,
            Name=name,
            Fields = list(date=date, service=NA, name = Surgeryname, site = NA, side = side, location = NA))
            good.records.found <- good.records.found + 1
            result[[good.records.found]] <- new.event
            }
        }} # for tbl.omf
    
    
    result[1:good.records.found]
    
} # create.Procedure.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Procedure.record <- function()
{
    print("--- test_create.Procedure.record")
    x <- create.Procedure.record("TCGA-BA-5149") #from tbl.f1
    checkTrue(is.list(x))
    checkEquals(x[[1]], list(PatientID="TCGA.BA.5149", PtNum=7, study=study, Name="Procedure", Fields=list(date="02/14/2011", service=NA, name=NA, site="metastasis", side=NA, location=NA)))
    
    x <- create.Procedure.record("TCGA-BA-A4IF") #from tbl.f3
    checkEquals(length(x), 1)
    checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("date", "service", "name", "site", "side", "location"))
    checkEquals(x[[1]], list(PatientID="TCGA.BA.A4IF", PtNum=23, study=study, Name="Procedure", Fields=list(date= "04/08/2012", service=NA, name=NA, site=NA, side=NA, location=NA)))
    
    
    
    x <- create.Procedure.record("TCGA-CN-6997") #from tbl.omf
    checkEquals(x[[1]], list(PatientID="TCGA.CN.6997", PtNum=114, study=study, Name="Procedure", Fields=list(date= "01/22/2011", service=NA, name="TOTAL LARYNGECTOMY PARTIAL PHARYNGECTOMY L THYROID LOBECTOMY BILATERAL SELECTIVE NECK DISSECTION L CENTRAL COMPARTMENT NECK DISSECTION", site=NA, side=NA, location=NA)))
    x <- create.Procedure.record("TCGA-CQ-7063") # two records from tbl.omf
    checkEquals(length(x), 2)
    checkEquals(names(x[[1]][["Fields"]]), c("date", "service", "name", "site", "side", "location"))
    checkEquals(x[[1]], list(PatientID="TCGA.CQ.7063", PtNum=157, study=study, Name="Procedure", Fields=list(date= "05/14/2001", service=NA, name="left partial glossectomy", site=NA, side="Left", location=NA)))
    checkEquals(names(x[[2]][["Fields"]]), c("date", "service", "name", "site", "side", "location"))
    checkEquals(x[[2]], list(PatientID="TCGA.CQ.7063", PtNum=157, study=study, Name="Procedure", Fields=list(date= "03/05/2008", service=NA, name="right partial glossectomy", site=NA, side="Right", location=NA)))
    
} # test_create.Procedure.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Procedure.records <- function(patient.ids)
{
    #95 good records
    tbl.f1Sub  <- subset(tbl.f1,  bcr_patient_barcode %in% patient.ids & (new_tumor_event_surgery_days_to_loco != "[Not Available]"  | new_tumor_event_surgery_days_to_met != "[Not Available]") & (new_tumor_event_surgery_days_to_loco != "[Not Applicable]" | new_tumor_event_surgery_days_to_met != "[Not Applicable]"))
    tbl.f3Sub <- subset(tbl.f3, bcr_patient_barcode %in% patient.ids & (new_tumor_event_surgery!= "[Not Available]"|new_tumor_event_surgery!="[Unknown]"))
    
    tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode %in% patient.ids & days_to_surgical_resection != "[Not Available]" & days_to_surgical_resection != "[Pending]" )
    ids <- unique(c(tbl.f1Sub$bcr_patient_barcode,tbl.omfSub$bcr_patient_barcode,tbl.f3Sub$bcr_patient_barcode ) )
    
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
#   $histology  hnsc LGG
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

	  pathology.offset <-   tbl.pathSub$days_to_initial_pathologic_diagnosis[pathEvent]
      if(pathology.offset == "[Not Available]"){
          date <- NA
      }else{ date <- reformatDate(format(diagnosis.date + as.integer(pathology.offset)))}

      pathDisease <- tbl.pathSub$tumor_tissue_site[pathEvent]
      pathHistology <- tbl.pathSub$histologic_diagnosis[pathEvent]
      collection <- tbl.pathSub$prospective_collection[pathEvent]
      T.Stage <- tbl.pathSub$clinical_T[pathEvent]
      N.Stage <- tbl.pathSub$clinical_N[pathEvent]
      M.Stage <- tbl.pathSub$clinical_M[pathEvent]
      S.Stage <- tbl.pathSub$clinical_stage[pathEvent]
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
                        Fields = list(date=date, disease=pathDisease, histology=pathHistology, collection=collection, T.Stage=T.Stage, N.Stage=N.Stage, M.Stage=M.Stage,
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
      if(omfOffset == "[Not Available]" | omfOffset== "[Pending]"){ omf.date = NA
      }else{  omf.date = reformatDate(as.Date(diagnosis.date, "%m/%d/%Y") + as.integer(omfOffset))}
      
       new.event <- list(PatientID=patient.id,
                        PtNum=patient.number,
                        study=study,
                        Name=name,
                        Fields = list(date=omf.date, disease=disease, histology=histology, collection=NA, T.Stage=NA, N.Stage=NA, M.Stage=NA,S.Stage=NA,staging.System=NA))
   
       good.records.found <- good.records.found + 1
       result[[good.records.found]] <- new.event
     } }


   result[1:good.records.found]
   
} # create.Pathology.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Pathology.record <- function()
{
    print("--- test_create.Pathology.record")
    x <- create.Pathology.record(tcga.ids[1])
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology", "collection", "T.Stage", "N.Stage","M.Stage","S.Stage","staging.System"))
    checkEquals(x[[1]], list(PatientID= "TCGA.4P.AA8J", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2013", disease="Head and Neck", histology="Head and Neck Squamous Cell Carcinoma", collection="retrospective", T.Stage="T4a",N.Stage="N2a",M.Stage="M0",S.Stage="Stage IVA",staging.System="7th")))
    
    x <- create.Pathology.record("TCGA-BA-4075") #has both
    checkEquals(length(x),2)
    checkEquals(x[[1]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study, Name="Pathology",Fields=list(date="01/01/2004", disease="Head and Neck", histology="Head and Neck Squamous Cell Carcinoma", collection="retrospective",T.Stage="T4a",N.Stage="N1",M.Stage="M0",S.Stage="Stage IVA",staging.System="6th")))
    checkEquals(x[[2]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study, Name="Pathology",Fields=list(date=NA, disease="Tongue, Base of tongue", histology="Squamous Cell Carcinoma, Not Otherwise Specified", collection=NA,T.Stage=NA,N.Stage=NA,M.Stage=NA,S.Stage=NA,staging.System=NA)))
} # test_create.Pathology.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Pathology.records <- function(patient.ids)
{
      # 530 good rows
  tbl.good <- subset(tbl.pt, bcr_patient_barcode %in% patient.ids )
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
#   $histology  hnsc LGG
#   $histology2  Gliosarcoma
#   $Test      1p/q19,  PTEN, EGFR
#   $Result    Deletion, invalid, amplification, Negative, 100 
#   $Disease   Brain
#   $Grade     G1, G2/G3

create.Absent.record <- function(patient.id)
{

   tbl.nteSub <- subset(tbl.nte, bcr_patient_barcode==patient.id & new_tumor_event_dx_days_to != "[Not Available]" & (new_tumor_event_pharmaceutical_tx == "NO" | new_tumor_event_radiation_tx == "NO"))
   tbl.f3Sub  <- subset(tbl.f3,  bcr_patient_barcode==patient.id & new_tumor_event_dx_days_to != "[Not Available]" & (new_tumor_event_pharmaceutical_tx == "NO" | new_tumor_event_radiation_tx == "NO"))
   tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode==patient.id & days_to_other_malignancy_dx != "[Not Available]"& days_to_other_malignancy_dx != "[Pending]" & (drug_tx_indicator == "NO" | radiation_tx_indicator == "NO"))
   
   
   if(nrow(tbl.nteSub) == 0 && nrow(tbl.f3Sub) == 0 && nrow(tbl.omfSub) == 0)
       return(list())
   diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
   diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
   patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
   patient.number <- as.integer(id.map[patient.id])
   name <- "Absent"

  tbl.rows <- tbl.nteSub[, c("new_tumor_event_dx_days_to", "new_tumor_event_radiation_tx", "new_tumor_event_pharmaceutical_tx")  ]
  
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
      
      
      dx.offset <-   as.integer(tbl.rows$new_tumor_event_dx_days_to[Event])
      date <- reformatDate(format(diagnosis.date + dx.offset))
  
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
      }} # for AbsentEvent
   
   
   result[1:good.records.found]
   
} # create.Absent.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Absent.record <- function()
{
    print("--- test_create.Absent.record")
    x <- create.Absent.record("TCGA-BA-A6DI") #nte
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug"))
    checkEquals(x[[1]], list(PatientID="TCGA.BA.A6DI", PtNum=34, study=study, Name="Absent", Fields=list(date="09/23/2012", Radiation="TRUE", Drug="TRUE")))

} # test_create.Absent.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Absent.records <- function(patient.ids)
{
    #45 good records
   tbl.nteSub <- subset(tbl.nte, bcr_patient_barcode %in% patient.ids & new_tumor_event_dx_days_to != "[Not Available]" & (new_tumor_event_pharmaceutical_tx == "NO" | new_tumor_event_radiation_tx == "NO"))
   tbl.f3Sub  <- subset(tbl.f3,  bcr_patient_barcode %in% patient.ids & new_tumor_event_dx_days_to != "[Not Available]" & (new_tumor_event_pharmaceutical_tx == "NO" | new_tumor_event_radiation_tx == "NO"))
   tbl.omfSub <- subset(tbl.omf, bcr_patient_barcode %in% patient.ids & days_to_other_malignancy_dx != "[Not Available]" & days_to_other_malignancy_dx != "[Pending]" & (drug_tx_indicator == "NO" | radiation_tx_indicator == "NO"))
   

  ids <- unique(c(tbl.nteSub$bcr_patient_barcode,tbl.f2Sub$bcr_patient.barcode, tbl.omfSub$bcr_patient_barcode))

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

} # create.all.Pathology.records
#------------------------------------------------------------------------------------------------------------------------


#JZ#JZ#JZ#JZ#J#JZZ#JZ#JZ
#------------------------------------------------------------------------------------------------------------------------
# $PatientID [1] "P1"
# $PtNum [1] 1
# $Name [1] "Pathology"
# $Fields
#   $date [1] "7/12/2006"
#   $specimenType brain, RL tumor
#   $site temporal frontal
#   $histology  hnsc LGG
#   $histology2  Gliosarcoma
#   $Test      1p/q19,  PTEN, EGFR
#   $Result    Deletion, invalid, amplification, Negative, 100
#   $Disease   Brain
#   $Grade     G1, G2/G3

create.Background.record <- function(patient.id)
{
    
    tbl.ptSub <- subset(tbl.pt, bcr_patient_barcode==patient.id & tobacco_smoking_history_indicator != "[unknown]" & tobacco_smoking_history_indicator != "[Not Available]")
    
    if(nrow(tbl.ptSub) == 0 )
    return(list())
    
    diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
    diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    name <- "Background"
    
    result <- vector("list", nrow(tbl.ptSub))
    good.records.found <- 0
    
    
    start.tobacco.usages.yrs <- tbl.ptSub$tobacco_smoking_year_started
    end.tobacco.usages.yrs <- tbl.ptSub$tobacco_smoking_year_stopped
    if(start.tobacco.usages.yrs == "[Not Available]") start.tobacco.usages.yrs=NA
    if(end.tobacco.usages.yrs == "[Not Available]") end.tobacco.usages.yrs=NA
    tobacco.usages <- c(start.tobacco.usages.yrs, end.tobacco.usages.yrs)
    smoking.status <- NA
    date.quit.smoking <- NA
    num.packs.years <- tbl.ptSub$tobacco_smoking_pack_years_smoked
    num.packs.day <- NA
    alcohol.weeksly.days <- tbl.ptSub$ alcohol_consumption_frequency
    alcohol.per.day <- tbl.ptSub$alcohol_consumption_per_day
    alcohol.amount <- NA
    neoadjuvant.treatment <- tbl.ptSub$history_neoadjuvant_treatment
    
    if(num.packs.years == "[Not Available]") num.packs.years=NA
    if(neoadjuvant.treatment == "[Not Available]") neoadjuvant.treatment=NA
    if(alcohol.weeksly.days == "[Not Available]") alcohol.weeksly.days=NA
    if(alcohol.per.day == "[Not Available]") alcohol.per.day = NA
    if(nrow(tbl.ptSub)>0){
            new.event <- list(PatientID=patient.id,
            PtNum=patient.number,
            study=study,
            Name=name,
            Fields = list(tobacco.usages=tobacco.usages,
            smoking.status=smoking.status, num.packs.years=num.packs.years, num.packs.day=num.packs.day,
            alcohol.weeksly.days=alcohol.weeksly.days, alcohol.per.day=alcohol.per.day,alcohol.amount=alcohol.amount, neoadjuvant.treatment=neoadjuvant.treatment))
            good.records.found <- good.records.found +1
            result[[good.records.found]] <- new.event
    }
    result[1:good.records.found]
    
} # create.Background.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Background.record <- function()
{
    print("--- test_create.Background.record")
    x <- create.Background.record("TCGA-4P-AA8J")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("tobacco.usages","smoking.status","num.packs.years","num.packs.day",
               "alcohol.weeksly.days","alcohol.per.day", "alcohol.amount","neoadjuvant.treatment"))
    checkEquals(x[[1]], list(PatientID="TCGA.4P.AA8J", PtNum=1, study=study, Name="Background", Fields=list(tobacco.usages=c(NA, NA), smoking.status=NA, num.packs.years=NA,num.packs.day=NA, alcohol.weeksly.days=NA,alcohol.per.day=NA, alcohol.amount=NA, neoadjuvant.treatment="No")))
   
    x <- create.Background.record("TCGA-BA-4074") #no tobacco usage starting date
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("tobacco.usages","smoking.status","num.packs.years","num.packs.day",
    "alcohol.weeksly.days", "alcohol.per.day","alcohol.amount","neoadjuvant.treatment"))
    checkEquals(x[[1]], list(PatientID="TCGA.BA.4074", PtNum=2, study=study, Name="Background", Fields=list(tobacco.usages=c("1951",NA), smoking.status=NA, num.packs.years="51",num.packs.day=NA, alcohol.weeksly.days=NA, alcohol.per.day=NA, alcohol.amount=NA, neoadjuvant.treatment="No")))
    
    
    x <- create.Background.record("TCGA-BA-6872")
    checkEquals(x[[1]],list(PatientID="TCGA.BA.6872", PtNum=20, study=study, Name="Background", Fields=list(tobacco.usages=c("1974",NA), smoking.status=NA, num.packs.years="40",num.packs.day=NA, alcohol.weeksly.days="7", alcohol.per.day="6", alcohol.amount=NA, neoadjuvant.treatment="No")))

} # test_create.Background.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Background.records <- function(patient.ids)
{
    #516 good records
    tbl.ptSub <- subset(tbl.pt, bcr_patient_barcode==patient.ids & tobacco_smoking_history_indicator != "[unknown]" & tobacco_smoking_history_indicator != "[Not Available]")
    
    
    ids <- unique(tbl.ptSub$bcr_patient_barcode)
    
    count <- 1
    result <- vector("list", length(ids))
    for(id in ids){
        #printf("id: %s", id)
        new.list <- create.Background.record(id)
        range <- count:(count+length(new.list)-1)
        result[range] <- new.list
        count <- count + length(new.list)
    } # for id
    
    deleters <- which(unlist(lapply(result, is.null)))
    if(length(deleters) > 0)
    result <- result[-deleters]
    
    result
    
} # create.all.Background.records
#------------------------------------------------------------------------------------------------------------------------
#------------------------------------------------------------------------------------------------------------------------
# $PatientID [1] "P1"
# $PtNum [1] 1
# $Name [1] "Pathology"
# $Fields
#   $date [1] "7/12/2006"
#   $specimenType brain, RL tumor
#   $site temporal frontal
#   $histology  hnsc LGG
#   $histology2  Gliosarcoma
#   $Test      1p/q19,  PTEN, EGFR
#   $Result    Deletion, invalid, amplification, Negative, 100
#   $Disease   Brain
#   $Grade     G1, G2/G3

create.Tests.record <- function(patient.id)
{
    tbl.ptSub <- subset(tbl.pt, bcr_patient_barcode==patient.id & (!egfr_amplification_status %in% c("[Not Available]","[Not Evaluated]","[Unknown]")|(!hpv_status_ish %in% c("[Not Available]","[Not Evaluated]","[Unknown]"))|(!hpv_status_p16 %in% c("[Not Available]","[Not Evaluated]","[Unknown]"))))
    
    if(nrow(tbl.ptSub) == 0) return(list())
    
    #diagnosis.year <- subset(tbl.pt, bcr_patient_barcode==patient.id)$initial_pathologic_dx_year[1]
    #diagnosis.date <- as.Date(sprintf("%s-%s-%s", diagnosis.year, "01", "01"))
    patient.id <- gsub("-", ".", patient.id, fixed=TRUE)
    patient.number <- as.integer(id.map[patient.id])
    name <- "Tests"
    
    result <- vector("list", nrow(tbl.ptSub))
    good.records.found <- 0
    
    for(Event in 1:nrow(tbl.ptSub)){
       
        if(!tbl.ptSub[Event,]$egfr_amplification_status %in% c("[Not Available]","[Not Evaluated]","[Unknown]")){
            test="egfr"
            res = tbl.ptSub[Event,]$egfr_amplification_status
            new.event <- list(PatientID=patient.id, PtNum=patient.number,study=study, Name=name, Fields = list(Test=test, Result=res))
            good.records.found <- good.records.found +1
            result[[good.records.found]] <- new.event
        }
        if(!tbl.ptSub[Event,]$hpv_status_ish %in% c("[Not Available]","[Not Evaluated]","[Unknown]")){
            test="hpv status ISH"
            res = tbl.ptSub[Event,]$hpv_status_ish
            new.event <- list(PatientID=patient.id, PtNum=patient.number,study=study, Name=name, Fields = list(Test=test, Result=res))
            good.records.found <- good.records.found +1
            result[[good.records.found]] <- new.event
        }
        if(!tbl.ptSub[Event,]$hpv_status_p16 %in% c("[Not Available]","[Not Evaluated]","[Unknown]")){
            test="hpv status p16"
            res = tbl.ptSub[Event,]$hpv_status_p16
            new.event <- list(PatientID=patient.id, PtNum=patient.number,study=study, Name=name, Fields = list(Test=test, Result=res))
            good.records.found <- good.records.found +1
            result[[good.records.found]] <- new.event
        }
    }
    result[1:good.records.found]
} # create.Tests.record
#------------------------------------------------------------------------------------------------------------------------
test_create.Tests.record <- function()
{
    print("--- test_create.Absent.record")
    x <- create.Tests.record("TCGA-QK-A6V9") #nte
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]][["Fields"]]), c("Test", "Result"))
    checkEquals(x[[1]], list(PatientID="TCGA.QK.A6V9", PtNum=485, study=study, Name="Tests", Fields=list(Test="hpv status ISH", Result="Positive")))
    checkEquals(x[[2]], list(PatientID="TCGA.QK.A6V9", PtNum=485, study=study, Name="Tests", Fields=list(Test="hpv status p16", Result="Positive")))
    x <- create.Tests.record("TCGA-CN-A497")
    checkEquals(x[[1]], list(PatientID="TCGA.CN.A497", PtNum=116, study=study, Name="Tests", Fields=list(Test="egfr", Result="Unamplified")))
    checkEquals(x[[2]], list(PatientID="TCGA.CN.A497", PtNum=116, study=study, Name="Tests", Fields=list(Test="hpv status ISH", Result="Negative")))
    checkEquals(x[[3]], list(PatientID="TCGA.CN.A497", PtNum=116, study=study, Name="Tests", Fields=list(Test="hpv status p16", Result="Negative")))
    
} # test_create.Tests.record
#------------------------------------------------------------------------------------------------------------------------
create.all.Tests.records <- function(patient.ids)
{
    #126 good records
    tbl.ptSub <- subset(tbl.pt, bcr_patient_barcode %in% patient.ids &
                 (!egfr_amplification_status %in% c("[Not Available]","[Not Evaluated]","[Unknown]")|(!hpv_status_ish %in% c("[Not Available]","[Not Evaluated]","[Unknown]"))|(!hpv_status_p16 %in% c("[Not Available]","[Not Evaluated]","[Unknown]"))))

    
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

#---------------------------------------------------------------------------------------------------
runTests()
run()
