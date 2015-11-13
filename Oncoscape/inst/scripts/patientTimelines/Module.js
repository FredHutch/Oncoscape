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
    
    var then, now;

	// Data Elements
	//--------------------------------------------------------------------------------------------------
		var EventTypes;
		var Events;
		var ptList;
		var ptOrderArray = [];

	// Display features
	//--------------------------------------------------------------------------------------------------
		var TimeLineMargin = {top: 15, right: 15, bottom: 30, left: 25};
        var TimeLineDisplay;
        var TimelineSize, SideBarSize, legendSize;
		var svg, SidePlot, TimeLine, legend, tooltip;
		var MainEvents = ["Birth","Encounter", "Diagnosis", "Procedure","Pathology", "Radiation", "Drug","Progression", "Tests", "Status", "History", "Absent"];
		var MainEventColors = ["#17becf", "#d62728", "#8c564b","#ff7f0e", "#7f7f7f","#e7969c","#9467bd","#1f77b4","#2ca02c", "#bcbd22","#000000" ,"#000000" ];
        var MainEventTextSpacing = [0, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90];
        var TextOffSet = d3.scale.ordinal().range(MainEventTextSpacing).domain(MainEvents);
        var TimeLineColor = d3.scale.ordinal().range(MainEventColors).domain(MainEvents);


//--------------------------------------------------------------------------------------------
     function initializeUI(){
        console.log("========== initializing Timeline UI");
       	d = new Date();
       	then = d.getTime();
       	d = new Date();
		now = d.getTime();
		console.log("Initialize UI start: ", now - then);
		then = now;

		TimeLineDisplay = $("#TimeLineDisplay");
        HandleWindowResize();
 
        sendSelectionMenu = hub.configureSendSelectionMenu("#timeLineSendSelectionsMenu", 
                                                        selectionDestinationsOfferedHere,
                                                        sendSelections,
                                                        sendSelectionsMenuTitle);  

        $(window).resize(HandleWindowResize);

        $("#AlignOptions").change(updateDisplayAlignment);
        $("#OrderOptions").change(updateDisplayOrder);
        $("#SideBarOptions").change(updateDisplaySidePlot);
		
		$('#FitToPage').change(function() { 	HandleWindowResize();  });
	    
		svg = d3.select("#TimeLineDisplay").append("svg")
				  .attr("id", "timelineSVG")
				  .attr("width", TimeLineSize.width + 2*SideBarSize.width + 2*TimeLineMargin.left + 2*TimeLineMargin.right )
				  .attr("height", SideBarSize.height + TimeLineMargin.top + TimeLineMargin.bottom + legendSize.height)
				  ;
		
	    tooltip = d3.select("body").attr("data-toggle", "tooltip")
				   .attr("class", "tooltip")
				   .append("div").attr("id", "tooltipDiv").attr("class", "tooltipNoHover")
				   .style("position", "absolute")
				   .style("z-index", "10")
				   .style("background", "lightgray")
				   .style("border", "thin solid black")
				   .style("border-radius", "5px")
				   .style("padding", "10px")
				   .style("overflow-y", "auto");                        

			//setTimeoutHover = function(el){setTimeout( el.className = "tooltipNoHover", 1000);};
             tooltip.on("mouseover",  function(){
             		   	this.className = "tooltipHover";});
             tooltip.on("mouseout", function(){
            			var x = document.getElementsByClassName("tooltipHover");
            			for(var i=0;i<x.length;i++){x[i].className = "tooltipNoHover"; }
             });

		
		hub.disableTab(thisModulesOutermostDiv);


    }
//--------------------------------------------------------------------------------------------
     function HandleWindowResize(){

		var width, height;

		if($('#FitToPage').is(":checked")){
			  TimeLineDisplay.width($(window).width() * 0.9);
			  TimeLineDisplay.height($(window).height() * 0.9);

			  width = $("#TimeLineDisplay").width();
			  height = $("#TimeLineDisplay").height();
		  
			  TimeLineSize = {width: (0.8 *width - TimeLineMargin.left - TimeLineMargin.right), height: (0.9*height - TimeLineMargin.top - TimeLineMargin.bottom)};
			   SideBarSize = {width: (0.25*width - TimeLineMargin.left - TimeLineMargin.right), height: (0.9*height - TimeLineMargin.top - TimeLineMargin.bottom)};
				legendSize = {width: TimeLineSize.width, height: (0.1*height)};
		} else{
			  TimeLineDisplay.width($(window).width() * 0.9);
			  width = $("#TimeLineDisplay").width();
			  height = ptOrderArray.length * 20;
			  TimeLineSize = {width: (0.8 *width - TimeLineMargin.left - TimeLineMargin.right), height: height};
			   SideBarSize = {width: (0.25*width - TimeLineMargin.left - TimeLineMargin.right), height: height};		
				legendSize = {width: TimeLineSize.width, height: legendSize.height};

		}
         if(typeof TimeLine !== "undefined") redrawSVG();
     }


//--------------------------------------------------------------------------------------------------
	function redrawSVG(){
		initDisplay();
		loadLegend();
		plotTimelines();
		plotSideBar();
	}


//--------------------------------------------------------------------------------------------
     function LogTime(t, TimeScale){ 
        TimeScale = typeof TimeScale !== 'undefined' ? TimeScale : OneDay;
               var Dir = (t<0 ? -1 : 1); 
              return Dir * Math.log(Math.abs(t/TimeScale)+1)/Math.log(2); 
     }     
//--------------------------------------------------------------------------------------------
	function getFormattedDate(date) {  // takes date and returns mm/dd/yyyy
		var dd = date.getDate();
		var mm = date.getMonth()+1; //January is 0!
		var yyyy = date.getFullYear();

		if(dd<10) { dd='0'+dd; } 
		if(mm<10) { mm='0'+mm;} 

		date = mm+'/'+dd+'/'+yyyy;
		
		return date;
	 }
//--------------------------------------------------------------------------------------------
	function insertAscending(id, array) {  //null orderBy values listed first
		  
		  var val = ptList[id].orderVal;
		  array.splice(locationOf(val, array) +1, 0, id);
		  return array;
	}

//--------------------------------------------------------------------------------------------
	function locationOf(val, array, start, end) {
	  
	  if (array.length >0 && ptList[array[0]].orderVal < val || typeof val === "undefined") return -1;
	  start = start || 0;
	  end = end || array.length;
	  var pivot = parseInt(start + (end - start) / 2, 10);
	  if (end-start <= 1 || ptList[array[pivot]].orderVal === val) return pivot;
	  if (ptList[array[pivot]].orderVal > val || typeof ptList[array[pivot]].orderVal === "undefined") {
		return locationOf(val, array, pivot, end);
	  } else {
		return locationOf(val, array, start, pivot);
	  }
	}


//--------------------------------------------------------------------------------------------------
	function sendSelections()
	{
	  var destination = sendSelectionMenu.val();
	  var selectedIDs = identifyEntitiesInCurrentSelection();

	  var cmd = "sendSelectionTo_" + destination;
	  var payload = {value: selectedIDs, count: selectedIDs.length, source: "timelines module"};
	  var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

	  sendSelectionMenu.val(sendSelectionsMenuTitle);

	  hub.send(JSON.stringify(newMsg));

	} // sendSelections
//--------------------------------------------------------------------------------------------
	function identifyEntitiesInCurrentSelection ()
	{
       currentlySelectedRegion = TimeLined3PlotBrush.extent();

	   var x1 = currentlySelectedRegion[0][0],
   		   y1 = currentlySelectedRegion[0][1],
		   x2 = currentlySelectedRegion[1][0],
		   y2 = currentlySelectedRegion[1][1],
	   	   ids = [];
	   
	   var selectedPts = ptOrderArray.slice(Math.max(Math.floor(y1)+1,0), Math.min(Math.ceil(y2), ptOrderArray.length-1));		//patient IDs within Y range
    	var AlignOp = document.getElementById("AlignOptions");
		var AlignBy = AlignOp.options[AlignOp.selectedIndex].text;
	   
	   for(var i=0; i < selectedPts.length; i++){		//return IDs with events in X range
	   	  var ptObj = ptList[selectedPts[i]];
		  var dateEvents = ptObj.dateEvents;
		  for(var j=0;j<dateEvents.length;j++){
		     if(AlignBy == "--"){
				 if(dateEvents[j].date-ptObj.offset >=x1 & dateEvents[j].date-ptObj.offset <= x2) {
					ids.push(selectedPts[i]);
					break;
		    	 } //if
		     }else{
				 if(LogTime(dateEvents[j].date-ptObj.offset) >=x1 & LogTime(dateEvents[j].date-ptObj.offset) <= x2) {
					ids.push(selectedPts[i]);
					break;
		    	 } //if
		    }
	   	  } // for dateEvents
	   } // for patients

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
        
        d = new Date();
       	then = d.getTime();
       	d = new Date();
		now = d.getTime();
		console.log("Dataset specified start: ", (now - then));
		then = now;

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
  
		if(msg.status == "success"){
             var patientIDs = msg.payload;
             
             ptOrderArray = patientIDs.filter(function(id){ return Object.keys(ptList).indexOf(id) !== -1 });
			 OrderEvents();
			 redrawSVG();
        } else{
             console.log("Timelines handlePatientIDs about to call alert: " + msg);
             alert(msg.payload);
         }

        hub.raiseTab(thisModulesOutermostDiv);


	} //handlePatientIDs
//--------------------------------------------------------------------------------------------------     
     function handleIncomingIDs(msg){
          
          if(msg.status == "request"){
             var patientIDs = msg.payload.value;
             msg = {cmd: "canonicalizePatientIDsInDataset", callback: "TimelinesHandlePatientIDs", status: "request", 
                    payload: patientIDs};
             hub.send(JSON.stringify(msg));
          }
          else{
             console.log("handlePatientIDs about to call alert: " + msg);
             alert(msg.payload);
         }
     } // handlePatientIDs



 //--------------------------------------------------------------------------------------------------
     function initDisplay(){

          console.log("======== initDisplay");

  		  svg.selectAll("g").remove();
  		  $("#timelineSVG")
				  .attr("width", TimeLineSize.width + 2*SideBarSize.width + 2*TimeLineMargin.left + 2*TimeLineMargin.right )
				  .attr("height", SideBarSize.height + TimeLineMargin.top + TimeLineMargin.bottom + legendSize.height)
				  ;
                    
          SidePlot = svg.append("g").attr("id", "SidePlotSVG")
                            .attr("transform", "translate(" + TimeLineMargin.left + "," + (TimeLineMargin.top) + ")");     
             
          TimeLine = svg.append("g").attr("id", "TimeLineSVG")
                            .attr("transform", "translate(" + (SideBarSize.width+TimeLineMargin.left + TimeLineMargin.right) + "," + (TimeLineMargin.top) + ")");
          
	}

//--------------------------------------------------------------------------------------------------
     function loadPatientDataDisplay(msg) {
          console.log("==== loadPatientDataDisplay");
       	d = new Date();
       	now = d.getTime();
		console.log("load data started: " , now - then);
		then = now;

		$('select[name="AlignOptions"] option[value="--"]').attr('selected', 'selected');
		$('select[name="OrderOptions"] option[value="--"]').attr('selected', 'selected');

		  Events = msg.payload.events;
		  ptList = msg.payload.pts;
		  EventTypes = msg.payload.eventTypes;
	  
          console.log("Event count: " + Events.length);
          console.log("Patient count: " + ptList.length);
          console.log("Category count: " + EventTypes.length);
               
		  function  separateDates(event){ 
				event.date = new Date(event.date);
				event.ptID = pt;
				if(event.eventOrder== "single")     Events[event.eventID].Fields.date = event.date;
				else if(event.eventOrder== "start") Events[event.eventID].Fields.date[0] = event.date;
				else if(event.eventOrder== "end")   Events[event.eventID].Fields.date[1] = event.date;
		  }
                    
          var i = 0; ptOrderArray = [];
          for(var pt in ptList){
        		ptList[pt].showPatient = true;  ptList[pt].PatientHeight=1;  
            	ptList[pt].offset = 0;          ptList[pt].orderVal=i;
				ptOrderArray.push(pt); i++;
				ptList[pt].dateEvents.forEach(separateDates);
		  }
		  
		  for(var event in EventTypes){		EventTypes[event].disabled = false;		  }

       	d = new Date();
       	now = d.getTime();
		console.log("Load data finished: ", now - then);		then = now;
	  
		loadDataMenus();
        redrawSVG();
          
}
//--------------------------------------------------------------------------------------------------
	function loadDataMenus(){
			  console.log("======== load.Menu") ;               

		  var dateEvents = [];
		  for(var name in EventTypes){
		  	if(EventTypes[name].dateIndicator) { dateEvents.push(name);} 
		  }
		  
		  $(".plotCategoryOptions").empty(); $(".plotValueOptions").empty();
		  $("#AlignOptions").empty(); 		 $("#AlignOptions").append("<option value='--' selected='selected'>--</option>");
		  $(".OrderByDateOptions").empty();  $(".OrderByValueOptions").empty();
		  
		  for(var elem in dateEvents){
			   $("#AlignOptions").append(" <option>"+dateEvents[elem]+"</option>");
  			   $(".OrderByDateOptions").append(" <option class='OrderByDate'>"+dateEvents[elem]+"</option>");
			             
               $("#Event1").append("<option value='"+ dateEvents[elem] +"'>"+ dateEvents[elem] +"</option>");
               $("#Event2").append("<option value='"+ dateEvents[elem] +"'>"+ dateEvents[elem] +"</option>");
		  }
		  var CalculatedEvents = ptList[ptOrderArray[0]].calcEvents;
		  for(var ev in CalculatedEvents){
			   $(".OrderByValueOptions").append(" <option>"+CalculatedEvents[ev].name+"</option>");
			   $(".plotValueOptions").append(" <option>"+CalculatedEvents[ev].name+"</option>");
		  }
	  
	}
//--------------------------------------------------------------------------------------------------
	function loadLegend(){
          legend = svg.append("g")
                          .attr("class", "legend")
                          .attr("transform", "translate(" + (SideBarSize.width+2* TimeLineMargin.left + TimeLineMargin.right) + "," + (0) + ")")
         			      .selectAll(".legend")
                          .data(TimeLineColor.domain().filter(function(d){
                                return Object.keys(EventTypes).indexOf(d) !== -1; })  )
                          .enter().append("g")
                            .attr("transform", function(d, i) { 
                                  return "translate(" + i*TextOffSet(d) + ",0)" ;})
                          ;
          legend.append("rect")
                .attr("rx", 2)
                .attr("ry", 2)
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", function(d) { return TimeLineColor(d);})
                .on("click", ToggleVisibleEvent);

          legend.append("text")
                .attr("y", 9)
                .attr("x", 12)
                .style("font-size", "12px")
                .text(function(d) { return d; });
                
          legend[0].forEach(function(d){
        	if(EventTypes[d.textContent].disabled)
        		d.children[0].style.opacity = 0.2
          })
	}
 //--------------------------------------------------------------------------------------------------     
     function ToggleVisibleEvent(d){
         
         EventTypes[d].disabled = !EventTypes[d].disabled;
         if(EventTypes[d].disabled)
           d3.select(this).style("opacity", 0.2);
         else
           d3.select(this).style("opacity", 1);

          plotTimelines();
     }

//--------------------------------------------------------------------------------------------------
        function updateDisplayAlignment(){
			AlignEvents(); 
			plotTimelines();
        }
//--------------------------------------------------------------------------------------------------
        function updateDisplayOrder(){
			var OrderOp = document.getElementById("OrderOptions");
			var OrderBy = OrderOp.options[OrderOp.selectedIndex].text;

			 if(OrderBy === "+Add"){
//				console.log("== changing OrderBy with ", OrderBy);
//				OpenDialogForAddedEvents("OrderBy");
			 }else{
				console.log("== changing OrderBy " + OrderBy);
				OrderEvents();      
				plotTimelines();
				plotSideBar();
			 }        
        }
//--------------------------------------------------------------------------------------------------
        function updateDisplaySidePlot(){
			var SideOp = document.getElementById("SideBarOptions");
			var SideBy = SideOp.options[SideOp.selectedIndex].text;

				 if(SideBy === "+Add"){
			//		console.log("== changing SideBar with ", SidePlotEvent);
			//		OpenDialogForAddedEvents("SidePlot");
				 } else{ 
					console.log("== changing SideBar", SideBy);
					plotSideBar();
				 }
        
        }

//--------------------------------------------------------------------------------------------------
        function getTimelineXoptions(){
				var AlignOp = document.getElementById("AlignOptions");
				var AlignBy = AlignOp.options[AlignOp.selectedIndex].text;

               if(AlignBy === "--"){ 
                  x = d3.time.scale().range([0, TimeLineSize.width]); 
                  TimeScale =1;
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
//                            .attr("width", 1440);
               }
            return {AlignBy: AlignBy, scale: x, timescale: TimeScale, title: Xtitle, axis: xAxis};
        }

//--------------------------------------------------------------------------------------------------
		function plotTimelines(){

               console.log("======== DisplayPatients.TimeLineDisplay");
      	d = new Date();
       	now = d.getTime();
		console.log("plot Timelines start: ",now - then);		then = now;

 		TimeLine.selectAll("g").remove();

			//------  Define Ranges
                var y = d3.scale.linear().range([TimeLineSize.height, 0]), 
                    yAxis = d3.svg.axis().scale(y).orient("left").ticks(0);
            
				var X = getTimelineXoptions();  //scale,TimeScale, title, axis

				var EventMin= null, EventMax = null;
				var allEvents = [];
				ptOrderArray.filter(function(id){ return ptList[id].showPatient }).forEach(function(d){  //return d.showPatient && !d.disabled;}), 
					var activeEvents = ptList[d].dateEvents.filter(function(event){ return !EventTypes[event.name].disabled; });
					if(activeEvents.length >0){
  					   allEvents = allEvents.concat(activeEvents);
  					   var first = (X.AlignBy == "--" ? activeEvents[0].date :                       LogTime((activeEvents[0].date - ptList[d].offset), X.TimeScale));
  					   var last  = (X.AlignBy == "--" ? activeEvents[activeEvents.length-1].date :   LogTime((activeEvents[activeEvents.length-1].date - ptList[d].offset), X.TimeScale));
					   if(EventMin === null || EventMin > first) EventMin = first;
					   if(EventMax === null || EventMax < last ) EventMax = last;
					}
                });  

               X.scale.domain([EventMin, EventMax]);
               y.domain([-2, ptOrderArray.length+1]);


			//------  Set axes
			   			
               TimeLine.append("g")
                       .attr("class", "x axis").attr("transform", "translate(0," + TimeLineSize.height + ")").call(X.axis)
                       .append("text").style("font-size", "12px").text(X.title);
               TimeLine.append("g")
                       .attr("class", "y axis").call(yAxis)
                       .append("text").attr("transform", "rotate(-90)").attr("y", 2).attr("dy", "-.71em")
                       .style("text-anchor", "end").style("font-size", "12px").text("Patients");
               var PixelScale = Math.max(Math.min(y(0)-y(1), 20), 3);
               console.log(PixelScale);
				// y domain doesn't filter by showPatient or event disabled - showPatient set to false when lacks AlignBy element so has blank row in timeline
 

			//------  Add mouse Features
               var Hoverbar = TimeLine.append("g").attr("class", "hoverbar");

               				  
               TimeLined3PlotBrush = d3.svg.brush().x(X.scale).y(y)
                                       .on("brushend", identifyEntitiesInCurrentSelection);
               TimeLine.call(TimeLined3PlotBrush);

                            
			//------ Define Event plot styles
				
				var openEventStack = [], eventPathAttr = [];
	
	            	function rect_eventParams(prior, event){
					if( typeof prior == "undefined" || typeof event == "undefined")
					  console.log("ERROR: event dates not properly specified", prior, event);
					var x = (X.AlignBy == "--" ? X.scale(prior.date) : X.scale(LogTime((prior.date - ptList[prior.ptID].offset), X.TimeScale)) ),
						x2 =(X.AlignBy == "--" ? X.scale(event.date) : X.scale(LogTime((event.date - ptList[event.ptID].offset), X.TimeScale)) ),
					    Y = y(ptOrderArray.indexOf(prior.ptID)) + PixelScale/(ptList[prior.ptID].PatientHeight+1),
					    width = x2-x,
					    height = PixelScale/ptList[event.ptID].PatientHeight,
					    fill = d3.rgb(TimeLineColor(prior.name)),
					    eventIDs = openEventStack.concat([event]),
					    id = event.ptID;
    			    if(width<3) width= 3;
					return {id:id,x:x, y:Y, height:height, width:width, fill:fill, eventIDs: eventIDs};
	  		    }
  
  				var prior;
                allEvents.forEach(function(event){
                     if(event.eventOrder == "single"){
                        eventPathAttr.push(rect_eventParams(event, event));
                    } else if(event.eventOrder == "start"){ 
                        if(openEventStack.length > 0) 						//start draw at end of interval (not beginning of line)
                       	    eventPathAttr.push(rect_eventParams(prior, event)); 
                       	prior  = event; 
                        openEventStack.push(event); 
                    } else if(event.eventOrder == "end"){
	                    	openEventStack = openEventStack.filter(function(ev){ return ev.eventID != event.eventID; }) ; //remove all matching eventID from stack
							eventPathAttr.push(rect_eventParams(prior, event));	   
							prior = event;
                    }
                });

			//------ plot Events in Timeline
                 var TimeSeries = TimeLine.append("g").selectAll("rect");

                 TimeSeries.data(eventPathAttr).enter().append("rect").attr("class", "rect")                 
                    	 .attr("x",      function(d) { return d.x; })
                    	 .attr("rx",     function(d) { return 5;})
                    	 .attr("ry",     function(d) { return 5;})
                    	 .attr("width",  function(d) { return d.width; })
                    	 .attr("y",      function(d) { return d.y; })
                    	 .attr("height", function(d) { return d.height; })
                    	 .attr("stroke", function(d) { return d.fill; })
                    	 .attr("border-radius", "20px")
                    	 .attr("fill", function(d){ 
                    	 	if(d.eventIDs.length >1)
                    	 		return "url(#diagonalHatch)";
                    	 	return d.fill; 
                    	 })
//	                     .attr("stroke-width", function(d){return d.strokeWidth;})
                         .on("mouseover", function(d,i){
                             Hoverbar.append("rect")
                                .attr("x", (0 - 2*SideBarSize.width ))
                                .attr("y", function(){return y(ptOrderArray.indexOf(d.id))+ PixelScale/(ptList[d.id].PatientHeight+1);})
                                .attr("width", TimeLineSize.width + 2*SideBarSize.width +TimeLineMargin.left)
                                .attr("height", function(){return PixelScale;})
                                .style("fill", "grey").style("opacity", 0.3);    
							 
							 tooltip.style("left", function(){ 
							 			var tipOffset = $(window).width() - (d3.event.pageX +400) ;
							 			tipOffset = (tipOffset < 0 ? tipOffset : 0);
							 			var tipOffsetString = (d3.event.pageX + tipOffset) + "px";
							 			return tipOffsetString; })		
							 		.style("top", (d3.event.pageY+5) + "px")
							 		.style("height", "250px").style("width", "350px");	
							 tooltip.html(function(){
								var EventsString = "<span ><b>" + Events[d.eventIDs[0].eventID].PatientID + ": </b>("+Events[d.eventIDs[0].eventID].study +")<br/>"; 
								for(i=0;i<d.eventIDs.length; i++){
									var Fields = Events[d.eventIDs[i].eventID].Fields;
									EventsString = EventsString + "<br/><b>"+ Events[d.eventIDs[i].eventID].Name + "</b><br/>";
									for(var f in Fields) { 
										if(f == "date"){
											if(Fields[f].length >1){
												EventsString = EventsString + f + ": " + getFormattedDate(Fields[f][0]) + ", "+ getFormattedDate(Fields[f][1]) + "<br/>"; 
											}else{
												EventsString = EventsString + f + ": " + getFormattedDate(Fields[f]) + "<br/>"; 
											}
										}else{    		
											EventsString = EventsString + f + ": " + Fields[f] + "<br/>"; }
										}
								}
			                    return EventsString + "</span>"; });
			                     $("#tooltipDiv").removeClass("eventNoHover").addClass("eventHover");})
                         .on("mouseout", function(d){
                            Hoverbar.select("rect").remove();
							setTimeout(function () {
								 $("#tooltipDiv").removeClass("eventHover").addClass("eventNoHover");}, 500);
                            })
                         .on("mousemove", function(){
                            return tooltip.style("top",(d3.event.pageY+5)+"px")
                            		.style("left",function(){ 
							 			var tipOffset = $(window).width() - (d3.event.pageX +400) ;
							 			tipOffset = (tipOffset < 0 ? tipOffset : 0);
							 			var tipOffsetString = (d3.event.pageX + tipOffset) + "px";
							 			return tipOffsetString; });  });
//                         .attr("data-legend",function(d) { return d.name;});

  	hub.enableTab(thisModulesOutermostDiv);

      	d = new Date();
       	now = d.getTime();
		console.log("plot Timelines finished: ", (now - then));		then = now;


	}  

//--------------------------------------------------------------------------------------------------
	function plotSideBar(){

		console.log("======== plotSideBar");
   			
   		SidePlot.selectAll("g").remove();
 
		   var x     = d3.scale.linear().range([0, SideBarSize.width]),
			   y     = d3.scale.linear().range([SideBarSize.height, 0]), 
			   xAxis = d3.svg.axis().scale(x).orient("bottom"),
			   yAxis = d3.svg.axis().scale(y).orient("left").ticks(0),
			   xTitle = ""
			   ;
			
               y.domain([-2, ptOrderArray.length+1]);
		   var PixelScale = d3.max([d3.min([y(0)-y(1), 20]), 3]);
		   console.log("PixelScale", PixelScale);
															
		   var barAttr = [];

			var SideOp = document.getElementById("SideBarOptions");
			var SideSel = SideOp.options[SideOp.selectedIndex];
			var SideplotVal = SideSel.text;
		
	   		if(SideSel.parentNode.label == "Category"){
			} else if(SideSel.parentNode.label == "Value"){
				var calc = ptList[ptOrderArray[0]].calcEvents;
				var typeNum = -1;
				for(var k=0;k<calc.length;k++){ 
					if(calc[k].name == SideplotVal){ typeNum = k; break; }
				}
				if(typeNum !== -1){
					barAttr =  getHorizontalBarSize(typeNum); 
					xTitle = barAttr[0].timeScale;
				}
			}

		   x.domain([d3.min([d3.min(barAttr, function(d){return d.width;}),d3.min(barAttr, function(d){return d.xBar;})]),
							 d3.max(barAttr, function(d){ return d.xBar + d.width;})]).nice();

		   SidePlot.append("g").attr("class", "x axis")
				   .attr("transform", "translate(0," +SideBarSize.height + ")").call(xAxis)
				   .selectAll("text").style("text-anchor", "end")
				   .style("font-size", "12px")
				   .attr("dy", ".55em").attr("dx", "-.45em")
				   .attr("transform", function(d) {return "rotate(-75)"; });
		   SidePlot.append("g").append("text")
				   .attr("transform", "translate(0," +SideBarSize.height + ")")
				   .style("font-size", "12px").text(xTitle);
		   SidePlot.append("g").attr("class", "y axis").call(yAxis)
				   .append("text").attr("transform", "rotate(-90)")
				   .attr("y", 2).attr("dy", "-.71em")
				   .style("font-size", "12px").style("text-anchor", "end")
				   .text(SideplotVal);
	
		   var BarPlot_Horiz = SidePlot.append("g").selectAll("rect")
				   .data(barAttr).enter().append("rect")
					 .attr("x", function(d)     { return x(d.xBar);  })
					 .attr("y", function(d)     { return y(d.yBar) + PixelScale/(ptList[d.id].PatientHeight+1); })   // rectangles draw from top down
					 .attr("width", function(d) { return Math.abs(x(d.width) - x(0));  })
					 .attr("height", function(d){ return PixelScale; }) 
					 .attr("fill", function(d){ 
						  var ColorShade =  d3.rgb("gray"); 
//						  if(EventTypes.keys().indexOf(SidePlotEvent) !== -1) { ColorShade = d3.rgb(TimeLineColor(SidePlotEvent)); }
						  return ColorShade;  })
					 .on("mouseover", function(d,i){
  						 tooltip.style("top",(d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
  						 tooltip.style("height", "100px").style("width", "150px");
                         tooltip.text(d.id + ": " + d.info);
                         $("#tooltipDiv").removeClass("eventNoHover").addClass("eventHover");})
                     .on("mouseout", function(){
						 setTimeout(function () { $("#tooltipDiv").removeClass("eventHover").addClass("eventNoHover"); }, 500); })  //
					 .on("mousemove", function(){
                              return tooltip.style("top",(d3.event.pageY-50)+"px").style("left",(d3.event.pageX+10)+"px");})
;
	}
//--------------------------------------------------------------------------------------------------     
     function getHorizontalBarSize(Valtype){
     // ~~ is shortcut for Math.floor()
     
       var BarSizes = [];
		for(var i=0; i<ptOrderArray.length; i++){
			var calcEvent = ptList[ptOrderArray[i]].calcEvents[Valtype];
               var xBar = 0; var barWidth = calcEvent.value;
               if(typeof calcEvent.value === "undefined") barWidth = 0;
               if(calcEvent.value < 0){ xBar = calcEvent.value; barWidth = Math.abs(calcEvent.value);  }
               BarSizes.push( {id: ptOrderArray[i], info: calcEvent.value, xBar: xBar, yBar: i,  width: barWidth, timeScale: calcEvent.units});
       }
       return BarSizes;
     }

//--------------------------------------------------------------------------------------------------
     function updatePtOrderArray(enterIDs, exitIDs){

		var tempArray = ptOrderArray.filter(function(pt){ return exitIDs.indexOf(pt) === -1;});
		enterIDs.forEach(function(id){ 
 			tempArray = insertAscending(id, tempArray);
		});
		ptOrderArray = tempArray;
	 }
//--------------------------------------------------------------------------------------------------
     function setOrderByVal(id){
		var OrderOp = document.getElementById("OrderOptions");
		var OrderSel = OrderOp.options[OrderOp.selectedIndex];
		var OrderBy = OrderSel.text;
		
		ptList[id].orderVal = null;
		
   		if(OrderSel.parentNode.label == "Date"){
        	var dateEvents = ptList[id].dateEvents;
            for(var i=0;i<dateEvents.length; i++){
            	if(dateEvents[i].name == OrderBy){
            		ptList[id].orderVal = dateEvents[i].date;
            		break; 
            	}
            }
        	
    	} else if(OrderSel.parentNode.label == "Value"){
    		calcEvents = ptList[id].calcEvents;
    		for(var j=0;j<calcEvents.length; j++){
            	if(calcEvents[j].name == OrderBy){
					ptList[id].orderVal = calcEvents[j].value;
            		break; 
            	}
            }    
    	}

		return ptList[id].orderVal;

	}

//--------------------------------------------------------------------------------------------------
     function OrderEvents(){
     
		var OrderOp = document.getElementById("OrderOptions");
		var OrderBy = OrderOp.options[OrderOp.selectedIndex].text;
		
		var tempArray = [];
		for(var i=0;i<ptOrderArray.length;i++){
			setOrderByVal(ptOrderArray[i]);
			tempArray = insertAscending(ptOrderArray[i], tempArray);
		}
		ptOrderArray = tempArray;
	 }
//--------------------------------------------------------------------------------------------------
     function AlignEvents(){
     
		var AlignOp = document.getElementById("AlignOptions");
		var AlignBy = AlignOp.options[AlignOp.selectedIndex].text;

		var enterPts = [], removePts = [];  
        console.log("========Align Event: "+ AlignBy);
        
        for(var pt in ptList){ 
          	if(AlignBy == "--"){
          		ptList[pt].offset = 0; 
				ptList[pt].showPatient=true;
				setOrderByVal(pt);
//				if(ptOrderArray.indexOf(pt) === -1) enterPts.push(pt);
          	}else{
				ptList[pt].offset = null; 
				ptList[pt].showPatient=false;
		  
				var dateEvents = ptList[pt].dateEvents;
				for(var i=0;i<dateEvents.length; i++){
					if(dateEvents[i].name == AlignBy){
						ptList[pt].showPatient=true;
						ptList[pt].offset = dateEvents[i].date;
//						if(ptOrderArray.indexOf(pt) === -1) enterPts.push(pt);
						break; 
					}
				}
//				if(!ptList[pt].showPatient) {removePts.push(pt);}
			}
 		}
//		updatePtOrderArray(enterPts, removePts);
     }     

//--------------------------------------------------------------------------------------------------
   
   return{
          init: function(){
                hub.addOnDocumentReadyFunction(initializeUI);
                hub.registerSelectionDestination(selectionDestinationsOfferedHere, thisModulesOutermostDiv);
                hub.addMessageHandler("sendSelectionTo_Timelines", handleIncomingIDs);
                hub.addMessageHandler("DisplayPatientTimeLine", loadPatientDataDisplay);
                hub.addMessageHandler("TimelinesHandlePatientIDs", handlePatientIDs);
                hub.addMessageHandler("datasetSpecified", datasetSpecified);
          },
     };

}); // TimeLineModule
//----------------------------------------------------------------------------------------------------
PatientTimeLine = TimeLineModule();
PatientTimeLine.init();

