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
        function CohortMenuController(osApi, osCohortService, $state, $scope) {

            var vm = this;
            vm.cohorts = [];
            vm.addCohort = function(){};
            vm.setCohort = function(){};
            vm.removeCohort = function(){};
            vm.patientChartOptions = [
                {name:"Age Diagnosed", value:"age_at_diagnosis"},
                {name:"Year Diagnosed", value:"diagnosis_year"},
                {name:"Lymphy Nodes Examined", value:"count_lymph_nodes_examined"}
            ];
            vm.patientChartOption = vm.patientChartOptions[0];

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

            // Interact with Cohort Service
            osCohortService.onPatientsSelect.add(function(obj){
                osCohortService.getPatientMetric(vm.patientChartOption.value);
            });
            osCohortService.onGenesSelect.add(function(obj){
                console.log("GENES");
            });
            osCohortService.onMessage.add(function(obj){
                if (obj.data.cmd!="setHistogram") return;
                var data = obj.data.data;
                if (data.data[0]==0) return;

                console.dir(data)
            var barWidth = Math.floor(238/data.data.length);

                var y = d3.scale.linear()
                    .domain([data.min, data.max])
                    .range([0, 200]);

                var bars = svg.selectAll(".bar").data(data.data);
                bars.exit()
                    .transition()
                      .duration(300)
                    .attr("y", y(0))
                    .attr("height", 200 - y(0))
                    .style('fill-opacity', 1e-6)
                    .remove();

                bars.enter().append("rect")
                    .attr("class", "cohortmenu-bar")
                    .attr("y", y(0))
                    .attr("height", 200 - y(0));

                bars
                    .transition()
                        .duration(300)
                    .attr("x", function(d, i) { return (barWidth*i)+5 })
                    .attr("width", barWidth-5) //x.rangeBand()) 
                    .attr("y", function(d) {return y(d); })
                    .attr("height", function(d) { return 200 - y(d); }); // flip the height, because y's domain is bottom up, but SVG renders top down


                
            });

            var svg = d3.select("#cohortmenu-chart").append("svg")
                .attr("width", 238)
                .attr("height", 150)
                .append("g");
                //.attr("transform", "translate(" + margin.left + "," + margin.top + ")");


            $scope.$watch(vm.patientChartOption, function(){
                if (arguments[0]==undefined) return
                console.log(vm.patientChartOption.value);
                osCohortService.getPatientMetric(vm.patientChartOption.value);
            });

            

            // And Go
            vm.showPatientHistory();
            
        }
    }

})();
