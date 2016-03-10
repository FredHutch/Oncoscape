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
        function FiltersController(osApi, osState, $stateParams, d3) {

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";
            if (osState.patientFilters.get()==null) osState.patientFilters.set(vm.datasource);
            vm.close = function() {
                osApi.hideFilter();
            };

            osState.patientFilters.onChange.add(function(){
                osApi.showFilter();
                update(osState.patientFilters.get());
            });

            // Size
            var margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 40
            };
            var width = 1000 - margin.left - margin.right;
            var height = 250 - margin.top - margin.bottom;
            var i = 0;

            var tree = d3.layout.tree()
                .size([height, width]);

            var diagonal = d3.svg.diagonal()
                .projection(function(d) {
                    return [d.y, d.x];
                });

            var svg = d3.select("#filters-chart").append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + ((1000 / 2) - 100) + "," + margin.top + ")");
                
            
            update(osState.patientFilters.get());
            function update(root) {
                // Compute the new tree layout.
                var nodes = tree.nodes(root).reverse(),
                    links = tree.links(nodes);

                // Normalize for fixed-depth.
                nodes.forEach(function(d) {
                    d.y = d.depth * 150;
                });

                // Declare the nodes…
                var node = svg.selectAll("g.node")
                    .data(nodes, function(d) {
                        return d.id || (d.id = ++i);
                    });

                // Enter the nodes.
                var nodeEnter = node.enter().append("g")
                    .attr("class", "node")
                    .attr("transform", function(d) {
                        return "translate(" + d.y + "," + d.x + ")";
                    })
                    .on("click", function(e) {
                        osState.patientFilters.select(e);
                    });

                nodeEnter.append("circle")
                    .attr("r", function(d) {
                        return (d.parent == null) ? 50 : 35;
                    })
                   

                nodeEnter.append("text")
                    .attr("x", function(d){ return 0})
                    .attr("y", function(d){ return 30 })

                    .text(function(d){ return d.name; })
                    .attr("text-anchor", "middle")
                    .attr("font-size", "20px")
                     .attr("fill", "#59a5fb");

                nodeEnter.append("image")
                      .attr("xlink:href", function(d) { return './assets/images/datasets/'+d.icon+'.png'; })
                      .attr("x", function(d) { return (d.parent == null) ? -50 : -35; })
                      .attr("y", function(d) { return (d.parent == null) ? -50 : -35; })
                      .attr("width", function(d) { return (d.parent == null) ? 100 : 70; })
                      .attr("height", function(d) { return (d.parent == null) ? 100 : 70; })
                      .style("display", function(d) { return d.icon == null ? "none" : null; });

                // Declare the links…
                var link = svg.selectAll("path.link")
                    .data(links, function(d) {
                        return d.target.id;
                    });

                // Enter the links.
                link.enter().insert("path", "g")
                    .attr("class", "link")
                    .style("stroke", "#3993fa") //function(d) { return d.target.level; })
                    .attr("d", diagonal);

            }
            
        }
    }
})();
