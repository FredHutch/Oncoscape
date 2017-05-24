(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osMs', osMs);

    /** @ngInject */
    function osMs() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/ms/ms.html',
            controller: MsController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function MsController(osApi, THREE, d3, $scope, $window, TWEEN, ML, jStat, _) {


            var el = document.getElementById('tool-container');

            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector2();

            var spheres = [];
            var mesh, renderer, sceneA, sceneB, cameraA, cameraB, controlsA, controlsB;
            var layout = osApi.getLayout();
            var width = $window.innerWidth; // - layout.left - layout.right;
            var height = $window.innerHeight - 50; //10

            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio($window.devicePixelRatio);
            renderer.setSize(width, height);

            renderer.autoClear = false;
            el.appendChild(renderer.domElement);

            // renderer.autoClear = false;
            sceneA = new THREE.Scene();
            sceneA.background = new THREE.Color(0xffffff);
            sceneB = new THREE.Scene();
            sceneB.background = new THREE.Color(0xffffff);

            cameraA = new THREE.PerspectiveCamera(
                45,
                width / height,
                1,
                10000
            );
            cameraA.position.set(0, 0, 1000);


            cameraB = new THREE.PerspectiveCamera(
                45,
                width / height,
                1,
                10000
            );
            cameraB.position.set(0, 0, 1000);

            controlsA = new THREE.TrackballControls(cameraA, renderer.domElement);
            controlsB = new THREE.TrackballControls(cameraB, renderer.domElement);


            var vm = this;
            var isA = true;
            vm.toggle = function() {
                controlsA = (isA) ? new THREE.TrackballControls(cameraB, renderer.domElement) : new THREE.TrackballControls(cameraA, renderer.domElement);
                isA = !isA;

            };




            var pcaScale = d3.scaleLinear().domain([-1, 1]).range([-500, 500]).nice();

            function doPLS(result) {

                console.log("FORMAT DATA");
                var data = result.data.map(function(v) { return v.data; });

                console.log("PIVOT DATA");
                data = _.zip.apply(_, data);

                console.log("Generate Random Classification Of Samples");
                var classification = [
                    data.map(function() { return Math.round(Math.random()); }),
                    data.map(function() { return Math.round(Math.random()); })
                ];
                classification = _.zip.apply(_, classification);

                console.log("Construct PLS");
                var pls = new ML.SL.PLS(data, classification);

                console.log("Train PLS");
                var options = { latentVectors: 10, tolerance: 1e-4 };
                pls.train(options);


                console.log("DETERMINE SCALE");
                pcaScale.domain(
                    pls.T.reduce(function(p, c) {
                        p[0] = Math.min(p[0], c[0]);
                        p[0] = Math.min(p[0], c[1]);
                        p[0] = Math.min(p[0], c[2]);
                        p[1] = Math.max(p[1], c[0]);
                        p[1] = Math.max(p[1], c[1]);
                        p[1] = Math.max(p[1], c[2]);
                        return p;
                    }, [Infinity, -Infinity])
                );

                var mat = new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 10 });
                var geo = new THREE.Geometry();
                var q = pls.Q;
                geo.vertices.push(
                    new THREE.Vector3(0, 0, 0),
                    new THREE.Vector3(pcaScale(q[0][1]), pcaScale(q[0][2]), pcaScale(q[0][3]))
                );

                var line = new THREE.Line(geo, mat);
                sceneB.add(line);



                // geo.vertices.push(
                //     new THREE.Vector3(0, 0, 0),
                //     new THREE.Vector3(pcaScale(q[1][1]), pcaScale(q[1][2]), pcaScale(q[1][3]))
                // );
                // var line = new THREE.Line(geo, mat);
                // sceneB.add(line);
                3

                var from = new THREE.Vector3(0, 0, 0);
                var to = new THREE.Vector3(pcaScale(q[1][1]), pcaScale(q[1][2]), pcaScale(q[1][3]));
                var direction = to.clone().sub(from);
                var length = direction.length();
                var arrowHelper = new THREE.ArrowHelper(direction.normalize(), from, length, 0xff0000, 20, 20);
                sceneB.add(arrowHelper);

                console.log("SCALE PLS U Into XYZ Coords");
                var coords = pls.T.map(function(v) {
                    return {
                        x: pcaScale(v[0]),
                        y: pcaScale(v[1]),
                        z: pcaScale(v[2])
                    };
                });

                console.log("UPDATE VIEW");
                for (var i = 0; i < coords.length; i++) {
                    var pos = coords[i];
                    spheres[i].position.x = pos.x;
                    spheres[i].position.y = pos.y;
                    spheres[i].position.z = pos.z;

                }

                console.log("PLS");
                jStat
                debugger;

            }

            function doPCA(result) {

                console.log("FORMAT DATA");
                var data = result.data.map(function(v) { return v.data; });

                console.log("RUN PCA");
                var pca = new ML.Stat.PCA(data);

                console.log("DETERMINE SCALE");
                pcaScale.domain(
                    pca.U.reduce(function(p, c) {
                        p[0] = Math.min(p[0], c[0]);
                        p[0] = Math.min(p[0], c[1]);
                        p[0] = Math.min(p[0], c[2]);
                        p[1] = Math.max(p[1], c[0]);
                        p[1] = Math.max(p[1], c[1]);
                        p[1] = Math.max(p[1], c[2]);
                        return p;
                    }, [Infinity, -Infinity])
                );

                console.log("SCALE PCA U Into XYZ Coords");
                var coords = pca.U.map(function(v) {
                    return {
                        x: pcaScale(v[0]),
                        y: pcaScale(v[1]),
                        z: pcaScale(v[1])
                    };
                });

                console.log("UPDATE VIEW");
                for (var i = 0; i < coords.length; i++) {
                    var pos = coords[i];
                    spheres[i].position.x = pos.x;
                    spheres[i].position.y = pos.y;
                    spheres[i].position.z = pos.z;

                }
            }
            vm.click = function() {

                // Pick 500 Random genes
                console.log("Select 50 Random Genes");
                var randomGenes = [];
                while (randomGenes.length < 50) {
                    var randomnumber = Math.ceil(Math.random() * genes.length - 1)
                    if (randomGenes.indexOf(randomnumber) > -1) continue;
                    randomGenes[randomGenes.length] = randomnumber;
                }

                var randomGenes = randomGenes.map(function(v) {
                    return genes[v].g;
                });

                console.dir(randomGenes)

                console.log("Retrieve Gistic Scores From Server");
                osApi.query("z_data_molecular", { type: 'gistic', gene: { $in: randomGenes } }).then(function(result) {

                    doPCA(result);
                    //doPLS(result);


                    console.log("DONE");

                });

                // Pull Data From Z Molecular
                // Calculate PCA
                //z_molecular

            }






            vm.datasource = osApi.getDataSource();
            (function(vm, osApi) {
                osApi.query(vm.datasource.disease + "_cluster", {
                    dataType: 'PCA',
                    $fields: ['input', 'geneset', 'source']
                }).then(function(response) {
                    vm.layouts = response.data.map(function(v) {
                        v.name = v.geneset + " " + v.input + " " + v.source;
                        return v;
                    });
                    vm.sample = { layout: vm.layouts[0] };
                    vm.gene = { layout: vm.layouts[1] };
                    osApi.setBusy(false);
                });
            })(vm, osApi);

            // osApi.query("hg19_chromosome_orghs_1e05").then(function(response) {

            // });



            $scope.$watch("vm.sample.layout", function(layout) {
                if (angular.isUndefined(layout)) return;
                osApi.query(osApi.getDataSource().disease + "_cluster", {
                        disease: vm.datasource.disease,
                        geneset: layout.geneset,
                        input: layout.input,
                        source: layout.source
                    })
                    .then(function(response) {



                        var hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0x0383c2, 0.8);
                        hemiLight.position.set(0, 100, 0);
                        sceneB.add(hemiLight);

                        // Loadings
                        var s = get3dScale(response.data[0].scores);
                        //var sphereMaterial = new THREE.MeshPhongMaterial({ shininess: 1 }); //THREE.MeshBasicMaterial({ color: 0x0383c2 });
                        //var sphereMaterial = new THREE.MeshStandardMaterial({ metalness: 0, roughness: 0.5 });
                        var sphereMaterial = new THREE.MeshPhongMaterial({ emissive: 0x111111, envMap: cameraB.renderTarget });
                        //new THREE.MeshLambertMaterial({ color: 0x0383c2, transparent: true, opacity: 0.5 });
                        var sphereGeometry = new THREE.SphereGeometry(3);

                        response.data[0].scores.splice(0, 577).forEach(function(score) {
                            var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                            spheres.push(sphere);
                            sphere.position.x = Math.round(s(score.d[0]));
                            sphere.position.y = Math.round(s(score.d[1]));
                            sphere.position.z = Math.round(s(score.d[2]));
                            sceneB.add(sphere);
                        });





                    });
            });

            var genes;
            osApi.query("z_render_chromosome_gene", { type: 'chromosome' }).then(function(response) {
                genes = response.data[0].genes;
                var chromos = response.data[0].chromos;
                var scale = d3.scaleLinear().domain([0, 10000]).range([0, 5000]).nice();
                var chromoMaterial = new THREE.LineBasicMaterial({ color: 0xBBBBBB, linewidth: 1 });
                var geneMaterial = new THREE.MeshBasicMaterial({ color: 0x0383c2 });

                var geneGeometry = new THREE.BoxGeometry(3, 1, 1);


                chromos.forEach(function(chromo) {

                    var chromoGeometry = new THREE.Geometry();
                    chromoGeometry.vertices.push(

                        new THREE.Vector3(chromo.x * 50, scale(chromo.y1), 0),
                        new THREE.Vector3(chromo.x * 50, scale(chromo.y2), 0)
                    );
                    var line = new THREE.Line(chromoGeometry, chromoMaterial);
                    sceneA.add(line);

                });
                genes.forEach(function(gene) {

                    var sphere = new THREE.Mesh(geneGeometry, geneMaterial);
                    sphere.position.x = gene.x * 50;
                    sphere.position.y = scale(gene.y);
                    sphere.position.z = gene.o * 2;
                    sceneA.add(sphere);

                });
                cameraA.lookAt(new THREE.Vector3(0, 0, 0));
            });

            function animate() {

                requestAnimationFrame(animate);

                controlsA.update();

                var l = 0.5 * width;
                var b = 0;
                var w = 0.5 * width;
                var h = height;


                renderer.setViewport(l, b, w, h);
                renderer.setScissor(l, b, w, h);
                renderer.setScissorTest(true); // clip out "viewport"
                cameraA.aspect = w / h;
                cameraA.updateProjectionMatrix();
                renderer.clear();
                renderer.render(sceneA, cameraA);


                l = 1;
                renderer.setViewport(l, b, w, h);
                renderer.setScissor(l, b, w, h);
                renderer.setScissorTest(true); // clip out "viewport"
                cameraB.aspect = w / h;
                cameraB.updateProjectionMatrix();
                renderer.render(sceneB, cameraB);



                //                TWEEN.update();


            }
            animate();




            var raycaster = new THREE.Raycaster();
            var mouse = new THREE.Vector3();

            function onDocumentMouseDown(event) {
                var rect = renderer.domElement.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / (rect.width * 0.5)) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / (rect.height)) * 2 + 1;
                mouse.z = 0.5;
                raycaster.setFromCamera(mouse, cameraB);
                var intersects = raycaster.intersectObjects(sceneB.children);
                if (intersects.length > 0) {

                    var selectedObject = intersects[0].object;
                    var camera = cameraB;

                    var tween = new TWEEN.Tween(camera.position).to({
                        x: selectedObject.position.x,
                        y: selectedObject.position.y,
                        z: selectedObject.position.z
                    }, 5000).start();


                    var tween = new TWEEN.Tween(camera.rotation).to({
                        x: 0,
                        y: 0,
                        z: 500
                    }, 5000).easing(TWEEN.Easing.Linear.None).start();

                }
            }
            renderer.domElement.addEventListener('mousedown', onDocumentMouseDown, false);

            function get3dScale(pts) {
                var domain = pts.reduce(function(p, c) {
                    var mm = c.d.reduce(function(p, c) {
                        if (c < p.min) p.min = c;
                        if (c > p.max) p.max = c;
                        return p;
                    }, { min: Infinity, max: -Infinity });
                    if (mm.min < p.min) p.min = mm.min;
                    if (mm.max > p.max) p.max = mm.max;
                    return p;
                }, { min: Infinity, max: -Infinity });
                return d3.scaleLinear().domain([domain.min, domain.max]).range([-500, 500]).nice();
            }
        }
    }
})();