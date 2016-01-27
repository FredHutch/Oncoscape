
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
        username: '='
      },
      controller: LoginController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

    /** @ngInject */
    function LoginController(moment) {
      var vm = this;
      
      //vm.username = "ASDF";
      
    }
  }

})();
