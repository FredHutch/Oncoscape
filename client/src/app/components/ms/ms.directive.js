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

            function createCluster(_vm, _engine, _scene, _spriteManager) {
                var vm = _vm;
                var engine = _engine;
                var scene = _scene;
                var spriteManager = _spriteManager;

                function setDimensions() {

                }

                function setLayout(layout) {
                    if (angular.isUndefined(layout)) return;
                    var sphere = BABYLON.Mesh.CreateSphere('sphere1', 16, 2, scene);
                    sphere.position = new BABYLON.Vector3(0, 0, 0);

                    var domain = layout.reduce(function(p, c) {
                        var mm = c.d.reduce(function(p, c) {
                            if (c < p.min) p.min = c;
                            if (c > p.max) p.max = c;
                            return p;
                        }, { min: Infinity, max: -Infinity });
                        if (mm.min < p.min) p.min = mm.min;
                        if (mm.max > p.max) p.max = mm.max;
                        return p;
                    }, { min: Infinity, max: -Infinity });
                    var scale = d3.scaleLinear().domain([domain.min, domain.max]).range([-50, 50]).nice();
                    var spheres = layout.map(function(item) {
                        var sphere = new BABYLON.Sprite("player", spriteManager)
                            // var sphere = BABYLON.Mesh.CreateSphere(item.id, 8, 2, scene);
                            // sphere.material = material;
                        sphere.position = new BABYLON.Vector3(scale(item.d[0]), scale(item.d[1]), scale(item.d[2]));
                        return sphere;
                    });

                }
                return {
                    setDimensions: setDimensions,
                    setLayout: setLayout
                };
            }





            var vm = this;
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


            // Loading ...
            osApi.setBusy(true);
            var canvas = document.getElementById('renderCanvas');
            var engine = new BABYLON.Engine(canvas, true);
            var scene = new BABYLON.Scene(engine);
            scene.clearColor = new BABYLON.Color3(1, 1, 1);
            var spriteManagerBall = new BABYLON.SpriteManager("treesManagr", "assets/images/blueball.png", 5000, 100, scene);

            var clusterSample = createCluster(vm.sample, engine, scene, spriteManagerBall);
            //var clusterGene = createCluster(vm.gene, engine, scene, material);


            var createScene = function() {
                // create a basic BJS Scene object



                var camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", 1, 0.8, 10, new BABYLON.Vector3(0, 0, 0), scene);
                // create a FreeCamera, and set its position to (x:0, y:5, z:-10)
                //var camera = new BABYLON.FreeCamera('camera1', new BABYLON.Vector3(0, 0, 600), scene);

                // target the camera to scene origin
                camera.setTarget(BABYLON.Vector3.Zero());

                // attach the camera to the canvas
                camera.attachControl(canvas, false);

                // create a basic light, aiming 0,1,0 - meaning, to the sky
                var light = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
                // light.diffuse = new BABYLON.Color3(1, 1, 1);
                // light.specular = new BABYLON.Color3(1, 1, 1);
                // light.groundColor = new BABYLON.Color3(0, 0, 0);


                // return the created scene
                return scene;
            };
            var scene = createScene();
            $scope.$watch("vm.sample.layout", function(layout) {
                osApi.query(osApi.getDataSource().disease + "_cluster", {
                        disease: vm.datasource.disease,
                        geneset: layout.geneset,
                        input: layout.input,
                        source: layout.source
                    })
                    .then(function(response) {
                        clusterSample.setLayout(response.data[0].scores);
                    });
            });

            // $scope.$watch("vm.gene.layout", function(layout) {
            //     osApi.query(osApi.getDataSource().disease + "_cluster", {
            //             disease: vm.datasource.disease,
            //             geneset: layout.geneset,
            //             input: layout.input,
            //             source: layout.source
            //         })
            //         .then(function(response) {
            //             clusterGene.setLayout(response.data[0].scores);
            //         });
            // });



            engine.runRenderLoop(function() {
                scene.render();
            });
            window.addEventListener('resize', function() {
                engine.resize();
            });
        }
    }
})();