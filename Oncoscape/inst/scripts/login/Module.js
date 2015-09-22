//----------------------------------------------------------------------------------------------------
var sendSelectionsMenu;

var LoginModule = (function () {

  var loginDiv;
  var loginButton;
  var passcodeInput;

  var testButton;

  var thisModulesName = "login";
  var thisModulesOutermostDiv = "loginDiv";

//--------------------------------------------------------------------------------------------
function initializeUI()
{
  $(window).resize(handleWindowResize);

  loginDiv = $("#loginDiv");

  passcodeInput = $("#passcodeInput");

  loginButton = $("#loginButton");
  loginButton.button();
  loginButton.click(checkPasscode);

  passcodeInput.keydown(function (e){
    var keyCode = e.keyCode || e.which;
    if (keyCode == 13) {
      loginButton.trigger("click");
      return false;
      } // cr
   });

  handleWindowResize();

} // initializeUI
//----------------------------------------------------------------------------------------------------
function checkPasscode()
{
  var candidateText = passcodeInput.val();
  console.log("checkPasscode: " + candidateText);

  msg = {cmd: "checkPassword", status: "request", callback: "inputTabHandlePasswordAssessment", 
         payload: candidateText};

  hub.send(JSON.stringify(msg));

} // checkPasscode
//----------------------------------------------------------------------------------------------------
function handleWindowResize()
{
  loginDiv.width($(window).width() * 0.95);
  loginDiv.height($(window).height() * 0.90);  // leave room for tabs above

} // handleWindowResize
//--------------------------------------------------------------------------------------------
function handlePasswordAssessment(msg)
{
   console.log("handlePasswordAssessment: " + JSON.stringify(msg));
   if(msg.status == "success"){
      console.log("successful login");
      hub.enableButton($("#datasetMenu"));
      //hub.restrictMessagingToLogin(false);
      //var datasetsInitiationMsg = {cmd: "getDataSetNames",  callback: "handleDataSetNames", status: "request", 
      //                             payload: ""};
      hub.raiseTab("datasetsDiv");
      hub.hideTab("Login", "#loginDiv");
      /*************
      hub.showTab("Datasets", "datasetsDiv");
      hub.showTab("User Data", "userDataStoreDiv");
      hub.showTab("Patient History", "patientHistoryDiv");
      hub.showTab("markersAndPatientsDiv", "Markers &amp; Patients");
      hub.showTab("survivalDiv", "Survival");
      hub.showTab("dgiDiv", "Drug Gene Interactions");
      *********/
      //hub.send(JSON.stringify(datasetsInitiationMsg));
      } // success
   else{
      alert(msg.payload);
      }

} // handlePasswordAssessment
//----------------------------------------------------------------------------------------------------
// with password-protected login, we ask the hub to drop all messages other than "checkPassword"
function restrictMessagingToLogin()
{
  hub.restrictMessagingToLogin(true);

} // restrictMessagingToLogin
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.addMessageHandler("inputTabHandlePasswordAssessment", handlePasswordAssessment);

} // initializeModule
//----------------------------------------------------------------------------------------------------
return{
   init: initializeModule
   }; // LoginModule return value

//----------------------------------------------------------------------------------------------------
}); // LoginModule

loginModule = LoginModule();
loginModule.init();

