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
        function HeaderController(osApi, osCohortService, osAuth, $stateParams, $state, $timeout, $rootScope) {


            var vm = this;
            vm.showImport = false;
            vm.showTools = false;
            vm.showDatasets = false;
            vm.datasources = [];
            vm.tools = [];
            vm.cohorts = [];

            osApi.onNavChange.add(function(state) {
                switch (state) {
                    case "TOOLS":
                        vm.showTools = false;
                        vm.showDatasets = true;
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

            vm.addPatientCohort = function() {
                osCohortService.saveCohort();
            };

            vm.setPatientCohort = function(cohort) {
                osCohortService.setCohort(cohort);
            };

            vm.importIds = "";
            vm.importCohort = function() {
                var ids = vm.importIds.split(",").map(function(v) { return v.trim(); });
                osCohortService.importIds(ids, vm.importName);
                vm.importIds = "";
                vm.importName = "";
                vm.showImport = false;
            };


            vm.loadDataset = function(dataset) {
                $state.go($state.current.url.split("/")[1], { datasource: dataset });
                angular.element('.navbar-collapse').collapse('hide');
            };

            vm.loadTool = function(tool) {
                $state.go(tool, { datasource: osApi.getDataSource().disease });
                angular.element('.navbar-collapse').collapse('hide');
            };

        }
    }
})();