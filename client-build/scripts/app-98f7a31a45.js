(function() {
    'use strict';

    angular
        .module('oncoscape', [
            'ngAnimate',
            'ngCookies',
            'ngTouch',
            'ngSanitize',
            'ngMessages',
            'ngAria',
            'ngResource',
            'ui.router',
            'ui.bootstrap',
            'ui.grid',
            'ui.grid.selection',
            'ui.grid.cellNav',
            'ui.grid.resizeColumns',
            'ui.grid.moveColumns',
            'ui.grid.pinning',
            'ui.grid.grouping',
            'ui.grid.autoResize',
            'ui-rangeSlider',
            'toastr'
        ]);

})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osUserdatasource', userdatasource);

    /** @ngInject */
    function userdatasource() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/userdatasource/userdatasource.html',
            controller: UserdatasourceController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function UserdatasourceController(osApi, $state, osAuth, _) {
            var vm = this;
            vm.user = osAuth.getUser()
            vm.projects = osAuth.getDatasets()
            vm.apis = [
                {   name: "file", 
                    img:"imgThumb.png"
                },
                {   name: "TCGA", 
                    img:"tcga.png"
                }
            ]

            vm.login = function(){
                var networks = osAuth.getAuthSources();

                //login with google
                osAuth.login(networks[1]);
            }
            vm.explore = function(tool, datasource) {
                $state.go(tool, { datasource: datasource.disease });
            };
            
            vm.showDatasourceOption = function(source){
                if(source == "TCGA")
                    $state.go("datasource");
                if(source == "file"){
                   // $state.go("upload");
                    var win = window.open("/upload/");
                    win.focus();
                }
            }
           

            var loadUserData = function(user) {

                if(angular.isUndefined(user)) return;

                vm.user = user
             
                osApi.query("Accounts_Users", {
                    Gmail: user.email
                }).then(function(response) {
                    var acct = response.data[0]
                    
                    if(angular.isUndefined(acct) ) return
                    
                    osApi.query("Accounts_Permissions", {
                        User: acct._id
                    }).then(function(resp) {
                        var permissions = resp.data
                        osApi.query("Accounts_Projects", {
                            _id: {$in: _.pluck(permissions,"Project")}
                        }).then(function(r) {
                            vm.projects = r.data
                            osAuth.setDatasets(vm.projects)
                        })
                    })
                })
                  
             
             vm.datasets = osApi.getDataSources();
             
             
            };
    
            osAuth.onLogin.add(loadUserData); 

            osApi.setBusy(false);
            
           
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTrayPiechart', trayPiechart);

    /** @ngInject */
    function trayPiechart(d3) {

        var directive = {
            restrict: 'E',
            scope: {
                data1: '=chartData1',
                data2: '=chartData2',
                height: '=chartHeight'
            },
            link: TrayChartLink,
            replace: false
        };

        return directive;

        /** @ngInject */
        function TrayChartLink(scope, element) {
            var chart = d3.select(element[0]).append("svg").attr("class", "tray-chart").style("height", scope.height + "px");
            var chart1 = chart.append("g").classed("chartLayer", true);
            var chart2 = chart.append("g").classed("chartLayer", true);

            // var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
            //     return d.tip;
            // });
            // chart.call(elTip);
            scope.$watch('data1', function(data) { draw(chart1, data, 0); });
            scope.$watch('data2', function(data) { draw(chart2, data, scope.height - 10); });


            var draw = function(el, data, offset) {

                var arcs = d3.pie()
                    .sort(null)
                    .value(function(d) {
                        return d.value;
                    })
                    (data);

                var arc = d3.arc()
                    .outerRadius((scope.height / 3) + 3)
                    .innerRadius((scope.height / 3) - 13)
                    .padAngle(0.03)
                    .cornerRadius(0);


                el.attr("transform", "translate(" + [(scope.height / 2) + offset, scope.height / 2] + ")");
                var colors = ["#039BE5", "#EAEAEA"];
                var block = el.selectAll(".arc")
                    .data(arcs)
                    .attr("d", arc)
                    .attr("id", function(d, i) { return "arc-" + i })
                    .attr("fill", function(d, i) { return colors[i]; });

                var newBlock = block.enter().append("g").classed("arc", true);

                newBlock.append("path")
                    .attr("d", arc)
                    .attr("id", function(d, i) { return "arc-" + i })
                    //.attr("stroke", "gray")
                    .attr("fill", function(d, i) { return colors[i]; });



            }

        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTray', tray);

    /** @ngInject */
    function tray() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/tray/tray.html',
            scope: {
                caption: '@',
                content: '@',
                change: '&'
            },
            controller: TrayController,
            controllerAs: 'vm',
            bindToController: true,
            replace: true,
            transclude: true
        };

        return directive;

        /** @ngInject */
        function TrayController(osApi, $timeout) {

            var vm = this;
            vm.trayClass = Math.random().toString(36).substring(3);
            vm.iconClass = Math.random().toString(36).substring(3);

            var isLocked = true;
            vm.toggle = function() {
                var elTray = angular.element("." + vm.trayClass);
                var elIcon = angular.element("." + vm.iconClass);

                isLocked = !isLocked;
                elIcon
                    .addClass(isLocked ? 'fa-lock' : 'fa-unlock-alt')
                    .removeClass(isLocked ? 'fa-unlock-alt' : 'fa-lock')
                    .attr("locked", isLocked ? "true" : "false");

                elTray.attr("locked", isLocked ? "true" : "false");

                if (isLocked) {
                    elTray
                        .unbind("mouseover", mouseOver)
                        .unbind("mouseout", mouseOut)
                        .removeClass("tray-collapsed");
                    $timeout(function() {
                        vm.change();
                    });

                } else {
                    elTray
                        .addClass("tray-collapsed")
                        .bind("mouseover", mouseOver)
                        .bind("mouseout", mouseOut);
                    $timeout(function() {
                        vm.change();
                    });
                }

                osApi.onResize.dispatch();
            };

            var mouseOver = function() {
                angular.element("." + vm.trayClass)
                    .removeClass("tray-collapsed");
            }
            var mouseOut = function() {
                angular.element("." + vm.trayClass)
                    .addClass("tray-collapsed");
            }
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTrayBarchart', trayBarchart);

    /** @ngInject */
    function trayBarchart(d3) {

        var directive = {
            restrict: 'E',
            scope: {
                data: '=chartData',
                height: '=chartHeight'
            },
            link: TrayChartLink,
            replace: false
        };

        return directive;

        /** @ngInject */
        function TrayChartLink(scope, element) {
            var chart = d3.select(element[0]).append("svg").attr("class", "tray-chart").style("height", scope.height + "px");
            var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
                return d.tip;
            });
            chart.call(elTip);
            scope.$watch('data', function(newValue) {
                var barHeight = scope.height - 10;
                var barWidth = (250 / newValue.length) - 1;
                var binding = chart
                    .selectAll("rect")
                    .data(scope.data);
                binding.enter()
                    .append("rect")
                    .on("mouseover", elTip.show)
                    .on("mouseout", elTip.hide)
                    .transition()
                    .attr("class", "tray-bar")
                    .style("width", barWidth + "px")
                    .style("x", function(d, i) { return (((barWidth + 1) * i) + 5) + "px"; })
                    .style("height", function(d) { return (d.value * barHeight) + "px"; })
                    .style("y", function(d) { return (barHeight - (d.value * barHeight) + 5) + "px"; })
                    .text(function(d) { return d.label; });
                binding.exit().remove();
                binding
                    .transition()
                    .style("width", barWidth + "px")
                    .style("x", function(d, i) { return (((barWidth + 1) * i) + 5) + "px"; })
                    .style("height", function(d) { return (d.value * barHeight) + "px"; })
                    .style("y", function(d) { return (barHeight - (d.value * barHeight) + 5) + "px"; });



            });


        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTools', tools);

    /** @ngInject */
    function tools() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/tools/tools.html',
            controller: ToolsController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ToolsController(osApi, $state) {
            var vm = this;
            vm.tools = osApi.getTools();
            vm.explore = function(tool) {
                $state.go(tool, {
                    datasource: osApi.getDataSource().dataset
                });
            };
            osApi.setBusy(false);
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osTimelines', timelines);

    /** @ngInject */
    function timelines() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/timelines/timelines.html',
            controller: TimelinesController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function TimelinesController(osApi, $state, $scope, $stateParams, $window, $document, moment, d3, _) {


            // Loading . . . 
            osApi.setBusy(true);

            // View Model
            var patientsAll = []; // All Patient Data
            var patientsVisible = []; // Visible Patient Data
            var patientsDomain = []; // Min + Max Times
            var rowHeight = 20;
            var baseZoomX = 1;
            var baseZoomY = 1;
            var xZoom, yZoom, xTran, yTran;
            var scaleX;

            var vm = this;
            vm.datasource = osApi.getDataSource();
            vm.cohort = osApi.getCohort();
            vm.timescales = [{
                    name: 'Log',
                    valFn: function(val) {

                        return (val < 0 ? -1 : 1) * Math.log(Math.abs((val * 1000) / 86400000) + 1) / Math.log(2);
                    }
                },
                { name: 'Linear', valFn: function(val) { return moment.duration(val * 1000).asDays(); } }
            ];
            vm.filters = [
                { name: 'Alive + Dead' },
                { name: 'Only Alive' },
                { name: 'Only Dead' }
            ];
            vm.modes = [
                { name: "Highlight" },
                { name: "Filter" }
            ];
            vm.displayModes = [
                { name: 'All Patients' },
                { name: 'Selected Patients' }
            ];
            vm.timescale = vm.timescales[0];
            vm.filter = vm.filters[0];
            vm.mode = vm.modes[0];
            vm.displayMode = vm.displayModes[0];
            vm.events = null;
            vm.align = null;
            vm.sort = null;
            vm.resetZoom = function() {
                osApi.setCohort([], osApi.ALL, osApi.PATIENT);
                elScrollY.call(brushY.move, null);
                elScrollX.call(brushX.move, null);
            };

            // Elements
            var brushY = d3.brushY().handleSize(3);
            var brushX = d3.brushX().handleSize(3);
            var brushSelect = d3.brushY().handleSize(1);
            var elContainer = d3.select(".timelines-content");
            var elAxis = elContainer.append("svg").attr("class", "timeline-axis");
            var elScrollY = elContainer.append("svg").attr("class", "timeline-scroll-y");
            var elScrollX = elContainer.append("svg").attr("class", "timeline-scroll-x");
            var elChart = elContainer.append("svg").attr("class", "timeline-chart");
            var elSelected = elChart.append("g");
            var elHitarea = elChart.append("g");
            var elPatients = elChart.append("g");

            var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) { return d.tip; });
            elChart.call(elTip);

            elContainer = angular.element(".timelines-content");

            var drawScrollbars = function() {
                var layout = osApi.getLayout();
                var width = $window.innerWidth - layout.left - layout.right - 80;
                var height = $window.innerHeight - 200;
                elScrollY.call(
                    brushY
                    .on("end", function() {
                        if (d3.event.selection !== null) {
                            var lower = d3.event.selection[0];
                            var upper = d3.event.selection[1];
                            var domain = height;
                            var lowerPercent = lower / domain;
                            var upperPercent = upper / domain;
                            var deltaPercent = upperPercent - lowerPercent;
                            yZoom = (baseZoomY / deltaPercent);
                            yTran = (rowHeight * patientsVisible.length * yZoom) * -lowerPercent;
                        } else {
                            if (yZoom == baseZoomY && yTran === 0) return;
                            yZoom = baseZoomY;
                            yTran = 0;
                            elScrollY.call(brushY.move, null);
                        }
                        elPatients
                            .transition()
                            .duration(750)
                            .attr("transform", "translate(" + xTran + "," + yTran + ") scale(" + xZoom + "," + yZoom + ")");

                        elSelected
                            .transition()
                            .duration(750)
                            .attr("transform", "translate(" + xTran + "," + yTran + ") scale(" + xZoom + "," + yZoom + ")");

                    })
                );
                elScrollX.call(
                    brushX
                    .on("end", function() {



                        if (d3.event.selection !== null) {
                            var lower = d3.event.selection[0];
                            var upper = d3.event.selection[1];
                            var domain = width - 20;
                            var lowerPercent = lower / domain;
                            var upperPercent = upper / domain;
                            var deltaPercent = upperPercent - lowerPercent;
                            xZoom = (baseZoomX / deltaPercent);
                            xTran = (width * xZoom) * -lowerPercent;
                        } else {
                            if (xZoom == baseZoomX && xTran === 0) return;
                            xZoom = baseZoomX;
                            xTran = 0;
                            elScrollX.call(brushX.move, null);

                        }
                        elPatients
                            .transition()
                            .duration(750)
                            .attr("transform", "translate(" + xTran + "," + yTran + ") scale(" + xZoom + "," + yZoom + ")");
                        drawAxis();
                    })
                );
            };


            var daysToUnit = function(d) {
                if (Math.abs(d) === 0) return d;
                if (Math.abs(d) < 30) return d + " Days";
                if (Math.abs(d) < 360) return Math.round((d / 30.4) * 10) / 10 + " Months";
                return Math.round((d / 365) * 10) / 10 + " Years";
            };

            var drawAxis = function() {

                var zi = d3.zoomIdentity.translate(xTran).scale(xZoom);
                var ns = zi.rescaleX(scaleX);
                var axis = d3.axisBottom(ns).ticks(5);

                if (vm.timescale.name == 'Linear') {
                    axis.tickFormat(function(d) {
                        return daysToUnit(d);
                    });
                } else {
                    axis.tickFormat(function(d) {
                        return daysToUnit(Math.round((d < 0 ? -1 : 1) * (Math.pow(2, (Math.abs(d))) - 1) * 100) / 100);
                    });
                }
                elAxis.transition().duration(900).call(axis);
            };


            function onCohortChange() {
                updatePatientsVisible();
                drawSelected();
            }

            function calculateSelection() {
                if (d3.event.selection === null) return;
                var lowerIndex = Math.round(Math.round(d3.event.selection[0] - yTran) / yZoom / 20);
                var upperIndex = Math.round(Math.round(d3.event.selection[1] - yTran) / yZoom / 20);
                if (lowerIndex < 0) lowerIndex = 0;
                if (upperIndex >= patientsVisible.length) upperIndex = patientsVisible.length - 1;
                if (lowerIndex == upperIndex) upperIndex = lowerIndex + 1;
                var ids = [];
                for (var i = lowerIndex; i <= upperIndex; i++) {
                    ids.push(patientsVisible[i].id);
                }
                ids.pop();
                osApi.setCohort(ids, "Timelines", osApi.PATIENT);
                elHitarea.call(d3.event.target.move, null);
            }

            function drawSelected() {

                // Transform Selections Into Index Positions - Don't need to render unselected
                var selectedIndexes = patientsVisible.map(function(v, i) {
                    return (v.selected) ? i : -1;
                }).filter(function(v) { return v != -1; });

                var selectedRows = elSelected.selectAll("rect").data(selectedIndexes);

                selectedRows.exit()
                    .transition()
                    .duration(600)
                    .attr("width", "0")
                    .remove();

                selectedRows.enter()
                    .append('rect')
                    .attr('width', '0')
                    .attr('height', rowHeight - 2)
                    .attr('y', 1)
                    .attr('transform', function(d) { return "translate(0," + (d * rowHeight) + ")"; })
                    .style("fill", "#cacaca")
                    .transition()
                    .duration(600)
                    .attr("width", "100%");

                selectedRows
                    .transition()
                    .duration(600)
                    .attr('transform', function(d) { return "translate(0," + (d * rowHeight) + ")"; });
            }

            function drawPatients() {

                var layout = osApi.getLayout();
                var width = $window.innerWidth - layout.left - layout.right - 80;

                // Set Scale
                scaleX = d3.scaleLinear().domain(patientsDomain).range([0, width]).nice();
                var patients = elPatients.selectAll("g.patient").data(patientsVisible);
                patients.exit()
                    .transition()
                    .delay(200)
                    .duration(500)
                    .style('opacity', 0.0)
                    .remove();

                var patientEnter = patients.enter()
                    .append('g')
                    .attr("class", "patient")
                    .attr('transform', function(d, i) {
                        return "translate(0," + (i * rowHeight) + ")";
                    });

                drawEvents(patients.selectAll(".event").data(function(d) {
                    return d.events.filter(function(v) { return v.visible; });
                }));

                drawEvents(patientEnter.selectAll(".event").data(function(d) {
                    return d.events.filter(function(v) { return v.visible; });
                }));


            }

            // Gets called by Draw Patients Don't call manually
            function drawEvents(evts) {
                evts.exit()
                    .on("mouseover", null)
                    .on("mouseout", null)
                    .remove();
                evts.enter().append("rect")
                    .attr('class', 'event')
                    .attr('width', function(d) { return Math.max((scaleX(d.tsEndAligned) - scaleX(d.tsStartAligned)), 2); })
                    .attr('height', function(d) { return (d.name == "Radiation" || d.name == "Drug") ? (rowHeight - 2) / 2 : rowHeight - 2; })
                    .attr('y', function(d) { return ((d.name == "Radiation") ? rowHeight / 2 : 1); })
                    .attr('x', function(d) { return scaleX(d.tsStartAligned); })
                    .style('fill', function(d) { return d.color; })
                    .on("mouseover", elTip.show)
                    .on("mouseout", elTip.hide);
                evts
                    .attr('width', function(d) { return Math.max((scaleX(d.tsEndAligned) - scaleX(d.tsStartAligned)), 2); })
                    .attr('height', function(d) { return (d.name == "Radiation" || d.name == "Drug") ? rowHeight / 2 : rowHeight; })
                    .attr('y', function(d) { return ((d.name == "Radiation") ? rowHeight / 2 : 0); })
                    .attr('x', function(d) { return scaleX(d.tsStartAligned); })
                    .style('fill', function(d) { return d.color; });
            }

            function updateScale() {
                var layout = osApi.getLayout();
                var width = $window.innerWidth - layout.left - layout.right - 80;
                var height = $window.innerHeight - 200;
                elContainer.css("background", "#FAFAFA").css("margin-left", layout.left + 30).css("margin-right", layout.right).css("width", width + 20).css("height", height + 20);
                elScrollY.attr("height", height);
                elScrollX.attr("width", width);
                elChart.attr("height", height).attr("width", width).attr("fill", "blue").attr('transform', 'translate(0,0)');
                elPatients.attr("height", height).attr("width", width);
                elSelected.attr("height", height).attr("width", width);
                elAxis.style("top", height + 20).attr("width", width);
                elHitarea.attr("width", width).attr("height", height);

                // Set Zoom + Transition Data
                baseZoomY = height / (patientsVisible.length * rowHeight);
                baseZoomX = 1;
                xZoom = baseZoomX;
                yZoom = baseZoomY;
                xTran = 0;
                yTran = 0;
                if (baseZoomY == Infinity) baseZoomY = 10;

                // Scale + Transform
                elPatients.attr("transform", "translate(" + xTran + "," + yTran + ") scale(" + xZoom + "," + yZoom + ")");
                elSelected.attr("transform", "translate(" + xTran + "," + yTran + ") scale(" + xZoom + "," + yZoom + ")");
            }

            // Filter + Sort Patients = Set patientsFiltered
            function updatePatientsVisible() {

                vm.cohort = osApi.getCohort();
                var align = vm.align.name;
                var sort = vm.sort.name;
                var filter = vm.filter.name;
                var events = vm.events.filter(function(e) {
                    return e.selected;
                }).map(function(e) {
                    return e.name.toLowerCase();
                });

                // Filter Dataset + Calculate Domain
                patientsDomain = [Infinity, -Infinity];
                patientsAll.forEach(function(patient) {

                    // Set Selected
                    patient.selected = (vm.cohort.patientIds.indexOf(patient.id) !== -1);
                    patient.visible = true;

                    // Filter Patients W/O Align, Sort or Filter
                    if (!patient.hash.hasOwnProperty(this.align) || !patient.hash.hasOwnProperty(this.sort) || !patient.hash.hasOwnProperty("Status")) {
                        patient.visible = false;
                        return;
                    }

                    // Filter Based On Alive Dead Status
                    var status = patient.hash.Status.data.status.trim().toLowerCase();
                    if ((this.filter == "Only Alive" && status == "dead") || (this.filter == "Only Dead" && status != "dead")) {
                        patient.visible = false;
                        return;
                    }


                    // Filter Selected
                    if (vm.displayMode.name == "Selected Patients" && !patient.selected) {
                        patient.visible = false;
                        return;
                    }

                    this.offset = 0 - patient.hash[this.align].tsStart;

                    // Filter Events
                    patient.events.forEach(function(event) {
                        event.visible = (this.events.indexOf(event.name.toLowerCase()) != -1);
                        // Calculate Start + End Based On Alignment
                        if (event.visible) {
                            event.tsStartAligned = vm.timescale.valFn(event.tsStart + this.offset);
                            event.tsEndAligned = vm.timescale.valFn(event.tsEnd + this.offset);
                            this.domain[0] = Math.min(this.domain[0], event.tsStartAligned);
                            this.domain[1] = Math.max(this.domain[1], event.tsEndAligned);
                        }
                    }, this);

                }, {
                    align: align,
                    sort: sort,
                    filter: filter,
                    events: events,
                    domain: patientsDomain,
                    offset: 0
                });

                // Sort Patients
                patientsVisible = patientsAll.filter(function(v) { return v.visible; }).sort(function(a, b) {
                    if (a.status == b.status) {
                        var aTime = a.events.filter(function(e) { return (e.name == sort && e.order == 1); })[0].tsStartAligned;
                        var bTime = b.events.filter(function(e) { return (e.name == sort && e.order == 1); })[0].tsStartAligned;
                        if (aTime > bTime) return 1;
                        if (bTime > aTime) return -1;
                        return 0;
                    } else {
                        return (a.status == "dead") ? 1 : -1;
                    }
                });

            }

            // Load Data
            osApi.query(osApi.getDataSource().clinical.events, {}).then(function(response) {

                var colorFn = function(status) {
                    return (status == "Birth") ? "#E91E63" :
                        (status == "Diagnosis") ? "#673AB7" :
                        (status == "Pathology") ? "#2196F3" :
                        (status == "Progression") ? "#00BCD4" :
                        (status == "Absent") ? "#CDDC39" :
                        (status == "Status") ? "#FFC107" :
                        (status == "Radiation") ? "#FF5722" :
                        (status == "Procedure") ? "#795548" :
                        (status == "Encounter") ? "#607D8B" :
                        (status == "Drug") ? "#03A9F4" :
                        "black";
                };
                var data = response.data[0];
                var events = {};
                data = Object.keys(data).map(function(key) {
                    // Loop Throug Events
                    var evtArray = this.data[key]
                        .filter(function(v) {
                            return v.start !== null;
                        })
                        .map(function(v) {
                            this.events[v.name] = null;
                            if (v.hasOwnProperty("data")) {
                                v.tip = Object.keys(v.data).reduce(function(p, c) {
                                    try {
                                        if (v.data[c] !== null) {
                                            p += "<br>" + c
                                                .replace(/([A-Z])/g, " $1")
                                                .replace(/\w\S*/g, function(txt) {
                                                    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                                                }) + ": " + v.data[c].toString()
                                                .replace(/\w\S*/g, function(txt) { return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(); });
                                        }
                                    } catch (e) {
                                        return "";
                                    }
                                    return p;
                                }, v.name);
                            } else if (v.hasOwnProperty("name")) {
                                v.tip = v.name;
                            } else {
                                v.tip = "Unknown";
                            }
                            v.tsStart = moment(v.start, "MM/DD/YYYY").unix();
                            v.tsEnd = (v.end === null) ? v.tsStart : moment(v.end, "MM/DD/YYYY").unix();
                            v.tsStartAligned = "";
                            v.tsEndAligned = "";
                            v.end = (v.end === null) ? v.start : v.end;
                            v.color = this.colorFn(v.name);
                            v.visible = true;
                            v.order = 1;
                            return v;
                        }, {
                            events: this.events,
                            colorFn: this.colorFn
                        });
                    var evtHash = evtArray.reduce(function(p, c) {
                        if (p.hasOwnProperty(c.name)) {
                            if (p[c.name].tsStart > c.tsStart) p[c.name] = c;
                        } else {
                            p[c.name] = c;
                        }
                        return p;
                    }, {});
                    return {
                        id: key,
                        events: evtArray,
                        hash: evtHash
                    };
                }, {
                    data: data,
                    events: events,
                    colorFn: colorFn
                });
                data.forEach(function(patient) {
                    var groups = _.groupBy(patient.events, 'name');
                    var keys = Object.keys(groups).filter(function(prop) {
                        return (this[prop].length > 1);
                    }, groups);
                    keys.forEach(function(v) {
                        var i = 1;
                        patient.events
                            .filter(function(e) { return e.name == v; })
                            .sort(function(a, b) {
                                return a.tsStart - b.tsStart;
                            }).forEach(function(v) {
                                v.order = i;
                                i++;
                            });
                    });
                });
                patientsAll = data.filter(function(v) {
                    try {

                        v.status = v.hash.Status.data.status.toLowerCase();
                        return true;
                    } catch (e) {
                        return false;
                    }
                });
                vm.events = Object.keys(events).map(function(v) {
                    return {
                        name: v,
                        selected: (["Birth", "Pathology", "Absent", "Procedure"].indexOf(v) == -1),
                        color: this(v)
                    };
                }, colorFn);
                vm.align = vm.events.filter(function(v) {
                    if (v.name == "Diagnosis") return true;
                })[0];
                vm.sort = vm.events.filter(function(v) {
                    if (v.name == "Status") return true;
                })[0];



                updatePatientsVisible();
                updateScale(); // Depends on Visible Patients

                drawPatients();
                drawSelected();
                drawScrollbars();
                drawAxis();
                elHitarea.call(brushSelect);
                brushSelect.on("end", calculateSelection);
                osApi.onCohortChange.add(onCohortChange);
                osApi.setBusy(false);
            });

            vm.update = function() {

                elScrollY.call(brushY.move, null);
                elScrollX.call(brushX.move, null);

                updatePatientsVisible();
                updateScale(); // Depends on Visible Patients
                drawPatients();
                drawScrollbars();
                drawSelected();
                drawAxis();
            };
            osApi.onResize.add(vm.update);

            // Destroy
            $scope.$on('$destroy', function() {
                osApi.onCohortChange.remove(onCohortChange);
                brushX.on("end", null);
                brushY.on("end", null);
                brushSelect.on("end", null);
                osApi.onResize.remove(vm.update);
            });
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osSurvival', survival);

    /** @ngInject */
    function survival() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/survival/survival.html',
            controller: SurvivalController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SurvivalController(d3, osApi, $state, $timeout, $scope, $stateParams, $window, _) {

            // Loading . . . 
            osApi.setBusy(true);

            // View Model
            var vm = this;
            vm.datasource = osApi.getDataSource();

            vm.cohort = osApi.getCohort();
            vm.cohorts = (osApi.getCohorts().indexOf(vm.cohort) == -1) ?
                osApi.getCohorts().concat([vm.cohort]) : osApi.getCohorts();

            vm.pValues = [];
            vm.setCohort = function(cohort) {
                osApi.setCohort(cohort);
            };

            // Format Elements
            var formatPercent = function(d) { return Math.round(d * 100) + "%"; };
            var formatDays = function(d) {
                if (Math.abs(d) === 0) return d;
                if (Math.abs(d) < 30) return d + " Days";
                if (Math.abs(d) < 360) return Math.round((d / 30.4) * 10) / 10 + " Months";
                return Math.round((d / 365) * 10) / 10 + " Years";
            };

            // Create D3 Elements
            var elContainer = angular.element("#survival-chart");
            var elChart = d3.select("#survival-chart").append("svg").attr("width", "100%").attr("height", "100%");
            var elBrush = elChart.append("g");
            var elCurves = elChart.append("g");
            var elXAxis = elChart.append("g").attr("class", "axis");
            var elYAxis = elChart.append("g").attr("class", "axis").attr("transform", "translate(50, 10)");
            var brush = d3.brush();

            // Base Layout
            var layout = {
                width: 0,
                height: 0,
                xScale: d3.scaleLinear(),
                yScale: d3.scaleLinear(),
                xDomain: [0, 1], // Effected By Survival Min Max
                yDomain: [0, 1],
                xAxis: d3.axisBottom().ticks(5).tickFormat(formatDays),
                yAxis: d3.axisLeft().ticks(5).tickFormat(formatPercent)
            };

            // Curve Functions + Events
            var curveFunction = d3.line()
                .curve(d3.curveStepAfter)
                .x(function(d) { return Math.round(layout.xScale(d.t)); })
                .y(function(d) {
                    return layout.yScale(d.s);
                });
            var onCurveMouseOver = function() {}; // d3.event.target.style.strokeWidth = "3px"; };
            var onCurveMouseOut = function() {}; // d3.event.target.style.strokeWidth = "1px"; };

            var addCurve = function(cohort) {

                // Create Group To Hold Curve
                var g = elCurves.append("g")
                    .attr("class", "curve")
                    .attr("transform", "translate(0, 10)");

                // Add Ticks
                var ticks = cohort.survival.compute.filter(function(v) { return v.c.length > 0; });
                ticks.forEach(function(t) {
                    var tx = Math.round(layout.xScale(t.t));
                    var ty = Math.round(layout.yScale(t.s));
                    g.append("line")
                        .attr("class", "survival-tick")
                        .style("stroke", cohort.color)
                        .attr("x1", tx)
                        .attr("x2", tx)
                        .attr("y1", ty - 3)
                        .attr("y2", ty + 3);
                });

                // Append Path
                g.append("path")
                    .datum(cohort.survival.compute)
                    .attr("tip", cohort.name + " Vs. All Patients + Samples<br> p : " + cohort.survival.logrank.pValue)
                    .attr("class", "survival-line")
                    .style("stroke", cohort.color)
                    .attr("d", curveFunction)
                    .on("mouseover", onCurveMouseOver)
                    .on("mouseout", onCurveMouseOut)
                    .on("click", function() {
                        osApi.setCohort(cohort);
                    });
            };

            // Drawing Methods
            var dataChange = function() {

                // Determine The XDomain
                layout.xDomain = vm.cohorts
                    .filter(function(v) { return v.show; })
                    .reduce(function(p, c) {
                        p[0] = Math.min(p[0], c.survival.compute[0].t);
                        p[1] = Math.max(p[1], c.survival.compute[c.survival.compute.length - 1].t);
                        return p;
                    }, [Infinity, -Infinity]);

                // Trigger Resize
                resize();
            };


            var onBrushEnd = function() {
                if (!d3.event.selection) {
                    osApi.setCohort(vm.cohorts.filter(function(c) { return c.type == "ALL"; })[0]);
                    return;
                }
                var s = d3.event.selection;
                osApi.setBusy(true);

                // Calculate Bounds Of Selection
                var rangeSort = function(a, b) { return a - b; };
                var timeRange = [s[0][0], s[1][0]].map(layout.xScale.invert).sort(rangeSort);
                var percentRange = [s[0][1] - 10, s[1][1] - 10].map(layout.yScale.invert).sort(rangeSort);
                var visibleCohorts = vm.cohorts.filter(function(v) { return v.show; });
                var visibleCompute = visibleCohorts.reduce(function(p, c) { return p.concat(c.survival.compute); }, []);
                var computeInRange = visibleCompute.filter(function(v) {
                    return (
                        (v.t >= this.timeRange[0]) &&
                        (v.t <= this.timeRange[1]) &&
                        (v.s >= this.percentRange[0]) &&
                        (v.s <= this.percentRange[1])
                    );
                }, { timeRange: timeRange, percentRange: percentRange });

                var combinedIds = computeInRange.reduce(function(p, c) { return p.concat(c.c, c.d); }, []);
                var uniqueIds = _.unique(combinedIds);
                osApi.setCohort(uniqueIds, "Survival", osApi.PATIENT);
                osApi.setBusy(false);
            };

            var resize = function() {

                // Get Screen Dimensions
                var osLayout = osApi.getLayout();
                layout.width = $window.innerWidth - osLayout.left - osLayout.right - ((osLayout.left === 0) ? 20 : 0) - ((osLayout.right === 0) ? 20 : 0);
                layout.height = $window.innerHeight - 125;

                // Position container
                elContainer.css({ 'width': layout.width, 'height': layout.height, 'margin-left': (osLayout.left === 0) ? 20 : osLayout.left });

                // Scale Axis
                layout.xScale.domain(layout.xDomain).range([40, layout.width - 40]);
                layout.yScale.domain(layout.yDomain).range([layout.height - 40, 10]);
                layout.xAxis.scale(layout.xScale);
                layout.yAxis.scale(layout.yScale);
                elXAxis.attr("transform", "translate(0, " + (layout.height - 30) + ")").call(layout.xAxis);
                elYAxis.attr("transform", "translate(40, 10)").call(layout.yAxis);

                // Draw Cohorts
                elCurves.selectAll(".curve").remove();
                vm.cohorts
                    .filter(function(v) { return v.show; })
                    .map(addCurve);
                if (vm.cohorts.indexOf(vm.cohort) == -1) {
                    addCurve(vm.cohort);
                }

                // Set Selected + Set P Values
                var selectedColor = d3.rgb(vm.cohort.color).toString();
                elCurves.selectAll(".curve").each(function() {
                    var me = d3.select(this);
                    var selected = (d3.select(this).select(".survival-line").style("stroke") == selectedColor);
                    me.classed("survival-line-selected", selected);
                });

                var pValues = vm.cohorts.filter(function(v) { return v != vm.cohort; }).map(function(v) {
                    return {
                        c: [vm.cohort.color, v.color],
                        n: v.name,
                        p: osApi.km.logranktest([vm.cohort.survival.data, v.survival.data]).pValue
                    };

                });

                var all = vm.cohorts.filter(function(v) { return v.show; });
                if (all.length !== 1) {


                    if (vm.cohorts.indexOf(vm.cohort) == -1) {
                        all.unshift(vm.cohort);
                    }
                    all.sort(function(a) {
                        if (vm.cohort.color == a.color) return -1;
                        if (a.color == "#E91E63") return -1;
                        return 0;
                    });
                }

                pValues.unshift({
                    c: all.map(function(v) { return v.color; }),
                    n: 'Visible Cohorts',
                    p: osApi.km.logranktest(all.map(function(v) { return v.survival.data; })).pValue
                });
                vm.pValues = pValues;

                brush.extent([
                    [40, 20],
                    [layout.width - 30, layout.height - 30]
                ]);
                brush.on("end", onBrushEnd);
                elBrush.call(brush);
            };

            var onCohortsChange = function() {
                vm.cohorts = osApi.getCohorts();
                vm.cohort = osApi.getCohort();
                vm.cohort.show = true;
                vm.cohortsLegend = vm.cohorts.filter(function(v) { return v != vm.cohort; });
                resize();
            };

            var onCohortChange = function() {
                onCohortsChange();
            };

            vm.toggle = function(cohort) {
                if (vm.cohorts.reduce(function(p, c) { p += c.show ? 1 : 0; return p; }, 0) === 0) {
                    alert("You must have at least one cohort visible");
                    cohort.show = true;
                    return;
                }
                dataChange();
                var lrt = osApi.km.logranktest(vm.cohorts.filter(function(v) { return v.show; }).map(function(v) { return v.survival.data; }));
                vm.pSelected = "P: " + lrt.pValue + " DOF: " + lrt.dof;
            };


            // Create
            osApi.onResize.add(resize);
            osApi.onCohortChange.add(onCohortChange);
            osApi.onCohortsChange.add(onCohortsChange);
            dataChange();
            onCohortChange(osApi.getCohort());
            osApi.setBusy(false);

            // Destroy
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(resize);
                osApi.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osSunburst', sunburst);

    /** @ngInject */
    function sunburst() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/sunburst/sunburst.html',
            controller: SunburstController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SunburstController(d3, osApi, $state, $timeout, $scope, $stateParams, $window, _) {

            var colorMap;
            var vm = this;
            vm.patients = [];
            vm.patient = null;
            vm.datasource = osApi.getDataSource();
            vm.charts = [];

            var getColorMap = function(data) {
                var colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#0277BD", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722", "#795548", "#C51162", "#B388FF"];
                var tags = data.reduce(function(p, c) {
                    tags = c.groups.reduce(function(p, c) {
                        return _.union(p, c.tags)
                    }, []);
                    return _.union(p, tags)
                }, []);
                colors.length = tags.length;
                var colorMap = _.object(tags, colors);
                colorMap["Tumor"] = "#FEFEFE";
                colorMap["Normal"] = "#EAEAEA";
                return colorMap;
            };


            osApi.setBusy(true);
            osApi.query("biomarker_immune_tree").then(function(response) {
                osApi.setBusy(false);
                colorMap = getColorMap(response.data[0].barcharts);
                response.data.forEach(function(v) {
                    v.barcharts.forEach(function(v) {
                        v.groups.forEach(function(v) {
                            v.show = true;
                            v.tags = v.tags.map(function(v) {
                                return { name: v, color: colorMap[v] };
                            });
                        })
                    })
                });
                vm.patients = response.data;
                vm.patient = vm.patients[0];
                vm.draw()
            });

            vm.draw = function() {
                sunburst.draw(vm, colorMap);
                bars.draw(vm, colorMap);
            }

            // Sunburst
            var sunburst = (function() {
                var color = d3.scaleOrdinal(d3.schemeCategory20);
                //var formatNumber = d3.format(",d");
                var arc,
                    radius,
                    x,
                    y,
                    data,
                    svg,
                    labelTumor,
                    labelNormal,
                    sunburstNormal,
                    sunburstTumor;

                var tooltip = d3.select("#sunburst-chart").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);
                var w = d3.select(window);

                var init = function(chart) {
                    svg = chart;
                    labelTumor = svg.append("text").text("Tumor");
                    labelNormal = svg.append("text").text("Normal");
                    sunburstNormal = svg.append("g");
                    sunburstTumor = svg.append("g");
                }

                var mousemove = function() {
                    tooltip
                        .style('top', (d3.event.layerY + 10) + 'px')
                        .style('left', (d3.event.layerX + 10) + 'px');
                }
                var mouseover = function(d) {
                    tooltip.html(d.data.name)
                        .style("opacity", 1)
                        .style('top', (d3.event.layerY + 10) + 'px')
                        .style('left', (d3.event.layerX + 10) + 'px');
                    w.on("mousemove", mousemove).on("mouseup", null);
                }

                var mouseout = function(d) {
                    tooltip.html(d.data.Name)
                        .style("opacity", 0)
                }

                var click = function(d) {
                    var root = d;
                    while (root.parent) root = root.parent
                    var sunburst = (root.data.name == "Normal") ? sunburstNormal : sunburstTumor;
                    sunburst
                        .transition()
                        .duration(750)
                        .tween("scale", function() {
                            var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                                yd = d3.interpolate(y.domain(), [d.y0, 1]),
                                yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
                            return function(t) {
                                x.domain(xd(t));
                                y.domain(yd(t)).range(yr(t));
                            };
                        })
                        .selectAll("path")
                        .attrTween("d", function(d) {
                            return function() {
                                return arc(d);
                            };
                        });
                };

                var drawSunburst = function(data, g) {

                    var partition = d3.partition();
                    var root = d3.hierarchy(data);
                    root.sum(function(d) {
                        return d.size;
                    });

                    var decendants = partition(root).descendants()
                    var path = g.selectAll("path").data(decendants)
                        .enter().append("g");

                    path.append("path")
                        .attr("d", arc)
                        .style("fill", function(d) {
                            return color((d.children ? d : d.parent).data.name);
                        })
                        .style("stroke", "#FFF")
                        .style("stroke-width", "2")
                        .on("click", click)
                        .on("mouseover", mouseover)
                        .on("mouseout", mouseout)
                };

                var draw = function(vm) {
                    data = vm.patient;
                    var layout = osApi.getLayout();
                    var height = $window.innerHeight - 180;
                    var width = ($window.innerWidth - layout.left - layout.right);
                    radius = (Math.min((width * .5), height - 200) / 2) - 10;
                    x = d3.scaleLinear().range([0, 2 * Math.PI]);
                    y = d3.scaleSqrt().range([0, radius]);
                    arc = d3.arc()
                        .startAngle(function(d) {
                            return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
                        })
                        .endAngle(function(d) {
                            return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
                        })
                        .innerRadius(function(d) {
                            return Math.max(0, y(d.y0));
                        })
                        .outerRadius(function(d) {
                            return Math.max(0, y(d.y1));
                        });

                    svg.attr("width", width).attr("height", height);
                    labelNormal.attr("transform", "translate(" + (radius + 10) + "," + 20 + ")");
                    labelTumor.attr("transform", "translate(" + (width - radius - 10) + "," + 20 + ")");

                    sunburstNormal.attr("transform", "translate(" + (radius + 10) + "," + (radius) + ")");
                    sunburstTumor.attr("transform", "translate(" + (width - radius - 10) + "," + (radius) + ")");

                    drawSunburst(data.tumor, sunburstTumor, x, y);
                    drawSunburst(data.normal, sunburstNormal, x, y);
                };

                return {
                    init: init,
                    draw: draw
                };
            })();

            // Bars
            var bars = (function() {

                // Elements
                var svg;
                var charts;
                var layout, transformedData;
                var vm;

                var init = function(chart, viewModel) {
                    svg = chart;
                    charts = svg.append("g");
                    vm = viewModel;
                };

                var getLayoutMetrics = function(data) {
                    var layout = osApi.getLayout();
                    var widthTotal = ($window.innerWidth - layout.left - layout.right) - 40;
                    var widthChart = Math.floor(widthTotal / data.length);
                    var heightChart = 200; // Constant
                    var yChart = (Math.min((($window.innerWidth - layout.left - layout.right) * .5), ($window.innerHeight - 50) - 200)) - 10;
                    var xChart = 20;
                    return {
                        layout: layout,
                        widthTotal: widthTotal,
                        widthChart: widthChart,
                        heightChart: heightChart,
                        yChart: yChart,
                        xChart: xChart,
                        numCharts: data.length
                    };
                };

                var getTransformedData = function(data, colorMap) {

                    // Cartesian Product
                    function cartesianProductOf() {
                        return _.reduce(arguments, function(a, b) {
                            return _.flatten(_.map(a, function(x) {
                                return _.map(b, function(y) {
                                    return x.concat([y]);
                                });
                            }), true);
                        }, [
                            []
                        ]);
                    }

                    // Transform Data To Be Both Tree + List (Bar) Oriented
                    return data.map(function(chart) {


                        // Get Cartesian Product Of All Tags From Selected Groups 
                        var bars = cartesianProductOf.apply(this, chart.groups
                                .filter(function(c) {
                                    return c.show
                                })
                                .map(function(c) {
                                    return c.tags.map(function(v) { return v.name; });
                                }))
                            .map(function(v) {
                                return {
                                    value: 0,
                                    tags: v
                                }
                            });

                        // Sort Data On All Tags
                        bars.sort(function(a, b) {
                            for (var i = a.tags.length - 1; i >= 0; i--) {
                                if (a.tags[i] > b.tags[i]) return 1;
                                if (a.tags[i] < b.tags[i]) return -1;
                            }
                            return 0;
                        });

                        // Calculate Bar Values
                        //var values = chart.values;
                        bars.forEach(function(bar) {
                            chart.values.forEach(function(value) {
                                if (_.difference(bar.tags, value.tags).length == 0) bar.value += value.data;
                            });
                        });

                        // Convert Array Into A Tree Structure
                        var tree = bars.reduce(function(p, c) {
                            var barNode = p;
                            c.tags.reverse().forEach(function(tag) {
                                var tagIndex = barNode.children.map(function(v) {
                                    return v.name;
                                }).indexOf(tag.name);
                                if (tagIndex == -1) {
                                    barNode.children.push({
                                        name: tag,
                                        children: [],
                                        value: 1,
                                        color: colorMap[tag]
                                    });
                                    barNode = barNode.children[barNode.children.length - 1];
                                } else {
                                    barNode = barNode.children[tagIndex];
                                    barNode.value += 1;
                                }
                            });
                            c.tags.reverse();
                            return p;
                        }, {
                            name: chart.name,
                            children: [],
                            value: bars.length,
                            color: '#DDD'
                        });

                        // Return Tree
                        return {
                            bars: bars,
                            tree: tree
                        };

                    });
                };

                var drawTree = function(el) {

                    // Chart G Element
                    var chartLayer = d3.select(this);

                    // Chart Background
                    chartLayer.append("rect")
                        .style("fill", "#EEE")
                        .attr("width", layout.widthChart - 5)
                        .attr("height", layout.heightChart);

                    // Chart Label
                    chartLayer.append("text").text(el.tree.name)
                        .attr("y", 20)
                        .attr("x", Math.round((layout.widthChart - 5) / 2))
                        .attr("text-anchor", "middle");

                    // Draw Bars
                    var bars = chartLayer.selectAll(".cat-bar").data(el.bars);
                    var yMax = _.max(el.bars, function(bar) {
                        return bar.value;
                    }).value;
                    var yMin = _.min(el.bars, function(bar) {
                        return bar.value;
                    }).value;
                    var yScale = d3.scaleLinear();
                    yScale.range([0, 110]);
                    yScale.domain([yMin, yMax]);
                    var barWidth = layout.widthChart / el.bars.length;

                    bars.enter()
                        .append("rect")
                        .attr("x", function(d, i) {
                            return barWidth * i
                        })
                        .attr("y", function(d) {
                            return 140 - yScale(d.value)
                        })
                        .attr("width", barWidth)
                        .attr("height", function(d) {
                            return yScale(d.value);
                        })
                        .attr("fill", function(d) {
                            return (d.tags[0].name == "Normal") ? "#1476b6" : "#adc7ea";
                        });

                    // Create Partition Tree Legend 
                    var tree = d3.hierarchy(el.tree, function(d) {
                        return d.children;
                    });

                    var chartHeight = (1 / tree.height + 1) * 60;

                    var partition = d3.partition()
                        .size([layout.widthChart - 5, chartHeight]);

                    var nodes = partition(tree).descendants();

                    var node = chartLayer.selectAll(".cat-node")
                        .data(nodes);

                    node.enter()
                        .append("rect")
                        .attr("class", "cat-node")
                        .attr("x", function(d) {
                            return d.x0;
                        })
                        .attr("y", function(d) {
                            return (200 - chartHeight) - (d.y0 - chartHeight);
                        })
                        .attr("width", function(d) {
                            return d.x1 - d.x0;
                        })
                        .attr("height", function(d) {
                            return d.y1 - d.y0;
                        })
                        .attr("fill", function(d) {
                            return d.data.color;
                        })
                        .style("visibility", function(d) {
                            return d.data.name == 'chart' ? "hidden" : "visible";
                        });

                }

                var draw = function(data, colorMap) {

                    vm.charts = data = vm.patient.barcharts;
                    layout = getLayoutMetrics(data);

                    transformedData = getTransformedData(data, colorMap);

                    // Chart Spaces
                    var chart = charts.selectAll(".sunburst-barchart").data(transformedData);
                    chart.enter()
                        .append("g")
                        .attr("class", "sun-chart-g")
                        .attr("transform", function(d, i) {
                            return "translate(" + ((i * layout.widthChart) + layout.xChart) + "," + ($window.innerHeight - 380) + ")";
                        });
                    charts.selectAll(".sun-chart-g")
                        .each(drawTree);
                };
                return {
                    init: init,
                    draw: draw
                };
            })();

            var svg = d3.select("#sunburst-chart").append("svg");
            sunburst.init(svg);
            bars.init(svg, vm);

        }
    }
})();
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
                }).filter(function(o) {
                    return (o.name != "events" && o.name != "samplemap");
                });
            vm.collection = vm.collections.reduce(function(p, c) {
                if (c.name == "patient") p = c;
                return p;
            }, vm.collections[0]);
            vm.options = {
                treeRowHeaderAlwaysVisible: false,
                enableSelectionBatchEvent: false,
                enableGridMenu: false,
                enableSelectAll: true,
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
                            onCohortChange(osApi.getCohort());
                        }, 1);
                        vm.setSize();
                        osApi.setBusy(false);
                    });
            });


            // Destroy
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(vm.setSize);
                osApi.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osPlsr', explore);

    // Add Line of Origin
    // Recalculate On select
    // Filters

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/plsr/plsr.html',
            controller: PlsrController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function PlsrController(osApi, $http, $window, $scope, $q, d3, $timeout, _) {


            // Elements
            var elDiv = angular.element("#plsr-chart");
            var elChart = d3.select("#plsr-chart").append("svg");
            var elGroup = elChart.append("g");
            var elCircles;
            var elLines;
            var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) { return d.id; });
            elChart.call(elTip);

            // vm
            var vm = this;
            vm.genesets = [];
            vm.datasource = osApi.getDataSource();
            vm.collection = vm.datasource.molecular[0];
            vm.dd = {
                bound: { min: 0, max: 100 },
                value: { min: 0, max: 100 }
            };
            vm.dx = {
                bound: { min: 0, max: 100 },
                value: { min: 0, max: 100 }
            };
            // vm.geneset


            // State
            var data;
            var patients;
            var xScale = new d3.scaleLinear().nice();
            var yScale = new d3.scaleLinear().nice();

            // Lasso
            var lasso;
            var lasso_start = function() {
                lasso.items()
                    .attr("r", 3.5) // reset size
                    .classed("not_possible", true)
                    .classed("selected", false);
            };
            var lasso_draw = function() {
                lasso.possibleItems()
                    .classed("not_possible", false)
                    .classed("possible", true);
                lasso.notPossibleItems()
                    .classed("not_possible", true)
                    .classed("possible", false);
            };

            var lasso_end = function() {

                lasso.items()
                    .classed("not_possible", false)
                    .classed("possible", false);
                var ids = lasso.selectedItems().data().map(function(d) {
                    return d.id;
                });

                var selectedGenes = lasso.selectedItems().data().map(function(v) { return v.id; });
                if (selectedGenes.length < 2) {
                    if (vm.geneset.name != 'Custom') {
                        alert("Please select more than 1 gene");
                        return;
                    } else {
                        $timeout(function() {
                            vm.geneset = prevGeneset;
                        });
                        return;
                    }
                }
                $timeout(function() {
                    if (vm.geneset.name != 'Custom') {
                        prevGeneset = vm.geneset;
                    }

                    vm.geneset = { name: 'Custom', genes: selectedGenes };
                });
            };
            var prevGeneset;

            lasso = d3.lasso()
                .closePathSelect(true)
                .closePathDistance(100)
                .targetArea(elChart)
                .on("start", lasso_start)
                .on("draw", lasso_draw)
                .on("end", lasso_end);

            // Api
            function setData(value) {

                if (data === null) return;
                data = value;

                data.vectors = data.vectors.map(function(v) { return [{ id: v.id, value: [0, 0] }, v]; });

                var range = data.points.reduce(function(p, c) {
                    var x = c.value[0];
                    var y = c.value[1];
                    if (x > p.xMax) p.xMax = x;
                    if (x < p.xMin) p.xMin = x;
                    if (y > p.yMax) p.yMax = y;
                    if (y < p.yMin) p.yMin = y;
                    return p;
                }, { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity });
                xScale.domain([range.xMin, range.xMax]);
                yScale.domain([range.yMin, range.yMax]);
                draw();
            }

            function resize() {
                var layout = osApi.getLayout();
                var width = $window.innerWidth - layout.left - layout.right;
                var height = $window.innerHeight - 120; //10
                elDiv.css({
                    "width": width + "px",
                    "padding-left": layout.left + "px"
                });
                elChart.attr("width", width).attr("height", height);
                elGroup.attr("width", width).attr("height", height);
                xScale.range([50, width - 50]);
                yScale.range([50, height - 50]);
                draw();
            }

            // Render
            function draw() {
                if (angular.isUndefined(data)) return;
                elCircles = elGroup.selectAll("circle").data(data.points);
                elCircles.enter().append("circle")
                    .attr("class", "plsr-node")
                    .attr("cx", function(d) {
                        return xScale(d.value[0]);
                    })
                    .attr("cy", function(d) {
                        return yScale(d.value[1]);
                    })
                    .attr("r", 4)
                    .on("mouseover", elTip.show)
                    .on("mouseout", elTip.hide);
                elCircles.exit()
                    .transition()
                    .duration(200)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .style("fill-opacity", "0")
                    .remove();
                elCircles
                    .transition()
                    .duration(750)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .attr("r", 4)
                    .attr("cx", function(d) {
                        return xScale(d.value[0]);
                    })
                    .attr("cy", function(d) {
                        return yScale(d.value[1]);
                    });
                // .style("fill", function(d) {
                //     return d.color;
                // })
                //.style("fill-opacity", 0.8);


                var line = d3.line()
                    .x(function(d) { return xScale(d.value[0]); })
                    .y(function(d) { return yScale(d.value[1]); });

                elLines = elGroup.selectAll(".plsr-line").data(data.vectors);

                elLines.enter().append("path")
                    .attr("class", "plsr-line")
                    .attr("d", line)
                    .style("stroke", function(d) {
                        return (d[0].id == "age_at_diagnosis") ? "#FF9800" : "#38347b";
                    });
                elLines.exit().remove();
                elLines
                    .transition()
                    .duration(750)
                    .attr("d", line);

                lasso.items(elGroup.selectAll(".plsr-node"));
                elChart.call(lasso);
                osApi.setBusy(false);
            }



            // Move To Service 
            function query(dataset, genes, samples, features, molecular_collection, clinical_collection, n_components) {
   
                
                var data = { dataset: dataset, genes: genes, samples: samples, features: features, molecular_collection: molecular_collection, clinical_collection: clinical_collection, n_components: n_components };

                return $http({
                    method: 'POST',
                    url: "https://dev.oncoscape.sttrcancer.io/cpu/plsr",
                    data: data
                    
                });
                

            }

            // Load Data
            $q.all([
                osApi.query('lookup_genesets'),
                osApi.query(osApi.getDataSource().clinical.patient, {
                    $fields: ['patient_ID', 'gender', 'race', 'age_at_diagnosis', 'days_to_death', 'status_vital']
                })
            ]).then(function(responses) {
                patients = responses[1].data;

                var minMax = patients.reduce(function(p, c) {
                    if (c.age_at_diagnosis !== null) {
                        if (p.dx.max < c.age_at_diagnosis) p.dx.max = c.age_at_diagnosis;
                        if (p.dx.min > c.age_at_diagnosis) p.dx.min = c.age_at_diagnosis;
                    }
                    if (c.days_to_death !== null) {
                        if (p.dd.max < c.days_to_death) p.dd.max = c.days_to_death;
                        if (p.dd.min > c.days_to_death) p.dd.min = c.days_to_death;
                    }
                    return p;
                }, {
                    dd: { min: Infinity, max: -Infinity },
                    dx: { min: Infinity, max: -Infinity }
                });
                vm.dd.bound = minMax.dd;
                vm.dd.value = _.clone(minMax.dd);
                vm.dx.bound = minMax.dx;
                vm.dx.value = _.clone(minMax.dx);

                vm.genesets = responses[0].data;
                vm.geneset = vm.genesets[6];


            });


            // Watches
            vm.filterChange = function() {
                var patientIds = patients.filter(function(patient) {
                    return (patient.age_at_diagnosis >= vm.dx.value.min && patient.age_at_diagnosis <= vm.dx.value.max && patient.days_to_death >= vm.dd.value.min && patient.days_to_death <= vm.dd.value.max);
                }).map(function(patient) {
                    return patient.patient_ID;
                });
                if (patientIds.length == 0) {
                    alert("Filter Does Not Contain Any Patients");
                    return;
                }
                osApi.setBusy(true);
                osApi.setCohort(patientIds, "PCA", osApi.PATIENT);
            };
            var onGeneset = $scope.$watch("vm.geneset", function() {
                if (angular.isUndefined(vm.geneset)) return;
                osApi.setBusy(true);
                loadData();

            });

            function loadData() {

                var samples = osApi.getCohort().sampleIds;
                if (samples.length === 0) samples = Object.keys(osApi.getData().sampleMap);

                query(vm.datasource.dataset, vm.geneset.genes, samples, ["age_at_diagnosis", "days_to_death"],
                    vm.collection.collection,//"tcga_gbmlgg_exp_hiseqv2_ucsc-xena",
                    osApi.getDataSource().clinical.patient,
                    2
                ).then(function(response) {
                    data = response.data;
                    setData({ vectors: data["y.loadings"], points: data["x.loadings"] });
                    osApi.setBusy(false);
                });
            }

            osApi.onResize.add(resize);
            osApi.onCohortChange.add(loadData);
            resize();

        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osPca', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/pca/pca.html',
            controller: PcaController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function PcaController($q, osApi, $state, $stateParams, $timeout, $scope, d3, moment, $window,$http,  _, ML, $) {

            // helper functions -> move to service?
            var findIndicesOfMax = function(inp, count) {
                var outp = [];
                for (var i = 0; i < inp.length; i++) {
                    outp.push(i); // add index to output array
                    if (outp.length > count) {
                        outp.sort(function(a, b) { return inp[b] - inp[a]; }); // descending sort the output array
                        outp.pop(); // remove the last index (index of smallest element in output array)
                    }
                }
                return outp;
            }
            function calculatMetrics(){

                // 1. Number, Density, and Separation of Clusters
                //  - k-nearest neighbors
                // data

                // 2. association with clinical features

                // 3. Confidence in positioning of new sample

            }
            var transpose = function( a){
                return Object.keys(a[0]).map(function(c) {
                    return a.map(function(r) { return r[c]; });
                });
            }

            // Loading ...
            osApi.setBusy(true);

            var runType = "JS"

            // Elements
            var d3Chart = d3.select("#pca-chart").append("svg");
            var d3Points = d3Chart.append("g");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            var circles;

            // Properties
            var scaleX, scaleY, axisX, axisY;
            var data, minMax;
            var width, height;
            var colors = {
                data: [],
                name: "Dataset"
            };
            var acceptableDatatypes = ["expr", "cnv", "mut01", "meth_thd", "meth", "cnv_thd"];
            var availableBaseMethods = ["PCA"]
            var availableOverlayMethods = ["Centroid"]
            var NA_runs = []
            

            // View Model Update
            var vm = (function(vm, osApi) {
                vm.runTime = 20
                vm.temp = {
                    title: "",
                    method: availableBaseMethods[0],
                    source: osApi.getDataSource(),
                    data: {types:[],selected:{i:-1, name:""}},
                    params: {bool: {
                        geneset: {use: true, name:""},
                        cohort: {use: false, name:""} }},
                    meta: {numGenes:0, numSamples:0},
                    result : {input:{}, output: {}},
                    edit: false
                }
                vm.overlay = [ ]
                
                vm.selectColor = function(e) {
                    var ids = e.values;
                    var allIds = [];
                    d3.selectAll("circle.pca-node").each(function(d) {
                        if (ids.indexOf(d.id) != -1) {
                            d3.select(this).classed("pca-node-selected", true);
                            allIds.push(d.id);
                        } else {
                            if (d3.select(this).classed("pca-node-selected")) allIds.push(d.id);
                        }
                    });
                    osApi.setCohort(allIds, "PCA", osApi.SAMPLE);
                };
                vm.deselectColor = function(e) {
                    var ids = e.values;
                    var allIds = [];
                    d3.selectAll("circle.pca-node").each(function(d) {
                        if (ids.indexOf(d.id) != -1) {
                            d3.select(this).classed("pca-node-selected", false);
                        } else {
                            if (d3.select(this).classed("pca-node-selected")) allIds.push(d.id);
                        }
                    });
                    osApi.setCohort(allIds, "PCA", osApi.SAMPLE);
                };
                vm.hideModal = function() {
                    angular.element('#modalRun').modal('hide');
                    angular.element('#modal_NArun').modal('hide');
                    angular.element('#modal_intersection').modal('hide');
                };
                vm.copyBase = function(){
                    vm.base.edit = !vm.base.edit

                    if(vm.base.edit){
                      vm.temp = {
                          title: vm.base.title,
                          method: vm.base.method,  
                          result : {input : {}},
                          meta :{},
                          color : vm.base.color,
                          visibility: "visible"
                      }
                      vm.temp.source = {dataset: vm.base.source.dataset}
                      vm.temp.data = {  types:vm.base.data.types,
                                        selected:{
                                            i: vm.base.data.selected.i,
                                            name:vm.base.data.selected.name}}
                      vm.temp.params = {bool: {
                        geneset: {use: true, name:osApi.getGeneset().name},
                        cohort: {use: false, name:osApi.getCohort().name} }}
                      
                        updateOptions()
                    }
                    
                }
                vm.setBase = function(){
                    vm.base = _.clone(vm.temp)
                    vm.base.edit = false
                    vm.temp = null
                }
                vm.updateBaseview = function(){
                    if(vm.base.edit){
                        vm.callBaseMethod();
                        vm.overlay.forEach(function(d){
                            osApi.setBusy(true)
                            d.result.output = {}
                            d.edit = true
                            //vm.callOverlayMethod(d)
                            //draw()
                        })
                    }
                    else{
                        vm.base.visibility = vm.base.visibility == "visible" ? "hidden" : "visible"
                        draw()
                    }

                }
                vm.callBaseMethod = function(){
                    
                    osApi.setBusy(true)
                    vm.temp.data.selected.i = _.findIndex(vm.temp.data.types, {"name": vm.temp.data.selected.name})
                    
                    vm.temp.meta.numSamples = vm.temp.data.types[vm.temp.data.selected.i].s.length
                    vm.temp.meta.numGenes = vm.temp.data.types[vm.temp.data.selected.i].m.length;
                    
                    // determine calculation size for gene x samples matrix 
                    // depending on use of geneset or cohort settings
                    if(vm.temp.params.bool.geneset.use){
                        var geneset = osApi.getGeneset()
                        if(geneset.geneIds.length != 0)
                            vm.temp.meta.numGenes = geneset.geneIds.length
                    }
                    if(vm.temp.params.bool.cohort.use){
                        var samples = osApi.getCohort().sampleIds;
                        if(samples.length != 0){
                            vm.temp.meta.numSamples = samples.length
                            // TO DO: intersect with samples from mtx to ensure sufficient overlap & size
                        }
                    }
    
                    if(vm.temp.method == "PCA")
                        callPCA()
                }


                vm.copyItem = function(item){
                    
                    var usedColors = _.uniq(_.pluck(vm.overlay, "color"))
                    var availColors = [ "#E91E63", "#673AB7", "#4CAF50", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B", "#03A9F4", "#03A9F4",
                                        '#004358', '#800080', '#BEDB39', '#FD7400', '#1F8A70', '#B71C1C', '#880E4F', '#4A148C', '#311B92', '#0D47A1', 
                                        '#006064', '#1B5E20'].filter(function(v) { return (usedColors.indexOf(v) == -1); });

                    // edit/create item in history 
                    if(typeof item == "undefined"){
                        var filtered_types = vm.base.data.types.filter(function(v){ return v.type == vm.base.data.types[vm.base.data.selected.i].type})
                        var filtered_i = _.findIndex(filtered_types, {name:vm.base.data.selected.name})
                       item =  {
                            title: "",
                            method: availableOverlayMethods[0],
                            source: osApi.getDataSource(),
                            data: { types:  filtered_types,
                                    selected: { i: filtered_i, 
                                                name:vm.base.data.selected.name}
                                    },
                            params: {bool: { 
                                "geneset" : {name: vm.base.params.bool.geneset.name, use: vm.base.params.bool.geneset.use},
                                "cohort"  : {name: vm.base.params.bool.cohort.name, use: vm.base.params.bool.cohort.use} }             
                            },
                            meta: {numGenes:0, numSamples:0},
                            result : {input:{}, output: {}},
                            edit: false,
                            idx: vm.overlay.length,
                            color: availColors[0],
                            visibility: "visible"
                        }
                        item.title = item.method + "  (" + moment().format('hh:mm:ss') + ")";
                        
                        vm.overlay.push(item)
                    }
                    item.edit = !item.edit

                    // prep for running new overlay
                    if(item.edit){
                      vm.temp = {
                          title: item.title,
                          method: item.method,  
                          result : {input : {}},
                          meta :{},
                          idx: item.idx,
                          color: item.color,
                          visibility: "visible"
                      }
                      
                      vm.temp.source = {dataset: item.source.dataset}
                      vm.temp.data = {  types:item.data.types,
                                        selected:{
                                            i: item.data.selected.i,
                                            name:item.data.selected.name}}
                      
                      vm.temp.params = {bool: {
                        geneset: {use: true, name:osApi.getGeneset().name},
                        cohort: {use: false, name:osApi.getCohort().name} }}
                      
                    } else{
                        //check if item was run
                        if(angular.isUndefined(item.result.output.length))
                            // item was not run, remove from processed history
                            vm.overlay.splice(item.idx, 1)
                    }
                    
                }
                vm.updateItemview = function(item){
                    
                     if(item.edit){
                        osApi.setBusy(true);
                         vm.callOverlayMethod(item);
                     }
                    else{
                        item.visibility = item.visibility == "visible" ? "hidden" : "visible"
                        draw()
                    }
                }

                vm.callOverlayMethod = function(item){
                    item.data.selected.i = _.findIndex(item.data.types, {"name": item.data.selected.name})
                    osApi.setBusy(true)
                    callOverlay(item.idx);
                }
                


                vm.exportJSON = function(){
                    var header = "data:text/plain;charset=utf-8,";
                   // var json = JSON.stringify(vm.base.result.output)
                    
                    var doc = {
                            title: vm.base.title, 
                            disease: vm.base.source.dataset,
                            input: vm.base.data.selected.name, 
                            dataType: vm.base.method, 
                            geneset: vm.base.params.bool.geneset.name, 
                            metadata: {variance: [parseFloat(vm.base.meta.pc1[0].value), parseFloat(vm.base.meta.pc2[0].value)]}
                            }
                    
                   doc.scores = vm.base.result.output.map(function(scores){
                    
                       return {id: scores.id, d: scores.slice(0,3)}
                    
                    }); 
                    // var encodedUri = encodeURI(csvContent);
                    // window.open(encodedUri);
                    var encodedUri = encodeURI(header + JSON.stringify(doc));
                    var link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "pca.json");
                    document.body.appendChild(link); // Required for FF
                    
                    link.click()
                    document.body.removeChild(link);
                }

                return vm;
            })(this, osApi);

            // Update Geneset When Datasource Changes
            osApi.onGenesetChange.add(function() {
                if(vm.base.edit)
                    vm.temp.params.bool.geneset.name = osApi.getGeneset().name;
            });

            // Service
            function PCAquery(dataset, genes, samples, molecular_collection, n_components) {
                var payload = { dataset: dataset, genes: genes, samples: samples, molecular_collection: molecular_collection, n_components: n_components };
                return $http({
                    method: 'POST',
                    //url: "https://dev.oncoscape.sttrcancer.io/cpu/pca",
                    //url: "https://oncoscape-test.fhcrc.org/cpu/pca",
                    url: "http://localhost:8000/pca",
                    data: payload
                });
            }
            function Distancequery(collection1, collection2, geneIds) {
                var payload = { molecular_collection: collection1,molecular_collection2: collection2, genes:geneIds};
                return $http({
                    method: 'POST',
                // url: "https://dev.oncoscape.sttrcancer.io/cpu/distance",
                // url: "https://oncoscape-test.fhcrc.org/cpu/distance",
                 url: "http://localhost:8000/distance",
                    data: payload


                });
            }

            // Setup Watches
           

            // Setup Parameter Configurations
            var updateOptions = function(){
                
                var samples = []
                if(vm.temp.params.bool.cohort.use)
                    samples = osApi.getCohort().sampleIds
                if(samples.length ==0) samples = "None"

                // determine geneset accessibility for given pcaType
                osApi.getGenesets().filter(function(gs) {return gs.show}).forEach(function(gs){ 
                    var payload = {
                        dataset:vm.temp.source.dataset,
                        collection:vm.temp.data.types[vm.temp.data.selected.i].collection, 
                        geneset:gs.name, 
                        samples: samples }
                    
                    var na_run = _.where(NA_runs,payload).length > 0 // true if run parameters gives NA result
                    
                    // reactivate disabled genesets not registered as unable to run for given collection name,sample,geneset
                    // or disable active genesets known to not to give result
                    if((gs.disable &  !na_run) | (!gs.disable & na_run)) 
                        osApi.toggleGenesetDisable(gs)
                })

            }; 
            
            var callPCA = function(){

                vm.error = ""

                var geneset =  vm.temp.params.bool.geneset.use ? osApi.getGeneset() : osApi.getGenesetAll();

                //Check if in Mongo
                osApi.query(vm.temp.source.dataset +"_cluster", 
                    {   geneset: geneset.name, 
                        disease: vm.temp.source.dataset, 
                        dataType: "PCA", 
                        input:vm.temp.data.selected.name,
                        scores:{$size:vm.temp.meta.numSamples}}
                ).then(function(response){
                    var d = response.data
                    if(d.length >0){
                        
                        console.log("PCA: retreived from Mongo " + Date())
                        
                        var score_samples = _.pluck(d[0].scores, "id")
                        d[0].scores = d[0].scores.map(function(x){ return x.d})
                        processPCA(d[0], geneset.geneIds, score_samples);
                        draw();
                        return
                    }
                    if (runType == "JS" & vm.temp.meta.numSamples  * vm.temp.meta.numGenes > 50000) {
                        
                        runType = "python"

                        angular.element('#modalRun').modal();
                        return;
                    }
                    if(runType == "simulate"){
                        var numGenes = [100,200,500,1000, 5000, 10000,15000, 20000, 25000]; var numSamples = [100,200,500];
                        for(var i=0;i<numSamples.length;i++){
                            for(var j=0;j<numGenes.length;j++){
                                console.log("Genes: "+ numGenes[j] + " Samples: "+ numSamples[i])
                                runPCAsimulation(numGenes[j], numSamples[i]);
                            }
                        }

                    }else if(runType == "JS") {
                        var query = {}
                        if(geneset.geneIds.length >0){
                            query = {'m': {$in: geneset.geneIds}}
                        }
                        osApi.query(vm.temp.data.types[vm.temp.data.selected.i].collection, query
                        ).then(function(response){
                            vm.temp.result.input = response.data
                            runPCA();
                        });
                    }else if(runType == "python") {
                        
                        var geneSetIds = geneset.geneIds
                        var samples = [];
                        if(vm.temp.params.bool.cohort.use)
                            samples = osApi.getCohort().sampleIds;

                        osApi.setBusy(true)
                        PCAquery(vm.temp.source.dataset, geneSetIds, samples, vm.temp.data.types[vm.temp.data.selected.i].collection, 3).then(function(PCAresponse) {

                            var d = PCAresponse.data;
                            if(angular.isDefined(d.reason)){
                                console.log(geneset.name +": " + d.reason)
                                // PCA could not be calculated on geneset given current settings
                                vm.error = d.reason;
                                
                                // return to previous state
                                
                                //add to blacklist to disable from future selection/calculation
                                osApi.toggleGenesetDisable(geneset);
                                if(samples.length ==0) samples = "None"
                                NA_runs.push({"dataset":vm.temp.source.dataset, "collection":vm.temp.data.types[vm.temp.data.selected.i].collection, "geneset": geneset.name, "samples":samples})

                                // revert/update display
                                //if previous state not defined
                                    //load geneset anyways - nothing to fall back on
                                    //display null page
                                //else
                                    //rollback to previous definition
                                    angular.element('#modal_NArun').modal();
                                    //osApi.setGeneset(vm.geneSet)
                                //}

                                angular.element('#modalRun').modal('hide');
                                osApi.setBusy(false)
                                return;
                            }


                            // Successful run: 
                            //---update temp method
                            //vm.geneSet = geneset
                            runType = "JS"

                            //---update plot
                            geneSetIds = _.pluck(d.loadings,"id")
                            samples = _.pluck(d.scores,"id")
                            d.scores  = d.scores.map(function(result){ return result.d});
                            angular.element('#modalRun').modal('hide');
                            processPCA(d, geneSetIds, samples);
                            draw();
                        });
                    }
                })

            }

            var runPCAsimulation = function(numGenes, numSamples) {

                var options = {isCovarianceMatrix: false, center : true, scale: false};
                // create 2d array of samples x features (genes)
                var molecular = Array.apply(null, {length: numSamples}).map(function(){ return Array.apply(null, {length: numGenes}).map(Function.call, Math.random)});

                var then = Date.now();
                //console.log("PCA: Running " + Date())
                var d = new ML.Stat.PCA(molecular, options)
                var now = Date.now()
                //console.log("PCA: transforming scores " + Date())
                console.log("Genes: "+ numGenes + " Samples: "+numSamples+ "Diff: " + (now-then)/1000)

            }

            var runPCA = function() {

                osApi.setBusy(true)
                var options = {isCovarianceMatrix: false, center : true, scale: false};

                // Subset samples to those available in the collection
                var samples = []; 
                var sampleIdx = _.range(0,vm.temp.result.input[0].s.length)
                
                if(vm.temp.params.bool.cohort.use)
                    samples = osApi.getCohort().sampleIds;
                
                if(samples.length ==0){
                    samples = vm.temp.result.input[0].s
                } else{ 
                    sampleIdx = vm.temp.result.input[0].s.map(function(s, i){
                        var matchS = _.contains(samples, s) ? i : -1
                        return matchS})
                }
                

                var geneIds = _.pluck(vm.temp.result.input,"m")
                if(vm.temp.params.bool.geneset.use && osApi.getGeneset().geneIds.length >0)
                    geneIds = _.intersection( osApi.getGeneset().geneIds, geneIds);
                    //subset geneIds to be only those returned from Geneset (except when geneset == All Genes)
                
                if(geneIds.length == 0){ //genes in data don't overlap with specified geneset
                    angular.element('#modal_intersection').modal();
                    vm.temp.result.output = {}
                    osApi.setBusy(false)
                    return;
                
                } else{
                    vm.temp.result.input = vm.temp.result.input.filter(function(g){return _.contains(geneIds,g.m)})
                }
                
                // create 2d array of samples x features (genes)
                var molecular = vm.temp.result.input.map(function(s){return  s.d.filter(function(r, i){return _.contains(sampleIdx, i)})})
                
                // remove any genes that have NA values
                molecular = molecular.filter(function(v){return _.intersection(v, [NaN,"NaN"]).length == 0 })
                
                molecular = transpose(molecular)
                
                console.log("PCA: Running " + Date())
                //NOTE: If there are null values in molecular, PCA runs in an infinite loop!
                var d = new ML.Stat.PCA(molecular, options)
                console.log("PCA: transforming scores " + Date())
                d.metadata = {}
                d.metadata.variance = d.getExplainedVariance()
                d.loadings = d.getLoadings() // [[PC1 loadings (for coefficients for each gene)], [PC2 loadings], [...#PC = # samples]]
                d.scores = d.predict(molecular)
                
                processPCA(d, geneIds, samples);
                draw();

            }
            var processPCA = function(d, geneIds, samples){
                
                    console.log("PCA: processing results " + Date())
    
                    vm.setBase()

                    // Process PCA Variance
                    vm.base.meta.pc1 = [
                        { name: 'PC1', value: (d.metadata.variance[0] * 100).toFixed(2) },
                        { name: '', value: 100 - (d.metadata.variance[0]*100) }
                    ];
                    vm.base.meta.pc2 = [
                        { name: 'PC2', value: (d.metadata.variance[1] *100).toFixed(2) },
                        { name: '', value: 100 - (d.metadata.variance[1] *100) }
                    ];
    
                    // Process Scores
                    d.scores = d.scores.map(function(v,i) {
                        v.id = samples[i];
                        v.layer = -1
                        return v;
                    });
                    vm.base.result.output = d.scores
    
                    
            };

            var editOverlayMethod = function(){
                
                if (angular.isUndefined(vm.overlaySource)) {
                    vm.overlaySource = vm.sources[0];
                } else {
                    var newSource = vm.sources.filter(function(v) { return (v === vm.overlaySource); });
                    vm.overlaySource = (newSource.length === 1) ? newSource[0] : vm.sources[0];
                }

            
                if(typeof vm.overlaySource == "object")
                    vm.overlaySource = vm.overlaySource.name

                vm.overlayType = null
                var response = osApi.getDataSources()
                
                    vm.overlay_molecularTables = response.collections.filter(function(d){ return _.contains(acceptableDatatypes, d.type)})
                    vm.overlayTypes = _.pluck(vm.overlay_molecularTables, "name")

                    if (angular.isUndefined(vm.overlayType)) {
                        vm.overlayType = vm.overlayTypes[0];
                    } else {
                        var newSource = vm.overlayTypes.filter(function(v) { return (v === vm.overlayType); });
                        vm.overlayType = (newSource.length === 1) ? newSource[0] : vm.overlayTypes[0];
                    }
            
                var molecular_matches = vm.overlay_molecularTables.filter(function(d){return d.name == vm.overlayType })
                if(molecular_matches.length ==1){
                    vm.overlay = molecular_matches[0]  
                }

                var samples = "None";
                if(vm.temp.params.bool.cohort.use)
                    samples = osApi.getCohort().sampleIds;
                
            }

            var callOverlay = function(i){
                
                vm.error = ""

                var common_m = _.intersection(vm.overlay[i].data.types[vm.overlay[i].data.selected.i].m, vm.base.data.types[vm.base.data.selected.i].m)
                if(vm.base.params.bool.geneset.use){
                    var gIds = osApi.getGenesets().filter(function(g){return g.name == vm.base.params.bool.geneset.name})[0].geneIds
                    if(gIds.length >0 )
                        common_m = _.intersection(common_m, gIds)
                }
                    
                if(common_m.length == 0){
                    angular.element('#modal_intersection').modal();
                    vm.overlay[i].result.output = {}
                    osApi.setBusy(false)
                    return;
                }

                runOverlay(i);
            };
            var runOverlay = function(i){
                
                var geneset = vm.base.params.bool.geneset
                var gIds = []
                if(geneset.use)
                    gIds = osApi.getGenesets().filter(function(g){return g.name == geneset.name})[0].geneIds
                
                osApi.setBusy(true)
                Distancequery(vm.base.data.types[vm.base.data.selected.i].collection, vm.overlay[i].data.types[vm.overlay[i].data.selected.i].collection, gIds).then(function(response) {

                    var d = response.data;
                    if(angular.isDefined(d.reason)){
                        console.log(vm.base.data.types[vm.base.data.selected.i].collection +"+ "+vm.overlay[i].data.types[vm.overlay[i].data.selected.i].collection+": " + d.reason)
                        // Distance could not be calculated on geneset given current settings
                            window.alert("Sorry, Distance could not be calculated\n" + d.reason)

                        vm.overlay[i].result.output = {}
                        angular.element('#modalRun').modal('hide');
                        osApi.setBusy(false)
                        return;
                    }

                    //distances = _.pluck(d.D,"id")
                    angular.element('#modalRun').modal('hide');
                    var newData = calculateCentroid(d);
                    
                    
                    newData = newData.map(function(d){                  
                        d.layer= i
                        return d
                    })

                    //set overlay
                    vm.overlay[i].result.input = d.D
                    vm.overlay[i].result.output = newData
                    vm.overlay[i].edit = false

                    draw()
                    // update plot with new points
                });
            }
            
            var calculateCentroid = function(dist){
                //data= {id: overlay sample , d: [distance values], m:[mol_df ids]}
                
                // for each new overlay id, get ids for closest 3
                var num_compare = 3
                
    
                 var top3 = dist.D.map(function(s){ 
                    var indices = findIndicesOfMax(s.d, 3);
                    var match_ids = indices.map(function(i){return s.m[i]})
                    return {id:s.id, match: match_ids}
                //    return {"id":s.id, "match": s.m[]
                //         s.d.sort().slice((-1*num_compare),)
                //             .map(function(maxMatch){return s.m[_.indexOf(s.d,maxMatch)]} )}
                })
                
                
                // find positions in current plot & calculate centroid
                var scores = top3.map(function(s){ 
                    var match_scores = vm.base.result.output.filter(function(p){ return _.contains(s.match,p.id)})
                    var cent_scores = [0,0,0]
                    for(var i=0;i<match_scores.length;i++){
                        cent_scores[0] += match_scores[i][0]
                        cent_scores[1] += match_scores[i][1]
                        cent_scores[2] += match_scores[i][2]
                    }
                    var d = cent_scores.map(function(x){ return x/num_compare})
                    d.id = s.id;
                    
                    return d
                })

                //osApi.setCohort(_.pluck(scores, "id"), "centroid", "SAMPLE")
                return scores;

            }

            var draw = function() {

                data = vm.base.result.output
                for(var i =0; i<vm.overlay.length; i++){
                    if(angular.isDefined(vm.overlay[i].result.output.length))
                        data = data.concat(vm.overlay[i].result.output)
                }

                // Colorize
                setColors();

                // Size
                var layout = osApi.getLayout();
                width = $window.innerWidth - layout.left - layout.right;
                height = $window.innerHeight - 120; //10
                angular.element("#pca-chart").css({
                    "width": width + "px",
                    "padding-left": layout.left + "px"
                });

                d3Chart.attr("width", width).attr("height", height);
                d3Points.attr("width", width).attr("height", height);

                // Scale
                minMax = data.reduce(function(p, c) {
                    p.xMin = Math.min(p.xMin, c[0]);
                    p.xMax = Math.max(p.xMax, c[0]);
                    p.yMin = Math.min(p.yMin, c[1]);
                    p.yMax = Math.max(p.yMax, c[1]);
                    return p;
                }, {
                    xMin: Infinity,
                    yMin: Infinity,
                    xMax: -Infinity,
                    yMax: -Infinity
                });

                scaleX = d3.scaleLinear().domain([minMax.xMin, minMax.xMax]).range([50, width - 50]).nice();
                scaleY = d3.scaleLinear().domain([minMax.yMin, minMax.yMax]).range([50, height - 50]).nice();

                // Draw
                circles = d3Points.selectAll("circle").data(data);
                circles.enter().append("circle")
                    .attr("class", "pca-node")
                    .attr("cx", function(d) {
                        return scaleX(d[0]);
                    })
                    .attr("cy", function(d) {
                        return scaleY(d[1]);
                    })
                    .attr("r", 3)
                    .style("fill", function(d) {
                        return d.color;
                    })
                    .style("visibility", function(d){ return d.visibility});

                circles.exit()
                    .transition()
                    .duration(200)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .style("fill-opacity", "0")
                    .remove();
                circles
                    .style("fill", function(d) {
                        return d.color;
                    })
                    .transition()
                    .duration(750)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .attr("r", 3)
                    .attr("cx", function(d) {
                        return scaleX(d[0]);
                    })
                    .attr("cy", function(d) {
                        return scaleY(d[1]);
                    })
                    .style("fill", function(d) {
                        return d.color;
                    })
                    .style("fill-opacity", 0.8)
                    .style("visibility", function(d){ return d.visibility});

                // Axis
                axisX = d3.axisTop().scale(scaleX).ticks(3);
                axisY = d3.axisLeft().scale(scaleY).ticks(3);

                d3xAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(0, " + height * 0.5 + ")")
                    .call(axisX)
                    .append("text")
                    .attr("x", 50)
                    .attr("y", 15)
                    .text("PC1");

                d3yAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(" + width * 0.5 + ", 0)")
                    .call(axisY)
                    .append("text")
                    .attr("y", 55)
                    .attr("x", 25)
                    .text("PC2");

                lasso.items(d3Points.selectAll("circle"));
                d3Chart.call(lasso);
                
                setSelected();
                osApi.setBusy(false);

            }
                
            
            // Utility Functions
            var updatePatientCounts = function() {

                angular.element(".legend-count").text("");
                var selectedPatients = osApi.getCohort().sampleIds;

                if (selectedPatients.length === 0)
                   selectedPatients = data.map(function(d){
                    return d.id})

                var counts = data.filter(function(d){return selectedPatients.indexOf(d.id) !== -1}).reduce(function(p, c) {
                    var color = c.color;
                    if (!p.hasOwnProperty(color)) p[color] = 0;
                    p[color] += 1;
                    return p;
                }, {});

                Object.keys(counts).forEach(function(key) {
                    angular.element("#legend-" + key.substr(1)).text(" (" + this[key] + ")");
                }, counts);

            };
            function setSelected() {
                var selectedIds = osApi.getCohort().sampleIds
                
                if(typeof selectedIds != "undefined"){
                   d3Points.selectAll("circle").classed("pca-node-selected", function() {
                        return (selectedIds.indexOf(this.__data__.id) >= 0);
                    });
                }

            }
            function setColors() {

                // Set Legend
                vm.legendCaption = colors.name;
                vm.legendNodes = colors.data;

                // If No Color Specified
                if (colors.name == "Dataset") {
                    vm.legendNodes = [
                    {name: vm.base.title, color: vm.base.color, values: vm.base.result.output.map(function(d){ return d.id }), id: "legend-"+vm.base.color.substr(1)}   ]
                    vm.legendNodes = vm.legendNodes.concat(
                        vm.overlay.map(function(r) {
                            return angular.isUndefined(r.result.output.length) ?
                                null
                             :  {name: r.title, color: r.color, values: r.result.output.map(function(d){ return d.id }), id: "legend-"+r.color.substr(1)}}) 
                            .filter(function(r){return r != null})
                        )
                   
                    data.forEach(function(v) {
                            if(v.layer == -1){ v.color = vm.base.color }
                            else { v.color = vm.overlay[v.layer].color} })

                // Color Based On selected input
                } else {
                    var degMap = colors.data.reduce(function(p, c) {
                        for (var i = 0; i < c.values.length; i++) {
                            p[c.values[i]] = c.color;
                        }
                        return p;
                    }, {});
                    data = data.map(function(v) {
                        v.color = (angular.isDefined(this[v.id])) ? this[v.id] : "#DDD";
                        return v;
                    }, degMap);
                }    
            
                data.forEach(function(v) {
                    if(v.layer == -1){ v.visibility = vm.base.visibility }
                    else { v.visibility = vm.overlay[v.layer].visibility}
                });
                $timeout(updatePatientCounts);

            }
            var lasso_start = function() {

                lasso.items()
                    .attr("r", 3.5) // reset size
                    .classed("not_possible", true)
                    .classed("selected", false);
            };
            var lasso_draw = function() {


                // Style the possible dots
                lasso.possibleItems()
                    .classed("not_possible", false)
                    .classed("possible", true);

                // Style the not possible dot
                lasso.notPossibleItems()
                    .classed("not_possible", true)
                    .classed("possible", false);
            };
            var lasso_end = function() {

                // Reset the color of all dots
                lasso.items()
                    .classed("not_possible", false)
                    .classed("possible", false);

                var ids = lasso.selectedItems().data().map(function(d) {
                    return d.id;
                });
                osApi.setCohort(ids, "PCA", osApi.SAMPLE);

            };

            var lasso = d3.lasso()
                .closePathSelect(true)
                .closePathDistance(100)
                .targetArea(d3Chart)
                .on("start", lasso_start)
                .on("draw", lasso_draw)
                .on("end", lasso_end);

            
            
            // App Event :: Resize
            osApi.onResize.add(draw);

            // App Event :: Color change
            var onPatientColorChange = function(value) {
                colors = value;
                vm.showPanelColor = false;
                draw();
            };
            osApi.onPatientColorChange.add(onPatientColorChange);

            // App Event :: Cohort Change
            var onCohortChange = function(c) {
                setSelected();
            };
            osApi.onCohortChange.add(onCohortChange);
            osApi.onCohortChange.add(updatePatientCounts)


            osApi.query("lookup_oncoscape_datasources_v2", {
                dataset: osApi.getDataSource().dataset
            }).then(function(response){
                vm.temp.method = "PCA"
                vm.temp.title = vm.temp.method + "  (" + moment().format('hh:mm:ss') + ")";
                vm.temp.data.types = response.data[0].collections.filter(function(d){ return _.contains(acceptableDatatypes, d.type)})
                vm.temp.data.selected.i = 0;
                vm.temp.data.selected.name = vm.temp.data.types[vm.temp.data.selected.i].name;
                vm.temp.params.bool = { "geneset" : {name: osApi.getGeneset().name, use: true},
                                        "cohort"  : {name: osApi.getCohort().name, use: false } } 
                vm.temp.color = '#0096d5' 
                vm.temp.visibility = "visible"           
                
                vm.callBaseMethod();
            });

            // Destroy
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(draw);
                osApi.onPatientColorChange.remove(onPatientColorChange);
                osApi.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osPathways', pathways);

    /** @ngInject */
    function pathways() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/pathways/pathways.html',
            controller: PathwaysController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function PathwaysController(osApi, $state, $stateParams, $scope, $sce, $window, moment, cytoscape) {

            var markersNetwork;
            var vm = this;

            // Elements
            var elChart = angular.element("#pathways-chart");
            var csChart;

            vm.datasource = osApi.getDataSource();
            vm.search = "";
            vm.tip = null;
            vm.linkTitle = "";
            vm.links = [];

            vm.resize = function() {
                elChart.width('100%');
                elChart.height($window.innerHeight - 90);
                if (csChart) {
                    csChart.resize();
                    csChart.center();
                }
            };

            $scope.$watch('vm.search', function() {
                if (angular.isUndefined(csChart)) return;
                var term = vm.search.toUpperCase();
                var len = term.length;
                csChart.startBatch();
                csChart.nodes().map(function(ele) {
                    if (len === 0) {
                        ele.unselect();
                    } else if (ele.attr("name").substr(0, len) === term) {
                        ele.select();
                    } else {
                        ele.unselect();
                    }
                });
                csChart.endBatch();
            });

            // Load Datasets
            osApi.setBusy(true);
            osApi.query("render_pathways").then(function(result) {
                markersNetwork = result.data[0];

                csChart = cytoscape({
                        container: elChart,
                        elements: markersNetwork.elements,
                        style: getStyle(),
                        minZoom: 0.1,
                        maxZoom: 5,
                        zoom: 0.2,
                        wheelSensitivity: 0.5,
                        layout: {
                            name: "preset",
                            fit: true
                        }
                    })
                    .on('click', 'node', function(e) {
                        if (e.cyTarget.data().nodeType != "gene") return;
                        angular.element('#gbm-webpage').modal();
                        $scope.$apply(function() {
                            vm.frame = $sce.trustAsResourceUrl("https://www.genecards.org/cgi-bin/carddisp.pl?gene=" + e.cyTarget.data().id);
                        });
                    })
                    .on('click', 'edge', function(e) {

                        // links =[
                        //     { name: "PubMed Article", url:"https://www.ncbi.nlm.nih.gov/pubmed/?term=" + e.cyTarget.data().pmid },
                        //     { name: "PubMed Search",  url:"http://www.ncbi.nlm.nih.gov/pubmed/?term=(GENE "+e.cyTarget.data().source+") AND (GENE "+e.cyTarget.data().target+")"}
                        //     { name: e.cyTarget.data().source+"Gene Card", url: "https://www.genecards.org/cgi-bin/carddisp.pl?gene="+e.cyTarget.data().source}
                        //     { name: e.cyTarget.data().target+"Gene Card", url: "https://www.genecards.org/cgi-bin/carddisp.pl?gene="+e.cyTarget.data().target}
                        // ];
                        // $window.open("https://www.ncbi.nlm.nih.gov/pubmed/?term=" + e.cyTarget.data().pmid);
                        // $window.open("http://www.ncbi.nlm.nih.gov/pubmed/?term=(GENE "+e.cyTarget.data().source+") AND (GENE "+e.cyTarget.data().target+")");
                        // $window.open("https://www.genecards.org/cgi-bin/carddisp.pl?gene="+e.cyTarget.data().source);
                        // $window.open("https://www.genecards.org/cgi-bin/carddisp.pl?gene="+e.cyTarget.data().target);

                        angular.element('#gbm-webpage').modal();
                        $scope.$apply(function() {
                            vm.frame = $sce.trustAsResourceUrl("https://www.ncbi.nlm.nih.gov/pubmed/?term=" + e.cyTarget.data().pmid);
                        });

                    }).on('mouseover', 'edge', function(e) {
                        $scope.$apply(function() {
                            vm.tip = e.cyTarget.data().source + " Extract";
                        });

                        e.cyTarget.style({
                            'width': '4px'
                        });
                    }).on('mouseout', 'edge', function(e) {
                        $scope.$apply(function() {
                            vm.tip = null;
                        });
                        e.cyTarget.style({
                            'width': '2px'
                        });
                    }).on('mouseover', 'node', function(e) {
                        $scope.$apply(function() {
                            vm.tip = e.cyTarget.data().name + " Gene Card";
                        });
                    }).on('mouseout', 'node', function() {
                        $scope.$apply(function() {
                            vm.tip = null;
                        });
                    });

                vm.resize();
                osApi.setBusy(false);
            });

            function getStyle() {
                var darkblue = 'rgb(5, 108, 225)';
                var red = 'red'; //rgb(230, 44, 28)';
                var purple = 'rgb(56, 52,123)';
                var green = 'green'; //'rgb(56, 52,123)';//'rgb(28, 230,116)';//'green';
                return [{
                        'selector': 'node',
                        'style': {
                            'content': 'data(label)',
                            'text-valign': 'center',
                            'text-halign': 'center',
                            'shape': 'ellipse',
                            'width': '60px',
                            'height': '50px',
                            'color': darkblue,
                            'background-color': 'rgb(250, 250, 250)',
                            'border-width': '2px',
                            'border-color': darkblue

                        }
                    }, {
                        'selector': 'edge',
                        'style': {
                            'width': '2px',
                            'line-color': darkblue,
                            'line-style': 'solid'
                        }
                    },
                    // Boxes
                    {
                        'selector': 'node[nodeType="class"], node[nodeType="family"], node[nodeType="complex"]',
                        'style': {
                            'content': '',
                            'background-color': 'white',
                            'shape': 'roundrectangle'

                        }
                    },
                    // Blue Activiates & Indirect Activates
                    {
                        'selector': 'edge[edgeType="activates"], edge[edgeType="indirectly activates"]',
                        'style': {
                            'line-color': green,
                            'target-arrow-shape': 'triangle',
                            'target-arrow-color': green
                        }
                    },
                    // Inhibits & Ubiquitinylates
                    {
                        'selector': 'edge[edgeType="inhibits"], edge[edgeType="ubiquitinylates"]',
                        'style': {
                            'line-color': red,
                            'target-arrow-shape': 'tee',
                            'target-arrow-color': red
                        }
                    },
                    // Fusion
                    {
                        'selector': 'edge[edgeType="fusion"]',
                        'style': {
                            'line-color': green
                        }
                    },
                    // Hide
                    {
                        'selector': 'edge[edgeType="contains"]',
                        'style': {
                            'display': 'none'
                        }
                    }, {
                        'selector': 'node[nodeType="process"]',
                        'style': {}
                    }, {
                        'selector': 'node[nodeType="gene"]:selected',
                        'style': {
                            'overlay-opacity': '0.5',
                            'overlay-color': 'red'
                        }
                    },

                    // Legacy ... Not sure if it's being used
                    {
                        'selector': 'node[nodeType="rtk"]',
                        'style': {
                            'content': 'data(label)',
                            'background-color': 'rgb(224, 209, 178)',
                            'border-color': 'black',
                            'border-width': '0px',
                            'font-size': '48px',
                            'shape': 'roundrectangle',
                            'width': '40px',
                            'height': '160px'
                        }
                    }, {
                        'selector': 'node[nodeType="kinase"]',
                        'style': {
                            'content': 'data(label)',
                            'background-color': 'rgb(255, 206, 194)',
                            'shape': 'ellipse',
                            'width': '160px',
                            'height': '120px',
                            'font-size': '48px',
                            'border-color': 'black',
                            'border-width': '1px'
                        }
                    }, {
                        'selector': 'node[nodeType="dimer"]',
                        'style': {
                            'content': '',
                            'background-color': 'rgb(234, 219, 188)',
                            'shape': 'ellipse',
                            'width': '160px',
                            'height': '120px',
                            'font-size': '48px',
                            'border-color': 'black',
                            'border-width': '0px'
                        }
                    }, {
                        'selector': 'node[nodeType="loop"]',
                        'style': {
                            'content': '',
                            'background-color': 'rgb(255, 255, 255)',
                            'shape': 'ellipse',
                            'width': '160px',
                            'height': '120px',
                            'font-size': '48px',
                            'border-color': 'black',
                            'border-width': '1px',
                            'border-style': 'dotted'
                        }
                    }, {
                        'selector': 'node[nodeType="gtpase"]',
                        'style': {
                            'content': 'data(label)',
                            'background-color': 'rgb(194, 194, 255)',
                            'shape': 'ellipse',
                            'width': '160px',
                            'height': '120px',
                            'font-size': '48px',
                            'border-color': 'black',
                            'border-width': '1px'
                        }
                    }, {
                        'selector': 'node[nodeType="adaptor"]',
                        'style': {
                            'content': 'data(label)',
                            'background-color': 'rgb(77, 184, 255)',
                            'shape': 'ellipse',
                            'width': '60px',
                            'height': '120px',
                            'font-size': '48px',
                            'border-color': 'black',
                            'border-width': '1px'
                        }
                    }, {
                        'selector': 'node[nodeType="GEF"]',
                        'style': {
                            'content': 'data(label)',
                            'background-color': 'rgb(77, 184, 255)',
                            'shape': 'ellipse',
                            'width': '60px',
                            'height': '60px',
                            'font-size': '48px',
                            'border-color': 'black',
                            'border-width': '1px'
                        }
                    }, {
                        'selector': 'node[nodeType="process"]',
                        'style': {
                            'content': 'data(label)',
                            'background-color': 'rgb(255, 255, 255)',
                            'shape': 'roundrectangle',
                            'width': '100px',
                            'height': '40px',
                            'font-size': '24px',
                            'border-color': 'black',
                            'border-width': '0px'
                        }
                    }, {
                        'selector': 'node[nodeType="TF"]',
                        'style': {
                            'content': 'data(label)',
                            'background-color': 'rgb(255, 206, 94)',
                            'shape': 'diamond',
                            'width': '160px',
                            'height': '60px',
                            'font-size': '48px',
                            'border-color': 'black',
                            'border-width': '1px'
                        }
                    }, {
                        'selector': 'node[nodeType="gene fusion"]',
                        'style': {
                            'content': 'data(label)',
                            'shape': 'roundrectangle',
                            'font-size': '24px',
                            'border-color': 'red',
                            'border-width': '3px'
                        }
                    }, {
                        'selector': 'edge:selected',
                        'style': {
                            'overlay-color': 'grey',
                            'overlay-opacity': '0.3'
                        }
                    }, {
                        'selector': 'edge[edgeType="recruits"]',
                        'style': {
                            'width': '2px'
                        }
                    }, {
                        'selector': 'edge[edgeType="fusion"]',
                        'style': {
                            'line-color': purple
                        }
                    }, {
                        'selector': 'edge[edgeType="recruits"]',
                        'style': {
                            'line-color': 'red',
                            'width': '1px',
                            'line-style': 'dashed',
                            'target-arrow-shape': 'triangle',
                            'target-arrow-color': 'black'
                        }
                    }, {
                        'selector': 'edge[edgeType="cycles"]',
                        'style': {
                            'line-color': 'black',
                            'width': '1px',
                            'line-style': 'dashed',
                            'target-arrow-shape': 'triangle',
                            'source-arrow-shape': 'triangle',
                            'target-arrow-color': 'green',
                            'source-arrow-color': 'red'
                        }
                    }, {
                        'selector': 'edge[edgeType="associates"]',
                        'style': {
                            'line-color': 'black',
                            'width': '1px',
                            'line-style': 'solid'
                        }
                    }, {
                        'selector': 'edge[edgeType="activation"]',
                        'style': {
                            'line-color': 'green',
                            'width': '1px'
                        }
                    }, {
                        'selector': 'edge[edgeType="inhibition"]',
                        'style': {
                            'line-color': 'red',
                            'width': '1px'
                        }
                    }
                ];
            }

            // Listen For Resize
            osApi.onResize.add(vm.resize);

        }
    }
})();
(function() {
  'use strict';

  angular
      .module('oncoscape')
      .directive('osParallelcoord', parallelcoord);

  /** @ngInject */
  function parallelcoord() {

    var directive = {
        restrict: 'E',
        templateUrl: 'app/components/parallelcoord/parallelcoord.html',
        controller: ParallelcoordController,
        controllerAs: 'vm',
        bindToController: true
    };

    return directive;

    /** @ngInject */
    function ParallelcoordController(osApi, $state, $timeout, $window, d3, _) {

      var vm = this;
      osApi.setBusy(false)
      vm.datasource = osApi.getDataSource();

      vm.zoom = 1000000 // 1 MB
      vm.gene = "MYC"
      var samples = osApi.getCohort().sampleIds;
      samples = ["TCGA-OL-A66H-01", "TCGA-3C-AALK-01", "TCGA-AR-A1AH-01", "TCGA-AC-A5EH-01", "TCGA-EW-A2FW-01"]

      // Elements
      var d3Chart = d3.select("#parallelcoord-chart").append("svg");
      var genes;

      // Properties
      var scaleX, scaleY, axisX, axisY;
      var data, minMax;
      var width, height;

      var draw = function(){ 
        
        // Size
        var layout = osApi.getLayout();
        width = $window.innerWidth - layout.left - layout.right;
        height = $window.innerHeight - 150; //10
        angular.element("#parallelcoord-chart").css({
            "width": width + "px",
            "padding-left": layout.left + "px"
        });

        d3Chart.attr("width", width).attr("height", height);
        
        // Scale
        // scaleX = d3.scaleLinear().domain([minMax.xMin, minMax.xMax]).range([50, width - 50]).nice();
        // scaleY = d3.scaleLinear().domain([minMax.yMin, minMax.yMax]).range([50, height - 50]).nice();

 
        var x = d3.scalePoint().domain(vm.genes).range([75, width - 75]),
            y = {};
        
        var line = d3.line(),
            axis = d3.axisLeft(x),
            foreground;
  
        // Create a scale and brush for each gene.
        vm.genes.forEach(function(d) {
          // Coerce values to numbers.
          data.forEach(function(p) { p[d] = +p[d]; });
      
          y[d] = d3.scaleLinear()
              .domain(d3.extent(data, function(p) { return p[d]; }))
              .range([height, 0]);
      
          // y[d].brush = d3.svg.brush()
          //     .y(y[d])
          //     .on("brush", brush);
        });
  
        // Add a legend.
        // var legend = d3Chart.selectAll("g.legend")
        //     .data(samples)
        //   .enter().append("svg:g")
        //     .attr("class", "legend")
        //     .attr("transform", function(d, i) { return "translate(0," + (i * 20 + 584) + ")"; });
      
        // legend.append("svg:line")
        //     .attr("class", String)
        //     .attr("x2", 8);
      
        // legend.append("svg:text")
        //     .attr("x", 12)
        //     .attr("dy", ".31em")
        //     .text(function(d) { return d; });
      
        // Add foreground lines.
        foreground = d3Chart.append("g")
            .attr("class", "foreground")
          .selectAll("path")
            .data(data)
          .enter().append("path")
            .attr("d", path)
            .attr("stroke", "#000")
            .attr("class", function(d) { return "cohort"; });
  
        // Add a group element for each gene.
        genes = d3Chart.selectAll(".gene")
            .data(vm.genes)
            
        var g=  genes.enter().append("g")
            .attr("class", "gene")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            // .call(d3.drag()
            // .origin(function(d) { return {x: x(d)}; })
            // .on("dragstart", dragstart)
            // .on("drag", drag)
            // .on("dragend", dragend));
        
            genes.exit().remove()
            
            genes
            .attr("class", "gene")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        
        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
          .append("text")
            .attr("text-anchor", "middle")
            .attr("y", -9)
            .text(String);
  
        // Add a brush for each axis.
        // g.append("g")
        //     .attr("class", "brush")
        //     .each(function(d) { d3.select(this).call(y[d].brush); })
        //   .selectAll("rect")
        //     .attr("x", -8)
        //     .attr("width", 16);
  
        // function dragstart(d) {
        //   i = vm.genes.indexOf(d);
        // }
  
        // function drag(d) {
        //   x.range()[i] = d3.event.x;
        //   vm.genes.sort(function(a, b) { return x(a) - x(b); });
        //   g.attr("transform", function(d) { return "translate(" + x(d) + ")"; });
        //   foreground.attr("d", path);
        // }
  
        // function dragend(d) {
        //   x.domain(vm.genes).rangePoints([0, w]);
        //   var t = d3.transition().duration(500);
        //   t.selectAll(".gene").attr("transform", function(d) { return "translate(" + x(d) + ")"; });
        //   t.selectAll(".foreground path").attr("d", path);
        // }

        // Returns the path for a given data point.
        function path(d) {
          return line(vm.genes.map(function(p) { return [x(p), y[p](d[p])]; }));
        }

        // Handles a brush event, toggling the display of foreground lines.
        function brush() {
          var actives = vm.genes.filter(function(p) { return !y[p].brush.empty(); }),
              extents = actives.map(function(p) { return y[p].brush.extent(); });
          foreground.classed("fade", function(d) {
            return !actives.every(function(p, i) {
              return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            });
          });
        }
       
        osApi.setBusy(false);
      }
    
  
      

      vm.updateGene = function() {
              var test = vm.gene
              callGeneRegion()
      };
    
      var callGeneRegion = function(){

        osApi.query("lookup_hg19_genepos_minabsstart", {m: vm.gene}).then(function(response){
          var d = response.data
          if(d.length >0){
            vm.chr = d[0].chr
            osApi.query("lookup_hg19_genepos_minabsstart", {chr: vm.chr, pos: {$lt: d[0].pos + vm.zoom, $gt: d[0].pos - vm.zoom}}).then(function(resp){
              vm.genes_in_region = resp.data
              vm.genes =  _.pluck(vm.genes_in_region,"m" )
              osApi.query("brca_gistic2_ucsc-xena", {m: {$in:vm.genes}}).then(function(r){
                var molecular = r.data
                var sampleIdx = _.range(0,molecular[0].s.length)

                if(samples.length !=0){ 
                    sampleIdx = molecular[0].s.map(function(s, i){
                        var matchS = _.contains(samples, s) ? i : -1
                        return matchS})
                }else{
                  samples = molecular[0].s
                }
                vm.genes =  _.pluck(molecular, "m")

                var tbl = jStat.transpose(molecular.map(function(g){return  g.d.filter(function(r, i){return _.contains(sampleIdx, i)})}))
                data = tbl.map(function(s, i){ var v =_.object( vm.genes,s); v["sample"] = samples[i]; return v }) 
                
                
                draw();
              });
            });
          }
        });
      }


      // Setup Watches

      // $scope.$watch('vm.gene', function() {
        //runs with every keystroke
      //     if (vm.gene === null) return;
      //     callGeneRegion()

      // });

      // App Event :: Resize
      osApi.onResize.add(draw);

      callGeneRegion();
        
    }  //end Controller
  }  //end parallelcoord() 
})();
(function () {
    'use strict';

    angular
        .module('oncoscape')
        .service('osSound', osSound);

    /** @ngInject */
    function osSound() {

        var _beep = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");

        function beep() {
            _beep.play();
        }

        return {
            beep: beep
        }
    }
})();

 (function() {
     'use strict';

     angular
         .module('oncoscape')
         .factory('osHttp', oncoscape);

     /** @ngInject */
     function oncoscape($http) {
         //window.collections = {};
         var url = "/api/";
         url = "https://dev.oncoscape.sttrcancer.io/api/";
         //  url = "https://oncoscape-test.fhcrc.org/api/";

         var queryString = function(req) {
             //window.collections[req.table] = 1;
             var query = url + req.table;
             if (angular.isDefined(req.query)) query += "/" + encodeURIComponent(angular.toJson(req.query));
             // what if query size too large??
             return query;
         };
         
      //   var jwt = ""

         var query = function(req) {
             return $http({
                 method: 'GET',
                 url: queryString(req),
                 headers: {
                     apikey: 'password'
                     //, authentication: jwt
                 }
             });
         };

         // Return Object
         return {
             queryString: queryString,
             query: query
         };
     }
 })();

(function() {
    'use strict';
    angular.module('oncoscape').directive('ngEnter', function() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if (event.which === 13) {
                    scope.$apply(function() {
                        scope.$eval(attrs.ngEnter);
                    });

                    event.preventDefault();
                }
            });
        };
    });
    /*
        angular
            .module('oncoscape')
            .provider({
                $exceptionHandler:
    */
    /** @ngInject */
    /*        
            function exceptionFactory(){
            	var handler = function (exception, cause){
                    window.alert("Oh Snap!  An error occured.  View console for details")
                    console.log(exception);
                    exception.stack();
                    if (angular.isDefined(cause)) console.log(cause);
            	}
                this.$get = function() { return handler; };
            }
           });
    */

})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osAuth', osAuth);

    /** @ngInject */
    function osAuth(osHttp, $http, signals, $location, auth, osApi) {

        // Events
        var onLogin = new signals.Signal(); // Fired When Data Changes
        var onLogout = new signals.Signal(); // Fired When Selection changes

        // User Object
        var _user = null;
        var getUser = function() {
            return _user;
        };
        var _datasets = null;
        var getDatasets = function() {
            return _datasets;
        };
        var setDatasets = function(datasets) {
            _datasets = datasets;
        };
        var isAuthenticated = function() {
            return _user != null;
        };

        // Authentication Sources
        var authSource = null;
        var authSources = [{
            id: 'guest',
            name: 'Guest',
            icon: 'fa fa-user'
        }, {
            id: 'google',
            name: 'Google',
            icon: 'fa fa-google-plus',
            // key: '428912153446-7c82srcvu1bk1nramiqqctne005epl6s.apps.googleusercontent.com',
            //key: '1098022410981-p7n5ejjji8qlvdtff274pol54jo5i8ks.apps.googleusercontent.com',
            key: '459144121975-lp2p5kahpqahm2gffgtl31vv0nes9hj4.apps.googleusercontent.com',
            mode: 'implicit'
        }, {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: 'fa fa-linkedin',
            key: '7869gkuwwnacez',
            mode: 'explicit'
        }];

        /*}, {
            id: 'facebook',
            name: 'Facebook',
            icon: 'fa fa-facebook',
            key: '142281766208909',
            mode: 'implicit'
        }, {
            id: 'github',
            name: 'GitHub',
            icon: 'fa fa-github-alt',
            key: '78b5dbe2ba756151169e',
            mode: 'explicit'
        },{
            id: 'instagram',
            name: 'Instagram',
            icon: 'fa fa-instagram',
            key: '3578c1b7c8c248c6ba80784b9ede0c52',
            mode: 'implicit'
        }, {
            id: 'linkedin',
            name: 'LinkedIn',
            icon: 'fa fa-linkedin',
            key: '7869gkuwwnacez',
            mode: 'explicit'
        }, {
            id: 'twitter',
            name: 'Twitter',
            icon: 'fa fa-twitter',
            key: 'vrbGiMB0LCtuHeShKE6v5IIFa',
            mode: 'implicit'
        }, {
            id: 'windows',
            name: 'Win Live',
            icon: 'fa fa-windows',
            key: 'caee23ac-d4aa-41c7-9bda-166b86c52de3',
            mode: 'implicit'
        }, {
            id: 'dropbox',
            name: 'Dropbox',
            icon: 'fa fa-dropbox',
            key: 'dropbox',
            mode: 'implicit'
        }, {
            id: 'flickr',
            name: 'Flickr',
            icon: 'fa fa-flickr',
            key: '',
            mode: 'implicit'
        }*/

        var getAuthSources = function() {
            return authSources;
        };

        var loginGuest = function() {
            _user = {
                network: 'guest',
                id: 'x',
                name: 'Guest',
                thumb: 'Guest.png'
            };
            osApi.init().then(function() {
                onLogin.dispatch();
            });
        }
        var login = function(source) {
            if (source.id == 'guest') {
                _user = {
                    network: 'guest',
                    id: 'x',
                    name: 'Guest',
                    thumb: 'Guest.png'
                };
            
                onLogin.dispatch();
                
                return;
            }
            auth().login(source.id, {
                // response_type: 'code',
                display: 'popup',
                response_type: 'token',
                scope: 'email',
                force: true
            });
            onLogin.dispatch();
        };

        var logout = function() {
            _user = null
            _datasets = null;
            auth().logout(authSource, {
                force: false
            }, onLogout.dispatch);
        };

        auth.init(
            authSources.reduce(function(prev, curr) {
                prev[curr.id] = curr.key;
                return prev;
            }, {}), {
                oauth_proxy: '/api/auth',
                redirect_uri:'/'
                //redirect_uri: 'https://dev.oncoscape.sttrcancer.io/'
            }
        );

        auth.on('auth.login', function(e) {
            osApi.setBusy();
            authSource = e.network;
            auth(authSource).api("/me", "get", null, function(e) {
                _user = {
                    network: authSource,
                    id: e.id,
                    name: e.name,
                    thumb: e.thumbnail,
                    email: e.email
                };
                osApi.init().then(function() {    
                    onLogin.dispatch(_user);
                });
            });
        });

        return {
            isAuthenticated: isAuthenticated,
            loginGuest: loginGuest,
            getUser: getUser,
            getAuthSources: getAuthSources,
            setDatasets : setDatasets,
            getDatasets : getDatasets,
            login: login,
            logout: logout,
            onLogin: onLogin,
            onLogout: onLogout
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', osApi);

    /** @ngInject */
    function osApi(osHttp, $http, signals, $location, $q, jStat, $, $window, _, moment) {

        // Events
        var onDataSource = new signals.Signal();
        var onResize = new signals.Signal();
        var onNavChange = new signals.Signal();
        var onCohortToolInfo = new signals.Signal();
        var onCohortChange = new signals.Signal();
        var onCohortsChange = new signals.Signal();
        var onGenesetToolInfo = new signals.Signal();
        var onGenesetChange = new signals.Signal();
        var onGenesetsChange = new signals.Signal();
        var onPatientColorChange = new signals.Signal();
        var onshowGenesetImportChange= new signals.Signal();

        // Resize
        angular.element($window).bind('resize', _.debounce(onResize.dispatch, 900));

        // Layout Metrics
        var getLayout = function() {
            var rt = angular.element(".tray-right").attr("locked");
            if (angular.isUndefined(rt)) rt = "true";
            return {
                left: (angular.element('#collectionpanel-lock').attr("locked") == "true") ? 300 : 0,
                right: (rt === "true") ? 300 : 0
            };
        };
        var setBusy = function(value) {
            if (value) {
                angular.element(".loader-modal").show();
            } else {
                angular.element(".loader-modal").hide();
            }
        };


        // Factories
        var statsFactory = (function(jStat) {

            var km = (function(jStat) {

                var pluck,
                    uniq,
                    sortBy,
                    groupBy,
                    last,
                    find;

                function multiply(a, b) {
                    var r = jStat.multiply(a, b);
                    return r.length ? r : [
                        [r]
                    ];
                }

                function transpose(a) {
                    var r = jStat.transpose(a);
                    return r[0].length ? r : [r];
                }

                function timeTable(tte, ev) {
                    var exits = sortBy(tte.map(function(x, i) { return { tte: x, ev: ev[i] }; }), 'tte'), // sort and collate
                        uexits = uniq(pluck(exits, 'tte'), true), // unique tte
                        gexits = groupBy(exits, function(x) { return x.tte; }); // group by common time of exit
                    return uexits.reduce(function(a, tte) { // compute d_i, n_i for times t_i (including censor times)
                        var group = gexits[tte],
                            l = last(a) || { n: exits.length, e: 0 },
                            events = group.filter(function(x) { return x.ev; });

                        a.push({
                            n: l.n - l.e, // at risk
                            e: group.length, // number exiting
                            d: events.length, // number events (death)
                            t: group[0].tte // time
                        });
                        return a;
                    }, []);
                }

                function compute(tte, ev) {
                    var dini = timeTable(tte, ev);
                    return dini.reduce(function(a, dn) { // survival at each t_i (including censor times)
                        var l = last(a) || { s: 1 };
                        if (dn.d) { // there were events at this t_i
                            a.push({ t: dn.t, e: true, s: l.s * (1 - dn.d / dn.n), n: dn.n, d: dn.d, rate: dn.d / dn.n });
                        } else { // only censors
                            a.push({ t: dn.t, e: false, s: l.s, n: dn.n, d: dn.d, rate: null });
                        }
                        return a;
                    }, []);
                }

                function expectedObservedEventNumber(si, tte, ev) {
                    var data = timeTable(tte, ev),
                        expectedNumber,
                        observedNumber,
                        dataByTimeTable = [];

                    si = si.filter(function(item) { return item.e; });

                    expectedNumber = si.reduce(function(memo, item) {
                        var pointerInData = find(data, function(x) { return (x.t >= item.t); });

                        if (pointerInData) {
                            var expected = pointerInData.n * item.rate;
                            dataByTimeTable.push(pointerInData);
                            return memo + expected;
                        } else {
                            return memo;
                        }

                    }, 0);

                    observedNumber = ev.filter(function(x) { return x; }).length;

                    return {
                        expected: expectedNumber,
                        observed: observedNumber,
                        dataByTimeTable: dataByTimeTable,
                        timeNumber: dataByTimeTable.length
                    };
                }

                function covariance(allGroupsRes, OETable) {
                    var vv = jStat.zeros(OETable.length),
                        i, j, //groups
                        t, //timeIndex
                        N, //total number of samples
                        Ki, Kj, // at risk number from each group
                        n; //total observed

                    for (i = 0; i < OETable.length; i++) {
                        for (j = i; j < OETable.length; j++) {
                            for (t = 0; t < allGroupsRes.length; t++) {
                                N = allGroupsRes[t].n;
                                n = allGroupsRes[t].d;
                                if (t < OETable[i].timeNumber && t < OETable[j].timeNumber) {
                                    Ki = OETable[i].dataByTimeTable[t].n;
                                    Kj = OETable[j].dataByTimeTable[t].n;
                                    // when N==1: only 1 subject, no variance
                                    if (i !== j && N !== 1) {
                                        vv[i][j] -= n * Ki * Kj * (N - n) / (N * N * (N - 1));
                                        vv[j][i] = vv[i][j];
                                    } else if (N !== 1) { // i==j
                                        vv[i][i] += n * Ki * (N - Ki) * (N - n) / (N * N * (N - 1));
                                    }
                                }
                            }
                        }
                    }
                    return vv;
                }

                // This might be the mis-named.
                function solve(a, b) {
                    var bT = transpose(b),
                        aInv = jStat.inv(a);
                    return multiply(multiply(b, aInv), bT);
                }

                function allGroupsKm(groups) {
                    var tte = [].concat.apply([], pluck(groups, 'tte')),
                        ev = [].concat.apply([], pluck(groups, 'ev'));
                    return compute(tte, ev).filter(function(t) { return t.e; });
                }

                // allGroupsRes: km of all groups combined?
                // groupedDataTable: [{tte, ev}, ...]
                function logranktest(groupedDataTable) {
                    var allGroupsRes = allGroupsKm(groupedDataTable),
                        pValue = 1,
                        KMStats,
                        dof, // degree of freedom
                        OETable,
                        OMinusEVector, // O-E
                        vv; //covariant matrix

                    // Table of observed and expected events, for each group.
                    OETable = groupedDataTable
                        .map(function(v) { return expectedObservedEventNumber(allGroupsRes, v.tte, v.ev); })
                        .filter(function(r) { return r.expected; });

                    // Find O-E and covariance, and drop one dimension from each
                    OMinusEVector = OETable.map(function(r) { return r.observed - r.expected; }).slice(1);
                    vv = covariance(allGroupsRes, OETable).slice(1).map(function(r) { return r.slice(1); }); // drop 1st row & 1st column

                    dof = OETable.length - 1;

                    if (dof > 0) {
                        KMStats = solve(vv, [OMinusEVector])[0][0];
                        pValue = 1 - jStat.chisquare.cdf(KMStats, dof);
                    }

                    return {
                        dof: dof,
                        KMStats: KMStats,
                        pValue: pValue
                    };
                }

                var exports = {
                    init: function(obj) {
                        pluck = obj.pluck;
                        uniq = obj.uniq;
                        sortBy = obj.sortBy;
                        groupBy = obj.groupBy;
                        last = obj.last;
                        find = obj.find;
                        return exports; // return the module for convenience of the caller
                    },
                    compute: compute,
                    expectedObservedEventNumber: expectedObservedEventNumber,
                    logranktest: logranktest
                };
                return exports;
            })(jStat).init(_);

            function getNumericStats(patients, attribute) {
                var len = patients.length;
                var bin =
                    (len < 2) ? 1 :
                    (len < 6) ? 2 :
                    (len < 9) ? 3 :
                    (len < 18) ? 6 :
                    (len < 36) ? 8 :
                    10;

                var props = patients.map(function(pd) {
                    return pd[attribute];
                });

                var data = {
                    type: "numeric",
                    min: jStat.min(props),
                    max: jStat.max(props),
                    range: jStat.range(props),
                    sd: jStat.stdev(props),
                    count: 0,
                    hist: jStat.histogram(props, bin),
                    histRange: [],
                    bins: bin
                };

                data.histRange = [jStat.min(data.hist), jStat.max(data.hist)];
                data.count = data.hist.reduce(function(p, c) { p += c; return p; }, 0);

                bin = Math.round(data.range / bin);
                data.hist = data.hist.map(function(pt) {
                    var rv = {
                        label: this.start + "-" + (this.start + this.bin),
                        value: pt
                    };
                    this.start += this.bin;
                    return rv;
                }, {
                    bin: bin,
                    start: data.min
                });
                return data;
            }

            function getFactorStats(patients, attribute) {

                var props = patients.map(function(pd) {
                    return pd[attribute];
                });
                var factors = props
                    .reduce(function(prev, curr) {
                        prev[curr] = (prev.hasOwnProperty(curr)) ? prev[curr] + 1 : 1;
                        return prev;
                    }, {});

                factors = Object.keys(factors).map(function(key) {
                    return {
                        label: key,
                        value: this.factors[key]
                    };
                }, {
                    factors: factors
                });

                var values = factors.map(function(v) {
                    return v.value;
                });
                var data = {
                    type: "factor",
                    min: jStat.min(values),
                    max: jStat.max(values),
                    range: jStat.range(values),
                    sd: jStat.stdev(values),
                    count: 0,
                    hist: factors,
                    histRange: [],
                    bins: factors.length
                };
                data.histRange = [data.min, data.max];
                data.count = data.hist.reduce(function(p, c) { p += c.value; return p; }, 0);
                return data;
            }

            var createHistogram = function(ids, data) {

                // Transform Ids Into Clinical Records + Remove Nulls
                var clinical = ids.map(function(v) {
                    var patient = this[v];
                    if (patient === null) return null;
                    return patient.clinical;
                }, data.patientMap).filter(function(v) { return v != null; })

                return {
                    total: Object.keys(data.patientMap).length,
                    selected: clinical.length,
                    features: [{
                            label: "Age At Diagnosis",
                            data: getNumericStats(clinical, "age_at_diagnosis"),
                            prop: "age_at_diagnosis",
                            type: "numeric"
                        },
                        //{label: "Death", data:getNumericStats(data,"days_to_death"), prop:"days_to_death" , type:"numeric"},
                        {
                            label: "Gender",
                            data: getFactorStats(clinical, "gender"),
                            prop: "gender",
                            type: "factor"
                        }, {
                            label: "Race",
                            data: getFactorStats(clinical, "race"),
                            prop: "race",
                            type: "factor"
                        }, {
                            label: "Ethnicity",
                            data: getFactorStats(clinical, "ethnicity"),
                            prop: "ethnicity",
                            type: "factor"
                        }, {
                            label: "Vital",
                            data: getFactorStats(clinical, "status_vital"),
                            prop: "status_vital",
                            type: "factor"
                        }, {
                            label: "Disease Status",
                            data: getFactorStats(clinical, "last_known_disease_status"),
                            prop: "last_known_disease_status",
                            type: "factor"
                        }
                    ]
                };
            };

            var createSurvival = function(ids, data, cohortAll) {

                // Transform Ids Into Survival Records + Remove Nulls
                var survival = ids.map(function(v) {
                        var patient = this[v];
                        if (patient === null) return null;
                        return patient.survival;
                    }, data.patientMap)
                    .filter(function(v) { return angular.isDefined(v); });

                if (survival.length == 0) return null;

                /*
                Transform Survival Records Into KM Data The Result Is A Value Object Containing The Following
                t = time in days
                c = array of censored patient ids
                d = array of dead patient ids
                n = numer of patients remaining
                s = survival rate
                p = previous survival rate
                */
                var te = survival.reduce(function(p, c) {
                    p.tte.push(c.tte);
                    p.ev.push(c.ev);
                    return p;
                }, { tte: [], ev: [] });

                var compute = km.compute(te.tte, te.ev)
                    .map(function(r) { return _.omit(r, ['rate', 'e', 'n', 'd']); })
                compute.forEach(function(c) {
                    var cd = this.survival.reduce(function(p, c) {
                        if (p.time == c.tte) p[c.ev ? "d" : "c"].push(c.pid);
                        return p;
                    }, { c: [], d: [], time: c.t });
                    c.c = cd.c;
                    c.d = cd.d;
                }, { survival: survival });


                var lrt = (cohortAll === null) ? { "KMStats": "NA", "pValue": "NA", dof: "NA" } :
                    km.logranktest([te, cohortAll.survival.data]);

                var rv = {
                    data: te,
                    compute: compute,
                    logrank: lrt
                };

                var firstEvent = rv.compute[0];
                if (firstEvent.s !== 1 || firstEvent.t !== 0) {
                    rv.compute.unshift({ c: [], d: [], s: 1, t: firstEvent.t });
                    rv.compute.unshift({ c: [], d: [], s: 1, t: 0 });
                }

                return rv;
            };

            return {
                km: km,
                createHistogram: createHistogram,
                createSurvival: createSurvival
            };
        })(jStat);


        // Properties
        var _dataSources; // All Data Sources
        var _dataSource; // Selected Data Source
        var _toolsAll; // List of All Tools
        var _tools; // List of Tools For DataSource
        var _data = null; // This is the clinical and sample to patient mapping data.
        var _hugoMap = null; // Hugo Gene sybol map to alias
        var _cohortAll; // Precalculated Cohort of All Patients / Samples
        var _cohorts = null; // Collection of Cohorts
        var _cohort = null; // Selected Cohorts
        var _genesetAll; // Precalculated Geneset of All Symbols
        var _genesets = null; // Collection of Genesets
        var _geneset = null; // Selected Genesets
        var _patientColor;
        var _cohortToolInfo = { 'numSamples': 500, 'numPatients': 500 };
        var _cohortDatasetInfo = { 'numSamples': 0, 'numPatients': 0 };
        var _genesetToolInfo = { 'numGenes': 0, 'numSymbols': 0 };
        var _showGenesetImport = false;
     //   var _genesetDatasetInfo = { 'numGenes': 0, 'numSymbols': 0, 'url': '', 'desc':''  };

        var getTools = function() { return _tools; };
        var getCohorts = function() { return _cohorts; };
        var getCohort = function() { return _cohort; };
        var getCohortToolInfo = function() { return _cohortToolInfo; };
        var getCohortDatasetInfo = function() { return _cohortDatasetInfo; };
        var getGenesets = function() { return _genesets; };
        var getGeneset = function() { return _geneset; };
        var getGenesetAll = function() { return _genesetAll; };
        var getGenesetToolInfo = function() { return _genesetToolInfo; };
    //    var getGenesetDatasetInfo = function() { return _genesetDatasetInfo; };
        var getData = function() { return _data; };
        var getPatientColor = function() { return _patientColor; };
        var getDataSources = function() { return _dataSources; };
        var getDataSource = function() { return _dataSource; };
        var setPatientColor = function(patientColor) {
            _patientColor = patientColor;
            onPatientColorChange.dispatch(patientColor);
        };
        var setCohortToolInfo = function(cohortToolData) {
            _cohortToolInfo = cohortToolData;
            onCohortToolInfo.dispatch(_cohortToolInfo);
        };
        var setGenesetToolInfo = function(genesetToolData) {
            _genesetToolInfo = genesetToolData;
            onGenesetToolInfo.dispatch(_genesetToolInfo);
        };
        var setDataSource = function(value) {

            return new Promise(function(resolveDataSource) {

                // Set Data Source Object Using String or Object
                if (angular.isObject(value)) {
                    if (_dataSource === value) {
                        resolveDataSource();
                        return;
                    }
                    _dataSource = value;
                } else if (angular.isString(value)) {
                    if (_dataSource.dataset === value) {
                        resolveDataSource();
                        return;
                    }
                    _dataSource = _dataSources.filter(function(v) {
                        return v.dataset == this.key;
                    }, {
                        key: value
                    })[0];
                }

                // Update What Tools Are Availible Based On Data Sources
                _tools = _toolsAll.filter(function(item) {
                    return (_dataSource.tools.indexOf(item.route) !== -1);
                }).sort(function(a, b) {
                    if (a.name < b.name) return -1;
                    if (a.name > b.name) return 1;
                    return 0;
                });


                // Load Sample Maps
                Promise.all([query(_dataSource.dataset +"_samplemap", {}),
                             query("phenotype_wrapper",{"dataset":_dataSource.dataset}), 
                             query(_dataSource.dataset + "_phenotype", {}),
                             query("lookup_oncoscape_datasources_v2", {"dataset":_dataSource.dataset})]).then(function(responses) {
                    var data = {};

                    _dataSource.collections = responses[3].data[0].collections
                    // Map of Samples To Patients
                    data.sampleMap = responses[0].data[0];

                    // Map of Patients To Samples + Clinical Using Samples Ids
                    data.patientMap = Object.keys(data.sampleMap).reduce(function(p, c) {
                        var patient = data.sampleMap[c];
                        var sample = c;
                        if (p.hasOwnProperty(patient)) {
                            p[patient].samples.push(sample);
                        } else {
                            p[patient] = { samples: [sample] };
                        }
                        return p;
                    }, {});

                    // wrapper configuration
                    data.wrapper = responses[1].data[0]

                    // add phenotype data to patient map
                    responses[2].data.reduce(function(p, c) {
                        if (p.hasOwnProperty(c[data.wrapper.req.patient_id])) {
                            p[c[data.wrapper.req.patient_id]].clinical = c;
                        } else {
                            p[c[data.wrapper.req.patient_id]] = { clinical: c, samples: [] };
                        }
                        return p;
                    }, data.patientMap);

                    _cohortDatasetInfo.numSamples = Object.keys(data.sampleMap).length;
                    _cohortDatasetInfo.numPatients = Object.keys(data.patientMap).length;

                    // Survival Data
                    responses[2].data.map(function(v) {

                        // No Status - Exclude
                        if (!v.hasOwnProperty(data.wrapper.req.status_vital)) return null;
                        if (v[data.wrapper.req.status_vital] === null) return null;

                        // Get Time - Or Exclude
                        var status = v[data.wrapper.req.status_vital].toString().trim().toUpperCase();
                        var time;
                        if (status == "ALIVE") { // Alive = Sensor 2
                            if (!v.hasOwnProperty(data.wrapper.req.days_to_last_followup)) return null;
                            time = parseInt(v[data.wrapper.req.days_to_last_followup]);
                            if (time < 0) time = 0;
                            if (isNaN(time)) return null;
                            return { pid: v[data.wrapper.req.patient_id], ev: false, tte: time };
                        }
                        if (status == "DEAD") { // Dead = Sensor 1
                            if (!v.hasOwnProperty(data.wrapper.req.days_to_death)) return null;
                            time = parseInt(v[data.wrapper.req.days_to_death]);
                            if (time < 0) time = 0;
                            if (isNaN(time)) return null;
                            return { pid: v[data.wrapper.req.patient_id], ev: true, tte: time };
                        }
                        return null;
                    }).reduce(function(p, c) {
                        if (c !== null) {
                            p[c.pid].survival = c;
                        }
                        return p;
                    }, data.patientMap);

                    _data = data;
                    _cohortAll = {
                        color: '#039BE5',
                        patientIds: [],
                        sampleIds: [],
                        name: 'All Patients + Samples',
                        histogram: statsFactory.createHistogram(Object.keys(data.patientMap), data),
                        survival: statsFactory.createSurvival(Object.keys(data.patientMap), data, null),
                        numPatients: Object.keys(_data.patientMap).length,
                        numSamples: Object.keys(_data.sampleMap).length,
                        numClinical: Object.keys(_data.patientMap).reduce(function(p, c) { p += (_data.patientMap[c].hasOwnProperty('clinical')) ? 1 : 0; return p; }, 0),
                        show: true,
                        type: 'ALL'
                    };

                    _cohorts = localStorage.getItem(_dataSource.dataset + 'Cohorts');

                    if (_cohorts !== null) {
                        _cohorts = angular.fromJson(_cohorts);
                        setCohort(_cohorts[0]);
                    } else {
                        _cohorts = [_cohortAll];
                        setCohort(_cohortAll);
                    }

                    // Let everyone know what happened
                    onCohortsChange.dispatch(_cohorts);
                    onCohortChange.dispatch(_cohort);
                    onDataSource.dispatch(_dataSource);

                    // Resolve The Promise
                    resolveDataSource();
                });
            });
        };
        var showGenesetImport = function(showpanel) {
            _showGenesetImport= showpanel;
            onshowGenesetImportChange.dispatch(showpanel);
        };

        var createWithSampleIds = function(name, sampleIds, data) {
            if (sampleIds.length === 0) return _cohortAll;
            var patientIds = sampleIds
                .map(function(v) { return this.hasOwnProperty(v) ? this[v] : null; }, data.sampleMap)
                .filter(function(v) { return (v !== null); }) // Remove Null
                .filter(function(item, i, ar) { return ar.indexOf(item) === i; }); // Remove Dups

            return create(name, patientIds, sampleIds);
        };

        var createWithPatientIds = function(name, patientIds, data) {

            if (patientIds.length === 0) return _cohortAll;
            var sampleIds = [].concat
                .apply([], patientIds
                    .map(function(v) { return this.hasOwnProperty(v) ? this[v].samples : null; }, data.patientMap))
                .filter(function(item, i, ar) { return ar.indexOf(item) === i; });

            return create(name, patientIds, sampleIds);
        };

        var createWithHugoIds = function(name, hugoIds, show) {

            if (hugoIds.length === 0) return _genesetAll;
            var geneIds = hugoIds;
            var result = {
                symbols: hugoIds,
                genes: geneIds,
                name: name,
                show: show,
                url:"",
                desc:"Created from Geneset Menu"
            };
            return loadGeneset(result);
        };

        var create = function(name, patientIds, sampleIds) {
            var survival = statsFactory.createSurvival(patientIds, _data, _cohortAll);
            var rv = {
                uuid: Math.random().toString().substr(2),
                color: '#000',
                patientIds: patientIds,
                sampleIds: sampleIds,
                name: name,
                histogram: statsFactory.createHistogram(patientIds, _data),
                survival: (survival === null) ? _cohortAll.survival : survival,
                numPatients: patientIds.length,
                numSamples: sampleIds.length,
                numClinical: patientIds.reduce(function(p, c) { p += (_data.patientMap[c].hasOwnProperty('clinical')) ? 1 : 0; return p; }, 0),
                show: true,
                type: 'UNSAVED'
            };
            return rv;
        };

        var loadGeneset = function(result) {
            var show = (result.show) ? result.show : false;
            var rv = {
                uuid: Math.random().toString().substr(2),
                color: '#000',
                hugoIds: result.genes,
                geneIds: result.genes,
                name: result.name,
                url:result.url,
                desc:result.desc,
                show: show,
                disable: false,
                type: result.type
            };
            return rv;
        };

        var setCohort = function(cohort, name, type) {
            // Create Cohort If Array Passed
            if (angular.isArray(cohort)) {
                name += "  (" + moment().format('hh:mm:ss') + ")";
                cohort = (type == "PATIENT") ? createWithPatientIds(name, cohort, _data) : createWithSampleIds(name, cohort, _data);
                cohort.type = (cohort.patientIds.length === 0) ? "ALL" : "UNSAVED";
                if (cohort.type != "ALL") {
                    var usedColors = _cohorts.map(function(v) { return v.color; });
                    var availColors = ["#E91E63", "#673AB7", "#4CAF50", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B", "#03A9F4", "#03A9F4", '#004358', '#800080', '#BEDB39', '#FD7400', '#1F8A70', '#B71C1C', '#880E4F', '#4A148C', '#311B92', '#0D47A1', '#006064', '#1B5E20'].filter(function(v) { return (usedColors.indexOf(v) == -1); });
                    cohort.color = availColors[0];
                }
            }
            //if (_cohort === cohort) return;
            _cohort = cohort;
            onCohortChange.dispatch(_cohort);
        };

        var setGeneset = function(geneset, name, type, show) {
            // Create Cohort If Array Passed
            if (angular.isArray(geneset)) {
                //name += "  (" + moment().format('hh:mm:ss') + ")";
                geneset = (type == "SYMBOL") ? createWithHugoIds(name, geneset, show) : createWithHugoIds(name, geneset, show);
                geneset.type = (geneset.hugoIds.length === 0) ? "ALL" : "UNSAVED";
                // if (geneset.type != "ALL") {
                //     var usedColors = _genesets.map(function(v) { return v.color; });
                //     var availColors = ["#E91E63", "#673AB7", "#4CAF50", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B", "#03A9F4", "#03A9F4", '#004358', '#800080', '#BEDB39', '#FD7400', '#1F8A70', '#B71C1C', '#880E4F', '#4A148C', '#311B92', '#0D47A1', '#006064', '#1B5E20'].filter(function(v) { return (usedColors.indexOf(v) == -1); });
                //     geneset.color = availColors[0];
                // }
            }
            //if (_cohort === cohort) return;
            _geneset = geneset;
            onGenesetChange.dispatch(_geneset);
        };

        var saveCohort = function() {
            _cohort.type = "SAVED";
            _cohorts.push(_cohort);
            localStorage.setItem(_dataSource.dataset + 'Cohorts', angular.toJson(_cohorts));

        };
        var saveGeneset = function() {
            _geneset.type = "SAVED";
            _genesets.push(_geneset);
            localStorage.setItem( 'GeneSets', angular.toJson(_genesets.filter(function(d){return d.type == "SAVED"})));
            onGenesetsChange.dispatch(_genesets);

        };
        var deleteCohort = function(cohort) {
            _cohorts.splice(_cohorts.indexOf(cohort), 1);
            localStorage.setItem(_dataSource.dataset + 'Cohorts', angular.toJson(_cohorts));
            setCohort([], "", "PATIENT");
        };
        var deleteGeneset = function(geneset) {
            _genesets.splice(_genesets.indexOf(geneset), 1);
            localStorage.setItem('GeneSets', angular.toJson(_genesets.filter(function(d){return d.type == "SAVED"})));
            setGeneset([], "", "SYMBOL");
            onGenesetsChange.dispatch(_genesets);
        };
        var toggleGenesetDisable = function(geneset) {
            _genesets[_genesets.indexOf(geneset)].disable = ! _genesets[_genesets.indexOf(geneset)].disable
            onGenesetsChange.dispatch(_genesets);
        };

        // Converts Sample Ids To A List of Sample Ids
        var importIds = function(ids, name) {
            var sampleIds = _.union.apply(null, ids
                .map(function(id) { // Convert All Ids to Patient Ids
                    id = id.toUpperCase().trim(); // Clean input
                    return _data.sampleMap.hasOwnProperty(id) ? _data.sampleMap[id] : id;
                })
                .filter(function(id) { // Remove Invalid Patient Ids
                    return _data.patientMap.hasOwnProperty(id);
                })
                .map(function(id) { // Convert Patient Ids To Sample Arrays
                    return _data.patientMap[id].samples;
                })); // Union Merges Arrays + Removes Dups

            setCohort(sampleIds, name, "SAMPLE");
            saveCohort();
        };

        // Adds gene Ids to geneset and stores in localStorage
        var importGeneIds = function(ids, name) {

            //  var geneIds = _.union.apply(null, ids
            //     .map(function(id) { // Convert All Ids to Patient Ids
            //         id = id.trim(); // Clean input
            //         return _data.hugoMap.hasOwnProperty(id) ? _data.hugoMap[id] : id;
            //     })
            //      .filter(function(id) { // Remove Invalid HUGO Ids
            //          return _hugoMap.hasOwnProperty(id);
            //      })
            //); // Union Merges Arrays + Removes Dups
            var geneIds = ids;
            var show = true;

            setGeneset(geneIds, name, "SYMBOL", show);
            saveGeneset();
        };

        // Initialize (Load Tools Raw Data + DataSources)
        var initialized = false;

        function init() {
            if (initialized) return new Promise(function(resolve) { resolve(_dataSources); });
            initialized = true;
            return Promise.all([
                new Promise(function(resolve, reject) {
                    query("lookup_oncoscape_tools").then(function(response) {
                        _toolsAll = response.data;
                        resolve();
                    }, reject);
                }),
                new Promise(function(resolve, reject) {

                    query("lookup_oncoscape_datasources_v2", {
                        beta: false, "$fields": ["dataset","source", "beta", "name","img", "tools"]
                    }).then(function(response) {
                        _dataSource = { dataset: '' };

                        _dataSources = response.data
                            .filter(function(d) {
                                return angular.isDefined(d.img);
                            })
                            .map(function(d) {
                                d.name = d.name.trim();
                                return d;
                            })
                            .sort(function(a, b) {
                                return (a.img < b.img) ? -1 :
                                    (a.img > b.img) ? 1 :
                                    (a.dataset < b.dataset) ? -1 :
                                    (a.dataset > b.dataset) ? 1 :
                                    0;
                            });
                        resolve();
                    }, reject);
                }),
                new Promise(function(resolve, reject) {
                    query("lookup_genesets", {
                        // $fields: ['name', 'genes']
                    }).then(function(response) {
                        var result = response.data;
                        _genesets = result.map(function(d){
                            d.type = "IMPORT"
                            return loadGeneset(d); });

                        _genesetAll = {
                                color: '#039BE5',
                                hugoIds: [],
                                geneIds: [],
                                name: 'All Genes',
                                url: '',
                                desc: "All available molecular markers will be used in analysis.",
                                // histogram: statsFactory.createHistogram(Object.keys(data.patientMap), data),
                                // survival: statsFactory.createSurvival(Object.keys(data.patientMap), data, null),
                                // numPatients: Object.keys(_data.patientMap).length,
                                // numSamples: Object.keys(_data.sampleMap).length,
                                // numClinical: Object.keys(_data.patientMap).reduce(function(p, c) { p += (_data.patientMap[c].hasOwnProperty('clinical')) ? 1 : 0; return p; }, 0),
                                show: true,
                                disable: false,
                                type: 'ALLGENES'
                        };

                        _genesets.unshift(_genesetAll);
                        _geneset = _genesets[0];

                        var localGenesets = localStorage.getItem('GeneSets');

                        if (localGenesets !== null) {

                            var localGenesetsArray = angular.fromJson(localGenesets)
                            if(localGenesetsArray.length != 0){
                                _genesets.concat(localGenesetsArray);
                                // setGeneset(_genesets[0]);
                            } else {
                                // setGeneset(_genesetAll);
                            }
                        }

                        onGenesetsChange.dispatch(_genesets);
                        onGenesetChange.dispatch(_geneset);

                            resolve();
                    }, reject);

                })//,

                // new Promise(function(resolve, reject) {
                //     query("lookup_oncoscape_genes", {
                //     }).then(function(response) {
                //         _hugoMap = response.data

                //     resolve();
                //     }, reject);
                // })
            ]);
        }

        // Query Api
        var queryString = function(table, query) {
            return osHttp.queryString({
                table: table,
                query: query
            });
        };
        var query = function(table, query) {
            return osHttp.query({
                table: table,
                query: query
            });
        };

        return {

            // Constants
            ALL: "All Patients",
            ALLGENES: "All Genes",
            SAMPLE: "SAMPLE",
            PATIENT: "PATIENT",
            SYMBOL: "SYMBOL",

            // Init
            init: init,

            // RPC
            query: query,
            queryString: queryString,

            // Data Sources
            setDataSource: setDataSource,
            getDataSource: getDataSource,
            getDataSources: getDataSources,

            // Patient Colors
            setPatientColor: setPatientColor,
            getPatientColor: getPatientColor,

            // Tools + Layouts
            getTools: getTools,
            getLayout: getLayout,

            // Cohort Tool Info
            setCohortToolInfo: setCohortToolInfo,
            getCohortToolInfo: getCohortToolInfo,
            getCohortDatasetInfo: getCohortDatasetInfo,


            // Cohort Management
            getCohorts: getCohorts,
            getCohort: getCohort,
            setCohort: setCohort,
            saveCohort: saveCohort,
            deleteCohort: deleteCohort,
            importIds: importIds,
            importGeneIds: importGeneIds,

            // Geneset Tool Info
            setGenesetToolInfo: setGenesetToolInfo,
            getGenesetToolInfo: getGenesetToolInfo,
            //getGenesetDatasetInfo: getGenesetDatasetInfo,


            // Geneset Management
            getGenesets: getGenesets,
            getGeneset: getGeneset,
            getGenesetAll: getGenesetAll,
            setGeneset: setGeneset,
            saveGeneset: saveGeneset,
            deleteGeneset: deleteGeneset,
            toggleGenesetDisable: toggleGenesetDisable,
            showGenesetImport: showGenesetImport,
            

            // Signals
            onPatientColorChange: onPatientColorChange,
            onCohortToolInfo: onCohortToolInfo,
            onGenesetToolInfo: onGenesetToolInfo,
            onNavChange: onNavChange,
            onDataSource: onDataSource,
            onResize: onResize,
            onCohortChange: onCohortChange,
            onCohortsChange: onCohortsChange,
            onGenesetChange: onGenesetChange,
            onGenesetsChange: onGenesetsChange,
            onshowGenesetImportChange: onshowGenesetImportChange,

            // Random
            setBusy: setBusy,
            km: statsFactory.km,

            getData: getData

        };
    }
})();

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
        function MarkersController(osApi, d3, $state, $timeout, $scope, $stateParams, cytoscape, signals, moment, $window, _, $q) {

            osApi.setBusy(true);

            var tmpdata, worker;

            var signal = (function() {
                return {
                    patients: {
                        select: new signals.Signal(),
                        unselect: new signals.Signal(),
                        over: new signals.Signal(),
                        out: new signals.Signal()
                    },
                    genes: {
                        select: new signals.Signal(),
                        unselect: new signals.Signal(),
                        over: new signals.Signal(),
                        out: new signals.Signal()
                    },
                    edges: {
                        select: new signals.Signal(),
                        unselect: new signals.Signal(),
                        over: new signals.Signal(),
                        out: new signals.Signal()
                    },
                    clear: function() {
                        this.edges.select.removeAll();
                        this.edges.unselect.removeAll();
                        this.edges.over.removeAll();
                        this.edges.out.removeAll();
                        this.patients.select.removeAll();
                        this.patients.unselect.removeAll();
                        this.patients.over.removeAll();
                        this.patients.out.removeAll();
                        this.genes.select.removeAll();
                        this.genes.unselect.removeAll();
                        this.genes.over.removeAll();
                        this.genes.out.removeAll();
                    }
                };
            })();


            // State
            var mpState = (function(osApi) {
                // Retrieve State
                var mp = localStorage.getItem("MP-" + osApi.getDataSource().dataset);
                var hasState = (mp !== null);
                if (hasState) mp = angular.fromJson(mp);


                var _colors = null;
                var setColors = function(c) {
                    _colors = c;
                };
                var applyState = function(fn, cyChart) {
                    if (!hasState) return;
                    osApi.onPatientColorChange.dispatch(mp.optColors);
                    requestAnimationFrame(function() {
                        cyChart.startBatch();
                        cyChart.add(mp.edges);
                        cyChart.$('node[nodeType="patient"]').forEach(function(node) {
                            if (
                                mp.moved.hasOwnProperty(node.id())
                            ) {
                                node.position(
                                    mp.moved[node.id()]
                                );
                            }
                        });
                        cyChart.endBatch();
                    });



                };

                var getOptEdgeColors = function() {

                    if (hasState) return mp.optEdgeColors;
                    return [{
                        name: 'Mutation',
                        abv: 'm',
                        show: true,
                        color: '#9C27B0',
                        class: 'switch-mutation',
                        count: '',
                        id: 0
                    }, {
                        name: 'Amplification',
                        abv: 'cnG2',
                        show: true,
                        color: '#3F51B5',
                        class: 'switch-cnG2',
                        count: '',
                        id: 2
                    }, {
                        name: 'Gain',
                        abv: 'cnG1',
                        show: true,
                        color: '#03A9F4',
                        class: 'switch-cnG1',
                        count: '',
                        id: 1
                    }, {
                        name: 'Loss',
                        abv: 'cnL1',
                        show: true,
                        color: '#FF9800',
                        class: 'switch-cnL1',
                        count: '',
                        id: -1
                    }, {
                        name: 'Deletion',
                        abv: 'cnL2',
                        show: true,
                        color: '#F44336',
                        class: 'switch-cnL2',
                        count: '',
                        id: -2
                    }];
                };

                var getGeneSet = function(genesets) {
                    if (hasState) {
                        return genesets.filter(function(v) {
                            return v.name == mp.optGeneSet.name;
                        }, mp.optGeneSet.name)[0];
                    }

                    var datasetGeneset = osApi.getDataSource().geneset;
                    var gs = genesets.reduce(function(p, c) {
                        if (c.name === datasetGeneset) { p = c; }
                        return p;
                    }, genesets[0]);
                    return gs;
                };

                var getPatientLayout = function(layouts) {

                    if (hasState) {
                        return layouts.filter(function(v) {
                            return v.name == mp.optPatientLayout.name;
                        }, mp.optPatientLayout.name)[0];
                    } else {
                        return layouts.reduce(function(p, c) {
                            if (c.hasOwnProperty("default")) {
                                if (c.default) p = c;
                            }
                            return p;
                        }, layouts[0]);
                    }
                };


                var save = function(vm, cyChart) {
                    var s = {};
                    s.moved = {};
                    cyChart.$('node[nodeType="patient"]').forEach(function(v) {
                        if (!_.isMatch(v.data().position, v.position())) {
                            s.moved[v.id()] = v.position();
                        }
                    });
                    s.optEdgeColors = vm.optEdgeColors;
                    s.optGeneSet = vm.optGeneSet;
                    s.optPatientLayout = vm.optPatientLayout;
                    s.optColors = _colors;
                    s.edges = cyChart.$('edge[edgeType="cn"]').jsons();
                    localStorage.setItem("MP-" + osApi.getDataSource().dataset, angular.toJson(s));
                };

                return {
                    applyState: applyState,
                    getOptEdgeColors: getOptEdgeColors,
                    getGeneSet: getGeneSet,
                    getPatientLayout: getPatientLayout,
                    setColors: setColors,
                    save: save
                };
            })(osApi);




            /*
             *  Cytoscape Chart
             *  + Node & Edge Styles
             */
            var elChart = angular.element("#markers-chart");
            var cyChart = (function(elChart) {
                return cytoscape({
                    'container': elChart,
                    'style': [{
                        'selector': 'core',
                        'style': {
                            'selection-box-color': '#039BE5',
                            'selection-box-border-color': '#3993fa',
                            'selection-box-border-width': '1px',
                            'selection-box-opacity': '.2'
                        }
                    }, {
                        'selector': 'node',
                        'style': {
                            'background-color': "#039BE5",
                            'display': "data(display)",
                            'width': 'data(sizeEle)',
                            'height': 'data(sizeEle)',
                            'border-width': 'data(sizeBdr)',
                            'font-size': 'data(sizeLbl)',
                            'text-valign': 'center'
                        }
                    }, {
                        'selector': 'node[nodeType="telomere"]',
                        'style': {
                            'background-color': "#039BE5",
                            'border-color': "#039BE5"
                        }
                    }, {
                        'selector': 'node[nodeType="patient"]',
                        'style': {
                            'background-color': 'data(color)',
                            'text-halign': 'center',
                            'border-color': '#FFFFFF'
                        }
                    }, {
                        'selector': 'node[nodeType="patient"]:selected',
                        'style': {
                            'background-color': 'data(color)',
                            'border-color': "#000",
                            'border-width': 5
                        }
                    }, {
                        'selector': 'node[nodeType="gene"]',
                        'style': {
                            'background-color': "data(color)",
                            'border-color': "data(colorBdr)",
                            'text-halign': "data(halign)",
                            'text-margin-x': "data(padding)",
                            'font-size': '8px',
                            'color': '#aaa',
                            'label': "data(id)",
                            'border-width': "data(sizeBdr)"
                        }
                    }, {
                        'selector': 'node[nodeType="gene"]:selected',
                        'style': {
                            'background-color': "#fc8400",
                            'border-color': "#000000",
                            'color': '#000'
                        }
                    }, {
                        'selector': 'node[nodeType="centromere"]',
                        'style': {
                            'font-size': '20px',
                            'text-halign': 'center',
                            'background-color': "#039BE5",
                            'color': "#FFFFFF",
                            'border-color': 'rgb(19, 150, 222)',
                            'height': '40px',
                            'width': '40px',
                            'shape': 'round',
                            'label': "  data(id)"
                        }
                    }, {
                        'selector': 'edge',
                        'style': {
                            'display': "data(display)",
                            'line-color': "data(color)",
                            'width': "data(sizeEle)"
                        }
                    }, {
                        'selector': 'node[nodeType="annotation-text"]',
                        'style': {
                            'font-size': '50px',
                            'text-halign': 'right',
                            'text-valign': 'bottom',
                            'background-color': "#FFFFFF",
                            'color': "#000",
                            'border-color': '#FFFFFF',
                            'height': '50px',
                            'width': '50px',
                            'shape': 'round',
                            'label': 'data(label)',
                            'text-transform': 'uppercase'
                        }
                    }],
                    hideEdgesOnViewport: false,
                    hideLabelsOnViewport: true,
                    textureOnViewport: false,
                    wheelSensitivity: 0.2,
                    zoom: 0.08,
                    pan: {
                        x: 650,
                        y: 160
                    },
                    minZoom: 0.05,
                    maxZoom: 20,
                    layout: {
                        name: "preset",
                        fit: true
                    }
                });
            })(elChart);

            /*
             *  Draw Chromosome
             */
            (function() {

                osApi.query("render_chromosome", {
                    type: "chromosome"
                }).then(function(result) {

                    // Process Chromosome
                    var chromosomes = result.data[0].data;
                    var elements = [];

                    Object.keys(chromosomes).forEach(function(key) {
                        var chromosome = this.chromosomes[key];
                        this.elements.push({
                            group: "edges",
                            grabbable: false,
                            locked: true,
                            selectable: false,
                            data: {
                                color: "#039BE5",
                                id: "ce" + key, // Chromosome Edge (CE)
                                display: "element",
                                edgeType: "chromosome",
                                sizeBdr: 0,
                                sizeEle: 3, // Style?
                                source: "cp" + key, // Chromosome P (CP)
                                target: "cq" + key // Chromosome Q (CQ)
                            }
                        });

                        // Telemere P
                        this.elements.push({
                            group: "nodes",
                            grabbable: false,
                            locked: true,
                            selectable: false,
                            position: {
                                x: chromosome.x,
                                y: chromosome.p
                            },
                            data: {
                                id: "cp" + key,
                                display: "element",
                                nodeType: "telomere",
                                degree: 1,
                                sizeBdr: 1,
                                sizeEle: 1,
                                sizeLbl: 1,
                                subType: "unassigned"
                            }
                        });
                        // Telemere Q
                        this.elements.push({
                            group: "nodes",
                            grabbable: false,
                            locked: true,
                            selectable: false,
                            position: {
                                x: chromosome.x,
                                y: chromosome.q
                            },
                            data: {
                                id: "cq" + key,
                                display: "element",
                                nodeType: "telomere",
                                degree: 1,
                                sizeBdr: 5,
                                sizeEle: 5,
                                sizeLbl: 5,
                                subType: "unassigned"
                            }
                        });
                        // Centromere Q
                        this.elements.push({
                            group: "nodes",
                            grabbable: false,
                            locked: true,
                            selectable: false,
                            position: {
                                x: chromosome.x,
                                y: chromosome.c
                            },
                            data: {
                                id: key,
                                display: "element",
                                sizeBdr: 1,
                                sizeEle: 10,
                                sizeLbl: 10,
                                nodeType: "centromere",
                                degree: 1
                            }
                        });

                    }, {
                        chromosomes: chromosomes,
                        elements: elements
                    });
                    cyChart.add(elements);
                });
            })();

            /*
             * View Model + Initial Data Load 
             * + Initial Data Load
             * + View Port Resize Event
             */
            var vm = (function(vm, osApi, mpState) {
                vm.showPopupSelection = false;
                vm.datasource = osApi.getDataSource();
                vm.detail = {
                    show: false,
                    html: "",
                    title: ""
                };
                vm.optGeneSets = [];
                vm.optGeneSet = null;
                vm.optPatientLayouts = [];
                vm.optPatientLayout = null;
                vm.showPanelLayout = false;
                vm.showPanelColor = false;
                vm.showPanelColorRna = false;
                vm.search = "";
                vm.searchCount = "";

                vm.optCommandModes = [{
                    name: 'Sequential'
                }, {
                    name: 'Set'
                }, {
                    name: 'Ad Hoc'
                }];
                vm.optCommandMode = vm.optCommandModes[0];

                vm.exeSearch = function() {
                    var needle = vm.search.toUpperCase().trim();
                    var count = 0;
                    var doSearch = (needle.length > 0);
                    cyChart.$('node').forEach(function(el) {
                        var found = (doSearch) ? (el.id().toUpperCase().indexOf(needle) === 0) : false;
                        if (found) count += 1;
                        el[found ? "select" : "deselect"]();
                    });
                    vm.searchCount = "(" + count + " found)";
                    $timeout(function() { vm.searchCount = ""; }, 3000, true);
                };
                vm.hideModal = function() {
                    angular.element('#modalEdge').modal('hide');
                };
                vm.filterModelEdge = function() {

                    angular.element('#modalEdge').modal('hide');
                    var vals = vm.optEdgeColors
                        .filter(function(c) {
                            return c.show;
                        })
                        .map(function(c) {
                            return c.id;
                        });
                    var edges = tmpdata.edges.filter(function(edge) {
                        return (vals.indexOf(edge.data.cn) != -1);
                    }, {
                        vals: vals
                    });

                    cyChart.startBatch();
                    cyChart.add(edges);
                    cyChart.endBatch();
                    tmpdata = null;

                };

                vm.edgeToggle = function() {
                    vm.cmd('ShowSelectedEdges');
                };

                vm.selectColor = function(item) {
                    var color = item.color;
                    var nodes = cyChart.$('node[nodeType="patient"]');
                    cyChart.startBatch();
                    nodes.forEach(function(node) {
                        if (node.data().color == this) {
                            node.select();
                        }
                    }, color);
                    cyChart.endBatch();
                };
                vm.deselectColor = function(item) {
                    var color = item.color;
                    var nodes = cyChart.$('node[nodeType="patient"]:selected');
                    cyChart.startBatch();
                    nodes.forEach(function(node) {
                        if (node.data().color == this) {
                            node.unselect();
                        }
                    }, color);
                    cyChart.endBatch();
                };

                vm.lockPatients = false;
                vm.lockGenes = false;
                vm.lock = function(type) {
                    switch (type) {
                        case "patient":
                            vm.lockPatients = !vm.lockPatients;
                            cyChart.startBatch();
                            cyChart.$('node[nodeType="patient"]')
                                .forEach(function(node) {
                                    if (vm.lockPatients) node.unselectify();
                                    else node.selectify();
                                });
                            cyChart.endBatch();
                            break;
                        case "gene":
                            vm.lockGenes = !vm.lockGenes;
                            cyChart.startBatch();
                            cyChart.$('node[nodeType="cn"]')
                                .forEach(function(node) {
                                    if (vm.lockGenes) node.unselectify();
                                    else node.selectify();
                                });
                            cyChart.endBatch();
                            break;

                    }
                };

                vm.optEdgeColors = mpState.getOptEdgeColors();


                // Populate Dropdowns + Draw Chromosome
                //hg19_geneset
                $q.all([
                    osApi.query("hg19_geneset", {
                        type: 'geneset',
                        $fields: ['name']
                    }),
                    osApi.query(osApi.getDataSource().dataset + "_cluster", {
                        $fields: ['input', 'geneset', 'dataType', 'source', 'default']
                    })

                ]).then(function(results) {

                    var layouts = results[1].data.map(function(v) {
                        v.name = v.dataType + " " + v.input + " " + v.geneset;
                        return v;
                    }).sort(function(a, b) {
                        var x = a.name.toLowerCase();
                        var y = b.name.toLowerCase();
                        return x < y ? -1 : x > y ? 1 : 0;
                    });

                    vm.optGeneSets = _.uniq(osApi.getDataSource().edges.map(function(e) { return { name: e.geneset }; }), function(item) { return item.name; });
                    vm.optGeneSet = mpState.getGeneSet(vm.optGeneSets);
                    vm.optPatientLayouts = layouts;
                    var patientLayout = mpState.getPatientLayout(vm.optPatientLayouts);
                    vm.optPatientLayout = angular.isDefined(patientLayout) ? patientLayout : layouts[0];

                });


                vm.resize = function() {
                    var width = $window.innerWidth;
                    //    if (angular.element(".tray").attr("locked") == "true") width -= 300;
                    elChart.width(width);
                    elChart.height($window.innerHeight - 90);
                    cyChart.resize();
                };
                angular.element($window).bind('resize',
                    _.debounce(vm.resize, 300)
                );

                return vm;
            })(this, osApi, mpState);


            /*
             * Zoom Control Functions
             * - reset
             * - fit
             */
            var zoom = (function(cyChart, vm) {
                var reset = function() {
                    cyChart.fit();
                    cyChart.center();
                };
                var fit = function() {
                    cyChart.fit(cyChart.$(':selected'), 50);
                };
                vm.zoom = {
                    reset: reset,
                    fit: fit
                };
                cyChart.on('pan', _.debounce(function() {
                    cyChart.startBatch();
                    resizeNodes();
                    cyChart.endBatch();
                }, 50));

                return vm.zoom;
            })(cyChart, vm);

            var borderScale = d3.scaleLog().domain([0.005, 20]).range([5, 1]);
            var nodeScale = d3.scaleLog().domain([0.005, 20]).range([80, 1]);
            var labelScale = d3.scaleLog().domain([0.005, 20]).range([50, 1]);
            var expressionScale = d3.scalePow().range([0.01, 2]);


            var resizeNodesByType = function(type) {

                expressionScale.domain(
                    cyChart.$('node[nodeType="' + type + '"]').toArray()
                    .reduce(function(p, c) {
                        var w = c.data().weight;
                        p[0] = Math.min(p[0], w);
                        p[1] = Math.max(p[1], w);
                        return p;
                    }, [Infinity, -Infinity])
                );




                var zoom = cyChart.zoom();
                var sizeNode = nodeScale(zoom);
                var sizeLbl = (zoom < 0.375) ? 0 : labelScale(zoom);
                var sizeBdr = borderScale(zoom);

                cyChart.startBatch();
                cyChart.$('node[nodeType="' + type + '"]').forEach(function(node) {
                    node.data({
                        'sizeEle': Math.round(this.sizeNode * expressionScale(node.data().weight)),
                        'sizeLbl': this.sizeLbl,
                        'sizeBdr': this.sizeBdr
                    });
                }, {
                    sizeNode: sizeNode,
                    sizeBdr: sizeBdr,
                    sizeLbl: sizeLbl,
                    scale: expressionScale
                });
                cyChart.endBatch();
            };

            var resizeNodes = function() {
                resizeNodesByType('patient');
                resizeNodesByType('gene');
            };

            /* 
             *  Interop Between UI and Worker Thread
             *  - setGeneSet(name:String)
             *  - setPatientLayout(name:String)
             *  - setDataSource(name:String)
             *  - setOptions(options:Object)
             */
            var setOptions = (function(cyChart, vm, osApi, $q, zoom, _, signal) {

                // Instatiate Worker
                var cmd = {};
                worker = new Worker("app/components/markers/markers.worker.js");
                worker.addEventListener('message', function(msg) {
                    cmd[msg.data.cmd](msg.data.data);
                }, false);

                var remove = function(selector, data) {
                    if (angular.isUndefined(data)) {
                        cyChart.remove(selector);
                        return;
                    }

                    if (data.length === 0) return;
                    var items = data.map(function(item) {
                        return this.getElementById(item);
                    }, cyChart);
                    try {
                        cyChart.collection(items).remove();
                    } catch (e) {}
                };
                cmd.patients_html = function() {

                };
                cmd.patients_resize = function() {

                };
                cmd.patients_delete = function(data) {
                    remove('node[nodeType="patient"]', data);
                };
                cmd.patients_insert = function(data) {
                    cyChart.startBatch();
                    var elements = cyChart.add(data.patients);
                    elements.on("select", _.debounce(signal.patients.select.dispatch, 300));
                    elements.on("unselect", _.debounce(signal.patients.unselect.dispatch, 300));
                    elements.on("mouseover", signal.patients.over.dispatch);
                    elements.on("mouseout", signal.patients.out.dispatch);
                    elements.forEach(function(node) {
                        try {
                            node.data({
                                'weight': data.degrees[node.id()].weight
                            });
                        } catch (e) {
                            node.data({
                                'weight': 10
                            });
                        }
                    });
                    resizeNodes();
                    cyChart.endBatch();
                    vm.resize();

                    //Initial Node Selection & Color
                    var cohort = osApi.getCohort();
                    cyChart.startBatch();
                    cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                        if (this.indexOf(node.id()) != -1) node.select();

                    }, cohort.sampleIds);
                    cyChart.endBatch();
                    vm.zoom.reset();
                    cyChart.center();
                    cyChart.fit(cyChart.nodes(), 400);
                    mpState.applyState(onPatientColorChange, cyChart);

                };
                cmd.patients_layout = function(data) {
                    cyChart.startBatch();
                    cyChart.$("node[nodeType='annotation-text']").remove();

                    var posX = 100;
                    var posY = 3000;
                    var numMissing = 0;

                    cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                        if (data.hasOwnProperty(node.id())) {
                            var pos = data[node.id()];
                            node.data().position = { x: pos.x, y: pos.y };
                            node.position(pos);
                            node.style({ display: 'element' });
                        } else {
                            node.style({ display: 'none' });
                            //node.position({ x: -10000, y: -10000 });
                            // node.position({ x: posX, y: posY });
                            // posX += 80;
                            // if (posX > 3000) {
                            //     posX = 100;
                            //     posY += 80;
                            // }
                            // numMissing += 1;
                        }
                    });

                    if (numMissing > 0) { // uncomment to show grid of missing
                        // cyChart.add({
                        //     group: "nodes",
                        //     grabbable: false,
                        //     locked: true,
                        //     selectable: false,
                        //     position: { x: 50, y: 2850 },
                        //     data: {
                        //         id: "annotation",
                        //         color: "rgb(0, 0, 0)",
                        //         display: "element",
                        //         nodeType: "annotation-text",
                        //         sizeEle: 800,
                        //         weight: 0,
                        //         sizeLbl: 500,
                        //         degree: 0,
                        //         sizeBdr: 50,
                        //         label: "The following " + numMissing + " samples lacked the requisite data to be clustered."
                        //     }
                        // });
                    }
                    resizeNodes();
                    cyChart.endBatch();
                };

                cmd.genes_html = function() {

                };
                cmd.genes_delete = function(data) {
                    remove('node[nodeType="gene"]', data);
                };
                cmd.genes_insert = function(data) {
                    cyChart.startBatch();
                    //var signals = signal.genes;
                    var elements = cyChart.add(data.genes);
                    elements.on("select", _.debounce(signal.genes.select.dispatch, 300));
                    elements.on("unselect", _.debounce(signal.genes.unselect.dispatch, 300));
                    elements.on("mouseover", signal.genes.over.dispatch);
                    elements.on("mouseout", signal.genes.out.dispatch);
                    elements.forEach(function(node) {
                        try {
                            node.data({
                                'weight': data.degrees[node.id()].weight
                            });
                        } catch (e) {
                            node.data({
                                'weight': 0
                            });
                        }
                    });
                    cyChart.endBatch();
                    resizeNodes();
                    osApi.setBusy(false);
                };
                cmd.edges_delete = function(data) {
                    remove('edge[edgeType="cn"]', data);

                };
                cmd.edges_insert = function(data) {
                    tmpdata = data;
                    if (data.counts.total > 5000) {
                        angular.element('#modalEdge').modal();
                        $scope.$apply(function() {
                            vm.edgeCounts = data.counts;
                        });
                        return;
                    }

                    if (vm.optCommandMode.name == "Ad Hoc") {

                        cyChart.startBatch();
                        cyChart.$('edge[edgeType="cn"]').remove();
                        var elements = cyChart.add(data.edges);

                        if (mouseIsOver == "patient") {

                            var geneColors = elements
                                .map(function(v) {
                                    return [v.data().source, v.data().color];
                                })
                                .reduce(function(p, c) {
                                    p[c[0]] = c[1];
                                    return p;
                                }, {});

                            cyChart.$('node[nodeType="gene"]')
                                .forEach(function(ele) {
                                    var id = ele.id();
                                    var selected = this.hasOwnProperty(id);
                                    ele.data("sizeBdr", (selected) ? 10 : 1);
                                    ele.data("colorBdr", (selected) ? this[id] : "#FFFFFF");
                                    ele.data("color", (selected) ? this[id] : "#0096d5");

                                }, geneColors);
                        }

                        cyChart.endBatch();

                    } else {
                        cyChart.startBatch();
                        try {
                            cyChart.add(data.edges);
                        } catch (e) {}
                        vm.edgeCounts = data.counts;
                        cyChart.endBatch();
                    }

                };

                // Outbound
                return function(options) {
                    worker.postMessage({
                        cmd: "setOptions",
                        data: options
                    });
                };
            })(cyChart, vm, osApi, $q, zoom, _, signal);

            /* Options Factory */
            var createOptions = (function(cyChart, vm) {

                return function(cmd) {

                    cmd = cmd || "";
                    var geneset = vm.optGeneSet.name;

                    // Could add ability to select from cBio or UCSC for edges
                    // var edges = osApi.getDataSource().edges.filter(function(f) {
                    //     return f.name == this.geneset;
                    // }, {
                    //     geneset: geneset
                    // })[0];
                    var opts = {
                        mode: vm.optCommandMode.name,
                        cmd: cmd,
                        dataset: osApi.getDataSource().dataset,
                        patients: {
                            data: vm.datasource.clinical.patient,
                            layout: vm.optPatientLayout,
                            selected: cyChart.$('node[nodeType="patient"]:selected').map(function(p) {
                                return p.data().id;
                            })
                        },
                        genes: {
                            layout: vm.optGeneSet.name,
                            selected: cyChart.$('node[nodeType="gene"]:selected').map(function(p) {
                                return p.data().id;
                            })
                        },
                        edges: {
                            layout: vm.datasource.edges
                                .filter(function(v) {
                                    return (v.geneset == this);
                                }, geneset)[0],
                            colors: vm.optEdgeColors
                                .filter(function(f) {
                                    return f.show;
                                })
                                .map(function(f) {
                                    return {
                                        id: f.id,
                                        color: f.color
                                    };
                                })
                        }
                    };

                    return opts;
                };
            })(cyChart, vm);

            vm.cmd = function() {};

            /*
             *  Watch View Model
             *  + vm.optGeneSet
             *  + vm.optPatientLayout
             */
            (function(vm, $scope) {
                var watches = 2;

                var update = function() {
                    setOptions(createOptions());
                };

                // GeneSet
                watches += 0;
                $scope.$watch('vm.optGeneSet', function() {
                    if (watches > 0) {
                        watches -= 1;
                        return;
                    }
                    if (angular.isUndefined(vm.optGeneSet) || angular.isUndefined(vm.optPatientLayout)) return;
                    osApi.setBusy(true);
                    cyChart.$('edge[edgeType="cn"]').remove();
                    update();

                });

                // Patient Layout
                watches += 1;
                $scope.$watch('vm.optPatientLayout', function() {
                    if (watches > 0) {
                        watches -= 1;
                        return;
                    }
                    update();
                });


                // Edge Colors
                watches += 1;
                $scope.$watch('vm.optEdgeColors.color', function() {
                    if (watches > 0) {
                        watches -= 1;
                        return;
                    }
                    update();
                    vm.resize();
                });
            })(vm, $scope);

            var mouseIsOver = "";
            var updatePatientCounts = function() {

                angular.element(".legend-count").text("");
                var selectedPatients = cyChart.$('node[nodeType="patient"]:selected').toArray();
                if (selectedPatients.length === 0) selectedPatients = cyChart.$('node[nodeType="patient"]').toArray();

                var counts = selectedPatients.reduce(function(p, c) {
                    var color = c.data().color;
                    if (!p.hasOwnProperty(color)) p[color] = 0;
                    p[color] += 1;
                    return p;
                }, {});

                Object.keys(counts).forEach(function(key) {
                    angular.element("#legend-" + key.substr(1)).text(" (" + this[key] + ")");
                }, counts);

            };

            var setPatientInfo = function(e) {

                $scope.$apply(function() {
                    if (e.type == "mouseout") {
                        //angular.element("#cohortmenu-legand").html("");

                    } else {
                        mouseIsOver = "patient";
                        //angular.element("#cohortmenu-legand").html(e.cyTarget.id() + patientHtml[e.cyTarget.id()]);
                    }
                });
            };

            var setGeneInfo = function(e) {

                $scope.$apply(function() {
                    if (e.type == "mouseout") {
                        //angular.element("#cohortmenu-legand").html("");
                    } else {
                        mouseIsOver = "gene";
                        //angular.element("#cohortmenu-legand").html(e.cyTarget.id()); // + patientHtml[e.cyTarget.id()]);
                    }
                });
            };

            var _stopLength = 0; // Hack - need to fix
            var skipCohortRefresh = false;

            function onCohortChange(cohort) {
                if (cohort.sampleIds.length == _stopLength) return; // Preform more robust check
                skipCohortRefresh = true;
                _stopLength = cohort.sampleIds.length;
                cyChart.startBatch();
                cyChart.$('node[nodeType="patient"]:selected').deselect();
                cyChart.$('node[nodeType="patient"]').forEach(function(node) {
                    if (cohort.sampleIds.indexOf(node.id()) != -1) node.select();
                });
                cyChart.endBatch();
            }
            osApi.onCohortChange.add(onCohortChange);

            function setPatientCohort() {
                var cohort = cyChart.$('node[nodeType="patient"]:selected');
                if (cohort.length == _stopLength) return; // Preform more robust check
                _stopLength = cohort.length;
                if (!skipCohortRefresh)
                    osApi.setCohort(
                        cohort.map(function(p) {
                            return p.data().id;
                        }),
                        "Markers + Patients",
                        osApi.SAMPLE
                    );
                skipCohortRefresh = false;
            }

            function setGeneCohort() {

            }

            // Initialize Commands
            $scope.$watch("vm.optCommandMode", function() {
                signal.clear();
                cyChart.$('node').unselect();
                cyChart.$('edge[edgeType="cn"]').remove();
                switch (vm.optCommandMode.name) {
                    case "Sequential":
                        //try{ cyChart.$('node').unselect(); setOptions(createOptions()); }catch(e){}
                        vm.cmd = function(cmd) {
                            var opts;
                            switch (cmd) {
                                case "ShowSelectedEdges":
                                    var nodes = cyChart.$('node[nodeType="patient"]:selected, node[nodeType="gene"]:selected');
                                    if (nodes.length === 0) return;
                                    nodes.neighborhood("edge").remove();
                                    opts = createOptions(cmd);
                                    setOptions(opts);
                                    break;
                                case "HideAllEdges":
                                    cyChart.$('edge[edgeType="cn"]').remove();
                                    break;
                                case "HideSelectedEdges":
                                    cyChart.$('node[nodeType="patient"]:selected, node[nodeType="gene"]:selected')
                                        .neighborhood("edge").remove();
                                    break;
                                case "HideUnselectedEdges":
                                    cyChart.$('node[nodeType="patient"]:unselected')
                                        .neighborhood("edge").remove();
                                    break;
                                case "SelectConnected":
                                    cyChart.startBatch();
                                    cyChart.$('node:selected')
                                        .neighborhood("node")
                                        .forEach(function(ele) {
                                            ele.select();
                                        });
                                    cyChart.endBatch();
                                    break;
                                case "SelectInverse":
                                    cyChart.startBatch();
                                    cyChart.$('node').forEach(function(ele) {
                                        ele[ele._private.selected ? "deselect" : "select"]();
                                    });
                                    cyChart.endBatch();
                                    break;
                                case "HideUnselectedNodes":
                                    cyChart.startBatch();
                                    cyChart.$('node[nodeType="patient"]:unselected')
                                        .forEach(function(item) {
                                            item.style({
                                                display: 'none'
                                            });
                                        });
                                    cyChart.endBatch();
                                    break;
                                case "ShowAllNodes":
                                    cyChart.startBatch();
                                    cyChart.$('node[nodeType="patient"]:hidden')
                                        .forEach(function(item) {
                                            item.style({
                                                display: 'element'
                                            });
                                        });
                                    cyChart.endBatch();
                                    break;
                                default:
                                    opts = createOptions(cmd);
                                    setOptions(opts);
                                    break;
                            }
                        };


                        signal.patients.select.add(updatePatientCounts);
                        signal.patients.unselect.add(updatePatientCounts);
                        signal.genes.over.add(setGeneInfo);
                        signal.genes.out.add(setGeneInfo);
                        signal.genes.select.add(setGeneCohort);
                        signal.genes.unselect.add(setGeneCohort);
                        signal.patients.over.add(setPatientInfo);
                        signal.patients.out.add(setPatientInfo);
                        signal.patients.select.add(setPatientCohort);
                        signal.patients.unselect.add(setPatientCohort);
                        break;

                    case "Set":
                        var patientsUnselect = function() {
                            cyChart.$('edge[edgeType="cn"]').remove();
                            var opts = createOptions();
                            if (opts.patients.selected.length > 0 || opts.genes.selected.length > 0) setOptions(opts);
                            setPatientCohort(opts);
                        };
                        var patientsSelect = function() {
                            cyChart.$('edge[edgeType="cn"]').remove();
                            var opts = createOptions();
                            setOptions(opts);
                            setPatientCohort(opts);
                        };
                        var genesUnselect = function() {
                            cyChart.$('edge[edgeType="cn"]').remove();
                            var opts = createOptions();
                            if (opts.patients.selected.length > 0 || opts.genes.selected.length > 0) setOptions(opts);
                            setGeneCohort(opts);
                        };
                        var genesSelect = function() {
                            cyChart.$('edge[edgeType="cn"]').remove();
                            var opts = createOptions();
                            setOptions(opts);
                            setGeneCohort(opts);
                        };

                        signal.patients.select.add(updatePatientCounts);
                        signal.patients.unselect.add(updatePatientCounts);
                        signal.genes.over.add(setGeneInfo);
                        signal.genes.out.add(setGeneInfo);
                        signal.patients.over.add(setPatientInfo);
                        signal.patients.out.add(setPatientInfo);
                        signal.patients.select.add(patientsSelect);
                        signal.patients.unselect.add(patientsUnselect);
                        signal.genes.select.add(genesSelect);
                        signal.genes.unselect.add(genesUnselect);
                        break;

                    case "Ad Hoc":
                        var over = function(e) {
                            cyChart.nodes().unselect();
                            e.cyTarget.select();
                            setOptions(createOptions());
                        };
                        var out = function(e) {
                            e.cyTarget.unselect();
                            cyChart.startBatch();
                            cyChart.$('edge[edgeType="cn"]').remove();
                            cyChart.$('node[nodeType="gene"]')
                                .forEach(function(ele) {
                                    ele.data("color", "#0096d5");
                                    ele.data("sizeBdr", 1);
                                    ele.data("colorBdr", "#FFFFFF");
                                });
                            cyChart.endBatch();
                        };
                        signal.genes.over.add(setGeneInfo);
                        signal.genes.out.add(setGeneInfo);
                        signal.patients.over.add(setPatientInfo);
                        signal.patients.out.add(setPatientInfo);
                        signal.patients.over.add(over);
                        signal.patients.out.add(out);
                        signal.genes.over.add(over);
                        signal.genes.out.add(out);
                        break;
                }
            });

            var onPatientColorChange = function(colors) {

                if (colors === null) return;
                mpState.setColors(colors);

                vm.showPanelColor = false;
                vm.legendCaption = colors.name;
                vm.legendNodes = colors.data;

                if (colors.name == "None") {
                    vm.legendCaption = "";
                    cyChart.startBatch();
                    cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                        node.data('color', '#0096d5');
                    });
                    cyChart.endBatch();

                    return;
                }

                var degMap = colors.data.reduce(function(p, c) {
                    for (var i = 0; i < c.values.length; i++) {
                        p[c.values[i]] = c.color;
                    }
                    return p;
                }, {});

                cyChart.startBatch();
                cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                    if (degMap.hasOwnProperty(node.id())) {
                        node.data('color', degMap[node.id()]);
                    } else {
                        node.data('color', '#DDD');
                    }

                });
                cyChart.endBatch();
                $timeout(updatePatientCounts);
            };

            osApi.onPatientColorChange.add(onPatientColorChange);

            // Destroy
            $scope.$on('$destroy', function() {
                mpState.save(vm, cyChart);
                osApi.onPatientColorChange.remove(onPatientColorChange);
                worker.terminate();
                signal.clear();
            });
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osLogin', login);

    /** @ngInject */
    function login() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/login/login.html',
            replace: true,
            controller: LoginController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function LoginController(osApi, $state, $scope, osAuth) {

            var vm = this;
            vm.networks = osAuth.getAuthSources();
            vm.login = osAuth.login;
            vm.logout = osAuth.logout;
            
            var loginSuccess = function() {
                $state.go("userdatasource");
                
            };
    
            osAuth.onLogin.add(loginSuccess); 
            
            // Desotroy
            $scope.$on('$destroy', function() {
                osAuth.onLogin.remove(loginSuccess);
            });
        }
    }
})();

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osLoader', login);

    /** @ngInject */
    function login() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/loader/loader.html',
            replace: true
        };

        return directive;
    }

})();

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osLayoutPanel', layoutPanel);

    /** @ngInject */
    function layoutPanel() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/layoutPanel/layoutPanel.html',
            controller: LayoutPanelController,
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                close: "&"
            }
        };

        return directive;

        /** @ngInject */
        function LayoutPanelController(osApi, d3, _) {

            // Properties
            var vm = this;
            vm.showPanelColorRna = false;
            vm.colorScales = [{ name: "Quantile" }, { name: "Quantize" }];
            vm.colorScale = vm.colorScales[0];
            vm.colorBins = [2, 3, 4, 5, 6, 7, 8].map(function(v) { return { name: v + " Bins", value: v }; });
            vm.colorBin = vm.colorBins[2];
            vm.colorOptions = osApi.getDataSource().colors;
            if (angular.isDefined(vm.colorOptions)) {
                if (vm.colorOptions.length !== 0) vm.colorOption = vm.colorOptions[0];
            }


            var tbl = osApi.getDataSource().category.filter(function(v) {
                return v.type == 'color';
            })[0].collection;

            osApi.query(tbl, {
                type: 'color',
                dataset: osApi.getDataSource().dataset,
                $fields: ['name', 'subtype']
            }).then(function(v) {

                var data = v.data.reduce(function(p, c) {
                    if (!p.hasOwnProperty(c.subtype)) p[c.subtype] = [];
                    p[c.subtype].push(c);
                    return p;
                }, {});

                vm.optPatientColors = Object.keys(data).map(function(key) {
                    return {
                        name: key,
                        values: this[key].sort(function(a, b) {
                            if (a.name > b.name) return 1;
                            if (a.name < b.name) return -1;
                            return 0;
                        })
                    };
                }, data);

            });



            vm.setColor = function(item) {
                osApi.setBusy(true);
                vm.close();
                if (item.name == "None") {
                    osApi.setPatientColor({
                        "dataset": osApi.getDataSource().dataset,
                        "type": "color",
                        "name": "None",
                        "data": [],
                        show: true
                    });
                    return;
                }

                osApi.query(tbl, {
                    type: 'color',
                    dataset: osApi.getDataSource().dataset,
                    name: item.name
                }).then(function(v) {
                    var data = v.data[0];
                    data.data = data.data.map(function(v) {
                        var name = v.name.toLowerCase().trim();
                        if (name === "" || name == "null" || name == "undefined") {
                            v.name = "Null";
                            v.color = "#DDDDDD";
                        }
                        v.id = "legend-" + v.color.substr(1);
                        return v;
                    }).sort(function(a, b) {
                        var aname = (isNaN(a.name)) ? a.name : parseInt(a.name);
                        var bname = (isNaN(b.name)) ? b.name : parseInt(b.name);
                        if (aname < bname) return -1;
                        if (aname > bname) return 1;
                        if (a.name == "Null") return 1;
                        if (b.name == "Null") return -1;
                        return 0;
                    });

                    osApi.setPatientColor(v.data[0]);
                    osApi.setBusy(false);
                    vm.close();
                });
            };


            vm.setGeneColor = function() {
                var genes = ("+" + vm.geneColor.replace(/\s/g, '').toUpperCase()).match(/[-+]\w*/gi).map(function(v) {
                    return {
                        op: v.substr(0, 1),
                        gene: v.substr(1).toLowerCase(),
                        message: "",
                        status: ""
                    };
                });
                osApi.setBusy(true);
                osApi.query("lookup-genes", { symbols: { $in: genes.map(function(v) { return v.gene; }) } }).then(function(result) {
                    vm.close();
                    genes.map(function(v) {
                        var gene = this.filter(function(s) {
                            return (s.symbols.indexOf(this) != -1);
                        }, v.gene);

                        if (gene.length === 0) {
                            v.message = v.gene.toUpperCase();
                            v.status = "Removed";
                        } else if (gene.length > 1) {
                            v.message = v.gene.toUpperCase() + " -> " + gene[0].hugo.toUpperCase();
                            v.status = "Converted";
                        } else if (gene.length == 1) {
                            if (v.gene != gene[0].hugo) {
                                v.message = v.gene.toUpperCase() + " -> " + gene[0].hugo.toUpperCase();
                                v.status = "Converted";
                            }
                        }
                    }, result.data);

                    var msgs = _.sortBy(
                        genes.filter(function(v) { return v.status !== ""; }), "length");

                    var types = _.groupBy(msgs, function(gene) { return gene.status; });

                    var msg = "";

                    if (angular.isDefined(types.Removed) && types.Removed.length > 0) {
                        msg += "Removed: " + types.Removed.map(function(v) { return v.message + " - "; });
                    }
                    if (msg.length > 0) msg = msg.substr(0, msg.length - 2) + "\r\n";
                    if (angular.isDefined(types.Converted) && types.Converted.length > 0) {
                        msg += "Converted: " + types.Converted.map(function(v) { return v.message + "\r\n"; });
                    }
                    if (msg.trim().length > 0) alert(msg);
                    var geneset = genes.filter(function(v) { return v.status != "Removed"; }).map(function(v) {
                        return v.gene.toUpperCase();
                    });
                    osApi.query(vm.colorOption.collection, {
                        gene: {
                            '$in': geneset
                        }
                    }).then(function(results) {

                        if (results.data.length > 0) {
                            var data;
                            if (results.data.length == 1)
                                data = results.data[0];
                            else {
                                data = {};
                                data.patients = results.data.reduce(function(p, c) {
                                    var fn = p.lookup[c.gene];
                                    for (var i = 0; i < p.pids.length; i++) {
                                        var pid = p.pids[i];
                                        var iv = p.output.hasOwnProperty(pid) ? p.output[pid] : 0;
                                        if (fn === "+") p.output[pid] = iv + c.patients[pid];
                                        if (fn === "-") p.output[pid] = iv - c.patients[pid];
                                    }
                                    return p;
                                }, {
                                    pids: Object.keys(results.data[0].patients),
                                    lookup: genes.reduce(function(p, c) {
                                        p[c.gene] = c.op;
                                        return p;
                                    }, {}),
                                    output: {}
                                }).output;

                                var range = Object.keys(data.patients).reduce(function(p, c) {
                                    p.min = Math.min(p.min, p.values[c]);
                                    p.max = Math.max(p.min, p.values[c]);
                                    return p;
                                }, {
                                    values: data.patients,
                                    min: Infinity,
                                    max: -Infinity
                                });
                                data.min = range.min;
                                data.max = range.max;
                            }

                            // Color Patients
                            var colors = ["#9d1cb2", "#00a7f7", "#3d4eb8", "#ff9900", "#f7412d", "#795548", "#E91E63", "#673AB7"];
                            var values = colors.splice(0, vm.colorBin.value);

                            var scale = (vm.colorScale.name == "Quantile") ? d3.scaleQuantile() : d3.scaleQuantize();



                            // Combine Colors + Scale Into Name + Value
                            var labels;
                            if (vm.colorScale.name == "Quantile") {
                                scale.domain(Object.keys(data).map(function(key) { return data[key]; }, { data: data })).range(values);
                                labels = scale.quantiles().map(function(v) { return parseFloat(v).toFixed(3); });
                                labels.unshift("");
                                labels = labels.map(function(c, i, a) {
                                    if (i === 0) { return "-\u221e \u2194 " + a[1]; } else if (i == a.length - 1) {
                                        return a[i] + " \u2194 +\u221e";
                                    }
                                    return a[i] + " \u2194 " + a[i + 1];
                                });
                                values = _.zip(values, labels).map(function(v) { return { color: v[0], name: v[1] }; });
                            } else {
                                scale
                                    .domain([data.min, data.max])
                                    .range(values);
                                labels = scale.ticks(values.length).map(function(v) { return "~" + parseFloat(v).toFixed(2); });
                                values = _.zip(values, labels).map(function(v) { return { color: v[0], name: v[1] }; });
                            }
                            data = Object.keys(data.patients).map(function(id) {
                                    return {
                                        id: id,
                                        color: this.scale(this.patients[id]),
                                        value: this.patients[id]
                                    };
                                }, {
                                    patients: data.patients,
                                    scale: scale
                                })
                                .reduce(function(p, c) {
                                    if (!p.hasOwnProperty(c.color)) p[c.color] = [];
                                    p[c.color].push(c.id);
                                    return p;
                                }, {});

                            data = Object.keys(data).map(function(key) {
                                return {
                                    color: key,
                                    name: this.names.filter(function(f) {
                                        return f.color == this.color;
                                    }, {
                                        color: key
                                    })[0].name,
                                    values: this.data[key]
                                };
                            }, {
                                data: data,
                                names: values
                            });

                            data = data.sort(function(a, b) {
                                if (a.name.indexOf("-\u221e") != -1) return -1;
                                if (b.name.indexOf("-\u221e") != -1) return 1;
                                if (a.name.indexOf("+\u221e") != -1) return 1;
                                if (b.name.indexOf("+\u221e") != -1) return -1;
                                if (a.name < b.name) return -1;
                                if (a.name > b.name) return 1;
                                return 0;
                            });
                            data.push({
                                color: '#DDD',
                                name: 'Null',
                                values: []
                            });

                            colors = {
                                dataset: osApi.getDataSource().dataset,
                                type: 'color',
                                name: genes.reduce(function(p, c) {
                                    p += c.op + c.gene + " ";
                                    return p;
                                }, ""),
                                data: data
                            };
                            osApi.setPatientColor(colors);
                        }
                        osApi.setBusy(false);
                    });
                });

            };
        }
    }
})();
(function() {
    'use strict';
    angular
        .module('oncoscape')
        .directive('osLanding', landing);

    /** @ngInject */
    function landing() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/landing/landing.html',
            replace: true,
            controller: LandingController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function LandingController($state) {

            angular.element(".marquee-x").marquee({
                particlesNumber: 79,
                color: '#1396de',
                particle: {
                    speed: 39
                }
            });

            var vm = this;
            vm.login = function() {
                $state.go("login");
            };

            vm.getStarted = function() {
                $state.go("userdatasource");
            };
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osImportPanel', importPanel);

    /** @ngInject */
    function importPanel() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/importpanel/importpanel.html',
            controller: ImportPanelController,
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                close: "&"
            }
        };

        return directive;

        /** @ngInject */
        function ImportPanelController(osApi, d3, _) {

            // Properties
            var vm = this;
            vm.genesets = osApi.getGenesets();
            vm.showGeneImport = true;
           
            // Import Geneset Command 
            vm.importGeneIds = "";
            vm.importGeneset = function() {
                var ids = vm.importGeneIds.split(",").map(function(v) { return v.trim(); });
                osApi.importGeneIds(ids, vm.importGenesetName);
                vm.importGeneIds = "";
                vm.importGenesetName = "";
                vm.showGeneImport = false;
            };

            vm.setGenesetList = function(geneset) {
                geneset.show=true
                osApi.setGeneset(geneset);
            };
            vm.addGenesetList = function() {
                osApi.saveGeneset();
            };
           

        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHelp', help);

    /** @ngInject */
    function help() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/help/help.html',
            controller: HelpController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HelpController() {

        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHeatmap', heatmap);

    /** @ngInject */
    function heatmap() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/heatmap/heatmap.html',
            controller: HeatmapController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HeatmapController(d3, osApi, $state, $timeout, $scope, $stateParams, $window, _) {

            // view Model
            var vm = this;
            vm.datasource = osApi.getDataSource();
            vm.rowLabels = vm.colLabels = vm.gridlines = false;
            vm.rowDendrogram = vm.colDendrogram = true;
            vm.colorSchemes = [
                { name: 'Blues', value: ["#303f9f", "#03a9f4"] },
                { name: 'Black / Blue', value: ["#000000", "#1d85cb"] },
                { name: 'Black / Red', value: ["#000000", "#D32F2F"] },
                { name: 'Red / Yellow', value: ["#D32F2F", "#FFEB3B"] }
            ]
            vm.colorScheme = vm.colorSchemes[0]
            vm.scales = [{ name: 'None' }, { name: 'Row' }, { name: 'Column' }]
            vm.scale = vm.scales[2];
            vm.dendrogramClusters = [
                { name: 'One', value: 1 },
                { name: 'Two', value: 2 },
                { name: 'Three', value: 3 },
                { name: 'Four', value: 4 },
                { name: 'Five', value: 5 },
                { name: 'Six', value: 6 },
                { name: 'Seven', value: 7 },
                { name: 'Eight', value: 8 },
                { name: 'Nine', value: 9 },
                { name: 'Ten', value: 10 }
            ];
            vm.dendrogramCluster = vm.dendrogramClusters[6];

            // Element References
            var elChart = d3.select("#heatmap-chart");
            var colDend = elChart.append("svg").classed("dendrogram colDend", true);
            //var colDendObj;
            var rowDend = elChart.append("svg").classed("dendrogram rowDend", true);
            //var rowDendObj;
            var colmap = elChart.append("svg").classed("colormap", true);
            //var colmapObj;
            var xaxis = elChart.append("svg").classed("axis xaxis", true);
            var yaxis = elChart.append("svg").classed("axis yaxis", true);

            // Load Inital Data
            var args;
            var data;


            function axis(svg, data, width, height, x, y, rotated) {
                svg.select("g").remove();
                if (rotated ? !vm.colLabels : !vm.rowLabels) return;

                svg
                    .attr("width", width).attr("height", height)
                    .style("position", "absolute")
                    .style("left", x)
                    .style("top", y);

                var g = svg.append("g");
                var yScale = d3.scaleLinear().domain([0, data.length]).range([0, rotated ? width : height]);

                var textAnchor = (rotated) ? "start" : "start";
                var textX = (rotated) ? 20 : 10;
                var labels = g.selectAll('label').data(data);

                labels
                    .enter().append("text")
                    .attr(rotated ? "x" : "y", function(d, i) { return yScale(i + .8); })
                    .attr(rotated ? "y" : "x", textX)
                    .attr("text-anchor", textAnchor)
                    .attr("font-size", "12px")
                    .text(function(d) { return d; });
            }

            function dendrogram(svg, data, width, height, xPos, yPos, rotated) {

                svg.select("g").remove();
                if (rotated ? !vm.colDendrogram : !vm.rowDendrogram) return;

                var hierarchy = d3.hierarchy(data);

                var cluster = d3.cluster()
                    .separation(function() { return 1; })
                    .size((rotated) ? [width, height] : [height, width]);

                var x = d3.scaleLinear()
                    .domain([0, (rotated) ? height : width])
                    .range([0, (rotated) ? height : width]);

                var y = d3.scaleLinear()
                    .domain([0, data.height])
                    .range([(rotated) ? height : width, 0]);

                var c = cluster(hierarchy);

                var links = c.links().map(function(l) {
                    return {
                        source: { x: l.source.x, y: l.source.data.height },
                        target: { x: l.target.x, y: l.target.data.height },
                        edgePar: l.target.data.edgePar
                    };
                });

                var dendrG = svg
                    .attr("width", width)
                    .attr("height", height)
                    .style("position", "absolute")
                    .style("left", xPos)
                    .style("top", yPos)
                    .append("g")

                dendrG.append("rect")
                    .attr("width", (rotated) ? height : width)
                    .attr("height", (rotated) ? width : height)
                    .style("fill", "#FFF")

                if (rotated) {
                    var transform = "rotate(90," + height / 2 + "," + height / 2 + ") translate(0," + (-width + height) + ")"
                    dendrG.attr("transform", transform);
                }

                var lines = dendrG.selectAll("polyline").data(links);
                lines
                    .enter().append("polyline")
                    .attr("class", "denolink")
                    .attr("points", function(d) {
                        return y(d.source.y) + "," + d.source.x + " " +
                            y(d.source.y) + "," + d.target.x + " " +
                            y(d.target.y) + "," + d.target.x;
                    })
                    .style("stroke", function(d) {
                        return d.edgePar.col;
                    });

                return {
                    g: dendrG,
                    scaleY: y,
                    scaleX: x,
                    rotated: rotated,
                    data: links
                }
            }

            function heatmap(svg, data, width, height, x, y) {


                svg.select("g").remove();
                svg.attr("width", width).attr("height", height).style("left", x).style("top", y).style("position", "absolute");

                var map = svg.append("g").attr("width", width).attr("height", height);
                var brush = svg.append("g").attr("width", width).attr("height", height).attr("class", "brush");

                var maxValue = Math.max.apply(null, data.data);
                var minValue = Math.min.apply(null, data.data);

                var color = d3.scaleLinear().domain([minValue, maxValue]).range(vm.colorScheme.value);

                var cols = data.dim[0];
                var rows = data.dim[1];

                var xScale = d3.scaleLinear().domain([0, cols]).range([0, width]);
                var yScale = d3.scaleLinear().domain([0, rows]).range([0, height]);


                var grid = (vm.gridlines) ? 1 : -1;

                function brushend() {


                    if (!d3.event.sourceEvent) return; // Only transition after input.
                    if (!d3.event.selection) return; // Ignore empty selections.
                    //var colBounds = 
                    d3.event.selection.map(function(v) { return this.invert(v[0], v[1]); }, xScale).map(Math.round);
                    //var span = colBounds[1] - colBounds[0];
                    //var start = colBounds[0];
                    //var ids = data.cols.splice(start, span);

                    var coords = d3.event.selection;
                    //coords[0][0] = colBounds[0] * width;
                    coords[0][1] = 0;
                    //coords[1][0] = colBounds[1] * width;
                    coords[1][1] = height;

                    d3.select(this)
                        .transition()
                        .call(d3.event.target.move, coords);


                }
                brush.call(
                    d3.brush().on("end", brushend)
                )

                var boxW = xScale(1) - grid;
                var boxH = yScale(1) - grid;

                var boxes = map.selectAll('rect').data(data.data);
                boxes
                    .enter().append("rect")
                    .attr("class", "box")
                    .attr("colIndex", function(d, i) { return i % cols; })
                    .attr("rowIndex", function(d, i) { return Math.floor(i / cols); })
                    .attr("x", function(d, i) { return xScale(i % cols); })
                    .attr("y", function(d, i) { return yScale(i % rows); })
                    .attr("width", boxW)
                    .attr("height", boxH)
                    .attr("fill", function(d) { return color(d); });

                return {
                    g: map,
                    scaleY: yScale,
                    scaleX: xScale,
                    data: data.data,
                    cols: cols,
                    rows: rows,
                    boxW: boxW,
                    boxH: boxH
                }
            }

            function zoom() {

                /*
                                var xZoomBehavior = d3.zoom().scaleExtent([1, 5]);
                                var yZoomBehavior = d3.zoom().scaleExtent([1, 5]);
                                colDendObj.g.call(xZoomBehavior);
                                rowDendObj.g.call(yZoomBehavior);
                                xZoomBehavior.on('zoom', function() {

                                    var map = colmapObj;
                                    var mapX = d3.event.transform.rescaleY(map.scaleX);

                                    var boxW = map.scaleX(1);

                                    map.g.selectAll('.box').data(map.data)
                                        .attr("x", function(d, i) { return mapX(i % map.cols); })
                                        .attr("y", function(d, i) { return map.scaleY(i % map.rows); })
                                        .attr("width", boxW)

                                    var col = colDendObj;
                                    var colY = col.scaleY;
                                    var colX = d3.event.transform.rescaleY(col.scaleX);
                                    
                                    col.g.selectAll("polyline")
                                        .data(col.data)
                                        .attr("points", function(d){
                                            return colY(d.source.y) + "," + colX(d.source.x) + " " +
                                            colY(d.source.y)+ "," + colX(d.target.x) + " " +
                                            colY(d.target.y)+ "," + colX(d.target.x);
                                        });
                                });
                                yZoomBehavior.on('zoom', function() {

                                    var row = rowDendObj;
                                    var rowY = row.scaleY;
                                    var rowX = d3.event.transform.rescaleY(row.scaleX);
                                    
                                    var map = colmapObj;
                                    var mapY = d3.event.transform.rescaleX(map.scaleY);

                                    var boxW = scaleX(1);
                                    var boxH = yScale(1)-grid;

                                    map.g.selectAll('.box').data(map.data)
                                        .attr("x", function(d, i) { return map.scaleY(i % map.cols); })
                                        .attr("y", function(d, i) { return mapY(i % map.rows); })
                                        .attr("width", boxW)
                                    
                                    row.g.selectAll("polyline")
                                        .data(row.data)
                                        .attr("points", function(d){
                                            return rowY(d.source.y) + "," + rowX(d.source.x) + " " +
                                            rowY(d.source.y)+ "," + rowX(d.target.x) + " " +
                                            rowY(d.target.y)+ "," + rowX(d.target.x);
                                        });
                                });
                */
            }

            osApi.setBusy(true);
            vm.loadData = function() {
                osApi.query("brca_psi_bradleylab_miso", {
                    '$limit': 100
                }).then(function(response) {
                    args = {
                        data: response.data.map(function(v) {
                            Object.keys(v.patients).forEach(function(key) {
                                if (this[key] == null) this[key] = 0;
                            }, v.patients);
                            return v.patients;
                        })
                    };
                    vm.loadHeatmap();
                });
            };
            vm.loadHeatmap = function() {
                osApi.setBusy(true);
                rowDend.select("g").remove();
                colDend.select("g").remove();
                colmap.select("g").remove();
                args.scale = vm.scale.name.toLowerCase();
                args.kcol = args.krow = vm.dendrogramCluster.value;
                osApi.getCpuApi().getHeatmap(args).then(function(v) {
                    data = angular.fromJson(v);
                    vm.draw();
                    osApi.setBusy(false);
                });
            }
            vm.draw = function() {

                var layout = osApi.getLayout();
                var width = $window.innerWidth - layout.left - layout.right - 40;
                var height = $window.innerHeight - 160; //10
                var hmWidth = width - ((vm.rowLabels) ? 160 : 0) - ((vm.rowDendrogram) ? 80 : 0);
                var hmHeight = height - ((vm.colLabels) ? 160 : 0) - ((vm.colDendrogram) ? 80 : 0);
                //colmapObj = 
                heatmap(colmap, data.matrix,
                    hmWidth,
                    hmHeight,
                    (vm.rowDendrogram ? 80 : 0) + layout.left + 20,
                    (vm.colDendrogram ? 80 : 0));

                //rowDendObj = 
                dendrogram(rowDend, data.rows,
                    80, hmHeight,
                    layout.left + 20, (vm.colDendrogram ? 80 : 0), false);

                //colDendObj = 
                dendrogram(colDend, data.cols,
                    hmWidth, 80,
                    (vm.rowDendrogram ? 80 : 0) + layout.left + 20, 0, true);

                axis(xaxis,
                    data.matrix.rows,
                    160, hmHeight, hmWidth + (vm.rowDendrogram ? 80 : 0) + layout.left + 20, (vm.colDendrogram ? 80 : 0), false);

                axis(yaxis, data.matrix.cols,
                    hmWidth, 160, (vm.rowDendrogram ? 80 : 0) + layout.left + 20, hmHeight + (vm.colDendrogram ? 80 : 0), true);

                zoom();
            };

            vm.loadData();

            osApi.onResize.add(vm.draw);
            angular.element($window).bind('resize', _.debounce(vm.draw, 300));
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHeader', header);

    /** @ngInject */
    function header() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/header/header.html',
            scope: {},
            controller: HeaderController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HeaderController(osApi, osAuth, $stateParams, $state, $window) {

            // View Model
            var vm = this;
            vm.showImport = false;
            vm.showTools = false;
            vm.showDatasets = false;
            vm.datasources = [];
            vm.tools = [];
            vm.cohorts = [];
          
            

            // State Management
            osApi.onNavChange.add(function(state) {
                switch (state) {
                    case "TOOLS":
                        vm.showTools = false;
                        vm.showDatasets = false;
                        break;
                    case "TOOL":
                        vm.showTools = true;
                        vm.showDatasets = true;
                        vm.datasources = osApi.getDataSources();
                        vm.tools = osApi.getTools();
                        vm.cohorts = osApi.getCohorts();
                        
                        break;
                    default:
                        vm.showTools = false;
                        vm.showDatasets = false;
                        break;
                }
            });

            // Cohort Commands
            vm.addPatientCohort = function() {
                osApi.saveCohort();
            };
           

            // State Command
            vm.setPatientCohort = function(cohort) {
                osApi.setCohort(cohort);
            };
            

            // Import Cohorts Command 
            vm.importIds = "";
            vm.importCohort = function() {
                var ids = vm.importIds.split(",").map(function(v) { return v.trim(); });
                osApi.importIds(ids, vm.importName);
                vm.importIds = "";
                vm.importName = "";
                vm.showImport = false;
            };

            
            osApi.onshowGenesetImportChange.add(function(show) {
                
                vm.showImport = show
            });

            var updateUser = function(user){
                vm.user=osAuth.getUser()
            }
            osAuth.onLogin.add(updateUser); 
            osAuth.onLogout.add(updateUser); 

            vm.login = function() {
                var networks = osAuth.getAuthSources();
                osAuth.login(networks[1]);

                //$state.go("login");
            };
            vm.logout = function() {

                
                osAuth.logout()
                localStorage.clear();
                //$window.reload(true);
                $window.location.href = "#";
                //$window.reload();
                
            };
            vm.showHelp = function() {
                $window.open("\\documentation" + $state.current.help.toString());
            };

            // Update Cohorts When Datasource Changes
            osApi.onCohortsChange.add(function() {
                vm.cohorts = osApi.getCohorts();
            });

            // Load Dataset Command - Navigation
            vm.showDatasources = function() {
                $state.go("userdatasource");

            };

            // Load Tool Command - Navigation
            vm.loadTool = function(tool) {
                $state.go(tool, { datasource: osApi.getDataSource().dataset });
                angular.element('.navbar-collapse').collapse('hide');
            };



        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osGeneMenu', geneMenu);

    /** @ngInject */
    function geneMenu() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/genemenu/genemenu.html',
            controller: GeneMenuController,
            controllerAs: 'vm',
            scope: {},
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function GeneMenuController(osApi, $state, $scope, $sce, $timeout, $rootScope, $filter, d3) {


            // View Model
            var vm = this;
            vm.genesets = osApi.getGenesets();
            vm.geneset = osApi.getGeneset();
            vm.importGeneIds = "";
            vm.importGenesetName = ""
            vm.showGeneImport = false;
            
            vm.genesetSummary = "";

            // Import to Active List
            vm.import = function(){
                osApi.showGenesetImport(true)
            }
            vm.importGeneset = function() {
                var ids = vm.importGeneIds.split(",").map(function(v) { return v.trim(); });
                osApi.importGeneIds(ids, vm.importGenesetName);
                vm.importGeneIds = "";
                vm.importGenesetName = "";
                vm.showGeneImport = false;
            };
            // vm.hideModal = function(){
            //     angular.element('#modal_geneImport').modal(false);
            // }

            //Update Geneset Availability
            vm.setGeneset = function(geneset) {
                if (angular.isString(geneset)) {
                    osApi.setGeneset([], osApi.ALLGENES, osApi.SYMBOL);
                } else {
                    osApi.setGeneset(geneset);
                }
            };
            vm.saveGeneset = function() {
                osApi.saveGeneset();
            };
            vm.updateGeneset = function() {
                if (vm.geneset.type == "UNSAVED") {
                    osApi.saveGeneset(vm.geneset);
                } else {
                    osApi.deleteGeneset(vm.geneset);
                }
            };
            vm.setGenesetList = function(geneset) {
                geneset.show=true
                osApi.setGeneset(geneset);
            };

            // Gene Service Integration
            osApi.onGenesetsChange.add(function(genesets) {
                vm.genesets = genesets;
            });
            osApi.onGenesetChange.add(function(geneset) {

                var website = ""; var genecounts = "";
                if(geneset.url.length >0) website = "  <a href='"+geneset.url+"' target='_blank'> [ref]</a>"
                if(geneset.geneIds !=0){
                    genecounts = "<br/><br/>Contains:<br/>" + 
                    $filter('number')(geneset.geneIds.length) + " Markers<br /> " +
                    $filter('number')(geneset.hugoIds.length) + " Hugo Symbols (###TODO) <br />";    
                } 
                var summary =   geneset.desc +website + genecounts;
                //$filter('number')(toolInfo.numGenes) + " Genes In Current Tool Showing<br />" +
                //$filter('number')(toolInfo.numSymbols) + " Hugo Symbols In Current Tool Showing<br />";

                vm.genesetSummary = $sce.trustAsHtml(summary);

                if (angular.isUndefined(geneset)) return;
                $timeout(function() {
                    vm.geneset = geneset;
                });
             
            });

        }
    }

})();
(function() {
  'use strict';

  angular
      .module('oncoscape')
      .directive('osGenedashboard', genedashboard);

  /** @ngInject */
  function genedashboard() {

    var directive = {
        restrict: 'E',
        templateUrl: 'app/components/genedashboard/genedashboard.html',
        controller: GenedashboardController,
        controllerAs: 'vm',
        bindToController: true
    };

    return directive;

    /** @ngInject */
    function GenedashboardController(osApi, $state, $timeout, $window, d3, $scope) {

      var vm = this;
      osApi.setBusy(false)
      vm.datasource = osApi.getDataSource();

      vm.range = {up: 100000, down: 100000} // 100 KB
      
      var samples = osApi.getCohort().sampleIds;
      //samples = ["TCGA-OL-A66H-01", "TCGA-3C-AALK-01", "TCGA-AR-A1AH-01", "TCGA-AC-A5EH-01", "TCGA-EW-A2FW-01"]

      // Elements
      var d3Chart = d3.select("#genedashboard-chart").append("svg");
      var d3Points = d3Chart.append("g");
      var d3vLines = d3Chart.append("g");
      var genes, circles;

      var acceptableDatatypes = ["expr", "cnv", "mut01", "meth_thd", "meth", "cnv_thd"];

      var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
        return "Gene: "+d.gene+"<br/>Sample: " + d.id + "<br>Value: " + d[2];
      });
      d3Chart.call(elTip);

      // Properties
      var scaleX, scaleY, axisY;
      var data, minMax;
      var width, height;

      // Utility Functions
      function setSelected() {
        var selectedIds = cohort.sampleIds;
        if(typeof selectedIds != "undefined"){
           d3Points.selectAll("circle").classed("coord-node-selected", function() {
                return (selectedIds.indexOf(this.__data__.id) >= 0);
            });
        }

    }
      
    var lasso_start = function() {

        lasso.items()
            .attr("r", 3.5) // reset size
            .classed("not_possible", true)
            .classed("selected", false);
    };

    var lasso_draw = function() {

        // Style the possible dots
        lasso.possibleItems()
            .classed("not_possible", false)
            .classed("possible", true);

        // Style the not possible dot
        lasso.notPossibleItems()
            .classed("not_possible", true)
            .classed("possible", false);
    };

    var lasso_end = function() {

      // Reset the color of all dots
        lasso.items()
            .classed("not_possible", false)
            .classed("possible", false);

        var ids = lasso.selectedItems().data().map(function(d) {
            return d.id;
        });
        osApi.setCohort(ids, "COORD", osApi.SAMPLE);

    };

    var lasso = d3.lasso()
        .closePathSelect(true)
        .closePathDistance(100)
        .targetArea(d3Chart)
        .on("start", lasso_start)
        .on("draw", lasso_draw)
        .on("end", lasso_end);   

    var draw = function(){ 
        
        // Size
        var layout = osApi.getLayout();
        width = $window.innerWidth - layout.left - layout.right;
        height = $window.innerHeight - 200; //10
        angular.element("#genedashboard-chart").css({
            "width": width + "px",
            "padding-left": layout.left + "px"
        });

        d3Chart.attr("width", width).attr("height", height);
        d3Points.attr("width", width).attr("height", height);
        d3vLines.attr("width", width).attr("height", height);

        minMax = data.map(function(d){return d3.extent(Object.values(d).filter(function(v) { return !_.isString(v)}))})
                      .reduce(function(p,c){
                        if(c[0] < p[0]) p[0] = c[0]
                        if(c[1] > p[1]) p[1] = c[1]
                        return p;
                      },[Infinity,-Infinity])


        // Scale
        var x = d3.scalePoint().domain(vm.genes).range([75, width - 75]),
            y = d3.scaleLinear().domain(minMax).range([height - 20, 20]);

        // Create a scale and brush for each gene.
        // vm.genes.forEach(function(d) {
        //   // Coerce values to numbers.
        //   data.forEach(function(p) { p[d] = +p[d]; });
      
        //   // y[d] = d3.scaleLinear()
        //   //     .domain(d3.extent(data, function(p) { return p[d]; }))
        //   //     .range([height - 20, 20]);
      
        //   // y[d].brush = d3.svg.brush()
        //   //     .y(y[d])
        //   //     .on("brush", brush);
        // });

        

        // Returns the path for a given data point.
        function coords(d) {
          //return vm.genes.map(function(p) { return [x(p), y[p](d[p])]; });
          return vm.genes.map(function(p) { return [x(p), y(d[p]), d[p], p]; });
        }

        var coordpairs_bysmple = data.map(function(d) { return coords(d)})
        var coordpairs = _.flatten(coordpairs_bysmple, true)
        coordpairs = coordpairs.map(function(d,i){
            d.id = data[Math.floor(i/coordpairs_bysmple[0].length)].sample; 
            d.gene = d[3]
            return d;})
  
        genes = d3vLines.selectAll(".gene").data(vm.genes)

        var tickCount = 10
        var axis_display = "axis-show-name"

        if(coordpairs[1][0] - coordpairs[0][0] < 40){
          tickCount =0
          axis_display = "axis-hide-name"
        }
        
        axisY = d3.axisLeft().scale(y).ticks(tickCount);
        
        // add new data
        var g = genes.enter().append("g")
          .attr("class", function(d){ 
            return "gene " + d})
          .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        
        g.append("g")   //only run on new elements coming in
          .attr("class", "axis")
          .each(function(d) { d3.select(this).call(axisY.scale(y)); })
          //.each(function(d) { d3.select(this).call(axisY.scale(y[d])); })
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", 10)
            .text(String)
            .attr("class", "axis-name "+ axis_display);

        // update existing data
        genes
          .select('.axis')
          .each(function(d) { d3.select(this).call(axisY.scale(y)); })
          //.each(function(d) { d3.select(this).call(axisY.scale(y[d])); })
            .select(".axis-name")
            .attr("text-anchor", "middle")
            .attr("y", 10)
            .text(String)
            .attr("class", "axis-name "+ axis_display);

        genes.attr("class", function(d){ return "gene " + d})
          .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        
        // remove old data
        genes.exit().remove()
        g.exit().remove()

        d3vLines.select("."+vm.gene)
          .select('.axis-name')
          .attr("class", "axis-name axis-show-name")
          .attr("text-anchor", "middle")
          .attr("y", 10)
          .text(String);

        // Draw
        circles = d3Points.selectAll("circle").data(coordpairs);
        circles.enter().append("circle")
            .attr("class", "coord-node")
            .attr("cx", function(d) {
                return d[0];
            })
            .attr("cy", function(d) {
                return d[1];
            })
            .attr("r", 3)
            .style("fill", function(d) {
                return d.color;
            })
            .on("mouseover", elTip.show)
            .on("mouseout", elTip.hide);

        circles.exit()
            // .transition()
            // .duration(200)
            // .delay(function(d, i) {
            //     return i / 300 * 100;
            // })
            .style("fill-opacity", "0")
            .remove();
        circles
            .style("fill", function(d) {
                return d.color;
            })
            // .transition()
            // .duration(750)
            // .delay(function(d, i) {
            //     return i / 300 * 100;
            // })
            .attr("r", 3)
            .attr("cx", function(d) {
                return d[0];
            })
            .attr("cy", function(d) {
                return d[1];
            })
            .style("fill", function(d) {
                return d.color;
            })
            .style("fill-opacity", 0.8);

          lasso.items(d3Points.selectAll("circle"));
          d3Chart.call(lasso);
          
          setSelected();
          onCohortChange(osApi.getCohort());
          //onGenesetChange(osApi.getGeneset());
          osApi.setBusy(false);

    }
    
    var cohort = osApi.getCohorts();
    var onCohortChange = function(c) {
        cohort = c;
        setSelected();

    };
    osApi.onCohortChange.add(onCohortChange);
    
      
    vm.updateGene = function() {
            osApi.setBusy(true);
            vm.range.up = +vm.range.up
            vm.range.down = +vm.range.down
            callGeneRegion()
    };
    
      var callGeneRegion = function(){

        osApi.setBusy(true)
        osApi.query("lookup_hg19_genepos_minabsstart", {m: vm.gene}).then(function(response){
          var d = response.data
          if(d.length >0){
            vm.chr = d[0].chr
            osApi.query("lookup_hg19_genepos_minabsstart", {chr: vm.chr, pos: {$lt: d[0].pos + vm.range.down, $gt: d[0].pos - vm.range.up}}).then(function(resp){
              vm.genes_in_region = resp.data

              // while(vm.genes_in_region.length >12){
              //     var maxDist = _.max(vm.genes_in_region,function(g){ return Math.abs(d[0].pos - g.pos)})
              //       vm.genes_in_region = vm.genes_in_region.filter(function(g){return g.m != maxDist.m})
              // }
              vm.genes =  _.pluck(vm.genes_in_region,"m" )

              osApi.query(vm.molecular.collection, {m: {$in:vm.genes}}).then(function(r){
                var molecular = r.data
                var sampleIdx = _.range(0,molecular[0].s.length)

                if(samples.length !=0){ 
                    sampleIdx = molecular[0].s.map(function(s, i){
                        var matchS = _.contains(samples, s) ? i : -1
                        return matchS})
                }else{
                  samples = molecular[0].s
                }

                vm.genes = _.intersection(_.pluck(_.sortBy(vm.genes_in_region, "pos"), "m"), _.pluck(molecular, "m"))
                

                var tbl = jStat.transpose(molecular.map(function(g){return  g.d.filter(function(r, i){return _.contains(sampleIdx, i)})}))
                data = tbl.map(function(s, i){ var v =_.object( vm.genes,s); v["sample"] = samples[i]; return v }) 
                
                
                draw();
              });
            });
          }
        });
      }


      // Setup Watches
      $scope.$watch('vm.dataType', function() {
      
        if(angular.isUndefined(vm.molecularTables)) return;

        if (angular.isUndefined(vm.dataType)) {
          vm.dataType = vm.dataTypes[0];
        } else {
          var newSource = vm.dataTypes.filter(function(v) { return (v === vm.dataType); });
          vm.dataType = (newSource.length === 1) ? newSource[0] : vm.dataTypes[0];
        }
        var molecular_matches = vm.molecularTables.filter(function(d){return d.name == vm.dataType })
        if(molecular_matches.length ==1){
            vm.molecular = molecular_matches[0]
        }
        if(angular.isUndefined(vm.gene)){
          vm.gene = vm.molecular.m[0]
        } else if(_.intersection(vm.molecular.m, [vm.gene]).length == 0){
          window.alert("Gene "+vm.gene+" not in data type "+vm.dataType)
          vm.dataType = vm.state.dataType;
          return;
        }
        vm.state.dataType = vm.dataType
        callGeneRegion()
        
        
      });   
      // $scope.$watch('vm.gene', function() {
        //runs with every keystroke
      //     if (vm.gene === null) return;
      //     callGeneRegion()

      // });

      // App Event :: Resize
      osApi.onResize.add(draw);

      osApi.query("lookup_oncoscape_datasources_v2", {
        dataset: osApi.getDataSource().dataset
      }).then(function(response){
        vm.molecularTables = response.data[0].collections.filter(function(d){ return _.contains(acceptableDatatypes, d.type)})
        vm.molecularTables = vm.molecularTables.filter(function(d) { return !d.name.match(/protein/)})
        vm.dataTypes = _.uniq(_.pluck(vm.molecularTables, "name"))
        vm.dataType = vm.dataTypes[0]
        vm.state = {dataType:vm.dataType}
        
      })
        
    }  //end Controller
  }  //end genedashboard() 
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osDatasource', datasource);

    /** @ngInject */
    function datasource() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/datasource/datasource.html',
            controller: DatasourceController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function DatasourceController(osApi, $state) {
            var vm = this;
            vm.datasets = osApi.getDataSources();
            vm.explore = function(tool, datasource) {
                $state.go(tool, { datasource: datasource.dataset });
            };
            osApi.setBusy(false);
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osCompareCluster', compareCluster);

    /** @ngInject */
    function compareCluster() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/compareclusters/compareclusters.html',
            controller: CompareClusterController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CompareClusterController(osApi, d3, $state, $timeout, $scope, moment, $stateParams, _, $, $q, $window) {


            function zoomed() {
                elPlots.forEach(function(plot) {
                    plot.attr("transform", d3.event.transform);
                });
            }

            var layout = osApi.getLayout();
            var width = ($window.innerWidth - layout.left - layout.right);
            var height = ($window.innerHeight - 120);
            var zoom = d3.zoom()
                .scaleExtent([1, 40])
                .translateExtent([
                    [-100, -100],
                    [width + 90, height + 100]
                ])
                .on("zoom", zoomed);

            // Cohort
            var cohort = osApi.getCohort();
            var onCohortChange = function(c) {
                cohort = c;
                setSelected();
            };
            osApi.onCohortChange.add(onCohortChange);

            // Datasource
            var datasource = osApi.getDataSource();

            // View Model
            var vm = this;
            vm.optionColors = [];
            vm.optionLayouts = [];

            // State
            var clusterIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            var clusterColors = [];
            var clusterLayouts = [];

            // Elements
            var elChart = d3.select("#compareclusterChart").append("svg:svg");
            var elBrushes = clusterIndexes.map(function() { return d3.brush(); });
            elChart.call(zoom);
            var elPlots = clusterIndexes.map(function() { return elChart.append("svg:g"); });
            var elHitareas = elPlots.map(function(elPlot) { return elPlot.append("svg:rect"); });
            elHitareas.forEach(function(hitArea) {
                hitArea.attr("fill", "black");
                hitArea.attr("opacity", 0);
            });
            var elLines = [0, 1, 2, 3].map(function() { return elChart.append("svg:line"); });
            elLines.forEach(function(line) {
                line.attr("stroke", "#cbcbcb");
                line.attr("stroke-width", "1px");
            });

            // State Management
            var setSelected = function() {
                var selectedIds = cohort.sampleIds;
                clusterIndexes.forEach(function(clusterIndex) {
                    elPlots[clusterIndex].selectAll("circle").classed("pca-node-selected", function() {
                        return (selectedIds.indexOf(this.__data__.id) >= 0);
                    });
                });
            };
            // var saveState = function() {

            // }
            var loadState = function() {
                vm.optionLayouts = datasource.calculated.filter(function(v) { return (v.type === "pcaScores" || v.type === "mds"); });
                return new Promise(function(resolve) {
                    osApi.query('brain_color_tcga_import').then(function(v) {

                        // This piece of magic creates an object who's key is a sampleID and value is a color
                        vm.optionColors = v.data.map(function(colorOption) {
                            colorOption.lookup = colorOption.data.map(function(c) {
                                var colorMap = c.values.reduce(function(p, c) {
                                    p[c] = p.color;
                                    return p;
                                }, { color: (c.color === null) ? "black" : c.color });
                                delete colorMap.color;
                                //delete c.values;
                                return colorMap;
                            }).reduce(function(p, c) {
                                _.extend(p, c);
                                return p;
                            }, {});
                            return colorOption;
                        });

                        // Set Default Cluster Colors + layouts
                        clusterLayouts = vm.optionLayouts.splice(0, 9).map(function(v) { return { name: v.collection }; });
                        clusterColors = vm.optionColors.splice(0, 9);
                        resolve();
                    });
                });
            };

            // Brushes
            var brushStart = function() {
                if (d3.event.selection === null) return;
                var target = d3.event.target;
                elBrushes
                    .filter(function(b) {
                        return b.brush !== target;
                    })
                    .forEach(function(b) {
                        elPlots[b.index].call(b.move, null);
                    });
            };
            var brushEnd = function() {

                if (d3.event.selection === null) {

                    elChart.selectAll("circle")
                        .classed("pca-node-selected", false);
                    return;
                }
                var target = d3.event.target;
                var bv = d3.event.selection;
                var xScale = target.xScale;
                var yScale = target.yScale;
                var xMin = xScale.invert(bv[0][0]);
                var xMax = xScale.invert(bv[1][0]);
                var yMin = yScale.invert(bv[0][1]);
                var yMax = yScale.invert(bv[1][1]);

                elChart.selectAll("circle")
                    .classed("pca-node-selected", function(v) {
                        return (v.x >= xMin && v.x <= xMax && v.y >= yMin && v.y <= yMax);
                        //return (selectedIds.indexOf(this.__data__.id) >= 0);
                    });
                // Convert To PIDs
                // var sids = data.filter(function(v) {
                //     return (v.x >= xMin && v.x <= xMax && v.y >= yMin && v.y <= yMax);
                // }).map(function(v) { return v.id; });

                // elPlots[target.index].call(elBrushes[target.index].move, null);

            };

            // Layout Methods
            var loadLayout = function(clusterIndex) {
                return new Promise(function(resolve) {

                    var collection = clusterLayouts[clusterIndex].name;

                    osApi.query(collection).then(function(result) {

                        var data = result.data[0].data;
                        result.data[0].domain = Object.keys(data).reduce(function(p, c) {
                            var datum = data[c];
                            if (isNaN(datum.x) || isNaN(datum.y)) return p;
                            p.pc1[0] = Math.min(p.pc1[0], datum.x);
                            p.pc1[1] = Math.max(p.pc1[1], datum.x);
                            p.pc2[0] = Math.min(p.pc2[0], datum.y);
                            p.pc2[1] = Math.max(p.pc2[1], datum.y);
                            return p;
                        }, { pc1: [Infinity, -Infinity], pc2: [Infinity, -Infinity] });
                        result.data[0].bind = Object.keys(data).map(function(v) {
                            var rv = data[v];
                            rv.id = v;
                            return rv;
                        });
                        clusterLayouts[clusterIndex].data = result.data[0];
                        resolve(result.data[0]);
                    });
                });
            };

            loadState().then(function() {
                Promise.all(
                    clusterIndexes.map(function(clusterIndex) { return loadLayout(clusterIndex); })
                ).then(function() {
                    draw();
                    setSelected();
                });
            });

            var draw = function() {
                drawLines();
                clusterIndexes.forEach(drawCluster);
            };

            var drawLines = function() {
                var layout = osApi.getLayout();
                var width = ($window.innerWidth - layout.left - layout.right);
                var height = ($window.innerHeight - 120);
                elLines[0].attr("x1", 0).attr("y1", height * (1 / 3)).attr("x2", width).attr("y2", (height * 1 / 3));
                elLines[1].attr("x1", 0).attr("y1", height * (2 / 3)).attr("x2", width).attr("y2", (height * 2 / 3));
                elLines[2].attr("x1", width * (1 / 3)).attr("y1", 0).attr("x2", width * (1 / 3)).attr("y2", height);
                elLines[3].attr("x1", width * (2 / 3)).attr("y1", 0).attr("x2", width * (2 / 3)).attr("y2", height);
            };

            var drawCluster = function(clusterIndex) {

                // Inefficent
                var layout = osApi.getLayout();
                var width = ($window.innerWidth - layout.left - layout.right);
                var height = ($window.innerHeight - 120);
                elChart.attr("width", width).attr("height", height);
                var boxWidth = Math.floor(width / 3);
                var boxHeight = Math.floor(height / 3);

                // Resize Hitarea
                var elHitarea = elHitareas[clusterIndex];
                elHitarea
                    .attr("width", boxWidth)
                    .attr("height", boxHeight);

                // Figure Out Scale Hitarea
                var data = clusterLayouts[clusterIndex].data;
                var xScale = d3.scaleLinear().domain(data.domain.pc1).range([5, Math.min(boxWidth) - 5]);
                var yScale = d3.scaleLinear().domain(data.domain.pc2).range([5, Math.min(boxHeight) - 5]);
                var elPlot = elPlots[clusterIndex];


                var brush = elBrushes[clusterIndex];
                brush.on("start", brushStart);
                brush.on("end", brushEnd);
                brush.extent([
                    [0, 0],
                    [boxWidth, boxHeight]
                ]);

                elPlot.call(brush);
                brush.index = clusterIndex;
                brush.xScale = xScale;
                brush.yScale = yScale;
                elPlot.attr("transform", "translate(" + ((clusterIndex % 3) * boxWidth) + "," + (parseInt(clusterIndex / 3) * boxHeight) + ")");
                var circles = elPlot.selectAll("circle")
                    .data(data.bind);


                circles.enter()
                    .append("svg:circle")
                    .attr("cx", 0).attr("cy", 0)
                    .attr("class", "point")
                    .attr("r", 1)
                    .style("fill", function(d) { return clusterColors[clusterIndex].lookup[d.id]; })
                    .attr("cx", function(d) { return xScale(d.x); })
                    .attr("cy", function(d) { return yScale(d.y); });

                circles.exit()
                    .transition()
                    .duration(200)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .style("fill-opacity", "0")
                    .remove();

                circles
                    .transition()
                    .duration(750)
                    .attr("cx", function(d) { return xScale(d.x); })
                    .attr("cy", function(d) { return yScale(d.y); });


            };

            // // Listen For Resize
            osApi.onResize.add(draw);
            // angular.element($window).bind('resize',
            //     _.debounce(resize, 300)
            // );
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osColorPanel', colorPanel);

    /** @ngInject */
    function colorPanel() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/colorpanel/colorpanel.html',
            controller: ColorPanelController,
            controllerAs: 'vm',
            bindToController: true,
            scope: {
                close: "&",
                change: "&"
            }
        };

        return directive;

        /** @ngInject */
        function ColorPanelController(osApi, d3, _, $timeout) {

            // Properties
            var vm = this;
            vm.showPanelColorRna = false;
            vm.colorScales = [{ name: "Quantile" }, { name: "Quantize" }];
            vm.colorScale = vm.colorScales[0];
            vm.colorBins = [2, 3, 4, 5, 6, 7, 8].map(function(v) { return { name: v + " Bins", value: v }; });
            vm.colorBin = vm.colorBins[2];
            vm.colorOptions = osApi.getDataSource().colors;
            vm.colorFields = {}

            if (angular.isDefined(vm.colorOptions)) {
                if (vm.colorOptions.length !== 0) vm.colorOption = vm.colorOptions[0];
            }

            var activeDatasets = [osApi.getDataSource().dataset]
            // Import saved colors

            
            var promises = activeDatasets.map(function(ds){
                return new Promise(function(resolve, reject) {
                    osApi.query(ds+ "_color",{
                        dataset: ds,
                        $fields: ['name', 'subtype']
                    }).then(function(v) {

                        // attach dataset inclusion to Fields
                        var regx = /(\d+%)/i;
                        vm.colorFields = v.data.reduce(function(p, c) {
                            name = c.name.substr(0,c.name.match(regx).index-2)

                            if (!p.hasOwnProperty(name)) p[name] = [];
                            p[name].push(ds);
                            return p;
                        }, vm.colorFields);
    
                        var data = Object.keys(vm.colorFields).reduce(function(p,c) {
                            var group = vm.colorFields[c].join(" + ")
                            if(!p.hasOwnProperty(group)) p[group] = []
                            p[group].push(c)
                            return p
                           }, {}) ;
                           
                        vm.optPatientColors = Object.keys(data).map(function(key){
                            return {
                                name: key,
                                values: data[key].map(function(d){ return {"name":d}})
                                    .sort(function(a, b) {
                                        if (a.name > b.name) return 1;
                                        if (a.name < b.name) return -1;
                                        return 0;
                                    })
                            };
                        } )

                        resolve();
                    })
                })
            })

             Promise.all( promises )
            

           
            
                
            vm.resetColor = function() {
                
                osApi.setPatientColor({
                    "name": "Dataset",
                    "data": [ ],
                    show: true
                });
            };

            vm.setColor = function(item) {
                osApi.setBusy(true);
                vm.close();
                if (item.name == "None") {
                    osApi.setPatientColor({
                        "name": "Dataset",
                        "data": [],
                        show: true
                    });
                    return;
                }

                var fulldata = {data:[], name: item.name}
                var promises = activeDatasets.map(function(ds){
                    return new Promise(function(resolve, reject) {
                        osApi.query(ds+ "_color",{
                            name: item.name
                        }, {data:1}).then(function(v) {
                            var data = v.data[0];
                            data.data = data.data.map(function(v) {
                                var name = v.name.toLowerCase().trim();
                                if (name === "" || name == "null" || angular.isUndefined(name)) {
                                    v.name = "Null";
                                    v.color = "#DDDDDD";
                                }
                                v.id = "legend-" + v.color.substr(1);
                                return v;
                            }).sort(function(a, b) {
                                var aname = (isNaN(a.name)) ? a.name : parseInt(a.name);
                                var bname = (isNaN(b.name)) ? b.name : parseInt(b.name);
                                if (aname < bname) return -1;
                                if (aname > bname) return 1;
                                if (a.name == "Null") return 1;
                                if (b.name == "Null") return -1;
                                return 0;
                            });

                            fulldata.data = data.data.reduce(function(p,c){
                                var t = p.filter(function(d){ return d.name == c.name}) 
                                if (t.length == 0){ p.push(c)}
                                else { p.values.concat(c.values)}
                                return p;
                            }, fulldata.data)
        
                            // debugger;
                            osApi.setPatientColor(fulldata);
                            osApi.setBusy(false);
                            vm.close();
                            

                        })
                    })
                })
                Promise.all( promises ).then(function(){
                    osApi.setPatientColor(fulldata);
                    osApi.setBusy(false);
                    vm.close();
                })   

            };
            vm.setGeneColor = function() {
                var genes = ("+" + vm.geneColor.replace(/\s/g, '').toUpperCase()).match(/[-+]\w*/gi).map(function(v) {
                    return {
                        op: v.substr(0, 1),
                        gene: v.substr(1).toLowerCase(),
                        message: "",
                        status: ""
                    };
                });
                osApi.setBusy(true);
                osApi.query("lookup-genes", { symbols: { $in: genes.map(function(v) { return v.gene; }) } }).then(function(result) {
                    vm.close();
                    genes.map(function(v) {
                        var gene = this.filter(function(s) {
                            return (s.symbols.indexOf(this) != -1);
                        }, v.gene);

                        if (gene.length === 0) {
                            v.message = v.gene.toUpperCase();
                            v.status = "Removed";
                        } else if (gene.length > 1) {
                            v.message = v.gene.toUpperCase() + " -> " + gene[0].hugo.toUpperCase();
                            v.status = "Converted";
                        } else if (gene.length == 1) {
                            if (v.gene != gene[0].hugo) {
                                v.message = v.gene.toUpperCase() + " -> " + gene[0].hugo.toUpperCase();
                                v.status = "Converted";
                            }
                        }
                    }, result.data);

                    var msgs = _.sortBy(
                        genes.filter(function(v) { return v.status !== ""; }), "length");

                    var types = _.groupBy(msgs, function(gene) { return gene.status; });

                    var msg = "";

                    if (angular.isDefined(types.Removed) && types.Removed.length > 0) {
                        msg += "Removed: " + types.Removed.map(function(v) { return v.message + " - "; });
                    }
                    if (msg.length > 0) msg = msg.substr(0, msg.length - 2) + "\r\n";
                    if (angular.isDefined(types.Converted) && types.Converted.length > 0) {
                        msg += "Converted: " + types.Converted.map(function(v) { return v.message + "\r\n"; });
                    }
                    if (msg.trim().length > 0) alert(msg);
                    var geneset = genes.filter(function(v) { return v.status != "Removed"; }).map(function(v) {
                        return v.gene.toUpperCase();
                    });
                    osApi.query(vm.colorOption.collection, {
                        gene: {
                            '$in': geneset
                        }
                    }).then(function(results) {

                        if (results.data.length > 0) {
                            var data;
                            if (results.data.length == 1)
                                data = results.data[0];
                            else {
                                data = {};
                                data.patients = results.data.reduce(function(p, c) {
                                    var fn = p.lookup[c.gene];
                                    for (var i = 0; i < p.pids.length; i++) {
                                        var pid = p.pids[i];
                                        var iv = p.output.hasOwnProperty(pid) ? p.output[pid] : 0;
                                        if (fn === "+") p.output[pid] = iv + c.patients[pid];
                                        if (fn === "-") p.output[pid] = iv - c.patients[pid];
                                    }
                                    return p;
                                }, {
                                    pids: Object.keys(results.data[0].patients),
                                    lookup: genes.reduce(function(p, c) {
                                        p[c.gene] = c.op;
                                        return p;
                                    }, {}),
                                    output: {}
                                }).output;

                                var range = Object.keys(data.patients).reduce(function(p, c) {
                                    p.min = Math.min(p.min, p.values[c]);
                                    p.max = Math.max(p.min, p.values[c]);
                                    return p;
                                }, {
                                    values: data.patients,
                                    min: Infinity,
                                    max: -Infinity
                                });
                                data.min = range.min;
                                data.max = range.max;
                            }

                            // Color Patients
                            var colors = ["#9d1cb2", "#00a7f7", "#3d4eb8", "#ff9900", "#f7412d", "#795548", "#E91E63", "#673AB7"];
                            var values = colors.splice(0, vm.colorBin.value);

                            var scale = (vm.colorScale.name == "Quantile") ? d3.scaleQuantile() : d3.scaleQuantize();



                            // Combine Colors + Scale Into Name + Value
                            var labels;
                            if (vm.colorScale.name == "Quantile") {
                                scale.domain(Object.keys(data).map(function(key) { return data[key]; }, { data: data })).range(values);
                                labels = scale.quantiles().map(function(v) { return parseFloat(v).toFixed(3); });
                                labels.unshift("");
                                labels = labels.map(function(c, i, a) {
                                    if (i === 0) { return "-\u221e \u2194 " + a[1]; } else if (i == a.length - 1) {
                                        return a[i] + " \u2194 +\u221e";
                                    }
                                    return a[i] + " \u2194 " + a[i + 1];
                                });
                                values = _.zip(values, labels).map(function(v) { return { color: v[0], name: v[1] }; });
                            } else {
                                scale
                                    .domain([data.min, data.max])
                                    .range(values);
                                labels = scale.ticks(values.length).map(function(v) { return "~" + parseFloat(v).toFixed(2); });
                                values = _.zip(values, labels).map(function(v) { return { color: v[0], name: v[1] }; });
                            }
                            data = Object.keys(data.patients).map(function(id) {
                                    return {
                                        id: id,
                                        color: this.scale(this.patients[id]),
                                        value: this.patients[id]
                                    };
                                }, {
                                    patients: data.patients,
                                    scale: scale
                                })
                                .reduce(function(p, c) {
                                    if (!p.hasOwnProperty(c.color)) p[c.color] = [];
                                    p[c.color].push(c.id);
                                    return p;
                                }, {});

                            data = Object.keys(data).map(function(key) {
                                return {
                                    color: key,
                                    name: this.names.filter(function(f) {
                                        return f.color == this.color;
                                    }, {
                                        color: key
                                    })[0].name,
                                    values: this.data[key]
                                };
                            }, {
                                data: data,
                                names: values
                            });

                            data = data.sort(function(a, b) {
                                if (a.name.indexOf("-\u221e") != -1) return -1;
                                if (b.name.indexOf("-\u221e") != -1) return 1;
                                if (a.name.indexOf("+\u221e") != -1) return 1;
                                if (b.name.indexOf("+\u221e") != -1) return -1;
                                if (a.name < b.name) return -1;
                                if (a.name > b.name) return 1;
                                return 0;
                            });
                            data.push({
                                color: '#DDD',
                                name: 'Null',
                                values: []
                            });

                            colors = {
                                dataset: osApi.getDataSource().dataset,
                                type: 'color',
                                name: genes.reduce(function(p, c) {
                                    p += c.op + c.gene + " ";
                                    return p;
                                }, ""),
                                data: data
                            };
                            osApi.setPatientColor(colors);
                        }
                        osApi.setBusy(false);
                    });
                });

            };
        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osCollectionPanel', collectionPanel);

    /** @ngInject */
    function collectionPanel() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/collectionpanel/collectionpanel.html',
            controller: CollectionPanelController,
            controllerAs: 'vm',
            scope: {},
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CollectionPanelController(osApi) {


            // View Model
            var vm = this;


            // Tray Expand / Collapse
            var elTray = angular.element(".collection-panel");
            var isLocked = true;
            var mouseOver = function() { elTray.removeClass("tray-collapsed-left"); };
            var mouseOut = function() { elTray.addClass("tray-collapsed-left"); };
            vm.toggle = function() {
                isLocked = !isLocked;
                angular.element("#collectionpanel-lock")
                    .addClass(isLocked ? 'fa-lock' : 'fa-unlock-alt')
                    .removeClass(isLocked ? 'fa-unlock-alt' : 'fa-lock')
                    .attr("locked", isLocked ? "true" : "false");
                if (isLocked) {
                    elTray
                        .unbind("mouseover", mouseOver)
                        .unbind("mouseout", mouseOut)
                        .removeClass("tray-collapsed-left");
                } else {
                    elTray
                        .addClass("tray-collapsed-left")
                        .bind("mouseover", mouseOver)
                        .bind("mouseout", mouseOut);
                }

                osApi.onResize.dispatch();
            };



        }
    }

})();

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osCohortMenu', cohortMenu);

    /** @ngInject */
    function cohortMenu() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/cohortmenu/cohortmenu.html',
            controller: CohortMenuController,
            controllerAs: 'vm',
            scope: {},
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CohortMenuController(osApi, $state, $scope, $sce, $timeout, $rootScope, $filter, d3) {


            // View Model
            var vm = this;
            vm.cohorts = [];
            vm.cohort = null;
            vm.cohortFeatures = [];
            vm.cohortFeature = null;
            vm.cohortSummary = "";

            // Cohort Service Integration
            osApi.onCohortsChange.add(function(cohorts) {
                vm.cohorts = cohorts;
                updateSurvival(cohorts);
            });
            osApi.onCohortChange.add(function(cohort) {

                var dataInfo = osApi.getCohortDatasetInfo();
                var cohortSurvival = cohort.survival == null ? 0 : cohort.survival.data.tte.length;
                var summary =
                    $filter('number')(dataInfo.numSamples) + " Samples In Dataset<br /> " +
                    $filter('number')(dataInfo.numPatients) + " Patients In Dataset<br /> " +
                    $filter('number')(cohort.numSamples) + " Samples In Current Cohort<br /> " +
                    $filter('number')(cohort.numPatients) + " Patients In Current Cohort<br />" +
                    $filter('number')(cohort.numClinical) + " Patients with Clinical Data<br />" +
                    $filter('number')(cohortSurvival) + " Patients with Survival Outcome<br />";
                //$filter('number')(toolInfo.numSamplesVisible) + " Samples In Current Cohort Showing<br />" +
                //$filter('number')(toolInfo.numPatients) + " Patients In Current Cohort Showing<br />";

                vm.cohortSummary = $sce.trustAsHtml(summary);

                if (angular.isUndefined(cohort)) return;
                $timeout(function() {
                    var featureIdx = (vm.cohortFeature !== null) ? vm.cohortFeatures.indexOf(vm.cohortFeature) : 0;
                    vm.cohort = cohort;
                    vm.cohortFeatures = cohort.histogram.features;
                    vm.cohortFeature = cohort.histogram.features[featureIdx];
                });
                updateSurvival(vm.cohorts.concat([cohort]));
            });

            // Cohort edit
            vm.setCohort = function(cohort) {
                if (angular.isString(cohort)) {
                    osApi.setCohort([], osApi.ALL, osApi.SAMPLE);
                } else {
                    osApi.setCohort(cohort);
                }
            };

            vm.updateCohort = function() {
                if (vm.cohort.type == "UNSAVED") {
                    osApi.saveCohort(vm.cohort);
                } else {
                    osApi.deleteCohort(vm.cohort);
                }
            };


            // Histogram 
            var histSvg = d3.select("#cohortmenu-chart").append("svg")
                .attr("width", 260)
                .attr("height", 150)
                .append("g");
            var histSingleValueLabel = angular.element("#cohortmenu-single-value");
            var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
                return "Range: " + d.label + "<br>Count: " + d.value + " of " + vm.cohortFeature.data.count + "<br>Percent: " + $filter('number')((d.value / vm.cohortFeature.data.count) * 100, 2) + "%";
            });
            histSvg.call(elTip);
            $scope.$watch('vm.cohortFeature', function() {

                // Histogram
                if (vm.cohortFeature === null) return;
                var data = vm.cohortFeature.data;
                if (data.type == "factor") {
                    if (data.hist.length == 1) {
                        histSingleValueLabel.text(data.hist[0].label).css("display", "block").removeClass("cohortmenu-single-value-numeric");
                        histSvg.classed("cohort-chart-hide", true);
                        return;
                    }
                } else {
                    if (data.min == data.max) {
                        histSingleValueLabel.text(data.min).css("display", "block").addClass("cohortmenu-single-value-numeric");
                        histSvg.classed("cohort-chart-hide", true);
                        return;
                    }
                }
                histSingleValueLabel.text('').css("display", "none");
                histSvg.classed("cohort-chart-hide", false);
                var barWidth = Math.floor((250 - data.bins) / data.bins);


                if (data.histRange[0] > 0) data.histRange[0] -= 2;
                var yScale = d3.scaleLinear()
                    .domain([0, data.histRange[1]])
                    .range([0, 135]);
                var bars = histSvg
                    .selectAll(".cohort-menu-chart-bar")
                    .data(data.hist);
                bars.enter()
                    .append("rect")
                    .attr("class", "cohort-menu-chart-bar")
                    .attr("x", function(d, i) { return ((barWidth + 1) * i) + 5; })
                    .attr("y", function(d) { return 150 - yScale(d.value); })
                    .attr("height", function(d) { return yScale(d.value); })
                    .attr("width", barWidth)
                    .on("mouseover", elTip.show)
                    .on("mouseout", elTip.hide);
                bars
                    .transition()
                    .duration(300)
                    .attr("x", function(d, i) { return ((barWidth + 1) * i) + 5; })
                    .attr("y", function(d) { return 150 - yScale(d.value); })
                    .attr("height", function(d) { return yScale(d.value); })
                    .attr("width", barWidth);
                bars.exit()
                    .transition()
                    .duration(300)
                    .attr("y", 150)
                    .attr("height", 0)
                    .style('fill-opacity', 1e-6)
                    .remove();
                var labels = histSvg
                    .selectAll("text")
                    .data(data.hist);
                labels.enter()
                    .append("text")
                    .attr("x", function(d, i) { return ((4 + (barWidth + 1) * i) + (barWidth * 0.5)) + 1; })
                    .attr("y", function(d) { return 145 - yScale(d.value); })
                    .attr("fill", "#000")
                    .attr("height", function(d) { return yScale(d.value); })
                    .attr("width", barWidth)
                    .attr("font-size", "8px")
                    .attr("text-anchor", "middle")
                    .text(function(d) { return d.label; });
                labels
                    .transition()
                    .duration(300)
                    .attr("x", function(d, i) { return (((barWidth + 1) * i) + (barWidth * 0.5)) + 5; })
                    .attr("y", function(d) {
                        var y = 145 - yScale(d.value);
                        if (y < 0) y = 20;
                        return y;
                    })
                    .text(function(d) { return d.label; });
                labels.exit()
                    .transition()
                    .duration(300)
                    .attr("y", 150)
                    .attr("height", 0)
                    .style('fill-opacity', 1e-6)
                    .remove();

            });


            var formatDays = function(d) {
                if (Math.abs(d) === 0) return d;
                if (Math.abs(d) < 30) return d + " Days";
                if (Math.abs(d) < 360) return Math.round((d / 30.4) * 10) / 10 + " Mos";
                return Math.round((d / 365) * 10) / 10 + " Yrs";
            };



            // Survival
            var surSvg = d3.select("#cohortmenu-survival").append("svg");
            var surLines = surSvg.append("g")
                .selectAll("cohortmenu-survival-percent-line")
                .data([0.25, 0.5, 0.75]);

            surLines.enter()
                .append("line").attr("class", "cohortmenu-survival-percent-line")
                .attr("stroke-width", 1)
                .attr("stroke", "#EAEAEA")
                .attr("x1", 0).attr("x2", 250).attr("y1", function(d) {
                    return (d * 140);
                }).attr("y2", function(d) {
                    return (d * 140);
                });

            var surXAxis = surSvg.append("g").attr("class", "axisCohort");
            var surLayout = {
                width: 250,
                height: 170,
                xScale: null,
                yScale: null,
                xAxis: d3.axisBottom().ticks(4).tickFormat(formatDays)
            };
            surSvg.attr("width", '100%').attr("height", surLayout.height);

            var updateSurvival = function(cohorts) {

                cohorts = cohorts.filter(function(c){return c.survival != null})
                if(cohorts.length == 0) return;

                var xDomain = cohorts.reduce(function(p, c) {
                    p[0] = Math.min(p[0], c.survival.compute[0].t);
                    p[1] = Math.max(p[1], c.survival.compute[c.survival.compute.length - 1].t);
                    return p;
                }, [Infinity, -Infinity]);

                surLayout.xScale = d3.scaleLinear()
                    .domain(xDomain)
                    .range([0, surLayout.width - 1]);

                surLayout.yScale = d3.scaleLinear()
                    .domain([0, 1])
                    .range([surLayout.height - 30, 0]);

                var lineFunction = d3.line()
                    .curve(d3.curveStepBefore)
                    .x(function(d) { return Math.round(surLayout.xScale(d.t)); })
                    .y(function(d) { return Math.round(surLayout.yScale(d.s)); });

                surLayout.xAxis.scale(surLayout.xScale);
                surXAxis.attr("transform", "translate(0, " + (surLayout.yScale(0)) + ")")
                    .call(surLayout.xAxis)
                    .selectAll("text")
                    .style("text-anchor", function(d, i) { return (i === 0) ? "start" : "center"; });

                surSvg.selectAll(".survival-line").remove();

                for (var i = 0; i < cohorts.length; i++) {
                    var cohort = cohorts[i];
                    surSvg.append("path")
                        .datum(cohort.survival.compute)
                        .attr("class", "survival-line")
                        .style("stroke", cohort.color)
                        .attr("d", lineFunction);
                }

            };

        }
    }

})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osBarchart', barchart);

    /** @ngInject */
    function barchart() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/barchart/barchart.html',
            controller: BarchartController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function BarchartController(d3, osApi, $state, $timeout) {

            var vm = this;
            vm.datasource = osApi.getDataSource();

            var n = 5, // number of layers
                m = 58, // number of samples per layer
                stack = d3.layout.stack(),
                layers = stack(d3.range(n).map(function() {
                    return bumpLayer(m, 0.1);
                })),
                yGroupMax = d3.max(layers, function(layer) {
                    return d3.max(layer, function(d) {
                        return d.y;
                    });
                }),
                yStackMax = d3.max(layers, function(layer) {
                    return d3.max(layer, function(d) {
                        return d.y0 + d.y;
                    });
                });

            var margin = {
                    top: 40,
                    right: 10,
                    bottom: 20,
                    left: 10
                },
                width = 960 - margin.left - margin.right,
                height = 500 - margin.top - margin.bottom;

            var x = d3.scaleOrdinal()
                .domain(d3.range(m))
                .rangeRoundBands([0, width], 0.08);

            var y = d3.scaleLinear()
                .domain([0, yStackMax])
                .range([height, 0]);

            var color = d3.scaleLinear()
                .domain([0, n - 1])
                .range(["#aad", "#556"]);

            var xAxis = d3.svg.axis()
                .scale(x)
                .tickSize(0)
                .tickPadding(6)
                .orient("bottom");

            var svg = d3.select("body").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var layer = svg.selectAll(".layer")
                .data(layers)
                .enter().append("g")
                .attr("class", "layer")
                .style("fill", function(d, i) {
                    return color(i);
                });

            var rect = layer.selectAll("rect")
                .data(function(d) {
                    return d;
                })
                .enter().append("rect")
                .attr("x", function(d) {
                    return x(d.x);
                })
                .attr("y", height)
                .attr("width", x.rangeBand())
                .attr("height", 0);

            rect.transition()
                .delay(function(d, i) {
                    return i * 10;
                })
                .attr("y", function(d) {
                    return y(d.y0 + d.y);
                })
                .attr("height", function(d) {
                    return y(d.y0) - y(d.y0 + d.y);
                });

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis);

            d3.selectAll("input").on("change", change);

            var timeout = $timeout(function() {
                d3.select("input[value=\"grouped\"]").property("checked", true).each(change);
            }, 2000);

            function change() {
                clearTimeout(timeout);
                if (this.value === "grouped") transitionGrouped();
                else transitionStacked();
            }

            function transitionGrouped() {
                y.domain([0, yGroupMax]);

                rect.transition()
                    .duration(500)
                    .delay(function(d, i) {
                        return i * 10;
                    })
                    .attr("x", function(d, i, j) {
                        return x(d.x) + x.rangeBand() / n * j;
                    })
                    .attr("width", x.rangeBand() / n)
                    .transition()
                    .attr("y", function(d) {
                        return y(d.y);
                    })
                    .attr("height", function(d) {
                        return height - y(d.y);
                    });
            }

            function transitionStacked() {
                y.domain([0, yStackMax]);

                rect.transition()
                    .duration(500)
                    .delay(function(d, i) {
                        return i * 10;
                    })
                    .attr("y", function(d) {
                        return y(d.y0 + d.y);
                    })
                    .attr("height", function(d) {
                        return y(d.y0) - y(d.y0 + d.y);
                    })
                    .transition()
                    .attr("x", function(d) {
                        return x(d.x);
                    })
                    .attr("width", x.rangeBand());
            }

            // Inspired by Lee Byron's test data generator.
            function bumpLayer(n, o) {

                function bump(a) {
                    var x = 1 / (0.1 + Math.random()),
                        y = 2 * Math.random() - 0.5,
                        z = 10 / (0.1 + Math.random());
                    for (var i = 0; i < n; i++) {
                        var w = (i / n - y) * z;
                        a[i] += x * Math.exp(-w * w);
                    }
                }

                var a = [],
                    i;
                for (i = 0; i < n; ++i) a[i] = o + o * Math.random();
                for (i = 0; i < 5; ++i) bump(a);
                return a.map(function(d, i) {
                    return {
                        x: i,
                        y: Math.max(0, d)
                    };
                });
            }

        }
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .run(runBlock);

    /** @ngInject */
    function runBlock($window, $exceptionHandler) { //, $log

        // Route Errors To Angular
        $window.onerror = function handleGlobalError(message, fileName, lineNumber, columnNumber, error) {
            if (!error) {
                error = new Error(message);
                error.fileName = fileName;
                error.lineNumber = lineNumber;
                error.columnNumber = (columnNumber || 0);
            }
            $exceptionHandler(error);
        };
    }
})();
(function() {
    'use strict';

    angular
        .module('oncoscape')
        .config(routerConfig);

    /** @ngInject */
    function routerConfig($stateProvider, $urlRouterProvider) {

        // Resolutions
        var resolveDatasource = function(osApi) {
            osApi.setBusy(true);
            return new Promise(function(resolve) {
                osApi.init().then(function() {
                    resolve();
                    angular.element("#main").removeClass("container-main-full");
                    angular.element("#header").css({ display: "block" });
                    angular.element("#collectionPanel").css({ display: "none" });
                    // angular.element("#cohortMenu").css({ display: "none" });
                    // angular.element("#geneMenu").css({ display: "none" });
                    osApi.onNavChange.dispatch("");
                });
            });
        };

        var resolveTools = function(osApi, $stateParams) {
            return new Promise(function(resolve) {
                resolveDatasource(osApi).then(function() {
                    osApi.setDataSource($stateParams.datasource).then(function() {
                        resolve();
                        angular.element("#collectionPanel").css({ display: "none" });
                        // angular.element("#cohortMenu").css({ display: "none" });
                        // angular.element("#geneMenu").css({ display: "none" });
                        osApi.onNavChange.dispatch("TOOLS");
                    });

                });
            });
        };


        var prevDatasource = "";
        var resolveTool = function(osApi, $stateParams) {
            return new Promise(function(resolve) {
                resolveTools(osApi, $stateParams).then(function() {
                    if (osApi.getCohort() === null || $stateParams.datasource !== prevDatasource) {
                        osApi.setDataSource($stateParams.datasource).then(function() {
                            resolve();
                            angular.element("#collectionPanel").css({ display: "block" });
                            // angular.element("#cohortMenu").css({ display: "block" });
                            // angular.element("#geneMenu").css({ display: "block" });
                            osApi.onNavChange.dispatch("TOOL");
                        });

                    } else {
                        angular.element("#collectionPanel").css({ display: "block" });
                        // angular.element("#cohortMenu").css({ display: "block" });
                        // angular.element("#geneMenu").css({ display: "block" });
                        osApi.onNavChange.dispatch("TOOL");
                        resolve();
                    }
                    prevDatasource = $stateParams.datasource;

                });
            });

        };

        var resolveLanding = function(osApi, $timeout) {
            $timeout(function() {
                angular.element("#main").addClass("container-main-full");
                angular.element("#header").css({ display: "none" });
                angular.element("#collectionPanel").css({ display: "none" });
                // angular.element("#cohortMenu").css({ display: "none" });
                // angular.element("#geneMenu").css({ display: "none" });
                osApi.onNavChange.dispatch("");
            }, 200);
        };


        // States
        $stateProvider
            .state('landing', {
                url: '/',
                template: '<os-landing>',
                datasource: false,
                help: "/",
                resolve: {
                    resolveLanding: resolveLanding
                }
            })
            .state('userdatasource', {
                url: '/userdatasource',
                template: '<os-userdatasource>',
                datasource: false,
                help: "/",
                resolve: {
                    resolveDatasource: resolveDatasource
                }
            })
            .state('datasource', {
                url: '/datasource',
                template: '<os-datasource>',
                datasource: false,
                help: "/",
                resolve: {
                    resolveDatasource: resolveDatasource
                }
            })
            .state('tools', {
                url: '/tools/{datasource}',
                template: '<os-tools>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTools: resolveTools
                }
            })
            .state('scatter', {
                url: '/scatter/{datasource}',
                template: '<os-scatter>',
                datasource: false,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('spreadsheet', {
                url: '/spreadsheet/{datasource}',
                template: '<os-spreadsheet>',
                datasource: true,
                help: "/spreadsheet.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('plsr', {
                url: '/plsr/{datasource}',
                template: '<os-plsr>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('pca', {
                url: '/pca/{datasource}',
                template: '<os-pca>',
                datasource: true,
                help: "/pca.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('comparecluster', {
                url: '/cc/{datasource}',
                template: '<os-compare-cluster>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('markers', {
                url: '/markers/{datasource}',
                template: '<os-markers>',
                datasource: true,
                help: "/markerspatients.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            // .state('ms', {
            //     url: '/ms/{datasource}',
            //     template: '<os-ms>',
            //     datasource: true,
            //     resolve: {
            //         resolveTool: resolveTool
            //     }
            // })
            .state('pathways', {
                url: '/pathways/{datasource}',
                template: '<os-pathways>',
                datasource: true,
                help: "/pathways.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('timelines', {
                url: '/timelines/{datasource}',
                template: '<os-timelines>',
                datasource: true,
                help: "/timelines.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('survival', {
                url: '/survival/{datasource}',
                template: '<os-survival>',
                datasource: true,
                help: "/survival.html",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('sunburst', {
                url: '/sunburst/{datasource}',
                template: '<os-sunburst>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('heatmap', {
                url: '/heatmap/{datasource}',
                template: '<os-heatmap>',
                datasource: false,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            })
            .state('login', {
                url: '/login',
                template: '<os-login>',
                datasource: false,
                help: "/",
                resolve: {}
            })
            .state('genedashboard', {
                url: '/genedashboard/{datasource}',
                template: '<os-genedashboard>',
                datasource: false,
                help: "/",
                resolve: { resolveTool : resolveTool}
            })
            .state('barcharts', {
                url: '/barchart/{datasource}',
                template: '<os-barchart>',
                datasource: true,
                help: "/",
                resolve: {
                    resolveTool: resolveTool
                }
            });

        $urlRouterProvider.otherwise('/');
    }

})();
/* global hello:false, jStat:false, TWEEN:false, d3:false, $:false, signals:false, cytoscape:false, document:false, moment:false, _:false, localStorage:false, saveAs:false, TextEncoder:false */

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .constant('jStat', jStat)
        .constant('TWEEN', TWEEN)
        .constant('moment', moment)
        .constant('d3', d3)
        .constant('cytoscape', cytoscape)
        .constant('signals', signals)
        .constant('$', $)
        .constant('auth', hello)
        .constant('localStorage', localStorage)
        .constant('saveAs', saveAs)
        .constant('TextEncoder', TextEncoder)
        .constant('hello', hello)
        .constant('_', _)
        .constant('ML',ML);

})();

(function() {
    'use strict';

    angular
        .module('oncoscape')
        .config(config);

    /** @ngInject */
    function config($logProvider) {
        $logProvider.debugEnabled(false);
    }

})();
angular.module("oncoscape").run(["$templateCache", function($templateCache) {$templateCache.put("app/components/barchart/barchart.html","<os-tray content=\"tray-content-block\" change=\"vm.resize($event)\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-12 form-item\"><br><label></label></div></div></section></os-tray><section class=\"tray-content-block\"><div style=\"position:absolute;top:10px;text-align:center;width:100%;\"><h2 class=\"h2-tool\">Heatmap</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span><div id=\"barchart-chart\"></div></div></section>");
$templateCache.put("app/components/collectionpanel/collectionpanel.html","<div id=\"collectionPanel\" style=\"display:none\"><label class=\"tray-label tray-label-left\"><i class=\"fa fa-chevron-right\" aria-hidden=\"true\"></i></label><div class=\"collection-panel tray tray-left\"><section><ul class=\"nav nav-tabs\"><li class=\"active\"><a data-target=\"#cohorttab\" data-toggle=\"tab\" style=\"cursor:default\">Cohorts</a></li><li><a data-target=\"#genesettab\" data-toggle=\"tab\" style=\"cursor:default\">Genesets</a></li></ul><i id=\"collectionpanel-lock\" class=\"fa fa-lock tray-sticky-icon\" ng-click=\"vm.toggle()\" locked=\"true\" tooltip=\"Show / Hide\" tooltip-placement=\"left\"></i><div class=\"tab-content\"><div class=\"tab-pane active cont\" id=\"cohorttab\"><os-cohort-menu></os-cohort-menu></div><div class=\"tab-pane cont\" id=\"genesettab\"><os-gene-menu></os-gene-menu></div></div></section></div></div>");
$templateCache.put("app/components/cohortmenu/cohortmenu.html","<div id=\"cohortMenu\" style=\"display:block\"><div class=\"cohort-menu\"><section><div class=\"row\"><div class=\"col-xs-12 form-item cohortmenu-hr\"><label>Selected Cohort</label><div class=\"input-group\"><input ng-readonly=\"vm.cohort.type==\'ALL\'\" style=\"background:#FFF;border-left-width:10px;border-left-color:{{vm.cohort.color}};\" class=\"form-control\" aria-label=\"Text input with segmented button dropdown\" ng-model=\"vm.cohort.name\" onfocus=\"this.select();\"><div class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-default\" tooltip=\"{{vm.cohort.type == \'UNSAVED\' ? \'Save Cohort\' : \'Delete Cohort\'}}\" tooltip-placement=\"left\" ng-if=\"vm.cohort.type!=\'ALL\'\" ng-click=\"vm.updateCohort()\"><span class=\"fa {{vm.cohort.type == \'UNSAVED\' ? \'fa-plus\' : \'fa-times\'}}\" aria-hidden=\"true\"></span></button> <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\" tooltip=\"Change Cohort\" tooltip-placement=\"left\"><span class=\"caret\"></span> <span class=\"sr-only\">Toggle Dropdown</span></button><ul class=\"dropdown-menu dropdown-menu-right\" style=\"width:260px;padding:0px;\"><li class=\"legend-bar markers-command hvr-sweep-to-right\" style=\"height:25px;border-color:{{item.color}};width:100%;padding-left:10px;\" ng-repeat=\"item in vm.cohorts\" ng-click=\"vm.setCohort(item)\">{{item.name}}</li></ul></div></div></div><div class=\"col-xs-12 form-item cohortmenu-hr\"><label class=\"cohortmenu-toggle-btn\" data-toggle=\"collapse\" data-target=\"#cohortmenu-histogram\" tooltip=\"Show / Hide\" tooltip-placement=\"right\">Clinical Histogram <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i></label><div id=\"cohortmenu-histogram\" class=\"collapse in\" style=\"background:#FFF;border:1px solid #EAEAEA;\"><div id=\"cohortmenu-chart\" style=\"width:100%;height:150px;\"><div id=\"cohortmenu-single-value\" class=\"cohortmenu-single-value\"></div></div><div class=\"dropdown\" style=\"width:100%\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\" style=\"width:100%;border:0px solid #eaeaea;border-top-width:1px;\">{{vm.cohortFeature.label}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" style=\"width:260px;padding:0px;\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.cohortFeatures\" ng-click=\"vm.cohortFeature=item\">{{item.label}}</li></ul></div></div></div><div class=\"col-xs-12 form-item cohortmenu-hr\"><label class=\"cohortmenu-toggle-btn\" data-toggle=\"collapse\" data-target=\"#cohortmenu-survival-box\" tooltip=\"Show / Hide\" tooltip-placement=\"right\">Survival Curve <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i></label><div id=\"cohortmenu-survival-box\" class=\"collapse in\" style=\"background:#FFF;border:1px solid #EAEAEA;padding:5px;\"><div id=\"cohortmenu-survival\"></div><label>Cohorts</label><div ng-repeat=\"item in vm.cohorts\" class=\"legend-bar markers-command hvr-sweep-to-right\" style=\"border-color:{{item.color}};padding-left:10px;\" ng-click=\"vm.setCohort(item)\">{{item.name}}</div><label>Selected Cohort</label><div class=\"legend-bar markers-command hvr-sweep-to-right\" style=\"height:25px;border-color:{{vm.cohort.color}};padding-left:10px;\">{{vm.cohort.name}} ({{vm.cohort.type}})</div></div></div><div class=\"col-xs-12 form-item\"><label class=\"cohortmenu-toggle-btn\" data-toggle=\"collapse\" data-target=\"#cohortmenu-summary-box\" tooltip=\"Show / Hide\" tooltip-placement=\"right\">Cohort Summary <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i></label><div id=\"cohortmenu-summary-box\" class=\"collapse in\" style=\"background:#FFF;border:1px solid #EAEAEA;padding:5px;\" ng-bind-html=\"vm.cohortSummary\"></div></div><div id=\"cohortmenu-legand\"></div></div></section></div></div>");
$templateCache.put("app/components/colorpanel/colorpanel.html","<div class=\"panel panel-default mdi\" style=\"padding-bottom:30px;\"><div class=\"panel-heading\"><h3 class=\"panel-title\">Patient Color Options</h3><span class=\"pull-right clickable\" data-effect=\"fadeOut\" ng-click=\"vm.close()\" role=\"button\" tabindex=\"0\"><i class=\"fa fa-times\"></i></span></div><div class=\"panel-body\"><div class=\"row\" ng-if=\"vm.colorOptions.length>0\"><div class=\"col-xs-12 col-sm-9\"><h3>Enter Hugo Gene(s) Seperated By + And - Operators. (eg BRCA1 + BRCA2 - p53)</h3><div class=\"input-group\"><div class=\"input-group-btn\"><button style=\"width:150px;\" type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">{{vm.colorOption.name}}&nbsp;<span class=\"caret\"></span></button><ul class=\"dropdown-menu\"><li ng-click=\"vm.colorOption=item;\" ng-repeat=\"item in vm.colorOptions\">{{item.name}}</li></ul></div><div class=\"input-group-btn\"><button style=\"width:100px;\" type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">{{vm.colorScale.name}}&nbsp;<span class=\"caret\"></span></button><ul class=\"dropdown-menu\"><li ng-click=\"vm.colorScale=item;\" ng-repeat=\"item in vm.colorScales\">{{item.name}}</li></ul></div><div class=\"input-group-btn\"><button style=\"width:100px;border-radius:0px;\" type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">{{vm.colorBin.name}}&nbsp;<span class=\"caret\"></span></button><ul class=\"dropdown-menu\"><li ng-click=\"vm.colorBin=item;\" ng-repeat=\"item in vm.colorBins\">{{item.name}}</li></ul></div><input ng-model=\"vm.geneColor\" type=\"text\" class=\"form-control\" placeholder=\"Hugo Gene Symbol\" style=\"border-right-width: 0px; border-left-width: 0px; height:33px;\"> <span class=\"input-group-btn\"><button class=\"btn btn-default\" type=\"button\" ng-click=\"vm.setGeneColor()\">Submit</button></span></div></div></div><div class=\"row\"><div class=\"col-xs-12\"><button class=\"btn btn-default\" ng-click=\"vm.resetColor()\">Reset Color Options</button></div></div><div ng-repeat=\"item in vm.optPatientColors\"><br><div class=\"row\"><div class=\"col-xs-12\">{{item.name}}</div></div><div class=\"row\"><div class=\"col-xs-4\" ng-repeat=\"color in item.values\"><a class=\"hvr-sweep-to-right markers-command\" ng-click=\"vm.setColor(color)\">{{color.name}}</a></div></div></div></div></div>");
$templateCache.put("app/components/compareclusters/compareclusters.html","<os-tray caption=\"Patients\" content=\"tray-content-block\"><section class=\"tray-content\"><div class=\"row\"><br><br><div ng-if=\"vm.legendCaption.length>0\" class=\"col-xs-12 form-item\"><label>Patient {{vm.legendCaption}}</label><div ng-repeat=\"item in vm.legendNodes\" class=\"legend-bar\" style=\"border-color:{{item.color}};position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\">{{item.name}}</div></div><div class=\"col-xs-12 form-item\"><label>Patient</label> <button class=\"btn btn-default btn-no-focus\" type=\"button\" style=\"width:100%;font-weight: 300;\" ng-click=\"vm.showPanelColor = true\">Color Options</button></div><div class=\"col-xs-12 form-item\"><label>Grid</label> <button class=\"btn btn-default btn-no-focus\" type=\"button\" style=\"width:100%;font-weight: 300;\" ng-click=\"vm.showPanelColor = true\">Layout Options</button></div></div></section></os-tray><section class=\"tray-content-block\"><div style=\"position:absolute;top:10px;text-align:center;width:100%;\"><h2 class=\"h2-tool\">Compare Clusters</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span><br><div id=\"compareclusterChart\" class=\"pca\"></div></div></section>");
$templateCache.put("app/components/datasource/datasource.html","<section class=\"datasource\"><div class=\"container\"><div class=\"row\"><div class=\"col-sm-12 col-md-12\"><br><p style=\"float:right;padding-top:22px;\"><a href=\"https://cancergenome.nih.gov/publications/publicationguidelines\" target=\"_blank\">Publication Guidelines</a></p><h1>Disease Datasets</h1></div></div><div class=\"row\"><ul><li ng-repeat=\"dataset in vm.datasets\" class=\"col-xs-12 col-sm-6 col-md-4 col-lg-3\" ng-click=\"vm.explore(\'tools\',dataset)\"><div class=\"datasource-btn\"><img class=\"datasource-img\" ng-src=\"/assets/images/img{{dataset.img}}\"><p class=\"datasource-h1\">{{dataset.name}}</p><p class=\"datasource-h2\">{{dataset.source}} | 11-17-2016</p></div></li></ul></div></div></section>");
$templateCache.put("app/components/genedashboard/genedashboard.html","<os-tray content=\"tray-content-block\" change=\"vm.resize($event)\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-12 form-item\"><br><label></label></div><div class=\"col-xs-12 form-item\"><label>Data Type</label><div class=\"input-group\"><div class=\"dropdown bs-dropdown\"><button style=\"width:260px;\" class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.dataType}}<span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\" style=\"width:260px;\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.dataTypes\" ng-click=\"vm.dataType=item\">{{item}}</li></ul></div></div></div><div class=\"col-xs-12 form-item\"><label>Selected Gene</label><div class=\"input-group\"><input style=\"background:#FFF;\" class=\"form-control\" aria-label=\"Text input with segmented button dropdown\" ng-model=\"vm.gene\" onfocus=\"this.select();\"><div class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-default\" ng-click=\"vm.updateGene()\"><span class=\"fa fa-refresh\" aria-hidden=\"true\"></span></button></div></div></div><div class=\"col-xs-12 form-item\"><label>Basepair Window</label><br><label>Upstream</label><div class=\"input-group\"><input style=\"background:#FFF;\" class=\"form-control\" aria-label=\"Text input with segmented button dropdown\" ng-model=\"vm.range.up\" onfocus=\"this.select();\"><div class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-default\" ng-click=\"vm.updateGene()\"><span class=\"fa fa-refresh\" aria-hidden=\"true\"></span></button></div></div><label>Downstream</label><div class=\"input-group\"><input style=\"background:#FFF;\" class=\"form-control\" aria-label=\"Text input with segmented button dropdown\" ng-model=\"vm.range.down\" onfocus=\"this.select();\"><div class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-default\" ng-click=\"vm.updateGene()\"><span class=\"fa fa-refresh\" aria-hidden=\"true\"></span></button></div></div></div></div></section></os-tray><section class=\"tray-content-block\"><div class=\"tool-container\"><h2 class=\"h2-tool\">Gene Dashboard</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span><div id=\"genedashboard-chart\" class=\"genedashboard\"></div></div></section><os-color-panel ng-if=\"vm.showPanelColor\" close=\"vm.showPanelColor=false\"></os-color-panel>");
$templateCache.put("app/components/genemenu/genemenu.html","<div id=\"geneMenu\" style=\"display:block\"><div class=\"gene-menu\"><section><div class=\"row\"><div class=\"col-xs-12 form-item genemenu-hr\"><label>Selected Geneset</label><div class=\"input-group\"><input ng-readonly=\"vm.geneset.type==\'ALLGENES\'\" style=\"background:#FFF;\" class=\"form-control\" aria-label=\"Text input with segmented button dropdown\" ng-model=\"vm.geneset.name\" onfocus=\"this.select();\"><div class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-default\" tooltip=\"{{vm.geneset.type == \'UNSAVED\' ? \'Save Geneset\' : \'Delete Geneset\'}}\" tooltip-placement=\"left\" ng-if=\"vm.geneset.type!=\'ALLGENES\'\" ng-click=\"vm.updateGeneset()\"><span class=\"fa {{vm.geneset.type == \'UNSAVED\' ? \'fa-plus\' : \'fa-times\'}}\" aria-hidden=\"true\"></span></button> <button type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\" tooltip=\"Change Geneset\" tooltip-placement=\"left\"><span class=\"caret\"></span> <span class=\"sr-only\">Toggle Dropdown</span></button><ul class=\"dropdown-menu dropdown-menu-right\" style=\"width:260px;padding:0px;\"><li class=\"markers-command hvr-sweep-to-right\" ng-class=\"item.disable ? \'genemenu-strikethrough\' : \'null\'\" style=\"height:25px;width:100%;padding-left:10px;\" ng-repeat=\"item in vm.genesets | filter:{ show:true}\" ng-click=\"vm.setGeneset(item)\">{{item.name}}</li><li class=\"markers-command hvr-sweep-to-right\" ng-click=\"vm.import()\" style=\"color:darkgray\">Other...</li></ul></div></div></div><div class=\"col-xs-12 form-item\"><label class=\"genemenu-toggle-btn\" data-toggle=\"collapse\" data-target=\"#genemenu-summary-box\" tooltip=\"Show / Hide\" tooltip-placement=\"right\">Geneset Summary <i class=\"fa fa-angle-down\" aria-hidden=\"true\"></i></label><div id=\"genemenu-summary-box\" class=\"collapse in\" style=\"background:#FFF;border:1px solid #EAEAEA;padding:5px;\" ng-bind-html=\"vm.genesetSummary\"></div></div><div id=\"genemenu-legand\"></div></div></section></div></div>");
$templateCache.put("app/components/header/header.html","<div id=\"header\" class=\"header\" style=\"display:none\"><nav class=\"navbar navbar-inverse navbar-fixed-top\"><div class=\"container-fluid\"><div class=\"navbar-header\"><button type=\"button\" class=\"navbar-toggle collapsed\" data-toggle=\"collapse\" data-target=\"#header-navbar\" aria-expanded=\"false\"><span class=\"sr-only\">Toggle navigation</span> <span class=\"icon-bar\"></span> <span class=\"icon-bar\"></span> <span class=\"icon-bar\"></span></button> <a class=\"navbar-brand\" href=\"#\" style=\"position:relative;\"><img alt=\"Brand\" src=\"/assets/images/logo-white.png\" class=\"header-logo-img\"> <span class=\"header-logo-text\">Oncoscape</span></a></div><div class=\"collapse navbar-collapse\" id=\"header-navbar\"><ul class=\"nav navbar-nav navbar-right\"><li class=\"dropdown\" ng-show=\"vm.showTools\"><a href=\"\" class=\"dropdown-toggle header-link\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\"><span class=\"glyphicon glyphicon-stats\"></span>Tools</a><ul class=\"dropdown-menu row\" style=\"max-height:80vh;overflow:scroll;\"><li ng-repeat=\"item in vm.tools\" class=\"col-xs-12 col-sm-6 col-lg-4\" ng-click=\"vm.loadTool(item.route)\"><div class=\"datasource-btn\" style=\"color:#000\"><img class=\"datasource-img\" ng-src=\"/assets/images/{{item.img}}\"><p class=\"datasource-h1\">{{item.name}}</p><p class=\"datasource-h2\">{{item.desc}}</p></div></li></ul></li><li class=\"dropdown\" ng-show=\"vm.showDatasets\"><a href=\"\" class=\"dropdown-toggle header-link\" data-toggle=\"dropdown\" ng-click=\"vm.showDatasources()\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\"><span class=\"glyphicon glyphicon-th\"></span>Datasets</a></li><li class=\"dropdown\" ng-show=\"vm.showDatasets\"><a href=\"\" class=\"dropdown-toggle header-link\" data-toggle=\"dropdown\" role=\"button\" aria-haspopup=\"true\" aria-expanded=\"false\"><span class=\"fa fa-users\"></span>Cohorts</a><div class=\"dropdown-menu container-fluid\"><div class=\"row\"><div ng-if=\"!vm.showImport\" class=\"col-xs-12 col-sm-3\" style=\"border:0px solid #DDD; border-right-width:1px;\"><h2 style=\"margin-top:0px;\">Create A Cohort</h2>Oncoscape allows you to pass cohorts of patients from one tool to the next. To create a cohort out of your current selection click create cohort.<br><button class=\"btn btn-primary\" style=\"margin-top:15px;\" ng-click=\"vm.addPatientCohort(); $event.stopPropagation();\">Create Cohort</button> <button class=\"btn btn-primary\" style=\"margin-top:15px;\" ng-click=\"vm.showImport=true; $event.stopPropagation();\">Import Cohort</button></div><div ng-if=\"vm.showImport\" class=\"col-xs-12 col-sm-3\" style=\"border:0px solid #DDD; border-right-width:1px;\"><h2 style=\"margin-top:0px;\">Import A Cohort</h2>Enter a comma seperated list of patient or sample IDs below and click import<br><input ng-model=\"vm.importName\" type=\"text\" class=\"form-control\" style=\"margin-top:5px;\" placeholder=\"Enter Cohort Name\"> <input ng-model=\"vm.importIds\" type=\"text\" class=\"form-control\" style=\"margin-top:5px;\" placeholder=\"eg. TCGA-01-0110, TCGA-02-0220\"> <button class=\"btn btn-primary\" style=\"margin-top:15px;\" ng-click=\"vm.importCohort(); $event.stopPropagation();\">Save</button> <button class=\"btn btn-primary\" style=\"margin-top:15px;\" ng-click=\"vm.showImport=false; $event.stopPropagation();\">Cancel</button></div><div class=\"col-xs-12 col-sm-9\"><h2 style=\"margin-top:0px;\">Your Cohorts</h2><div class=\"markers-command hvr-sweep-to-right header-cohort-btn\" ng-repeat=\"item in vm.cohorts\" ng-click=\"vm.setPatientCohort(item)\"><p class=\"datasource-h1\">{{item.name}}</p><p class=\"datasource-h2\">{{item.numPatients}} patients<br>{{item.numSamples}} samples<br>{{item.numClinical}} clinical records</p></div></div></div></div></li><li><a href=\"\" ng-click=\"vm.showHelp()\" target=\"_blank\" class=\"header-link\"><span class=\"glyphicon glyphicon-question-sign\"></span>Help</a></li><li><a href=\"http://resources.sttrcancer.org/oncoscape-contact\" class=\"header-link\"><span class=\"fa fa-comments\"></span>Feedback</a></li><li><a ng-show=\"vm.user == null\" href=\"\" ng-click=\"vm.login()\" class=\"header-link\"><span class=\"fa fa-user-circle\"></span>Login</a> <a ng-show=\"vm.user != null\" href=\"\" ng-click=\"vm.logout()\" class=\"header-link\"><span class=\"fa fa-user-circle\"></span>Logout</a></li></ul></div></div></nav></div><os-import-panel ng-if=\"vm.showImport\" close=\"vm.showImport=false\"></os-import-panel>");
$templateCache.put("app/components/heatmap/heatmap.html","<os-tray content=\"tray-content-block\" change=\"vm.resize($event)\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-12 form-item\"><br><label></label></div><div class=\"col-xs-12 form-item\"><label>Display Options</label><div class=\"legend-bar\" style=\"border-color:#000;position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\">Row Dendrograms <label class=\"switch {{item.class}}\" style=\"float:right\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"vm.rowDendrogram\" ng-change=\"vm.draw()\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label></div><div class=\"legend-bar\" style=\"border-color:#000;position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\">Row Labels <label class=\"switch {{item.class}}\" style=\"float:right\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"vm.rowLabels\" ng-change=\"vm.draw()\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label></div><div class=\"legend-bar\" style=\"border-color:#000;position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\">Column Dendrograms <label class=\"switch {{item.class}}\" style=\"float:right\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"vm.colDendrogram\" ng-change=\"vm.draw()\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label></div><div class=\"legend-bar\" style=\"border-color:#000;position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\">Column Labels <label class=\"switch {{item.class}}\" style=\"float:right\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"vm.colLabels\" ng-change=\"vm.draw()\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label></div><div class=\"legend-bar\" style=\"border-color:#000;position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\">Grid Lines <label class=\"switch {{item.class}}\" style=\"float:right\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"vm.gridlines\" ng-change=\"vm.draw()\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label></div></div><div class=\"col-xs-12 form-item\"><label>Color Scheme</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.colorScheme.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\"><li ng-repeat=\"item in vm.colorSchemes\" ng-click=\"vm.colorScheme=item;vm.draw()\">{{item.name}}</li></ul></div></div><div class=\"col-xs-12 form-item\"><label>Scale</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.scale.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\"><li ng-repeat=\"item in vm.scales\" ng-click=\"vm.scale=item;vm.loadHeatmap()\">{{item.name}}</li></ul></div></div><div class=\"col-xs-12 form-item\"><label>Dendrogram Clusters</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.dendrogramCluster.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\"><li ng-repeat=\"item in vm.dendrogramClusters\" ng-click=\"vm.dendrogramCluster=item;vm.loadHeatmap()\">{{item.name}}</li></ul></div></div></div></section></os-tray><section class=\"tray-content-block\"><div style=\"position:absolute;top:10px;text-align:center;width:100%;\"><h2 class=\"h2-tool\">Heatmap</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span><div id=\"heatmap-chart\" style=\"position:relative\"></div><div id=\"tooltip\" class=\"hidden\"><p><span id=\"value\"></span></p></div></div></section>");
$templateCache.put("app/components/help/help.html","<div class=\"help\"><iframe src=\"http://resources.sttrcancer.org/pca?embed=true\"></iframe></div>");
$templateCache.put("app/components/importpanel/importpanel.html","<div class=\"panel panel-default mdi\" style=\"padding-bottom:30px;\"><div class=\"panel-heading\"><h3 class=\"panel-title\">Geneset Import</h3><span class=\"pull-right clickable\" data-effect=\"fadeOut\" ng-click=\"vm.close()\" role=\"button\" tabindex=\"0\"><i class=\"fa fa-times\"></i></span></div><div class=\"panel-body\"><div class=\"row\" ng-show=\"vm.showGeneImport\" style=\"max-height:80vh !important\"><div class=\"col-xs-12 col-sm-3\" style=\"border:0px solid #DDD; border-right-width:1px;\"><h2 style=\"margin-top:0px;\">Create A Geneset</h2>Enter a comma seperated list of HUGO gene IDs or a weighted signature below and click save<br><input ng-model=\"vm.importGenesetName\" type=\"text\" class=\"form-control\" style=\"margin-top:5px;\" placeholder=\"Enter Geneset Name\"> <input ng-model=\"vm.importGeneIds\" type=\"text\" class=\"form-control\" style=\"margin-top:5px;\" placeholder=\"eg MLX,MAX or 0.9*MYC+1.5*MNT\"> <button class=\"btn btn-primary\" style=\"margin-top:15px;\" ng-click=\"vm.close(); vm.importGeneset(); $event.stopPropagation();\">Save</button> <button class=\"btn btn-primary\" style=\"margin-top:15px;\" ng-click=\"vm.close(); $event.stopPropagation();\">Cancel</button></div><div class=\"col-xs-12 col-sm-9\" style=\"max-height:inherit !important; overflow-y:scroll\"><h2 style=\"margin-top:0px;\">Your Genesets</h2><div class=\"markers-command hvr-sweep-to-right header-geneset-btn\" ng-repeat=\"item in vm.genesets\" ng-click=\"vm.setGenesetList(item); vm.close()\"><p class=\"datasource-h1\">{{item.name}}</p><p class=\"datasource-h2\">{{item.geneIds.length}} Genes<br>{{item.hugoIds.length}} HUGO symbols</p></div></div></div></div></div>");
$templateCache.put("app/components/landing/landing.html","<div class=\"landing\"><header class=\"landing container\"><div class=\"row marquee marquee-bg\"><div class=\"col-sm-12\"><div class=\"marquee-x\"></div><div class=\"header-content\" style=\"text-align:center;z-index: 999;pointer-events:none;\"><h1 class=\"landing-h1\">Oncoscape</h1><p class=\"landing-h2\">Cancer Explorer</p><span class=\"landing-buttons\" style=\"pointer-events:all;\"><a class=\"btn btn-outline btn-xl page-scroll\" ng-click=\"vm.getStarted()\">Explore</a> <a class=\"btn btn-outline btn-xl page-scroll\" href=\"/documentation/\" target=\"_blank\">Learn More</a></span></div></div></div></header><div class=\"container-fluid\" style=\"background-color:#000; color:#FFF;padding-top:150px;padding-bottom:150px;\"><div class=\"row\"><div class=\"col-xs-12 col-sm-7\"><h1 style=\"font-size:50px;pointer-events:none;\">Our Mission</h1><p style=\"font-size:30px;line-height:50px;\">Empower researchers to discover novel patterns and relationships between clinical and molecular factors.</p><a class=\"btn btn-outline btn-xl page-scroll\" href=\"http://cancergenome.nih.gov/publications/publicationguidelines\">Publishing Guidelines</a></div><div class=\"hidden-xs col-sm-5\" style=\"text-align:center\"><img src=\"assets/images/thumb.png\" class=\"img-responsive\" alt=\"\" style=\"display:inline-block;height:100%;\"></div></div></div></div>");
$templateCache.put("app/components/layoutpanel/layoutpanel.html","<div class=\"panel panel-default mdi\" style=\"padding-bottom:30px;\"><div class=\"panel-heading\"><h3 class=\"panel-title\">Patient Color Options</h3><span class=\"pull-right clickable\" data-effect=\"fadeOut\" ng-click=\"vm.close()\" role=\"button\" tabindex=\"0\"><i class=\"fa fa-times\"></i></span></div><div class=\"panel-body\"><div class=\"row\" ng-if=\"vm.colorOptions.length>0\"><div class=\"col-xs-12 col-sm-9\"><h3>Enter Hugo Gene(s) Seperated By + And - Operators. (eg BRCA1 + BRCA2 - p53)</h3><div class=\"input-group\"><div class=\"input-group-btn\"><button style=\"width:150px;\" type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">{{vm.colorOption.name}}&nbsp;<span class=\"caret\"></span></button><ul class=\"dropdown-menu\"><li ng-click=\"vm.colorOption=item;\" ng-repeat=\"item in vm.colorOptions\">{{item.name}}</li></ul></div><div class=\"input-group-btn\"><button style=\"width:100px;\" type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">{{vm.colorScale.name}}&nbsp;<span class=\"caret\"></span></button><ul class=\"dropdown-menu\"><li ng-click=\"vm.colorScale=item;\" ng-repeat=\"item in vm.colorScales\">{{item.name}}</li></ul></div><div class=\"input-group-btn\"><button style=\"width:100px;border-radius:0px;\" type=\"button\" class=\"btn btn-default dropdown-toggle\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"false\">{{vm.colorBin.name}}&nbsp;<span class=\"caret\"></span></button><ul class=\"dropdown-menu\"><li ng-click=\"vm.colorBin=item;\" ng-repeat=\"item in vm.colorBins\">{{item.name}}</li></ul></div><input ng-model=\"vm.geneColor\" type=\"text\" class=\"form-control\" placeholder=\"Hugo Gene Symbol\" style=\"border-right-width: 0px; border-left-width: 0px; height:33px;\"> <span class=\"input-group-btn\"><button class=\"btn btn-default\" type=\"button\" ng-click=\"vm.setGeneColor()\">Submit</button></span></div></div></div><div class=\"row\"><h3 class=\"col-sm-3\" ng-repeat=\"item in vm.optPatientColors\">{{item.name}}<br><div ng-repeat=\"color in item.values\"><a href=\"\" style=\"font-size:12px;\" class=\"hvr-sweep-to-right markers-command\" ng-click=\"vm.setColor(color)\">{{color.name}}</a></div></h3></div></div><div style=\"position:absolute;bottom:0px;width:100%;padding:10px;font-size:10px;text-align:center;\">Percentages Indicate Data Availibility</div></div>");
$templateCache.put("app/components/loader/loader.html","<div class=\"loader-modal\"><div class=\"loader\"><div class=\"loader__bar\"></div><div class=\"loader__bar\"></div><div class=\"loader__bar\"></div><div class=\"loader__bar\"></div><div class=\"loader__bar\"></div><div class=\"loader__ball\"></div></div></div>");
$templateCache.put("app/components/login/login.html","<section class=\"datasource\"><div class=\"container\"><div class=\"row\"><div class=\"col-sm-12 col-md-12\"><br><h1>Login</h1><button ng-click=\"vm.login(vm.networks[1]);\">Grant Permission</button></div></div></div></section>");
$templateCache.put("app/components/markers/markers.html","<os-tray content=\"tray-content-block\" change=\"vm.resize()\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-12 form-item\"><label>Edge Visibility</label><div class=\"legend-bar-container\"><div ng-repeat=\"item in vm.optEdgeColors\" class=\"legend-bar\" style=\"border-color:{{item.color}};position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\">{{item.name}} {{item.count}} <label class=\"switch\" style=\"float:right\" tooltip=\"Toggle Visibility\" tooltip-placement=\"left\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"item.show\" ng-change=\"vm.edgeToggle(item)\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label></div></div></div><div ng-if=\"vm.legendNodes.length>0\" class=\"col-xs-12 form-item\"><label>Patient {{vm.legendCaption}}</label><div class=\"legend-bar-container\"><div ng-repeat=\"item in vm.legendNodes\" class=\"legend-bar legend-bar-button\" style=\"border-color:{{item.color}};\">{{item.name}}<span id=\"{{item.id}}\" class=\"legend-count\"></span> <label style=\"float:right;padding-top:5px;\" class=\"btn-group\"><button tooltip=\"Deselect\" tooltip-placement=\"left\" ng-click=\"vm.deselectColor(item)\" class=\"btn btn-xs btn-default\" style=\"background-color:#039BE5;color:#FFF;text-shadow: 0 1px rgba(0, 0, 0, 0.2);width:24px;margin-right:1px;\"><i class=\"fa fa-circle-o\"></i></button> <button tooltip=\"Select\" tooltip-placement=\"left\" ng-click=\"vm.selectColor(item)\" class=\"btn btn-xs btn-default\" style=\"background-color:#039BE5;color:#FFF;text-shadow: 0 1px rgba(0, 0, 0, 0.2);width:24px;margin-left:1px;\"><i class=\"fa fa-dot-circle-o\"></i></button></label></div></div></div><div class=\"col-xs-12 form-item\"><label>Patient Options</label><div class=\"btn-group\" role=\"group\" style=\"display: block\"><button class=\"btn btn-default btn-no-focus\" type=\"button\" style=\"width:50%; font-weight: 300;\" title=\"Zoom Reset\" ng-click=\"vm.showPanelLayout = true\">Layouts</button> <button class=\"btn btn-default btn-no-focus\" type=\"button\" style=\"width:50%; font-weight: 300;\" title=\"Zoom Selection\" ng-click=\"vm.showPanelColor = true\">Colors</button></div></div><div class=\"col-xs-12 form-item\"><label>Gene Set</label><div class=\"input-group\"><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\" style=\"padding-right:30px;\">{{vm.optGeneSet.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\" style=\"width:100%\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.optGeneSets\" ng-click=\"vm.optGeneSet=item\">{{item.name}}</li></ul></div><div class=\"input-group-addon btn-help-icon\"><a href=\"http://resources.sttrcancer.org/api/#gene-sets\" target=\"_blank\"><i style=\"color:#000\" class=\"glyphicon glyphicon-question-sign\"></i></a></div></div></div><div class=\"col-xs-6 form-item\" style=\"padding-right:5px\"><label>Command Mode</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\" style=\"padding-right:30px;\">{{vm.optCommandMode.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\" style=\"width:100%\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.optCommandModes\" ng-click=\"vm.optCommandMode=item\">{{item.name}}</li></ul></div></div><div class=\"col-xs-6 form-item\" style=\"padding-left:5px\"><label>Search {{vm.searchCount}}</label><div class=\"input-group\"><input type=\"text\" class=\"form-control\" ng-model=\"vm.search\" ng-enter=\"vm.exeSearch()\" placeholder=\"\"><div class=\"input-group-addon btn-help-icon\" ng-click=\"vm.exeSearch()\">Go</div></div></div><div class=\"col-xs-12 form-item\" ng-if=\"vm.optCommandMode.name==\'Sequential\'\"><label>Commands</label><br><a ng-click=\"vm.cmd(\'ShowSelectedEdges\')\" class=\"markers-command hvr-sweep-to-right\">Show Edges of Selected</a> <a ng-click=\"vm.cmd(\'HideSelectedEdges\')\" class=\"markers-command hvr-sweep-to-right\">Hide Edges of Selected</a> <a ng-click=\"vm.cmd(\'HideUnselectedEdges\')\" class=\"markers-command hvr-sweep-to-right\">Hide Edges of Unselected</a> <a ng-click=\"vm.cmd(\'HideAllEdges\')\" class=\"markers-command hvr-sweep-to-right\">Hide All Edges</a> <a ng-click=\"vm.cmd(\'SelectInverse\')\" class=\"markers-command hvr-sweep-to-right\">Invert Node Selection</a> <a ng-click=\"vm.cmd(\'SelectConnected\')\" class=\"markers-command hvr-sweep-to-right\">Select Connected Nodes</a> <a ng-click=\"vm.cmd(\'HideUnselectedNodes\')\" class=\"markers-command hvr-sweep-to-right\">Hide Unselected Nodes</a> <a ng-click=\"vm.cmd(\'ShowAllNodes\')\" class=\"markers-command hvr-sweep-to-right\">Show All Nodes</a></div><div class=\"col-xs-12 form-item\"><label>Lock Selections</label><div class=\"btn-group\" role=\"group\" style=\"display: block\"><button class=\"btn btn-default btn-no-focus\" type=\"button\" ng-click=\"vm.lock(\'patient\')\" style=\"width:50%; font-weight: 300;\" title=\"Patient Selection Lock\"><i class=\"fa fa-unlock\" ng-show=\"!vm.lockPatients\"></i> <i class=\"fa fa-lock\" ng-show=\"vm.lockPatients\"></i> Patients</button> <button class=\"btn btn-default btn-no-focus\" type=\"button\" ng-click=\"vm.lock(\'gene\')\" style=\"width:50%; font-weight: 300;\" title=\"Gene Selection Lock\"><i class=\"fa fa-unlock\" ng-show=\"!vm.lockGenes\"></i> <i class=\"fa fa-lock\" ng-show=\"vm.lockGenes\"></i> Genes</button></div></div><div class=\"col-xs-12 form-item\"><label>Zoom</label><div class=\"btn-group\" role=\"group\" style=\"display: block\"><button class=\"btn btn-default btn-no-focus\" type=\"button\" ng-click=\"vm.zoom.reset()\" style=\"width:50%; font-weight: 300;\" title=\"Zoom Reset\">Fit</button> <button class=\"btn btn-default btn-no-focus\" type=\"button\" ng-click=\"vm.zoom.fit()\" style=\"width:50%; font-weight: 300;\" title=\"Zoom Selection\">Selected</button></div></div></div></section></os-tray><section class=\"tray-content-block\"><div id=\"markers-chart\" class=\"markers-chart\"></div><div style=\"position:absolute;top:10px;text-align:center;width:100%;\"><h2 class=\"h2-tool\">Markers + Patients</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span> &mdash; <span class=\"h3-tool\">{{vm.optPatientLayout.name}}</span></div></section><div id=\"modalEdge\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\"><div class=\"modal-dialog\" role=\"document\"><div class=\"modal-content\"><div class=\"modal-body\"><h2 style=\"margin-top:0px;\">Your request would add {{vm.edgeCounts.total}} edges to the graph.</h2><p>To improve performance + readability you may want to disable some of the edges.</p><div class=\"legend\" ng-repeat=\"item in vm.optEdgeColors | filter:{show:true}\"><label class=\"switch\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"item.show\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label> <span style=\"padding-left:20px;\">{{item.name}} ({{vm.edgeCounts[item.abv]}})</span></div></div><div style=\"position:absolute;right:10px;bottom:10px;\"><button class=\"btn btn-default\" ng-click=\"vm.hideModal()\">Cancel</button> <button class=\"btn btn-primary\" ng-click=\"vm.filterModelEdge()\">Continue</button></div></div></div></div><os-color-panel ng-if=\"vm.showPanelColor\" close=\"vm.showPanelColor=false\"></os-color-panel><div class=\"panel panel-default mdi\" ng-if=\"vm.showPanelLayout\"><div class=\"panel-heading\"><h3 class=\"panel-title\">Patient Layout</h3><span class=\"pull-right clickable\" data-effect=\"fadeOut\" ng-click=\"vm.showPanelLayout=false\"><i class=\"fa fa-times\"></i></span></div><div class=\"panel-body\"><div class=\"row\"><table class=\"tbl\"><thead><tr><th>Method</th><th>Gene Set</th><th>Input Data</th><th>Data Source</th></tr></thead><tbody><tr ng-repeat=\"item in vm.optPatientLayouts\" ng-click=\"vm.optPatientLayout=item;vm.showPanelLayout=false;\"><td>{{item.dataType}}</td><td>{{item.geneset}}</td><td>{{item.input}}</td><td>{{item.source}}</td></tr></tbody></table></div></div></div>");
$templateCache.put("app/components/parallelcoord/parallelcoord.html","<os-tray content=\"tray-content-block\" change=\"vm.resize($event)\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-12 form-item\"><br><label></label></div><div class=\"col-xs-12 form-item\"><label>Selected Gene</label><div class=\"input-group\"><input style=\"background:#FFF;\" class=\"form-control\" aria-label=\"Text input with segmented button dropdown\" ng-model=\"vm.gene\" onfocus=\"this.select();\"><div class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-default\" ng-click=\"vm.updateGene()\"><span class=\"fa fa-plus\" aria-hidden=\"true\"></span></button></div></div></div></div></section></os-tray><section class=\"tray-content-block\"><div class=\"tool-container\"><h2 class=\"h2-tool\">Parallel Coordinates</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span><div id=\"parallelcoord-chart\" class=\"parallelcoord\"></div></div></section><os-color-panel ng-if=\"vm.showPanelColor\" close=\"vm.showPanelColor=false\"></os-color-panel>");
$templateCache.put("app/components/pathways/pathways.html","<os-tray content=\"tray-content-block\" change=\"vm.resize($event)\"><section class=\"tray-content\"><div class=\"row\"><br><br><div class=\"col-xs-12 form-item\"><label>Search</label> <input type=\"text\" class=\"form-control\" ng-model=\"vm.search\"></div><div class=\"col-xs-12 form-label\"><h2>Legend</h2><span class=\"legend-bar\" style=\"border-color: green\">Activation</span> <span class=\"legend-bar\" style=\"border-color: red\">Inhibition</span> <span class=\"legend-bar\" style=\"border-color: #38347B\">Modification</span> <span class=\"legend-bar\" style=\"border-color: #056ce1\">Genes</span></div></div></section></os-tray><section class=\"tray-content-block\" style=\"padding-right:0px;\"><div id=\"pathways-chart\" class=\"pathways-chart\"></div><div style=\"position:absolute;top:10px;text-align:center;width:100%;\"><h2 class=\"h2-tool\">Pathways</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span></div></section><div class=\"modal fade pathways\" id=\"gbm-webpage\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\"><div class=\"modal-dialog\" role=\"document\"><div class=\"modal-content\"><div class=\"modal-header\"><button type=\"button\" class=\"close\" data-dismiss=\"modal\" aria-label=\"Close\"><span aria-hidden=\"true\">&times;</span></button><h4 class=\"modal-title\" id=\"myModalLabel\">{{vm.tip}}</h4></div><iframe class=\"modal-iframe\" ng-src=\"{{vm.frame}}\"></iframe></div></div></div>");
$templateCache.put("app/components/pca/pca.html","<os-tray content=\"tray-content-block\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-12 form-item\"><div class=\"kanban-column\"><label>History</label><div class=\"portlet legend-bar-container\"><div class=\"portlet-content\"><div class=\"input-group\"><input style=\"background:#FFF;\" class=\"form-control\" aria-label=\"Text input with segmented button dropdown\" ng-model=\"vm.base.title\" onfocus=\"this.select();\"><div class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-default\" tooltip=\"{{vm.base.edit ? \'Close Editor\' : \'Edit Calculation\'}}\" tooltip-placement=\"left\" ng-click=\"vm.copyBase()\"><span class=\"fa {{vm.base.edit ? \'fa-close\' : \'fa-pencil\'}}\" aria-hidden=\"true\" style=\"border-color:#FFF\"></span></button> <button type=\"button\" class=\"btn btn-default\" aria-hidden=\"true\" tooltip=\"{{vm.base.edit ? \'Run Calculation\' : \'Toggle Visibility\'}}\" tooltip-placement=\"left\" style=\"{{vm.base.edit ? \'background-color:#47a8d8\' : \'\'}}\" ng-click=\"vm.updateBaseview()\"><span class=\"fa {{vm.base.edit ? \'fa-refresh\' : \'fa-eye\'}}\" style=\"{{vm.base.edit ? \'color:#FFF\' : (vm.base.visibility == \'visible\' ? \'color:#039BE5\' : \'color:grey\')}}\"></span></button></div></div><div class=\"input-group\" ng-if=\"vm.base.edit\" style=\"width:100%\"><div class=\"dropdown bs-dropdown\" style=\"max-width:230px\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.temp.data.selected.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.temp.data.types\" ng-click=\"vm.temp.data.selected.name=item.name\">{{item.name}}</li></ul></div><div ng-repeat=\"item in vm.temp.params.bool\" style=\"position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\">{{item.name}} <label class=\"switch\" style=\"float:right\" tooltip=\"Subset input data\" tooltip-placement=\"left\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"item.use\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label></div></div><div ng-if=\"!vm.base.edit\">Data: {{vm.base.data.selected.name}}<br>Geneset: {{vm.base.params.bool.geneset.use ? vm.base.params.bool.geneset.name : \'All Genes\'}}<br>Cohort: {{vm.base.params.bool.cohort.use ? vm.base.params.bool.cohort.name : \"All Patients + Samples\"}}</div></div><div class=\"portlet-content\" ng-repeat=\"item in vm.overlay\"><div class=\"input-group\"><input style=\"background:#FFF;\" class=\"form-control\" aria-label=\"Text input with segmented button dropdown\" ng-model=\"item.title\" onfocus=\"this.select();\"><div class=\"input-group-btn\"><button type=\"button\" class=\"btn btn-default\" tooltip=\"{{item.edit ? \'Close Editor\' : \'Edit Calculation\'}}\" tooltip-placement=\"left\" ng-click=\"vm.copyItem(item)\"><span class=\"fa {{item.edit ? \'fa-close\' : \'fa-pencil\'}}\" aria-hidden=\"true\" style=\"border-color:#FFF\"></span></button> <button type=\"button\" class=\"btn btn-default\" aria-hidden=\"true\" tooltip=\"{{item.edit ? \'Run Calculation\' : \'Toggle Visibility\'}}\" tooltip-placement=\"left\" style=\"{{item.edit ? \'background-color:#47a8d8\' : \'\'}}\" ng-model=\"item\" ng-click=\"vm.updateItemview(item)\"><span class=\"fa {{item.edit ? \'fa-refresh\' : \'fa-eye\'}}\" style=\"{{item.edit ? \'color:#FFF\' : (item.visibility == \'visible\' ? \'color:#039BE5\' : \'color:grey\')}}\"></span></button></div></div><div class=\"input-group\" ng-if=\"item.edit\" style=\"width:100%\"><div class=\"dropdown bs-dropdown\" style=\"max-width:230px\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{item.data.selected.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"subitem in item.data.types\" ng-click=\"item.data.selected.name=subitem.name\">{{subitem.name}}</li></ul></div></div><div ng-if=\"!item.edit\">Data: {{item.data.selected.name}}<br></div></div><button class=\"btn btn-default btn-no-focus\" type=\"button\" style=\"width:100%;font-weight: 300;border:white; text-align:left;color:#039BE5\" ng-click=\"vm.copyItem();\"><span class=\"fa fa-plus\" style=\"color:#039BE5; padding-right:7px\"></span>Layer</button></div></div></div><div class=\"col-xs-12 form-item\"><label>Legend</label><div class=\"legend-bar-container\"><label style=\"margin:10px\"><b>{{vm.legendCaption}}</b></label> <button class=\"btn btn-default btn-no-focus\" type=\"button\" style=\"float:right; border:white\" ng-click=\"vm.showPanelColor = true\"><span class=\"fa fa-pencil\"></span></button><div ng-repeat=\"item in vm.legendNodes\" class=\"legend-bar legend-bar-button\" style=\"border-color:{{item.color}}\">{{item.name}}<span id=\"{{item.id}}\" class=\"legend-count\"></span> <label style=\"float:right;padding-top:5px;\" class=\"btn-group\"><button tooltip=\"Deselect\" tooltip-placement=\"left\" ng-click=\"vm.deselectColor(item)\" class=\"btn btn-xs btn-default\" style=\"background-color:#47a8d8;color:#FFF;text-shadow: 0 1px rgba(0, 0, 0, 0.2);width:24px;margin-right:1px;\"><i class=\"fa fa-circle-o\"></i></button> <button tooltip=\"Select\" tooltip-placement=\"left\" ng-click=\"vm.selectColor(item)\" class=\"btn btn-xs btn-default\" style=\"background-color:#47a8d8;color:#FFF;text-shadow: 0 1px rgba(0, 0, 0, 0.2);width:24px;margin-left:1px;\"><i class=\"fa fa-dot-circle-o\"></i></button></label></div></div></div><div class=\"col-xs-12 form-item\"><label>Export Results</label><div><button class=\"btn btn-default btn-no-focus\" type=\"button\" style=\"width:100%;font-weight: 300;border:white; text-align:left;color:#039BE5\" ng-click=\"vm.exportJSON();\"><span class=\"fa fa-download\" style=\"padding-right:7px\"></span>PCA scores</button></div></div></div></section></os-tray><div id=\"modalRun\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\"><div class=\"modal-dialog\" role=\"document\"><div class=\"modal-content\"><div class=\"modal-body\"><h2 style=\"margin-top:0px;\">Calculating Similarity Plot</h2><h3>Estimated runtime is approximately {{vm.runTime}} seconds.</h3></div><div style=\"position:absolute;right:10px;bottom:10px;\"><button class=\"btn btn-default\" ng-click=\"vm.hideModal()\">Cancel</button> <button class=\"btn btn-primary\" ng-click=\"vm.callBaseMethod()\">Continue</button></div></div></div></div><div id=\"modal_intersection\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\"><div class=\"modal-dialog\" role=\"document\"><div class=\"modal-content\"><div class=\"modal-body\"><div style=\"margin-top:0px;margin-bottom:20px\">Sorry, the datasets chosen have no intersecting markers. Correlation calculation is impossible using {{vm.geneSet.name}}.</div><div style=\"position:absolute;right:10px;bottom:10px;\"><button class=\"btn btn-default\" ng-click=\"vm.hideModal()\">Return</button></div></div></div></div></div><div id=\"modal_NArun\" class=\"modal fade\" tabindex=\"-1\" role=\"dialog\" aria-labelledby=\"myModalLabel\"><div class=\"modal-dialog\" role=\"document\"><div class=\"modal-content\"><div class=\"modal-body\"><span style=\"margin-top:0px;\"><h3>Sorry, PCA could not be calculated.</h3><br>Geneset: {{vm.geneSet.name}}<br>Reason: {{vm.error}}</span></div><div style=\"position:absolute;right:10px;bottom:10px;\"><button class=\"btn btn-default\" ng-click=\"vm.hideModal()\">Return</button></div></div></div></div><section class=\"tray-content-block\"><div class=\"tool-container\"><h2 class=\"h2-tool\">Principal Component Analysis</h2><span class=\"h3-tool\">{{vm.base.source.source}} {{vm.base.source.name}}</span><div id=\"pca-chart\" class=\"pca\"></div></div></section><os-color-panel ng-if=\"vm.showPanelColor\" close=\"vm.showPanelColor=false\"></os-color-panel>");
$templateCache.put("app/components/plsr/plsr.html","<os-tool-menu datasource=\"{{vm.datasource}}\" change=\"vm.addCohortGene()\"></os-tool-menu><os-tray content=\"tray-content-block\" change=\"vm.resize($event)\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-12 form-label\"><h2>Filters</h2></div><div class=\"col-xs-12 form-item\"><label>Gene Set</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.geneset.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\"><li ng-repeat=\"item in vm.genesets\" ng-click=\"vm.geneset=item\">{{item.name}}</li></ul></div></div><div class=\"col-xs-12 form-item\"><label>Data Source</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.collection.source}} - {{vm.collection.type}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\"><li ng-repeat=\"item in vm.datasource.molecular\" ng-click=\"vm.collection=item\">{{item.source}} - {{item.type}}</li></ul></div></div><div class=\"col-xs-12 form-item\"><label>Age At Diagnosis (Years)</label><div range-slider=\"\" min=\"vm.dx.bound.min\" model-min=\"vm.dx.value.min\" max=\"vm.dx.bound.max\" model-max=\"vm.dx.value.max\" prevent-equal-min-max=\"true\" show-values=\"true\" attach-handle-values=\"true\" on-handle-up=\"vm.filterChange()\"></div></div><div class=\"col-xs-12 form-item\"><label>Survival (Days)</label><div range-slider=\"\" min=\"vm.dd.bound.min\" model-min=\"vm.dd.value.min\" max=\"vm.dd.bound.max\" model-max=\"vm.dd.value.max\" prevent-equal-min-max=\"\" show-values=\"true\" attach-handle-values=\"true\" on-handle-up=\"vm.filterChange()\"></div></div><div class=\"col-xs-12 form-label\"><h2>Legend</h2><span class=\"legend-bar\" style=\"border-color: #FF9800\">Age At Diagnosis</span> <span class=\"legend-bar\" style=\"border-color: #38347b\">Survial</span> <span class=\"legend\"><span class=\"legend-dot\" style=\"background-color:#039BE5\"></span>Genes</span></div></div></section></os-tray><section class=\"tray-content-block\"><div class=\"tool-container\"><h2 class=\"h2-tool\">Partial Least Squares Regression</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span><div id=\"plsr-chart\" class=\"pca\"></div></div></section>");
$templateCache.put("app/components/spreadsheet/spreadsheet.html","<os-tray caption=\"Patients\" content=\"tray-content-block\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-12 form-item\"><label>Clinical Collections</label><div class=\"input-group\"><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.collection.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\" style=\"width:260px;\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.collections\" ng-click=\"vm.collection=item\">{{item.name}}</li></ul></div><div class=\"input-group-addon btn-help-icon\"><a style=\"color:#000;\" href=\"http://resources.sttrcancer.org/api/#clinical-data\" target=\"_blank\"><i class=\"glyphicon glyphicon-question-sign\"></i></a></div></div></div><div class=\"col-xs-12 form-item\"><label>CSV Export</label><div class=\"btn-group\" role=\"group\" style=\"display: block\"><button class=\"btn btn-default btn-no-focus\" type=\"button\" style=\"width:50%; font-weight: 300;\" ng-click=\"vm.exportCsv(\'selected\')\">Selected</button> <button class=\"btn btn-default btn-no-focus\" type=\"button\" style=\"width:50%; font-weight: 300;\" ng-click=\"vm.exportCsv(\'all\')\">All</button></div></div></div></section></os-tray><section class=\"tray-content-block\"><div class=\"tool-container\"><h2 class=\"h2-tool\">Spreadsheet</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span> <button ng-click=\"vm.sortSelected()\" class=\"btn btn-default\" style=\"position:absolute; left: 310px;top: 30px;\" tooltip=\"Move Selected Rows To The Top Of The Grid\" tooltip-placement=\"right\">Selected On Top</button> <button ng-click=\"vm.showPanelColumns=true\" class=\"btn btn-default\" style=\"position:absolute; right: 310px;top: 30px;\" tooltip=\"Toggle Columns On + Off\" tooltip-placement=\"right\">Select Columns</button><div class=\"grid\" id=\"spreadsheet-grid\" ui-grid=\"vm.options\" ui-grid-selection=\"\" ui-grid-resize-columns=\"\" ui-grid-move-columns=\"\" ui-grid-pinning=\"\" ui-grid-autoresize=\"\" ui-grid-grouping=\"\"></div></div></section><div class=\"panel panel-default mdi\" ng-if=\"vm.showPanelColumns\"><div class=\"panel-heading\"><h3 class=\"panel-title\">Visible Columns</h3><span class=\"pull-right clickable\" data-effect=\"fadeOut\" ng-click=\"vm.closePanelColumns()\"><i class=\"fa fa-times\"></i></span></div><div class=\"panel-body\" style=\"padding-top:0px;\"><div class=\"row\"><br><div class=\"col-xs-12\"><button class=\"btn btn-default btn-no-focus\" type=\"button\" ng-click=\"vm.showColumns()\">Select All</button> <button class=\"btn btn-default btn-no-focus\" type=\"button\" ng-click=\"vm.hideColumns()\">Deselect All</button></div></div><div class=\"row\"><div class=\"col-md-4\" ng-repeat=\"col in vm.options.columnDefs | orderBy:\'name\'\" style=\"text-transform:capitalize;\"><div class=\"checkbox\" style=\"margin-bottom:0px\"><label><input type=\"checkbox\" ng-model=\"col.visible\">{{col.name}}</label></div></div></div></div></div>");
$templateCache.put("app/components/sunburst/sunburst.html","<os-tray content=\"tray-content-block\" change=\"vm.resize($event)\"><section class=\"tray-content\"><div class=\"row\"><br><br><div class=\"col-xs-12 form-item\"><label>Patient</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.patient.patient_ID}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\"><li ng-repeat=\"item in vm.patients\">{{item.patient_ID}}</li></ul></div></div><div class=\"col-xs-12 form-item\" ng-repeat=\"chart in vm.charts\"><label>{{chart.name}}</label><div ng-repeat=\"group in chart.groups\" class=\"legend-bar\" style=\"border-color:#FFF;position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\"><label class=\"switch\" style=\"float:right\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"group.show\" ng-change=\"vm.draw()\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label> {{group.name}}<div ng-repeat=\"tag in group.tags\" class=\"legend-bar\" style=\"border-color:{{tag.color}}; position: relative; padding: 2px 10px; line-height: 25px; background-color: rgb(255, 255, 255);\">{{tag.name}}</div></div></div></div></section></os-tray><section class=\"tray-content-block\"><div style=\"position:absolute;top:10px;text-align:center;width:100%;\"><h2 class=\"h2-tool\">Sunburst</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span><div id=\"sunburst-chart\"></div></div></section>");
$templateCache.put("app/components/survival/survival.html","<os-tray content=\"tray-content-block\" change=\"vm.resize($event)\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-12 form-item\" ng-if=\"vm.cohortsLegend.length>0\"><label>Cohorts</label><div ng-repeat=\"cohort in vm.cohortsLegend track by $index\" class=\"legend-bar\" style=\"border-color:{{cohort.color}};position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\"><span>{{cohort.name}}</span> <label class=\"switch {{item.class}}\" style=\"float:right\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"cohort.show\" ng-change=\"vm.toggle(cohort)\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label></div></div><div class=\"col-xs-12 form-item\"><label>Selected Cohort</label><div class=\"legend-bar\" style=\"border-color:{{vm.cohort.color}};position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\"><span>{{vm.cohort.name}} (selected)</span></div><br><label>P-Values for Selected Cohort</label><div class=\"tray-chart\"><div ng-repeat=\"p in vm.pValues track by $index\" style=\"height:25px;line-height:25px;margin-bottom:1px;\">&nbsp; {{p.p}}<div ng-repeat=\"c in p.c track by $index\" style=\"background-color:{{c}};width:10px;height:25px;margin-right:1px;display:inline-block;float:left;\"></div></div></div></div></div></section></os-tray><section class=\"tray-content-block survival\"><div style=\"position:absolute;top:10px;text-align:center;width:100%;\"><h2 class=\"h2-tool\">Survival Curves</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span><div id=\"survival-chart\"></div></div></section>");
$templateCache.put("app/components/timelines/timelines.html","<os-tray content=\"tray-content-block\" change=\"vm.resize($event)\"><section class=\"tray-content\"><div class=\"row\"><div class=\"col-xs-6 form-item\" style=\"padding-right:5px\"><label>Align By</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.align.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\" style=\"width:100%\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.events track by $index\" ng-click=\"vm.align=item; vm.update();\">{{item.name}}</li></ul></div></div><div class=\"col-xs-6 form-item\" style=\"padding-left:5px\"><label>Order By</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.sort.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu dropdown-menu-right\" aria-labelledby=\"dropdownMenu1\" style=\"width:100%\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.events track by $index\" ng-click=\"vm.sort=item; vm.update();\">{{item.name}}</li></ul></div></div><div class=\"col-xs-6 form-item\" style=\"padding-right:5px\"><label>Patient Status</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.filter.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\" style=\"width:100%\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.filters\" ng-click=\"vm.filter=item;vm.update();\">{{item.name}}</li></ul></div></div><div class=\"col-xs-6 form-item\" style=\"padding-left:5px\"><label>Timescale</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.timescale.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu dropdown-menu-right\" aria-labelledby=\"dropdownMenu1\" style=\"width:100%\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.timescales\" ng-click=\"vm.timescale=item;vm.update();\">{{item.name}}</li></ul></div></div><div class=\"col-xs-12 form-item\"><label>Display Filter</label><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" id=\"dropdownMenu1\" data-toggle=\"dropdown\" aria-haspopup=\"true\" aria-expanded=\"true\">{{vm.displayMode.name}} <span class=\"caret\"></span></button><ul class=\"dropdown-menu\" aria-labelledby=\"dropdownMenu1\" style=\"width:100%\"><li class=\"markers-command hvr-sweep-to-right\" ng-repeat=\"item in vm.displayModes\" ng-click=\"vm.displayMode=item;vm.update();\">{{item.name}}</li></ul></div></div><div class=\"col-xs-12 form-item\"><div class=\"dropdown bs-dropdown\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" ng-click=\"vm.resetZoom()\" style=\"text-align:center;\">Clear Selection + Reset Zoom</button></div></div><div class=\"col-xs-12 form-item\"><label>Events</label><div ng-repeat=\"item in vm.events track by $index\" class=\"legend-bar\" style=\"border-color:{{item.color}};position:relative;background-color:#FFF;padding:2px 10px;line-height:25px;\">{{item.name}} <label class=\"switch {{item.class}}\" style=\"float:right\"><input type=\"checkbox\" class=\"switch-input\" ng-model=\"item.selected\" ng-change=\"vm.update();\"> <span class=\"switch-label\" data-on=\"On\" data-off=\"Off\"></span> <span class=\"switch-handle\"></span></label></div></div></div></section></os-tray><section class=\"tray-content-block\"><div style=\"position:absolute;top:10px;text-align:center;width:100%;\"><h2 class=\"h2-tool\">Timelines</h2><span class=\"h3-tool\">{{vm.datasource.source}} {{vm.datasource.name}}</span><div class=\"timelines-content\" style=\"margin-top:20px;\"></div></div></section>");
$templateCache.put("app/components/tools/tools.html","<section class=\"datasource\"><div class=\"container\"><div class=\"row\"><div class=\"col-sm-12 col-md-8\"><br><h1>Analysis Tools</h1></div></div><div class=\"row\"><ul><li ng-repeat=\"tool in vm.tools\" class=\"col-xs-12 col-sm-6 col-md-4\" ng-click=\"vm.explore(tool.route)\"><div class=\"datasource-btn\"><img class=\"datasource-img\" ng-src=\"/assets/images/{{tool.img}}\"><p class=\"datasource-h1\" style=\"padding-top:10px;\">{{tool.name}}</p><p class=\"datasource-h2\">{{tool.desc}}</p></div></li></ul></div></div></section>");
$templateCache.put("app/components/tray/tray.html","<div><label class=\"tray-label tray-label-right\"><i class=\"fa fa-chevron-left\" aria-hidden=\"true\"></i></label><div class=\"tray {{vm.trayClass}} tray-right\" locked=\"true\"><ng-transclude></ng-transclude><i class=\"fa fa-lock tray-sticky-icon {{vm.iconClass}}\" ng-click=\"vm.toggle()\" tooltip=\"Show / Hide\" tooltip-placement=\"left\"></i></div></div>");
$templateCache.put("app/components/userdatasource/userdatasource.html","<section class=\"userdatasource\"><div class=\"container\"><div class=\"row\"><div class=\"col-sm-12 col-md-12\"><br><h1>My Datasets</h1></div></div><div class=\"well\"><div ng-show=\"vm.user == null\"><h3>Choose from import options below or <a ng-click=\"vm.login();\" style=\"cursor:pointer\">Login</a> to access your personal datasets.</h3></div><div ng-show=\"vm.user != null\"><div ng-show=\"vm.projects.length ==0\">Please upload a project from below</div><div class=\"row\"><ul><li ng-repeat=\"dataset in vm.projects\" class=\"col-xs-12 col-sm-6 col-md-4 col-lg-3\" ng-click=\"vm.explore(\'tools\',dataset)\"><div class=\"datasource-btn\"><img class=\"datasource-img\" ng-src=\"/assets/images/img{{dataset.img}}\"><p class=\"datasource-h1\">{{dataset.name}}</p><p class=\"datasource-h2\">{{dataset.source}}</p></div></li></ul></div></div></div><h1>Import</h1><div class=\"row\"><ul style=\"list-style:none\"><li ng-repeat=\"api in vm.apis\" class=\"col-xs-12 col-sm-6 col-md-4 col-lg-3\" ng-click=\"vm.showDatasourceOption(api.name)\"><div class=\"datasource-btn\"><img class=\"datasource-img\" ng-src=\"/assets/images/{{api.img}}\"><p class=\"datasource-h1\">{{api.name}}</p></div></li></ul></div></div></section>");}]);
//# sourceMappingURL=../maps/scripts/app-98f7a31a45.js.map
