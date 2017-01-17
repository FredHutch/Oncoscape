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

            var gl = (function() {


                // Renderer
                var renderer = new THREE.WebGLRenderer({ antialias: true });
                renderer.setPixelRatio($window.devicePixelRatio);
                renderer.setSize(500, 560);
                renderer.setClearColor(0xFFFFFF, 1.0);
                renderer.clear();
                angular.element("#scatter-chart").append(renderer.domElement);

                // Raycaster
                var raycaster = new THREE.Raycaster();
                var mouse = new THREE.Vector2();
                var intersects, INTERSECTED;
                var PARTICLE_SIZE = 3;

                // Material
                var material = new THREE.ShaderMaterial({

                    uniforms: {
                        color: { value: new THREE.Color(0xffffff) },
                        texture: { value: new THREE.TextureLoader().load("assets/images/disc.png") }
                    },
                    vertexShader: angular.element('#vertexshader').textContent,
                    fragmentShader: angular.element('#fragmentshader').textContent,
                    alphaTest: 0.3
                });

                // geometry
                var particles;
                var geometry = new THREE.BufferGeometry();

                // Scene
                var scene = new THREE.Scene();

                // Camera
                var camera = new THREE.PerspectiveCamera(45, $window.innerWidth / $window.innerHeight, 1, 10000);
                camera.position.z = 250;

                var controls = new THREE.OrbitControls(camera, renderer.domElement);
                controls.enableDamping = true;
                controls.dampingFactor = 0.25;
                controls.enableZoom = true;

                function animate() {
                    requestAnimationFrame(animate);
                    render();
                }

                // Track mouseunction 
                function onMouseMove(event) {
                    mouse.x = (event.clientX / $window.innerWidth) * 2 - 1;
                    mouse.y = -(event.clientY / $window.innerHeight) * 2 + 1;
                }
                $window.addEventListener('mousemove', onMouseMove, false);

                function onWindowResize() {
                    camera.aspect = $window.innerWidth / $window.innerHeight;
                    camera.updateProjectionMatrix();
                    renderer.setSize($window.innerWidth, $window.innerHeight);
                }
                $window.addEventListener('resize', onWindowResize, false);

                var setData = function(data) {
                    var positions = new Float32Array(data.length * 3);
                    var colors = new Float32Array(data.length * 3);
                    var sizes = new Float32Array(data.length);
                    var color = new THREE.Color();
                    for (var i = 0, l = data.length; i < l; i++) {
                        var si = i * 3;
                        positions[si] = data[i][0];
                        positions[si + 1] = data[i][1];
                        positions[si + 2] = data[i][2];
                        color.setRGB(.5, .5, .5);
                        color.toArray(colors, i * 3);
                        sizes[i] = 200; //PARTICLE_SIZE;
                    }

                    geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
                    geometry.addAttribute('customColor', new THREE.BufferAttribute(colors, 3));
                    geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));

                    particles = new THREE.Points(geometry, material);
                    scene.add(particles);
                    animate();
                }
                var setSelected = function() {
                    // arg ids
                }

                //var selectedColor = new THREE.Color(0xff0000);

                function render() {
                    //                    	particles.rotation.x += 0.0005;
                    //				particles.rotation.y += 0.001;

                    var geometry = particles.geometry;
                    var attributes = geometry.attributes;

                    raycaster.setFromCamera(mouse, camera);

                    intersects = raycaster.intersectObject(particles);

                    if (intersects.length > 0) {

                        if (INTERSECTED != intersects[0].index) {

                            attributes.size.array[INTERSECTED] = PARTICLE_SIZE;

                            INTERSECTED = intersects[0].index;

                            attributes.size.array[INTERSECTED] = PARTICLE_SIZE * 1.25;
                            attributes.size.needsUpdate = true;

                        }

                    } else if (INTERSECTED !== null) {

                        attributes.size.array[INTERSECTED] = PARTICLE_SIZE;
                        attributes.size.needsUpdate = true;
                        INTERSECTED = null;

                    }
                    //     //particles.rotation.x += 0.0005;
                    //     //particles.rotation.y += 0.001;


                    //     raycaster.setFromCamera( mouse, camera );

                    //     intersects = raycaster.intersectObject( particles );

                    //     if (intersects.length>0){
                    //         intersects[0].object.material.color = selectedColor;
                    //     }
                    //     // if ( intersects.length > 0 ) {

                    //     //     if ( INTERSECTED != intersects[ 0 ].index ) {

                    //     //         //attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;

                    //     //         INTERSECTED = intersects[ 0 ].index;

                    //     //         //attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE * 1.25;
                    //     //         //attributes.size.needsUpdate = true;

                    //     //     }

                    //     // } else if ( INTERSECTED !== null ) {

                    //     //     //attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;
                    //     //     //attributes.size.needsUpdate = true;
                    //     //     INTERSECTED = null;

                    //     // }

                    renderer.render(scene, camera);
                }

                return {
                    setData: setData,
                    setSelected: setSelected
                }
            })();



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
                vm.search = "";
                vm.selectColor = function() {};
                vm.deselectColor = function() {};
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


                        draw();
                    });
            });

            // Utility Functions
            function setSelected() {

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


                minMax = data.reduce(function(p, c) {
                    p.xMin = Math.min(p.xMin, c[0]);
                    p.xMax = Math.max(p.xMax, c[0]);
                    p.yMin = Math.min(p.yMin, c[1]);
                    p.yMax = Math.max(p.yMax, c[1]);
                    p.zMin = Math.min(p.zMin, c[2]);
                    p.zMax = Math.max(p.zMax, c[2]);
                    return p;
                }, {
                    xMin: Infinity,
                    yMin: Infinity,
                    zMin: Infinity,
                    xMax: -Infinity,
                    yMax: -Infinity,
                    zMax: -Infinity
                });

                minMax.xMax = Math.max(Math.abs(minMax.xMin), minMax.xMax);
                minMax.xMin = -minMax.xMax;
                minMax.yMax = Math.max(Math.abs(minMax.yMin), minMax.yMax);
                minMax.yMin = -minMax.yMax;
                minMax.zMax = Math.max(Math.abs(minMax.zMin), minMax.zMax);
                minMax.zMin = -minMax.zMax;

                gl.setData(data, minMax);

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
                osApi.onResize.remove(draw);
                osCohortService.onPatientColorChange.remove(onPatientColorChange);
                osCohortService.onCohortChange.remove(onCohortChange);
            });
        }
    }
})();