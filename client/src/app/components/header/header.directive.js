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
        function HeaderController(osApi, $stateParams, $state, $timeout) {


            osApi.query("lookup_oncoscape_tools",{beta:false}).then(function(response){
                vm.tools = response.data;
                
            });

            osApi.onDataSource.add(function(){                
                $timeout(function(){
                    vm.datasets = osApi.getDataSources();
                    vm.showTools = true;
                });
            });

            var userApi = osApi.getUserApi();
            userApi.onLogin.add(function(){
                $timeout(function(){
                    vm.showMenu = true;
                });
            })
            userApi.onLogout.add(function(){
                $timeout(function(){
                    vm.showMenu = false;
                });
            })


           
            var vm = this;
            vm.showMenu = false;
            vm.showTools = false;

            vm.showMenu = true;
            vm.showTools = true;


            vm.loadDataset = function(dataset) {
                $state.go('markers', {
                    datasource: dataset
                });
            };

            vm.loadTool = function(tool) {
                $state.go(tool, {
                    datasource: osApi.getDataSource().disease
                });
            };
            
            vm.logoutClick = function(){
               userApi.logout();
               $state.transitionTo("landing");
            }
        }
    }

})();