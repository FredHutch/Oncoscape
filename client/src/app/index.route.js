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
                authenticate: false,
                datasource: false
            })
            .state('help', {
                url: '/help',
                template: '<os-help>',
                authenticate: false,
                datasource: false
            })
            .state('datasource', {
                url: '/datasource',
                template: '<os-datasource>',
                authenticate: true,
                datasource: false
            })
            .state('tools', {
                url: '/tools/{datasource}',
                template: '<os-tools>',
                authenticate: true,
                datasource: true
            })
            .state('metadata', {
                url: '/metadata/{datasource}',
                template: '<os-metadata>',
                authenticate: true,
                datasource: true
            })
            .state('history', {
                url: '/history/{datasource}',
                template: '<os-history>',
                authenticate: true,
                datasource: true
            })
            .state('plsr', {
                url: '/plsr/{datasource}',
                template: '<os-plsr>',
                authenticate: true,
                datasource: true
            })
            .state('pca', {
                url: '/pca/{datasource}',
                template: '<os-pca>',
                authenticate: true,
                datasource: true
            })
            .state('comparecluster', {
                url: '/comparecluster/{datasource}',
                template: '<os-compare-cluster>',
                authenticate: false,
                datasource: true
            })
            .state('markers', {
                url: '/markers/{datasource}',
                template: '<os-markers>',
                authenticate: true,
                datasource: true
            })
            .state('pathways', {
                url: '/pathways/{datasource}',
                template: '<os-pathways>',
                authenticate: true,
                datasource: true
            })
            .state('timelines', {
                url: '/timelines/{datasource}',
                template: '<os-timelines>',
                authenticate: true,
                datasource: true
            })
            .state('survival', {
                url: '/survival/{datasource}',
                template: '<os-survival>',
                authenticate: true,
                datasource: true
            })
            .state('dataexplorer', {
                url: '/dataexplorer/{datasource}',
                template: '<os-data-explorer>',
                authenticate: true,
                datasource: true
            })
            .state('oncoprint', {
                url: '/oncoprint/{datasource}',
                template: '<os-oncoprint>',
                authenticate: true,
                datasource: true
            })
            .state('genesettest', {
                url: '/genesettest/{datasource}',
                template: '<os-genesettest>',
                authenticate: true,
                datasource: true
            })
            .state('cohortbuilder', {
                url: '/cohortbuilder/{datasource}',
                template: '<os-cohort-builder>',
                authenticate: true,
                datasource: true
            })
            .state('sunburst', {
                url: '/sunburst/{datasource}',
                template: '<os-sunburst>',
                authenticate: false,
                datasource: true
            })
           

        $urlRouterProvider.otherwise('/');
    }

})();
