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
                var width, height;
                width = height = Math.min($window.innerWidth, $window.innerHeight) - 200;

                // Data
                var link, node;

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


                var svg = d3.select("#filters-chart").append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(100,0)");


                // LAYOUT OPTIONS + ACCESSOR
                function setDisplay(val) {
                    switch (val) {
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
                        .on('click', function(d){
                            pfApi.setActiveFilter(d);
                            osApi.hideFilter();
                        })
                        .on("mouseover", function() {
                            d3.select(this).transition()
                                .ease("elastic")
                                .duration("500")
                                .attr("r", 15);
                        })
                        .on("mouseout", function() {
                            d3.select(this).transition()
                                .ease("quad")
                                .delay("100")
                                .duration("200")
                                .attr("r", 10);
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
                        .on('click', function(d){
                            pfApi.setActiveFilter(d);
                            osApi.hideFilter();
                        })
                        .on("mouseover", function() {
                            d3.select(this).transition()
                                .ease("elastic")
                                .duration("500")
                                .attr("r", 15);
                        })
                        .on("mouseout", function() {
                            d3.select(this).transition()
                                .ease("quad")
                                .delay("100")
                                .duration("200")
                                .attr("r", 10);
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
