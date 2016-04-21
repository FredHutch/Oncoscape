(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTest', test);

    /** @ngInject */
    function test() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/test/test.html',
            controller: TestController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function TestController(osApi) {

            // View Model
            var vm = this;
            vm.message = "Robert";
            vm.datasets = [];
            
            osApi.setBusy(true);
            osApi.getDataSetNames().then(function(response){

                vm.datasets = response.payload.datasets;

                osApi.setBusy(false);
            });
        }
    }
})();