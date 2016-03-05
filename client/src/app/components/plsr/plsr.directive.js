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

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.deathMinFilter = vm.deathMinValue = 45;
            vm.deathMaxFilter = vm.deathMaxValue = 66;
            vm.survivalMinFilter = vm.survivalMinValue = 3;
            vm.survivalMaxFilter = vm.survivalMaxValue = 7;
            vm.geneSets = [];
            vm.geneSet = null;

            // VM Event Handlers
            vm.toggleFilter = function() {
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }
            vm.update = function() {
                update(true);
            };

            // Elements
            var elChart = angular.element("#plsr-chart");

            // Chart
            var chart = (function(){


              // Size
              var margin = {top: 20,right: 20,bottom: 30,left: 40};
              var width = elChart.width() - margin.left - margin.right;
              var height = elChart.height() - margin.top - margin.bottom;

              var svg = d3.select("#plsr-chart").append("svg")
                .attr("id", "chart")
                .attr("width", width)
                .attr("height", height);

              var tooltip = svg.append("div")
                .style("position", "absolute")
                .style("z-index", "10")
                .style("visibility", "hidden");

              var lines, circles, text;
              var xScale, yScale;

              function create(abs, vectors, genes){
                if (circles) circles.remove();
                if (lines) lines.remove();
                var nAbs = -1.0 * abs;
                
                xScale = d3.scale.linear().domain([nAbs, abs]).range([0, width])
                yScale = d3.scale.linear().domain([nAbs, abs]).range([height, 0])
                text = svg.selectAll("text")
                  .data(vectors)
                  .enter().append("text")
                  .attr("class", "text")
                  .attr("x", function(v) { return xScale(v[0]); })
                  .attr("y", function(v) { return yScale(v[1]); })
                  .text( function(v) {return v.name;})
                  .attr("text-anchor", 
                    function (v){
                      var lr = (v[0]>0) ? "start" : "end";
                      return lr;
                    })
                  .style("fill", "black");
                lines = svg.selectAll("line")
                  .data(vectors)
                  .enter()
                  .append("line")
                  .attr("class", "line")
                  .style("stroke-width", 3)
                  .style("stroke", function(d){
                    return (d.name.indexOf("Age")) ? "#1396de" : "#38347b"
                  })
                  .attr("x1", xScale(0))
                  .attr("y1", yScale(0))
                  .attr("x2", function(v) {
                      return xScale(v[0]);
                  })
                  .attr("y2", function(v) {
                      return yScale(v[1]);
                  });
                circles = svg.selectAll("circle")
                  .data(genes)
                  .enter()
                  .append("circle")
                  .attr("cx", function(d) {
                      return xScale(d[0]);
                  })
                  .attr("cy", function(d) {
                      return yScale(d[1]);
                  })
                  .attr("r", function() {
                      return 3;
                  })
                  .style("fill", 'black')
                  .on("mouseover", function(d) {
                      var pt = d3.mouse(this);
                      tooltip
                          .text(d.name)
                          .style("top", (pt[1] + 160) + "px")
                          .style("left", (pt[0] + 10) + "px")
                          .style("visibility", "visible");
                  })
                  .on("mousemove", function() {
                      var pt = d3.mouse(this);
                      tooltip
                          .style("top", (pt[1] + 160) + "px")
                          .style("left", (pt[0] + 10) + "px");
                  })
                  .on("mouseout", function() {
                      return tooltip.style("visibility", "hidden");
                  });
              }

              function update(abs, vectors, genes){
              
                text
                  .data(vectors)
                  .transition()
                  .duration(900)
                  .attr("x", function(v) { return xScale(v[0]); })
                  .attr("y", function(v) { return yScale(v[1]); })


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
                  .data(genes)  // Update with new data
                  .transition()
                  .duration(900)
                   .each("start", function() {  // Start animation
                      d3.select(this)  // 'this' means the current element
                          //.style("fill", "000")  // Change color
                          //.attr("r", 2);  // Change size
                  })
                  .delay(function(d, i) {
                      return i / genes.length * 500;  // Dynamic delay (i.e. each item delays a little longer)
                  })
                  //.ease("linear")  // Transition easing - default 'variable' (i.e. has acceleration), also: 'circle', 'elastic', 'bounce', 'linear'
                  .attr("cx", function(d) {
                      return xScale(d[0]);  // Circle's X
                  })
                  .attr("cy", function(d) {
                      return yScale(d[1]);  // Circle's Y
                  })
                  .each("end", function() {  // End animation
                      d3.select(this)  // 'this' means the current element
                          .transition()
                          .duration(500)
                          .style("fill", "black")  // Change color
                          .attr("r", 3);  // Change radius
                  });
              }



              return{
                create: create,
                update: update

              }
            })("#plsr-chart");




            // Load Data
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
                                update(false);
                            });
                        });
                    });
                });
            });


            // API Call To Calculate PLSR
            var update = function(animate) {
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
                      item.name = payload.loadingNames[index];
                      return item;
                    });
                    var vectors = payload.vectors.map(function(item, index) {
                      item.name = payload.vectorNames[index];
                      return item;
                    });
                    var abs = payload.maxValue * 1.2;
                    
                    
                    if (animate) chart.update(abs, vectors, genes);
                    else chart.create(abs, vectors, genes);
                    osApi.setBusy(false);
                });
            };
          
        }
    }
})();
