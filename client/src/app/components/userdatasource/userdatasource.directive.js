(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osUserdatasource', userdatasource);

    /** @ngInject */
    function userdatasource() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/userdatasource/userdatasource.html',
            controller: UserdatasourceController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function UserdatasourceController(osApi, $state, osAuth) {
            var vm = this;
            vm.networks = osAuth.getAuthSources();
            vm.login = osAuth.login;
            vm.getDataSources = function() {
                $state.go("datasource");
            };
            var loginSuccess = function() {
                $state.go("userdatasource");
            };
    
            osAuth.onLogin.add(loginSuccess); 
            vm.datasets = osApi.getDataSources();
            vm.explore = function(tool, datasource) {
                $state.go(tool, { datasource: datasource.disease });
            };
            osApi.setBusy(false);
        }
    }
})();