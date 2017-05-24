

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
        function ScatterController($q, osApi, $state, $stateParams, $timeout, $scope, d3, moment, $window, signals, _, THREE) {

            // Loading ...
            osApi.setBusy(true);

            // Colors
            var color = {
                difference: "#cbcbcb",
                eigen: "#cbcbcb",
                primary: "#FF9800",
                quaternary: "#f1c40f",
                quinary: "#2c3e50",
                secondary: "#673AB7",
                senary: "#039BE5",
                shy: "rgba(0, 0, 0, 0.2)",
                tertiary: "#4CAF50",
                rollover: "#FF0000"
            };

            function float32ArrayToVec3Array(arr) {
                var res = [];
                for (var i = 0; i < arr.length; i += 3) {
                    res[i / 3] = new THREE.Vector3(arr[i], arr[i + 1], arr[i + 2]);
                }
                return res;
            }

            // VM
            var vm = this;
            vm.loadings = vm.pc1 = vm.pc2 = vm.layouts = [];
            vm.optAutoRotate = true;



            // VM Watch
            var onLayout = $scope.$watch("vm.layout", function(layout) {
                if (angular.isUndefined(layout)) return;
                osApi.setBusy(true);
                osApi.query(osApi.getDataSource().disease + "_cluster", {
                        disease: vm.datasource.disease,
                        geneset: vm.layout.geneset,
                        input: vm.layout.input,
                        source: vm.layout.source
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
                                return b.max - a.max;
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
                        var range = [-5, 5];
                        var domain = d.scores.reduce(function(p, c) {
                            p[0] = Math.min(p[0], c.d[0], c.d[1], c.d[2]);
                            p[1] = Math.max(p[1], c.d[0], c.d[1], c.d[2]);
                            return p;
                        }, [Infinity, -Infinity]);
                        var scaleLinear = d3.scaleLinear().range(range).domain(domain);
                        var positions = new Float32Array(d.scores.length * 3);
                        var colors = new Float32Array(d.scores.length * 3);
                        var sizes = new Float32Array(d.scores.length);

                        d.scores.forEach(function(c, i) {
                            var posIndex = i * 3;
                            positions[posIndex] = scaleLinear(c.d[0]);
                            positions[posIndex + 1] = scaleLinear(c.d[1]);
                            positions[posIndex + 2] = scaleLinear(c.d[2]);
                            colors[posIndex] = 0.5;
                            colors[posIndex + 1] = 0.2;
                            colors[posIndex + 2] = 0.7;
                            sizes[i] = 1;
                        });

                        var pts = float32ArrayToVec3Array(positions);
                        var geometry = new THREE.BufferGeometry();
                        geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
                        geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
                        geometry.addAttribute('size', new THREE.BufferAttribute(sizes, 1));
                        geometry.computeBoundingSphere();


                        dragCanvas.init(d3.select(angular.element("#scatter-drag-canvas")[0]), color);
                        dragCanvas.setGeometry(geometry);

                        rotatingCanvas.init(d3.select(angular.element("#scatter-rotating-canvas")[0]), color, dragCanvas);
                        rotatingCanvas.setGeometry(geometry);

                        selectBars.init(d3.select(angular.element("#scatter-select-bars")[0]), color, dragCanvas);
                        selectBars.setGeometry(pts);

                        osApi.setBusy(false);
                    });


            });


            // Drag Canvas
            var dragCanvas = (function() {

                var onChange = new signals.Signal();
                var scene, renderer, camera, material, controls, particles;
                var pc1, pc2, pc3;
                var width, height, xScale, yScale;
                var element;

                function update() {

                    requestAnimationFrame(update);

                    controls.update();
                    camera.updateMatrixWorld(true);

                    // Orient Arrows
                    var pc1Dir = new THREE.Vector3(1, 0, -9 / 11).unproject(camera);
                    var pc2Dir = new THREE.Vector3(0, 1, -9 / 11).unproject(camera);
                    pc1.setDirection(pc1Dir.clone().normalize());
                    pc1.setLength(4, 1, 0.5);
                    pc2.setDirection(pc2Dir.clone().normalize());
                    pc2.setLength(4, 1, 0.5);
                    pc3.setDirection(camera.position.clone().normalize());
                    pc3.setLength(4, 1, 0.5);
                    renderer.render(scene, camera);
                }

                var _init = false;

                function init(el, color) {
                    if (_init) return;
                    _init = true;
                    element = el;
                    width = 240;
                    height = 240;
                    xScale = d3.scaleLinear().domain([-10, 10]).range([0, width]);
                    yScale = d3.scaleLinear().domain([10, -10]).range([0, height]);

                    scene = new THREE.Scene();
                    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                    renderer.setPixelRatio($window.devicePixelRatio);
                    renderer.setSize(width, height);

                    element.node().append(renderer.domElement);
                    d3.select(renderer.domElement).style('cursor', 'move');

                    camera = new THREE.OrthographicCamera(
                        xScale.invert(0), xScale.invert(width),
                        yScale.invert(0), yScale.invert(height),
                        1,
                        100
                    );
                    camera.position.z = 10;
                    camera.zoom = 1.5;
                    camera.updateProjectionMatrix();


                    controls = new THREE.OrthographicTrackballControls(camera, renderer.domElement);
                    controls.dynamicDampingFactor = 0.4;
                    controls.noZoom = true;
                    controls.noPan = true;
                    controls.noRoll = true;
                    controls.addEventListener("change", _.debounce(onChange.dispatch, 300));

                    material = new THREE.ShaderMaterial({
                        uniforms: {
                            color: {
                                type: 'c',
                                value: new THREE.Color(color.senary)
                            },
                            alpha: { type: 'f', value: 1 },
                            pointSize: { type: 'f', value: 4 },
                            shouldResize: { type: '1i', value: 0 }
                        },

                        vertexShader: d3.select('#vertexshader').node().textContent,
                        fragmentShader: d3.select('#fragmentshader').node().textContent,
                        transparent: true
                    });

                    // var axisOffset = { x: -2, y: -2, z: -4 };
                    // var gridHelper = new THREE.GridHelper(20, 20, 0xBBBBBB, 0xEAEAEA);
                    // gridHelper.position.x = axisOffset.x;
                    // gridHelper.position.z = axisOffset.y;
                    // gridHelper.position.y = axisOffset.z;
                    // scene.add(gridHelper);


                    // Add Arrows
                    pc1 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        2.5,
                        new THREE.Color(color.primary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc1);
                    pc2 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        2.5,
                        new THREE.Color(color.secondary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc2);
                    pc3 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        2.5,
                        new THREE.Color(color.tertiary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc3);


                    camera.left = width / -2;
                    camera.right = width / 2;
                    camera.top = height / 2;
                    camera.bottom = height / -2;
                    camera.near = 1;
                    camera.far = 100;
                    renderer.setSize(width, height);
                    controls.handleResize();

                    update();

                }

                function getCamera() {
                    return camera;
                }

                function setGeometry(geo) {


                    scene.remove(particles);
                    particles = new THREE.Points(geo, material);
                    scene.add(particles);
                }

                function resize() {

                }
                return {
                    onChange: onChange,
                    init: init,
                    setGeometry: setGeometry,
                    getCamera: getCamera,
                    resize: resize
                };
            })();

            var rotatingCanvas = (function() {

                var raycaster, mouse;
                var scene, renderer, camera, orbitCamera, material, particles, pc1, pc2, pc3;
                var rotY = 0;
                var clock = new THREE.Clock();
                var intersects;


                function update() {
                    requestAnimationFrame(update);

                    if (vm.optAutoRotate) {
                        rotY += 25 * Math.PI / 180 * clock.getDelta();
                    }

                    var cameraPosOffset = new THREE.Matrix4();
                    cameraPosOffset.setPosition(new THREE.Vector3(0, 0, 25));

                    var cameraRot = new THREE.Matrix4();
                    cameraRot.makeRotationFromEuler(new THREE.Euler(0, rotY, 0, 'XYZ'));

                    var cameraMat = new THREE.Matrix4();
                    cameraMat.multiplyMatrices(cameraRot, cameraPosOffset);

                    var cameraPosCenter = new THREE.Matrix4()
                    cameraMat = cameraPosCenter.multiplyMatrices(cameraPosCenter, cameraMat)

                    camera.matrix = cameraMat;
                    camera.updateMatrixWorld(true);


                    // Raycaster
                    //raycaster.set(camera.getWorldPosition(), camera.getWorldDirection());
                    raycaster.setFromCamera(mouse, camera);
                    if (angular.isDefined(particles)) {
                        intersects = raycaster.intersectObject(particles);
                        var geometry = particles.geometry;
                        var attributes = geometry.attributes;

                        if (intersects.length > 0) {
                            var ii = intersects[0].index * 3;
                            attributes.color.array[ii] = 1;
                            attributes.color.array[ii + 1] = 0;
                            attributes.color.array[ii + 2] = 0;
                            attributes.color.needsUpdate = true;
                            // intersects[0].object.material.uniforms.color.value.set(color.rollover);
                            // intersects[0].point.x = intersects[0].point.y = intersects[0].point.z = 0;
                        } else {
                            //intersects[0].object.material.uniforms.color.value.set(color.primary);
                        }
                    }
                    // var intersects = raycaster.intersectObject(particles);
                    // if (intersects.length > 0) {
                    //     // if (INTERSECTED != intersects[0].index) {
                    //     //     attributes.size.array[INTERSECTED] = PARTICLE_SIZE;
                    //     //     INTERSECTED = intersects[0].index;
                    //     //     attributes.size.array[INTERSECTED] = PARTICLE_SIZE * 1.25;
                    //     //     attributes.size.needsUpdate = true;
                    //     // }
                    //     console.log(" INTERSECTED");
                    // } else {
                    //     console.log("NOT INTERSECTED");
                    // }
                    //else if (INTERSECTED !== null) {
                    // attributes.size.array[INTERSECTED] = PARTICLE_SIZE;
                    // attributes.size.needsUpdate = true;
                    // INTERSECTED = null;
                    //}






                    // Orient Arrows
                    var pc1Dir = new THREE.Vector3(1, 0, -9 / 11).unproject(orbitCamera);
                    var pc2Dir = new THREE.Vector3(0, 1, -9 / 11).unproject(orbitCamera);
                    pc1.setDirection(pc1Dir.clone().normalize());
                    pc1.setLength(6, 0.5, 0.2);
                    pc2.setDirection(pc2Dir.clone().normalize());
                    pc2.setLength(6, 0.5, 0.2);
                    pc3.setDirection(camera.position.clone().normalize());
                    pc3.setLength(6, 0.5, 0.2);
                    pc1.setDirection(pc1Dir.clone().normalize());
                    pc1.setLength(6, 0.5, 0.2);
                    pc2.setDirection(pc2Dir.clone().normalize());
                    pc2.setLength(6, 0.5, 0.2);
                    pc3.setDirection(orbitCamera.position.clone().normalize());
                    pc3.setLength(6, 0.5, 0.2);

                    // Render Scene
                    renderer.render(scene, camera);
                }

                var _init = false;

                function onMouseMove(event) {
                    var canvasPosition = renderer.domElement.getBoundingClientRect();
                    var mouseX = event.clientX - canvasPosition.left;
                    var mouseY = event.clientY - canvasPosition.top;

                    mouse = new THREE.Vector2(
                        2 * (mouseX / renderer.getSize().width) - 1,
                        1 - 2 * (mouseY / renderer.getSize().height));

                }

                function init(el, color, dragCanvas) {
                    if (_init) return;
                    _init = true;

                    console.log("RELEASE LISTENER");
                    mouse = { x: 0, y: 0 };
                    el.node().addEventListener('mousemove', onMouseMove, false);

                    orbitCamera = dragCanvas.getCamera();
                    scene = new THREE.Scene();
                    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                    renderer.setPixelRatio($window.devicePixelRatio);
                    renderer.setSize(800, 800);
                    el.node().append(renderer.domElement);
                    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
                    camera.zoom = 1.2;
                    camera.setLens(50);
                    camera.aspect = 1;
                    camera.matrixAutoUpdate = false;
                    debugger;

                    // Material
                    material = new THREE.ShaderMaterial({
                        uniforms: {
                            color: {
                                type: 'c',
                                value: new THREE.Color(color.senary)
                            },
                            alpha: { type: 'f', value: 0.4 },
                            pointSize: { type: 'f', value: 3 },
                            shouldResize: { type: '1i', value: 1 }
                        },
                        vertexShader: d3.select('#vertexshader').node().textContent,
                        fragmentShader: d3.select('#fragmentshader').node().textContent,
                        transparent: true
                    });


                    // Arrows
                    pc1 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        10,
                        new THREE.Color(color.primary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc1);

                    pc2 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        10,
                        new THREE.Color(color.secondary).getHex(),
                        0.5,
                        10
                    );
                    scene.add(pc2);
                    pc3 = new THREE.ArrowHelper(
                        new THREE.Vector3(1, 0, 0),
                        new THREE.Vector3(0, 0, 0),
                        10,
                        new THREE.Color(color.tertiary).getHex(),
                        0.5,
                        0.5
                    );
                    scene.add(pc3);

                    // Grid
                    var axisOffset = { x: -2, y: -2, z: -4 };
                    var gridHelper = new THREE.GridHelper(20, 20, 0xBBBBBB, 0xEAEAEA);
                    gridHelper.position.x = axisOffset.x;
                    gridHelper.position.z = axisOffset.y;
                    gridHelper.position.y = axisOffset.z;
                    scene.add(gridHelper);

                    // raycaster	
                    raycaster = new THREE.Raycaster();
                    raycaster.params.Points.threshold = 0.1;
                    mouse = new THREE.Vector2();

                    update();
                }

                function setGeometry(geo) {
                    scene.remove(particles);
                    particles = new THREE.Points(geo, material);
                    scene.add(particles);
                }

                function resize(w, h) {
                    if (angular.isUndefined(camera)) return;

                    camera.aspect = w / h;
                    camera.updateProjectionMatrix();
                    renderer.setSize(w, h);

                }
                return {
                    init: init,
                    setGeometry: setGeometry,
                    resize: resize
                };
            })();

            var selectBars = (function() {
                var onChange = new signals.Signal();
                var svg, rect1, rect2, groupLines, groupBrushes, orbitCamera, pts, data;
                var selections = { x: null, y: null, z: null };


                function toScreenXY(pos3D) {
                    var v = pos3D.clone().project(orbitCamera);
                    var percX = (v.x + 1) / 2;
                    var percY = (-v.y + 1) / 2;
                    var percZ = (v.z + 1) / 2;
                    var left = percX * 120;
                    var top = percY * 120;
                    var z = percZ * (120 * 6); // magic!
                    return [left * 2, top * 2, z * 2];
                }

                function draw() {
                    data = pts.map(toScreenXY);

                    var lines = groupLines.selectAll(".scatter-bottom").data(data);
                    lines.exit().remove();
                    lines.enter().append("rect").attr("width", 1).attr("height", 10).style("fill", color.primary).attr("class", "scatter-bottom")
                        .attr("y", 250).attr("x", function(d) { return d[0]; });
                    lines.transition(500).duration(500).attr("x", function(d) { return d[0]; });

                    lines = groupLines.selectAll(".scatter-left").data(data);
                    lines.exit().remove();
                    lines.enter().append("rect").attr("width", 10).attr("height", 1).style("fill", color.secondary).attr("class", "scatter-left")
                        .attr("x", 0).attr("y", function(d) { return d[1]; });
                    lines.transition(500).duration(500).attr("y", function(d) { return d[1]; });

                    lines = groupLines.selectAll(".scatter-right").data(data);
                    lines.exit().remove();
                    lines.enter().append("rect").attr("width", 10).attr("height", 1).style("fill", color.tertiary).attr("class", "scatter-right")
                        .attr("x", 250).attr("y", function(d) { return d[2]; });
                    lines.transition(500).duration(500).attr("y", function(d) { return d[2]; });
                }

                function onBrush(brush, selection) {
                    if (!d3.event.selection) return;
                    selections[brush] = selection;
                    // data;
                    // if (selection !== null) debugger;
                }


                function setGeometry(geo) {
                    selections = { x: null, y: null, z: null };
                    pts = geo;
                    draw();

                }

                var _init = false;

                function init(el, color, orbitControl) {
                    if (_init) return;
                    _init = true;

                    orbitCamera = orbitControl.getCamera();
                    orbitControl.onChange.add(draw);
                    svg = el.append('svg');
                    svg.attr("width", "100%").attr("height", "100%").style("shape-rendering", "crispEdges");
                    //rect1 = svg.append("rect").attr("width", 259.5).attr("height", 259.5).style("shape-rendering", "crispEdges").style("stroke-width", 1).style("stroke", "#EAEAEA").style("fill", "#FFF").attr("x", 0).attr("y", 0);
                    //rect2 = svg.append("rect").attr("width", 239.5).attr("height", 249.5).style("shape-rendering", "crispEdges").style("stroke-width", 1).style("stroke", "#EAEAEA").style("fill", "#FFF").attr("x", 10).attr("y", 0);
                    rect1 = svg.append("rect").style("shape-rendering", "crispEdges").style("stroke-width", 1).style("stroke", "#EAEAEA").style("fill", "#FFF").attr("x", 0).attr("y", 0);
                    rect2 = svg.append("rect").style("shape-rendering", "crispEdges").style("stroke-width", 1).style("stroke", "#EAEAEA").style("fill", "#FFF").attr("x", 10).attr("y", 0);

                    groupLines = svg.append("g");

                    groupBrushes = svg.append("g");
                    var groupX = groupBrushes.append("g");
                    var groupY = groupBrushes.append("g");
                    var groupZ = groupBrushes.append("g");

                    var brushX = d3.brushX().extent([
                            [10, 250],
                            [250, 260]
                        ]).handleSize(3)
                        .on("start", function() { onBrush("x", null); })
                        .on("end", function() { onBrush("x", d3.event.selection); });

                    groupX.call(brushX);

                    var brushY = d3.brushY().extent([
                            [0, 10],
                            [10, 250]
                        ]).handleSize(3)
                        .on("start", function() { onBrush("y", null); })
                        .on("end", function() { onBrush("y", d3.event.selection); });
                    groupY.call(brushY);

                    var brushZ = d3.brushY().extent([
                            [250, 10],
                            [260, 250]
                        ]).handleSize(3)
                        .on("start", function() { onBrush("z", null); })
                        .on("end", function() { onBrush("z", d3.event.selection); });
                    groupZ.call(brushZ);

                }

                function resize() {

                }
                return {
                    init: init,
                    setGeometry: setGeometry,
                    resize: resize,
                    onChange: onChange
                };

            })();



            // Life Cycle Events
            function resize() {
                var layout = osApi.getLayout();
                var width = $window.innerWidth - layout.left - layout.right;
                var height = $window.innerHeight - 120;
                rotatingCanvas.resize(width, height);
            }
            osApi.onResize.add(resize);


            function create() {
                // Load Data
                vm.datasource = osApi.getDataSource();

                osApi.query(osApi.getDataSource().disease + "_cluster", {
                    dataType: 'PCA',
                    $fields: ['input', 'geneset', 'source']
                }).then(function(response) {
                    vm.layouts = response.data.map(function(v) {
                        v.name = v.geneset + " " + v.input + " " + v.source;
                        return v;
                    });
                    vm.layout = vm.layouts[2];
                    $timeout(resize, 300);
                    osApi.setBusy(false);
                });
            }
            create();


            function destory() {
                onDestory();
                onLayout();
                osApi.onResize.remove(plot.resize);
                // osApi.onCohortChange.remove(onCohortChange);
            }
            var onDestory = $scope.$on('$destroy', destory);



        }
    }

})();