(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osSubnav', login);


    /** @ngInject */
    function login() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/subnav/subnav.html',
            replace: true,
            controller: SubnavController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SubnavController(osApi, $state) {
            
            var vm = this;
            vm.tool = "Pathways";
            vm.filter = "DemoDZ";

            vm.toolsClick = function(){
                $state.go("tools", {
                    datasource: vm.datasource
                });
            };
            
            vm.cohortClick = function() {
                osApi.toggleFilter();
            };
        }
    }

})();
