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

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // Initialize View Model
            var vm = initializeViewModel(this, $stateParams);

            // Load Data
            osApi.setBusy(true);
            loadData(osApi, vm, function(data){

                // Initalize Styles
                var styles = initializeStyles();

                // Initialize Chart
                var chart = initializeChart(data, styles, cytoscape, angular.element("#markers-chart"));

                // Initalize Layouts
                initializeLayouts(chart, vm, $scope);

                // Initalize Node Colors
                initializeNodeColors(chart, vm, $scope, osApi);

                // Initalize Search
                initializeSearch(chart, vm, $scope)

                // Initialize Edge Color Options
                initializeEdgeColors(chart, vm, $scope, $timeout, osApi);

                // Initialize Zoome
                initializeZoom(chart);
                
                // Ready
                osApi.setBusy(false);
            });
        }

        function initializeSearch(chart, vm, $scope){

            // Search Gene Textbox
            $scope.$watch("vm.searchGene", function(){
                if (angular.isUndefined(vm.searchGene)) return;
                chart.startBatch();
                chart.nodes('node[nodeType="gene"]')
                    .forEach(function(ele){
                        if (vm.searchGene=="") { ele.deselect(); return; }
                        if (ele.data().name.toLowerCase().indexOf(vm.searchGene.toLowerCase())==0){
                            ele.select()
                        }else{
                            ele.deselect();
                        }
                    });
                chart.endBatch();
            });

            // Search Patient Textbox
            $scope.$watch("vm.searchPatient", function(){
                if (angular.isUndefined(vm.searchPatient)) return;
                chart.startBatch();
                chart.nodes('node[nodeType="patient"]')
                    .forEach(function(ele){
                        if (vm.searchPatient=="") { ele.deselect(); return; }
                        if (ele.data().id.toLowerCase().indexOf(vm.searchPatient.toLowerCase())==0){
                            ele.select()
                        }else{
                            ele.deselect();
                        }
                });
                chart.endBatch();
            });
        }
            
        function initializeViewModel(vm, $stateParams){
            vm.datasource = $stateParams.datasource;
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
            return vm;
        }

        function initializeChart(data, styles, cytoscape, el){
            // Initalize Cytoscape Chart
            // If performance becomes an issue set *Viewport attributes to true
            return cytoscape({
                container: el,
                elements: data,
                style: styles,
                hideEdgesOnViewport: false,
                hideLabelsOnViewport: false,
                textureOnViewport: false,
                motionBlur: true,
                minZoom: 0.1,
                maxZoom: 20,
                layout: {
                    name: "preset",
                    fit: true
                }
            });
        }

        function initializeStyles(){
            // Unlike CSS order of operations is determined by order
            // Play specific attention to use of data() + mapdata() values they are dynamic
            // Care should be taken not to update styles directly in code, but to use underlying data model
            // Cytoscape Dynamic Style Properties Include
            /*
                display
                color
                sizeEle
                sizeLbl
                posX
                posY
                hobo
                patient
            */
            return [
            {
                selector: 'node',
                style: {
                    'display': "data(display)",
                    'label': "data(id)",
                    'height': "mapData(sizeEle, 0, 50, 10, 100)",
                    'width': "mapData(sizeEle, 0, 50, 10, 100)",
                    'border-width': "5px",
                    'font-size': 'data(sizeLbl)',
                    'text-valign': 'center',
                    'min-zoomed-font-size': '8px',
                }
            }, {
                selector: 'node[nodeType="patient"]',
                style: {
                    'background-color': 'data(color)',
                    'border-color': 'data(color)',
                    'text-halign': 'center'
                }
            }, {
                selector: 'node[nodeType="patient"]:selected',
                style: {
                    'border-color': "#FF0000"
                }
            }, {
                selector: 'node[nodeType="gene"]',
                style: {
                    'background-color': "#FFFFFF",
                    'border-color': "data(color)",
                    'text-halign': 'right'
                }
            }, {
                selector: 'node[nodeType="gene"]:selected',
                style: {
                    'border-color': "#FF0000",
                }
            },{
                selector: 'node[nodeType="centromere"]',
                style:{
                    'font-size': '24px',
                    'text-halign': 'center',
                    'background-color': '#FFFFFF',
                    'border-color': 'rgb(19, 150, 222)',
                    'height': '40px',
                    'width': '120px',
                    'shape': 'roundrectangle'
                }
            },{
                selector: 'edge',
                style:{
                    'display': "data(display)",
                    'line-color': "data(color)",
                    'line-width': "data(sizeEle)"
                }
            }];
        }

        function initializeEdgeColors(chart, vm, $scope, $timeout, osApi){

            // Create Signals
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

            // Attach Event Signals To Real Events
            chart
                .on('click', 'node[nodeType="gene"]', events.geneClick.dispatch)
                .on('click', 'node[nodeType="patient"]', events.patientClick.dispatch)
                .on('mouseover', 'node[nodeType="gene"]', events.geneOver.dispatch)
                .on('mouseover', 'node[nodeType="patient"]', events.patientOver.dispatch)
                .on('mouseout', 'node[nodeType="gene"]', events.geneOut.dispatch)
                .on('mouseout', 'node[nodeType="patient"]', events.patientOut.dispatch);

            // Cache Hide All Edges Structure
            var hidePatientEdges = {};
            chart.$('edge[edgeType!="chromosome"]')
                .forEach(function(node){ this[node.id()] = { display: 'none' };}, hidePatientEdges);
                    
            // Define Behaviors
            var behaviors = {
                showPatientInfo: function(e){
                    if (e.cyTarget.data().nodeType == 'patient') {
                        $scope.$apply(function() {
                            vm.patient = e.cyTarget.attr('patient');
                            vm.patientChromosomes = e.cyTarget.neighborhood("node")
                                .map(function(item) { return item.data().id });
                        });
                    }
                    return this;
                },
                hidePatientInfo: function(){
                    $scope.$apply(function() {
                        vm.patient = vm.patientChromosomes = null;
                    });
                    return this;
                },
                showDegreeOne: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('edge')
                        .forEach(function(item){
                            this[item.id()] = {display:'element'};
                        }, degmap);
                    chart.batchData(degmap);
                },
                hideDegreeOne: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('edge')
                        .forEach(function(item){
                            this[item.id()] = {display:'none'};
                        }, degmap);
                    chart.batchData(degmap);
                },
                showDegreeTwo: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('node')
                        .forEach(function(node){
                            node.neighborhood('edge')
                                .forEach(function(item){
                                    this[item.id()] = {display:'element'};
                            }, this);
                        }, degmap);
                    chart.batchData(degmap);
                },
                hideDegreeTwo: function(e){
                    var degmap = {};
                    e.cyTarget.neighborhood('node')
                        .forEach(function(node){
                            node.neighborhood('edge')
                                .forEach(function(item){
                                    this[item.id()] = {display:'none'};
                            }, this);
                        }, degmap);
                    chart.batchData(degmap);
                },
                showOncoPrint: function(e){
                    var ds = vm.datasource;
                    if (ds=="DEMOdz") return;
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
                }
            }

            // Use States To Associate Events + Behaviors
            var states = [{
                name: 'Hide All',
                register: function() {
                    events.click(function(e) {
                        behaviors
                            .showOncoPrint(e)
                    });
                    events.over(function(e) {
                        behaviors
                            .showPatientInfo(e)
                    });
                    events.out(function(e) {
                        behaviors
                            .hidePatientInfo(e)
                    });
                },
                unregister: function() {
                    events.removeAll();
                }
            }, {
                name: 'Show All',
                register: function() {
                    events.click(function(e) {
                        behaviors
                            .showOncoPrint(e)
                    });
                    events.over(function(e) {
                        behaviors
                            .showPatientInfo(e)
                    });
                    events.out(function(e) {
                        behaviors
                            .hidePatientInfo(e)
                    });

                    // Show all Edges
                    var degmap = {};
                    chart.$('edge[edgeType!="chromosome"]')
                        .forEach(function(node){
                            this[node.id()] = { display: 'element' };
                        }, degmap);
                    chart.batchData(degmap);
                },
                unregister: function() {
                    events.removeAll();

                    // Hide All Edges
                    chart.batchData(hidePatientEdges);
                }
            },{
                name: '1° When Selected',
                register: function(){

                    var degmap = {};
                    chart.$('node[nodeType="patient"]:selected')
                        .forEach(function(node) {
                            node.neighborhood('edge').forEach( function(edge) {
                                this[edge.id()] = { display: 'element' };
                            }, degmap)
                        }, degmap);
                    chart.batchData(degmap);


                    chart.on('select', 'node', function(e){
                        behaviors.showDegreeOne(e);
                    });
                    chart.on('unselect','node',function(e){
                        behaviors.hideDegreeOne(e);
                    });
                },
                unregister: function(){

                    // Hide All Edges
                    chart.batchData(hidePatientEdges);
                    chart.off('select', 'node');
                    chart.off('unselect', 'node');
                }

            },{
                name: '2° When Selected',
                register: function(){


                    var degmap = {};
                    chart.$('node[nodeType="patient"]:selected')
                        .forEach(function(node){
                            node.neighborhood('node')
                                .forEach(function(node){
                                    node.neighborhood('edge')
                                        .forEach(function(item){
                                            this[item.id()] = {display:'element'};
                                        }, this)
                                }, this)
                        }, degmap);
                    chart.batchData(degmap);
                    
                    chart.on('select', 'node', function(e){
                        behaviors.showDegreeTwo(e);
                    });
                    chart.on('unselect','node',function(e){
                        behaviors.hideDegreeTwo(e);
                    });
                },
                unregister: function(){

                    // Hide All Edges
                    chart.batchData(hidePatientEdges);
                    chart.off('select', 'node');
                    chart.off('unselect', 'node');
                }

            },{
                name: '1° On Mouse Over',
                register: function() {
                    events.click(function(e) {
                        behaviors
                            .showOncoPrint(e)
                    });
                    events.over(function(e) {
                        behaviors
                            .showPatientInfo(e)
                            .showDegreeOne(e)
                        
                    });
                    events.out(function(e) {
                        behaviors
                            .hidePatientInfo(e)
                            .hideDegreeOne(e)
                    });
                },
                unregister: function() {
                    events.removeAll();
                }
            }, {
                name: '2° On Mouse Over',
                register: function() {
                    events.click(function(e) {
                        behaviors
                            .showOncoPrint(e)
                    });
                    events.over(function(e) {
                        behaviors
                            .showPatientInfo(e)
                            .showDegreeTwo(e)
                    });
                    events.out(function(e) {
                        behaviors
                            .hidePatientInfo(e)
                            .hideDegreeTwo(e)                           
                    });
                },
                unregister: function() {
                    events.removeAll();
                }
            }];

            vm.optInteractiveModes = states;
            vm.optInteractiveMode = vm.optInteractiveModes[0];

            // What Scope To Initialize Behaviors
            $scope.$watch("vm.optInteractiveMode", function(next, prev) {
                if (angular.isDefined(prev)) prev.unregister();
                if (angular.isDefined(next)) next.register();
            });

            // Set Edge Options
            var colors = [{ 
                    name: 'mutation',
                    class: 'edgeMutation',
                    color: '#004358',
                    state: 'Highlight'
                }, {
                    name: 'cnGain.1',
                    class: 'edgeCnGain1',
                    color: '#1F8A70',
                    state: 'Highlight'
                }, {
                    name: 'cnLoss.1',
                    class: 'edgeCnLoss1',
                    color: '#BEDB39',
                    state: 'Highlight'
                }, {
                    name: 'cnGain.2',
                    class: 'edgeCnGain2',
                    color: '#FFE11A',
                    state: 'Highlight'

                }, {
                    name: 'cnLoss.2',
                    class: 'edgeCnLoss2',
                    color: '#FD7400',
                    state: 'Highlight'
                }];

            // Default colors
            $timeout(function(){
                colors.forEach(function(item){
                    angular.element("." + item.class).css("border-color", item.color);
                });
            });

            vm.optEdgeColors = colors;

            // Update Edge Callback
            vm.updateEdge = function(item){
                var degmap = {};



            }



                // $timeout(function() {
                //     value.forEach(function(item) {
                //         angular.element("." + item.class).css("border-color", item.color);
                //         chart.$('edge[edgeType="' + item.name + '"]').style({
                //             'line-color': item.color,
                //             'width': '2px'
                //         });
                //     });
                // });
        }

        function initializeZoom(chart){
            
        }

        function initializeNodeColors(chart, vm, $scope, osApi){
            
            osApi.getSampleCategorizationNames().then(function(response) {
                vm.optNodeColors =  [{name: 'Default'},{name: 'Gender'},{name: 'Age At Diagnosis'}]
                    .concat( response.payload
                        .map(function(item) { return {'name': item} }));
                vm.optNodeColor = vm.optNodeColors[0];

                $scope.$watch("vm.optNodeColor", function(){
                        switch(vm.optNodeColor.name){
                            case "Default":
                                vm.legandNodes = [{name:'Patients', color:'#3993fa'}];
                                var degmap = {};
                                chart.$('node[nodeType="patient"]')
                                    .forEach(function(node){
                                        degmap[node.id()] = {color:'#3993fa'};
                                    });
                                chart.batchData(degmap);
                                break;
                            case "Gender":
                                vm.legandNodes = [{name:'Male', color:'blue'}, {name:'Female', color:'pink'}];
                                var degmap = {};
                                chart.$('node[nodeType="patient"]')
                                    .forEach(function(node){
                                        try{
                                            var gender = node.data("patient")[0][2];
                                            degmap[node.id()] = {color: (gender==='male') ? 'rgb(5, 108, 225)' :  'pink' };
                                        }catch(e){
                                            degmap[node.id()] = {color: '#000000'};
                                        }
                                    });
                                chart.batchData(degmap);
                                break;
                            case "Age At Diagnosis":
                                vm.legandNodes = [{name:'Young', color:'green'}, {name:'Old', color:'red'}];
                                var degmap = {};
                                chart.$('node[nodeType="patient"]')
                                    .forEach(function(node){
                                        try{
                                            var age = Number(node.data("patient")[0][4]);
                                            degmap[node.id()] = {color: 'rgb(' + ((255 * age) / 100) + ',' + ((255 * (100 - age)) / 100) + ',0)' };
                                        }catch(e){
                                            degmap[node.id()] = {color: '#000000'};
                                        }
                                    });
                                chart.batchData(degmap);
                                break;
                            default:
                                osApi.getSampleCategorization(vm.optNodeColor.name).then(function(response) {
                                    vm.legandNodes = response.payload.tbl
                                        .map(function(e) {return e[0] + "|" + e[1]; })
                                        .filter(function(v, i, s) { return s.indexOf(v) === i; })
                                        .map(function(e) { var p = e.split("|");
                                            return { 'name': p[0], 'color': p[1] } });
                                        var rows = response.payload.rownames;
                                        var tbl = response.payload.tbl;
                                        var degmap = {};
                                        var nodes = chart.$('node[nodeType="patient"]');
                                        // Revisit This.  Would be faster to not loop.
                                        for (var i=0; i<nodes.length; i++){
                                            var id = nodes[i].id();
                                            degmap[id] = {color:'#DDDDDD'}
                                            for (var ii=0; ii<rows.length; ii++){
                                                if (id==rows[ii]){
                                                    degmap[id] = {color:tbl[ii][1]}
                                                    break;
                                                }
                                            }
                                        }
                                        chart.batchData(degmap);
                                    });
                                break;
                        }
                    });

            });
        }

        function initializeLayouts(chart, vm, $scope){
            vm.optPatientLayouts = [{name: 'Hobo'},{name: 'Age At Diagnosis'},{name: 'Gender'}];
            vm.optPatientLayout = vm.optPatientLayouts[0];
            $scope.$watch('vm.optPatientLayout', function(layout){
                var data = {};
                var nodes = chart.nodes('node[nodeType="patient"]');
                chart.startBatch();
                switch (layout.name){

                    // Hobo Chart Positions Are Sent From Server In Initial Dataset + Cached Load
                    case "Hobo":
                        nodes.forEach(function(node){ 
                            node.position(node.data("hobo")); 
                        });
                        break;

                    // Age At Dx Comes From Patient Table
                    case "Age At Diagnosis":
                        nodes.forEach(function(node){
                            try{
                                var age = Number(node.data("patient")[0][4]);
                                age = age.map(0, 100, -3000, 3000);
                                node.position({
                                    y: age, 
                                    x: (Math.pow(age, 2) / 5000) - 200
                                });
                            }catch(e){
                                node.position({x:100,y:0});
                            }
                        });
                        break;

                    // Gender Comes From Patient Table
                    case "Gender":
                        nodes.forEach(function(node){
                            try{
                                if (node.data("patient")[0][2].toLowerCase()=='male'){
                                    node.position({x:100, y:-500})
                                }else{
                                    node.position({x:100, y:500})
                                }
                            }catch(e){
                                node.position({x:100,y:0})
                            }
                        });
                        break;
                }
                chart.endBatch();
            });
        }

        function loadData(osApi, vm, cb){
            // Today multiple nested data calls are nessisary to obtain all the data to render the chart
            // Future server refactor should be done to limit number of calls and preformat data
            osApi.setDataset(vm.datasource).then(function() {

                // Patient Data
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    var dataPatients = response.payload.tbl;

                    // Marker Data
                    osApi.getMarkersNetwork(response.payload).then(function(response) {
                        var dataMarkers = angular.fromJson(response.payload).elements;

                        // Process Patient Nodes (Save Hobo Positions + Patient History Info + Color + SizeEle + SizeLbl)
                        dataMarkers.nodes
                            .filter(function(item) { return item.data.nodeType === 'patient'; })
                            .map(function(value) {
                                var data = value.data;
                                data.display = "element";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = data.degree;
                                data.sizeLbl = 12;
                                data.hobo = {x: value.position.x, y: value.position.y};
                                data.patient = this.filter(function(item){ return item[0]===value.data.id });
                            }, dataPatients);

                        // Process Non Patient Nodes
                        dataMarkers.nodes
                            .filter(function(item) {  return  item.data.nodeType != 'patient'; })
                            .map(function(value){
                                var data = value.data;
                                data.display = "element";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = data.degree;
                                data.sizeLbl = 12;
                                value.locked = true;
                                value.selectable = true;
                                value.grabbable = false;
                                return value;
                            });

                        // Process Edges
                        dataMarkers.edges
                            .map(function(value){
                                var data = value.data;
                                data.display = (data.edgeType=="chromosome") ? "element" : "none";
                                data.color = "rgb(19, 150, 222)";
                                data.sizeEle = 1;
                                data.sizeLbl = 12;
                                value.locked = true;
                                value.selectable = false;
                                value.grabbable = false;
                                return value;
                            });

                        // Call Back
                        cb(dataMarkers);
                    });
                });
            });
        }
    }
})();
