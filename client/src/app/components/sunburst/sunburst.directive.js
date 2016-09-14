(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osSunburst', sunburst);

    /** @ngInject */
    function sunburst() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/sunburst/sunburst.html',
            controller: SunburstController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SunburstController(d3, osApi, osCohortService, $state, $timeout, $scope, $stateParams, $window) {

            var vm = this;
            vm.datasource = osApi.getDataSource();

            var data;
            osApi.setBusy(true);
            osApi.query("biomarker_immune_tree").then(function(response){
                osApi.setBusy(false);
                data = response.data[0];
                draw(data);
            });


            var draw = function(data){
                var layout = osApi.getLayout();
                var height = $window.innerHeight - 180;
                var width  = ($window.innerWidth - layout.left - layout.right);
                var radius = (Math.min( (width*.5), height) / 2) - 10;

                var x = d3.scaleLinear().range([0, 2 * Math.PI]);
                var y = d3.scaleSqrt().range([0, radius]);

                var color = d3.scaleOrdinal(d3.schemeCategory20);

                var partition = d3.partition();

                var formatNumber = d3.format(",d");

                var arc = d3.arc()
                    .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
                    .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
                    .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
                    .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

                var root = d3.hierarchy(data);
                    root.sum(function(d) { return d.size; });


                var svg = d3.select("#sunburst-chart").append("svg")
                    .attr("width", width)
                    .attr("height", height);

                var sun1 = svg.append("g")
                    .attr("transform", "translate(" + (radius+10) + "," + (radius) + ")");

                var g = sun1.selectAll("path")
                  .data(partition(root).descendants())
                .enter().append("g");

                g.append("path")
                  .attr("d", arc)
                  .style("fill", function(d) { return color((d.children ? d : d.parent).data.name); })
                  .style("stroke","#FFF")
                  .style("stroke-width","2") 
                  .on("click", click1);
                // g.append("text")
                //   .text(function(d) { return d.data.name + "\n" + formatNumber(d.value); });


                function click1(d) {
                  sun1.transition()
                      .duration(750)
                      .tween("scale", function() {
                        var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                            yd = d3.interpolate(y.domain(), [d.y0, 1]),
                            yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
                        return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
                      })
                    .selectAll("path")
                      .attrTween("d", function(d) { return function() { return arc(d); }; });
                }

                var sun2 = svg.append("g")
                    .attr("transform", "translate(" + (width-radius-10) + "," + (radius) + ")");

                g = sun2.selectAll("path")
                  .data(partition(root).descendants())
                    .enter().append("g");

                g.append("path")
                  .attr("d", arc)
                  .style("fill", function(d) { return color((d.children ? d : d.parent).data.name); })
                  .style("stroke","#FFF")
                  .style("stroke-width","2") 
                  .on("click", click2);
                // g.append("text")
                //   .text(function(d) { return d.data.name + "\n" + formatNumber(d.value); });


                function click2(d) {
                  sun2.transition()
                      .duration(750)
                      .tween("scale", function() {
                        var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                            yd = d3.interpolate(y.domain(), [d.y0, 1]),
                            yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
                        return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
                      })
                    .selectAll("path")
                      .attrTween("d", function(d) { return function() { return arc(d); }; });
                }


            }
        }
    }
})();
