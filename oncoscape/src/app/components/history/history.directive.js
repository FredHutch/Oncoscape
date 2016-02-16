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
            scope: {},
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
            vm.deathMinFilter = vm.deathMinValue = 1;
            vm.deathMaxFilter = vm.deathMaxValue = 99;
            vm.survivalMinFilter = vm.survivalMinValue = 0;
            vm.survivalMaxFilter = vm.survivalMaxValue = 10;
            vm.rowFilter = function(element){
                return (
                    element[3]>=vm.survivalMinFilter &&
                    element[3]<=vm.survivalMaxFilter &&
                    element[4]>=vm.deathMinFilter &&
                    element[4]<=vm.deathMaxFilter
                    );
            };

            var elDt = $('#datatable');

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset("DEMOdz").then(function(response){
                osApi.getPatientHistoryTable("DEMOdz").then(function(response){
                    vm.colnames= response.payload.colnames;
                    vm.rows = response.payload.tbl;
                    $timeout(function(){
                        elDt.dataTable({
                            "paging": false,
                            "searching": false
                        });
                        osApi.setBusy(false);
                    },0,false);
                });
            });
        }
    }
})();
