//----------------------------------------------------------------------------------------------------
var TimeLineModule = (function () {

	// Integration Components
	//--------------------------------------------------------------------------------------------------

    var sendSelectionMenu;
    var sendSelectionsMenuTitle = "Send selection...";
    var selectionDestinationsOfferedHere = ["Timelines"];
    var OneDay = 1000 *60 * 60*24;
	var ThisModuleName = "Timelines";
    var thisModulesOutermostDiv = "patientTimeLinesDiv";

	// Data Elements
	//--------------------------------------------------------------------------------------------------
		var CalculatedEvents =[]//{Name:"Survival", Event1: "Diagnosis", Event2: "Status", TimeScale: "Months"},
//								{Name:"AgeDx",Event1: "DOB", Event2: "Diagnosis", TimeScale: "Years"},
//								{Name:"TimeToProgression",Event1: "Diagnosis", Event2: "Progression", TimeScale: "Days"},
//								{Name:"FirstProgressionToDeath",Event1: "Progression", Event2: "Status", TimeScale: "Days"} ];
//			 CalculatedEvents = d3.nest()
//				  .key(function(d) { return d.Name; })
//				  .map(CalculatedEvents, d3.map);      
		var EventTypes;
		var Events;
		var ptList;
		var ptOrderArray = [];

	// Display features
	//--------------------------------------------------------------------------------------------------
		var TimeLineMargin = {top: 10, right: 15, bottom: 30, left: 25};
        var TimeLineDisplay;
		var svg, SidePlot, TimeLine, legend;
		var MainEvents = ["Birth","Encounter", "Diagnosis", "Procedure","Pathology", "Radiation", "Drug","Progression", "Tests", "Status", "History"];
		var MainEventColors = ["#17becf", "#d62728", "#8c564b","#ff7f0e", "#7f7f7f","#e7969c","#9467bd","#1f77b4","#2ca02c", "#bcbd22","#17becf" ];
        var MainEventTextSpacing = [0, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90];
        var TimeLineColor = d3.scale.ordinal().range(MainEventColors).domain(MainEvents);


//--------------------------------------------------------------------------------------------
     function HandleWindowResize(){
          TimeLineDisplay.width($(window).width() * 0.95);
          TimeLineDisplay.height($(window).height() * 1.05);

         // if(!TimeLineInitialLoad) {dispatch.DisplayPatients();}
     }

//--------------------------------------------------------------------------------------------
     function LogTime(t, TimeScale){ 
        TimeScale = typeof TimeScale !== 'undefined' ? TimeScale : OneDay;
//        if(AlignBy === "--"){ return t;}
//        else{ 
              var Dir = (t<0 ? -1 : 1); 
              return Dir * Math.log(Math.abs(t/TimeScale)+1)/Math.log(2); 
//        }  
     }     

//--------------------------------------------------------------------------------------------------
	function sendSelections()
	{
	  var destination = sendSelectionMenu.val();
	  selectedIDs = identifyEntitiesInCurrentSelection();

	  var cmd = "sendSelectionTo_" + destination;
	  payload = {value: selectedIDs, count: selectedIDs.length, source: "timelines module"};
	  var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

	  sendSelectionMenu.val(sendSelectionsMenuTitle);

	  hub.send(JSON.stringify(newMsg));

	} // sendSelections
//--------------------------------------------------------------------------------------------
	function identifyEntitiesInCurrentSelection ()
	{
	   x1 = currentlySelectedRegion[0][0];
	   y1 = currentlySelectedRegion[0][1];
	   x2 = currentlySelectedRegion[1][0];
	   y2 = currentlySelectedRegion[1][1];
	   ids = [];
			  for(var i=0; i < Events.length; i++){
				  var event = Events[i];
				  if(event.PtNum >= y1 & event.PtNum <= y2){
					 // Patient within range
			
					 if(event.Fields.date.length>1 ){
						if( (LogTime(event.Fields.date[0]-event.offset) >=x1 & LogTime(event.Fields.date[0]-event.offset) <= x2) ||
							(LogTime(event.Fields.date[1]-event.offset) >=x1 & LogTime(event.Fields.date[1]-event.offset) <= x2) ){
						  // date endpoints within range
					
							if(ids.indexOf(event.PatientID) === -1)
							   ids.push(event.PatientID);
						}
					 }else{
						if( LogTime(event.Fields.date-event.offset) >=x1 & LogTime(event.Fields.date-event.offset) <= x2) {
						  // date within range
							if(ids.indexOf(event.PatientID) === -1)
							   ids.push(event.PatientID);
						} //if
					 } //else
				  } //if
			  } // for i
	
			  return (ids);
		 }

//-------------------------------------------------------------------------------------------
// when a dataset is specified, this module 
//  1) extracts the name of the dataset from the payload of the incoming msg
//  2) (for now) extracts the name of the matrices, from the manifest (also in the payload
//     of the incoming msg, chooses the first mtx.mrna entry it finds
//  3) sends a "createPLSR" message to the server, with dataset & matrix name specified
//  4) asks that the server, upon successful completion of that createPLSR request, callback
//     here so that the sliders can be set
	function datasetSpecified(msg)
	{
//	   timelinesXXX = msg;
	   var dataPackageName = msg.payload.datasetName;
 
		   // ["mtx.cn.RData", "history.RData", "mtx.mrna.RData", "mtx.mrna.ueArray.RData", 
		   // "mtx.mut.RData", "mtx.prot.RData", "mtx.meth.RData", "markers.json.RData", 
		   // "genesets.RData", "g.markers.json"]
	   var dataElementNames = msg.payload.rownames;

		  // for now, and very temporarily, use the first match (if any are found)
	   var hits = dataElementNames.map(function(name) {if(name.indexOf("history") >= 0) return(name);});
	   hits = hits.filter(function(n){ return (n !== undefined); });

	   var dataName = null;

	   if(hits.length > 0){
			// for now always grab the first hit, remove the trailing .RData
			// the PLSR constructor wants both dataPacakgeName & a matrix name
			// our convention is that the maniftest rowname is the same as
			// its name, with ".RData" appended
		  dataName = hits[0].replace(".RData", "");
		  }
	   else{
		  return;
		  }
   
	   createTimelinesObjectOnServer(dataPackageName, dataName);

	} // datasetSpecified
//--------------------------------------------------------------------------------------------
	function createTimelinesObjectOnServer(dataPackageName, dataName)
	{
	  console.log("create Timelines on server " + dataPackageName + ": " + dataName);
 
	  payload = {dataPackage: dataPackageName, dataName: dataName};

	  msg = {cmd: "createTimelines", callback: "DisplayPatientTimeLine", status: "request", payload: payload};

	  msg.json = JSON.stringify(msg);
	  hub.send(msg.json);

	} // createTimelinesObjectOnServer

//--------------------------------------------------------------------------------------------------     
     function handlePatientIDs(msg){
  
          hub.raiseTab(thisModulesOutermostDiv);
//          console.log(msg);
          
          if(msg.status == "request"){
             patientIDs = msg.payload.value;
             payload = patientIDs;
             msg = {cmd: "calculateTimelines", callback: "DisplayPatientTimeLine", status: "request", 
                    payload: payload};
             hub.send(JSON.stringify(msg));
          }
          else{
             console.log("handlePatientIDs about to call alert: " + msg);
             alert(msg.payload);
         }
     } // handlePatientIDs


//--------------------------------------------------------------------------------------------
     function initializeUI(){
        console.log("========== initializing Timeline UI");
       	d = new Date();
       	thenDate = d.getTime();
       	d = new Date();
		nowDate = d.getTime();
		console.log(nowDate - thenDate);
		thenDate = nowDate;

		TimeLineDisplay = $("#TimeLineDisplay");
//        HandleWindowResize();
 
        sendSelectionMenu = hub.configureSendSelectionMenu("#timeLineSendSelectionsMenu", 
                                                        selectionDestinationsOfferedHere,
                                                        sendSelections,
                                                        sendSelectionsMenuTitle);  
        $(window).resize(HandleWindowResize);

        $("#AlignByMenu").change(updateDisplayAlignment);
        $("#OrderByMenu").change(updateDisplayOrder);
        $("#SideBarMenu").change(updateDisplaySidePlot);

		initDisplay()

    }

 //--------------------------------------------------------------------------------------------------
     function initDisplay(){

          console.log("======== initDisplay");
                    
          var width = $("#TimeLineDisplay").width();
          var height = $("#TimeLineDisplay").height();
          
          var TimeLineSize ={width: (0.8*width - TimeLineMargin.left - TimeLineMargin.right), height: (0.75*height - TimeLineMargin.top - TimeLineMargin.bottom)},
              SideBarSize = {width: (0.25*width - TimeLineMargin.left - TimeLineMargin.right), height: (0.75*height - TimeLineMargin.top - TimeLineMargin.bottom)},
              legendSize =  {width: TimeLineSize.width, height: 0.25*height};

          svg = d3.select("#TimeLineDisplay").append("svg")
                      .attr("id", "timelineSVG")
                      .attr("width", TimeLineSize.width + 2*SideBarSize.width + 2*TimeLineMargin.left + 2*TimeLineMargin.right )
                      .attr("height", SideBarSize.height + TimeLineMargin.top + TimeLineMargin.bottom + legendSize.height)
                      ;

          SidePlot = svg.append("g").attr("id", "SidePlotSVG")
                            .attr("transform", "translate(" + TimeLineMargin.left + "," + TimeLineMargin.top + ")");     
             
          TimeLine = svg.append("g").attr("id", "TimeLineSVG")
                            .attr("transform", "translate(" + (SideBarSize.width+TimeLineMargin.left + TimeLineMargin.right) + "," + TimeLineMargin.top + ")");
          
          var TextOffSet = d3.scale.ordinal()
                             .range(MainEventTextSpacing)
                             .domain(MainEvents);
                             
          console.log("==== Event Types");
          legend = svg.append("g")
                          .attr("class", "legend")
                          .attr("transform", "translate(" + (SideBarSize.width+2* TimeLineMargin.left + TimeLineMargin.right) + "," + (TimeLineSize.height+ TimeLineMargin.top + TimeLineMargin.bottom) + ")")
//         			      .selectAll(".legend")
//                          .data(TimeLineColor.domain().filter(function(d){
//                                return EventTypes.keys().indexOf(d) !== -1; })  )
//                          .enter().append("g")
//                            .attr("transform", function(d, i) { 
//                                  return "translate(" + i*TextOffSet(d) + ",0)" ;})
                          ;
//          legend.append("rect")
//                .attr("width", 10)
//                .attr("height", 10)
//                .style("fill", function(d) { return TimeLineColor(d);})
//                .on("click", ToggleVisibleEvent);

//          legend.append("text")
//                .attr("y", 9)
//                .attr("x", 12)
//                .style("font-size", "12px")
//                .text(function(d) { return d; });


	}

//--------------------------------------------------------------------------------------------------
     function loadPatientDataDisplay(msg) {
          console.log("==== loadPatientDataDisplay");
//          console.log(msg);
       	d = new Date();
       	thenDate = d.getTime();

          Events = msg.payload.events;
          ptList = msg.payload.pts;
          EventTypes = msg.payload.eventTypes;
          
          console.log("Event count: " + Events.length);
          console.log("Patient count: " + ptList.length);
          console.log("Category count: " + EventTypes.length);
          
          parseDate = d3.time.JAVASCRIPT_FORMAT ("%m/%d/%Y").parse;
          FormatDate = d3.time.JAVASCRIPT_FORMAT ("%x");
          
          for( pt in ptList){
        		ptList[pt].showPatient = true;  ptList[pt].PatientHeight=1;  
            	ptList[pt].offset = 0;          ptList[pt].EventOffset=0; 
		  };
		  
		  for(event in EventTypes){		EventTypes[event].disabled = false;		  };
		  

		  loadDataMenus();
//		  initDisplay();
		  plotTimelines();
          
          

}

//--------------------------------------------------------------------------------------------------
	function loadDataMenus(){
			  console.log("======== load.Menu") ;               

		  for(elem in EventTypes){
			   $("#AlignOptions").append(" <option>"+elem+"</option>");
  			   $("#OrderOptions").append(" <option>"+elem+"</option>");
			             
               $("#Event1").append("<option value='"+ elem +"'>"+ elem +"</option>");
               $("#Event2").append("<option value='"+ elem +"'>"+ elem +"</option>");
		  }
		  for(elem in CalculatedEvents){
			   $("#OrderOptions").append(" <option>"+elem+"</option>")
			   $("#SideBarOptions").append(" <option>"+elem+"</option>")
		  }
	  
	}

//--------------------------------------------------------------------------------------------------
        function updateDisplayAlignment(){
			// AlignEvents(); 
			// updateDisplay()
        }
//--------------------------------------------------------------------------------------------------
        function updateDisplayOrder(){
			//  OrderBy = this.value; 
			//			 if(OrderBy === "+Add"){
			//				console.log("== changing OrderBy with ", OrderBy);
			//				OpenDialogForAddedEvents("OrderBy");
			//			 }else{
			//				console.log("== changing OrderBy ", OrderBy);
			//				OrderEvents();      
			//				updateDisplay();
			//			 }        
        }
//--------------------------------------------------------------------------------------------------
        function updateDisplaySidePlot(){
			//	SidePlotEvent = this.value; 
			//	 if(SidePlotEvent === "+Add"){
			//		console.log("== changing SideBar with ", SidePlotEvent);
			//		OpenDialogForAddedEvents("SidePlot");
			//	 } else{ 
			//		console.log("== changing SideBar", SidePlotEvent);
			//		updateDisplay(); 
			//	 }
        
        }

//--------------------------------------------------------------------------------------------------
		function plotTimelines(){

               console.log("======== DisplayPatients.TimeLineDisplay");
               var tooltip = d3.select("body")
                               .attr("data-toggle", "tooltip")
                               .append("div")
                               .style("position", "absolute")
                               .style("z-index", "10")
                               .style("visibility", "hidden")
                               .text("a simple tooltip");

              TimeLineSize = {width: (0.8*width - TimeLineMargin.left - TimeLineMargin.right), height: (0.75*height - TimeLineMargin.top - TimeLineMargin.bottom)};
                var x,TimeScale, xTitle, xAxis, 
                   y = d3.scale.linear().range([TimeLineSize.height, 0]), 
                   yAxis = d3.svg.axis().scale(y).orient("left").ticks(0)
                   ;
            
               if(AlignBy === "--"){ 
                  x = d3.time.scale().range([0, TimeLineSize.width]); TimeScale =1;
                  Xtitle="Year";
                  xAxis = d3.svg.axis().scale(x).orient("bottom");
               } else{
                  x =  d3.scale.linear().range([0, TimeLineSize.width]);
                  TimeScale = OneDay;
                  Xtitle = "Days";
                  xAxis = d3.svg.axis().scale(x).orient("bottom")
                            .ticks(10)
                            .tickFormat(function (d) { 
                               var Dir = (d<0 ? -1 : 1); 
                               return Math.round(Dir * (Math.pow(2, (Math.abs(d)))-1) *100)/100;
                            });
               }

               var EventMin = d3.min(ptList.filter(function(d){return d.showPatient;}), //return d.showPatient && !d.disabled;}), 
                                    	function(d){  d.dateEvents.filter(function(date){!EventTypes[date.name].disabled }), LogTime((d.date[0] - d.offset), TimeScale)
                                    				})
                                                
               var EventMax = d3.max(ptList.filter(function(d){return d.showPatient;}), //return d.showPatient && !d.disabled;}), 
                                    	function(d){  d.dateEvents.filter(function(date){!EventTypes[date.name].disabled }), LogTime((d.date[0] - d.offset), TimeScale)
                                    				});
               x.domain([EventMin, EventMax]);

               TimeLined3PlotBrush = d3.svg.brush()
                                       .x(x).y(y)
                                       .on("brushend", timelineD3PlotBrushReader);

               TimeLine.call(TimeLined3PlotBrush);


               TimeLine.append("g")
                       .attr("class", "x axis")
                       .attr("transform", "translate(0," + TimeLineSize.height + ")")
                       .call(xAxis)
                       .append("text")
                       .style("font-size", "12px")
                       .text(Xtitle);
 
               TimeLine.append("g")
                       .attr("class", "y axis")
                       .call(yAxis)
                       .append("text")
                       .attr("transform", "rotate(-90)")
                       .attr("y", 2)
                       .attr("dy", "-.71em")
                       .style("text-anchor", "end")
                       .style("font-size", "12px")
                       .text("Patients");
      
               var Hoverbar = TimeLine.append("g").attr("class", "hoverbar");
                            
               y.domain([d3.min(ptList,function(d) { return d.PtNum; })-2,
                         d3.max(Events,function(d) { return d.PtNum; })+1]);
               console.log("Timeline" + y.domain());
               var PixelScale = d3.max([d3.min([y(0)-y(1), 20]), 3]);
               console.log(PixelScale);
				// y domain doesn't filter by showPatient or event disabled - showPatient set to false when lacks AlignBy element so has blank row in timeline
 
               var TimeSeries = TimeLine.append("g")
                                        .selectAll("path")
                                        .data(Events.filter(function(d){ 
                                              return (d.Fields.date instanceof Array) && !d.disabled && d.showPatient;}))
               ;

  //            console.log("TimeSeries", TimeSeries)

               TimeSeries.enter()
                    .append("line")
                    .attr("class", "path")
                    .attr("x1", function(d) { return x(LogTime((d.Fields.date[0] - d.offset), TimeScale));        })
                    .attr("x2", function(d) { return x(LogTime((d.Fields.date[1] - d.offset), TimeScale));        })
                    .attr("y1", function(d) { return y(d.PtNum) + PixelScale*(d.EventOffset +1)/(d.PatientHeight +1); })
                    .attr("y2", function(d) { return y(d.PtNum) + PixelScale*(d.EventOffset +1)/(d.PatientHeight +1); })
                    .attr("stroke", function(d){ 
                        if(GreyOutPts.indexOf(d.PatientID) !== -1) return "grey";
                    
                        var ColorShade = d3.rgb(TimeLineColor(d.Name)); 
   //                      if(d3.keys(d).indexOf("Type") !== -1){ 
   //                           return ColorShade.brighter((EventTypes.get(d.Name).indexOf(d.Fields) % 5)/2) };
                        return ColorShade; })
                    .attr("stroke-width", function(d){return PixelScale/d.PatientHeight;})
                    .attr("data-legend",function(d) { return d.Name;})
                    .on("mouseover", function(d,i){
                        Hoverbar.append("rect")
                                .attr("x", 0)
                                .attr("y", function(){return y(d.PtNum);})
                                .attr("width", TimeLineSize.width)
                                .attr("height", function(){return PixelScale;})
                                .style("fill", "grey").style("opacity", 0.3);    
                        var Type = ""; 
                        if(d3.keys(d).indexOf("Type") !== -1){ Type = d.Fields;}
                        tooltip.text(d.PatientID + ": " + d.Name + " (" + FormatDate(d.Fields.date[0]) + ", "+ FormatDate(d.Fields.date[1]) + ") " + Type);
                        return tooltip.style("visibility", "visible");})
                    .on("mousemove", function(){
                        return tooltip.style("top",(d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
                    .on("mouseout", function(){
                        Hoverbar.select("rect").remove();
                        return tooltip.style("visibility", "hidden");})
                    ;
               TimeSeries.exit().remove();

               var TimePoint = TimeLine.append("g").selectAll("circle")
                    .data(Events.filter(function(d){ return !(d.Fields.date instanceof Array) && !d.disabled && d.showPatient;}));

               TimePoint.enter()
                        .append("circle")
                        .attr("class", "circle")
                        .style("fill", function(d){ 
                           if(GreyOutPts.indexOf(d.PatientID) !== -1) return "grey";
                           return TimeLineColor(d.Name); })
                        .attr("cx", function(d) { return x(LogTime((d.Fields.date -d.offset), TimeScale)); })
                        .attr("cy", function(d) { return y(d.PtNum)+0.5*PixelScale; })
                        .attr("r", function(d)  { return 0.5*PixelScale;})
                        .attr("data-legend",function(d) { return d.Name;})
                        .on("mouseover", function(d,i){
                            Hoverbar.append("rect")
                                    .attr("x", 0)
                                    .attr("y", function(){return y(d.PtNum);})
                                    .attr("width", TimeLineSize.width)
                                    .attr("height", PixelScale)
                                    .style("fill", "grey").style("opacity", 0.3);
                            var Type = ""; 
                            if(d3.keys(d).indexOf("Type") !== -1){ Type = d.Fields;}
                            tooltip.text(d.PatientID + ": " + d.Name + " (" + FormatDate(d.Fields.date) +") " + Type);
                            return tooltip.style("visibility", "visible");})
                        .on("mousemove", function(){
                            return tooltip.style("top",(d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
                        .on("mouseout", function(){ Hoverbar.select("rect").remove();return tooltip.style("visibility", "hidden");})
               ;

               TimePoint.exit().remove();                    

}  

//--------------------------------------------------------------------------------------------------
   
   return{
          init: function(){
                hub.addOnDocumentReadyFunction(initializeUI);
                hub.registerSelectionDestination(selectionDestinationsOfferedHere, thisModulesOutermostDiv);
                hub.addMessageHandler("sendSelectionTo_Timelines", handlePatientIDs);
                hub.addMessageHandler("DisplayPatientTimeLine", loadPatientDataDisplay);
                hub.addMessageHandler("TimelinesHandlePatientIDs", handlePatientIDs);
//                hub.addMessageHandler("FilterTimelinePatients", FilterTimelinePatients);
                hub.addMessageHandler("datasetSpecified", datasetSpecified);
                hub.setTitle("Timelines");
 //               hub.addSocketConnectedFunction(loadPatientDemoData);
          },
     };

}); // TimeLineModule
//----------------------------------------------------------------------------------------------------
PatientTimeLine = TimeLineModule();
PatientTimeLine.init();


	  
