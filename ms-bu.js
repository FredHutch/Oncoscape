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
        function MsController(osApi, BABYLON, d3, $scope) {

            // 3D components
            // cameraA,
            // cameraB;
            var el = document.getElementById('renderCanvas');
            var engine = new BABYLON.Engine(el);

            var scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color3(1, 1, 1);
            var canvas = new BABYLON.ScreenSpaceCanvas2D(scene, {
                id: "ScreenCanvas",
                backgroundFill: "#00000000"
                    //size: new BABYLON.Size(500, 500)
                    //backgroundRoundRadius: 50
            });

            var cameraA = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 10, new BABYLON.Vector3(0, 0, 0), scene);
            cameraA.viewport = new BABYLON.Viewport(0, 0, 0.5, 1.0);
            cameraA.setTarget(BABYLON.Vector3.Zero());
            cameraA.attachControl(el, false);

            var cameraB = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 10, new BABYLON.Vector3(50, 50, 0), scene); ///new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 15, -45), scene);
            cameraB.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1.0);
            cameraB.setTarget(BABYLON.Vector3.Zero());
            cameraB.attachControl(el, false);

            var light = new BABYLON.HemisphericLight("Hemi0", new BABYLON.Vector3(0, 1, 0), scene);
            light.diffuse = new BABYLON.Color3(1, 1, 1);
            light.specular = new BABYLON.Color3(1, 1, 1);
            light.groundColor = new BABYLON.Color3(0, 0, 0);

            var scores;

            scene.activeCameras.push(cameraA);
            scene.activeCameras.push(cameraB);

            engine.runRenderLoop(function() {

                if (angular.isDefined(scores)) {


                    // var visible = scores.filter(function(mesh) {
                    //         return mesh.alphaIndex > 20;
                    //     })
                    //     .filter(function(mesh) {
                    //         return cameraA.isInFrustum(mesh) && cameraB.isInFrustum(mesh);
                    //     });




                    var world = BABYLON.Matrix.Identity();
                    var transform = scene.getTransformMatrix();
                    var viewportA = cameraA.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
                    var viewportB = cameraB.viewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

                    // var position = visible.map(function(mesh) {
                    //     var a = BABYLON.Vector3.Project(mesh.position, world, transform, viewportA);
                    //     var b = BABYLON.Vector3.Project(mesh.position, world, transform, viewportB);
                    //     var pts = new Array(new BABYLON.Vector2(a.x, a.y), new BABYLON.Vector2(b.x, b.y));
                    //     return new BABYLON.Lines2D(pts, {
                    //         parent: canvas,
                    //         fillThickness: 1,
                    //         fill: "#8040C0FF",
                    //         // startCap: BABYLON.Lines2D.TriangleCap,
                    //         // endCap: BABYLON.Lines2D.DiamondAnchorCap,
                    //         borderThickness: 0,
                    //         closed: false
                    //     });
                    // });

                    //canvas.size = new BABYLON.size(engine.getRenderWidth(), engine.getRenderHeight());
                    //  var straightLine = new BABYLON.Lines2D(cp, {
                    //         parent: canvas, id: "StraightLine", x: 750, y: 50, fillThickness: 10, fill: "#8040C0FF", border: "#40FFFFFF",
                    // 		startCap: BABYLON.Lines2D.TriangleCap, endCap: BABYLON.Lines2D.DiamondAnchorCap,
                    //         borderThickness: 5, closed: false, origin: BABYLON.Vector2.Zero()
                    //     });



                    //scores[0].overlayAlpha

                    //var arr = mesh.getVertexBuffer(BABYLON.VertexBuffer.PositionKind)
                    //BABYLON.Vector3.TransformCoordinates(vertex, mesh.getWorldMatrix())


                }

                //BABYLON.Vector3.Project(coords, BABYLON.Matrix.Identity(), scene.getTransformMatrix(), camera.viewport.toGlobal(engine));
                scene.render();
            });

            var vm = this;
            vm.datasource = osApi.getDataSource();
            (function(vm, osApi) {
                osApi.query(vm.datasource.dataset + "_cluster", {
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

            $scope.$watch("vm.sample.layout", function(layout) {
                if (angular.isUndefined(layout)) return;
                osApi.query(osApi.getDataSource().dataset + "_cluster", {
                        dataset: vm.datasource.dataset,
                        geneset: layout.geneset,
                        input: layout.input,
                        source: layout.source
                    })
                    .then(function(response) {
                        // Scores

                        // Loadings
                        var s = get3dScale(response.data[0].scores);

                        var materialSphere = new BABYLON.StandardMaterial("texture1", scene);
                        materialSphere.specularColor = new BABYLON.Color3(1.0, 0.2, 0.7);


                        // var pbr = new BABYLON.PBRMaterial("pbr", scene);
                        // pbr.albedoColor = new BABYLON.Color3(1, 0, 0);
                        // pbr.reflectivityColor = new BABYLON.Color3(1.0, 1.0, 1.0);
                        // pbr.reflectionColor = new BABYLON.Color3(1.0, 1.0, 0.0);

                        scores = response.data[0].scores.map(function(score) {
                            //var pyr = BABYLON.Mesh.CreatePyramid4(score.id, 10, 10, scene);
                            //var pyr = BABYLON.Mesh.CreateDisc(score.id, 5, 30, scene, true, BABYLON.Mesh.DEFAULTSIDE);
                            var pyr = BABYLON.MeshBuilder.CreateSphere(score.id, { diameter: 1, diameterX: 1 }, scene);
                            pyr.position.x = Math.round(s(score.d[0]));
                            pyr.position.y = Math.round(s(score.d[1]));
                            pyr.position.z = Math.round(s(score.d[2]));

                            prepareButton(pyr);
                            return pyr;
                        });
                    });
            });


            vm.click = function() {
                scores.length;
                debugger;

            }

            var prepareButton = function(mesh) {
                // var goToColorAction = new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPickTrigger, light, "diffuse", color, 1000, null, true);
                mesh.emissiveColor = new BABYLON.Color3(0, 1, 0);
                mesh.actionManager = new BABYLON.ActionManager(scene);
                mesh.actionManager.registerAction(
                    new BABYLON.InterpolateValueAction(BABYLON.ActionManager.OnPickTrigger, mesh, "visibility", 0.2, 10)
                );
                mesh.actionManager.registerAction(
                    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(e) {
                        var p = e.source.position
                        cameraA.setTarget(new BABYLON.Vector3(p.x, p.y, p.z));
                        cameraB.setTarget(new BABYLON.Vector3(p.x, p.y, p.z));

                        //console.log(e.r.position);
                    })
                );

                //     .then(new BABYLON.CombineAction(BABYLON.ActionManager.NothingTrigger, [ // Then is used to add a child action used alternatively with the root action. 
                //         goToColorAction, // First click: root action. Second click: child action. Third click: going back to root action and so on...   
                //         new BABYLON.SetValueAction(BABYLON.ActionManager.NothingTrigger, mesh.material, "wireframe", false)
                //     ]));
                // mesh.actionManager.registerAction(new BABYLON.SetValueAction(BABYLON.ActionManager.OnPickTrigger, mesh.material, "wireframe", true))
                //     .then(new BABYLON.DoNothingAction());
                // mesh.actionManager.registerAction(new BABYLON.SetStateAction(BABYLON.ActionManager.OnPickTrigger, light, "off"))
                //     .then(new BABYLON.SetStateAction(BABYLON.ActionManager.OnPickTrigger, light, "on"));
            };



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
                return d3.scaleLinear().domain([domain.min, domain.max]).range([-100, 100]).nice();
            }
        }
    }
})();