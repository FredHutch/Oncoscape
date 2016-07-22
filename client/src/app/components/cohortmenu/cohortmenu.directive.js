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
        function CohortMenuController(osApi, osCohortService, $state, $scope, $timeout) {

            var vm = this;
            vm.cohorts = [];
            vm.patientChartOption = null;
            vm.addCohort = function(){};
            vm.setCohort = function(){};
            vm.removeCohort = function(){};



           
            // Configure Tray
            var elTray = angular.element(".tool-menu");
                elTray
                .bind("mouseover", function(){ elTray.removeClass("tray-collapsed-left"); })
                .bind("mouseout", function() {});// elTray.addClass("tray-collapsed-left"); });
            
            // Configure Tabs
            var elTabPatients = $('#cohort-tab-patients');
            var elTabGenes    = $('#cohort-tab-genes');
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


            var barClick =function(d,i){
                vm.patientChartOption;
                debugger;
            }


            // Init SVG;
            var svg = d3.select("#cohortmenu-chart").append("svg")
                .attr("width", 238)
                .attr("height", 150)
                .append("g");
          
            $scope.$watch('vm.patientChartOption', function(){
                console.log(vm.patientChartOption);
                if (vm.patientChartOption==null) return;

                var data = vm.patientChartOption.data;

                var barWidth = Math.floor(238/data.bins);
                if (data.histRange[0]>0) data.histRange[0] -=2;

                var yScale = d3.scale.linear()
                    .domain(data.histRange)
                    .range([0,150]);

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
                    vm.patientChartOptions = obj.data.data;
                    vm.patientChartOption = vm.patientChartOptions[0];
                });                
            });            

            // And Go
            vm.showPatientHistory();
            
        }
    }

})();
