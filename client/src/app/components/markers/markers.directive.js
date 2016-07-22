(function() {
    //'use strict';

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
        function MarkersController(osApi, osCohortService, $state, $timeout, $scope, $stateParams, cytoscape, signals, moment, $window, _, $q) {

            osApi.setBusy(true);

            var tmpdata, patientHtml, geneHtml;

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
            })()

            /*
             *  Cytoscape Chart
             *  + Node & Edge Styles
             */
            var elChart = angular.element("#markers-chart");
            var cyChart = (function(elChart) {
                return cytoscape({
                    container: elChart,
                    style: [{
                        selector: 'core',
                        style: {
                            'selection-box-color': '#3993fa',
                            'selection-box-border-color': '#3993fa',
                            'selection-box-border-width': '1px',
                            'selection-box-opacity': '.2'
                        }
                    }, {
                        selector: 'node',
                        style: {
                            'background-color': "#3993fa",
                            'display': "data(display)",
                            //'height': "mapData(sizeEle, 0, 50, 10, 100)",
                            //'width': "mapData(sizeEle, 0, 50, 10, 100)",
                            'width': 'data(sizeEle)',
                            'height': 'data(sizeEle)',
                            'border-width': 'data(sizeBdr)',
                            'font-size': 'data(sizeLbl)',
                            'text-valign': 'center'
                        }
                    }, {
                        selector: 'node[nodeType="telomere"]',
                        style: {
                            'background-color': "#3993fa",
                        }
                    }, {
                        selector: 'node[nodeType="patient"]',
                        style: {
                            'background-color': 'data(color)',
                            'text-halign': 'center',
                            'border-color': '#FFFFFF'
                        }
                    }, {
                        selector: 'node[nodeType="patient"]:selected',
                        style: {
                            'border-color': "#000",
                            'border-width': 50
                        }
                    }, {
                        selector: 'node[nodeType="gene"]',
                        style: {
                            'background-color': "#FFFFFF",
                            'border-color': "#38347b",
                            'text-halign': "right",
                            'label': "data(id)"
                        }
                    }, {
                        selector: 'node[nodeType="gene"]:selected',
                        style: {
                            'border-color': "#FF0000",
                            //'background-opacity': '.2'
                        }
                    }, {
                        selector: 'node[nodeType="centromere"]',
                        style: {
                            'font-size': '200px',
                            'text-halign': 'center',
                            'background-color': "#3993fa",
                            'color': "#FFFFFF",
                            'border-color': 'rgb(19, 150, 222)',
                            'height': '400px',
                            'width': '400px',
                            'shape': 'round',
                            'label': "  data(id)"
                        }
                    }, {
                        selector: 'edge',
                        style: {
                            'display': "data(display)",
                            'line-color': "data(color)",
                            'width': "data(sizeEle)"
                        }
                    },{
                        selector: 'node[nodeType="annotation-text"]',
                        style: {
                            'font-size': '400px',
                            'text-halign': 'right',
                            'text-valign': 'bottom',
                            'background-color': "#FFF",
                            'color': "#000",
                            'border-color': '#FFF',
                            'height': '0px',
                            'width': '0px',
                            'shape': 'round',
                            'label': "data(label)",
                            'text-transform':'uppercase'
                        }
                    }],
                    hideEdgesOnViewport: false,
                    hideLabelsOnViewport: true,
                    textureOnViewport: false,
                    //motionBlur: true,
                    //motionBlurOpacity: 0.2,
                    zoom: 0.01,
                    pan: {
                        x: 550,
                        y: 160
                    },
                    //minZoom: .0005,
                    //maxZoom: 2,
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
                                color: "#3993fa",
                                id: "ce" + key, // Chromosome Edge (CE)
                                display: "element",
                                edgeType: "chromosome",
                                sizeBdr: 0,
                                sizeEle: 60, // Style?
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
                                sizeBdr: 50,
                                sizeEle: 50,
                                sizeLbl: 6,
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
                                sizeBdr: 50,
                                sizeEle: 50,
                                sizeLbl: 50,
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
                                sizeBdr: 50,
                                nodeType: "centromere",
                                degree: 1
                            }
                        });

                    }, {
                        chromosomes: chromosomes,
                        elements: elements
                    });
                    cyChart.add(elements);

                    // Select All Genes By Clicking Centromere
                    // cyChart.$('node[nodeType="centromere"]').on("click", function(e){
                    //     var posX = e.cyTarget.position().x;
                    //     cyChart.startBatch();
                    //     cyChart.$('node[nodeType="gene"]').filter(function(p){  
                    //         debugger;
                    //         return p.position().x==this; }, posX)
                    //         .forEach( function(ele){
                    //             ele.select();
                    //         });
                    //     cyChart.endBatch();
                    // });
                });
            })()

            /*
             * View Model + Initial Data Load 
             * + Initial Data Load
             * + View Port Resize Event
             */
            var vm = (function(vm, osApi) {
                vm.showPopupSelection = false;
                vm.datasource = osApi.getDataSource();
                vm.detail = {
                    show: false,
                    html: "",
                    title: ""
                };
                vm.optGeneSets = [];
                vm.optGeneSet;
                vm.optPatientLayouts = [];
                vm.optPatientLayout;
                // vm.optDatasets = [];
                // vm.optDataset;
                vm.search = "";
                vm.optPatientColors = [];
                vm.optPatientColor;

                vm.optCommandModes = [{
                    name: 'Sequential'
                }, {
                    name: 'Set'
                }, {
                    name: 'Ad Hoc'
                }];
                vm.optCommandMode = vm.optCommandModes[0];

                vm.selectColor = function(item) {

                };
                vm.patientSelect = function(item){
                    var c = cyChart.$('node[color="'+item.color+'"]');
                    var nodes = cyChart.$('node[nodeType="patient"]');
                    //
                    console.log("SE");
                    console.log(item);
                };
                vm.patientUnselect = function(item){
                    console.log("UN");
                    console.log(item);
                };

                vm.filterModelEdge = function() {

                    angular.element('#modalEdge').modal('hide');
                    var vals = vm.optEdgeColors
                        .filter(function(c) {
                            return c.show;
                        })
                        .map(function(c) {
                            return c.id
                        });
                    var edges = tmpdata.edges.filter(function(edge) {
                        return (vals.indexOf(edge.data.cn) != -1);
                    }, {
                        vals: vals
                    });

                    cyChart.startBatch();
                    var elements = cyChart.add(edges);
                    cyChart.endBatch();
                    tmpdata = null;

                };

                vm.edgeToggle = function(item) {
                    if (!item.show) {
                        cyChart.remove('edge[cn=' + item.id + ']');
                    }

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


                    //         break;
                    //     case "genes":
                    //         break;
                    // }
                };

                vm.optEdgeColors = [{
                    name: 'mutation',
                    abv: 'm',
                    show: true,
                    color: '#004358',
                    class: 'switch-mutation',
                    id: 0
                }, {
                    name: 'cnGain.1',
                    abv: 'cnG1',
                    show: true,
                    color: '#1F8A70',
                    class: 'switch-cnG1',
                    id: 1
                }, {
                    name: 'cnLoss.1',
                    abv: 'cnL1',
                    show: true,
                    color: '#FFE11A',
                    class: 'switch-cnL1',
                    id: -1
                }, {
                    name: 'cnGain.2',
                    abv: 'cnG2',
                    show: true,
                    color: '#BEDB39',
                    class: 'switch-cnG2',
                    id: 2
                }, {
                    name: 'cnLoss.2',
                    abv: 'cnL2',
                    show: true,
                    color: '#FD7400',
                    class: 'switch-cnL2',
                    id: -2
                }];

                $q.all([
                    osApi.query("render_chromosome", {
                        type: 'geneset',
                        $fields: ['name']
                    }),
                    osApi.query("render_patient", {
                        type: 'cluster',
                        $fields: ['name']
                    }),
                    osApi.query("render_patient", {
                        type: 'color',
                        $fields: ['name']
                    })
                ]).then(function(results) {
                    vm.optGeneSets = results[0].data;
                    vm.optGeneSet = vm.optGeneSets[0];
                    vm.optPatientLayouts = results[1].data;
                    vm.optPatientLayout = vm.optPatientLayouts[0]
                    vm.optPatientColors = [{
                        'name': 'Default'
                    }].concat(results[2].data);
                    vm.optPatientColor = vm.optPatientColors[0];
                });
                vm.resize = function() {
                    var width = $window.innerWidth;
                    if (angular.element(".tray").attr("locked") == "true") width -= 300;
                    elChart.width(width);
                    elChart.height($window.innerHeight - 90);
                    cyChart.resize();
                }
                angular.element($window).bind('resize',
                    _.debounce(vm.resize, 300)
                );


                return vm;
            })(this, osApi);

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
                    cyChart.fit(cyChart.$(':selected'), 50)
                };
                vm.zoom = {
                    reset: reset,
                    fit: fit
                };


                cyChart.on('pan', _.debounce(function(e) {
                    cyChart.startBatch();
                    resizeNodes();
                    cyChart.endBatch();
                }, 50));

                return vm.zoom;
            })(cyChart, vm);

            var resizeNodes = function() {
                    var zoom = (1 / cyChart.zoom()) / 100;
                    if (zoom < .02) zoom = .02;
                    var sizeBdr = 50 * zoom;
                    var sizeLbl = 500 * (zoom * 2);
                    var sizeLbl = (sizeLbl > 500) ? 0 : sizeLbl;

                    cyChart.$('node[nodeType="patient"],node[nodeType="gene"]').forEach(function(node) {
                        node.data({
                            'sizeEle': node.data().weight * this.zoom,
                            sizeLbl: this.sizeLbl,
                            sizeBdr: this.sizeBdr
                        });
                    }, {
                        zoom: zoom,
                        sizeBdr: sizeBdr,
                        sizeLbl: sizeLbl
                    });
                }
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
                var worker = new Worker("app/components/markers/markers.worker.js");
                worker.addEventListener('message', function(msg) {
                    cmd[msg.data.cmd](msg.data.data);
                }, false);


                var remove = function(selector, data) {
                    if (angular.isUndefined(data)) {
                        cyChart.remove(selector);
                        return;
                    }
                    try {
                        var items = data.map(function(item) {
                            return this.getElementById(item);
                        }, cyChart);
                        cyChart.collection(items).remove();
                    } catch (e) {}
                };
                cmd.patients_html = function(data) {
                    patientHtml = data;
                    console.log("PATIENTS HTML");
                };
                cmd.patients_resize = function(data) {
                    console.log("PATIENTS RESIZE");
                };
                cmd.patients_delete = function(data) {
                    console.log("PATIENTS DELETE");
                    remove('node[nodeType="patient"]', data);
                };
                cmd.patients_insert = function(data) {
                    console.log("PATIENTS INSERT");
                    cyChart.startBatch();
                    var signals = signal.patients;
                    var elements = cyChart.add(data.patients);
                    elements.on("select", _.debounce(signals.select.dispatch, 300));
                    elements.on("unselect", _.debounce(signals.unselect.dispatch, 300));
                    elements.on("mouseover", signals.over.dispatch);
                    elements.on("mouseout", signals.out.dispatch);
                    elements.forEach(function(node) {
                        try {
                            node.data({
                                'weight': data.degrees[node.id()].weight
                            });

                        } catch (e) {
                            node.data({
                                'weight': 100
                            });
                        }
                    });
                    resizeNodes();
                    cyChart.endBatch();
                    vm.resize();

                };
                cmd.patients_color = function(data) {
                    console.log("PATIENTS COLOR");
                    cyChart.startBatch();
                    cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                        node.data('color', data[node.id()].color);
                    });
                    cyChart.endBatch();
                };
                cmd.patients_layout = function(data) {

                    cyChart.startBatch();
                    cyChart.$("node[nodeType='annotation-text']").remove();
                    if (data.annotation){
                        cyChart.add(data.annotation);
                    }
                    
                    cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                        try {
                            var pos = data.data[node.id()];
                            pos.x -= 40000;
                            node.position(pos);
                        } catch (e) {}
                    });
                    resizeNodes();
                    cyChart.endBatch();
                };
                cmd.patients_legend = function(data) {
                    console.log("PATIENTS LEGEND");
                    $scope.$apply(function() {
                        vm.legendNodes = data;
                    });
                };
                cmd.genes_html = function(data) {
                    geneHtml = data;
                    console.log("GENES HTML");
                };
                cmd.genes_delete = function(data) {
                    console.log("GENES DELETE");
                    remove('node[nodeType="gene"]', data);
                };
                cmd.genes_insert = function(data) {
                    console.log("GENES INSERT");
                    cyChart.startBatch();
                    var signals = signal.genes;
                    var elements = cyChart.add(data.genes);
                    elements.on("select", _.debounce(signals.select.dispatch, 300));
                    elements.on("unselect", _.debounce(signals.unselect.dispatch, 300));
                    elements.on("mouseover", signals.over.dispatch);
                    elements.on("mouseout", signals.out.dispatch);
                    elements.forEach(function(node) {
                        try {
                            node.data({
                                'weight': data.degrees[node.id()].weight
                            });

                        } catch (e) {
                            node.data({
                                'weight': 500
                            });
                        }
                    });
                    cyChart.endBatch();
                    osApi.setBusy(false);
                };
                cmd.genes_update = function(data) {
                    console.log("GENES UPDATE");
                    update(data);
                };
                cmd.edges_delete = function(data) {
                    console.log("EDGES DELETE");
                    remove('edge[edgeType="cn"]', data);
                };
                cmd.edges_insert = function(data) {
                    console.log("EDGES INSERT");
                    tmpdata = data;
                    if (data.counts.total > 5000) {
                        angular.element('#modalEdge').modal();
                        $scope.$apply(function() {
                            vm.edgeCounts = data.counts;
                        });
                        return;
                    }
                    cyChart.startBatch();
                    if (vm.optCommandMode.name == "Ad Hoc") cyChart.$('edge[edgeType="cn"]').remove();
                    var elements = cyChart.add(data.edges);
                    cyChart.endBatch();
                };
                cmd.edges_update = function(data) {
                    console.log("EDGES UPDATE")
                    update(data);
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
                    var opts = {
                        mode: vm.optCommandMode.name,
                        cmd: cmd,
                        patients: {
                            data: vm.datasource.collections.pt,
                            layout: vm.optPatientLayout.name,
                            color: vm.optPatientColor.name,
                            selected: cyChart.$('node[nodeType="patient"]:selected').map(function(p) {
                                return p.data().id
                            })
                        },
                        genes: {
                            layout: vm.optGeneSet.name,
                            selected: cyChart.$('node[nodeType="gene"]:selected').map(function(p) {
                                return p.data().id
                            })
                        },
                        edges: {
                            layout: vm.datasource.edges
                                .filter(function(v) {
                                    return (v.name == this)
                                }, geneset)[0],
                            colors: vm.optEdgeColors
                                .filter(function(f) {
                                    return f.show
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
                }
            })(cyChart, vm)


            vm.cmd = function() {}


            /*
             *  Watch View Model
             *  + vm.optGeneSet
             *  + vm.optPatientLayout
             */

            var watch = (function(vm, $scope) {
                var watches = 1;

                // GeneSet
                watches += 1;
                $scope.$watch('vm.optGeneSet', function() {
                    if (watches > 0) {
                        watches -= 1;
                        return;
                    }
                    if (angular.isUndefined(vm.optGeneSet) || angular.isUndefined(vm.optPatientColor) || angular.isUndefined(vm.optPatientLayout)) return;
                    osApi.setBusy(true);
                    cyChart.$('edge[edgeType="cn"]').remove();
                    setOptions(createOptions());

                });

                // Patient Color
                watches += 1;
                $scope.$watch('vm.optPatientColor', function() {
                    if (watches > 0) {
                        watches -= 1;
                        return;
                    }
                    setOptions(createOptions());
                });

                // Patient Layout
                watches += 1;
                $scope.$watch('vm.optPatientLayout', function() {
                    if (watches > 0) {
                        watches -= 1;
                        return;
                    }
                    setOptions(createOptions());
                });

                // Search
                watches += 1;
                $scope.$watch('vm.search', _.debounce(function() {
                    if (watches > 0) {
                        watches -= 1;
                        return;
                    }
                    var needle = vm.search.toUpperCase().trim();
                    cyChart.$('node').unselect();
                    if (needle.length > 0) cyChart.$('node').filter(function(i, ele) {
                        return (ele.id().toUpperCase().indexOf(needle) == 0);
                    }).select();
                }, 600))

                // Edge Colors
                watches += 1;
                $scope.$watch('vm.optEdgeColors.color', function() {
                    if (watches > 0) {
                        watches -= 1;
                        return;
                    }
                    setOptions(createOptions());
                    vm.resize()
                });

            })(vm, $scope);

            //var elLegendHtml = $("#cohortmenu-legand");
            function setPatientInfo(e) {
                $scope.$apply(function() {
                    if (e.type == "mouseout") {
                        $("#cohortmenu-legand").html("Seletion ...");
                        
                    } else {
                        $("#cohortmenu-legand").html(e.cyTarget.id() + patientHtml[e.cyTarget.id()]);
                    }
                });
            };
            function setGeneInfo(e) {
                console.log("genes");
            };

            var setPatientCohortUpdate = true;
            osCohortService.onPatientsSelect.add(function(patients){
                if (setPatientCohortUpdate){
                    cyChart.startBatch();
                    cyChart.$('node[nodeType="patient"]:selected').deselect();
                    cyChart.$('node[nodeType="patient"]').forEach(function(node){
                        if (patients.ids.indexOf(node.id())!=-1) node.select();
                    });
                    cyChart.endBatch();
                }
                setPatientCohortUpdate = true;
            });
            function setPatientCohort(opts){
                setPatientCohortUpdate = false;
                osCohortService.setPatientCohort(
                    cyChart.$('node[nodeType="patient"]:selected').map(function(p) { return p.data().id }),
                    "Markers + Patients"
                );
            };


            function setGeneCohort(opts){
                osCohortService.setPatientCohort(
                    cyChart.$('node[nodeType="gene"]:selected').map(function(p) { return p.data().id }),
                    "Markers + Patients"
                );
            };


            // Initialize Commands
            $scope.$watch("vm.optCommandMode", function() {
                signal.clear();
                cyChart.$('node').unselect();
                cyChart.$('edge[edgeType="cn"]').remove();
                switch (vm.optCommandMode.name) {
                    case "Sequential":
                        //try{ cyChart.$('node').unselect(); setOptions(createOptions()); }catch(e){}
                        vm.cmd = function(cmd) {
                            switch (cmd) {
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
                                    var opts = createOptions(cmd);
                                    setOptions(opts);
                                    break;
                            }
                        };
                        signal.genes.over.add(setGeneInfo);
                        signal.genes.over.add(setGeneInfo);
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
                        signal.genes.over.add(setGeneInfo);
                        signal.genes.over.add(setGeneInfo);
                        signal.patients.over.add(setPatientInfo);
                        signal.patients.out.add(setPatientInfo);
                        signal.patients.select.add(patientsSelect);
                        signal.patients.unselect.add(patientsUnselect);
                        signal.genes.select.add(genesSelect);
                        signal.genes.unselect.add(genesUnselect);
                        break;

                    case "Ad Hoc":
                        var over = function(e) {
                            setPatientInfo(e)
                            e.cyTarget.select();
                            setOptions(createOptions());
                        }
                        var out = function(e) {
                            setPatientInfo(e)
                            e.cyTarget.unselect();
                            //cyChart.$('edge[edgeType="cn"]').remove();
                        }
                        signal.genes.over.add(setGeneInfo);
                        signal.genes.over.add(setGeneInfo);
                        signal.patients.over.add(over);
                        signal.patients.out.add(out);
                        signal.genes.over.add(over);
                        signal.genes.out.add(out);
                        break;
                }
            });
        }
    }
})();
