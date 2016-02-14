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
            scope: {

            },
            controller: DatasourceController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function DatasourceController(osApi, $state) {
            var vm = this;
            vm.datasets = [];
            osApi.getDataSetNames().then(function(response){
                vm.datasets = response.payload.datasets;
            });
        }
    }

})();
