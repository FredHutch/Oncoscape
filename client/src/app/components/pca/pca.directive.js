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

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // State
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.geneSets = [];
            vm.geneSet = null;
            vm.toggleFilter = function() {
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }

            // Filters
            var rawData;
            var pfApi = osApi.getPatientFilterApi();
            pfApi.init(vm.datasource);
            pfApi.onSelect.add(draw);

            vm.cohort;
            vm.createCohort = function() {
                pfApi.addFilter(vm.cohort, d3.selectAll(".pca-node-selected")[0].map(function(data) { return data.__data__.id }) );
                vm.cohort = "";
            };


            // Elements
            var elChart = angular.element("#pca-chart");
            var d3Chart = d3.select("#pca-chart")
                .append("svg")
                .attr("id", "chart");

            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            
            var d3Tooltip = d3.select("body")
                .append("div")
                .attr("class", "tooltip")


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
                    var scores = payload.scores;
                    var ids = payload.ids;
                    rawData = scores.map(function(d, i){
                        d.id = ids[i];
                        return d;
                    }, payload.ids);
                    draw()
                    osApi.setBusy(false);
                });
            };

            // Render
            function draw() {
                
                var dataset = rawData;

                var width = elChart.width();
                var height = elChart.height();

                var max, min;
                max = Math.abs(d3.max(dataset, function(d) {
                    return +d[0];
                }));
                min = Math.abs(d3.min(dataset, function(d) {
                    return +d[0];
                }));
                var xMax = ((max > min) ? max : min) * 1.2;
                max = Math.abs(d3.max(dataset, function(d) {
                    return +d[1];
                }));
                min = Math.abs(d3.min(dataset, function(d) {
                    return +d[1];
                }));
                var yMax = ((max > min) ? max : min) * 1.2;

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

                // Brush
                var brush = d3.svg.brush()
                   .x(xScale)
                   .y(yScale)
                   .on("brushend", function(){
                        var bv = brush.extent();
                        d3Chart.selectAll("circle")
                            .classed("pca-node-selected", function(d){
                                return (d[0] > bv[0][0] && d[0] < bv[1][0] && d[1] > bv[0][1] && d[1] < bv[1][1]);                                
                            });
                        d3.select(this).transition().duration(300)
                            .call( brush.extent([[0,0],[0,0]]) );
                   });

                d3Chart.call(brush);

                dataset = pfApi.filter(rawData, function(p){ return p.id });
                
                d3Chart
                    .attr("width", width)
                    .attr("height", height);

                var circles = d3Chart.selectAll("circle").data(dataset, function(d) {
                    return d;
                })
                circles.enter()
                    .append("circle")
                    .attr("class","pca-node")
                    .attr("cx", width * .5)
                    .attr("cy", height * .5)
                    .attr("r", function() {
                        return 3;
                    })
                    .style("fill-opacity", "0")
                    .on("mouseover", function(d) {
                        d3Tooltip.transition()        
                            .duration(200)      
                            .style("opacity", 1);      
                        d3Tooltip.html(d.id)  
                            .style("left", (d3.event.pageX+10) + "px")     
                            .style("top", (d3.event.pageY-5) + "px");    
                    })                  
                    .on("mouseout", function(){
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
            }
        }
    }
})();
