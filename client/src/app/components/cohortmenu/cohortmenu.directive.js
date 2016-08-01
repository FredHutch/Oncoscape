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
        function CohortMenuController(osApi, osCohortService, $state, $scope, $timeout, $rootScope) {



            var showState = function(state){
                if (state.toString()=="[object Object]") return false;
                switch (state){
                    case "/":
                    case "/datasource":
                    case "/tools/{datasource}":
                        return false
                        break;
                }
                return true;
            }

            var vm = this;
            vm.cohorts = [];
            vm.patientChartOption = null;
            vm.addCohort = function(){};
            vm.setCohort = function(){};
            vm.removeCohort = function(){};
            vm.editItem = {name:''};
            vm.editCohort = function(item){
                vm.editItem = item;
                vm.edit = true;
            };
            

            vm.show = showState($state.current);
            vm.edit = false;
            
            
            osCohortService.onCohortsChange.add(function(allCohorts){
                vm.cohorts = allCohorts;
            });

            $rootScope.$on('$stateChangeStart', function(event, toState, toParams, fromState, fromParams){ 
               vm.show = showState(toState.url);
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


            var barClick =function(d,i){
                //vm.patientChartOption;
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

                var yScale = d3.scale.linear()
                    .domain(data.histRange)
                    .range([0,135]);

                var bars = svg
                    .selectAll(".cohort-menu-chart-bar")
                    .data(data.hist);

                    bars.enter()
                        .append("rect")
                        .attr("class","cohort-menu-chart-bar")
                        .attr("x", function(d, i) { return barWidth * i; })
                        .attr("y", function(d, i) { return 150-yScale(d.value); })
                        .attr("height", function(d, i) { return yScale(d.value); })
                        .attr("width", barWidth)
                        .on("click", barClick);

                    bars
                        .transition()
                            .duration(300)
                            .attr("x", function(d, i) { return (barWidth+1) * i; })
                            .attr("y", function(d, i) { return 150-yScale(d.value); })
                            .attr("height", function(d, i) { return yScale(d.value); })
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
                        .attr("y", function(d, i) { 
                            return 145-yScale(d.value);
                        })
                        .attr("fill", "#000")
                        .attr("height", function(d, i) { return yScale(d.value); })
                        .attr("width", barWidth)
                        .attr("font-size", "8px")
                        .attr("text-anchor", "middle")
                        .text(function(d){ return d.label; });

                    labels
                        .transition()
                            .duration(300)
                            .attr("x", function(d, i) { return ((barWidth+1) * i) + (barWidth*.5); })
                            .attr("y", function(d, i) { 
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


            // Interact with Cohort Service
            osCohortService.onPatientsSelect.add(function(obj){
                osCohortService.getPatientMetric();
            });
            osCohortService.onGenesSelect.add(function(obj){
                console.log("GENES");
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
