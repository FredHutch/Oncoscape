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
        function MarkersController(osApi, d3, osCohortService, $state, $timeout, $scope, $stateParams, cytoscape, signals, moment, $window, _, $q) {

            osApi.setBusy(true);

            var tmpdata, patientHtml, worker;
            
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
                            'background-color': "#3993fa"
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
                            //'border-width': 50
                        }
                    }, {
                        selector: 'node[nodeType="gene"]',
                        style: {
                            'background-color': "data(color)",
                            'border-color': "data(colorBdr)",
                            'text-halign': "right",
                            'text-margin-x': 5,
                            'color' : '#000',
                            'label': "data(id)",
                            'border-width': "data(sizeBdr)"
                        }
                    }, {
                        selector: 'node[nodeType="gene"]:selected',
                        style: {
                            'border-color': "#FF0000"
                            //'background-opacity': '.2'
                        }
                    }, {
                        selector: 'node[nodeType="centromere"]',
                        style: {
                            'font-size': '20px',
                            'text-halign': 'center',
                            'background-color': "#3993fa",
                            'color': "#FFFFFF",
                            'border-color': 'rgb(19, 150, 222)',
                            'height': '40px',
                            'width': '40px',
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
                    zoom: 0.08,
                    pan: {
                        x: 650,
                        y: 160
                    },
                    //minZoom: .0005,
                    //maxZoom: 1,
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
                vm.showPanelLayout = false;
                vm.showPanelColor = false;
                vm.showPanelColorRna = false;
                vm.search = "";

                vm.optCommandModes = [{
                    name: 'Sequential'
                }, {
                    name: 'Set'
                }, {
                    name: 'Ad Hoc'
                }];
                vm.optCommandMode = vm.optCommandModes[0];

                

                vm.hideModal = function(){
                    angular.element('#modalEdge').modal('hide');
                }
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
                };

                vm.optEdgeColors = [{
                    name: 'mutation',
                    abv: 'm',
                    show: true,
                    color: '#004358',
                    class: 'switch-mutation',
                    count: '',
                    id: 0
                }, {
                    name: 'cnGain.1',
                    abv: 'cnG1',
                    show: true,
                    color: '#1F8A70',
                    class: 'switch-cnG1',
                    count: '',
                    id: 1
                }, {
                    name: 'cnLoss.1',
                    abv: 'cnL1',
                    show: true,
                    color: '#800080', 
                    class: 'switch-cnL1',
                    count: '',
                    id: -1
                }, {
                    name: 'cnGain.2',
                    abv: 'cnG2',
                    show: true,
                    color: '#BEDB39',
                    class: 'switch-cnG2',
                    count: '',
                    id: 2
                }, {
                    name: 'cnLoss.2',
                    abv: 'cnL2',
                    show: true,
                    color: '#FD7400',
                    class: 'switch-cnL2',
                    count: '',
                    id: -2
                }];

                $q.all([
                    osApi.query("render_chromosome", {
                        type: 'geneset',
                        $fields: ['name']
                    }),
                    osApi.query("render_patient", {
                        type: 'cluster',
                        dataset: osApi.getDataSource().disease,
                        $fields: ['name']
                    }),
                    osApi.query("render_patient", {
                        type: 'color',
                        dataset: osApi.getDataSource().disease,
                        $fields: ['name']
                    })
                ]).then(function(results) {

                    vm.optGeneSets = results[0].data;
                    vm.optGeneSet = vm.optGeneSets[0];
                    vm.optPatientLayouts = results[1].data;
                    vm.optPatientLayout = vm.optPatientLayouts[0]
                });
                vm.resize = function() {
                    var width = $window.innerWidth;
                //    if (angular.element(".tray").attr("locked") == "true") width -= 300;
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

            

            var borderScale = d3.scale.log().domain([.005, 20]).range([5,1])
            var nodeScale   = d3.scale.log().domain([.005, 20]).range([80,1]);
            var labelScale  = d3.scale.log().domain([.005, 20]).range([50,1]);
            var expressionScale = d3.scale.pow().range([.01,2]);
            var resizeNodes = function() {
                    expressionScale.domain(
                        cyChart.$('node[nodeType="patient"],node[nodeType="gene"]').toArray()
                            .reduce(function(p, c) {
                                var w = c.data().weight;
                                p[0] = Math.min(p[0], w);
                                p[1] = Math.max(p[1], w);
                                return p;
                            }, [Infinity, -Infinity])
                    );

                    var zoom = cyChart.zoom();
                    var sizeNode = nodeScale(zoom);
                    var sizeLbl  = (zoom<.375) ? 0 : labelScale(zoom);
                    var sizeBdr  = borderScale(zoom);
                        
                    

                    cyChart.$('node[nodeType="patient"],node[nodeType="gene"]').forEach(function(node) {
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
                worker = new Worker("app/components/markers/markers.worker.js");
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
                };
                cmd.patients_resize = function() {
                    
                };
                cmd.patients_delete = function(data) {
                    remove('node[nodeType="patient"]', data);
                };
                cmd.patients_insert = function(data) {
                    cyChart.startBatch();
                    var signals = signal.patients;
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
                                'weight': 100
                            });
                        }
                    });
                    resizeNodes();
                    cyChart.endBatch();
                    vm.resize();

                    // Initial Node Selection
                    var pc = osCohortService.getPatientCohort();
                    if (pc==null){
                        osCohortService.setPatientCohort([],"All Patients")
                    }else{
                        cyChart.startBatch();
                        cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                            if (pc.ids.indexOf(node.id())!=-1) node.select();
                        
                        },{pc:pc});
                        cyChart.endBatch();
                        vm.zoom.reset()
                        cyChart.zoom(cyChart.zoom()*.4);
                        cyChart.center();
                    }


                };
                cmd.patients_layout = function(data) {
                    cyChart.startBatch();
                    cyChart.$("node[nodeType='annotation-text'],edge[nodeType='annotation-line'],node[nodeType='annotation-point']").remove();
                    if (data.annotation){
                        cyChart.add(data.annotation);

                    }
                    cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                        try {
                            var pos = data.data[node.id()];
                            pos.x -= 4000;
                            node.position(pos);
                        } catch (e) {}
                    });
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
                    var signals = signal.genes;
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
                                'weight': 500
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

                    debugger;

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
                        
                        if (mouseIsOver=="patient"){

                            var geneColors = elements
                                .map(function(v) { return [v.data().source, v.data().color]; })
                                .reduce(function(p,c){ p[c[0]] = c[1]; return p;},{});
                            
                            cyChart.$('node[nodeType="gene"]')
                                .forEach(function(ele, i, eles){
                                    var id = ele.id();
                                    var selected = this.hasOwnProperty(id);
                                    ele.data("sizeBdr", (selected) ? 10 : 1);
                                    ele.data("colorBdr", (selected) ? this[id] : "#FFFFFF");
                                    ele.data("color", (selected) ? this[id] : "#0096d5");
                                    
                                },geneColors);
                        }
                    
                        cyChart.endBatch();
                     

                    }
                    else{
                        cyChart.startBatch();
                        cyChart.add(data.edges);
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
                    var edges = osApi.getDataSource().edges.filter(function(f){
                        return f.name==this.geneset
                    }, {geneset:geneset})[0];
                   
                    var opts = {
                        mode: vm.optCommandMode.name,
                        cmd: cmd,
                        dataset: osApi.getDataSource().disease,
                        patients: {
                            data: vm.datasource.collections.patient,
                            layout: vm.optPatientLayout.name,
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
                            patientWeights: edges.patientWeights,
                            geneWeights: edges.genesWeights,
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
                watches += 0;
                $scope.$watch('vm.optGeneSet', function() {
                    if (watches > 0) {
                        watches -= 1;
                        return;
                    }
                    if (angular.isUndefined(vm.optGeneSet) || angular.isUndefined(vm.optPatientLayout)) return;
                    osApi.setBusy(true);
                    cyChart.$('edge[edgeType="cn"]').remove();
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

            var mouseIsOver = "";
            var updatePatientCounts = function(){

                $(".legend-count").text("");
                var selectedPatients = cyChart.$('node[nodeType="patient"]:selected').toArray();
                if (selectedPatients.length==0) selectedPatients = cyChart.$('node[nodeType="patient"]').toArray();

                var counts = selectedPatients.reduce(function(p,c){
                    var color = c.data().color;
                    if (!p.hasOwnProperty(color)) p[color] = 0;
                    p[color] += 1;
                    return p;
                },{});

                Object.keys(counts).forEach(function(key){
                    $("#legend-"+key.substr(1)).text(" ("+this[key]+")");                    
                },counts);

            }

            var setPatientInfo = function(e) {
                
                $scope.$apply(function() {
                    if (e.type == "mouseout") {
                        $("#cohortmenu-legand").html("");
                        
                    } else {
                        mouseIsOver = "patient";
                        $("#cohortmenu-legand").html(e.cyTarget.id() + patientHtml[e.cyTarget.id()]);
                    }
                });
            };
            var setGeneInfo = function(e) {
            
                $scope.$apply(function() {
                    if (e.type == "mouseout") {
                        $("#cohortmenu-legand").html("");
                    } else {
                        mouseIsOver = "gene";
                        $("#cohortmenu-legand").html(e.cyTarget.id());// + patientHtml[e.cyTarget.id()]);
                    }
                });
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
                        }
                        var out = function(e) {
                            e.cyTarget.unselect();
                            cyChart.startBatch();
                            cyChart.$('edge[edgeType="cn"]').remove();
                            cyChart.$('node[nodeType="gene"]')
                                .forEach(function(ele, i, eles){
                                    ele.data("color", "#0096d5");
                                    ele.data("sizeBdr", 1);
                                    ele.data("colorBdr", "#FFFFFF");
                                });
                            cyChart.endBatch();

                        }
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

            var onPatientColorChange = function(colors){

                vm.showPanelColor = false;
                vm.legendCaption = colors.name;
                vm.legendNodes = colors.data;

                if(colors.name=="None"){
                    vm.legendCaption = "";
                    cyChart.startBatch();
                    cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                        node.data('color', '#0096d5' )
                    });
                    cyChart.endBatch();

                    return;
                }

                var degMap =colors.data.reduce(function(p,c){
                    for (var i=0; i<c.values.length; i++){
                        p[c.values[i]] = c.color;
                    }
                    return p;
                },{});

                cyChart.startBatch();
                cyChart.nodes('node[nodeType="patient"]').forEach(function(node) {
                    if (degMap.hasOwnProperty(node.id())){
                        node.data('color', degMap[node.id()]);
                    }else{
                        node.data('color', '#DDD');
                    }
                    
                });
                cyChart.endBatch();
                $timeout( updatePatientCounts );
            }

            osCohortService.onPatientColorChange.add(onPatientColorChange);

            // Destroy
            $scope.$on('$destroy', function() {
                osCohortService.onPatientColorChange.remove(onPatientColorChange);
                worker.terminate();
                signal.clear();
            });
        }
    }
})();
