(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osPca', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/pca/pca.html',
            controller: PcaController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function PcaController(osApi, osHistory, $state, $stateParams, $timeout, $scope, d3, moment, $window, _) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Elements
            var d3Chart = d3.select("#pca-chart").append("svg").attr("id", "chart");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            var d3Tooltip = d3.select("body").append("div").attr("class", "tooltip pca-tooltip")

            // Properties
            var width, height, xScale, yScale, xMax, yMax, xAxis, yAxis;
            var rawData;

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.geneSets = [];
            vm.geneSet = null;
            vm.search = "";

            // History Integration

            var selectedIds = (osHistory.getPatientSelection() == null) ? [] : osHistory.getPatientSelection().ids;
            function saveSelected() {
                var selected = d3Chart.selectAll(".pca-node-selected")[0];
                if (selected.length==0) return;
                osHistory.addPatientSelection("PCA", "Manual Selection",
                    d3Chart.selectAll(".pca-node-selected")[0].map(function(node) {
                        return node.__data__.id.toUpperCase();
                    })
                );
            }
            function setSelected() {
                if (selectedIds.length==0) {
                    d3Chart.selectAll(".pca-node-selected").classed("pca-node-selected", false);
                } else {
                    d3Chart.selectAll("circle").classed("pca-node-selected", function() {
                        this.__data__.id = this.__data__.id.substring(0,12);
                        // osApi.getCanonicalizePatientIDsInDataset(this.__data__.id).then(function(response){
                        //     this.__data__.id = response.payload;
                        // });
                        return (selectedIds.indexOf(this.__data__.id) >= 0)
                    });
                }
            }

            // Initialize
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function(response) {
                var mtx = response.payload.rownames.filter(function(v) {
                    return v.indexOf("mtx.mrna") >= 0
                });

                mtx = mtx[0].replace(".RData", "");
                osApi.setBusyMessage("Creating PCA Matrix");
                osApi.getPCA(vm.datasource, mtx).then(function() {

                    osApi.setBusyMessage("Loading Gene Sets");
                    osApi.getGeneSetNames().then(function(response) {

                        // Load Gene Sets
                        vm.geneSets = response.payload;
                        vm.geneSets.unshift("All");
                        vm.geneSet = vm.geneSets[0];

                        $scope.$watch('vm.geneSet', function() {
                            update();
                        });

                        // History
                        osHistory.onPatientSelectionChange.add(function(selection) {
                            selectedIds = selection.ids;
                            vm.search = "";
                            setSelected();
                        });
                    });
                });
            });

            // API Call To Calculate PCA
            var update = function() {
                osApi.setBusyMessage("Calculating PCA");
                osApi.getCalculatedPCA((vm.geneSet=="All") ? null : vm.geneSet).then(function(response) {
                    osApi.setBusyMessage("Rendering PCA");
                    var payload = response.payload;
                    vm.pc1 = Math.round(response.payload["importance.PC1"] * 100);
                    vm.pc2 = Math.round(response.payload["importance.PC2"] * 100);
                    // Error Patient Ids From Server Are Different Than 
                    var scores = payload.scores;
                    var ids = payload.ids;
                    rawData = scores.map(function(d, i) {
                        d.id = ids[i];
                        return d;
                    }, payload.ids);
                    draw();
                    osApi.setBusy(false);
                });
            };

            function setScale() {
                
                width = $window.innerWidth - 400;
                if (angular.element(".tray-right").attr("locked")=="false"){
                    width += 300;
                } 
                height = $window.innerHeight - 190;
                if (angular.element(".tray").attr("locked") == "true") width -= 300;

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
            function draw() {

                var dataset = rawData;

                var max, min;
                max = Math.abs(d3.max(dataset, function(d) {
                    return +d[0];
                }));
                min = Math.abs(d3.min(dataset, function(d) {
                    return +d[0];
                }));
                xMax = ((max > min) ? max : min) * 1.2;
                max = Math.abs(d3.max(dataset, function(d) {
                    return +d[1];
                }));
                min = Math.abs(d3.min(dataset, function(d) {
                    return +d[1];
                }));
                yMax = ((max > min) ? max : min) * 1.2;

                setScale();

                xAxis = d3.svg.axis()
                    .scale(xScale)
                    .orient("top")
                    .ticks(5);

                yAxis = d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .ticks(5);

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
                        saveSelected();
                    });

                d3Chart.call(brush);

                var circles = d3Chart.selectAll("circle").data(rawData, function(d) {
                    return d;
                });

                circles.enter()
                    .append("circle")
                    .attr({
                        "class": "pca-node",
                        "cx": width * .5,
                        "cy": height * .5,
                        "r": 3
                    })
                    .style("fill-opacity", "0")
                    .on("mouseover", function(d) {
                        d3Tooltip.transition()
                            .duration(200)
                            .style("opacity", 1);
                        d3Tooltip.html(d.id)
                            .style("left", (d3.event.pageX + 10) + "px")
                            .style("top", (d3.event.pageY - 5) + "px");
                    })
                    .on("mouseout", function() {
                        d3Tooltip.transition()
                            .duration(500)
                            .style("opacity", 0);
                    })
                    .transition()
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


                d3yAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(0, " + yScale(0) + ")")
                    .call(xAxis)
                    .append("text")
                    .text("PC1");

                d3xAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(" + xScale(0) + ", 0)")
                    .call(yAxis)
                    .append("text")
                    .attr("y", 10)
                    .attr("dy", ".71em")
                    .text("PC2");

                setSelected();
            }

            vm.resize = function() {
                setScale();
                xAxis.scale(xScale);
                yAxis.scale(yScale);
                d3yAxis.attr("transform", "translate(0, " + yScale(0) + ")").call(xAxis);
                d3xAxis.attr("transform", "translate(" + xScale(0) + ", 0)").call(yAxis);
                d3Chart.selectAll("circle")
                    .attr("cx", function(d) {
                        return xScale(d[0]);
                    })
                    .attr("cy", function(d) {
                        return yScale(d[1]);
                    })
            };

            // Listen For Resize
            angular.element($window).bind('resize',
                _.debounce(vm.resize, 300)
            );

        }
    }
})();
