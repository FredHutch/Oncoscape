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
        function ScatterController($q, osApi, osCohortService, $state, $stateParams, $timeout, $scope, d3, moment, $window, _) {
          
            // Elements
            var d3Chart = d3.select("#pca-chart").append("svg");
            var d3Points = d3Chart.append("g");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            var d3Brush = d3Chart.append("g");

            // Properties
            var scaleX, scaleY, axisX, axisY;
            var data, minMax;
            var width, height;

            var colors = {
                data: [],
                dataset: osApi.getDataSource().disease,
                name: "None",
                type: "color"
            };

            // View Model
            var vm = (function(vm, osApi) {
                vm.datasource = osApi.getDataSource();
                vm.geneSets = [];
                vm.geneSet = null;
                vm.search = "";
                osApi.query("render_pca", {
                        disease: vm.datasource.disease,
                        $fields: ['type', 'geneset', 'source']
                    })
                    .then(function(response) {
                     
                        var data = response.data.map(function(v){
                            return {a:v.geneset,b:v.source,c:v.type}
                        });
                        
                        var result = _.reduce(data,function(memo, val){ 
                            var tmp = memo;
                                _.each(val, function(fldr){
                                    if(!_.has(tmp, fldr)){
                                        tmp[fldr] = {}
                                    }
                                    tmp = tmp[fldr]
                                });
                            return memo
                        },{});
                        vm.geneSets = Object.keys(result).map(function(geneset){return {name: geneset, sources:
                            Object.keys(result[geneset]).map(function(source){ return {name:source, types:
                                Object.keys(result[geneset][source]).map(function(type) { return {name:type
                                }})
                            }})
                        }});
                      
                        vm.geneSet = vm.geneSets[0];
                    });
                return vm;

            })(this, osApi);

            // Updates PCA Types When Geneset Changes
            $scope.$watch('vm.geneSet', function() {
                if (vm.geneSet==null) return;
                vm.sources = vm.geneSet.sources;
                vm.source = vm.sources[0];
            });
            $scope.$watch('vm.source', function() {
                if (vm.geneSet==null) return;
                vm.pcaTypes = vm.source.types;
                vm.pcaType = vm.pcaTypes[0];
            });

            // Fetches PCA Data + Calculates Min Max for XYZ
            $scope.$watch('vm.pcaType', function(geneset) {
                if (geneset == null) return;
                osApi.query("brain_pcascores_cbio_prcomp-allgenes-cnv")
                    .then(function(response) {

                        vm.pc1 = response.data[0].pc1;
                        vm.pc2 = response.data[0].pc2;
                        vm.pc3 = response.data[0].pc3;

                        var keys = Object.keys(response.data[0].data);
                        data = keys.map(function(key) {
                            this.data[key].id = key;
                            return this.data[key];
                        }, {
                            data: response.data[0].data
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

                        setData();
                    });
            });

            var gl = (function(){

    
                // Renderer
                var renderer = new THREE.WebGLRenderer({antialias: true});
                renderer.setPixelRatio( window.devicePixelRatio );
                renderer.setSize(500,560);
                renderer.setClearColor(0xFFFFFF, 1.0);
                renderer.clear();
                $("#scatter-chart").append(renderer.domElement);

                // Raycaster
                var raycaster = new THREE.Raycaster();
				var mouse = new THREE.Vector2();
                var intersects, INTERSECTED;
                var PARTICLE_SIZE = 3;

                // Material
                var material = new THREE.ShaderMaterial( {

					uniforms: {
						color:   { value: new THREE.Color( 0xffffff ) },
						texture: { value: new THREE.TextureLoader().load( "assets/images/disc.png" ) }
					},
					vertexShader: document.getElementById( 'vertexshader' ).textContent,
					fragmentShader: document.getElementById( 'fragmentshader' ).textContent,

					alphaTest: 0.3,

				} );

                // geometry
                var particles;
                var geometry = new THREE.BufferGeometry();

                // Scene
                var scene = new THREE.Scene();

                // Camera
                var camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
			    camera.position.z = 250;

                var controls = new THREE.OrbitControls( camera, renderer.domElement );
				controls.enableDamping = true;
				controls.dampingFactor = 0.25;
				controls.enableZoom = true;

                function animate() {
				    requestAnimationFrame( animate );
				    render();
                }

                // Track mouseunction 
                function onMouseMove( event ) {
                    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
                    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;		
                }
                window.addEventListener( 'mousemove', onMouseMove, false );
	            function onWindowResize() {
				    camera.aspect = window.innerWidth / window.innerHeight;
				    camera.updateProjectionMatrix();
				    renderer.setSize( window.innerWidth, window.innerHeight );
			    }
                window.addEventListener( 'resize', onWindowResize, false );

                var setData = function(data, minMax){
                    var positions = new Float32Array( data.length * 3 );
                    var colors = new Float32Array( data.length * 3 );
                    var sizes = new Float32Array( data.length );
                    var color = new THREE.Color();
                    for ( var i = 0, l = data.length; i < l; i ++ ) {
                        var si = i*3;
                        positions[si] = data[i][0];
                        positions[si+1] = data[i][1];
                        positions[si+2] = data[i][2];
                        color.setRGB(.5,.5,.5);
                        color.toArray(colors, i*3);
                        sizes[i] = PARTICLE_SIZE;
                    }

                    geometry.addAttribute( 'position', new THREE.BufferAttribute( positions, 3 ) );
                    geometry.addAttribute( 'customColor', new THREE.BufferAttribute( colors, 3 ) );
				    geometry.addAttribute( 'size', new THREE.BufferAttribute( sizes, 1 ) );

                    particles = new THREE.Points( geometry, material );
                    scene.add( particles );                  
                    animate();
                }
                var setSelected = function(ids){

                }

                var selectedColor =  new THREE.Color( 0xff0000 );

                function render() {
//                    	particles.rotation.x += 0.0005;
//				particles.rotation.y += 0.001;

				var geometry = particles.geometry;
				var attributes = geometry.attributes;

				raycaster.setFromCamera( mouse, camera );

				intersects = raycaster.intersectObject( particles );

				if ( intersects.length > 0 ) {

					if ( INTERSECTED != intersects[ 0 ].index ) {

						attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;

						INTERSECTED = intersects[ 0 ].index;

						attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE * 1.25;
						attributes.size.needsUpdate = true;

					}

				} else if ( INTERSECTED !== null ) {

					attributes.size.array[ INTERSECTED ] = PARTICLE_SIZE;
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

                    renderer.render( scene, camera );
                }

                return {
                    setData:setData,
                    setSelected: setSelected
                }
            })();

            var d3 = (function(){

                var setData = function(data, minMax){
                    
                }
                var setSelected = function(ids){
                    
                }
                return {
                    setData:setData,
                    setSelected: setSelected
                }
            })();
        
            function setData() {
                gl.setData(data, minMax);
                d3.setData(data, minMax);
            }

         
        }
    }
})();
