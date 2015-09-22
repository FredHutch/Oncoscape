<script>
//----------------------------------------------------------------------------------------------------
var UserDetailsModule = (function () {

   var userDetailsButton;
   var userNameDisplay;
   var datasetNamesDisplay;

//--------------------------------------------------------------------------------------------
function initializeUI(){

   userDetailsButton = $("#userDetailsButton");
   userDetailsButton.button()
   userDetailsButton.click(requestUserDetails);

   userNameDisplay = $("#userNameDiv");
   datasetNamesDisplay = $("#datasetNamesDiv");

}; // initializeUI
//----------------------------------------------------------------------------------------------------
function requestUserDetails()
{
   console.log("=== requestUserDetails");
   var msg = {cmd: "getUserInfo",  callback: "handleUserInfo", status: "request", payload: {}};
   socket.send(JSON.stringify(msg));

} // requestUserDetails
//----------------------------------------------------------------------------------------------------
function handleUserInfo(msg)
{
   console.log("=== handleUserInfo 532pm")
   var userName = msg.payload.userID;
   var datasetNames = msg.payload.datasets;

   console.log("===== fields: " + userName + ": " + datasetNames);

   userNameDisplay.text(userName);
   datasetNamesDisplay.text(datasetNames);

} // handleUserInfo
//----------------------------------------------------------------------------------------------------
return{
   init: function(){
      onReadyFunctions.push(initializeUI);
      addJavascriptMessageHandler("handleUserInfo", handleUserInfo);
      }

   } // UserDetailsModule return value

//----------------------------------------------------------------------------------------------------
}) // UserDetailsModule

userDetailsModule = UserDetailsModule();
userDetailsModule.init();

</script>

