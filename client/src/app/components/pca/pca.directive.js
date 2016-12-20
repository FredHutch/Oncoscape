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
        function PcaController($q, osApi, osCohortService, $state, $stateParams, $timeout, $scope, d3, moment, $window, _) {

            // Loading ...
            osApi.setBusy(true);

            // Elements
            var d3Chart = d3.select("#pca-chart").append("svg");
            var d3Points = d3Chart.append("g");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            var brush;
            var d3Brush = d3Chart.append("g");

            // Properties
            var scaleX, scaleY, axisX, axisY;
            var data, minMax;
            var width, height;
            var colors = {
                data: [],
                dataset: osApi.getDataSource().disease,
                name: "None",
                type: "color"
            };

            // View Model
            var vm = (function(vm, osApi) {
                vm.datasource = osApi.getDataSource();
                vm.geneSets = [];
                vm.geneSet = null;
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
                    osCohortService.setCohort(allIds, "PCA", osCohortService.SAMPLE);
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
                    osCohortService.setCohort(allIds, "PCA", osCohortService.SAMPLE);
                };
                return vm;
            })(this, osApi);

            // Setup Watches
            $scope.$watch('vm.geneSet', function() {
                if (vm.geneSet === null) return;
                vm.sources = vm.geneSet.sources;
                vm.source = vm.sources[0];
            });
            $scope.$watch('vm.source', function() {
                if (vm.geneSet === null) return;
                vm.pcaTypes = vm.source.types;
                vm.pcaType = vm.pcaTypes[0];
            });
            $scope.$watch('vm.pcaType', function(geneset) {
                if (angular.isUndefined(geneset)) return;
                osApi.query("render_pca", {
                        disease: vm.datasource.disease,
                        geneset: vm.geneSet.name,
                        type: vm.pcaType.name,
                        source: vm.source.name
                    })
                    .then(function(response) {
                        vm.pc1 = response.data[0].pc1;
                        vm.pc2 = response.data[0].pc2;
                        var keys = Object.keys(response.data[0].data);
                        data = keys.map(function(key) {
                            this.data[key].id = key;
                            return this.data[key];
                        }, {
                            data: response.data[0].data
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

                        minMax.xMax = Math.max(Math.abs(minMax.xMin), minMax.xMax);
                        minMax.xMin = -minMax.xMax;
                        minMax.yMax = Math.max(Math.abs(minMax.yMin), minMax.yMax);
                        minMax.yMin = -minMax.yMax;

                        draw();
                    });
            });

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
                axisX = d3.axisTop().scale(scaleX).ticks(5);
                axisY = d3.axisLeft().scale(scaleY).ticks(5);

                d3xAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(0, " + scaleY(0) + ")")
                    .call(axisX)
                    .append("text")
                    .attr("x", 50)
                    .attr("y", 15)
                    .text("PC1");

                d3yAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(" + scaleX(0) + ", 0)")
                    .call(axisY)
                    .append("text")
                    .attr("y", 55)
                    .attr("x", 25)
                    .text("PC2");

                // Brush
                brush = d3.brush()
                    .on("end", function() {

                        if (!d3.event.selection) {
                            osCohortService.setCohort([], osCohortService.ALL, osCohortService.SAMPLE);
                            return;
                        }

                        var bv = d3.event.selection;
                        var xMin = bv[0][0];
                        var xMax = bv[1][0];
                        var yMin = bv[0][1];
                        var yMax = bv[1][1];

                        var ids = d3Points.selectAll("circle").data().filter(function(d) {
                            var x = scaleX(d[0]);
                            var y = scaleY(d[1]);
                            return (x > xMin && x < xMax && y > yMin && y < yMax);
                        }).map(function(d) {
                            return d.id;
                        });
                        osCohortService.setCohort(ids, "PCA", osCohortService.SAMPLE);

                    });

                d3Brush.attr("class", "brush").call(brush);
                onCohortChange(osCohortService.getCohort());
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
            osCohortService.onPatientColorChange.add(onPatientColorChange);

            // App Event :: Cohort Change
            var cohort = osCohortService.getCohorts();
            var onCohortChange = function(c) {
                cohort = c;
                setSelected();
            };
            osCohortService.onCohortChange.add(onCohortChange);

            // Initialize
            var pcaScores = vm.datasource.calculated.filter(function(v) { return v.type == "pcaScores"; });


            osApi.query("render_pca", {
                    disease: vm.datasource.disease,
                    $fields: ['type', 'geneset', 'source']
                })
                .then(function(response) {
                    var data = response.data.map(function(v) {
                        return {
                            a: v.geneset,
                            b: v.source,
                            c: v.type
                        };
                    });

                    var result = _.reduce(data, function(memo, val) {
                        var tmp = memo;
                        _.each(val, function(fldr) {
                            if (!_.has(tmp, fldr)) {
                                tmp[fldr] = {};
                            }
                            tmp = tmp[fldr];
                        });
                        return memo;
                    }, {});

                    vm.geneSets = Object.keys(result).map(function(geneset) {
                        return {
                            name: geneset,
                            sources: Object.keys(result[geneset]).map(function(source) {
                                return {
                                    name: source,
                                    types: Object.keys(result[geneset][source]).map(function(type) {
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
            $scope.$on('$destroy', function() {
                osApi.onResize.remove(draw);
                osCohortService.onPatientColorChange.remove(onPatientColorChange);
                osCohortService.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();