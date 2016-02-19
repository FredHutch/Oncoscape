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

            var markersNetwork;
            var categorizationNames;

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";

            // Elements
            var elChart = $("#chart");
            var csChart;

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

            vm.filters = [
                {name:'mutation', show:true},
                {name:'cnGain.1', show:true},
                {name:'cnLoss.1', show:true},
                {name:'cnGain.2', show:true},
                {name:'cnLoss.2', show:true}
            ];
            vm.iModes = [
                {
                    name: 'None',
                    register: function(){
                    },
                    unregister: function(){

                    }
                },{
                    name: 'Show All Edges',
                    register: function(){
                        csChart.$('edge[edgeType!="chromosome"]').style({display:'element'});
                    },
                    unregister: function(){
                        csChart.$('edge[edgeType!="chromosome"]').style({display:'none'});
                    }
                },{
                    name: 'One Degree',
                    register: function() {
                        events.over(function(e){ 
                            e.cyTarget.style({ 'height': '60px', 'width': '60px'});
                            e.cyTarget.neighborhood('edge').style(
                                {'display': 'element', 'width':'3px', 'line-color':'rgb(19, 150, 222)'}
                                ); 
                        });
                        events.out(function(e){
                            e.cyTarget.style({ 'height': '30px', 'width': '30px'});
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
                            e.cyTarget.style({ 'height': '60px', 'width': '60px'});
                            e.cyTarget.neighborhood('node').neighborhood('edge').style({
                                display:'element', 'line-color':'rgb(56, 52,123)'
                            });
                            e.cyTarget.neighborhood('edge').style({
                                'width': '5px',
                                'line-color' : 'rgb(19, 150, 222)'
                            }); 
                        });
                        events.out(function(e){
                            e.cyTarget.style({ 'height': '30px', 'width': '30px'});
                            e.cyTarget.neighborhood('node').neighborhood('edge').style({
                                'width': '1px',
                                display:'none'
                            });
                        });
                    },
                    unregister: function(){
                        events.removeAll;
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
                osApi.getMarkersNetwork(response.payload).then(function(response){
                    markersNetwork = angular.fromJson(response.payload);
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
                        osApi.setBusy(false);
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
                            'text-valign': "center"
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
                            'line-color': blue1,
                            'line-style': 'solid',
                            'width': '1px',
                            'display':'none'
                        }
                    },
                    {   // Chromo Bars
                        selector: 'edge[edgeType="chromosome"]',
                        style:{
                            'line-color': black,
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
