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

            osApi.onDataSource.add(function() {
                $timeout(function() {
                    vm.datasets = osApi.getDataSources();
                });
                osApi.query("lookup_oncoscape_tools").then(function(response) {
                    var tools = osApi.getDataSource().tools;
                    vm.tools = response.data.filter(function(item) {
                        return (tools.indexOf(item.route) != -1);
                    }).sort(function(a, b) {
                        if (a.name < b.name) return -1;
                        if (a.name > b.name) return 1;
                        return 0;
                    });
                });
            });

            var vm = this;
            vm.show = false;
            vm.cohorts = [];
            vm.addPatientCohort = osCohortService.addPatientCohort;
            vm.setPatientCohort = osCohortService.setPatientCohort;
            osCohortService.onCohortsChange.add(function(allCohorts) {
                vm.cohorts = allCohorts;
            });
            vm.importPatientIds = "";
            vm.importPatientCohort = function() {
                var ids = vm.importPatientIds.split(",").map(function(v) { return v.trim(); });
                osCohortService.setPatientCohort(ids, "Import", osCohortService.PATIENT);
            };
            vm.showImport = false;
            vm.showTools = false;
            vm.showDatasets = false;
            vm.showCohorts = false;
            vm.showHelp = false;
            vm.showLogout = false;

            var elMain = $("#main");
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
                        vm.show = false;
                        elMain.addClass("container-main-full")
                        break;
                    case "tools":
                        vm.showCohorts = false;
                        vm.showTools = false;
                        vm.show = true;
                        elMain.removeClass("container-main-full")
                        break;
                    case "datasource":
                        vm.showHelp = true;
                        vm.showDatasets = false;
                        vm.showCohorts = false;
                        vm.showLogout = true;
                        vm.showTools = false;
                        vm.show = true;
                        elMain.removeClass("container-main-full")
                        break;
                    default:
                        vm.showCohorts = true;
                        vm.showDatasets = true;
                        vm.showTools = true;
                        vm.show = true;
                        elMain.removeClass("container-main-full")
                        break;
                }
            });
            $rootScope.$on('$destroy', onStateChangeStart);

            vm.loadDataset = function(dataset) {
                osApi.setBusy(true);
                osCohortService.loadCohorts().then(function() {
                    $state.go(currentTool, {
                        datasource: dataset
                    });
                    osApi.setBusy(false);
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