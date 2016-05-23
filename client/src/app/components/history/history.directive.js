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
        function HistoryController(osApi, osHistory, $state, $timeout, $scope, moment, $stateParams, _, $) {

            $scope.$on("$destroy", function() {
                vm.applyFilter("Exit");
                osHistory.removeListeners();
            });

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }
            // Properties
            var dtTable;
            var rawData;
            var data;
            var selectedIds = (osHistory.getPatientSelection() == null) ? [] : osHistory.getPatientSelection().ids;

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.filter;
            vm.colnames = [];
            vm.diagnosisMin = vm.diagnosisMinValue = 1;
            vm.diagnosisMax = vm.diagnosisMaxValue = 99;
            vm.survivalMin = vm.survivalMinValue = 0;
            vm.survivalMax = vm.survivalMaxValue = 10;
            vm.search = "";


            vm.applyFilter = function(filter) {
                selectedIds = [];
                dtTable.api().draw();
                    var o = dtTable._('tr', {
                        "filter": "applied"
                    }).map(function(item) {
                        return item[0].toString().toUpperCase()
                    });
                    o = $.map(o, function(value) {
                        return [value];
                    });
                    
                    osHistory.addPatientSelection("Patient History", filter, o);
                    
                
            };


            function draw() {

                if (angular.isUndefined(dtTable)) return;
                dtTable.fnClearTable();
                data = rawData.tbl;
                if (data.length == 0) return;
                var d = data.map(function(d) {
                    return d[4];
                });
                var s = data.map(function(d) {
                    return d[3];
                });

                // Override Datatables Default Search Function - More Efficent Than Using Angular Bindings
                angular.element.fn.DataTable.ext.search = [function(settings, data) {
                    var survival = parseFloat(data[3]);
                    var diagnosis = parseFloat(data[4]);
                    if (selectedIds.length=0) {
                        if (selectedIds.indexOf(data[0]) == -1) return false;
                    }
                    if (isNaN(survival) || isNaN(diagnosis)) return false;
                    return (diagnosis >= vm.diagnosisMin &&
                        diagnosis < (vm.diagnosisMax + 1) &&
                        survival >= vm.survivalMin &&
                        survival < (vm.survivalMax + 1));

                }];
                $timeout(function() {
                    vm.diagnosisMin = vm.diagnosisMinValue = Math.floor(Math.min.apply(null, d));
                    vm.diagnosisMax = vm.diagnosisMaxValue = Math.ceil(Math.max.apply(null, d));
                    vm.survivalMin = vm.survivalMinValue = Math.floor(Math.min.apply(null, s));
                    vm.survivalMax = vm.survivalMaxValue = Math.floor(Math.max.apply(null, s));
                    dtTable.fnAddData(data);
                    dtTable.api().draw();
                });

            }

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    rawData = response.payload;
                    vm.colnames = rawData.colnames;
                    $timeout(function() {

                        // Configure Data Table
                        dtTable = angular.element('#history-datatable').dataTable({
                            "paging": false
                        });

                        // Register History Component
                        osHistory.onPatientSelectionChange.add(function(selection) {
                            selectedIds = selection.ids;
                            vm.diagnosisMin = vm.diagnosisMinValue;
                            vm.diagnosisMax = vm.diagnosisMaxValue;
                            vm.survivalMin = vm.survivalMinValue;
                            vm.survivalMax = vm.survivalMaxValue;
                            vm.search = "";
                            $scope.$apply();
                            dtTable.api().draw();
                        });

                        // Register Search Watch
                        var init = true;
                        $scope.$watch('vm.search', _.debounce(function() {
                            if (init) {
                                init = false;
                                return;
                            }
                            vm.applyFilter("Search");
                        }, 1000));
                        draw();
                        osApi.setBusy(false);
                    }, 0, false);
                });
            });
        }
    }
})();
