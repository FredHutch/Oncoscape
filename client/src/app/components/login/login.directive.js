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
        function LoginController(osApi, $state) {
            
            var vm = this;
            vm.domains = osApi.getDomains();
            vm.user = osApi.getUser();
            vm.hasError = false;

            vm.login = function() {
                osApi.login(vm.user).then(function() {
                    if (vm.user.authenticated) {
                        $state.go("datasource");
                    } else {
                        vm.hasError = true;
                    }
                });
            }
        }
    }

})();
