(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osPlsr', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/plsr/plsr.html',
            controller: PlsrController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function PlsrController(osApi, $state, $stateParams, $timeout, $scope, d3, $sce, $window) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.deathMinFilter = vm.deathMinValue = 45;
            vm.deathMaxFilter = vm.deathMaxValue = 66;
            vm.survivalMinFilter = vm.survivalMinValue = 3;
            vm.survivalMaxFilter = vm.survivalMaxValue = 7;
            vm.geneSets = [];
            vm.geneSet = null;
            vm.frame;
            vm.tip = null;

            // D3 Scale
            var width, height, xScale, yScale, xMax, yMax, xAxis, yAxis;

            // Elements
            var elChart = angular.element("#plsr-chart");
            var elChart = angular.element("#pca-chart");
            var d3Chart = d3.select("#plsr-chart").append("svg").attr("id", "chart");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            var d3Tooltip = d3.select("body").append("div").attr("class", "tooltip plsr-tooltip")
            var xAxis, yAxis;



/*
            // Chart
            var chart = (function() {


                // Size
                var margin = {
                    top: 20,
                    right: 20,
                    bottom: 30,
                    left: 40
                };
                var width = elChart.width() - margin.left - margin.right;
                var height = elChart.height() - margin.top - margin.bottom;

                var svg = d3.select("#plsr-chart").append("svg")
                    .attr("id", "chart")
                    .attr("width", width)
                    .attr("height", height);

                var lines, circles, text;
                var xScale, yScale;

                function draw(abs, vectors, genes) {
                    
                    var nAbs = -1.0 * abs;

                    xScale = d3.scale.linear().domain([nAbs, abs]).range([0, width])
                    yScale = d3.scale.linear().domain([nAbs, abs]).range([height, 0])

                    text = svg.selectAll("text").data(vectors);
                    text
                        .enter().append("text")
                        .attr({
                            "class": "text",
                            "x": function(v) { return xScale(v[0]); },
                            "y": function(v) { return yScale(v[1]); },
                            "text-anchor": function(v) { return (v[0] > 0) ? "start" : "end" }
                        })
                        .text(function(v) { return v.name; })
                        .style("fill", "black");

                    text
                        .transition()
                        .duration(900)
                        .attr({
                            "x": function(v) { return xScale(v[0]); },
                            "y": function(v) { return yScale(v[1]); }
                        });

                    text
                        .exit()
                        .remove();
                        

                    lines = svg.selectAll("line").data(vectors)

                    lines
                        .enter()
                        .append("line")
                        .attr({
                            "class": "line",
                            "stroke-width": 3,
                            "x1": xScale(0),
                            "y1": yScale(0),
                            "x2": function(v) { return xScale(v[0]); },
                            "y2": function(v) { return yScale(v[1]); }
                        })
                        .style("stroke", function(d) {
                            return (d.name.indexOf("Age")) ? "#1396de" : "#38347b"
                        });

                    lines
                        .transition()
                        .duration(900)
                        .attr("x1", xScale(0))
                        .attr("y1", yScale(0))
                        .attr("x2", function(v) {
                            return xScale(v[0]);
                        })
                        .attr("y2", function(v) {
                            return yScale(v[1]);
                        });

                    lines
                        .exit().remove();
                  
                    circles = svg.selectAll("circle").data(genes);

                    circles
                        .enter()
                        .append("circle")
                        .attr({
                            "class": "plsr-node",
                            "cx": function(d) { return xScale(d[0]); },
                            "cy": function(d) { return yScale(d[1]); },
                            "r": 3
                        })
                        .style({
                            'fill': 'black',
                            'opacity': 1
                        })
                        .on("click", function(d) {
                            angular.element('#plsr-webpage').modal();
                            var url = "https://www.genecards.org/cgi-bin/carddisp.pl?gene=" + d.name;
                            $scope.$apply(function() {
                                vm.frame = $sce.trustAsResourceUrl(url);
                            });
                        })
                        .on("mouseover", function(d) {
                            d3Tooltip.transition()        
                                .duration(200)      
                                .style("opacity", 1);      
                            d3Tooltip.html(d.name)  
                                .style("left", (d3.event.pageX+15) + "px")     
                                .style("top", (d3.event.pageY-15) + "px"); 
                        })
                        .on("mouseout", function() {
                            d3Tooltip.transition()      
                                .duration(500)      
                                .style("opacity", 0); 
                        })


                    circles
                        .transition()
                        .duration(900)
                        .each("start", function() { d3.select(this) })
                        .delay(function(d, i) {
                            return i / genes.length * 500; // Dynamic delay (i.e. each item delays a little longer)
                        })
                        .attr("cx", function(d) { return xScale(d[0]);  })
                        .attr("cy", function(d) { return yScale(d[1]);  })
                        .each("end", function() { // End animation
                            d3.select(this) // 'this' means the current element
                                .transition()
                                .duration(500)
                                .style("fill", "black") // Change color
                                .attr("r", 3); // Change radius
                        })

                    circles
                        .exit().remove();

                }

                function update(abs, vectors, genes) {

                    text
                        .data(vectors)
                        .transition()
                        .duration(900)
                        .attr("x", function(v) {
                            return xScale(v[0]);
                        })
                        .attr("y", function(v) {
                            return yScale(v[1]);
                        })



                    lines
                        .data(vectors)
                        .transition()
                        .duration(900)
                        .attr("x1", xScale(0))
                        .attr("y1", yScale(0))
                        .attr("x2", function(v) {
                            return xScale(v[0]);
                        })
                        .attr("y2", function(v) {
                            return yScale(v[1]);
                        });


                    circles
                        .data(genes); // Update with new data
                        

                    circles
                        .transition()
                        .duration(900)
                        .each("start", function() { // Start animation
                            d3.select(this) // 'this' means the current element
                                //.style("fill", "000")  // Change color
                                //.attr("r", 2);  // Change size
                        })
                        .delay(function(d, i) {
                            return i / genes.length * 500; // Dynamic delay (i.e. each item delays a little longer)
                        })
                        //.ease("linear")  // Transition easing - default 'variable' (i.e. has acceleration), also: 'circle', 'elastic', 'bounce', 'linear'
                        .attr("cx", function(d) {
                            return xScale(d[0]); // Circle's X
                        })
                        .attr("cy", function(d) {
                            return yScale(d[1]); // Circle's Y
                        })
                        .each("end", function() { // End animation
                            d3.select(this) // 'this' means the current element
                                .transition()
                                .duration(500)
                                .style("fill", "black") // Change color
                                .attr("r", 3); // Change radius
                        })
                }



                return {
                    draw: draw

                }
            })("#plsr-chart");
*/

            // Initialize
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function(response) {
                var mtx = response.payload.rownames.filter(function(v) {
                    return v.indexOf("mtx.mrna") >= 0
                });
                mtx = mtx[mtx.length - 1].replace(".RData", "");
                osApi.setBusyMessage("Creating PLSR Matrix");
                osApi.getPLSR(vm.datasource, mtx).then(function() {
                    osApi.setBusyMessage("Loading Gene Sets");
                    osApi.getGeneSetNames().then(function(response) {

                        // Load Gene Sets
                        vm.geneSets = response.payload;
                        vm.geneSet = vm.geneSets[0];
                        osApi.setBusyMessage("Loading Patients");
                        osApi.getSummarizedPLSRPatientAttributes().then(function(response) {

                            // Load Min Max Values
                            var payload = response.payload;
                            vm.deathMinValue = Math.floor(payload.AgeDx[0] / 365.24);
                            vm.deathMaxValue = Math.floor(payload.AgeDx[4] / 365.24);
                            vm.survivalMinValue = Math.floor(payload.Survival[0] / 365.24);
                            vm.survivalMaxValue = Math.floor(payload.Survival[4] / 365.24);
                            $scope.$watch('vm.geneSet', function() {
                                vm.update();
                            });
                        });
                    });
                });
            });


            // API Call To Calculate PLSR
            vm.update = function() {
                osApi.setBusyMessage("Calculating PLSR");
                var factors = [{
                    name: "Survival",
                    low: Number(vm.survivalMinFilter) * 365.24,
                    high: Number(vm.survivalMaxFilter) * 365.24
                }, {
                    name: "AgeDx",
                    low: Number(vm.deathMinFilter) * 365.24,
                    high: Number(vm.deathMaxFilter) * 365.24
                }];

                osApi.getCalculatedPLSR(vm.geneSet, factors).then(function(response) {
                    osApi.setBusyMessage("Rendering PLSR");

                    // Clean Up Data
                    var payload = response.payload;
                    var genes = payload.loadings.map(function(item, index) {
                        item.name = this[index];
                        return item;
                    }, payload.loadingNames);
                    var vectors = payload.vectors.map(function(item, index) {
                        item.name = this[index];
                        return item;
                    }, payload.vectorNames);
                    var abs = payload.maxValue * 1.2;
                    draw(abs, vectors, genes);
                    osApi.setBusy(false);
                });

                function setScale() {
                    width = window.innerWidth - 100; 
                    height = window.innerHeight - 190;
                    if (angular.element(".tray").attr("locked")=="true") width -= 300;

                    d3Chart
                        .attr("width", '100%')
                        .attr("height", height);
                    xScale = d3.scale.linear()
                        .domain([-xMax, xMax])
                        .range([0, width]).nice();

                    yScale = d3.scale.linear()
                        .domain([-yMax, yMax])
                        .range([height, 0]).nice();
                }

                // Render
                function draw(abs, vectors, genes) {

                    xMax = abs * .9;
                    yMax = abs * .9;
                    setScale();

                    // Brush
                    var brush = d3.svg.brush()
                        .x(xScale)
                        .y(yScale)
                        .on("brushend", function() {
                            var bv = brush.extent();
                            d3Chart.selectAll("circle")
                                .classed("pca-node-selected", function(d) {
                                    return (d[0] > bv[0][0] && d[0] < bv[1][0] && d[1] > bv[0][1] && d[1] < bv[1][1]);
                                });
                            d3.select(this).transition().duration(300)
                                .call(brush.extent([
                                    [0, 0],
                                    [0, 0]
                                ]));
                        });

                    d3Chart.call(brush);

                    // Circles
                    var circles = d3Chart.selectAll("circle").data(genes, function(d) { return d; });
                    circles.enter()
                        .append("circle")
                        .attr({
                            "class": "plsr-node",
                            "cx":  width * .5,
                            "cy": height * .5,
                            "r": 3
                        })
                        .style("fill-opacity", "0")
                        .on("mouseover", function(d) {
                            d3Tooltip.transition()        
                                .duration(200)      
                                .style("opacity", 1);      
                            d3Tooltip.html(d.name)  
                                .style("left", (d3.event.pageX+15) + "px")     
                                .style("top", (d3.event.pageY-15) + "px"); 
                        })
                        .on("mouseout", function() {
                            d3Tooltip.transition()      
                                .duration(500)      
                                .style("opacity", 0); 
                        });
                    circles.transition()
                        .duration(750)
                        .delay(function(d, i) {
                            return i / 300 * 500;
                        })
                        .attr("cx", function(d) {
                            return xScale(d[0]);
                        })
                        .attr("cy", function(d) {
                            return yScale(d[1]);
                        })
                        .style("fill-opacity", 1);
                     circles.exit()
                        .transition()
                        .duration(600)
                        .delay(function(d, i) {
                            return i / 300 * 500;
                        })
                        .attr("cx", width * .5)
                        .attr("cy", height * .5)
                        .style("fill-opacity", "0")
                        .remove();

                    // Lines
                    var lines = d3Chart.selectAll("line").data(vectors)
                    lines.enter()
                        .append("line")
                        .attr({
                            "class": "line",
                            "stroke-width": 3,
                            "x1": xScale(0),
                            "y1": yScale(0),
                            "x2": xScale(0),
                            "y2": yScale(0)
                        })
                        .style("stroke", function(d) {
                            return (d.name.indexOf("Age")) ? "#1396de" : "#38347b"
                        });
                    lines.transition()
                        .duration(900)
                        .attr({
                            "x1": xScale(0),
                            "y1": yScale(0),
                            "x2": function(v) { return xScale(v[0]); },
                            "y2": function(v) { return yScale(v[1]); }
                        });
                    lines.exit().remove();

                    // Text
                    var text = d3Chart.selectAll("text").data(vectors);
                    text.enter()
                        .append("text")
                        .attr({
                            "class": "text",
                            "x": function(v) { return xScale(v[0]); },
                            "y": function(v) { return yScale(v[1]); },
                            "text-anchor": function(v) { return (v[0] > 0) ? "start" : "end" }
                        })
                        .text(function(v) { return v.name; })
                        .style({
                            "fill": "black",
                            "text-anchor": "middle"
                        });

                    text.transition()
                        .duration(900)
                        .attr({
                            "x": function(v) { return xScale(v[0]); },
                            "y": function(v) { return yScale(v[1]); }
                        });

                    text.exit().remove();
                }

                vm.resize = function () {
                    setScale();

                    d3Chart.selectAll("circle")
                        .attr({
                            "cx": function(d) { return xScale(d[0]); },
                            "cy": function(d) { return yScale(d[1]); }
                        });

                    d3Chart.selectAll("text")
                       .attr({
                            "x": function(v) { return xScale(v[0]); },
                            "y": function(v) { return yScale(v[1]); }
                        });

                    d3Chart.selectAll("line")
                        .attr({
                            "x1": xScale(0),
                            "y1": yScale(0),
                            "x2": function(v) { return xScale(v[0]); },
                            "y2": function(v) { return yScale(v[1]); }
                        });
                };

                // Listen For Resize
                angular.element($window).bind('resize', 
                    _.debounce(vm.resize, 300)
                );
            };

        }
    }
})();
