(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTrayBarchart', trayBarchart);

    /** @ngInject */
    function trayBarchart(d3) {

        var directive = {
            restrict: 'E',
            scope: {
                data: '=chartData',
                height: '=chartHeight'
            },
            link: TrayChartLink,
            replace: false
        };

        return directive;

        /** @ngInject */
        function TrayChartLink(scope, element, attrs) {
            var chart = d3.select(element[0]).append("svg").attr("class", "tray-chart").style("height", scope.height + "px");
            var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
                return d.tip;
            });
            chart.call(elTip);
            scope.$watch('data', function(newValue) {
                var barHeight = scope.height - 10;
                var barWidth = (250 / newValue.length) - 1;
                var binding = chart
                    .selectAll("rect")
                    .data(scope.data);
                binding.enter()
                    .append("rect")
                    .style("width", barWidth + "px")
                    .style("x", function(d, i) { return (((barWidth + 1) * i) + 5) + "px"; })
                    .style("height", "0px")
                    .on("mouseover", elTip.show)
                    .on("mouseout", elTip.hide)
                    .transition()
                    .attr("class", "tray-bar")
                    .style("height", function(d) { return (d.value * barHeight) + "px"; })
                    .style("y", function(d) { return (barHeight - (d.value * barHeight) + 5) + "px"; })
                binding.exit().remove();
                binding
                    .transition()
                    .style("width", barWidth + "px")
                    .style("x", function(d, i) { return (((barWidth + 1) * i) + 5) + "px"; })
                    .style("height", function(d) { return (d.value * barHeight) + "px"; })
                    .style("y", function(d) { return (barHeight - (d.value * barHeight) + 5) + "px"; });



            });


        }
    }
})();