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
            vm.toggleFilter = function(){
                $(".container-filters").toggleClass("container-filters-collapsed");
                $(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }

            // Elements
            var elChart = $("#chart");
            var d3Chart = d3.select("#chart");

            // Initalizae
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function(response) {

                var mtx = response.payload.rownames.filter(function(v){return v.indexOf("mtx.mrna")>=0});

                mtx = mtx[mtx.length-1].replace(".RData","");
                osApi.setBusyMessage("Creating PCA Matrix");
                osApi.getPCA(vm.datasource, mtx).then(function(response) {
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

                var padding = 70;
                var width = elChart.width();
                var height = elChart.height();

                d3Chart.select("#chart").remove();

                var xMax = d3.max(dataset, function(d) {
                    return +d[0];
                }) * 1.1;
                var xMin = d3.min(dataset, function(d) {
                    return +d[0];
                }) * 1.1;
                var yMax = d3.max(dataset, function(d) {
                    return +d[1];
                }) * 1.1;
                var yMin = d3.min(dataset, function(d) {
                    return +d[1];
                }) * 1.1;

                var xScale = d3.scale.linear()
                    .domain([xMin, xMax])
                    .range([padding, width - padding]);

                var yScale = d3.scale.linear()
                    .domain([yMin, yMax])
                    .range([height - padding, padding]); // note inversion 

                var xTranslationForYAxis = xScale(0);
                var yTranslationForXAxis = yScale(0);

                var xAxis = d3.svg.axis()
                    .scale(xScale)
                    .orient("top")
                    .ticks(5);

                var yAxis = d3.svg.axis()
                    .scale(yScale)
                    .orient("left")
                    .ticks(5);

                var tooltip = d3Chart.append("div")
                    .attr("data-toggle", "tooltip")
                    .style("position", "absolute")
                    .style("z-index", "10")
                    .style("visibility", "hidden")
                    .text("a simple tooltip");

                var d3brush = d3.svg.brush()
                    .x(xScale)
                    .y(yScale)
                    .on("brushend", function() {
                        var currentlySelectedRegion = d3brush.extent();
                        var x0 = currentlySelectedRegion[0][0];
                        var x1 = currentlySelectedRegion[1][0];
                        var width = Math.abs(x0 - x1);
                        selectedIDs = identifyEntitiesInCurrentSelection();
                    });

                var svg = d3Chart.append("svg")
                    .attr("id", "chart")
                    .attr("width", width)
                    .attr("height", height);
                //.call(d3PlotBrush);

                svg.append("g")
                    .attr("class", "x axis")
                    .attr("transform", "translate(0, " + yTranslationForXAxis + ")")
                    .style({
                        'stroke': '#1396de',
                        'stroke-width' : '1px',
                         'fill': 'none'
                    })
                    .call(xAxis)
                    .append("text")
                    .style({
                        "font-size":14,
                        'fill':'#1396de',
                        'stroke': 'none'
                    })
                    .text("PC1");

                svg.append("g")
                    .attr("class", "y axis")
                    .attr("transform", "translate(" + xTranslationForYAxis + ", 0)")
                    .style({
                        'stroke': '#1396de',
                        'stroke-width' : '1px',
                         'fill': 'none'
                    })
                    .call(yAxis)
                    .append("text")
                    .attr("y", 10)
                    .attr("dy", ".71em")
                     .style({
                        'font-size':14,
                        'fill':'#1396de',
                        'stroke': 'none',
                        'text-anchor': 'end'
                    })
                    .text("PC2");

                svg.append("g").selectAll("circle")
                    .data(dataset)
                    .enter()
                    .append("circle")
                    .attr("cx", function(d, i) {
                        return xScale(d[0]);
                    })
                    .attr("cy", function(d, i) {
                        return yScale(d[1]);
                    })
                    .attr("r", function(d) {
                        return 3;
                    })
                    .style("fill", "#000")
                    .on("mouseover", function(d, i) {
                        tooltip.text(currentIdentifiers[i]);
                        return tooltip.style("visibility", "visible");
                    })
                    .on("mousemove", function() {
                        return tooltip.style("top", (d3.event.pageY - 10) + "px").style("left", (d3.event.pageX + 10) + "px");
                    })
                    .on("mouseout", function() {
                        return tooltip.style("visibility", "hidden");
                    });
            };
        }
    }
})();