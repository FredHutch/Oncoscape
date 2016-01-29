(function() {
  'use strict';

  angular
    .module('oncoscape')
    .directive('login', login);

  /** @ngInject */
  function login() {

    var directive = {
      restrict: 'E',
      templateUrl: 'app/components/login/login.html',
      replace: true,
      scope: {
        user: '='
      },
      controller: LoginController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

    /** @ngInject */
    function LoginController(sOncoscape) {
      var vm = this;
      vm.login = function(){
        sOncoscape.login(vm.user.name, vm.user.password, vm.user.domain);
      }
    }
  }

})();