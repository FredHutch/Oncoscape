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
                authenticate: true,
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
            .state('sunburst', {
                url: '/sunburst/{datasource}',
                template: '<os-sunburst>',
                authenticate: true,
                datasource: true
            })
            .state('heatmap', {
                url: '/heatmap/{datasource}',
                template: '<os-heatmap>',
                authenticate: false,
                datasource: false
            })
            .state('barcharts', {
                url: '/barchart/{datasource}',
                template: '<os-barchart>',
                authenticate: true,
                datasource: true
            });

        $urlRouterProvider.otherwise('/');
    }

})();
