(function() {
  'use strict';

  angular
    .module('oncoscape')
    .directive('navbar', navbar);

  /** @ngInject */
  function navbar() {
    
    var directive = {
      restrict: 'E',
      templateUrl: 'app/components/navbar/navbar.html',
      scope: {
         
      },
      controller: NavbarController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

    /** @ngInject */
    function NavbarController() {
      //var vm = this;
    }
  }

})();