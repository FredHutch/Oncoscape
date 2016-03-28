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
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.toolsClick = function(){
                $state.go("tools", {
                    datasource: vm.datasource
                });
            };
            
            vm.cohortClick = function() {
                osApi.toggleFilter();
            };
            vm.logoutClick = function(){
               userApi.logout();
               $state.transitionTo("landing");
            }
        }
    }

})();