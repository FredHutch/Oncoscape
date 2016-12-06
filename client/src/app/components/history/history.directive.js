(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHistory', history);

    /** @ngInject */
    function history() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/history/history.html',
            controller: HistoryController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HistoryController(osApi, osCohortService, $state, $timeout, $scope, moment, $stateParams, _, $, $q, $window) {


            var rowSelectionChange = function(e){
                osCohortService.setCohort(
                    vm.gridApi.grid.api.selection.getSelectedRows().map(function(v) { return v.patient_ID; }),
                    "Spreadsheet",
                    osCohortService.PATIENT
                );
            }

            // Properties
            var vm = this;
            vm.showPanelColor = false;
            vm.options = {
                treeRowHeaderAlwaysVisible: false,
                enableGridMenu: true,
                enableSelectAll: true,
                //enableFullRowSelection: true,
                //enableFiltering: true,
                onRegisterApi: function(gridApi){
                    vm.gridApi = gridApi;
                    gridApi.selection.on.rowSelectionChanged($scope, rowSelectionChange);
                    gridApi.selection.on.rowSelectionChangedBatch($scope, rowSelectionChange);
                }
            };


        
            var onCohortChange = function(cohort){
                var selectedIds = cohort.patientIds;
                var selected = vm.options.data.filter(function(v){
                    return selectedIds.indexOf(v.patient_ID) != -1;
                })
                selected.forEach(function(i){ vm.gridApi.grid.api.selection.selectRow(i); });
            };
            osCohortService.onCohortChange.add(onCohortChange);
            
        
            // Intialize View State
            (function(vm) {
                vm.datasource = osApi.getDataSource();
                vm.cohortMode = 'Filter';
                vm.search = "";
                vm.collections = Object.keys(vm.datasource.clinical)
                    .map(function(key) {
                        var v = this.data[key];
                        return {
                            name: key,
                            collection: v
                        };
                    }, {
                        data: vm.datasource.clinical
                    })
                    .filter(function(o) {
                        return (o.name != "events" && o.name != "samplemap");
                    });
                vm.collection = vm.collections[0];
                
            })(vm);

            var setData = function() {
                vm.setSize();
                osApi.setBusy(true);
                osApi.query(vm.collection.collection)
                    .then(function(response) {

                        $(".ui-grid-icon-menu").text("Columns");
                        var cols = Object.keys(response.data[0])
                            .map(function(col){
                                return {field:col, name:col.replace(/_/gi,' '), width: 250, visible:true}
                            });
                       
                        vm.options.columnDefs = cols;
                        vm.options.data = response.data.map(function(v){
                                v.color = "#F0DDC0";
                                v.selected = false;
                                return v;
                            });
                     
                        vm.setSize();
                        osApi.setBusy(false);


                    });
            };

            vm.setSize = function() {
                var osLayout = osApi.getLayout();
                var elGrid = angular.element("#history-grid")[0];
                elGrid.style["margin-left"] = (osLayout.left-30) + "px";
                elGrid.style.width = ($window.innerWidth - osLayout.left - osLayout.right - 80) + "px";
                elGrid.style.height = ($window.innerHeight - 170) + "px";
            }

            $scope.$watch("vm.collection", setData);
            
            // resize
            osApi.onResize.add(vm.setSize);
            var resize = function() { vm.setSize(true); };
            angular.element($window).bind('resize', resize);

            vm.exportCsv = function(){
                var cols = vm.options.columnDefs.filter(function(c){ return c.visible; }).map(function(v){ return v.field; })
                var data = "data:text/csv;charset=utf-8,\""+cols.join("\",\"")+"\"\n";
                vm.options.data.forEach(function(v){ console.log(v);
                    var datum = cols.map(function(v){
                        return this[v];
                    },v);
                    data +=  "\""+datum.join("\",\"")+"\"\n";
                });
                window.open(encodeURI(data));
            }

            // Load Datasets
            osApi.setBusy(true);

            // Destroy
            $scope.$on('$destroy', function() {
                osCohortService.onCohortChange.remove(onCohortChange);
                angular.element($window).unbind('resize', resize);
                
            });
        }
    }
})();
