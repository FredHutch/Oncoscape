(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osExplore', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/explore/explore.html',
            scope: {

            },
            controller: ExploreController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ExploreController(osApi, $state, $timeout) {
            var vm = this;
            vm.colnames = [];
            vm.mtx = [];
            

            // Load Datasets
            osApi.setBusy(true);
            osApi.getDataManifest("DEMOdz").then(function(response){
                vm.colnames= response.payload.colnames;
                vm.mtx = response.payload.mtx;
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
