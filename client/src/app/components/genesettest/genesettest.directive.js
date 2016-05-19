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

        
            var cohort1 = osHistory.getPatientSelections()[0];
            var cohort2 = osHistory.getPatientSelections()[1];

            // Initialize
            osApi.setBusy(true);
            osApi.setDataset(vm.datasource).then(function(response) {
                var mtx = response.payload.rownames.filter(function(v) {
                        return v.indexOf("mtx.mrna") >= 0
                    });

                mtx = mtx[mtx.length - 1].replace(".RData", "");
                console.log("**** mtx is: ", mtx);

                if(cohort1 == null || cohort2 == null){
                    vm.message = "Please select two cohorts to test out the Gene Set";
                    vm.optCohort1 = "Empty";
                    vm.optCohort2 = "Empty";
                }else{
                    vm.optCohort1 = cohort1.tool + " " +cohort1.desc + " " + cohort1.ids.length + " Patients selected" ;
                    vm.optCohort2 = cohort2.tool + " " +cohort2.desc + " " + cohort2.ids.length + " Patients selected" ;
                    var geneset = "random.24";
                    //var geneset = "tcga.pancan.mutated";
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
            var drawHeatMap2 = function(pt, genes, expressionData){
                   console.log(expressionData);
            
                   angular.element('#heatMap').highcharts({

                        chart: {
                            type: 'heatmap',
                            marginTop: 40,
                            marginBottom: 80,
                            plotBorderWidth: 1,
                        },


                        title: {
                            text: 'Gene Set Expression Heat Map'
                        },

                        xAxis: {
                            // labels: {
                            //     step: 1
                            // },
                            categories: genes
                        },

                        yAxis: {
                            lineWidth: 5,
                            lineColor: '#F33',
                            categories: pt,
                            title: null
                        },

                        colorAxis: {
                            min: 0,
                            //minColor:Highcharts.getOptions().colors[7],
                            minColor: "#FFFFFF",
                            maxColor:'#CC9933'
                        },

                        legend: {
                            align: 'right',
                            layout: 'vertical',
                            margin: 10,
                            verticalAlign: 'top',
                            y: 25,
                            symbolHeight: 280
                        },

                        tooltip: {
                            formatter: function () {
                                return '<b>' +this.series.yAxis.categories[this.point.y]  + ' '+ 
                                     this.series.xAxis.categories[this.point.x]+ ': ' +this.point.value + '</b>';
                            }
                        },

                        series: [{
                                    name: 'Sales per employee',
                                    borderWidth: 0,
                                    data: JSON.parse(expressionData) }]
                    });

            }    
            // API Call To oncoprint_data_selection
            var calculateGeneSetScore = function(cohort1, cohort2, geneset) {    
                var Group1 = cohort1.ids;
                var Group2 = cohort2.ids;

                osApi.setBusy(true);
                osApi.getGeneSetScore(Group1, Group2, geneset).then(function(response){
                    console.log(response.payload);
                    if(response.status == "error"){
                        vm.message = response.payload + "Please select two cohorts to test out the Gene Set";
                    }else{
                        vm.message = response.payload.summary;
                        var pt = response.payload.pt;
                        var g = response.payload.genes;
                        drawHeatMap2(pt, g, response.payload.analysisData);
                    }
                    osApi.setBusy(false);
                });
             }    
     }
    } 
})();   