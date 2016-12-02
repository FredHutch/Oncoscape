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


            // Properties
            var vm = this;
            vm.showPanelColor = false;
            vm.patientsSelected = [];
            vm.options = {
                rowHeight: 50,
                headerHeight: 50,
                footerHeight: false,
                scrollbarV: true,
                selectable: true,
                multiSelect: true,
                columns: []
            };

            vm.clear = function(){
                vm.patientsSelected = [];
                osCohortService.setPatientCohort([]);
            };

            vm.onPatientsSelected = function(){
                osCohortService.setPatientCohort(vm.patientsSelected.map(function(v){ return v.patient_ID; }), "Spreadsheet");
            };

            
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
                vm.collection = vm.collections[2];
            })(vm);

            var setData = function() {
                vm.setSize();
                osApi.setBusy(true);
                osApi.query(vm.collection.collection)
                    .then(function(response) {
                        vm.data = response.data.map(function(v){
                            v.selected = false;
                            return v;
                        });
                        vm.columns = Object.keys(vm.data[0])
                            .filter(function(col){ return (col!='selected') })
                            .map(function(col){
                                return {prop:col, name:col.replace(/_/gi,' '), width: 250, show:true}
                            });
                        var col = {
                            frozenLeft: true,
                            width: 10,
                            prop: 'color',
                            name: '',
                            sortable:false,
                            cellRenderer: function(scope, elm) {
                                elm.parent().css("background-color",scope.$cell);
                            },
                            headerRenderer: function(elm){
                                elm.parent().css("background-color","#000");
                            }

                        };
                        
                        vm.columns.push(col);
                        vm.options.columns = vm.columns;
                        vm.setSize();
                        osApi.setBusy(false);


                    });
            };
            
            var updateColumns = _.debounce(function(){
                vm.options.columns = vm.columns.filter(function(v){ return v.show; });
                console.log("!!");
            },500);
            vm.setColumns = function(){
                updateColumns();   
            }

            
          

            vm.setSize = function() {
                var osLayout = osApi.getLayout();
                var elGrid = angular.element("#history-grid")[0];
                elGrid.style["margin-left"] = (osLayout.left-30) + "px";
                elGrid.style.width = ($window.innerWidth - osLayout.left - osLayout.right - 80) + "px";
                vm.tableHeight = $window.innerHeight - 170;//) + "px";
            }

            $scope.$watch("vm.collection", setData);
            
           

            // resize
            osApi.onResize.add(vm.setSize);
            var resize = function() {
                    vm.setSize(true);
            };
            angular.element($window).bind('resize', resize);


            // vm.onSelect = function(x){
            //     var ids = x.map(function(v){ return v.patient_ID });
            //     console.log(ids);
            //     osCohortService.setPatientCohort(ids, "Spread Sheet");

            // }
            var onPatientSelect = function(patients){
                //selectedIds = patients.ids;
                //filterData();
                console.log(patients);
                
            };
            osCohortService.onPatientsSelect.add(onPatientSelect);

            vm.exportCsv = function(){
                var cols = vm.columns.filter(function(c){ return c.show; }).map(function(v){ return v.prop; })
                var data = "data:text/csv;charset=utf-8,\""+cols.join("\",\"")+"\"\n";
                vm.data.forEach(function(v){ console.log(v);
                    var datum = cols.map(function(v){
                        return this[v];
                    },v);
                    data +=  "\""+datum.join("\",\"")+"\"\n";
                });
                window.open(encodeURI(data));
            }

            var onPatientColorChange = function(colors){
                vm.legendCaption = colors.name;
                vm.legendNodes = colors.data;
                var degMap = colors.data.reduce(function(p, c) {
                    for (var i = 0; i < c.values.length; i++) {
                        p[c.values[i]] = c.color;
                    }
                    return p;
                }, {});

                vm.data.forEach(function(data){
                    data.color = angular.isDefined(this[data.patient_ID]) ? this[data.patient_ID] : '#FFFFFF';
                }, degMap);
            };
            osCohortService.onPatientColorChange.add(onPatientColorChange)

            // Load Datasets
            osApi.setBusy(true);

         
            // Destroy
            $scope.$on('$destroy', function() {
                //osCohortService.onPatientsSelect.remove(onPatientsSelect);
                osCohortService.onPatientColorChange.remove(onPatientColorChange)
            });
        }
    }
})();
