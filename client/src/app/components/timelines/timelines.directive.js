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
            
            // var zoomed = function(){
            //     var t = d3.event.translate;
            //     d3Timeline.attr("transform", "scale(1, " + d3.event.scale + ")");
            // }

            // Elements
            var d3Chart = d3.select("#timelines-chart").append("svg").attr("id", "chart");
            var d3AxisTimeline   // Lazy Instantiation In DrawAxis
            var d3ScaleX;
            var d3ScaleY;

            // Min Scale Should Be Calculated Based Off Number Patients
            //var d3Zoom = d3.behavior.zoom().scaleExtent([.1, 10]).on("zoom", zoomed);
            var d3Timeline = d3Chart.append("g"); //.call(d3Zoom);
            var d3TimelineHitArea = d3Timeline.append("rect").style({'fill': '#FFF'});
                    
            var patientHeight = 10;
            var rows, cells;

            // View State
            var vm = this;
            vm.sliderMinValue = 0;
            vm.sliderMaxValue = 1000;
            vm.sliderMin = 0;
            vm.sliderMax = 1000;
            vm.datasource = $stateParams.datasource;
            vm.features;
            vm.feature;
            vm.events;
            vm.sorts;
            vm.sort;
            vm.align;

            var scale = function(){

                // Availible Height
                var h = $window.innerHeight - 70;
                var x = vm;

                var chartHeight = vm.sliderMax * patientHeight;
                var windowHeight = $window.innerHeight - 70;
                var visibleHeight = (vm.sliderMaxValue - vm.sliderMinValue) * patientHeight;
                
                var yScale = windowHeight / visibleHeight;
                var yOffset = - vm.sliderMinValue * (patientHeight * yScale);
                d3Timeline.attr("transform", "translate(0, "+yOffset+")scale(1, " + yScale + ")");

                console.log(chartHeight +":"+ windowHeight + ":"+ visibleHeight);

            }
  
            // Main Draw Function
            var draw = function(){
                console.log("DRAW");
                
                var processedData = processData(data, vm.align, vm.sort);
                
                var w = $window.innerWidth;
                var h = $window.innerHeight - 70;
                if (angular.element(".tray").attr("locked")=="true") w -= 300;

                updateScaleZoom(w, h, processedData);
                updateTimeline(w, h, processedData);
                //drawAxis(w,h);
            }
            // Listen For Resize
            vm.resize = function(e){ _.debounce(draw, 300); }


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
            makeSliderDragable();





            var updateTimeline = function(w, h, processedData){
                
                rows = d3Timeline.selectAll("g.timeline").data( processedData.patients );
                rows.enter().append("g")
                        .attr({
                                'width' : w,
                                'height' : patientHeight,
                                'class' : 'timeline',
                                'transform': function(d, i) { return "translate(0," +  (i * patientHeight)+ ")"; }
                            });
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
                            'height': patientHeight,
                            'width': function(d){ return (d.endValue==null) ? 3 : (d3ScaleX(d.endValue) - d3ScaleX(d.startValue)); },
                            'x': function(d) { return Math.round(d3ScaleX(d.startValue)); }
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
                d3Chart.attr("width", w).attr("height", h);
                d3TimelineHitArea.attr({
                    width:w,
                    height:processedData.patients.length * patientHeight
                })
                d3ScaleX = d3.scale.linear().domain( processedData.bounds ).range([0, w]);
                d3ScaleY = d3.scale.linear().domain( [0, processedData.patients.length] ). range([0, h]);                
            }

            // var drawAxis = function(w, h){
            //     if (angular.isUndefined(d3AxisEvent)){
            //         d3AxisEvent = d3Chart.append("g").style({'shape-rendering': 'crispEdges','stroke': 'none'}).attr({"class":"axisEvent"});
            //         d3AxisEvent.call(d3.svg.axis().scale(d3.scale.linear().domain([0, 1]).range([0, w])).orient('top'));
            //     }
            //     //processedData.bounds
            //     d3Scale = d3.scale.linear().domain([0,1000]).range(0, 500);
            //     //var a = d3Chart.transition().duration(750).select('g.axisEvent');
            //     var s = d3.svg.axis().scale(d3Scale).orient('top');
            //     d3AxisEvent.call( d3.svg.axis().scale(d3Scale).orient('top'));
            //     debugger;
            // }

            // Populates ProcessedData Object With Values Consistant With ViewState
            var processData = function (data, align, sort){

                    var processedData = {};

                    // Store List Of Active Events
                    processedData.events = vm.events.filter( function(events) { return events.selected; });

                    // Remove Patients That Don't Have Align Property
                    processedData.patients = data.filter(function(patient){
                        return patient.hasOwnProperty("__"+this.name);
                    }, align);
                
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
                            evt.startValue = evt.start + this;
                            evt.endValue = (evt.end!=null) ? evt.end + this : null;
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
                        (status==="Birth") ?  "DARKBLUE" : 
                        (status==="Diagnosis") ? "DARKGREEN" :
                        (status==="Pathology") ? "DARKMAGENTA" :
                        (status==="Progression") ? "DARKORANGE" :
                        (status==="Absent") ? "DARKSLATEBLUE" :
                        (status==="Status") ? "DEEPPINK" :
                        (status==="Radiation") ? "LIMEGREEN" :
                        (status==="Procedure") ? "GOLD" :
                        (status==="Encounter") ? "MIDNIGHTBLUE" :
                        (status==="Drug") ? "MEDIUMSEAGREEN" :
                        "black";
                        return rv;
                };   

                // Data Clean Up Functions
                var processEventData = function(events){
                    return Object.keys(events).map(function(v) {
                            var rv =  { "name": v, "selected": true };
                            rv.color = color(rv);
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
                        var mf = "YYYY-MM-DD"

                        // Map Start Dates
                        var dateSingle =
                            p.dateEvents
                            .filter(function(d) {
                                return d.eventOrder === 'single'
                            })
                            .map(function(d) {
                                return {
                                    "start": m(d.date, mf).unix() * 1000,
                                    "end": null,
                                    "name": d.name
                                };
                            });

                        // Map Start + End Dates
                        var endDates = p.dateEvents
                            .filter(function(d) { return d.eventOrder==='end' })
                            .map(function(d){ return {"end":m(d.date, mf).unix()*1000, "id":d.eventID}; });
                        var startDates = p.dateEvents
                            .filter(function(d) { return d.eventOrder==='start' })
                            .map(function(d){ return {"start":m(d.date, mf).unix()*1000,"name":d.name, "id":d.eventID}; });
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

                        // Clean Data + Set Default VM
                        data = processPatientData(response.payload.pts);
                        vm.sorts = processFeatureData(data);
                        vm.sort = vm.sorts[0];
                        var features = processFeatureData(data);
                        features.unshift({index:-1, name:'None'});
                        vm.features =  features;
                        vm.feature = vm.features[0];
                        
                        vm.events = processEventData(response.payload.eventTypes);
                        vm.align = vm.events[0];

                        // // Trigger Redraw on Property Change
                        

                        
                        $scope.$watchGroup(['vm.feature', 'vm.sort', 'vm.align'], draw);
                        $scope.$watchGroup(['vm.sliderMinValue', 'vm.sliderMaxValue'], scale);
                        angular.element($window).bind('resize', function(e){
                            draw();
                        } );
                                    
                        osApi.setBusy(false);
                    });
                });
            };

            loadData();
            

        }
    }
})();