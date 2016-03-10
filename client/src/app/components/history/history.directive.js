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

            var rawData;

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            if (osState.patientFilters.get()==null) osState.patientFilters.set(vm.datasource);
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
                osState.patientFilters.add({
                    icon: 'history',
                    name: vm.cohort,
                    ids: dtTable._('tr', {"filter":"applied"}).map(function(data) { return data[0]; })
                });
            };

            osState.patientFilters.onSelect.add(filterData);

            function filterData(zf){

                var data;
                if (zf.depth===0){
                    data = rawData.tbl;
                }else{
                    var ids = zf.ids;
                    var len = ids.length;
                    data = rawData.tbl.filter( 
                        function(value) { 
                            var val = value[0];
                            for (var i=0; i<len; i++){
                                if (val === ids[i]) return true;
                            }
                            return false;
                        }
                    );
                }

                var d = data.map(function(d){ return d[4]; });
                var s = data.map(function(d){ return d[3]; });
                vm.diagnosisMin = vm.diagnosisMinValue = Math.floor(Math.min.apply(null, d));
                vm.diagnosisMax = vm.diagnosisMaxValue = Math.ceil(Math.max.apply(null, d));
                vm.survivalMin = vm.survivalMinValue = Math.floor(Math.min.apply(null, s));
                vm.survivalMax = vm.survivalMaxValue = Math.floor(Math.max.apply(null, s));
                dtTable.fnClearTable();
                dtTable.fnAddData(data);
            }


            // Elements
            var dtTable;

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    rawData = response.payload;
                    vm.colnames = rawData.colnames;
                    vm.rows = rawData.tbl;
                    // filterData( osState.patientFilters.get() );
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
