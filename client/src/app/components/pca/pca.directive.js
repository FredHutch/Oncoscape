(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osPca', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/pca/pca.html',
            controller: PcaController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function PcaController($q, osApi, $state, $stateParams, $timeout, $scope, d3, moment, $window,$http,  _, ML, $) {

            // Loading ...
            osApi.setBusy(true);

            var runType = "JS"

            // Elements
            var d3Chart = d3.select("#pca-chart").append("svg");
            var d3Points = d3Chart.append("g");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            var circles;

            // Add Labels
            d3xAxis.append("text")
                .attr("x", 50)
                .attr("y", 15)
                .text("PC1");


            d3yAxis.append("text")
                .attr("y", 55)
                .attr("x", 25)
                .text("PC2");

            // Properties
            //var clusterCollection = osApi.getDataSource().dataset + "_cluster";
            var scaleX, scaleY, axisX, axisY;
            var data, minMax;
            var width, height;
            var colors = {
                data: [],
                dataset: osApi.getDataSource().dataset,
                name: "None",
                type: "color"
            };
            var acceptableDatatypes = ["expr", "cnv", "mut01", "meth_thd", "meth", "cnv_thd"];
            var NA_runs = []
            

            // View Model Update
            var vm = (function(vm, osApi) {
                vm.loadings = [];
                vm.pc1 = vm.pc2 = [];
                
                vm.showOverlayForm = false;
                vm.datasources= osApi.getDataSources(); 
                vm.datasource = osApi.getDataSource();
                vm.numSamples =0;
                vm.numGenes=0;

                vm.sources = [];
                vm.source = null;

                vm.search = "";
                vm.selectColor = function(e) {
                    var ids = e.values;
                    var allIds = [];
                    d3.selectAll("circle.pca-node").each(function(d) {
                        if (ids.indexOf(d.id) != -1) {
                            d3.select(this).classed("pca-node-selected", true);
                            allIds.push(d.id);
                        } else {
                            if (d3.select(this).classed("pca-node-selected")) allIds.push(d.id);
                        }
                    });
                    osApi.setCohort(allIds, "PCA", osApi.SAMPLE);
                };
                vm.deselectColor = function(e) {
                    var ids = e.values;
                    var allIds = [];
                    d3.selectAll("circle.pca-node").each(function(d) {
                        if (ids.indexOf(d.id) != -1) {
                            d3.select(this).classed("pca-node-selected", false);
                        } else {
                            if (d3.select(this).classed("pca-node-selected")) allIds.push(d.id);
                        }
                    });
                    osApi.setCohort(allIds, "PCA", osApi.SAMPLE);
                };
                vm.runParamsToggle = function() {
                    callPCA(osApi.getGeneset())
                };
                vm.callOverlay = function(){
                    
                    vm.error = ""
                    var geneset = osApi.getGeneset()
                    if (angular.isUndefined(vm.overlay)) return;
                    if (angular.isUndefined(geneset)) return;

                    var common_m = _.intersection(vm.overlay.m, vm.molecular.m)
                    if(common_m.length == 0){
                        angular.element('#modal_intersection').modal();
                        return;
                    }

                    runOverlay(geneset);
                };
                vm.hideModal = function() {
                    angular.element('#modalRun').modal('hide');
                    angular.element('#modal_NArun').modal('hide');
                    angular.element('#modal_intersection').modal('hide');
                };

                return vm;
            })(this, osApi);

            // var state = (function(state, osApi){
            //     state.geneset = vm.geneset
            //     state.cohort = vm.cohort
            //     state.source = vm.source
                
            //     state.update = function(o){
            //         state.geneset = o.geneset
            //         state.cohort = o.cohort
            //         state.source = o.source
            //     }
            //     state.revert = function(){
            //         vm.geneset = state.geneset
            //         vm.cohort = state.cohort
            //         vm.source = state.source
            //     }
            // })(this, osApi);


            // Gene Service Integration
            osApi.onGenesetChange.add(function(geneset) {
                osApi.setBusy(true);
                if(angular.isUndefined(vm.geneSet) | (angular.isDefined(vm.geneSet) && geneset.name != vm.geneSet.name)){
                    callPCA(geneset)
                }
            });

            // Move To Service
            function PCAquery(dataset, genes, samples, molecular_collection, n_components) {
                var payload = { dataset: dataset, genes: genes, samples: samples, molecular_collection: molecular_collection, n_components: n_components };
                return $http({
                    method: 'POST',
                 //   url: "https://dev.oncoscape.sttrcancer.io/cpu/pca",
                    url: "http://localhost:8000/pca",
                    data: payload


                });
            }
            // Move To Service
            function Dquery(collection1, collection2) {
                var payload = { molecular_collection: collection1,molecular_collection2: collection2};
                return $http({
                    method: 'POST',
                 //   url: "https://dev.oncoscape.sttrcancer.io/cpu/pca",
                    url: "http://localhost:8000/distance",
                    data: payload


                });
            }
            function processPCA(d, geneIds, samples){

                console.log("PCA: processing results " + Date())

                // Process PCA Variance
                vm.pc1 = [
                    { name: 'PC1', value: (d.metadata.variance[0] * 100).toFixed(2) },
                    { name: '', value: 100 - (d.metadata.variance[0]*100) }
                ];
                vm.pc2 = [
                    { name: 'PC2', value: (d.metadata.variance[1] *100).toFixed(2) },
                    { name: '', value: 100 - (d.metadata.variance[1] *100) }
                ];


                // Process Scores
                data = d.scores.map(function(v,i) {
                    v.id = samples[i];
                    return v;
                });

                minMax = data.reduce(function(p, c) {
                    p.xMin = Math.min(p.xMin, c[0]);
                    p.xMax = Math.max(p.xMax, c[0]);
                    p.yMin = Math.min(p.yMin, c[1]);
                    p.yMax = Math.max(p.yMax, c[1]);
                    return p;
                }, {
                    xMin: Infinity,
                    yMin: Infinity,
                    xMax: -Infinity,
                    yMax: -Infinity
                });

            }

            // Setup Watches

            $scope.$watch('vm.source', function() {

                if (vm.source === null) return;

                vm.pcaTypes = _.uniq(_.pluck(vm.molecularTables, "name"))
               // vm.pcaTypes = _.uniq(_.pluck(vm.molecularTables.filter(function(d) {return d.source == vm.source}), "type"))
               // vm.pcaTypes = _.intersection(vm.pcaTypes, acceptableDatatypes)

                if (angular.isUndefined(vm.pcaType)) {
                    vm.pcaType = vm.pcaTypes[0];
                } else {
                    var newSource = vm.pcaTypes.filter(function(v) { return (v === vm.pcaType); });
                    vm.pcaType = (newSource.length === 1) ? newSource[0] : vm.pcaTypes[0];
                }
                vm.statePcaType = vm.pcaType
            });
            $scope.$watch('vm.pcaType', function() {

                if (vm.source === null) return;
                
               // vm.geneSet = osApi.getGeneset()
               
               var molecular_matches = vm.molecularTables.filter(function(d){return d.name == vm.pcaType })
                if(molecular_matches.length ==1){
                    vm.molecular = molecular_matches[0]
                    
                }

                var samples = "None";
                if(vm.optRunParams[1].show)
                    samples = osApi.getCohort().sampleIds;
                // determine geneset accessibility for given pcaType
                osApi.getGenesets().filter(function(gs) {return gs.show}).forEach(function(gs){ 
                    var payload = {dataset:vm.datasource.dataset,collection:vm.molecular.collection, geneset:gs.name, samples: samples }
                    //var na_run = _.intersect(NA_runs
                     var na_run = _.where(NA_runs,payload).length > 0 // true if run parameters gives NA result
                    
                    // reactivate disabled genesets not registered as unable to run for given collection name,sample,geneset
                    // or disable active genesets known to not to give result
                    if((gs.disable &  !na_run) | (!gs.disable & na_run)) 
                        osApi.toggleGenesetDisable(gs)
                })


                callPCA(osApi.getGeneset())


            });   
            $scope.$watch('vm.showOverlayForm', function() {
                
                if(!vm.showOverlayForm) return;

                if (angular.isUndefined(vm.overlaySource)) {
                    vm.overlaySource = vm.sources[0];
                } else {
                    var newSource = vm.sources.filter(function(v) { return (v === vm.overlaySource); });
                    vm.overlaySource = (newSource.length === 1) ? newSource[0] : vm.sources[0];
                }

            });
            $scope.$watch('vm.overlaySource', function() {
                
                 if(!vm.showOverlayForm) return;
                 if(typeof vm.overlaySource == "object")
                    vm.overlaySource = vm.overlaySource.name

                 vm.overlayType = null
                osApi.query("lookup_oncoscape_datasources_v2", {
                    dataset: vm.overlaySource
                }).then(function(response){
                    
                    vm.overlay_molecularTables = response.data[0].collections.filter(function(d){ return _.contains(acceptableDatatypes, d.type)})
                    vm.overlayTypes = _.pluck(vm.overlay_molecularTables, "name")
                    

                    if (angular.isUndefined(vm.overlayType)) {
                        vm.overlayType = vm.overlayTypes[0];
                    } else {
                        var newSource = vm.overlayTypes.filter(function(v) { return (v === vm.overlayType); });
                        vm.overlayType = (newSource.length === 1) ? newSource[0] : vm.overlayTypes[0];
                    }
                })
            });
            $scope.$watch('vm.overlayType', function() {
                if (angular.isUndefined(vm.overlaySource)) return;
                if(angular.isUndefined(vm.overlay_molecularTables)) return;
                if(vm.overlayType == null) return;
               
               var molecular_matches = vm.overlay_molecularTables.filter(function(d){return d.name == vm.overlayType })
                if(molecular_matches.length ==1){
                    vm.overlay = molecular_matches[0]
                    
                }

                var samples = "None";
                if(vm.optRunParams[1].show)
                    samples = osApi.getCohort().sampleIds;
                
                // vm.callOverlay()
            
            
            })


            var runOverlay = function(geneset){
                
                
                //var geneIds = _.intersection( _.pluck(vm.overlay_molecular,"id"), geneset.geneIds)
                
                osApi.setBusy(true)
                Dquery(vm.molecular.collection, vm.overlay.collection).then(function(Dresponse) {

                    var d = Dresponse.data;
                    if(angular.isDefined(d.reason)){
                        console.log(vm.molecular.collection +"+ "+vm.overlay.collection+": " + d.reason)
                        // Distance could not be calculated on geneset given current settings
                            window.alert("Sorry, Distance could not be calculated\n" + d.reason)

                        angular.element('#modalRun').modal('hide');
                        osApi.setBusy(false)
                        return;
                    }

                    //distances = _.pluck(d.D,"id")
                    angular.element('#modalRun').modal('hide');
                    var newData = calculateCentroid(d);
                    data = data.concat(newData)
                    draw()
                    // update plot with new points
                });
            }
            var findIndicesOfMax = function(inp, count) {
                var outp = [];
                for (var i = 0; i < inp.length; i++) {
                    outp.push(i); // add index to output array
                    if (outp.length > count) {
                        outp.sort(function(a, b) { return inp[b] - inp[a]; }); // descending sort the output array
                        outp.pop(); // remove the last index (index of smallest element in output array)
                    }
                }
                return outp;
            }

            var calculateCentroid = function(dist){
                //data= {id: overlay sample , d: [distance values], m:[mol_df ids]}
                
                // for each new overlay id, get ids for closest 3
                var num_compare = 3
                
                 var usedColors = _.uniq(_.pluck(data, "color"))
                 var availColors = [ "#E91E63", "#673AB7", "#4CAF50", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B", "#03A9F4", "#03A9F4",
                                     '#004358', '#800080', '#BEDB39', '#FD7400', '#1F8A70', '#B71C1C', '#880E4F', '#4A148C', '#311B92', '#0D47A1', 
                                     '#006064', '#1B5E20'].filter(function(v) { return (usedColors.indexOf(v) == -1); });

                 var top3 = dist.D.map(function(s){ 
                    var indices = findIndicesOfMax(s.d, 3);
                    var match_ids = indices.map(function(i){return s.m[i]})
                    return {id:s.id, match: match_ids}
                //    return {"id":s.id, "match": s.m[]
                //         s.d.sort().slice((-1*num_compare),)
                //             .map(function(maxMatch){return s.m[_.indexOf(s.d,maxMatch)]} )}
                })
                
                
                // find positions in current plot & calculate centroid
                var scores = top3.map(function(s){ 
                    var match_scores = data.filter(function(p){ return _.contains(s.match,p.id)})
                    var cent_scores = [0,0,0]
                    for(var i=0;i<match_scores.length;i++){
                        cent_scores[0] += match_scores[i][0]
                        cent_scores[1] += match_scores[i][1]
                        cent_scores[2] += match_scores[i][2]
                    }
                    var d = cent_scores.map(function(x){ return x/num_compare})
                    d.id = s.id;
                    d.color= availColors[0]

                    return d
                })

                //osApi.setCohort(_.pluck(scores, "id"), "centroid", "SAMPLE")
                return scores;

            }
             var callPCA = function(geneset){

                vm.error = ""
                var samples = [];
                vm.numSamples = vm.molecular.s.length
                vm.numGenes = vm.molecular.m.length;
                
                if(!vm.optRunParams[0].show){
                    geneset = osApi.getGenesets()[0]
                    if(geneset.geneIds.length != 0)
                        vm.numGenes = geneset.geneIds.length
                }
                if(vm.optRunParams[1].show){
                    samples = osApi.getCohort().sampleIds;
                    if(samples.length != 0)
                        vm.numSamples = samples.length
                }
                // if (samples.length === 0) //samples = Object.keys(osApi.getData().sampleMap);
                //     osApi.query(molecular_collection, {"$limit":1}).then(function(response){
                //         debugger;
                //         samples = Object.keys(response.data[0].data)
                //     })
               

                //Check if in Mongo
                
                osApi.query(vm.datasource.dataset +"_cluster", {geneset: geneset.name, disease: vm.datasource.dataset, dataType: "PCA", input:vm.pcaType, scores:{$size:vm.numSamples}}
                ).then(function(response){
                    var d = response.data
                    if(d.length >0){
                        
                        console.log("PCA: retreived from Mongo " + Date())
                        
                        var score_samples = _.pluck(d[0].scores, "id")
                        d[0].scores = d[0].scores.map(function(x){ return x.d})
                        processPCA(d[0], geneset.geneIds, score_samples);
                        draw();
                        return
                    }
                
                
                    if (runType == "JS" & vm.numSamples  * vm.numGenes > 100) {
                        
                        runType = "python"

                        angular.element('#modalRun').modal();
                        // $scope.$apply(function() {
                        //     vm.edgeCounts = getOptRunParams().counts;
                        // });
                        return;
                    }


                    if(runType == "simulate"){
                        var numGenes = [100,200,500,1000, 5000, 10000,15000, 20000, 25000]; var numSamples = [100,200,500];
                        for(var i=0;i<numSamples.length;i++){
                            for(var j=0;j<numGenes.length;j++){
                                console.log("Genes: "+ numGenes[j] + " Samples: "+ numSamples[i])
                                runPCAsimulation(numGenes[j], numSamples[i]);
                            }
                        }

                    }else if(runType == "JS") {
                        if (angular.isUndefined(vm.molecular.collection)) return;
                        if (angular.isUndefined(geneset)) return;
                        osApi.query(vm.molecular.collection
                        ).then(function(response){
                            vm.molecular = response.data

                            runPCA(geneset.geneIds);
                        });
                    }else if(runType == "python") {
                        if (angular.isUndefined(geneset)) return;
                        if (angular.isUndefined(vm.molecular.collection)) return;

                        var geneSetIds = geneset.geneIds
                    

                        osApi.setBusy(true)
                        PCAquery(vm.datasource.dataset, geneSetIds, samples, vm.molecular.collection, 3).then(function(PCAresponse) {

                            var d = PCAresponse.data;
                            if(angular.isDefined(d.reason)){
                                console.log(geneset.name +": " + d.reason)
                                // PCA could not be calculated on geneset given current settings
                                vm.error = d.reason;
                                vm.pcaType = vm.statePcaType
                                //add to blacklist to disable from future selection/calculation
                                osApi.toggleGenesetDisable(geneset);
                                if(samples.length ==0) samples = "None"
                                NA_runs.push({"dataset":vm.datasource.dataset, "collection":vm.molecular.collection, "geneset": geneset.name, "samples":samples})

                                // revert/update display
                                if(angular.isUndefined(vm.geneSet)){
                                    //load geneset anyways - nothing to fall back on
                                    //display null page
                                }else{
                                    //rollback to previous definition
                                    angular.element('#modal_NArun').modal();
                                   // window.alert("Sorry, PCA could not be calculated\n"+ geneset.name +": " + d.reason)
                                    osApi.setGeneset(vm.geneSet)
                                }

                                angular.element('#modalRun').modal('hide');
                                osApi.setBusy(false)
                                return;
                            }

                            vm.geneSet = geneset
                            vm.statePcaType = vm.pcaType
                            runType = "JS"

                            //TO DO:: ### Update result names from oncoscape_wrapper so values -> d, and make variance values into percentages (ie *100)
                            geneSetIds = _.pluck(d.loadings,"id")
                            samples = _.pluck(d.scores,"id")
                            d.scores  = d.scores.map(function(result){ return result.d});
                            angular.element('#modalRun').modal('hide');
                            processPCA(d, geneSetIds, samples);
                            draw();
                        });
                    }
                })

            }

             var runPCAsimulation = function(numGenes, numSamples) {

                var options = {isCovarianceMatrix: false, center : true, scale: false};
                // create 2d array of samples x features (genes)
                var molecular = Array.apply(null, {length: numSamples}).map(function(){ return Array.apply(null, {length: numGenes}).map(Function.call, Math.random)});

                var then = Date.now();
                //console.log("PCA: Running " + Date())
                var d = new ML.Stat.PCA(molecular, options)
                var now = Date.now()
                //console.log("PCA: transforming scores " + Date())
                console.log("Genes: "+ numGenes + " Samples: "+numSamples+ "Diff: " + (now-then)/1000)

             }

             var runPCA = function(geneIds) {

                var options = {isCovarianceMatrix: false, center : true, scale: false};

                // Subset samples to those available in the collection
                var samples = []; var sampleIdx = _.range(0,vm.molecular[0].m.length)
                if(vm.optRunParams[1].show)
                    samples = osApi.getCohort().sampleIds;
                
                if(samples.length !=0){ 
                    sampleIdx = vm.molecular[0].m.map(function(s, i){
                        var matchS = _.contains(samples, s) ? i : -1
                        return matchS})
                }

                // if (samples.length === 0) samples = Object.keys(osApi.getData().sampleMap);
                // samples = samples.filter(function(s){ return _.contains(vm.molecular[0].m,s) })

                //subset geneIds to be only those returned from query
                geneIds = _.intersection( _.pluck(vm.molecular,"id"), geneIds)
                
                var molecular = vm.molecular
                if(geneIds.length != 0){
                    molecular = molecular.filter(function(g){return _.contains(geneIds,g.id)})
                }
                
                // create 2d array of samples x features (genes)
                molecular = molecular.map(function(s){return  s.d.filter(function(r, i){return _.contains(sampleIdx, i)})})
                //var molecular = samples.map(function(s){ return vm.molecular.map(function(g){ return g.m[s]})  })
                //var molecular = response.data.map(function(g){ return samples.map(function(s){ return g.data[s]})  })

                // remove any genes that have NA values
                
                molecular = molecular.filter(function(v){return _.intersection(v, [NaN,"NaN"]).length == 0 })
                
                
                console.log("PCA: Running " + Date())
                //NOTE: If there are null values in molecular, PCA runs in an infinite loop!
                var d = new ML.Stat.PCA(molecular, options)
                console.log("PCA: transforming scores " + Date())
                d.metadata = {}
                d.metadata.variance = d.getExplainedVariance()
                d.loadings = d.getLoadings() // [[PC1 loadings (for coefficients for each gene)], [PC2 loadings], [...#PC = # samples]]

                d.scores = d.predict(molecular)
                // var z = molecular.map(function(m){return jStat.subtract(m, d.means)}) //, scale = Array(d.means.length).fill(1)
                // d.scores = z.map(function(m){ return d.getLoadings().map(function(ev) { return jStat.dot(m, ev)})});

                processPCA(d, geneIds, samples);
                draw();

            }

            var updatePatientCounts = function() {

                angular.element(".legend-count").text("");
                var selectedPatients = osApi.getCohort().sampleIds;

                if (selectedPatients.length === 0)
                   selectedPatients = data.map(function(d){
                    return d.id})

                var counts = data.filter(function(d){return selectedPatients.indexOf(d.id) !== -1}).reduce(function(p, c) {
                    var color = c.color;
                    if (!p.hasOwnProperty(color)) p[color] = 0;
                    p[color] += 1;
                    return p;
                }, {});

                Object.keys(counts).forEach(function(key) {
                    angular.element("#legend-" + key.substr(1)).text(" (" + this[key] + ")");
                }, counts);

            };

            // Utility Functions
            function setSelected() {
                var selectedIds = cohort.sampleIds;
                if(typeof selectedIds != "undefined"){
                   d3Points.selectAll("circle").classed("pca-node-selected", function() {
                        return (selectedIds.indexOf(this.__data__.id) >= 0);
                    });
                }

            }

            function calculatMetrics(){

                // 1. Number, Density, and Separation of Clusters
                //  - k-nearest neighbors
                // data

                // 2. association with clinical features

                // 3. Confidence in positioning of new sample



            }

            function setColors() {

                // Set Legend
                vm.legendCaption = colors.name;
                vm.legendNodes = colors.data;

                // If No Color Specified
                if (colors.name == "None") {
                    vm.legendCaption = "";
                    data.forEach(function(v) {
                        if(angular.isUndefined(v.color)) v.color = '#0096d5';
                    });

                    // Color Based On V
                } else {
                    var degMap = colors.data.reduce(function(p, c) {
                        for (var i = 0; i < c.values.length; i++) {
                            p[c.values[i]] = c.color;
                        }
                        return p;
                    }, {});
                    data = data.map(function(v) {
                        v.color = (angular.isDefined(this[v.id])) ? this[v.id] : "#DDD";
                        return v;
                    }, degMap);
                }
                $timeout(updatePatientCounts);

            }

            var lasso_start = function() {

                lasso.items()
                    .attr("r", 3.5) // reset size
                    .classed("not_possible", true)
                    .classed("selected", false);
            };

            var lasso_draw = function() {


                // Style the possible dots
                lasso.possibleItems()
                    .classed("not_possible", false)
                    .classed("possible", true);

                // Style the not possible dot
                lasso.notPossibleItems()
                    .classed("not_possible", true)
                    .classed("possible", false);
            };

            var lasso_end = function() {

                // Reset the color of all dots
                lasso.items()
                    .classed("not_possible", false)
                    .classed("possible", false);

                var ids = lasso.selectedItems().data().map(function(d) {
                    return d.id;
                });
                osApi.setCohort(ids, "PCA", osApi.SAMPLE);

            };

            var lasso = d3.lasso()
                .closePathSelect(true)
                .closePathDistance(100)
                .targetArea(d3Chart)
                .on("start", lasso_start)
                .on("draw", lasso_draw)
                .on("end", lasso_end);


            function draw() {

                // Colorize
                setColors();


                // Size
                var layout = osApi.getLayout();
                width = $window.innerWidth - layout.left - layout.right;
                height = $window.innerHeight - 120; //10
                angular.element("#pca-chart").css({
                    "width": width + "px",
                    "padding-left": layout.left + "px"
                });

                d3Chart.attr("width", width).attr("height", height);
                d3Points.attr("width", width).attr("height", height);

                // Scale
                scaleX = d3.scaleLinear().domain([minMax.xMin, minMax.xMax]).range([50, width - 50]).nice();
                scaleY = d3.scaleLinear().domain([minMax.yMin, minMax.yMax]).range([50, height - 50]).nice();

                // Draw
                circles = d3Points.selectAll("circle").data(data);
                circles.enter().append("circle")
                    .attr("class", "pca-node")
                    .attr("cx", function(d) {
                        return scaleX(d[0]);
                    })
                    .attr("cy", function(d) {
                        return scaleY(d[1]);
                    })
                    .attr("r", 3)
                    .style("fill", function(d) {
                        return d.color;
                    });

                circles.exit()
                    .transition()
                    .duration(200)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .style("fill-opacity", "0")
                    .remove();
                circles
                    .style("fill", function(d) {
                        return d.color;
                    })
                    .transition()
                    .duration(750)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .attr("r", 3)
                    .attr("cx", function(d) {
                        return scaleX(d[0]);
                    })
                    .attr("cy", function(d) {
                        return scaleY(d[1]);
                    })
                    .style("fill", function(d) {
                        return d.color;
                    })
                    .style("fill-opacity", 0.8);

                // Axis
                axisX = d3.axisTop().scale(scaleX).ticks(3);
                axisY = d3.axisLeft().scale(scaleY).ticks(3);

                d3xAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(0, " + height * 0.5 + ")")
                    .call(axisX);


                d3yAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(" + width * 0.5 + ", 0)")
                    .call(axisY);


                lasso.items(d3Points.selectAll("circle"));
                d3Chart.call(lasso);
                
                setSelected();
                //onCohortChange(osApi.getCohort());
                //onGenesetChange(osApi.getGeneset());
                osApi.setBusy(false);


            }
            
            var tilt_direction = function(item) {
                var left_pos = item.position().left,
                    move_handler = function (e) {
                        if (e.pageX >= left_pos) {
                            item.addClass("right");
                            item.removeClass("left");
                        } else {
                            item.addClass("left");
                            item.removeClass("right");
                        }
                        left_pos = e.pageX;
                    };
                $("html").bind("mousemove", move_handler);
                item.data("move_handler", move_handler);
            }  

            var getOptRunParams = function() {
                
               // if (hasState) return mp.optRunParams;
                return [{
                    name: 'Subselect by Geneset',
                    abv: 'sub_gs',
                    show: true,
                    color: '#9C27B0',
                    class: 'switch-subgeneset',
                    count: '',
                    id: 0
                }, {
                    name: 'Subselect by Cohort',
                    abv: 'sub_ch',
                    show: false,
                    color: '#3F51B5',
                    class: 'switch-subcohort',
                    count: '',
                    id: 1
                }];
            };




            // App Event :: Resize
            osApi.onResize.add(draw);

            // App Event :: Color change
            var onPatientColorChange = function(value) {
                colors = value;
                vm.showPanelColor = false;
                draw();
            };
            osApi.onPatientColorChange.add(onPatientColorChange);

            // App Event :: Cohort Change
            var cohort = osApi.getCohorts();
            var onCohortChange = function(c) {
                cohort = c;
                setSelected();
                if (vm.optRunParams[1].show){
                    callPCA(osApi.getGeneset())
                }

            };
            osApi.onCohortChange.add(onCohortChange);
            osApi.onCohortChange.add(updatePatientCounts)

            // osApi.query("lookup_dataTypes", {
            //     class: {$in : ["expr", "cnv", "mut01", "meth_thd", "meth", "cnv_thd"]},
            //     schema: "hugo_sample"
            // }).then(function(response) {
            //     acceptableDatatypes = _.uniq(_.pluck(response.data, "dataType"))
            // });

            osApi.query("lookup_oncoscape_datasources_v2", {
                dataset: vm.datasource.dataset
            }).then(function(response){
                vm.molecularTables = response.data[0].collections.filter(function(d){ return _.contains(acceptableDatatypes, d.type)})

                vm.optRunParams = getOptRunParams();
                
                
                $( ".kanban-column" ).sortable({
                    connectWith: ".kanban-column",
                    handle: ".portlet-header",
                    cancel: ".portlet-toggle",
                    start: function (event, ui) {
                        ui.item.addClass('tilt');
                        tilt_direction(ui.item);
                    },
                    stop: function (event, ui) {
                        ui.item.removeClass("tilt");
                        $("html").unbind('mousemove', ui.item.data("move_handler"));
                        ui.item.removeData("move_handler");
                    }
                });
                
                
                $( ".portlet" )
                    .addClass( "ui-widget ui-widget-content ui-helper-clearfix ui-corner-all" )
                    .find( ".portlet-header" )
                    .addClass( "ui-widget-header ui-corner-all" )
                    .prepend( "<span class='ui-icon ui-icon-minusthick portlet-toggle'></span>");
                
                $( ".portlet-toggle" ).click(function() {
                    var icon = $( this );
                    icon.toggleClass( "ui-icon-minusthick ui-icon-plusthick" );
                    icon.closest( ".portlet" ).find( ".portlet-content" ).toggle();
                });
    
                vm.sources = [vm.datasource.dataset]  //_.uniq(_.pluck(vm.molecularTables, "source"))
                vm.source = vm.sources[0]
            });





            // Destroy
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(draw);
                osApi.onPatientColorChange.remove(onPatientColorChange);
                osApi.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();
