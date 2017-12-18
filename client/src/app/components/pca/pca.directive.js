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
        function PcaController($q, osApi, $state, $stateParams, $timeout, $scope, d3, moment, $window,$http,  _, ML, $log) {

            // helper functions -> move to service?
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
            function calculatMetrics(){

                // 1. Number, Density, and Separation of Clusters
                //  - k-nearest neighbors
                // data

                // 2. association with clinical features

                // 3. Confidence in positioning of new sample

            }
            var transpose = function( a){
                return Object.keys(a[0]).map(function(c) {
                    return a.map(function(r) { return r[c]; });
                });
            }

            // Loading ...
            osApi.setBusy(true);

            var runType = "JS"

            // Elements
            var d3Chart = d3.select("#pca-chart").append("svg");
            var d3Points = d3Chart.append("g");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            var circles;
            var lines;
            var edges=[];

            var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
                d3.selectAll("line.pca-edge").each(function(e){
                    // if(_.contains([e.source.id, e.target.id], d.id))
                    //     d3.select(this).classed("pca-edge-hover",true)
                    // else d3.select(this).classed("pca-edge-hover",false)
                    if(_.contains([e.source.id, e.target.id], d.id))
                        d3.select(this).style("stroke-width",2*e.target.w)
                    else d3.select(this).style("stroke-width",0)
                })
                
                return "ID: " + d.id
            });
            d3Chart.call(elTip);

            // Properties
            var scaleX, scaleY, axisX, axisY;
            var data, minMax;
            var width, height;
            var colors = {
                data: [],
                name: "Dataset"
            };
            var acceptableDatatypes = ["expr", "cnv", "mut01", "meth_thd", "meth", "cnv_thd"];
            
            var NA_runs = []
            

            // View Model Update
            var vm = (function(vm, osApi) {
                vm.runTime = 10
                vm.availableBaseMethods = ["PCA"]
                vm.availableDistanceMetrics = ["Pearson Correlation"]
                vm.availableOverlayMethods = ["Centroid"]
                vm.availableEdgeOptions = ["Centroid Neighbors"]
                vm.edgetype = vm.availableEdgeOptions[0]

                vm.temp = {
                    title: "",
                    method: vm.availableBaseMethods[0],
                    source: osApi.getDataSource(),
                    data: {types:[],selected:{i:-1, name:""}},
                    params: {bool: {
                        Geneset: {use: true, name:""},
                        Cohort: {use: false, name:""} }},
                    meta: {numGenes:0, numSamples:0},
                    result : {input:{}, output: {}},
                    edit: false
                }
                vm.overlay = [ ]
                
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
                vm.hideModal = function() {
                    angular.element('#modalRun').modal('hide');
                    angular.element('#modal_NArun').modal('hide');
                    angular.element('#modal_intersection').modal('hide');
                };
                vm.copyBase = function(){
                    vm.base.edit = !vm.base.edit

                    if(vm.base.edit){
                      vm.temp = {
                          title: vm.base.title,
                          method: vm.base.method,  
                          result : {input : {}},
                          meta :{},
                          color : vm.base.color,
                          visibility: "visible"
                      }
                      vm.temp.source = {dataset: vm.base.source.dataset}
                      vm.temp.data = {  types:vm.base.data.types,
                                        selected:{
                                            i: vm.base.data.selected.i,
                                            name:vm.base.data.selected.name}}
                      vm.temp.params = {bool: {
                        Geneset: {use: true, name:osApi.getGeneset().name},
                        Cohort: {use: false, name:osApi.getCohort().name} }}
                      
                        updateOptions()
                    }
                    
                }
                vm.setBase = function(){
                    vm.base = _.clone(vm.temp)
                    vm.base.edit = false
                    vm.temp = null
                    vm.overlay = [ ]
                }
                vm.updateBaseview = function(){
                    if(vm.base.edit){
                        vm.callBaseMethod();
                        vm.overlay.forEach(function(d){
                            osApi.setBusy(true)
                            d.result.output = {}
                            d.edit = true
                            //vm.callOverlayMethod(d)
                            //draw()
                        })
                    }
                    else{
                        vm.base.visibility = vm.base.visibility == "visible" ? "hidden" : "visible"
                        draw()
                    }

                }
                vm.callBaseMethod = function(){
                    
                    osApi.setBusy(true)
                    vm.temp.data.selected.i = _.findIndex(vm.temp.data.types, {"name": vm.temp.data.selected.name})
                    
                    vm.temp.meta.numSamples = vm.temp.data.types[vm.temp.data.selected.i].s.length
                    vm.temp.meta.numGenes = vm.temp.data.types[vm.temp.data.selected.i].m.length;
                    
                    // determine calculation size for gene x samples matrix 
                    // depending on use of geneset or cohort settings
                    if(vm.temp.params.bool.Geneset.use){
                        var geneset = osApi.getGeneset()
                        if(geneset.geneIds.length != 0)
                            vm.temp.meta.numGenes = geneset.geneIds.length
                    }
                    if(vm.temp.params.bool.Cohort.use){
                        var samples = osApi.getCohort().sampleIds;
                        if(samples.length != 0){
                            vm.temp.meta.numSamples = samples.length
                            // TO DO: intersect with samples from mtx to ensure sufficient overlap & size
                        }
                    }
    
                    if(vm.temp.method == "PCA"){
                        var inDB = false
                        if(vm.temp.source.source == "TCGA"){
                           inDB= checkDB()
                        } else callPCA()
                       
                    }
                        
                }


                vm.copyItem = function(item){
                    
                    var usedColors = _.uniq(_.pluck(vm.overlay, "color"))
                    var availColors = [ "#E91E63", "#673AB7", "#4CAF50", "#CDDC39", "#FFC107", "#FF5722", "#795548", "#607D8B", "#03A9F4", "#03A9F4",
                                        '#004358', '#800080', '#BEDB39', '#FD7400', '#1F8A70', '#B71C1C', '#880E4F', '#4A148C', '#311B92', '#0D47A1', 
                                        '#006064', '#1B5E20'].filter(function(v) { return (usedColors.indexOf(v) == -1); });

                    // edit/create item in history 
                    if(typeof item == "undefined"){
                        var filtered_types = vm.base.data.types.filter(function(v){ return v.type == vm.base.data.types[vm.base.data.selected.i].type})
                        var filtered_i = _.findIndex(filtered_types, {name:vm.base.data.selected.name})
                       item =  {
                            title: "",
                            method: {distance: vm.availableDistanceMetrics[0], overlay: vm.availableOverlayMethods[0]},
                            source: osApi.getDataSource(),
                            data: { types:  filtered_types,
                                    selected: { i: filtered_i, 
                                                name:vm.base.data.selected.name}
                                    },
                            params: {bool: { 
                                "Geneset" : {name: vm.base.params.bool.Geneset.name, use: vm.base.params.bool.Geneset.use},
                                "Cohort"  : {name: vm.base.params.bool.Cohort.name, use: vm.base.params.bool.Cohort.use} }             
                            },
                            meta: {numGenes:0, numSamples:0},
                            result : {input:{}, output: {}},
                            edit: false,
                            idx: vm.overlay.length,
                            color: availColors[0],
                            visibility: "visible"
                        }
                        item.title = "Overlay  (" + moment().format('hh:mm:ss') + ")";
                        
                        vm.overlay.push(item)
                    }
                    item.edit = !item.edit

                    // prep for running new overlay
                    if(item.edit){
                      vm.temp = {
                          title: item.title,
                          method: item.method,  
                          result : {input : {}},
                          meta :{},
                          idx: item.idx,
                          color: item.color,
                          visibility: "visible"
                      }
                      vm.temp.method.overlay = item.method.overlay
                      vm.temp.method.distance = item.method.distance
                      vm.temp.source = {dataset: item.source.dataset}
                      vm.temp.data = {  types:item.data.types,
                                        selected:{
                                            i: item.data.selected.i,
                                            name:item.data.selected.name}}
                      
                      vm.temp.params = {bool: {
                        Geneset: {use: true, name:osApi.getGeneset().name},
                        Cohort: {use: false, name:osApi.getCohort().name} }}
                      
                    } else{
                        //check if item was run
                        if(angular.isUndefined(item.result.output.length))
                            // item was not run, remove from processed history
                            vm.overlay.splice(item.idx, 1)
                    }
                    
                }
                vm.updateItemview = function(item){
                    
                     if(item.edit){
                        osApi.setBusy(true);
                         vm.callOverlayMethod(item);
                     }
                    else{
                        item.visibility = item.visibility == "visible" ? "hidden" : "visible"
                        draw()
                    }
                }

                vm.callOverlayMethod = function(item){
                    item.data.selected.i = _.findIndex(item.data.types, {"name": item.data.selected.name})
                    osApi.setBusy(true)
                    callOverlay(item.idx);
                }
                


                vm.exportJSON = function(){
                    var header = "data:text/plain;charset=utf-8,";
                   // var json = JSON.stringify(vm.base.result.output)
                    
                    var doc = {
                            title: vm.base.title, 
                            disease: vm.base.source.dataset,
                            input: vm.base.data.selected.name, 
                            dataType: vm.base.method, 
                            geneset: vm.base.params.bool.Geneset.name, 
                            metadata: {variance: [parseFloat(vm.base.meta.pc1[0].value), parseFloat(vm.base.meta.pc2[0].value)]}
                            }
                    
                   doc.scores = vm.base.result.output.map(function(scores){
                    
                       return {id: scores.id, d: scores.slice(0,3)}
                    
                    }); 
                    // var encodedUri = encodeURI(csvContent);
                    // window.open(encodedUri);
                    
                    // var encodedUri = encodeURI(header + JSON.stringify(doc));
                    var encodedUri = encodeURI(header + angular.toJson(doc));
                    var link = document.createElement("a");
                    link.setAttribute("href", encodedUri);
                    link.setAttribute("download", "pca.json");
                    document.body.appendChild(link); // Required for FF
                    
                    link.click()
                    document.body.removeChild(link);
                }

                return vm;
            })(this, osApi);

            // Update Geneset When Datasource Changes
            osApi.onGenesetChange.add(function() {
                if(vm.base.edit)
                    vm.temp.params.bool.Geneset.name = osApi.getGeneset().name;
            });

            // Service
            function PCAquery(dataset, genes, samples, molecular_collection, n_components) {
                var payload = { dataset: dataset, genes: genes, samples: samples, molecular_collection: molecular_collection, n_components: n_components };
                return $http({
                    method: 'POST',
                    url: "https://dev.oncoscape.sttrcancer.io/cpu/pca",
                    //url: "http://localhost:8000/pca",
                    data: payload
                });
            }
            function Distancequery(collection1, collection2, geneIds) {
                var payload = { molecular_collection: collection1,molecular_collection2: collection2, genes:geneIds};
                return $http({
                    method: 'POST',
                 url: "https://dev.oncoscape.sttrcancer.io/cpu/distance",
                 // url: "http://localhost:8000/distance",
                    data: payload


                });
            }

            
            // Setup Parameter Configurations
            var updateOptions = function(){
                
                var samples = []
                if(vm.temp.params.bool.Cohort.use)
                    samples = osApi.getCohort().sampleIds
                if(samples.length ==0) samples = "None"

                // determine geneset accessibility for given pcaType
                osApi.getGenesets().filter(function(gs) {return gs.show}).forEach(function(gs){ 
                    var payload = {
                        dataset:vm.temp.source.dataset,
                        collection:vm.temp.data.types[vm.temp.data.selected.i].collection, 
                        geneset:gs.name, 
                        samples: samples }
                    
                    var na_run = _.where(NA_runs,payload).length > 0 // true if run parameters gives NA result
                    
                    // reactivate disabled genesets not registered as unable to run for given collection name,sample,geneset
                    // or disable active genesets known to not to give result
                    if((gs.disable &  !na_run) | (!gs.disable & na_run)) 
                        osApi.toggleGenesetDisable(gs)
                })

            }; 
            
            var checkDB = function(){
                var geneset =  vm.temp.params.bool.Geneset.use ? osApi.getGeneset() : osApi.getGenesetAll();

                //Check if in Mongo
                osApi.query(vm.temp.source.dataset +"_cluster", 
                {   geneset: geneset.name, 
                    disease: vm.temp.source.dataset, 
                    dataType: "PCA", 
                    input:vm.temp.data.selected.name,
                    scores:{$size:vm.temp.meta.numSamples}}
                ).then(function(response){
                    var d = response.data
                    if(d.length >0){
                        
                        $log.log("PCA: retreived from Mongo " + Date())
                        
                        var score_samples = _.pluck(d[0].scores, "id")
                        d[0].scores = d[0].scores.map(function(x){ return x.d})
                        processPCA(d[0], geneset.geneIds, score_samples);
                        draw();
                        return true
                    }
                    callPCA()
                })
            }

            var callPCA = function(){

                vm.error = ""

                var geneset =  vm.temp.params.bool.Geneset.use ? osApi.getGeneset() : osApi.getGenesetAll();
                
                if (runType == "JS" & vm.temp.meta.numSamples  * vm.temp.meta.numGenes > 50000) {
                    
                    runType = "python"

                    angular.element('#modalRun').modal();
                    return;
                }
                if(runType == "simulate"){
                    var numGenes = [100,200,500,1000, 5000, 10000,15000, 20000, 25000]; var numSamples = [100,200,500];
                    for(var i=0;i<numSamples.length;i++){
                        for(var j=0;j<numGenes.length;j++){
                            $log.log("Genes: "+ numGenes[j] + " Samples: "+ numSamples[i])
                            runPCAsimulation(numGenes[j], numSamples[i]);
                        }
                    }

                }else if(runType == "JS") {
                    var query = {}
                    if(geneset.geneIds.length >0){
                        query = {'m': {$in: geneset.geneIds}}
                    }
                    osApi.query(vm.temp.data.types[vm.temp.data.selected.i].collection, query
                    ).then(function(response){
                        vm.temp.result.input = response.data
                        runPCA();
                    });
                }else if(runType == "python") {
                    
                    var geneSetIds = geneset.geneIds
                    var samples = [];
                    if(vm.temp.params.bool.Cohort.use)
                        samples = osApi.getCohort().sampleIds;

                    osApi.setBusy(true)
                    PCAquery(vm.temp.source.dataset, geneSetIds, samples, vm.temp.data.types[vm.temp.data.selected.i].collection, 3)
                    .then(function(PCAresponse) {

                        var d = PCAresponse.data;
                        if(angular.isDefined(d.reason)){
                            $log.log(geneset.name +": " + d.reason)
                            // PCA could not be calculated on geneset given current settings
                            vm.error = d.reason;
                            
                            // return to previous state
                            
                            //add to blacklist to disable from future selection/calculation
                            osApi.toggleGenesetDisable(geneset);
                            if(samples.length ==0) samples = "None"
                            NA_runs.push({"dataset":vm.temp.source.dataset, "collection":vm.temp.data.types[vm.temp.data.selected.i].collection, "geneset": geneset.name, "samples":samples})

                            // revert/update display
                            //if previous state not defined
                                //load geneset anyways - nothing to fall back on
                                //display null page
                            //else
                                //rollback to previous definition
                                angular.element('#modal_NArun').modal();
                                //osApi.setGeneset(vm.geneSet)
                            //}

                            angular.element('#modalRun').modal('hide');
                            osApi.setBusy(false)
                            return;
                        }


                        // Successful run: 
                        //---update temp method
                        //vm.geneSet = geneset
                        runType = "JS"

                        //---update plot
                        geneSetIds = _.pluck(d.loadings,"id")
                        samples = _.pluck(d.scores,"id")
                        d.scores  = d.scores.map(function(result){ return result.d});
                        angular.element('#modalRun').modal('hide');
                        processPCA(d, geneSetIds, samples);
                        draw();
                    });
                }

            }

            var runPCAsimulation = function(numGenes, numSamples) {

                var options = {isCovarianceMatrix: false, center : true, scale: false};
                // create 2d array of samples x features (genes)
                var molecular = Array.apply(null, {length: numSamples}).map(function(){ return Array.apply(null, {length: numGenes}).map(Function.call, Math.random)});

                var then = Date.now();
                //$log.log("PCA: Running " + Date())
                new ML.Stat.PCA(molecular, options)
                var now = Date.now()
                //$log.log("PCA: transforming scores " + Date())
                $log.log("Genes: "+ numGenes + " Samples: "+numSamples+ "Diff: " + (now-then)/1000)

            }

            var runPCA = function() {

                osApi.setBusy(true)
                var options = {isCovarianceMatrix: false, center : true, scale: false};

                // Subset samples to those available in the collection
                var samples = []; 
                var sampleIdx = _.range(0,vm.temp.result.input[0].s.length)
                
                if(vm.temp.params.bool.Cohort.use)
                    samples = osApi.getCohort().sampleIds;
                
                if(samples.length ==0){
                    samples = vm.temp.result.input[0].s
                } else{ 
                    sampleIdx = vm.temp.result.input[0].s.map(function(s, i){
                        var matchS = _.contains(samples, s) ? i : -1
                        return matchS})
                }
                

                var geneIds = _.pluck(vm.temp.result.input,"m")
                if(vm.temp.params.bool.Geneset.use && osApi.getGeneset().geneIds.length >0)
                    geneIds = _.intersection( osApi.getGeneset().geneIds, geneIds);
                    //subset geneIds to be only those returned from Geneset (except when geneset == All Genes)
                
                if(geneIds.length == 0){ //genes in data don't overlap with specified geneset
                    angular.element('#modal_intersection').modal();
                    vm.temp.result.output = {}
                    osApi.setBusy(false)
                    return;
                
                } else{
                    vm.temp.result.input = vm.temp.result.input.filter(function(g){return _.contains(geneIds,g.m)})
                }
                
                // create 2d array of samples x features (genes)
                var molecular = vm.temp.result.input.map(function(s){return  s.d.filter(function(r, i){return _.contains(sampleIdx, i)})})
                
                // remove any genes that have NA values
                molecular = molecular.filter(function(v){return _.intersection(v, [NaN,"NaN"]).length == 0 })
                
                molecular = transpose(molecular)
                
                $log.log("PCA: Running " + Date())
                //NOTE: If there are null values in molecular, PCA runs in an infinite loop!
                var d = new ML.Stat.PCA(molecular, options)
                $log.log("PCA: transforming scores " + Date())
                d.metadata = {}
                d.metadata.variance = d.getExplainedVariance()
                d.loadings = d.getLoadings() // [[PC1 loadings (for coefficients for each gene)], [PC2 loadings], [...#PC = # samples]]
                d.scores = d.predict(molecular)
                
                processPCA(d, geneIds, samples);
                draw();

            }
            var processPCA = function(d, geneIds, samples){
                
                    $log.log("PCA: processing results " + Date())
    
                    vm.setBase()

                    // Process PCA Variance
                    vm.base.meta.pc1 = [
                        { name: 'PC1', value: (d.metadata.variance[0] * 100).toFixed(2) },
                        { name: '', value: 100 - (d.metadata.variance[0]*100) }
                    ];
                    vm.base.meta.pc2 = [
                        { name: 'PC2', value: (d.metadata.variance[1] *100).toFixed(2) },
                        { name: '', value: 100 - (d.metadata.variance[1] *100) }
                    ];
    
                    // Process Scores
                    d.scores = d.scores.map(function(v,i) {
                        v.id = samples[i];
                        v.layer = -1
                        return v;
                    });
                    vm.base.result.output = d.scores
    
                    
            };

            var editOverlayMethod = function(){
                var newSource;
                if (angular.isUndefined(vm.overlaySource)) {
                    vm.overlaySource = vm.sources[0];
                } else {
                    newSource = vm.sources.filter(function(v) { return (v === vm.overlaySource); });
                    vm.overlaySource = (newSource.length === 1) ? newSource[0] : vm.sources[0];
                }

            
                if(typeof vm.overlaySource == "object")
                    vm.overlaySource = vm.overlaySource.name

                vm.overlayType = null
                var response = osApi.getDataSources()
                
                    vm.overlay_molecularTables = response.collections.filter(function(d){ return _.contains(acceptableDatatypes, d.type)})
                    vm.overlayTypes = _.pluck(vm.overlay_molecularTables, "name")

                    if (angular.isUndefined(vm.overlayType)) {
                        vm.overlayType = vm.overlayTypes[0];
                    } else {
                        newSource = vm.overlayTypes.filter(function(v) { return (v === vm.overlayType); });
                        vm.overlayType = (newSource.length === 1) ? newSource[0] : vm.overlayTypes[0];
                    }
            
                var molecular_matches = vm.overlay_molecularTables.filter(function(d){return d.name == vm.overlayType })
                if(molecular_matches.length ==1){
                    vm.overlay = molecular_matches[0]  
                }

                var samples = "None";
                if(vm.temp.params.bool.Cohort.use)
                    samples = osApi.getCohort().sampleIds;
                
            }

            var callOverlay = function(i){
                
                vm.error = ""
                osApi.setBusy(true)
                var common_m = _.intersection(vm.overlay[i].data.types[vm.overlay[i].data.selected.i].m, vm.base.data.types[vm.base.data.selected.i].m)
                if(vm.base.params.bool.Geneset.use){
                    var gIds = osApi.getGenesets().filter(function(g){return g.name == vm.base.params.bool.Geneset.name})[0].geneIds
                    if(gIds.length >0 )
                        common_m = _.intersection(common_m, gIds)
                }
                    
                if(common_m.length == 0){
                    angular.element('#modal_intersection').modal();
                    vm.overlay[i].result.output = {}
                    osApi.setBusy(false)
                    return;
                }

                runOverlay(i);
            };
            var runOverlay = function(i){
                
                var geneset = vm.base.params.bool.Geneset
                var gIds = []
                if(geneset.use)
                    gIds = osApi.getGenesets().filter(function(g){return g.name == geneset.name})[0].geneIds
                
                osApi.setBusy(true)
                Distancequery(vm.base.data.types[vm.base.data.selected.i].collection, vm.overlay[i].data.types[vm.overlay[i].data.selected.i].collection, gIds).then(function(response) {

                    var d = response.data;
                    if(angular.isDefined(d.reason)){
                        $log.log(vm.base.data.types[vm.base.data.selected.i].collection +"+ "+vm.overlay[i].data.types[vm.overlay[i].data.selected.i].collection+": " + d.reason)
                        // Distance could not be calculated on geneset given current settings
                            $window.alert("Sorry, Distance could not be calculated\n" + d.reason)

                        vm.overlay[i].result.output = {}
                        angular.element('#modalRun').modal('hide');
                        osApi.setBusy(false)
                        return;
                    }

                    //distances = _.pluck(d.D,"id")
                    angular.element('#modalRun').modal('hide');
                    var newData = calculateCentroid(d);
                    
                    
                    newData = newData.map(function(d){                  
                        d.layer= i
                        return d
                    })

                    //set overlay
                    vm.overlay[i].result.input = d.D
                    vm.overlay[i].result.output = newData
                    vm.overlay[i].edit = false

                    draw()
                    // update plot with new points
                });
            }
            
            var calculateCentroid = function(dist){
                //data= {id: overlay sample , d: [distance values], m:[mol_df ids]}
                
                // for each new overlay id, get ids for closest 3
                var num_compare = 3
                
    
                 var top3 = dist.D.map(function(s){ 
                    var indices = findIndicesOfMax(s.d, num_compare);
                    var match_ids = indices.map(function(i){return s.m[i]})
                    var weights = indices.map(function(i){return Math.abs(s.d[i])})
                    return {id:s.id, match: match_ids, w:weights}
                //    return {"id":s.id, "match": s.m[]
                //         s.d.sort().slice((-1*num_compare),)
                //             .map(function(maxMatch){return s.m[_.indexOf(s.d,maxMatch)]} )}
                })
                
                
                // find positions in current plot & calculate centroid
                var add = function(a,b){ return a + b}
                var scores = top3.map(function(s){ 
                    var match_scores = vm.base.result.output.filter(function(p){ return _.contains(s.match,p.id)})
                    match_scores.sort(function(a, b){ return s.match.indexOf(a.id) - s.match.indexOf(b.id) })
                    var cent_scores = [0,0,0]
                    var weight_sum = s.w.reduce( add, 0)
                    for(var i=0;i<match_scores.length;i++){
                        cent_scores[0] += s.w[i]/weight_sum * match_scores[i][0]
                        cent_scores[1] += s.w[i]/weight_sum * match_scores[i][1]
                        cent_scores[2] += s.w[i]/weight_sum * match_scores[i][2]
                        match_scores[i].w = s.w[i]/weight_sum
                    }
                    var d = cent_scores
                    d.id = s.id;
                    d.match = match_scores
                    return d
                })

                return scores;

            }

            var draw = function() {

                data = vm.base.result.output
                edges = []
                for(var i =0; i<vm.overlay.length; i++){
                    if(angular.isDefined(vm.overlay[i].result.output.length)){
                        data = data.concat(vm.overlay[i].result.output)
                        // var sourcetarget = vm.overlay[i].result.output.map(function(d){
                        //     return d.match.vals.map(function(v){
                        //         return {source:{x:d[0],y:d[1]},target:{x:v[0],y:v[1]}}
                        //     })
                            
                        // })
                        var sourcetarget = _.flatten( vm.overlay[i].result.output.map(function(d){
                            return d.match.map(function(v){
                                return {source:d, target:v} })  }) )
                        edges = edges.concat(sourcetarget)
                    }
                }
                

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
                    })
                    .style("visibility", function(d){ return d.visibility})
                    .on("mouseover", elTip.show)
                    .on("mouseout", elTip.hide);

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
                    .style("fill-opacity", 0.8)
                    .style("visibility", function(d){ return d.visibility});

                lines = d3Points.selectAll("line").data(edges);
                lines.enter().append("line")
                        .attr("class", "pca-edge")
                        .attr("id",function(d,i) {return 'edge'+i})
                        .attr("x1", function(d) { 
                            return scaleX(d.source[0])})
                        .attr("y1", function(d) { 
                            return scaleY(d.source[1])})
                        .attr("x2", function(d) { 
                            return scaleX(d.target[0])})
                        .attr("y2", function(d) { 
                            return scaleY(d.target[1])})
                        .style("pointer-events", "none");
                lines.exit()
                    .remove();

                // Axis
                axisX = d3.axisTop().scale(scaleX).ticks(3);
                axisY = d3.axisLeft().scale(scaleY).ticks(3);

                d3xAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(0, " + height * 0.5 + ")")
                    .call(axisX)
                    .append("text")
                    .attr("x", 50)
                    .attr("y", 15)
                    .text("PC1");

                d3yAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(" + width * 0.5 + ", 0)")
                    .call(axisY)
                    .append("text")
                    .attr("y", 55)
                    .attr("x", 25)
                    .text("PC2");

                lasso.items(d3Points.selectAll("circle"));
                d3Chart.call(lasso);
                
                setSelected();
                osApi.setBusy(false);

            }
              
   
            
            // Utility Functions
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
            function setSelected() {
                var selectedIds = osApi.getCohort().sampleIds
                
                if(typeof selectedIds != "undefined"){
                   d3Points.selectAll("circle").classed("pca-node-selected", function() {
                        return (selectedIds.indexOf(this.__data__.id) >= 0);
                    });
                }

            }
            function setColors() {

                // Set Legend
                vm.legendCaption = colors.name;
                vm.legendNodes = colors.data;

                // If No Color Specified
                if (colors.name == "Dataset") {
                    vm.legendNodes = [
                    {name: vm.base.title, color: vm.base.color, values: vm.base.result.output.map(function(d){ return d.id }), id: "legend-"+vm.base.color.substr(1)}   ]
                    vm.legendNodes = vm.legendNodes.concat(
                        vm.overlay.map(function(r) {
                            return angular.isUndefined(r.result.output.length) ?
                                null
                             :  {name: r.title, color: r.color, values: r.result.output.map(function(d){ return d.id }), id: "legend-"+r.color.substr(1)}}) 
                            .filter(function(r){return r != null})
                        )
                   
                    data.forEach(function(v) {
                            if(v.layer == -1){ v.color = vm.base.color }
                            else { v.color = vm.overlay[v.layer].color} })

                // Color Based On selected input
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
            
                data.forEach(function(v) {
                    if(v.layer == -1){ v.visibility = vm.base.visibility }
                    else { v.visibility = vm.overlay[v.layer].visibility}
                });
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
            var onCohortChange = function() {
                setSelected();
            };
            osApi.onCohortChange.add(onCohortChange);
            osApi.onCohortChange.add(updatePatientCounts)


            osApi.query(osApi.getDataSource().dataset+"_collections", {
            }).then(function(response){
                vm.temp.method = "PCA"
                vm.temp.title = vm.temp.method + "  (" + moment().format('hh:mm:ss') + ")";
                vm.temp.data.types = response.data.filter(function(d){ return _.contains(acceptableDatatypes, d.type)})
                vm.temp.data.selected.i = 0;
                vm.temp.data.selected.name = vm.temp.data.types[vm.temp.data.selected.i].name;
                vm.temp.params.bool = { "Geneset" : {name: osApi.getGeneset().name, use: true},
                                        "Cohort"  : {name: osApi.getCohort().name, use: false } } 
                vm.temp.color = '#0096d5' 
                vm.temp.visibility = "visible"           
                
                vm.callBaseMethod();
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
