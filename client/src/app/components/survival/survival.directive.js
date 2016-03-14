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
        function SurvivalController(osApi, osState, $state, $timeout, $scope, $stateParams) {

            var rawData;

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            if (osState.patientFilters.get()==null) osState.patientFilters.set(vm.datasource);
      

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    var ids = response.payload.tbl.map( function (d) { return d[0]; });
                    osApi.getCalculatedSurvivalCurves(ids, "").then(function(r){
                        document.getElementById("survival-img").src = r.payload;
                        osApi.setBusy(false);
                    });
                });
            });
        }
    }
})();
