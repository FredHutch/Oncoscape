(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTimelines', timelines);

    /** @ngInject */
    function timelines() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/timelines/timelines.html',
            controller: TimelinesController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function TimelinesController(osApi, osHistory, $state, $scope, $stateParams, $window, $document, moment, d3) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Variables
            var dataProcessed;
            var dataPatients;
            var dataEvents;
            var d3ScaleX;
            var d3ScaleY;
            var minZoom = 0;


            // View Model
            var vm = this;
                vm.selShow = false;
                vm.selPatient;
                vm.selEvent;
                vm.selFields = [];
                vm.datasource = $stateParams.datasource;
                vm.optCohortModes;
                vm.optCohortMode;
                vm.timescaleunit;
                vm.timescales;
                vm.timescale;
                vm.features;
                vm.feature;
                vm.filters;
                vm.filter;
                vm.events;
                vm.sorts;
                vm.sort;
                vm.align;
                vm.optCohortModes = [{name:"Highlight"},{name:"Filter"}];
                vm.optCohortMode = vm.optCohortModes[0];
          
            // Elements
            var elChart = angular.element("#timelines-chart");
            var d3Chart = d3.select("#timelines-chart").append("svg")
                .attr("id", "chart")
                .style({width:'100%'});
            var d3Axis = d3Chart.append("g")
                .attr({"class":"axis"})
                .style({'shape-rendering': 'crispEdges',"stroke-width": "1.0", "stroke": "#000","fill": "none"});
            var d3BarsSvg = d3Chart.append("svg")  // Used To Clip Overflow
                .attr({"class":"bars-svg"});
            var d3BarsBackground = d3BarsSvg.append("rect") // Serves As Hit Area For Zoom
                .attr({"width": elChart.width(), "height": $window.innerHeight - 75 - 10 - 130-50 })
                .style({fill:"#FFFFFF"}); //,"cursor": "move" });
            var d3Bars = d3BarsSvg.append("g")
                .attr({"class":"bars"});  // Container For Bars

            // History Integration
            var selectedIds = (osHistory.getPatientSelection() == null) ? null : osHistory.getPatientSelection().ids;
            function saveSelected() {
                selectedIds = d3Bars.selectAll(".timeline-selected")[0].map( function (p) { return p.__data__.id; }  )
                if (selectedIds.length==0) selectedIds = d3Bars.selectAll()[0].map( function (p) { return p.__data__.id; }  )
                osHistory.addPatientSelection("Patient History", "Manual Selection",
                    selectedIds
                );
                if (vm.optCohortMode.name=="Filter") draw();
            }

            var zoom;
            var zoomed = function(){
                if (d3.event.shiftKey) return;

                var scale = minZoom * d3.event.scale;
                if (scale<minZoom) scale = minZoom;
                var translate= d3.event.translate[1];

                var ch = $window.innerHeight - 75 - 10 - 130- 50;
                var rh = (dataProcessed.patients.length*20) * scale;
                var dh = ch - rh;   // Delta height - Used For Offset

                if (translate>0) translate=0;
                if (translate<dh) translate=dh;

                zoom.translate([d3.event.translate[0],translate]);
                var rowH = (20 * scale);
                var rowsVisible = (ch / rowH);
                var rowOffset = Math.abs(translate / rowH);
                  brush.y(d3.scale.linear().range([0,ch]).domain([rowOffset, rowOffset+rowsVisible]))

                
                d3Bars.attr("transform","translate(1,"+translate+")scale(1," + scale + ")");
            };

            var brush;
            var brushing = false;
            var onBrushStart = function(){
                if (!d3.event.sourceEvent.shiftKey) {
                    d3.event.target.clear();
                    d3.select(this).call(d3.event.target);
                }else{
                    brushing = true;
                }
            }
            var onBrush = function(){
                if (!brushing) return;
                var extent = brush.extent();
                var lower = Math.floor(extent[0][1]);
                var upper = Math.floor(extent[1][1]);
                d3Bars.selectAll("g.timeline")
                    .each( function(d, i){
                        d3.select(this.firstChild).classed("timeline-selected", (i>=lower && i<=upper) );
                    });
            }
            var onBrushEnd = function(){
                if (!brushing) return;
                brushing = false;
                d3.event.target.clear();
                d3.select(this).call(d3.event.target);    
                saveSelected();
            }


            var draw = function(){

                // Helpers
                var hRow = 20;
                var hChart = $window.innerHeight - 75 - 10 - 130;
                var wChart = $window.innerWidth - 300;
                if (wChart > 760)  wChart -= 140;
                if (angular.element(".tray-right").attr("locked")=="false"){
                    wChart += 300;
                } 
                
                dataProcessed = processData(dataPatients, vm.align, vm.sort);
                d3ScaleX = d3.scale.linear().domain( dataProcessed.bounds ).range([10, wChart-10]).nice();
                d3ScaleY = d3.scale.linear().domain([0, dataProcessed.patients.length]).range(0,hChart-50).nice();
                minZoom = (hChart-50) / (dataProcessed.patients.length * 20)
                
                // Chart
                d3Chart.attr( {'height': hChart+"px"})
                d3BarsSvg.attr( {'height' : (hChart-50)+"px", 'width':wChart+"px"} );
                d3BarsBackground.attr( {'height' : (hChart-50)+"px", 'width':wChart+"px"} );
                d3Bars.attr("transform","scale(1," + minZoom + ")");

                // Rows
                var rows = d3Bars.selectAll("g.timeline").data( dataProcessed.patients );
                    rows.exit().remove();
                    rows.enter().append("g").attr({ 'class' : 'timeline' })
                        .on("mousedown", function(){
                            if (!d3.event.shiftKey) d3Bars.selectAll(".timeline-selected").classed("timeline-selected", false);
                        })
                        
                    // rows
                        .attr({
                            'width': wChart,
                            'height': hRow,
                            'transform': function(d, i) { return "translate(0," +  (i * hRow)+ ")"; }
                        })
                        .append("rect")
                        .attr({
                            'class': 'timeline-row',
                            'width': 0,
                            'height': hRow
                        });


                    if (vm.optCohortMode.name=="Highlight" && selectedIds){
                        rows
                            .each( function(d){
                                var selected = (selectedIds.indexOf(d.id)>=0);
                                var e = d3.select(this.firstChild);
                                e.classed("timeline-selected", selected );
                        });
                    }else{
                        rows
                            .each( function(){
                                var e = d3.select(this.firstChild);
                                e.classed("timeline-selected", false );
                        });
                    }

                // Columns
                var cols = rows.selectAll("rect.event").data( function(d) { return d.filteredEvents; });
                    cols.exit().remove();
                    cols.enter().append("rect").attr({'class':'event'})
                        .on("mouseover", function(){
                                var event = dataEvents[this.__data__.id];
                                vm.selPatient = event.PatientID;
                                vm.selEvent = event.Name;
                                var fields = [];
                                for(var field in event.Fields) {
                                    if (event.Fields[field]!=null){
                                        if ( field=="date" && angular.isArray(event.Fields[field]) ){
                                            fields.push( {name:"Start Date", value:event.Fields[field][0] })
                                            fields.push( {name:"End Start", value:event.Fields[field][1] })
                                        }else{
                                            fields.push(
                                                {name:field, value:event.Fields[field]}
                                            );
                                        }
                                    }
                                }
                                vm.selShow = true;
                                vm.selFields = fields;
                                $scope.$apply();
                            })
                            .on("mouseout", function(){
                                vm.selShow = false;
                                $scope.$apply();
                            });
                    cols.transition()
                        .style({'fill':function(d){ return d.color; }})
                        .attr({
                            'height':function(d){ return (d.name == "Radiation" || d.name=="Drug") ? hRow/2 : hRow; },
                            'width':function(d){ return (d.endValue==null) ? 3 : (d3ScaleX(d.endValue) - d3ScaleX(d.startValue)); },
                            'x': function(d) { return Math.round(d3ScaleX(d.startValue)); },
                            'y': function(d) { return ((d.name == "Radiation") ? hRow/2 : 0); }
                        });

                    var daysToUnit = function(d){
                        if (Math.abs(d)==0) return d;
                        if (Math.abs(d)<30) return d+" Days";
                        if (Math.abs(d)<360) return Math.round( (d/30.4) * 10 ) / 10 + " Months";
                        return Math.round( (d/365) * 10 ) / 10 + " Years";
                    }
                    var tlScale = d3.svg.axis()
                        .scale(d3ScaleX)
                        .orient("bottom")
                        .ticks(8);

                    if (vm.timescale.name=='Log'){
                        tlScale = tlScale.tickFormat(function (d) { 
                            return daysToUnit(Math.round((d<0 ? -1 : 1) * (Math.pow(2, (Math.abs(d)))-1) *100)/100);
                        });
                    }else{
                        tlScale = tlScale.tickFormat(function (d) {
                            return daysToUnit(d);
                        });
                    }

                // Brush
                brush = d3.svg.brush()
                    .x(d3ScaleX)
                    .y(d3.scale.linear().range([0,hChart]).domain([0, dataProcessed.patients.length]))
                    .on("brush", onBrush)
                    .on("brushstart", onBrushStart)
                    .on("brushend", onBrushEnd);
                d3BarsBackground.call(brush);

                // Clear Selections On MouseDown
                d3BarsBackground.on("mousedown", function(){
                    if (!d3.event.shiftKey) d3Bars.selectAll(".timeline-selected").classed("timeline-selected", false);
                });

                // Zoom
                zoom = d3.behavior.zoom()
                    .x( d3ScaleX )
                    .y( d3ScaleY )
                    .translate([0,0])
                    .scale(1, minZoom )
                    .on("zoom", zoomed);
                d3BarsBackground.call(zoom);


                // Axis
                d3Axis.attr({
                    "class": "timeline-axis",
                    "width": 100,
                    transform: function() { return "translate(0," +  (hChart-50) + ")"; }
                });
                d3Axis.call( tlScale );
                
            };



            // Populates ProcessedData Object With Values Consistant With ViewState
            var processData = function (data, align, sort){

                    var processedData = {};

                    // Store List Of Active Events
                    processedData.events = vm.events.filter( function(events) { return events.selected; });

                    // Remove Patients That Don't Have Align Property + Possibly !Selected
                    processedData.patients = data.filter(function(patient){
                        if (vm.filter.name=="Only Alive" && patient.dead) return false;
                        if (vm.filter.name=="Only Dead" && !patient.dead) return false;
                        if (!patient.hasOwnProperty("__"+this.align)) return false;
                        if (this.filter && this.ids){
                            if (this.ids.indexOf(patient.id)==-1) return false;
                        }
                        return true;

                    }, {'align':align.name, 'filter':(vm.optCohortMode.name=="Filter"), 'ids':selectedIds});

                    // Sort Patients On Align Property    
                    if (sort.name=="Survival"){
                        processedData.patients = processedData.patients.sort(function(a,b){
                            if (a.dead==b.dead){
                                return (a.calcEvents[sort.index].value>b.calcEvents[sort.index].value) ? 1 : -1;
                            }else{
                                return (a.dead) ? 1 : -1;
                            }
                            
                        }, sort);
                    }else{
                        processedData.patients = processedData.patients.sort(function(a,b){
                            return (a.calcEvents[sort.index].value>b.calcEvents[sort.index].value) ? 1 : -1;
                        }, sort);
                    }


                    // Adjust Start + End Dates To Align Property
                    processedData.patients.forEach(function(patient){

                        patient.filteredEvents = patient.dateEvents.filter(function(dateEvent){
                            for (var i=0; i<this.length; i++){
                                if (this[i].name==dateEvent.name) return true;
                            }
                            return false;
                        }, processedData.events);

                        patient.filteredEvents.forEach(function(evt){
                            evt.startValue = vm.timescale.timeFn(evt.start + this);
                            evt.endValue = (evt.end!=null) ? vm.timescale.timeFn(evt.end + this) : null;
                        }, -patient["__"+this["align"].name].start)

                    }, {"align":align, "events":processedData.events});

                    // Calculate Event Bounds Min, Max
                    processedData.bounds = processedData.patients.reduce( function( prev, current ) {
                        // Min Max For Individual Patients
                        var patientMinMax = current.filteredEvents.reduce(function( prev, current ) {
                            
                            return [
                                Math.min(current.startValue, prev[0]),
                                Math.max((current.endValue==null) ? current.startValue : current.endValue, prev[1])
                            ]

                        }, [Infinity, -Infinity]);
                        
                        return [
                            Math.min(patientMinMax[0], prev[0]),
                            Math.max(patientMinMax[1], prev[1])
                        ]   
                    }, [Infinity, -Infinity] );
                    return processedData;
            };



            // Initialize
            (function(){

                var color = function(d){
                    var status = d.name;
                    var rv = 
                        (status==="Birth") ?  "#17becf" : 
                        (status==="Diagnosis") ? "#8c564b" :
                        (status==="Pathology") ? "#7f7f7f" :
                        (status==="Progression") ? "#1f77b4" :
                        (status==="Absent") ? "#000000" :
                        (status==="Status") ? "#bcbd22" :
                        (status==="Radiation") ? "#e7969c" :
                        (status==="Procedure") ? "#ff7f0e" :
                        (status==="Encounter") ? "#d62728" :
                        (status==="Drug") ? "#9467bd" :
                        "black";
                        return rv;
                };   

                // Data Clean Up Functions
                var processEventData = function(events){
                    return Object.keys(events).map(function(v) {
                            var rv =  { "name": v, "selected": true };
                            rv.color = rv.__color = color(rv);
                            return rv;
                    });
                };

                var processFeatureData = function(patients){
                    return patients[0].calcEvents.map(function(d, i) {
                        return { "name": d.name, "index": i }
                    });
                };

                var processPatientData = function(patients, dead){

                    patients = Object.keys(patients).map(function(key) {
                        var val = patients[key];
                        val.id = key;
                        return val;
                    });
                    for (var i = 0; i < patients.length; i++) {

                        // Create References For Faster Subsequent Lookups
                        var p = patients[i];
                        var m = moment;
                        var mf = "YYYY-MM-DD";


                        // Map Start Dates
                        var dateSingle =
                            p.dateEvents
                            .filter(function(d) {
                                return d.eventOrder === 'single'
                            })
                            .map(function(d) {
                                return {
                                    "start": m(d.date, mf).unix(),
                                    "end": null,
                                    "name": d.name, 
                                    "id":d.eventID
                                };
                            });

                        // Map Start + End Dates
                        var endDates = p.dateEvents
                            .filter(function(d) { return d.eventOrder==='end'; })
                            .map(function(d){ return {"end":m(d.date, mf).unix(), "id":d.eventID}; });
                        var startDates = p.dateEvents
                            .filter(function(d) { return d.eventOrder==='start'; })
                            .map(function(d){ return {"start":m(d.date, mf).unix(),"name":d.name, "id":d.eventID}; });
                        startDates
                            .forEach(function(sd){ sd.end = endDates
                                .filter(function(ed) { return ed.id==sd.id} )[0].end });

                        // Join Single + Multiple Date Events
                        p.dateEvents = (startDates.length>0) ? startDates.concat(dateSingle) : dateSingle;
                        p.dateEvents.forEach(function(d){
                            d.color = color(d);
                            p["__"+d.name] = d;
                            if (d.name=="Status"){
                                p.dead = (dead.indexOf(d.id)!=-1);
                            }
                            
                         });
                    }
                    return patients;
                };

                osApi.setBusy(true)("Loading Dataset");
                osApi.setDataset(vm.datasource).then(function() {
                    osApi.getTimelines().then(function(response) {

                        // TimeScales
                        vm.timescales = [
                            {name:'Log', 
                                timeFn: function(val){
                                    return (val<0 ? -1 : 1) * Math.log(Math.abs((val*1000)/86400000)+1)/Math.log(2)
                            }},
                            {name:'Linear', 
                                timeFn: function(val){
                                    return moment.duration(val*1000).asDays()
                            }}
                        ];
                        vm.timescale = vm.timescales[0];

                        // Clean Data + Set Default VM
                        dataPatients = processPatientData(response.payload.pts, response.payload.eventTypes.Status.status.Dead);
                        dataEvents = response.payload.events;
                        vm.sorts = processFeatureData(dataPatients);
                        
                        vm.filters = [
                            {name:'Alive + Dead'},
                            {name:'Only Alive'},
                            {name:'Only Dead'}
                        ];
                        vm.filter = vm.filters[0];


                        var features = processFeatureData(dataPatients);
                        features.unshift({index:-1, name:'None'});
                        vm.features =  features;
                        vm.feature = vm.features[0];
                        vm.events = processEventData(response.payload.eventTypes);

                        // Set Defaults Align By Drug, Order By Survial, Hide Birth
                        vm.sort = vm.sorts[1];
                        vm.events.forEach(function(e){
                            if (e.name=="Birth") { e.selected = false; e.color = "#FEFEFE"; }
                            if (e.name=="Diagnosis") this.align = e;
                        }, vm);

                        // Register Watch
                        $scope.$watchGroup(['vm.feature', 'vm.sort', 'vm.align', 'vm.timescale', 'vm.filter'], draw);
                        angular.element($window).bind('resize', draw);
                      
                        $scope.$watch("vm.optCohortMode", draw );   // Triggers Inital Draw

                        // History
                        osHistory.onPatientSelectionChange.add(function(selection) {
                            selectedIds = selection.ids;
                            draw();
                        });
                        osApi.setBusy(false);
                    });
                });
            })();


            // Event Handlers
            vm.resize = function(){
                draw();
            }
            vm.updateEventColor = function(item){
                item.selected = !item.selected;
                item.color = (item.selected) ? item.__color : "#FEFEFE";
                draw();
            }

        }
    }
})();
