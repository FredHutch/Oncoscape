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
        function SurvivalController(d3, osApi, osCohortService, $state, $timeout, $scope, $stateParams, $window) {

            // Loading . . . 
            osApi.setBusy(true);

            // View Model
            var vm = this;
            vm.datasource = osApi.getDataSource();
            vm.cohorts = osCohortService.getCohorts();
            vm.pAll = "";
            vm.pSelected = "";


            // Format Elements
            var formatPercent = function(d) { return Math.round(d * 100) + "%"; };
            var formatDays = function(d) {
                if (Math.abs(d) === 0) return d;
                if (Math.abs(d) < 30) return d + " Days";
                if (Math.abs(d) < 360) return Math.round((d / 30.4) * 10) / 10 + " Months";
                return Math.round((d / 365) * 10) / 10 + " Years";
            };

            // Create D3 Elements
            var elContainer = angular.element("#survival-chart");
            var elChart = d3.select("#survival-chart").append("svg").attr("width", "100%").attr("height", "100%");
            var elBrush = elChart.append("g");
            var elCurves = elChart.append("g");
            var elXAxis = elChart.append("g").attr("class", "axis");
            var elYAxis = elChart.append("g").attr("class", "axis").attr("transform", "translate(50, 10)");

            // Base Layout
            var layout = {
                width: 0,
                height: 0,
                xScale: d3.scaleLinear(),
                yScale: d3.scaleLinear(),
                xDomain: [0, 1], // Effected By Survival Min Max
                yDomain: [0, 1],
                xAxis: d3.axisBottom().ticks(5).tickFormat(formatDays),
                yAxis: d3.axisLeft().ticks(5).tickFormat(formatPercent)
            };

            // Curve Functions + Events
            var curveFunction = d3.line()
                .curve(d3.curveStepBefore)
                .x(function(d) { return Math.round(layout.xScale(d.t)); })
                .y(function(d) { return Math.round(layout.yScale(d.s)); });
            var onCurveMouseOver = function() {}; // d3.event.target.style.strokeWidth = "3px"; };
            var onCurveMouseOut = function() {}; // d3.event.target.style.strokeWidth = "1px"; };

            var addCurve = function(cohort) {

                // Create Group To Hold Curve
                var g = elCurves.append("g")
                    .attr("class", "curve")
                    .attr("transform", "translate(0, 10)");

                // Add Ticks
                var ticks = cohort.survival.compute.filter(function(v) { return v.c.length > 0; });
                ticks.forEach(function(t) {
                    var tx = Math.round(layout.xScale(t.t));
                    var ty = Math.round(layout.yScale(t.s));
                    g.append("line")
                        .attr("class", "survival-tick")
                        .style("stroke", cohort.color)
                        .attr("x1", tx)
                        .attr("x2", tx)
                        .attr("y1", ty - 3)
                        .attr("y2", ty + 3);
                });

                // Append Path
                g.append("path")
                    .datum(cohort.survival.compute)
                    .attr("tip", cohort.name + " Vs. All Patients + Samples<br> p : " + cohort.survival.logrank.pValue)
                    .attr("class", "survival-line")
                    .style("stroke", cohort.color)
                    .attr("d", curveFunction)
                    .on("mouseover", onCurveMouseOver)
                    .on("mouseout", onCurveMouseOut)
                    .on("click", function() {
                        osCohortService.setCohort(cohort);
                    });
            };

            // Drawing Methods
            var dataChange = function() {

                // Determine The XDomain
                layout.xDomain = vm.cohorts
                    .filter(function(v) { return v.show; })
                    .reduce(function(p, c) {
                        p[0] = Math.min(p[0], c.survival.compute[0].t);
                        p[1] = Math.max(p[1], c.survival.compute[c.survival.compute.length - 1].t);
                        return p;
                    }, [Infinity, -Infinity]);

                // Trigger Resize
                resize();

            };

            var resize = function() {

                // Get Screen Dimensions
                var osLayout = osApi.getLayout();
                layout.width = $window.innerWidth - osLayout.left - osLayout.right - ((osLayout.left === 0) ? 20 : 0) - ((osLayout.right === 0) ? 20 : 0);
                layout.height = $window.innerHeight - 125;

                // Position container
                elContainer.css({ 'width': layout.width, 'height': layout.height, 'margin-left': (osLayout.left === 0) ? 20 : osLayout.left });

                // Scale Axis
                layout.xScale.domain(layout.xDomain).range([40, layout.width - 40]);
                layout.yScale.domain(layout.yDomain).range([layout.height - 40, 10]);

                layout.xAxis.scale(layout.xScale);
                layout.yAxis.scale(layout.yScale);
                elXAxis.attr("transform", "translate(0, " + (layout.height - 30) + ")").call(layout.xAxis);
                elYAxis.attr("transform", "translate(40, 10)").call(layout.yAxis);

                // Draw Cohorts
                elCurves.selectAll(".curve").remove();

                vm.cohorts
                    .filter(function(v) { return v.show; })
                    .map(addCurve);
            };

            var onCohortChange = function(cohort) {
                vm.cohort = cohort;
                var selectedColor = d3.rgb(vm.cohort.color).toString();
                elCurves.selectAll(".curve").each(function() {
                    var me = d3.select(this);
                    var selected = (d3.select(this).select(".survival-line").style("stroke") == selectedColor);
                    me.classed("survival-line-selected", selected);
                });
                vm.pAll = vm.cohort.survival.logrank.pValue;

                debugger;


                vm.pSelected = osCohortService.km.logranktest(vm.cohorts.filter(function(v) { return v.show; }).map(function(v) { return v.survival.data; }));
            };


            vm.toggle = function() {
                dataChange();
                var lrt = osCohortService.km.logranktest(vm.cohorts.filter(function(v) { return v.show; }).map(function(v) { return v.survival.data; }));
                vm.pSelected = "P: " + lrt.pValue + " DOF: " + lrt.dof;
            };


            // Create
            osApi.onResize.add(resize);
            osCohortService.onCohortChange.add(onCohortChange);
            dataChange();
            onCohortChange(osCohortService.getCohort());
            osApi.setBusy(false);

            // Destroy
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(resize);
                osCohortService.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();