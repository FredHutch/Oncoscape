###########################################    Step 6: UnitTests By Feature  ###############################################
test_create.DOB.records <- function(study_name)
{
  print("--- test_create.DOB.record")
  if(study_name == "TCGAbrca"){
		x <- create.DOB.records(study_name, "TCGA.A1.A0SI")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.A1.A0SI", PtNum=15, study="TCGAbrca", Name="Birth", Fields=list(date="04/19/1954", gender="FEMALE", race="WHITE", ethnicity= "NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.A2.A259")[[1]]
		checkEquals(x, list(PatientID="TCGA.A2.A259", PtNum=100, study="TCGAbrca", Name="Birth", Fields=list(date="09/24/1936", gender="FEMALE", race="BLACK OR AFRICAN AMERICAN", ethnicity= "NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.HN.A2NL")[[1]]
		checkEquals(x, list(PatientID="TCGA.HN.A2NL", PtNum=1009, study="TCGAbrca", Name="Birth", Fields=list(date=as.character(NA), gender="FEMALE", race=as.character(NA), ethnicity=as.character(NA))))
  	}
  if(study_name == "TCGAcoad"){
		x <- create.DOB.records(study_name, "TCGA.A6.2682")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.A6.2682", PtNum=15, study="TCGAcoad", Name="Birth", Fields=list(date="09/08/1938", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.A6.2680")[[1]]
		checkEquals(x, list(PatientID="TCGA.A6.2680", PtNum=13, study="TCGAcoad", Name="Birth", Fields=list(date="05/11/1936", gender="FEMALE", race="BLACK OR AFRICAN AMERICAN", ethnicity="NOT HISPANIC OR LATINO")))
  	}
  if(study_name == "TCGAgbm"){
		x <- create.DOB.records(study_name, "TCGA.02.0037")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.02.0037", PtNum=15, study="TCGAgbm", Name="Birth", Fields=list(date="11/27/1929", gender="FEMALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.02.0033")[[1]]
		checkEquals(x, list(PatientID="TCGA.02.0033", PtNum=13, study="TCGAgbm", Name="Birth", Fields=list(date="01/20/1948", gender="MALE", race="WHITE", ethnicity=as.character(NA))))
  	}
  if(study_name == "TCGAhnsc"){
		x <- create.DOB.records(study_name, "TCGA.BA.5559")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.BA.5559", PtNum=15, study="TCGAhnsc", Name="Birth", Fields=list(date="01/13/1934", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.CN.6017")[[1]]
		checkEquals(x, list(PatientID="TCGA.CN.6017", PtNum=100, study="TCGAhnsc", Name="Birth", Fields=list(date="04/07/1954", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
  	}
  if(study_name == "TCGAlgg"){
		x <- create.DOB.records(study_name, "TCGA.CS.6290")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.CS.6290", PtNum=1, study="TCGAlgg", Name="Birth", Fields=list(date="01/23/1977", gender="MALE", race=as.character(NA), ethnicity=as.character(NA))))
		x <- create.DOB.records(study_name, "TCGA.W9.A837")[[1]]
		checkEquals(x, list(PatientID="TCGA.W9.A837", PtNum=425, study="TCGAlgg", Name="Birth", Fields=list(date=as.character(NA), gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
  	}
  if(study_name == "TCGAluad"){
		x <- create.DOB.records(study_name, "TCGA.05.4405")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.05.4405", PtNum=15, study="TCGAluad", Name="Birth", Fields=list(date="06/03/1931", gender="FEMALE", race=as.character(NA), ethnicity=as.character(NA))))
		x <- create.DOB.records(study_name, "TCGA.49.4486")[[1]]
		checkEquals(x, list(PatientID="TCGA.49.4486", PtNum=100, study="TCGAluad", Name="Birth", Fields=list(date="09/06/1919", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
	}
  if(study_name == "TCGAlusc"){
		x <- create.DOB.records(study_name, "TCGA.18.4086")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.18.4086", PtNum=15, study="TCGAlusc", Name="Birth", Fields=list(date="01/12/1944", gender="MALE", race=as.character(NA), ethnicity=as.character(NA))))
		x <- create.DOB.records(study_name, "TCGA.34.5231")[[1]]
		checkEquals(x, list(PatientID="TCGA.34.5231", PtNum=100, study="TCGAlusc", Name="Birth", Fields=list(date="05/19/1933", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.63.A5MR")[[1]] #race == "[Not Evaluated]", diagnosis.year == "[Not Available]"
		checkEquals(x, list(PatientID="TCGA.63.A5MR", PtNum=269, study="TCGAlusc", Name="Birth", Fields=list(date=as.character(NA), gender="FEMALE", race=as.character(NA), ethnicity=as.character(NA))))
	}
  if(study_name == "TCGAprad"){
		x <- create.DOB.records(study_name, "TCGA.CH.5740")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.CH.5740", PtNum=15, study="TCGAprad", Name="Birth", Fields=list(date="11/02/1951", gender="MALE", race="WHITE", ethnicity= "NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.EJ.7789")[[1]]
		checkEquals(x, list(PatientID="TCGA.EJ.7789", PtNum=100, study="TCGAprad", Name="Birth", Fields=list(date="12/31/1944", gender="MALE", race="BLACK OR AFRICAN AMERICAN", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.V1.A8MF")[[1]]
		checkEquals(x, list(PatientID="TCGA.V1.A8MF", PtNum=367, study="TCGAprad", Name="Birth", Fields=list(date=as.character(NA), gender="MALE", race=as.character(NA), ethnicity=as.character(NA))))
	}
  if(study_name == "TCGAread"){
		x <- create.DOB.records(study_name, "TCGA.AF.6672")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.AF.6672", PtNum=15, study="TCGAread", Name="Birth", Fields=list(date="04/17/1967", gender="MALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name, "TCGA.AF.6136")[[1]]
		checkEquals(x, list(PatientID="TCGA.AF.6136", PtNum=13, study="TCGAread", Name="Birth", Fields=list(date="06/23/1938", gender="FEMALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
	}
  if(study_name == "TCGAsarc"){
  		x <- create.DOB.records(study_name, "TCGA.WP.A9GB")[[1]]
  		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.WP.A9GB", PtNum=243, study=study_name, Name="Birth", Fields=list(date=as.character(NA), gender="FEMALE", race="WHITE", ethnicity="NOT HISPANIC OR LATINO")))
		x <- create.DOB.records(study_name,"TCGA.DX.A3U8")[[1]]
		checkEquals(x, list(PatientID="TCGA.DX.A3U8", PtNum=50, study=study_name, Name="Birth", Fields=list(date="11/17/1966", gender="MALE", race=as.character(NA), ethnicity=as.character(NA))))
  }
  if(study_name == "TCGAlaml"){
  		x <- create.DOB.records(study_name, "TCGA.AB.2882")[[1]]
  		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.AB.2882", PtNum=80, study=study_name, Name="Birth", Fields=list(date="07/04/1932", gender="FEMALE", race="WHITE", ethnicity=ethnicity=as.character(NA))))
		x <- create.DOB.records(study_name,"TCGA.AB.2982")[[1]]
		checkEquals(x, list(PatientID="TCGA.AB.2982", PtNum=173, study=study_name, Name="Birth", Fields=list(date="05/31/1977", gender="FEMALE", race=as.character(NA), ethnicity=as.character(NA))))
  }
  if(study_name == "TCGAblca"){
  		x <- create.DOB.records(study_name, "TCGA.HQ.A2OE")[[1]]
  		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.HQ.A2OE", PtNum=276, study=study_name, Name="Birth",  Fields=list(date=as.character(NA), gender="MALE", race=as.character(NA), ethnicity=as.character(NA))))
  }
  if(study_name == "TCGApaad"){
  		x <- create.DOB.records(study_name, "TCGA.M8.A5N4")[[1]]
  		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(names(x$Fields), c("date", "gender", "race", "ethnicity"))
		checkEquals(x, list(PatientID="TCGA.M8.A5N4", PtNum=159, study=study_name, Name="Birth",  Fields=list(date=as.character(NA), gender="FEMALE", race=as.character(NA), ethnicity=as.character(NA))))
		x <- create.DOB.records(study_name,"TCGA.F2.6879")[[1]]
		checkEquals(x, list(PatientID="TCGA.F2.6879", PtNum=43, study=study_name, Name="Birth", Fields=list(date="07/21/1951", gender="MALE", race="WHITE", ethnicity=as.character(NA))))
  }
}
lapply(studies, test_create.DOB.records)
#--------------------------------------------------------------------------------------------------------------------------  
test_create.Diagnosis.records <- function(study_name)
{
	print("--- test_create.Diagnosis.record")
	if(study_name == "TCGAbrca"){
		x <- create.Diagnosis.records(study_name, "TCGA.3C.AAAU")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Diagnosis", Fields=list(date="01/01/2004", disease="BREAST", siteCode="3C")))
		}
	if(study_name == "TCGAcoad"){
		x <- create.Diagnosis.records(study_name, "TCGA.3L.AA1B")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.3L.AA1B", PtNum=1, study="TCGAcoad", Name="Diagnosis", Fields=list(date="01/01/2013", disease="COLON", siteCode="3L")))
	}
	if(study_name == "TCGAgbm"){
		x <- create.Diagnosis.records(study_name, "TCGA.02.0001")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study="TCGAgbm", Name="Diagnosis", Fields=list(date="01/01/2002", disease="BRAIN", siteCode="02")))
	}
	if(study_name == "TCGAhnsc"){
		x <- create.Diagnosis.records(study_name,  "TCGA.4P.AA8J")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.4P.AA8J", PtNum=1, study="TCGAhnsc", Name="Diagnosis", Fields=list(date="01/01/2013", disease="HEAD AND NECK", siteCode="4P")))
		}
	if(study_name == "TCGAlgg"){
		x <- create.Diagnosis.records(study_name,  "TCGA.CS.6290")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study_name, Name="Diagnosis", Fields=list(date="01/01/2009", disease="CENTRAL NERVOUS SYSTEM", siteCode="CS")))
	}
	if(study_name == "TCGAluad"){
		x <- create.Diagnosis.records(study_name,  "TCGA.05.4244")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.05.4244", PtNum=1, study=study_name, Name="Diagnosis", Fields=list(date="01/01/2009", disease="LUNG", siteCode="05")))
	}
	if(study_name == "TCGAlusc"){
		x <- create.Diagnosis.records(study_name,  "TCGA.18.3406")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.18.3406", PtNum=1, study=study_name, Name="Diagnosis", Fields=list(date= "01/01/2003", disease="LUNG", siteCode="18")))
		x <- create.Diagnosis.records(study_name,  "TCGA.63.A5MI") #diagnosis. year == "[Not Available]"
		checkEquals(x[[1]], list(PatientID="TCGA.63.A5MI", PtNum=263, study=study_name, Name="Diagnosis", Fields=list(date=as.character(NA), disease="LUNG", siteCode="63")))
	}
	if(study_name == "TCGAprad"){
		x <- create.Diagnosis.records(study_name,  "TCGA.2A.A8VL")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study="TCGAprad", Name="Diagnosis", Fields=list(date="01/01/2010", disease="PROSTATE", siteCode="2A")))
	}
	if(study_name == "TCGAread"){
		x <- create.Diagnosis.records(study_name,  "TCGA.AF.2687")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID= "TCGA.AF.2687", PtNum=1, study=study_name, Name="Diagnosis", Fields=list(date="01/01/2009", disease="RECTUM", siteCode= "AF")))
	}
	if(study_name == "TCGAsarc"){
		x <- create.Diagnosis.records(study_name,  "TCGA.HS.A5N7")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID= "TCGA.HS.A5N7", PtNum=152, study=study_name, Name="Diagnosis", 
							Fields=list(date=as.character(NA), disease="RETROPERITONEUM/UPPER ABDOMINAL - RETROPERITONEUM", siteCode= "HS")))
	}
	if(study_name == "TCGAlaml"){
		x <- create.Diagnosis.records(study_name,  "TCGA.AB.2811")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID= "TCGA.AB.2811", PtNum=10, study=study_name, Name="Diagnosis", Fields=list(date="01/01/2002", disease="BONE MARROW", siteCode= "AB")))
	}
	if(study_name == "TCGAblca"){
		x <- create.Diagnosis.records(study_name,  "TCGA.HQ.A2OF")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID= "TCGA.HQ.A2OF", PtNum=277, study=study_name, Name="Diagnosis", Fields=list(date=as.character(NA), disease="BLADDER", siteCode= "HQ")))
	}
	if(study_name == "TCGApaad"){
		x <- create.Diagnosis.records(study_name,  "TCGA.M8.A5N4")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "disease", "siteCode"))
		checkEquals(x[[1]], list(PatientID= "TCGA.M8.A5N4", PtNum=159, study=study_name, Name="Diagnosis", Fields=list(date=as.character(NA),  disease="PANCREAS", siteCode= "M8")))
	}
}
lapply(studies, test_create.Diagnosis.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Chemo.records <- function(study_name)
{
	print("--- test_create.Chemo.record")
	if(study_name == "TCGAbrca"){
		x <- create.Chemo.records(study_name, "TCGA.3C.AAAU")
		checkTrue(is.list(x))
		checkEquals(length(x), 1)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Drug", 
						Fields=list(date=c("01/02/2009",NA), agent="GOSERELIN",therapyType="CHEMOTHERAPY",  
							       intent=as.character(NA), dose=as.character(NA), units=as.character(NA), 
							       totalDose=as.character(NA), totalDoseUnits=as.character(NA), route=as.character(NA), 
							       cycle=as.character(NA))))

		x <- create.Chemo.records(study_name, "TCGA.C8.A8HR") # recurrence
		checkTrue(is.list(x))
		checkEquals(length(x), 3)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x[[3]], list(PatientID="TCGA.C8.A8HR", PtNum=711, study="TCGAbrca", Name="Drug", 
						Fields=list(date=c("02/13/2013", "08/26/2013"), agent="FLUOROURACIL", therapyType="CHEMOTHERAPY",  
									intent=as.character(NA), dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
	}
	if(study_name == "TCGAcoad"){
		x <- create.Chemo.records(study_name, "TCGA.A6.2671")
		checkTrue(is.list(x))
		checkEquals(length(x), 22)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[16]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[15]], list(PatientID="TCGA.A6.2671", PtNum=5, study="TCGAcoad", Name="Drug", 
						Fields=list(date=c("07/06/2010","01/10/2011"), agent="BEVACIZUMAB",therapyType="TARGETED MOLECULAR THERAPY",  
							       intent="PROGRESSION", dose="300-325", units="MG", 
							       totalDose="3775", totalDoseUnits="MG", route="INTRAVENOUS (IV)", 
							       cycle="12")))

		x <- create.Chemo.records(study_name, "TCGA.A6.A565")  #no start date
		checkEquals(length(x), 3)
		checkEquals(x[[1]], list(PatientID="TCGA.A6.A565", PtNum=51, study="TCGAcoad", Name="Drug", 
						Fields=list(date=c(as.character(NA), as.character(NA)), agent="FLUOROURACIL", therapyType="CHEMOTHERAPY", 
							        intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), 
							        totalDose=as.character(NA), totalDoseUnits=as.character(NA), route=as.character(NA), 
							        cycle=as.character(NA))))

		x <- create.Chemo.records(study_name, "TCGA.AA.3516") # omf chemo
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.AA.3516", PtNum=68, study="TCGAcoad", Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)),agent=as.character(NA),  
										therapyType=as.character(NA), intent="PRIOR MALIGNANCY", dose=as.character(NA), 
										units=as.character(NA), totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
										route=as.character(NA), cycle=as.character(NA))))
	}
	if(study_name == "TCGAgbm"){
		x <- create.Chemo.records(study_name, "TCGA.02.0001")
		checkTrue(is.list(x))
		checkEquals(length(x), 4)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Drug", 
							Fields=list(date=c("04/03/2002", "10/06/2002"),  agent="CELEBREX", therapyType="CHEMOTHERAPY", 
										intent="ADJUVANT"  , dose=as.character(NA), units=as.character(NA) , totalDose="400", totalDoseUnits="MG", 
										route=as.character(NA), cycle="4")))
		checkEquals(x[[2]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Drug", 
							Fields=list(date=c("04/03/2002", "10/06/2002"),  agent="CRA", therapyType="CHEMOTHERAPY", 
										intent="ADJUVANT"  , dose=as.character(NA), units=as.character(NA), totalDose="75",  
										totalDoseUnits="MG/M2", route=as.character(NA), cycle="4")))
		checkEquals(x[[3]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)), agent="CRA", therapyType="CHEMOTHERAPY",  
										intent="RECURRENCE", dose=as.character(NA), units=as.character(NA) , totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route="ORAL", cycle=as.character(NA))))
		checkEquals(x[[4]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)),  agent="CELEBREX", therapyType="CHEMOTHERAPY", 
										intent="RECURRENCE", dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route="ORAL", cycle=as.character(NA))))

		x <- create.Chemo.records(study_name, "TCGA.76.4928")  #no start date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.76.4928", PtNum=559, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), "03/12/2005"),  agent="TEMOZOLOMIDE", therapyType="CHEMOTHERAPY", 
										intent="ADJUVANT"  , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route="ORAL", cycle="01")))
		x <- create.Chemo.records(study_name, "TCGA.02.0014")  # no end date
		checkEquals(length(x), 2)
		checkEquals(x[[2]], list(PatientID="TCGA.02.0014", PtNum=8, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)),  agent="TEMOZOLOMIDE", therapyType="CHEMOTHERAPY",
										intent="RECURRENCE" , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route="ORAL", cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.06.0209")  # omf chemo
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.06.0209", PtNum=372, study=study_name, Name="Drug", 
							Fields=list(date=c(as.character(NA), as.character(NA)),  agent=as.character(NA), therapyType=as.character(NA),
										intent="PRIOR MALIGNANCY", dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
										totalDoseUnits=as.character(NA) , route=as.character(NA), cycle=as.character(NA))))
	}
	if(study_name == "TCGAhnsc"){
		x <- create.Chemo.records(study_name, "TCGA.BA.4075")
		checkTrue(is.list(x))
		checkEquals(length(x), 3)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study_name, Name="Drug", 
						Fields=list(date=c("09/21/2004","10/19/2004"), agent="CARBOPLATIN", therapyType="CHEMOTHERAPY", 
									intent="PALLIATIVE"  , dose="2", units="AUC",totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA) , route=as.character(NA), cycle=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study_name, Name="Drug", 
						Fields=list(date=c("09/21/2004","10/19/2004"), agent="PACLITAXEL",therapyType="CHEMOTHERAPY", 
									intent="PALLIATIVE"  , dose="45", units="MG/M2",totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA) , route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.CR.6474")  #no start date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.CR.6474", PtNum=185, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent=as.character(NA), therapyType="CHEMOTHERAPY", 
									intent="PALLIATIVE", dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.KU.A6H8") # no end date
		checkEquals(length(x), 3)
		checkEquals(x[[3]], list(PatientID="TCGA.KU.A6H8", PtNum=452, study=study_name, Name="Drug", 
						Fields=list(date=c("07/30/2013", NA), agent="CARBOPLATIN", therapyType="CHEMOTHERAPY", 
							 		intent=as.character(NA),dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA) , route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.CV.5430") # recurrence
		checkEquals(length(x), 3)
		checkEquals(x[[3]], list(PatientID="TCGA.CV.5430", PtNum=229, study=study_name, Name="Drug", 
						Fields=list(date=c("06/30/2003","08/30/2003"),agent="IRINOTECAN", therapyType="CHEMOTHERAPY", 
									intent="RECURRENCE",dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA),  
									totalDoseUnits=as.character(NA), route="INTRAVENOUS (IV)", cycle="4")))
		x <- create.Chemo.records(study_name, "TCGA.BA.4075") # omf chemo
		checkEquals(length(x),3)
		checkEquals(x[[1]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study_name, Name="Drug", 
						Fields=list(date=c("09/21/2004", "10/19/2004"), agent="CARBOPLATIN", therapyType="CHEMOTHERAPY", 
								intent="PALLIATIVE" , dose="2", units="AUC", totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
								route=as.character(NA), cycle=as.character(NA))))
	}
	if(study_name == "TCGAlgg"){
		x <- create.Chemo.records(study_name, "TCGA.CS.6290")
		checkTrue(is.list(x))
		checkEquals(length(x), 1)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),"05/20/2010"),  agent="TEMOZOLOMIDE", therapyType="CHEMOTHERAPY", 
									intent="ADJUVANT"  , dose="400", units="MG", totalDose=as.character(NA), totalDoseUnits= as.character(NA), 
									route="ORAL", cycle="12")))

		x <- create.Chemo.records(study_name, "TCGA.DU.6402")
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.DU.6402", PtNum=20, study=study_name, Name="Drug", 
						Fields=list(date=c("04/28/1998", "05/03/1998"), agent="TEMOZOLOMIDE", therapyType="CHEMOTHERAPY", 
									intent="PROGRESSION"  , dose="100", units="MG/M2", totalDose="200", 
									totalDoseUnits="MG", route="ORAL", cycle="01")))
	}
	if(study_name == "TCGAluad"){
		x <- create.Chemo.records(study_name, "TCGA.75.7030")
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[2]], list(PatientID="TCGA.75.7030", PtNum=336, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent="VINORELBINE",  therapyType="CHEMOTHERAPY", 
									intent="ADJUVANT", dose="46", units="MG/DAY", totalDose="552", totalDoseUnits="MG", 
									route="INTRAVENOUS (IV)", cycle="4")))
		checkEquals(x[[1]], list(PatientID="TCGA.75.7030", PtNum=336, study=study_name, Name="Drug",
						 Fields=list(date=c(as.character(NA),as.character(NA)), agent="CISPLATIN", therapyType="CHEMOTHERAPY", 
						             intent="ADJUVANT"  , dose="92", units="MG/DAY", totalDose="736",  totalDoseUnits="MG", route="INTRAVENOUS (IV)", cycle="4")))


		x <- create.Chemo.records(study_name, "TCGA.95.7039") #no start date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.95.7039", PtNum=432, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent=as.character(NA), therapyType=as.character(NA), 
									intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.05.4424")  # no end date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.05.4424", PtNum=22, study=study_name, Name="Drug", 
						Fields=list(date=c("11/30/2009", NA), agent="ERLOTINI", therapyType="IMMUNOTHERAPY", 
									intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.38.7271") # recurrence
		checkEquals(length(x), 4)
		checkEquals(x[[1]], list(PatientID="TCGA.38.7271", PtNum=49, study=study_name, Name="Drug", 
						Fields=list(date=c( "07/29/2007", "07/29/2007"),  agent="CARBOPLATIN", therapyType="CHEMOTHERAPY",
									intent="PALLIATIVE", dose=as.character(NA), units=as.character(NA), totalDose="798", totalDoseUnits="MG", 
									route="INTRAVENOUS (IV)", cycle="1")))
		x <- create.Chemo.records(study_name, "TCGA.05.4245") # omf chemo
		checkEquals(x[[1]], list(PatientID="TCGA.05.4245", PtNum=2, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent=as.character(NA), therapyType=as.character(NA), 
									intent="PRIOR MALIGNANCY" ,dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
	}
	if(study_name == "TCGAlusc"){
		x <- create.Chemo.records(study_name, "TCGA.18.3412")
		checkTrue(is.list(x))
		checkEquals(length(x), 3)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[3]], list(PatientID="TCGA.18.3412", PtNum=7, study=study_name, Name="Drug", 
					Fields=list(date=c("02/25/2005","04/28/2005"), agent="VINORELBINE", therapyType="CHEMOTHERAPY", 
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.NC.A5HT") #no start date
		checkEquals(length(x), 4)
		checkEquals(x[[3]], list(PatientID="TCGA.NC.A5HT", PtNum=483, study=study_name, Name="Drug", 
					Fields=list(date=c("08/01/2013", "11/08/2013"), agent="CARBOPLATIN", therapyType="CHEMOTHERAPY", 
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
	}
	if(study_name == "TCGAprad"){
		x <- create.Chemo.records(study_name, "TCGA.V1.A8MU")
		checkTrue(is.list(x))
		checkEquals(length(x), 1)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID="TCGA.V1.A8MU", PtNum=373, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent= "LHRH AGONIST", therapyType="HORMONE THERAPY",
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
	}
	if(study_name == "TCGAread"){
		x <- create.Chemo.records(study_name, "TCGA.AF.A56N")
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID= "TCGA.AF.A56N", PtNum=18, study=study_name, Name="Drug", 
						Fields=list(date=c("06/08/2012", "12/13/2012"), agent="XELODA", therapyType="CHEMOTHERAPY", 
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))


		x <- create.Chemo.records(study_name, "TCGA.AG.3999")  #no start date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.AG.3999", PtNum=67, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA),as.character(NA)), agent=as.character(NA), therapyType="CHEMOTHERAPY", 
									intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.DC.6156")  # no end date
		checkEquals(length(x), 9)
		checkEquals(x[[7]], list(PatientID="TCGA.DC.6156", PtNum=122, study=study_name, Name="Drug", 
						Fields=list(date=c("01/01/2011", as.character(NA)), agent="LEUCOVORIN", therapyType="CHEMOTHERAPY", 
									intent="PALLIATIVE", dose="100", units="MG", totalDose="740", 
									totalDoseUnits="MG", route="INTRAVENOUS (IV)", cycle="8")))

		x <- create.Chemo.records(study_name, "TCGA.AF.3913")   # omf chemo
		checkEquals(length(x), 3)
		checkEquals(x[[1]], list(PatientID= "TCGA.AF.3913", PtNum=9, study=study_name, Name="Drug",
						Fields=list(date=c( "08/20/2009", "11/10/2009"), agent="OXALIPLATIN", therapyType="CHEMOTHERAPY",   
									intent="PALLIATIVE", dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
									totalDoseUnits=as.character(NA), route="INTRAVENOUS (IV)", cycle="3")))
	}
	if(study_name == "TCGAsarc"){
		x <- create.Chemo.records(study_name, "TCGA.IW.A3M6")
		checkTrue(is.list(x))
		checkEquals(length(x), 3)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "agent", "therapyType", "intent", 
						"dose", "units", "totalDose", "totalDoseUnits", "route", "cycle"))
		checkEquals(x[[1]], list(PatientID= "TCGA.IW.A3M6", PtNum=171, study=study_name, Name="Drug", 
						Fields=list(date=c("01/25/2011", "02/15/2011"), agent="DOCETAXEL", therapyType="CHEMOTHERAPY", 
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		checkEquals(x[[3]], list(PatientID= "TCGA.IW.A3M6", PtNum=171, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA), as.character(NA)), agent="REQUIRE MANUAL CHECK", therapyType=as.character(NA), 
								intent="PRIOR MALIGNANCY" , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))


		x <- create.Chemo.records(study_name, "TCGA.3B.A9HO")  #no start date
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID= "TCGA.3B.A9HO", PtNum=4, study=study_name, Name="Drug", 
						Fields=list(date=c("02/11/2010", as.character(NA)), agent="REQUIRE MANUAL CHECK", therapyType=as.character(NA), 
								intent="PRIOR MALIGNANCY" , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.DX.A6BK")  # no end date
		checkEquals(x[[1]], list(PatientID= "TCGA.DX.A6BK", PtNum=76, study=study_name, Name="Drug", 
						Fields=list(date=c("04/26/1992", as.character(NA)), agent="TAMOXIFEN", therapyType=as.character(NA), 
								intent="PRIOR MALIGNANCY" , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
	}
	if(study_name == "TCGAlaml"){
		x <- create.Chemo.records(study_name, "TCGA.AB.3012")
		checkTrue(!is.list(x))
	}
	if(study_name == "TCGAblca"){
		x <- create.Chemo.records(study_name, "TCGA.2F.A9KT")
		checkEquals(length(x), 2)
		checkEquals(x[[2]], list(PatientID= "TCGA.2F.A9KT", PtNum=5, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA), as.character(NA)), agent=as.character(NA), therapyType=as.character(NA), 
								intent="PRIOR MALIGNANCY" , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.DK.A1A7")
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID= "TCGA.DK.A1A7", PtNum=91, study=study_name, Name="Drug", 
						Fields=list(date=c("05/14/2010", "09/04/2010"), agent="CISPLATIN", therapyType="CHEMOTHERAPY", 
								intent=as.character(NA) , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		checkEquals(x[[2]], list(PatientID= "TCGA.DK.A1A7", PtNum=91, study=study_name, Name="Drug", 
						Fields=list(date=c("05/14/2010", "09/04/2010"), agent="GEMZAR", therapyType="CHEMOTHERAPY", 
								intent="PROGRESSION" , dose="1000", units="MG/M2", totalDose="1300", 
								totalDoseUnits="MG", route="IV", cycle="6")))
	}
	if(study_name == "TCGApaad"){
		x <- create.Chemo.records(study_name, "TCGA.3A.A9IJ")
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID= "TCGA.3A.A9IJ", PtNum=30, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA), as.character(NA)), agent=as.character(NA), therapyType=as.character(NA), 
								intent="PRIOR MALIGNANCY" , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		x <- create.Chemo.records(study_name, "TCGA.LB.A7SX")
		checkEquals(length(x), 3)
		checkEquals(x[[3]], list(PatientID= "TCGA.LB.A7SX", PtNum=156, study=study_name, Name="Drug", 
						Fields=list(date=c(as.character(NA), as.character(NA)), agent=as.character(NA), therapyType=as.character(NA), 
								intent="PRIOR MALIGNANCY" , dose=as.character(NA), units=as.character(NA), totalDose=as.character(NA), 
								totalDoseUnits=as.character(NA), route=as.character(NA), cycle=as.character(NA))))
		checkEquals(x[[1]]$Fields$date, c("04/24/2013", "06/27/2013"))
		checkEquals(x[[2]]$Fields$agent, "PACLITAXEL")
	}
}
lapply(studies, test_create.Chemo.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Rad.records <- function(study_name)
{
  print("--- test_create.Rad.record")
  if(study_name == "TCGAbrca"){
		x <- create.Rad.records(study_name, "TCGA.HN.A2OB")
		checkTrue(is.list(x)) 
		checkEquals(x[[1]], list(PatientID="TCGA.HN.A2OB", PtNum=1010, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA),as.character(NA)), therapyType="EXTERNAL", 
							intent=as.character(NA), target="PRIMARY TUMOR FIELD", totalDose="5000", 
							totalDoseUnits="CGY", numFractions="25")))

		x <- create.Rad.records(study_name, "TCGA.D8.A1JG") # TotalDose = "42.5 + 10" 
		checkEquals(x[[1]], list(PatientID="TCGA.D8.A1JG", PtNum=730, study=study_name, Name="Radiation", 
							Fields=list(date=c( "05/12/2010", "06/06/2010"), therapyType="EXTERNAL BEAM", 
							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="42.5+10", totalDoseUnits="CGY", numFractions="21")))

		x <- create.Rad.records(study_name, "TCGA.BH.A0AU")# radType == "[Unknown]"
		checkEquals(x[[1]], list(PatientID="TCGA.BH.A0AU", PtNum=513, study=study_name, Name="Radiation", 
							Fields=list(date=c( "03/06/2008", as.character(NA)), therapyType=as.character(NA), 
							intent=as.character(NA), target=as.character(NA), totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
							numFractions=as.character(NA))))
	}
  if(study_name == "TCGAcoad"){
		x <- create.Rad.records(study_name, "TCGA.AA.3713")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x[[1]], list(PatientID="TCGA.AA.3713", PtNum=123, study=study_name, Name="Radiation", 
							Fields=list(date=c("10/03/2005","11/03/2005"), therapyType="EXTERNAL", 
							intent=as.character(NA), target="PRIMARY TUMOR FIELD", totalDose="5000", 
							totalDoseUnits="CGY", numFractions=as.character(NA))))

		x <- create.Rad.records(study_name, "TCGA.AD.6901")  #no units
		checkEquals(x[[1]], list(PatientID="TCGA.AD.6901", PtNum=237, study=study_name, Name="Radiation", 
							Fields=list(date=c("05/03/2012", "05/18/2012"), therapyType="EXTERNAL", 
							intent=as.character(NA), target= "DISTANT RECURRENCE", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))

		x <- create.Rad.records(study_name, "TCGA.DM.A285") #tbl.omf
		checkEquals(x[[1]], list(PatientID="TCGA.DM.A285", PtNum=385, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA),as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
							target="LOCOREGIONAL, AT PRIMARY TUMOR SITE: NO", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
	}
  if(study_name == "TCGAgbm"){
		x <- create.Rad.records(study_name, "TCGA.02.0001")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/19/2002", "03/22/2002"), therapyType="EXTERNAL BEAM", 
							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="4500", totalDoseUnits="CGY", numFractions="20")))

		x <- create.Rad.records(study_name, "TCGA.06.0152")  #no start date
		checkEquals(x[[1]], list(PatientID="TCGA.06.0152", PtNum=513, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA), "05/04/1995"), therapyType="EXTERNAL BEAM",
						    intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose=as.character(NA), 
						    totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		x <- create.Rad.records(study_name, "TCGA.32.4213") # mCi
		checkEquals(x[[1]], list(PatientID="TCGA.32.4213", PtNum=504, study=study_name, Name="Radiation", 
							Fields=list(date=c("01/25/2009", "03/09/2009"), therapyType="EXTERNAL BEAM",
						    intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="6000", totalDoseUnits="CGY", numFractions="30")))
		checkEquals(x[[2]], list(PatientID="TCGA.32.4213", PtNum=504, study=study_name, Name="Radiation", 
							Fields=list(date=c("12/18/2009", "12/18/2009"), therapyType="RADIOISOTOPES", 
							intent="PROGRESSION", target="LOCAL RECURRENCE", totalDose="71", totalDoseUnits="MCI", numFractions="1")))

		x <- create.Rad.records(study_name, "TCGA.32.2494") #no units
		checkEquals(x[[1]], list(PatientID="TCGA.32.2494", PtNum=498, study=study_name, Name="Radiation", 
							Fields=list(date=c("01/22/2008", "03/03/2008"), therapyType="EXTERNAL BEAM", 
							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="6000", totalDoseUnits="CGY", numFractions="30")))
		checkEquals(x[[3]], list(PatientID="TCGA.32.2494", PtNum=498, study=study_name, Name="Radiation", 
							Fields=list(date=c("01/22/2008", "03/03/2008"), therapyType="RADIOISOTOPES", 
							intent="ADJUVANT", target=as.character(NA), totalDose="354", totalDoseUnits=as.character(NA), numFractions="30")))
		checkEquals(x[[2]], list(PatientID="TCGA.32.2494", PtNum=498, study=study_name, Name="Radiation", 
							Fields=list(date=c("05/16/2009", "06/02/2009"), therapyType="EXTERNAL BEAM", 
							intent="PROGRESSION", target="LOCAL RECURRENCE", totalDose="3900", totalDoseUnits="CGY", numFractions="12")))
		x <- create.Rad.records(study_name, "TCGA.4W.AA9S")  #55Gy
		checkEquals(x[[1]], list(PatientID="TCGA.4W.AA9S", PtNum=385, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/26/2013", "04/16/2013"), therapyType="EXTERNAL", 
							intent=as.character(NA), target="PRIMARY TUMOR FIELD", totalDose="5500", totalDoseUnits="CGY", numFractions="25")))
	}
  if(study_name == "TCGAhnsc"){
		x <- create.Rad.records(study_name, "TCGA.CX.7082")
		checkTrue(is.list(x))
		checkEquals(x[[1]], list(PatientID="TCGA.CX.7082", PtNum=364, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA), as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
							target="LOCOREGIONAL, AT PRIMARY TUMOR SITE: NO", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		
		x <- create.Rad.records(study_name, "TCGA.BA.5153")  # rad two records
		checkEquals(x[[1]], list(PatientID="TCGA.BA.5153", PtNum=10, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/11/2005", "04/02/2005"), therapyType=as.character(NA), 
							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.BA.5153", PtNum=10, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA), as.character(NA)), therapyType=as.character(NA), 
							intent="PALLIATIVE", target="DISTANT RECURRENCE", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))

		x <- create.Rad.records(study_name, "TCGA.CV.A6JN")  # omf two records
		checkEquals(x[[2]], list(PatientID="TCGA.CV.A6JN", PtNum=355, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/09/2011", "03/19/2011"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="PRIMARY TUMOR FIELD", totalDose="6000", totalDoseUnits="CGY", numFractions="30")))
		checkEquals(x[[1]], list(PatientID="TCGA.CV.A6JN", PtNum=355, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/09/2011", "03/19/2011"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="REGIONAL SITE", totalDose="5700", totalDoseUnits="CGY", numFractions="30")))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Rad.records(study_name, "TCGA.CS.6290")
		checkTrue(is.list(x))
		checkEquals(length(x), 1)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
		checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study_name, Name="Radiation", 
							Fields=list(date=c(as.character(NA), "04/26/2009"), therapyType="EXTERNAL BEAM", intent="ADJUVANT", 
							target="PRIMARY TUMOR FIELD", totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
							numFractions=as.character(NA))))
		x <- create.Rad.records(study_name, "TCGA.FG.A4MY")
		checkEquals(x[[1]], list(PatientID="TCGA.FG.A4MY", PtNum=200, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/06/2012", "03/18/2012"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="PRIMARY TUMOR FIELD", totalDose="5700", totalDoseUnits="CGY", numFractions="30")))
		x <- create.Rad.records(study_name, "TCGA.HT.A619")
		checkEquals(x[[1]], list(PatientID="TCGA.HT.A619", PtNum=260, study=study_name, Name="Radiation", 
							Fields=list(date=c("08/19/2001", as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
							target="LOCOREGIONAL, AT PRIMARY TUMOR SITE: YES", totalDose=as.character(NA), 
							totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
	}
  if(study_name == "TCGAluad"){
		x <- create.Rad.records(study_name, "TCGA.05.4382")
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.05.4382", PtNum=5, study=study_name, Name="Radiation", 
							Fields=list(date=c("01/01/2010", "01/29/2010"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="DISTANT RECURRENCE", totalDose=as.character(NA), totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		x <- create.Rad.records(study_name, "TCGA.44.7669")  # cCi
		checkEquals(x[[1]], list(PatientID="TCGA.44.7669", PtNum=86, study=study_name, Name="Radiation", 
							Fields=list(date=c( "04/20/2011", "04/20/2011"), therapyType="CYBER KNIFE", 
							intent="PROGRESSION", target="DISTANT SITE", totalDose="2000", totalDoseUnits="CGY", numFractions="1")))
		checkEquals(x[[2]], list(PatientID="TCGA.44.7669", PtNum=86, study=study_name, Name="Radiation", 
							Fields=list(date=c("06/11/2011", "06/17/2011"), therapyType="EXTERNAL BEAM", 
							intent="PALLIATIVE", target="DISTANT RECURRENCE", totalDose="2000", totalDoseUnits="CGY", numFractions="5")))
		x <- create.Rad.records(study_name, "TCGA.49.AAR4")  #in totalDosage is 4,500 cGy
		checkEquals(x[[1]], list(PatientID="TCGA.49.AAR4", PtNum=122, study=study_name, Name="Radiation", 
							Fields=list(date=c( "04/29/2006", "06/03/2006"), therapyType="EXTERNAL", intent=as.character(NA), 
							target="PRIMARY TUMOR FIELD", totalDose="4,500", totalDoseUnits="CGY", numFractions=as.character(NA))))
	}
  if(study_name == "TCGAlusc"){
		x <- create.Rad.records(study_name, "TCGA.18.3407")
	    checkTrue(is.list(x))
	    checkEquals(x[[1]], list(PatientID="TCGA.18.3407", PtNum=2, study=study_name, Name="Radiation", 
	    					Fields=list(date=c(as.character(NA),as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
	    					target="LOCOREGIONAL", totalDose=as.character(NA), totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
   		x <- create.Rad.records(study_name, "TCGA.46.6026")  # tbl.rad has both dates
   		checkEquals(x[[1]], list(PatientID="TCGA.46.6026", PtNum=170, study=study_name, Name="Radiation", 
   							Fields=list(date=c("03/05/2010", "04/20/2010"), therapyType="EXTERNAL BEAM", 
   							intent="ADJUVANT", target="PRIMARY TUMOR FIELD", totalDose="6,120", totalDoseUnits="CGY", numFractions="34")))
	}
  if(study_name == "TCGAprad"){
		x <- create.Rad.records(study_name, "TCGA.EJ.5524")
	    checkTrue(is.list(x))
   		checkEquals(x[[1]], list(PatientID="TCGA.EJ.5524", PtNum=70, study=study_name, Name="Radiation", 
   							Fields=list(date=c("04/23/2010","04/23/2010"), therapyType=as.character(NA), intent=as.character(NA), 
   							target="LOCAL RECURRENCE", totalDose=as.character(NA), totalDoseUnits=as.character(NA), 
   							numFractions=as.character(NA)))) 
    }
  if(study_name == "TCGAread"){
		x <- create.Rad.records(study_name, "TCGA.G5.6233")
		checkTrue(is.list(x))
  	    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
        checkEquals(x[[1]], list(PatientID="TCGA.G5.6233", PtNum=168, study=study_name, Name="Radiation", 
        					Fields=list(date=c(as.character(NA),as.character(NA)), therapyType=as.character(NA), intent=as.character(NA), 
        					target="LOCOREGIONAL, AT PRIMARY TUMOR SITE: NO", totalDose=as.character(NA), 
        					totalDoseUnits=as.character(NA), numFractions=as.character(NA))))
		x <- create.Rad.records(study_name, "TCGA.AF.2692")  #no start date
		checkEquals(x[[1]], list(PatientID="TCGA.AF.2692", PtNum=5, study=study_name, Name="Radiation", 
							Fields=list(date=c("02/23/2010", "03/12/2010"), therapyType="EXTERNAL BEAM", 
							intent= "PALLIATIVE", target="DISTANT SITE", totalDose="3500", totalDoseUnits="CGY", numFractions="14")))
		checkEquals(x[[2]], list(PatientID="TCGA.AF.2692", PtNum=5, study=study_name, Name="Radiation", 
							Fields=list(date=c("12/17/2009", "01/21/2010"), therapyType="EXTERNAL BEAM", 
							intent= "RECURRENCE", target="PRIMARY TUMOR FIELD", totalDose="5000", totalDoseUnits="CGY", numFractions="25")))
   }
}
lapply(studies, test_create.Rad.records)
#--------------------------------------------------------------------------------------------------------------------------
test_create.Status.records <- function(study_name)
{
  print("--- test_create.Status.record")
  if(study_name == "TCGAbrca"){
		x <- create.Status.records(study_name, "TCGA.HN.A2OB")[[1]]
		checkTrue(is.list(x)) 
		checkEquals(names(x), c("PatientID", "PtNum", "study", "Name", "Fields"))
  		checkEquals(names(x$Fields), c("date", "status", "tumorStatus"))
  		checkEquals(x, list(PatientID="TCGA.HN.A2OB", PtNum=1010, study=study_name, Name="Status", 
  						Fields=list(date=as.character(NA), status="DEAD", tumorStatus=as.character(NA))))
  		x <- create.Status.records(study_name, "TCGA.3C.AAAU")[[1]]
		checkEquals(x, list(PatientID="TCGA.3C.AAAU", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="10/03/2014", status="ALIVE", tumorStatus="WITH TUMOR")))
  		x <- create.Status.records(study_name, "TCGA.GM.A2DO")[[1]]
  		checkEquals(x, list(PatientID="TCGA.GM.A2DO", PtNum=1000, study=study_name, Name="Status", 
  						Fields=list(date="02/09/2013", status="ALIVE", tumorStatus="TUMOR FREE")))
	}
  if(study_name == "TCGAcoad"){
		x <- create.Status.records(study_name, "TCGA.3L.AA1B")[[1]]
		checkEquals(x, list(PatientID="TCGA.3L.AA1B", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="12/16/2013", status="ALIVE", tumorStatus=as.character(NA))))
    	x <- create.Status.records(study_name, "TCGA.CK.6746")[[1]]
    	checkEquals(x, list(PatientID="TCGA.CK.6746", PtNum=298, study=study_name, Name="Status", 
    					Fields=list(date="12/30/2008", status="ALIVE", tumorStatus="TUMOR FREE")))
	}
  if(study_name == "TCGAgbm"){
		x <- create.Status.records(study_name, "TCGA.02.0001")[[1]]
		checkTrue(is.list(x))
		checkEquals(names(x), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x, list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="12/25/2002", status="DEAD", tumorStatus="WITH TUMOR")))
		x <- create.Status.records(study_name, "TCGA.06.0877")[[1]]
   		checkEquals(x, list(PatientID="TCGA.06.0877", PtNum=28, study=study_name, Name="Status", 
   						Fields=list(date="07/23/2008", status="ALIVE", tumorStatus="WITH TUMOR")))
   		x <- create.Status.records(study_name, "TCGA.12.1091")[[1]]
   		checkEquals(x, list(PatientID="TCGA.12.1091", PtNum=133, study=study_name, Name="Status", 
   						Fields=list(date="10/08/2003", status="DEAD", tumorStatus="WITH TUMOR")))
	}
  if(study_name == "TCGAhnsc"){
		x <- create.Status.records(study_name, "TCGA.4P.AA8J")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.4P.AA8J", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="04/13/2013", status="ALIVE", tumorStatus="TUMOR FREE")))
		x <- create.Status.records(study_name, "TCGA.CN.6017")
		checkEquals(x[[1]], list(PatientID="TCGA.CN.6017", PtNum=100, study=study_name, Name="Status", 
						Fields=list(date="05/03/2012", status="DEAD", tumorStatus="TUMOR FREE")))

		x <- create.Status.records(study_name, "TCGA.BA.4074")
		checkEquals(x[[1]], list(PatientID="TCGA.BA.4074", PtNum=2, study=study_name, Name="Status", 
						Fields=list(date="04/07/2004", status="DEAD", tumorStatus="WITH TUMOR")))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Status.records(study_name, "TCGA.CS.6290")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="07/01/2010", status="ALIVE", tumorStatus="NA;WITH TUMOR")))
	}
  if(study_name == "TCGAluad"){
  		x <- create.Status.records(study_name, "TCGA.05.4244")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(x[[1]], list(PatientID="TCGA.05.4244", PtNum=1, study=study_name, Name="Status", 
							Fields=list(date="01/01/2009", status="ALIVE", tumorStatus="TUMOR FREE")))
		x <- create.Status.records(study_name, "TCGA.49.4486")
    	checkEquals(x[[1]], list(PatientID="TCGA.49.4486", PtNum=100, study=study_name, Name="Status", 
    						Fields=list(date="05/07/1998", status="DEAD", tumorStatus="WITH TUMOR")))
	}
  if(study_name == "TCGAlusc"){
		x <- create.Status.records(study_name, "TCGA.18.3406")	
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.18.3406", PtNum=1, study=study_name, Name="Status", 
							Fields=list(date="01/07/2004", status="DEAD", tumorStatus="WITH TUMOR")))    
		x <- create.Status.records(study_name, "TCGA.63.5128") #tbl.pt.row$death_days_to == "[Not Available]"
		checkEquals(x[[1]], list(PatientID="TCGA.63.5128", PtNum=253, study=study_name, Name="Status", 
							Fields=list(date=as.character(NA), status="DEAD", tumorStatus="WITH TUMOR")))
		x <- create.Status.records(study_name, "TCGA.NC.A5HI")
		checkEquals(x[[1]], list(PatientID="TCGA.NC.A5HI", PtNum=473, study=study_name, Name="Status", 
							Fields=list(date="10/12/2012", status="ALIVE", tumorStatus="TUMOR FREE")))
	}
  if(study_name == "TCGAprad"){
		x <- create.Status.records(study_name, "TCGA.2A.A8VL")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study=study_name, Name="Status", 
						Fields=list(date="09/14/2011", status="ALIVE", tumorStatus="TUMOR FREE")))
		x <- create.Status.records(study_name, "TCGA.V1.A8MF")
		checkEquals(x[[1]], list(PatientID="TCGA.V1.A8MF", PtNum=367, study=study_name, Name="Status", 
						Fields=list(date=as.character(NA), status="ALIVE", tumorStatus=as.character(NA))))
	}
  if(study_name == "TCGAread"){
		x <- create.Status.records(study_name, "TCGA.AF.2687")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]]$Fields), c("date", "status", "tumorStatus"))
		checkEquals(x[[1]], list(PatientID="TCGA.AF.2687", PtNum=1, study=study_name, Name="Status", 
					Fields=list(date="01/05/2011", status="ALIVE", tumorStatus="TUMOR FREE")))
		x <- create.Status.records(study_name, "TCGA.AG.3583")
		checkEquals(x[[1]], list(PatientID= "TCGA.AG.3583", PtNum=25, study=study_name, Name="Status", 
					Fields=list(date="09/02/2009", status="DEAD", tumorStatus=as.character(NA))))
		x <- create.Status.records(study_name, "TCGA.BM.6198")
		checkEquals(x[[1]], list(PatientID="TCGA.BM.6198", PtNum=106, study=study_name, Name="Status", 
					Fields=list(date="11/07/2010", status="ALIVE", tumorStatus="NA;TUMOR FREE")))#
	}
}
lapply(studies, test_create.Status.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Progression.records <- function(study_name)
{
  print("--- test_create.Progression.record")
  if(study_name == "TCGAbrca"){
		x <- create.Progression.records(study_name, "TCGA.A7.A13E")
		checkTrue(is.list(x))
		checkEquals(length(x), 1) 
	    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    	checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
    	checkEquals(x[[1]], list(PatientID="TCGA.A7.A13E", PtNum=135, study=study_name, Name="Progression", 
    						Fields=list(date="07/11/2011", event="DISTANT METASTASIS", number=1)))
    	x <- create.Progression.records(study_name, "TCGA.E2.A152")
    	checkEquals(x[[1]], list(PatientID="TCGA.E2.A152", PtNum=815, study=study_name, Name="Progression", 
    						Fields=list(date="02/24/2009", event="DISTANT METASTASIS", number=1)))
	}
  if(study_name == "TCGAcoad"){
	  	x <- create.Progression.records(study_name, "TCGA.NH.A6GA")
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.NH.A6GA", PtNum=442, study=study_name, Name="Progression", 
							Fields=list(date="01/07/2013", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.NH.A6GA", PtNum=442, study=study_name, Name="Progression", 
							Fields=list(date="04/17/2013", event=as.character(NA), number=2)))
		x <- create.Progression.records(study_name, "TCGA.A6.2674")  #2 progression events
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.A6.2674", PtNum=7, study=study_name, Name="Progression", 
							Fields=list(date="01/06/2011", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.A6.2674", PtNum=7, study=study_name, Name="Progression", 
							Fields=list(date="05/04/2012", event=as.character(NA), number=2)))
	}
  if(study_name == "TCGAgbm"){
		x <- create.Progression.records(study_name, "TCGA.02.0007")
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.02.0007", PtNum=4, study=study_name, Name="Progression", 
							Fields=list(date="06/03/2003", event="PROGRESSION OF DISEASE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.02.0001")
		checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study=study_name, Name="Progression", 
							Fields=list(date="05/18/2002", event="RECURRENCE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.15.1444")  #in nte table
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.15.1444", PtNum=68, study=study_name, Name="Progression", 
							Fields=list(date="03/30/2008", event="PROGRESSION OF DISEASE", number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.15.1444", PtNum=68, study=study_name, Name="Progression", 
							Fields=list(date="03/30/2008", event="RECURRENCE", number=2)))
		x <- create.Progression.records(study_name, "TCGA.06.A5U0")  #in  table
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.06.A5U0", PtNum=303, study=study_name, Name="Progression", 
							Fields=list(date="04/10/2012", event="PROGRESSION OF DISEASE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.06.0939") #2 progression events
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.06.0939", PtNum=485, study=study_name, Name="Progression", 
							Fields=list(date="11/25/2008", event="PROGRESSION OF DISEASE", number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.06.0939", PtNum=485, study=study_name, Name="Progression", 
							Fields=list(date="12/26/2008", event=as.character(NA), number=2)))
	}
  if(study_name == "TCGAhnsc"){
		x <- create.Progression.records(study_name, "TCGA.BA.A4IF")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.BA.A4IF", PtNum=23, study=study_name, Name="Progression", 
					Fields=list(date="04/08/2012", event="NEW PRIMARY TUMOR", number=1)))
		x <- create.Progression.records(study_name, "TCGA.UF.A7JV")
		checkEquals(x[[1]], list(PatientID="TCGA.UF.A7JV", PtNum=523, study=study_name, Name="Progression", 
					Fields=list(date="02/25/2011", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.QK.A6IH") # two records in follow up nte
		checkEquals(length(x),2)
		checkEquals(x[[1]], list(PatientID="TCGA.QK.A6IH", PtNum=482, study=study_name, Name="Progression", 
					Fields=list(date="08/17/2013", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.QK.A6IH", PtNum=482, study=study_name, Name="Progression", 
					Fields=list(date="09/06/2013", event="DISTANT METASTASIS", number=2)))
		x <- create.Progression.records(study_name, "TCGA.BA.A6DB") # only in nte
		checkEquals(x[[1]], list(PatientID="TCGA.BA.A6DB", PtNum=29, study=study_name, Name="Progression", 
					Fields=list(date="07/27/2012", event="LOCOREGIONAL DISEASE", number=1)))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Progression.records(study_name, "TCGA.DU.6407")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.DU.6407", PtNum=25, study=study_name, Name="Progression", 
							Fields=list(date="07/26/2007", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.DU.5852")
		checkEquals(x[[1]], list(PatientID="TCGA.DU.5852", PtNum=4, study=study_name, Name="Progression", 
							Fields=list(date="01/25/2010", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.HT.8564")  #in nte table
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.HT.8564", PtNum=188, study=study_name, Name="Progression", 
							Fields=list(date="04/30/2012", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.FG.5963")  #2 progression events
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.FG.5963", PtNum=27, study=study_name, Name="Progression", 
							Fields=list(date="01/31/2010", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.FG.5963", PtNum=27, study=study_name, Name="Progression", 
							Fields=list(date="05/13/2010", event=as.character(NA), number=2)))
	}	
  if(study_name == "TCGAluad"){
		x <- create.Progression.records(study_name, "TCGA.49.AAQV")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.49.AAQV", PtNum=118, study=study_name, Name="Progression", 
							Fields=list(date="05/24/2013", event="DISTANT METASTASIS", number=1)))
		x <- create.Progression.records(study_name, "TCGA.MP.A4TE")
		checkEquals(length(x), 3)
		checkEquals(x[[1]], list(PatientID="TCGA.MP.A4TE", PtNum=504, study=study_name, Name="Progression", 
							Fields=list(date="08/15/2010", event="LOCOREGIONAL RECURRENCE", number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.MP.A4TE", PtNum=504, study=study_name, Name="Progression", 
							Fields=list(date="02/16/2011", event="LOCOREGIONAL RECURRENCE", number=2)))
		checkEquals(x[[3]], list(PatientID="TCGA.MP.A4TE", PtNum=504, study=study_name, Name="Progression", 
							Fields=list(date="04/25/2012", event="DISTANT METASTASIS", number=3)))
	}
  if(study_name == "TCGAlusc"){
		x <- create.Progression.records(study_name, "TCGA.33.AASB")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.33.AASB", PtNum=89, study=study_name, Name="Progression", 
							Fields=list(date="01/31/2002", event="DISTANT METASTASIS", number=1)))
		x <- create.Progression.records(study_name, "TCGA.O2.A52Q")
		checkEquals(x[[1]], list(PatientID="TCGA.O2.A52Q", PtNum=490, study=study_name, Name="Progression", 
							Fields=list(date="03/29/2005", event="DISTANT METASTASIS", number=1)))
	}
  if(study_name == "TCGAprad"){
		x <- create.Progression.records(study_name, "TCGA.CH.5791")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.CH.5791", PtNum=41, study=study_name, Name="Progression", 
							Fields=list(date="02/01/2007", event="NEW PRIMARY TUMOR", number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.CH.5791", PtNum=41, study=study_name, Name="Progression", 
							Fields=list(date="09/01/2008", event="NEW PRIMARY TUMOR", number=2)))
		x <- create.Progression.records(study_name, "TCGA.YL.A9WK")
		checkEquals(x[[1]], list(PatientID="TCGA.YL.A9WK", PtNum=470, study=study_name, Name="Progression", 
							Fields=list(date="10/06/2010", event="BIOCHEMICAL EVIDENCE OF DISEASE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.YL.A8SP")
		checkEquals(x[[1]], list(PatientID="TCGA.YL.A8SP", PtNum=464, study=study_name, Name="Progression", 
							Fields=list(date="07/29/2013", event="BIOCHEMICAL EVIDENCE OF DISEASE", number=1)))
	}
  if(study_name == "TCGAread"){
		x <- create.Progression.records(study_name, "TCGA.AF.2689")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "event", "number"))
		checkEquals(x[[1]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study_name, Name="Progression", 
							Fields=list(date="10/29/2009", event=as.character(NA), number=1)))
		x <- create.Progression.records(study_name, "TCGA.AF.A56K")  #in nte table
		checkEquals(length(x), 1)
		checkEquals(x[[1]], list(PatientID="TCGA.AF.A56K", PtNum=16, study=study_name, Name="Progression", 
							Fields=list(date="05/02/2009", event="LOCOREGIONAL DISEASE", number=1)))
		x <- create.Progression.records(study_name, "TCGA.AF.3911")  #2 progression events
		checkEquals(length(x), 2)
		checkEquals(x[[1]], list(PatientID="TCGA.AF.3911", PtNum=8, study=study_name, Name="Progression", 
							Fields=list(date="11/27/2010", event=as.character(NA), number=1)))
		checkEquals(x[[2]], list(PatientID="TCGA.AF.3911", PtNum=8, study=study_name, Name="Progression", 
							Fields=list(date="10/18/2011", event=as.character(NA), number=2)))
	}
}
lapply(studies, test_create.Progression.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Absent.records <- function(study_name)
{
  print("--- test_create.Absent.record")
  if(study_name == "TCGAbrca"){
		x <- create.Absent.records(study_name, "TCGA.Z7.A8R5")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(length(x),2)
		checkEquals(x[[1]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study=study_name, Name="Absent", 
					Fields=list(date="01/02/1996", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study=study_name, Name="Absent", 
					Fields=list(date="07/01/2005", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.W8.A86G") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.W8.A86G", PtNum=1082, study=study_name, Name="Absent",
					Fields=list(date="02/24/2013", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAcoad"){
	  	x <- create.Absent.records(study_name, "TCGA.A6.A565")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[2]], list(PatientID="TCGA.A6.A565", PtNum=51, study=study_name, Name="Absent", 
					Fields=list(date="10/28/2008", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		checkEquals(x[[1]], list(PatientID="TCGA.A6.A565", PtNum=51, study=study_name, Name="Absent", 
			        Fields=list(date="03/15/2009", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.AD.6888") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.AD.6888", PtNum=232, study=study_name, Name="Absent", 
			        Fields=list(date=as.character(NA), Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.A6.2674") #has f2: no radiation
		checkEquals(x[[1]], list(PatientID="TCGA.A6.2674", PtNum=7, study=study_name, Name="Absent", 
					Fields=list(date="01/06/2011", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.A6.2674", PtNum=7, study=study_name, Name="Absent", 
					Fields=list(date="05/04/2012", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAgbm"){
  		x <- create.Absent.records(study_name, "TCGA.06.1806")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[1]], list(PatientID="TCGA.06.1806", PtNum=91, study=study_name, Name="Absent", 
					Fields=list(date="09/14/2009", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.19.A6J4") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.19.A6J4", PtNum=308, study=study_name, Name="Absent",
					Fields=list(date="11/06/2004", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.02.0009") #has f2: no radiation
		checkEquals(x[[2]], list(PatientID="TCGA.02.0009", PtNum=5, study=study_name, Name="Absent",
					Fields=list(date=as.character(NA), Radiation="TRUE", Drug=as.character(NA), Pulmonary=as.character(NA))))
		checkEquals(x[[1]], list(PatientID="TCGA.02.0009", PtNum=5, study=study_name, Name="Absent",
					Fields=list(date="09/22/2003", Radiation="TRUE", Drug=as.character(NA), Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAhnsc"){
	  	x <- create.Absent.records(study_name, "TCGA.BA.A6DI")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
	    checkEquals(x[[1]], list(PatientID="TCGA.BA.A6DI", PtNum=34, study=study_name, Name="Absent", 
	    			Fields=list(date="09/23/2012", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Absent.records(study_name, "TCGA.DB.A4X9")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[1]], list(PatientID="TCGA.DB.A4X9", PtNum=193, study=study_name, Name="Absent", 
				 	Fields=list(date="05/17/2011", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.FG.A60K") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.FG.A60K", PtNum=254, study=study_name, Name="Absent",
					Fields=list(date="02/11/2009", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.FG.A4MT") #has omf
		checkEquals(x[[1]], list(PatientID="TCGA.FG.A4MT", PtNum=197, study=study_name, Name="Absent",
					Fields=list(date="05/15/2011", Radiation="FALSE", Drug="TRUE", Pulmonary=as.character(NA))))
	}	
  if(study_name == "TCGAluad"){
		x <- create.Absent.records(study_name, "TCGA.62.A46O")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
    	checkEquals(x[[1]], list(PatientID="TCGA.62.A46O", PtNum=261, study=study_name, Name="Absent", 
    				Fields=list(date="08/01/2008", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAlusc"){
	  	x <- create.Absent.records(study_name, "TCGA.33.AASJ")
		checkTrue(is.list(x))
		checkEquals(length(x), 1)
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
	  	checkEquals(x[[1]], list(PatientID="TCGA.33.AASJ", PtNum=92, study=study_name, Name="Absent", 
	  				Fields=list(date="02/09/2002", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAprad"){
		x <- create.Absent.records(study_name, "TCGA.KK.A7B4")
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[1]], list(PatientID="TCGA.KK.A7B4", PtNum=330, study=study_name, Name="Absent", 
					Fields=list(date="05/10/1999", Radiation="FALSE", Drug="TRUE", Pulmonary=as.character(NA))))
		x <- create.Absent.records(study_name, "TCGA.EJ.A6RC") #nte & omf
		checkEquals(x[[2]], list(PatientID="TCGA.EJ.A6RC", PtNum=126, study=study_name, Name="Absent",
					Fields=list(date=as.character(NA), Radiation=as.character(NA), Drug="TRUE", Pulmonary=as.character(NA))))
	}
  if(study_name == "TCGAread"){
		x <- create.Absent.records(study_name, "TCGA.AF.2689")
		checkTrue(is.list(x))
		checkEquals(length(x),3)
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Radiation", "Drug", "Pulmonary"))
		checkEquals(x[[3]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study_name, Name="Absent", 
					Fields=list(date="10/29/2009", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		checkEquals(x[[2]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study_name, Name="Absent", 
					Fields=list(date="04/07/2010", Radiation="TRUE", Drug="FALSE", Pulmonary=as.character(NA))))
		checkEquals(x[[1]], list(PatientID="TCGA.AF.2689", PtNum=2, study=study_name, Name="Absent", 
					Fields=list(date="02/09/2012", Radiation="TRUE", Drug="TRUE", Pulmonary=as.character(NA))))
	}
}
lapply(studies, test_create.Absent.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Tests.records <- function(study_name)
{
  print("--- test_create.Tests.record")
  if(study_name == "TCGAbrca"){
		x <- create.Tests.records(study_name, "TCGA.A2.A0YC")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
	    checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
	    checkEquals(length(x),9)
	    checkEquals(x[[2]], list(PatientID="TCGA.A2.A0YC", PtNum=80, study=study_name, Name="Tests", 
	    					Fields=list(date=as.character(NA), Type=as.character(NA), Test="CENTROMERE_17",Result="her2Cent17Ratio:1.18")))
		checkEquals(x[[4]], list(PatientID="TCGA.A2.A0YC", PtNum=80, study=study_name, Name="Tests", 
	    					Fields=list(date=as.character(NA), Type="FISH", Test="HER2",
	    					Result="her2FishStatus:NEGATIVE")))
	}
  if(study_name == "TCGAcoad"){
		x <- create.Tests.records(study_name, "TCGA.DM.A28E")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
		checkEquals(length(x),4) #has two mutations
		checkEquals(x[[3]], list(PatientID="TCGA.DM.A28E", PtNum=389, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="KRAS", Result="krasCodon:12")))
		checkEquals(x[[2]], list(PatientID="TCGA.DM.A28E", PtNum=389, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type=as.character(NA), Test="BRAF", Result="brafRes:NORMAL")))

		x <- create.Tests.records(study_name, "TCGA.NH.A8F8")
		checkEquals(x[[3]], list(PatientID="TCGA.NH.A8F8", PtNum=446, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="KRAS", Result="krasCodon:12")))
		x <- create.Tests.records(study_name, "TCGA.A6.5662")
		checkEquals(length(x), 7)
		checkEquals(x[[4]], list(PatientID="TCGA.A6.5662", PtNum=31, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="LOCI", Result="lociAbnormalCount:0")))
		checkEquals(x[[5]], list(PatientID="TCGA.A6.5662", PtNum=31, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="LOCI", Result="lociTestCount:5")))
  	}
  if(study_name == "TCGAgbm"){
  		x <- create.Tests.records(study_name, "TCGA.02.0001")
  		checkEquals(x[2], "Result is empty.")
    }
  if(study_name == "TCGAhnsc"){	
		x <- create.Tests.records(study_name, "TCGA.QK.A6V9") #nte
		checkTrue(is.list(x))
		checkEquals(length(x), 2)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
		checkEquals(x[[1]], list(PatientID="TCGA.QK.A6V9", PtNum=485, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type="ISH",Test="HPV_ISH", Result="hpvIsh:POSITIVE")))
		checkEquals(x[[2]], list(PatientID="TCGA.QK.A6V9", PtNum=485, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type="P16",Test="HPV_P16", Result="hpvP16:POSITIVE")))
		
		x <- create.Tests.records(study_name, "TCGA.CN.A497")
		checkEquals(length(x), 3)
		checkEquals(x[[1]], list(PatientID="TCGA.CN.A497", PtNum=116, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA), Type=as.character(NA),Test="EGFR", Result="egfrAmp:UNAMPLIFIED")))
	}
  if(study_name == "TCGAlgg"){
		x <- create.Tests.records(study_name, "TCGA.HW.7489") 
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
		checkEquals(x[[1]], list(PatientID="TCGA.HW.7489", PtNum=86, study=study_name, Name="Tests",
					Fields=list(date=as.character(NA), Type="SEQUENCE ANALYSIS", Test="IDH1",Result="idh1Found:YES")))
		x <- create.Tests.records(study_name, "TCGA.TM.A84C") 
		checkEquals(x[[1]], list(PatientID="TCGA.TM.A84C", PtNum=402, study=study_name, Name="Tests",
					Fields=list(date=as.character(NA),Type="IHC", Test="IDH1",Result="idh1Found:NO")))
  	}	
  if(study_name == "TCGAluad"){
		x <- create.Tests.records(study_name, "TCGA.69.7761") #nte
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date", "Type", "Test", "Result"))
		checkEquals(x[[1]], list(PatientID="TCGA.69.7761", PtNum=294, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="EGFR", Result="egfrStatus:YES")))
		checkEquals(x[[3]], list(PatientID="TCGA.69.7761", PtNum=294, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type="PULMONARY",Test="Pulmonary_function", Result="pulInd:YES")))
		x <- create.Tests.records(study_name, "TCGA.49.AAQV")#has two mutations
		checkEquals(x[[1]], list(PatientID="TCGA.49.AAQV", PtNum=118, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EGFR", Result="egfrStatus:YES")))
		checkEquals(x[[2]], list(PatientID="TCGA.49.AAQV", PtNum=118, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EGFR", Result="egfrType:EXON 19 DELETION")))
		
		checkEquals(x[[3]], list(PatientID="TCGA.49.AAQV", PtNum=118, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EML4_ALK", Result="elm4AlkStatus:YES")))
	}
  if(study_name == "TCGAlusc"){
		x <- create.Tests.records(study_name, "TCGA.21.5783")
		checkTrue(is.list(x))
		checkEquals(length(x), 3)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date","Type","Test", "Result"))
		checkEquals(x[[1]], list(PatientID="TCGA.21.5783", PtNum=32, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EGFR", Result="egfrStatus:NO")))
		checkEquals(x[[2]], list(PatientID="TCGA.21.5783", PtNum=32, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="EML4_ALK", Result="elm4AlkStatus:NO")))
		checkEquals(x[[3]], list(PatientID="TCGA.21.5783", PtNum=32, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type="PULMONARY",Test="Pulmonary_function", Result="pulInd:YES")))
		x <- create.Tests.records(study_name, "TCGA.60.2710") #has two mutations
		checkEquals(x[[1]], list(PatientID="TCGA.60.2710", PtNum=238, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EGFR", Result="egfrStatus:NO")))
		checkEquals(x[[2]], list(PatientID="TCGA.60.2710", PtNum=238, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA), Test="EML4_ALK", Result="elm4AlkStatus:NO")))
	}
  if(study_name == "TCGAprad"){
		x <- create.Tests.records(study_name, "TCGA.2A.A8VL")
		checkTrue(is.list(x))
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date","Type","Test", "Result"))
		checkEquals(length(x),2)
		checkEquals(x[[2]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study=study_name, Name="Tests", 
							Fields=list(date="08/09/2011",Type="PSA",Test="PSA", Result="psaRes:0.05")))
		checkEquals(x[[1]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study=study_name, Name="Tests", 
							Fields=list(date="01/22/2010",Type="BONE SCAN",Test="BONE_SCAN", Result="boneScaneRes:NORMAL (NO EVIDENCE OF PROSTATE CANCER) [CM0]")))
	}
  if(study_name == "TCGAread"){
		x <- create.Tests.records(study_name, "TCGA.DY.A1DE") #has two mutations
		checkTrue(is.list(x))
		checkEquals(length(x), 6)
		checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
		checkEquals(names(x[[1]][["Fields"]]), c("date","Type","Test", "Result"))
		checkEquals(x[[4]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="KRAS", Result="krasInd:YES")))
		checkEquals(x[[2]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="BRAF", Result="brafRes:NORMAL")))
		checkEquals(x[[6]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="LOCI", Result="lociTestCount:5")))
		checkEquals(x[[5]], list(PatientID="TCGA.DY.A1DE", PtNum=133, study=study_name, Name="Tests", 
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="LOCI", Result="lociAbnormalCount:0")))

	    x <- create.Tests.records(study_name, "TCGA.AG.4021")
	    checkEquals(length(x), 3)
	    checkEquals(x[[2]], list(PatientID="TCGA.AG.4021", PtNum=74, study=study_name, Name="Tests",
					    	Fields=list(date=as.character(NA),Type=as.character(NA),Test="CEA", Result="ceaTx:3101")))
	    checkEquals(x[[3]], list(PatientID="TCGA.AG.4021", PtNum=74, study=study_name, Name="Tests",
					    	Fields=list(date=as.character(NA),Type="IHC",Test="MISMATCHED_PROTEIN", Result="mismatchProteinTestIhc:NO")))
	    checkEquals(x[[1]], list(PatientID="TCGA.AG.4021", PtNum=74, study=study_name, Name="Tests",
					    	Fields=list(date=as.character(NA),Type=as.character(NA),Test="BRAF", Result="brafInd:YES")))
	   
		x <- create.Tests.records(study_name, "TCGA.AF.6136")
		checkEquals(x[[1]], list(PatientID="TCGA.AF.6136", PtNum=13, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="CEA", Result="ceaTx:18.3")))
		checkEquals(x[[2]], list(PatientID="TCGA.AF.6136", PtNum=13, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA),Type=as.character(NA),Test="LOCI", Result="lociAbnormalCount:0")))
		checkEquals(x[[4]], list(PatientID="TCGA.AF.6136", PtNum=13, study=study_name, Name="Tests",
							Fields=list(date=as.character(NA), Type="IHC",Test="MISMATCHED_PROTEIN", 
								Result="mismatchProteinLossIhc:MLH1 EXPRESSED|MSH2 EXPRESSED|PMS2 EXPRESSED|MSH6 EXPRESSED")))
	}
}
lapply(studies, test_create.Tests.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Encounter.records <- function(study_name) 
{
  if(study_name == "TCGAbrca"){
		print("--- TCGAbrca_test_create.Encounter.records")
	x <- create.Encounter.records(study_name, "TCGA.3C.AAAU")
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG",height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    #checkEquals(x[[1]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Encounter", Fields=list(encType=NA, KPS=NA, ECOG=NA,date=as.character(NA), height=NA, weight=NA, 
    	                     #prefev1.ratio=NA, prefev1.percent=NA, postfev1.ratio=NA,postfev1.percent=NA,carbon.monoxide.diffusion=NA)))
      	}
  if(study_name == "TCGAcoad"){
		print("--- TCGAcoad_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.3L.AA1B")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG", "height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.3L.AA1B", PtNum=1, study="TCGAcoad", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height="173",weight="63.3",
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    x <- create.Encounter.records(study_name, "TCGA.AA.3970")
    checkEquals(x[[1]], list(PatientID="TCGA.AA.3970", PtNum=171, study="TCGAcoad", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA),height=as.character(NA),weight=as.character(NA),
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
		}
  if(study_name == "TCGAgbm"){
		print("--- TCGAgbm_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.02.0001")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG", "height", "weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study="TCGAgbm", Name="Encounter", Fields=list(encType=as.character(NA), KPS="80", ECOG=as.character(NA),height=as.character(NA),weight=as.character(NA),
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    x <- create.Encounter.records(study_name, "TCGA.06.0875") 
    checkEquals(x[[1]], list(PatientID="TCGA.06.0875", PtNum=26, study="TCGAgbm", Name="Encounter", Fields=list(encType="PRE-OPERATIVE", KPS="80", ECOG=as.character(NA),height=as.character(NA),weight=as.character(NA),
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))								
      	}
  if(study_name == "TCGAhnsc"){
		print("--- TCGAhnsc_test_create.Encounter.records")
	x <- create.Encounter.records(study_name, "TCGA.4P.AA8J")
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]$Fields), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("encType", "KPS", "ECOG", ,"height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    #checkEquals(x[[1]], list(PatientID="TCGA.4P.AA8J", PtNum=1, study="TCGAhnsc", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height=as.character(NA), weight=as.character(NA), 
    	                     #prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))   
		}
  if(study_name == "TCGAlgg"){
		print("--- TCGAlgg_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.CS.6290")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields")) 
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG","height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study="TCGAlgg",  Name="Encounter", Fields=list(encType="PRE-OPERATIVE", KPS="90", ECOG="1", height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    checkEquals(x[[2]], list(PatientID="TCGA.CS.6290", PtNum=1, study="TCGAlgg", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    x <- create.Encounter.records(study_name,"TCGA.FG.6691") 
    checkEquals(x[[1]], list(PatientID="TCGA.FG.6691", PtNum=49, study="TCGAlgg", Name="Encounter", Fields=list(encType="PRE-OPERATIVE", KPS="100", ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    checkEquals(x[[2]], list(PatientID="TCGA.FG.6691", PtNum=49, study="TCGAlgg", Name="Encounter", Fields=list(encType="PREOPERATIVE", KPS="90", ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    checkEquals(x[[3]], list(PatientID="TCGA.FG.6691", PtNum=49, study="TCGAlgg", Name="Encounter", Fields=list(encType="ADJUVANT THERAPY", KPS="80", ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    checkEquals(x[[4]], list(PatientID="TCGA.FG.6691", PtNum=49, study="TCGAlgg", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
		}
  if(study_name == "TCGAluad"){
		print("--- TCGAluad_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.05.4244")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields")) 
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG","height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.05.4244", PtNum=1, study="TCGAluad", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA),height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
		}
  if(study_name == "TCGAlusc"){
		print("--- TCGAlusc_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.18.3406")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG","height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.18.3406", PtNum=1, study="TCGAlusc", Name="Encounter", Fields=list(encType=as.character(NA), KPS="0", ECOG=as.character(NA), height=as.character(NA), weight=as.character(NA), 
    	                     prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
      	}
  if(study_name == "TCGAprad"){
    	print("--- TCGAprad_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.2A.A8VL")
    print(x)
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]$Fields), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("encType", "KPS", "ECOG", ,"height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    #checkEquals(x[[1]], list(PatientID="TCGA.2A.A8VL", PtNum=1, study="TCGAprad", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height=as.character(NA), weight=as.character(NA), 
    						 #prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))   
    
      	}
  if(study_name == "TCGAread"){
		print("--- TCGAread_test_create.Encounter.records")
    x <- create.Encounter.records(study_name, "TCGA.AF.2687")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields")) 
    checkEquals(names(x[[1]]$Fields), c("encType", "KPS", "ECOG","height","weight","prefev1.ratio", "prefev1.percent", "postfev1.ratio", "postfev1.percent", "carbon.monoxide.diffusion"))
    checkEquals(x[[1]], list(PatientID="TCGA.AF.2687", PtNum=1, study="TCGAread", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height="163",weight="68.2",
    						prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
    x <- create.Encounter.records(study_name,"TCGA.F5.6814")
    checkEquals(x[[1]], list(PatientID="TCGA.F5.6814", PtNum=164, study="TCGAread", Name="Encounter", Fields=list(encType=as.character(NA), KPS=as.character(NA), ECOG=as.character(NA), height="175",weight="61",
    						prefev1.ratio=as.character(NA), prefev1.percent=as.character(NA), postfev1.ratio=as.character(NA),postfev1.percent=as.character(NA),carbon.monoxide.diffusion=as.character(NA))))
      	}
}
lapply(studies, test_create.Encounter.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Procedure.records <- function(study_name)
{
   if(study_name == "TCGAbrca"){
		print("--- TCGAbrca_test_create.Procedure.records")
	    x <- create.Procedure.records(study_name, "TCGA.3C.AAAU")
	    checkTrue(is.list(x))
	    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
	    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
	    #checkEquals(x[[1]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site="DISTANT METASTASIS",side=as.character(NA)))) 
	    #checkEquals(x[[2]], list(PatientID="TCGA.3C.AAAU", PtNum=1, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name="MODIFIED RADICAL MASTECTOMY",site=as.character(NA), side=as.character(NA)))) 
	    #x <- create.Procedure.records(study_name,"TCGA.Z7.A8R5")
	    #checkTrue(is.list(x))
	    #checkEquals(x[[1]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site="LOCOREGIONAL RECURRENCE",side=as.character(NA))))
	    #checkEquals(x[[2]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study="TCGAbrca", Name="Procedure", Fields=list(date="01/02/1996", name="GROSS TOTAL RESECTION",site=as.character(NA),side=as.character(NA))))
	    #checkEquals(x[[3]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site="LOCOREGIONAL RECURRENCE",side=as.character(NA))))
	 	#checkEquals(x[[4]], list(PatientID="TCGA.Z7.A8R5", PtNum=1087, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site=as.character(NA),side=as.character(NA))))
	    #x <- create.Procedure.records(study_name,"TCGA.A7.A13G")
	    #checkTrue(is.list(x))
	    #checkEquals(x[[1]], list(PatientID="TCGA.A7.A13G", PtNum=137, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name="SIMPLE MASTECTOMY",site=as.character(NA),side=as.character(NA))))
	    #checkEquals(x[[2]], list(PatientID="TCGA.A7.A13G", PtNum=137, study="TCGAbrca", Name="Procedure", Fields=list(date="04/28/1999", name=as.character(NA),site=as.character(NA),side="LEFT")))
	    #checkEquals(x[[3]], list(PatientID="TCGA.A7.A13G", PtNum=137, study="TCGAbrca", Name="Procedure", Fields=list(date="01/03/2006", name=as.character(NA),site=as.character(NA),side="LEFT")))   
	    #checkEquals(x[[4]], list(PatientID="TCGA.A7.A13G", PtNum=137, study="TCGAbrca", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA),site="NEW PRIMARY TUMOR",side=as.character(NA))))
    }
  if(study_name == "TCGAcoad"){
	print("--- TCGAcoad_test_create.Procedure.records")
    x <- create.Procedure.records(study_name, "TCGA.AD.6895")
    checkTrue(is.list(x))
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[1]], list(PatientID="TCGA.AD.6895", PtNum=235, study="TCGAcoad", Name="Procedure", Fields=list(date="01/15/2011", name=as.character(NA),site=as.character(NA),side=as.character(NA)))) 
    #x <- create.Procedure.records(study_name,"TCGA.A6.A567") 
    #checkEquals(x[[1]], list(PatientID="TCGA.A6.A567", PtNum=53, study="TCGAcoad", Name="Procedure", Fields=list(date="11/17/2008", name=as.character(NA), site="METASTATIC", side=as.character(NA))))
    #checkEquals(x[[2]], list(PatientID="TCGA.A6.A567", PtNum=53, study="TCGAcoad", Name="Procedure", Fields=list(date="02/11/2010", name=as.character(NA), site="METASTATIC", side=as.character(NA))))
		}
  if(study_name == "TCGAgbm"){
	print("--- TCGAgbm_test_create.Procedure.records")
   	x <- create.Procedure.records(study_name, "TCGA.06.1806")
	checkTrue(is.list(x))
   	checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "name", "site", "side"))
    
    #checkEquals(x[[1]], list(PatientID="TCGA.06.1806", PtNum=91, study="TCGAgbm", Name="Procedure", Fields=list(date=as.character(NA),name=as.character(NA), site="PROGRESSION OF DISEASE", side=as.character(NA))))
    #checkEquals(x[[2]], list(PatientID="TCGA.06.1806", PtNum=91, study="TCGAgbm", Name="Procedure", Fields=list(date=as.character(NA),name=as.character(NA), site="RECURRENCE", side=as.character(NA))))
    #checkEquals(x[[3]], list(PatientID="TCGA.06.1806", PtNum=91, study="TCGAgbm", Name="Procedure", Fields=list(date="09/28/2009",name=as.character(NA), site="LOCOREGIONAL DISEASE", side=as.character(NA))))
    #x <- create.Procedure.records(study_name,"TCGA.19.5958") 
    #checkEquals(x[[1]], list(PatientID="TCGA.19.5958", PtNum=76, study="TCGAgbm", Name="Procedure", Fields=list(date=as.character(NA),name=as.character(NA), site="RECURRENCE", side=as.character(NA))))
    #checkEquals(x[[2]], list(PatientID="TCGA.19.5958", PtNum=76, study="TCGAgbm", Name="Procedure", Fields=list(date="12/24/2010",name=as.character(NA), site="LOCOREGIONAL DISEASE", side=as.character(NA))))									
      	}
  if(study_name == "TCGAhnsc"){
	print("--- TCGAhnsc_test_create.Procedure.records")
    #CORRECT!
    x <- create.Procedure.records(study_name,"TCGA.BA.5149") 
    checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
  	#checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkTrue(is.list(x))
    #checkEquals(x[[1]], list(PatientID="TCGA.BA.5149", PtNum=7, study="TCGAhnsc", Name="Procedure", Fields=list(date="02/14/2011",name=NA, site="METASTASIS", side=as.character(NA))))
 
    x <- create.Procedure.records(study_name,"TCGA.BA.A4IF") 
    #checkEquals(x[[1]], list(PatientID="TCGA.BA.A4IF", PtNum=23, study="TCGAhnsc", Name="Procedure", Fields=list(date= "04/08/2012", name=as.character(NA), site=as.character(NA), side=as.character(NA))))
    
    x <- create.Procedure.records(study_name,"TCGA.CN.6997") 
    #checkEquals(x[[2]], list(PatientID="TCGA.CN.6997", PtNum=114, study="TCGAhnsc", Name="Procedure", Fields=list(date= "01/22/2011",  name="TOTAL LARYNGECTOMY PARTIAL PHARYNGECTOMY L THYROID LOBECTOMY BILATERAL SELECTIVE NECK DISSECTION L CENTRAL COMPARTMENT NECK DISSECTION", site=as.character(NA), side=as.character(NA))))
    #[1],[3].[4]= NA
    #x <- create.Procedure.records(study_name,"TCGA.CQ.7063") 
    #checkEquals(x[[1]], list(PatientID="TCGA.CQ.7063", PtNum=157, study="TCGAhnsc", Name="Procedure", Fields=list(date= "03/05/2008",  name="RIGHT PARTIAL GLOSSECTOMY", site=as.character(NA), side="RIGHT")))
    #checkEquals(x[[2]], list(PatientID="TCGA.CQ.7063", PtNum=157, study="TCGAhnsc", Name="Procedure", Fields=list(date= "05/14/2001",  name="LEFT PARTIAL GLOSSECTOMY", site=as.character(NA), side="LEFT")))
    #checkEquals(x[[3]], list(PatientID="TCGA.CQ.7063", PtNum=157, study="TCGAhnsc", Name="Procedure", Fields=list(date= "05/05/2011",  name=as.character(NA), site="LOCOREGIONAL DISEASE", side=as.character(NA))))
	#checkEquals(x[[4]], list(PatientID="TCGA.CQ.7063", PtNum=157, study="TCGAhnsc", Name="Procedure", Fields=list(date=as.character(NA),  name=as.character(NA), site=as.character(NA), side="RIGHT")))
		}
  if(study_name == "TCGAlgg"){
	print("--- TCGAlgg_test_create.Procedure.records")
    #CHECK!! 
    x <- create.Procedure.records(study_name, "TCGA.CS.6290")
    checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkTrue(is.list(x))
    #checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study="TCGAlgg", Name="Procedure", Fields=list(date=as.character(NA),  name=as.character(NA), site="SUPRATENTORIAL, TEMPORAL LOBE: CEREBRAL CORTEX", side="LEFT")))
    
    #CORRECT old script forced LOCOREGIONAL if there was a date
    x <- create.Procedure.records(study_name, "TCGA.HT.8564")
    #checkEquals(x[[1]], list(PatientID="TCGA.HT.8564", PtNum=188, study="TCGAlgg", Name="Procedure", Fields=list(date=as.character(NA), name=as.character(NA), site="SUPRATENTORIAL, TEMPORAL LOBE", side="LEFT")))
    #checkEquals(x[[2]], list(PatientID="TCGA.HT.8564", PtNum=188, study="TCGAlgg", Name="Procedure", Fields=list(date="04/30/2012", name=as.character(NA), site="LOCOREGIONAL", side=as.character(NA))))
		}
  if(study_name == "TCGAluad"){
		print("--- TCGAluad_test_create.Procedure.records")
    x <- create.Procedure.records(study_name, "TCGA.05.4245")
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[2]], list(PatientID="TCGA.05.4245", PtNum=2, study="TCGAluad", Name="Procedure", Fields=list(date="01/31/2006", name=as.character(NA), site=as.character(NA), side=as.character(NA))))
    
    #CORRECT site is forced 
    #slight collection change, [2] has combined site [1] is NA
    x <- create.Procedure.records(study_name,"TCGA.MP.A4T9")
    #checkEquals(x[[2]], list(PatientID= "TCGA.MP.A4T9", PtNum=500, study="TCGAluad", Name="Procedure", Fields=list(date= "06/09/2009", name=as.character(NA), site=as.character(NA), side=as.character(NA)))
    #checkEquals(x[[1]], list(PatientID= "TCGA.MP.A4T9", PtNum=500, study="TCGAluad", Name="Procedure", Fields=list(date="07/27/2008", name=as.character(NA), site="LOCOREGIONAL RECURRENCE|DISTANT METASTASIS", side=as.character(NA))))
		}
  if(study_name == "TCGAlusc"){
	print("--- TCGAlusc_test_create.Procedure.records")
    x <- create.Procedure.records(study_name,"TCGA.NK.A7XE")
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[1]], list(PatientID="TCGA.NK.A7XE", PtNum=488, study="TCGAlusc", Name="Procedure", Fields=list(date="06/12/2004", name="PROSTECTOMY", site=as.character(NA), side=as.character(NA))))
    #CORRECT old script forced LOCOREGIONAL if there was a date
    #x <- create.Procedure.records(study_name,"TCGA.21.5786")
    #checkEquals(x[[1]], list(PatientID= "TCGA.21.5786", PtNum=34, study="TCGAlusc", Name="Procedure", Fields=list(date="04/19/2011", name=as.character(NA), site="LOCOREGIONAL", side=as.character(NA))))
      	}
  if(study_name == "TCGAprad"){
    print("--- TCGAprad_test_create.Procedure.records")
    #CORRECT! New is CORRECT, SITE was forced NA in old script
    x <- create.Procedure.records(study_name, "TCGA.CH.5763")
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.CH.5763", PtNum=29, study="TCGAprad", Name="Procedure", Fields=list(date= "10/02/2007",  name=as.character(NA), site=as.character(NA), side=as.character(NA)))))
    
    #CORRECT! New is CORRECT, SITE was forced NA in old script
    x <- create.Procedure.records(study_name,"TCGA.KK.A8IB")
    #checkEquals(x[[1]], list(PatientID= "TCGA.KK.A8IB", PtNum=338, study="TCGAprad", Name="Procedure", Fields=list(date= "02/25/2006", name=as.character(NA), site=as.character(NA), side=as.character(NA)))))
      	}
  if(study_name == "TCGAread"){
	print("--- TCGAread_test_create.Procedure.records")
    x <- create.Procedure.records(study_name,"TCGA.AF.A56K") 
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]]$Fields), c("date","name","site","side"))
    #checkEquals(x[[1]], list(PatientID="TCGA.AF.A56K", PtNum=16, study="TCGAread", Name="Procedure", Fields=list(date="12/29/2009", name=as.character(NA), site="LOCOREGIONAL DISEASE", side=as.character(NA))))
    #x <- create.Procedure.records(study_name,"TCGA.G5.6233") 
    #checkEquals(x[[1]], list(PatientID="TCGA.G5.6233", PtNum=168, study="TCGAread", Name="Procedure", Fields=list(date="07/24/2004", name=as.character(NA), site=as.character(NA), side=as.character(NA))))
      	}
}
lapply(studies, test_create.Procedure.records)
#-------------------------------------------------------------------------------------------------------------------------- 
test_create.Pathology.records <- function(study_name)
{
  if(study_name == "TCGAbrca"){
	print("--- TCGAbrca_test_create.Pathology.records")
    x <- create.Pathology.records(study_name,"TCGA.3C.AAAU")
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.3C.AAAU", PtNum=1, study=study_name, Name="Pathology", Fields=list(date="01/01/2004", disease="Breast", 
    #histology="Infiltrating Lobular Carcinoma", histology.category=NA, collection="retrospective", T.Stage="TX",N.Stage="NX",M.Stage="MX",
    #S.Stage="Stage X",staging.System="6th", method=NA)))
    
    x <- create.Pathology.records(study_name,"TCGA.AO.A124")
    #checkEquals(x[[1]], list(PatientID="TCGA.AO.A124", PtNum=357, study=study_name, Name="Pathology", Fields=list(date="01/01/2002", disease="Breast", 
    #histology="Other  specify",  histology.category=NA, collection="retrospective", T.Stage="T2",N.Stage="N0 (i-)",M.Stage="M0",S.Stage="Stage IIA",
    #staging.System="5th", method="Core Biopsy")))

    x <- create.Pathology.records(study_name,"TCGA.B6.A0I8")
    #checkEquals(x[[1]], list(PatientID="TCGA.B6.A0I8", PtNum=459, study=study_name, Name="Pathology",Fields=list(date="01/01/1992", disease="Breast", 
      #histology="Infiltrating Ductal Carcinoma", histology.category=NA, collection="retrospective",T.Stage="T1",N.Stage="NX",M.Stage="M0",
      #S.Stage="Stage X",staging.System=NA, method="Other")))
    #checkEquals(x[[2]], list(PatientID="TCGA.B6.A0I8", PtNum=459, study=study_name, Name="Pathology",Fields=list(date=NA, disease="Breast", 
      #histology="Adenocarcinoma, Not Otherwise Specified", histology.category="Adenocarcinoma", collection=NA,T.Stage="T2",N.Stage="N0",M.Stage="M0",
      #S.Stage="Stage II",staging.System="2nd", method=NA)))
      	}
  if(study_name == "TCGAcoad"){
		print("--- test_create.Pathology.records")
    x <- create.Pathology.records(study_name,"TCGA.AA.3660")
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category","collection","T.Stage","N.Stage","M.Stage","S.Stage", "staging.System"))
    #checkEquals(x[[1]], list(PatientID="TCGA.AA.3660", PtNum=100, study=study, Name="Pathology", Fields=list(date="01/01/2005", disease="Colon", histology="Colon Adenocarcinoma",histology.category=NA, 
    						 #collection= "retrospective", T.Stage="T3",N.Stage="N0",M.Stage="M0",S.Stage="Stage II", staging.System="5th")))

    
    #x <- create.Pathology.records(study_name,"TCGA.A6.2677") 
    #checkEquals(x[[1]], list(PatientID="TCGA.A6.2677", PtNum=10, study=study, Name="Pathology",Fields=list(date="01/01/2009",  disease="Colon", histology="Colon Adenocarcinoma",histology.category=NA, 
    						#collection="prospective", T.Stage="T3",N.Stage="N2",M.Stage="M0",S.Stage="Stage IIIC", staging.System="6th")))
    #checkEquals(x[[2]], list(PatientID="TCGA.A6.2677", PtNum=10, study=study, Name="Pathology",Fields=list(date=NA,  disease="Kidney", histology="Kidney Clear Cell Renal Carcinoma",histology.category="Kidney Clear Cell Renal Carcinoma", 
    						 #collection=NA, T.Stage=NA,N.Stage=NA,M.Stage=NA,S.Stage=NA, staging.System=NA)))
		}
  if(study_name == "TCGAgbm"){
		print("--- TCGAgbm_test_create.Pathology.record")
    x <- create.Pathology.records(study_name,"TCGA.02.0001")
    checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category","collection", "grade", "method"))
    #checkEquals(x[[1]], list(PatientID="TCGA.02.0001", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2002", disease="Brain", histology="Untreated primary (de novo) GBM", histology.category="High Grade Glioma", 
    						 #collection=NA, grade="G4", method="Tumor resection")))
    
    #x <- create.Pathology.records(study_name,"TCGA.06.0209") 
    #checkEquals(x[[1]], list(PatientID="TCGA.06.0209", PtNum=372, study=study, Name="Pathology",Fields=list(date="01/01/1997", disease="Brain", histology="Untreated primary (de novo) GBM", histology.category="High Grade Glioma",
    						 #collection=NA, grade="G4", method="Tumor resection")))
    #checkEquals(x[[2]], list(PatientID="TCGA.06.0209", PtNum=372, study=study, Name="Pathology",Fields=list(date=NA, disease="Prostate", histology="Adenocarcinoma, Not Otherwise Specified",histology.category="Adenocarcinoma",  
    						 #collection=NA, grade="G4", method=NA)))									
      	#}
  #if(study_name == "TCGAhnsc"){
		#print("--- TCGAhnsc_test_create.Pathology.record")
    #x <- create.Pathology.record(tcga.ids[1])
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology", "histology.category", 
      #"collection", "T.Stage", "N.Stage","M.Stage","S.Stage","staging.System"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.4P.AA8J", PtNum=1, study=study, Name="Pathology", 
      #Fields=list(date="01/01/2013", disease="Head and Neck", histology="Head and Neck Squamous Cell Carcinoma", 
      #histology.category=NA, collection="retrospective", T.Stage="T4a",N.Stage="N2a",M.Stage="M0",
      #S.Stage="Stage IVA",staging.System="7th")))
    
    #x <- create.Pathology.records("TCGA-BA-4075") 
    #checkEquals(length(x),2)
    #checkEquals(x[[1]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study, Name="Pathology",
      #Fields=list(date="01/01/2004", disease="Head and Neck", histology="Head and Neck Squamous Cell Carcinoma",  
      #histology.category=NA, collection="retrospective",T.Stage="T4a",N.Stage="N1",M.Stage="M0",
      #S.Stage="Stage IVA",staging.System="6th")))
    #checkEquals(x[[2]], list(PatientID="TCGA.BA.4075", PtNum=3, study=study, Name="Pathology",
      #Fields=list(date=NA, disease="Tongue, Base of tongue", histology="Squamous Cell Carcinoma, Not Otherwise Specified",  
      #histology.category="Squamous Cell Carcinoma",collection=NA,T.Stage=NA,N.Stage=NA,M.Stage=NA,S.Stage=NA,staging.System=NA)))
		#}
  #if(study_name == "TCGAlgg"){
		#print("--- TCGAlgg_test_create.Pathology.record")
    #x <- create.Pathology.records(tcga.ids[1])
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum","study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category", "collection", "grade"))
    #checkEquals(x[[1]], list(PatientID="TCGA.CS.6290", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2009", disease="Central nervous system", histology="Astrocytoma", histology.category="High Grade Glioma", collection="retrospective", grade="G3")))
    #x <- create.Pathology.record("TCGA-FG-8187")
    #checkEquals(x[[1]], list(PatientID="TCGA.FG.8187", PtNum=130, study=study, Name="Pathology", Fields=list(date="01/01/2011", disease="Central nervous system", histology="Oligoastrocytoma", histology.category="Low Grade Glioma", collection="prospective", grade="G2")))
    #checkEquals(x[[2]], list(PatientID="TCGA.FG.8187", PtNum=130, study=study, Name="Pathology", Fields=list(date=NA, disease="Testicle", histology="Other, specify:Germ Cell", histology.category=NA, collection=NA, grade=NA)))
		#}
  #if(study_name == "TCGAluad"){
    #print("--- TCGAluad_test_create.Pathology.record")
    #x <- create.Pathology.record(tcga.ids[1])
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology", "histology.category", "collection", "T.Stage", "N.Stage","M.Stage","S.Stage","staging.System"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.05.4244", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2009", disease="Lung", histology="Lung Adenocarcinoma", histology.category="Lung Adenocarcinoma", collection="retrospective", T.Stage="T2",N.Stage="N2",M.Stage="M1",S.Stage="Stage IV",staging.System="6th")))
    
    #x <- create.Pathology.record("TCGA-05-4382") #has omf
    #checkEquals(x[[1]], list(PatientID="TCGA.05.4382", PtNum=5, study=study, Name="Pathology",Fields=list(date="01/01/2009", disease="Lung", histology="Lung Adenocarcinoma Mixed Subtype", histology.category="Lung Adenocarcinoma", collection="retrospective",T.Stage="T2",N.Stage="N0",M.Stage="M0",S.Stage="Stage IB",staging.System="6th")))
    #checkEquals(x[[2]], list(PatientID="TCGA.05.4382", PtNum=5, study=study, Name="Pathology",Fields=list(date=NA, disease="Penis", histology="Other, specify:carcinoma in situ of penis", histology.category=NA, collection=NA, T.Stage=NA, N.Stage=NA, M.Stage=NA, S.Stage=NA, staging.System=NA)))
		#}
  #if(study_name == "TCGAlusc"){
		#print("--- TCGAlusc_test_create.Pathology.record")
    #x <- create.Pathology.record(tcga.ids[1])
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(x[[1]], list(PatientID="TCGA.18.3406", PtNum=1, study=study, Name="Pathology",Fields=list(date= "01/01/2003", disease="Lung", histology= "Lung Squamous Cell Carcinoma", histology.category="Lung Squamous Cell Carcinoma", collection="retrospective",T.Stage="T1",N.Stage="N0",M.Stage="M0",S.Stage="Stage IA",staging.System=NA,method=NA)))
    #checkEquals(x[[2]], list(PatientID="TCGA.18.3406", PtNum=1, study=study, Name="Pathology",Fields=list(date= NA, disease="Lung", histology="Squamous Cell Carcinoma, Not Otherwise Specified" ,histology.category="Squamous Cell Carcinoma,", collection=NA,T.Stage=NA,N.Stage=NA,M.Stage=NA,S.Stage=NA,staging.System=NA,method=NA)))
    #x <- create.Pathology.record("TCGA-66-2769") #has omf
    #checkEquals(x[[1]], list(PatientID="TCGA.66.2769", PtNum=293, study=study, Name="Pathology",Fields=list(date= "01/01/2007", disease="Lung", histology= "Lung Squamous Cell Carcinoma",  histology.category="Lung Squamous Cell Carcinoma", collection="retrospective",T.Stage="T4",N.Stage="N0",M.Stage="M0",S.Stage="Stage IIIB",staging.System="6th",method=NA)))
    #  	}
  #if(study_name == "TCGAprad"){
    	#print("--- TCGAprad_test_create.Pathology.record")
    #x <- create.Pathology.record("TCGA-CH-5753")
    #checkTrue(is.list(x)) #have both pt and omf
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category", 
        #"collection", "T.Stage", "N.Stage","M.Stage","S.Stage","staging.System", "method"))
    #checkEquals(x[[1]], list(PatientID= "TCGA.CH.5753", PtNum=25, study=study, Name="Pathology", 
        #Fields=list(date="01/01/2008", disease="Prostate", histology="Prostate Adenocarcinoma Acinar Type", 
        #histology.category=NA, collection="prospective", T.Stage=NA,N.Stage=NA,M.Stage="M0",S.Stage=NA,
        #staging.System=NA, method="Core Biopsy")))
    #checkEquals(x[[2]], list(PatientID= "TCGA.CH.5753", PtNum=25, study=study, Name="Pathology", 
        #Fields=list(date=NA, disease="Lymph node(s)", histology="Other, specify:Non-Hodgkin's", histology.category=NA, 
        #collection=NA, T.Stage=NA,N.Stage=NA,M.Stage=NA,S.Stage=NA,staging.System=NA, method=NA)))
    #x <- create.Pathology.record("TCGA-CH-5791")
      	#}
  #if(study_name == "TCGAread"){
		#print("--- TCGA_read_test_create.Pathology.record")
    #x <- create.Pathology.record("TCGA-AF-2687")
    #checkTrue(is.list(x))
    #checkEquals(names(x[[1]]), c("PatientID", "PtNum", "study", "Name", "Fields"))
    #checkEquals(names(x[[1]][["Fields"]]), c("date", "disease", "histology","histology.category","collection","T.Stage","N.Stage","M.Stage","S.Stage", "staging.System"))
    #checkEquals(x[[1]], list(PatientID="TCGA.AF.2687", PtNum=1, study=study, Name="Pathology", Fields=list(date="01/01/2009", disease="Rectum", histology="Rectal Adenocarcinoma",histology.category=NA, collection="prospective", T.Stage="T3",N.Stage="N2",M.Stage="M0",S.Stage="Stage IIIC", staging.System=NA)))
    
    #x <- create.Pathology.record("TCGA-AG-A00H") #has omf
    #checkEquals(x[[1]], list(PatientID="TCGA.AG.A00H", PtNum=79, study=study, Name="Pathology",Fields=list(date="01/01/2008",disease="Rectum", histology="Rectal Adenocarcinoma", histology.category=NA, collection="retrospective", T.Stage="T3",N.Stage="N0",M.Stage="M0",S.Stage="Stage IIA", staging.System="6th")))
      	#}
}
lapply(studies, test_create.Pathology.records)
#-------------------------------------------------------------------------------------------------------------------------- 








