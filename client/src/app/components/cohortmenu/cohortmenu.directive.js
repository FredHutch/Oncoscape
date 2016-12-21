(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osCohortMenu', cohortMenu);

    /** @ngInject */
    function cohortMenu() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/cohortmenu/cohortmenu.html',
            controller: CohortMenuController,
            controllerAs: 'vm',
            scope: {},
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CohortMenuController(osApi, osCohortService, $state, $scope, $sce, $timeout, $rootScope, $filter, d3) {


            // View Model
            var vm = this;
            vm.cohorts = [];
            vm.cohort = null;
            vm.cohortFeatures = [];
            vm.cohortFeature = null;
            vm.cohortSummary = "";


            // Cohort Service Integration
            angular.element("#cohortMenu").css({ "display": "none" });
            osCohortService.onCohortsChange.add(function(cohorts) {
                vm.cohorts = cohorts;
            });
            osCohortService.onCohortChange.add(function(cohort) {
                var summary =
                    $filter('number')(cohort.numSamples) + " Samples<br /> " +
                    $filter('number')(cohort.numPatients) + " Patients <br />" +
                    $filter('number')(cohort.numClinical) + " Patients With Clinical Data<br />" +
                    $filter('number')(cohort.survival.total) + " Patients With Survival Outcome<br />";
                vm.cohortSummary = $sce.trustAsHtml(summary);

                if (angular.isUndefined(cohort)) return;
                $timeout(function() {
                    var featureIdx = (vm.cohortFeature !== null) ? vm.cohortFeatures.indexOf(vm.cohortFeature) : 0;
                    vm.cohort = cohort;
                    vm.cohortFeatures = cohort.histogram.features;
                    vm.cohortFeature = cohort.histogram.features[featureIdx];
                });
                updateSurvival(vm.cohorts.concat([cohort]));
            });

            // Cohort edit
            vm.setCohort = function(cohort) {
                if (angular.isString(cohort)) {
                    osCohortService.setCohort([], osCohortService.ALL, osCohortService.SAMPLE)
                } else {
                    osCohortService.setCohort(cohort);
                }
            };

            vm.updateCohort = function() {
                if (vm.cohort.type == "UNSAVED") {
                    osCohortService.saveCohort(vm.cohort);
                } else {
                    osCohortService.deleteCohort(vm.cohort);
                }
            }



            // Show Hide Logic
            vm.show = false;
            $rootScope.$on('$destroy', function() { vm.show = false; });
            $rootScope.$on('$stateChangeStart', function(event, toState) {
                switch (toState.name) {
                    case "landing":
                    case "tools":
                    case "datasource":
                        vm.show = false;
                        angular.element("#cohortMenu").css({ "display": "none" });
                        break;
                    default:
                        vm.show = true;
                        angular.element("#cohortMenu").css({ "display": "block" });
                        break;
                }
            });


            // Tray Expand / Collapse
            var elTray = angular.element(".cohort-menu");
            var isLocked = true;
            var mouseOver = function() { elTray.removeClass("tray-collapsed-left"); };
            var mouseOut = function() { elTray.addClass("tray-collapsed-left"); };
            vm.toggle = function() {
                isLocked = !isLocked;
                angular.element("#cohortmenu-lock")
                    .addClass(isLocked ? 'fa-lock' : 'fa-unlock-alt')
                    .removeClass(isLocked ? 'fa-unlock-alt' : 'fa-lock')
                    .attr("locked", isLocked ? "true" : "false");
                if (isLocked) {
                    elTray
                        .unbind("mouseover", mouseOver)
                        .unbind("mouseout", mouseOut)
                        .removeClass("tray-collapsed-left");
                } else {
                    elTray
                        .addClass("tray-collapsed-left")
                        .bind("mouseover", mouseOver)
                        .bind("mouseout", mouseOut);
                }
                osApi.onResize.dispatch();
            };



            // Histogram 
            var histSvg = d3.select("#cohortmenu-chart").append("svg")
                .attr("width", 260)
                .attr("height", 150)
                .append("g");
            var histSingleValueLabel = angular.element("#cohortmenu-single-value");
            var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
                return "Range: " + d.label + "<br>Count: " + d.value + " of " + vm.cohortFeature.data.count + "<br>Percent: " + $filter('number')((d.value / vm.cohortFeature.data.count) * 100, 2) + "%";
            });
            histSvg.call(elTip);
            $scope.$watch('vm.cohortFeature', function() {

                // Histogram
                if (vm.cohortFeature === null) return;
                var data = vm.cohortFeature.data;
                if (data.type == "factor") {
                    if (data.hist.length == 1) {
                        histSingleValueLabel.text(data.hist[0].label).css("display", "block").removeClass("cohortmenu-single-value-numeric");
                        histSvg.classed("cohort-chart-hide", true);
                        return;
                    }
                } else {
                    if (data.min == data.max) {
                        histSingleValueLabel.text(data.min).css("display", "block").addClass("cohortmenu-single-value-numeric");
                        histSvg.classed("cohort-chart-hide", true);
                        return;
                    }
                }
                histSingleValueLabel.text('').css("display", "none");
                histSvg.classed("cohort-chart-hide", false);
                var barWidth = Math.floor((250 - data.bins) / data.bins);


                if (data.histRange[0] > 0) data.histRange[0] -= 2;
                var yScale = d3.scaleLinear()
                    .domain([0, data.histRange[1]])
                    .range([0, 135]);
                var bars = histSvg
                    .selectAll(".cohort-menu-chart-bar")
                    .data(data.hist);
                bars.enter()
                    .append("rect")
                    .attr("class", "cohort-menu-chart-bar")
                    .attr("x", function(d, i) { return ((barWidth + 1) * i) + 4; })
                    .attr("y", function(d) { return 150 - yScale(d.value); })
                    .attr("height", function(d) { return yScale(d.value); })
                    .attr("width", barWidth)
                    .on("mouseover", elTip.show)
                    .on("mouseout", elTip.hide);
                bars
                    .transition()
                    .duration(300)
                    .attr("x", function(d, i) { return (barWidth + 1) * i; })
                    .attr("y", function(d) { return 150 - yScale(d.value); })
                    .attr("height", function(d) { return yScale(d.value); })
                    .attr("width", barWidth);
                bars.exit()
                    .transition()
                    .duration(300)
                    .attr("y", 150)
                    .attr("height", 0)
                    .style('fill-opacity', 1e-6)
                    .remove();
                var labels = histSvg
                    .selectAll("text")
                    .data(data.hist);
                labels.enter()
                    .append("text")
                    .attr("x", function(d, i) { return (4 + (barWidth + 1) * i) + (barWidth * 0.5); })
                    .attr("y", function(d) { return 145 - yScale(d.value); })
                    .attr("fill", "#000")
                    .attr("height", function(d) { return yScale(d.value); })
                    .attr("width", barWidth)
                    .attr("font-size", "8px")
                    .attr("text-anchor", "middle")
                    .text(function(d) { return d.label; });
                labels
                    .transition()
                    .duration(300)
                    .attr("x", function(d, i) { return ((barWidth + 1) * i) + (barWidth * 0.5); })
                    .attr("y", function(d) {
                        var y = 145 - yScale(d.value);
                        if (y < 0) y = 20;
                        return y;
                    })
                    .text(function(d) { return d.label; });
                labels.exit()
                    .transition()
                    .duration(300)
                    .attr("y", 150)
                    .attr("height", 0)
                    .style('fill-opacity', 1e-6)
                    .remove();

            });


            var formatPercent = function(d) {
                if (d == 100) return d;
                return d + "%";
            }
            var formatDays = function(d) {
                if (Math.abs(d) === 0) return d;
                if (Math.abs(d) < 30) return d + " Days";
                if (Math.abs(d) < 360) return Math.round((d / 30.4) * 10) / 10 + " Mos";
                return Math.round((d / 365) * 10) / 10 + " Yrs";
            };



            // Survival
            var surSvg = d3.select("#cohortmenu-survival").append("svg");
            var surLines = surSvg.append("g")
                .selectAll("cohortmenu-survival-percent-line")
                .data([0.25, 0.5, 0.75]);

            surLines.enter()
                .append("line").attr("class", "cohortmenu-survival-percent-line")
                .attr("stroke-width", 1)
                .attr("stroke", "#EAEAEA")
                .attr("x1", 0).attr("x2", 250).attr("y1", function(d) {
                    return (d * 140);
                }).attr("y2", function(d) {
                    return (d * 140);
                });

            var surXAxis = surSvg.append("g").attr("class", "axisCohort");
            var surLayout = {
                width: 250,
                height: 170,
                xScale: null,
                yScale: null,
                xAxis: d3.axisBottom().ticks(4).tickFormat(formatDays)
            };
            surSvg.attr("width", '100%').attr("height", surLayout.height);
            var surAddCurve = function(curve, color) {


                // ticks
                var data = curve.data;
                var time = 0;
                data.lines.forEach(function(element) {

                    surSvg.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 0.5)
                        .attr("stroke", color)
                        .attr("x1", surLayout.xScale(element.time))
                        .attr("x2", surLayout.xScale(element.time))
                        .attr("y1", surLayout.yScale(element.survivalFrom))
                        .attr("y2", surLayout.yScale(element.survivalTo));

                    surSvg.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 0.5)
                        .attr("stroke", color)
                        .attr("x1", surLayout.xScale(time))
                        .attr("x2", surLayout.xScale(element.time))
                        .attr("y1", surLayout.yScale(element.survivalFrom))
                        .attr("y2", surLayout.yScale(element.survivalFrom));

                    time = element.time;
                });

                data.ticks.forEach(function(element) {
                    surSvg.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 0.5)
                        .attr("stroke", color)
                        .attr("x1", surLayout.xScale(element.time))
                        .attr("x2", surLayout.xScale(element.time))
                        .attr("y1", surLayout.yScale(element.survivalFrom))
                        .attr("y2", surLayout.yScale(element.survivalFrom) - 2);
                }, this);

                // If Censor Occurs After Last Death Add line
                if (data.ticks.length === 0 || data.lines.length === 0) return;
                var lastTick = data.ticks[data.ticks.length - 1];
                var lastLine = data.lines[data.lines.length - 1];
                if (lastTick.time > lastLine.time) {
                    surSvg.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", 0.5)
                        .attr("stroke", color)
                        .attr("x1", surLayout.xScale(lastLine.time))
                        .attr("x2", surLayout.xScale(lastTick.time))
                        .attr("y1", surLayout.yScale(lastTick.survivalFrom))
                        .attr("y2", surLayout.yScale(lastTick.survivalFrom));
                }
            };

            var updateSurvival = function(cohorts) {
                var visibleCohorts = cohorts;
                // .filter(function(v) {
                //     return v.show;
                // });
                var minMax = visibleCohorts.reduce(function(p, c) {
                    p.max = Math.max(p.max, c.survival.max);
                    p.min = Math.min(p.min, c.survival.min);
                    return p;
                }, { max: -Infinity, min: Infinity });

                surLayout.xScale = d3.scaleLinear()
                    .domain([minMax.min, minMax.max])
                    .range([0, surLayout.width - 1]);

                surLayout.yScale = d3.scaleLinear()
                    .domain([0, 100])
                    .range([surLayout.height - 30, 0]);

                surLayout.xAxis.scale(surLayout.xScale);
                surXAxis.attr("transform", "translate(0, " + (surLayout.yScale(0)) + ")")
                    .call(surLayout.xAxis)
                    .selectAll("text")
                    .style("text-anchor", function(d, i) { return (i === 0) ? "start" : "center"; });

                surSvg.selectAll(".line").remove();
                for (var i = 0; i < visibleCohorts.length; i++) {
                    surAddCurve(visibleCohorts[i].survival, visibleCohorts[i].color);
                }
            };

        }
    }

})();