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
        function PcaController($q, osApi, $state, $stateParams, $timeout, $scope, d3, moment, $window, _) {

            // Loading ...
            osApi.setBusy(true);

            // Elements
            var d3Chart = d3.select("#pca-chart").append("svg");
            var d3Points = d3Chart.append("g");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            var brush;
            var d3Brush = d3Chart.append("g");

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
            var collections = osApi.getDataSource().dataset + "_collections";
            var clusters = osApi.getDataSource().dataset + "_cluster";
            var scaleX, scaleY, axisX, axisY;
            var data;
            var width, height;
            var colors = {
                data: [],
                dataset: osApi.getDataSource().dataset,
                name: "None",
                type: "color"
            };

            // View Model Update
            var vm = (function(vm, osApi) {
                //vm.loadings = [];
                vm.xVals = vm.yVals = [];
                vm.datasource = osApi.getDataSource();
                vm.source = null;
            
                vm.search = "";
                vm.selectColor = function(e) {
                    var ids = e.values;
                    var allIds = [];
                    d3.selectAll("circle").each(function(d) {
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
                    d3.selectAll("circle").each(function(d) {
                        if (ids.indexOf(d.id) != -1) {
                            d3.select(this).classed("pca-node-selected", false);
                        } else {
                            if (d3.select(this).classed("pca-node-selected")) allIds.push(d.id);
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
                // ,osApi.query(clusters, {
                //     name: vm.uid,
                //     m:vm.x_label,
                //     d_type:"loading"
                // }), osApi.query(clusters, {
                //     name: vm.uid,
                //     m:vm.y_label,
                //     d_type:"loading"
                // })
                ]).then(function(responses) {
                        var d = {   x : responses[0].data[0],
                                    y : responses[1].data[0]
                        };
                        // var l = {   x : responses[0].data[0],
                        //             y : responses[1].data[0]
                        // }


                        // Process PCA Variance
                        // TO DO 

                        // Process Loadings
                        // TO DO

                        // var scale = d3.scaleLinear()
                        //     .domain([loadings[loadings.length - 1].max, loadings[0].max])
                        //     .range([0.1, 1]);


                        // vm.loadings = loadings.map(function(v) {
                        //     return {
                        //         tip: v.d.reduce(function(p, c) {
                        //             p.index += 1;
                        //             p.text += "<br>PC" + p.index + ": " + (c * 100).toFixed(2);
                        //             return p;
                        //         }, { text: v.id, index: 0 }).text,
                        //         value: this(v.max)
                        //     };
                        // }, scale);


                        // Process Scores
                        data = []
                        for(var i=0;i<d.x.s.length;i++){
                            data.push({s:d.x.s[i],x: d.x.d[i],y: d.y.d[i]})
                        }
                        
                        // d.x.map(function(p){
                        //     p.x = p.v
                        //     return p;
                        // })
                        // data = d.y.reduce(function(p,c){
                        //     c[c.s == p.s].y = p.v
                        //     return c;
                        // },d.x )

                        
                        


                        draw();
                    });   
                }
            
            

            // Utility Functions
            function setSelected() {
                var selectedIds = cohort.sampleIds;
                d3Points.selectAll("circle").classed("pca-node-selected", function() {
                    return (selectedIds.indexOf(this.__data__.id) >= 0);
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
                        for (var i = 0; i < c.values.length; i++) {
                            p[c.values[i]] = c.color;
                        }
                        return p;
                    }, {});
                    data = data.map(function(v) {
                        v.color = (angular.isDefined(this[v.s])) ? this[v.s] : "#DDD";
                        return v;
                    }, degMap);
                }
            }

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
                d3Brush.attr("width", width).attr("height", height);
                d3Points.attr("width", width).attr("height", height);

                // Scale
                scaleX = d3.scaleLinear().domain([_.min(_.pluck(data, "x")), _.max(_.pluck(data, "x"))]).range([50, width - 50]).nice();
                scaleY = d3.scaleLinear().domain([_.min(_.pluck(data, "y")), _.max(_.pluck(data, "y"))]).range([50, height - 50]).nice();

                // Draw
                var circles = d3Points.selectAll("circle").data(data);
                circles.enter().append("svg:circle")
                    .attr("class", "pca-node")
                    .attr("cx", function(d) {
                        return scaleX(d.x);
                    })
                    .attr("cy", function(d) {
                        return scaleY(d.y);
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
                        return scaleX(d.x);
                    })
                    .attr("cy", function(d) {
                        return scaleY(d.y);
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


                // Brush
                brush = d3.brush()
                    .on("end", function() {

                        if (!d3.event.selection) {
                            osApi.setCohort([], osApi.ALL, osApi.SAMPLE);
                            return;
                        }

                        var bv = d3.event.selection;
                        var xMin = bv[0][0];
                        var xMax = bv[1][0];
                        var yMin = bv[0][1];
                        var yMax = bv[1][1];

                        var ids = d3Points.selectAll("circle").data().filter(function(d) {
                            var x = scaleX(d.x);
                            var y = scaleY(d.y);
                            return (x > xMin && x < xMax && y > yMin && y < yMax);
                        }).map(function(d) {
                            return d.s;
                        });
                        osApi.setCohort(ids, "PCA", osApi.SAMPLE);

                    });

                d3Brush.attr("class", "brush").call(brush);
                onCohortChange(osApi.getCohort());
                osApi.setBusy(false);
            }

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