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
        function HistoryController(osApi, osCohortService, $state, $timeout, $scope, moment, $stateParams, _, $, $q, $window, Handsontable) {

            var queryMethod = function (queryStr, value) {
                if (queryStr=="") return false;
                if (value==null) return false;
                return (value.toString().toUpperCase().indexOf(queryStr)!=-1);
            };

            // Properties
            var vm = this;
            var elGrid, htGrid;
            var data, filteredData, settings = {
                manualColumnResize: true,
                manualColumnMove: true,
                fixedRowsTop: 0,
                readonly: true,
                contextMenu: true,
                columnSorting: true,
                sortIndicator: true,
                comments: true,
                allowEmpty: true,
                autoColumnSize: {
                    samplingRatio: 23
                },
                search: {
                    queryMethod: queryMethod
                },
                mergeCells: true


            };




            elGrid = angular.element("#history-grid");

            // Retrieve Selected Patient Ids From OS Service
            var pc = osCohortService.getPatientCohort();
            if (pc == null) osCohortService.setPatientCohort([], "All Patients");
            var selectedIds = (pc == null) ? [] : pc.ids;

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
                        return o.name != "events";
                    });
                vm.collection = vm.collections[0];

            })(vm);

            vm.exportCsv = function() {

                var header = htGrid.getColHeader();
                var data = htGrid.getData();
                var tmpColDelim = String.fromCharCode(11),
                    tmpRowDelim = String.fromCharCode(0),
                    colDelim = '","',
                    rowDelim = '"\r\n"',
                    csv = '"' + data.map(function(rval, index) {
                        return rval.map(function(cval, jndex) {
                            // escape double quotes
                            var out = "";
                            if (!!cval) {
                                out = cval.toString();
                            }
                            return out;
                        }).join(tmpColDelim);
                    }).join(tmpRowDelim)
                    .split(tmpRowDelim).join(rowDelim)
                    .split(tmpColDelim).join(colDelim) + '"';
                var encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
                $window.open(encodedUri);
            }

            var filterData = function(){
                
                filteredData = (selectedIds.length==0) ? data : data
                    .filter(function(v){

                        return (this.indexOf(v.patient_ID)!=-1)
                    }, selectedIds);
                
                htGrid.loadData(filteredData);
                htGrid.render();
                
            }


            var setData = function() {
                osApi.setBusy(true);
                osApi.query(vm.collection.collection)
                    .then(function(response) {
                        data = response.data.map(function(v){
                            //v.color = "#0b97d3";
                            return v;
                        });

                        vm.columns = Object.keys(data[0]).map(function(v) {
                            return {
                                field: v,
                                displayName: v.replace(/_/g, " ").toUpperCase(),
                                show: true
                            };
                        });
                       
                        if (htGrid == null) {
                            settings.startCols = vm.columns.length;
                            htGrid = new Handsontable(elGrid[0], settings);
                        }

                        vm.setSize(false);
                        vm.setColumns(false);
                        filterData();
                        osApi.setBusy(false);

                    });
            };
            
            vm.setColumns = function(render) {
                var cols = vm.columns.filter(function(v) {
                    return v.show;
                });

                settings.colHeaders = cols.map(function(v) {
                    return v.displayName;
                });
                settings.columns = cols.map(function(v) {
                    return { data: v.field };
                });

                htGrid.updateSettings(settings);
                htGrid.render();
                if (render) htGrid.render();
            };

            vm.setSize = function(render) {
                var osLayout = osApi.getLayout();
                elGrid.css("margin-left", (osLayout.left-30) + "px");
                elGrid.css("width", ($window.innerWidth - osLayout.left - osLayout.right - 80) + "px");
                elGrid.css("height", ($window.innerHeight - 170) + "px");
                htGrid.render();
            }

            $scope.$watch("vm.collection", setData);
            $scope.$watch("vm.search", function(v){
                if (!angular.isDefined(htGrid)) return;
                var result = htGrid.search.query(v.toUpperCase().trim());
                htGrid.render();
            });


            // resize
            osApi.onResize.add(vm.setSize);
            var resize = function() {
                    vm.setSize(true);
                } // Should Debounce.
            angular.element($window).bind('resize', resize);

            // var initDataTable = function(vm, columns, data) {

            //     // Override Filter Function
            //     angular.element.fn.DataTable.ext.search = [function(settings, data) {                    
            //         if (selectedIds.length != 0) { if (selectedIds.indexOf(data[0]) == -1) return false; }
            //         return true;
            //     }];

            //     // Specify Data
            //     table = angular.element('#history-datatable').dataTable({
            //         paging: false,
            //         columns: columns,
            //         data: data,
            //         "scrollY": "60vh",
            //         "scrollCollapse": true
            //     });
            //     table.api().draw();
            // }

            // var lo = function(){
            //     var layout = osApi.getLayout();
            //         angular.element(".history-content").css("margin-left", layout.left).css("margin-right", layout.right);
            //         table.api().draw();
            // };
            // osApi.onResize.add(lo);
            // angular.element($window).bind('resize',
            //         _.debounce(lo, 300)
            //     );

            // var initEvents = function(vm) {

            //     // Export CSV Button

            //     // Apply Fitler
            //     vm.applyFilter = function(filter) {

            //         selectedIds = [];

            //         table.api().draw();

            //         var o = table._('tr', {
            //             "filter": "applied"
            //         }).map(function(item) {
            //             return item["patient_ID"].toString().toUpperCase()
            //         });
            //         o = $.map(o, function(value) {
            //             return [value];
            //         });
            //         osCohortService.setPatientCohort(o, "Patient History");
            //     };

            
            //     lo();

            // }



            osCohortService.onPatientsSelect.add(function(patients){
                selectedIds = patients.ids;
                filterData()

            });

            // Load Datasets
            osApi.setBusy(true);

            // osApi.query(vm.datasource.clinical.patient, {
            //         $fields: fields
            //     })
            //     .then(function(response) {
            //         data = response.data;
            //         initDataTable(vm, columns, response.data);
            //         initEvents(vm, $scope, osApi)
            //         osApi.setBusy(false);
            //         $timeout(lo, 200);

            //     });

            // var onPatientColorChange = function(colors){
            //     vm.showPanelColor = false;
            //     vm.legendCaption = colors.name;
            //     vm.legendNodes = colors.data;

            //     if(colors.name=="None"){
            //         vm.legendCaption = "";
            //         table.api().rows().every( function ( rowIdx, tableLoop, rowLoop ) {
            //             angular.element(this.node()).children().first().attr("style","border-left-color:inherit;border-left-width:inherit;");
            //         });
            //         return;
            //     }

            //     var degMap =colors.data.reduce(function(p,c){
            //         for (var i=0; i<c.values.length; i++){
            //             p[c.values[i]] = c.color;
            //         }
            //         return p;
            //     },{});

            //     table.api().rows().every( function ( rowIdx, tableLoop, rowLoop ) {

            //         var pid = this.data().patient_ID;
            //         var color = degMap.hasOwnProperty(pid) ? degMap[pid] : "#EEE";
            //         angular.element(this.node()).children().first().attr("style","border-left-color:"+color+";border-left-width:10px;");

            //     } );

            //     lo();

            // }

            // osCohortService.onPatientColorChange.add(onPatientColorChange);

            // Destroy
            $scope.$on('$destroy', function() {
                //osCohortService.onPatientColorhange.remove(onPatientColorChange);
            });
        }
    }
})();
