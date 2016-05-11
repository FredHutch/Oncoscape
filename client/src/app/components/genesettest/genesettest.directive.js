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
        function GenesettestController(osApi, $state, $stateParams, $timeout, $scope, d3, $window, _) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Elements
            var elInput = angular.element("#geneSetTestsInputsDiv");
            
            // Properties
            var cohortPatient = osApi.getCohortPatient();

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.geneSets = [];
            vm.geneSet = null;
            vm.optCohortPatients = cohortPatient.get();
            vm.optCohortPatient = vm.optCohortPatients[0];
            vm.errorMessage;
            //osApi.setBusy(true);
            var Group1 = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028"];
            var Group2 = ["TCGA.06.0140", "TCGA.06.0182", "TCGA.06.0413"];
            var geneSet = "";
            vm.message = osApi.getGeneSetScore(Group1, Group2, geneSet);
        }    
     }
})();     