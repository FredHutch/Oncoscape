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

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // Properties
            var dtTable;
            var cohortPatient = osApi.getCohortPatient();
            var rawData;
            var data;

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.filter;
            vm.colnames = [];
            vm.diagnosisMin = vm.diagnosisMinValue = 1;
            vm.diagnosisMax = vm.diagnosisMaxValue = 99;
            vm.survivalMin = vm.survivalMinValue = 0;
            vm.survivalMax = vm.survivalMaxValue = 10;
            vm.optCohortPatients = cohortPatient.get();
            vm.optCohortPatient = vm.optCohortPatients[0];
            vm.search = "";

            vm.addCohortPatient = function(){
                var cohortName = "Patient " + moment().format('- H:mm - M/D/YY');
                var cohortIds = dtTable._('tr', {"filter":"applied"}).map( function ( item ){ return item[0].toUpperCase() } );
                var cohort = {name:cohortName, ids:cohortIds};
                vm.optCohortPatients.push(cohort);
                vm.optCohortPatient = cohort;

            }
            $scope.$watch('vm.optCohortPatient', draw);

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


            function draw(){
                if (angular.isUndefined(dtTable)) return;
                dtTable.fnClearTable();
                data = rawData.tbl;
                if (vm.optCohortPatient.ids!="*"){
                    data = data.filter(function(d){
                        return (vm.optCohortPatient.ids.indexOf(d[0])>=0)
                    });
                }

                
                if (data.length==0) return;
                var d = data.map(function(d){ return d[4]; });
                var s = data.map(function(d){ return d[3]; });
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
                        dtTable = angular.element('#history-datatable').dataTable({
                            //"scrollY": "500px",
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
