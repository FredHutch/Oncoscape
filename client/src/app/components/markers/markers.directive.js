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

            // Create Cohort
            vm.cohort;
            vm.createCohort = function() {
                osApi.setBusy(true);
                var selected = cyChart.$('node[nodeType="patient"]:selected');
                var ids = selected.map(function(node){ return node.data().id; });
                pfApi.addFilter(vm.cohort, ids);
                vm.cohort = "";
            };



            // Elements
            var elChart = angular.element("#markers-chart");
            var cyChart;
            var rawData;


            var pfApi = osApi.getPatientFilterApi();
            pfApi.init(vm.datasource);
            pfApi.onSelect.add(draw);

 
            var removedPatients;
            function draw(o){
                osApi.setBusy(true);
                if (angular.isUndefined(o)) return;
                if (angular.isDefined(removedPatients)) removedPatients.restore();
                var patients = cyChart
                    .nodes('node[nodeType="patient"]')
                    .filterFn(function(ele){
                        if (this=="*") return false;
                        for (var i=0; i<this.length; i++){
                            if (ele.data().id == this[i]) return false;
                        }
                        return true;
                    }, o.ids);

                removedPatients = cyChart.remove(patients);
                osApi.setBusy(false);
            }
         
            // Initialize
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function() {
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {

                    // Store Patient Data
                    var dataPatients = response.payload.tbl;
                    osApi.getMarkersNetwork(response.payload).then(function(response) {

                        // Store Marker Data
                        rawData = angular.fromJson(response.payload).elements;

                        // Process Nodes (Save Hobo Positions + Patient History Info)
                        rawData.nodes
                            .filter(function(item) { return item.data.nodeType === 'patient'; })
                            .map(function(value) {
                                value.data.pos = { x: value.position.x, y: value.position.y };
                                value.data.patient = this.filter(function(item) {
                                    return item[0] === value.data.id;
                                })[0];
                            }, dataPatients);

                        // Prevent Dragging Of Chromosome - Centromere
                        rawData.nodes
                            .filter(function(item) { 
                                var type = item.data.nodeType;
                                return (type==='centromere' || type==='telomere' || type==='gene')
                                })
                            .map(function(value){
                                value.locked = true;
                                value.selectable = true;
                                value.grabbable = false;
                                return value;
                            });


                        rawData.edges
                            .map(function(value){
                                value.locked = true;
                                value.selectable = false;
                                value.grabbable = false;
                                return value;
                            });
                
                        // Initalize CytoScape
                        cyChart = cytoscape({
                            container: elChart,
                            elements: rawData,
                            style: styles,
                            hideEdgesOnViewport: false,
                            hideLabelsOnViewport: true,
                            textureOnViewport: false,
                            motionBlur: true,
                            minZoom: 0.1,
                            maxZoom: 20,
                            layout: {
                                name: "preset",
                                fit: true
                            }
                        });

                        cyChart.nodes().map(function(node){node.data({degree: node.degree(), baseWidth: node.width(), baseHeight: node.height(), zoomed:false });});
                            
                        draw();

                        // Opt Edge Colors
                        vm.optPatientLayouts = optPatientLayoutsFatory(cyChart, vm);
                        vm.optEdgeColors = optEdgeColorsFactory(cyChart, vm, $timeout);
                        vm.optNodeColors = optNodeColorsFactory(cyChart, vm, osApi);
                        vm.optInteractiveModes = optInteractiveModesFactory(cyChart, vm, $scope);
                        vm.optInteractiveMode = vm.optInteractiveModes[0];
                        optZoomResizeFactory(cyChart);

                        // Register Search Listeners
                        $scope.$watch("vm.searchGene", function(){
                            if (angular.isUndefined(vm.searchGene)) return;
                            cyChart.nodes('node[nodeType="gene"]')
                            .forEach(function(ele){
                                if (vm.searchGene=="") { ele.deselect(); return; }
                                if (ele.data().name.toLowerCase().indexOf(vm.searchGene.toLowerCase())==0){
                                    ele.select()
                                }else{
                                    ele.deselect();
                                }

                            });
                        });

                        $scope.$watch("vm.searchPatient", function(){
                            if (angular.isUndefined(vm.searchPatient)) return;
                            cyChart.nodes('node[nodeType="patient"]')
                            .forEach(function(ele){
                                if (vm.searchPatient=="") { ele.deselect(); return; }
                                if (ele.data().id.toLowerCase().indexOf(vm.searchPatient.toLowerCase())==0){
                                    ele.select()
                                }else{
                                    ele.deselect();
                                }

                            });
                        });

                        osApi.setBusy(false);
                    });
                });
            });


            // Zoom Resize
            
            var optZoomResizeFactory = function(chart){

                var _zoomlevel = 0;
                var _timeout;
                chart.on('pan', function(e){

                    var zoom = e.cy.zoom();
                    var zoomlevel = 
                        (zoom>19) ? .0000005 :
                        (zoom>15) ? .000005 :
                        (zoom>9 ) ? .00005 :
                        (zoom>8 ) ? .0005 :
                        (zoom>6 ) ? .005 :
                        (zoom>4 ) ? .02 : 
                        (zoom>2 ) ? .1 :
                        (zoom>.5) ? .3 :
                        (zoom>.3) ? .5 :
                        1;

                    if (_zoomlevel==zoomlevel) return;
                    _zoomlevel = zoomlevel;
                        
                    // Delay Call To Resize Nodes.  The User Could Still Be Zooming
                    if (angular.isDefined(_timeout)) $timeout.cancel(_timeout);
                    _timeout = $timeout( function(chart, zoomlevel){

                        var degmap = {};
                        var nodes = chart.nodes();
                        for (var i=0; i<nodes.length; i++){
                            degmap[nodes[i].id()] = { degree:nodes[i].degree() * zoomlevel };
                        }
                        chart.batchData(degmap);

                    }, 100, false, chart, zoomlevel);                    
                    
                })
            }





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
                    showNodeLabel: function(e){
                        e.cyTarget.style({ 'font-size': '50px' });
                        return this;
                    },
                    hideNodeLabel: function(e){
                        e.cyTarget.style({ 'font-size': '0px' });
                        return this;
                    },
                    showNeighborLabel: function(e){
                        e.cyTarget.neighborhood('node').style({'font-size': '50px'});
                        return this;
                    },
                    hideNeighborLabel: function(e){
                        e.cyTarget.neighborhood('node').style({'font-size': '0px'});
                        return this;
                    },
                    showDegreeOne: function(e){
                        e.cyTarget.neighborhood('edge').style({ 'display': 'element', 'line-style': 'solid' });
                        return this;
                    },
                    hideDegreeOne: function(e){
                        e.cyTarget.neighborhood('edge').style({ 'display': 'none' });
                        return this;
                    },
                    showDegreeTwo: function(e){
                        e.cyTarget.neighborhood('node')
                            .neighborhood('edge').style({ 'line-style': 'dashed', 'display': 'element' });
                        this.showDegreeOne(e);
                        return this;
                    },
                    hideDegreeTwo: function(e){
                         e.cyTarget.neighborhood('node').neighborhood('edge').style({ 'display': 'none' });
                        return this;
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

                // States
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
                                //.showNodeLabel(e)
                        });
                        events.out(function(e) {
                            behaviors
                                .hidePatientInfo(e)
                                //.hideNodeLabel(e)
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
                                //.showNodeLabel(e)
                                //.showNeighborLabel(e);
                        });
                        events.out(function(e) {
                            behaviors
                                .hidePatientInfo(e)
                                //.hideNodeLabel(e)
                                //.hideNeighborLabel(e);
                        });

                        // Show all Edges
                        chart.$('edge[edgeType!="chromosome"]').style({ display: 'element' });
                    },
                    unregister: function() {
                        events.removeAll();

                        // Hide All Edges
                        chart.$('edge[edgeType!="chromosome"]').style({ display: 'none' });
                    }
                },{
                    name: '1° When Selected',
                    register: function(){
                        cyChart.$('node[nodeType="patient"]:selected').forEach(function(e) {
                            e.neighborhood('edge').style({ 'display': 'element', 'line-style': 'solid' });
                        });
                        cyChart.on('select', 'node', function(e){
                            behaviors.showDegreeOne(e);
                        });
                        cyChart.on('unselect','node',function(e){
                            behaviors.hideDegreeOne(e);
                        });
                    },
                    unregister: function(){
                        cyChart.$('node[nodeType="patient"]:selected').forEach(function(e) {
                            e.neighborhood('edge').style({ 'display': 'none' });
                        });
                        cyChart.off('select', 'node');
                        cyChart.off('unselect', 'node');
                    }

                },{
                    name: '2° When Selected',
                    register: function(){
                        cyChart.$('node[nodeType="patient"]:selected').forEach(function(e) {
                            e.neighborhood('edge').style({ 'display': 'element', 'line-style': 'solid' });
                            e.neighborhood('node')
                                .neighborhood('edge').style({ 'line-style': 'dashed', 'display': 'element' });
                        });
                        cyChart.on('select', 'node', function(e){
                            behaviors.showDegreeTwo(e);
                        });
                        cyChart.on('unselect','node',function(e){
                            behaviors.hideDegreeTwo(e);
                        });
                    },
                    unregister: function(){
                        cyChart.$('node[nodeType="patient"]:selected').forEach(function(e) {
                            e.neighborhood('edge').style({ 'display': 'none'});
                            e.neighborhood('node')
                                .neighborhood('edge').style({ 'display': 'none' });
                        });
                        cyChart.off('select', 'node');
                        cyChart.off('unselect', 'node');
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
                                //.showNodeLabel(e)
                                //.showNeighborLabel(e)
                                .showDegreeOne(e)
                            
                        });
                        events.out(function(e) {
                            behaviors
                                .hidePatientInfo(e)
                                //.hideNodeLabel(e)
                                //.hideNeighborLabel(e)
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
                                //.showNodeLabel(e)
                                //.showNeighborLabel(e)
                                .showDegreeTwo(e)
                        });
                        events.out(function(e) {
                            behaviors
                                .hidePatientInfo(e)
                                //.hideNodeLabel(e)
                                //.hideNeighborLabel(e)
                                .hideDegreeTwo(e)                           
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
                                'width': '2px'
                            });
                            break;
                        case 'Hidden':
                            edgeColor.state = 'Visible';
                            el.css("border-color", color.gray);
                            chart.$('edge[edgeType="' + edgeColor.name + '"]').style({
                                'line-color': '#CCC',
                                'width': '2px'
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
                            'width': '2px'
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

        
            // Styles
            var color = {
                darkblue: 'rgb(5, 108, 225)',
                blue: 'rgb(19, 150, 222)',
                black: 'black',
                white: 'white',
                red: 'red',
                purple: 'rgb(56, 52,123)',
                gray: '#CCC'
            };
            var styles = [{
                selector: 'node',
                style: {
                    'background-color': color.blue,
                    'border-opacity': 1,
                    'border-color': color.red,
                    'border-width': "0px",
                    'height': "20px",
                    'width': "20px",
                    'label': " data(id)",
                    'text-halign': 'center',
                    'text-valign': 'center',
                    //'text-background-color': color.white,
                    //'text-background-opacity': '.8',
                    //'text-background-shape': 'roundrectangle',
                    'font-size': '0px'
                }
            }, 
            {
                selector: 'node[nodeType="patient"]',
                style: {
                    'background-color': color.blue,
                    'height': 'mapData(degree, 0, 50, 3.0, 100.0)',
                    'width': 'mapData(degree, 0, 50, 3.0, 100.0)'
                }
            }, {
                selector: 'edge',
                style: {
                    'display': 'none'
                }
            }, { // Chromo Bars
                selector: 'edge[edgeType="chromosome"]',
                style: {
                    'line-color': color.blue,
                    'display': 'element'
                }
            }, {
                selector: 'node[nodeType="gene"]',
                style: {
                    'background-color': color.white,
                    'border-color': color.purple,
                    'border-width': 'mapData(degree, 0, 50, 1.0, 3.0)',
                    'height': 'mapData(degree, 0, 50, 1.0, 100.0)',
                    'width': 'mapData(degree, 0, 50, 1.0, 100.0)'
                }
            }, {
                selector: 'node[nodeType="gene"]:selected',
                style: {
                    'border-color': color.red,
                    'border-width': '6px'
                }
            }, {
                selector: 'node[nodeType="centromere"]',
                style:{
                    'font-size': '24px',
                    'min-zoomed-font-size': '12px',
                    'text-halign': 'center',
                    'text-valign': 'center',
                    'background-color': color.white,
                    'border-color': color.blue,
                    'color': color.blue,
                    'border-width': '3px',
                    'height': '40px',
                    'width': '120px',
                    'shape': 'roundrectangle',
                    'label': 'data(id)'
               }
            }, {
                selector: 'node[nodeType="patient"]:selected',
                style: {
                    'border-color': color.red,
                    'border-width': 'mapData(degree, 0, 50, 1.0, 3.0)',
                }
            }];
        }
    }
})();
