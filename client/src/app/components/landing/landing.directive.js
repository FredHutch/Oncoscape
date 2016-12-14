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
            controller: LandingController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function LandingController($state, $scope, osApi, osAuth) {

            angular.element(".marquee-bg").marquee({
                particlesNumber: 49,
                color: '#1396de',
                particle: {
                    speed: 40
                }
            });

            var vm = this;
            vm.login = function() {
                $state.go("login");
            };
            vm.getStarted = function() {
                osApi.init().then(function() {
                    osAuth.loginGuest();
                });
            };

            var loginSuccess = function() {
                $state.go("datasource");
            };

            osAuth.onLogin.add(loginSuccess);

            // Desotroy
            $scope.$on('$destroy', function() {
                osAuth.onLogin.remove(loginSuccess);
            });
        }
    }

})();