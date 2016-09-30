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
            scope:{ },
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CohortMenuController(osApi, osCohortService, $state, $scope, $timeout, $rootScope, d3) {

            var vm = this;
            vm.cohorts = [];
            vm.patientChartOption = null;
            vm.cohortName = "";
            vm.addCohort = function(){};
            vm.setCohort = function(){};
            vm.removeCohort = function(){};
            vm.editItem = {name:''};
            vm.editCohort = function(item){
                vm.editItem = item;
                vm.edit = true;
            };
            
            vm.show = false;
            vm.edit = false;
            
            
            osCohortService.onCohortsChange.add(function(allCohorts){
                vm.cohorts = allCohorts;
                vm.show = true;
                vm.showPatientHistory();
                osCohortService.setPatientCohort([],"All Patients")
            });

            $rootScope.$on('$stateChangeStart', function(event, toState){ 
                switch(toState.name){
                    case "landing":
                    case "tools":
                    case "datasource":
                        vm.show = false;
                        break;
                    default:
                        vm.show = true;
                        break;
                }
            });

            // Configure Tray
            var elTray = angular.element(".cohort-menu");
            var mouseOver = function(){
                elTray
                    .removeClass("tray-collapsed-left");
            }
            var mouseOut = function(){
                elTray
                    .addClass("tray-collapsed-left");
            }
            
            // Configure Tabs
            var elTabPatients = angular.element('#cohort-tab-patients');
            var elTabGenes    = angular.element('#cohort-tab-genes');
            vm.showPatientHistory = function(){
                elTabPatients.addClass("active");
                elTabGenes.removeClass("active");
                vm.cohorts = osCohortService.getPatientCohorts();
                vm.addCohort = osCohortService.addPatientCohort;
                vm.setCohort = osCohortService.setPatientCohort;
                vm.removeCohort = osCohortService.delPatientCohort;
            };
            vm.showGeneHistory = function(){
                elTabGenes.addClass("active");
                elTabPatients.removeClass("active");
                vm.cohorts = osCohortService.getGeneCohorts();
                vm.addCohort = osCohortService.addGeneCohort;
                vm.setCohort = osCohortService.setGeneCohort;
                vm.removeCohort = osCohortService.delGeneCohort;
            };

            var isLocked = true;
            vm.toggle = function(){
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
                    
            }   


            var barClick =function(d){
                
                
                if (vm.patientChartOption.type=="numeric"){
                    var bounds = d.label.split("-").map(function(v){ return parseInt(v); });
                    var prop = vm.patientChartOption.prop;
                    osCohortService.filterActivePatientCohort(bounds, prop, vm.patientChartOption.type);
                }
            }


            // Init SVG;
            var svg = d3.select("#cohortmenu-chart").append("svg")
                .attr("width", 238)
                .attr("height", 150)
                .append("g");
          
            $scope.$watch('vm.patientChartOption', function(){

                if (vm.patientChartOption==null) return;
                var data = vm.patientChartOption.data;

                var barWidth = Math.floor(238/data.bins);
                if (data.histRange[0]>0) data.histRange[0] -=2;

                var yScale = d3.scaleLinear()
                    .domain(data.histRange)
                    .range([0,135]);

                var bars = svg
                    .selectAll(".cohort-menu-chart-bar")
                    .data(data.hist);

                    bars.enter()
                        .append("rect")
                        .attr("class","cohort-menu-chart-bar")
                        .attr("x", function(d, i) { return (barWidth+1) * i; })
                        .attr("y", function(d) { return 150-yScale(d.value); })
                        .attr("height", function(d) { return yScale(d.value); })
                        .attr("width", barWidth)
                        .on("click", barClick);

                    bars
                        .transition()
                            .duration(300)
                            .attr("x", function(d, i) { return (barWidth+1) * i; })
                            .attr("y", function(d) { return 150-yScale(d.value); })
                            .attr("height", function(d) { return yScale(d.value); })
                            .attr("width", barWidth)

                    bars.exit()
                        .transition()
                            .duration(300)
                            .attr("y", 150)
                            .attr("height", 0)
                            .style('fill-opacity', 1e-6)
                            .remove();

                    var labels = svg
                        .selectAll("text")
                        .data(data.hist)

                    labels.enter()
                        .append("text")
                        .attr("x", function(d, i) { return ((barWidth+1) * i) + (barWidth*.5); })
                        .attr("y", function(d) { 
                            return 145-yScale(d.value);
                        })
                        .attr("fill", "#000")
                        .attr("height", function(d) { return yScale(d.value); })
                        .attr("width", barWidth)
                        .attr("font-size", "8px")
                        .attr("text-anchor", "middle")
                        .text(function(d){ return d.label; });

                    labels
                        .transition()
                            .duration(300)
                            .attr("x", function(d, i) { return ((barWidth+1) * i) + (barWidth*.5); })
                            .attr("y", function(d) { 
                                var y = 145-yScale(d.value);
                                if (y<0) y = 20;
                                return y;
                            })
                            .text(function(d){ return d.label; });

                    labels.exit()
                        .transition()
                            .duration(300)
                            .attr("y", 150)
                            .attr("height", 0)
                            .style('fill-opacity', 1e-6)
                            .remove();
                            

            });


            /* SURVIVAL - This very much needs to be refactored into a component */
            var sChart = d3.select("#cohortmenu-survival").append("svg");
            
            var sLayout = {
                width: 238,
                height: 170,
                xScale : null,
                yScale : null
            }
            var addCurve = function(points){
            
                // Define Line
                var valueline = d3.line()
                    .x(function(d) { return sLayout.xScale(d[0]); })
                    .y(function(d) { return sLayout.yScale(d[2])+10; });

                sChart.append("path")
                    .attr("class", "line")
                    .attr("stroke-width", points.weight)
                    .attr("stroke", points.color)
                    .attr("fill","none")
                    .attr("d", valueline(points.data.line));

                for (var i=0; i<points.data.tick.length; i++){
                    sChart.append("line")
                        .attr("class", "line")
                        .attr("stroke-width", points.weight)
                        .attr("stroke", points.color)
                        .attr("x1", sLayout.xScale(points.data.tick[i][0]))
                        .attr("x2", sLayout.xScale(points.data.tick[i][0]))
                        .attr("y1", sLayout.yScale(points.data.tick[i][2])+5)
                        .attr("y2", sLayout.yScale(points.data.tick[i][2])+10);
                }
            }
            osCohortService.onMessage.add(function(result){
                if (result.data.cmd=="getSurvivalData"){
                    var data = result.data.data;
                    if (data.correlationId=="CohortMenuController"){

                        sChart
                            .attr("width", '100%')
                            .attr("height", sLayout.height+10);

                        sLayout.xScale = d3.scaleLinear()
                            .domain([result.data.data.min,  result.data.data.max])
                            .range([0, sLayout.width]);

                        sLayout.yScale = d3.scaleLinear()
                            .domain([0,100])
                            .range([sLayout.height,0]);

                        sChart.selectAll(".line").remove();
                        for (var i=0; i<data.cohorts.length; i++){
                            if (i<data.cohorts.length-1){
                                data.cohorts[i].weight = 1;
                            }
                            else{
                                data.cohorts[i].weight = 1.5;
                            }
                            addCurve(data.cohorts[i]);
                        }
                        //addCurve(data.cohorts[0]);
                        //data.cohorts[1].color = "#0b97d3";
                        //addCurve(data.cohorts[1]);
                    }
                }
            });
            /* END SURVIVAL */






            osCohortService.onPatientsSelect.add(function(obj){
                if (angular.isUndefined(obj.color)){
                    obj.color = "#000";
                }
                
                vm.cohortName = obj.name;
                osCohortService.getPatientMetric();
                var cohorts =  JSON.parse(JSON.stringify(osCohortService.getPatientCohorts()));
                cohorts.push(obj);
                osCohortService.getSurvivalData(cohorts,true,"CohortMenuController");
            });
            osCohortService.onGenesSelect.add(function(){

            });
            osCohortService.onMessage.add(function(obj){
                if (obj.data.cmd!="setPatientMetric") return;
                $timeout(function(){
                    vm.patientTotal = obj.data.data.total,
                    vm.patientSelected = obj.data.data.selected,
                    vm.patientChartOptions = obj.data.data.features;
                    vm.patientChartOption = vm.patientChartOptions[0];
                });                
            });            

            // And Go
            vm.showPatientHistory();
            
        }
    }

})();
