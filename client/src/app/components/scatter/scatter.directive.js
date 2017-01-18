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
                var clock = new THREE.Clock();
                var color = {
                    difference: "#cbcbcb",
                    eigen: "#cbcbcb",
                    primary: "#FF9800",
                    quaternary: "#f1c40f",
                    quinary: "#2c3e50",
                    secondary: "#673AB7",
                    senary: "#039BE5",
                    shy: "rgba(0, 0, 0, 0.2)",
                    tertiary: "#4CAF50"
                };


                var particles = 500;
                var positions = new Float32Array(particles * 3)
                var shouldUpdate = true;
                var dx = 2;
                var norm = d3.randomNormal(0, 0.7);
                var means = [0, 0, 0];
                var i;
                for (i = 0; i < positions.length; i += 3) {
                    var x = norm(),
                        y = norm(),
                        z = norm();
                    if (i / 3 < particles / 3) x -= 0.5, y += 1, z -= 0.5;
                    else if (i / 3 < particles / 3 * 2) x += dx, y += dx, z += dx;
                    else x -= dx, y -= dx, z -= dx;
                    positions[i] = x, positions[i + 1] = y, positions[i + 2] = z
                    means[0] += x / particles;
                    means[1] += y / particles;
                    means[2] += z / particles;
                }
                for (i = 0; i < positions.length; i += 3) {
                    positions[i] -= means[0];
                    positions[i + 1] -= means[1];
                    positions[i + 2] -= means[2];
                }

                function particleGeometry() {
                    var geometry = new THREE.BufferGeometry()
                    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3))
                    geometry.computeBoundingSphere()
                    return geometry;
                }





                var chartSpin = (function(el, geometry) {

                    // Scene
                    var scene = new THREE.Scene();
                    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                    renderer.setPixelRatio($window.devicePixelRatio);
                    var node = el.node().append(renderer.domElement);
                    var camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
                    camera.setLens(50);
                    camera.matrixAutoUpdate = false;

                    // Material
                    var cloudMat = new THREE.ShaderMaterial({
                        uniforms: {
                            color: {
                                type: 'c',
                                value: new THREE.Color(color.senary)
                            },
                            alpha: { type: 'f', value: 0.4 },
                            pointSize: { type: 'f', value: 10 },
                            shouldResize: { type: '1i', value: 1 }
                        },
                        vertexShader: d3.select('#vertexshader').node().textContent,
                        fragmentShader: d3.select('#fragmentshader').node().textContent,
                        transparent: true
                    });

                    // Particles
                    var particles = new THREE.PointCloud(geometry, cloudMat);
                    scene.add(particles);

                    // Arrows
                    var pc1 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        2.5,
                        new THREE.Color(color.primary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc1);

                    var pc2 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        2.5,
                        new THREE.Color(color.secondary).getHex(),
                        0.5,
                        10
                    );
                    scene.add(pc2);
                    var pc3 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        2.5,
                        new THREE.Color(color.tertiary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc3);

                    // Grid
                    var axisOffset = { x: -2, y: -2, z: -3 };
                    var gridHelper = new THREE.GridHelper(10, 10, 0xBBBBBB, 0xBBBBBB);
                    gridHelper.position.x = axisOffset.x;
                    gridHelper.position.z = axisOffset.y;
                    gridHelper.position.y = axisOffset.z;
                    scene.add(gridHelper);

                    return {
                        scene: scene,
                        renderer: renderer,
                        node: node,
                        camera: camera,
                        particles: particles,
                        pc1: pc1,
                        pc2: pc2,
                        pc3: pc3
                    };

                })(el, particleGeometry());


                var chartDrag = (function(el, geometry) {

                    var layout = osApi.getLayout();
                    width = $window.innerWidth - layout.left - layout.right;
                    height = $window.innerHeight - 30; //10
                    width = Math.floor(width * 0.5);
                    height = height - 255;
                    var xScale = d3.scaleLinear().domain([-10, 10]).range([0, width]);
                    var yScale = d3.scaleLinear().domain([10, -10]).range([0, height]);

                    var scene = new THREE.Scene();
                    var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                    renderer.setPixelRatio($window.devicePixelRatio);
                    var node = el.node().append(renderer.domElement);
                    d3.select(renderer.domElement).style('cursor', 'move');

                    var camera = new THREE.OrthographicCamera(
                        xScale.invert(0), xScale.invert(width),
                        yScale.invert(0), yScale.invert(height),
                        1,
                        100
                    );
                    camera.position.z = 10;

                    var controls = new THREE.OrthographicTrackballControls(camera, renderer.domElement)
                    controls.dynamicDampingFactor = 0.4;
                    controls.noZoom = true;
                    controls.noPan = true;
                    controls.noRoll = true;

                    var cloudMat = new THREE.ShaderMaterial({
                        uniforms: {
                            color: {
                                type: 'c',
                                value: new THREE.Color(color.senary)
                            },
                            alpha: { type: 'f', value: 0.4 },
                            pointSize: { type: 'f', value: 10 },
                            shouldResize: { type: '1i', value: 0 }
                        },
                        vertexShader: d3.select('#vertexshader').node().textContent,
                        fragmentShader: d3.select('#fragmentshader').node().textContent,
                        transparent: true
                    });

                    var particles = new THREE.PointCloud(geometry, cloudMat);
                    scene.add(particles);


                    // Add Arrows
                    var pc1 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        2.5,
                        new THREE.Color(color.primary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc1)
                    var pc2 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        2.5,
                        new THREE.Color(color.secondary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc2)
                    var pc3 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        2.5,
                        new THREE.Color(color.tertiary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc3);

                    return {
                        scene: scene,
                        renderer: renderer,
                        node: node,
                        camera: camera,
                        particles: particles,
                        controls: controls,
                        pc1: pc1,
                        pc2: pc2,
                        pc3: pc3
                    };
                })(el, particleGeometry());


                var chart2d = (function(el, geometry) {


                    var layout = osApi.getLayout();
                    width = $window.innerWidth - layout.left - layout.right;
                    height = $window.innerHeight - 30; //10
                    width = Math.floor(width * 0.5);
                    height = height - 255;
                    var xScale = d3.scaleLinear().domain([-10, 10]).range([0, width]);
                    var yScale = d3.scaleLinear().domain([10, -10]).range([0, height]);


                    var svg = el.append('svg');
                    var xTicks = xScale.ticks(5),
                        yTicks = yScale.ticks(5);

                    var xAxis = d3.svg.axis().scale(xScale).tickValues(xTicks);
                    var yAxis = d3.svg.axis().scale(yScale).orient('left').tickValues(yTicks);
                    var xAxisG = svg.append('g')
                        .call(xAxis)
                        .attr('transform', 'translate(' + [0, yScale.range()[1]] + ')');

                    xAxisG.append('text')
                        .attr('transform', 'translate(' + [d3.mean(xScale.range()), 35] + ')')
                        .attr('text-anchor', 'middle')
                        .style('font-size', 12)
                        .text('pc1')
                        .style('fill', color.primary)



                })(el, geometry);




                function float32ArrayToVec3Array(arr) {
                    var res = [];
                    for (var i = 0; i < arr.length; i += 3) {
                        res[i / 3] = new THREE.Vector3(arr[i], arr[i + 1], arr[i + 2])
                    }
                    return res;
                }






                var rotY = 0;
                var didDrawOriginalPoints = false

                function update() {
                    requestAnimationFrame(update)

                    rotY += 25 * Math.PI / 180 * clock.getDelta();

                    var cameraPosOffset = new THREE.Matrix4();
                    cameraPosOffset.setPosition(new THREE.Vector3(0, 0, 25));

                    var cameraRot = new THREE.Matrix4();
                    cameraRot.makeRotationFromEuler(new THREE.Euler(0, rotY, 0, 'XYZ'));

                    var cameraMat = new THREE.Matrix4();
                    cameraMat.multiplyMatrices(cameraRot, cameraPosOffset);

                    var cameraPosCenter = new THREE.Matrix4()
                    cameraMat = cameraPosCenter.multiplyMatrices(cameraPosCenter, cameraMat)

                    chartSpin.camera.matrix = cameraMat;
                    chartSpin.camera.updateMatrixWorld(true);
                    chartSpin.renderer.render(chartSpin.scene, chartSpin.camera);

                    chartDrag.controls.update();
                    chartDrag.camera.updateMatrixWorld(true);

                    // Orient Arrows
                    var pc1Dir = new THREE.Vector3(1, 0, -9 / 11).unproject(chartDrag.camera);
                    var pc2Dir = new THREE.Vector3(0, 1, -9 / 11).unproject(chartDrag.camera);
                    chartSpin.pc1.setDirection(pc1Dir.clone().normalize());
                    chartSpin.pc1.setLength(4, 1, 0.5);
                    chartSpin.pc2.setDirection(pc2Dir.clone().normalize());
                    chartSpin.pc2.setLength(4, 1, 0.5);
                    chartSpin.pc3.setDirection(chartDrag.camera.position.clone().normalize());
                    chartSpin.pc3.setLength(4, 1, 0.5);
                    chartDrag.pc1.setDirection(pc1Dir.clone().normalize());
                    chartDrag.pc1.setLength(4, 1, 0.5);
                    chartDrag.pc2.setDirection(pc2Dir.clone().normalize());
                    chartDrag.pc2.setLength(4, 1, 0.5);
                    chartDrag.pc3.setDirection(chartDrag.camera.position.clone().normalize());
                    chartDrag.pc3.setLength(4, 1, 0.5);
                    chartDrag.renderer.render(chartDrag.scene, chartDrag.camera);

                    if (!shouldUpdate) return;


                }

                update();
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
                    height = $window.innerHeight - 30; //10
                    svg.style("position", "absolute");
                    svg.style("top", height - 200 + "px");
                    svg.style("left", layout.left + "px");
                    svg.style("width", width + "px");
                    svg.style("height", "160px");
                    svg.style('background-color', 'rgba(0, 0, 0, 0.1)')
                    width = Math.floor(width * 0.5);
                    height = height - 255;
                    chartSpin.camera.aspect = width / height;
                    chartSpin.renderer.setSize(width, height);
                    chartDrag.camera.left = width / -2;
                    chartDrag.camera.right = width / 2;
                    chartDrag.camera.top = height / 2;
                    chartDrag.camera.bottom = height / -2;
                    chartDrag.camera.near = 1;
                    chartDrag.camera.far = 100;
                    chartDrag.renderer.setSize(width, height);
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