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
            controller: HistoryController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HistoryController(osApi, osState, $state, $timeout, $scope, $stateParams) {

            osState.filters.onSelect.add(function(){
                $timeout(function(){
                });
            });
            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.colnames = [];
            vm.rows = [];
            vm.diagnosisMin = vm.diagnosisMinValue = 1;
            vm.diagnosisMax = vm.diagnosisMaxValue = 99;
            vm.survivalMin = vm.survivalMinValue = 0;
            vm.survivalMax = vm.survivalMaxValue = 10;
            vm.search = "";

            vm.toggleFilter = function() {
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            };

            vm.applyFilter = function() {
                // Override Datatables Default Search Function - More Efficent Than Using Angular Bindings
                angular.element.fn.DataTable.ext.search = [function(settings, data) {
                    var survival = parseFloat(data[3]);
                    var diagnosis = parseFloat(data[4]);
                    if (isNaN(survival) || isNaN(diagnosis)) return false;
                    return (diagnosis >= vm.diagnosisMin &&
                        diagnosis <= vm.diagnosisMax &&
                        survival >= vm.survivalMin &&
                        survival <= vm.survivalMax);

                }];
                dtTable.api().draw();
            };

            vm.cohort;
            vm.createCohort = function() {
                osState.filters.add({
                    name: vm.cohort,
                    vs:{
                        diagnosisMin: vm.diagnosisMin,
                        diagnosisMax: vm.diagnosisMax,
                        survivalMin: vm.survivalMin,
                        survivalMax: vm.survivalMax,
                        search: vm.search
                    },
                    fn:function(data){
                        var survival = parseFloat(data[3]);
                        var diagnosis = parseFloat(data[4]);
                        return (
                            diagnosis>=this.diagnosisMin &&
                            diagnosis<=this.diagnosisMax &&
                            survival>=this.survivalMin &&
                            survival<=this.survivalMax
                            );
                        // Need to incorporate Search
                    }
                });
            };
            // Elements
            var dtTable;

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    vm.colnames = response.payload.colnames;
                    vm.rows = response.payload.tbl;
                    $timeout(function() {
                        dtTable = angular.element('#history-datatable').dataTable({
                            "scrollY": "70vh",
                            "paging": false
                        });
                        $scope.$watch('vm.search', function() {
                            dtTable.api().search(vm.search).draw();
                        });
                        osApi.setBusy(false);
                    }, 0, false);
                });
            });
        }
    }
})();
