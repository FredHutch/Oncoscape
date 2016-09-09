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
                debugger;
                draw();
            });

            function draw(){

                var width = 960,
                    height = 700,
                    radius = (Math.min(width, height) / 2) - 10;

                var color = d3.scaleOrdinal(d3.schemeCategory20c)

                var chart = d3.select('#sunburst-chart')
                    .append('svg')
                    .attr('width', width)
                    .attr('height', height)
                    .append('g')
                    .attr('transform', 'translate(' + width/2 + ',' + height/2 + ')');

                var partition = d3.partition()
                    .size([360, radius])
                    .padding(0);

                var root = d3.hierarchy(data, function(d) { return d.children })
                    .sum( function(d) { if(d.children) { return 0 } else {  return 1 } })
                    .sort(null);

                partition(root);


                var xScale = d3.scaleLinear()
                    .domain([0, radius])
                    .range([0, Math.PI * 2])
                    .clamp(true);

                var arc = d3.arc()
                    .startAngle(function(d) { return xScale(d.x0) })
                    .endAngle(function(d) { return xScale(d.x1) })
                    .innerRadius(function(d) { return d.y0 })
                    .outerRadius(function(d) { return d.y1 })

                var g = chart.selectAll("g")
                    .data(root.descendants())
                    .enter().append("g");


                var path = g.append('path')
                        .attr("display", function(d) { return d.depth ? null : "none"; })
                        .attr("d", arc)
                        .attr("fill-rule", "evenodd")
                        .style('stroke', '#fff')
                        .style("fill", function(d) { return color((d.children ? d : d.parent).data.name); });
                var text = g.append("text")
                        //.attr("transform", function(d) { return "rotate(" + computeTextRotation(d) + ")"; })
                        //.attr("x", function(d) { return y(d.y); })
                        .attr("dx", "6") // margin
                        .attr("dy", ".35em") // vertical-align
                        .text("HEY BOO");


            };
        }
    }
})();
