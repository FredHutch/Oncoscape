(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osSpreadsheet', spreadsheet);

    /** @ngInject */
    function spreadsheet() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/spreadsheet/spreadsheet.html',
            controller: SpreadsheetController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SpreadsheetController(osApi, $state, $timeout, $scope, moment, $stateParams, _, $, $q, $window, uiGridConstants, saveAs) {

            // Loading ...
            osApi.setBusy(true);

            var selectHandler;

            // View Model
            var vm = this;
            vm.showPanelColumns = false;
            vm.closePanelColumns = function() {
                vm.showPanelColumns = false;
                vm.gridApi.grid.refresh();
            };

            vm.setSize = function() {
                var elGrid = angular.element("#spreadsheet-grid")[0];
                var osLayout = osApi.getLayout();
                var ml = osLayout.left - 1;
                var mr = osLayout.right - 1;
                if (ml === -1) ml = 19;
                if (mr === -1) mr = 19;
                elGrid.style["margin-left"] = ml + "px";
                elGrid.style["margin-right"] = mr + "px";
                elGrid.style.width = ($window.innerWidth - ml - mr - 2) + "px";
                elGrid.style.height = ($window.innerHeight - 140) + "px";
                $timeout(function(){ vm.gridApi.grid.handleWindowResize()})
                // $interval( function() {
                //     vm.gridApi.core.handleWindowResize();
                //   }, 500, 10);
            };
            // vm.collections = osApi.getDataSource().collections
            //         .filter(function(d){return _.contains(["patient", "sample", "patientevent"], d.type)})
            //         .map(function(d){return d.name})

            // vm.collection = vm.collections[0]    
            osApi.query(osApi.getDataSource().dataset + "_phenotype", {})
            .then(function(response) {
                vm.phenotype = response.data
                
                vm.collections = vm.phenotype.reduce(function(p,c){
                    
                    p = _.uniq(p.concat(_.uniq(_.pluck(c.events, "type"))) )
                    return p
                }, ["patient"])
                vm.collection = vm.collections[0]    
                
            })


            vm.options = {
                treeRowHeaderAlwaysVisible: false,
                enableSelectionBatchEvent: false,
                enableGridMenu: false,
                enableSelectAll: true,
                enableColumnMenu: true,
                onRegisterApi: function(gridApi) {
                    vm.gridApi = gridApi;
                    selectHandler = gridApi.selection.on.rowSelectionChanged($scope, _.debounce(rowSelectionChange, 300));
                }
            };
            vm.exportCsv = function(type) {
                var cols = vm.options.columnDefs.filter(function(c) { return c.visible; }).map(function(v) { return v.field; });
                var data = "\"" + cols.join("\",\"") + "\"\n";

                var records = (type == "selected") ? vm.gridApi.grid.api.selection.getSelectedRows() : vm.options.data;

                records
                    .forEach(function(v) {
                        var datum = cols.map(function(v) {
                            return this[v];
                        }, v);
                        data += "\"" + datum.join("\",\"") + "\"\n";
                    });

                var blob = new Blob([data], { type: 'text/csv;charset=windows-1252;' });
                saveAs(blob, 'oncoscape.csv');

            };
            vm.showColumns = function() {
                vm.options.columnDefs.forEach(function(v) { v.visible = true; });
                vm.gridApi.grid.refresh();
            };
            vm.hideColumns = function() {
                vm.options.columnDefs.forEach(function(v) { v.visible = false; });
                vm.gridApi.grid.refresh();
            };

            var sortSelectedFn = function(a, b, rowA, rowB) {
                if (!rowA.hasOwnProperty("isSelected")) rowA.isSelected = false;
                if (!rowB.hasOwnProperty("isSelected")) rowB.isSelected = false;
                if (rowA.isSelected === rowB.isSelected) return 0;
                if (rowA.isSelected) return -1;
                return 1;
            };

            vm.sortSelected = function() {
                var col = vm.gridApi.grid.columns[0];
                col.sortingAlgorithm = sortSelectedFn;
                vm.gridApi.grid.sortColumn(col, "asc", false);
                vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.OPTIONS);
                vm.gridApi.core.notifyDataChange(uiGridConstants.dataChange.COLUMN);
            };

            var selectedIds = [];


            var supressEvents = false;

            var rowSelectionChange = function() {

                if (supressEvents) return;
                selectedIds = vm.gridApi.grid.api.selection.getSelectedRows().map(function(v) { return v.patient_ID; });


                osApi.onCohortChange.remove(onCohortChange);
                if (selectedIds.length == vm.options.data.length || selectedIds.length == 0) {
                    osApi.setCohort([], osApi.ALL, osApi.PATIENT);
                } else {
                    osApi.setCohort(_.unique(selectedIds), "Spreadsheet", osApi.PATIENT);
                }
                osApi.onCohortChange.add(onCohortChange);
            };

            // Initialize
            vm.datasource = osApi.getDataSource();

            // App Event :: Resize
            osApi.onResize.add(vm.setSize);

            // App Event :: Cohort Change
            var onCohortChange = function(cohort) {
                selectHandler();


                vm.gridApi.grid.api.selection.clearSelectedRows();
                selectedIds = cohort.patientIds;
                var selected = vm.options.data.filter(function(v) {
                    return selectedIds.indexOf(v.patient_ID) != -1;
                });
                selected.forEach(function(i) { vm.gridApi.grid.api.selection.selectRow(i); });
                selectHandler = vm.gridApi.selection.on.rowSelectionChanged($scope, _.debounce(rowSelectionChange, 300));


            };
            osApi.onCohortChange.add(onCohortChange);

            // Setup Watches
            $scope.$watch("vm.collection", function() {
                if(vm.phenotype == null) return
                osApi.setBusy(true);
                
                var dataTypes = ["enum", "num", "date", "boolean", "other"]
                var query = {type: "patient"}
                if(vm.collection == "sample") query= {type: "sample"}
                else if(vm.collection == "patient") query["$fields"] = ["id"].concat(dataTypes)
                else  query["$fields"] = ["id", "events"]
                
                        angular.element(".ui-grid-icon-menu").text("Columns");
                        var sheet = vm.phenotype
                        if(vm.collection =="patient" | vm.collection == "sample"){
                            sheet = sheet
                                .map(function(d){ 
                                    var row = {id: d.id}
                                    dataTypes.forEach(function(r){
                                        if(Object.keys(d[r]).length !=0) Object.assign(row, d[r])
                                    })
                                    return row
                                })
                                
                        }else{
                           sheet =  sheet.map(function(d){
                                if(typeof d.events == "undefined") return []
                                var events = d.events.filter(function(e){return e.type == vm.collection})
                                                      .map(function(e){ 
                                                          e.id=d.id; 
                                                          delete e.type; delete e.PatientId;
                                                        return e } )
                                return events
                            })
                            sheet = _.flatten(sheet)
                           
                        }

                        var cols = Object.keys(sheet[0]) //.filter(function(d){return d!= "_id"})
                            .map(function(col) {
                                return { field: col, name: col.replace(/_/gi, ' '), width: 250, visible: true };
                            });
                        vm.options.columnDefs = cols;
                        vm.options.data = sheet.map(function(v) {
                            v.color = "#F0DDC0";
                            v.selected = false;
                            return v;
                        });
                        $timeout(function() {
                            onCohortChange(osApi.getCohort());
                        }, 1);
                        vm.setSize();
                        osApi.setBusy(false);
                    
            });


            // Destroy
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(vm.setSize);
                osApi.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();