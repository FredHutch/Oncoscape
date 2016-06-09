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
        function HistoryController(osApi, osHistory, $state, $timeout, $scope, moment, $stateParams, _, $, $q) {

            // Redirect if No Datasource
            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Properties
            var vm = this;
            var table;
            var selectedIds = (osHistory.getPatientSelection() == null) ? [] : osHistory.getPatientSelection().ids;

            var initViewState = function(vm){
                vm.diagnosisMin = vm.diagnosisMinValue = 1;
                vm.diagnosisMax = vm.diagnosisMaxValue = 100000;
                vm.survivalMin = vm.survivalMinValue = 0;
                vm.survivalMax = vm.survivalMaxValue = 10;
                vm.search = "";
            }

            var initDataTable = function(vm, columns, data){
                
                // Override Filter Function
                angular.element.fn.DataTable.ext.search = [function(settings, data) {
                    
                    if (selectedIds.length!=0) {
                        if (selectedIds.indexOf(data[0]) == -1) return false;
                    }

                    var diagnosis = parseFloat(data[3]);
                    var survival = parseFloat(data[4]);
                    //if (isNaN(survival) || isNaN(diagnosis)) return false;
                    // return (diagnosis >= vm.diagnosisMin &&
                    //     diagnosis < (vm.diagnosisMax + 1) &&
                    //     survival >= vm.survivalMin &&
                    //     survival < (vm.survivalMax + 1));
                    return true;
                }];

                // Specify Data
                table = angular.element('#history-datatable').dataTable({
                            paging: false,
                            columns: columns,
                            data: data
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
                        return item["patient_ID"].toString().toUpperCase()
                    });

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

            var columns = [
                {data:'patient_ID', title:'Patient ID', defaultContent:'NA'},
                {data:'gender', title:'Gender', defaultContent:'NA'},
                {data:'race', title:'Race', defaultContent:'NA'},
                {data:'age_at_diagnosis', title:'DX Age', defaultContent:'NA'},
                {data:'days_to_death', title:'Survival', defaultContent:'NA'},
                {data:'status_vital', title:'Status', defaultContent:'NA'}
            ];

            var ds = osApi.convertDatasetNameFromRToMongo($stateParams.datasource);
            initViewState(vm);
            osApi.query(ds+"_pt", 
                {
                    $fields:columns.map(function(f){ return f.data; }),
                    $limit:0
                })
            .then(function(response){
               initDataTable(vm, columns, response.data);
               initEvents(vm, $scope)
               osApi.setBusy(false);
            });
        }
    }
})();
