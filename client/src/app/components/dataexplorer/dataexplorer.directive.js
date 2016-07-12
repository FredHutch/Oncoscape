(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osDataExplorer', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/dataexplorer/dataexplorer.html',
            controller: DataExplorerController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function DataExplorerController(osApi, $state, $timeout, $scope, $stateParams, _) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }
            // View Model
            var vm = this;
            vm.dataSources;
            vm.dataSource;
            vm.dataDiseases;
            vm.dataDisease;
            vm.dataTables;
            vm.dataTable;
            vm.dataFields;
            vm.dataField;
            
            var bar = {
                chart: {
                    type: 'discreteBarChart',
                    height: 450,
                    margin : {
                        top: 20,
                        right: 20,
                        bottom: 50,
                        left: 55
                    },
                    x: function(d){return d.label;},
                    y: function(d){return d.value;},
                    showValues: true,
                    valueFormat: function(d){
                        return d3.format(',.4f')(d);
                    },
                    duration: 500,
                    xAxis: {
                        axisLabel: 'X Axis'
                    },
                    yAxis: {
                        axisLabel: 'Y Axis',
                        axisLabelDistance: -10
                    }
                }
            };

            var pie = {
                chart: {
                    type: 'pieChart',
                    height: 450,
                    donut: false,
                    x: function(d){return d.label; },
                    y: function(d){return d.value; },
                    showLabels: false,
                    pie: {
                        startAngle: function(d) { return d.startAngle/2 -Math.PI/2 },
                        endAngle: function(d) { return d.endAngle/2 -Math.PI/2 }
                    },
                    duration: 500
                }
            };

            vm.chartOptions = bar;

            vm.toolTipContentFunction = function(){
                return function(key, x, y, e, graph) {
                        return  'Super New Tooltip' +
                        '<h1>' + key + '</h1>' +
                        '<p>' +  y + ' at ' + x + '</p>'
                }
            }

                

            vm.xFunction = function(){
                return function(d) {
                    return d.label;
                };
            }
            
            vm.yFunction = function(){
                return function(d) {
                    return d.value;
                };
            }
          
        

            // Load Datasets
            osApi.setBusy(true);
            osApi.query("_collections").then(function(result){

                vm.dataSources = result.data;
                vm.dataSource = vm.dataSources[0];
                
                $scope.$watch("vm.dataSource", function(){
                    vm.dataDiseases = vm.dataSource.diseases;
                    vm.dataDisease = vm.dataSource.diseases[0];

                });
                $scope.$watch("vm.dataDisease", function(){
                    vm.dataTables = vm.dataDisease.tables;
                    vm.dataTable = vm.dataTables[0];
                });
                $scope.$watch("vm.dataTable", function(){
                    osApi.query("_field_detail", {collection:vm.dataTable.collection}).then(function(result){
                         vm.dataFields = result.data[0].fields.filter(function(field){ return field.key!="_id"; });
                         vm.dataField = vm.dataFields[0];
                         console.dir(vm.dataField)
                    });
                });

               osApi.setBusy(false);
               
            });
            
        }
    }
})();

