(function() {
    'use strict';

    angular
        .module('oncoscape')
        .config(routerConfig);

    /** @ngInject */
    function routerConfig($stateProvider, $urlRouterProvider) {

        // Resolutions
        var resolveDatasource = function(osApi) {
            osApi.setBusy(true);
            return new Promise(function(resolve) {
                osApi.init().then(function() {
                    resolve();
                    angular.element("#main").removeClass("container-main-full");
                    angular.element("#header").css({ display: "block" });
                    angular.element("#cohortMenu").css({ display: "none" });
                    osApi.onNavChange.dispatch("");
                });
            });
        };

        var resolveTools = function(osApi, $stateParams) {
            return new Promise(function(resolve) {
                resolveDatasource(osApi).then(function() {
                    osApi.setDataSource($stateParams.datasource);
                    resolve();
                    angular.element("#cohortMenu").css({ display: "none" });
                    osApi.onNavChange.dispatch("TOOLS");
                });
            });
        };

        var resolveTool = function(osApi, osCohortService, $stateParams) {
            return new Promise(function(resolve) {
                resolveTools(osApi, $stateParams).then(function() {

                    if (osCohortService.getCohort() === null) {
                        osCohortService.loadCohorts().then(function() {
                            resolve();
                            angular.element("#cohortMenu").css({ display: "block" });
                            osApi.onNavChange.dispatch("TOOL");
                        });
                    } else {
                        angular.element("#cohortMenu").css({ display: "block" });
                        osApi.onNavChange.dispatch("TOOL");
                        resolve();
                    }

                });
            });

        };

        var resolveLanding = function(osApi, $timeout) {
            $timeout(function() {
                angular.element("#main").addClass("container-main-full");
                angular.element("#header").css({ display: "none" });
                angular.element("#cohortMenu").css({ display: "none" });
                osApi.onNavChange.dispatch("");
            }, 200);
        }


        // States
        $stateProvider
            .state('landing', {
                url: '/',
                template: '<os-landing>',
                datasource: false,
                help: "/",
                resolve: {
                    resolveLanding: resolveLanding
                }
            })
            .state('datasource', {
                url: '/datasource',
                template: '<os-datasource>',
                datasource: false,
                help: "/",
                resolve: {
                    resolveDatasource: resolveDatasource
                }
            })
            .state('tools', {
                url: '/tools/{datasource}',
                template: '<os-tools>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTools: resolveTools
                }
            })
            .state('scatter', {
                url: '/scatter',
                template: '<os-scatter>',
                datasource: false,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('history', {
                url: '/spreadsheet/{datasource}',
                template: '<os-spreadsheet>',
                datasource: true,
                help: "/spreadsheet.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('plsr', {
                url: '/plsr/{datasource}',
                template: '<os-plsr>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('pca', {
                url: '/pca/{datasource}',
                template: '<os-pca>',
                datasource: true,
                help: "/pca.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('comparecluster', {
                url: '/cc/{datasource}',
                template: '<os-compare-cluster>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('markers', {
                url: '/markers/{datasource}',
                template: '<os-markers>',
                datasource: true,
                help: "/markerspatients.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('pathways', {
                url: '/pathways/{datasource}',
                template: '<os-pathways>',
                datasource: true,
                help: "/pathways.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('timelines', {
                url: '/timelines/{datasource}',
                template: '<os-timelines>',
                datasource: true,
                help: "/timelines.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('survival', {
                url: '/survival/{datasource}',
                template: '<os-survival>',
                datasource: true,
                help: "/survival.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('sunburst', {
                url: '/sunburst/{datasource}',
                template: '<os-sunburst>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('heatmap', {
                url: '/heatmap/{datasource}',
                template: '<os-heatmap>',
                datasource: false,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('barcharts', {
                url: '/barchart/{datasource}',
                template: '<os-barchart>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            });

        $urlRouterProvider.otherwise('/');
    }

})();