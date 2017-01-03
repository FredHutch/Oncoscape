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


            var regression = (function() {

                function Abs(x) { return Math.abs(x) }

                function Sqrt(x) { return Math.sqrt(x) }

                function Exp(x) { return Math.exp(x) }

                function Ln(x) { return Math.log(x) }

                function Power(x, y) { return Math.pow(x, y) }

                var Pi = 3.141592653589793;

                function ChiSq(x, n) {
                    var p = Math.exp(-0.5 * x);
                    if ((n % 2) == 1) { p = p * Math.sqrt(2 * x / Pi) }
                    var k = n;
                    while (k >= 2) {
                        p = p * x / k;
                        k = k - 2;
                    }
                    var t = p;
                    var a = n;
                    while (t > 0.000001 * p) {
                        a = a + 2;
                        t = t * x / a;
                        p = p + t;
                    }
                    return 1 - p
                }

                function Norm(z) { return ChiSq(z * z, 1); }

                function Fmt(x) {
                    var v;
                    if (x >= 0) { v = "          " + (x + 0.00005) } else { v = "          " + (x - 0.00005) }
                    v = v.substring(0, v.indexOf(".") + 5);
                    return v.substring(v.length - 10, v.length);
                }

                function Fmt3(x) {
                    var v;
                    v = "   " + x;
                    return v.substring(v.length - 3, v.length);
                }

                function Xlate(s, from, to) {
                    var v = s;
                    var l = v.indexOf(from);
                    while (l > -1) {
                        v = v.substring(0, l) + to + v.substring(l + 1, v.length);
                        l = v.indexOf(from);
                    }
                    return v;
                }

                // Create Array Of Size N + Preset Values To Zero 
                function crArr(n) {
                    var rv = [];
                    for (var i = 0; i < n; i++) {
                        rv.push(0);
                    }
                    return rv;
                }

                function ix(j, k, nCols) { return j * nCols + k; }

                var CR = unescape("%0D");
                var LF = unescape("%0A");
                var Tb = unescape("%09");
                var NL = CR + LF;

                function Iterate(data) {


                    var SurvT = [1, 2, 3, 5, 7, 11, 4, 6, 8, 9, 10];
                    var Stat = [0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 1];



                    var i = 0;
                    var j = 0;
                    var k = 0;
                    var l = 0;

                    var nC = data.length;
                    var nR = covariates || 0;

                    var SurvT = new crArr(nC);
                    var Stat = new crArr(nC);
                    var Dupl = new crArr(nC);
                    var Alpha = new crArr(nC);
                    var x = new crArr(nC * nR);
                    var b = new crArr(nC);
                    var a = new crArr(nR * (nR + 1));
                    var s1 = new crArr(nR);
                    var s2 = new crArr(nR * nR);
                    var s = new crArr(nR);
                    var Av = new crArr(nR);
                    var SD = new crArr(nR);
                    var SE = new crArr(nR);

                    var da = Xlate(form.data.value, Tb, ",");
                    form.data.value = da;
                    if (da.indexOf(NL) == -1) { if (da.indexOf(CR) > -1) { NL = CR } else { NL = LF } }

                    for (i = 0; i < nC; i++) {
                        l = da.indexOf(NL);
                        if (l == -1) { l = da.length };
                        var v = da.substring(0, l);
                        da = da.substring(l + NL.length, da.length);

                        for (j = 0; j < nR; j++) {
                            l = v.indexOf(",");
                            if (l == -1) { l = v.length };
                            var zX = eval(v.substring(0, l))
                            x[ix(i, j, nR)] = zX;
                            Av[j] = Av[j] + zX;
                            SD[j] = SD[j] + zX * zX;
                            v = v.substring(l + 1, v.length);
                        }
                        l = v.indexOf(",");
                        if (l == -1) { l = v.length };
                        SurvT[i] = eval(v.substring(0, l));
                        v = v.substring(l + 1, v.length);
                        l = v.indexOf(",");
                        if (l == -1) { l = v.length };

                        var z = v.substring(0, l);
                        v = v.substring(l + 1, v.length);
                        if (z.indexOf("C") >= 0) { z = "0" }
                        if (z.indexOf("c") >= 0) { z = "0" }
                        if (z.indexOf("D") >= 0) { z = "1" }
                        if (z.indexOf("d") >= 0) { z = "1" }
                        if (z.indexOf("A") >= 0) { z = "0" }
                        if (z.indexOf("a") >= 0) { z = "0" }
                        Stat[i] = eval(z);
                        if (Stat[i] != 0) { Stat[i] = 1 }

                    }

                    var o = "Descriptive Stats..." + NL;
                    o = o + (NL + " Variable      Avg       SD    " + NL);
                    for (j = 0; j < nR; j++) {
                        Av[j] = Av[j] / nC;
                        SD[j] = SD[j] / nC;
                        SD[j] = Sqrt(Abs(SD[j] - Av[j] * Av[j]))
                        o = o + ("   " + Fmt3(j + 1) + "    " + Fmt(Av[j]) + Fmt(SD[j]) + NL);
                    }
                    form.output.value = o;

                    var Eps = 1 / 1024;
                    for (i = 0; i < nC - 1; i++) {
                        var iBig = i;
                        for (j = i + 1; j < nC; j++) {
                            if (SurvT[j] - Eps * Stat[j] > SurvT[iBig] - Eps * Stat[iBig]) { iBig = j }
                        }
                        if (iBig != i) {
                            v = SurvT[i];
                            SurvT[i] = SurvT[iBig];
                            SurvT[iBig] = v;
                            v = Stat[i];
                            Stat[i] = Stat[iBig];
                            Stat[iBig] = v;
                            for (j = 0; j < nR; j++) {
                                v = x[ix(i, j, nR)];
                                x[ix(i, j, nR)] = x[ix(iBig, j, nR)];
                                x[ix(iBig, j, nR)] = v;
                            }
                        }
                    }
                    if (Stat[0] > 0) { Stat[0] = Stat[0] + 2; }
                    for (i = 1; i < nC; i++) {
                        if (Stat[i] > 0 & (Stat[i - 1] == 0 | SurvT[i - 1] != SurvT[i])) { Stat[i] = Stat[i] + 2 }
                    }
                    if (Stat[nC - 1] > 0) { Stat[nC - 1] = Stat[nC - 1] + 4 }
                    for (i = nC - 2; i >= 0; i--) {
                        if (Stat[i] > 0 & (Stat[i + 1] == 0 | SurvT[i + 1] != SurvT[i])) { Stat[i] = Stat[i] + 4 }
                    }

                    for (i = 0; i < nC; i++) {
                        for (j = 0; j < nR; j++) {
                            x[ix(i, j, nR)] = (x[ix(i, j, nR)] - Av[j]) / SD[j]
                        }
                    }

                    o = o + (NL + "Iteration History...");
                    form.output.value = o;

                    for (j = 0; j < nR; j++) {
                        b[j] = 0;
                    }

                    var LLp = 2e+30;
                    var LL = 1e+30;
                    Fract = 0.0

                    while (Abs(LLp - LL) > 0.0001) {
                        LLp = LL;
                        LL = 0;
                        var s0 = 0;
                        for (j = 0; j < nR; j++) {
                            s1[j] = 0;
                            a[ix(j, nR, nR + 1)] = 0;
                            for (k = 0; k < nR; k++) {
                                s2[ix(j, k, nR)] = 0;
                                a[ix(j, k, nR + 1)] = 0;
                            }
                        }
                        for (i = 0; i < nC; i++) {
                            Alpha[i] = 1;
                            v = 0;
                            for (j = 0; j < nR; j++) {
                                v = v + b[j] * x[ix(i, j, nR)];
                            }
                            v = Exp(v);
                            s0 = s0 + v;
                            for (j = 0; j < nR; j++) {
                                s1[j] = s1[j] + x[ix(i, j, nR)] * v;
                                for (k = 0; k < nR; k++) {
                                    s2[ix(j, k, nR)] = s2[ix(j, k, nR)] + x[ix(i, j, nR)] * x[ix(i, k, nR)] * v;
                                }
                            }
                            var StatI = Stat[i];
                            if (StatI == 2 | StatI == 3 | StatI == 6 | StatI == 7) {
                                d = 0;
                                for (j = 0; j < nR; j++) {
                                    s[j] = 0;
                                }
                            }
                            if (StatI == 1 | StatI == 3 | StatI == 5 | StatI == 7) {
                                d = d + 1;
                                for (j = 0; j < nR; j++) {
                                    s[j] = s[j] + x[ix(i, j, nR)];
                                }
                            }
                            if (StatI == 4 | StatI == 5 | StatI == 6 | StatI == 7) {
                                for (j = 0; j < nR; j++) {
                                    LL = LL + s[j] * b[j];
                                    a[ix(j, nR, nR + 1)] = a[ix(j, nR, nR + 1)] + s[j] - d * s1[j] / s0;
                                    for (k = 0; k < nR; k++) {
                                        a[ix(j, k, nR + 1)] = a[ix(j, k, nR + 1)] + d * (s2[ix(j, k, nR)] / s0 - s1[j] * s1[k] / (s0 * s0));
                                    }
                                }
                                LL = LL - d * Ln(s0);
                                if (d == 1) { Alpha[i] = Power((1 - v / s0), (1 / v)) } else { Alpha[i] = Exp(-d / s0) }
                            }
                        }
                        LL = -2 * LL;
                        o = o + (NL + "-2 Log Likelihood = " + Fmt(LL));
                        if (LLp == 1e+30) {
                            var LLn = LL;
                            o = o + " (Null Model)"
                        }
                        form.output.value = o;

                        for (i = 0; i < nR; i++) {
                            v = a[ix(i, i, nR + 1)];
                            a[ix(i, i, nR + 1)] = 1;
                            for (k = 0; k < nR + 1; k++) { a[ix(i, k, nR + 1)] = a[ix(i, k, nR + 1)] / v; }
                            for (j = 0; j < nR; j++) {
                                if (i != j) {
                                    v = a[ix(j, i, nR + 1)];
                                    a[ix(j, i, nR + 1)] = 0;
                                    for (k = 0; k < nR + 1; k++) {
                                        a[ix(j, k, nR + 1)] = a[ix(j, k, nR + 1)] - v * a[ix(i, k, nR + 1)];
                                    }
                                }
                            }
                        }

                        Fract = Fract + 0.1;
                        if (Fract > 1) { Fract = 1 };
                        for (j = 0; j < nR; j++) {
                            b[j] = b[j] + Fract * a[ix(j, nR, nR + 1)];
                        }

                    }

                    o = o + " (Converged)"
                    var CSq = LLn - LL;
                    o = o + (NL + "Overall Model Fit..." + NL);
                    o = o + ("  Chi Square=" + Fmt(CSq) + ";  df=" + nR + ";  p=" + Fmt(ChiSq(CSq, nR)) + NL);

                    o = o + (NL + "Coefficients, Std Errs, Signif, and Conf Intervs..." + NL);
                    o = o + ("   Var        Coeff.    StdErr       p       Lo95%     Hi95%" + NL);
                    for (j = 0; j < nR; j++) {
                        b[j] = b[j] / SD[j];
                        SE[j] = Sqrt(a[ix(j, j, nR + 1)]) / SD[j];
                        o = o + ("   " + Fmt3(j + 1) + "    " + Fmt(b[j]) + Fmt(SE[j]) + Fmt(Norm(Abs(b[j] / SE[j]))) + Fmt(b[j] - 1.96 * SE[j]) + Fmt(b[j] + 1.96 * SE[j]) + NL);
                    }

                    o = o + (NL + "Risk Ratios and Confidence Intervs..." + NL);
                    o = o + ("   Var    Risk Ratio     Lo95%     Hi95%" + NL);
                    for (j = 0; j < nR; j++) {
                        o = o + ("   " + Fmt3(j + 1) + "    " + Fmt(Exp(b[j])) + Fmt(Exp(b[j] - 1.96 * SE[j])) + Fmt(Exp(b[j] + 1.96 * SE[j])) + NL);
                    }

                    o = o + (NL + "Baseline Survivor Function (at predictor means)..." + NL);
                    var Sf = 1;
                    for (i = nC - 1; i >= 0; i--) {
                        Sf = Sf * Alpha[i];
                        if (Alpha[i] < 1) {
                            o = o + (Fmt(SurvT[i]) + Fmt(Sf) + NL);
                        }
                    }
                    form.output.value = o;
                }


                return {
                    exec: Iterate
                }

            })();



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