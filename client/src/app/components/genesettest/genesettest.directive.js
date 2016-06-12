(function() {
    'use strict';
    
    angular
        .module('oncoscape')
        .directive('osGenesettest', genesettest);

    /** @ngInject */
    function genesettest() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/genesettest/genesettest.html',
            controller: GenesettestController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function GenesettestController(osApi, osHistory, $state, $stateParams, $timeout, $scope, d3, $window, _) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // Elements
            var elInput = angular.element("#geneSetTestsInputsDiv");
            
            // Properties
            //var cohortPatient = osApi.getCohortPatient();

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.geneSets = [];
            vm.geneSet = null;
            var cohort1, cohort2;
            var selectionTimes = osHistory.getPatientSelections().length;
            if (selectionTimes > 1){
                cohort1 = osHistory.getPatientSelections()[selectionTimes-1];
                cohort2 = osHistory.getPatientSelections()[selectionTimes-2];
            } else{
                cohort1 = null;
                cohort2 = null;
            }

            // Initialize
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function(response) {
                var mtx = response.payload.rownames.filter(function(v) {
                        return v.indexOf("mtx.mrna") >= 0
                    });

                mtx = mtx[mtx.length - 1].replace(".RData", "");
                
                if(cohort1 == null || cohort2 == null){
                    vm.message = "Please select two cohorts to test out the Gene Set";
                    vm.optCohort1 = "Empty";
                    vm.optCohort2 = "Empty";
                }else{
                    vm.optCohort1 = cohort1.tool + " " +cohort1.desc + " " + cohort1.ids.length + " Patients selected" ;
                    vm.optCohort2 = cohort2.tool + " " +cohort2.desc + " " + cohort2.ids.length + " Patients selected" ;

                    //var geneset = "random.24";
                    //var geneset = "tcga.pancan.mutated";
                    var geneset = "DNA_REPAIR";
                    osApi.getGeneSetTest(vm.datasource, mtx).then(function() {
                        $scope.$watchGroup(['vm.optCohort1', 'vm.optCohort2'], function() {
                           calculateGeneSetScore(cohort1, cohort2, geneset);
                        });  
                     });   
                }
                osApi.setBusy(false);
            });

            var drawHeatMap = function(pt, genes, expressionData){
                console.log(expressionData);
                

                var zValues = JSON.parse(expressionData);
                var colorscaleValue = [
                      [1, '#339966'],
                      [2, '#003333']
                    ];

                    var data = [{
                      //x: genes,
                      y: pt,
                      z: zValues,
                      type: 'heatmap',
                      //colorscale: colorscaleValue,
                      showscale: true
                    }];

                    var layout = {
                      title: 'GeneSet Heatmap',
                      annotations: [],
                      xaxis: {
                        ticks: '',
                        side: 'top'
                      },
                      yaxis: {
                        ticks: '',
                        ticksuffix: ' ',
                        width: 500,
                        height: 250,
                        autosize: false
                      }
                    };


                    Plotly.newPlot('heatMap', data, layout);
            }

            var drawHeatMap2 = function(pt, genes, group, expressionData){

                   angular.element('#heatMap').highcharts({

                        chart: {
                            type: 'heatmap'

                        },
                        title: {
                            text: null
                        },
                        tooltip: {
                            formatter: function () {
                                return '<b>' + this.series.yAxis.categories[this.point.y] + ' </b> had a value of <br><b>' + 
                                this.point.value + '</b> on <b>' + this.series.xAxis.categories[this.point.x] + '</b>';
                            },
                            //backgroundColor: null,
                            borderWidth: 0,
                            borderColor: '#000000',
                            distance: 10,
                            shadow: false,
                            useHTML: true,
                            style: {
                                padding: 0,
                                color: 'black'
                            }
                        },
                        xAxis: {
                            categories: genes,
                            labels: {
                                rotation: 90
                            }
                        },
                        yAxis: {
                            title: {
                                text: null
                            },
                            categories: pt
                            //,reversed: false
                        },
                        colorAxis: {
                            stops: [
                                [0, '#4682B4'],
                                [0.1, '#ADD8E6'],
                                [0.5, '#FFFACD'],
                                [1, '#FF4500']
                            ],
                            min: 0,
                            max: 2.5,
                            startOnTick: false,
                            endOnTick: false
                        },
                        series: [{
                            borderWidth: 0,
                            nullColor: '#EFEFEF',
                            data: JSON.parse(expressionData) }],
                            pointPadding: 0.3,
                            pointPlacement: -0.2
                                    });

                   /** Grouping information
                   **/
                   d3.selection.prototype.second = function(){
                        return d3.select(this[0][1]);
                   }

                   var svgContainer = d3.selectAll(".highcharts-axis-labels")
                                        .second()
                                        .append("svg")
                                        .attr("width",100)
                                        .attr("height",600);
                   var svgContainerHeight = d3.select(".highcharts-series-group").node().getBoundingClientRect()[["height"]];
                   var group1y = 10 + (group.indexOf(1)/group.length)*svgContainerHeight;                    
                   var group1label = [{"x":100, "y": 10}, {"x":100, "y": group1y}];
                   var group2label = [{"x":100, "y": group1y}, {"x":100, "y": (10 + svgContainerHeight)}];
                   var lineFunction = d3.svg.line()
                                        .x(function(d) { return d.x; })
                                        .y(function(d) { return d.y; })
                                        .interpolate("linear");
                   var lineGraph1 = svgContainer.append("path")
                                                .attr("d", lineFunction(group1label))
                                                .attr("stroke","#000080")
                                                .attr("stroke-width",10)
                                                .attr("fill","none");
                   var lineGraph2 = svgContainer.append("path")
                                                .attr("d", lineFunction(group2label))
                                                .attr("stroke","#9ACD32")
                                                .attr("stroke-width",10)
                                                .attr("fill","none");

            }    
            // API Call To oncoprint_data_selection
            var calculateGeneSetScore = function(cohort1, cohort2, geneset) {    
                var Group1 = cohort1.ids;
                var Group2 = cohort2.ids;

                osApi.setBusy(true);
                osApi.getGeneSetScore(Group1, Group2, geneset).then(function(response){
                    if(response.status == "error"){
                        vm.message = response.payload + "Please select two cohorts to test out the Gene Set";
                    }else{
                        
                        console.log("payload is: ", response.payload);
                        var pt = [];
                        var g = []; 
                        if(typeof(response.payload.genes) == "string"){
                            var singleGene = response.payload.genes;
                            g.push(singleGene);
                        }else{
                            g = response.payload.genes;
                        }
                        if(typeof(response.payload.pt) == "string"){
                            var singlePatient = response.payload.pt;
                            pt.push(singlePatient);
                        }else{
                            pt = response.payload.pt;
                        }
                        var group = response.payload.group;
                        var pValue = response.payload.pValue;
                        vm.message = "Gene set Name is: " + geneset + "; List of genes are: " + g + "; P-Value is: " + pValue;
                        drawHeatMap2(pt, g, group, response.payload.analysisData);

                    }
                    osApi.setBusy(false);
                });
             }    
     }
    } 
})();   