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
            vm.datasets = osApi.getDataSources().filter(function(d){return d.source == "TCGA"});
            vm.explore = function(tool, datasource) {
                $state.go(tool, { datasource: datasource.dataset });
            };
            osApi.setBusy(false);
        }
    }
})();