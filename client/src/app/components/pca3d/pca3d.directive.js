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
        function Pca3dController(osApi, $state, $stateParams, $timeout, $scope, d3, THREE, $window) {

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
                osApi.getCalculatedPCA2(vm.geneSet).then(function(response) {
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

            var scene = new THREE.Scene();
            var camera = new THREE.PerspectiveCamera( 50, $window.innerWidth / $window.innerHeight, 0.1, 1000 );
            camera.position.z = 60;
            
            var renderer = $window.WebGLRenderingContext ? new THREE.WebGLRenderer({ antialias: true }) : new THREE.CanvasRenderer();
            renderer.setPixelRatio( $window.devicePixelRatio );
            renderer.setSize( $window.innerWidth, $window.innerHeight );
            elChart.append( renderer.domElement );



            var draw = function(){
                var sphereThree = [];
                var numSphere = rawData.length;
                var sphereGeometry = new THREE.SphereGeometry(.1, 8, 8);
                var sphereMaterial = new THREE.MeshBasicMaterial({color: '#59a5fb'});//rgb(255, 0, 0)'});
                for(var idSphere = 0; idSphere < numSphere; idSphere++){
                    sphereThree[idSphere] = new THREE.Mesh(sphereGeometry, sphereMaterial);
                    var datum = rawData[idSphere];
                    sphereThree[idSphere].position.x = datum[0];
                    sphereThree[idSphere].position.y = datum[1];
                    sphereThree[idSphere].position.z = datum[2];
                    scene.add(sphereThree[idSphere]);
                }
                render();
            }
            

            var render = function () {

//                requestAnimationFrame( render );

                // if( !options.fixed ) {
                //     mesh.rotation.x += 0.005;
                //     mesh.rotation.y += 0.005;
                // }


                renderer.render( scene, camera );

            };

            function animate() {

  requestAnimationFrame( animate );
  controls.update();

}



  var controls = new THREE.OrbitControls( camera );
  controls.addEventListener( 'change', render );
    
        
animate();
            

           
            

        }
    }
})();
