//----------------------------------------------------------------------------------------------------
var UserDataStoreModule = (function () {

  var userID;

  var userDataStoreDiv;
  var controlsDiv;

  var tableDiv;
  var tableElement;
  var tableRef;

  var viewItemButton;
  var editItemButton;
  var deleteItemButton;
  var editNewDataDiv;

  var newDataNameInput;
  var newDataTagsInput;

  var cancelNewDataButton;
  var saveNewDataButton;
  var rawDisplayTextArea; // show some of the incoming ids to be saved, to give user context

  var thisModulesName = "userDataStore";
  var thisModulesOutermostDiv = "userDataStoreDiv";
  var selectionDestinationsOfferedHere = ["userDataStore"];

  var sendSelectionsMenu;
  var sendSelectionsMenuTitle = "Send selection...";
 
  var newlyArrivedSelection;
  var currentlySelectedDataStoreItem = null;

//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  userDataStoreDiv = $("#userDataStoreDiv");
  controlsDiv = $("#userDataStoreControlsDiv");
  tableDiv = $("#userDataStoreTableDiv");
  tableElement = $("#userDataStoreTable");
  
  viewItemButton = $("#userDataStoreViewButton");
  editItemButton = $("#userDataStoreEditButton");
  deleteItemButton = $("#userDataStoreDeleteButton");

  viewItemButton.button();
  editItemButton.button();
  deleteItemButton.button();

  deleteItemButton.click(deleteItem);

  newDataNameInput = $("#userDataNewItemNameInput");
  newDataNameInput.keyup(nameInputKeyUpHandler);
  newDataTagsInput = $("#userDataNewItemTagsInput");

  saveNewDataButton = $("#userDataStoreEditSaveButton");
  cancelNewDataButton = $("#userDataStoreEditCancelButton");

  saveNewDataButton.button();
  saveNewDataButton.click(saveNewDataItem);
  hub.disableButton(saveNewDataButton);

  cancelNewDataButton.button();
  cancelNewDataButton.click(cancelNewDataEdit);

  sendSelectionsMenu = hub.configureSendSelectionMenu("#userDataStoreSendSelectionsMenu", 
                                                      [thisModulesName], sendSelections,
                                                      sendSelectionsMenuTitle);
  editNewDataDiv = $("#userDataStoreEditDiv");
  editNewDataDiv.css({display: "none"});

  rawDisplayTextArea = $("#userDataNewSelectionRawDisplayTextArea");

  disableButtonsWhichOperateOnSelectedRow();

  handleWindowResize();

} // initializeUI
//----------------------------------------------------------------------------------------------------
function disableButtonsWhichOperateOnSelectedRow()
{
  hub.disableButton(viewItemButton);
  hub.disableButton(editItemButton);
  hub.disableButton(deleteItemButton);
  hub.disableButton(sendSelectionsMenu);

} // disableButtonsWhichOperateOnSelectedRow
//----------------------------------------------------------------------------------------------------
function getUserId()
{
  cmd = "getUserId";
  callback = "userIdReceived";
  payload = "";

  msg = {"cmd": cmd, "status": "request", "callback": callback, "payload": payload};

  hub.send(JSON.stringify(msg));

} // getUserId
//----------------------------------------------------------------------------------------------------
function userIdReceived(msg)
{
  userID = msg.payload;
  initializeUserDataStore();

} // userIdReceived
//----------------------------------------------------------------------------------------------------
function initializeUserDataStore()
{
  cmd = "initUserDataStore";
  callback = "userDataStoreInitialized";
  payload = {"userID":     userID,
             "userGroups": ["public", "test"]};

  msg = {"cmd": cmd, "status": "request", "callback": callback, "payload": payload};

  hub.send(JSON.stringify(msg));

} // initializeUserDataStore
//----------------------------------------------------------------------------------------------------
function userDataStoreInitialized(msg)
{
  getAndDisplayDataStoreSummary();

} // userDataStoreInitialized
//----------------------------------------------------------------------------------------------------
function userDataStoreDataAdded(msg)
{
  getAndDisplayDataStoreSummary();

} // userDataStoreDataAdded
//----------------------------------------------------------------------------------------------------
function deleteItem()
{
  cmd = "userDataStoreDeleteDataItem";
  callback = "userDataStoreItemDeleted";

  payload = {"userID": userID,
             "userGroups": ["public", "test"],
             "dataItemName": currentlySelectedDataStoreItem.file};

  msg = {"cmd": cmd, "status": "request", "callback": callback, "payload": payload};

  hub.send(JSON.stringify(msg));

} // deleteItem
//----------------------------------------------------------------------------------------------------
function itemDeleted(msg)
{
  getAndDisplayDataStoreSummary();

} // itemDeleted
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  var ww = $(window).width();
  var wh = $(window).height();

  userDataStoreDiv.width(ww * 0.95);
  userDataStoreDiv.height(wh * 0.90);

  controlsDiv.width(ww * 0.95);
  var controlsDivHeight = 30;
  controlsDiv.height(controlsDivHeight);

  tableDiv.width(ww * 0.95);
  var tableDivHeight = (wh * 0.90) - (controlsDivHeight * 1.5);  
  tableDiv.height(tableDivHeight);

  $("#userDataStoreTable_wrapper").width(ww * 0.95);

  if(typeof(tableRef) == "object"){
     tableRef.draw();
     } 

} // handleWindowResize
//--------------------------------------------------------------------------------------------
// use the destination (specified in the current value of the sendSelections menu)
// to forge a json cmd:  this will be the callback.
// use the module global variable 'currentlySelectedDataStoreItem.file' to
// ask the server for the data thereby identified
// the callback will be called, and the destination module receives the variable
// with dataItemID
function sendSelections(event)
{
   var destination = sendSelectionsMenu.val();
   sendSelectionsMenu.val("Send selection...");
   datasetID = currentlySelectedDataStoreItem.file;

   cmd = "userDataStoreGetDataItem";
   callback = "sendSelectionTo_" + destination;

   payload = {"userID":     userID,
              "userGroups": ["public", "test"],
              "dataItemName": datasetID};

   msg = {"cmd": cmd, "status": "request", "callback": callback, "payload": payload};
   hub.send(JSON.stringify(msg));

} // sendSelections
//--------------------------------------------------------------------------------------------
function cancelNewDataEdit()
{
  editNewDataDiv.css({display: "none"});

} // cancelNewDataEdit
//--------------------------------------------------------------------------------------------
function nameInputKeyUpHandler(event)
{
   var currentContents = newDataNameInput.val();

   if(currentContents.length < 5)
      hub.disableButton(saveNewDataButton);
   else
      hub.enableButton(saveNewDataButton);

}  // nameInputKeyUpHandler
//--------------------------------------------------------------------------------------------
function saveNewDataItem()
{
  var itemName = newDataNameInput.val();
  var itemTags = newDataTagsInput.val();

  cmd = "userDataStoreAddData";
  callback = "userDataStoreDataAdded";

  payload = {"userID": userID,
             "userGroups": ["public", "test"],
             "dataItem": newlyArrivedSelection,
             "name": itemName,
             "group":  "public",
             "permissions": 444,
             "tags": itemTags};

  msg = {"cmd": cmd, "status": "request", "callback": callback, "payload": payload};
  hub.send(JSON.stringify(msg));

  editNewDataDiv.css({display: "none"});

} // cancelNewDataEdit
//--------------------------------------------------------------------------------------------
function saveNewDataEdit()
{
  var newTabs = editNewDataTagsInput;
  //var name = editNewDataNameInput

} // saveNewDataEdit
//--------------------------------------------------------------------------------------------
function displayUserDataStoreSummary(msg)
{
   var payload = msg.payload;
   var tblColumnNames = payload.colnames;

   var columnTitles = [];

   for(var i=0; i < tblColumnNames.length; i++){
      columnTitles.push({sTitle: tblColumnNames[i]});
      }
     
   var tbl = payload.tbl;
   var minMax;

   if(typeof(tableRef) != "undefined"){
      tableRef.destroy();
      tableElement.empty();
      }

   $(tableElement).ready(function() {
      tableRef = tableElement.DataTable({
         sDom: '<"top"f>t',
         aoColumns: columnTitles,
         scrollCollapse: true,
         bPaginate: false,
         bFilter: false, 
         bSort: false,
         bInfo: false,
         paging: false,
         jQueryUI: true
         }); // dataTable

     tableRef.rows.add(tbl).draw();

     $('#userDataStoreTable tbody').on( 'click', 'tr', function (){ 
         var filename = $('td', this).eq(0).text();
         var itemName = $('td', this).eq(1).text();
         if($(this).hasClass("selected")){
           $(this).removeClass('selected');
           currentlySelectedDataStoreItem = null;
           hub.disableButton(viewItemButton);
           hub.disableButton(editItemButton);
           hub.disableButton(deleteItemButton);
           hub.disableButton(sendSelectionsMenu);
           }
        else{
           tableRef.$('tr.selected').removeClass('selected');
           $(this).addClass('selected');
            currentlySelectedDataStoreItem = {file: filename, item: itemName};
            hub.enableButton(deleteItemButton);
            hub.enableButton(sendSelectionsMenu);
            }
         });
      disableButtonsWhichOperateOnSelectedRow();
      handleWindowResize();
      });

} // displayUserDataStoreSummary
//----------------------------------------------------------------------------------------------------
function handleIncomingSelection(msg)
{
   hub.raiseTab(thisModulesOutermostDiv);
   annotateAndSaveNewSelection(msg);

} // handleIncomingSelection
//----------------------------------------------------------------------------------------------------
function annotateAndSaveNewSelection(msg)
{
   editNewDataDiv.css({display: "block"});

     // TODO: good place to experiment with handling ill-formed payload

   newlyArrivedSelection = msg.payload.value;   // crucial module global variable
   var source = msg.payload.source;

   var selectionForDisplay = JSON.stringify(msg.payload.value);

   var maxChars = 300;

   if(selectionForDisplay.length > maxChars){
      selectionForDisplay = selectionForDisplay.substring(1, maxChars);
      selectionForDisplay = selectionForDisplay + " ...";
      }

   rawDisplayTextArea.text("selection coming in from " + source + ": " + selectionForDisplay);

} // annotateAndSaveNewSelection
//----------------------------------------------------------------------------------------------------
// for standalone exploration, development, and testing.   assumes a hub has been created and 
// initialized.  send a request to the Onco server with a callback to display a summary of 
// the user's save data
function testLoad()
{
   getAndDisplayDataStoreSummary();

} // testLoad
//----------------------------------------------------------------------------------------------------
// call this whenever a fresh summary table is needed
function getAndDisplayDataStoreSummary()
{
   cmd = "getUserDataStoreSummary";
   callback = "displayUserDataStoreSummary";

   payload = {userID: userID,
              userGroups: ["public", "test"]};

   msg = {cmd: cmd, status:"request", callback:callback, payload:payload};

   hub.send(JSON.stringify(msg));

} // getAndDisplayDataStoreSummary
//----------------------------------------------------------------------------------------------------
// for standalone exploration, development, and testing.   assumes a hub has been created and 
// initialized.  send a request to the Onco server with a callback to display a summary of 
// the user's save data
function testAddSelection()
{
   var selectedIDs = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028", "TCGA.02.0033"];
   var cmd = "sendSelectionTo_" + "userDataStore";
   var payload = {value: selectedIDs, count: selectedIDs.length, source: "userDataSets"};

   var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};
   hub.send(JSON.stringify(newMsg));

} // testAddSelection
//----------------------------------------------------------------------------------------------------
return{
   init: function(){
      hub.addOnDocumentReadyFunction(initializeUI);
      hub.registerSelectionDestination(selectionDestinationsOfferedHere, thisModulesOutermostDiv);
      hub.addMessageHandler("displayUserDataStoreSummary", displayUserDataStoreSummary);
      hub.addMessageHandler("sendSelectionTo_userDataStore", handleIncomingSelection);
      hub.addMessageHandler("userDataStoreInitialized", userDataStoreInitialized);
      hub.addMessageHandler("userDataStoreDataAdded", userDataStoreDataAdded);
      hub.addMessageHandler("userDataStoreItemDeleted", itemDeleted);
      hub.addMessageHandler("userIdReceived", userIdReceived);
      hub.addSocketConnectedFunction(getUserId);
      },
   testLoad: testLoad,
   testAddSelection: testAddSelection
   }; // UserDataStoreModule return value

//----------------------------------------------------------------------------------------------------
}); // UserDataStoreModule

uds = UserDataStoreModule();
uds.init();

// during testing only!
//hub.addSocketConnectedFunction(userDataStoreModule.testLoad);
//if(typeof(patientHistoryModule) != "undefined")
//   hub.addSocketConnectedFunction(patientHistoryModule.test;)