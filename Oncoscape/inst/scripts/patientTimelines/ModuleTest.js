//----------------------------------------------------------------------------------------------------
var TimeLineModule = (function () {

    var sendSelectionMenu;
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
		 var CategoryEvents = ["Birth.gender", "Birth.race", "Birth.ethnicity", 
							   "Diagnosis.disease", "Diagnosis.siteCode",
							   "Status.status", "Status.tumorStatus",
							   "Drug.therapyType", "Drug.agent", "Drug.intent",
							   "Radiation.therapyType", "Radiation.intent", "Radiation.target", 
							   "Procedure.name", "Procedure.site", "Procedure.side",
							   "Pathology.disease", "Pathology.histology", "Pathology.collection", "Pathology.grade", "Pathology.method",
							   "Test.type", "Test.test", "Test.result",
							   "Background.history", "Background.symptoms"
							   ];
		var EventTypes = [];

	// Display features
	//--------------------------------------------------------------------------------------------------
		var TimeLineMargin = {top: 10, right: 15, bottom: 30, left: 25};
		var svg;
		var SidePlot;
		var TimeLine;
		var MainEvents = ["Birth","Encounter", "Diagnosis", "Procedure","Pathology", "Radiation", "Drug","Progression", "Tests", "Status", "History"];
		var MainEventColors = ["#17becf", "#d62728", "#8c564b","#ff7f0e", "#7f7f7f","#e7969c","#9467bd","#1f77b4","#2ca02c", "#bcbd22","#17becf" ];
        var MainEventTextSpacing = [0, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90];
        var TimeLineColor = d3.scale.ordinal().range(MainEventColors).domain(MainEvents);

 //--------------------------------------------------------------------------------------------------
     function initDisplay(){

          console.log("======== LoadOptions.AllDisplays");
          
          var width = $("#TimeLineDisplay").width();
          var height = $("#TimeLineDisplay").height();
          
          var TimeLineSize ={width: (0.8*width - TimeLineMargin.left - TimeLineMargin.right), height: (0.75*height - TimeLineMargin.top - TimeLineMargin.bottom)},
          var SideBarSize = {width: (0.25*width - TimeLineMargin.left - TimeLineMargin.right), height: (0.75*height - TimeLineMargin.top - TimeLineMargin.bottom)},
          var legendSize =  {width: TimeLineSize.width, height: 0.25*height};

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
          var legend = svg.append("g")
                          .attr("class", "legend")
                          .attr("transform", "translate(" + (SideBarSize.width+2* TimeLineMargin.left + TimeLineMargin.right) + "," + (TimeLineSize.height+ TimeLineMargin.top + TimeLineMargin.bottom) + ")")
                          .selectAll(".legend")
                          .data(TimeLineColor.domain().filter(function(d){
                                return EventTypes.keys().indexOf(d) !== -1; })  )
                          .enter().append("g")
                             .attr("transform", function(d, i) { 
                                   return "translate(" + i*TextOffSet(d) + ",0)" ;})
                          ;
          legend.append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .style("fill", function(d) { return TimeLineColor(d);})
                .on("click", ToggleVisibleEvent);

          legend.append("text")
                .attr("y", 9)
                .attr("x", 12)
                .style("font-size", "12px")
                .text(function(d) { return d; });
	}
	
//--------------------------------------------------------------------------------------------------
	function loadMenuOptions(){
			  console.log("======== load.Menu") ;               

//   for(var i=0; i < dataSetNames.length; i++){
//      var s = dataSetNames[i];
//      datasetMenu.append("<option value='" + s + "'>" + s + "</option>");
//      }

			  EventTypes.keys().forEach(function(elem){
				   $("#AlignOptions")
						 .append(" <li><a href='javascript:void(0)' onclick='updateDisplayAlignment(this)' >"+elem+"</a></li>")
			  })
			  [CalculatedEvents.keys() ,EventTypes.keys()].forEach(function(elem){
				   $("#OrderOptions")
						 .append(" <li><a href='javascript:void(0)' onclick='updateDisplayOrder(this)' >"+elem+"</a></li>")
			  })
		  
			  [CalculatedEvents.keys() , 
			   CategoryEvents.filter(function(d){ 
												var MainEvent = d.match(/\w+/)[0];
												var FieldEvent = d.match(/\w+$/)[0];
												return EventTypes.has(MainEvent) && typeof EventTypes.get(MainEvent)[FieldEvent] !== "undefined"; })
			  ].forEach(function(elem){     
				   $("#SideBarOptions")
						 .append(" <li><a href='javascript:void(0)' onclick='updateFeatureDisplay(this)' >"+elem+"</a></li>")
			  })
	}
	#-----------------------------------------

	
//--------------------------------------------------------------------------------------------------
function prepDisplay(){

//               SidePlot.selectAll("g").remove();
//               TimeLine.selectAll("g").remove();
//               width = $("#TimeLineDisplay").width();
//               height = $("#TimeLineDisplay").height();
//               TimeLineSize = {width: (0.8*width - TimeLineMargin.left - TimeLineMargin.right), height: (0.75*height - TimeLineMargin.top - TimeLineMargin.bottom)};
//               SideBarSize = {width: (0.2*width - TimeLineMargin.left - TimeLineMargin.right),  height: (0.75*height - TimeLineMargin.top - TimeLineMargin.bottom)};
//               legendSize = {height: 0.25*height, width: TimeLineSize.width};          
//               svg.select(".legend")
//                  .attr("transform", "translate(" + (SideBarSize.width+2* TimeLineMargin.left+TimeLineMargin.right) + "," + (TimeLineSize.height+ TimeLineMargin.top + TimeLineMargin.bottom) + ")")
//               TimeLine.attr("transform", "translate(" + (SideBarSize.width+2*TimeLineMargin.left + TimeLineMargin.right) + "," + TimeLineMargin.top + ")");
//               SidePlot.attr("transform", "translate(" + TimeLineMargin.left + "," + TimeLineMargin.top + ")");


//offset overlapping date durations so none are obscured
               EventsByID.forEach(function(ID, Patient){
                    
                  var checkEvent = [];
                  var PatientDateArray = [];
                  var PatientHeight = 0;
           
                  if(Patient.has("Chemo")){ 
                     Patient.get("Chemo").forEach(function(d){ PatientDateArray.push({ Name: "Chemo", Fields: {date:d.Fields.date}});});
                  }if(Patient.has("Radiation")){ 
                     Patient.get("Radiation").forEach(function(d){ PatientDateArray.push({ Name: "Radiation", Fields: {date:d.Fields.date}});});
                  }
                  if(Patient.has("anti-Androgen")){ 
                     Patient.get("anti-Androgen").forEach(function(d){ PatientDateArray.push({ Name: "anti-Androgen", Fields: {date:d.Fields.date}});});
                  }
                  if(PatientDateArray.length >0){
                     PatientDateArray = PatientDateArray.sort(AscendingStartDate);
                     PatientDateArray[0].offset = 0; checkEvent.push(PatientDateArray[0].Fields.date[1]);
                     for(var i=1; i< PatientDateArray.length; i++){
                         var offset = 0; 
                         while(offset < checkEvent.length & 
                               PatientDateArray[i].Fields.date[0] <= checkEvent[offset]){		//checking interval overlap for each offset position
                                  offset = offset +1;
                         }
                         PatientDateArray[i].offset = offset;
                         checkEvent[offset] = PatientDateArray[i].Fields.date[1];
                         if(PatientHeight < offset) PatientHeight = offset;
                     }}
                     Patient.forEach(function(key, entry){
                         if(key == "Chemo" | key =="Radiation" | key == "anti-Androgen"){
                            entry.sort(AscendingStartDate).forEach(function(d, i){ 
                                d.EventOffset = PatientDateArray.filter(function(event){return event.Name==key;})[i].offset; 
                                d.PatientHeight=PatientHeight+1;}) ;
                         } 
                     });
               }); //forEach
                
               plotTimelines();
               plotSideBar();
          });
 
  
//--------------------------------------------------------------------------------------------------
function plotSideBar(){

               console.log("======== DisplayPatients.SidePlotDisplay");
           
               SideBarSize = {width: (0.2*width - TimeLineMargin.left - TimeLineMargin.right),  height: (0.75*height - TimeLineMargin.top - TimeLineMargin.bottom)};
               var x     = d3.scale.linear().range([0, SideBarSize.width]),
                   y     = d3.scale.linear().range([SideBarSize.height, 0]), 
                   xAxis = d3.svg.axis().scale(x).orient("bottom"),
                   yAxis = d3.svg.axis().scale(y).orient("left").ticks(0),
                   xTitle = ""
                   ;
                    
               y.domain([d3.min(Events,function(d) { return d.PtNum; })-2,
                         d3.max(Events,function(d) { return d.PtNum; })+1]);
               console.log("SP " + y.domain());
               var PixelScale = d3.max([d3.min([y(0)-y(1), 20]), 3]);
               console.log("PixelScale", PixelScale);
                                                                    
               var PatientOrderBy = [];
               var Categories = [];

               console.log("Display Current Side Plot Event: " + SidePlotEvent);

               if(SidePlotEvent === "--"){     return;     
               }else if (CalculatedEvents.has(SidePlotEvent) ){
                     var event = CalculatedEvents.get(SidePlotEvent)[0];
                     console.log("Using event: ", event);
                     PatientOrderBy =  getHorizontalBarSize(getDateDiff(SidePlotEvent, event.Event1,event.Event2,event.TimeScale)); 
                     xTitle = event.TimeScale;
                     
                     if(SidePlotEvent === "Survival"){
                        PatientOrderBy.forEach(function(d){
                            if(EventsByID.get(d.ID).has("Status") && EventsByID.get(d.ID).get("Status")[0].Fields.status !== "Dead")
                                d.width = 0;
                        });
                     }
               }else if(CategoryEvents.indexOf(SidePlotEvent) !== -1){
                     //get number of categories
                     var MainEvent = SidePlotEvent.match(/\w+/)[0];
                     var FieldEvent = SidePlotEvent.match(/\w+$/)[0];
                     EventsByID.forEach(function(ID, Patient){
                        if(Patient.has(MainEvent) && Patient.get(MainEvent)[0].showPatient){
                            Patient.get(MainEvent).forEach(function(namedEvent){
                              if(typeof namedEvent.Fields[FieldEvent] !== "undefined"){
                                var fieldVal = namedEvent.Fields[FieldEvent];
                                 if(Categories.indexOf(fieldVal) == -1){ Categories.push(fieldVal);} 
                              }
                            });
                        }
                     });
                     Categories.sort();
                     var xWidth = 1/Categories.length;
                     EventsByID.forEach(function(ID, Patient){
                        if(!Patient.has(MainEvent)){
                        } else if(Patient.get(MainEvent)[0].showPatient){ 
                              PatientEventTypes = Patient.get(MainEvent);
                              for(var i=0; i< PatientEventTypes.length;i++){
                                  var xPos = Categories.indexOf(PatientEventTypes[i].Fields[FieldEvent]);
                                  PatientOrderBy.push( {ID: ID,info:PatientEventTypes[i].Fields[FieldEvent], yBar: PatientEventTypes[i].PtNum,
                                                        xBar: xPos * xWidth , width: xWidth});
                              }
                        }
                     });
                     if(Categories.length>21){
                        xAxis.ticks(21)
                             .tickValues(makeArray(21,  function(i) { return i/21; }))
                             .tickFormat(function(d, i) { return null; });
                     } else{
                        xAxis.ticks(Categories.length)
                             .tickValues(makeArray(Categories.length,  function(i) { return i/Categories.length; }))
                             .tickFormat(function (d) {return Categories[d*Categories.length] ;    });
                     }
               } 

               x.domain([d3.min([d3.min(PatientOrderBy, function(d){return d.width;}),d3.min(PatientOrderBy, function(d){return d.xBar;})]),
                                 d3.max(PatientOrderBy, function(d){ return d.xBar + d.width;})]).nice();

               var tooltip = d3.select("body")
                               .attr("data-toggle", "tooltip")
                               .append("div")
                               .style("position", "absolute")
                               .style("z-index", "10")
                               .style("visibility", "hidden")
                               .text("a simple tooltip");

               SidePlot.append("g")
                       .attr("class", "x axis")
                       .attr("transform", "translate(0," +SideBarSize.height + ")")
                       .call(xAxis)
                       .selectAll("text")  
                       .style("text-anchor", "end")
                       .style("font-size", "12px")
                       .attr("dy", ".55em")
                       .attr("dx", "-.45em")
                       .attr("transform", function(d) {return "rotate(-75)"; })
                       ;
              SidePlot.append("g").append("text")
                       .attr("transform", "translate(0," +SideBarSize.height + ")")
                       .style("font-size", "12px")
                       .text(xTitle);

 
               SidePlot.append("g")
                       .attr("class", "y axis")
                       .call(yAxis)
                       .append("text")
                       .on("mouseover", function(d){
                           tooltip.text("click to reorder by SidePlot value");
                           return tooltip.style("visibility", "visible"); })
                       .on("mousemove", function(){
                           return tooltip.style("top",(d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
                       .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
                       .on("click", function(){
                           OrderBySidePlot(); 
                           dispatch.Update();
                           dispatch.DisplayPatients();})
                       .attr("transform", "rotate(-90)")
                       .attr("y", 2)
                       .attr("dy", "-.71em")
                       .style("font-size", "12px")
                       .style("text-anchor", "end")
                       .text(SidePlotEvent)
               ;
            
               var BarPlot_Horiz = SidePlot.append("g").selectAll("rect")
                       .data(PatientOrderBy)
                       .enter()
                         .append("rect")
                         .attr("x", function(d)     { return x(d.xBar);  })
                         .attr("y", function(d)     { return y(d.yBar); })   // rectangles draw from top down
                         .attr("width", function(d) { return Math.abs(x(d.width) - x(0));  })
                         .attr("height", function(d){ return PixelScale; }) 
                         .attr("fill", function(d){ 
                              var ColorShade =  d3.rgb("gray"); 
                              if(EventTypes.keys().indexOf(SidePlotEvent) !== -1) { ColorShade = d3.rgb(TimeLineColor(SidePlotEvent)); }
                              if(Categories.length>0){ 
                                   return ColorShade.brighter((Categories.indexOf(d.info) % 5)/2); }
                              return ColorShade;  })
                         .on("mouseover", function(d,i){
                              tooltip.text(d.ID + ": " + d.info);
                              return tooltip.style("visibility", "visible"); })
                         .on("mousemove", function(){
                              return tooltip.style("top",(d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
                         .on("mouseout", function(){return tooltip.style("visibility", "hidden");})
                       ;
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
                            
               y.domain([d3.min(Events,function(d) { return d.PtNum; })-2,
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
     function updateDisplay(msg) {
          console.log("==== DisplayPatientTimeLine  Module.js document.ready");
//          console.log(msg);
       	d = new Date();
       	thenDate = d.getTime();

          Events = msg.payload;
          console.log("Event count: " + Events.length);
         
          parseDate = d3.time.JAVASCRIPT_FORMAT ("%m/%d/%Y").parse;
          FormatDate = d3.time.JAVASCRIPT_FORMAT ("%x");
     
          var UniquePtIDs = [];
          Events.forEach(function(d) {
               d.Keep=true;
               if(d.Fields.date===null){ 
                  d.Keep=false;
               }else{
                  if(d.Fields.date instanceof Array){
                    for(var i=0;i<d.Fields.date.length;i++){ 
                        if(d.Fields.date[i]===null || parseDate(d.Fields.date[i])===null || !isValidDate(d.Fields.date[i])){ 
                            d.Keep = false;
                        }else{ 
                          d.Fields.date[i] = parseDate(d.Fields.date[i]);
                          if(i>0){if(d.Fields.date[i-1] > d.Fields.date[i]){
                                 d.Keep = false; }}
                        }
                    }
                  }else{ 
                     if(d.Fields.date === null || d.Fields.date === undefined || !isValidDate(d.Fields.date)){  
                              d.Keep=false;
                      }else{  d.Fields.date = parseDate(d.Fields.date); } 
                  }
               }
               d.PatientID = d.PatientID.match(/\w+\.\w+\.\w+/)[0];
               d.disabled = false;
               if(ShowEvents){
                  if(ShowEvents.indexOf(d.Name) === -1){  d.disabled = true;} }
               if(UniquePtIDs.indexOf(d.PatientID) === -1){ d.PtNum = UniquePtIDs.length; UniquePtIDs.push(d.PatientID);}
               else{ d.PtNum = UniquePtIDs.indexOf(d.PatientID); }
               d.showPatient = true;
               d.offset = 0; d.EventOffset=0; d.PatientHeight=1;   
          });
          
          d = new Date();
    	  nowDate = d.getTime();
		  console.log("Check Event dates & add flags: ", nowDate - thenDate);
		  thenDate = nowDate;

     
          console.log("Remove Invalid Dates");
          Events = Events.filter(function(d) { return d.Keep; });
          EventsByID = d3.nest()
                         .key(function(d) { return d.PatientID; })
                         .key(function(d) { return d.Name; })
                         .map(Events, d3.map);
 
       EventTypes = d3.map();
          Events.forEach(function(d){
             for (var field in d.Fields){
                 if(  EventTypes.has(d.Name)){
                   if(typeof EventTypes.get(d.Name)[field] !== "undefined"){
                     if(EventTypes.get(d.Name)[field].indexOf(d.Fields[field]) === -1){
                          EventTypes.get(d.Name)[field].push(d.Fields[field]) ; } }
                   else{  EventTypes.get(d.Name)[field] = [d.Fields[field]] ; 
                   }
                 }
                 else { var eType = {}; eType[field] = [d.Fields[field]];
                        EventTypes.set(d.Name, eType);
                        $("#Event1").append("<option value='"+ d.Name +"'>"+ d.Name +"</option>");
                        $("#Event2").append("<option value='"+ d.Name +"'>"+ d.Name +"</option>");
                      }
            }
         });          
     
              d = new Date();
    	  nowDate = d.getTime();
		  console.log("Map EventTypes: ", nowDate - thenDate);
		  thenDate = nowDate;

     
         CalculatedEvents.forEach(function(key, entry){
                var value = entry[0];
                if(!EventTypes.has(value.Event1) ||  !EventTypes.has(value.Event2) ){
                   console.log("Removing Calculated Event: " + key);
                   CalculatedEvents.remove(key);
                }
         });
         
         if(TimeLineInitialLoad){
            ShowEvents = EventTypes.keys();
            dispatch.LoadOptions();
            TimeLineInitialLoad=false;
            
         }
         if(OrderBy !== "--"){ OrderEvents();}
         if(AlignBy !== "--"){ AlignEvents();}
         
    	d = new Date();
    	nowDate = d.getTime();
		console.log("DisplayPatientTimeline: ", nowDate - thenDate);
		thenDate = nowDate;

         dispatch.DisplayPatients();

    	d = new Date();
    	nowDate = d.getTime();
		console.log("dispatch DisplayPatient: ", nowDate - thenDate);
		thenDate = nowDate;

     }

 	#-----------------------------------------
	function updateFeatureDisplay(elem){

	#	SidePlotEvent = this.value; 
	#	 if(SidePlotEvent === "+Add"){
	#		console.log("== changing SideBar with ", SidePlotEvent);
	#		OpenDialogForAddedEvents("SidePlot");
	#	 } else{ 
	#		console.log("== changing SideBar", SidePlotEvent);
	#		updateDisplay(); 
	#	 }

	}

	#-----------------------------------------
	function updateDisplayAlignment(elem){

	# AlignEvents(); 
	# updateDisplay()
  
	}
	#-----------------------------------------
	function updateDisplayOrder(elem){

	#  OrderBy = this.value; 
	#			 if(OrderBy === "+Add"){
	#				console.log("== changing OrderBy with ", OrderBy);
	#				OpenDialogForAddedEvents("OrderBy");
	#			 }else{
	#				console.log("== changing OrderBy ", OrderBy);
	#				OrderEvents();      
	#				updateDisplay();
	#			 }

	}

//--------------------------------------------------------------------------------------------------
     function AlignEvents(){
     
          console.log("========Align Event: "+ AlignBy);
          Events.forEach(function(d){ d.offset = 0; d.showPatient=true;});
          EventsByID.forEach(function(ID, Patient){
                         Patient.forEach(function(id, event){event.showPatient = true; event.offset=0;});});

          if (AlignBy === "AgeDx"){ 
          } else if(EventTypes.keys().indexOf(AlignBy) !== -1){
               EventsByID.forEach(function(ID, Patient){
                    if( Patient.has(AlignBy)){
                         var MinPatientAlignBy = d3.min(Patient.get(AlignBy), function(d) {var date = (d.Fields.date instanceof Array ? d3.min(d.Fields.date) : d.Fields.date);  return date;});
                         Events.filter(function(d){return d.PatientID === ID;})
                               .forEach(function(d){ d.offset = MinPatientAlignBy;});
                    }
                    else{          // hide Patients that can't be aligned
                         Events.filter(function(d){return d.PatientID === ID;})
                               .forEach(function(d){ d.showPatient = false; d.offset=0;});
                         Patient.forEach(function(id, event){event.showPatient = false; event.offset=0;});
                    }
               });
          }
     }     

//--------------------------------------------------------------------------------------------------
     function OrderEvents(){
     
          console.log("========Order Event: "+ OrderBy);
          var PatientOrderBy = [];

          if(CalculatedEvents.has(OrderBy) ){
                var event = CalculatedEvents.get(OrderBy)[0];
                PatientOrderBy = getDateDiff(OrderBy, event.Event1,event.Event2,""); 
                
               if(OrderBy === "Survival"){
                 PatientOrderBy.forEach(function(d){
                   if(EventsByID.get(d.ID).has("Status") && EventsByID.get(d.ID).get("Status")[0].Fields.status !== "Dead")
                      d.value = 1 - 1/d.value;
                   });
 //                console.log(PatientOrderBy)
              }
          } else if(EventTypes.keys().indexOf(OrderBy) !== -1){
               EventsByID.forEach(function(ID, Patient){
                    if( Patient.has(OrderBy)){
                         PatientOrderBy.push(d3.min(Patient.get(OrderBy), function(d) 
                              {var date = (d.Fields.date instanceof Array ? d3.min(d.Fields.date) : d.Fields.date);   
                                   return {ID: ID, value: date}; }));
                    } else{
                         PatientOrderBy.push({ID: ID, value: 0} );
                    }   });
          } 
   
          PatientOrderBy.sort(DescendingValues).forEach(function(Ordered, i){
                         Events.filter(function(d){return d.PatientID === Ordered.ID;})
                                   .forEach(function(d){ d.PtNum = i;});
                         if(EventsByID.has(Ordered.ID)){EventsByID.get(Ordered.ID)
                                   .forEach(function(d){ d.PtNum = i;});}
               });
//          console.log("Reordered")
//          console.log(PatientOrderBy)
          return true;
     }     

//--------------------------------------------------------------------------------------------------
     function OrderBySidePlot(){
     
          console.log("========Order by SidePlot: "+ SidePlotEvent);
          var PatientOrderBy = [];

          OrderBy = "--";
          if(CalculatedEvents.has(SidePlotEvent) ){
                var event = CalculatedEvents.get(SidePlotEvent)[0];
                PatientOrderBy = getDateDiff(SidePlotEvent, event.Event1,event.Event2,""); OrderBy=SidePlotEvent;
          
             if(SidePlotEvent === "Survival"){
                       PatientOrderBy.forEach(function(d){
                            if(EventsByID.get(d.ID).has("Status") & EventsByID.get(d.ID).get("Status")[0].Fields.status !== "Dead")
                                d.value = 1 -1/d.value;
                       });
              }
              PatientOrderBy.sort(DescendingValues);
              
          } else if(CategoryEvents.indexOf(SidePlotEvent) !== -1){
                     var MainEvent = SidePlotEvent.match(/\w+/)[0];
                     var FieldEvent = SidePlotEvent.match(/\w+$/)[0];
                
               EventsByID.forEach(function(ID, Patient){
                    PatientOrderBy.push({ID:ID, value: []});
                    if(Patient.has(MainEvent) && Patient.get(MainEvent)[0].showPatient){
                         Patient.get(MainEvent).forEach(function(namedEvent){
                           var patientNum = PatientOrderBy.length -1 ;
                           PatientOrderBy[patientNum].value.push(namedEvent.Fields[FieldEvent]);
                         });
                     }
               });
               
               PatientOrderBy.sort(function(a, b){ 
                  var first = a.value.sort().join().toLowerCase();
                  var second = b.value.sort().join().toLowerCase();
                   if( first < second ) return -1;
                   if( first > second ) return 1;
                   return 0;
               });
          }
          
          PatientOrderBy.forEach(function(Ordered, i){
                         Events.filter(function(d){return d.PatientID === Ordered.ID;})
                                   .forEach(function(d){ d.PtNum = i;});
                         if(EventsByID.has(Ordered.ID)){EventsByID.get(Ordered.ID)
                                   .forEach(function(d){ d.PtNum = i;});}
               });
     }     
 
 //--------------------------------------------------------------------------------------------------     
     function ToggleVisibleEvent(d){
         
         var hide = false;
         var newFilters = [];
      
         ShowEvents.forEach(function (f) {
           if (d === f) {  
                hide = true;
                console.log("Hiding " + d);
                Events.forEach(function(D){ 
                     if(D.Name === d) {D.disabled=true;}});
           } else { newFilters.push(f);}
         });
     
          // Hide the shape or show it
          if (hide) {  d3.select(this).style("opacity", 0.2);
         } else {
           d3.select(this).style("opacity", 1);
           newFilters.push(d);
           Events.forEach(function(D){ 
                     if(D.Name === d) {D.disabled=false;}});
          }
          ShowEvents = newFilters;
          dispatch.DisplayPatients();
     }
 
 
 //--------------------------------------------------------------------------------------------------     
     function getDateDiff(Name, Event1, Event2, TimeScale){
        d = new Date();
		thenDate = d.getTime();
      
       var DateDiff = []; var TimeScaleValue=1;
       if(TimeScale==="Days"){TimeScaleValue=OneDay;}
       else if(TimeScale ==="Months"){TimeScaleValue=OneDay*30.425;}
       else if(TimeScale==="Years"){ TimeScaleValue = OneDay*365.25;}
               
       EventsByID.forEach(function(ID, Patient){
         var dateDiff = 0; var date1, date2;
             
           if(Patient.has(Event1) && Patient.has(Event2) ){
             if(Patient.get(Event1)[0].Fields.date.length >1){
                   date1 = Patient.get(Event1).sort(AscendingStartDate)[0].Fields.date[0]; }
             else{ date1 = Patient.get(Event1).sort(AscendingDate)[0].Fields.date        ;}
             
             if(Patient.get(Event2)[0].Fields.date.length >1){
                   date2 = Patient.get(Event2).sort(AscendingStartDate)[0].Fields.date[0]; }
             else{ date2 = Patient.get(Event2).sort(AscendingDate)[0].Fields.date        ; }
                    
             dateDiff = (date2 - date1 )/TimeScaleValue;
           }
           else{ dateDiff=null;}
               
           DateDiff.push( {ID: ID,PtNum: Patient.get(Patient.keys()[0])[0].PtNum, value: dateDiff, Scale: TimeScale});
       });
       
       	d = new Date();
       	nowDate = d.getTime();
		console.log("getDateDiff: ", nowDate - thenDate);
		thenDate = nowDate;

       return DateDiff;
     }
     
//--------------------------------------------------------------------------------------------------     
     function getHorizontalBarSize(Patient){
     
       var BarSizes = [];
       Patient.forEach(function(d){
               var xBar = 0; var barWidth = ~~d.value;
               if(d.value < 0){ xBar = ~~d.value; barWidth = Math.abs(d.value);  }
               BarSizes.push( {ID: d.ID, info: ~~d.value, Scale: d.Scale, xBar: xBar, yBar: d.PtNum,  width: barWidth});
       }) ;
       return BarSizes;
     }
     
//--------------------------------------------------------------------------------------------
     function HandleWindowResize(){
          TimeLineDisplay.width($(window).width() * 0.95);
          TimeLineDisplay.height($(window).height() * 1.05);

          if(!TimeLineInitialLoad) {dispatch.DisplayPatients();}
     }

//--------------------------------------------------------------------------------------------
     function LogTime(t, TimeScale){ 
        TimeScale = typeof TimeScale !== 'undefined' ? TimeScale : OneDay;
        if(AlignBy === "--"){ return t;}
        else{ var Dir = (t<0 ? -1 : 1); 
              return Dir * Math.log(Math.abs(t/TimeScale)+1)/Math.log(2); }  
     }     

//--------------------------------------------------------------------------------------------
     function timelineD3PlotBrushReader(){
          currentlySelectedRegion = TimeLined3PlotBrush.extent();
  
          x1=currentlySelectedRegion[0][0];
          y1=currentlySelectedRegion[0][1];
          x2=currentlySelectedRegion[1][0];
          y2=currentlySelectedRegion[1][1];
          EventInRange = false;
          
          for(var i=0; i < Events.length; i++){
              var event = Events[i];
              if(event.PtNum >= y1 & event.PtNum <= y2){
			     // Patient within range
            
                 if(event.Fields.date.length>1 ){
                    if( (LogTime(event.Fields.date[0]-event.offset) >=x1 & LogTime(event.Fields.date[0]-event.offset) <= x2) ||
	                    (LogTime(event.Fields.date[1]-event.offset) >=x1 & LogTime(event.Fields.date[1]-event.offset) <= x2) ){
	                  EventInRange = true;
	                  break;
                    }
                 }else{
                    if( LogTime(event.Fields.date-event.offset) >=x1 & LogTime(event.Fields.date-event.offset) <= x2) {
                        EventInRange = true;
                        break;
                     } //if
                 } //else
              } //if
          } // for i

         if(EventInRange){
             sendSelectionMenu.prop("disabled",false);
          }else{
             sendSelectionMenu.prop("disabled",true);
          }
     } // d3PlotBrushReader

//--------------------------------------------------------------------------------------------------
   
   return{
          init: function(){
                hub.addOnDocumentReadyFunction(initializeUI);
                hub.registerSelectionDestination(selectionDestinationsOfferedHere, thisModulesOutermostDiv);
                hub.addMessageHandler("sendSelectionTo_Timelines", handlePatientIDs);
                hub.addMessageHandler("DisplayPatientTimeLine", DisplayPatientTimeLine);
                hub.addMessageHandler("TimelinesHandlePatientIDs", handlePatientIDs);
                hub.addMessageHandler("FilterTimelinePatients", FilterTimelinePatients);
                hub.addMessageHandler("datasetSpecified", datasetSpecified);
                hub.setTitle("Timelines");
 //               hub.addSocketConnectedFunction(loadPatientDemoData);
          },
     };

}); // TimeLineModule
//----------------------------------------------------------------------------------------------------
PatientTimeLine = TimeLineModule();
PatientTimeLine.init();


	  
