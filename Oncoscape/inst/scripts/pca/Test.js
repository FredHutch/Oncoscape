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
   var genesetLength = genesetList.length;
   //console.log("******testCalculate - Current geneset length is:", genesetLength);
   genesetIndex = hub.getRandomInt(0, $("#pcaGeneSetSelector option").length - 1);
   geneset = genesetList[genesetIndex];     
  
   if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        //hub.raiseTab("pcaDiv");
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var msg = $("#pcaStatusDiv").text();
        // enable the calculate button, change its color, then click
        
        QUnit.test('testPcaCalculate', function(assert){
          pcaMsg = pca.ModuleMsg();
          console.log("*****testCalculate pcaMsg.geneSet ",pcaMsg.geneSet);
          console.log("*****testCalculate geneset: ",geneset);
          assert.equal(pcaMsg.geneSet, geneset);
          $("#pcaCalculateButton").prop("disabled", false);
          $("#pcaCalculateButton").css({"background-color": "red", "color": "green"});
          assert.equal($("#pcaCalculateButton").css('color'), "rgb(0, 128, 0)");
          //$("#pcaGeneSetSelector").val(geneset);
          //$("#pcaGeneSetSelector").trigger("change");
          // check if the "Calculate" is clicked
          $("#pcaDisplay").show();
          markEndOfTestingDataSet();
          //testContentsOfPcaPlot();
        });  
      }); // new MutationObserver
    } // if null mutation observer    
   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);
   console.log("*****t11");

   //var expressionDataSet = "mrna.mtx.ueArray";
   var payload = {genes: geneset, source: "pca/Test.js::testCalculate"};
   msg = {cmd: "calculatePCA", callback: "pcaPlot", status: "request", payload: payload};
   hub.send(JSON.stringify(msg));

} // testCalculate
//----------------------------------------------------------------------------------------------------
function testContentsOfPcaPlot()
{
   console.log("--- testContentsOfPcaPlot");
   var pcaMsg = pca.ModuleMsg();
    QUnit.test('testPcaContents', function(assert) { 
      assert.equal($("circle").length, pcaMsg.selectedIDs.length);
      var circleIndex = hub.getRandomInt(0, pcaMsg.selectedIDs.length - 1);
      var cir_random = $("circle")[circleIndex];
      var xPos = Number(cir_random.getAttribute("cx"));
      var yPos =  Number(cir_random.getAttribute("cy"));
      var radius = Number(cir_random.getAttribute("r"));
      //console.log("*****testContentsOfPcaPlot coordinates" + xPos + "  " + yPos + "  " + radius);
      // get score for this circle, maybe check tooltip name too
      assert.equal(xPos, pcaMsg.xScale(pcaMsg.pcaScores[circleIndex][0]));
      assert.equal(yPos, pcaMsg.yScale(pcaMsg.pcaScores[circleIndex][1]));
      assert.equal(radius, 3);
      testSendIDs(); 
   });

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
   //var ids = pcaMsg.selectedIDs.splice(-1, 1);
   var ids;
   var maxNodes = 200;
   var pcaMsg = pca.ModuleMsg();
   if(pcaMsg.selectedIDs.length <= maxNodes){
      ids = pcaMsg.selectedIDs.slice(0, pcaMsg.selectedIDs.length);
   }else{
      ids = pcaMsg.selectedIDs.slice(0, maxNodes);
   }
   if(pcaStatusObserver === null){
      pcaStatusObserver = new MutationObserver(function(mutations) {
        mutation = mutations[0];
        pcaStatusObserver.disconnect();
        pcaStatusObserver = null;
        var id = mutation.target.id;
        var statusMsg = $(minorStatusDiv).text();
        QUnit.test(title, function(assert) {
           pcaMsg = pca.ModuleMsg();
           console.log("-- in QUnit.test for testSendIDs " + ids.length + "  statusMsg: " + statusMsg);
           //TCGAgbm is using mtx.mrna.ueArray, sampleID duplicates: "TCGA.06.0145.01.1" "TCGA.06.0145.01.2" "TCGA.06.0145.01.3"
 													//"TCGA.06.0137.01.1" "TCGA.06.0137.01.2" "TCGA.06.0145.01.4"
 													//"TCGA.06.0137.01.3" "TCGA.06.0145.01.5" "TCGA.06.0138.01.1"
													//"TCGA.06.0156.01.1" "TCGA.06.0148.01.1" "TCGA.06.0148.01.2"
													//"TCGA.06.0211.01.1" "TCGA.06.0148.01.3" "TCGA.06.0176.01.1"
													//"TCGA.06.0154.01.1" "TCGA.06.0156.01.2" "TCGA.06.0208.01.1"
													//"TCGA.06.0216.01.1"
           //DEMOdz: mtx.mrna.bc, sampleID duplicates: "TCGA.06.0747" "TCGA.06.0749"
           //TCGAbrain: mtx.mrna.bc, no sampleID duplicates
           //All sample IDs will be returned, so there might be duplicate points drawn representing samples for a given patient.

           //console.log("***** testSendIDs, circle length is:", $("circle").length);
           //console.log("***** testSendIDs, ids length is: ", ids.length);
           //console.log("***** testSendIDs, pcaMsg.selectIDs length is: ", pcaMsg.selectedIDs.length);
           //console.log("***** testSendIDs, unique(ids).length is: ", $.unique(ids).length);
           //console.log("***** testSendIDs, $.unique(pcaMsg.selectedIDs).length is: ", $.unique(pcaMsg.selectedIDs).length);
           assert.ok($("circle").length >= ids.length, "circle length is greater or equal to original ID list.");
           //assert.equal($.unique(ids).length, $.unique(pcaMsg.selectedIDs).length, "checking unique ID length.");
           //assert.equal(ids.length, pcaMsg.selectedIDs.length, "checking total ID length.");
           testSendIDstoHighlight();
           });
        }); // new MutationObserver
      } // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   //console.log("testSendIDs, sending " + JSON.stringify(ids));
   //var payload = {value: $.unique(ids), count: $.unique(ids).length, source: "pca/Test.js::testSendIDs"};
   var payload = {value: ids, count: ids.length, source: "pca/Test.js::testSendIDs"};
   var msg = {cmd: "sendSelectionTo_PCA", callback: "", status: "request", payload:  payload};
   hub.send(JSON.stringify(msg));

} // testSendIDs
//----------------------------------------------------------------------------------------------------
function testSendIDstoHighlight() {
   console.log("entering Test.pca:testSendIDstoHighlight");

   var title = "testSendIDstoHighlight";
   console.log(title);
   //sending all the ids to highligh
   var pcaMsg = pca.ModuleMsg();
   var ids = pcaMsg.selectedIDs;
   //console.log("***** right into testSendIDstoHighlight, pcaMsg.selectedID length is ", pcaMsg.selectedIDs.length);
   if(pcaStatusObserver === null){
	 pcaStatusObserver = new MutationObserver(function(mutations) {
	    mutation = mutations[0];
	    pcaStatusObserver.disconnect();
	    pcaStatusObserver = null;
	    var id = mutation.target.id;
	    var statusMsg = $(minorStatusDiv).text();
      //var pcaMsg = pca.ModuleMsg();
      //highlightIndex = pcaMsg.highlightIndex;
	    QUnit.test(title, function(assert) {
	       //console.log("-- in QUnit.test for testSendIDstoHighlight " + ids.length + "  statusMsg: " + statusMsg);
	       //console.log("*****testSendIDstoHighlight circles number appear: ", $("circle").length);
	       assert.equal($("circle").length, ids.length, "ids length equals circle length now.");
	       var randomIndex = hub.getRandomInt(0, ids.length - 1);
         var Highlighted = d3.selectAll(".highlighted")[0].length;
         //console.log("*****testSendIDstoHighlight number of Highlighted:", Highlighted);
	       var cir_random = $("circle")[randomIndex];
	       var xPos = Number(cir_random.getAttribute("cx"));
	       var yPos =  Number(cir_random.getAttribute("cy"));
	       var radius = Number(cir_random.getAttribute("r"));
	       //console.log("*****testContentsOfPcaPlot randomIndex:" + randomIndex + "coordinates" + xPos + "  " + yPos + "  " + radius);
	       // get score for this circle, maybe check tooltip name too
         assert.equal(Highlighted, ids.length, "Sent ID length equals the highlighted length.");
	       assert.equal(xPos, pcaMsg.xScale(pcaMsg.pcaScores[randomIndex][0]), "random highlight x-axis agrees.");
	       assert.equal(yPos, pcaMsg.yScale(pcaMsg.pcaScores[randomIndex][1]), "random highligh y-axis agrees.");
         //console.log("*****before radius comparison");
	       assert.equal(radius, 7, "highlighted radius is checked.");
         markEndOfTestingDataSet(); 
	       });
	   }); // new MutationObserver
	} // if null mutation observer

   var config = {attributes: true, childList: true, characterData: true};
   var target = document.querySelector(minorStatusDiv);
   pcaStatusObserver.observe(target, config);

   console.log("testSendIDstoHighlight, sending " + JSON.stringify(ids));
   var count = ids.length;
   var payload = {value: ids, count: count , source: "pca/Test.js::testSendIDstoHighlight"};
   var msg = {cmd: "sendSelectionTo_PCA (highlight)", callback: "", status: "request", payload:  payload};
   console.log("***** t3");
   
   hub.send(JSON.stringify(msg));

} // testSendIDstoHighlight
//------------------------------------------------------------------------------------------------------------------------
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

