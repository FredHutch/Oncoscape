//----------------------------------------------------------------------------------------------------
var DataSummaryModule = (function () {

  var dataSummaryDiv;

  var outputDiv;
  var dataSetNamesOutputDiv;
  var thisModulesName = "Datasets";
  var thisModulesOutermostDiv = "datasetsDiv";

  var tableElement;
  var tableRef;
  var datasetMenu;
  var selectedDataset;
  var useThisDatasetButton;

  var sendSelectionsMenu;
  var sendSelectionsMenuTitle = "Send selection...";
  var passwordProtected = false;

//----------------------------------------------------------------------------------------------------
function initializeUI()
{
  sendSelectionsMenu = hub.configureSendSelectionMenu("#datasetsSendSelectionsMenu", 
                                                      [thisModulesName], sendSelections,
                                                       sendSelectionsMenuTitle);

  hub.disableButton(sendSelectionsMenu);

  $(window).resize(handleWindowResize);
  datasetMenu = $("#datasetMenu");
  datasetMenu.change(selectManifest);

  dataSetNamesOutputDiv = $("#dataSetNamesOutputDiv");
  dataSummaryDiv = $("#dataSummaryOutputDiv");

  useThisDatasetButton = $("#selectDatasetButton");
  useThisDatasetButton.button();
  hub.disableButton(useThisDatasetButton);
  useThisDatasetButton.click(specifyCurrentDataset);

  outputDiv = $("#dataSummaryOutputDiv");
  tableElement = $("#datasetsManifestTable");
      
    // if no login tab is present, then allow unrestricted choice of datasets.
    // if it IS present, then that tab will control this.

  var loginRequired = $("#loginDiv").length === 1;
  console.log("loginRequired? " + loginRequired);

  if(!loginRequired){
    console.log(" enabling datasetMenu");
    hub.enableButton($("#datasetMenu"));
    }
  else{
    console.log(" disabling datasetMenu");
    hub.disableButton($("#datasetMenu"));
    }

   if(hub.socketConnected())
      populateDatasetMenu();
   else
     hub.addSocketConnectedFunction(populateDatasetMenu);

} // initializeUI
//----------------------------------------------------------------------------------------------------
function postStatus(msg)
{
   $("#datasetsStatusDiv").text(msg);   // todo: this is obsolete
   $("#datasetsMinorStatusDiv").text(msg);
   
} // postStatus
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  $("#"+thisModulesOutermostDiv).width($(window).width() * 0.95);
//  $("#"+thisModulesOutermostDiv).height($(window).height() * 0.95);

//  console.log("  div: " + outputDiv.width());
//  console.log("  tbl before: " + tableElement.width());
//  tableElement.width($(window).width() * 0.50);
//  console.log("  tbl after: " + tableElement.width());

} // handleWindowResize
//----------------------------------------------------------------------------------------------------
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();
   console.log("send selections to " + destination);
   sendSelectionsMenu.val(sendSelectionsMenuTitle);

   var cmd = "sendSelectionTo_" + destination;
   payload = "dummy payload";
   var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

   sendSelectionsMenu.val(sendSelectionsMenuTitle);

   hub.send(JSON.stringify(newMsg));

} // sendSelections
//----------------------------------------------------------------------------------------------------
function selectManifest(event)
{
   selectedDataset = datasetMenu.val();
   console.log("dataset '" + selectedDataset + "'");

   if(selectedDataset === ""){
      $("#datasetInstructions").css("display", "block");
      $("#datasetsManifestTable").css("display", "none");
      hub.disableButton(useThisDatasetButton);
      }
    else{
      $("#datasetInstructions").css("display", "none");
      $("#datasetsManifestTable").css("display", "block");
      requestDatasetSummary(selectedDataset);
    }

} // selectManifest
//----------------------------------------------------------------------------------------------------
function populateDatasetMenu()
{
   console.log("Module.datasets, entering populateDatasetMenu");

   console.log("      socket connected? " + hub.socketConnected());
   console.log("=== datasetMenu ready, now issuing populateDatasetMenu request to server");
   var msg = {cmd: "getDatasetNames",  callback: "handleDatasetNames", status: "request", payload: ""};
   hub.send(JSON.stringify(msg));

} // populateDatasetMenu
//----------------------------------------------------------------------------------------------------
function handleDatasetNames(msg)
{
   console.log("=== handleDatasetNames");
   
   var dataSetNames = msg.payload.datasets;
   console.log("dataSetNames length: " + dataSetNames.length);
   console.log("dataSetNames: " + JSON.stringify(dataSetNames));

   var passwordProtected = msg.payload.passwordProtected;

   if(!Array.isArray(dataSetNames))
      dataSetNames = [dataSetNames];

   for(var i=0; i < dataSetNames.length; i++){
      var s = dataSetNames[i];
      datasetMenu.append("<option value='" + s + "'>" + s + "</option>");
      }

  $("#datasetsMinorStatusDiv").text("datasetMenu loaded");

} // handleDatasetNames
//----------------------------------------------------------------------------------------------------
function requestDatasetSummary(dataSetName)
{
   console.log("=== requestDatasetSummary");

   var msg = {cmd: "getDataManifest",  callback: "displayDataManifest", status: "request", 
              payload: dataSetName};
   hub.logEventOnServer(thisModulesName, "datasets requestDataSummary", "request", dataSetName);

   hub.send(JSON.stringify(msg));

} // requestDatasetSummary
//----------------------------------------------------------------------------------------------------
function displayDataManifest(msg)
{
   var payload = msg.payload;
   var tblColumnNames = payload.colnames;

   var columnTitles = [];
     // convert simple strings to array of objects, each an sTitle
   for(var i=0; i < tblColumnNames.length; i++){
      columnTitles.push({sTitle: tblColumnNames[i]});
      }
     
   if(typeof(tableRef) != "undefined"){
      tableRef.destroy();
      tableElement.empty();
      }


   $(tableElement).ready(function() {
      tableRef = tableElement.DataTable({
        //sDom: 't',
        aoColumns: columnTitles,
        //scrollX: true,
        bPaginate: false,
        bFilter: false, 
        bAutoWidth: true,
        bSort: false,
        bInfo: false
        }); // dataTable

     tableRef = $("#datasetsManifestTable").DataTable();

     tableRef.rows.add(payload.mtx).draw();
     // tableRef.fnAddData(payload.mtx);

     $('#datasetsManifestTable tbody').on( 'click', 'tr', function (){ 
         console.log("=== click");
         var category = $('td', this).eq(0).text();
         var subcategory = $('td', this).eq(1).text();
         if($(this).hasClass("selected")){
            $(this).removeClass('selected');
            hub.disableButton(sendSelectionsMenu);
            }
         else{
            tableRef.$('tr.selected').removeClass('selected');
            $(this).addClass('selected');
            hub.enableButton(sendSelectionsMenu);
            console.log("selected " + category + ", " + subcategory);
            }
         });

     handleWindowResize();
     hub.enableButton(useThisDatasetButton);
     postStatus("manifest table displayed");
     hub.logEventOnServer(thisModulesName, "datasets requestDataSummary", "complete", "");
     }); // tableElement.ready

} // displayDataManifest
//----------------------------------------------------------------------------------------------------
function specifyCurrentDataset()
{
   console.log("Module.datasets 'Use Dataset' button clicked, specifyCurrentDataset: " + selectedDataset);
 
   hub.disableAllTabsExcept([thisModulesOutermostDiv, "userDataStoreDiv"]);
   $("#loadingDatasetMessage").css("display", "inline");
	
   var msg = {cmd: "specifyCurrentDataset",  callback: "datasetSpecified", 
              status: "request", payload: selectedDataset};

   hub.send(JSON.stringify(msg));

} // specifyCurrentDataset
//----------------------------------------------------------------------------------------------------
function datasetSpecified(msg)
{
   $("#loadingDatasetMessage").css("display", "none");
   console.log("--- Module.datasets:  datasetSpecified");

} // datasetSpecified
//----------------------------------------------------------------------------------------------------
function test(dataSetName)
{
   console.log("Module.datasets test, on datasetName: '" + dataSetName + "'");

   QUnit.test("choose dataset '" + dataSetName + "'", function(assert) {
      hub.raiseTab("datasetsDiv");
      var desiredDataset = dataSetName;
      var dzNames = $("#datasetMenu option").map(function(opt){return this.value;});

      if($.inArray(desiredDataset, dzNames) < 0){
         alert("cannot run tests:  " + desiredDataset + " dataset not loaded");
         return;
         }

      $("#datasetMenu").val(desiredDataset);
      $("#datasetMenu").trigger("change");

      var done1 = assert.async();
      var done2 = assert.async();
      var done3 = assert.async();
      assert.expect(3);

      setTimeout(function(){
         assert.equal($("#datasetMenu").val(), desiredDataset);  done1();
         assert.ok($("#datasetsManifestTable tr").length >= 10); done2();
         assert.equal($("#datasetsManifestTable tbody tr").eq(0).find("td").eq(0).text(), 
                      "mRNA expression"); done3();
         //testLoadPatientHistoryTable();
         }, 5000);
      });


} // test
//----------------------------------------------------------------------------------------------------
function moduleInit()
{
  hub.addOnDocumentReadyFunction(initializeUI);
  //hub.addSocketConnectedFunction(populateDatasetMenu);
  hub.addMessageHandler("handleDatasetNames", handleDatasetNames);
  hub.addMessageHandler("displayDataManifest", displayDataManifest);
  hub.addMessageHandler("datasetSpecified", datasetSpecified);

} // moduleInit
//----------------------------------------------------------------------------------------------------
return{
   init: moduleInit,
   test: test
   }; // DataSummaryModule return value

//----------------------------------------------------------------------------------------------------
}); // DataSummaryModule

var dataSummaryModule = DataSummaryModule();
dataSummaryModule.init();
hub.registerModule("Datasets", dataSummaryModule);
