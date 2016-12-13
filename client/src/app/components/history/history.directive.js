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


            // Loading ...
            osApi.setBusy(true);

            // View Model
            var vm = this;
            vm.setSize = function() {
                var elGrid = angular.element("#history-grid")[0];
                var osLayout = osApi.getLayout();
                elGrid.style["margin-left"] = (osLayout.left) + "px";
                elGrid.style["margin-right"] = (osLayout.right) + "px";
                elGrid.style.height = ($window.innerHeight - 200) + "px";
                vm.gridApi.core.handleWindowResize();
            };
            vm.collections = Object.keys(osApi.getDataSource().clinical)
                .map(function(key) {
                    var v = this.data[key];
                    return {
                        name: key,
                        collection: v
                    };
                }, {
                    data: osApi.getDataSource().clinical
                })
                .filter(function(o) {
                    return (o.name != "events" && o.name != "samplemap");
                });
            vm.collection = vm.collections[0];
            vm.options = {
                treeRowHeaderAlwaysVisible: false,
                enableGridMenu: true,
                enableSelectAll: true,
                onRegisterApi: function(gridApi) {
                    vm.gridApi = gridApi;
                    gridApi.selection.on.rowSelectionChanged($scope, rowSelectionChange);
                    gridApi.selection.on.rowSelectionChangedBatch($scope, rowSelectionChange);
                }
            };
            vm.exportCsv = function() {
                var cols = vm.options.columnDefs.filter(function(c) { return c.visible; }).map(function(v) { return v.field; });
                var data = "data:text/csv;charset=utf-8,\"" + cols.join("\",\"") + "\"\n";
                vm.options.data.forEach(function(v) {
                    var datum = cols.map(function(v) {
                        return this[v];
                    }, v);
                    data += "\"" + datum.join("\",\"") + "\"\n";
                });
                $window.open(encodeURI(data));
            };




            var rowSelectionChange = function(items, e) {
                if (angular.isUndefined(e)) return; // Programatic Selection
                osCohortService.setCohort(
                    vm.gridApi.grid.api.selection.getSelectedRows().map(function(v) { return v.patient_ID; }),
                    "Spreadsheet",
                    osCohortService.PATIENT
                );
            };


            // Initialize
            vm.datasource = osApi.getDataSource();


            // App Event :: Resize
            osApi.onResize.add(vm.setSize);
            var resize = function() { vm.setSize(true); };
            angular.element($window).bind('resize', resize);

            // App Event :: Cohort Change
            var onCohortChange = function(cohort) {
                vm.gridApi.grid.api.selection.clearSelectedRows();
                var selectedIds = cohort.patientIds;
                var selected = vm.options.data.filter(function(v) {
                    return selectedIds.indexOf(v.patient_ID) != -1;
                });
                selected.forEach(function(i) { vm.gridApi.grid.api.selection.selectRow(i); });
            };
            osCohortService.onCohortChange.add(onCohortChange)


            // Setup Watches
            $scope.$watch("vm.collection", function() {
                vm.setSize();
                osApi.setBusy(true);
                osApi.query(vm.collection.collection)
                    .then(function(response) {
                        angular.element(".ui-grid-icon-menu").text("Columns");
                        var cols = Object.keys(response.data[0])
                            .map(function(col) {
                                return { field: col, name: col.replace(/_/gi, ' '), width: 250, visible: true };
                            });
                        vm.options.columnDefs = cols;
                        vm.options.data = response.data.map(function(v) {
                            v.color = "#F0DDC0";
                            v.selected = false;
                            return v;
                        });
                        $timeout(function() {
                            onCohortChange(osCohortService.getCohort());
                        }, 1);
                        vm.setSize();
                        osApi.setBusy(false);
                    });
            });

            // Destroy
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(vm.setSize);
                osCohortService.onCohortChange.remove(onCohortChange);
                angular.element($window).unbind('resize', resize);
            });
        }
    }
})();