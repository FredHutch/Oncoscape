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
            // .map(function(v) {
            //     v.img = "DSlung.jpg";
            //     return v;
            // });
            vm.explore = function(tool, datasource) {
                $state.go(tool, { datasource: datasource.disease });
            };
            osApi.setBusy(false);
        }
    }
})();