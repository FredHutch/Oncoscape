(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osFilters', filters);

    /** @ngInject */
    function filters() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/filters/filters.html',
            scope: {},
            controller: FiltersController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function FiltersController(osApi, $stateParams, $window, d3) {

            
            var datasource = $stateParams.datasource || "DEMOdz";
            var pfApi = osApi.getPatientFilterApi();
            pfApi.init(datasource);
            pfApi.onChange.add(function(){
                chart.draw();
            });


            var chart = (function(pfApi, osApi) {


                // Size
                var width, height, diameter;
                width = height = Math.min($window.innerWidth, $window.innerHeight) - 200;
                var diameter = Math.round(width * .7);

                // Data
                var root, link, node;

                // Animation Length
                var duration = 2000;

                var tree = d3.layout.tree()
                    .size([height, width - 160]);

                var cluster = d3.layout.cluster()
                    .size([height, width - 160]);

                var diagonal = d3.svg.diagonal()
                    .projection(function(d) {
                        return [d.y, d.x];
                    });

                var radialTree = d3.layout.tree()
                    .size([360, diameter / 2])
                    .separation(function(a, b) {
                        return (a.parent == b.parent ? 1 : 2) / a.depth;
                    });

                var radialCluster = d3.layout.cluster()
                    .size([360, diameter / 2])
                    .separation(function(a, b) {
                        return (a.parent == b.parent ? 1 : 2) / a.depth;
                    });

                var radialDiagonal = d3.svg.diagonal.radial()
                    .projection(function(d) {
                        return [d.y, d.x / 180 * Math.PI];
                    });

                var svg = d3.select("#filters-chart").append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(100,0)");


                // LAYOUT OPTIONS + ACCESSOR
                var _display;
                function setDisplay(val) {
                    _display = val;
                    switch (val) {
                        case "RadialTree":
                            transitionToRadialTree();
                            break;
                        case "RadialCluster":
                            transitionToRadialCluster();
                            break;
                        case "Cluster":
                            transitionToCluster();
                            break;
                        case "Tree":
                            transitionToTree();
                            break;
                    }
                }

                function draw(){
                    transitionToTree();
                }

                var transitionToRadialTree = function(){
                   

                }

                var transitionToRadialCluster = function(){

                }



                var transitionToCluster = function(){
                    var data = pfApi.getFilterTree();
                    var nodes = cluster.nodes(data);
                    var links = cluster.links(nodes);

                    svg.transition().duration(duration).attr("transform", "translate(40,0)");

                    link = svg.selectAll(".filter-link").data(links);

                    link
                        .enter()
                        .append("path")
                        .attr("class","filter-link")
                        .transition()
                        .duration(duration)
                        .attr("d", diagonal); 

                    link
                        .transition()
                        .duration(duration)
                        .attr("d", diagonal); 

                    link
                        .exit()
                        .remove();

                    node = svg.selectAll(".filter-node").data(nodes);

                    

                    var ng = node
                        .enter()
                        .append("g")
                        .attr("class","filter-node")
                        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

                    ng.append("circle")
                        .attr("class","filter-node-circle")
                        .attr("r", 10)
                        .on('click', function(d,i){
                            pfApi.setActiveFilter(d);
                            osApi.hideFilter();
                        });
                        

                    ng.append("text")
                        .attr({
                            "class": "filter-node-text",
                            "dy": 30
                        })
                        .style({
                            "fill": "#FFF",
                            "text-anchor": "middle"
                        })
                        .text(function(d) { return d.name; });

                    node
                        .transition()
                        .duration(duration)
                        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

                    
                    node
                        .exit()
                        .remove();

                }

                var transitionToTree = function(){
                    console.log("TREE");
                    var data = pfApi.getFilterTree();
                    var nodes = tree.nodes(data);
                    var links = tree.links(nodes);

                   svg.transition().duration(duration).attr("transform", "translate(40,0)");

                    link = svg.selectAll(".filter-link").data(links);

                    link
                        .enter()
                        .append("path")
                        .attr("class","filter-link")
                        .transition()
                        .duration(duration)
                        .attr("d", diagonal); 

                    link
                        .transition()
                        .duration(duration)
                        .attr("d", diagonal); 

                    link
                        .exit()
                        .remove();


                    node = svg.selectAll(".filter-node").data(nodes);


                    var ng = node
                        .enter()
                        .append("g")
                        .attr("class","filter-node")
                        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

                    ng.append("circle")
                        .attr("class","filter-node-circle")
                        .attr("r", 10)
                        .on('click', function(d,i){
                            pfApi.setActiveFilter(d);
                            osApi.hideFilter();
                        });
                        

                    ng.append("text")
                        .attr({
                            "class": "filter-node-text",
                            "dy": 30
                        })
                        .style({
                            "fill": "#FFF",
                            "text-anchor": "middle"
                        })
                        .text(function(d) { return d.name; });

                    node
                        .transition()
                        .duration(duration)
                        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

                    
                    node
                        .exit()
                        .remove();
                }

              transitionToCluster();

                // var update = function(){
                //     var data = pfApi.getFilterTree();
                //     var nodes = cluster.nodes(data);
                //     var links = cluster.links(nodes);

                //     link = svg.selectAll(".link").data(links);
                //     link.enter()
   //                      .append("path")
 //                        .attr("class", "link")
//                         .style("stroke", "#59a5fb")
                //         .attr("d", diagonal);

                //     link.exit().remove();

                //     node = svg.selectAll(".node").data(nodes)
                //     var ng = node.enter()
                //       .append("g")
                //       .attr("class", "node")
                //       .attr("transform", function(d) {
                //         return "translate(" + d.y + "," + d.x + ")";
                //       })
                //       ng.append("circle")
                //           .attr("class", "filter-node")
                //           .attr("r", 10);   
                //       ng.append("text")
                //           //.attr("dx", function(d) { return d.children ? -15 : 15; })
                //           .attr("dy", 30)
                //           .style("fill", "#FFF")
                //           .style("text-anchor", "middle") //function(d) { return d.children ? "end" : "start";})
                //           .text(function(d) { return d.name; });
                //     ng.on('mouseover', function(d,i){
                        
                //     })
                //       ng.on('click', function(d,i){
                //         pfApi.setActiveFilter(d);
                //         osApi.hideFilter();
                //       });
                //     node.exit().remove();
                // };
        
                // root = pfApi.getFilterTree();
                // update();
    

                

                /*
                function transitionToRadialTree() {
                    var data = pfApi.getFilterTree();
                    var nodes = radialTree.nodes(data), 
                        links = radialTree.links(nodes);
                    svg.transition().duration(duration)
                        .attr("transform", "translate(" + (width / 2) + "," +
                            (height / 2) + ")");
                    link.data(links)
                        .transition()
                        .duration(duration)
                        .style("stroke", "#fc8d62")
                        .attr("d", radialDiagonal);
                    node.data(nodes)
                        .transition()
                        .duration(duration)
                        .attr("transform", function(d) {
                            return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                        })


                };
                function transitionToRadialCluster() {
                    var data = pfApi.getFilterTree();
                    var nodes = radialCluster.nodes(data),
                        links = radialCluster.links(nodes);
                    svg.transition().duration(duration)
                        .attr("transform", "translate(" + (width / 2) + "," +
                            (height / 2) + ")");
                    link.data(links)
                        .transition()
                        .duration(duration)
                        .style("stroke", "#66c2a5")
                        .attr("d", radialDiagonal);
                    node.data(nodes)
                        .transition()
                        .duration(duration)
                        .attr("transform", function(d) {
                            return "rotate(" + (d.x - 90) + ")translate(" + d.y + ")";
                        })
                };
                function transitionToTree() {
                    var data = pfApi.getFilterTree();
                    var nodes = tree.nodes(data),
                        links = tree.links(nodes);
                    svg.transition().duration(duration)
                        .attr("transform", "translate(40,0)");
                    link.data(links)
                        .transition()
                        .duration(duration)
                        .style("stroke", "#e78ac3")
                        .attr("d", diagonal); 
                    node.data(nodes)
                        .transition()
                        .duration(duration)
                        .attr("transform", function(d) {
                            return "translate(" + d.y + "," + d.x + ")";
                        })
                };
                function transitionToCluster() {

                    var data = pfApi.getFilterTree();
                    var collection;

                    var nodes = cluster.nodes(data),
                        links = cluster.links(nodes);

                    svg.transition().duration(duration)
                        .attr("transform", "translate(40,0)");

                    collection = link.data(links);
                    collection
                        .transition()
                        .duration(duration)
                        .style("stroke", "#8da0cb")
                        .attr("d", diagonal);
                    collection
                      .exit()
                      .remove();
                    collection = node.data(nodes);
                    collection
                        .transition()
                        .duration(duration)
                        .attr("transform", function(d) {
                            return "translate(" + d.y + "," + d.x + ")";
                        });
                    collection
                      .exit()
                      .remove();
                };
                */

                return {
                    setDisplay: setDisplay,
                    draw: draw
                }
            })(pfApi, osApi);


            // View Model
            var vm = this;
            vm.setDisplay = chart.setDisplay;
        }
    }
})();
