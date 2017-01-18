(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osScatter', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/scatter/scatter.html',
            controller: ScatterController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function ScatterController($q, osApi, osCohortService, $state, $stateParams, $timeout, $scope, d3, moment, $window, _, THREE) {

            // Loading ...
            osApi.setBusy(true);

            // Elements

            var plot = (function(osApi, el, $window) {

                var data;
                var width, height;
                var svg = el.append('svg');
                var scene1 = new THREE.Scene();
                var scene2 = new THREE.Scene();
                var renderer1 = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                var renderer2 = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                renderer1.setPixelRatio($window.devicePixelRatio);
                renderer2.setPixelRatio($window.devicePixelRatio);


                resize();



                function setData(value) {
                    osApi.setBusy(true);
                    data = value;

                    osApi.setBusy(false);
                }

                function setColors(value) {

                }

                function setSelected() {

                }


                function resize() {

                    var layout = osApi.getLayout();
                    width = $window.innerWidth - layout.left - layout.right;
                    height = $window.innerHeight - 120; //10
                    svg.style("width", width + "px");
                    svg.style("height", "200px");
                    svg.style('background-color', 'rgba(0, 0, 0, 0.1)')
                    renderer1.setSize(Math.floor(width * 0.5), height - 200);
                    renderer2.setSize(Math.floor(width * 0.5), height - 200);

                }

                return {
                    resize: resize,
                    setData: setData,
                    setSelected: setSelected,
                    setColors: setColors
                };
            })(osApi, d3.select(angular.element("#scatter-chart")[0]), $window);

























            // Properties
            var clusterCollection = osApi.getDataSource().disease + "_cluster";
            var data, minMax;
            var width, height;
            var colors = {
                data: [],
                dataset: osApi.getDataSource().disease,
                name: "None",
                type: "color"
            };

            // View Model Update
            var vm = (function(vm, osApi) {
                vm.loadings = [];
                vm.pc1 = vm.pc2 = [];
                vm.datasource = osApi.getDataSource();
                vm.geneSets = [];
                vm.geneSet = null;
                return vm;
            })(this, osApi);

            // Setup Watches
            $scope.$watch('vm.geneSet', function() {
                if (vm.geneSet === null) return;
                vm.sources = vm.geneSet.sources;
                if (angular.isUndefined(vm.source)) {
                    vm.source = vm.sources[0];
                } else {
                    var newSource = vm.sources.filter(function(v) { return (v.name === vm.source.name); });
                    vm.source = (newSource.length === 1) ? newSource[0] : vm.sources[0];
                }
            });
            $scope.$watch('vm.source', function() {
                if (vm.geneSet === null) return;
                vm.pcaTypes = vm.source.types;
                if (angular.isUndefined(vm.pcaType)) {
                    vm.pcaType = vm.pcaTypes[0];
                } else {
                    var newSource = vm.pcaTypes.filter(function(v) { return (v.name === vm.pcaType.name); });
                    vm.pcaType = (newSource.length === 1) ? newSource[0] : vm.pcaTypes[0];
                }
            });
            $scope.$watch('vm.pcaType', function(geneset) {
                if (angular.isUndefined(geneset)) return;

                osApi.query(clusterCollection, {
                        disease: vm.datasource.disease,
                        geneset: vm.geneSet.name,
                        input: vm.pcaType.name,
                        source: vm.source.name
                    })
                    .then(function(response) {

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

                        // Process Loadings
                        var loadings = response.data[0].loadings
                            .map(function(v) {
                                v.max = Math.max.apply(null, v.d.map(function(v) { return Math.abs(v); }));
                                return v;
                            })
                            .sort(function(a, b) {
                                return a.max - b.max;
                            })
                            .slice(0, 50);

                        var scale = d3.scaleLinear()
                            .domain([loadings[loadings.length - 1].max, loadings[0].max])
                            .range([0.1, 1]);


                        vm.loadings = loadings.map(function(v) {
                            return {
                                tip: v.d.reduce(function(p, c) {
                                    p.index += 1;
                                    p.text += "<br>PC" + p.index + ": " + (c * 100).toFixed(2);
                                    return p;
                                }, { text: v.id, index: 0 }).text,
                                value: this(v.max)
                            };
                        }, scale);


                        // Process Scores
                        data = d.scores.map(function(v) {
                            v.d.id = v.id;
                            return v.d;
                        });

                        plot.setData(data);

                    });
            });

            // Utility Functions
            function setSelected() {

            }

            // App Event :: Resize
            osApi.onResize.add(plot.resize);

            // App Event :: Cohort Change
            var cohort = osCohortService.getCohorts();
            var onCohortChange = function(c) {
                cohort = c;
                plot.setSelected(cohort);
            };
            osCohortService.onCohortChange.add(onCohortChange);

            // Load Data
            osApi.query(clusterCollection, {
                dataType: 'PCA',
                $fields: ['input', 'geneset', 'source']
            }).then(function(response) {
                var data = response.data.map(function(v) {
                    return {
                        a: v.geneset,
                        b: v.source,
                        c: v.input
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
                osApi.onResize.remove(plot.resize);
                osCohortService.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();