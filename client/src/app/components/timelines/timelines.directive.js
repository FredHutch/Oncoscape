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

                var svgWidth = $window.innerWidth / 1.1;
                var svgHeight = ($window.innerHeight - 250) / 1.1;
                var svg = d3.select('#timelines-chart').append("svg")
                    .attr("width", svgWidth)
                    .attr("height", svgHeight);


                var drawFeatures = function(patients, feature) {

                    var rowHeight = Math.floor(svgHeight / patients.length);
                    if (rowHeight<0) rowHeight = 2;
                    var thirdWidth = Math.floor(svgWidth / 3);

                    // Define Feature Scale
                    var featureIndex = feature.index;
                    var featureScale = d3.scale.linear()
                        .domain([0, d3.max(patients.map(function(patient) {
                            return patient.calcEvents[featureIndex].value
                        }))])
                        .range([0, thirdWidth]);

                    // Features
                    var svgFeatures = svg.selectAll("rect.feature")
                        .data(patients);

                    svgFeatures.exit().remove();

                    svgFeatures
                        .enter()
                        .append("rect")
                        .attr("transform", function(d, i) {
                            return "translate(0," + i * rowHeight + ")";
                        })
                        .style({
                            "fill": "#59a5fb"
                        })
                        .attr({
                            "class": "feature",
                            "x": function(d) {
                                return thirdWidth - featureScale(d.calcEvents[featureIndex].value);
                            },
                            "width": function(d) {
                                return featureScale(d.calcEvents[featureIndex].value);
                            },
                            "height": rowHeight - 1
                        })
                    svgFeatures
                        .transition()
                        .duration(300)
                         .attr({
                            "x": function(d) { return thirdWidth - featureScale(d.calcEvents[featureIndex].value); },
                            "width": function(d) { return featureScale(d.calcEvents[featureIndex].value); },
                            "height": rowHeight - 1
                        });
                }

                var drawTimelines = function(patients) {


                    var rowHeight = Math.floor(svgHeight / patients.length);
                    if (rowHeight<0) rowHeight = 2;
                    var thirdWidth = Math.floor(svgWidth / 3);


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
                                    return Math.max(c.start, p)
                                }, -Infinity))
                        }, -Infinity);
                    var timelineScale = d3.scale.linear()
                        .domain([timelineMin, timelineMax])
                        .range([0, thirdWidth * 2]);
//debugger;

/*
patients.forEach(function(p){
  p.dateEvents.forEach(function(d){
    var v = Math.round(timelineScale(d.start)) + thirdWidth;
console.log(v);
  })
})
*/
                    var color = function(d){
                        var status = d.name;
                        var rv = 
                            (status==="Birth") ?  "#004358" : 
                            (status==="Diagnosis") ? "#1F8A70" :
                            (status==="Pathology") ? "#BEDB39" :
                            (status==="Progression") ? "#FFE11A" :
                            (status==="Absent") ? "#FD7400" :
                            (status==="Status") ? "#59a5fb" :
                            "#00FFFF";
                            return rv;
                    };


var rows = svg.selectAll("g")
    .data( patients);

var cells = rows.selectAll("rect")
    .data( function(d, i){ return d.dateEvents;  });


     cells
        .transition()
        .duration(300)
        .style({'opacity':1, 'fill':color})
        .attr({
            "x": function(d) { return Math.round(timelineScale(d.start)) + thirdWidth;},
            "width": 3,
        });

    // Row Update
    cells
        .enter()
        .append("rect")
        .style({'opacity': 0.0, 'fill':color})
        .attr('class', 'enter')
        .attr({
            'x': 0,
            'height': (rowHeight - 1)
        })
        .transition()
        .duration(300)
        .attr({
            'x': function(d) { return Math.round(timelineScale(d.start)) + thirdWidth;},
        });

   

    cells
        .exit()
        .attr('class', 'exit')
        .transition()
        
        .duration(300)
        .style('opacity', 0.0)
        .attr({'x':0})
        .remove();

    // Row Enter
    var cells_in_new_rows = rows
        .enter()
        .append("g")
        .attr("transform", function(d, i) {return "translate(0," + i * rowHeight + ")"; })
        .selectAll('rect')
        .data( function(d, i){ return d.dateEvents; } );

    cells_in_new_rows.enter().append('rect')
        .style('opacity', 0.0)
        .attr('class', 'enter')
        .attr({
            'x': thirdWidth,
            'width': 3,
            'height': (rowHeight - 1)
        })
        .style({'opacity': 0.0, 'fill':color})
        .transition()
        .duration(500)
        .style('opacity', 1.0)
        .attr({
            'x': function(d) { return timelineScale(d.start) + thirdWidth },
            'width':function(d){

                var rv = (d.end===null) ? 3 : (timelineScale(d.end) - timelineScale(d.start));
                console.log(rv);
                return rv;
            }
        });

    // Row Exit
    rows.exit()
      .attr('class', 'exit')
      .transition()
      .delay(200)
      .duration(500)
      .style('opacity', 0.0)
      .remove();
                 }




                return {
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
                        p.dateEvents =
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
                            .map(function(d){ return {"start":m(d.date, mf).unix()*1000,"name":d.name, "id":d.eventID}; })
                            .forEach(function(sd){
                                sd.end = endDates.filter( function(ed) { return ed.id===sd.id })[0].end;
                            });
                        
                        Array.prototype.push.apply(p.dateEvents, startDates);
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

                    // Set Data
                    //chart.drawFeatures(patients);
                    chart.drawTimelines(patients);

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
