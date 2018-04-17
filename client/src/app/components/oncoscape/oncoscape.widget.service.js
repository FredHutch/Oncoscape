(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osWidget', osWidget);

    /** @ngInject */
    function osWidget($, _, d3, osApi) {

        var makePlot = function(options){
            switch(options.f) {
                case "Bar Plot":
                    makeBarPlot(options)
                    break;
                case "Line Plot":
                    makeLinePlot(options)
                    break;
                case "Scatter Plot":
                    makeScatterPlot(options)
                    break;
                case "Matrix":
                    makeColoredMatrix(options)
                    break;
                default:
                    break;
            }
        }

        var makeLinePlot = function(options){

            var margin = options.margin,
                width = options.width,
                height = options.height,
                data = options.data;
            var domain = {
                x : d3.extent(data, function(d) { return d.x; }),
                y: d3.extent(data, function(d) { return d.y; })
            } 
            if(angular.isDefined(options.domain.x)){ 
                domain.x = options.domain.x }
            if(angular.isDefined(options.domain.y)){ 
                    domain.y = options.domain.y }

            d3.selectAll(options.html + " svg").remove()
            
            var svg = d3.select(options.html).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
            
            var x = d3.scaleLinear()
                .rangeRound([0, width]);
            
            var y = d3.scaleLinear()
                .rangeRound([height, 0]);
            
            var line = d3.line()
                .x(function(d) { return x(d.x); })
                .y(function(d) { return y(d.y); });

    
            x.domain(domain.x);
            y.domain(domain.y);
            
            svg.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(d3.axisBottom(x))
                .select(".domain")
                .remove();
            
            svg.append("g")
                .call(d3.axisLeft(y))
                .append("text")
                .attr("fill", "#000")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", "0.71em")
                .attr("text-anchor", "end")
                .text(options.labels.y);
            
            svg.append("path")
                .datum(data)
                .attr("fill", "none")
                .attr("stroke", "steelblue")
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .attr("stroke-width", 1.5)
                .attr("d", line);
        }

        var makeColoredMatrix = function(options) {
            var width = options.width,
            height = options.height,
            data = options.data,
            container = options.container,
            html = options.html,
            labelsData = options.labels,
            startColor = options.start_color,
            endColor = options.end_color,
            margin = options.margin;

            var widthLegend = 70;

            if(!data){throw new Error('Please pass data');}

            if(!Array.isArray(data) || !data.length || !Array.isArray(data[0])){
                throw new Error('It should be a 2-D array');
            }

            var maxValue = d3.max(data, function(layer) { return d3.max(layer, function(d) { return d; }); });
            var minValue = d3.min(data, function(layer) { return d3.min(layer, function(d) { return d; }); });

            var numrows = data.length;
            var numcols = data[0].length;

            d3.select(html + "-mtx").remove()
            d3.select(html + "-legend").remove()

            var mainDiv = d3.select(html)
                mainDiv.append("div").attr("id", container+"-mtx").attr("style", "display:inline-block")
                mainDiv.append("div").attr("id", container+"-legend").attr("style", "display:inline-block")

            
            var svg = d3.select(html+"-mtx").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var background = svg.append("rect")
                .style("stroke", "black")
                .style("stroke-width", "2px")
                .attr("width", width)
                .attr("height", height);

            var x = d3.scaleBand()
                .domain(d3.range(numcols))
                .rangeRound([0, width]);

            var y = d3.scaleBand()
                .domain(d3.range(numrows))
                .rangeRound([0, height]);

            var colorMap = d3.scaleLinear()
                .domain([minValue,maxValue])
                .range([startColor, endColor]);

            var row = svg.selectAll(".row")
                .data(data)
                .enter().append("g")
                .attr("class", "row")
                .attr("transform", function(d, i) { return "translate(0," + y(i) + ")"; });

            var cell = row.selectAll(".cell")
                .data(function(d) { return d; })
                    .enter().append("g")
                .attr("class", "cell")
                .attr("transform", function(d, i) { return "translate(" + x(i) + ", 0)"; });

            cell.append('rect')
                .attr("width", x.bandwidth())
                .attr("height", y.bandwidth())
                .style("stroke-width", 0);

            // cell.append("text")
            //     .attr("dy", ".32em")
            //     .attr("x", x.bandwidth() / 2)
            //     .attr("y", y.bandwidth() / 2)
            //     .attr("text-anchor", "middle")
            //     .style("fill", function(d, i) { return d >= maxValue/2 ? 'white' : 'black'; })
            //     .text(function(d, i) { return d; });

            row.selectAll(".cell")
                .data(function(d, i) { return data[i]; })
                .style("fill", colorMap);

            var labels = svg.append('g')
                .attr('class', "labels");

            var columnLabels = labels.selectAll(".column-label")
                .data(labelsData.col)
                .enter().append("g")
                .attr("class", "column-label")
                .attr("transform", function(d, i) { return "translate(" + x(i) + "," + height + ")"; });

            // columnLabels.append("line")
            //     .style("stroke", "black")
            //     .style("stroke-width", "1px")
            //     .attr("x1", x.bandwidth() / 2)
            //     .attr("x2", x.bandwidth() / 2)
            //     .attr("y1", 0)
            //     .attr("y2", 5);

            columnLabels.append("text")
                .attr("x", 30)
                .attr("y", y.bandwidth() )
                .attr("dy", ".2em")
                .attr("text-anchor", "end")
                .text(function(d, i) { return d; });

            var rowLabels = labels.selectAll(".row-label")
                .data(labelsData.row)
            .enter().append("g")
                .attr("class", "row-label")
                .attr("transform", function(d, i) { return "translate(" + 0 + "," + y(i) + ")"; });

            rowLabels.append("line")
                .style("stroke", "black")
                .style("stroke-width", "1px")
                .attr("x1", 0)
                .attr("x2", -5)
                .attr("y1", y.bandwidth() / 2)
                .attr("y2", y.bandwidth() / 2);

            rowLabels.append("text")
                .attr("x", -8)
                .attr("y", y.bandwidth() / 2)
                .attr("dy", ".32em")
                .attr("text-anchor", "end")
                .attr("font-size", "smaller")
                .text(function(d, i) { return d; });

            var key = d3.select(html+"-legend")
                .append("svg")
                .attr("width", widthLegend)
                .attr("height", height + margin.top + margin.bottom);

            var legend = key
                .append("defs")
                .append("svg:linearGradient")
                .attr("id", "gradient")
                .attr("x1", "100%")
                .attr("y1", "0%")
                .attr("x2", "100%")
                .attr("y2", "100%")
                .attr("spreadMethod", "pad");

            legend.append("stop")
                .attr("offset", "0%")
                .attr("stop-color", endColor)
                .attr("stop-opacity", 1);

            legend.append("stop")
                .attr("offset", "100%")
                .attr("stop-color", startColor)
                .attr("stop-opacity", 1);

            key.append("rect")
                .attr("width", widthLegend/2-10)
                .attr("height", height)
                .style("fill", "url(#gradient)")
                .attr("transform", "translate(0," + margin.top + ")");

            var y = d3.scaleLinear()
                .range([height, 0])
                .domain([minValue, maxValue]);

            var yAxis = d3.axisRight(y)

            key.append("g")
                .attr("class", "y axis")
                .attr("transform", "translate(41," + margin.top + ")")
                .call(yAxis)

        }

        var makeBarPlot = function(options){

            var container = options.container,
                data = options.data,
                labels = options.labels,
                width = options.width,
                height = options.height,
                margin = options.margin;
            var elTip = d3.tip().attr("class", "tip " + container).offset([-8, 0]).html(function(d) {
                    return d.tip;
                });
            
            if(!angular.isDefined(options.color)){options.color = '#0096d5'}
            data.map(function(d){
                if(!angular.isDefined(d.color)) 
                    d.color = options.color;
                return d
            })

            d3.selectAll(options.html + " svg").remove()
            d3.selectAll(".tip."+container).remove();

            var svg = d3.select(options.html).append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            var x = d3.scaleBand().rangeRound([0, width]).padding(0.1),
                y = d3.scaleLinear().rangeRound([height, 0]);

            x.domain(data.map(function(d) { return d.x; }));
            y.domain([0, d3.max(data, function(d) { return d.y; })]);

            svg.append("g")
                .attr("class", "axis axis--x")
                .attr("transform", "translate(0," + height + ")")
                .attr("dy", "0.71em")
                .call(d3.axisBottom(x))
                .selectAll("text")
                    .attr("y", 0)
                    .attr("x", 9)
                    .attr("dy", ".35em")
                    .attr("transform", "rotate(90)")
                    .style("text-anchor", "start");

            svg.append("g")
                .attr("class", "axis axis--y")
                .call(d3.axisLeft(y).ticks(5))
                .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", "0.71em")
                .attr("text-anchor", "end")
                .text(labels.y);

            svg.selectAll(".bar")
                .data(data)
                .enter().append("rect")
                .on("mouseover", elTip.show)
                .on("mouseout", elTip.hide)
                .attr("class", "bar")
                .attr("x", function(d) { return x(d.x); })
                .attr("y", function(d) { return y(d.y); })
                .attr("width", x.bandwidth())
                .attr("height", function(d) { return height - y(d.y); })
                .attr("fill", function(d){return  d.color});
            svg.exit().remove();
            svg.call(elTip);

            
        }

        var makeScatterPlot = function(options){
            
            var layout = options.layout,
                width = options.width,
                height = options.height,
                data = options.data,
                labels = options.labels,
                nodeClass = options.nodeClass;
            var container, svg, d3Brush, d3Points, d3xAxis, d3yAxis;
            
                container = options.html;
                
                d3.selectAll(container + " svg").remove()

                angular.element(container).css({
                    "width": width + "px",
                    "padding-left": layout.left + "px"
                });
                svg = d3.select(container).append("svg")
                        .attr("width", width).attr("height", height);
                d3Brush  = svg.append("g").attr("width", width).attr("height", height);
                d3Points = svg.append("g")
                              .attr("width", width).attr("height", height);
                d3xAxis  = svg.append("g")
                d3yAxis  = svg.append("g")
                
                // Add Labels
                d3xAxis.append("text")
                    .attr("x", 50)
                    .attr("y", 15)
                    .text(labels.x);

                d3yAxis.append("text")
                    .attr("y", 55)
                    .attr("x", 25)
                    .text(labels.y);

            
            
            // Scale
            var scaleX = d3.scaleLinear().domain(d3.extent(data, function(d) { return d.x; })).range([50, width - 50]).nice();
            var scaleY = d3.scaleLinear().domain(d3.extent(data, function(d) { return d.y; })).range([50, height - 50]).nice();

            // Draw
            var circles = d3Points.selectAll("circle").data(data);
                circles.enter().append("svg:circle")
                    .attr("class", nodeClass)
                    .attr("cx", function(d) {return scaleX(d.x);})
                    .attr("cy", function(d) {return scaleY(d.y);})
                    .attr("r", 3)
                    .style("fill", function(d) {return d.color;});
                circles.exit()
                    .transition()
                    .duration(200)
                    .delay(function(d, i) {return i / 300 * 100; })
                    .style("fill-opacity", "0")
                    .remove();
                circles
                    .style("fill", function(d) {return d.color;})
                    .transition()
                    .duration(750)
                    .delay(function(d, i) { return i / 300 * 100;})
                    .attr("r", 3)
                    .attr("cx", function(d) { return scaleX(d.x);})
                    .attr("cy", function(d) { return scaleY(d.y); })
                    .style("fill", function(d) { return d.color; })
                    .style("fill-opacity", 0.8);

                // Axis
                var axisX = d3.axisTop().scale(scaleX).ticks(3);
                var axisY = d3.axisLeft().scale(scaleY).ticks(3);

                d3xAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(0, " + height * 0.5 + ")")
                    .call(axisX);

                d3yAxis
                    .attr("class", "axis")
                    .attr("transform", "translate(" + width * 0.5 + ", 0)")
                    .call(axisY);


                // Brush
                var brush = d3.brush()
                    .on("end", function() {

                        if (!d3.event.selection) {
                            osApi.setCohort([], osApi.ALL, osApi.SAMPLE);
                            return;
                        }

                        var bv = d3.event.selection;
                        var xMin = bv[0][0];
                        var xMax = bv[1][0];
                        var yMin = bv[0][1];
                        var yMax = bv[1][1];

                        var ids = d3Points.selectAll("circle").data().filter(function(d) {
                            var x = scaleX(d.x);
                            var y = scaleY(d.y);
                            return (x > xMin && x < xMax && y > yMin && y < yMax);
                        }).map(function(d) {
                            return d.s;
                        });
                        osApi.setCohort(ids, "PCA", osApi.SAMPLE);

                    });

                d3Brush.attr("class", "brush").call(brush);
        }

        var getLegend = function(options){


        }



        return {

        
            // Tools + Layouts
            makePlot: makePlot,
            makeColoredMatrix: makeColoredMatrix,
            makeLinePlot: makeLinePlot,
            makeBarPlot: makeBarPlot,
            makeScatterPlot: makeScatterPlot,
            getLegend: getLegend

        };
    }
})();