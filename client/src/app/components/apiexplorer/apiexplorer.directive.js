(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osApiExplorer', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/apiexplorer/apiexplorer.html',
            controller: ApiExplorerController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ApiExplorerController(osApi, $state, $timeout, $scope, $stateParams) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }
            // View Model
            var vm = this;
          
            // Elements
            //var dtTable;

            // Load Datasets
            osApi.setBusy(true);
            var start = new Date().getTime();
            // http://localhost:3000/api/TCGA_DISEASE
            // osApi.query("TCGA_DISEASE",
            //     {
            //         gender:'MALE'
            //     }).then(function(e){
            //    debugger;
            //    osApi.setBusy(false);
            // });
            osApi.query("TCGA_DISEASE").then(function(e){
               debugger;
               osApi.setBusy(false);
            });
            
        }
    }
})();
