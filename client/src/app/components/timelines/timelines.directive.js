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
        function TimelinesController(osApi, $state, $scope, $stateParams, $window, moment) {

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.feature;
            vm.features;
            vm.eventType;
            vm.eventTypes;
            vm.sort;
            var patients;
            vm.sortClick = function(v){
                vm.sort = v;
            }
            vm.eventTypeClick = function(eventType) {
                eventType.selected = !eventType.selected;
                vm.eventType = eventType;
            }

            // VM Event Handlers
            vm.toggleFilter = function() {
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }
            var chart = (function() {

                var svgWidth = $("#timelines-chart").width()-100;
                var svgHeight = $("#timelines-chart").height();
                var rowHeight = 0;
                var svg = d3.select('#timelines-chart').append("svg")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight);
                        

                var axisTimelineG;
                var axisFeatureG;

                var init = function(patients){
                    rowHeight = Math.floor(svgHeight / patients.length);
                    if (rowHeight<0) rowHeight = 2;
                    if (rowHeight>25) rowHeight = 25;
                    /* $(".timelines-lbl-feature").css({
                        'position':'absolute',
                        'left':'150px',
                        'top':'90px'
                    });
                    */
                    $(".timelines-lbl-events").css({
                        
                        'top' : ((patients.length * rowHeight)+ 100) + 'px'
                     });

                    svg.selectAll("rect.lines")
                        .data(patients)
                        .enter()
                        .append("rect")
                        .style({
                            "fill": "#e9e9e9"
                        })
                        .attr({
                            "transform": function(d, i) {return "translate(50," + ((i * rowHeight)+50) + ")";},
                            "class": "lines",
                            "x": 0,
                            "width": svgWidth,
                            "height": rowHeight - 1
                        })

                  

                        var axisStyle = {
                            'shape-rendering': 'crispEdges',
                            'stroke': 'none'
                        };

                        var axisFeature = svg
                            .append("g")
                            .style(axisStyle)
                            .attr({
                                "class":"axisFeature axis",
                                "transform": "translate(50,50)",
                         
                                
                            }).call(
                                d3.svg.axis().scale(
                                    d3.scale.linear().domain([0, 1]).range([0, svgWidth])
                                ).orient('top')
                            );

                        var axisTimeline = 
                        svg
                            .append("g")
                            .style(axisStyle)
                            .attr({
                                "class":"axisTimeline axis",
                                "transform": "translate(50,"+(49+(patients.length*rowHeight))+")"                                
                            }).call(
                                d3.svg.axis().scale(
                                    d3.scale.linear().domain([0, 1]).range([0, svgWidth])
                                ).orient('bottom')
                            );
                            
                        


                }

                var drawFeatures = function(patients, feature) {

                    // Define Feature Scale
                    var featureIndex = feature.index;
                    var featureScale = d3.scale.linear()
                        .domain([0, d3.max(patients.map(function(patient) {
                            return patient.calcEvents[featureIndex].value
                        }))])
                        .range([0, svgWidth]);

                    // Update Axis
                    var axisFeature = d3.svg.axis().scale(featureScale).orient('top');
                    var t = svg.transition().duration(750);
                    t.select('g.axisFeature').call(axisFeature);
                    
                    // Features
                    var svgFeatures = svg.selectAll("rect.feature")
                        .data(patients);

                    svgFeatures.exit().remove();

                    svgFeatures
                        .enter()
                        .append("rect")
                        .style({
                            "fill": "#59a5fb"
                        })
                        .attr({
                            "transform": function(d, i) {return "translate(50," + ((i * rowHeight)+50) + ")";},
                            "class": "feature",
                            "x": 0,
                            "width": function(d) {
                                return featureScale(d.calcEvents[featureIndex].value);
                            },
                            "height": rowHeight - 1
                        })

                    svgFeatures
                        .transition()
                        .duration(300)
                         .attr({
                            "class": "feature",
                            "x": 0,
                            "width": function(d) { return featureScale(d.calcEvents[featureIndex].value); },
                            "height": rowHeight - 1
                        });
                }

                var drawTimelines = function(patients) {

                    // Define Timeline Scale
                    var timelineMin = patients
                        .reduce(function(p, c) {
                            return Math.min(p, c.dateEvents
                                .reduce(function(p, c) {
                                        return Math.min(c.start, p)
                                    },
                                    Infinity))
                        }, Infinity);
                    var timelineMax = patients
                        .reduce(function(p, c) {
                            return Math.max(p, c.dateEvents
                                .reduce(function(p, c) {
                                    var val = (c.end==null) ? c.start : c.end;
                                    return Math.max(val, p)
                                }, -Infinity))
                        }, -Infinity);
                    var timelineScale = d3.scale.linear()
                        .domain([timelineMin, timelineMax])
                        .range([0, svgWidth]);


                    // Update Axis
                    var axisTimeline = d3.svg.axis().scale(timelineScale).orient('bottom')
                        .tickFormat(function(d) { 

                            return moment.unix(d/1000).format("MM/DD/YYYY");
                        });
                    var t = svg.transition().duration(750);
                    t.select('g.axisTimeline').call(axisTimeline);

                    var color = function(d){
                        var status = d.name;
                        var rv = 
                            (status==="Birth") ?  "#004358" : 
                            (status==="Diagnosis") ? "#1F8A70" :
                            (status==="Pathology") ? "#BEDB39" :
                            (status==="Progression") ? "#FFE11A" :
                            (status==="Absent") ? "#FD7400" :
                            (status==="Status") ? "#0000FF" :
                            (status==="Radiation") ? "#FF0000" :
                            "#00FFFF";
                            return rv;
                    };


                var rows = svg.selectAll("g.timeline")
                .data( patients);

                var cells = rows.selectAll("rect.timeline")
                .data( function(d, i){ return d.dateEvents;  });

                // Cell Create
                 cells
                    .transition()
                    .duration(300)
                    .style({'opacity':1, 'fill':color})
                    .attr({
                        'class' : 'timeline',
                        "x": function(d) { return Math.round(timelineScale(d.start));},
                        'width':function(d){ return (d.end===null) ? 3 : (timelineScale(d.end) - timelineScale(d.start)); }
                    });

                // Cell Update
                cells
                    .enter()
                    .append("rect")
                    .style({'opacity': 0.0, 'fill':color})
                    .attr('class', 'enter timeline')
                    .attr({
                        'x': 0,
                        'height': (rowHeight - 1)
                    })
                    .transition()
                    .duration(300)
                    .attr({
                        'x': function(d) { return Math.round(timelineScale(d.start));},
                    });

                // Cell Delete
                cells
                    .exit()
                    .attr('class', 'timeline exit')
                    .transition()
                    
                    .duration(300)
                    .style('opacity', 0.0)
                    .attr({'x':0})
                    .remove();

                // Row
                var cells_in_new_rows = rows
                    .enter()
                    .append("g")
                    .attr('class', 'timeline enter')
                    .attr("transform", function(d, i) {return "translate(50," + ((i * rowHeight)+50) + ")";})
                    .selectAll('rect')
                    .data( function(d, i){ return d.dateEvents; } );

                // Row Create
                cells_in_new_rows.enter().append('rect')
                    .style('opacity', 0.0)
                    
                    .attr({
                        'class': 'timeline enter',
                        'x': 0,
                        'width': function(d){ return (d.end==null) ? 3 : (timelineScale(d.end) - timelineScale(d.start)) },
                        'height': (rowHeight - 1)
                    })
                    .style({'opacity': 0.0, 'fill':color})
                    .transition()
                    .duration(500)
                    .style('opacity', 1.0)
                    .attr({
                        'class': 'timeline enter',
                        'x': function(d) { return timelineScale(d.start) },
                        'width':function(d){ return (d.end===null) ? 3 : (timelineScale(d.end) - timelineScale(d.start)); }
                    });

                // Row Delete
                rows.exit()
                  .attr('class', 'timeline exit')
                  .transition()
                  .delay(200)
                  .duration(500)
                  .style('opacity', 0.0)
                  .remove();
                }



                return {
                    init: init,
                    drawFeatures: drawFeatures,
                    drawTimelines: drawTimelines
                }
            })();

     

            // Elements
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getTimelines().then(function(response) {
                    var payload = response.payload;


                    // Load Data
                    patients = payload.pts;
                    patients = Object.keys(patients).map(function(key) {
                        var val = patients[key];
                        val.id = key;
                        return val;
                    });


                    for (var i = 0; i < patients.length; i++) {
                        var p = patients[i];
                        var m = moment; // Make Reference Closer To Function, To Decrease Loopup
                        var mf = "YYYY-MM-DD"
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
                            })
                        var endDates = p.dateEvents
                            .filter(function(d) { return d.eventOrder==='end' })
                            .map(function(d){ return {"end":m(d.date, mf).unix()*1000, "id":d.eventID}; });
                        var startDates = p.dateEvents
                            .filter(function(d) { return d.eventOrder==='start' })
                            .map(function(d){ return {"start":m(d.date, mf).unix()*1000,"name":d.name, "id":d.eventID}; });
                        startDates
                            .forEach(function(sd){ sd.end = endDates
                                .filter(function(ed) { return ed.id==sd.id} )[0].end });
                        p.dateEvents = (startDates.length>0) ? startDates.concat(dateSingle) : dateSingle;

                    }


                    // Set Collections
                    vm.features = patients[0].calcEvents.map(function(d, i) {
                        return {
                            "name": d.name,
                            "index": i
                        }
                    });
                    vm.eventTypes = Object.keys(response.payload.eventTypes).map(function(v) {
                        return {
                            "name": v,
                            "selected": true
                        };
                    });
                    chart.init(patients);

                    // Set Data
                    $scope.$watch("vm.feature", function() {
                        chart.drawFeatures(patients, vm.feature)
                    });
               
                    // Set State
                    vm.feature = vm.features[0];
                    vm.eventType = vm.eventTypes[0];
                    vm.sort = vm.features[0];
                    

                    $scope.$watch("vm.sort", function(){
                        var ceIndex = vm.sort.index;
                        patients = patients.sort(function(a, b){
                            var av = a.calcEvents[ceIndex].value;
                            var bv = b.calcEvents[ceIndex].value;
                            var rv = (av>bv) ? -1 : 1;
                            return rv;
                        });
                        chart.drawFeatures(patients, vm.feature);
                        chart.drawTimelines(patients);
                    })
                    osApi.setBusy(false);
                });
            });
        }
    }
})();
