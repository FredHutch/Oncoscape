(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osSurvival', survival);

    /** @ngInject */
    function survival() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/survival/survival.html',
            controller: SurvivalController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SurvivalController(osApi, $state, $timeout, $scope, $stateParams) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // Data
            var rawData;
            var cohortPatient = osApi.getCohortPatient();

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.optCohortPatients = cohortPatient.get();
            vm.optCohortPatient = vm.optCohortPatients[0];
            

            $scope.$watch('vm.optCohortPatient', function() {
                var ids = vm.optCohortPatient.ids;
                if (ids == "*"){
                    ids = rawData;
                }
                else{
                    var pids = vm.optCohortPatient.ids;
                    if (rawData!=null){
                        ids = rawData.filter( function(d){
                            return (pids.indexOf(d)>=0);
                        });
                        draw(ids);
                    }
                }
            });

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    rawData = response.payload.tbl.map( function (d) { return d[0]; });
                    var data = (vm.optCohortPatient.ids=="*") ? rawData : vm.optCohortPatient.ids;
                    draw(data);
                });
            });

            // Draw
            function draw(ids){
                osApi.setBusy(true);
                osApi.getCalculatedSurvivalCurves(ids, "").then(function(r){
                        angular.element("#survival-img").attr('src',r.payload);
                        osApi.setBusy(false);
                });
            }
        }
    }
})();
