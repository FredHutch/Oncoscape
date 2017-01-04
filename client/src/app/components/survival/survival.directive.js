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

            // Format Elements
            var formatPercent = function(d) { return d + "%"; };
            var formatDays = function(d) {
                if (Math.abs(d) == 0) return d;
                if (Math.abs(d) < 30) return d + " Days";
                if (Math.abs(d) < 360) return Math.round((d / 30.4) * 10) / 10 + " Months";
                return Math.round((d / 365) * 10) / 10 + " Years";
            };

            // Create D3 Elements
            var elContainer = angular.element("#survival-chart");
            var elChart = d3.select("#survival-chart").append("svg").attr("width", "100%").attr("height", "100%");
            var elXAxis = elChart.append("g").attr("class", "axis");
            var elYAxis = elChart.append("g").attr("class", "axis").attr("transform", "translate(50, 10)");

            // Base Layout
            var layout = {
                width: 0,
                height: 0,
                xScale: d3.scaleLinear(),
                yScale: d3.scaleLinear(),
                xDomain: [0, 1], // Effected By Survival Min Max
                yDomain: [0, 100],
                xAxis: d3.axisBottom().ticks(5).tickFormat(formatDays),
                yAxis: d3.axisLeft().ticks(5).tickFormat(formatPercent)
            };


            var update = function() {

            };


            // Drawing Methods
            var dataChange = function() {

                // Determine The XDomain
                layout.xDomain = vm.cohorts
                    .filter(function(v) { return v.show; })
                    .reduce(function(p, c) {
                        p[0] = Math.min(p[0], c.survival.min);
                        p[1] = Math.max(p[1], c.survival.max);
                        return p;
                    }, [Infinity, -Infinity]);

                // Update Curves
                update();

                // Trigger Resize
                resize();
            };


            var resize = function() {

                // Get Screen Dimensions
                var osLayout = osApi.getLayout();
                layout.width = $window.innerWidth - osLayout.left - osLayout.right - ((osLayout.left == 0) ? 20 : 0) - ((osLayout.right == 0) ? 20 : 0);
                layout.height = $window.innerHeight - 125;

                // Position container
                elContainer.css({ 'width': layout.width, 'height': layout.height, 'margin-left': (osLayout.left == 0) ? 20 : osLayout.left });

                // Scale Axis
                layout.xScale.domain(layout.xDomain).range([40, layout.width - 40]);
                layout.yScale.domain(layout.yDomain).range([layout.height - 40, 1]);
                layout.xAxis.scale(layout.xScale);
                layout.yAxis.scale(layout.yScale);
                elXAxis.attr("transform", "translate(0, " + (layout.height - 30) + ")").call(layout.xAxis);
                elYAxis.attr("transform", "translate(40, 10)").call(layout.yAxis);

            };



            var init = function() {
                dataChange();
                osApi.setBusy(false);
            };

            init();


            // var draw = function() {
            //     osApi.setBusy(true);

            //     setSize();


            //     // // Clear Lines
            //     // elSurvival.selectAll(".line").remove();
            //     // elSurvival.selectAll(".tick").remove();

            //     // var survivalData = vm.cohorts.filter(function(v) { return v.show });
            //     // var minMax = survivalData.reduce(function(p, c) {
            //     //     p.min = Math.min(p.min, c.survival.min);
            //     //     p.max = Math.max(p.max, c.survival.max);
            //     //     return p;
            //     // }, { min: Infinity, max: -Infinity });

            //     // // Add Survival
            //     // minMax.min = Math.min(minMax.min, vm.cohort.survival.min);
            //     // minMax.max = Math.max(minMax.max, vm.cohort.survival.max);

            //     // // Set Scale
            //     //setScale([minMax.min - 1, minMax.max + 1]);


            //     // // Draw Lines
            //     // for (var i = 0; i < survivalData.length; i++) {
            //     //     addCurve(survivalData[i]);
            //     // }

            //     // if (survivalData.indexOf(vm.cohort) == -1) addCurve(vm.cohort);

            //     osApi.setBusy(false);
            // };

            // draw();






            // Destroy
            osApi.onResize.add(resize);
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(resize);
                // osCohortService.onCohortChange.add(onCohortChange);
            });


        }
    }
})();