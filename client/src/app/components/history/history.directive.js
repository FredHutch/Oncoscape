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
        function HistoryController(osApi, $state, $timeout, $scope, $stateParams) {

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || osApi.getDataSource();
            vm.filter;
            vm.colnames = [];
            vm.diagnosisMin = vm.diagnosisMinValue = 1;
            vm.diagnosisMax = vm.diagnosisMaxValue = 99;
            vm.survivalMin = vm.survivalMinValue = 0;
            vm.survivalMax = vm.survivalMaxValue = 10;
            vm.search = "";

            var rawData;
            var pfApi = osApi.getPatientFilterApi();
            pfApi.init(vm.datasource);
            pfApi.onSelect.add(draw);



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
                pfApi.addFilter(vm.cohort, dtTable._('tr', {"filter":"applied"}).map(function(data) { return data[0]; }) );
                vm.cohort = "";
            };

            function draw(){
                dtTable.fnClearTable();
                 var data = pfApi.filter(rawData.tbl, function(p){ return p[0] });
                if (data.length==0) return;
                var d = data.map(function(d){ return d[4]; });
                var s = data.map(function(d){ return d[3]; });
                $timeout(function() {
                    vm.filter = pfApi.getActiveFilter().name;
                    vm.diagnosisMin = vm.diagnosisMinValue = Math.floor(Math.min.apply(null, d));
                    vm.diagnosisMax = vm.diagnosisMaxValue = Math.ceil(Math.max.apply(null, d));
                    vm.survivalMin = vm.survivalMinValue = Math.floor(Math.min.apply(null, s));
                    vm.survivalMax = vm.survivalMaxValue = Math.floor(Math.max.apply(null, s));
                });
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
                    $timeout(function() {
                        dtTable = angular.element('#history-datatable').dataTable({
                            "scrollY": "70vh",
                            "paging": false
                        });
                        $scope.$watch('vm.search', function() {
                            dtTable.api().search(vm.search).draw();
                        });
                        draw();
                        osApi.setBusy(false);
                    }, 0, false);
                });
            });
        }
    }
})();
