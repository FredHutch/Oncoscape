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

            var colorMap;
            var vm = this;
            vm.patients = [];
            vm.patient = null;
            vm.datasource = osApi.getDataSource();
            vm.charts = [];

            var getColorMap = function(data) {
                var colors = ["#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5", "#2196F3", "#0277BD", "#00BCD4", "#009688", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B", "#FFC107", "#FF9800", "#FF5722", "#795548", "#C51162", "#B388FF"];
                var tags = data.reduce(function(p, c) {
                    tags = c.groups.reduce(function(p, c) {
                        return _.union(p, c.tags)
                    }, []);
                    return _.union(p, tags)
                }, []);
                colors.length = tags.length;
                var colorMap = _.object(tags, colors);
                colorMap["Tumor"] = "#FEFEFE";
                colorMap["Normal"] = "#EAEAEA";
                return colorMap;
            };

            
            osApi.setBusy(true);
            osApi.query("biomarker_immune_tree").then(function(response) {
                osApi.setBusy(false);
                colorMap = getColorMap(response.data[0].barcharts);
                response.data.forEach(function(v) {
                    v.barcharts.forEach(function(v) {
                        v.groups.forEach(function(v) {
                            v.show = true;
                            v.tags = v.tags.map(function(v){
                                return {name:v, color:colorMap[v]};
                            });
                        })
                    })
                });
                vm.patients = response.data;
                vm.patient = vm.patients[0];
                vm.draw()
            });

            vm.draw = function(){
                sunburst.draw(vm, colorMap);
                bars.draw(vm, colorMap);
            }

            // Sunburst
            var sunburst = (function() {
                var color = d3.scaleOrdinal(d3.schemeCategory20);
                var formatNumber = d3.format(",d");
                var arc,
                    radius,
                    x,
                    y,
                    data,
                    svg,
                    labelTumor,
                    labelNormal,
                    sunburstNormal,
                    sunburstTumor;

                var tooltip = d3.select("#sunburst-chart").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);
                var w = d3.select(window);

                var init = function(chart) {
                    svg = chart;
                    labelTumor = svg.append("text").text("Tumor");
                    labelNormal = svg.append("text").text("Normal");
                    sunburstNormal = svg.append("g");
                    sunburstTumor = svg.append("g");
                }

                var mousemove = function(d) {
                    tooltip
                        .style('top', (d3.event.layerY + 10) + 'px')
                        .style('left', (d3.event.layerX + 10) + 'px');
                }
                var mouseover = function(d) {
                    tooltip.html(d.data.name)
                        .style("opacity", 1)
                        .style('top', (d3.event.layerY + 10) + 'px')
                        .style('left', (d3.event.layerX + 10) + 'px');
                    w.on("mousemove", mousemove).on("mouseup", null);
                }

                var mouseout = function(d) {
                    tooltip.html(d.data.Name)
                        .style("opacity", 0)
                }

                var click = function(d) {
                    var root = d;
                    while (root.parent) root = root.parent
                    var sunburst = (root.data.name == "Normal") ? sunburstNormal : sunburstTumor;
                    sunburst
                        .transition()
                        .duration(750)
                        .tween("scale", function() {
                            var xd = d3.interpolate(x.domain(), [d.x0, d.x1]),
                                yd = d3.interpolate(y.domain(), [d.y0, 1]),
                                yr = d3.interpolate(y.range(), [d.y0 ? 20 : 0, radius]);
                            return function(t) {
                                x.domain(xd(t));
                                y.domain(yd(t)).range(yr(t));
                            };
                        })
                        .selectAll("path")
                        .attrTween("d", function(d) {
                            return function() {
                                return arc(d);
                            };
                        });
                };

                var drawSunburst = function(data, g, x, y) {

                    var partition = d3.partition();
                    var root = d3.hierarchy(data);
                    root.sum(function(d) {
                        return d.size;
                    });

                    var decendants = partition(root).descendants()
                    var path = g.selectAll("path").data(decendants)
                        .enter().append("g");

                    path.append("path")
                        .attr("d", arc)
                        .style("fill", function(d) {
                            return color((d.children ? d : d.parent).data.name);
                        })
                        .style("stroke", "#FFF")
                        .style("stroke-width", "2")
                        .on("click", click)
                        .on("mouseover", mouseover)
                        .on("mouseout", mouseout)
                };

                var draw = function(vm) {
                    data = vm.patient;
                    var layout = osApi.getLayout();
                    var height = $window.innerHeight - 180;
                    var width = ($window.innerWidth - layout.left - layout.right);
                    radius = (Math.min((width * .5), height - 200) / 2) - 10;
                    x = d3.scaleLinear().range([0, 2 * Math.PI]);
                    y = d3.scaleSqrt().range([0, radius]);
                    arc = d3.arc()
                        .startAngle(function(d) {
                            return Math.max(0, Math.min(2 * Math.PI, x(d.x0)));
                        })
                        .endAngle(function(d) {
                            return Math.max(0, Math.min(2 * Math.PI, x(d.x1)));
                        })
                        .innerRadius(function(d) {
                            return Math.max(0, y(d.y0));
                        })
                        .outerRadius(function(d) {
                            return Math.max(0, y(d.y1));
                        });

                    svg.attr("width", width).attr("height", height);
                    labelNormal.attr("transform", "translate(" + (radius + 10) + "," + 20 + ")");
                    labelTumor.attr("transform", "translate(" + (width - radius - 10) + "," + 20 + ")");

                    sunburstNormal.attr("transform", "translate(" + (radius + 10) + "," + (radius) + ")");
                    sunburstTumor.attr("transform", "translate(" + (width - radius - 10) + "," + (radius) + ")");

                    drawSunburst(data.tumor, sunburstTumor, x, y);
                    drawSunburst(data.normal, sunburstNormal, x, y);
                };

                return {
                    init: init,
                    draw: draw
                };
            })();

            // Bars
            var bars = (function() {

                // Elements
                var svg;
                var data;
                var charts;
                var layout, transformedData;
                var vm;

                var init = function(chart, viewModel) {
                    svg = chart;
                    charts = svg.append("g");
                    vm = viewModel;
                };

                var getLayoutMetrics = function(data) {
                    var layout = osApi.getLayout();
                    var widthTotal = ($window.innerWidth - layout.left - layout.right) - 40;
                    var widthChart = Math.floor(widthTotal / data.length);
                    var heightChart = 200; // Constant
                    var yChart = (Math.min((($window.innerWidth - layout.left - layout.right) * .5), ($window.innerHeight - 50) - 200)) - 10;
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

                var getTransformedData = function(data, colorMap) {

                    // Cartesian Product
                    function cartesianProductOf() {
                        return _.reduce(arguments, function(a, b) {
                            return _.flatten(_.map(a, function(x) {
                                return _.map(b, function(y) {
                                    return x.concat([y]);
                                });
                            }), true);
                        }, [
                            []
                        ]);
                    };

                    // Transform Data To Be Both Tree + List (Bar) Oriented
                    return data.map(function(chart) {


                        // Get Cartesian Product Of All Tags From Selected Groups 
                        var bars = cartesianProductOf.apply(this, chart.groups
                                .filter(function(c) {
                                    return c.show
                                })
                                .map(function(c) {
                                    return c.tags.map(function(v){ return v.name; });
                                }))
                            .map(function(v) {
                                return {
                                    value: 0,
                                    tags: v
                                }
                            });

                        // Sort Data On All Tags
                        bars.sort(function(a, b) {
                            for (var i = a.tags.length - 1; i >= 0; i--) {
                                if (a.tags[i] > b.tags[i]) return 1;
                                if (a.tags[i] < b.tags[i]) return -1;
                            }
                            return 0;
                        });

                        // Calculate Bar Values
                        var values = chart.values;
                        bars.forEach(function(bar) {
                            chart.values.forEach(function(value) {
                                if (_.difference(bar.tags, value.tags).length == 0) bar.value += value.data;
                            });
                        });

                        // Convert Array Into A Tree Structure
                        var tree = bars.reduce(function(p, c) {
                            var barNode = p;
                            c.tags.reverse().forEach(function(tag, index) {
                                var tagIndex = barNode.children.map(function(v) {
                                    return v.name;
                                }).indexOf(tag.name);
                                if (tagIndex == -1) {
                                    barNode.children.push({
                                        name: tag,
                                        children: [],
                                        value: 1,
                                        color: colorMap[tag]
                                    });
                                    barNode = barNode.children[barNode.children.length - 1];
                                } else {
                                    barNode = barNode.children[tagIndex];
                                    barNode.value += 1;
                                }
                            });
                            c.tags.reverse();
                            return p;
                        }, {
                            name: chart.name,
                            children: [],
                            value: bars.length,
                            color: '#DDD'
                        });

                        // Return Tree
                        return {
                            bars: bars,
                            tree: tree
                        };

                    });
                };

                var drawTree = function(el) {

                    // Chart G Element
                    var chartLayer = d3.select(this);

                    // Chart Background
                    chartLayer.append("rect")
                        .style("fill", "#EEE")
                        .attr("width", layout.widthChart - 5)
                        .attr("height", layout.heightChart);

                    // Chart Label
                    chartLayer.append("text").text(el.tree.name)
                        .attr("y", 20)
                        .attr("x", Math.round((layout.widthChart - 5) / 2))
                        .attr("text-anchor", "middle");

                    // Draw Bars
                    var bars = chartLayer.selectAll(".cat-bar").data(el.bars);
                    var yMax = _.max(el.bars, function(bar) {
                        return bar.value;
                    }).value;
                    var yMin = _.min(el.bars, function(bar) {
                        return bar.value;
                    }).value;
                    var yScale = d3.scaleLinear();
                    yScale.range([0, 110]);
                    yScale.domain([yMin, yMax]);
                    var barWidth = layout.widthChart / el.bars.length;
                    console.log(barWidth)
                    var newBars = bars.enter()
                        .append("rect")
                        .attr("x", function(d, i) {
                            return barWidth * i
                        })
                        .attr("y", function(d) {
                            return 140 - yScale(d.value)
                        })
                        .attr("width", barWidth)
                        .attr("height", function(d) {
                            return yScale(d.value);
                        })
                        .attr("fill", function(d) {
                            return (d.tags[0].name == "Normal") ? "#1476b6" : "#adc7ea";
                        });

                    // Create Partition Tree Legend 
                    var tree = d3.hierarchy(el.tree, function(d) {
                        return d.children;
                    });

                    var chartHeight = (1 / tree.height + 1) * 60;

                    var partition = d3.partition()
                        .size([layout.widthChart - 5, chartHeight]);

                    var nodes = partition(tree).descendants();

                    var node = chartLayer.selectAll(".cat-node")
                        .data(nodes);

                    var newNode = node.enter()
                        .append("rect")
                        .attr("class", "cat-node")
                        .attr("x", function(d) {
                            return d.x0;
                        })
                        .attr("y", function(d) {
                            return (200 - chartHeight) - (d.y0 - chartHeight);
                        })
                        .attr("width", function(d) {
                            return d.x1 - d.x0;
                        })
                        .attr("height", function(d) {
                            return d.y1 - d.y0;
                        })
                        .attr("fill", function(d) {
                            return d.data.color;
                        })
                        .style("visibility", function(d) {
                            return d.data.name == 'chart' ? "hidden" : "visible";
                        });

                }
  
                var draw = function(data, colorMap) {

                    vm.charts = data = vm.patient.barcharts;
                    layout = getLayoutMetrics(data);
                    
                    transformedData = getTransformedData(data, colorMap);

                    // Chart Spaces
                    var chart = charts.selectAll(".sunburst-barchart").data(transformedData);
                    chart.enter()
                        .append("g")
                        .attr("class", "sun-chart-g")
                        .attr("transform", function(d, i) {
                            return "translate(" + ((i * layout.widthChart) + layout.xChart) + "," + ($window.innerHeight - 380) + ")";
                        });
                    charts.selectAll(".sun-chart-g")
                        .each(drawTree);
                };
                return {
                    init: init,
                    draw: draw
                };
            })();

            var svg = d3.select("#sunburst-chart").append("svg");
            sunburst.init(svg);
            bars.init(svg, vm);

        }
    }
})();
