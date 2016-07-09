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

            osApi.setBusy(true);

            var signal = (function(){
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
                    clear: function(){
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
                            'background-opacity': '.2',
                            'border-color': "#38347b",
                            'text-halign': "right",
                            'label': "data(id)"
                        }
                    }, {
                        selector: 'node[nodeType="gene"]:selected',
                        style: {
                            'border-color': "#FF0000",
                            'background-opacity': '.2'
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
                    }],
                    hideEdgesOnViewport: false,
                    hideLabelsOnViewport: true,
                    textureOnViewport: false,
                    motionBlur: true,
                    //motionBlurOpacity: 0.2,
                    zoom: 0.01,
                    pan: {x: 550, y: 160},
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
            (function(){
                
                    osApi.query("render_chromosome", {type:"chromosome"}).then(function(result){

                        // Process Chromosome
                        var chromosomes = result.data[0].data;
                        var elements = [];

                        Object.keys(chromosomes).forEach(function(key){
                            var chromosome = this.chromosomes[key];
                            this.elements.push(
                                {
                                    group: "edges",
                                    grabbable: false,
                                    locked: true,
                                    selectable: false,
                                    data:{
                                        color: "#3993fa",
                                        id: "ce"+key,   // Chromosome Edge (CE)
                                        display: "element",
                                        edgeType:"chromosome",
                                        sizeBdr: 50,
                                        sizeEle: 50,  // Style?
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
                                        color:"#3993fa",
                                        id:"cp"+key,
                                        display:"element",
                                        nodeType:"telomere",
                                        degree:1,
                                        sizeBdr: 50,
                                        sizeEle:50,
                                        sizeLbl:6,
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
                                        sizeBdr:50,
                                        sizeEle:50,
                                        sizeLbl:50,
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
                                        sizeBdr: 50,
                                        nodeType:"centromere",
                                        degree:1
                                    }
                                });

                        }, {chromosomes:chromosomes, elements:elements});
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
            var vm = (function(vm, osApi){
                vm.showPopupSelection = false;
                vm.datasource = osApi.getDataSource();
                vm.optGeneSets = [];
                vm.optGeneSet;
                vm.optPatientLayouts = [];
                vm.optPatientLayout;
                // vm.optDatasets = [];
                // vm.optDataset;
                vm.search = "";
                vm.optPatientColors = [];
                vm.optPatientColor;

                vm.optCommandModes = [
                    {name: 'Sequential'},
                    {name: 'Set'},
                    {name: 'Ad Hoc'}
                ];
                vm.optCommandMode = vm.optCommandModes[0];

                vm.selectColor = function(item){

                };

                vm.deselectColor = function(item){
                    var color = item.color;
                    var nodes = cyChart.$('node[nodeType="patient"]:selected');
                    cyChart.startBatch();
                    nodes.forEach(function(node){
                        if (node.data().color == this){
                            node.unselect();
                        }
                    }, color);
                    cyChart.endBatch();
                };

                vm.lockPatients = false;
                vm.lockGenes = false;
                vm.lock = function(type){
                    switch  (type){
                        case "patient":
                            vm.lockPatients = !vm.lockPatients;
                            cyChart.startBatch();
                            cyChart.$('node[nodeType="patient"]')
                                .forEach(function(node){ 
                                    if (vm.lockPatients) node.unselectify();
                                    else node.selectify();
                                });
                            cyChart.endBatch();
                            break;
                        case "gene":
                            vm.lockGenes = !vm.lockGenes;
                            cyChart.startBatch();
                            cyChart.$('node[nodeType="cn"]')
                                .forEach(function(node){ 
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
                    osApi.query("render_chromosome", { type:'geneset', $fields:['name'] }),
                    osApi.query("render_patient",    { type:'cluster', $fields:['name'] }),
                    osApi.query("render_patient",    { type:'color', $fields:['name'] })
                ]).then(function(results){
                    vm.optGeneSets = results[0].data;
                    vm.optGeneSet = vm.optGeneSets[0];
                    vm.optPatientLayouts = results[1].data;
                    vm.optPatientLayout = vm.optPatientLayouts[0]
                    vm.optPatientColors = [{'name':'Default'}].concat(results[2].data);
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


                cyChart.on('pan', _.debounce(function(e) {
                    var zoom = (1/e.cy.zoom())/100;
                    
                    //if (zoom>1) zoom = 1;
                    if (zoom<.05) zoom = .05;
                    var degmap = {};
                    //var font = (zoom<.5) ? 1000 * zoom : 0;
                    var sizeBdr = 50 * zoom;

                    cyChart.$('node[nodeType="gene"], node[nodeType="patient"]').forEach(function(node){
                        this.degmap[node.id()] = {
                            sizeEle: (node.data().weight * this.zoom),

                            //sizeLbl: font,
                            sizeBdr: sizeBdr
                        };
                    }, { degmap:degmap, zoom:zoom, sizeBdr:sizeBdr });
                    cyChart.batchData(degmap);
                }, 200));

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
                var remove = function(selector, data){
                    if (angular.isUndefined(data)) { cyChart.remove(selector); return; }
                    try{
                        var items = data.map(function(item){ return this.getElementById(item); }, cyChart);
                        cyChart.collection(items).remove();
                    }catch(e){}
                };
            
                // Define Commands
                cmd.nodes_resize = function(data){
                    cyChart.batchData(data.patientEdgeDegrees);
                    cyChart.batchData(data.geneEdgeDegrees);
                    osApi.setBusy(false);
                };
                cmd.patients_delete = function(data) { remove('node[nodeType="patient"]', data); };
                cmd.patients_insert = function(data) { insert(data, signal.patients); };
                cmd.patients_update = function(data) { update(data); } ;
                cmd.patients_layout = function(data) {
                    var nodes = cyChart.nodes('node[nodeType="patient"]');
                    cyChart.startBatch();
                    nodes.forEach(function(node){
                        var pos = data[node.id()];
                        pos.x -= 40000;
                        node.position( pos );
                    });
                    cyChart.endBatch();
                };
                cmd.patients_legend = function(data) {
                    $scope.$apply(function(){ vm.legendNodes = data; });
                };
                cmd.genes_delete    = function(data) { remove('node[nodeType="gene"]', data); };
                cmd.genes_insert    = function(data) { insert(data, signal.genes); };
                cmd.genes_update    = function(data) { update(data); } ;
                cmd.edges_delete    = function(data) { remove('edge[edgeType="cn"]', data); };
                cmd.edges_insert    = function(data) { 

                    if (data.counts.total>10000){
                        // var r = confim("You selection will add "+data.counts.total+" edges.  Continue?");
                        // if (r==false) return;
                        console.log("Counts");
                    }
                    insert(data.edges, signal.edges); 
                };
                cmd.edges_update    = function(data) { update(data); };
 
                // Outbound
                return function(options) { 
                    worker.postMessage({cmd:"setOptions", data:options}); 
                };
            })(cyChart, vm, osApi, $q, zoom, _, signal);

            /* Options Factory */
            var createOptions = (function(cyChart, vm){

                return function(cmd){
                    cmd = cmd || "";
                    var geneset = vm.optGeneSet.name;
                    var opts = {
                        mode: vm.optCommandMode.name,
                        cmd: cmd,
                        patients:{
                            data: vm.datasource.collections.pt,
                            layout: vm.optPatientLayout.name,
                            color: vm.optPatientColor.name,
                            selected: cyChart.$('node[nodeType="patient"]:selected').map(function(p){ return p.data().id })
                        },
                        genes:{
                            layout: vm.optGeneSet.name,
                            selected: cyChart.$('node[nodeType="gene"]:selected').map(function(p){ return p.data().id })
                        },
                        edges:{
                            layout: vm.datasource.edges
                                .filter(function(v){ return (v.name==this)}, geneset)[0],
                            colors: vm.optEdgeColors
                                .filter(function(f){return (f.color!='#ffffff') })
                                .map(function(f){ return {id:f.id, color:f.color}; })
                        }
                    };
                    return opts;
                }
            })(cyChart, vm)


            vm.cmd = function(){}


            /*
            *  Watch View Model
            *  + vm.optGeneSet
            *  + vm.optPatientLayout
            */
            
            var watch = (function(vm, $scope){
                var watches = 1;

                // GeneSet
                watches += 1;
                $scope.$watch('vm.optGeneSet', function(){
                    if (watches>0) {watches -= 1; return; }
                    if ( angular.isUndefined(vm.optGeneSet) || angular.isUndefined(vm.optPatientColor) || angular.isUndefined(vm.optPatientLayout)) return;
                    cyChart.$('edge[edgeType="cn"]').remove();
                    setOptions(createOptions());
                    
                });

                // Patient Color
                watches += 1;
                $scope.$watch('vm.optPatientColor', function(){
                    if (watches>0) {watches -= 1; return; }
                    setOptions(createOptions());
                });

                // Patient Layout
                watches += 1;
                $scope.$watch('vm.optPatientLayout', function(){
                    if (watches>0) {watches -=1; return; }
                    setOptions(createOptions());
                });

                // Search
                watches += 1;
                $scope.$watch('vm.search', _.debounce(function(){
                    if (watches>0) {watches -= 1; return; }
                    var needle = vm.search.toUpperCase().trim();
                    cyChart.$('node').unselect();
                    if (needle.length>0) cyChart.$('node').filter( function(i,ele){ return (ele.id().toUpperCase().indexOf(needle)==0);} ).select();
                }, 600))

                // Edge Colors
                watches += 1;
                $scope.$watch('vm.optEdgeColors.color', function(){
                    if (watches>0) {watches -= 1; return; }
                    setOptions(createOptions());
                    vm.resize()
                });

            })(vm, $scope);

            // Initialize Commands
            $scope.$watch("vm.optCommandMode", function(){
                signal.clear();
                cyChart.$('node').unselect();
                cyChart.$('edge[edgeType="cn"]').remove();
                switch (vm.optCommandMode.name)
                {
                    case "Sequential":
                        try{ cyChart.$('node').unselect(); setOptions(createOptions()); }catch(e){}
                        vm.cmd = function(cmd){
                            switch (cmd){
                                case "HideAllEdges":
                                    cyChart.$('edge[edgeType="cn"]').remove();
                                    break;
                                case "HideSelectedEdges":
                                    cyChart.$('node[nodeType="patient"]:selected, node[nodeType="gene"]:selected')
                                        .neighborhood("edge").remove();
                                    break;
                                case "SelectConnected":
                                    cyChart.startBatch();
                                    cyChart.$('node:selected')
                                        .neighborhood("node")
                                        .forEach( function(ele){
                                            ele.select();
                                        });
                                    cyChart.endBatch();
                                    break;
                                case "SelectInverse":
                                    cyChart.startBatch();
                                    cyChart.$('node').forEach( function(ele){ ele[ele._private.selected?"deselect":"select"](); });
                                    cyChart.endBatch();
                                    break;
                                case "HideUnselectedNodes":
                                    var degmap = {};
                                    cyChart.$('node[nodeType="patient"]:unselected, node[nodeType="gene"]:unselected')
                                        .forEach(function(item){ 
                                            this[item.id()] = {display:'none'};
                                        }, degmap);
                                    cyChart.batchData(degmap);
                                    break;
                                case "ShowAllNodes":
                                    var degmap = {};
                                    cyChart.$('node:hidden')
                                        .forEach(function(item){ 
                                            this[item.id()] = {display:'element'};
                                        }, degmap);
                                    cyChart.batchData(degmap);
                                    break;
                                default:
                                    var opts = createOptions(cmd);
                                    setOptions(opts);
                                    break;
                            }
                        };
                        break;
                    case "Set":
                        var unselect = function(){
                            cyChart.$('edge[edgeType="cn"]').remove();
                            var opts = createOptions();
                            if (opts.patients.selected.length>0 || opts.genes.selected.length>0) setOptions(opts); 
                        };
                        var select = function() { 
                            cyChart.$('edge[edgeType="cn"]').remove();
                            setOptions(createOptions()); 
                        };
                        signal.patients.select.add(select);
                        signal.patients.unselect.add(unselect);
                        signal.genes.select.add(select);
                        signal.genes.unselect.add(unselect);
                        break;
                    case "Ad Hoc":
                        var over = function(e){
                            e.cyTarget.select();
                            setOptions(createOptions());
                        }
                        var out = function(e){
                            e.cyTarget.unselect();
                            cyChart.$('edge[edgeType="cn"]').remove();
                        }
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

