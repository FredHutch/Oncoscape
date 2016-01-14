<script>
//--------------------------------------------------------------------------------------------------
onReadyFunctions.push(function() {
    console.log("==== pca code.js document.ready");
    $("#broadcastSelectionToClinicalTable2").button()
    $("#broadcastSelectionToClinicalTable2").click(broadcastBrushedTissueIDs);
    $("#requestPCAButton").click(requestPCA);
    $("#broadCastSelectionToClinicalTable2").click(broadcastBrushedTissueIDs)
    addJavascriptMessageHandler("tissueIDsForPCA", handleTissueIDsForPCA);
    });
//--------------------------------------------------------------------------------------------------
broadcastBrushedTissueIDs = function()
{
    console.log("sampleInfo: " + window.selectedRegion);
    sampleIDs = []
    for(var i=0; i < window.pcaDataset.length; i++){
       x = window.pcaDataset[i].PC1
       y = window.pcaDataset[i].PC2
       xInBounds = (x > window.selectedRegion[0][0] && x < window.selectedRegion[1][0])
       yInBounds = (y > window.selectedRegion[0][1] && y < window.selectedRegion[1][1])
       if(xInBounds && yInBounds) {
          sampleID = window.pcaDataset[i].sample;
          console.log("sampleID in selected region: " + sampleID)
          sampleIDs.push(sampleID);
          } // if in bounds
       } // for i

    console.log("sampleIDs.length: " + sampleIDs.length);

    if(sampleIDs.length > 0){
       msg = {cmd:"sendTissueIDsToModule", status: "request",
              payload:{module:"ClinicalDataTable2",
                       tissueIDs:sampleIDs}};

       msg.json = JSON.stringify(msg);
       socket.send(msg.json);
       } // if sampleIDs

} // broadcastBrushedTissueIDs
//----------------------------------------------------------------------------------------------------

requestPCA = function()
{
   samples = ["0493.T.1",        "0513.T.1",       "0525.T.2",
              "0531.T.1",        "0547.C.1",       "0547.T.1",
              "0576.C.1",        "0576.T.1",       "0585.T.1",
              "0598.T.1",        "0600.C.1",       "0600.T.1"];

   console.log("requestiong PCA on " + samples.length + " samples");

   payload = JSON.stringify(samples)
   msg = {cmd: "calculatePCA", status: "request", payload: payload}
   msg.json = JSON.stringify(msg);
   console.log(msg.json)
   socket.send(msg.json);

} // requestPCA
//--------------------------------------------------------------------------------------------------
handleTissueIDsForPCA = function(msg)
{
   console.log("--- handleTissueIDsForPCA");
   console.log(msg.cmd)
   sampleCount = msg.payload.count
   samples = msg.payload.tissueIDs

   $("#tabs").tabs( "option", "active", 3);

   msg = {cmd: "calculatePCA", status: "request", payload: JSON.stringify(samples)};
   msg.json = JSON.stringify(msg);
   console.log(msg.json)
   socket.send(msg.json);

} // handleTissueIDsForPCA
//--------------------------------------------------------------------------------------------------
displayPCAresults = function(msg) {

   console.log("---- new request to displayPCAresults");
   console.log(msg)

   if(msg.status == "success"){
      var dataset = JSON.parse(msg.payload);
      window.pcaDataset = dataset
      d3PcaScatterPlot(dataset);
      }
    else{
      alert(msg.payload)
      }

} // displayPCAresults
//--------------------------------------------------------------------------------------------------
d3PcaScatterPlot = function(dataset) {
 
   var padding = 50;
   var width = 600;
   var height = 400;

	var xMax = d3.max(dataset, function(d) { return +d.PC1;} );
	var xMin = d3.min(dataset, function(d) { return +d.PC1;} );
	var yMax = d3.max(dataset, function(d) { return +d.PC2;} );
	var yMin = d3.min(dataset, function(d) { return +d.PC2;} );

   console.log("xMax: " + xMax);   console.log("xMin: " + xMin);
   console.log("yMax: " + yMax);   console.log("yMin: " + yMin);

   d3.select("svg").remove();  // so that append("svg") is not cumulative

   var xScale = d3.scale.linear()
                 .domain([xMin,xMax])
                 .range([padding, width - padding * 2]);

      var yScale = d3.scale.linear()
                 .domain([yMin, yMax])
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
		svg.select(".x.axis").call(xAxis);
	 	svg.select(".y.axis").call(yAxis);
	} ; //zoom

	function transform(d) {
	  return "translate(" + xScale(d.PC1) + "," + yScale(d.PC2) + ")";
	}; //transform

	var assignColor = d3.scale.ordinal()
   						 .domain(["Classical", "Proneural", "Neural", "Mesenchymal"])
   						 .range(["red","green","turquoise", "blue"]);
// 	console.log("colormap: " + assignColor(dataset.dzSubType));

    var svg = d3.select("#pcaDisplay")
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

      var circle = svg.selectAll("circle")
       .data(dataset)
       .enter()
       .append("circle")
        .attr("r", function(d) {
           return 3;
           })
       .style("fill", function(d) { return assignColor(d.dzSubType); })
      .on("mouseover", function(d,i){
           tooltip.text(d.sample + " (" + d.dzSubType + ")");
           return tooltip.style("visibility", "visible");
           })
      .on("mousemove", function(){return tooltip.style("top",
          (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
      .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
	 .attr("transform", transform)
	 ;

      
     svg.append("g")
        .attr("class", "x axis")
         .call(xAxis);
      
      //Create Y axis
      svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);
    

} // d3PcaScatterPlot
//--------------------------------------------------------------------------------------------------
addJavascriptMessageHandler("pcaPlot", displayPCAresults);
//----------------------------------------------------------------------------------------------------
</script>

