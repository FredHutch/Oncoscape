(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osCompareCluster', compareCluster);

    /** @ngInject */
    function compareCluster() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/compareclusters/compareclusters.html',
            controller: CompareClusterController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function CompareClusterController(osApi, osCohortService, d3, $state, $timeout, $scope, moment, $stateParams, _, $, $q, $window) {


            function zoomed() {
                elPlots.forEach(function(plot) {
                    plot.attr("transform", d3.event.transform);
                });

            }
            var layout = osApi.getLayout();
            var width = ($window.innerWidth - layout.left - layout.right);
            var height = ($window.innerHeight - 120);
            var zoom = d3.zoom()
                .scaleExtent([1, 40])
                .translateExtent([
                    [-100, -100],
                    [width + 90, height + 100]
                ])
                .on("zoom", zoomed);

            // Cohort
            var cohort = osCohortService.getCohort();
            var onCohortChange = function(c) {
                cohort = c;
                setSelected();
            };
            osCohortService.onCohortChange.add(onCohortChange);

            // Datasource
            var datasource = osApi.getDataSource();

            // View Model
            var vm = this;
            vm.optionColors = [];
            vm.optionLayouts = [];

            // State
            var clusterIndexes = [0, 1, 2, 3, 4, 5, 6, 7, 8];
            var clusterColors = [];
            var clusterLayouts = [];

            // Elements
            var elChart = d3.select("#compareclusterChart").append("svg:svg");
            var elBrushes = clusterIndexes.map(function() { return d3.brush(); });
            elChart.call(zoom);
            var elPlots = clusterIndexes.map(function() { return elChart.append("svg:g"); });
            var elHitareas = elPlots.map(function(elPlot) { return elPlot.append("svg:rect"); });
            elHitareas.forEach(function(hitArea) {
                hitArea.attr("fill", "black");
                hitArea.attr("opacity", 0);
            });
            var elLines = [0, 1, 2, 3].map(function() { return elChart.append("svg:line"); });
            elLines.forEach(function(line) {
                line.attr("stroke", "#cbcbcb");
                line.attr("stroke-width", "1px");
            });

            // State Management
            var setSelected = function() {
                var selectedIds = cohort.sampleIds;
                clusterIndexes.forEach(function(clusterIndex) {
                    elPlots[clusterIndex].selectAll("circle").classed("pca-node-selected", function() {
                        return (selectedIds.indexOf(this.__data__.id) >= 0);
                    });
                });
            };
            // var saveState = function() {

            // }
            var loadState = function() {
                vm.optionLayouts = datasource.calculated.filter(function(v) { return (v.type === "pcaScores" || v.type === "mds"); });
                return new Promise(function(resolve) {
                    osApi.query('brain_color_tcga_import').then(function(v) {

                        // This piece of magic creates an object who's key is a sampleID and value is a color
                        vm.optionColors = v.data.map(function(colorOption) {
                            colorOption.lookup = colorOption.data.map(function(c) {
                                var colorMap = c.values.reduce(function(p, c) {
                                    p[c] = p.color;
                                    return p;
                                }, { color: (c.color === null) ? "black" : c.color });
                                delete colorMap.color;
                                //delete c.values;
                                return colorMap;
                            }).reduce(function(p, c) {
                                _.extend(p, c);
                                return p;
                            }, {});
                            return colorOption;
                        });

                        // Set Default Cluster Colors + layouts
                        clusterLayouts = vm.optionLayouts.splice(0, 9).map(function(v) { return { name: v.collection }; });
                        clusterColors = vm.optionColors.splice(0, 9);
                        resolve();
                    });
                });
            };

            // Brushes
            var brushStart = function() {
                if (d3.event.selection === null) return;
                var target = d3.event.target;
                elBrushes
                    .filter(function(b) {
                        return b.brush !== target;
                    })
                    .forEach(function(b) {
                        elPlots[b.index].call(b.move, null);
                    });
            };
            var brushEnd = function() {

                if (d3.event.selection === null) {

                    elChart.selectAll("circle")
                        .classed("pca-node-selected", false);
                    //    osCohortService.setCohort([], "Clusters", osCohortService.SAMPLE);
                    return;
                }
                var target = d3.event.target;
                var bv = d3.event.selection;
                var xScale = target.xScale;
                var yScale = target.yScale;
                var xMin = xScale.invert(bv[0][0]);
                var xMax = xScale.invert(bv[1][0]);
                var yMin = yScale.invert(bv[0][1]);
                var yMax = yScale.invert(bv[1][1]);

                elChart.selectAll("circle")
                    .classed("pca-node-selected", function(v) {
                        return (v.x >= xMin && v.x <= xMax && v.y >= yMin && v.y <= yMax);
                        //return (selectedIds.indexOf(this.__data__.id) >= 0);
                    });
                // Convert To PIDs
                // var sids = data.filter(function(v) {
                //     return (v.x >= xMin && v.x <= xMax && v.y >= yMin && v.y <= yMax);
                // }).map(function(v) { return v.id; });

                // elPlots[target.index].call(elBrushes[target.index].move, null);

                // osCohortService.setCohort(sids, "Clusters", osCohortService.SAMPLE)
            };

            // Layout Methods
            var loadLayout = function(clusterIndex) {
                return new Promise(function(resolve) {

                    var collection = clusterLayouts[clusterIndex].name;
                    osApi.query(collection).then(function(result) {
                        var data = result.data[0].data;
                        result.data[0].domain = Object.keys(data).reduce(function(p, c) {
                            var datum = data[c];
                            if (isNaN(datum.x) || isNaN(datum.y)) return p;
                            p.pc1[0] = Math.min(p.pc1[0], datum.x);
                            p.pc1[1] = Math.max(p.pc1[1], datum.x);
                            p.pc2[0] = Math.min(p.pc2[0], datum.y);
                            p.pc2[1] = Math.max(p.pc2[1], datum.y);
                            return p;
                        }, { pc1: [Infinity, -Infinity], pc2: [Infinity, -Infinity] });
                        result.data[0].bind = Object.keys(data).map(function(v) {
                            var rv = data[v];
                            rv.id = v;
                            return rv;
                        });
                        clusterLayouts[clusterIndex].data = result.data[0];
                        resolve(result.data[0]);
                    });
                });
            };

            loadState().then(function() {
                Promise.all(
                    clusterIndexes.map(function(clusterIndex) { return loadLayout(clusterIndex); })
                ).then(function() {
                    draw();
                    setSelected();
                });
            });

            var draw = function() {
                drawLines();
                clusterIndexes.forEach(drawCluster);
            }

            var drawLines = function() {
                var layout = osApi.getLayout();
                var width = ($window.innerWidth - layout.left - layout.right);
                var height = ($window.innerHeight - 120);
                elLines[0].attr("x1", 0).attr("y1", height * (1 / 3)).attr("x2", width).attr("y2", (height * 1 / 3));
                elLines[1].attr("x1", 0).attr("y1", height * (2 / 3)).attr("x2", width).attr("y2", (height * 2 / 3));
                elLines[2].attr("x1", width * (1 / 3)).attr("y1", 0).attr("x2", width * (1 / 3)).attr("y2", height);
                elLines[3].attr("x1", width * (2 / 3)).attr("y1", 0).attr("x2", width * (2 / 3)).attr("y2", height);
            };

            var drawCluster = function(clusterIndex) {

                // Inefficent
                var layout = osApi.getLayout();
                var width = ($window.innerWidth - layout.left - layout.right);
                var height = ($window.innerHeight - 120);
                elChart.attr("width", width).attr("height", height);
                var boxWidth = Math.floor(width / 3);
                var boxHeight = Math.floor(height / 3);

                // Resize Hitarea
                var elHitarea = elHitareas[clusterIndex];
                elHitarea
                    .attr("width", boxWidth)
                    .attr("height", boxHeight);

                // Figure Out Scale Hitarea
                var data = clusterLayouts[clusterIndex].data;
                var xScale = d3.scaleLinear().domain(data.domain.pc1).range([5, Math.min(boxWidth) - 5]);
                var yScale = d3.scaleLinear().domain(data.domain.pc2).range([5, Math.min(boxHeight) - 5]);
                var elPlot = elPlots[clusterIndex];


                var brush = elBrushes[clusterIndex];
                brush.on("start", brushStart);
                brush.on("end", brushEnd);
                brush.extent([
                    [0, 0],
                    [boxWidth, boxHeight]
                ]);

                elPlot.call(brush);
                brush.index = clusterIndex;
                brush.xScale = xScale;
                brush.yScale = yScale;
                elPlot.attr("transform", "translate(" + ((clusterIndex % 3) * boxWidth) + "," + (parseInt(clusterIndex / 3) * boxHeight) + ")");
                var circles = elPlot.selectAll("circle")
                    .data(data.bind);


                circles.enter()
                    .append("svg:circle")
                    .attr("cx", 0).attr("cy", 0)
                    .attr("class", "point")
                    .attr("r", 1)
                    .style("fill", function(d) { return clusterColors[clusterIndex].lookup[d.id]; })
                    .attr("cx", function(d) { return xScale(d.x); })
                    .attr("cy", function(d) { return yScale(d.y); });

                circles.exit()
                    .transition()
                    .duration(200)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .style("fill-opacity", "0")
                    .remove();

                circles
                    .transition()
                    .duration(750)
                    .attr("cx", function(d) { return xScale(d.x); })
                    .attr("cy", function(d) { return yScale(d.y); });


            };

            // // Listen For Resize
            osApi.onResize.add(draw);
            // angular.element($window).bind('resize',
            //     _.debounce(resize, 300)
            // );
        }
    }
})();