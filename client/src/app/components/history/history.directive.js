(function(m,o){var k=function(d,k){var g=function(c,a){if(!k.versionCheck||!k.versionCheck("1.10.1"))throw"DataTables Responsive requires DataTables 1.10.1 or newer";c.responsive||(this.s={dt:new k.Api(c),columns:[]},a&&"string"===typeof a.details&&(a.details={type:a.details}),this.c=d.extend(!0,{},g.defaults,a),c.responsive=this,this._constructor())};g.prototype={_constructor:function(){var c=this,a=this.s.dt;d(m).on("resize.dtr",a.settings()[0].oApi._fnThrottle(function(){c._resize()}));a.on("destroy.dtr",
function(){d(m).off("resize.dtr")});this.c.breakpoints.sort(function(a,b){return a.width<b.width?1:a.width>b.width?-1:0});this._classLogic();this._resizeAuto();this._resize();var b=this.c.details;b.type&&(c._detailsInit(),this._detailsVis(),a.on("column-visibility.dtr",function(){c._detailsVis()}),d(a.table().node()).addClass("dtr-"+b.type))},_columnsVisiblity:function(c){var a=this.s.dt,b=this.s.columns,e,f,h=d.map(b,function(a){return a.auto&&null===a.minWidth?!1:!0===a.auto?"-":-1!==a.includeIn.indexOf(c)}),
n=0;e=0;for(f=h.length;e<f;e++)!0===h[e]&&(n+=b[e].minWidth);a=a.table().container().offsetWidth-n;e=0;for(f=h.length;e<f;e++)b[e].control?a-=b[e].minWidth:"-"===h[e]&&(h[e]=0>a-b[e].minWidth?!1:!0,a-=b[e].minWidth);a=!1;e=0;for(f=b.length;e<f;e++)if(!b[e].control&&!h[e]){a=!0;break}e=0;for(f=b.length;e<f;e++)b[e].control&&(h[e]=a);return h},_classLogic:function(){var c=this,a=this.c.breakpoints,b=this.s.dt.columns().eq(0).map(function(a){return{className:this.column(a).header().className,includeIn:[],
auto:!1,control:!1}}),e=function(a,e){var c=b[a].includeIn;-1===c.indexOf(e)&&c.push(e)},f=function(f,d,j,i){if(j)if("max-"===j){i=c._find(d).width;d=0;for(j=a.length;d<j;d++)a[d].width<=i&&e(f,a[d].name)}else if("min-"===j){i=c._find(d).width;d=0;for(j=a.length;d<j;d++)a[d].width>=i&&e(f,a[d].name)}else{if("not-"===j){d=0;for(j=a.length;d<j;d++)-1===a[d].name.indexOf(i)&&e(f,a[d].name)}}else b[f].includeIn.push(d)};b.each(function(b,e){for(var c=b.className.split(" "),i=!1,g=0,k=c.length;g<k;g++){var l=
d.trim(c[g]);if("all"===l){i=!0;b.includeIn=d.map(a,function(a){return a.name});return}if("none"===l){i=!0;return}if("control"===l){i=!0;b.control=!0;return}d.each(a,function(a,b){var d=b.name.split("-"),c=l.match(RegExp("(min\\-|max\\-|not\\-)?("+d[0]+")(\\-[_a-zA-Z0-9])?"));c&&(i=!0,c[2]===d[0]&&c[3]==="-"+d[1]?f(e,b.name,c[1],c[2]+c[3]):c[2]===d[0]&&!c[3]&&f(e,b.name,c[1],c[2]))})}i||(b.auto=!0)});this.s.columns=b},_detailsInit:function(){var c=this,a=this.s.dt,b=this.c.details;"inline"===b.type&&
(b.target="td:first-child");var e=b.target;d(a.table().body()).on("click","string"===typeof e?e:"td",function(){if(typeof e==="number"){var b=e<0?a.columns().eq().length+e:e;if(a.cell(this).index().column!==b)return}if(d(a.table().node()).hasClass("collapsed")){b=a.row(d(this).closest("tr"));if(b.child.isShown()){b.child(false);d(b.node()).removeClass("parent")}else{var h=c.c.details.renderer(a,b[0]);b.child(h,"child").show();d(b.node()).addClass("parent")}}})},_detailsVis:function(){var c=this,a=
this.s.dt;-1!==a.columns().visible().indexOf(!1)?(d(a.table().node()).addClass("collapsed"),a.rows().eq(0).each(function(b){b=a.row(b);if(b.child()){var e=c.c.details.renderer(a,b[0]);!1===e?b.child.hide():b.child(e,"child").show()}})):(d(a.table().node()).removeClass("collapsed"),a.rows().eq(0).each(function(b){a.row(b).child.hide()}))},_find:function(c){for(var a=this.c.breakpoints,b=0,e=a.length;b<e;b++)if(a[b].name===c)return a[b]},_resize:function(){for(var c=this.s.dt,a=d(m).width(),b=this.c.breakpoints,
e=b[0].name,f=b.length-1;0<=f;f--)if(a<=b[f].width){e=b[f].name;break}var h=this._columnsVisiblity(e);c.columns().eq(0).each(function(a,b){c.column(a).visible(h[b])})},_resizeAuto:function(){var c=this.s.dt,a=this.s.columns;if(this.c.auto&&-1!==d.inArray(!0,d.map(a,function(a){return a.auto}))){c.table().node();var b=c.table().node().cloneNode(!1),e=d(c.table().header()).clone(!1).appendTo(b);d(c.table().body().cloneNode(!0)).appendTo(b);var f=c.settings()[0].oApi._fnGetUniqueThs(c.settings()[0],
e),b=d("<div/>").css({width:1,height:1,overflow:"hidden"}).append(b).insertBefore(c.table().node());c.columns().eq(0).each(function(b){a[b].minWidth=c.column(b).visible()?f[c.column(b).index("visible")].offsetWidth:null});b.remove()}}};g.breakpoints=[{name:"desktop",width:Infinity},{name:"tablet-l",width:1024},{name:"tablet-p",width:768},{name:"mobile-l",width:480},{name:"mobile-p",width:320}];g.defaults={breakpoints:g.breakpoints,auto:!0,details:{renderer:function(c,a){var b=c.cells(a,":hidden").eq(0).map(function(a){var b=
d(c.column(a.column).header());return b.hasClass("control")?"":'<li><span class="dtr-title">'+b.text()+':</span> <span class="dtr-data">'+c.cell(a).data()+"</span></li>"}).toArray().join("");return b?d("<ul/>").append(b):!1},target:0,type:"inline"}};g.version="1.0.0";d.fn.dataTable.Responsive=g;d.fn.DataTable.Responsive=g;d(o).on("init.dt.dtr",function(c,a){if(d(a.nTable).hasClass("responsive")||d(a.nTable).hasClass("dt-responsive")||a.oInit.responsive){var b=a.oInit.responsive;!1!==b&&new g(a,d.isPlainObject(b)?
b:{})}});return g};"function"===typeof define&&define.amd?define(["jquery","datatables"],k):"object"===typeof exports?k(require("jquery"),require("datatables")):jQuery&&!jQuery.fn.dataTable.Responsive&&k(jQuery,jQuery.fn.dataTable)})(window,document);


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
        function HistoryController(osApi, osCohortService, $state, $timeout, $scope, moment, $stateParams, _, $, $q) {
            // Properties
            var vm = this;
            var table;

            var pc = osCohortService.getPatientCohort();
            var selectedIds = (pc==null) ? [] : pc.ids;


            var fields = ['patient_ID', 'gender', 'race', 'age_at_diagnosis', 'days_to_death', 'status_vital'];
            var columns = fields.map(function(column) {
                return {
                    data: column,
                    title: column.replace(/_/g, " "),
                    defaultContent: 'NA'
                };
            });

            var initViewState = function(vm) {
                vm.datasource = osApi.getDataSource();
                vm.diagnosisMin = vm.diagnosisMinValue = 1;
                vm.diagnosisMax = vm.diagnosisMaxValue = 100000;
                vm.survivalMin = vm.survivalMinValue = 0;
                vm.survivalMax = vm.survivalMaxValue = 10;
                vm.search = "";
                vm.detail = null;
            }

            var initDataTable = function(vm, columns, data) {

                // Override Filter Function
                angular.element.fn.DataTable.ext.search = [function(settings, data) {

                    if (selectedIds.length != 0) {
                        if (selectedIds.indexOf(data[0]) == -1) return false;
                    }

                    // var diagnosis = parseFloat(data[3]);
                    // var survival = parseFloat(data[4]);
                    // if (isNaN(survival) || isNaN(diagnosis)) return false;
                    // return (diagnosis >= vm.diagnosisMin &&
                    //     diagnosis < (vm.diagnosisMax + 1) &&
                    //     survival >= vm.survivalMin &&
                    //     survival < (vm.survivalMax + 1));
                    return true;
                }];

                // Specify Data
                table = angular.element('#history-datatable').dataTable({
                    paging: false,
                    columns: columns,
                    data: data,
                    "scrollY": "60vh",
                    "scrollCollapse": true,
                    buttons: ['copy', 'csv', 'excel', 'pdf', 'print']
                });
                table.api().draw();
            }

            var initEvents = function(vm, $scope) {

                /*
                $('#history-datatable tbody').on( 'click', 'tr', function () {
                    // $('.history-row-selected').removeClass('history-row-selected');
                    $(this).addClass('history-row-selected');
                    osApi.query(vm.datasource+"_pt", {'patient_ID':this.firstChild.textContent, $limit:1}).then(function(response){
                        vm.detail = response.data[0];
                    });
                } );
                $('#history-datatable tbody').on( 'mouseout', 'tr', function () {
                    $(this).removeClass('history-row-selected');
                    vm.detail = null;
                });
                */
                vm.exportCsv = function() {

                    var csv = table._('tr', {
                        "filter": "applied"
                    }).map(function(item) {
                        var row = "";
                        for (var i = 0; i < fields.length; i++) {
                            if (i > 0) row += ",";
                            row += item[fields[i]];
                        }
                        return row;
                    });
                    csv.unshift(fields.join(","));
                    csv = csv.join("\n");
                    var encodedUri = encodeURI("data:text/csv;charset=utf-8," + csv);
                    window.open(encodedUri);

                }

                vm.applyFilter = function(filter) {

                    // selectedIds = [];

                    // table.api().draw();

                    // var o = table._('tr', {
                    //     "filter": "applied"
                    // }).map(function(item) {
                    //     return item["patient_ID"].toString().toUpperCase()
                    // });

                    // o = $.map(o, function(value) {
                    //     return [value];
                    // });

                    //osHistory.addPatientSelection("Patient History", filter, o);
                };


                // osHistory.onPatientSelectionChange.add(function(selection) {
                //     selectedIds = selection.ids;
                //     table.api().draw();
                // });

            }

            // Load Datasets
            osApi.setBusy(true);




            initViewState(vm);
            osApi.query(vm.datasource.collections.pt, {
                    $fields: fields
                })
                .then(function(response) {
                    var maxMin = response.data.reduce(function(prev, curr) {

                        if (angular.isDefined(curr.age_at_diagnosis)) {
                            var ageAtDiagnosis = parseInt(curr.age_at_diagnosis);
                            prev.ageAtDiagnosis.min = Math.min(prev.ageAtDiagnosis.min, ageAtDiagnosis);
                            prev.ageAtDiagnosis.max = Math.max(prev.ageAtDiagnosis.max, ageAtDiagnosis);
                        }
                        if (angular.isDefined(curr.days_to_death)) {
                            var daysToDeath = parseInt(curr.days_to_death);
                            prev.daysToDeath.min = Math.min(prev.daysToDeath.min, daysToDeath);
                            prev.daysToDeath.max = Math.max(prev.daysToDeath.max, daysToDeath);
                        }
                        return prev;

                    }, {
                        ageAtDiagnosis: {
                            max: -Infinity,
                            min: Infinity
                        },
                        daysToDeath: {
                            max: -Infinity,
                            min: Infinity
                        }
                    })

                    vm.diagnosisMin = vm.diagnosisMinValue = maxMin.ageAtDiagnosis.min;
                    vm.diagnosisMax = vm.diagnosisMaxValue = maxMin.ageAtDiagnosis.max;
                    vm.survivalMin = vm.survivalMinValue = maxMin.daysToDeath.min;
                    vm.survivalMax = vm.survivalMaxValue = maxMin.daysToDeath.max;

                    initDataTable(vm, columns, response.data);
                    initEvents(vm, $scope)
                    osApi.setBusy(false);
                });
        }
    }
})();
