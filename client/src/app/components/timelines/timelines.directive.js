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
        function TimelinesController(osApi, $state, $scope, $stateParams, $window, $document, moment, d3, _) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Variables
            var data;
            var dataEvents;
            var patientHeight = 100;
            var rows, cells;

            // Elements
            var d3ScaleX;
            var d3ScaleY;

            // Elements
            var elChart = angular.element("#timelines-chart");
            var d3Chart = d3.select("#timelines-chart").append("svg").attr("id", "chart");
            var d3TimelineClip = d3Chart.append("clipPath").attr("id","clip");
            var d3TimelineClipArea = d3TimelineClip.append("rect").style({"fill":"#e20074"});
            var d3TimelineClipContainer = d3Chart.append("g").style("clip-path", "url(#clip)");
            var d3Timeline =  d3TimelineClipContainer.append("g");
            var d3AxisTimeline = d3Chart.append("g").style({'shape-rendering': 'crispEdges','stroke': 'none'}).attr({"class":"d3AxisTimeline"}); 
            

            // View State
            var vm = this;
            vm.selShow = false;
            vm.selPatient;
            vm.selEvent;
            vm.selFields = [];
            vm.sliderMinValue = 1;
            vm.sliderMaxValue = 1000;
            vm.sliderMin = 1;
            vm.sliderMax = 1000;
            vm.datasource = $stateParams.datasource;
            vm.optCohortPatients;
            vm.optCohortPatient;
            vm.timescaleunit;
            vm.timescales;
            vm.timescale;
            vm.features;
            vm.feature;
            vm.events;
            vm.sorts;
            vm.sort;
            vm.align;

            vm.updateEventColor = function(item){
                item.selected = !item.selected;
                item.color = (item.selected) ? item.__color : "#FEFEFE";
                draw();
            }

            var scale = function(){

                var chartHeight = $window.innerHeight - 75 - 10 - 130;    // Height Of Chart
                var totalHeight = vm.sliderMax * patientHeight; // Unscaled Height Of All Patients
                var visibleHeight = (vm.sliderMaxValue - vm.sliderMinValue) * patientHeight;
                
                var yScale = chartHeight / visibleHeight;
                var yOffset = - vm.sliderMinValue * (patientHeight * yScale);

                 d3Timeline.attr("transform", "translate(0, "+yOffset+")scale(1, " + yScale + ")");
            }
  
            // Main Draw Function
            var draw = function(){
                var processedData = processData(data, vm.align, vm.sort);
                var w = elChart.width();
                var h = $window.innerHeight - 75 - 80 - 50; // Nav, H2, Footer
                if (angular.element(".tray").attr("locked")=="false") w += 300;
                updateScaleZoom(w, h, processedData);
                updateTimeline(w, h, processedData);
                drawAxis(w,h);
                scale()
            }
            // Listen For Resize
            vm.resize = function(e){ _.debounce(draw, 300); }

            function initializeCohort(vm, osApi){
                var cohortPatient = osApi.getCohortPatient();
                vm.optCohortPatients = cohortPatient.get();
                vm.optCohortPatient = vm.optCohortPatients[0];
                vm.addCohortPatient = function(e){
                    var cohortName = "TL " + moment().format('- H:mm - M/D/YY');
                    //var cohortIds = chart.$('node[nodeType="patient"]:selected').map(function(ele){ return ele.data().id.toUpperCase() });
                //var cohort = {name:cohortName, ids:cohortIds};
                    vm.optCohortPatients.push(cohort);
                    vm.optCohortPatient = cohort;
                }
                $scope.$watch("vm.optCohortPatient", draw );



            }

            function makeSliderDragable(){

                var pos = function(f) {
                    try {
                        return [(f.clientX || f.originalEvent.clientX || f.originalEvent.touches[0].clientX), (f.clientY || f.originalEvent.clientY || f.originalEvent.touches[0].clientY)];
                    } catch (e) {
                        return ['x', 'y'];
                    }
                };

                // Stash Elements
                var elJoint = angular.element(".ngrs-join");
                var elTop = angular.element(".ngrs-handle-min");
                var elBottom = angular.element(".ngrs-handle-max");
                var state = {};

                elJoint.bind("mousedown", function(e){
                    
                    state.height = angular.element(e.currentTarget.parentElement).height();
                    state.delta = 0;
                    state.mouseRefPos = pos(e)[1];
                    state.bounds = [
                        parseInt(elTop[0].style.top),
                        100-parseInt(elBottom[0].style.top),
                        parseInt(elBottom[0].style.top)
                    ];

                    $document.bind("mousemove", function(e) {
                        e.preventDefault();
                        
                        // Determine Percentage Movement
                        state.delta =  ( (pos(e)[1] - state.mouseRefPos) / state.height ) * 100;

                        // Limit Delta To Ensure Bar Height
                        state.delta = (state.delta>0) ? 
                            (state.delta > state.bounds[1] ) ? state.bounds[1] : state.delta
                            :
                            (Math.abs(state.delta) > state.bounds[0]) ? -state.bounds[0] : state.delta;

                        var top = state.bounds[0] + state.delta;
                        var bottom = state.bounds[2] + state.delta;
                        elTop.css({top: top + "%"});
                        elJoint.css({top:top + "%", bottom: (100-bottom)+ "%"});
                        elBottom.css({top: bottom + "%" });
                        
                    }).bind("mouseup", function(e){
                        var d = Math.round((vm.sliderMax / 100) * state.delta);
                        vm.sliderMinValue += d;
                        vm.sliderMaxValue += d;
                        $scope.$apply();
                        $document.off("mouseup");
                        $document.off("mousemove");
                    });

                })
            };

            var updateTimeline = function(w, h, processedData){
                
                rows = d3Timeline.selectAll("g.timeline").data( processedData.patients );
                rows.enter().append("g")
                        .attr({
                                'width' : w,
                                'height' : patientHeight,
                                'class' : 'timeline',
                                'transform': function(d, i) { return "translate(0," +  (i * patientHeight)+ ")"; }
                        })
                        .append("rect")
                        .attr({
                            'width': w,
                            'height': 1,
                            'y': patientHeight-1,
                            'fill': '#DDDDDD'
                        })
                rows.exit().remove();

                 // Data Bind Event
                cells = rows.selectAll("rect.timeline")
                     .data( function(d) {
                        return d.filteredEvents;
                    });

                    cells.enter()
                        .append("rect")
                        .style({'opacity':1, 'fill': function(d){ return d.color; }})
                        .attr({
                            'class':'timeline',
                            'height':function(d){ return (d.name == "Radiation" || d.name=="Drug") ? (patientHeight/2)-1 : (patientHeight-1); },
                            'width': function(d){ return (d.endValue==null) ? 3 : (d3ScaleX(d.endValue) - d3ScaleX(d.startValue)); },
                            'x': function(d) { return Math.round(d3ScaleX(d.startValue)); },
                            'y': function(d) { return (d.name == "Radiation") ? patientHeight/2 : 0; }
                        }).on("mouseover", function(d,i){
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
                        .on("mouseout", function(d,i){
                            vm.selShow = false;
                            $scope.$apply();
                        });

                    cells.transition()
                        .style({'opacity':1, 'fill':function(d){ return d.color; }})
                        .attr({
                            'width':function(d){ return (d.endValue==null) ? 3 : (d3ScaleX(d.endValue) - d3ScaleX(d.startValue)); },
                            'x': function(d) { return Math.round(d3ScaleX(d.startValue)); }
                        });

                    cells.exit().remove();
            }

            var updateScaleZoom = function(w, h, processedData){
                d3Chart.attr({
                    "width": w,
                    "height": h
                });
                d3TimelineClipArea.attr({
                    width:w,
                    height: h-50
                });

                d3ScaleX = d3.scale.linear().domain( processedData.bounds ).range([0, w]);
                //d3ScaleY = d3.scale.linear().domain( [0, processedData.patients.length] ). range([0, h]);                
            }

            var drawAxis = function(w, h){
                
                var tlScale = d3.svg.axis()
                    .scale(d3ScaleX)
                    .orient("bottom")
                    .ticks(5);
                if (vm.timescale.name=='Log'){
                    tlScale = tlScale.tickFormat(function (d) { 
                        var Dir = (d<0 ? -1 : 1); 
                        return Math.round(Dir * (Math.pow(2, (Math.abs(d)))-1) *100)/100;
                    });
                    vm.timescaleunit = "Days";
                }else{
                    tlScale = tlScale.tickFormat(function (d) { 
                        return moment.unix(d).year();
                    });
                    vm.timescaleunit = "Year";
                }
                
                d3AxisTimeline.attr({
                    "width": 100,
                    transform: function(d, i) { return "translate(0," +  (h-50) + ")"; }
                }).style({
                    "fill": "none",
                    "stroke-width": "1.0",
                    "stroke": "#000",
                    "shape-rendering": "crispEdges"
                });
                d3AxisTimeline.call( tlScale );
                
            }

            // Populates ProcessedData Object With Values Consistant With ViewState
            var processData = function (data, align, sort){

                    var processedData = {};

                    // Store List Of Active Events
                    processedData.events = vm.events.filter( function(events) { return events.selected; });

                    // Remove Patients That Don't Have Align Property
                    processedData.patients = data.filter(function(patient){
                        return patient.hasOwnProperty("__"+this.name);
                    }, align);
                
                    // Remove Patients That Don't Have A Death Date If Sort by Survival
                    if (sort.name=="Survival"){
                        processedData.patients = processedData.patients.filter(function(patient){
                            if (angular.isUndefined(patient.__Status)) return false;
                            if (angular.isUndefined(patient.__Status.start)) return false;
                            return true;
                        });
                    }

                    // Sort Patients On Align Property    
                    processedData.patients = processedData.patients.sort(function(a,b){
                        return (a.calcEvents[sort.index].value>b.calcEvents[sort.index].value) ? 1 : -1;
                    }, sort);

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


                    vm.sliderMinValue = 0;
                    vm.sliderMax = vm.sliderMaxValue = processedData.patients.length;

                    return processedData;
            };
            var loadData = function(){

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
                }
                var processFeatureData = function(patients){
                    return patients[0].calcEvents.map(function(d, i) {
                        return { "name": d.name, "index": i }
                    });
                }
                var processPatientData = function(patients){

                     // Load & Normalize Data (Should be done on server)
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
                         });
                    }
                    return patients;
                }

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
                                    return val;
                            }}
                        ];
                        vm.timescale = vm.timescales[0];

                        // Clean Data + Set Default VM
                        data = processPatientData(response.payload.pts);
                        dataEvents = response.payload.events;
                        vm.sorts = processFeatureData(data);
                        
                        var features = processFeatureData(data);
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
                        $scope.$watchGroup(['vm.feature', 'vm.sort', 'vm.align', 'vm.timescale'], draw);
                        $scope.$watchGroup(['vm.sliderMinValue', 'vm.sliderMaxValue'], scale);
                        angular.element($window).bind('resize', function(e){
                            draw();
                        } );
                                 
                        makeSliderDragable();
                        initializeCohort(vm, osApi);   
                        osApi.setBusy(false);
                    });
                });
            };
            loadData();
        }
    }
})();