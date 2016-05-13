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

           
            // var ptSelectionLength = osHistory.getPatientSelections().length;
            // if(ptSelectionLength < 2) vm.message = "Please select two groups of Patients";
            //     return;
            // console.log("*****ptSelectionLength is: ", ptSelectionLength);    
            // var cohort1 = osHistory.getPatientSelections()[parseInt(ptSelectionLength - 2)];
            // var cohort2 = osHistory.getPatientSelections()[parseInt(ptSelectionLength - 1)];
            var cohort1 = osHistory.getPatientSelections()[0];
            var cohort2 = osHistory.getPatientSelections()[1];
            // Initialize
            if(cohort1 == null || cohort2 == null){
                vm.message = "Error, please select two cohorts to compare";
            }else{
                var Group1 = cohort1.ids;
                var Group2 = cohort2.ids;
                vm.optCohort1 = cohort1.tool + " " +cohort1.desc + " " + cohort1.ids.length + " Patients selected" ;
                vm.optCohort2 = cohort2.tool + " " +cohort2.desc + " " + cohort2.ids.length + " Patients selected" ;
               
                osApi.setDataset(vm.datasource).then(function(response) {
                    var mtx = response.payload.rownames.filter(function(v) {
                        return v.indexOf("mtx.mrna") >= 0
                    });

                    mtx = mtx[mtx.length - 1].replace(".RData", "");
                    osApi.setBusy(true);
                    //var Group1 = ["TCGA.02.0014", "TCGA.02.0021", "TCGA.02.0028"];
                    //var Group2 = ["TCGA.06.0140", "TCGA.06.0182", "TCGA.06.0413"];
                    var geneSet = "NOUSHMEHR_GBM_GERMLINE_MUTATED";
                    osApi.setBusy(true)("GeneSet Binomial Calculating...");
                    osApi.getGeneSetScore(Group1, Group2, geneSet).then(function(response){
                        vm.message = response.payload;
                    });
                    osApi.setBusy(false);
                });
               
            }
            
            
        }    
     }
})();     