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
        function PcaController($q, osApi, osWidget, $state, $stateParams, $timeout, $scope, d3, moment, $window, _) {

            // Loading ...
            osApi.setBusy(true);
            
            // Properties
            var collections = osApi.getDataSource().dataset + "_collections";
            var clusters = osApi.getDataSource().dataset + "_cluster";
            var data;
            var width, height;
            var colors;
            var x_label = "", y_label="";

            // View Model Update
            var vm = (function(vm, osApi) {
                
                vm.datasource = osApi.getDataSource();
                vm.source = null;
                vm.cohorts = osApi.getCohorts();
                vm.cohort = osApi.getCohort();
            
                vm.selectColor = function(e) {
                    var ids = e.s;
                    var allIds = [];
                    d3.selectAll("circle").each(function(d) {
                        if (ids.indexOf(d.s) != -1) {
                            d3.select(this).classed("pca-node-selected", true);
                            allIds.push(d.s);
                        } else {
                            if (d3.select(this).classed("pca-node-selected")) allIds.push(d.s);
                        }
                    });
                    osApi.setCohort(allIds, "PCA", osApi.SAMPLE);
                };
                vm.deselectColor = function(e) {
                    var ids = e.s;
                    var allIds = [];
                    d3.selectAll("circle").each(function(d) {
                        if (ids.indexOf(d.s) != -1) {
                            d3.select(this).classed("pca-node-selected", false);
                        } else {
                            if (d3.select(this).classed("pca-node-selected")) allIds.push(d.s);
                        }
                    });
                    osApi.setCohort(allIds, "PCA", osApi.SAMPLE);
                };
                return vm;
            })(this, osApi);

            // Setup Watches
            $scope.$watch('vm.source', function() {
                if (vm.source === null) return;
                vm.names = _.pluck(vm.data.filter(function(d){return(d.s == vm.source)}), "n");
                if (angular.isUndefined(vm.name)) {
                    vm.name = vm.default_cluster.n
                } else {
                    var newSource = vm.names.filter(function(v) { return (v === vm.name); });
                    vm.name = (newSource.length === 1) ? newSource[0] : vm.names[0];
                }
            });
            $scope.$watch('vm.name', function() {
                if (vm.source === null) return;
                vm.genesets = _.pluck(vm.data.filter(function(d){return(d.s == vm.source & d.n ==vm.name)}), "g");
                if (angular.isUndefined(vm.geneset)) {
                    vm.geneset = vm.default_cluster.g
                } else {
                    var newSource = vm.genesets.filter(function(v) { return (v === vm.geneset); });  // is existing geneset definition available
                    if(newSource.length === 1){ 
                        vm.uid = vm.data.filter(function(d){return(d.s == vm.source & d.n ==vm.name & d.g==vm.geneset)})[0].u
                        getData() }
                    else { vm.genesets[0]}
                }                
            });
            $scope.$watch('vm.geneset', function() {
                if (angular.isUndefined(vm.geneset)) return;
                vm.uid = vm.data.filter(function(d){return(d.s == vm.source & d.n ==vm.name & d.g==vm.geneset)})[0].u
                vm.x_label = "PC1"; vm.y_label = "PC2"
                getData()
            });

            // Cohort edit
            vm.setCohort = function(cohort) {
                if (angular.isString(cohort)) {
                    osApi.setCohort([], osApi.ALL, osApi.SAMPLE);
                } else {
                    osApi.setCohort(cohort);
                }
            };

            vm.updateCohort = function() {
                if (vm.cohort.type == "UNSAVED") {
                    osApi.saveCohort(vm.cohort);
                } else {
                    osApi.deleteCohort(vm.cohort);
                }
            };

            function getData(){
                Promise.all([osApi.query(clusters, {
                    name: vm.uid,
                    m:vm.x_label,
                    d_type:"score"
                }), osApi.query(clusters, {
                    name: vm.uid,
                    m:vm.y_label,
                    d_type:"score"
                })
                ,osApi.query(clusters, {
                    name: vm.uid,
                    m:vm.x_label,
                    d_type:"loading"
                }), osApi.query(clusters, {
                    name: vm.uid,
                    m:vm.y_label,
                    d_type:"loading"
                }),
                osApi.query(clusters, {
                    name: vm.uid,
                    d_type:"score",
                    $fields : ["m", "var_percent"]
                })
                ]).then(function(responses) {
                        var d = {   x : responses[0].data[0],
                                    y : responses[1].data[0]
                        };
                        var l = {   x : responses[2].data[0],
                                    y : responses[3].data[0]
                        }
                        
                        // Process PCA Variance
                        var pv = responses[4].data.map(function(p){
                            return {x: +p.m.substr(2), y:p.var_percent, label: p.m}
                        }).sort(function(a,b){
                            if(a.x < b.x) return -1
                            if(a.x > b.x) return 1
                            return 0
                        })
                        

                        // Process Loadings
                        // 1. Sort PC1 and PC2 loadings
                        // 2. Get top/bottom # gene ids from each PC
                        // 3. For each top gene, add [PC1, PC2] to InputMtx

                        function sortByV(a,b){
                            if(a.v < b.v) return -1;
                            if(a.v > b.v) return 1;
                            return 0;
                        }
                        var numTopGenes = 5
                        var sorted_x = l.x.d.sort(sortByV)
                        var sorted_y = l.y.d.sort(sortByV)

                        var topGenes =_.uniq(_.union( _.pluck(sorted_x.slice(0,numTopGenes), "s"), 
                                                 _.pluck(sorted_x.slice(Math.max(sorted_x.length - numTopGenes, 1)),"s"),
                                                 _.pluck(sorted_y.slice(0,numTopGenes), "s"),
                                                 _.pluck(sorted_y.slice(Math.max(sorted_y.length - numTopGenes, 1)), "s")
                                                ))
                        var inputMtx = []; 
                        var labels = {col: [vm.x_label,vm.y_label], row:topGenes}
                        for(var i=0;i<topGenes.length;i++){
                            inputMtx.push([l.x.d.filter(function(d){return d.s == topGenes[i]})[0].v,
                                           l.y.d.filter(function(d){return d.s == topGenes[i]})[0].v
                            ])
                        }

                        // Process Scores
                        data = d.x.d.map(function(a){ return({s:a.s, x : a.v})})
                        d.y.d.reduce(function(p,c){
                            p.filter(function(r){return r.s== c.s})[0].y = c.v
                            return p;
                        }, data)
                        
                        var samples = _.pluck(d.x.d, "s")
                        var pts = osApi.getData().sampleMap.filter(function(m){return _.contains(samples, m.s)})
                                                            .map(function(d){return d.pt})
                                                            .filter(function(item, i, ar) { return ar.indexOf(item) === i; }); // Remove Dups
                        
                        osApi.setCohortToolInfo({ 'numSamples': samples.length, 'numPatients': pts.length });    
                        
                        draw();
                        drawLoadings(inputMtx, labels);
                        drawScreePlot(pv)
                    });   
                }
            
            

            // Utility Functions
            function draw() {
            
                // Colorize
                setColors();

                var layout = osApi.getLayout()
                var options = {
                    layout: layout,
                    width : $window.innerWidth - layout.left - layout.right,
                    height : $window.innerHeight - 120 ,//10
                    container : "pca-chart",
                    html : "#pca-chart",
                    data: data,
                    labels : {x:x_label, y:y_label},
                    nodeClass : "pca-node"
                }

                osWidget.makeScatterPlot(options)
                osApi.setBusy(false)
                

            }
            function drawScreePlot(data){

                var labels = {
                    x: "Principle Component",
                    y: "Variance Explained"
                }
                data.map(function(d){
                    d.x = d.label
                    return d
                })

                var options = {
                    title: "Scree Plot (Percent Variance Explained)",
                    container : 'screeplot',
                    html : '#screeplot',
                    f: "Bar Plot",
                    data      : data.slice(0,10),
                    labels    : {x:"", y:""},
                    color : '#0096d5',
                    margin: {top: 10, right: 10, bottom: 35, left: 30},
                    width: 200,
                    height: 100,
                    domain :{ x : [0,10], y: [0, d3.max(data, function(d) { return d.y; })+2]}
                }
               
                osApi.addSuppFigure(options)
               // osWidget.getLinePlot(options);
               //osWidget.makeBarPlot(options);
            }
            function drawLoadings(inputMatrix, labels){
              
                var options = {
                    title:      "Top Ranked Loadings",
                    container : 'loadings',
                    html :      '#loadings',
                    f: "Matrix",
                    data      : inputMatrix,
                    labels    : labels,
                    start_color : '#ffffff',
                    end_color : '#e67e22',
                    margin : {top: 5, right: 30, bottom: 25, left: 60},
                    width: 75,
                    height: 200
                }
                osApi.addSuppFigure(options)
                // osWidget.makeColoredMatrix();
            }

            // App Event :: Resize
            osApi.onResize.add(draw);

            var updatePatientCounts = function() {

                angular.element(".legend-count").text("");
                var selectedPatients = osApi.getCohort().sampleIds;

                if (selectedPatients.length === 0)
                   selectedPatients = data.map(function(d){
                    return d.s})

                var counts = data.filter(function(d){return selectedPatients.indexOf(d.s) !== -1}).reduce(function(p, c) {
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
                var selectedIds = vm.cohort.sampleIds;
                d3.selectAll("circle").classed("pca-node-selected", function() {
                    return (selectedIds.indexOf(this.__data__.s) >= 0);
                });
            }

            function setColors() {

                // Set Legend
                vm.legendCaption = colors.name;
                vm.legendNodes = colors.data;

                // If No Color Specified
                if (colors.name == "None") {
                    vm.legendCaption = "";
                    data.forEach(function(v) {
                        v.color = '#0096d5';
                    });

                    // Color Based On V
                } else {
                    var degMap = colors.data.reduce(function(p, c) {
                        for (var i = 0; i < c.s.length; i++) {
                            p[c.s[i]] = c.color;
                        }
                        return p;
                    }, {});
                    data = data.map(function(v) {
                        v.color = (angular.isDefined(this[v.s])) ? this[v.s] : "#DDD";
                        return v;
                    }, degMap);
                }
                $timeout(updatePatientCounts);
            }
            // App Event :: Color change
            var updateColors = function(value) {
                colors = value;
                draw();
            };
            osApi.onPatientColorChange.add(updateColors);

            // App Event :: Cohort Change
            var onCohortChange = function(c) {
                vm.cohort = c;
                setSelected();
                updatePatientCounts()
            };
            osApi.onCohortChange.add(onCohortChange);
            
            osApi.query(collections, {
                m_type: 'PCA',
                d_type: 'score',
                $fields: ['name', 'params', 'version', 'default', 'source']
            }).then(function(response) {
                vm.data = response.data.map(function(v) {
                    return {
                        u: v.name,
                        v: v.version,
                        g: v.params.geneset,
                        c: v.params.collection,
                        s: v.source,
                        d: v.default,
                        n: v.params.collection_name
                    };
                });
                vm.default_cluster = vm.data.filter(function(d){return d.d})
                if(vm.default_cluster.length == 0){
                    vm.default_cluster = vm.data[0]
                }
                vm.sources = _.unique(_.pluck(vm.data, "s"))
                vm.source = vm.default_cluster.s
                colors = {
                    data: [],
                    dataset: osApi.getDataSource().dataset,
                    name: "None",
                    type: "color"
                };
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