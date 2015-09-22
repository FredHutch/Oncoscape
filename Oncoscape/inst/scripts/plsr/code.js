<script>
//--------------------------------------------------------------------------------------------------
// global variables
// 
// window.plsrSelectedTissueIDs
//--------------------------------------------------------------------------------------------------
onReadyFunctions.push(function() {
    console.log("==== plsr code.js document.ready");
    $("#requestPLSRByTimeButton").click(requestPLSRByOnsetAndSurvival);
    $("#plsrAgeAtDxMinSlider").slider({
       change: function(event, ui) {$("#plsrAgeAtDxMinSliderReadout").text (ui.value)},
       min: 19,
       max: 90,
       value: 53
       });
    $("#plsrAgeAtDxMinSliderReadout").text(53);

    $("#plsrAgeAtDxMaxSlider").slider({
       change: function(event, ui) {$("#plsrAgeAtDxMaxSliderReadout").text (ui.value)},
       min: 19,
       max: 90,
       value: 68
       });
    $("#plsrAgeAtDxMaxSliderReadout").text(68);

    $("#plsrSurvivalMinSlider").slider({
       change: function(event, ui) {$("#plsrSurvivalMinSliderReadout").text (ui.value)},
       min: 0,
       max: 74,
       value: 6
       });
    $("#plsrSurvivalMinSliderReadout").text(6);

    $("#plsrSurvivalMaxSlider").slider({
       change: function(event, ui) {$("#plsrSurvivalMaxSliderReadout").text (ui.value)},
       min: 0,
       max: 74,
       value: 60
       });
    $("#plsrSurvivalMaxSliderReadout").text(60);
    $("#plsrCalculateButton").button();
    $("#plsrCalculateButton").click(requestPLSRByOnsetAndSurvival);
    $("#plsrSendGenesButton").button();
    $("#plsrSendGenesButton").click(broadcastSelectedGenes);

    socketConnectedFunctions.push(getAgeAtDxAndSurvialInputRanges);
    socketConnectedFunctions.push(requestPLSRByOnsetAndSurvival);
    });
//--------------------------------------------------------------------------------------------------
broadcastSelectedGenes = function()
{
    console.log("selected region: " + window.selectedRegion);
    selectedGenes = [];
    genes = window.plsrGeneDataset;

    for(var i=0; i < genes.length; i++){
       x = genes[i].Comp1
       y = genes[i].Comp2
       xInBounds = (x > window.selectedRegion[0][0] && x < window.selectedRegion[1][0])
       yInBounds = (y > window.selectedRegion[0][1] && y < window.selectedRegion[1][1])
       if(xInBounds && yInBounds) {
          geneName = genes[i].rowname
          console.log("gene in selected region: " + geneName)
          selectedGenes.push(geneName);
          } // if in bounds
       } // for i

    if(selectedGenes.length == 0){
       alert("No genes selected in PLSR display");
       return;
       }

    console.log("selectedGenes.length: " + selectedGenes.length);

    if(selectedGenes.length > 0){
       msg = {cmd:"sendIDsToModule", status: "request",
              payload:{module:"NetworkCuration",
                       ids:selectedGenes}};

       msg.json = JSON.stringify(msg);
       socket.send(msg.json);
       } // if selectedGenes

} // broadcastSelectedGenes
//----------------------------------------------------------------------------------------------------
getAgeAtDxAndSurvialInputRanges = function ()
{
   msg = {cmd: "getAgeAtDxAndSurvivalRanges", status: "request", payload:""};
   msg.json = JSON.stringify(msg);
   console.log("sending cmd " + msg)
   socket.send(msg.json);

} // getAgeAtDxAndSurvialInputRanges 
//--------------------------------------------------------------------------------------------------
plsrHandleIncomingTissueIDList = function(msg)
{
   console.log("==== plsrHandleIncomingTissueIDlist");
   console.log(msg);
   console.log(msg.payload);

   tissueIDCount = msg.payload.count;
   tissueIDs = msg.payload.tissueIDs;
   console.log("count: " + tissueIDCount + "  ids: " + tissueIDs)

   if(tissueIDCount == 0) {
      alert("no tissueIDs in message sent to PLSR")
      return;
      }
   else if (tissueIDCount == 1){
      tissueIDs = [tissueIDs];
      }

   console.log("assigning window.plsrSelectedTissueIDs");
   window.plsrSelectedTissueIDs = tissueIDs;
   requestPLSRByOnsetAndSurvival();

} // plsrHandleIncomingTissueIDList 
//--------------------------------------------------------------------------------------------------
handleAgeAtDxAndSurvivalRanges = function(msg)
{
   console.log("==== handleAgeAtDxAndSurvivalRanges");
   console.log(msg);
   console.log(msg.payload);
   ageAtDxLow = msg.payload.ageAtDxLow;
   ageAtDxHigh = msg.payload.ageAtDxHigh
   survivalLow = msg.payload.survivalLow
   survivalHigh = msg.payload.survivalHigh

   console.log("ageAtDxLow: " + ageAtDxLow);
   $("#ageAtDxLowInput").text(ageAtDxLow);

} // handleAgeAtDxAndSurvivalRanges 
//--------------------------------------------------------------------------------------------------
// requestPLSR = function()
// {
//    samples = ["0493.T.1",        "0513.T.1",       "0525.T.2",
//               "0531.T.1",        "0547.C.1",       "0547.T.1",
//               "0576.C.1",        "0576.T.1",       "0585.T.1",
//               "0598.T.1",        "0600.C.1",       "0600.T.1"];
// 
//    samples = "ALL"
// 
//    categories = ["Neural", "Proneural", "Classical", "Mesenchymal"];
//    payload = {samples:samples, categories:categories};
// 
//    payload = JSON.stringify(payload)
//    msg = {cmd: "calculatePLSR", status: "request", payload: payload}
//    msg.json = JSON.stringify(msg);
//    console.log(msg.json)
//    socket.send(msg.json);
// 
// } // requestPCA
//--------------------------------------------------------------------------------------------------
requestPLSRByOnsetAndSurvival = function()
{
   samples = "ALL"

   if(typeof window.plsrSelectedTissueIDs == "undefined"){
      samples = "ALL";
      }
   else{
      samples = window.plsrSelectedTissueIDs
      }

   console.log("=== requesting plsr for " + samples.length + " samples");

   val1 = Number($("#plsrAgeAtDxMinSliderReadout").val())
   val2 = Number($("#plsrAgeAtDxMaxSliderReadout").val())
   val3 = Number($("#plsrSurvivalMinSliderReadout").val())
   val4 = Number($("#plsrSurvivalMaxSliderReadout").val())

   console.log(val1);
   console.log(val2);
   console.log(val3);
   console.log(val4);

   payload = {samples:samples, 
              ageAtDxThresholdLow:val1,
              ageAtDxThresholdHi:val2,
              overallSurvivalThresholdLow:val3,
              overallSurvivalThresholdHi:val4};

   payload = JSON.stringify(payload)
   msg = {cmd: "calculatePLSRActualPatientTimes", status: "request", payload: payload}
   msg.json = JSON.stringify(msg);
   console.log(msg.json)
   socket.send(msg.json);


}  // requestPLSRByOnsetAndSurvival
//--------------------------------------------------------------------------------------------------
requestPLSRByOnsetAndSurvivalDemo = function()
{
   samples = "ALL"

   payload = {samples:samples, 
              ageAtDxThresholdLow:30,
              ageAtDxThresholdHi:20,
              overallSurvivalThresholdLow:15,
              overallSurvivalThresholdHi:20};

   $("#ageAtDxLowInput").val(30)
   $("#ageAtDxHighInput").val(20)
   $("#survivalLowInput").val(15)
   $("#survivalHighInput").val(20)

   payload = JSON.stringify(payload)
   msg = {cmd: "calculatePLSRPatientTimes", status: "request", payload: payload}
   msg.json = JSON.stringify(msg);
   console.log(msg.json)
   socket.send(msg.json);

} // requestPCAByOnsetAndSurvival
//--------------------------------------------------------------------------------------------------
displayPLSRresults = function(msg) {

   console.log("displayPLSRresults 1");
   console.log(msg)
   var dataset = JSON.parse(msg.payload);

   console.log("displayPLSRresults 3");
   console.log(dataset[0]);
   console.log("displayPLSRresults 5");
   d3PlsrScatterPlot(dataset);
   console.log("displayPLSRresults 7");
   window.dataset = dataset

} // displayPLSRresults
//--------------------------------------------------------------------------------------------------
displayPLSRPatientTimesResults = function(msg) 
{

   console.log("========== displayPLSRPatientTimesResults")
   window.tmp = msg;

   if(msg.status == "error"){
      alert(msg.payload);
      return;
      }

   //todo: investigate why labkey is returning array[1] for properties in some cases
   //flattenArrays will not affect JSON without array[1] members
   var genes = JSON.parse(msg.payload.genes);
   for (var i = 0; i < genes.length; i++)
       flattenArrays(genes[i]);
   console.log(genes[0]);

   var vectors = JSON.parse(msg.payload.vectors);
   for (var i = 0; i < vectors.length; i++)
        flattenArrays(vectors[i]);
   console.log(vectors[0]);

   //genes = genes.slice(1,8);
   allObjs = genes.concat(vectors);
   window.vectors = vectors
   window.allObjs = allObjs

   console.log("=== calling d3plsrscatterPlot");
   svg = d3PlsrScatterPlot(allObjs);

} // displayPLSRPatientTimesResults
//--------------------------------------------------------------------------------------------------
d3PlsrScatterPlot = function(dataset)
{
   var padding = 50;
   var width = 800;
   var height = 500;

   d3.select("svg").remove();  // so that append("svg") is not cumulative

   geneDataset = dataset.filter(function(x) {return(x.category=="gene")});
   vectorDataset = dataset.filter(function(x) {return(x.category=="vector")});

   window.plsrGeneDataset = geneDataset
   console.log("==== genes: " + geneDataset.length);
   console.log("==== vectors: " + vectorDataset.length);

   var xScale = d3.scale.linear()
                 .domain([-1.1, 1.1])
                 .range([padding, width - padding * 2]);

   var yScale = d3.scale.linear()
                 .domain([-1.1, 1.1])
                 .range([height - padding, padding]); // note inversion 

   var xAxis = d3.svg.axis()
              .scale(xScale)
              .orient("bottom")
              .ticks(5);

   var yAxis = d3.svg.axis()
              .scale(yScale)
              .orient("left")
              .ticks(5);

   var brush = d3.svg.brush()
       .x(xScale)
       .y(yScale)
       .on("brushend", brushend);

  function brushend() {
    console.log("brushend");
    var extent = brush.extent();
    console.log("e: " + extent);
    window.selectedRegion = extent;
    } ;// brushend

  function zoom() {
      circle.attr("transform", transform);
      line.attr("x1", xScale(0))
          .attr("y1", yScale(0))
          .attr("x2", function(v) { return xScale(v.Comp1); })
          .attr("y2", function(v) { return yScale(v.Comp2); });
      text.attr("x", function(v) { return xScale(v.Comp1); })
          .attr("y", function(v) { return yScale(v.Comp2); });
     }; //zoom

   function transform(d) {
     return "translate(" + xScale(d.Comp1) + "," + yScale(d.Comp2) + ")";
     }; //transform

   var assignColor = d3.scale.ordinal()
                             .domain(["gene", "vector"])
                            .range(["blue","red"]);

   var svg = d3.select("#plsrPlotDiv")
               .append("svg")
               .attr("width", width)
               .attr("height", height)
               .append("g")
                                .attr("transform", "translate(" + padding + "," + padding + ")")
                                .call(d3.behavior.zoom().x(xScale).y(yScale).on("zoom", zoom))
                .on("mousedown.zoom", null)
                            .on("touchstart.zoom", null)
                            .on("touchmove.zoom", null)
                            .on("touchend.zoom", null)
            ;

     svg.append("g")
        .attr("class", "brush")
        .call(brush);
 
    var tooltip = d3.select("body")
      .attr("class", "tooltip")
      .append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .text("a simple tooltip");

        // draw the genes
     var circle= svg.selectAll("circle")
       .data(geneDataset)
       .enter()
       .append("circle")
       .attr("r", function(d) {console.log("appending gene circle: " + d); return 2;})
       .text(function(d) {
           return(d.rowname);
           })
       .style("fill", function(d) { return assignColor(d.category); })
       .on("mouseover", function(d,i){
           tooltip.text(d.rowname);
           return tooltip.style("visibility", "visible");
           })
       .on("mousemove", function(){return tooltip.style("top",
           (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
       .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
       .attr("transform", transform);

         //-----------------------
         // draw the vectors
         //-----------------------
   var line = svg.selectAll("line")
                  .data(vectorDataset)
                  .enter().append("line")
                             .attr("class", "line")
                             .style("stroke-width", 1)
                     .style("stroke", "red")
                     .attr("x1", xScale(0))
                     .attr("y1", yScale(0))
                     .attr("x2", function(v) { return xScale(v.Comp1); })
                     .attr("y2", function(v) { return yScale(v.Comp2); });
   var text = svg.selectAll("text")
                 .data(vectorDataset)
                 .enter().append("text")
                         .attr("class", "text")
                         .attr("x", function(v) { return xScale(v.Comp1); })
                         .attr("y", function(v) { return yScale(v.Comp2); })
                         .text( function(v) {return v.rowname})
                         .attr("text-anchor", "middle")
                         .style("fill", "black") ;
                                                 
     return(svg)

} // d3PlsrScatterPlot
//--------------------------------------------------------------------------------------------------
d3PlsrVectors = function(svg, dataset, color)
{
   var padding = 50;
   var width = 800;
   var height = 600;

   var xScale = d3.scale.linear()
                 .domain([-1, 1])
                 .range([padding, width - padding * 2]);

   var yScale = d3.scale.linear()
                 .domain([-1, 1])
                 .range([height - padding, padding]); // note inversion 

   console.log("====== vectors: " + dataset.length);
   console.log(dataset[0]);

   //var svg = d3.select("svg")

   var tooltip = d3.select("body")
      .attr("class", "tooltip")
      .append("div")
      .style("position", "absolute")
      .style("z-index", "10")
      .style("visibility", "hidden")
      .text("a simple tooltip");

   svg.selectAll("circle")
       .data(dataset)
       .enter()
       .append("circle")
       .attr("cx", function(d,i) {
           console.log("appending circle at cx: " + d.Comp1);
           return xScale(d.Comp1);
           })
       .attr("cy", function(d,i) {
           return yScale(d.Comp2);
           })
       .attr("r", function(d) {
           return 2;
           })
       .text(function(d) {
           console.log(d.rowname);
           return(d.rowname);
           })
      .style("fill", color)
      .on("mouseover", function(d,i){
           tooltip.text(d.rowname);
           return tooltip.style("visibility", "visible");
           })
      .on("mousemove", function(){return tooltip.style("top",
          (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
      .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

} // d3PlsrVectors
//--------------------------------------------------------------------------------------------------
addJavascriptMessageHandler('plsrPlot', displayPLSRresults);
addJavascriptMessageHandler("plotPLSRPatientTimesResult", displayPLSRPatientTimesResults);
addJavascriptMessageHandler("tissueIDsForPLSR", plsrHandleIncomingTissueIDList);
addJavascriptMessageHandler('ageAtDxAndSurvivalRanges', handleAgeAtDxAndSurvivalRanges);
//----------------------------------------------------------------------------------------------------
</script>

