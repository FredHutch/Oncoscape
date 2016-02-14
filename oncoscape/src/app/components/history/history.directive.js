(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHistory', history);

    /** @ngInject */
    function history() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/history/history.html',
            scope: {

            },
            controller: HistoryController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HistoryController(osApi, $state, $timeout) {

            var vm = this;
            vm.colnames = [];
            vm.rows = [];
            vm.userMinPrice = vm.minPrice = 100;
            vm.userMaxPrice = vm.maxPrice = 999;

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset("DEMOdz").then(function(response){
                osApi.getPatientHistoryTable("DEMOdz").then(function(response){
                vm.colnames= response.payload.colnames;
                vm.rows = response.payload.tbl;
                $timeout(function(){
                    $('#datatable').dataTable({
                        "paging":   false
                    });
                    osApi.setBusy(false);
                },0,false);
            });


            });
            
        }
    }
})();
