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
        function SurvivalController(osApi, osHistory, $state, $timeout, $scope, $stateParams) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }


            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;

            // Set Dataset 
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function() {
                // If No Patients Are Selected, Fetch All Patients
                if (osHistory.getPatientSelection()==null){
                    osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                        draw(response.payload.tbl.map( function (d) { return d[0]; }));
                    });
                }else{
                    draw(osHistory.getPatientSelection().ids);
                }
            });

            // Register History Component
            osHistory.onPatientSelectionChange.add(function(selection){
                draw(selection.ids)
            });

            // Draw
            var draw = function(ids){
                osApi.setBusy(true);
                osApi.getCalculatedSurvivalCurves(ids, "").then(function(r){
                    angular.element("#survival-img").attr('src',r.payload);
                    osApi.setBusy(false);
                });
            }
        }
    }
})();
