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
        function MarkersController(osApi, osHistory, $state, $timeout, $scope, $stateParams, cytoscape, signals, moment, $window, _, $q) {

            var signal = {
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
                }
            };

            signal.patients.over.add(function(){
                arguments[0].cyTarget.select();
            });
            signal.patients.out.add(function(){
                arguments[0].cyTarget.unselect();
            });
            signal.genes.over.add(function(){
                arguments[0].cyTarget.select();
            });
            signal.genes.out.add(function(){
                arguments[0].cyTarget.unselect();
            });

            signal.patients.select.add(function(){
                //vm.zoom.fit();
                //vm.showPopupSelection = true;
                vm.redraw();
            });
            signal.patients.unselect.add(function(){
                //vm.zoom.reset();
                //vm.showPopupSelection = false;
                vm.redraw();
            });

            signal.genes.select.add(function(){
                vm.redraw();
            });

            signal.genes.unselect.add(function(){
                vm.redraw();
            });


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
                            'display': "data(display)",
                            'height': "mapData(sizeEle, 0, 50, 10, 100)",
                            'width': "mapData(sizeEle, 0, 50, 10, 100)",
                            'font-size': 'data(sizeLbl)',
                            'text-valign': 'center'
                        }
                    }, {
                        selector: 'node[nodeType="patient"]',
                        style: {
                            'background-color': 'data(color)',
                            'text-halign': 'center',
                            'border-width': 500,
                            'width': '2500px',
                            'height': '2500px',
                            'border-color': '#FFFFFF'
                        }
                    }, {
                        selector: 'node[nodeType="patient"]:selected',
                        style: {
                            'border-color': "#FF0000",
                            'border-width': 300
                        }
                    }, {
                        selector: 'node[nodeType="gene"]',
                        style: {
                            'background-color': "#FFFFFF",
                            'border-color': "#38347b",
                            'text-halign': "right",
                            //'label': "data(id)",
                            'border-width': 'data(sizeBdr)',
                            'width': '2500px',
                            'height': '2500px'
                        }
                    }, {
                        selector: 'node[nodeType="gene"]:selected',
                        style: {
                            'border-color': "#FF0000",
                            'border-width': 300
                        }
                    }, {
                        selector: 'node[nodeType="centromere"]',
                        style: {
                            'font-size': '2000px',
                            'text-halign': 'center',
                            'background-color': "#3993fa",
                            'color': "#FFFFFF",
                            'border-color': 'rgb(19, 150, 222)',
                            'height': '2500px',
                            'width': '4000px',
                            'shape': 'roundrectangle',
                            'label': "  data(id)"
                        }
                    }, {
                        selector: 'edge',
                        style: {
                            'display': "data(display)",
                            'line-color': "data(color)",
                            'width': "data(sizeEle)"
                        }
                    }],
                    hideEdgesOnViewport: false,
                    hideLabelsOnViewport: true,
                    textureOnViewport: false,
                    motionBlur: false,
                    //motionBlurOpacity: 0.2,
                    zoom: 0.001,
                    pan: {x: 700, y: 160},
                    minZoom: .0001,
                    maxZoom: .05,
                    layout: {
                        name: "preset",
                        fit: true
                    }
                });
            })(elChart);

            /*
            *  Draw Chromosome
            */
            (function(){
                
                    osApi.query("_mp", {name:"chromosome"}).then(function(result){

                        // Process Chromosome
                        var chromosomes = result.data[0].data;
                        var elements = [];

                        Object.keys(chromosomes).forEach(function(key){
                            var chromosome = this.chromosomes[key][0];
                            this.elements.push(
                                {
                                    group: "edges",
                                    grabbable: false,
                                    locked: true,
                                    selectable: false,
                                    data:{
                                        color: "rgb(19, 150, 222)",
                                        id: "ce"+key,   // Chromosome Edge (CE)
                                        display: "element",
                                        edgeType:"chromosome",
                                        sizeEle: 500,  // Style?
                                        source : "cp"+key,  // Chromosome P (CP)
                                        target : "cq"+key   // Chromosome Q (CQ)
                                    }
                                });

                            // Telemere P
                            this.elements.push({
                                    group: "nodes",
                                    grabbable: false,
                                    locked: true,
                                    selectable: false,
                                    position:{
                                        x: chromosome.x,
                                        y: chromosome.p
                                    },
                                    data:{
                                        color:"rgb(19, 150, 222)",
                                        id:"cp"+key,
                                        display:"element",
                                        nodeType:"telomere",
                                        degree:1,
                                        sizeBdr:0,
                                        sizeEle:500,
                                        sizeLbl:12,
                                        subType: "unassigned"
                                    }
                                });
                            // Telemere Q
                            this.elements.push({
                                   group: "nodes",
                                    grabbable: false,
                                    locked: true,
                                    selectable: false,
                                    position:{
                                        x: chromosome.x,
                                        y: chromosome.q
                                    },
                                    data:{
                                        color:"rgb(19, 150, 222)",
                                        id:"cq"+key,
                                        display:"element",
                                        nodeType:"telomere",
                                        degree:1,
                                        sizeBdr:500,
                                        sizeEle:500,
                                        sizeLbl:500,
                                        subType: "unassigned"
                                    }
                                });
                            // Centromere Q
                            this.elements.push({
                                    group: "nodes",
                                    grabbable: false,
                                    locked: true,
                                    selectable: false,
                                    position:{
                                        x: chromosome.x,
                                        y: chromosome.c
                                    },
                                    data:{
                                        id:key,
                                        display:"element",
                                        nodeType:"centromere",
                                        degree:1
                                    }
                                });

                        }, {chromosomes:chromosomes, elements:elements});
                        cyChart.add(elements);
                    });
            })()

            /*
            * View Model + Initial Data Load 
            * + Initial Data Load
            * + View Port Resize Event
            */
            var vm = (function(vm, osApi){
                vm.showPopupSelection = false;
                vm.datasource = osApi.getDataSource();
                vm.optGeneSets = [];
                vm.optGeneSet;
                vm.optPatientLayouts = [];
                vm.optPatientLayout;
                vm.optDatasets = [];
                vm.optDataset;
                vm.search = "";
                vm.optPatientColors = [];
                vm.optPatientColor;

                vm.optCommandModes = [
                    {name: 'Classic'},
                    {name: 'Explore'},
                    {name: 'Select'}
                ];
                vm.optCommandMode = vm.optCommandModes[0];

                vm.optEdgeColors = [{ 
                    name: 'mutation',
                    highlight: '#004358',
                    color: '#004358',
                    id: 0
                }, {
                    name: 'cnGain.1',
                    highlight: '#1F8A70',
                    color: '#1F8A70',
                    id: 1
                }, {
                    name: 'cnLoss.1',
                    highlight: '#BEDB39',
                    color: '#BEDB39',
                    id: -1
                }, {
                    name: 'cnGain.2',
                    highlight: 'purple',
                    color: '#FFE11A',
                    id: 2
                }, {
                    name: 'cnLoss.2',
                    highlight: '#FD7400',
                    color: '#FD7400',
                    id: -2
                }];

                $q.all([
                    osApi.query("mp_genesets", { $fields:['name'] }),
                    osApi.query("mp_patient_layouts", { $fields:['layouts'] })
                ]).then(function(results){
                    vm.optGeneSets = results[0].data;
                    vm.optGeneSet = vm.optGeneSets[0];
                    vm.optPatientLayouts = results[1].data[0].layouts;
                    vm.optPatientLayout = vm.optPatientLayouts[2]
                    vm.optPatientColors = [
                        {'name':'Default', values:[{name:'Default', color:'#1396de'}]},
                        {'name':'Gender',  values:[{name:'Male', color:'#800080'}, {name:'female',color:'#008000'}]},
                        {'name':'Age', values:[{name:'Default', color:'#1396de'}]}
                    ];
                    vm.optPatientColor = vm.optPatientColors[0];
                });
                vm.resize = function(){
                    var width = $window.innerWidth;
                    if (angular.element(".tray").attr("locked")=="true") width -= 300;
                    elChart.width( width );
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
            var zoom = (function(cyChart,vm){
                var reset = function(){
                    cyChart.fit();
                    cyChart.center();
                };
                var fit = function(){
                    cyChart.fit( cyChart.$(':selected'), 50 )
                };
                vm.zoom = {reset:reset, fit:fit};
                return vm.zoom;
            })(cyChart,vm);

            /* 
            *  Interop Between UI and Worker Thread
            *  - setGeneSet(name:String)
            *  - setPatientLayout(name:String)
            *  - setDataSource(name:String)
            *  - setOptions(options:Object)
            */
            var setOptions = (function(cyChart, vm, osApi, $q, zoom, _, signal){

                // Instatiate Worker
                var cmd = {patients_delete:function(){}, patients_insert:function(){}, patients_update:function(){}};
                var worker = new Worker("app/components/markers/markers.worker.js");
                worker.addEventListener('message', function(msg) { cmd[msg.data.cmd](msg.data.data); }, false);
                
                // Helper Funtions
                var insert = function(data, signals){
                    cyChart.startBatch();
                    var elements = cyChart.add(data);
                    elements.on("select", _.debounce(signals.select.dispatch ,300));
                    elements.on("unselect", _.debounce(signals.unselect.dispatch ,300));
                    elements.on("mouseover", signals.over.dispatch);
                    elements.on("mouseout", signals.out.dispatch);
                    vm.resize();
                    cyChart.endBatch();
                };
                var update = function(data){
                    cyChart.batchData(data);
                };
                var remove = function(selector){
                    cyChart.remove(selector);
                };
            
                // Define Commands
                cmd.patients_delete = function()     { remove('node[nodeType="patient"]'); };
                cmd.patients_insert = function(data) { insert(data, signal.patients); };
                cmd.patients_update = function(data) { update(data); } ;
                cmd.genes_delete    = function()     { remove('node[nodeType="gene"]'); };
                cmd.genes_insert    = function(data) { insert(data, signal.genes); };
                cmd.genes_update    = function(data) { update(data); } ;
                cmd.edges_delete    = function()     { remove('edge[edgeType="cn"]'); };
                cmd.edges_insert    = function(data) { insert(data, signal.edges); };
                cmd.edges_update    = function(data) { update(data); };
 
                // Outbound
                return function(options) { 
                    worker.postMessage({cmd:"setOptions", data:options}); 
                };
            })(cyChart, vm, osApi, $q, zoom, _, signal);

            /* Options Factory */
            var createOptions = (function(cyChart, vm){

                return function(){

                    var geneset = vm.optGeneSet.name;

                    // !!! This needs to be queried - Do not have Datatable at this point
                    var edgeset = 'mp_edges';

                    return {
                        patients:{
                            data: vm.datasource.table.patient,
                            layout: vm.optPatientLayout.collection,
                            colors: vm.optPatientColor,
                            selected: cyChart.$('node[nodeType="patient"]:selected').map(function(p){ return p.data().id })
                        },
                        genes:{
                            layout: vm.optGeneSet.name,
                            selected: cyChart.$('node[nodeType="gene"]:selected').map(function(p){ return p.data().id })
                        },
                        edges:{
                            layout: edgeset,
                            colors: vm.optEdgeColors
                                .filter(function(f){return (f.color!='#ffffff') })
                                .map(function(f){ return {id:f.id, color:f.color}; })
                        }
                    };
                }
            })(cyChart, vm)


            vm.cmd = function(name){
                cyChart.startBatch();
                switch(name){
                    case "showAllNodes":
                        cyChart.$('node').style({display:'element'});
                        break;
                    case "hideAllEdges":
                        cyChart.$('edge[edgeType="cn"]').style({display:'none'});
                        break;
                    case "hideUnselectedNodes":
                        break;
                    case "invertAllNodes":{
                        cyChart.$('node').forEach( function(ele){
                            ele[ele._private.selected?"deselect":"select"]();
                        });
                    }
                }
                cyChart.endBatch();
            }

            /*
            * Redraw
            */
            vm.redraw = function(){
                console.log("REDRAW");
                setOptions(createOptions());
            }

            /*
            *  Watch View Model
            *  + vm.optGeneSet
            *  + vm.optPatientLayout
            */
            var watch = (function(vm, $scope){
                $scope.$watchGroup(['vm.optPatientColor','vm.optGeneSet','vm.optPatientLayout','vm.optEdgeColors.color'], function(){
                    try{
                        vm.redraw();
                    }catch(e){}
                });
            })(vm, $scope);
        }
    }
})();
