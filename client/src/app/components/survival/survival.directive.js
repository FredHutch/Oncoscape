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
            vm.cohort = osCohortService.getCohort();
            var onCohortChange = function(c) {
                vm.cohort = c;
                draw();
            };
            osCohortService.onCohortChange.add(onCohortChange);


            vm.toggle = function() {
                draw();
            };

            var formatPercent = function(d) {
                return d + "%";
            }
            var formatDays = function(d) {
                if (Math.abs(d) == 0) return d;
                if (Math.abs(d) < 30) return d + " Days";
                if (Math.abs(d) < 360) return Math.round((d / 30.4) * 10) / 10 + " Months";
                return Math.round((d / 365) * 10) / 10 + " Years";
            };

            // Create D3 Elements
            var elContainer = angular.element("#survival-chart");
            var elChart = d3.select("#survival-chart").append("svg");
            var elBrush = elChart.append("g").attr("class", "brush");
            var elSurvival = elChart.append("g");
            var elXAxis = elChart.append("g").attr("class", "axis");
            var elYAxis = elChart.append("g").attr("class", "axis");
            var brush = d3.brush();




            // Base Layout
            var layout = {
                width: 0,
                height: 0,
                xScale: null,
                yScale: null,
                xAxis: d3.axisBottom().ticks(5).tickFormat(formatDays),
                yAxis: d3.axisLeft().ticks(5).tickFormat(formatPercent)
            };

            var onBrushEnd = function() {

                if (!d3.event.selection) {
                    osCohortService.setCohort([], "Survival", osCohortService.PATIENT);
                    return;
                }
                var s = d3.event.selection;
                osApi.setBusy(true);

                // Map Selection To Time + Percent Ranges
                var rangeSort = function(a, b) { return a - b; };

                var timeRange = [s[0][0], s[1][0]].map(layout.xScale.invert).sort(rangeSort);
                var percentRange = [s[0][1] - 10, s[1][1] - 10].map(layout.yScale.invert).sort(rangeSort);


                // Determine Cohorts To Search (If All Patients Cohort Is Included, No Need To Look At Others)
                var cohortsToSearch = vm.cohorts.filter(function(v) { return (v.show); });
                if (cohortsToSearch.indexOf(vm.cohort) == -1) cohortsToSearch.push(vm.cohort);


                // Build Patient Ids
                var patientIds = [];
                var cohortFilter = function(line) {
                    return (
                        (line.time >= timeRange[0]) &&
                        (line.time <= timeRange[1]) &&
                        (line.survivalFrom <= percentRange[1]) &&
                        (line.survivalTo >= percentRange[0])
                    );
                };
                var cohortReduce = function(p, c) {
                    return _.union(p, c.alive, c.dead);
                };
                var execute = function() {
                    for (var i = 0; i < cohortsToSearch.length; i++) {
                        var data = cohortsToSearch[i].survival.data;
                        patientIds = data.lines.filter(cohortFilter).reduce(cohortReduce, patientIds);
                        patientIds = data.ticks.filter(cohortFilter).reduce(cohortReduce, patientIds);

                    }
                    osCohortService.setCohort(patientIds, "Survival", osCohortService.PATIENT);
                };

                // Loop Through Cohorts To Add Patient Ids Of Qualifying Lines + Ticks
                if (cohortsToSearch.length > 2) $timeout(execute, 50);
                else execute();
            };
            // Utility Methods
            var setScale = function(timelineDomain) {
                var osLayout = osApi.getLayout();
                layout.width = $window.innerWidth - osLayout.left - osLayout.right - 60;
                layout.height = $window.innerHeight - 125;
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


                brush.extent([
                    [50, 10],
                    [layout.width, layout.height - 40]
                ]);
                brush.on("end", onBrushEnd);
                elBrush.call(brush);

            }

            var addCurve = function(survivalDatum) {

                var data = survivalDatum.survival.data;
                var color = survivalDatum.color;

                var time = 0;
                data.lines.forEach(function(element) {

                    elSurvival.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 0.5)
                        .attr("stroke", color)
                        .attr("x1", layout.xScale(element.time))
                        .attr("x2", layout.xScale(element.time))
                        .attr("y1", layout.yScale(element.survivalFrom) + 10)
                        .attr("y2", layout.yScale(element.survivalTo) + 10)
                        .datum(element);
                    elSurvival.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 0.5)
                        .attr("stroke", color)
                        .attr("x1", layout.xScale(time))
                        .attr("x2", layout.xScale(element.time))
                        .attr("y1", layout.yScale(element.survivalFrom) + 10)
                        .attr("y2", layout.yScale(element.survivalFrom) + 10)

                    time = element.time;
                });

                data.ticks.forEach(function(element) {
                    elSurvival.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 0.5)
                        .attr("stroke", color)
                        .attr("x1", layout.xScale(element.time))
                        .attr("x2", layout.xScale(element.time))
                        .attr("y1", layout.yScale(element.survivalFrom) + 12)
                        .attr("y2", layout.yScale(element.survivalFrom) + 8)
                        .datum(element);
                }, this);

                // If Censor Occurs After Last Death Add line
                if (data.ticks.length > 1 && data.lines.length > 1) {
                    var lastTick = data.ticks[data.ticks.length - 1];
                    var lastLine = data.lines[data.lines.length - 1];
                    if (lastTick.time > lastLine.time) {
                        elSurvival.append("line")
                            .attr("class", "line")
                            .attr("stroke-width", 0.5)
                            .attr("stroke", color)
                            .attr("x1", layout.xScale(lastLine.time))
                            .attr("x2", layout.xScale(lastTick.time))
                            .attr("y1", layout.yScale(lastTick.survivalFrom) + 10)
                            .attr("y2", layout.yScale(lastTick.survivalFrom) + 10);
                    }
                }


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

                // Add Survival
                minMax.min = Math.min(minMax.min, vm.cohort.survival.min);
                minMax.max = Math.max(minMax.max, vm.cohort.survival.max);

                // Set Scale
                setScale([minMax.min - 1, minMax.max + 1]);

                // Draw Lines
                for (var i = 0; i < survivalData.length; i++) {
                    addCurve(survivalData[i]);
                }

                if (survivalData.indexOf(vm.cohort) == -1) addCurve(vm.cohort);

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