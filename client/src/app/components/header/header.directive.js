(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHeader', header);

    /** @ngInject */
    function header() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/header/header.html',
            scope: {},
            controller: HeaderController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HeaderController(osApi, osState, $stateParams, $state) {


            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";

            vm.toolsClick = function(){
            
                $state.go("tools", {
                    datasource: vm.datasource
                });
            };
            
            var showing = false;
            vm.cohortClick = function() {
                if (showing) osApi.hideFilter();
                else osApi.showFilter();
                showing = !showing;
            };
        }
    }

})();
