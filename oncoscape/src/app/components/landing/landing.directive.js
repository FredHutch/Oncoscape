(function() {
    'use strict';
    angular
        .module('oncoscape')
        .directive('osLanding', landing);

    /** @ngInject */
    function landing() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/landing/landing.html',
            replace: true,
            scope: {},
            controller: LandingController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function LandingController($state) {
            var vm = this;
            vm.login = function(){
                $state.go("login");
            }
        }
    }

})();
