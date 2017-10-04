(function() {
  'use strict';

  angular
      .module('oncoscape')
      .directive('osGenedashboard', genedashboard);

  /** @ngInject */
  function genedashboard() {

    var directive = {
        restrict: 'E',
        templateUrl: 'app/components/genedashboard/genedashboard.html',
        controller: GenedashboardController,
        controllerAs: 'vm',
        bindToController: true
    };

    return directive;

    /** @ngInject */
    function GenedashboardController(osApi, $state, $timeout, $window, d3, $scope) {

      var vm = this;
      osApi.setBusy(false)
      vm.datasource = osApi.getDataSource();

      vm.range = {up: 100000, down: 100000} // 100 KB
      
      var samples = osApi.getCohort().sampleIds;
      //samples = ["TCGA-OL-A66H-01", "TCGA-3C-AALK-01", "TCGA-AR-A1AH-01", "TCGA-AC-A5EH-01", "TCGA-EW-A2FW-01"]

      // Elements
      var d3Chart = d3.select("#genedashboard-chart").append("svg");
      var d3Points = d3Chart.append("g");
      var d3vLines = d3Chart.append("g");
      var genes, circles;

      var acceptableDatatypes = ["expr", "cnv", "mut01", "meth_thd", "meth", "cnv_thd"];

      var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
        return "Gene: "+d.gene+"<br/>Sample: " + d.id + "<br>Value: " + d[2];
      });
      d3Chart.call(elTip);

      // Properties
      var scaleX, scaleY, axisY;
      var data, minMax;
      var width, height;

      // Utility Functions
      function setSelected() {
        var selectedIds = cohort.sampleIds;
        if(typeof selectedIds != "undefined"){
           d3Points.selectAll("circle").classed("coord-node-selected", function() {
                return (selectedIds.indexOf(this.__data__.id) >= 0);
            });
        }

    }
      
    var lasso_start = function() {

        lasso.items()
            .attr("r", 3.5) // reset size
            .classed("not_possible", true)
            .classed("selected", false);
    };

    var lasso_draw = function() {

        // Style the possible dots
        lasso.possibleItems()
            .classed("not_possible", false)
            .classed("possible", true);

        // Style the not possible dot
        lasso.notPossibleItems()
            .classed("not_possible", true)
            .classed("possible", false);
    };

    var lasso_end = function() {

      // Reset the color of all dots
        lasso.items()
            .classed("not_possible", false)
            .classed("possible", false);

        var ids = lasso.selectedItems().data().map(function(d) {
            return d.id;
        });
        osApi.setCohort(ids, "COORD", osApi.SAMPLE);

    };

    var lasso = d3.lasso()
        .closePathSelect(true)
        .closePathDistance(100)
        .targetArea(d3Chart)
        .on("start", lasso_start)
        .on("draw", lasso_draw)
        .on("end", lasso_end);   

    var draw = function(){ 
        
        // Size
        var layout = osApi.getLayout();
        width = $window.innerWidth - layout.left - layout.right;
        height = $window.innerHeight - 200; //10
        angular.element("#genedashboard-chart").css({
            "width": width + "px",
            "padding-left": layout.left + "px"
        });

        d3Chart.attr("width", width).attr("height", height);
        d3Points.attr("width", width).attr("height", height);
        d3vLines.attr("width", width).attr("height", height);

        minMax = data.map(function(d){return d3.extent(Object.values(d).filter(function(v) { return !_.isString(v)}))})
                      .reduce(function(p,c){
                        if(c[0] < p[0]) p[0] = c[0]
                        if(c[1] > p[1]) p[1] = c[1]
                        return p;
                      },[Infinity,-Infinity])


        // Scale
        var x = d3.scalePoint().domain(vm.genes).range([75, width - 75]),
            y = d3.scaleLinear().domain(minMax).range([height - 20, 20]);

        // Create a scale and brush for each gene.
        // vm.genes.forEach(function(d) {
        //   // Coerce values to numbers.
        //   data.forEach(function(p) { p[d] = +p[d]; });
      
        //   // y[d] = d3.scaleLinear()
        //   //     .domain(d3.extent(data, function(p) { return p[d]; }))
        //   //     .range([height - 20, 20]);
      
        //   // y[d].brush = d3.svg.brush()
        //   //     .y(y[d])
        //   //     .on("brush", brush);
        // });

        

        // Returns the path for a given data point.
        function coords(d) {
          //return vm.genes.map(function(p) { return [x(p), y[p](d[p])]; });
          return vm.genes.map(function(p) { return [x(p), y(d[p]), d[p], p]; });
        }

        var coordpairs_bysmple = data.map(function(d) { return coords(d)})
        var coordpairs = _.flatten(coordpairs_bysmple, true)
        coordpairs = coordpairs.map(function(d,i){
            d.id = data[Math.floor(i/coordpairs_bysmple[0].length)].sample; 
            d.gene = d[3]
            return d;})
  
        genes = d3vLines.selectAll(".gene").data(vm.genes)

        var tickCount = 10
        var axis_display = "axis-show-name"

        if(coordpairs[1][0] - coordpairs[0][0] < 40){
          tickCount =0
          axis_display = "axis-hide-name"
        }
        
        axisY = d3.axisLeft().scale(y).ticks(tickCount);
        
        // add new data
        var g = genes.enter().append("g")
          .attr("class", function(d){ 
            return "gene " + d})
          .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        
        g.append("g")   //only run on new elements coming in
          .attr("class", "axis")
          .each(function(d) { d3.select(this).call(axisY.scale(y)); })
          //.each(function(d) { d3.select(this).call(axisY.scale(y[d])); })
            .append("text")
            .attr("text-anchor", "middle")
            .attr("y", 10)
            .text(String)
            .attr("class", "axis-name "+ axis_display);

        // update existing data
        genes
          .select('.axis')
          .each(function(d) { d3.select(this).call(axisY.scale(y)); })
          //.each(function(d) { d3.select(this).call(axisY.scale(y[d])); })
            .select(".axis-name")
            .attr("text-anchor", "middle")
            .attr("y", 10)
            .text(String)
            .attr("class", "axis-name "+ axis_display);

        genes.attr("class", function(d){ return "gene " + d})
          .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
        
        // remove old data
        genes.exit().remove()
        g.exit().remove()

        d3vLines.select("."+vm.gene)
          .select('.axis-name')
          .attr("class", "axis-name axis-show-name")
          .attr("text-anchor", "middle")
          .attr("y", 10)
          .text(String);

        // Draw
        circles = d3Points.selectAll("circle").data(coordpairs);
        circles.enter().append("circle")
            .attr("class", "coord-node")
            .attr("cx", function(d) {
                return d[0];
            })
            .attr("cy", function(d) {
                return d[1];
            })
            .attr("r", 3)
            .style("fill", function(d) {
                return d.color;
            })
            .on("mouseover", elTip.show)
            .on("mouseout", elTip.hide);

        circles.exit()
            // .transition()
            // .duration(200)
            // .delay(function(d, i) {
            //     return i / 300 * 100;
            // })
            .style("fill-opacity", "0")
            .remove();
        circles
            .style("fill", function(d) {
                return d.color;
            })
            // .transition()
            // .duration(750)
            // .delay(function(d, i) {
            //     return i / 300 * 100;
            // })
            .attr("r", 3)
            .attr("cx", function(d) {
                return d[0];
            })
            .attr("cy", function(d) {
                return d[1];
            })
            .style("fill", function(d) {
                return d.color;
            })
            .style("fill-opacity", 0.8);

          lasso.items(d3Points.selectAll("circle"));
          d3Chart.call(lasso);
          
          setSelected();
          onCohortChange(osApi.getCohort());
          //onGenesetChange(osApi.getGeneset());
          osApi.setBusy(false);

    }
    
    var cohort = osApi.getCohorts();
    var onCohortChange = function(c) {
        cohort = c;
        setSelected();

    };
    osApi.onCohortChange.add(onCohortChange);
    
      
    vm.updateGene = function() {
            osApi.setBusy(true);
            vm.range.up = +vm.range.up
            vm.range.down = +vm.range.down
            callGeneRegion()
    };
    
      var callGeneRegion = function(){

        osApi.setBusy(true)
        osApi.query("lookup_hg19_genepos_minabsstart", {m: vm.gene}).then(function(response){
          var d = response.data
          if(d.length >0){
            vm.chr = d[0].chr
            osApi.query("lookup_hg19_genepos_minabsstart", {chr: vm.chr, pos: {$lt: d[0].pos + vm.range.down, $gt: d[0].pos - vm.range.up}}).then(function(resp){
              vm.genes_in_region = resp.data

              // while(vm.genes_in_region.length >12){
              //     var maxDist = _.max(vm.genes_in_region,function(g){ return Math.abs(d[0].pos - g.pos)})
              //       vm.genes_in_region = vm.genes_in_region.filter(function(g){return g.m != maxDist.m})
              // }
              vm.genes =  _.pluck(vm.genes_in_region,"m" )

              osApi.query(vm.molecular.collection, {m: {$in:vm.genes}}).then(function(r){
                var molecular = r.data
                var sampleIdx = _.range(0,molecular[0].s.length)

                if(samples.length !=0){ 
                    sampleIdx = molecular[0].s.map(function(s, i){
                        var matchS = _.contains(samples, s) ? i : -1
                        return matchS})
                }else{
                  samples = molecular[0].s
                }

                vm.genes = _.intersection(_.pluck(_.sortBy(vm.genes_in_region, "pos"), "m"), _.pluck(molecular, "m"))
                

                var tbl = jStat.transpose(molecular.map(function(g){return  g.d.filter(function(r, i){return _.contains(sampleIdx, i)})}))
                data = tbl.map(function(s, i){ var v =_.object( vm.genes,s); v["sample"] = samples[i]; return v }) 
                
                
                draw();
              });
            });
          }
        });
      }


      // Setup Watches
      $scope.$watch('vm.dataType', function() {
      
        if(angular.isUndefined(vm.molecularTables)) return;

        if (angular.isUndefined(vm.dataType)) {
          vm.dataType = vm.dataTypes[0];
        } else {
          var newSource = vm.dataTypes.filter(function(v) { return (v === vm.dataType); });
          vm.dataType = (newSource.length === 1) ? newSource[0] : vm.dataTypes[0];
        }
        var molecular_matches = vm.molecularTables.filter(function(d){return d.name == vm.dataType })
        if(molecular_matches.length ==1){
            vm.molecular = molecular_matches[0]
        }
        if(angular.isUndefined(vm.gene)){
          vm.gene = vm.molecular.m[0]
        } else if(_.intersection(vm.molecular.m, [vm.gene]).length == 0){
          window.alert("Gene "+vm.gene+" not in data type "+vm.dataType)
          vm.dataType = vm.state.dataType;
          return;
        }
        vm.state.dataType = vm.dataType
        callGeneRegion()
        
        
      });   
      // $scope.$watch('vm.gene', function() {
        //runs with every keystroke
      //     if (vm.gene === null) return;
      //     callGeneRegion()

      // });

      // App Event :: Resize
      osApi.onResize.add(draw);

      osApi.query("lookup_oncoscape_datasources_v2", {
        dataset: osApi.getDataSource().dataset
      }).then(function(response){
        vm.molecularTables = response.data[0].collections.filter(function(d){ return _.contains(acceptableDatatypes, d.type)})
        vm.molecularTables = vm.molecularTables.filter(function(d) { return !d.name.match(/protein/)})
        vm.dataTypes = _.uniq(_.pluck(vm.molecularTables, "name"))
        vm.dataType = vm.dataTypes[0]
        vm.state = {dataType:vm.dataType}
        
      })
        
    }  //end Controller
  }  //end genedashboard() 
})();