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
        function PcaController(osApi, $state, $stateParams, $timeout, $scope, d3) {

            // State
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.geneSets = [];
            vm.geneSet = null;
            vm.toggleFilter = function() {
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }

            // Elements
            var elChart = angular.element("#pca-chart");
            var d3Chart = d3.select("#pca-chart")
                .append("svg")
                .attr("id", "chart");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");

            // Initalizae
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function(response) {

                var mtx = response.payload.rownames.filter(function(v) {
                    return v.indexOf("mtx.mrna") >= 0
                });

                mtx = mtx[mtx.length - 1].replace(".RData", "");
                osApi.setBusyMessage("Creating PCA Matrix");
                osApi.getPCA(vm.datasource, mtx).then(function() {
                    osApi.setBusyMessage("Loading Gene Sets");
                    osApi.getGeneSetNames().then(function(response) {

                        // Load Gene Sets
                        vm.geneSets = response.payload;
                        vm.geneSet = vm.geneSets[0];
                        $scope.$watch('vm.geneSet', function() {
                            update();
                        });
                    });
                });
            });

            // API Call To Calculate PCA
            var update = function() {
                osApi.setBusyMessage("Calculating PCA");
                osApi.getCalculatedPCA(vm.geneSet).then(function(response) {
                    osApi.setBusyMessage("Rendering PCA");
                    var payload = response.payload;
                    vm.pc1 = response.payload["importance.PC1"];
                    vm.pc2 = response.payload["importance.PC2"];
                    draw(payload.scores)
                    osApi.setBusy(false);
                });
            };

            // Render
            var draw = function(dataset) {
                var width = elChart.width();
                var height = elChart.height();

                var max, min;
                max = d3.max(dataset, function(d) {
                    return +d[0];
                });
                min = d3.min(dataset, function(d) {
                    return +d[0];
                });
                var xMax = ((Math.abs(max) > Math.abs(min)) ? max : min) * 1.2;
                max = d3.max(dataset, function(d) {
                    return +d[1];
                });
                min = d3.min(dataset, function(d) {
                    return +d[1];
                });
                var yMax = ((Math.abs(max) > Math.abs(min)) ? max : min) * 1.2;

                var xScale = d3.scale.linear()
                    .domain([-xMax, xMax])
                    .range([0, width]);

                var yScale = d3.scale.linear()
                    .domain([-yMax, yMax])
                    .range([height, 0]);

                var xAxis = d3.svg.axis()
                    .scale(xScale)
                    .orient("top")
                    .ticks(5);

                var yAxis = d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .ticks(5);

                d3Chart
                    .attr("width", width)
                    .attr("height", height);


                var circles = d3Chart.selectAll("circle").data(dataset, function(d) {
                    return d;
                })
                circles.enter()
                    .append("circle")
                    .attr("cx", width * .5)
                    .attr("cy", height * .5)
                    .attr("r", function() {
                        return 3;
                    })
                    .style("fill-opacity", "0")
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
                    .style("fill-opacity", 1)
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


                d3xAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(0, " + yScale(0) + ")")
                    .call(xAxis)
                    .append("text")
                    .text("PC1");

                d3yAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(" + xScale(0) + ", 0)")
                    .call(yAxis)
                    .append("text")
                    .attr("y", 10)
                    .attr("dy", ".71em")
                    .text("PC2");


            };
        }
    }
})();
