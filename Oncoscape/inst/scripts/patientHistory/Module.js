//----------------------------------------------------------------------------------------------------
var patientHistoryTableRef;

var ageAtDxMinReadout;
var ageAtDxMaxReadout;
var survivalMinReadout, survivalMaxReadout;

var ageAtDxMin, ageAtDxMax;
var ageAtDxSlider, survivalSlider;
var survivalMin, survivalMax;


var PatientHistoryModule = (function () {

  var statusDiv;
  var patientHistoryDiv;
  var controlsDiv;
  var tableDiv;
  var tableElement;
  var sendSelectionsMenu;

  var thisModulesName = "patientHistory";
  var thisModulesOutermostDiv = "patientHistoryDiv";
  var selectionDestinations = [thisModulesName];

  var sendSelectionsMenuTitle = "Send selection...";
  var showAllRowsButton;
  
//--------------------------------------------------------------------------------------------
function initializeUI()
{
  console.log("=== Module.patientHistory, initializeUID");

  $(window).resize(handleWindowResize);

  statusDiv = $("#patientHistoryStatusDiv");

  patientHistoryDiv = $("#patientHistoryDiv");
  controlsDiv = $("#patientHistoryControlsDiv");
  tableDiv = $("#patientHistoryTableDiv");
  tableElement = $("#patientHistoryTable");

  showAllRowsButton = $("#patientHistoryShowAllRowsButton");
  showAllRowsButton.click(showAllRows);

  sendSelectionsMenu = hub.configureSendSelectionMenu("#patientHistorySendSelectionsMenu", 
                                                      selectionDestinations, sendSelections,
                                                      sendSelectionsMenuTitle);

  handleWindowResize();
  hub.disableTab(thisModulesOutermostDiv)


} // initializeUI
//----------------------------------------------------------------------------------------------------
function createDataTable(colnames, data)
{
      // DataTable likes some structure for column titles

   var columnTitles = [];
   for(var i=0; i < colnames.length; i++){
     columnTitles.push({sTitle: colnames[i]});
     }

   if(typeof(patientHistoryTableRef) != "undefined"){
      patientHistoryTableRef.destroy();
      tableElement.empty();
      }

   patientHistoryTableRef = tableElement.DataTable({
                             data: data,
                             columns: columnTitles,
                             //dom: "C<fi<t>>",
                             dom: 'C<"clear">lfrtip',
                             paging: false,
                             jQueryUI: false
                             });

   if(colnames.indexOf("AgeDx") >= 0){
      var minMax = learnSliderMinAndMax(data, colnames.indexOf("AgeDx"));
      console.log("minMax for AgeDx: ");
      console.log(minMax);
      ageAtDxMin = minMax[0];
      ageAtDxMax = minMax[1];
         // slider, title & readouts for specifying age range for table display
      createAgeAtDiagnosisWidget(ageAtDxMin, ageAtDxMax);  
      } // ageAtDx slider

   if(colnames.indexOf("Survival") >= 0){
      minMax = learnSliderMinAndMax(data, colnames.indexOf("Survival"));
      console.log("minMax for Survival: ");
      console.log(minMax);
      survivalMin = minMax[0];
      survivalMax = minMax[1];
         // slider, title & readouts for specifying age range for table display
      createSurvivalWidget(survivalMin, survivalMax);  
      } // survival slider

   showAllRows();
   setupSliderDrivenFilterBehavior(colnames);
 

} // createDataTable
//----------------------------------------------------------------------------------------------------
function setupSliderDrivenFilterBehavior(colnames)
{
  var ageDxColumn = colnames.indexOf("AgeDx");
  var survivalColumn = colnames.indexOf("Survival");

  if(ageDxColumn >= 0) {
    jQuery.fn.dataTable.ext.search.push(
       function(settings, data, dataIndex) {
         var ageAtDxMin      = parseFloat(ageAtDxMinReadout.val());
         var ageAtDxMax      = parseFloat(ageAtDxMaxReadout.val());

         var patientAgeAtDx  = parseFloat(data[ageDxColumn]) || 0;
 
         var ageAtDxInRange  = (patientAgeAtDx >= ageAtDxMin) && (patientAgeAtDx <= ageAtDxMax);
         if(ageAtDxInRange)
            return true;
         return false;
        }); // anonymous function
      } // push

  if(survivalColumn >= 0) {
    jQuery.fn.dataTable.ext.search.push(
       function(settings, data, dataIndex) {
         var survivalMin      = parseFloat(survivalMinReadout.val());
         var survivalMax      = parseFloat(survivalMaxReadout.val());

         var patientSurvival  = parseFloat(data[survivalColumn]) || 0;
         var survivalInRange  = (patientSurvival >= survivalMin) && (patientSurvival <= survivalMax);
         if(survivalInRange)
            return true;
         return false;
        }); // anonymous function
      } // push


} // setupSliderDrivenFilterBehavior
//----------------------------------------------------------------------------------------------------
function createAgeAtDiagnosisWidget(minValue, maxValue)
{
  ageAtDxSlider = $("#ageAtDxSlider");
  ageAtDxMinReadout = $("#ageAtDxMinSliderReadout");
  ageAtDxMaxReadout = $("#ageAtDxMaxSliderReadout");

  ageAtDxSlider.slider({
     range: true,
     slide: function(event, ui) {
        //console.log("AgeDx: " + ui.values[0] + ", " + ui.values[1]);
        if(ui.values[0] > ui.values[1]){
           return false;
           }          
       ageAtDxMinReadout.text (ui.values[0]);
       ageAtDxMaxReadout.text (ui.values[1]);
       patientHistoryTableRef.draw();
       handleWindowResize();
       //updateRowCountReadout();
       },
    min: minValue,
    max: maxValue,
    values: [minValue, maxValue]
    });

  ageAtDxMinReadout.text(minValue);
  ageAtDxMaxReadout.text(maxValue);

} // createAgeAtDiagnosisWidget
//----------------------------------------------------------------------------------------------------
function createSurvivalWidget(minValue, maxValue)
{
  survivalSlider = $("#survivalSlider");
  survivalMinReadout = $("#survivalMinSliderReadout");
  survivalMaxReadout = $("#survivalMaxSliderReadout");
  console.log("createSurvivalWidget");

  survivalSlider.slider({
     range: true,
     slide: function(event, ui) {
        //console.log("survival: " + ui.values[0] + ", " + ui.values[1]);
        if(ui.values[0] > ui.values[1]){
           return false;
           }          
       survivalMinReadout.text (ui.values[0]);
       survivalMaxReadout.text (ui.values[1]);
       patientHistoryTableRef.draw();
       handleWindowResize();
       },
    min: minValue,
    max: maxValue,
    values: [minValue, maxValue]
    });

  survivalMinReadout.text(minValue);
  survivalMaxReadout.text(maxValue);

} // createSurvivalWidget
//----------------------------------------------------------------------------------------------------
// when the patient history table arrives, the filtering sliders can be setup, using the 
// min and max values of selected columns.  our sliders are currently ageAtDx and survival.
// the column numbers for these are specified by the caller.  missing values are not
// troublesome to Javascript's min and max functions.  note the use of floor and ceil,
// to nudge min and max values out a bit.
function learnSliderMinAndMax(tbl, columnNumber)
{
  var rowCount = tbl.length;
  var min = Number.MAX_VALUE;
  var max = -Number.MAX_VALUE;

  for(var r=0; r < rowCount; r++){
    var value = parseFloat(tbl[r][columnNumber]);
    //console.log(value)
    if(value < min)
      min = value;
    if(value > max)
      max = value;
    } // for r

  return[Math.floor(min), Math.ceil(max)];

} // learnSliderMinAndMax
//----------------------------------------------------------------------------------------------------
function showAllRows()
{
   if(typeof(ageAtDxMin)  != "undefined" &&
      typeof(ageAtDxMax)  != "undefined" &&
      typeof(survivalMin) != "undefined" &&
      typeof(survivalMax) != "undefined") {

        ageAtDxSlider.slider("values", [ageAtDxMin, ageAtDxMax]);
        survivalSlider.slider("values", [survivalMin, survivalMax]);
        ageAtDxMinReadout.text(ageAtDxMin);
        ageAtDxMaxReadout.text(ageAtDxMax);
        survivalMinReadout.text(survivalMin);
        survivalMaxReadout.text(survivalMax);
        } // all 4 min/max slider values defined

    // chained calls: clear the DataTable search box, then iterate through the columns, then render

   if(typeof(patientHistoryTableRef) != "undefined")
       patientHistoryTableRef.search('').columns().search('').draw();

   handleWindowResize();

} // showAllRows
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{

  patientHistoryDiv.width($(window).width() * 0.95);
  patientHistoryDiv.height($(window).height() * 0.90);  // leave room for tabs above

  //controlsDiv.width($(window).width() * 0.90);
  controlsDiv.width(patientHistoryDiv.width()); //  * 0.95);
  controlsDiv.height("100px");

  tableDiv.width(patientHistoryDiv.width()); //  * 0.95);
  tableDiv.height(patientHistoryDiv.height() - 130);

} // handleWindowResize
//--------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();

   var visibleRows = patientHistoryTableRef.rows({'filter': 'applied'})[0];
   if(visibleRows.length === 0)
      return;

   var selectedIDs = [];

   var data = patientHistoryTableRef.data();

   for(var i=0; i < visibleRows.length; i++){
      var id = data[visibleRows[i]][0];
      selectedIDs.push(id);
      } // for i

   var cmd = "sendSelectionTo_" + destination;

   payload = {value: selectedIDs, count: selectedIDs.length, source: "patient history module"};
   var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

   sendSelectionsMenu.val(sendSelectionsMenuTitle);

   hub.send(JSON.stringify(newMsg));

} // sendSelections
//--------------------------------------------------------------------------------------------
function handleSelections(msg)
{
   showAllRows();
   var ids = msg.payload.value;
   if(typeof(ids) == "string")
      ids = [ids];

      // incoming ids may have trailing version number, e.g., "TCGA.02.0114.01"
      // strip all such 2-digit suffixes:

   ids = ids.map(function(id) {return(id.replace(/\.0[0-9]$/, ""))})
   filterByString(ids);
   hub.raiseTab(thisModulesOutermostDiv);

} // handleSelections
//----------------------------------------------------------------------------------------------------
filterByString = function(strings)
{
   var filterString = strings[0];
   for(var i=1; i < strings.length; i++){
     filterString += "|" + strings[i];
     }

   showAllRows();
   console.log(filterString);

   if(typeof(patientHistoryTableRef) != "undefined")
      patientHistoryTableRef.search(filterString, true, false).draw();   // string, regex, smart

}; // filterByString
//----------------------------------------------------------------------------------------------------
function displayPatientHistoryTable(msg)
{
   var payload = msg.payload;
   var colnames = payload.colnames;
   var data = payload.tbl; // an array of arrays

   console.log("incoming table, rows: " + data.length);
   console.log("incoming table, cols: " + data[0].length);
   createDataTable(colnames, data);
   postStatus("patientHistory data table loaded");
   hub.enableTab(thisModulesOutermostDiv)

}  // displayPatientHistoryTable
//----------------------------------------------------------------------------------------------------
function postStatus(msg)
{
  statusDiv.text(msg);

} // postStatus
//----------------------------------------------------------------------------------------------------
// called when the a dataset has been specified, typically via the Datasets tab, which presents
// the user with a list of the datasets they are able to use, from which they choose one at a time
// as their current working dataset.
// this module uses the dataset name to request the patient history table from the server
function datasetSpecified (msg)
{
   var datasetName = msg.payload;

     // request patient data table
   var payload = {datasetName: datasetName, durationFormat: "byYear"};
   var newMsg = {cmd: "getPatientHistoryTable",  callback: "displayPatientHistoryTable", 
                 status: "request", payload: payload};

   hub.send(JSON.stringify(newMsg));

} // datasetSpecified
//----------------------------------------------------------------------------------------------------
// for standalone exploration, development, and testing.   assumes a hub has been
// created and initialized.  set the dataset, and in the callback load the table
// thus 
//   specifyCurrentDataSet -> getPatientHistoryTable -> displayPatientHistoryTable
//
function testLoad()
{
   var msg = {cmd: "specifyCurrentDataset",  callback: "datasetSpecified", 
              status: "request", payload: "TCGAgbm"};

   hub.send(JSON.stringify(msg));

} // test
//----------------------------------------------------------------------------------------------------
function testSelect()
{
   var msg={cmd: "sendSelectionTo_patientHistory", status: "request", callback: "", 
            payload:["TCGA.02.0011", "TCGA.06.0238"]};

   hub.send(JSON.stringify(msg));

} // testSelect
//----------------------------------------------------------------------------------------------------
return{
   init: function(){
      hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
      hub.addOnDocumentReadyFunction(initializeUI);
      hub.addMessageHandler("sendSelectionTo_patientHistory", handleSelections);
      hub.addMessageHandler("datasetSpecified", datasetSpecified);
      hub.addMessageHandler("displayPatientHistoryTable", displayPatientHistoryTable);
      //hub.addSocketConnectedFunction(testLoad);
      //hub.setTitle("patientHistory");
      },
   testSelect: testSelect,
   testLoad:   testLoad
   }; // PatientHistoryModule return value

//----------------------------------------------------------------------------------------------------
}); // PatientHistoryModule
pts = PatientHistoryModule();
pts.init();

