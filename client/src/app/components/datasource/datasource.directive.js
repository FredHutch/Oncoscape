(function() {
    'use strict';
    
    angular
        .module('oncoscape')
        .directive('osDatasource', datasource);

    /** @ngInject */
    function datasource() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/datasource/datasource.html',
            controller: DatasourceController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function DatasourceController(osApi, $state) {
            var vm = this;
            vm.datasets = [];
            vm.explore = function(tool, datasource) {
                osApi.setDataSource(datasource);
                $state.go(tool, {
                    datasource: datasource
                });
            };

            var nameMap = {
                "DEMOdz" : "Glioblastoma (DEMO)",
                "TCGAbrain": "Brain (TCGA)",
                "TCGAbrca": "Breast (TCGA)",
                "TCGAcoadread": "Colorectal (TCGA)",
                "TCGAgbm": "Glioblastoma (TCGA)",
                "TCGAhnsc": "Head + Neck (TCGA)",
                "TCGAlgg" : "Lower Grade Glioma (TCGA)",
                "TCGAluad": "Lung Adenocarcinoma (TCGA)",
                "TCGAlung": "Lung (TCGA)",
                "TCGAlusc": "Lung Sasquamous Cell (TCGA)",
                "TCGApaad": "Pancreas (TCGA)",
                "TCGAprad": "Prostate (TCGA)",
                "UWbrain":  "Brain (UW)",
                "MSKbrain": "Brain (MSK)"
            };

            // Load Datasets
            vm.datasets = osApi.getUserApi().getUser().datasets.map(function(item){
                    return {name: this[item], id: item}
                }, nameMap);
        }
    }
})();
