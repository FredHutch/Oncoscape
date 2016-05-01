(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osOncoprint', oncoprint);

    /** @ngInject */
    function oncoprint() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/oncoprint/oncoprint.html',
            controller: OncoprintController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function OncoprintController(osApi, $state, $stateParams, $timeout, $scope, d3, $window, _) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Properties
            var cohortGene = osApi.getCohortGene();
            var cohortPatient = osApi.getCohortPatient();
            var dataGene;
            var dataPatientGene;


            // View Model
            var vm = initializeViewModel(this, $stateParams);
            function initializeViewModel(vm, $stateParams){
              vm.datasource = $stateParams.datasource;
              vm.optCohortGenes = cohortGene.get();
              vm.optCohortGene = vm.optCohortGenes[0];
              vm.optCohortPatients = cohortPatient.get();
              vm.optCohortPatient = vm.optCohortPatients[0];
              //vm.geneSetAndPatients = vm.optCohortGenes + vm.optCohortPatients;         
              return vm;
            }

            var draw = function(){

            };

            (function(osApi,vm){

            })()
          /*
            var draw = function(){}


            // Initialize + Load Data
            (function(osApi, vm){
              // osApi.setBusy(true)("Loading Dataset");
              // osApi.setDataset(vm.datasource).then(function(response) {

              //   var demoOncoString = ["TCGA.02.0001", "TCGA.02.0003", "TCGA.02.0006", "TCGA.02.0007",
              //                   "TCGA.02.0009", "TCGA.02.0010", "TCGA.02.0011", "TCGA.02.0014",
              //                   "TCGA.02.0021", "TCGA.02.0024", "TCGA.02.0027", "TCGA.02.0028",
              //                   "TCGA.02.0033", "TCGA.02.0034", "TCGA.02.0037", "TCGA.02.0038",
              //                   "TCGA.02.0043", "TCGA.02.0046", "TCGA.02.0047", "TCGA.02.0052",
              //                   "TCGA.02.0054", "TCGA.02.0055", "TCGA.02.0057", "TCGA.02.0058",
              //                   "TCGA.02.0060", "TCGA.06.0875", "TCGA.06.0876", "TCGA.06.0877",
              //                   "TCGA.06.0878", "TCGA.06.0879", "TCGA.06.0881", "TCGA.06.0882",
              //                   "TCGA.12.0670", "TCGA.12.0818", "TCGA.12.0819", "TCGA.12.0820",
              //                   "TCGA.12.0821", "TCGA.12.0822", "TCGA.12.0826", "TCGA.12.0827", "EGFR", "PTEN"];

              //   osApi.getOncoprint(demoOncoString).then(function(response){
              //     dataPatientGene = response.payload[0];
              //     dataGene = angular.isArray(response.payload[1]) ? response.payload[1] : [response.payload[1]];
              //     debugger;
              //     draw();

              //   });
              // });
            })(osApi, vm);
            */
        }
    }
})();




            // Cohorts
            // vm.addCohortGene = function(){
            //     var cohortName = "Oncoprint " + moment().format('- H:mm:ss - M/D/YY');
            //     var cohortIds = d3Chart.selectAll(".oncoprint-track-label-main")[0].map(function(node){ return node.innerText; });
            //     var cohort = {name:cohortName, ids:cohortIds};
            //     vm.optCohortPatients.push(cohort);
            //     vm.optCohortPatinet = cohort;
            // }
            // $scope.$watch('vm.optCohortGene', function() {
            //     var ids = vm.optCohortGene.ids;
            //     if (ids == "*"){
            //         d3Chart.selectAll(".plsr-node-selected").classed("plsr-node-selected", false);
            //     }
            //     else{
            //         d3Chart.selectAll("circle").classed("plsr-node-selected", function(){
            //             return (ids.indexOf(this.__data__.name)>=0)
            //         });
            //     }
            // });


