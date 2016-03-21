(function() {
    'use strict';
    
    angular
        .module('oncoscape')
        .directive('osDatasource', datasource);

    /** @ngInject */
    function datasource() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/datasource/datasource.html',
            controller: DatasourceController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function DatasourceController(osApi, $state) {
            var vm = this;
            vm.datasets = [];
            vm.explore = function(tool, datasource) {
                $state.go(tool, {
                    datasource: datasource
                });
            };

            // Load Datasets
            osApi.setBusy(true);
            osApi.getDataSetNames().then(function(response) {
                vm.datasets = response.payload.datasets;
                osApi.setBusy(false);
            });
        }
    }
})();
