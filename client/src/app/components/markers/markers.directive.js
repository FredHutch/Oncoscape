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

            // Const Colors 
            var color = {
                darkblue: 'rgb(5, 108, 225)',
                blue: 'rgb(19, 150, 222)',
                black: 'black',
                white: 'white',
                red: 'red',
                purple: 'rgb(56, 52,123)',
                gray: '#CCC'
            };

            // Const Style
            var styles = [{
                selector: 'node',
                style: {
                    'background-color': color.black,
                    'border-opacity': 1,
                    'border-color': color.red,
                    'border-width': "0px",
                    'height': "20px",
                    'width': "20px",
                    'label': " data(id)",
                    'text-halign': "right",
                    'text-valign': "center",
                    'text-background-color': color.white,
                    'text-background-opacity': '.8',
                    'text-background-shape': 'roundrectangle',
                    'font-size': '0px'
                }
            }, {
                selector: 'node[nodeType="patient"]',
                style: {
                    'background-color': color.blue,
                    'height': '50px',
                    'width': '50px'
                }
            }, {
                selector: 'edge',
                style: {
                    'line-color': color.gray,
                    'line-style': 'solid',
                    'width': '3px',
                    'display': 'none'
                }
            }, { // Chromo Bars
                selector: 'edge[edgeType="chromosome"]',
                style: {
                    'line-color': color.darkblue,
                    'display': 'element'
                }
            }, {
                selector: 'node[nodeType="gene"]',
                style: {
                    'border-color': color.blue,
                    'border-width': '3px',
                    'background-color': color.white,
                    'height': 'mapData(degree, 0, 50, 10.0, 80.0)',
                    'width': 'mapData(degree, 0, 50, 10.0, 80.0)'
                }
            }, {
                selector: 'node[nodeType="patient"]:selected',
                style: {
                    'background-color': color.red,
                    'width': '100px',
                    'height': '100px',
                    'shape': 'diamond'

                }
            }];

            // Interactive Mode Options
            var optInteractiveModesFactory = function(chart, vm) {
                // Event Signals
                var events = (function() {
                    var geneOver = new signals.Signal();
                    var geneOut = new signals.Signal();
                    var geneClick = new signals.Signal();
                    var patientOver = new signals.Signal();
                    var patientOut = new signals.Signal();
                    var patientClick = new signals.Signal();
                    var removeAll = function() {
                        geneOver.removeAll();
                        geneOut.removeAll();
                        patientOver.removeAll();
                        patientOut.removeAll();
                        geneClick.removeAll();
                        patientClick.removeAll();
                    }
                    var over = function(e) {
                        geneOver.add(e);
                        patientOver.add(e);
                    };
                    var out = function(e) {
                        geneOut.add(e);
                        patientOut.add(e);
                    }
                    var click = function(e) {
                        geneClick.add(e);
                        patientClick.add(e);
                    }
                    return {
                        geneOver: geneOver,
                        geneOut: geneOut,
                        geneClick: geneClick,
                        patientOver: patientOver,
                        patientOut: patientOut,
                        patientClick: patientClick,
                        over: over,
                        out: out,
                        click: click,
                        removeAll: removeAll
                    };
                })();

                chart
                    .on('click', 'node[nodeType="gene"]', events.geneClick.dispatch)
                    .on('click', 'node[nodeType="patient"]', events.patientClick.dispatch)
                    .on('mouseover', 'node[nodeType="gene"]', events.geneOver.dispatch)
                    .on('mouseover', 'node[nodeType="patient"]', events.patientOver.dispatch)
                    .on('mouseout', 'node[nodeType="gene"]', events.geneOut.dispatch)
                    .on('mouseout', 'node[nodeType="patient"]', events.patientOut.dispatch);
                // States
                var states = [{
                    name: 'None',
                    register: function() {},
                    unregister: function() {}
                }, {
                    name: 'Show All Edges',
                    register: function() {
                        events.over(function(e) {
                            if (e.cyTarget.data().nodeType == 'patient') {
                                $scope.$apply(function() {
                                    vm.patient = e.cyTarget.attr('patient');
                                    vm.patientChromosomes = e.cyTarget.neighborhood("node").map(function(item) {
                                        return item.data().id
                                    });
                                });
                            }
                            e.cyTarget.style({
                                'font-size': '100px'
                            });
                            e.cyTarget.animate({
                                style: {
                                    'border-width': 150
                                }
                            }, {
                                duration: 300
                            });
                            e.cyTarget.neighborhood('node').style({
                                'font-size': '70px'
                            });
                        });
                        events.out(function(e) {
                            $scope.$apply(function() {
                                vm.patient = vm.patientChromosomes = null;
                            });
                            e.cyTarget.style({
                                'font-size': '0px'
                            });
                            e.cyTarget.animate({
                                style: {
                                    'border-width': 0
                                }
                            }, {
                                duration: 100

                            });
                            e.cyTarget.neighborhood('node').style({
                                'font-size': '0px'
                            });
                        });
                        chart.$('edge[edgeType!="chromosome"]').style({
                            display: 'element'
                        });
                    },
                    unregister: function() {
                        events.removeAll();
                        chart.$('edge[edgeType!="chromosome"]').style({
                            display: 'none'
                        });
                    }
                }, {
                    name: 'One Degree',
                    register: function() {
                        events.click(function(e) {
                            var ds = vm.datasource;
                            if (ds.indexOf("TCGA" == 0)) {
                                var cbioDsName = ds.substr(4) + "_tcga";
                                var genes = e.cyTarget.neighborhood('node').map(function(n) {
                                    return n.data().name;
                                }).join("+");
                                var url = "http://www.cbioportal.org/ln?cancer_study_id=" + cbioDsName + "&q=" + genes;
                                $scope.$apply(function() {
                                    $window.open(url);
                                });
                            }
                        });
                        events.over(function(e) {
                            if (e.cyTarget.data().nodeType == 'patient') {
                                $scope.$apply(function() {
                                    vm.patient = e.cyTarget.attr('patient');
                                    vm.patientChromosomes = e.cyTarget.neighborhood("node").map(function(item) {
                                        return item.data().id
                                    });
                                });
                            }
                            e.cyTarget.style({
                                'height': '60px',
                                'width': '60px',
                                'font-size': '100px'
                            });
                            e.cyTarget.neighborhood('node').style({
                                'font-size': '70px'
                            });
                            e.cyTarget.neighborhood('edge').style({
                                'display': 'element'
                            });
                        });
                        events.out(function(e) {
                            $scope.$apply(function() {
                                vm.patient = vm.patientChromosomes = null;
                            });
                            e.cyTarget.style({
                             
                                'font-size': '0px'
                            });
                            e.cyTarget.neighborhood('node').style({
                                'font-size': '0px'
                            });
                            e.cyTarget.neighborhood('edge').style({
                                'display': 'none'
                            });
                        });
                    },
                    unregister: function() {
                        events.removeAll();
                    }
                }, {
                    name: 'Two Degrees',
                    register: function() {
                        events.over(function(e) {
                            if (e.cyTarget.data().nodeType == 'patient') {
                                $scope.$apply(function() {
                                    vm.patient = e.cyTarget.attr('patient');
                                    vm.patientChromosomes = e.cyTarget.neighborhood("node").map(function(item) {
                                        return item.data().id
                                    });
                                });
                            }
                            e.cyTarget.style({
                                'height': '60px',
                                'width': '60px',
                                'font-size': '100px'
                            });
                            e.cyTarget.neighborhood('node')
                                .neighborhood('edge').style({
                                    'line-style': 'dashed',
                                    'display': 'element'

                                });

                            // Should Have Different Line Style For 1st Degree 
                            e.cyTarget.neighborhood('edge').style({
                                'line-style': 'solid'
                            });
                        });
                        events.out(function(e) {
                            $scope.$apply(function() {
                                vm.patient = vm.patientChromosomes = null;
                            });
                            e.cyTarget.style({
                                'font-size': '0px'
                            });
                            e.cyTarget.neighborhood('node').neighborhood('edge').style({
                                'line-style': 'solid',
                                'display': 'none'
                            });
                        });
                    },
                    unregister: function() {
                        events.removeAll();
                    }
                }];
                $scope.$watch("vm.optInteractiveMode", function(next, prev) {
                    prev.unregister();
                    next.register();
                });
                return states;
            };

            // Node Color Options
            var optNodeColorsFactory = function(chart, vm, osApi) {
                var fn = function(item) {
                    chart.$('node[nodeType="patient"]').style({
                        'background-color': 'rgb(19, 150, 222)'
                    });
                    osApi.getSampleCategorization(item.name).then(function(response) {
                        vm.legandNodes = response.payload.tbl.map(function(e) {
                            return e[0] + "|" + e[1];
                        }).filter(function(v, i, s) {
                            return s.indexOf(v) === i;
                        }).map(function(e) {
                            var p = e.split("|");
                            return {
                                'name': p[0],
                                'color': p[1]
                            }
                        });
                        chart.$('node[nodeType="patient"]').forEach(function(ele) {
                            var id = ele.data().id;
                            for (var i = 0; i < this.rownames.length; i++) {
                                if (id === this.rownames[i]) {
                                    ele.style({
                                        'background-color': this.tbl[i][1]
                                    });
                                    break;
                                }
                            }
                        }, response.payload);
                    });
                }
                osApi.getSampleCategorizationNames().then(function(response) {
                    vm.optNodeColors = vm.optNodeColors.concat(response.payload
                        .map(function(item) {
                            return {
                                'name': item,
                                fn: fn
                            }
                        }));
                });

                vm.legandNodes = [{
                    name: 'Patients',
                    color: '#3993fa'
                }];
                var value = [{
                    name: 'Default',
                    fn: function() {
                        vm.legandNodes = [{
                            name: 'Patients',
                            color: '#3993fa'
                        }];
                        chart.$('node[nodeType="patient"]').style({
                            'background-color': 'rgb(19, 150, 222)'
                        });
                    }
                }, {
                    name: 'Gender',
                    fn: function() {
                        vm.legandNodes = [{
                            name: 'Male',
                            color: 'blue'
                        }, {
                            name: 'Female',
                            color: 'pink'
                        }];
                        chart.$('node[nodeType="patient"]').forEach(function(ele) {
                            if (ele.data().patient) {
                                ele.style({
                                    'background-color': (ele.data().patient[2] === 'male') ? 'rgb(5, 108, 225)' : (ele.data().patient[2] === 'female') ? 'pink' : 'black'
                                });
                            }
                        });
                    }
                }, {
                    name: 'Age At Diagnosis',
                    fn: function() {
                        vm.legandNodes = [{
                            name: 'Young',
                            color: 'green'
                        }, {
                            name: 'Old',
                            color: 'red'
                        }];
                        chart.$('node[nodeType="patient"]').forEach(function(ele) {
                            if (ele.data().patient) {
                                var age = ele.data().patient[4];
                                ele.style({
                                    'background-color': 'rgb(' + ((255 * age) / 100) + ',' + ((255 * (100 - age)) / 100) + ',0)'
                                });
                            }
                        });
                    }
                }];
                vm.optNodeColor = value[0]
                return value;
            };

            // Edge Color Options
            var optEdgeColorsFactory = function(chart) {
                var fn = function(edgeColor) {
                    var el = angular.element("." + edgeColor.class);
                    switch (edgeColor.state) {
                        case 'Visible':
                            edgeColor.state = 'Highlight';
                            el.css("border-color", edgeColor.color);
                            chart.$('edge[edgeType="' + edgeColor.name + '"]').style({
                                'line-color': edgeColor.color,
                                'width': '5px'
                            });
                            break;
                        case 'Hidden':
                            edgeColor.state = 'Visible';
                            el.css("border-color", color.gray);
                            chart.$('edge[edgeType="' + edgeColor.name + '"]').style({
                                'line-color': '#CCC',
                                'width': '5px'
                            });
                            break;
                        default:
                            edgeColor.state = 'Hidden';
                            el.css("border-color", color.white);
                            chart.$('edge[edgeType="' + edgeColor.name + '"]').style({
                                'width': '0px'
                            });
                            break;
                    }
                };
                var value = [{
                    name: 'mutation',
                    class: 'edgeMutation',
                    color: '#004358',
                    state: 'Highlight',
                    fn: fn
                }, {
                    name: 'cnGain.1',
                    class: 'edgeCnGain1',
                    color: '#1F8A70',
                    state: 'Highlight',
                    fn: fn
                }, {
                    name: 'cnLoss.1',
                    class: 'edgeCnLoss1',
                    color: '#BEDB39',
                    state: 'Highlight',
                    fn: fn
                }, {
                    name: 'cnGain.2',
                    class: 'edgeCnGain2',
                    color: '#FFE11A',
                    state: 'Highlight',
                    fn: fn

                }, {
                    name: 'cnLoss.2',
                    class: 'edgeCnLoss2',
                    color: '#FD7400',
                    state: 'Highlight',
                    fn: fn
                }];
                $timeout(function() {
                    value.forEach(function(item) {
                        angular.element("." + item.class).css("border-color", item.color);
                        chart.$('edge[edgeType="' + item.name + '"]').style({
                            'line-color': item.color,
                            'width': '5px'
                        });
                    });
                });
                return value;
            };

            // Patient Layouts
            var optPatientLayoutsFatory = function(chart, vm) {
                var value = [{
                    name: 'Hobo',
                    fn: function(item) {
                        vm.optPatientLayout = item;
                        chart.$('node[nodeType="patient"]').forEach(function(item) {
                            item.position(item.data().pos);
                        });
                    }
                }, {
                    name: 'Age At Diagnosis',
                    fn: function(item) {
                        vm.optPatientLayout = item;
                        chart.$('node[nodeType="patient"]').forEach(function(item) {
                            if (item.data().patient) {
                                item.position({
                                    x: 500,
                                    y: (item.data().patient[4] * 60) - 3000
                                });
                            }
                        });

                    }
                }, {
                    name: 'Gender',
                    fn: function(item) {
                        vm.optPatientLayout = item;
                        var xMale = 1000;
                        var xFemale = 1000;
                        chart.$('node[nodeType="patient"]').forEach(function(item) {
                            if (item.data().patient) {
                                if (item.data().patient[2].toLowerCase() == 'male') {
                                    item.position({
                                        x: xMale -= 50,
                                        y: 500
                                    });
                                } else {
                                    item.position({
                                        x: xFemale -= 50,
                                        y: -500
                                    });
                                }
                            }
                        });
                    }
                }];
                vm.optPatientLayout = value[0];
                return value;
            };

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || 'DEMOdz';
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

            // VM Event Handlers
            vm.toggleFilter = function() {
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }

            // Elements
            var elChart = angular.element("#markers-chart");
            var chart;

            // Initialize
            var data = {
                patient: null,
                markers: null
            }
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    data.patient = response.payload;
                    osApi.getMarkersNetwork(response.payload).then(function(response) {
                        data.markers = angular.fromJson(response.payload);
                        data.markers.elements.nodes
                            .filter(function(item) {
                                return item.data.nodeType === 'patient';
                            })
                            .map(function(value) {

                                // Save Positions Of Hobo + associate With Patient Table
                                value.data.pos = {
                                    x: value.position.x,
                                    y: value.position.y
                                };
                                value.data.patient = data.patient.tbl.filter(function(item) {
                                    return item[0] === value.data.id;
                                })[0];
                            });

                        // Initalize CytoScape
                        chart = cytoscape({
                            container: elChart,
                            elements: data.markers.elements,
                            style: styles,
                            layout: {
                                name: "preset",
                                fit: true
                            }
                        });

                        // Opt Edge Colors
                        vm.optPatientLayouts = optPatientLayoutsFatory(chart, vm);
                        vm.optEdgeColors = optEdgeColorsFactory(chart, vm, $timeout);
                        vm.optNodeColors = optNodeColorsFactory(chart, vm, osApi);
                        vm.optInteractiveModes = optInteractiveModesFactory(chart, vm, $scope);
                        vm.optInteractiveMode = vm.optInteractiveModes[0];
                        osApi.setBusy(false);
                    });
                });
            });
        }
    }
})();
