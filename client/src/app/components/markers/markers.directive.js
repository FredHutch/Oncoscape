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
        function MarkersController(osApi, $state, $timeout, $scope, $stateParams, cytoscape, signals, $window) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // Initialize View Model
            var vm = initalizeViewModel(this, $stateParams);

            // Load Data
            osApi.setBusy(true);
            loadData(osApi, vm, function(data){

                // Initalize Styles
                var styles = initializeStyles();

                // Initialize Chart
                var chart = initializeChart(data, styles, cytoscape, angular.element("#markers-chart"));

                // Initalize Layouts
                initializeLayouts(chart, vm, $scope);

                // Initalize Search

                

                // Initialize Edge Color Options

                // Initalize Node Color Options

                
                osApi.setBusy(false);
            });
        }

            
        function initalizeViewModel(vm, $stateParams){
            vm.datasource = $stateParams.datasource;
            vm.optInteractiveModes;
            vm.optInteractiveMode;
            vm.optPatientLayouts;
            vm.optPatientLayout;
            vm.optNodeColors;
            vm.optNodeColor;
            vm.optEdgeColors;
            vm.legandNodes;
            vm.legandPatient;
            vm.legandChromosomes;
            vm.frame;
            return vm;
        }

        function initializeChart(data, styles, cytoscape, el){
            // Initalize Cytoscape Chart
            // If performance becomes an issue set *Viewport attributes to true
            return cytoscape({
                container: el,
                elements: data,
                style: styles,
                hideEdgesOnViewport: false,
                hideLabelsOnViewport: false,
                textureOnViewport: false,
                motionBlur: true,
                minZoom: 0.1,
                maxZoom: 20,
                layout: {
                    name: "preset",
                    fit: true
                }
            });
        }

        function initializeStyles(){
            // Unlike CSS order of operations is determined by order
            // Play specific attention to use of data() + mapdata() values they are dynamic
            // Care should be taken not to update styles directly in code, but to use underlying data model
            // Cytoscape Dynamic Style Properties Include
            /*
                display
                color
                sizeEle
                sizeLbl
                posX
                posY
                hobo
                patient
            */
            return [
            {
                selector: 'node',
                style: {
                    'display': "data(display)",
                    'label': "data(id)",
                    'height': "mapData(sizeEle, 0, 50, 10, 100)",
                    'width': "mapData(sizeEle, 0, 50, 10, 100)",
                    'border-width': "5px",
                    'font-size': 'data(sizeLbl)',
                    'text-valign': 'center',
                    'min-zoomed-font-size': '8px',
                }
            }, {
                selector: 'node[nodeType="patient"]',
                style: {
                    'background-color': 'data(color)',
                    'text-halign': 'center'
                }
            }, {
                selector: 'node[nodeType="patient"]:selected',
                style: {
                    'border-color': "#FF0000"
                }
            }, {
                selector: 'node[nodeType="gene"]',
                style: {
                    'background-color': "#FFFFFF",
                    'border-color': "data(color)",
                    'text-halign': 'right'
                }
            }, {
                selector: 'node[nodeType="gene"]:selected',
                style: {
                    'border-color': "#FF0000",
                }
            },{
                selector: 'node[nodeType="centromere"]',
                style:{
                    'font-size': '24px',
                    'text-halign': 'center',
                    'background-color': '#FFFFFF',
                    'border-color': 'rgb(19, 150, 222)',
                    'height': '40px',
                    'width': '120px',
                    'shape': 'roundrectangle'
                }
            },{
                selector: 'edge',
                style:{
                    'display': "data(display)",
                    'line-color': "data(color)",
                    'line-width': "data(sizeEle)"
                }
            }];
        }

        function initializeLayouts(chart, vm, $scope){
            
            vm.optPatientLayouts = [{name: 'Hobo'},{name: 'Age At Diagnosis'},{name: 'Gender'}];
            vm.optPatientLayout = vm.optPatientLayouts[0];
            $scope.$watch('vm.optPatientLayout', function(layout){
                var data = {};
                var nodes = chart.nodes('node[nodeType="patient"]');
                
                chart.startBatch();
                switch (layout.name){
                    case "Hobo":
                        nodes.forEach(function(node){ 
                            node.position(node.data("hobo")); 
                        });
                        break;
                    case "Age At Diagnosis":
                        nodes.forEach(function(node){
                            try{
                                var age = Number(node.data("patient")[0][4]);
                                age = age.map(0, 100, -3000, 3000);
                                node.position({
                                    y: age, 
                                    x: (Math.pow(age, 2) / 5000) - 200
                                });
                            }catch(e){
                                node.position({x:100,y:0});
                            }
                        });
                        break;
                    case "Gender":
                        nodes.forEach(function(node){
                    // try{
                    //     var gender = node.data("patient")[0][2].toLowerCase();
                    //     node.position()

                    // }
                        });
                        // nodes.forEach(function(node){
                        //     if (node.data("patient")[0][2])
                        // });

                        // item.data().patient[2].toLowerCase() == 'male'
                        break;
                }
                chart.endBatch();
            });
                

        }

        function loadData(osApi, vm, cb){
            // Today multiple nested data calls are nessisary to obtain all the data to render the chart
            // Future server refactor should be done to limit number of calls and preformat data
            osApi.setDataset(vm.datasource).then(function() {

                // Patient Data
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    var dataPatients = response.payload.tbl;

                    // Marker Data
                    osApi.getMarkersNetwork(response.payload).then(function(response) {
                        var dataMarkers = angular.fromJson(response.payload).elements;

                        // Process Patient Nodes (Save Hobo Positions + Patient History Info + Color + SizeEle + SizeLbl)
                        dataMarkers.nodes
                            .filter(function(item) { return item.data.nodeType === 'patient'; })
                            .map(function(value) {
                                var data = value.data;
                                data.display = "element";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = data.degree;
                                data.sizeLbl = 12;
                                data.hobo = {x: value.position.x, y: value.position.y};
                                data.patient = this.filter(function(item){ return item[0]===value.data.id });
                            }, dataPatients);

                        // Process Non Patient Nodes
                        dataMarkers.nodes
                            .filter(function(item) {  return  item.data.nodeType != 'patient'; })
                            .map(function(value){
                                var data = value.data;
                                data.display = "element";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = data.degree;
                                data.sizeLbl = 12;
                                value.locked = true;
                                value.selectable = true;
                                value.grabbable = false;
                                return value;
                            });

                        // Process Edges
                        dataMarkers.edges
                            .map(function(value){
                                var data = value.data;
                                data.display = "element";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = 1;
                                data.sizeLbl = 12;
                                value.locked = true;
                                value.selectable = false;
                                value.grabbable = false;
                                return value;
                            });

                        // Call Back
                        cb(dataMarkers);
                    });
                });
            });
            
        }
    }
})();
