$("#datasetMenu").val("DEMOdz")
$("#selectDatasetButton").click()

$("#historyTable").dataTable().fnFilter("female")
$("#patientHistorySendSelectionsMenu").val("survival")
$("#patientHistorySendSelectionsMenu").trigger("change")
  // survival plot appears