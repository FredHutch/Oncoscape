(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTools', tools);

    /** @ngInject */
    function tools() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/tools/tools.html',
            controller: ToolsController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ToolsController(osApi, $state, $stateParams) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.tools = [{
                name: 'Markers + Patients',
                route: 'markers',
                img: 'markers.png',
                copy: 'Link copy number variation and mutation data to patients.'
            }, {
                name: 'Timelines',
                route: 'timelines',
                img: 'timelines.png',
                copy: ''
            }, {
                name: 'Pathways',
                route: 'pathways',
                img: 'pathways.png',
                copy: 'Map patient specific expression levels on a hand curated network of genes.'
            }, {
                name: 'PLSR',
                route: 'plsr',
                img: 'plsr.png',
                copy: 'Use linear regression to correlate genes with clinical features using RNA expression.'
            }, {
                name: 'PCA',
                route: 'pca',
                img: 'pca.png',
                copy: 'Two dimensional view of per sample expression data.'
            }, {
                name: 'Survival',
                route: 'survival',
                img: 'survival.png',
                copy: 'Compare survival rates of selected patients against the remaining population in a Kaplan Meier plot.'
            }, {
                name: 'Patient Data',
                route: 'history',
                img: 'history.png',
                copy: ''
            }, {
                name: 'MetaData',
                route: 'metadata',
                img: 'metadata.png',
                copy: ''
            }];
            vm.explore = function(tool, datasource) {
                $state.go(tool, {
                    datasource: datasource
                });
            };
        }
    }

})();
