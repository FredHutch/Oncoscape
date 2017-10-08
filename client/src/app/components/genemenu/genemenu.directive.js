(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osGeneMenu', geneMenu);

    /** @ngInject */
    function geneMenu() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/genemenu/genemenu.html',
            controller: GeneMenuController,
            controllerAs: 'vm',
            scope: {},
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function GeneMenuController(osApi, $state, $scope, $sce, $timeout, $rootScope, $filter, d3) {


            // View Model
            var vm = this;
            vm.genesets = osApi.getGenesets();
            vm.geneset = osApi.getGeneset();
            vm.importGeneIds = "";
            vm.importGenesetName = ""
            vm.showGeneImport = false;
            
            vm.genesetSummary = "";

            // Import to Active List
            vm.import = function(){
                osApi.showGenesetImport(true)
            }
            vm.importGeneset = function() {
                var ids = vm.importGeneIds.split(",").map(function(v) { return v.trim(); });
                osApi.importGeneIds(ids, vm.importGenesetName);
                vm.importGeneIds = "";
                vm.importGenesetName = "";
                vm.showGeneImport = false;
            };
            // vm.hideModal = function(){
            //     angular.element('#modal_geneImport').modal(false);
            // }

            //Update Geneset Availability
            vm.setGeneset = function(geneset) {
                if (angular.isString(geneset)) {
                    osApi.setGeneset([], osApi.ALLGENES, osApi.SYMBOL);
                } else {
                    osApi.setGeneset(geneset);
                }
            };
            vm.saveGeneset = function() {
                osApi.saveGeneset();
            };
            vm.updateGeneset = function() {
                if (vm.geneset.type == "UNSAVED") {
                    osApi.saveGeneset(vm.geneset);
                } else {
                    osApi.deleteGeneset(vm.geneset);
                }
            };
            vm.setGenesetList = function(geneset) {
                geneset.show=true
                osApi.setGeneset(geneset);
            };

            // Gene Service Integration
            osApi.onGenesetsChange.add(function(genesets) {
                vm.genesets = genesets;
            });
            osApi.onGenesetChange.add(function(geneset) {

                var website = ""; var genecounts = "";
                if(geneset.url.length >0) website = "  <a href='"+geneset.url+"' target='_blank'> [ref]</a>"
                if(geneset.geneIds !=0){
                    genecounts = "<br/><br/>Contains:<br/>" + 
                    $filter('number')(geneset.geneIds.length) + " Markers<br /> " +
                    $filter('number')(geneset.hugoIds.length) + " Hugo Symbols (###TODO) <br />";    
                } 
                var summary =   geneset.desc +website + genecounts;
                //$filter('number')(toolInfo.numGenes) + " Genes In Current Tool Showing<br />" +
                //$filter('number')(toolInfo.numSymbols) + " Hugo Symbols In Current Tool Showing<br />";

                vm.genesetSummary = $sce.trustAsHtml(summary);

                if (angular.isUndefined(geneset)) return;
                $timeout(function() {
                    vm.geneset = geneset;
                });
             
            });

        }
    }

})();