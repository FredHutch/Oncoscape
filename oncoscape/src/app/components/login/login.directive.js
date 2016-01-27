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
      debugger;
      var vm = this;
    }
  }

})();