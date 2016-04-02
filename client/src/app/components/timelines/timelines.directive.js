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
        function TimelinesController(osApi, $state, $scope, $stateParams, $window, moment, d3) {

            var chart =(function(){

                // SVG Elements + Attributes
                var svgEl = angular.element("#timelines-chart");
                var svgWidth = svgEl.width()-100;
                var svgHeight = svgEl.height();
                var svgChart = d3.select('#timelines-chart').append("svg").attr("width", "100%").attr("height", svgHeight);
                var svgRange = [0, svgWidth];

                // Axis Elements + Style
                var axisStyle = {'shape-rendering': 'crispEdges','stroke': 'none'};
                svgChart.append("g").style(axisStyle)
                    .attr({
                        "class":"axisFeature axis",
                        "transform": "translate(50, 49)"
                    }).call(d3.svg.axis().scale(d3.scale.linear().domain([0, 1]).range([0, svgWidth])).orient('top'));
                svgChart.append("g").style(axisStyle)
                    .attr({
                        "class":"axisTimeline axis",
                        "transform": "translate(50, 0)"
                    }).call(d3.svg.axis().scale(d3.scale.linear().domain([0, 1]).range([0, svgWidth])).orient('bottom'));

                var barBackground = svgChart.append("g");
                var barsFeature = svgChart.append("g");
                var barsTimeline = svgChart.append("g");


                // Main Draw Function
                var draw = function(patientsX, feature, events, sort, align){
                    
                    // Filter Patients That Don't Have Alignment Event
                    var patients = patientsX.filter(function(patient){
                        return patient.hasOwnProperty("__"+this.name);
                    }, align);

                    // Sort Patients
                    patients = patients.sort(function(a,b){
                        return (a.calcEvents[sort.index].value>b.calcEvents[sort.index].value) ? -1 : 1;
                    }, sort);

                    // Set Event Start + End Dates Based On Alignment Event
                    patients.forEach(function(patient){
                        patient.dateEvents.forEach(function(evt){

                            evt.startValue = evt.start + this;
                            evt.endValue = (evt.end!=null) ? evt.end +this : null;
                        }, -patient["__"+this.name].start)

                    }, align);

                    // Draw Graphs
                    var rowHeight = Math.floor( (svgHeight-100) / patients.length);
                    if (rowHeight<1) rowHeight = 1;
                    if (rowHeight>20) rowHeight = 20;
                    
                    drawBackground(patients, feature, events, sort, align, rowHeight);
                    drawFeature(patients, feature, events, sort, align, rowHeight);
                    drawTimeline(patients, feature, events, sort, align, rowHeight);
                };


                var drawFeature = function(patients, feature, events, sort, align, rowHeight){
                    var svgFeatures;
                    if (feature.index==-1){
                        svgFeatures = svgChart.selectAll("rect.feature")
                        .data([]);
                        svgFeatures.exit()
                        .remove();
                        return;
                    }
                    

                    // Retrieve Min + Max Values
                    var minmax = [ 0,
                        d3.max(
                            patients.map(function(patient){
                                return patient.calcEvents[this].value
                            }, feature.index))
                    ];

                    // Update Axis
                    var scale = d3.scale.linear()
                        .domain(minmax)
                        .range(svgRange);                    
                    svgChart.transition().duration(750).select('g.axisFeature').call(
                        d3.svg.axis().scale(scale).orient('top'));
                    
                    // Data Bind
                    svgFeatures = barsFeature.selectAll("rect.feature")
                        .data(patients);

                    // Update
                    svgFeatures
                        .transition()
                        .duration(300)
                         .attr({
                            "class": "feature",
                            "x": 0,
                            "width": function(d) { return scale(d.calcEvents[feature.index].value); },
                            "height": (rowHeight==1) ? 1 : rowHeight-1
                        });

                    // Create
                    svgFeatures
                        .enter()
                        .append("rect")
                        .style( {"fill": "#9AD6F1"})
                        .attr({
                            "transform": function(d, i) {return "translate(50," + ((i * rowHeight)+50) + ")";},
                            "class": "feature",
                            "x": 0,
                            "width": function(d) {
                                return scale(d.calcEvents[feature.index].value);
                            },
                            "height": (rowHeight==1) ? 1 : rowHeight-1
                        })

                    // Remove
                    svgFeatures.exit()
                      .remove();
                };

                var drawBackground = function(patients, features, events, sort, align, rowHeight){
                    angular.element(".timelines-lbl-events").css({"top": (rowHeight * patients.length) + 100 });
                    
                    // Data Bind
                    var svgFeatures = barBackground.selectAll("rect.lines")
                        .data(patients);

                    // Create
                    svgFeatures
                        .enter()
                        .append("rect")
                        .style({'fill':'#EFEFEF'})
                        .attr({
                                'width' : svgWidth,
                                'height' : rowHeight-1,
                                'class' : 'lines',
                                'transform': function(d, i) {
                                 return "translate(50," + ((i * rowHeight)+50) + ")"; }
                            });

                    // Remove
                    svgFeatures
                        .exit()
                        .remove();
                }

                var drawTimeline = function(patients, features, events, sort, align, rowHeight){

                    // Used To Filter Events
                    var filterEventTypes = events.filter( function(events) { return events.selected; });
                    var filterDateEvents = function(dateEvents){
                        return dateEvents.filter(function(dateEvent){
                            for (var i=0; i<filterEventTypes.length; i++){
                                if (filterEventTypes[i].name == dateEvent.name) return true;
                            }
                            return false;
                        });
                    };

                    // Retrive Min + Max Values
                    var minmax = [
                        patients
                        .reduce(function(p, c) {
                            return Math.min(p, filterDateEvents(c.dateEvents)
                                .reduce(function(p, c) {
                                        return Math.min(c.startValue, p)
                                    },
                                    Infinity))
                        }, Infinity),

                        patients
                        .reduce(function(p, c) {
                            return Math.max(p, filterDateEvents(c.dateEvents)
                                .reduce(function(p, c) {
                                    var val = (c.endValue==null) ? c.startValue : c.endValue;
                                    return Math.max(val, p)
                                }, -Infinity))
                        }, -Infinity)
                    ];

                    // Update Axis
                    var scale = 
                        d3.scale.linear()
                            .domain(minmax)
                            .range(svgRange);
                        var axis = svgChart.transition().duration(300).select('g.axisTimeline');
                        axis.attr({"transform": "translate(50,"+((rowHeight*patients.length)+49)+")"});
                        axis
                            .call(d3.svg.axis().scale(scale).orient('bottom')
                            .tickFormat(function(d) { return moment.unix(d/1000).format("MM/DD/YYYY"); })
                        );
                      
                    // Data Bind Patient
                    var rows = barsTimeline.selectAll("g.timeline")
                        .data( patients );

                    rows.enter().append("g")
                        .attr({
                                'width' : svgWidth,
                                'height' : rowHeight-1,
                                'class' : 'timeline',
                                'transform': function(d, i) { return "translate(50," + ((i * rowHeight)+50) + ")"; }
                            });

                    rows.exit().remove();

                    // Data Bind Event
                    var cells = rows.selectAll("rect.timeline")
                        .data( function(d) { return filterDateEvents(d.dateEvents); });

                    cells.enter()
                        .append("rect")
                        .style({'opacity':1, 'fill':color})
                        .attr({
                            'class':'timeline',
                            'height': rowHeight,
                            'width':function(d){ return (d.endValue==null) ? 3 : (scale(d.endValue) - scale(d.startValue)); },
                            'x': function(d) { return Math.round(scale(d.startValue));}
                        })

                    cells.transition()
                        .style({'opacity':1, 'fill':color})
                        .attr({
                            'width':function(d){ return (d.endValue==null) ? 3 : (scale(d.endValue) - scale(d.startValue)); },
                            'x': function(d) { return Math.round(scale(d.startValue));} 
                        });

                    cells.exit().remove();

                }
                return {
                    draw:draw
                }
            })();

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.features;
            vm.feature;
            vm.events;
            vm.sorts;
            vm.sort;
            vm.align;

            // Static Model
            var rawdata;
            var pfApi = osApi.getPatientFilterApi();
            pfApi.init(vm.datasource);
            pfApi.onSelect.add(draw);

            // Event Handlers
            vm.eventClick = function(eventType) {
                eventType.selected = !eventType.selected;
                draw();
            };
            vm.toggleFilter = function() {
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            };

            // Global Refresh Function
            function draw(){ 
                var data = pfApi.filter(rawdata, function(p){ return p.id });
                chart.draw(data, vm.feature, vm.events, vm.sort, vm.align);
            }

            // Elements
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getTimelines().then(function(response) {

                    // Clean Data + Set Default VM
                    rawdata = processPatientData(response.payload.pts);
                    vm.sorts = processFeatureData(rawdata);
                    vm.sort = vm.sorts[0];
                    var features = processFeatureData(rawdata);
                    features.unshift({index:-1, name:'None'});
                    vm.features =  features;
                    vm.feature = vm.features[0];
                    
                    vm.events = processEventData(response.payload.eventTypes);
                    vm.align = vm.events[0];

                    // Trigger Redraw on Property Change
                    $scope.$watchGroup(['vm.feature', 'vm.sort', 'vm.align'], draw);
                    osApi.setBusy(false);
                });
            });

            // Color Mapping
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
                    p.dateEvents.forEach(function(d){ p["__"+d.name] = d; });
                }
                return patients;
            }
        }
    }
})();