(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osToolMenu', toolmenu);

    /** @ngInject */
    function toolmenu() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/toolmenu/toolmenu.html',
            controller: ToolMenuController,
            controllerAs: 'vm',
            scope:{
                datasource: '@',
                change: '&'
            },
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ToolMenuController(osApi, $state) {

      
            var mouseOver = function(){
                angular.element(".tool-menu")
                    .removeClass("tray-collapsed-left");
            }

            var mouseOut = function(){
                angular.element(".tool-menu")
                    .addClass("tray-collapsed-left");
            }

            var elTray = angular.element(".tool-menu");
                elTray
                    .bind("mouseover", mouseOver)
                    .bind("mouseout", mouseOut);
            
            var vm = this;
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
                name: 'Oncoprint',
                route: 'oncoprint',
                img: 'history.png',
                copy: ''
            }, {
                name: 'Geneset Test',
                route: 'genesettest',
                img: 'history.png',
                copy: ''
            }, {
                name: 'MetaData',
                route: 'metadata',
                img: 'metadata.png',
                copy: ''
            }];
            vm.explore = function(tool) {
                vm.change();
                $state.go(tool, {
                    datasource: vm.datasource
                });
            };
        }
    }

})();
