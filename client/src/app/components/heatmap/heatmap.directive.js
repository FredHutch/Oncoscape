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

            var elChart = $("#heatmap-chart");
            var data = {"x":{"rows":{"members":32,"height":425.344651694364,"edgePar":{"col":""},"children":[{"members":23,"height":261.849881468371,"edgePar":{"col":""},"children":[{"members":16,"height":141.704447795403,"edgePar":{"col":""},"children":[{"members":12,"height":113.302300506212,"edgePar":{"col":""},"children":[{"members":11,"height":74.3824295717746,"edgePar":{"col":""},"children":[{"members":6,"height":50.1094029998363,"edgePar":{"col":""},"children":[{"members":5,"height":33.180384265406,"edgePar":{"col":""},"children":[{"members":4,"height":20.6939435584424,"edgePar":{"col":""},"children":[{"members":3,"height":13.1357108677072,"edgePar":{"col":""},"children":[{"members":2,"height":8.65359029536296,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Toyota Corona","edgePar":{"col":""}},{"members":1,"height":0,"label":"Porsche 914-2","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Datsun 710","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Volvo 142E","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Merc 230","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Lotus Europa","edgePar":{"col":""}}]},{"members":5,"height":64.889871320569,"edgePar":{"col":""},"children":[{"members":4,"height":15.6724726830197,"edgePar":{"col":""},"children":[{"members":2,"height":1.52315462117278,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Merc 280","edgePar":{"col":""}},{"members":1,"height":0,"label":"Merc 280C","edgePar":{"col":""}}]},{"members":2,"height":0.61532511731604,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Mazda RX4 Wag","edgePar":{"col":""}},{"members":1,"height":0,"label":"Mazda RX4","edgePar":{"col":""}}]}]},{"members":1,"height":0,"label":"Merc 240D","edgePar":{"col":""}}]}]},{"members":1,"height":0,"label":"Ferrari Dino","edgePar":{"col":""}}]},{"members":4,"height":14.7807070196253,"edgePar":{"col":""},"children":[{"members":3,"height":10.3922856003865,"edgePar":{"col":""},"children":[{"members":2,"height":5.14734154685698,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Fiat 128","edgePar":{"col":""}},{"members":1,"height":0,"label":"Fiat X1-9","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Toyota Corolla","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Honda Civic","edgePar":{"col":""}}]}]},{"members":7,"height":103.431069316719,"edgePar":{"col":""},"children":[{"members":5,"height":51.8242520447715,"edgePar":{"col":""},"children":[{"members":3,"height":2.13834047803431,"edgePar":{"col":""},"children":[{"members":2,"height":0.982649479723062,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Merc 450SL","edgePar":{"col":""}},{"members":1,"height":0,"label":"Merc 450SE","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Merc 450SLC","edgePar":{"col":""}}]},{"members":2,"height":14.0154994559595,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Dodge Challenger","edgePar":{"col":""}},{"members":1,"height":0,"label":"AMC Javelin","edgePar":{"col":""}}]}]},{"members":2,"height":33.5508692137775,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Hornet 4 Drive","edgePar":{"col":""}},{"members":1,"height":0,"label":"Valiant","edgePar":{"col":""}}]}]}]},{"members":9,"height":214.936685793747,"edgePar":{"col":""},"children":[{"members":8,"height":134.811946429091,"edgePar":{"col":""},"children":[{"members":5,"height":101.738968566622,"edgePar":{"col":""},"children":[{"members":3,"height":21.2655989805131,"edgePar":{"col":""},"children":[{"members":2,"height":10.0761202851097,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Duster 360","edgePar":{"col":""}},{"members":1,"height":0,"label":"Camaro Z28","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Ford Pantera L","edgePar":{"col":""}}]},{"members":2,"height":40.005247468301,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Pontiac Firebird","edgePar":{"col":""}},{"members":1,"height":0,"label":"Hornet Sportabout","edgePar":{"col":""}}]}]},{"members":3,"height":40.8399635773589,"edgePar":{"col":""},"children":[{"members":2,"height":15.6224446230416,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"Cadillac Fleetwood","edgePar":{"col":""}},{"members":1,"height":0,"label":"Lincoln Continental","edgePar":{"col":""}}]},{"members":1,"height":0,"label":"Chrysler Imperial","edgePar":{"col":""}}]}]},{"members":1,"height":0,"label":"Maserati Bora","edgePar":{"col":""}}]}]},"cols":{"members":11,"height":1475.10429122825,"edgePar":{"col":""},"children":[{"members":9,"height":115.849514457334,"edgePar":{"col":""},"children":[{"members":7,"height":34.7850542618522,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"cyl","edgePar":{"col":""}},{"members":6,"height":18.9208879284245,"edgePar":{"col":""},"children":[{"members":2,"height":3.60555127546399,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"am","edgePar":{"col":""}},{"members":1,"height":0,"label":"vs","edgePar":{"col":""}}]},{"members":4,"height":10.6897474245185,"edgePar":{"col":""},"children":[{"members":2,"height":8.59634050046879,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"carb","edgePar":{"col":""}},{"members":1,"height":0,"label":"wt","edgePar":{"col":""}}]},{"members":2,"height":2.98172768709686,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"drat","edgePar":{"col":""}},{"members":1,"height":0,"label":"gear","edgePar":{"col":""}}]}]}]}]},{"members":2,"height":33.2610913831762,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"qsec","edgePar":{"col":""}},{"members":1,"height":0,"label":"mpg","edgePar":{"col":""}}]}]},{"members":2,"height":656.640441946732,"edgePar":{"col":""},"children":[{"members":1,"height":0,"label":"hp","edgePar":{"col":""}},{"members":1,"height":0,"label":"disp","edgePar":{"col":""}}]}]},"matrix":{"data":["4","0","1","1","2.465","3.7","3","20.01","21.5","97","120.1","4","1","0","2","2.14","4.43","5","16.7","26","91","120.3","4","1","1","1","2.32","3.85","4","18.61","22.8","93","108","4","1","1","2","2.78","4.11","4","18.6","21.4","109","121","4","0","1","2","3.15","3.92","4","22.9","22.8","95","140.8","4","1","1","2","1.513","3.77","5","16.9","30.4","113","95.1","6","0","1","4","3.44","3.92","4","18.3","19.2","123","167.6","6","0","1","4","3.44","3.92","4","18.9","17.8","123","167.6","6","1","0","4","2.875","3.9","4","17.02","21","110","160","6","1","0","4","2.62","3.9","4","16.46","21","110","160","4","0","1","2","3.19","3.69","4","20","24.4","62","146.7","6","1","0","6","2.77","3.62","5","15.5","19.7","175","145","4","1","1","1","2.2","4.08","4","19.47","32.4","66","78.7","4","1","1","1","1.935","4.08","4","18.9","27.3","66","79","4","1","1","1","1.835","4.22","4","19.9","33.9","65","71.1","4","1","1","2","1.615","4.93","4","18.52","30.4","52","75.7","8","0","0","3","3.73","3.07","3","17.6","17.3","180","275.8","8","0","0","3","4.07","3.07","3","17.4","16.4","180","275.8","8","0","0","3","3.78","3.07","3","18","15.2","180","275.8","8","0","0","2","3.52","2.76","3","16.87","15.5","150","318","8","0","0","2","3.435","3.15","3","17.3","15.2","150","304","6","0","1","1","3.215","3.08","3","19.44","21.4","110","258","6","0","1","1","3.46","2.76","3","20.22","18.1","105","225","8","0","0","4","3.57","3.21","3","15.84","14.3","245","360","8","0","0","4","3.84","3.73","3","15.41","13.3","245","350","8","1","0","4","3.17","4.22","5","14.5","15.8","264","351","8","0","0","2","3.845","3.08","3","17.05","19.2","175","400","8","0","0","2","3.44","3.15","3","17.02","18.7","175","360","8","0","0","4","5.25","2.93","3","17.98","10.4","205","472","8","0","0","4","5.424","3","3","17.82","10.4","215","460","8","0","0","4","5.345","3.23","3","17.42","14.7","230","440","8","1","0","8","3.57","3.54","5","14.6","15","335","301"],"dim":[32,11],"rows":["Toyota Corona","Porsche 914-2","Datsun 710","Volvo 142E","Merc 230","Lotus Europa","Merc 280","Merc 280C","Mazda RX4 Wag","Mazda RX4","Merc 240D","Ferrari Dino","Fiat 128","Fiat X1-9","Toyota Corolla","Honda Civic","Merc 450SL","Merc 450SE","Merc 450SLC","Dodge Challenger","AMC Javelin","Hornet 4 Drive","Valiant","Duster 360","Camaro Z28","Ford Pantera L","Pontiac Firebird","Hornet Sportabout","Cadillac Fleetwood","Lincoln Continental","Chrysler Imperial","Maserati Bora"],"cols":["cyl","am","vs","carb","wt","drat","gear","qsec","mpg","hp","disp"]},"image":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAALCAYAAAAeEY8BAAAEZElEQVQ4jWXTW2xTBRzH8W/P6XXrlfWybt26DQaDbYzJYF7IzIIkKCgRwSAkSogajDEYXxZfZMQXw4M3jDFCTIREVEggAiFAyIZhW1CZ4ByDXdtd6LbSbr2st3N6jg/GJsT3T34P33/+mgsDs+qjdJZvro3Tsb2OaCZH73iMzSsdfHpxmMZaJ09V2yjSidgNOo6cu8d7z68gnJSodpjoOHWHbDpHx94mfuyb4sCzfnSCULCiqKFjex0pSeb83XlEQQOAoqpsrXci7njr/U67QU/XvTC9oxGWl1pwFOk43TuN32tFzqvMJSQsRi0aQWVrQylLkszJGwHKXMWUeqwYzAZCsRzdP19FKPPhLzESz8m82OQt7Po9ZvauK+ePmRg3bwXZvcnP0Z8GEFv3vNtpNWgRTDq2Nbk5eSNAKJHD7zETT0voRAFR1KCgIS0pxHMyY5FMwSZyMh67iXhaomF9HRkpj71YTzL7r13mKCIQStBe7+KL7nGa/XYw6pmL53jpSR/Cg/kUwViaSruBgdkU+bzKvtZyHkZTbFnjJCPlyeTyrHKbmFzIIGig0m7AaTJwcEsNsViGBq+ZKrcZs0mHSa/lXO8UPSMR6krM1DqNtK3zcuzyKPtay/n6x36eXuFgmcXAV2f/RtjV4GFyIUff2CK1TiOHX17DscujxGIZfFYT+zaUMbuQ4tq9CMMzMT757jeq7UUAOE0G8nmVM72TtNc42N3oYXYhxYpKOwatQOe5QcrMJtqrHYVd/3I3tSXF7Kr3UOq1IkobXuscGIvQ1zPM/udWoxU0tNW5CrfzuYo5sNHPh59foeWJapbXuPj24hA7N1aiqNA3scDbm6uRFIWrw1FU4JVmD/VlZkxmIylZ5tLgPENzSyQzcsFefhAhkZXRnO6fVhVVZWg+hceso3s4ikErEpxN8Ga7H0GjoWciztximj0tXhRV5dfxGK1+C5cGwv+z4aTEnekEB1srCSaWmE9KWIwCt6eWmJhLkEjmHrPC1ftRJEVltbuISEpmW6MLW7GeEruRgdkUiqpydyTMG60+bgbiaNDQVmPj+5tTWE16WqqsrKywF+yZ3kl2rvVw/Pcp/JZi3GYdX14YodSi54W1btavcnGiK4iiqrjMOkR3++udobhEmd2A16LHotdRbtNzvmeSR4ksfwZihWzd98MMziYJJSRebfHSWuGgSC9y6voY0ZRE/8QikqSwrsZO72iUuWyesz1BHoWTHN7RyFwqw4lfhrDZjfRPxGiusiF+dORwp82k48pgmLXlViRFYWoxi89rBUFgOhRnMLREc5WNJp8Vt9VIOJmjcpmRTD5PYCFNTbkNWYVYMotWKxZs11CY+wPTHD/UxnQyxa1gko93NNA1FmF0KMREIo/wXwpJVnjn6HVMWpEKu4G0rHBoUzVWm5HAePixbA+jKT747AbxrIzPZgBge6OLbFZmemaRE13Bwtsl/urhh/6H3J5JcqlrBL1WYP8zFSwGxnA6TPwDUPUZFSxOfbgAAAAASUVORK5CYII=","theme":null,"options":{"xaxis_height":80,"yaxis_width":120,"xaxis_font_size":null,"yaxis_font_size":null,"brush_color":"#0000FF","show_grid":true,"anim_duration":500}},"width":null,"height":null,"sizingPolicy":{"defaultWidth":null,"defaultHeight":null,"padding":null,"viewer":{"defaultWidth":null,"defaultHeight":null,"padding":null,"fill":true,"suppress":false,"paneHeight":null},"browser":{"defaultWidth":null,"defaultHeight":null,"padding":null,"fill":true},"knitr":{"defaultWidth":null,"defaultHeight":null,"figure":true}},"dependencies":null,"elementId":null,"preRenderHook":null,"jsHooks":[]};

            heatmap("#heatmap-chart", data.x)

            function heatmap(selector, data, options) {


          // ==== BEGIN HELPERS =================================
          
          function htmlEscape(str) {
            return (str+"").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
          }
          
          // Given a list of widths/heights and a total width/height, provides
          // easy access to the absolute top/left/width/height of any individual
          // grid cell. Optionally, a single cell can be specified as a "fill"
          // cell, meaning it will take up any remaining width/height.
          // 
          // rows and cols are arrays that contain numeric pixel dimensions,
          // and up to one "*" value.
          function GridSizer(widths, heights, /*optional*/ totalWidth, /*optional*/ totalHeight) {
            this.widths = widths;
            this.heights = heights;
          
            var fillColIndex = null;
            var fillRowIndex = null;
            var usedWidth = 0;
            var usedHeight = 0;
            var i;
            for (i = 0; i < widths.length; i++) {
              if (widths[i] === "*") {
                if (fillColIndex !== null) {
                  throw new Error("Only one column can be designated as fill");
                }
                fillColIndex = i;
              } else {
                usedWidth += widths[i];
              }
            }
            if (fillColIndex !== null) {
              widths[fillColIndex] = totalWidth - usedWidth;
            } else {
              if (typeof(totalWidth) === "number" && totalWidth !== usedWidth) {
                throw new Error("Column widths don't add up to total width");
              }
            }
            for (i = 0; i < heights.length; i++) {
              if (heights[i] === "*") {
                if (fillRowIndex !== null) {
                  throw new Error("Only one row can be designated as fill");
                }
                fillRowIndex = i;
              } else {
                usedHeight += heights[i];
              }
            }
            if (fillRowIndex !== null) {
              heights[fillRowIndex] = totalHeight - usedHeight;
            } else {
              if (typeof(totalHeight) === "number" && totalHeight !== usedHeight) {
                throw new Error("Column heights don't add up to total height");
              }
            }
          }
          
          GridSizer.prototype.getCellBounds = function(x, y) {
            if (x < 0 || x >= this.widths.length || y < 0 || y >= this.heights.length)
              throw new Error("Invalid cell bounds");
          
            var left = 0;
            for (var i = 0; i < x; i++) {
              left += this.widths[i];
            }
          
            var top = 0;
            for (var j = 0; j < y; j++) {
              top += this.heights[j];
            }
          
            return {
              width: this.widths[x],
              height: this.heights[y],
              top: top,
              left: left
            }
          }
          
          // ==== END HELPERS ===================================


          var el = d3.select(selector);

          var bbox = el.node().getBoundingClientRect();

          var Controller = function() {
            this._events = d3.dispatch("highlight", "datapoint_hover", "transform");
            this._highlight = {x: null, y: null};
            this._datapoint_hover = {x: null, y: null, value: null};
            this._transform = null;
          };
          (function() {
            this.highlight = function(x, y) {
              // Copy for safety
              if (!arguments.length) return {x: this._highlight.x, y: this._highlight.y};

              if (arguments.length == 1) {
                this._highlight = x;
              } else {
                this._highlight = {x: x, y: y};
              }
              this._events.highlight.call(this, this._highlight);
            };

            this.datapoint_hover = function(_) {
              if (!arguments.length) return this._datapoint_hover;
              
              this._datapoint_hover = _;
              this._events.datapoint_hover.call(this, _);
            };

            this.transform = function(_) {
              if (!arguments.length) return this._transform;
              this._transform = _;
              this._events.transform.call(this, _);
            };

            this.on = function(evt, callback) {
              this._events.on(evt, callback);
            };
          }).call(Controller.prototype);

          var controller = new Controller();

          // Set option defaults
          var opts = {};
          options = options || {};
          opts.width = options.width || bbox.width;
          opts.height = options.height || bbox.height;
          opts.xclust_height = options.xclust_height || opts.height * 0.12;
          opts.yclust_width = options.yclust_width || opts.width * 0.12;
          opts.link_color = opts.link_color || "#AAA";
          opts.xaxis_height = options.xaxis_height || 80;
          opts.yaxis_width = options.yaxis_width || 120;
          opts.axis_padding = options.axis_padding || 6;
          opts.show_grid = options.show_grid;
          if (typeof(opts.show_grid) === 'undefined') {
            opts.show_grid = true;
          }
          opts.brush_color = options.brush_color || "#0000FF";
          opts.xaxis_font_size = options.xaxis_font_size;
          opts.yaxis_font_size = options.yaxis_font_size;
          opts.anim_duration = options.anim_duration;
          if (typeof(opts.anim_duration) === 'undefined') {
            opts.anim_duration = 500;
          }

          if (!data.rows) {
            opts.yclust_width = 0;
          }
          if (!data.cols) {
            opts.xclust_height = 0;
          }
          
          var gridSizer = new GridSizer(
            [opts.yclust_width, "*", opts.yaxis_width],
            [opts.xclust_height, "*", opts.xaxis_height],
            opts.width,
            opts.height
          );

          var colormapBounds = gridSizer.getCellBounds(1, 1);
          var colDendBounds = gridSizer.getCellBounds(1, 0);
          var rowDendBounds = gridSizer.getCellBounds(0, 1);
          var yaxisBounds = gridSizer.getCellBounds(2, 1);
          var xaxisBounds = gridSizer.getCellBounds(1, 2);

          function cssify(styles) {
            return {
              position: "absolute",
              top: styles.top + "px",
              left: styles.left + "px",
              width: styles.width + "px",
              height: styles.height + "px"
            };
          }

          // Create DOM structure
          (function() {
            var inner = el.append("div").classed("inner", true);
            var info = inner.append("div").classed("info", true);
            var colDend = inner.append("svg").classed("dendrogram colDend", true);  colDend.style(cssify(colDendBounds));
            var rowDend = inner.append("svg").classed("dendrogram rowDend", true);  rowDend.style(cssify(rowDendBounds));
            var colmap = inner.append("svg").classed("colormap", true);     colmap.style(cssify(colormapBounds));
            var xaxis = inner.append("svg").classed("axis xaxis", true);    xaxis.style(cssify(xaxisBounds));
            var yaxis = inner.append("svg").classed("axis yaxis", true);    yaxis.style(cssify(yaxisBounds));
            
            // Hack the width of the x-axis to allow x-overflow of rotated labels; the
            // QtWebkit viewer won't allow svg elements to overflow:visible.
            
            xaxis.style("width", (opts.width - opts.yclust_width) + "px");
            xaxis
              .append("defs")
                .append("clipPath").attr("id", "xaxis-clip")
                  .append("polygon")
                    .attr("points", "" + [
                      [0, 0],
                      [xaxisBounds.width, 0],
                      [xaxisBounds.width + yaxisBounds.width, xaxisBounds.height],
                      [0, xaxisBounds.height]
                    ]);
            xaxis.node(0).setAttribute("clip-path", "url(#xaxis-clip)");

            inner.on("click", function() {
              controller.highlight(null, null);
            });
            controller.on('highlight.inner', function(hl) {
              inner.classed('highlighting',
                typeof(hl.x) === 'number' || typeof(hl.y) === 'number');
            });
          })();
          
          var row = !data.rows ? null : dendrogram(el.select('svg.rowDend'), data.rows, false, rowDendBounds.width, rowDendBounds.height, opts.axis_padding);
          var col = !data.cols ? null : dendrogram(el.select('svg.colDend'), data.cols, true, colDendBounds.width, colDendBounds.height, opts.axis_padding);
          var colormap = colormap(el.select('svg.colormap'), data.matrix, colormapBounds.width, colormapBounds.height);
          var xax = axisLabels(el.select('svg.xaxis'), data.cols || data.matrix.cols, true, xaxisBounds.width, xaxisBounds.height, opts.axis_padding);
          var yax = axisLabels(el.select('svg.yaxis'), data.rows || data.matrix.rows, false, yaxisBounds.width, yaxisBounds.height, opts.axis_padding);
          
          function colormap(svg, data, width, height) {


            // Check for no data
            if (data.length === 0)
              return function() {};

            if (!opts.show_grid) {
              svg.style("shape-rendering", "crispEdges");
            }
         
            var cols = data.dim[1];
            var rows = data.dim[0];
            
            var merged = data.merged;
            
            var x = d3.scale.linear().domain([0, cols]).range([0, width]);
            var y = d3.scale.linear().domain([0, rows]).range([0, height]);
            var tip = d3.tip()
                .attr('class', 'd3heatmap-tip')
                .html(function(d, i) {
                  return "<table>" + 
                    "<tr><th align=\"right\">Row</th><td>" + htmlEscape(data.rows[d.row]) + "</td></tr>" +
                    "<tr><th align=\"right\">Column</th><td>" + htmlEscape(data.cols[d.col]) + "</td></tr>" +
                    "<tr><th align=\"right\">Value</th><td>" + htmlEscape(d.label) + "</td></tr>" +
                    "</table>";
                })
                .direction("se")
                .style("position", "fixed");
            
            var brush = d3.svg.brush()
                .x(x)
                .y(y)
                .clamp([true, true])
                .on('brush', function() {
                  var extent = brush.extent();
                  extent[0][0] = Math.round(extent[0][0]);
                  extent[0][1] = Math.round(extent[0][1]);
                  extent[1][0] = Math.round(extent[1][0]);
                  extent[1][1] = Math.round(extent[1][1]);
                  d3.select(this).call(brush.extent(extent));
                })
                .on('brushend', function() {

                  if (brush.empty()) {
                    controller.transform({
                      scale: [1,1],
                      translate: [0,0],
                      extent: [[0,0],[cols,rows]]
                    });
                  } else {
                    var tf = controller.transform();
                    var ex = brush.extent();
                    var scale = [
                      cols / (ex[1][0] - ex[0][0]),
                      rows / (ex[1][1] - ex[0][1])
                    ];
                    var translate = [
                      ex[0][0] * (width / cols) * scale[0] * -1,
                      ex[0][1] * (height / rows) * scale[1] * -1
                    ];
                    controller.transform({scale: scale, translate: translate, extent: ex});
                  }
                  brush.clear();
                  d3.select(this).call(brush).select(".brush .extent")
                      .style({fill: opts.brush_color, stroke: opts.brush_color});
                });

            svg = svg
                .attr("width", width)
                .attr("height", height);
            var rect = svg.selectAll("rect").data(merged);
            rect.enter().append("rect").classed("datapt", true)
                .property("colIndex", function(d, i) { return i % cols; })
                .property("rowIndex", function(d, i) { return Math.floor(i / cols); })
                .property("value", function(d, i) { return d.value; })
                .attr("fill", function(d) {
                  if (!d.color) {
                    return "transparent";
                  }
                  return d.color;
                });
            rect.exit().remove();
            rect.append("title")
                .text(function(d, i) { return d.label; });
            rect.call(tip);

            var spacing;
            if (typeof(opts.show_grid) === 'number') {
              spacing = opts.show_grid;
            } else if (!!opts.show_grid) {
              spacing = 0.25;
            } else {
              spacing = 0;
            }
            function draw(selection) {
              selection
                  .attr("x", function(d, i) {
                    return x(i % cols);
                  })
                  .attr("y", function(d, i) {
                    return y(Math.floor(i / cols));
                  })
                  .attr("width", (x(1) - x(0)) - spacing)
                  .attr("height", (y(1) - y(0)) - spacing);
            }

            draw(rect);

            controller.on('transform.colormap', function(_) {
              x.range([_.translate[0], width * _.scale[0] + _.translate[0]]);
              y.range([_.translate[1], height * _.scale[1] + _.translate[1]]);
              draw(rect.transition().duration(opts.anim_duration).ease("linear"));
            });
            

            var brushG = svg.append("g")
                .attr('class', 'brush')
                .call(brush)
                .call(brush.event);
            brushG.select("rect.background")
                .on("mouseenter", function() {
                  tip.style("display", "block");
                })
                .on("mousemove", function() {
                  var e = d3.event;
                  var offsetX = d3.event.offsetX;
                  var offsetY = d3.event.offsetY;
                  if (typeof(offsetX) === "undefined") {
                    // Firefox 38 and earlier
                    var target = e.target || e.srcElement;
                    var rect = target.getBoundingClientRect();
                    offsetX = e.clientX - rect.left,
                    offsetY = e.clientY - rect.top;
                  }
                  
                  var col = Math.floor(x.invert(offsetX));
                  var row = Math.floor(y.invert(offsetY));
                  var label = merged[row*cols + col].label;
                  tip.show({col: col, row: row, label: label}).style({
                    top: d3.event.clientY + 15 + "px",
                    left: d3.event.clientX + 15 + "px",
                    opacity: 0.9
                  });
                  controller.datapoint_hover({col:col, row:row, label:label});
                })
                .on("mouseleave", function() {
                  tip.hide().style("display", "none");
                  controller.datapoint_hover(null);
                });

            controller.on('highlight.datapt', function(hl) {
              rect.classed('highlight', function(d, i) {
                return (this.rowIndex === hl.y) || (this.colIndex === hl.x);
              });
            });
          }

          function axisLabels(svg, data, rotated, width, height, padding) {
            svg = svg.append('g');

            // The data variable is either cluster info, or a flat list of names.
            // If the former, transform it to simply a list of names.
            var leaves;
            if (data.children) {
              leaves = d3.layout.cluster().nodes(data)
                  .filter(function(x) { return !x.children; })
                  .map(function(x) { return x.label + ""; });
            } else if (data.length) {
              leaves = data;
            }
            
            // Define scale, axis
            var scale = d3.scale.ordinal()
                .domain(leaves)
                .rangeBands([0, rotated ? width : height]);
            var axis = d3.svg.axis()
                .scale(scale)
                .orient(rotated ? "bottom" : "right")
                .outerTickSize(0)
                .tickPadding(padding)
                .tickValues(leaves);

            // Create the actual axis
            var axisNodes = svg.append("g")
                .attr("transform", rotated ? "translate(0," + padding + ")" : "translate(" + padding + ",0)")
                .call(axis);
            var fontSize = opts[(rotated ? 'x' : 'y') + 'axis_font_size']
                || Math.min(18, Math.max(9, scale.rangeBand() - (rotated ? 11: 8))) + "px";
            axisNodes.selectAll("text").style("font-size", fontSize);
            
            var mouseTargets = svg.append("g")
              .selectAll("g").data(leaves);
            mouseTargets
              .enter()
                .append("g").append("rect")
                  .attr("transform", rotated ? "rotate(45),translate(0,0)" : "")
                  .attr("fill", "transparent")
                  .on("click", function(d, i) {
                    var dim = rotated ? 'x' : 'y';
                    var hl = controller.highlight() || {x:null, y:null};
                    if (hl[dim] == i) {
                      // If clicked already-highlighted row/col, then unhighlight
                      hl[dim] = null;
                      controller.highlight(hl);
                    } else {
                      hl[dim] = i;
                      controller.highlight(hl);
                    }
                    d3.event.stopPropagation();
                  });
            function layoutMouseTargets(selection) {
              selection
                  .attr("transform", function(d, i) {
                    var x = rotated ? scale(d) + scale.rangeBand()/2 : 0;
                    var y = rotated ? padding + 6 : scale(d);
                    return "translate(" + x + "," + y + ")";
                  })
                .selectAll("rect")
                  .attr("height", scale.rangeBand() / (rotated ? 1.414 : 1))
                  .attr("width", rotated ? height * 1.414 * 1.2 : width);
            }
            layoutMouseTargets(mouseTargets);

            if (rotated) {
              axisNodes.selectAll("text")
                .attr("transform", "rotate(45),translate(6, 0)")
                .style("text-anchor", "start");
            }
            
            controller.on('highlight.axis-' + (rotated ? 'x' : 'y'), function(hl) {
              var ticks = axisNodes.selectAll('.tick');
              var selected = hl[rotated ? 'x' : 'y'];
              if (typeof(selected) !== 'number') {
                ticks.classed('faded', false);
                return;
              }
              ticks.classed('faded', function(d, i) {
                return i !== selected;
              });
            });

            controller.on('transform.axis-' + (rotated ? 'x' : 'y'), function(_) {
              var dim = rotated ? 0 : 1;
              //scale.domain(leaves.slice(_.extent[0][dim], _.extent[1][dim]));
              var rb = [_.translate[dim], (rotated ? width : height) * _.scale[dim] + _.translate[dim]];
              scale.rangeBands(rb);
              var tAxisNodes = axisNodes.transition().duration(opts.anim_duration).ease('linear');
              tAxisNodes.call(axis);
              // Set text-anchor on the non-transitioned node to prevent jumpiness
              // in RStudio Viewer pane
              axisNodes.selectAll("text").style("text-anchor", "start");
              tAxisNodes.selectAll("g")
                  .style("opacity", function(d, i) {
                    if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                      return 1;
                    } else {
                      return 0;
                    }
                  });
              tAxisNodes
                .selectAll("text")
                  .style("text-anchor", "start");
              mouseTargets.transition().duration(opts.anim_duration).ease('linear')
                  .call(layoutMouseTargets)
                  .style("opacity", function(d, i) {
                    if (i >= _.extent[0][dim] && i < _.extent[1][dim]) {
                      return 1;
                    } else {
                      return 0;
                    }
                  });
            });

          }
          
          function edgeStrokeWidth(node) {
            if (node.edgePar && node.edgePar.lwd)
              return node.edgePar.lwd;
            else
              return 1;
          }
          
          function maxChildStrokeWidth(node, recursive) {
            var max = 0;
            for (var i = 0; i < node.children.length; i++) {
              if (recursive) {
                max = Math.max(max, maxChildStrokeWidth(node.children[i], true));
              }
              max = Math.max(max, edgeStrokeWidth(node.children[i]));
            }
            return max;
          }
          
          function dendrogram(svg, data, rotated, width, height, padding) {
            var topLineWidth = maxChildStrokeWidth(data, false);
            
            var x = d3.scaleLinear()
                .domain([data.height, 0])
                .range([topLineWidth/2, width-padding]);
            var y = d3.scaleLinear()
                .domain([0, height])
                .range([0, height]);
            
            var cluster = d3.cluster(data)
                .separation(function(a, b) { return 1; })
                .size([rotated ? width : height, NaN]);
            
            var transform = "translate(1,0)";
            if (rotated) {
              // Flip dendrogram vertically
              x.range([topLineWidth/2, -height+padding+2]);
              // Rotate
              transform = "rotate(-90) translate(-2,0)";
            }

            var dendrG = svg
                .attr("width", width)
                .attr("height", height)
              .append("g")
                .attr("transform", transform);
            // debugger;
            // var nodes = cluster(data),
            //     links = cluster.links(nodes);

            // // I'm not sure why, but after the heatmap loads the "links"
            // // array mutates to much smaller values. I can't figure out
            // // what's doing it, so instead we just make a deep copy of
            // // the parts we want.
            // var links1 = links.map(function(link, i) {
            //   return {
            //     source: {x: link.source.x, y: link.source.height},
            //     target: {x: link.target.x, y: link.target.height},
            //     edgePar: link.target.edgePar
            //   };
            // });
            debugger;
            var lines = dendrG.selectAll("polyline").data(links1);
            lines
              .enter().append("polyline")
                .attr("class", "link")
                .attr("stroke", function(d, i) {
                  if (!d.edgePar.col) {
                    return opts.link_color;
                  } else {
                    return d.edgePar.col;
                  }
                })
                .attr("stroke-width", edgeStrokeWidth)
                .attr("stroke-dasharray", function(d, i) {
                  var pattern;
                  switch (d.edgePar.lty) {
                    case 6:
                      pattern = [3,3,5,3];
                      break;
                    case 5:
                      pattern = [15,5];
                      break;
                    case 4:
                      pattern = [2,4,4,4];
                      break;
                    case 3:
                      pattern = [2,4];
                      break;
                    case 2:
                      pattern = [4,4];
                      break;
                    case 1:
                    default:
                      pattern = [];
                      break;
                  }
                  for (var i = 0; i < pattern.length; i++) {
                    pattern[i] = pattern[i] * (d.edgePar.lwd || 1);
                  }
                  return pattern.join(",");
                });

            function draw(selection) {
              function elbow(d, i) {
                return x(d.source.y) + "," + y(d.source.x) + " " +
                    x(d.source.y) + "," + y(d.target.x) + " " +
                    x(d.target.y) + "," + y(d.target.x);
              }
              
              selection
                  .attr("points", elbow);
            }

            controller.on('transform.dendr-' + (rotated ? 'x' : 'y'), function(_) {
              var scaleBy = _.scale[rotated ? 0 : 1];
              var translateBy = _.translate[rotated ? 0 : 1];
              y.range([translateBy, height * scaleBy + translateBy]);
              draw(lines.transition().duration(opts.anim_duration).ease("linear"));
            });

            draw(lines);
          }

         
          var dispatcher = d3.dispatch('hover', 'click');
          
          controller.on("datapoint_hover", function(_) {
            dispatcher.hover({data: _});
          });
          
          function on_col_label_mouseenter(e) {
            controller.highlight(+d3.select(this).attr("index"), null);
          }
          function on_col_label_mouseleave(e) {
            controller.highlight(null, null);
          }
          function on_row_label_mouseenter(e) {
            controller.highlight(null, +d3.select(this).attr("index"));
          }
          function on_row_label_mouseleave(e) {
            controller.highlight(null, null);
          }

          return {
            on: function(type, listener) {
              dispatcher.on(type, listener);
              return this;
            }
          };
        }
            

        }
    }
})();
