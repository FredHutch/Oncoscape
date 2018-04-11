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
        function SurvivalController(d3, osApi, $state, $timeout, $scope, $stateParams, $window, _) {

            // Loading . . . 
            osApi.setBusy(true);

            // View Model
            var vm = this;
            vm.datasource = osApi.getDataSource();


            vm.cohort = osApi.getCohort();
            vm.cohorts = (osApi.getCohorts().indexOf(vm.cohort) == -1) ?
                osApi.getCohorts().concat([vm.cohort]) : osApi.getCohorts();


            vm.pValues = [];
            vm.setCohort = function(cohort) {
                osApi.setCohort(cohort);
            };


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
            var brush = d3.brush();


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
                .curve(d3.curveStepAfter)
                .x(function(d) { return Math.round(layout.xScale(d.t)); })
                .y(function(d) {
                    return layout.yScale(d.s);
                });
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
                        osApi.setCohort(cohort);
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


            var onBrushEnd = function() {


                if (!d3.event.selection) {
                    osApi.setCohort(vm.cohorts.filter(function(c) { return c.type == "ALL"; })[0]);
                    return;
                }
                var s = d3.event.selection;
                osApi.setBusy(true);

                // Calculate Bounds Of Selection
                var rangeSort = function(a, b) { return a - b; };
                var timeRange = [s[0][0], s[1][0]].map(layout.xScale.invert).sort(rangeSort);
                var percentRange = [s[0][1] - 10, s[1][1] - 10].map(layout.yScale.invert).sort(rangeSort);
                var visibleCohorts = vm.cohorts.filter(function(v) { return v.show; });
                var visibleCompute = visibleCohorts.reduce(function(p, c) { return p.concat(c.survival.compute); }, []);
                var computeInRange = visibleCompute.filter(function(v) {
                    return (
                        (v.t >= this.timeRange[0]) &&
                        (v.t <= this.timeRange[1]) &&
                        (v.s >= this.percentRange[0]) &&
                        (v.s <= this.percentRange[1])
                    );
                }, { timeRange: timeRange, percentRange: percentRange });

                var combinedIds = computeInRange.reduce(function(p, c) { return p.concat(c.c, c.d); }, []);
                var uniqueIds = _.unique(combinedIds);
                osApi.setCohort(uniqueIds, "Survival", osApi.PATIENT);


                //     vm.cohorts[0].survival.compute.filter(function(v) {
                //                 var rv = (
                //                     (v.t >= this.timeRange[0]) &&
                //                     (v.t <= this.timeRange[1]) &&
                //                     (v.s >= this.percentRange[0]) &&
                //                     (v.s <= this.percentRange[1])
                //                 );
                //                 return rv;
                //             }, { timeRange: timeRange, percentRange: percentRange }).reduce(function(p,c){ return p.concat(c.c, c.d); },[]);

                // var patientIds = _.union.apply(null,
                //     vm.cohorts.filter(function(v) {
                //         return v.show;
                //     }).map(function(v) {
                //         return v.survival.compute.filter(function(v) {
                //                 var rv = (
                //                     (v.t >= this.timeRange[0]) &&
                //                     (v.t <= this.timeRange[1]) &&
                //                     (v.s >= this.percentRange[0]) &&
                //                     (v.s <= this.percentRange[1])
                //                 );
                //                 return rv;
                //             }, this)
                //             .map(function(v) {
                //                 return v.c.concat(v.d);
                //             })
                //             .reduce(function(p, c) {
                //                 return p.concat(c);
                //             }, []);
                //     }, { timeRange: timeRange, percentRange: percentRange }));

                // debugger;

                // osApi.setCohort(patientIds, "Survival", osApi.PATIENT);
                osApi.setBusy(false);
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
                if (vm.cohorts.indexOf(vm.cohort) == -1) {
                    addCurve(vm.cohort);
                }

                // Set Selected + Set P Values
                var selectedColor = d3.rgb(vm.cohort.color).toString();
                elCurves.selectAll(".curve").each(function() {
                    var me = d3.select(this);
                    var selected = (d3.select(this).select(".survival-line").style("stroke") == selectedColor);
                    me.classed("survival-line-selected", selected);
                });

                var pValues = vm.cohorts.filter(function(v) { return v != vm.cohort; }).map(function(v) {
                    return {
                        c: [vm.cohort.color, v.color],
                        n: v.name,
                        p: osApi.km.logranktest([vm.cohort.survival.data, v.survival.data]).pValue
                    };

                });

                var all = vm.cohorts.filter(function(v) { return v.show; });
                if (all.length !== 1) {


                    if (vm.cohorts.indexOf(vm.cohort) == -1) {
                        all.unshift(vm.cohort);
                    }
                    all.sort(function(a) {
                        if (vm.cohort.color == a.color) return -1;
                        if (a.color == "#E91E63") return -1;
                        return 0;
                    });
                }

                pValues.unshift({
                    c: all.map(function(v) { return v.color; }),
                    n: 'Visible Cohorts',
                    p: osApi.km.logranktest(all.map(function(v) { return v.survival.data; })).pValue
                });
                vm.pValues = pValues;

                brush.extent([
                    [40, 20],
                    [layout.width - 30, layout.height - 30]
                ]);
                brush.on("end", onBrushEnd);
                // elBrush.call(brush);
            };

            var onCohortsChange = function() {
                vm.cohorts = osApi.getCohorts();
                vm.cohort = osApi.getCohort();
                vm.cohort.show = true;
                vm.cohortsLegend = vm.cohorts.filter(function(v) { return v != vm.cohort; });
                resize();
            };

            var onCohortChange = function() {
                onCohortsChange();
            };

            vm.toggle = function(cohort) {
                if (vm.cohorts.reduce(function(p, c) { p += c.show ? 1 : 0; return p; }, 0) === 0) {
                    alert("You must have at least one cohort visible");
                    cohort.show = true;
                    return;
                }
                dataChange();
                var lrt = osApi.km.logranktest(vm.cohorts.filter(function(v) { return v.show; }).map(function(v) { return v.survival.data; }));
                vm.pSelected = "P: " + lrt.pValue + " DOF: " + lrt.dof;
            };


            // Create
            osApi.onResize.add(resize);
            osApi.onCohortChange.add(onCohortChange);
            osApi.onCohortsChange.add(onCohortsChange);
            dataChange();
            onCohortChange(osApi.getCohort());
            osApi.setBusy(false);

            // Destroy
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(resize);
                osApi.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();