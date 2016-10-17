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
            vm.rowLabels = vm.colLabels = vm.rowDendrogram = vm.colDendrogram = vm.gridlines = true;
    
            var data = {"x":{"rows":{"members":32,"height":425.344651694364,"edgePar":{"col":""},"children":[{"members":23,"height":261.849881468371,"edgePar":{"col":""},"children":[{"members":16,"height":141.704447795403,"edgePar":{"col":""},"children":[{"members":12,"height":113.302300506212,"edgePar":{"col":""},"children":[{"members":11,"height":74.3824295717746,"edgePar":{"col":""},"children":[{"members":6,"height":50.1094029998363,"edgePar":{"col":""},"children":[{"members":5,"height":33.180384265406,"edgePar":{"col":""},"children":[{"members":4,"height":20.6939435584424,"edgePar":{"col":""},"children":[{"members":3,"height":13.1357108677072,"edgePar":{"col":""},"children":[{"members":2,"height":8.65359029536296,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Toyota Corona","edgePar":{"col":""}},{"members":1,"height":0,"label":"Porsche 914-2","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Datsun 710","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Volvo 142E","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Merc 230","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Lotus Europa","edgePar":{"col":""}}]},{"members":5,"height":64.889871320569,"edgePar":{"col":""},"children":[{"members":4,"height":15.6724726830197,"edgePar":{"col":""},"children":[{"members":2,"height":1.52315462117278,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Merc 280","edgePar":{"col":""}},{"members":1,"height":0,"label":"Merc 280C","edgePar":{"col":""}}]},{"members":2,"height":0.61532511731604,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Mazda RX4 Wag","edgePar":{"col":""}},{"members":1,"height":0,"label":"Mazda RX4","edgePar":{"col":""}}]}]},{"members":1,"height":0,"label":"Merc 240D","edgePar":{"col":""}}]}]},{"members":1,"height":0,"label":"Ferrari Dino","edgePar":{"col":""}}]},{"members":4,"height":14.7807070196253,"edgePar":{"col":""},"children":[{"members":3,"height":10.3922856003865,"edgePar":{"col":""},"children":[{"members":2,"height":5.14734154685698,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Fiat 128","edgePar":{"col":""}},{"members":1,"height":0,"label":"Fiat X1-9","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Toyota Corolla","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Honda Civic","edgePar":{"col":""}}]}]},{"members":7,"height":103.431069316719,"edgePar":{"col":""},"children":[{"members":5,"height":51.8242520447715,"edgePar":{"col":""},"children":[{"members":3,"height":2.13834047803431,"edgePar":{"col":""},"children":[{"members":2,"height":0.982649479723062,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Merc 450SL","edgePar":{"col":""}},{"members":1,"height":0,"label":"Merc 450SE","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Merc 450SLC","edgePar":{"col":""}}]},{"members":2,"height":14.0154994559595,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Dodge Challenger","edgePar":{"col":""}},{"members":1,"height":0,"label":"AMC Javelin","edgePar":{"col":""}}]}]},{"members":2,"height":33.5508692137775,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Hornet 4 Drive","edgePar":{"col":""}},{"members":1,"height":0,"label":"Valiant","edgePar":{"col":""}}]}]}]},{"members":9,"height":214.936685793747,"edgePar":{"col":""},"children":[{"members":8,"height":134.811946429091,"edgePar":{"col":""},"children":[{"members":5,"height":101.738968566622,"edgePar":{"col":""},"children":[{"members":3,"height":21.2655989805131,"edgePar":{"col":""},"children":[{"members":2,"height":10.0761202851097,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Duster 360","edgePar":{"col":""}},{"members":1,"height":0,"label":"Camaro Z28","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Ford Pantera L","edgePar":{"col":""}}]},{"members":2,"height":40.005247468301,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Pontiac Firebird","edgePar":{"col":""}},{"members":1,"height":0,"label":"Hornet Sportabout","edgePar":{"col":""}}]}]},{"members":3,"height":40.8399635773589,"edgePar":{"col":""},"children":[{"members":2,"height":15.6224446230416,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Cadillac Fleetwood","edgePar":{"col":""}},{"members":1,"height":0,"label":"Lincoln Continental","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Chrysler Imperial","edgePar":{"col":""}}]}]},{"members":1,"height":0,"label":"Maserati Bora","edgePar":{"col":""}}]}]},"cols":{"members":11,"height":1475.10429122825,"edgePar":{"col":""},"children":[{"members":9,"height":115.849514457334,"edgePar":{"col":""},"children":[{"members":7,"height":34.7850542618522,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"cyl","edgePar":{"col":""}},{"members":6,"height":18.9208879284245,"edgePar":{"col":""},"children":[{"members":2,"height":3.60555127546399,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"am","edgePar":{"col":""}},{"members":1,"height":0,"label":"vs","edgePar":{"col":""}}]},{"members":4,"height":10.6897474245185,"edgePar":{"col":""},"children":[{"members":2,"height":8.59634050046879,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"carb","edgePar":{"col":""}},{"members":1,"height":0,"label":"wt","edgePar":{"col":""}}]},{"members":2,"height":2.98172768709686,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"drat","edgePar":{"col":""}},{"members":1,"height":0,"label":"gear","edgePar":{"col":""}}]}]}]}]},{"members":2,"height":33.2610913831762,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"qsec","edgePar":{"col":""}},{"members":1,"height":0,"label":"mpg","edgePar":{"col":""}}]}]},{"members":2,"height":656.640441946732,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"hp","edgePar":{"col":""}},{"members":1,"height":0,"label":"disp","edgePar":{"col":""}}]}]},"matrix":{"data":["4","0","1","1","2.465","3.7","3","20.01","21.5","97","120.1","4","1","0","2","2.14","4.43","5","16.7","26","91","120.3","4","1","1","1","2.32","3.85","4","18.61","22.8","93","108","4","1","1","2","2.78","4.11","4","18.6","21.4","109","121","4","0","1","2","3.15","3.92","4","22.9","22.8","95","140.8","4","1","1","2","1.513","3.77","5","16.9","30.4","113","95.1","6","0","1","4","3.44","3.92","4","18.3","19.2","123","167.6","6","0","1","4","3.44","3.92","4","18.9","17.8","123","167.6","6","1","0","4","2.875","3.9","4","17.02","21","110","160","6","1","0","4","2.62","3.9","4","16.46","21","110","160","4","0","1","2","3.19","3.69","4","20","24.4","62","146.7","6","1","0","6","2.77","3.62","5","15.5","19.7","175","145","4","1","1","1","2.2","4.08","4","19.47","32.4","66","78.7","4","1","1","1","1.935","4.08","4","18.9","27.3","66","79","4","1","1","1","1.835","4.22","4","19.9","33.9","65","71.1","4","1","1","2","1.615","4.93","4","18.52","30.4","52","75.7","8","0","0","3","3.73","3.07","3","17.6","17.3","180","275.8","8","0","0","3","4.07","3.07","3","17.4","16.4","180","275.8","8","0","0","3","3.78","3.07","3","18","15.2","180","275.8","8","0","0","2","3.52","2.76","3","16.87","15.5","150","318","8","0","0","2","3.435","3.15","3","17.3","15.2","150","304","6","0","1","1","3.215","3.08","3","19.44","21.4","110","258","6","0","1","1","3.46","2.76","3","20.22","18.1","105","225","8","0","0","4","3.57","3.21","3","15.84","14.3","245","360","8","0","0","4","3.84","3.73","3","15.41","13.3","245","350","8","1","0","4","3.17","4.22","5","14.5","15.8","264","351","8","0","0","2","3.845","3.08","3","17.05","19.2","175","400","8","0","0","2","3.44","3.15","3","17.02","18.7","175","360","8","0","0","4","5.25","2.93","3","17.98","10.4","205","472","8","0","0","4","5.424","3","3","17.82","10.4","215","460","8","0","0","4","5.345","3.23","3","17.42","14.7","230","440","8","1","0","8","3.57","3.54","5","14.6","15","335","301"],"dim":[32,11],"rows":["Toyota Corona","Porsche 914-2","Datsun 710","Volvo 142E","Merc 230","Lotus Europa","Merc 280","Merc 280C","Mazda RX4 Wag","Mazda RX4","Merc 240D","Ferrari Dino","Fiat 128","Fiat X1-9","Toyota Corolla","Honda Civic","Merc 450SL","Merc 450SE","Merc 450SLC","Dodge Challenger","AMC Javelin","Hornet 4 Drive","Valiant","Duster 360","Camaro Z28","Ford Pantera L","Pontiac Firebird","Hornet Sportabout","Cadillac Fleetwood","Lincoln Continental","Chrysler Imperial","Maserati Bora"],"cols":["cyl","am","vs","carb","wt","drat","gear","qsec","mpg","hp","disp"]},"image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAALCAYAAAAeEY8BAAAEZElEQVQ4jWXTW2xTBRzH8W/P6XXrlfWybt26DQaDbYzJYF7IzIIkKCgRwSAkSogajDEYXxZfZMQXw4M3jDFCTIREVEggAiFAyIZhW1CZ4ByDXdtd6LbSbr2st3N6jg/GJsT3T34P33/+mgsDs+qjdJZvro3Tsb2OaCZH73iMzSsdfHpxmMZaJ09V2yjSidgNOo6cu8d7z68gnJSodpjoOHWHbDpHx94mfuyb4sCzfnSCULCiqKFjex0pSeb83XlEQQOAoqpsrXci7njr/U67QU/XvTC9oxGWl1pwFOk43TuN32tFzqvMJSQsRi0aQWVrQylLkszJGwHKXMWUeqwYzAZCsRzdP19FKPPhLzESz8m82OQt7Po9ZvauK+ePmRg3bwXZvcnP0Z8GEFv3vNtpNWgRTDq2Nbk5eSNAKJHD7zETT0voRAFR1KCgIS0pxHMyY5FMwSZyMh67iXhaomF9HRkpj71YTzL7r13mKCIQStBe7+KL7nGa/XYw6pmL53jpSR/Cg/kUwViaSruBgdkU+bzKvtZyHkZTbFnjJCPlyeTyrHKbmFzIIGig0m7AaTJwcEsNsViGBq+ZKrcZs0mHSa/lXO8UPSMR6krM1DqNtK3zcuzyKPtay/n6x36eXuFgmcXAV2f/RtjV4GFyIUff2CK1TiOHX17DscujxGIZfFYT+zaUMbuQ4tq9CMMzMT757jeq7UUAOE0G8nmVM72TtNc42N3oYXYhxYpKOwatQOe5QcrMJtqrHYVd/3I3tSXF7Kr3UOq1IkobXuscGIvQ1zPM/udWoxU0tNW5CrfzuYo5sNHPh59foeWJapbXuPj24hA7N1aiqNA3scDbm6uRFIWrw1FU4JVmD/VlZkxmIylZ5tLgPENzSyQzcsFefhAhkZXRnO6fVhVVZWg+hceso3s4ikErEpxN8Ga7H0GjoWciztximj0tXhRV5dfxGK1+C5cGwv+z4aTEnekEB1srCSaWmE9KWIwCt6eWmJhLkEjmHrPC1ftRJEVltbuISEpmW6MLW7GeEruRgdkUiqpydyTMG60+bgbiaNDQVmPj+5tTWE16WqqsrKywF+yZ3kl2rvVw/Pcp/JZi3GYdX14YodSi54W1btavcnGiK4iiqrjMOkR3++udobhEmd2A16LHotdRbtNzvmeSR4ksfwZihWzd98MMziYJJSRebfHSWuGgSC9y6voY0ZRE/8QikqSwrsZO72iUuWyesz1BHoWTHN7RyFwqw4lfhrDZjfRPxGiusiF+dORwp82k48pgmLXlViRFYWoxi89rBUFgOhRnMLREc5WNJp8Vt9VIOJmjcpmRTD5PYCFNTbkNWYVYMotWKxZs11CY+wPTHD/UxnQyxa1gko93NNA1FmF0KMREIo/wXwpJVnjn6HVMWpEKu4G0rHBoUzVWm5HAePixbA+jKT747AbxrIzPZgBge6OLbFZmemaRE13Bwtsl/urhh/6H3J5JcqlrBL1WYP8zFSwGxnA6TPwDUPUZFSxOfbgAAAAASUVORK5CYII=","theme":null,"options":{"xaxis_height":80,"yaxis_width":120,"xaxis_font_size":null,"yaxis_font_size":null,"brush_color":"#0000FF","show_grid":true,"anim_duration":500}},"width":null,"height":null,"sizingPolicy":{"defaultWidth":null,"defaultHeight":null,"padding":null,"viewer":{"defaultWidth":null,"defaultHeight":null,"padding":null,"fill":true,"suppress":false,"paneHeight":null},"browser":{"defaultWidth":null,"defaultHeight":null,"padding":null,"fill":true},"knitr":{"defaultWidth":null,"defaultHeight":null,"figure":true}},"dependencies":null,"elementId":null,"preRenderHook":null,"jsHooks":[]};
            var elChart = d3.select("#heatmap-chart");
            var colDend = elChart.append("svg").classed("dendrogram colDend", true);
            var rowDend = elChart.append("svg").classed("dendrogram rowDend", true);
            var colmap = elChart.append("svg").classed("colormap", true)
            var xaxis = elChart.append("svg").classed("axis xaxis", true);
            var yaxis = elChart.append("svg").classed("axis yaxis", true);

            var layout = osApi.getLayout();
            var width = $window.innerWidth - layout.left - layout.right;
            var height = $window.innerHeight - 120; //10
            var topLineWidth = 5;

           
            function axis(svg, data, width, height, x, y, rotated){
                svg.selectAll("*").remove();

                if (rotated ? !vm.rowLabels : !vm.colLabels) return;
                    
                svg
                .attr("width", width).attr("height", height)
                .style("position","absolute")
                .style("left",x)
                .style("top",y);

                
                var g = svg.append("g");
                //g.append("rect").attr("width",width).attr("height",height).style("fill","#EEE");
                var y = d3.scaleLinear().domain([0, data.length]).range([0, rotated ? width:height]);

                var textAnchor = (rotated) ? "start" : "start";
                var textX = (rotated) ? 20 : 10;
                var labels = g.selectAll('label').data(data);
                
                labels
                    .enter().append("text")
                    .attr(rotated ? "x" : "y", function(d,i) { return y(i+.8); })
                    .attr(rotated ? "y" : "x", textX)
                    .attr("text-anchor", textAnchor)
                    .attr("font-size","12px")
                    .text( function(d){ return d; });


            }
            function dendrogram(svg, data, width, height, x, y, rotated) {
                svg.selectAll("*").remove();

                if (rotated ? !vm.rowDendrogram : !vm.colDendrogram) return;

                svg
                .attr("width", width).attr("height", height)
                .style("position","absolute")
                .style("left",x)
                .style("top",y);

                // Width
                var x = d3.scaleLinear()
                    .domain([10, 0])
                    .range([0,width]);

                var y = d3.scaleLinear()
                    .domain([0, width])
                    .range([0, height]);
            
                var cluster = d3.cluster()
                    .separation(function(a, b) { return 1; })
                    .size([width, height]);

                var transform = "translate(1,0)";
                if (rotated) {
                     x.range([height*1.5,0]);
                    y.range([0,width])
                    transform = "rotate(-90) translate(-"+height+")";
                }
                var dendrG = svg
                    .attr("width", width)
                    .attr("height", height)
                  .append("g")
                    .attr("transform", transform);

                var hierarchy = d3.hierarchy(data)
                var c = cluster(hierarchy);
                var l = c.links().map(function(l, i) {
                  return {
                    source: {x: l.source.x, y: l.source.height},
                    target: {x: l.target.x, y: l.target.height},
                    edgePar: l.target.edgePar
                  };
                });
                
                var lines = dendrG.selectAll("polyline").data(l);
                lines
                    .enter().append("polyline")
                    .attr("class", "denolink")
                    .attr("points", function(d,i){
                        return x(d.source.y) + "," + y(d.source.x) + " " +
                        x(d.source.y) + "," + y(d.target.x) + " " +
                        x(d.target.y) + "," + y(d.target.x);
                    });
            }
            function heatmap(svg, data, width, height,x,y){
                svg.selectAll("*").remove();
                svg.attr("width", width).attr("height", height).style("left",x).style("top",y).style("position","absolute");
                var maxValue = Math.max.apply(null, data.data);
                var minValue = Math.min.apply(null, data.data);
                
                var color = d3.scaleLinear().domain([minValue, maxValue]).range(["purple","blue"]);
                var cols = data.dim[1];
                var rows = data.dim[0];
                var x = d3.scaleLinear().domain([0, cols]).range([0, width]);
                var y = d3.scaleLinear().domain([0, rows]).range([0, height]);
                var grid = (vm.gridlines) ? 1 : -1;
                
                var boxes = svg.selectAll('box').data(data.data);
                boxes
                    .enter().append("rect")
                    .property("colIndex", function(d, i) { return i % cols; })
                    .property("rowIndex", function(d, i) { return Math.floor(i / cols); })
                    .attr("x", function(d, i) { return x(i % cols); })
                    .attr("y", function(d, i) { return y(Math.floor(i / cols)); })
                    .attr("width", x(1)-grid)
                    .attr("height", y(1)-grid)
                    .attr("fill", function(d) { return color(d); })
            }
            
            vm.draw = function(){
                console.log("DRAW");
                var layout = osApi.getLayout();
                width = $window.innerWidth - layout.left - layout.right;
                height = $window.innerHeight - 120; //10
                dendrogram(rowDend, data.x.rows,    80, 500, 20, 150, false);
                dendrogram(colDend, data.x.cols,    500, 80, 100, 70,  true);
                heatmap(colmap, data.x.matrix,      500, 500, 100, 150);
                axis(xaxis, data.x.matrix.rows,     150, 500, 610, 150, false);
                axis(yaxis, data.x.matrix.cols,     500, 100, 100, 650, true);

            }

            vm.draw()

            
            


        }
    }
})();
