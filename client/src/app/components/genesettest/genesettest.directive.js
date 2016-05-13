(function() {
    'use strict';
    
    angular
        .module('oncoscape')
        .directive('osGenesettest', genesettest);

    /** @ngInject */
    function genesettest() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/genesettest/genesettest.html',
            controller: GenesettestController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function GenesettestController(osApi, osHistory, $state, $stateParams, $timeout, $scope, d3, $window, _) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Elements
            var elInput = angular.element("#geneSetTestsInputsDiv");
            
            // Properties
            //var cohortPatient = osApi.getCohortPatient();

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.geneSets = [];
            vm.geneSet = null;

            // History Integration
            var selectedIds = (osHistory.getPatientSelection() == null) ? null : osHistory.getPatientSelection().ids;
            function saveSelected() {
                osHistory.addPatientSelection("PCA", "Manual Selection",
                    d3Chart.selectAll(".pca-node-selected")[0].map(function(node) {
                        return node.__data__.id.toUpperCase();
                    })
                );
            }
            // Initialize
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function(response) {
                var mtx = response.payload.rownames.filter(function(v) {
                    return v.indexOf("mtx.mrna") >= 0
                });

                mtx = mtx[mtx.length - 1].replace(".RData", "");
                osApi.setBusyMessage("Creating PCA Matrix");
                var Group1 = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028"];
                var Group2 = ["TCGA.06.0140", "TCGA.06.0182", "TCGA.06.0413"];
                var geneSet = "";
                vm.message = osApi.getGeneSetScore(Group1, Group2, geneSet);
            });
            //osApi.setBusy(true);
            var Group1 = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028"];
            var Group2 = ["TCGA.06.0140", "TCGA.06.0182", "TCGA.06.0413"];
            var geneSet = "";
            vm.message = osApi.getGeneSetScore(Group1, Group2, geneSet);
        }    
     }
})();     