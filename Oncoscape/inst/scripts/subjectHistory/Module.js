//----------------------------------------------------------------------------------------------------
var subjectHistoryTableRef;



var SubjectHistoryModule = (function () {

  var ageAtDxMinReadout;
  var ageAtDxMaxReadout;
  var survivalMinReadout, survivalMaxReadout;
  
  var ageAtDxMin, ageAtDxMax;
  var ageAtDxSlider, survivalSlider;
  var survivalMin, survivalMax;

  var statusDiv;
  var subjectHistoryDiv;
  var controlsDiv;
  var tableDiv;
  var tableElement;
  var sendSelectionsMenu;

  var thisModulesName = "subjectHistory";
  var thisModulesOutermostDiv = "subjectHistoryDiv";
  var selectionDestinations = [thisModulesName];

  var sendSelectionsMenuTitle = "Send selection...";
  var showAllRowsButton;
  
//--------------------------------------------------------------------------------------------
function initializeUI()
{
  console.log("=== Module.subjectHistory, initializeUID");

  $(window).resize(handleWindowResize);

  statusDiv = $("#subjectHistoryStatusDiv");

  subjectHistoryDiv = $("#subjectHistoryDiv");
  controlsDiv = $("#subjectHistoryControlsDiv");
  tableDiv = $("#subjectHistoryTableDiv");
  tableElement = $("#subjectHistoryTable");

  showAllRowsButton = $("#subjectHistoryShowAllRowsButton");
  showAllRowsButton.click(showAllRows);

  sendSelectionsMenu = hub.configureSendSelectionMenu("#subjectHistorySendSelectionsMenu", 
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

   if(typeof(subjectHistoryTableRef) != "undefined"){
      subjectHistoryTableRef.destroy();
      tableElement.empty();
      }

   subjectHistoryTableRef = tableElement.DataTable({
                             data: data,
                             columns: columnTitles,
                             //dom: "C<fi<t>>",
                             dom: 'iC<"clear">lfrtp',
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

         var subjectAgeAtDx  = parseFloat(data[ageDxColumn]) || 0;
 
         var ageAtDxInRange  = (subjectAgeAtDx >= ageAtDxMin) && (subjectAgeAtDx <= ageAtDxMax);
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

         var subjectSurvival  = parseFloat(data[survivalColumn]) || 0;
         var survivalInRange  = (subjectSurvival >= survivalMin) && (subjectSurvival <= survivalMax);
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
       subjectHistoryTableRef.draw();
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
       subjectHistoryTableRef.draw();
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
// when the subject history table arrives, the filtering sliders can be setup, using the 
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

   if(typeof(subjectHistoryTableRef) != "undefined")
       subjectHistoryTableRef.search('').columns().search('').draw();

   handleWindowResize();

} // showAllRows
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{

  subjectHistoryDiv.width($(window).width() * 0.95);
  subjectHistoryDiv.height($(window).height() * 0.90);  // leave room for tabs above

  //controlsDiv.width($(window).width() * 0.90);
  controlsDiv.width(subjectHistoryDiv.width()); //  * 0.95);
  controlsDiv.height("100px");

  tableDiv.width(subjectHistoryDiv.width()); //  * 0.95);
  tableDiv.height(subjectHistoryDiv.height() - 130);

} // handleWindowResize
//--------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();

   var visibleRows = subjectHistoryTableRef.rows({'filter': 'applied'})[0];
   if(visibleRows.length === 0)
      return;

   var selectedIDs = [];

   var data = subjectHistoryTableRef.data();

   for(var i=0; i < visibleRows.length; i++){
      var id = data[visibleRows[i]][0];
      selectedIDs.push(id);
      } // for i

   var cmd = "sendSelectionTo_" + destination;

   payload = {value: selectedIDs, count: selectedIDs.length, source: "subject history module"};
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

   if(typeof(subjectHistoryTableRef) != "undefined")
      subjectHistoryTableRef.search(filterString, true, false).draw();   // string, regex, smart

}; // filterByString
//----------------------------------------------------------------------------------------------------
function displaySubjectHistoryTable(msg)
{
   var payload = msg.payload;
   var colnames = payload.colnames;
   var data = payload.mtx; // an array of arrays

   console.log("incoming table, rows: " + data.length);
   console.log("incoming table, cols: " + data[0].length);
   createDataTable(colnames, data);
   postStatus("subjectHistory data table loaded");
   hub.enableTab(thisModulesOutermostDiv)

}  // displaySubjectHistoryTable
//----------------------------------------------------------------------------------------------------
function postStatus(msg)
{
  statusDiv.text(msg);

} // postStatus
//----------------------------------------------------------------------------------------------------
// called when the a dataset has been specified, typically via the Datasets tab, which presents
// the user with a list of the datasets they are able to use, from which they choose one at a time
// as their current working dataset.
// this module uses the dataset name to request the subject history table from the server
function datasetSpecified (msg)
{
   var datasetName = msg.payload;

     // request subject data table
   var payload = {datasetName: datasetName, durationFormat: "byYear"};
   var newMsg = {cmd: "getSubjectHistoryTable",  callback: "displaySubjectHistoryTable", 
                 status: "request", payload: payload};

   hub.send(JSON.stringify(newMsg));

} // datasetSpecified
//----------------------------------------------------------------------------------------------------
// for standalone exploration, development, and testing.   assumes a hub has been
// created and initialized.  set the dataset, and in the callback load the table
// thus 
//   specifyCurrentDataSet -> getSubjectHistoryTable -> displaySubjectHistoryTable
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
   var msg={cmd: "sendSelectionTo_subjectHistory", status: "request", callback: "", 
            payload:["TCGA.02.0011", "TCGA.06.0238"]};

   hub.send(JSON.stringify(msg));

} // testSelect
//----------------------------------------------------------------------------------------------------
return{
   init: function(){
      hub.registerSelectionDestination(selectionDestinations, thisModulesOutermostDiv);
      hub.addOnDocumentReadyFunction(initializeUI);
      hub.addMessageHandler("sendSelectionTo_subjectHistory", handleSelections);
      hub.addMessageHandler("datasetSpecified", datasetSpecified);
      hub.addMessageHandler("displaySubjectHistoryTable", displaySubjectHistoryTable);
      //hub.addSocketConnectedFunction(testLoad);
      //hub.setTitle("subjectHistory");
      },
   testSelect: testSelect,
   testLoad:   testLoad
   }; // SubjectHistoryModule return value

//----------------------------------------------------------------------------------------------------
}); // SubjectHistoryModule
sh = SubjectHistoryModule();
sh.init();

