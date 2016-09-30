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
        function HeatmapController(d3, osApi, osCohortService, $state, $timeout, $scope, $stateParams, $window) {

            var vm = this;
            vm.datasource = osApi.getDataSource();

            var elChart = d3.select("#heatmap-chart");
            var d3Chart = elChart.append("svg");
            var gChart = d3Chart.append("g");


            var data;
            var patients;
            var genes;

            osApi.setBusy(true);
            osApi.query("brca_psi_bradleylab_miso", {
                '$limit': 50
            }).then(function(response) {
                osApi.setBusy(false);
                data = response.data;
                patients = Object.keys(data[0].patients);
                genes = data.map(function(v) {
                    return v.gene;
                });

                var d = data.map(function(datum) {
                    var patients = datum.patients;
                    return Object.keys(patients).map(function(key) {
                        return (this[key] == null) ? 0.00 : this[key];
                    }, patients);
                });
                var c = Object.keys(data[0].patients);
                var r = data.map(function(datum) {
                    return datum.gene;
                });

                var x = {
                    data: d,
                    colnames: c,
                    rownames: r
                };

                console.log(JSON.stringify(d));

                // ocpu.seturl("//localhost/ocpu/library/oncoscape/R");
                // $("#test").rplot("oheatmap", {
                //     data: d
                // }, function(e) {
                //     debugger;
                // });

                draw(data);
            });

            var draw = function(data) {

                var layout = osApi.getLayout();
                var height = $window.innerHeight - 180;
                var width = ($window.innerWidth - layout.left - layout.right);
                var cellHeight = height / data.length;
                var cellWidth = width / patients.length;

                var colorScale = d3.scaleLinear()
                    .domain([0, .5, 1])
                    .range(['#3c82f7', 'white', '#f6b500']);

                var zoom = d3.zoom()
                    .scaleExtent([1, 40])
                    .translateExtent([
                        [0, 0],
                        [width, height]
                    ])
                    .on("zoom", zoomed);

                d3Chart.call(zoom);

                function zoomed() {
                    gChart.attr("transform", d3.event.transform);
                    //gX.call(xAxis.scale(d3.event.transform.rescaleX(x)));
                    //gY.call(yAxis.scale(d3.event.transform.rescaleY(y)));
                }

                d3Chart.attr("width", width).attr("height", height);
                gChart.attr("width", width).attr("height", height);
                var rowEnter = gChart.selectAll("g.geneEvent")
                    .data(data).enter().append("g");
                rowEnter
                    .attr("class", "geneEvent")
                    .attr("transform", function(d, i) {
                        return "translate(0," + (cellHeight * i) + ")";
                    })

                var cols = rowEnter.selectAll("rect").data(function(d) {
                    if (d.pda == null) d.pda = Object.keys(d.patients).map(function(key) {
                        return this[key];
                    }, d.patients);
                    return d.pda;
                });
                cols.exit().remove();
                cols.enter().append("rect")
                    .attr("width", cellWidth)
                    .attr("height", cellHeight)
                    .attr("x", function(d, i) {
                        return cellWidth * i;
                    })
                    .style("fill", function(d) {

                        return colorScale(d);
                    })
                    //   .on("mouseover", function(d){
                    //      //highlight text
                    //      d3.select(this).classed("cell-hover",true);
                    //      d3.selectAll(".rowLabel").classed("text-highlight",function(r,ri){ return ri==(d.row-1);});
                    //      d3.selectAll(".colLabel").classed("text-highlight",function(c,ci){ return ci==(d.col-1);});

                //      //Update the tooltip position and value
                //      d3.select("#tooltip")
                //        .style("left", (d3.event.pageX+10) + "px")
                //        .style("top", (d3.event.pageY-10) + "px")
                //        .select("#value")
                //        .text("lables:"+rowLabel[d.row-1]+","+colLabel[d.col-1]+"\ndata:"+d.value+"\nrow-col-idx:"+d.col+","+d.row+"\ncell-xy "+this.x.baseVal.value+", "+this.y.baseVal.value);  
                //      //Show the tooltip
                //      d3.select("#tooltip").classed("hidden", false);
                // })
                // .on("mouseout", function(){
                //        d3.select(this).classed("cell-hover",false);
                //        d3.selectAll(".rowLabel").classed("text-highlight",false);
                //        d3.selectAll(".colLabel").classed("text-highlight",false);
                //        d3.select("#tooltip").classed("hidden", true);
                // });

            }
        }
    }
})();
