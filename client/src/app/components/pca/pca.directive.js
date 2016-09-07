(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osPca', explore);

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/pca/pca.html',
            controller: PcaController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function PcaController($q, osApi, osCohortService, $state, $stateParams, $timeout, $scope, d3, moment, $window, _) {

            // Retrieve Selected Patient Ids From OS Service
            var pc = osCohortService.getPatientCohort();
            if (pc==null){ osCohortService.setPatientCohort([],"All Patients") }
            var selectedIds = (pc==null) ? [] : pc.ids;

            var osCohortServiceUpdate = true;
            osCohortService.onPatientsSelect.add(function(patients){
                if (osCohortServiceUpdate){
                    selectedIds = patients.ids;
                    setSelected();
                }else{
                    osCohortServiceUpdate = true;
                }
            });
       
            function setSelected() {
                if (selectedIds.length == 0) {
                    d3Points.selectAll(".pca-node-selected").classed("pca-node-selected", false);
                } else {
                    d3Points.selectAll("circle").classed("pca-node-selected", function() {
                        return (selectedIds.indexOf(this.__data__.id) >= 0)
                    });
                }
            }

            // Elements
            var d3Chart = d3.select("#pca-chart").append("svg");
            var d3Points= d3Chart.append("g");
            var d3xAxis = d3Chart.append("g");
            var d3yAxis = d3Chart.append("g");
            var d3Brush = d3Chart.append("g");

            // Properties
            var scaleX, scaleY, axisX, axisY;
            var data, minMax;

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
                        $fields: ['type','geneset','source']
                    })
                    .then(function(response) {
                        var mr = response.data.reduce( function (p, c) {
                            if (!p.hasOwnProperty(c.geneset)) p[c.geneset] = [];
                            p[c.geneset].push({name:c.type, source:c.source, label:(c.type+"-"+c.source).toUpperCase().replace(/-/gi," - ")});
                            return p;
                        }, {});
                        vm.geneSets = Object.keys(mr).reduce(function(p,c){
                          p.rv.push( {name:c, types:p.values[c], label:c.toUpperCase()});
                          return p;
                        }, {rv:[], values:mr}).rv.sort(function(a,b){
                            return a.label > b.label;
                        });

                        vm.geneSet = vm.geneSets[0];
                    });
                return vm;

            })(this, osApi);

            // Updates PCA Types When Geneset Changes
            $scope.$watch('vm.geneSet', function(geneset) {
                try{
                    // Sort PCA Types Alphabetically Then By Source R-Alpha (to put ucsc first)
                    vm.pcaTypes = vm.geneSet.types.sort(function(a,b){
                        if (a.name!=b.name) return a.name > b.name;
                        else return a.source < b.source;
                    });
                    vm.pcaType  = vm.pcaTypes[0];
                }catch(e){}
            });

            // Fetches PCA Data + Calculates Min Max for XYZ
            $scope.$watch('vm.pcaType', function(geneset) {
                if (geneset == null) return;
                osApi.query("render_pca", {
                        disease: vm.datasource.disease,
                        geneset: vm.geneSet.name,
                        type: vm.pcaType.name,
                        source: vm.pcaType.source
                    })
                    .then(function(response) {
                        vm.pc1 = response.data[0].pc1;
                        vm.pc2 = response.data[0].pc2;
                        var keys = Object.keys(response.data[0].data);
                        data = keys.map(function(key) {
                            this.data[key].id = key;
                            return this.data[key];
                        }, {
                            data: response.data[0].data
                        });
                        minMax = data.reduce(function(p,c){
                            p.xMin = Math.min(p.xMin, c[0]);
                            p.xMax = Math.max(p.xMax, c[0]);
                            p.yMin = Math.min(p.yMin, c[1]);
                            p.yMax = Math.max(p.yMax, c[1]);
                            return p;
                        }, {xMin:Infinity,yMin:Infinity,xMax:-Infinity,yMax:-Infinity});
         
                       minMax.xMax = Math.max(Math.abs(minMax.xMin), minMax.xMax);
                       minMax.xMin = -minMax.xMax;
                       minMax.yMax = Math.max(Math.abs(minMax.yMin), minMax.yMax);
                       minMax.yMin = -minMax.yMax;

                        draw();
                    });
            });

            function setColors(){
                
                // Set Legend
                vm.legendCaption = colors.name;
                vm.legendNodes = colors.data;
                
                // If No Color Specified
                if(colors.name=="None"){
                    vm.legendCaption = "";
                    data.forEach(function(v){  v.color = '#0096d5'; });

                // Color Based On V
                }else{
                    var degMap =colors.data.reduce(function(p,c){
                        for (var i=0; i<c.values.length; i++){
                            p[c.values[i]] = c.color;
                        }
                        return p;
                    },{});
                    data = data.map(function(v){ 
                        v.color = (this[v.id]!=undefined) ? this[v.id] : "#DDD";
                        return v;
                    },degMap);
                }
            }

            function draw() {

                // Colorize
                setColors();

                // Size
                var layout = osApi.getLayout();
                var width  = $window.innerWidth - layout.left - layout.right;
                var height = $window.innerHeight - 120; //10
                $("#pca-chart").css({
                    "width":width+"px",
                    "padding-left":layout.left+"px"
                });
                d3Chart.attr( "width", width).attr("height", height);
                d3Brush.attr( "width", width).attr("height", height);
                d3Points.attr("width", width).attr("height", height);

                // Scale
                scaleX = d3.scaleLinear().domain([minMax.xMin, minMax.xMax]).range([50,width-50]).nice();
                scaleY = d3.scaleLinear().domain([minMax.yMin, minMax.yMax]).range([50,height-50]).nice();
               
                // Draw
                var circles = d3Points.selectAll("circle").data(data);
                circles.enter().append("svg:circle")
                    .attr("class", "pca-node")
                    .attr("cx", function(d) { return scaleX(d[0]); })
                    .attr("cy", function(d) { return scaleY(d[1]); })
                    .style("fill", function(d,i) { return d.color; });
                circles.exit()
                    .transition()
                    .duration(200)
                    .delay(function(d, i) { return i / 300 * 100; })
                    .style("fill-opacity", "0")
                    .remove();
                circles
                    .style("fill", function(d,i) { return d.color; } )
                    .transition()
                    .duration(750)
                    .delay(function(d, i) { return i / 300 * 100; })
                    .attr("cx", function(d) { return scaleX(d[0]);})
                    .attr("cy", function(d) { return scaleY(d[1]);})
                    .style("fill", function(d,i) {  return d.color; } )
                    .style("fill-opacity", .8);

                // Axis
                axisX = d3.axisTop().scale(scaleX).ticks(5);
                axisY = d3.axisLeft().scale(scaleY).ticks(5);

                d3yAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(0, " + scaleY(0) + ")")
                    .call(axisX)
                    .append("text")
                    .attr("x", 50)
                    .attr("y", 15)
                    .text("PC1");
                   
                d3xAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(" + scaleX(0) + ", 0)")
                    .call(axisY)
                    .append("text")
                    .attr("y", 55)
                    .attr("x", 25)
                    .text("PC2");
                    

                // Brush
                var brush = d3.brush()
                    .on("end", function(e){
                        
                        if (!d3.event.selection){
                            osCohortService.setPatientCohort([], "PCA");
                            return;
                        } 

                        var bv = d3.event.selection;
                        var xMin = bv[0][0];
                        var xMax = bv[1][0];
                        var yMin = bv[0][1];
                        var yMax = bv[1][1];

                        var ids = d3Points.selectAll("circle").data().filter(function(d){
                            var x = scaleX(d[0]);
                            var y = scaleY(d[1]);
                            return (x>xMin && x<xMax && y>yMin && y<yMax);
                        }).map(function(d){
                            return d.id;
                        });

                        osCohortService.setPatientCohort(ids, "PCA");
                        

                    });

                d3Brush.attr("class","brush").call(brush)

                setSelected();
                
            }

            // Listen For Resize
            osApi.onResize.add(draw);
            angular.element($window).bind('resize', _.debounce(draw, 300) );

            var onPatientColorChange = function(value){
                colors = value;
                vm.showPanelColor = false;
                draw();
            }
            
            osCohortService.onPatientColorChange.add(onPatientColorChange);

            // Destroy
            $scope.$on('$destroy', function() {
                osCohortService.onPatientColorChange.remove(onPatientColorChange);
            });
        }
    }
})();