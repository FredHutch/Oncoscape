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
            scope: {},
            controller: LoginController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function LoginController(osApi, osState, $state) {
            var vm = this;
            vm.domains = osApi.getDomains();
            vm.user = osState.getUser();
            vm.hasError = false;

            vm.login = function() {
                osApi.login(vm.user).then(function(){
                    if (vm.user.authenticated) console.log("YEP");
                    if (vm.user.authenticated){
                        $state.go("datasource");
                    }else{
                        vm.hasError = true;
                    }
                });
            }
        }
    }

})();
