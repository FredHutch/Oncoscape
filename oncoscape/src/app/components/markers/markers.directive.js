(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osMarkers', markers);

    /** @ngInject */
    function markers() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/markers/markers.html',
            scope: {},
            controller: MarkersController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function MarkersController(osApi, $state, $timeout, $scope, $stateParams, cytoscape) {

            var markersNetwork;
            var categorizationNames;

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.operations = ["Show All Edges","Show Edges from Selected Nodes","Hide All Edges","Invert Node Selection","Clear Selections","Select All Connected Nodes","Select All Nodes with Selected Edges","Hide Unselected Nodes","Show All Nodes","Restrict Next Ops to Selected Nodes"];

            // Elements
            var elChart = $("#chart");
            var csChart;

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function(response){
                osApi.getMarkersNetwork(response.payload).then(function(response){
                    markersNetwork = angular.fromJson(response.payload);
                    osApi.getSampleCategorizationNames().then(function(response){
                        categorizationNames = response.payload;
                        init();
                        osApi.setBusy(false);
                    });
                });
            });

            var init = function(){
                
                csChart = cytoscape({
                    container: elChart,
                    elements: markersNetwork.elements,
                    style: markersNetwork.style,
                    layout: {
                       name: "preset",
                       fit: true
                    }
                });

            }
        }
    }
})();
