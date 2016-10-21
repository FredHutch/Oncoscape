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

            osApi.query("lookup_oncoscape_tools", {
                beta: false
            }).then(function(response) {
                vm.tools = response.data;

            });

            osApi.onDataSource.add(function() {
                $timeout(function() {
                    vm.datasets = osApi.getDataSources();
                });
            });

            var vm = this;
            vm.cohorts = [];
            vm.addPatientCohort = osCohortService.addPatientCohort;
            vm.setPatientCohort = osCohortService.setPatientCohort;
            osCohortService.onCohortsChange.add(function(allCohorts){
                vm.cohorts = allCohorts;
            });
            vm.importPatientIds = "";
            vm.importPatientCohort = function(){
                var ids = vm.importPatientIds.split(",").map(function(v){ return v.trim(); });
                osCohortService.importPatientCohort(ids);
            };
            vm.showImport = false;
            vm.showTools = false;
            vm.showDatasets = false;
            vm.showCohorts = false;
            vm.showHelp = false;
            vm.showLogout = false;


            var currentTool;
            var onStateChangeStart = $rootScope.$on('$stateChangeStart', function(event, toState) {
                currentTool = toState.name;
                switch (toState.name) {
                    case "landing":
                        vm.showTools = false;
                        vm.showDatasets = false;
                        vm.showLogout = false;
                        vm.showCohorts = false;
                        vm.showHelp = false;
                        break;
                    case "tools":
                        vm.showTools = true;
                        break;
                    case "datasource":
                        vm.showHelp = true;
                        vm.showDatasets = true;
                        vm.showCohorts = true;
                        vm.showLogout = true;
                        vm.showTools = false;
                        break;
                }
            });
            $rootScope.$on('$destroy', onStateChangeStart);

            vm.loadDataset = function(dataset) {
                $state.go(currentTool, {
                    datasource: dataset
                });
                angular.element('.navbar-collapse').collapse('hide');
            };

            vm.loadTool = function(tool) {
                $state.go(tool, {
                    datasource: osApi.getDataSource().disease
                });
                angular.element('.navbar-collapse').collapse('hide');
            };

            vm.logoutClick = function() {
                osAuth.logout();
                $state.transitionTo("landing");
            }
        }
    }

})();
