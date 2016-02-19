(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osGbm', gbm);

    /** @ngInject */
    function gbm() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/gbm/gbm.html',
            controller: GbmController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function GbmController(osApi, $state, $stateParams, $scope, $sce) {
            var markersNetwork;
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.search = "";
            vm.frame;

            // Elements
            var elChart = $("#chart");
            var csChart;

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function(response){
                osApi.getPathway().then(function(response){
                    markersNetwork = angular.fromJson(response.payload);
                    csChart = cytoscape({
                        container: elChart,
                        elements: markersNetwork.elements,
                        style: markersNetwork.style,
                        layout: {
                           name: "preset",
                           fit: true
                        }
                    }).on('select', 'edge', function(e){
                        $('#gbm-webpage').modal();
                        var url = "http://www.ncbi.nlm.nih.gov/pubmed/?term=" + e.cyTarget.data().pmid;
                        $scope.$apply(function(){
                            vm.frame = $sce.trustAsResourceUrl(url);
                        })
                        
                    });
                    osApi.setBusy(false);
                });
                
            });
        }
    }
})();
