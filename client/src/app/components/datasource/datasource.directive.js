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
        function DatasourceController(osApi, osCohortService, $state) {
            var vm = this;
            vm.datasets = osApi.getDataSources();
            vm.explore = function(tool, datasource) {
                osApi.setBusy(true);
                osApi.setDataSource(datasource);
                osCohortService.loadCohorts().then(function() {
                    $state.go(tool, {
                        datasource: datasource.disease
                    });
                    osApi.setBusy(false);
                });

            };

        }
    }
})();