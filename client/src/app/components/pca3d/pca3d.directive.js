(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osPca3d', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/pca3d/pca3d.html',
            controller: Pca3dController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function Pca3dController(osApi, $state, $stateParams, $timeout, $scope, d3, THREE) {

            if (angular.isUndefined($stateParams.datasource)){
                $state.go("datasource");
                return;
            }

            // State
            var vm = this;
            vm.datasource = $stateParams.datasource;
            vm.geneSets = [];
            vm.geneSet = null;
            vm.toggleFilter = function() {
                angular.element(".container-filters").toggleClass("container-filters-collapsed");
                angular.element(".container-filter-toggle").toggleClass("container-filter-toggle-collapsed");
            }
            var rawData;
            
            // Elements
            var elChart = angular.element("#pca-chart");


            // Initalizae
            osApi.setBusy(true)("Loading Dataset");
            osApi.setDataset(vm.datasource).then(function(response) {
                var mtx = response.payload.rownames.filter(function(v) {
                    return v.indexOf("mtx.mrna") >= 0
                });

                mtx = mtx[mtx.length - 1].replace(".RData", "");
                osApi.setBusyMessage("Creating PCA Matrix");
                osApi.getPCA(vm.datasource, mtx).then(function() {
                    osApi.setBusyMessage("Loading Gene Sets");
                    osApi.getGeneSetNames().then(function(response) {

                        // Load Gene Sets
                        vm.geneSets = response.payload;
                        vm.geneSet = vm.geneSets[0];
                        $scope.$watch('vm.geneSet', function() {
                            update();
                        });
                    });
                });
            });

            // API Call To Calculate PCA
            var update = function() {
                osApi.setBusyMessage("Calculating PCA");
                osApi.getCalculatedPCA(vm.geneSet).then(function(response) {
                    osApi.setBusyMessage("Rendering PCA");
                    var payload = response.payload;
                    vm.pc1 = response.payload["importance.PC1"];
                    vm.pc2 = response.payload["importance.PC2"];
                    var scores = payload.scores;
                    var ids = payload.ids;
                    rawData = scores.map(function(d, i){
                        d.id = ids[i];
                        return d;
                    }, payload.ids);
                    draw()
                    osApi.setBusy(false);
                });
            };

            // Render
            function draw() {
            }


            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );

            var renderer = new THREE.WebGLRenderer();
            renderer.setSize( window.innerWidth, window.innerHeight );
            elChart.append( renderer.domElement );
            var geometry = new THREE.BoxGeometry( 1, 1, 1 );
            var material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
            var cube = new THREE.Mesh( geometry, material );
            scene.add( cube );
            camera.position.z = 5;

            var render = function () {
                requestAnimationFrame( render );

                cube.rotation.x += 0.1;
                cube.rotation.y += 0.1;

                renderer.render(scene, camera);
            };
            render();

        }
    }
})();
