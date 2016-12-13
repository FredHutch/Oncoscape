(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osSurvival', survival);

    /** @ngInject */
    function survival() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/survival/survival.html',
            controller: SurvivalController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SurvivalController(d3, osApi, osCohortService, $state, $timeout, $scope, $stateParams, $window, _) {

            // Loading . . . 
            osApi.setBusy(true);

            // View Model
            var vm = this;
            vm.datasource = osApi.getDataSource();
            vm.cohorts = osCohortService.getCohorts();

            var onCohortChange = function(c) {
                //cohort = c;
                //setSelected();
                console.log("cohort change")
            };
            osCohortService.onCohortChange.add(onCohortChange);
            var onCohortsChange = function(c) {
                //cohort = c;
                //setSelected();
                console.log("cohorts change")
            };
            osCohortService.onCohortsChange.add(onCohortsChange);

            vm.toggle = function() {
                // osCohortService.getSurvivalData(vm.cohorts.filter(function(c) {
                //     return c.show;
                // }), vm.all.show, "SurvivalController");
            };

            // Create D3 Elements
            var elContainer = angular.element("#survival-chart");
            var elChart = d3.select("#survival-chart").append("svg");
            var elXAxis = elChart.append("g").attr("class", "axis");
            var elYAxis = elChart.append("g").attr("class", "axis");

            // Base Layout
            var layout = {
                width: 0,
                height: 0,
                xScale: null,
                yScale: null,
                xAxis: d3.axisBottom().ticks(5),
                yAxis: d3.axisLeft().ticks(5)
            };

            // Utility Methods
            var setScale = function(timelineDomain) {
                var osLayout = osApi.getLayout();
                layout.width = $window.innerWidth - osLayout.left - osLayout.right - 60;
                layout.height = $window.innerHeight - 160;
                elContainer.css("margin-left", osLayout.left + 20);
                elChart
                    .attr("width", '100%')
                    .attr("height", layout.height);

                layout.xScale = d3.scaleLinear()
                    .domain(timelineDomain)
                    .range([50, layout.width]);

                layout.yScale = d3.scaleLinear()
                    .domain([0, 100])
                    .range([layout.height - 50, 0]);
                // debugger;
                // elYAxis.attr("transform", "translate(50, 10)").call(layout.yAxis);
                // elXAxis.attr("transform", "translate(0, " + (layout.yScale(0) + 10) + ")").call(layout.xAxis);
            }

            var addCurve = function(survivalDatum) {

                var data = survivalDatum.survival.data;
                var color = survivalDatum.color;


                var pts = [];
                for (var i = 0; i < data.line.length; i++) {
                    if (i % 2 == 0) {
                        pts.push(layout.xScale(data.line[i]));
                    } else {
                        pts.push(layout.yScale(data.line[i]))
                    }
                }
                pts = pts.join(",");
                elChart.append("polyline")
                    .attr("class", "line")
                    .style("stroke", color)
                    .style("fill", "none")
                    .attr("stroke-width", 1)
                    .attr("points", pts);


                data.ticks.forEach(function(element) {
                    elChart.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 0.5)
                        .attr("stroke", color)
                        .attr("x1", layout.xScale(element.time))
                        .attr("x2", layout.xScale(element.time))
                        .attr("y1", layout.yScale(element.percentDead))
                        .attr("y2", layout.yScale(element.percentDead) - 5);
                }, this);




                console.log("ADD CURVE");
            }


            var draw = function() {
                osApi.setBusy(true);

                // Clear Lines
                elChart.selectAll(".line").remove();
                elChart.selectAll(".tick").remove();

                var survivalData = vm.cohorts.filter(function(v) { return v.show });
                var minMax = survivalData.reduce(function(p, c) {
                    p.min = Math.min(p.min, c.survival.min);
                    p.max = Math.max(p.max, c.survival.max);
                    return p;
                }, { min: Infinity, max: -Infinity });

                // Set Scale
                setScale([minMax.min - 1, minMax.max + 1]);

                // Draw Lines
                for (var i = 0; i < survivalData.length; i++) {
                    addCurve(survivalData[i]);
                }

                // Add Brush
                // elChart.append("g")
                //     .attr("class", "brush")
                //     .call(brush);

                console.log(survivalData.length);
                osApi.setBusy(false);

            };

            draw();





            osApi.onResize.add(draw);
            angular.element($window).bind('resize', _.debounce(draw, 300));

            // Destroy
            $scope.$on('$destroy', function() {
                osCohortService.onCohortChange.add(onCohortChange);
                osCohortService.onCohortsChange.add(onCohortsChange);

            });


        }
    }
})();