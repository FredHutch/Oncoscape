(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osLogin', login);

    /** @ngInject */
    function login() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/login/login.html',
            replace: true,
            controller: LoginController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function LoginController(osApi, $state, $scope, osAuth) {

            var vm = this;
            vm.networks = osAuth.getAuthSources();
            vm.login = osAuth.login;
            vm.logout = osAuth.logout;
            
            var loginSuccess = function() {
                $state.go("userdatasource");
                
            };
    
            osAuth.onLogin.add(loginSuccess); 
            
            // Desotroy
            $scope.$on('$destroy', function() {
                osAuth.onLogin.remove(loginSuccess);
            });
        }
    }
})();
