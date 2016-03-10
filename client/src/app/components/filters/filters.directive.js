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
        function FiltersController(osApi, osState, $stateParams, $window, d3) {

            // View Model
            var vm = this;
            vm.close = function() {
                osApi.hideFilter();
            };
            vm.datasource = $stateParams.datasource || "DEMOdz";

            if (osState.patientFilters.get()==null) osState.patientFilters.set(vm.datasource);
            osState.patientFilters.onChange.add(function(){
                osApi.showFilter();
                var data = osState.patientFilters.get();
                update(data);
            });


// ************** Generate the tree diagram  *****************
var margin = {top: 120, right: 120, bottom: 20, left: 120},
    width = 960 - margin.right - margin.left,
    height = 500 - margin.top - margin.bottom;
    
var i = 0;

var tree = d3.layout.tree()
    .size([height, width]);

var diagonal = d3.svg.diagonal()
    .projection(function(d) { return [d.x, d.y]; });

var svg = d3.select("#filters-chart").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var root = osState.patientFilters.get();
  
update(root);

function update(source) {

  // Compute the new tree layout.
  var nodes = tree.nodes(root).reverse(),
      links = tree.links(nodes);

  // Normalize for fixed-depth.
  nodes.forEach(function(d) { d.y = d.depth * 100; });

  // Declare the nodes…
  var node = svg.selectAll("g.node")
      .data(nodes, function(d) { return d.id || (d.id = ++i); });

  // Enter the nodes.
  var nodeEnter = node.enter().append("g")
      .attr("class", "node")
      .attr("transform", function(d) { 
          return "translate(" + d.x + "," + d.y + ")"; })
     .on("click", function(e) {
                        osState.patientFilters.select(e);
        });

  nodeEnter.append("circle")
      .attr("r", function(d) { return (d.parent === "null") ? 50 : 20;})
      .attr("x", 500)
      .style("fill", "#fff")
      .attr("stroke-width", 5)
      .attr("stroke", function(d) { return "#59a5fb" } );

  nodeEnter.append("image")
      .attr("xlink:href", function(d) { return './assets/images/datasets/'+d.icon+'.png'; })
      .attr("x", function(d) { return (d.parent === "null") ? -50 : -20; })
      .attr("y", function(d) { return (d.parent === "null") ? -50 : -20; })
      .attr("width", function(d) { return (d.parent === "null") ? 100 : 40; })
      .attr("height", function(d) { return (d.parent === "null") ? 100 : 40; })
      .style("display", function(d) { return d.icon === "null" ? "none" : null; });

  nodeEnter.append("text")
      .attr("y", function(d) { return d.children || d._children ? -40 : 40; })
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .attr("fill", "#FFF")
      .text(function(d) { return d.name; })
      .style("fill-opacity", 1);

  // Declare the links…
  var link = svg.selectAll("path.link")
      .data(links, function(d) { return d.target.id; });

  // Enter the links.
  link.enter().insert("path", "g")
      .attr("class", "link")
      .attr("d", diagonal);

}
            
        }
    }
})();
