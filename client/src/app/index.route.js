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
            .state('help', {
                url: '/help',
                template: '<os-help>'
            })
            .state('datasource', {
                url: '/datasource',
                template: '<os-datasource>'
            })
            .state('tools', {
                url: '/tools/{datasource}',
                template: '<os-tools>'
            })
            .state('metadata', {
                url: '/metadata/{datasource}',
                template: '<os-metadata>'
            })
            .state('history', {
                url: '/history/{datasource}',
                template: '<os-history>'
            })
            .state('plsr', {
                url: '/plsr/{datasource}',
                template: '<os-plsr>'
            })
            .state('pca', {
                url: '/pca/{datasource}',
                template: '<os-pca>'
            })
            .state('markers', {
                url: '/markers/{datasource}',
                template: '<os-markers>'
            })
            .state('pathways', {
                url: '/pathways/{datasource}',
                template: '<os-pathways>'
            })
            .state('timelines', {
                url: '/timelines/{datasource}',
                template: '<os-timelines>'
            })
            .state('survival', {
                url: '/survival/{datasource}',
                template: '<os-survival>'
            })
            .state('compare', {
                url: '/compare/{datasource}',
                template: '<os-compare>'
            });

        $urlRouterProvider.otherwise('/');
    }

})();
