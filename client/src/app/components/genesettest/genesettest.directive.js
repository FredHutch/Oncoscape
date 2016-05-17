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

        
            var cohort1 = osHistory.getPatientSelections()[0];
            var cohort2 = osHistory.getPatientSelections()[1];

            // Initialize
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function(response) {
                var mtx = response.payload.rownames.filter(function(v) {
                        return v.indexOf("mtx.mrna") >= 0
                    });

                mtx = mtx[mtx.length - 1].replace(".RData", "");
                console.log("**** mtx is: ", mtx);

                if(cohort1 == null || cohort2 == null){
                    vm.message = "Please select two cohorts to test out the Gene Set";
                    vm.optCohort1 = "Empty";
                    vm.optCohort2 = "Empty";
                }else{
                    vm.optCohort1 = cohort1.tool + " " +cohort1.desc + " " + cohort1.ids.length + " Patients selected" ;
                    vm.optCohort2 = cohort2.tool + " " +cohort2.desc + " " + cohort2.ids.length + " Patients selected" ;
                    //var geneset = "random.24";
                    var geneset = "tcga.pancan.mutated";
                    osApi.getGeneSetTest(vm.datasource, mtx).then(function() {
                        $scope.$watchGroup(['vm.optCohort1', 'vm.optCohort2'], function() {
                           calculateGeneSetScore(cohort1, cohort2, geneset);
                        });  
                     });   
                }
                osApi.setBusy(false);
            });


            // API Call To oncoprint_data_selection
            var calculateGeneSetScore = function(cohort1, cohort2, geneset) {    
                var Group1 = cohort1.ids;
                var Group2 = cohort2.ids;

                osApi.setBusy(true);
                osApi.getGeneSetScore(Group1, Group2, geneset).then(function(response){
                    if(response.status == "error"){
                        vm.message = response.payload + "Please select two cohorts to test out the Gene Set";
                    }else{
                        vm.message = response.payload;
                    }
                    osApi.setBusy(false);
                });
             }    
     }
    } 
})();   