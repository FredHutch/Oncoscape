(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osOncoprint', oncoprint);

    /** @ngInject */
    function oncoprint() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/oncoprint/oncoprint.html',
            controller: OncoprintController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function OncoprintController(osApi, $state, $stateParams, $timeout, $scope, d3, $window, _) {

            if (angular.isUndefined($stateParams.datasource)) {
                $state.go("datasource");
                return;
            }

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource;
            //console.log(vm.datasource);
            vm.geneSets = []; // needs to updated to string, which includes genes and patients
            vm.geneSet = null;
            // vm.optNodeColors = [{name: 'Default'}, {name: 'Gender'}, {name: 'Age At Diagnosis'}];
            // vm.optNodeColor = vm.optNodeColors[0];


            // Filters: oncoprint doesn't have the select/send feature yet
             var rawData, rawPatientData;
            // var pfApi = osApi.getPatientFilterApi();
            // pfApi.init(vm.datasource);
            // pfApi.onSelect.add(draw);
            // vm.cohort;
            // vm.createCohort = function() {
            //     pfApi.addFilter(vm.cohort, d3.selectAll(".pca-node-selected")[0].map(function(data) {
            //         return data.__data__.id
            //     }));
            //     vm.cohort = "";
            // };


            // Elements
            // var d3Chart = d3.select("#pca-chart").append("svg").attr("id", "chart");
            // var d3xAxis = d3Chart.append("g");
            // var d3yAxis = d3Chart.append("g");
            // var d3Tooltip = d3.select("body").append("div").attr("class", "tooltip pca-tooltip")
            function displayOncoprint(msg)
            {
               $("#onc").empty();
               $("#errorMessage1").empty();
               console.log("entering displayOncoprint");
               
               //console.log("displayOncoprint print recieved msg.payload: %s", msg.payload);
               
               // if(msg.status === "error") {
               //    var errorMessage = JSON.parse(msg.payload);
               //    console.log("***** displayOncoprint error section, msg.payload is ", errorMessage);
               //    $("#errorMessage1").text(errorMessage);
               //    $("#errorMessage1").dialog();
               //    $("#oncoprintInstructions").css("display", "block");
               //    $("#oncoprintControlsDiv").css("display", "none");  
               //    $("#onc").empty();
               //    postStatus("msg.status is error.");
               //  }else{
                 xx = JSON.parse(msg.payload);
                 console.log("displayOncoprint print recieved genes: %s",xx[1]);
                 genes = xx[1];
                 processed_data = JSON.parse(xx[0]);
                 console.log("*****no error report but the processed_data is: ", processed_data);
                 var then = Date.now(); 
                 onc = Oncoprint.create('#onc', {cell_padding: cell_padding, cell_width: cell_width});
                   console.log("Milliseconds to create Oncoprint div: ", Date.now() - then); 
                 onc.suppressRendering();
                   
                 var startGenes = Date.now(); 
                    
                 $.when(processed_data).then(function() {

                    if(typeof(genes) === "string"){
                      genes = [genes];
                     }  
                    tracks_to_load = genes.length;
                    console.log("Number of tracks to load: ", tracks_to_load);

                    var track_id = [];
                    for(i = 0; i < genes.length; i++){
                      var thisGeneStart = Date.now();
                      gene = genes[i];
                
                      var data_gene = processed_data.filter(data_gene_map); 

                      var addTrackStart = Date.now();
                      track_id[i] = onc.addTrack({label: gene, removable:true}, 0);
                      console.log("Milliseconds to addTrack ", gene, " : ", Date.now() - addTrackStart);

                      if(i === 0){
                        onc.setRuleSet(track_id[i], Oncoprint.GENETIC_ALTERATION);
                      }else{
                        onc.useSameRuleSet(track_id[i], track_id[0]);
                      }

                      onc.setTrackData(track_id[i], data_gene, true);
                    }
                    
                  onc.releaseRendering();
                  onc.sort();
                  console.log("Milliseconds to step through processded_data ", Date.now() - startGenes);
                 });    
              //}
               console.log("#######Computing since msg sent took: " + (Date.now() - compute_start) + " milliseconds"); 
               
            } // displaySurvivalCurves
            //------

            // Initialize
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function(response) {
                console.log(vm.datasource);
                console.log(response.payload.rownames);
                var mtx = response.payload.rownames.filter(function(v) {
                    //debugger;
                    return v.indexOf("mtx") >= 0
                });
                console.log("mtx is:",  mtx);

                // Patient Data
                osApi.getPatientHistoryTable(vm.datasource).then(function(response) {
                    //console.log(osApi.getPatientHistoryTable(vm.datasource));
                    rawPatientData = response.payload.tbl;
                    //console.log(rawPatientData);
                    mtx = mtx[mtx.length - 1].replace(".RData", "");
                    osApi.setBusyMessage("Creating Oncoprint");
                    osApi.getPCA(vm.datasource, mtx).then(function() {


                        osApi.setBusyMessage("Loading Gene Sets and Patients");
                        osApi.getGeneSetNames().then(function(response) {

                            // Load Gene Sets
                            vm.geneSetAndPatients = response.payload;
                            vm.geneSetAndPatients = vm.geneSetAndPatients[0];
                            $scope.$watch('vm.geneSetAndPatients', function() {
                                update();
                            });
                            // $scope.$watch('vm.optNodeColor', function() {

                            // });

                        });
                    });
                });
            });
            
            // API Call To oncoprint_data_selection
            var update = function() {
                osApi.setBusyMessage("Calculating Oncoprint");
                var demoOncoString = ["TCGA.02.0001", "TCGA.02.0003", "TCGA.02.0006", "TCGA.02.0007",
                                "TCGA.02.0009", "TCGA.02.0010", "TCGA.02.0011", "TCGA.02.0014",
                                "TCGA.02.0021", "TCGA.02.0024", "TCGA.02.0027", "TCGA.02.0028",
                                "TCGA.02.0033", "TCGA.02.0034", "TCGA.02.0037", "TCGA.02.0038",
                                "TCGA.02.0043", "TCGA.02.0046", "TCGA.02.0047", "TCGA.02.0052",
                                "TCGA.02.0054", "TCGA.02.0055", "TCGA.02.0057", "TCGA.02.0058",
                                "TCGA.02.0060", "TCGA.06.0875", "TCGA.06.0876", "TCGA.06.0877",
                                "TCGA.06.0878", "TCGA.06.0879", "TCGA.06.0881", "TCGA.06.0882",
                                "TCGA.12.0670", "TCGA.12.0818", "TCGA.12.0819", "TCGA.12.0820",
                                "TCGA.12.0821", "TCGA.12.0822", "TCGA.12.0826", "TCGA.12.0827", "EGFR", "PTEN"];
                osApi.getOncoprint(demoOncoString).then(function(response) {
                    console.log(osApi.getOncoprint(demoOncoString));
                    osApi.setBusyMessage("Rendering Oncoprint");
                    var payload = response.payload;
                    console.log("within update function", payload);
                    displayOncoprint();
                    osApi.setBusy(false);
                });
            };

        }
    }
})();
