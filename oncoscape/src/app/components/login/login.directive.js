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
        function LoginController(osApi, osState) {
            var vm = this;

            function init() {
                vm.domains = osApi.getDomains(); //angular.copy(vm.datasource);
                vm.user = osState.getUser();
            }

            init();

            vm.login = function() {
                osApi.login(vm.user.name, vm.user.password, vm.user.domain);
                osApi.getDataSetNames(function(){
                    alert("HI");
                });
            }
        }
    }

})();
