(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osImportPanel', importPanel);

    /** @ngInject */
    function importPanel() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/importpanel/importpanel.html',
            controller: ImportPanelController,
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                close: "&"
            }
        };

        return directive;

        /** @ngInject */
        function ImportPanelController(osApi) {

            // Properties
            var vm = this;
            vm.genesets = osApi.getGenesets();
            vm.showGeneImport = true;
           
            // Import Geneset Command 
            vm.importGeneIds = "";
            vm.importGeneset = function() {
                var ids = vm.importGeneIds.split(",").map(function(v) { return v.trim(); });
                osApi.importGeneIds(ids, vm.importGenesetName);
                vm.importGeneIds = "";
                vm.importGenesetName = "";
                vm.showGeneImport = false;
            };

            vm.setGenesetList = function(geneset) {
                geneset.show=true
                osApi.setGeneset(geneset);
            };
            vm.addGenesetList = function() {
                osApi.saveGeneset();
            };
           
        $('#floatingpanel').draggable()

        }
    }
})();