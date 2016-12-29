(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTrayPiechart', trayPiechart);

    /** @ngInject */
    function trayPiechart(d3) {

        var directive = {
            restrict: 'E',
            scope: {
                data1: '=chartData1',
                data2: '=chartData2',
                height: '=chartHeight'
            },
            link: TrayChartLink,
            replace: false
        };

        return directive;

        /** @ngInject */
        function TrayChartLink(scope, element) {
            var chart = d3.select(element[0]).append("svg").attr("class", "tray-chart").style("height", scope.height + "px");
            var chart1 = chart.append("g").classed("chartLayer", true);
            var chart2 = chart.append("g").classed("chartLayer", true);

            // var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
            //     return d.tip;
            // });
            // chart.call(elTip);
            scope.$watch('data1', function(data) { draw(chart1, data, 0); });
            scope.$watch('data2', function(data) { draw(chart2, data, scope.height - 10); });


            var draw = function(el, data, offset) {

                var arcs = d3.pie()
                    .sort(null)
                    .value(function(d) {
                        return d.value;
                    })
                    (data);

                var arc = d3.arc()
                    .outerRadius((scope.height / 3) + 3)
                    .innerRadius((scope.height / 3) - 13)
                    .padAngle(0.03)
                    .cornerRadius(0);


                el.attr("transform", "translate(" + [(scope.height / 2) + offset, scope.height / 2] + ")");
                var colors = ["#0b97d3", "#EAEAEA"];
                var block = el.selectAll(".arc")
                    .data(arcs)
                    .attr("d", arc)
                    .attr("id", function(d, i) { return "arc-" + i })
                    .attr("fill", function(d, i) { return colors[i]; });

                var newBlock = block.enter().append("g").classed("arc", true);

                newBlock.append("path")
                    .attr("d", arc)
                    .attr("id", function(d, i) { return "arc-" + i })
                    //.attr("stroke", "gray")
                    .attr("fill", function(d, i) { return colors[i]; });



            }

        }
    }
})();