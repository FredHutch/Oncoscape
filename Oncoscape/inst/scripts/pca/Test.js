// pca/Test.js
//------------------------------------------------------------------------------------------------------------------------

var pcaTestModule = (function () {

       // for observing relatively small scale status changes: i.e., network loaded and displayed
       // the div watched here is in widget.html

    var pcaStatusObserver = null;
    var testStatusObserver = null;   // modified at the end of each dataset test

    var minorStatusDiv = "#pcaStatusDiv";
    var majorStatusDiv = "#pcaTestStatusDiv";

    

       // to detect when the full test of a dataset is complete, so that the next dataset can be tested
       // the div watched here is in test.html


//------------------------------------------------------------------------------------------------------------------------
function runTests(datasetNames, reps, exitOnCompletion)
{
     // run through <reps> repetitions of the test
     // condition the next test upon the completion of the preceeding one,
     // which is detected by a change to the majorStatusDiv
     // minorStatusDiv is used to gate successive tests applied -within-
     // a dataset
     
      
   console.log("===================================== Test.pca: runTests");
   console.log("Test.pca: runTests: " + JSON.stringify(datasetNames));
   console.log("reps: " + reps);
   console.log("exitOnCompletion: " + exitOnCompletion);
   
   
   var datasetIndex = -1;

   var config = {attributes: true, childList: true, characterData: true};
   var target =  document.querySelector(majorStatusDiv);

      // define a function to be called whenever the testStatusDiv changes,
      // which is our signal that the next test is ready to run.
      // the first test is kicked off when we -- after setting up and
      // configuring the observer -- manually (see below: "start testing")
      // change the target which the observer watches.
      // there may be a better way, but for now we delete and recreate
      // the observer at the end of each test.
      // note also that the next dataset is determined inside this function
      // and that the function refers to itself.

   var onMutation = function(mutations){
      mutation = mutations[0];
      testStatusObserver.disconnect();
      testStatusObserver = null;
      var id = mutation.target.id;
      var msg = $(majorStatusDiv).text();
      console.log("test status changed, text: " + msg);
      datasetIndex++;
      if(datasetIndex < (datasetNames.length * reps)){
      //if(datasetIndex < (datasetNames.length)){
         console.log("about to test dataset " + datasetNames[datasetIndex]);      
         testStatusObserver = new MutationObserver(onMutation);
         testStatusObserver.observe(target, config);
         if(datasetIndex < (datasetNames.length * reps))
            testLoadDatasetPCA(datasetNames[datasetIndex % datasetNames.length]);
         }
      else{
         console.log("mutation observer function detected end of datasets");
         if(exitOnCompletion){
            var payload = {errorCount: Object.keys(sessionStorage).length,
                           errors: JSON.stringify(sessionStorage)};
            var exitMsg = {cmd: "exitAfterTesting", callback: "", status: "request", payload: payload};
            console.log("about to send exitAfterTesting msg to server");
            hub.send(JSON.stringify(exitMsg));
            } // if exitOnCompletion
         } // else: datasets exhaused
      };

   testStatusObserver = new MutationObserver(onMutation);
   testStatusObserver.observe(target, config);

   $(majorStatusDiv).text("start testing");

} // runTests
//------------------------------------------------------------------------------------------------------------------------
function testLoadDatasetPCA(dataSetName)
{
   var testTitle = "testLoadDatasetPCA";
   console.log(testTitle);
  
   if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        //hub.raiseTab("pcaDiv");
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#pcaStatusDiv").text();
        QUnit.test('choose dataset for pca: '+ dataSetName, function(assert) {
          hub.raiseTab("datasetsDiv");
          $("#datasetMenu").val(dataSetName);
          $("#datasetMenu").trigger("change");
          assert.equal($("#datasetMenu").val(), dataSetName);
          hub.raiseTab("pcaDiv");
          var genesetList = $("#pcaGeneSetSelector option").map(function(opt){return this.value;});
          testCalculate(genesetList);
        });
      }); // new MutationObserver
    } // if null mutation observer
    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dataSetName};
   console.log("about to send specifyCurrentDataset msg to server: " + dataSetName);
   hub.send(JSON.stringify(msg));

} // testLoadDataset
//----------------------------------------------------------------------------------------------------
function testCalculate(genesetList)
{
   hub.raiseTab("pcaDiv");
   console.log("starting testCalculate");
   
    if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        //hub.raiseTab("pcaDiv");
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#pcaStatusDiv").text();
        // enable the calculate button, change its color, then click
        var genesetLength = genesetList.length;
        console.log("******testCalculate - Current geneset length is:", genesetLength);
        genesetIndex = hub.getRandomInt(0, $("#pcaGeneSetSelector option").length - 1);
        geneset = genesetList[genesetIndex];
        QUnit.test('testPcaCalculate', function(assert){
          $("#pcaCalculateButton").prop("disabled", false);
          $("#pcaCalculateButton").css({"background-color": "red", "color": "green"});
          $("#pcaGeneSetSelector").val(geneset);
          assert.equal($("#pcaGeneSetSelector").val(), geneset);
          $("#pcaGeneSetSelector").trigger("change");
          // check if the "Calculate" is clicked
          $("#pcaCalculateButton").click(); 
          assert.equal($("#pcaCalculateButton").css('color'), "rgb(0, 128, 0)");
          testContentsOfPcaPlot();
        });  
      }); // new MutationObserver
    } // if null mutation observer    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);
   
   var currentGeneSet = $("#pcaGeneSetSelector").val();
   var payload = {genes: currentGeneSet, source: "pca/Test.js::testCalculate"};
   msg = {cmd: "calculatePCA", callback: "pcaPlot", status: "request", payload: payload};
   hub.send(JSON.stringify(msg));

} // testCalculate
//----------------------------------------------------------------------------------------------------
function testIterateGenesets(){
    console.log("--- testInterateGenesets");
    var genesetLength = $("#pcaGeneSetSelector option").length;
    console.log("******testInterateGenesets - Current geneset length is:", genesetLength);

    if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test('testInterateGenesets', function(assert) {
          for(var genesetIndex = 0; genesetIndex < genesetLength; genesetIndex++){
            document.getElementById("pcaGeneSetSelector").selectedIndex = genesetIndex;
            console.log("*****testCalculate within forLoop, current geneset is: ", $("#pcaGeneSetSelector").val());
            assertCalculate($("#pcaGeneSetSelector").val());
            assert.ok(genesetLength > 0);
            $("#pcaCalculateButton").click();
            testContentsOfPcaPlot();
            //markEndOfTestingDataSet();
          } 
        });  
     }); // new MutationObserver
    } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);    

} // testIterateGenesets - not being used
//----------------------------------------------------------------------------------------------------            
function testContentsOfPcaPlot()
{
   console.log("--- testContentsOfPcaPlot");
   if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test('testPcaContents', function(assert) { 
          assert.equal($("circle").length, g_pcaMsg.g_selectedIDs.length);
          circleIndex = hub.getRandomInt(0, g_pcaMsg.g_selectedIDs.length - 1);
          var cir_random = $("circle")[circleIndex];
          var xPos = Number(cir_random.getAttribute("cx"));
          var yPos =  Number(cir_random.getAttribute("cy"));
          var radius = Number(cir_random.getAttribute("r"));
          console.log("*****testContentsOfPcaPlot circleIndex:" + circleIndex + "coordinates" + xPos + "  " + yPos + "  " + radius);
          // get score for this circle, maybe check tooltip name too
          assert.equal(xPos, g_pcaMsg.xScale(g_pcaMsg.g_pcaScores[circleIndex][0]));
          assert.equal(yPos, g_pcaMsg.yScale(g_pcaMsg.g_pcaScores[circleIndex][1]));
          assert.equal(radius, 3);
          testSendIDs(); 
        });
      }); // new MutationObserver
    } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   //var msg = {cmd: "specifyCurrentDataset", callback: "datasetSpecified", status: "request", payload:  dataSetName};
   //console.log("about to send specifyCurrentDataset msg to server: " + dataSetName);
   //hub.send(JSON.stringify(msg));

} // testContentsOfPcaPlot
//----------------------------------------------------------------------------------------------------
function testSendIDs() {
   console.log("entering Test.pca:testSendGoodIDs");

   var title = "testSendIDs";
   console.log(title);
      // first test is to clear any existing selection, then send 10 node
      // ids (simple name strings) taken from the network itself.
      // these nodes are sent to the network using hub.send
      // we then check to see that these 10 nodes are selected in cyjs
   //var ids = g_pcaMsg.g_selectedIDs.splice(-1, 1);
   var ids;
   var maxNodes = 200;
   if(g_pcaMsg.g_selectedIDs.length <= maxNodes){
      ids = g_pcaMsg.g_selectedIDs.slice(0, g_pcaMsg.g_selectedIDs.length);
   }else{
      ids = g_pcaMsg.g_selectedIDs.slice(0, maxNodes);
   }
   console.log("*****testSendIDs number of ids to be sent: " + ids.length + "number of original global circles appeared: " + g_pcaMsg.g_selectedIDs.length);  
   if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        console.log("*****testSendIDs number of ids seen again : " + $("circle").length);
        QUnit.test(title, function(assert) {
           console.log("-- in QUnit.test for testSendIDs " + ids.length + "  statusMsg: " + statusMsg);
           assert.ok($("circle").length >= ids.length);
           testSendIDstoHighlight();
           //markEndOfTestingDataSet();
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   console.log("testSendIDs, sending " + JSON.stringify(ids));
   var payload = {value: ids, count: ids.length, source: "pca/Test.js::testSendIDs"};
   var msg = {cmd: "sendSelectionTo_PCA", callback: "", status: "request", payload:  payload};
   
   hub.send(JSON.stringify(msg));

} // testSendIDs
//----------------------------------------------------------------------------------------------------
function testSendIDstoHighlight() {
   console.log("entering Test.pca:testSendIDstoHighlight");

   var title = "testSendIDstoHighlight";
   console.log(title);
      // first test is to clear any existing selection, then send 10 node
      // ids (simple name strings) taken from the network itself.
      // these nodes are sent to the network using hub.send
      // we then check to see that these 10 nodes are selected in cyjs
   //var ids = g_pcaMsg.g_selectedIDs.splice(-1, 1);
   var ids = g_pcaMsg.g_selectedIDs;
   /*var maxNodes = 20;
   if(g_pcaMsg.g_selectedIDs.length <= maxNodes){
      ids = g_pcaMsg.g_selectedIDs.slice(0, g_pcaMsg.g_selectedIDs.length);
   }else{
      ids = g_pcaMsg.g_selectedIDs.slice(0, maxNodes);
   }*/ // sending all the IDs to highlight
   console.log("*****testSendIDstoHighlight number of ids to be sent: " + ids.length + "number of original global circles appeared: " + g_pcaMsg.g_selectedIDs.length);  
   if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        console.log("*****testSendIDstoHighlight number of ids seen again : " + $("circle").length);
        QUnit.test(title, function(assert) {
           console.log("-- in QUnit.test for testSendIDstoHighlight " + ids.length + "  statusMsg: " + statusMsg);
           circleIndex = hub.getRandomInt(0, ids.length - 1);
           var cir_random = $("circle")[circleIndex];
           var xPos = Number(cir_random.getAttribute("cx"));
           var yPos =  Number(cir_random.getAttribute("cy"));
           var radius = Number(cir_random.getAttribute("r"));
           console.log("*****testSendIDstoHighlight circleIndex:" + circleIndex + "coordinates" + xPos + "  " + yPos + "  " + radius);
           // get score for this circle, maybe check tooltip name too
           assert.equal(xPos, g_pcaMsg.xScale(g_pcaMsg.g_pcaScores[circleIndex][0]));
           assert.equal(yPos, g_pcaMsg.yScale(g_pcaMsg.g_pcaScores[circleIndex][1]));
           assert.equal(radius, 7);
           console.log("%%%%%%%%before markEndOfTestingDataSet");
           markEndOfTestingDataSet();
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   console.log("testSendIDstoHighlight, sending " + JSON.stringify(ids));
   var payload = {value: ids, count: ids.length, source: "pca/Test.js::testSendIDstoHighlight"};
   var msg = {cmd: "sendSelectionTo_PCA (highlight)", callback: "", status: "request", payload:  payload};
   
   hub.send(JSON.stringify(msg));

} // testSendIDstoHighlight
//----------------------------------------------------------------------------------------------------
function markEndOfTestingDataSet()
{
  console.log("end of testing dataset");
  $(majorStatusDiv).text("dataset complete");
  $("#testManagerLoopStatusDiv").text("Test.pca, datasets complete");
  
} // markEndOfTestingDataSet
//------------------------------------------------------------------------------------------------------------------------
function initialize()
{
   console.log("--- initializing pca/Test.js");

} // initialize
//------------------------------------------------------------------------------------------------------------------------
return{
   init: initialize,
   run: runTests
   }; // module return value

//------------------------------------------------------------------------------------------------------------------------
}); // pcaTestModule
pcaTester = pcaTestModule();
moduleTests.push(pcaTester);

