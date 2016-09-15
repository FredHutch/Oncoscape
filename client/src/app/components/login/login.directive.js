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
            
            var userApi = osApi.getUserApi();

            var vm = this;
            vm.domains = userApi.getDomains();
            vm.user = userApi.getUser();
            vm.hasError = false;

            vm.login = function() {
                var promise = userApi.login(vm.user);
                if (angular.isDefined(promise)){
                    promise.then(function() {
                        if (vm.user.authenticated) {
                            $state.go("datasource");
                        } else {
                            vm.hasError = true;
                        }
                    });
                }else{
                    $state.go("datasource");
                }
                
            }
        }
    }

})();
