(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osGeneMenu', geneMenu);

    /** @ngInject */
    function geneMenu() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/genemenu/genemenu.html',
            controller: GeneMenuController,
            controllerAs: 'vm',
            scope: {},
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function GeneMenuController(osApi, $state, $scope, $sce, $timeout, $rootScope, $filter, d3) {


            // View Model
            var vm = this;
            vm.genesets = osApi.getGenesets();
            vm.geneset = osApi.getGeneset();
            vm.genesetFeatures = [];
            vm.genesetFeature = null;
            vm.genesetSummary = "";

            // Gene Service Integration
            osApi.onGenesetsChange.add(function(genesets) {
                vm.genesets = genesets;
             //   updateSurvival(genes);
            });
            osApi.onGenesetChange.add(function(geneset) {

                var dataInfo = osApi.getGenesetDatasetInfo();
                var summary = "###Place Holder"
                    // $filter('number')(dataInfo.numSamples) + " Samples In Dataset<br /> " +
                    // $filter('number')(dataInfo.numPatients) + " Patients In Dataset<br /> " +
                    // $filter('number')(gene.numSamples) + " Samples In Current Gene<br /> " +
                    // $filter('number')(gene.numPatients) + " Patients In Current Gene<br />" +
                    // $filter('number')(gene.numClinical) + " Patients with Clinical Data<br />" +
                    // $filter('number')(gene.survival.data.tte.length) + " Patients with Survival Outcome<br />";
                //$filter('number')(toolInfo.numSamplesVisible) + " Samples In Current Gene Showing<br />" +
                //$filter('number')(toolInfo.numPatients) + " Patients In Current Gene Showing<br />";

                vm.genesetSummary = $sce.trustAsHtml(summary);

                if (angular.isUndefined(geneset)) return;
                $timeout(function() {
                    var featureIdx = (vm.genesetFeature !== null) ? vm.genesetFeatures.indexOf(vm.genesetFeature) : 0;
                    vm.geneset = geneset;
                    // vm.genesetFeatures = geneset.histogram.features;
                    // vm.genesetFeature = geneset.histogram.features[featureIdx];
                });
             
            });

            // Gene edit
            vm.setGeneset = function(geneset) {
                if (angular.isString(geneset)) {
                    osApi.setGeneset([], osApi.ALLGENES, osApi.SYMBOL);
                } else {
                    osApi.setGeneset(geneset);
                }
            };

            vm.updateGeneset = function() {
                if (vm.geneset.type == "UNSAVED") {
                    osApi.saveGeneset(vm.geneset);
                } else {
                    osApi.deleteGeneset(vm.geneset);
                }
            };


            // Histogram 
            var histSvg = d3.select("#genemenu-chart").append("svg")
                .attr("width", 260)
                .attr("height", 150)
                .append("g");
            var histSingleValueLabel = angular.element("#genemenu-single-value");
            var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) {
                return "Range: " + d.label + "<br>Count: " + d.value + " of " + vm.geneFeature.data.count + "<br>Percent: " + $filter('number')((d.value / vm.genesetFeature.data.count) * 100, 2) + "%";
            });
            histSvg.call(elTip);
            // $scope.$watch('vm.genesetFeature', function() {

            //     // Histogram
            //     if (vm.geneFeature === null) return;
            //     var data = vm.genesetFeature.data;
            //     if (data.type == "factor") {
            //         if (data.hist.length == 1) {
            //             histSingleValueLabel.text(data.hist[0].label).css("display", "block").removeClass("genemenu-single-value-numeric");
            //             histSvg.classed("gene-chart-hide", true);
            //             return;
            //         }
            //     } else {
            //         if (data.min == data.max) {
            //             histSingleValueLabel.text(data.min).css("display", "block").addClass("genemenu-single-value-numeric");
            //             histSvg.classed("gene-chart-hide", true);
            //             return;
            //         }
            //     }
            //     histSingleValueLabel.text('').css("display", "none");
            //     histSvg.classed("gene-chart-hide", false);
            //     var barWidth = Math.floor((250 - data.bins) / data.bins);


            //     if (data.histRange[0] > 0) data.histRange[0] -= 2;
            //     var yScale = d3.scaleLinear()
            //         .domain([0, data.histRange[1]])
            //         .range([0, 135]);
            //     var bars = histSvg
            //         .selectAll(".gene-menu-chart-bar")
            //         .data(data.hist);
            //     bars.enter()
            //         .append("rect")
            //         .attr("class", "gene-menu-chart-bar")
            //         .attr("x", function(d, i) { return ((barWidth + 1) * i) + 5; })
            //         .attr("y", function(d) { return 150 - yScale(d.value); })
            //         .attr("height", function(d) { return yScale(d.value); })
            //         .attr("width", barWidth)
            //         .on("mouseover", elTip.show)
            //         .on("mouseout", elTip.hide);
            //     bars
            //         .transition()
            //         .duration(300)
            //         .attr("x", function(d, i) { return ((barWidth + 1) * i) + 5; })
            //         .attr("y", function(d) { return 150 - yScale(d.value); })
            //         .attr("height", function(d) { return yScale(d.value); })
            //         .attr("width", barWidth);
            //     bars.exit()
            //         .transition()
            //         .duration(300)
            //         .attr("y", 150)
            //         .attr("height", 0)
            //         .style('fill-opacity', 1e-6)
            //         .remove();
            //     var labels = histSvg
            //         .selectAll("text")
            //         .data(data.hist);
            //     labels.enter()
            //         .append("text")
            //         .attr("x", function(d, i) { return ((4 + (barWidth + 1) * i) + (barWidth * 0.5)) + 1; })
            //         .attr("y", function(d) { return 145 - yScale(d.value); })
            //         .attr("fill", "#000")
            //         .attr("height", function(d) { return yScale(d.value); })
            //         .attr("width", barWidth)
            //         .attr("font-size", "8px")
            //         .attr("text-anchor", "middle")
            //         .text(function(d) { return d.label; });
            //     labels
            //         .transition()
            //         .duration(300)
            //         .attr("x", function(d, i) { return (((barWidth + 1) * i) + (barWidth * 0.5)) + 5; })
            //         .attr("y", function(d) {
            //             var y = 145 - yScale(d.value);
            //             if (y < 0) y = 20;
            //             return y;
            //         })
            //         .text(function(d) { return d.label; });
            //     labels.exit()
            //         .transition()
            //         .duration(300)
            //         .attr("y", 150)
            //         .attr("height", 0)
            //         .style('fill-opacity', 1e-6)
            //         .remove();

            // });


            var formatDays = function(d) {
                if (Math.abs(d) === 0) return d;
                if (Math.abs(d) < 30) return d + " Days";
                if (Math.abs(d) < 360) return Math.round((d / 30.4) * 10) / 10 + " Mos";
                return Math.round((d / 365) * 10) / 10 + " Yrs";
            };

        }
    }

})();