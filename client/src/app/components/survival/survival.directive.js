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

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            
            // Filter
            var rawData;
            var pfApi = osApi.getPatientFilterApi();
            pfApi.init(vm.datasource);
            pfApi.onSelect.add(draw);

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    rawData = response.payload.tbl.map( function (d) { return d[0]; });
                    draw();
                });
            });

            // Draw
            function draw(){
                osApi.setBusy(true);
                var ids = pfApi.filter(rawData, function(p){ return p; });
                osApi.getCalculatedSurvivalCurves(ids, "").then(function(r){
                        document.getElementById("survival-img").src = r.payload;
                        osApi.setBusy(false);
                });
            }
        }
    }
})();
