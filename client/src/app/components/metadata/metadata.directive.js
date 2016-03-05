(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osMetadata', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/metadata/metadata.html',
            controller: MetadataController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function MetadataController(osApi, $state, $timeout, $scope, $stateParams) {

            // View Model
            var vm = this;
            vm.dataset = $stateParams.datasource || "DEMOdz";
            vm.colnames = [];
            vm.rows = [];
            vm.search = "";
            vm.toggleFilter = function(){
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }

            // Elements
            var dtTable;

            // Load Datasets
            osApi.setBusy(true);
            osApi.getDataManifest(vm.dataset).then(function(response){
                vm.colnames= response.payload.colnames;
                vm.rows = response.payload.mtx;
                $timeout(function(){
                    dtTable = angular.element('#metadata-datatable').dataTable({
                        "paging":   false
                    });
                    $scope.$watch('vm.search', function(){
                        dtTable.api().search(vm.search).draw();
                    });
                    osApi.setBusy(false);
                },0,false);
            });
        }
    }
})();
