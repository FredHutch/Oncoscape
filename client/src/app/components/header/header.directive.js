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
        function HeaderController(osApi, osAuth, $stateParams, $state, $window) {

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
                        vm.cohorts = osApi.getCohorts();
                        
                        break;
                    default:
                        vm.showTools = false;
                        vm.showDatasets = false;
                        break;
                }
            });

            // Cohort Commands
            vm.addPatientCohort = function() {
                osApi.saveCohort();
            };
           

            // State Command
            vm.setPatientCohort = function(cohort) {
                osApi.setCohort(cohort);
            };
            

            // Import Cohorts Command 
            vm.importIds = "";
            vm.importCohort = function() {
                var ids = vm.importIds.split(",").map(function(v) { return v.trim(); });
                osApi.importIds(ids, vm.importName);
                vm.importIds = "";
                vm.importName = "";
                vm.showImport = false;
            };

            
            osApi.onshowGenesetImportChange.add(function(show) {
                
                vm.showImport = show
            });

            var updateUser = function(user){
                vm.user=osAuth.getUser()
            }
            osAuth.onLogin.add(updateUser); 
            osAuth.onLogout.add(updateUser); 

            vm.login = function() {
                var networks = osAuth.getAuthSources();
                osAuth.login(networks[1]);

                //$state.go("login");
            };
            vm.logout = function() {

                
                osAuth.logout()
                localStorage.clear();
                //$window.reload(true);
                $window.location.href = "#";
                //$window.reload();
                
            };
            vm.showHelp = function() {
                $window.open("\\documentation" + $state.current.help.toString());
            };

            // Update Cohorts When Datasource Changes
            osApi.onCohortsChange.add(function() {
                vm.cohorts = osApi.getCohorts();
            });

            // Load Dataset Command - Navigation
            vm.showDatasources = function() {
                $state.go("userdatasource");

            };

            // Load Tool Command - Navigation
            vm.loadTool = function(tool) {
                $state.go(tool, { datasource: osApi.getDataSource().dataset });
                angular.element('.navbar-collapse').collapse('hide');
            };



        }
    }
})();