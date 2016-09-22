(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osSunburst', sunburst);

    /** @ngInject */
    function sunburst() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/sunburst/sunburst.html',
            controller: SunburstController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function SunburstController(d3, osApi, osCohortService, $state, $timeout, $scope, $stateParams, $window, _) {

            var vm = this;
            vm.patients = [];
            vm.patient = null;
            vm.datasource = osApi.getDataSource();

            
            osApi.setBusy(true);
            osApi.query("biomarker_immune_tree").then(function(response){
                osApi.setBusy(false);

                response.data.forEach(function(v){
                  v.barcharts.forEach(function(v){
                    v.groups.forEach(function(v){
                      v.show = true;
                    })
                  })
                });
                vm.patients = response.data;
                vm.patient = vm.patients[0];
                sunburst.draw(vm);
                bars.draw(vm);
            });

            // Sunburst
            var sunburst = (function(){
              var color = d3.scaleOrdinal(d3.schemeCategory20);
              var formatNumber = d3.format(",d");
              var arc, radius, x, y;
              var data;
              var svg,
                  labelTumor,
                  labelNormal,
                  sunburstNormal,
                  sunburstTumor;

              var tooltip = d3.select("#sunburst-chart").append("div")  
                .attr("class", "tooltip")       
                .style("opacity", 0);
              var w = d3.select(window);

              var init = function(chart){
                svg = chart;
                labelTumor     = svg.append("text").text("Tumor");
                labelNormal    = svg.append("text").text("Normal");
                sunburstNormal = svg.append("g");
                sunburstTumor  = svg.append("g");
              }

              var mousemove = function(d){
                tooltip
                  .style('top', (d3.event.layerY + 10) + 'px')
                  .style('left', (d3.event.layerX + 10) + 'px');
              }
              var mouseover = function(d){
                tooltip.html(d.data.name)
                  .style("opacity", 1)
                  .style('top', (d3.event.layerY + 10) + 'px')
                  .style('left', (d3.event.layerX + 10) + 'px');
                  w.on("mousemove", mousemove).on("mouseup", null);
              }

              var mouseout = function(d){
                tooltip.html(d.data.Name)
                  .style("opacity", 0)
              }
              var click = function(d){
                var root = d;
                while (root.parent) root = root.parent
                var sunburst = (root.data.name=="Normal") ? sunburstNormal : sunburstTumor;
                sunburst
                .transition()
                        .duration(750)
                        .tween("scale", function() {
                          var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                              yd = d3.interpolate(y.domain(), [d.y0, 1]),
                              yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
                          return function(t) { x.domain(xd(t)); y.domain(yd(t)).range(yr(t)); };
                        })
                      .selectAll("path")
                        .attrTween("d", function(d) { return function() { return arc(d); }; });
              };

              var drawSunburst = function(data, g, x, y){

                var partition = d3.partition();
                var root = d3.hierarchy(data);
                      root.sum(function(d) { return d.size; });

                var decendants = partition(root).descendants()
                var path = g.selectAll("path").data(decendants)
                  .enter().append("g");

                  path.append("path")
                    .attr("d", arc)
                    .style("fill", function(d) { return color((d.children ? d : d.parent).data.name); })
                    .style("stroke","#FFF")
                    .style("stroke-width","2") 
                    .on("click", click)
                    .on("mouseover", mouseover)
                    .on("mouseout", mouseout)


              }
              var draw = function(vm){
                  data = vm.patient;
                  var layout = osApi.getLayout();
                  var height = $window.innerHeight - 180;
                  var width  = ($window.innerWidth - layout.left - layout.right);
                  radius = (Math.min( (width*.5), height-200) / 2) - 10;
                  x = d3.scaleLinear().range([0, 2 * Math.PI]);
                  y = d3.scaleSqrt().range([0, radius]);
                  arc = d3.arc()
                      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x0))); })
                      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, x(d.x1))); })
                      .innerRadius(function(d) { return Math.max(0, y(d.y0)); })
                      .outerRadius(function(d) { return Math.max(0, y(d.y1)); });

                  svg.attr("width", width).attr("height", height);
                  labelNormal.attr("transform", "translate(" + (radius+10) + "," + 20 + ")");
                  labelTumor.attr("transform", "translate(" + (width-radius-10) + "," + 20 + ")");
                  

                  sunburstNormal.attr("transform", "translate(" + (radius+10) + "," + (radius) + ")");
                  sunburstTumor.attr("transform", "translate(" + (width-radius-10) + "," + (radius) + ")");

                  drawSunburst(data.tumor, sunburstTumor, x, y);
                  drawSunburst(data.normal, sunburstNormal, x, y);
              }
              return {
                init:init,
                draw:draw
              }
            })();


            var bars = (function(){

              // Elements
              var svg;
              var data;
              var charts;

              var layout, transformedData;
              

              var init = function(chart){
                svg = chart;
                charts = svg.append("g");
              };

              var getLayoutMetrics = function(data){
                  var layout = osApi.getLayout();
                  var widthTotal = ($window.innerWidth - layout.left - layout.right)-40;
                  var widthChart = Math.floor(widthTotal/data.length);
                  var heightChart = 200;  // Constant
                  var yChart = (Math.min( (($window.innerWidth - layout.left - layout.right)*.5), ($window.innerHeight - 50)-200)) - 10;
                  var xChart = 20;
                  return {
                    layout: layout,
                    widthTotal: widthTotal,
                    widthChart: widthChart,
                    heightChart: heightChart,
                    yChart: yChart,
                    xChart: xChart,
                    numCharts: data.length
                  };
              };

              var getTransformedData = function(data){

                // Cartesian Product
                function cartesianProductOf() {
                    return _.reduce(arguments, function(a, b) {
                        return _.flatten(_.map(a, function(x) {
                            return _.map(b, function(y) {
                                return x.concat([y]);
                            });
                        }), true);
                    }, [ [] ]);
                };

                // Transform Data To Be Both Tree + List (Bar) Oriented
                return data.map(function(chart){

                  // Get Cartesian Product Of All Tags From Selected Groups 
                  var bars = cartesianProductOf.apply(this, chart.groups
                      .filter(function(c){return c.show})
                      .map(function(c) {return c.tags; }))
                        .map(function(v){ return {value:0, tags:v}});

                  // Sort Data On All Tags
                  bars.sort(function(a,b){
                     for (var i=a.tags.length-1; i>=0; i--){
                        if (a.tags[i]>b.tags[i]) return 1;
                        if (a.tags[i]<b.tags[i]) return -1;
                     }
                     return 0;
                  });

                  // Calculate Bar Values
                  var values = chart.values;
                  bars.forEach(function(bar){
                    chart.values.forEach( function(value){
                      if (_.difference(bar.tags, value.tags).length==0) bar.value += value.data;
                    });
                  });

                  // Color Lookup
                  var tags = bars.reduce(function(p,c){
                    return _.union(p,c.tags)
                  },[]).sort()
                  var colors = ['#E91E63','#673AB7','#2196F3','#00BCD4','#CDDC39','#FFC107','#FF5722','#795548','#607D8B','#03A9F4'];
                  colors.length = tags.length;
                  colors = _.object(tags, colors);

                  // Convert Array Into A Tree Structure
                  var tree = bars.reduce( function(p, c){
                      var barNode = p;
                      c.tags.reverse().forEach(function(tag, index){
                        var tagIndex = barNode.children.map(function(v){ return v.name; }).indexOf(tag);
                        if (tagIndex==-1){
                          barNode.children.push({name:tag, children:[], value:1, color:colors[tag]});
                          barNode = barNode.children[barNode.children.length-1];
                        }else{
                          barNode = barNode.children[tagIndex];
                          barNode.value += 1;
                        }
                      });
                      c.tags.reverse();
                    return p;
                  }, {name:'chart', children:[], value:bars.length});

                  // Return Tree
                  return {bars:bars, tree:tree};

                });
              };


              var drawTree = function(el){

                // Chart G Element
                var chartLayer = d3.select(this);

                // Chart Background
                chartLayer.append("rect")
                  .style("fill","#EEE")
                  .attr("width", layout.widthChart-1)
                  .attr("height", layout.heightChart)

                // Create Treemap
                var treemap = d3.partition()
                  .size([layout.widthChart, 200])
                  // .padding(0)
                  // .round(true);

                // Create Hierarchtical Data Structure + Bind To Treemap
                var tree = d3.hierarchy(el.tree, function(d){ return d.children; });
                var nodes = treemap(tree)
                  .sum(function(d) { return d.value; })
                  .sort(function(a, b) { return b.height - a.height || b.value - a.value; })
                  .descendants();

                var node = chartLayer.selectAll(".cat-node")
                  .data(nodes);

                var newNode = node.enter()
                  .append("rect")
                  .attr("class","cat-node")
                  .attr("za",function(d){ return d.data.color; })
                  .attr("x", function(d) { return d.x0 })
                  .attr("y", function(d) { return d.y0 +0 })
                  .attr("width", function(d) { return d.x1 - d.x0 })
                  .attr("height", function(d) { return d.y1 - d.y0})
                  .attr("fill", function(d){ console.log(d.data.name); return d.data.color;});

debugger;
                // var node = chartLayer
                //     .selectAll(".node")
                //     .data(nodes)
            
                // node
                //     .selectAll("rect")
                //     .data(nodes)
            
                // node
                //     .selectAll("text")
                //     .data(nodes)
            
                // // enter                  
                // var newNode = node.enter()
                //     .append("g")
                //     .attr("class", "node")
                    
                // newNode.append("rect")
                // newNode.append("text")
            
                  
                // // update   
                // chartLayer
                //     .selectAll(".node rect")
                  
                //     .attr("x", function(d) { return d.x0 })
                //     .attr("y", function(d) { return d.y0 +170 })
                //     .attr("width", function(d) { return d.x1 - d.x0 })
                //     .attr("height", function(d) { return d.y1 - d.y0})
                //     .attr("fill", function(d){ return d.data.color; });
                    
                // chartLayer
                //     .selectAll(".node text")    
                //     .text(function(d){return  d.data.name })
                //     .attr("y", "1.5em")
                //     .attr("x", "0.5em")
                //     .attr("font-size", "0.6em")
                //     .attr("transform", function(d){ return "translate("+[d.x0, d.y0+170]+")" })

        
              }

              var draw = function(data){
                data = vm.patient.barcharts;
                layout = getLayoutMetrics(data);
                transformedData = getTransformedData(data);

                // Chart Spaces
                var chart = charts.selectAll(".sunburst-barchart")
                  .data(transformedData);

                chart.enter()
                  .append("g")
                  .attr("class", "sun-chart-g")
                  .attr("transform", function(d,i){
                    return "translate("+((i * layout.widthChart)+ layout.xChart)+","+layout.yChart+")";
                  })

                charts.selectAll(".sun-chart-g")
                  .each(drawTree);


                
              };



              return {
                init:init,
                draw:draw
              };
            })();

            var svg = d3.select("#sunburst-chart").append("svg");
            sunburst.init(svg);
            bars.init(svg);

            
        }
    }
})();
