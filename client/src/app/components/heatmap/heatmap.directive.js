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
        function HeatmapController(d3, osApi, $state, $timeout, $scope, $stateParams, $window, _, $http) {

            // view Model
            var vm = this;
            vm.data = { types: ["molecular", "patient correlation"],
                        tables: osApi.getDataSource().collections}

            vm.rowLabels = vm.colLabels = vm.gridlines = false;
            vm.rowDendrogram = vm.colDendrogram = false;
            vm.colorSchemes = [
                { name: 'Blues', value: ["#303f9f", "#03a9f4"] },
                { name: 'Black / Blue', value: ["#000000", "#1d85cb"] },
                { name: 'Black / Red', value: ["#000000", "#D32F2F"] },
                { name: 'Red / Yellow', value: ["#D32F2F", "#FFEB3B"] }
            ]
            vm.colorScheme = vm.colorSchemes[0]
            vm.scales = [{ name: 'None' }, { name: 'Row' }, { name: 'Column' }]
            vm.scale = vm.scales[2];
            vm.dendrogramClusters = [
                { name: 'One', value: 1 },
                { name: 'Two', value: 2 },
                { name: 'Three', value: 3 },
                { name: 'Four', value: 4 },
                { name: 'Five', value: 5 },
                { name: 'Six', value: 6 },
                { name: 'Seven', value: 7 },
                { name: 'Eight', value: 8 },
                { name: 'Nine', value: 9 },
                { name: 'Ten', value: 10 }
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
            var geneIds = []

            // Setup Watches
            $scope.$watch("vm.data.name", function() {
                if(!vm.data.name) return
                callMethod()
            })
            $scope.$watch("vm.data.type", function() {
                if(!vm.data.type) return
                callMethod()
            })

            function callMethod(){
                osApi.setBusy(true);
                var collections = vm.data.tables.filter(function(d){return d.name == vm.data.name})
                
                if(vm.data.type == "molecular")
                    loadData(collections[0].collection)
                else if(vm.data.type == "patient correlation"){
                    Distancequery(collections[0].collection, collections[0].collection, geneIds).then(function(response) {
                        
                        var d = response.data;
                        if(angular.isDefined(d.reason)){
                            console.log(vm.data.name+": " + d.reason)
                            // Distance could not be calculated on geneset given current settings
                            window.alert("Sorry, Distance could not be calculated\n" + d.reason)
    
                            osApi.setBusy(false)
                            return;
                        }
    
                        args = {
                            data: d.D.map(function(v) {
                                v.d.forEach(function(key) {
                                    if (this[key] == null) this[key] = 0;
                                }, v.d);
                                v.s= v.m
                                v.m = v.id
                                return v;
                            })
                        };
                        vm.loadHeatmap();

                    })
                }
            }

            function Distancequery(collection1, collection2, geneIds) {
                var payload = { molecular_collection: collection1,molecular_collection2: collection2, genes:geneIds};
                return $http({
                    method: 'POST',
                 url: "https://dev.oncoscape.sttrcancer.io/cpu/distance",
                // url: "https://oncoscape-test.fhcrc.org/cpu/distance",
                // url: "http://localhost:8000/distance",
                    data: payload
                });
            }

            function axis(svg, data, width, height, x, y, rotated) {
                svg.select("g").remove();
                if (rotated ? !vm.colLabels : !vm.rowLabels) return;

                svg
                    .attr("width", width).attr("height", height)
                    .style("position", "absolute")
                    .style("left", x)
                    .style("top", y);

                var g = svg.append("g");
                var yScale = d3.scaleLinear().domain([0, data.length]).range([0, rotated ? width : height]);

                var textAnchor = (rotated) ? "start" : "start";
                var textX = (rotated) ? 20 : 10;
                var labels = g.selectAll('label').data(data);

                labels
                    .enter().append("text")
                    .attr(rotated ? "x" : "y", function(d, i) { return yScale(i + .8); })
                    .attr(rotated ? "y" : "x", textX)
                    .attr("text-anchor", textAnchor)
                    .attr("font-size", "12px")
                    .text(function(d) { return d; });
            }

            function dendrogram(svg, data, width, height, xPos, yPos, rotated) {

                svg.select("g").remove();
                if (rotated ? !vm.colDendrogram : !vm.rowDendrogram) return;

                var hierarchy = d3.hierarchy(data);

                var cluster = d3.cluster()
                    .separation(function() { return 1; })
                    .size((rotated) ? [width, height] : [height, width]);

                var x = d3.scaleLinear()
                    .domain([0, (rotated) ? height : width])
                    .range([0, (rotated) ? height : width]);

                var y = d3.scaleLinear()
                    .domain([0, data.height])
                    .range([(rotated) ? height : width, 0]);

                var c = cluster(hierarchy);

                var links = c.links().map(function(l) {
                    return {
                        source: { x: l.source.x, y: l.source.data.height },
                        target: { x: l.target.x, y: l.target.data.height },
                        edgePar: l.target.data.edgePar
                    };
                });

                var dendrG = svg
                    .attr("width", width)
                    .attr("height", height)
                    .style("position", "absolute")
                    .style("left", xPos)
                    .style("top", yPos)
                    .append("g")

                dendrG.append("rect")
                    .attr("width", (rotated) ? height : width)
                    .attr("height", (rotated) ? width : height)
                    .style("fill", "#FFF")

                if (rotated) {
                    var transform = "rotate(90," + height / 2 + "," + height / 2 + ") translate(0," + (-width + height) + ")"
                    dendrG.attr("transform", transform);
                }

                var lines = dendrG.selectAll("polyline").data(links);
                lines
                    .enter().append("polyline")
                    .attr("class", "denolink")
                    .attr("points", function(d) {
                        return y(d.source.y) + "," + d.source.x + " " +
                            y(d.source.y) + "," + d.target.x + " " +
                            y(d.target.y) + "," + d.target.x;
                    })
                    .style("stroke", function(d) {
                        return d.edgePar.col;
                    });

                return {
                    g: dendrG,
                    scaleY: y,
                    scaleX: x,
                    rotated: rotated,
                    data: links
                }
            }

            function heatmap(svg, data, width, height, x, y) {


                svg.select("g").remove();
                svg.attr("width", width).attr("height", height).style("left", x).style("top", y).style("position", "absolute");

                var map = svg.append("g").attr("width", width).attr("height", height);
                var brush = svg.append("g").attr("width", width).attr("height", height).attr("class", "brush");

                var maxValue = Math.max.apply(null, data.data);
                var minValue = Math.min.apply(null, data.data);
                var color = d3.scaleLinear().domain([minValue, maxValue]).range(vm.colorScheme.value);

                var cols = data.dim[0];
                var rows = data.dim[1];

                var xScale = d3.scaleLinear().domain([0, cols]).range([0, width]);
                var yScale = d3.scaleLinear().domain([0, rows]).range([0, height]);

                var grid = (vm.gridlines) ? 1 : -1;

                function brushend() {

                    if (!d3.event.sourceEvent) return; // Only transition after input.
                    if (!d3.event.selection) return; // Ignore empty selections.
                    
                    d3.event.selection.map(function(v) { return this.invert(v[0], v[1]); }, xScale).map(Math.round);
                    //var span = colBounds[1] - colBounds[0];
                    //var start = colBounds[0];
                    //var ids = data.cols.splice(start, span);

                    var coords = d3.event.selection;
                    //coords[0][0] = colBounds[0] * width;
                    coords[0][1] = 0;
                    //coords[1][0] = colBounds[1] * width;
                    coords[1][1] = height;

                    d3.select(this)
                        .transition()
                        .call(d3.event.target.move, coords);

                }
                brush.call( d3.brush().on("end", brushend) )

                var boxW = xScale(1) - grid;
                var boxH = yScale(1) - grid;

                var boxes = map.selectAll('rect').data(data.data);
                boxes
                    .enter().append("rect")
                    .attr("class", "box")
                    .attr("colIndex", function(d, i) { 
                        return i % cols; })
                    .attr("rowIndex", function(d, i) { 
                        return Math.floor(i / cols); })
                    .attr("x", function(d, i) { return xScale(i % cols); })
                    .attr("y", function(d, i) { return yScale(Math.floor(i / cols)); })
                    .attr("width", boxW)
                    .attr("height", boxH)
                    .attr("fill", function(d) { 
                        return color(d); });

                return {
                    g: map,
                    scaleY: yScale,
                    scaleX: xScale,
                    data: data.data,
                    cols: cols,
                    rows: rows,
                    boxW: boxW,
                    boxH: boxH
                }
            }

            function zoom() {

                /*
                                var xZoomBehavior = d3.zoom().scaleExtent([1, 5]);
                                var yZoomBehavior = d3.zoom().scaleExtent([1, 5]);
                                colDendObj.g.call(xZoomBehavior);
                                rowDendObj.g.call(yZoomBehavior);
                                xZoomBehavior.on('zoom', function() {

                                    var map = colmapObj;
                                    var mapX = d3.event.transform.rescaleY(map.scaleX);

                                    var boxW = map.scaleX(1);

                                    map.g.selectAll('.box').data(map.data)
                                        .attr("x", function(d, i) { return mapX(i % map.cols); })
                                        .attr("y", function(d, i) { return map.scaleY(i % map.rows); })
                                        .attr("width", boxW)

                                    var col = colDendObj;
                                    var colY = col.scaleY;
                                    var colX = d3.event.transform.rescaleY(col.scaleX);
                                    
                                    col.g.selectAll("polyline")
                                        .data(col.data)
                                        .attr("points", function(d){
                                            return colY(d.source.y) + "," + colX(d.source.x) + " " +
                                            colY(d.source.y)+ "," + colX(d.target.x) + " " +
                                            colY(d.target.y)+ "," + colX(d.target.x);
                                        });
                                });
                                yZoomBehavior.on('zoom', function() {

                                    var row = rowDendObj;
                                    var rowY = row.scaleY;
                                    var rowX = d3.event.transform.rescaleY(row.scaleX);
                                    
                                    var map = colmapObj;
                                    var mapY = d3.event.transform.rescaleX(map.scaleY);

                                    var boxW = scaleX(1);
                                    var boxH = yScale(1)-grid;

                                    map.g.selectAll('.box').data(map.data)
                                        .attr("x", function(d, i) { return map.scaleY(i % map.cols); })
                                        .attr("y", function(d, i) { return mapY(i % map.rows); })
                                        .attr("width", boxW)
                                    
                                    row.g.selectAll("polyline")
                                        .data(row.data)
                                        .attr("points", function(d){
                                            return rowY(d.source.y) + "," + rowX(d.source.x) + " " +
                                            rowY(d.source.y)+ "," + rowX(d.target.x) + " " +
                                            rowY(d.target.y)+ "," + rowX(d.target.x);
                                        });
                                });
                */
            }
            
            function getHeatmap(args){
                var genes = args.data.reduce(function(p,c){ 
                    p.push(c.m)
                    return p
                },[]) 
                var d ={
                    matrix: args.data.map(function(d){ return d.d }),
                    data:  _.flatten(args.data.map(function(d){ return d.d })),
                    dim: [args.data[0].s.length,genes.length],
                    rows: args.data[0].s,
                    cols: genes
                }

                return d
            }

            osApi.setBusy(true);

            var loadData = function(collection) {
                osApi.query(collection, {
                    '$limit': 100
                }).then(function(response) {
                    args = {
                        data: response.data.map(function(v) {
                            v.d.forEach(function(key) {
                                if (this[key] == null) this[key] = 0;
                            }, v.d);
                            return v;
                        })
                    };
                    vm.loadHeatmap();
                });
            };
            vm.loadHeatmap = function() {
                osApi.setBusy(true);
                rowDend.select("g").remove();
                colDend.select("g").remove();
                colmap.select("g").remove();
                args.scale = vm.scale.name.toLowerCase();
                args.kcol = args.krow = vm.dendrogramCluster.value;
                data = getHeatmap(args)
                vm.draw();
                osApi.setBusy(false);
               
            }
            vm.draw = function() {

                var layout = osApi.getLayout();
                var width = $window.innerWidth - layout.left - layout.right - 40;
                var height = $window.innerHeight - 160; //10
                var hmWidth = width - ((vm.rowLabels) ? 160 : 0) - ((vm.rowDendrogram) ? 80 : 0);
                var hmHeight = height - ((vm.colLabels) ? 160 : 0) - ((vm.colDendrogram) ? 80 : 0);
                //colmapObj = 
                heatmap(colmap, data,
                    hmWidth,
                    hmHeight,
                    (vm.rowDendrogram ? 80 : 0) + layout.left + 20,
                    (vm.colDendrogram ? 80 : 0));

                //rowDendObj = 
                dendrogram(rowDend, data.rows,
                    80, hmHeight,
                    layout.left + 20, (vm.colDendrogram ? 80 : 0), false);

                //colDendObj = 
                dendrogram(colDend, data.cols,
                    hmWidth, 80,
                    (vm.rowDendrogram ? 80 : 0) + layout.left + 20, 0, true);

                axis(xaxis,
                    data.rows,
                    160, hmHeight, hmWidth + (vm.rowDendrogram ? 80 : 0) + layout.left + 20, (vm.colDendrogram ? 80 : 0), false);

                axis(yaxis, data.cols,
                    hmWidth, 160, (vm.rowDendrogram ? 80 : 0) + layout.left + 20, hmHeight + (vm.colDendrogram ? 80 : 0), true);

                zoom();
            };

            vm.data.type = vm.data.types[0]            
            vm.data.name = vm.data.tables[0].name

            osApi.onResize.add(vm.draw);
            angular.element($window).bind('resize', _.debounce(vm.draw, 300));
        }
    }
})();