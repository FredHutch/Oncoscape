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
        function UserdatasourceController(osApi, $state) {
            var vm = this;
            vm.getDataSources = function() {
                $state.go("datasource");
            };
            vm.login = function() {
                $state.go("login");
            };
            vm.datasets = osApi.getDataSources();
            vm.explore = function(tool, datasource) {
                $state.go(tool, { datasource: datasource.disease });
            };
            osApi.setBusy(false);
        }
    }
})();