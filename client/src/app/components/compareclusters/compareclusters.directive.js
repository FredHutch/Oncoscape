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


            // Properties
            var vm = this;
            var table;
            

            // Retrieve Selected Patient Ids From OS Service
            var pc = osCohortService.getPatientCohort();

            if (pc==null){
                osCohortService.setPatientCohort([],"All Patients")
            }
            var selectedIds = (pc==null) ? [] : pc.ids;

            d3.ns.prefix.custom = "https://d3js.org/namespace/custom";

            osApi.getLayout()
            var width = 1000;
            var height = 1000;
            var sketch = d3.select("#compareclusterChart").append("custom:sketch")
                .attr("width", width)
                .attr("height", height)
                .call(custom);


        // On each mouse move, create a circle that increases in size and fades away.
        d3.select(window).on("mousemove", function() {
          sketch.append("custom:circle")
              .attr("x", d3.event.clientX)
              .attr("y", d3.event.clientY)
              .attr("radius", 0)
              .attr("strokeStyle", "red")
            .transition()
              .duration(5000)
              .ease(Math.sqrt)
              .attr("radius", 200)
              .attr("strokeStyle", "white")
              .remove();
        });

        function custom(selection) {
          selection.each(function() {
            var root = this,
                canvas = root.parentNode.appendChild(document.createElement("canvas")),
                context = canvas.getContext("2d");

            canvas.style.position = "absolute";
            canvas.style.top = root.offsetTop + "px";
            canvas.style.left = root.offsetLeft + "px";

            // It'd be nice to use DOM Mutation Events here instead.
            // However, they appear to arrive irregularly, causing choppy animation.
            d3.timer(redraw);

            // Clear the canvas and then iterate over child elements.
            function redraw() {
              canvas.width = root.getAttribute("width");
              canvas.height = root.getAttribute("height");
              for (var child = root.firstChild; child; child = child.nextSibling) draw(child);
            }

            // For now we only support circles with strokeStyle.
            // But you should imagine extending this to arbitrary shapes and groups!
            function draw(element) {
              switch (element.tagName) {
                case "circle": {
                  context.strokeStyle = element.getAttribute("strokeStyle");
                  context.beginPath();
                  context.arc(element.getAttribute("x"), element.getAttribute("y"), element.getAttribute("radius"), 0, 2 * Math.PI);
                  context.stroke();
                  break;
                }
              }
            }
          });
        };

            // // Load Datasets
            // osApi.setBusy(true);
            // osApi.query(vm.datasource.collections.patient, {
            //         $fields: fields
            //     })
            //     .then(function(response) {
            //         initDataTable(vm, columns, response.data);
            //         initEvents(vm, $scope, osApi)
            //         osApi.setBusy(false);
            //     });
        }
    }
})();
