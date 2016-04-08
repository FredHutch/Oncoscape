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
                "TCGAprad": "Prostate (TCGA)"
            };


            // Load Datasets
            osApi.setBusy(true);
            osApi.getDataSetNames().then(function(response) {
                var datasets = response.payload.datasets;
                vm.datasets = datasets.map(function(item){
                    return {name: this[item], id: item}
                }, nameMap)
                osApi.setBusy(false);
            });
        }
    }
})();
