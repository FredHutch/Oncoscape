(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHeader', header);

    /** @ngInject */
    function header() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/header/header.html',
            scope: {},
            controller: HeaderController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HeaderController(osApi, osCohortService, osAuth, $stateParams, $state) {

            // View Model
            var vm = this;
            vm.showImport = false;
            vm.showTools = false;
            vm.showDatasets = false;
            vm.datasources = [];
            vm.tools = [];
            vm.cohorts = [];

            // State Management
            osApi.onNavChange.add(function(state) {
                switch (state) {
                    case "TOOLS":
                        vm.showTools = false;
                        vm.showDatasets = false;
                        break;
                    case "TOOL":
                        vm.showTools = true;
                        vm.showDatasets = true;
                        vm.datasources = osApi.getDataSources();
                        vm.tools = osApi.getTools();
                        vm.cohorts = osCohortService.getCohorts();
                        break;
                    default:
                        vm.showTools = false;
                        vm.showDatasets = false;
                        break;
                }
            });

            // Cohort Commands
            vm.addPatientCohort = function() {
                osCohortService.saveCohort();
            };

            // State Command
            vm.setPatientCohort = function(cohort) {
                osCohortService.setCohort(cohort);
            };

            // Import Cohorts Command 
            vm.importIds = "";
            vm.importCohort = function() {
                var ids = vm.importIds.split(",").map(function(v) { return v.trim(); });
                osCohortService.importIds(ids, vm.importName);
                vm.importIds = "";
                vm.importName = "";
                vm.showImport = false;
            };

            // Update Cohorts When Datasource Changes
            osCohortService.onCohortsChange.add(function() {
                vm.cohorts = osCohortService.getCohorts();
            });


            // Load Dataset Command - Navigation
            vm.loadDataset = function(dataset) {
                $state.go($state.current.url.split("/")[1], { datasource: dataset });
                angular.element('.navbar-collapse').collapse('hide');
            };

            // Load Tool Command - Navigation
            vm.loadTool = function(tool) {
                $state.go(tool, { datasource: osApi.getDataSource().disease });
                angular.element('.navbar-collapse').collapse('hide');
            };

        }
    }
})();