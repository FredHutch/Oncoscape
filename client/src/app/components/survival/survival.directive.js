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
            vm.cohorts = osCohortService.getPatientCohorts();
            vm.all = {show:true, color:'#000'};

            var colors = ['#004358','#800080','#BEDB39','#FD7400','#1F8A70'];
            for (var i=0; i<vm.cohorts.length; i++){  
                vm.cohorts[i].show = true;
                vm.cohorts[i].color = colors[i]; 
            }

            vm.toggle = function(){
                osCohortService.getSurvivalData( vm.cohorts.filter(function(c){ return c.show; }), vm.all.show );
            };

            // Create D3 Elements
            var elChart = d3.select("#survival-chart").append("svg");
            var elXAxis = elChart.append("g").attr("class", "axis");
            var elYAxis = elChart.append("g").attr("class", "axis");


            // Create D3 Axis Objects + Layout
            var data = {};
            
            var layout = {
                width: 0,
                height: 0,
                xScale : null,
                yScale : null,
                xAxis : d3.svg.axis().orient("bottom").ticks(5),
                yAxis : d3.svg.axis().orient("left").ticks(5)
            }


            var setScale = function(timelineDomain){
                var osLayout = osApi.getLayout();

                layout.width = $window.innerWidth - osLayout.left - osLayout.right - 60;
                layout.height = $window.innerHeight - 160;
                angular.element("#survival-chart").css("margin-left",osLayout.left+20);
                elChart
                    .attr("width", '100%')
                    .attr("height", layout.height);

                layout.xScale = d3.scale.linear()
                    .domain(timelineDomain)
                    .range([50, layout.width]);

                layout.yScale = d3.scale.linear()
                    .domain([0,100])
                    .range([layout.height-50,0]);


                layout.xAxis.scale(layout.xScale);
                layout.yAxis.scale(layout.yScale);

                elYAxis.attr("transform", "translate(50, 10)").call(layout.yAxis);
                elXAxis.attr("transform", "translate(0, "+(layout.yScale(0)+10)+")").call(layout.xAxis);
            }


            var onSurvivalData = function(result){
                if (result.data.cmd=="getSurvivalData"){
                    data = result.data.data;
                    draw();
                }
            }
            osCohortService.onMessage.add(onSurvivalData);

            var addCurve = function(points){
            
                // Define Line
                var valueline = d3.svg.line()
                    .x(function(d) { return layout.xScale(d[0]); })
                    .y(function(d) { return layout.yScale(d[2])+10; });

                elChart.append("path")
                    .attr("class", "line")
                    .attr("stroke-width", 1.5)
                    .attr("stroke", points.color)
                    .attr("fill","none")
                    .attr("d", valueline(points.data.line))
                    .on("mouseover", function(){
                        d3.select(this).attr("stroke-width", 3)
                    })
                    .on("mouseout", function(){
                        d3.select(this).attr("stroke-width", 1)
                    });

                for (var i=0; i<points.data.tick.length; i++){
                    elChart.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", .5)
                        .attr("stroke", points.color)
                        .attr("x1", layout.xScale(points.data.tick[i][0]))
                        .attr("x2", layout.xScale(points.data.tick[i][0]))
                        .attr("y1", layout.yScale(points.data.tick[i][2])+5)
                        .attr("y2", layout.yScale(points.data.tick[i][2])+10);
                }
            }

            var draw = function() {

                // Clear Lines
                elChart.selectAll(".line").remove();

                // Set Scale
                setScale([data.min,  data.max]);

                // Draw Lines
                for (var i=0; i<data.cohorts.length; i++){
                    addCurve(data.cohorts[i]);
                }
                osApi.setBusy(false);
            
            };

            osApi.onResize.add(draw);
            
            // Destroy
            $scope.$on('$destroy', function() {
                osCohortService.onMessage.remove(onSurvivalData);
            });

            // Load Data
            vm.toggle();
                
        }
    }
})();
