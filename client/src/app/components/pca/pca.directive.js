(function () {
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
            var clusterCollection = osApi.getDataSource().disease + "_cluster";
            var scaleX, scaleY, axisX, axisY;
            var data, minMax;
            var width, height;
            var colors = {
                data: [],
                dataset: osApi.getDataSource().disease,
                name: "None",
                type: "color"
            };

            // View Model Update
            var vm = (function (vm, osApi) {
                vm.loadingsPc1 = vm.loadingsPc2 = vm.loadingsPc3 = [];
                vm.pc1 = vm.pc2 = [];
                vm.datasource = osApi.getDataSource();
                vm.geneSets = [];
                vm.geneSet = null;
                vm.search = "";
                vm.selectColor = function (e) {
                    var ids = e.values;
                    var allIds = [];
                    d3.selectAll("circle").each(function (d) {
                        if (ids.indexOf(d.id) != -1) {
                            d3.select(this).classed("pca-node-selected", true);
                            allIds.push(d.id);
                        } else {
                            if (d3.select(this).classed("pca-node-selected")) allIds.push(d.id);
                        }
                    });
                    osApi.setCohort(allIds, "PCA", osApi.SAMPLE);
                };
                vm.deselectColor = function (e) {
                    var ids = e.values;
                    var allIds = [];
                    d3.selectAll("circle").each(function (d) {
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
            $scope.$watch('vm.geneSet', function () {
                if (vm.geneSet === null) return;
                vm.sources = vm.geneSet.sources;
                if (angular.isUndefined(vm.source)) {
                    vm.source = vm.sources[0];
                } else {
                    var newSource = vm.sources.filter(function (v) { return (v.name === vm.source.name); });
                    vm.source = (newSource.length === 1) ? newSource[0] : vm.sources[0];
                }
            });
            $scope.$watch('vm.source', function () {
                if (vm.geneSet === null) return;
                vm.pcaTypes = vm.source.types;
                if (angular.isUndefined(vm.pcaType)) {
                    vm.pcaType = vm.pcaTypes[0];
                } else {
                    var newSource = vm.pcaTypes.filter(function (v) { return (v.name === vm.pcaType.name); });
                    vm.pcaType = (newSource.length === 1) ? newSource[0] : vm.pcaTypes[0];
                }
            });
            $scope.$watch('vm.pcaType', function (geneset) {
                if (angular.isUndefined(geneset)) return;
                osApi.query(clusterCollection, {
                    disease: vm.datasource.disease,
                    geneset: vm.geneSet.name,
                    input: vm.pcaType.name,
                    source: vm.source.name
                })
                    .then(function (response) {

                        var d = response.data[0];

                        // Process PCA Variance
                        vm.pc1 = [
                            { name: 'PC1', value: d.metadata.variance[0] },
                            { name: '', value: 100 - d.metadata.variance[0] }
                        ];
                        vm.pc2 = [
                            { name: 'PC2', value: d.metadata.variance[1] },
                            { name: '', value: 100 - d.metadata.variance[1] }
                        ];
                        vm.pc3 = [
                            { name: 'PC3', value: d.metadata.variance[2] },
                            { name: '', value: 100 - d.metadata.variance[2] }
                        ];

                        // Process Loadings
                        var loadings = response.data[0].loadings
                            .map(v => ({ tip: v.id + ' = ' + v.d[0], value: v.d[0] }))
                            .sort(function (a, b) {
                                return b.value - a.value;
                            })
                            .slice(0, 200);
                        var scale = d3.scaleLinear()
                            .domain([loadings[loadings.length - 1].value, loadings[0].value])
                            .range([0.1, 1]);
                        for (var i = 0; i < loadings.length; i++) {
                            loadings[i].value = scale(loadings[i].value);
                        }
                        vm.loadingsPc1 = loadings;

                        var loadings = response.data[0].loadings
                            .map(v => ({ tip: v.id + ' = ' + v.d[1], value: v.d[1] }))
                            .sort(function (a, b) {
                                return b.value - a.value;
                            })
                            .slice(0, 200);
                        var scale = d3.scaleLinear()
                            .domain([loadings[loadings.length - 1].value, loadings[0].value])
                            .range([0.1, 1]);
                        for (var i = 0; i < loadings.length; i++) {
                            loadings[i].value = scale(loadings[i].value);
                        }
                        vm.loadingsPc2 = loadings;

                        var loadings = response.data[0].loadings
                        .map(v => ({ tip: v.id + ' = ' + v.d[2], value: v.d[2] }))
                        .sort(function (a, b) {
                            return b.value - a.value;
                        })
                        .slice(0, 200);
                    var scale = d3.scaleLinear()
                        .domain([loadings[loadings.length - 1].value, loadings[0].value])
                        .range([0.1, 1]);
                    for (var i = 0; i < loadings.length; i++) {
                        loadings[i].value = scale(loadings[i].value);
                    }
                    vm.loadingsPc3 = loadings;


                        // Process Scores
                        data = d.scores.map(function (v) {
                            v.d.id = v.id;
                            return v.d;
                        });

                        minMax = data.reduce(function (p, c) {
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


                        draw();
                    });
            });

            // Utility Functions
            function setSelected() {
                var selectedIds = cohort.sampleIds;
                d3Points.selectAll("circle").classed("pca-node-selected", function () {
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
                    data.forEach(function (v) {
                        v.color = '#0096d5';
                    });

                    // Color Based On V
                } else {
                    var degMap = colors.data.reduce(function (p, c) {
                        for (var i = 0; i < c.values.length; i++) {
                            p[c.values[i]] = c.color;
                        }
                        return p;
                    }, {});
                    data = data.map(function (v) {
                        v.color = (angular.isDefined(this[v.id])) ? this[v.id] : "#DDD";
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
                scaleX = d3.scaleLinear().domain([minMax.xMin, minMax.xMax]).range([50, width - 50]).nice();
                scaleY = d3.scaleLinear().domain([minMax.yMin, minMax.yMax]).range([50, height - 50]).nice();

                // Draw
                var circles = d3Points.selectAll("circle").data(data);
                circles.enter().append("svg:circle")
                    .attr("class", "pca-node")
                    .attr("cx", function (d) {
                        return scaleX(d[0]);
                    })
                    .attr("cy", function (d) {
                        return scaleY(d[1]);
                    })
                    .attr("r", 3)
                    .style("fill", function (d) {
                        return d.color;
                    });
                circles.exit()
                    .transition()
                    .duration(200)
                    .delay(function (d, i) {
                        return i / 300 * 100;
                    })
                    .style("fill-opacity", "0")
                    .remove();
                circles
                    .style("fill", function (d) {
                        return d.color;
                    })
                    .transition()
                    .duration(750)
                    .delay(function (d, i) {
                        return i / 300 * 100;
                    })
                    .attr("r", 3)
                    .attr("cx", function (d) {
                        return scaleX(d[0]);
                    })
                    .attr("cy", function (d) {
                        return scaleY(d[1]);
                    })
                    .style("fill", function (d) {
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
                    .on("end", function () {

                        if (!d3.event.selection) {
                            osApi.setCohort([], osApi.ALL, osApi.SAMPLE);
                            return;
                        }

                        var bv = d3.event.selection;
                        var xMin = bv[0][0];
                        var xMax = bv[1][0];
                        var yMin = bv[0][1];
                        var yMax = bv[1][1];

                        var ids = d3Points.selectAll("circle").data().filter(function (d) {
                            var x = scaleX(d[0]);
                            var y = scaleY(d[1]);
                            return (x > xMin && x < xMax && y > yMin && y < yMax);
                        }).map(function (d) {
                            return d.id;
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
            var onPatientColorChange = function (value) {
                colors = value;
                vm.showPanelColor = false;
                draw();
            };
            osApi.onPatientColorChange.add(onPatientColorChange);

            // App Event :: Cohort Change
            var cohort = osApi.getCohorts();
            var onCohortChange = function (c) {
                cohort = c;
                setSelected();
            };
            osApi.onCohortChange.add(onCohortChange);


            osApi.query(clusterCollection, {
                dataType: 'PCA',
                $fields: ['input', 'geneset', 'source']
            }).then(function (response) {
                var data = response.data.map(function (v) {
                    return {
                        a: v.geneset,
                        b: v.source,
                        c: v.input
                    };
                });
                var result = _.reduce(data, function (memo, val) {
                    var tmp = memo;
                    _.each(val, function (fldr) {
                        if (!_.has(tmp, fldr)) {
                            tmp[fldr] = {};
                        }
                        tmp = tmp[fldr];
                    });
                    return memo;
                }, {});

                vm.geneSets = Object.keys(result).map(function (geneset) {
                    return {
                        name: geneset,
                        sources: Object.keys(result[geneset]).map(function (source) {
                            return {
                                name: source,
                                types: Object.keys(result[geneset][source]).map(function (type) {
                                    return {
                                        name: type
                                    };
                                })
                            };
                        })
                    };
                });
                vm.geneSet = vm.geneSets[0];
            });

            // Destroy
            $scope.$on('$destroy', function () {
                osApi.onResize.remove(draw);
                osApi.onPatientColorChange.remove(onPatientColorChange);
                osApi.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();