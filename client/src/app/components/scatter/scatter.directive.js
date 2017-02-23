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

            // Elements
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

            function float32ArrayToVec3Array(arr) {
                var res = [];
                for (var i = 0; i < arr.length; i += 3) {
                    res[i / 3] = new THREE.Vector3(arr[i], arr[i + 1], arr[i + 2])
                }
                return res;
            }


            var positions; // Float32Array of adjusted points
            var colors;
            var geom; // Three Buffer of Points Based on 'positions'
            var pts; // Vec 3 Array of Adjusted points  
            var ids; // Array of Ids

            function particleGeometry() {
                var geometry = new THREE.BufferGeometry()
                geometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
                geometry.addAttribute('color', new THREE.BufferAttribute(colors, 3));
                geometry.computeBoundingSphere();
                return geometry;
            }


            var orbitControl = (function() {

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
                    pc3.setDirection(getCamera().position.clone().normalize());
                    pc3.setLength(4, 1, 0.5);
                    renderer.render(scene, camera);
                }

                function init(el, color, geometry) {
                    element = el;
                    width = 500;
                    height = 500;
                    xScale = d3.scaleLinear().domain([-10, 10]).range([0, width]);
                    yScale = d3.scaleLinear().domain([10, -10]).range([0, height]);

                    scene = new THREE.Scene();
                    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                    renderer.setPixelRatio($window.devicePixelRatio);

                    el.node().append(renderer.domElement);
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
                            alpha: { type: 'f', value: 0.4 },
                            pointSize: { type: 'f', value: 10 },
                            shouldResize: { type: '1i', value: 0 }
                        },
                        vertexShader: d3.select('#vertexshader').node().textContent,
                        fragmentShader: d3.select('#fragmentshader').node().textContent,
                        transparent: true
                    });

                    particles = new THREE.Points(geometry, material);
                    scene.add(particles);

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

                function setSelected(data) {

                }

                function setData(data) {
                    scene.remove(particles);
                    particles = new THREE.Points(data, material);
                    scene.add(particles);
                }


                function resize(w, h, l) {

                    width = w;
                    height = h;

                    camera.aspect = width / height;
                    camera.left = width / -2;
                    camera.right = width / 2;
                    camera.top = height / 2;
                    camera.bottom = height / -2;
                    renderer.setSize(width, height);
                    element.style({ left: l + "px" });

                    xScale.range([0, width]);
                    yScale.range([0, height]);
                    update();
                }

                return {
                    onChange: onChange,
                    init: init,
                    setSelected: setSelected,
                    getCamera: getCamera,
                    setData: setData,
                    resize: resize
                };
            })(signals);

            var chart = (function() {

                var onChange = new signals.Signal();
                var scene, renderer, camera, orbitCamera, material, particles, pc1, pc2, pc3;
                var rotY = 0;
                var clock = new THREE.Clock();

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

                    camera.matrix = cameraMat;
                    camera.updateMatrixWorld(true);
                    renderer.render(scene, camera);

                    // Orient Arrows
                    var pc1Dir = new THREE.Vector3(1, 0, -9 / 11).unproject(orbitCamera);
                    var pc2Dir = new THREE.Vector3(0, 1, -9 / 11).unproject(orbitCamera);
                    pc1.setDirection(pc1Dir.clone().normalize());
                    pc1.setLength(4, 1, 0.5);
                    pc2.setDirection(pc2Dir.clone().normalize());
                    pc2.setLength(4, 1, 0.5);
                    pc3.setDirection(camera.position.clone().normalize());
                    pc3.setLength(4, 1, 0.5);
                    pc1.setDirection(pc1Dir.clone().normalize());
                    pc1.setLength(4, 1, 0.5);
                    pc2.setDirection(pc2Dir.clone().normalize());
                    pc2.setLength(4, 1, 0.5);
                    pc3.setDirection(orbitCamera.position.clone().normalize());
                    pc3.setLength(4, 1, 0.5);
                }

                function init(el, color, geometry, orbitControl) {

                    orbitCamera = orbitControl.getCamera();
                    scene = new THREE.Scene();
                    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
                    renderer.setPixelRatio($window.devicePixelRatio);
                    renderer.setSize(260, 260);
                    el.node().append(renderer.domElement);
                    camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
                    camera.zoom = 1.2;
                    camera.setLens(50);
                    camera.aspect = 1;
                    camera.matrixAutoUpdate = false;

                    // Material
                    material = new THREE.ShaderMaterial({
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
                    particles = new THREE.Points(geometry, material);
                    scene.add(particles);

                    // Arrows
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
                        10
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

                    // Grid
                    var axisOffset = { x: -2, y: -2, z: -4 };
                    var gridHelper = new THREE.GridHelper(20, 20, 0xBBBBBB, 0xEAEAEA);
                    gridHelper.position.x = axisOffset.x;
                    gridHelper.position.z = axisOffset.y;
                    gridHelper.position.y = axisOffset.z;
                    scene.add(gridHelper);





                    // Start Update Loop
                    update();
                }


                function setSelected(data) {

                }

                function setData(data) {
                    scene.remove(particles);
                    particles = new THREE.PointCloud(data, material);
                    scene.add(particles);
                }

                return {
                    onChange: onChange,
                    init: init, // Element, Colors, Geometry
                    setSelected: setSelected,
                    setData: setData
                };
            })();

            var selectControl = (function() {
                var onChange = new signals.Signal();
                var svg, rect1, rect2, groupLines, groupBrushes, orbitCamera, pts, data;

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

                    var layout = osApi.getLayout();
                    var width = $window.innerWidth - layout.left - layout.right;
                    var height = $window.innerHeight - 120; //10

                    // var lines = groupLines.selectAll(".scatter-bottom").data(data);
                    // lines.exit().remove();
                    // lines.enter()
                    //     .append("rect").attr("width", 1).attr("height", 10).style("fill", color.primary).attr("class", "scatter-bottom")
                    //     .attr("y", height).attr("x", function(d) { return d[0]; });
                    // lines.transition(500).duration(500).attr("x", function(d) { return d[0]; });

                    // lines = groupLines.selectAll(".scatter-left").data(data);
                    // lines.exit().remove();
                    // lines.enter().append("rect").attr("width", 10).attr("height", 1).style("fill", color.secondary).attr("class", "scatter-left")
                    //     .attr("x", 0).attr("y", function(d) { return d[1]; });
                    // lines.transition(500).duration(500).attr("y", function(d) { return d[1]; });

                    // lines = groupLines.selectAll(".scatter-right").data(data);
                    // lines.exit().remove();
                    // lines.enter().append("rect").attr("width", 10).attr("height", 1).style("fill", color.tertiary).attr("class", "scatter-right")
                    //     .attr("x", width - 10).attr("y", function(d) { return d[2]; });
                    // lines.transition(500).duration(500).attr("y", function(d) { return d[2]; });
                }

                var selections = { x: null, y: null, z: null };


                function onBrush(brush, selection) {
                    if (!d3.event.selection) return;
                    selections[brush] = selection;
                    data;
                    if (selection !== null) debugger;
                }

                function init(el, color, points, orbitControl) {
                    pts = points;
                    orbitCamera = orbitControl.getCamera();
                    orbitControl.onChange.add(draw)
                    svg = el.append('svg');
                    // rect1 = svg.append("rect").attr("width", 259.5).attr("height", 259.5).style("shape-rendering", "crispEdges").style("stroke-width", 1).style("stroke", "#EAEAEA").style("fill", "#FFF").attr("x", 0).attr("y", 0);
                    // rect2 = svg.append("rect").attr("width", 239.5).attr("height", 249.5).style("shape-rendering", "crispEdges").style("stroke-width", 1).style("stroke", "#EAEAEA").style("fill", "#FFF").attr("x", 10).attr("y", 0);
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

                    draw(pts);

                }

                function setData(points) {

                    // Clear Brushes
                    selections = { x: null, y: null, z: null };
                    pts = points;
                    draw();
                }

                function resize(width, height, left) {
                    //width, height, layout.left
                    svg.attr("height", height + "px");
                    svg.attr("width", width + "px");
                    rect1.attr("width", width).attr("height", height);
                    rect2.attr("width", width - 20).attr("height", height - 10);
                    draw();
                }

                return {
                    onChange: onChange,
                    init: init,
                    setData: setData,
                    resize: resize
                };
            })(signals);

            // View Model
            var vm = this;
            vm.datasource = osApi.getDataSource();
            vm.loadings = vm.pc1 = vm.pc2 = vm.layouts = [];
            vm.layout = {};

            // View Model Call Backs
            var initialized = false;
            vm.setLayout = function(layout) {
                vm.layout = layout;
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

                        positions = new Float32Array(d.scores.length * 3);
                        colors = new Float32Array(d.scores.length * 3);
                        d.scores.forEach(function(c, i) {
                            var posIndex = i * 3;
                            positions[posIndex] = scaleLinear(c.d[0]);
                            positions[posIndex + 1] = scaleLinear(c.d[1]);
                            positions[posIndex + 2] = scaleLinear(c.d[2]);
                            colors[posIndex] = 90;
                            colors[posIndex + 1] = 90;
                            colors[posIndex + 2] = 90;
                        });
                        pts = float32ArrayToVec3Array(positions);


                        geom = particleGeometry();


                        if (!initialized) {
                            orbitControl.init(d3.select(angular.element("#scatter-axis-controller")[0]), color, geom);
                            selectControl.init(d3.select(angular.element("#scatter-select-controller")[0]), color, pts, orbitControl);
                            chart.init(d3.select(angular.element("#scatter-chart")[0]), color, geom, orbitControl);
                            var layout = osApi.getLayout();
                            var width = $window.innerWidth - layout.left - layout.right;
                            var height = $window.innerHeight - 130; //10
                            orbitControl.resize(width, height, layout.left);
                            //selectControl.resize(width, height, layout.left);

                            initialized = true;
                        } else {
                            orbitControl.setData(geom);
                            //selectControl.setData(pts);
                            chart.setData(geom);
                        }

                        osApi.setBusy(false);
                    });
            };

            // Load Data
            osApi.query(osApi.getDataSource().disease + "_cluster", {
                dataType: 'PCA',
                $fields: ['input', 'geneset', 'source']
            }).then(function(response) {
                vm.layouts = response.data.map(function(v) {
                    v.name = v.geneset + " " + v.input + " " + v.source;
                    return v;
                });
                vm.setLayout(vm.layouts[2]);
            });

            // Destroy
            $scope.$on('$destroy', function() {
                // osApi.onResize.remove(plot.resize);
                // osApi.onCohortChange.remove(onCohortChange);
            });
        }
    }


    //     function resize() {

    // var layout = osApi.getLayout();
    // width = $window.innerWidth - layout.left - layout.right;
    // height = $window.innerHeight - 30; //10
    //         chart2d.svg.style("position", "absolute");
    //         chart2d.svg.style("top", height - 200 + "px");
    //         chart2d.svg.style("left", layout.left + "px");
    //         chart2d.svg.style("width", width + "px");
    //         chart2d.svg.style("height", "160px");
    //         //chart2d.svg.style('background-color', 'rgba(0, 0, 0, 0.1)')
    //         width = Math.floor(width * 0.5);
    //         height = height - 255;
    //         chartSpin.camera.aspect = width / height;
    //         chartSpin.renderer.setSize(width, height);
    // chartDrag.camera.left = width / -2;
    // chartDrag.camera.right = width / 2;
    // chartDrag.camera.top = height / 2;
    // chartDrag.camera.bottom = height / -2;
    // chartDrag.camera.near = 1;
    // chartDrag.camera.far = 100;
    // chartDrag.renderer.setSize(width, height);
    // chartDrag.controls.handleResize();
    //     }

})();