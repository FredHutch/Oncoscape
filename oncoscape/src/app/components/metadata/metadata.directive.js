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
            scope: {

            },
            controller: MetadataController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function MetadataController(osApi, $state, $timeout) {

            var vm = this;
            vm.colnames = [];
            vm.rows = [];

            // Load Datasets
            osApi.setBusy(true);
            osApi.getDataManifest("DEMOdz").then(function(response){
                vm.colnames= response.payload.colnames;
                vm.rows = response.payload.mtx;
                $timeout(function(){
                    $('#datatable').dataTable({
                        "paging":   false
                    });
                    osApi.setBusy(false);
                },0,false);
            });
        }
    }
})();
