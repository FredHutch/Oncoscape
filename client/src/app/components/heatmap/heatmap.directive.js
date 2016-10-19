(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osHeatmap', heatmap);

    /** @ngInject */
    function heatmap() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/heatmap/heatmap.html',
            controller: HeatmapController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function HeatmapController(d3, osApi, osCohortService, $state, $timeout, $scope, $stateParams, $window) {

            // view Model
            var vm = this;
            vm.datasource = osApi.getDataSource();
            vm.rowLabels = vm.colLabels = vm.gridlines = false;
            vm.rowDendrogram = vm.colDendrogram = true;
            vm.colorSchemes = [
                {name:'Blues', value:["#303f9f","#03a9f4"]},
                {name:'Black / Blue', value:["#000000","#1d85cb"]},
                {name:'Black / Red', value:["#000000","#D32F2F"]},
                {name:'Red / Yellow', value:["#D32F2F","#FFEB3B"]},
            ]
            vm.colorScheme = vm.colorSchemes[0]
            vm.scales = [{name:'None'},{name:'Row'},{name:'Column'}]
            vm.scale = vm.scales[2];
            vm.dendrogramClusters = [
                {name:'One',value:1},
                {name:'Two',value:2},
                {name:'Three',value:3},
                {name:'Four',value:4},
                {name:'Five',value:5},
                {name:'Six',value:6},
                {name:'Seven',value:7},
                {name:'Eight',value:8},
                {name:'Nine',value:9},
                {name:'Ten',value:10}
            ];
            vm.dendrogramCluster = vm.dendrogramClusters[6];

            // Element References
            var elChart = d3.select("#heatmap-chart");
            var colDend = elChart.append("svg").classed("dendrogram colDend", true);
            var rowDend = elChart.append("svg").classed("dendrogram rowDend", true);
            var colmap = elChart.append("svg").classed("colormap", true);
            var xaxis = elChart.append("svg").classed("axis xaxis", true);
            var yaxis = elChart.append("svg").classed("axis yaxis", true);
            
            // Load Inital Data
            var args;
            var data;

           
            function axis(svg, data, width, height, x, y, rotated){
                svg.select("g").remove();
                if (rotated ? !vm.colLabels : !vm.rowLabels) return;
                    
                svg
                .attr("width", width).attr("height", height)
                .style("position","absolute")
                .style("left",x)
                .style("top",y);

                var g = svg.append("g");
                var y = d3.scaleLinear().domain([0, data.length]).range([0, rotated ? width:height]);

                var textAnchor = (rotated) ? "start" : "start";
                var textX = (rotated) ? 20 : 10;
                var labels = g.selectAll('label').data(data);
                
                labels
                    .enter().append("text")
                    .attr(rotated ? "x" : "y", function(d,i) { return y(i+.8); })
                    .attr(rotated ? "y" : "x", textX)
                    .attr("text-anchor", textAnchor)
                    .attr("font-size","12px")
                    .text( function(d){ return d; });
            }
            function dendrogram(svg, data, width, height, xPos, yPos, rotated) {
                
                svg.select("g").remove();
                if (rotated ? !vm.colDendrogram : !vm.rowDendrogram) return;

                var hierarchy = d3.hierarchy(data);

                var cluster = d3.cluster()
                    .separation(function(a, b) { return 1; })
                    .size((rotated) ? [width,height] : [height,width]);

                var y = d3.scaleLinear()
                    .domain([0, data.height+1])
                    .range([(rotated) ? height : width,0]);

                var c = cluster(hierarchy);

                var links = c.links().map(function(l,i){
                    return {
                        source: {x: l.source.x, y:y(l.source.data.height)},
                        target: {x: l.target.x, y:y(l.target.data.height)},
                        edgePar: l.target.data.edgePar
                    };
                });



                
                var dendrG = svg
                    .attr("width", width)
                    .attr("height", height)
                    .style("position","absolute")
                    .style("left", xPos)
                    .style("top", yPos)
                    .append("g")


                if (rotated){
                    var transform = "rotate(90," + height/2 + "," + height/2 + ") translate(0,"+(-width+height)+")"
                    dendrG.attr("transform", transform);
                }

                
                var lines = dendrG.selectAll("polyline").data(links);
                lines
                    .enter().append("polyline")
                    .attr("class", "denolink")
                    .attr("points", function(d,i){
                        return d.source.y + "," + d.source.x + " " +
                        d.source.y + "," + d.target.x + " " +
                        d.target.y + "," + d.target.x;
                    })
                    .style("stroke", function(d){
                        return d.edgePar.col;
                    });

            }


            function heatmap(svg, data, width, height,x,y){
                svg.select("g").remove();
                svg.attr("width", width).attr("height", height).style("left",x).style("top",y).style("position","absolute");
                var map = svg.append("g").attr("width", width).attr("height", height);
                var brush = svg.append("g").attr("width", width).attr("height", height).attr("class", "brush");
                var maxValue = Math.max.apply(null, data.data);
                var minValue = Math.min.apply(null, data.data);
                
                var color = d3.scaleLinear().domain([minValue, maxValue]).range(vm.colorScheme.value);
                var cols = data.dim[1];
                var rows = data.dim[0];
                var x = d3.scaleLinear().domain([0, cols]).range([0, width]);
                var y = d3.scaleLinear().domain([0, rows]).range([0, height]);
                var grid = (vm.gridlines) ? 1 : -1;

                function brushend(){
                    if (!d3.event.sourceEvent) return; // Only transition after input.
                    if (!d3.event.selection) return; // Ignore empty selections.
                    var colSpan = d3.event.selection.map(function(v){ return this.invert(v[0], v[1]); },x);
                    var rowSpan = d3.event.selection.map(function(v){ return this.invert(v[1], v[0]); },y);
                    //window.yyy = d3.select(this);
                    //debugger;
// d3.select(this).transition().x(0)
//                    d3.select(this).transition().call(d3.event.target.move, d1.map(x));
                    // console.log("COLS "+colSpan.join("-"))
                    // console.log("ROWS "+rowSpan.join("-"))

                    
                }
                brush.call(
                    d3.brush().on("end", brushend)
                )
                
                var boxes = map.selectAll('box').data(data.data);
                boxes
                    .enter().append("rect")
                    .property("colIndex", function(d, i) { return i % cols; })
                    .property("rowIndex", function(d, i) { return Math.floor(i / cols); })
                    .attr("x", function(d, i) { return x(i % cols); })
                    .attr("y", function(d, i) { return y(Math.floor(i / cols)); })
                    .attr("width", x(1)-grid)
                    .attr("height", y(1)-grid)
                    .attr("fill", function(d) { return color(d); })
            }
            
            osApi.setBusy(true);
             vm.loadData = function(){
                osApi.query("brca_psi_bradleylab_miso", {
                    '$limit': 100
                }).then(function(response) {
                    args = {data:response.data.map(function(v){ 
                        Object.keys(v.patients).forEach(function(key){
                            if (this[key]==null) this[key] = 0;
                        },v.patients);
                        return v.patients; 
                    })};
                    vm.loadHeatmap();
                });
            };
            vm.loadHeatmap = function(){
                osApi.setBusy(true);
                rowDend.select("g").remove();
                colDend.select("g").remove();
                colmap.select("g").remove();
                args.scale = vm.scale.name.toLowerCase();
                args.kcol = args.krow = vm.dendrogramCluster.value;
                osApi.getCpuApi().getHeatmap(args).then(function(v){
                    data = JSON.parse(v);
                    vm.draw();
                    osApi.setBusy(false);
                });
            }
            vm.draw = function(){
                
                var layout = osApi.getLayout();
                var width = $window.innerWidth - layout.left - layout.right - 40;
                var height = $window.innerHeight - 160; //10
                var hmWidth = width - ((vm.rowLabels) ? 160 : 0) - ((vm.rowDendrogram) ? 80 : 0);
                var hmHeight = height - ((vm.colLabels) ? 160 : 0) - ((vm.colDendrogram) ? 80 : 0);
                heatmap(colmap, data.matrix, 
                    hmWidth, 
                    hmHeight, 
                    (vm.rowDendrogram ? 80 : 0)+layout.left, 
                    (vm.colDendrogram ? 80 : 0));

                dendrogram(rowDend, data.rows,    
                    80, hmHeight, 
                    layout.left, (vm.colDendrogram ? 80 : 0) , false);

                dendrogram(colDend, data.cols,    
                    hmWidth, 80, 
                    (vm.rowDendrogram ? 80 : 0)+layout.left, 0, true);

                axis(xaxis, 
                    data.matrix.rows,     
                    160, hmHeight, hmWidth + (vm.rowDendrogram ? 80 : 0)+layout.left, (vm.colDendrogram ? 80 : 0), false);

                axis(yaxis, data.matrix.cols,
                    hmWidth, 160, (vm.rowDendrogram ? 80 : 0)+layout.left, hmHeight + (vm.colDendrogram ? 80 : 0), true);
            };
            
        

            
            vm.loadData();


            osApi.onResize.add(vm.draw);
            angular.element($window).bind('resize', _.debounce(vm.draw,300));
        }
    }
})();
