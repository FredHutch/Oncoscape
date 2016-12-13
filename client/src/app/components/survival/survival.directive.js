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
                var co = vm.cohorts.filter(function(v) { return !(v.type == "UNSAVED"); });
                co.push(c);
                vm.cohorts = co;
                draw();
            };
            osCohortService.onCohortChange.add(onCohortChange);


            vm.toggle = function() {
                draw();
            };

            // Create D3 Elements
            var elContainer = angular.element("#survival-chart");
            var elChart = d3.select("#survival-chart").append("svg");
            var elBrush = elChart.append("g").attr("class", "brush");
            var elSurvival = elChart.append("g");
            var elXAxis = elChart.append("g").attr("class", "axis");
            var elYAxis = elChart.append("g").attr("class", "axis");
            var brush;


            // Base Layout
            var layout = {
                width: 0,
                height: 0,
                xScale: null,
                yScale: null,
                xAxis: d3.axisBottom().ticks(5),
                yAxis: d3.axisLeft().ticks(5)
            };

            var onBrushEnd = function() {
                if (!d3.event.selection) return;
                var s = d3.event.selection;
                var survivalRange = [
                    Math.round(layout.xScale.invert(s[0])),
                    Math.round(layout.xScale.invert(s[1]))
                ];

                // Of Visible Cohorts - Figure out the ids
                var activeCohorts = vm.cohorts.filter(function(v) { return v.show; }).filter(function(v) { return (v.type !== "UNSAVED"); });
                var hasAllPatients = activeCohorts.reduce(function(p, c) {
                    if (c.name == "All Patients + Samples") p = true;
                    return p;
                }, false);

                var cohortData = osCohortService.getData();
                var patientMap = cohortData.patientMap;
                var ids = (hasAllPatients) ? Object.keys(cohortData.patientMap) : [].concat.apply([], activeCohorts.map(function(v) { return v.patientIds; }));
                ids = ids.filter(function(v) {
                    try {
                        var time = patientMap[v].survival.time;
                        return (time >= survivalRange[0] && time <= survivalRange[1])
                    } catch (e) { return false; }
                });
                osCohortService.setCohort(ids, "Survival", osCohortService.PATIENT);
                elBrush.call(brush.move, null);

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
                    .range([layout.height - 50, 1]);

                layout.xAxis.scale(layout.xScale);
                layout.yAxis.scale(layout.yScale);

                elYAxis.attr("transform", "translate(50, 10)").call(layout.yAxis);
                elXAxis.attr("transform", "translate(0, " + (layout.yScale(0) + 10) + ")").call(layout.xAxis);

                brush = d3.brushX().extent([
                    [50, 10],
                    [layout.width, layout.height - 40]
                ]);
                brush.on("end", onBrushEnd);
                elBrush.call(brush);

            }

            var addCurve = function(survivalDatum) {

                var data = survivalDatum.survival.data;
                var color = survivalDatum.color;

                var pts = [];
                for (var i = 0; i < data.line.length; i++) {
                    var line = data.line[i];
                    if (line < 0) line = 0;
                    if (i % 2 == 0) {
                        pts.push(layout.xScale(line));
                    } else {
                        pts.push(layout.yScale(line) + 10);
                    }
                }
                pts = pts.join(",");
                elSurvival.append("polyline")
                    .attr("class", "line")
                    .style("stroke", color)
                    .style("fill", "none")
                    .attr("stroke-width", 1)
                    .attr("points", pts)
                    .datum(survivalDatum)
                    .on("mouseover", function() {
                        d3.select(this).attr("stroke-width", 4)
                    })
                    .on("mouseout", function() {
                        d3.select(this).attr("stroke-width", 2)
                    })
                    .on("mousedown", function() {
                        osCohortService.setCohort(survivalDatum);
                    });

                data.ticks.forEach(function(element) {
                    elSurvival.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 1)
                        .attr("stroke", color)
                        .attr("x1", layout.xScale(element.time))
                        .attr("x2", layout.xScale(element.time))
                        .attr("y1", layout.yScale(element.percentDead) + 10)
                        .attr("y2", layout.yScale(element.percentDead) + 2);
                }, this);

            };


            var draw = function() {
                osApi.setBusy(true);

                // Clear Lines
                elSurvival.selectAll(".line").remove();
                elSurvival.selectAll(".tick").remove();

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

                osApi.setBusy(false);

            };

            draw();





            osApi.onResize.add(draw);
            angular.element($window).bind('resize', _.debounce(draw, 300));

            // Destroy
            $scope.$on('$destroy', function() {
                osCohortService.onCohortChange.add(onCohortChange);
            });


        }
    }
})();