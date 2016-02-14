(function() {
  'use strict';

  angular
    .module('oncoscape')
    .config(routerConfig);

  /** @ngInject */
  function routerConfig($stateProvider, $urlRouterProvider) {
    $stateProvider
      .state('landing', {
        url: '/',
        template: '<os-landing>'
      })
      .state('login', {
        url: '/login',
        template: '<os-login>'

      })
      .state('datasource',{
        url: '/datasource',
        template: '<os-datasource>'
      });


    $urlRouterProvider.otherwise('/');
  }

})();
