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
        function HeatmapController(d3, osApi, $state, $timeout, $scope, $stateParams, $window, _, $http, $log) {

            // view Model
            var vm = this;
            vm.data = { method: {
                            types: ["molecular", "patient correlation"],
                            selected: null
                        },
                        table: {
                            types: osApi.getDataSource().collections,
                            selected: null },
                        default: {
                            cellsize : 10
                        }
                    }
                    
            vm.options = {
                order: {
                    types : [
                        {"value":"asis", name:"by cluster"},
                        {"value":"probecontrast",name:"by probe name and contrast name"},
                        {"value":"rows",name:"by probe name"},
                        {"value":"cols",name:"by contrast name"}],
                    selected: {name: "by cluster", i:0}
                },
                color : {
                    schemes : [
                        { name: 'Blues', value: ["#303f9f", "#03a9f4"] },
                        { name: 'Black / Blue', value: ["#000000", "#1d85cb"] },
                        { name: 'Black / Red', value: ["#000000", "#D32F2F"] },
                        { name: 'Red / Yellow', value: ["#D32F2F", "#FFEB3B"] },
                        { name: 'Red / Green', value: ['#005824','#1A693B','#347B53','#4F8D6B','#699F83','#83B09B','#9EC2B3','#B8D4CB','#D2E6E3','#EDF8FB','#FFFFFF','#F1EEF6','#E6D3E1','#DBB9CD','#D19EB9','#C684A4','#BB6990','#B14F7C','#A63467','#9B1A53','#91003F']}
                    ],
                    selected : {name: 'Red / Green', i:4},
                    bins : 10
                    },
                row : {
                    dendogram : false,
                    cellheight: vm.data.default.cellsize,
                    fit: false
                },
                col : {
                    dendogram: false,
                    cellwidth: 10,
                    fit: true
                }

            }
            vm.draw = function(){
                heatmap()
                osApi.setBusy(false)
            }   
         
            // Element References
            var mainSVG = d3.select("#heatmap-chart").append("svg") 
            var svg; 
            
            
            // Setup Watches
            $scope.$watch("vm.options.row.fit", function() {
                if(angular.isUndefined(vm.heatmap)) return
                osApi.setBusy(true)
                if(!vm.options.row.fit) vm.options.row.cellheight = vm.data.default.cellsize
                vm.draw()
            })
            $scope.$watch("vm.options.col.fit", function() {
                if(angular.isUndefined(vm.heatmap)) return
                osApi.setBusy(true)
                if(!vm.options.col.fit) vm.options.col.cellwidth = vm.data.default.cellsize
                vm.draw()
            })
            // $scope.$watch("vm.data.method.selected.name", function() {
            //     if(!vm.data.method.selected) return
            //     callMethod()
            // })
            // $scope.$watch("vm.data.table.selected.name", function() {
            //     if(!vm.data.table.selected) return
            //     if(!vm.data.method.selected )
            //         vm.data.method.selected = {name: vm.data.method.types[0], i:0}
            //     callMethod()
            // })
            // $scope.$watch("vm.options.order.selected.name", function() {
            //     if(!vm.options.order.selected) return
            //     order(vm.options.order.types[vm.options.order.selected.i].value);
            // })

            vm.callMethod = function(){
                osApi.setBusy(true);
                var collections = vm.data.table.types.filter(function(d){return d.name == vm.data.table.selected.name})
                var gIds = osApi.getGeneset().geneIds

                if(vm.data.method.selected.name == "molecular"){
                    osApi.query(collections[0].collection, {
                        '$limit': 100
                    }).then(function(response) {
                        
                        var temp = response.data
                        temp = temp.map(function(v) {
                            v.d.forEach(function(val) {
                                if (val == null) val = 0;
                            }, v.d);
                            return v;
                        })

                        var rows = temp.map(function(r,i){ 
                            return {id:r.m,i:i }
                        }) 
                        var cols = temp[0].s.map(function(c,i){
                            return {id:c, i:i}
                        })

                        vm.heatmap ={
                            data:  _.flatten(temp.map(function(d, i){ 
                                        return d.d.map(function(v, j) {return {row: i, col:j, value:v}})        
                                    })  ),
                            rows: rows,
                            cols: cols
                        }

                        vm.draw();
                    });
                }
                else if(vm.data.method.selected.name == "patient correlation"){
                    Distancequery(collections[0].collection, collections[0].collection, gIds).then(function(response) {
                        
                        var d = response.data;
                        if(angular.isDefined(d.reason)){
                            $log.log(vm.data.name+": " + d.reason)
                            // Distance could not be calculated on geneset given current settings
                            $window.alert("Sorry, Distance could not be calculated\n" + d.reason)
    
                            osApi.setBusy(false)
                            return;
                        }
    
                        var temp = response.data.D
                        temp = temp.map(function(v) {
                            v.d.forEach(function(key) {
                                if (this[key] == null) this[key] = 0;
                            }, v.d);
                            return v;
                        })

                        var rows = temp.map(function(r,i){ return {id:r.id,i:i }}) 
                        var cols = temp[0].m.map(function(c,i){  return {id:c, i:i} })

                        vm.heatmap ={
                            data:  _.flatten(temp.map(function(d, i){ 
                                        return d.d.map(function(v, j) {return {row: i, col:j, value:v}})        
                                    })  ),
                            rows: rows,
                            cols: cols
                        }
                        
                        vm.draw();

                    })
                }
            }
            vm.callOrder = function(){
                order(vm.options.order.types[vm.options.order.selected.i].value);
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

            function setHeatmapSize(){
                var layout = osApi.getLayout()
                if(vm.options.col.fit){
                    
                    var width = $window.innerWidth - layout.left - layout.right - 40;
                    vm.options.col.cellwidth = Math.round(width / vm.heatmap.cols.length)
                }
                if(vm.options.row.fit){
                    
                    var height = $window.innerHeight - 160; //10
                    vm.options.row.cellheight = Math.round(height / vm.heatmap.rows.length)
                }
            }
            function heatmap() {

                //credit: http://bl.ocks.org/ianyfchang/8119685

                setHeatmapSize()

                mainSVG.selectAll("g").remove();
                var margin = { top: 110, right: 10, bottom: 50, left: 110 };
                var width = vm.options.col.cellwidth*vm.heatmap.cols.length, 
                    height = vm.options.row.cellheight*vm.heatmap.rows.length ; 
                var legendElement = {width : Math.min(20, Math.max(vm.options.col.cellwidth*2.5, 40)),
                                    height: Math.max(10, vm.options.row.cellheight)
                };
                mainSVG.attr("width", width + margin.left + margin.right)
                        .attr("height", height + margin.top + margin.bottom)
                svg = mainSVG
                    .append("g")
                    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
                

                var MinMax = vm.heatmap.data.reduce(function(p,c){ 
                    if(p[0] > c.value) p[0] = c.value
                    if(p[1] < c.value) p[1] = c.value
                    return p}, [Infinity, - Infinity])

                var Bins = []                    
                var uniqueVals = vm.heatmap.data.reduce(function(p,c){
                    if(p.indexOf(c.value) == -1) p.push(c.value)
                    return p;
                }, [])
                if(uniqueVals.length <11)
                    Bins = uniqueVals.sort(function(a,b){ return a-b})
                else{
                    for(var i=0;i<vm.options.color.bins;i++){
                        Bins[i] = (MinMax[0] + (i * (MinMax[1]-MinMax[0])/vm.options.color.bins)).toPrecision(2)
                    }
              //      Bins = Bins.concat(MinMax[1])
                }

                var colors = vm.options.color.schemes[vm.options.color.selected.i].value
                var colorScale = d3.scaleQuantile()
                    .domain(Bins)
                    .range(colors);
            
             
                    
                var rowLabels = svg.append("g")
                    .selectAll(".rowLabelg")
                    .data(vm.heatmap.rows)
                    .enter()
                    .append("text")
                    .text(function (d) { return d.id; })
                    .attr("x", 0)
                    .attr("y", function (d) { return d.i * vm.options.row.cellheight; })
                    .style("text-anchor", "end")
                    .attr("transform", "translate(-6," + vm.options.row.cellheight / 1.5 + ")")
                    .attr("class", function (d,i) { 
                        return vm.options.row.cellheight < 5 ? "rowLabel small r"+i : "rowLabel mono r"+i
                        } ) 
                    .on("mouseover", function() {d3.select(this).classed("text-hover",true);})
                    .on("mouseout" , function() {d3.select(this).classed("text-hover",false);})
                   
                var colLabels = svg.append("g")
                    .selectAll(".colLabelg")
                    .data(vm.heatmap.cols)
                    .enter()
                    .append("text")
                    .text(function (d) { return d.id; })
                    .attr("x", 0)
                    .attr("y", function (d) { return d.i * vm.options.col.cellwidth; })
                    .style("text-anchor", "left")
                    .attr("transform", "translate("+vm.options.col.cellwidth/2 + ",-6) rotate (-90)")
                    .attr("class",  function (d,i) { 
                        return vm.options.col.cellwidth < 5 ? "colLabel small c"+i : "colLabel mono c"+i
                        } )
                    .on("mouseover", function() {d3.select(this).classed("text-hover",true);})
                    .on("mouseout" , function() {d3.select(this).classed("text-hover",false);})
              
                var heatMap = svg.append("g").attr("class","g3")
                        .selectAll(".cellg")
                        .data(vm.heatmap.data,function(d){return d.row+":"+d.col;})
                        .enter()
                        .append("rect")
                        .attr("x", function(d) { 
                            return vm.heatmap.cols[d.col].i * vm.options.col.cellwidth; })
                        .attr("y", function(d) { 
                            return vm.heatmap.rows[d.row].i * vm.options.row.cellheight; })
                        .attr("class", function(d){return "cell cell-border cr"+(d.row)+" cc"+(d.col);})
                        .attr("width", vm.options.col.cellwidth)
                        .attr("height", vm.options.row.cellheight)
                        .style("fill", function(d) { return colorScale(d.value); })
                        .on("mouseover", function(d){
                                //highlight text
                                d3.select(this).classed("cell-hover",true);
                                d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ 
                                    return ri==(d.row);});
                                d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ 
                                    return ci==(d.col);});
                        
                                //Update the tooltip position and value
                                d3.select("#tooltip")
                                .style("left", (d3.event.pageX+10) + "px")
                                .style("top", (d3.event.pageY-10) + "px")
                                .select("#value")
                                .text(vm.heatmap.rows[d.row].id+", "+vm.heatmap.cols[d.col].id+": "+d.value);  
                                //Show the tooltip
                                d3.select("#tooltip").classed("hidden", false);
                        })
                        .on("mouseout", function(){
                                d3.select(this).classed("cell-hover",false);
                                d3.selectAll(".rowLabel").classed("text-highlight",false);
                                d3.selectAll(".colLabel").classed("text-highlight",false);
                                d3.select("#tooltip").classed("hidden", true);
                        })
                        ;
                
                var legend = svg.selectAll(".legend")
                    .data(Bins)
                    .enter().append("g")
                    .attr("class", "legend");
               
                legend.append("rect")
                    .attr("x", function(d, i) { return legendElement.width * i; })
                    .attr("y", height+(vm.options.row.cellheight*2))
                    .attr("width", legendElement.width)
                    .attr("height", vm.options.row.cellheight)
                    .style("fill", function(d) { return colorScale(d); });
               
                legend.append("text")
                    .attr("class", "mono")
                    .text(function(d) { return d; })
                    .attr("width", legendElement.width)
                    .attr("x", function(d, i) { return legendElement.width * i; })
                    .attr("y", height + (vm.options.row.cellheight*4));
              

                
                // 
                var sa=d3.select(".g3")
                    .on("mousedown", function() {
                        if( !d3.event.altKey) {
                           d3.selectAll(".cell-selected").classed("cell-selected",false);
                           d3.selectAll(".rowLabel").classed("text-selected",false);
                           d3.selectAll(".colLabel").classed("text-selected",false);
                        }
                       var p = d3.mouse(this);
                       sa.append("rect")
                        .attr("rx", 0)
                        .attr("ry",0)
                        .attr("class","selection")
                        .attr("x",p[0])
                        .attr("y",p[1])
                        .attr("width",1)
                        .attr("height",1)
                       
                    })
                    .on("mousemove", function() {
                       var s = sa.select("rect.selection");
                    
                       if(!s.empty()) {
                            var p = d3.mouse(this),
                                d = {
                                    x       : parseInt(s.attr("x"), 10),
                                    y       : parseInt(s.attr("y"), 10),
                                    width   : parseInt(s.attr("width"), 10),
                                    height  : parseInt(s.attr("height"), 10)
                                },
                                move = {
                                    x : p[0] - d.x,
                                    y : p[1] - d.y
                                }
                            ;
                    
                            if(move.x < 1 || (move.x*2<d.width)) {
                                d.x = p[0];
                                d.width -= move.x;
                            } else {
                                d.width = move.x;       
                            }
                    
                            if(move.y < 1 || (move.y*2<d.height)) {
                                d.y = p[1];
                                d.height -= move.y;
                            } else {
                                d.height = move.y;       
                            }
                            s.attr("x",d.x).attr("y",d.y).attr("width",d.width).attr("height",d.height);
                    
                               // deselect all temporary selected state objects
                            d3.selectAll('.cell-selection.cell-selected').classed("cell-selected", false);
                            d3.selectAll(".text-selection.text-selected").classed("text-selected",false);
                            d3.selectAll('.cell').filter(function(cell_d) {
                               if(
                                   !d3.select(this).classed("cell-selected") && 
                                       // inner circle inside selection frame
                                   (this.x.baseVal.value)+vm.options.col.cellwidth >= d.x && (this.x.baseVal.value)<=d.x+d.width && 
                                   (this.y.baseVal.value)+vm.options.row.cellheight >= d.y && (this.y.baseVal.value)<=d.y+d.height
                               ) {
                    
                                   d3.select(this)
                                   .classed("cell-selection", true)
                                   .classed("cell-selected", true);
              
                                   d3.select(".r"+(cell_d.row))
                                   .classed("text-selection",true)
                                   .classed("text-selected",true);
              
                                   d3.select(".c"+(cell_d.col))
                                   .classed("text-selection",true)
                                   .classed("text-selected",true);
                               }
                            });
                        }
                    })
                    .on("mouseup", function() {
                          // remove selection frame
                       sa.selectAll("rect.selection").remove();
                    
                           // remove temporary selection marker class
                       d3.selectAll('.cell-selection').classed("cell-selection", false);
                       d3.selectAll(".text-selection").classed("text-selection",false);

                       var rowIds = d3.selectAll(".text-selected").filter(".rowLabel").data().map(function(d){return d.id})
                       var colIds = d3.selectAll(".text-selected").filter(".colLabel").data().map(function(d){return d.id})

                       if(vm.data.method.selected.name == "molecular"){

                           osApi.setCohort(colIds, "Heatmap", osApi.SAMPLE);
                           osApi.setGeneset(rowIds, "Heatmap", "SYMBOL", true);
                       }

                        

                    })
                    .on("mouseout", function() {
                       if(d3.event.relatedTarget.tagName=='html') {
                               // remove selection frame
                           sa.selectAll("rect.selection").remove();
                               // remove temporary selection marker class
                           d3.selectAll('.cell-selection').classed("cell-selection", false);
                           d3.selectAll(".rowLabel").classed("text-selected",false);
                           d3.selectAll(".colLabel").classed("text-selected",false);
                       }
                    });
              
            }

            // Change ordering of cells  
            function sortbylabel(rORc,i,sortOrder){
                var t = svg.transition().duration(3000);
                var log2r=[];
                var sorted; // sorted is zero-based index
                d3.selectAll(".c"+rORc+i) 
                  .filter(function(ce){
                     log2r.push(ce.value);
                   })
                ;
                if(rORc=="r"){ // sort log2ratio of a gene
                  sorted=d3.range(cols.length).sort(function(a,b){ if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
                  t.selectAll(".cell")
                    .attr("x", function(d) { return sorted.indexOf(d.col) * vm.options.col.cellwidth; })
                    ;
                  t.selectAll(".colLabel")
                   .attr("y", function (d, i) { return sorted.indexOf(i) * vm.options.row.cellheight; })
                  ;
                }else{ // sort log2ratio of a contrast
                  sorted=d3.range(rows.length).sort(function(a,b){if(sortOrder){ return log2r[b]-log2r[a];}else{ return log2r[a]-log2r[b];}});
                  t.selectAll(".cell")
                    .attr("y", function(d) { return sorted.indexOf(d.row) * vm.options.row.cellheight; })
                    ;
                  t.selectAll(".rowLabel")
                   .attr("y", function (d, i) { return sorted.indexOf(i) * vm.options.row.cellheight; })
                  ;
                }
            }
         
            function order(value){
                var t;
                if(value=="asis"){
                    t = svg.transition().duration(3000);
                    t.selectAll(".cell")
                        .attr("x", function(d) { 
                            return vm.heatmap.cols[d.col].i * vm.options.col.cellwidth; })
                        .attr("y", function(d) { 
                            return vm.heatmap.rows[d.row].i * vm.options.row.cellheight; })
                    ;
                
                    t.selectAll(".rowLabel")
                        .attr("y", function (d, i) { 
                            return vm.heatmap.rows[i].i * vm.options.row.cellheight; })
                    ;
                
                    t.selectAll(".colLabel")
                        .attr("y", function (d, i) { 
                            return vm.heatmap.cols[i].i * vm.options.col.cellwidth; })
                    ;
            
                }else if (value=="probecontrast"){
                    t = svg.transition().duration(3000);
                    t.selectAll(".cell")
                        .attr("x", function(d) { return (d.col - 1) * vm.options.col.cellwidth; })
                        .attr("y", function(d) { return (d.row - 1) * vm.options.row.cellheight; })
                    ;
                
                    t.selectAll(".rowLabel")
                        .attr("y", function (d, i) { return i * vm.options.row.cellheight; })
                    ;
                
                    t.selectAll(".colLabel")
                        .attr("y", function (d, i) { return i * vm.options.col.cellwidth; })
                    ;
            
                }else if (value=="rows"){
                    t = svg.transition().duration(3000);
                    t.selectAll(".cell")
                       .attr("y", function(d) { return (d.row - 1) * vm.options.row.cellheight; })
                    ;
                
                    t.selectAll(".rowLabel")
                      .attr("y", function (d, i) { return i * vm.options.row.cellheight; })
                    ;
                }else if (value=="cols"){
                    t = svg.transition().duration(3000);
                    t.selectAll(".cell")
                      .attr("x", function(d) { return (d.col - 1) * vm.options.col.cellwidth; })
                    ;
                    t.selectAll(".colLabel")
                        .attr("y", function (d, i) { return i * vm.options.col.cellwidth; })
                    ;
                }
            }
            
            vm.data.table.selected = {name: vm.data.table.types[0].name, i:0}
            vm.data.method.selected = {name: vm.data.method.types[0], i:0}
            vm.callMethod()

            osApi.onResize.add(vm.draw);
            angular.element($window).bind('resize', _.debounce(vm.draw, 300));
        }
    }
})();