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
        function MarkersController(osApi, $state, $timeout, $scope, $stateParams, cytoscape, signals) {

            // Data
            var markersNetwork;
            var categorizationNames;
            var patientData;

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            vm.patientLayouts = [
                {name:'Default'},
                {name:'Age At Death'},
                {name:'Gender'}
            ];
            vm.patientLayout = vm.patientLayouts[0];
            vm.patient;
            vm.filters = [
                {id:'a', name:'mutation', color:'#004358', state:'Highlight'},
                {id:'b', name:'cnGain.1', color:'#1F8A70', state:'Highlight'},
                {id:'c', name:'cnLoss.1', color:'#BEDB39', state:'Highlight'},
                {id:'d', name:'cnGain.2', color:'#FFE11A', state:'Highlight'},
                {id:'e', name:'cnLoss.2', color:'#FD7400', state:'Highlight'}
            ];


            // Elements
            var elChart = $("#markers-chart");
            var csChart;

            // Event Handlers
            vm.toggleFilter = function(){
                $(".container-filters").toggleClass("container-filters-collapsed");
                $(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            };
            vm.layoutPatientClick = function (e){
                vm.patientLayout = e;
                switch (e.name){
                    case 'Default':
                        csChart.$('node[nodeType="patient"]').forEach(function(item){
                            item.position(item.data().pos);
                        });
                        break;
                    case 'Age At Death':
                        var nodes = csChart.$('node[nodeType="patient"]')
                            //.sort( function(a, b){ return Number(a.data().patient[4]) - Number(b.data().patient[4]) })
                            .forEach(function(item){
                                item.position({
                                    x: 500,
                                    y: (item.data().patient[4] * 60) - 3000
                                })
                            });

                        break;
                    case 'Gender':
                        var xMale = 1000;
                        var xFemale = 1000;
                        csChart.$('node[nodeType="patient"]')
                            .forEach(function(item){
                                if (item.data().patient[2].toLowerCase()=='male'){
                                    item.position({
                                        x:xMale-=50,
                                        y:250
                                    });
                                }else{
                                    item.position({
                                        x:xFemale-=50,
                                        y:-250
                                    });
                                }
                            });

                        break;
                }
            };
            vm.filterClick = function(e){
                var el = $("#"+e.id);
                var color;
                switch (e.state)
                {
                    case 'Visible':
                        e.state = 'Highlight';
                        el.css("border-color",e.color);
                        csChart.$('edge[edgeType="'+e.name+'"]').style({'line-color':e.color, 'width':'5px'});
                        break;
                    case 'Hidden':
                        e.state = 'Visible';
                        el.css("border-color","#CCC");
                        csChart.$('edge[edgeType="'+e.name+'"]').style({'line-color':'#CCC', 'width':'5px'});
                        break;
                    default:
                        e.state = 'Hidden';
                        el.css("border-color","#FFF");
                        csChart.$('edge[edgeType="'+e.name+'"]').style({'width':'0px'});
                        break;
                }
            };

            // Events
            var events = (function(){
                var geneOver = new signals.Signal();
                var geneOut = new signals.Signal();
                var patientOver = new signals.Signal();
                var patientOut = new signals.Signal();
                var removeAll = function(){
                    geneOver.removeAll();
                    geneOut.removeAll();
                    patientOver.removeAll();
                    patientOut.removeAll();
                }
                var over = function(e){
                    geneOver.add(e);
                    patientOver.add(e);
                };
                var out = function(e){
                    geneOut.add(e);
                    patientOut.add(e);
                }
                return {
                    geneOver:geneOver, 
                    geneOut:geneOut, 
                    patientOver:patientOver, 
                    patientOut:patientOut, 
                    over: over,
                    out: out,
                    removeAll:removeAll
                };
            })();

            vm.iModes = [
                {
                    name: 'None',
                    register: function(){},
                    unregister: function(){}
                },
                {
                    name: 'Show All Edges',
                    register: function(){
                        events.over(function(e){ 
                            if (e.cyTarget.data().nodeType=='patient'){
                                $scope.$apply(function () { vm.patient = e.cyTarget.attr('patient'); });
                            }
                            e.cyTarget.style({ 'height': '60px', 'width': '60px', 'font-size':'100px'});
                            e.cyTarget.neighborhood('node').style({'font-size':'70px'});
                        });
                        events.out(function(e){
                            $scope.$apply(function () { vm.patient = null; } );
                            e.cyTarget.style({ 'height': '30px', 'width': '30px', 'font-size':'0px'});
                            e.cyTarget.neighborhood('node').style({'font-size':'0px'});
                        });
                        csChart.$('edge[edgeType!="chromosome"]').style({display:'element'});
                    },
                    unregister: function(){
                        events.removeAll();
                        csChart.$('edge[edgeType!="chromosome"]').style({display:'none'});
                    }
                },{
                    name: 'One Degree',
                    register: function() {
                        events.over(function(e){ 
                            if (e.cyTarget.data().nodeType=='patient'){
                                $scope.$apply(function () { vm.patient = e.cyTarget.attr('patient'); });
                            }
                            e.cyTarget.style({ 'height': '60px', 'width': '60px', 'font-size':'100px'});
                            e.cyTarget.neighborhood('node').style({
                                'font-size':'70px'
                            });
                            e.cyTarget.neighborhood('edge').style({
                                'display': 'element'
                                }); 
                        });
                        events.out(function(e){
                            $scope.$apply(function () { vm.patient = null; } );
                            e.cyTarget.style({ 'height': '30px', 'width': '30px', 'font-size':'0px'});
                            e.cyTarget.neighborhood('node').style({'font-size':'0px'});
                            e.cyTarget.neighborhood('edge').style({'display': 'none'}); 
                        });
                    },
                    unregister: function(){
                        events.removeAll();
                    }
                },{
                    name: 'Two Degrees',
                    register: function(){
                        events.over(function(e){
                            if (e.cyTarget.data().nodeType=='patient'){
                                $scope.$apply(function () { vm.patient = e.cyTarget.attr('patient'); });
                            }
                            e.cyTarget.style({ 'height': '60px', 'width': '60px', 'font-size':'100px'});
                            e.cyTarget.neighborhood('node')
                                .neighborhood('edge').style({
                                    'line-style': 'dashed',
                                    'display':'element'
                                    
                            });

                            // Should Have Different Line Style For 1st Degree 
                            e.cyTarget.neighborhood('edge').style({
                                'line-style': 'solid'
                            });
                        });
                        events.out(function(e){
                            $scope.$apply(function () { vm.patient = null; } );
                            e.cyTarget.style({ 'height': '30px', 'width': '30px', 'font-size':'0px'});
                            e.cyTarget.neighborhood('node').neighborhood('edge').style({
                                'line-style': 'solid',
                                'display':'none'
                            });
                        });
                    },
                    unregister: function(){
                        events.removeAll();
                    }
                }
            ];
            vm.iMode = vm.iModes[0];
            $scope.$watch("vm.iMode", function(next, prev){ 
                prev.unregister();
                next.register(); 
            });

            // Load Datasets
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function(response){
                osApi.getPatientHistoryTable(vm.datasource).then(function(response){
                    patientData = response.payload;
                    osApi.getMarkersNetwork(response.payload).then(function(response){
                        markersNetwork = angular.fromJson(response.payload);

                        // Store Reference To Patient Data In Nodes
                        markersNetwork.elements.nodes
                            .filter(function(item){ return item.data.nodeType==='patient'; })
                            .map(function(value, index, array){
                                value.data.pos = {x:value.position.x, y:value.position.y};
                                value.data.patient = 
                                patientData.tbl.filter(function(item){return item[0] === value.data.id;})[0];
                            });

                        osApi.getSampleCategorizationNames().then(function(response){
                            categorizationNames = response.payload;
                             csChart = cytoscape({
                                container: elChart,
                                elements: markersNetwork.elements,
                                style: getStyles(),
                                layout: {
                                   name: "preset",
                                   fit: true
                                }
                            });
                            csChart
                                .on('mouseover','node[nodeType="gene"]', events.geneOver.dispatch )
                                .on('mouseover','node[nodeType="patient"]', events.patientOver.dispatch)
                                .on('mouseout', 'node[nodeType="gene"]', events.geneOut.dispatch)
                                .on('mouseout', 'node[nodeType="patient"]', events.patientOut.dispatch);


                            vm.filters.forEach(function(item){
                                $("#"+item.id).css("border-color",item.color);
                                csChart.$('edge[edgeType="'+item.name+'"]').style({'line-color':item.color, 'width':'5px'});
                            });
                            osApi.setBusy(false);
                        });
                    });
                });
            });

            



















            var getStyles = function(){
                var darkblue = 'rgb(5, 108, 225)';
                var black = 'black';
                var blue1 = 'rgb(19, 150, 222)';
                var red = 'rgb(227, 42, 53)';
                var purple = 'rgb(56, 52,123)';
                
                return [
                    {
                        selector: 'node',
                        style: {
                            'background-color': black,
                            'border-width': "0px",
                            'height': "20px",
                            'width': "20px",
                            'label': " data(id)",
                            'text-halign': "right",
                            'text-valign': "center",
                            'text-background-color': '#FFF',
                            'text-background-opacity': '.8',
                            'text-background-shape': 'roundrectangle',
                            'font-size':'0px'
                        }
                    },
                    {
                        selector: 'node[nodeType="patient"]',
                        style:{
                            'background-color': blue1,
                            'height': '30px',
                            'width': '30px'
                        }
                    },
                    {
                        selector: 'edge',
                        style:{
                            'line-color': '#CCC',
                            'line-style': 'solid',
                            'width': '3px',
                            'display':'none'
                        }
                    },
                    {   // Chromo Bars
                        selector: 'edge[edgeType="chromosome"]',
                        style:{
                            'line-color': darkblue,
                            'display':'element'
                        }
                    },
                    {
                        selector: 'node[nodeType="gene"]',
                        style:{
                            'border-color': blue1,
                            'border-width': '3px',
                            'background-color':'white',
                            'height': 'mapData(degree, 0, 50, 10.0, 80.0)',
                            'width':  'mapData(degree, 0, 50, 10.0, 80.0)'
                        }
                    },
                    {
                        selector: 'node[nodeType="patient"]:selected',
                        style:{
                            'background-color': red,
                            'width': '100px',
                            'height': '100px',
                            'shape': 'diamond'
                            
                        }
                    }
                    ];

                    /*

                     'background-color': 'white',
                            'border-color': blue0,
                            'border-width': '1px',
                            // font-size: "3px"
                            height: 'mapData(degree, 0, 50, 10.0, 80.0)',
                            width: 'mapData(degree, 0, 50, 10.0, 80.0)',
                            shape: "ellipse",
                            label: 'data(id)'

                    {
                        selector: 'node[nodeType="patient"]',
                        style: {
                            'background-color': "rgb(220, 120, 220)",
                            'border-color': "black",
                            'font-size': "3px",
                            'height': "mapData(degree, 0, 50, 20.0, 100.0)",
                            'label': "data(id)",
                            'shape': "ellipse",
                            'width': "mapData(degree, 0, 50, 20.0, 100.0)"
                        }
                    },
                    {
                        selector: 'node[nodeType="gene"]',
                        style: {
                            'background-color': "rgb(120, 220, 220)",
                            'border-color': "blue",
                            'border-width': "1px",
                            'font-size': "3px",
                            'height': "mapData(degree, 0, 50, 10.0, 80.0)",
                            'label': "data(id)",
                            'shape': "ellipse",
                            'width': "mapData(degree, 0, 50, 10.0, 80.0)"
                        }
                    }
                ]
                */
            };
        }
    }
})();
