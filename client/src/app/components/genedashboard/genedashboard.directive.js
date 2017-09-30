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
        function GenedashboardController(osApi, $state, $timeout) {

            var vm = this;
            osApi.setBusy(false)
            vm.datasource = osApi.getDataSource();

            vm.spec = {
                "$schema": "https://vega.github.io/schema/vega/v3.0.json",
                "width": 500,
                "height": 200,
                "padding": 5,
              
                "signals": [
                  {
                    "name": "interpolate",
                    "value": "monotone",
                    "bind": {
                      "input": "select",
                      "options": [
                        "basis",
                        "cardinal",
                        "catmull-rom",
                        "linear",
                        "monotone",
                        "natural",
                        "step",
                        "step-after",
                        "step-before"
                      ]
                    }
                  }
                ],
              
                "data": [
                  {
                    "name": "table",
                    "values": [
                      {"u": 1,  "v": 28}, {"u": 2,  "v": 55},
                      {"u": 3,  "v": 43}, {"u": 4,  "v": 91},
                      {"u": 5,  "v": 81}, {"u": 6,  "v": 53},
                      {"u": 7,  "v": 19}, {"u": 8,  "v": 87},
                      {"u": 9,  "v": 52}, {"u": 10, "v": 48},
                      {"u": 11, "v": 24}, {"u": 12, "v": 49},
                      {"u": 13, "v": 87}, {"u": 14, "v": 66},
                      {"u": 15, "v": 17}, {"u": 16, "v": 27},
                      {"u": 17, "v": 68}, {"u": 18, "v": 16},
                      {"u": 19, "v": 49}, {"u": 20, "v": 15}
                    ]
                  }
                ],
              
                "scales": [
                  {
                    "name": "xscale",
                    "type": "linear",
                    "range": "width",
                    "zero": false,
                    "domain": {"data": "table", "field": "u"}
                  },
                  {
                    "name": "yscale",
                    "type": "linear",
                    "range": "height",
                    "nice": true,
                    "zero": true,
                    "domain": {"data": "table", "field": "v"}
                  }
                ],
              
                "axes": [
                  {"orient": "bottom", "scale": "xscale", "tickCount": 20},
                  {"orient": "left", "scale": "yscale"}
                ],
              
                "marks": [
                  {
                    "type": "area",
                    "from": {"data": "table"},
                    "encode": {
                      "enter": {
                        "x": {"scale": "xscale", "field": "u"},
                        "y": {"scale": "yscale", "field": "v"},
                        "y2": {"scale": "yscale", "value": 0},
                        "fill": {"value": "steelblue"}
                      },
                      "update": {
                        "interpolate": {"signal": "interpolate"},
                        "fillOpacity": {"value": 1}
                      },
                      "hover": {
                        "fillOpacity": {"value": 0.5}
                      }
                    }
                  }
                ]
              };

            var view = vega.embed('#genedashboard-chart', vm.spec);
            // var view = new vega.View(vega.parse(vm.spec))
            // .renderer('canvas')  // set renderer (canvas or svg)
            // .initialize('#genedashboard-chart') // initialize view within parent DOM container
            // .hover()             // enable hover encode set processing
            // .run();
        
  

           
        }  //end Controller
    }  //end genedashboard() 
})();