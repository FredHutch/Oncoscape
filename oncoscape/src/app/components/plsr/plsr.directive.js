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
        function PlsrController(osApi, $state, $stateParams, $timeout, $scope, d3) {

            // State
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.deathMinFilter = vm.deathMinValue = 1;
            vm.deathMaxFilter = vm.deathMaxValue = 99;
            vm.survivalMinFilter = vm.survivalMinValue = 0;
            vm.survivalMaxFilter = vm.survivalMaxValue = 10;
            vm.geneSets = [];
            vm.geneSet = null;
            vm.update = function(){
                update();
            };

            // Elements
            var elChart = $("#chart");
            var d3Chart = d3.select("#chart");

            // Initalizae
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function(response){
                var mtx = response.payload.rownames.filter(function(v){return v.indexOf("mtx.mrna")>=0});
                mtx = mtx[mtx.length-1].replace(".RData","");
                osApi.setBusyMessage("Creating PLSR Matrix");
                osApi.getPLSR(vm.datasource,mtx).then(function(response){
                    osApi.setBusyMessage("Loading Gene Sets");
                    osApi.getGeneSetNames().then(function(response){

                        // Load Gene Sets
                        vm.geneSets = response.payload;
                        vm.geneSet = vm.geneSets[0];
                        osApi.setBusyMessage("Loading Patients");
                        osApi.getSummarizedPLSRPatientAttributes().then(function(response){

                            // Load Min Max Values
                            var payload = response.payload;
                            vm.deathMinFilter = vm.deathMinValue = Math.floor(payload.AgeDx[0]/365.24);
                            vm.deathMaxFilter = vm.deathMaxValue = Math.floor(payload.AgeDx[4]/365.24);
                            vm.survivalMinFilter = vm.survivalMinValue = Math.floor(payload.Survival[0]/365.24);
                            vm.survivalMaxFilter = vm.survivalMaxValue = Math.floor(payload.Survival[4]/365.24);
                            $scope.$watch('vm.geneSet', function(){
                                update();
                            });
                        });
                    });
                });
            });

            // API Call To Calculate PLSR
            var update = function(){
                osApi.setBusyMessage("Calculating PLSR");
                var factors = [
                    {
                        name: "AgeDx",     
                        low:  vm.deathMinFilter, 
                        high: vm.deathMaxFilter
                    },{
                        name: "Survival",
                        low: vm.survivalMinFilter, 
                        high: vm.survivalMaxFilter
                    }
                ];
                osApi.getCalculatedPLSR(vm.geneSet, factors).then(function(response){
                    osApi.setBusyMessage("Rendering PLSR");
                    var payload = response.payload;
                    draw(
                        payload.loadings,
                        payload.loadingNames,
                        payload.vectors,
                        payload.vectorNames,
                        payload.maxValue * 1.2
                    );
                    osApi.setBusy(false);
                });
            };
            var draw = function(genes, geneNames, vectors, vectorNames, absMaxValue){

                var width = elChart.width();
                var height = elChart.height();

                d3Chart.select("#chart").remove();

                var negAbsMaxValue = -1.0 * absMaxValue;
                var xScale = d3.scale.linear()
                 .domain([negAbsMaxValue, absMaxValue])
                 .range([0, width]);
                var yScale = d3.scale.linear()
                 .domain([negAbsMaxValue, absMaxValue])
                 .range([height, 0]); // note inversion 
                var xAxis = d3.svg.axis()
                 .scale(xScale)
                 .orient("bottom")
                 .ticks(5);
                var yAxis = d3.svg.axis()
                 .scale(yScale)
                 .orient("left")
                 .ticks(5);
                var d3brush = d3.svg.brush()
                 .x(xScale)
                 .y(yScale)
                 .on("brushend", function(){
                    currentlySelectedRegion = d3brush.extent();
                    var x0 = currentlySelectedRegion[0][0];
                    var x1 = currentlySelectedRegion[1][0];
                    var width = Math.abs(x0-x1);
                    selectedIDs = identifyEntitiesInCurrentSelection();
                 });
                var assignColor = d3.scale.ordinal()
                 .domain(["gene",     "vector"])
                 .range (["black",     "red"]);

                var tooltip = d3Chart.append("div")
                              .attr("data-toggle", "tooltip")
                              .style("position", "absolute")
                              .style("z-index", "10")
                              .style("visibility", "hidden")
                              .text("a simple tooltip");
                // Draw Genes
                var svg = d3Chart.append("svg")
                 .attr("id", "chart")
                 .attr("width", width)
                 .attr("height", height)
                 .call(d3brush);
                  var circle= svg.selectAll("circle")
                  .data(genes)
                  .enter()
                  .append("circle")
                  .attr("cx", function(d,i) {return xScale(d[0]);})
                  .attr("cy", function(d,i) {return yScale(d[1]);})
                  .attr("r",  function(d)   {return 3;})
                  .text(function(d,i){
                     return(geneNames[i]);
                     })
                  .style("fill", function(d) { return assignColor(d.category); })
                  .on("mouseover", function(d,i){
                     tooltip.text(geneNames[i]);
                     return tooltip.style("visibility", "visible");
                     })
                  .on("mousemove", function(){
                      return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
                  .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

                var line = svg.selectAll("line")
                 .data(vectors)
                 .enter().append("line")
                         .attr("class", "line")
                         .style("stroke-width", 3)
                         .style("stroke", "#1396de")
                         .attr("x1", xScale(0))
                         .attr("y1", yScale(0))
                         .attr("x2", function(v) { return xScale(v[0]); })
                         .attr("y2", function(v) { return yScale(v[1]); });

                 var text = svg.selectAll("text")
                 .data(vectors)
                 .enter().append("text")
                         .attr("class", "text")
                         .attr("x", function(v) { return xScale(v[0]); })
                         .attr("y", function(v) { return yScale(v[1]); })
                         .text( function(v, i) {return vectorNames[i];})
                         .attr("text-anchor", "left")
                         .style("fill", "black") ;
            };
        }
    }
})();
