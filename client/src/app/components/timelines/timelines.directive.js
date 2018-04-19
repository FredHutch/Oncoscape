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
            vm.timescales = [
                { name: 'Log', valFn: function(val) { return (val < 0 ? -1 : 1) * Math.log(Math.abs((val * 1000) / 86400000) + 1) / Math.log(2); } },
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
                // if(vm.cohort.patientIds.length >0)
                    // vm.displayMode = vm.displayModes[1];
                updatePatientsVisible();
                updateScale(); // Depends on Visible Patients

                drawPatients();
                drawSelected();
                drawScrollbars();
                drawAxis();
                // drawSelected();
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
                osApi.setCohort(ids, "Timelines", osApi.PATIENT);
                elHitarea.call(d3.event.target.move, null);
            }

            function drawSelected() {

                // // Transform Selections Into Index Positions - Don't need to render unselected
                // var selectedIndexes = patientsVisible.map(function(v, i) {
                //     return (v.selected) ? i : -1;
                // }).filter(function(v) { return v != -1; });

                // var selectedRows = elSelected.selectAll("rect").data(selectedIndexes);

                // selectedRows.exit()
                //     .transition()
                //     .duration(600)
                //     .attr("width", "0")
                //     .remove();

                // selectedRows.enter()
                //     .append('rect')
                //     .attr('width', '0')
                //     .attr('height', rowHeight - 2)
                //     .attr('y', 1)
                //     .attr('transform', function(d) { return "translate(0," + (d * rowHeight) + ")"; })
                //     .style("fill", "#cacaca")
                //     .transition()
                //     .duration(600)
                //     .attr("width", "100%");

                // selectedRows
                //     .transition()
                //     .duration(600)
                //     .attr('transform', function(d) { return "translate(0," + (d * rowHeight) + ")"; });
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
                    // patient.selected = (vm.cohort.patientIds.indexOf(patient.id) !== -1);
                    // patient.visible = true;
                    if (vm.cohort.patientIds.length === 0 ) {
                        patient.visible = true;
                    } else {
                        patient.visible = (vm.cohort.patientIds.indexOf(patient.id) !== -1);
                    }

                    // Filter Patients W/O Align, Sort or Filter
                    if (!patient.hash.hasOwnProperty(this.align) || !patient.hash.hasOwnProperty(this.sort) || !patient.hash.hasOwnProperty("Status")) {
                        patient.visible = false;
                        return;
                    }

                    // Filter Based On Alive Dead Status
                    var status = patient.hash.Status.data.status;
                    if ((this.filter == "Only Alive" && status == "Dead") || (this.filter == "Only Dead" && status != "Dead")) {
                        patient.visible = false;
                        return;
                    }

                    // Filter Selected
                    // if (vm.displayMode.name == "Selected Patients" && !patient.selected) {
                    //     patient.visible = false;
                    //     return;
                    // }

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
                // console.log(patientsVisible.length+'aa')
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
                            return v.start !== null && typeof v.start !== "undefined";
                        })
                        .map(function(v) {
                            this.events[v.name] = null;
                            if (v.hasOwnProperty("data")) {
                                v.tip = Object.keys(v.data).reduce(function(p, c) {
                                    try {
                                        if (v.data[c] !== null) {
                                            p += "<br>" + c
                                                .replace(/([A-Z])/g, " $1")
                                                .replace(/_/g, " ")
                                                .replace(/\w\S*/g, function(txt) {
                                                    return txt
                                                }) + ": " + v.data[c].toString()
                                                .replace(/\w\S*/g, function(txt) { return txt; });
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
                            v.tsEnd = (v.end === null || typeof v.end == "undefined") ? v.tsStart : moment(v.end, "MM/DD/YYYY").unix();
                            v.tsStartAligned = "";
                            v.tsEndAligned = "";
                            v.end = (v.end === null || typeof v.end == "undefined") ? v.start : v.end;
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
                drawAxis();
                drawPatients();
                drawScrollbars();
                drawSelected();
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