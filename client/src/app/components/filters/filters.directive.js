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
        function FiltersController(osApi, $stateParams, d3) {

            // View Model
            var vm = this;
            vm.datasource = $stateParams.datasource || "DEMOdz";

            var data = {
                name: vm.datasource,
                "parent": "null",
                "children": [{
                    "name": "Level 2: A",
                    "children": [{
                        "name": "Son of A"
                    }, {
                        "name": "Daughter of A",
                        "children": [{
                            "name": "Son of A"
                        }, {
                            "name": "Daughter of A"
                        }]
                    }]
                }, {
                    "name": "Level 2: B"
                }]
            }

            // Elements
            var elChart = angular.element("#filters-chart");

            // Size
            var margin = {
                top: 20,
                right: 20,
                bottom: 30,
                left: 40
            };
            var width = elChart.width() - margin.left - margin.right;
            var height = elChart.height() - margin.top - margin.bottom;
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
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var root = data;
            update(root);

            function update(root) {

                // Compute the new tree layout.
                var nodes = tree.nodes(root).reverse(),
                    links = tree.links(nodes);

                // Normalize for fixed-depth.
                nodes.forEach(function(d) {
                    d.y = d.depth * 80;
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
                    });

                nodeEnter.append("circle")
                    .attr("r", function(d) {
                        return (d.parent == "null") ? 35 : 15;
                    })

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
