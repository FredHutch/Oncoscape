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
<<<<<<< HEAD
=======

            $scope.$on("$destroy", function() {
                vm.applyFilter("Exit");
                osHistory.removeListeners();
            });
>>>>>>> 4646811ce13a4d562c2925f1f4f7072454460c15

            // Redirect if No Datasource
            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Properties
            var vm = this;
<<<<<<< HEAD
            var table;
            var selectedIds = (osHistory.getPatientSelection() == null) ? [] : osHistory.getPatientSelection().ids;

            var initViewState = function(vm, datasource){
                vm.datasource = datasource;
                vm.diagnosisMin = vm.diagnosisMinValue = 1;
                vm.diagnosisMax = vm.diagnosisMaxValue = 99;
                vm.survivalMin = vm.survivalMinValue = 0;
                vm.survivalMax = vm.survivalMaxValue = 10;
                vm.search = "";
            }
=======
            vm.datasource = $stateParams.datasource;
            vm.filter;
            vm.colnames = [];
            vm.diagnosisMin = vm.diagnosisMinValue = 1;
            vm.diagnosisMax = vm.diagnosisMaxValue = 99;
            vm.survivalMin = vm.survivalMinValue = 0;
            vm.survivalMax = vm.survivalMaxValue = 10;
            vm.search = "";


            vm.applyFilter = function(filter) {
                selectedIds = null;
                var o = dtTable._('tr', {
                    "filter": "applied"
                }).map(function(item) {
                    return item[0].toString().toUpperCase()
                });
                o = $.map(o, function(value) {
                    return [value];
                });
                osHistory.addPatientSelection("Patient History", filter, o);
                dtTable.api().draw();
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
>>>>>>> 4646811ce13a4d562c2925f1f4f7072454460c15

            var initDataTable = function(vm, data){
                
                // Override Filter Function
                angular.element.fn.DataTable.ext.search = [function(settings, data) {
                    var survival = parseFloat(data[3]);
                    var diagnosis = parseFloat(data[4]);
                    if (selectedIds.length!=0) {
                        if (selectedIds.indexOf(data[0]) == -1) return false;
                    }
                    if (isNaN(survival) || isNaN(diagnosis)) return false;
                    return (diagnosis >= vm.diagnosisMin &&
                        diagnosis < (vm.diagnosisMax + 1) &&
                        survival >= vm.survivalMin &&
                        survival < (vm.survivalMax + 1));
                }];

                // Specify Data
                var columns = data.colnames.map( function (c) { return {title:c}; });
                table = angular.element('#history-datatable').dataTable({
                            paging: false,
                            columns: columns,
                            data: data.tbl
                });
                table.api().draw();
            }

            var initEvents = function(vm, $scope){
                vm.applyFilter = function(filter) {
                    selectedIds = [];
                    table.api().draw();
                    
                    var o = table._('tr', {
                        "filter": "applied"
                    }).map(function(item) {
                        return item[0].toString().toUpperCase()
                    });//.map(function(value){ return [value] });
                    o = $.map(o, function(value) {
                        return [value];
                    });
                    osHistory.addPatientSelection("Patient History", filter, o);
                };
                var init = true;
                $scope.$watch('vm.search', _.debounce(function() {
                    if (init) {
                        init = false;
                        return;
                    }
                    vm.applyFilter("Search");
                }, 1000));

                osHistory.onPatientSelectionChange.add(function(selection) {
                    selectedIds = selection.ids;
                    table.api().draw();
                });
                
            }

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset($stateParams.datasource).then(function() {
                osApi.getPatientHistoryTable($stateParams.datasource).then(function(response) {
                    initViewState(vm, $stateParams.datasource);
                    initDataTable(vm, response.payload);
                    initEvents(vm, $scope)
                    osApi.setBusy(false);
                });
            });

            
        }
    }
})();
