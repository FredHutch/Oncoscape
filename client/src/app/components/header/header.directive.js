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
                    vm.showTools = true;
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
            vm.importPatientCohort = function(e){
                var ids = vm.importPatientIds.split(",").map(function(v){ return v.trim(); });
                osCohortService.importPatientCohort(ids);
            };
            vm.showImport = false;
            vm.showMenu = false;
            vm.showTools = false;

            var currentTool;
            $rootScope.$on('$stateChangeStart', function(event, toState) {
                currentTool = toState.name;
                switch (toState.name) {
                    case "landing":
                    case "tools":
                    case "datasource":
                        vm.showMenu = false;
                        vm.showtools = false;
                        break;
                    default:
                        vm.showMenu = true;
                        vm.showTools = true;
                        break;
                }
            });

            vm.loadDataset = function(dataset) {
                $state.go(currentTool, {
                    datasource: dataset
                });
                $('.navbar-collapse').collapse('hide');
            };

            vm.loadTool = function(tool) {
                $state.go(tool, {
                    datasource: osApi.getDataSource().disease
                });
                $('.navbar-collapse').collapse('hide');
            };

            vm.logoutClick = function() {
                osAuth.logout();
                $state.transitionTo("landing");
            }
        }
    }

})();
