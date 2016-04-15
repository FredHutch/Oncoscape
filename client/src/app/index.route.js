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
                template: '<os-landing>',
                authenticate: false
            })
            .state('help', {
                url: '/help',
                template: '<os-help>',
                authenticate: false
            })
            .state('datasource', {
                url: '/datasource',
                template: '<os-datasource>',
                authenticate: true
            })
            .state('tools', {
                url: '/tools/{datasource}',
                template: '<os-tools>',
                authenticate: true
            })
            .state('metadata', {
                url: '/metadata/{datasource}',
                template: '<os-metadata>',
                authenticate: true
            })
            .state('history', {
                url: '/history/{datasource}',
                template: '<os-history>',
                authenticate: true
            })
            .state('plsr', {
                url: '/plsr/{datasource}',
                template: '<os-plsr>',
                authenticate: true
            })
            .state('pca', {
                url: '/pca/{datasource}',
                template: '<os-pca>',
                authenticate: true
            })
            .state('pca3d', {
                url: '/pca3d/{datasource}',
                template: '<os-pca3d>',
                authenticate: true
            })
            .state('markers', {
                url: '/markers/{datasource}',
                template: '<os-markers>',
                authenticate: true
            })
            .state('pathways', {
                url: '/pathways/{datasource}',
                template: '<os-pathways>',
                authenticate: true
            })
            .state('timelines', {
                url: '/timelines/{datasource}',
                template: '<os-timelines>',
                authenticate: true
            })
            .state('survival', {
                url: '/survival/{datasource}',
                template: '<os-survival>',
                authenticate: true
            })
            .state('oncoprint', {
                url: '/oncoprint/{datasource}',
                template: '<os-oncoprint>',
                authenticate: false
            })
            .state('compare', {
                url: '/compare/{datasource}',
                template: '<os-compare>',
                authenticate: true
            });

        $urlRouterProvider.otherwise('/');
    }

})();
