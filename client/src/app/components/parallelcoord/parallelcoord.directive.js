(function() {
  'use strict';

  angular
      .module('oncoscape')
      .directive('osParallelcoord', parallelcoord);

  /** @ngInject */
  function parallelcoord() {

    var directive = {
        restrict: 'E',
        templateUrl: 'app/components/parallelcoord/parallelcoord.html',
        controller: ParallelcoordController,
        controllerAs: 'vm',
        bindToController: true
    };

    return directive;

    /** @ngInject */
    function ParallelcoordController(osApi, $state, $timeout, $window, d3, _, jStat) {

      var vm = this;
      osApi.setBusy(false)
      vm.datasource = osApi.getDataSource();

      vm.zoom = 1000000 // 1 MB
      vm.gene = "MYC"
      var samples = osApi.getCohort().sampleIds;
      samples = ["TCGA-OL-A66H-01", "TCGA-3C-AALK-01", "TCGA-AR-A1AH-01", "TCGA-AC-A5EH-01", "TCGA-EW-A2FW-01"]

      // Elements
      var d3Chart = d3.select("#parallelcoord-chart").append("svg");
      var genes;

      // Properties
      // var scaleX, scaleY, axisX, axisY;
      var data; //, minMax;
      var width, height;

      var draw = function(){ 
        
        // Size
        var layout = osApi.getLayout();
        width = $window.innerWidth - layout.left - layout.right;
        height = $window.innerHeight - 150; //10
        angular.element("#parallelcoord-chart").css({
            "width": width + "px",
            "padding-left": layout.left + "px"
        });

        d3Chart.attr("width", width).attr("height", height);
        
        // Scale
        // scaleX = d3.scaleLinear().domain([minMax.xMin, minMax.xMax]).range([50, width - 50]).nice();
        // scaleY = d3.scaleLinear().domain([minMax.yMin, minMax.yMax]).range([50, height - 50]).nice();

 
        var x = d3.scalePoint().domain(vm.genes).range([75, width - 75]),
            y = {};
        
        var line = d3.line(),
            axis = d3.axisLeft(x),
            foreground;
  
        // Create a scale and brush for each gene.
        vm.genes.forEach(function(d) {
          // Coerce values to numbers.
          data.forEach(function(p) { p[d] = +p[d]; });
      
          y[d] = d3.scaleLinear()
              .domain(d3.extent(data, function(p) { return p[d]; }))
              .range([height, 0]);
      
          // y[d].brush = d3.svg.brush()
          //     .y(y[d])
          //     .on("brush", brush);
        });
  
        // Add a legend.
        // var legend = d3Chart.selectAll("g.legend")
        //     .data(samples)
        //   .enter().append("svg:g")
        //     .attr("class", "legend")
        //     .attr("transform", function(d, i) { return "translate(0," + (i * 20 + 584) + ")"; });
      
        // legend.append("svg:line")
        //     .attr("class", String)
        //     .attr("x2", 8);
      
        // legend.append("svg:text")
        //     .attr("x", 12)
        //     .attr("dy", ".31em")
        //     .text(function(d) { return d; });
      
        // Add foreground lines.
        foreground = d3Chart.append("g")
            .attr("class", "foreground")
          .selectAll("path")
            .data(data)
          .enter().append("path")
            .attr("d", path)
            .attr("stroke", "#000")
            .attr("class", function() { return "cohort"; });
  
        // Add a group element for each gene.
        genes = d3Chart.selectAll(".gene")
            .data(vm.genes)
            
        var g=  genes.enter().append("g")
            .attr("class", "gene")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
            // .call(d3.drag()
            // .origin(function(d) { return {x: x(d)}; })
            // .on("dragstart", dragstart)
            // .on("drag", drag)
            // .on("dragend", dragend));
        
            genes.exit().remove()
            
            genes
            .attr("class", "gene")
            .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        
        // Add an axis and title.
        g.append("g")
            .attr("class", "axis")
            .each(function(d) { d3.select(this).call(axis.scale(y[d])); })
          .append("text")
            .attr("text-anchor", "middle")
            .attr("y", -9)
            .text(String);
  
        // Add a brush for each axis.
        // g.append("g")
        //     .attr("class", "brush")
        //     .each(function(d) { d3.select(this).call(y[d].brush); })
        //   .selectAll("rect")
        //     .attr("x", -8)
        //     .attr("width", 16);
  
        // function dragstart(d) {
        //   i = vm.genes.indexOf(d);
        // }
  
        // function drag(d) {
        //   x.range()[i] = d3.event.x;
        //   vm.genes.sort(function(a, b) { return x(a) - x(b); });
        //   g.attr("transform", function(d) { return "translate(" + x(d) + ")"; });
        //   foreground.attr("d", path);
        // }
  
        // function dragend(d) {
        //   x.domain(vm.genes).rangePoints([0, w]);
        //   var t = d3.transition().duration(500);
        //   t.selectAll(".gene").attr("transform", function(d) { return "translate(" + x(d) + ")"; });
        //   t.selectAll(".foreground path").attr("d", path);
        // }

        // Returns the path for a given data point.
        function path(d) {
          return line(vm.genes.map(function(p) { return [x(p), y[p](d[p])]; }));
        }

        // Handles a brush event, toggling the display of foreground lines.
        function brush() {
          var actives = vm.genes.filter(function(p) { return !y[p].brush.empty(); }),
              extents = actives.map(function(p) { return y[p].brush.extent(); });
          foreground.classed("fade", function(d) {
            return !actives.every(function(p, i) {
              return extents[i][0] <= d[p] && d[p] <= extents[i][1];
            });
          });
        }
       
        osApi.setBusy(false);
      }
    
  
      

      vm.updateGene = function() {
              callGeneRegion()
      };
    
      var callGeneRegion = function(){

        osApi.query("lookup_hg19_genepos_minabsstart", {m: vm.gene}).then(function(response){
          var d = response.data
          if(d.length >0){
            vm.chr = d[0].chr
            osApi.query("lookup_hg19_genepos_minabsstart", {chr: vm.chr, pos: {$lt: d[0].pos + vm.zoom, $gt: d[0].pos - vm.zoom}}).then(function(resp){
              vm.genes_in_region = resp.data
              vm.genes =  _.pluck(vm.genes_in_region,"m" )
              osApi.query("brca_gistic2_ucsc-xena", {m: {$in:vm.genes}}).then(function(r){
                var molecular = r.data
                var sampleIdx = _.range(0,molecular[0].s.length)

                if(samples.length !=0){ 
                    sampleIdx = molecular[0].s.map(function(s, i){
                        var matchS = _.contains(samples, s) ? i : -1
                        return matchS})
                }else{
                  samples = molecular[0].s
                }
                vm.genes =  _.pluck(molecular, "m")

                var tbl = jStat.transpose(molecular.map(function(g){return  g.d.filter(function(r, i){return _.contains(sampleIdx, i)})}))
                data = tbl.map(function(s, i){ var v =_.object( vm.genes,s); v["sample"] = samples[i]; return v }) 
                
                
                draw();
              });
            });
          }
        });
      }


      // Setup Watches

      // $scope.$watch('vm.gene', function() {
        //runs with every keystroke
      //     if (vm.gene === null) return;
      //     callGeneRegion()

      // });

      // App Event :: Resize
      osApi.onResize.add(draw);

      callGeneRegion();
        
    }  //end Controller
  }  //end parallelcoord() 
})();