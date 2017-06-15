(function() {
    'use strict';

    angular
        .module('oncoscape')
        .directive('osPlsr', explore);

    // Add Line of Origin
    // Recalculate On select
    // Filters

    /** @ngInject */
    function explore() {

        var directive = {
            restrict: 'E',
            templateUrl: 'app/components/plsr/plsr.html',
            controller: PlsrController,
            controllerAs: 'vm',
            bindToController: true
        };

        return directive;

        /** @ngInject */
        function PlsrController(osApi, $http, $window, $scope, $q, d3, $timeout, _) {


            // Elements
            var elDiv = angular.element("#plsr-chart");
            var elChart = d3.select("#plsr-chart").append("svg");
            var elGroup = elChart.append("g");
            var elCircles;
            var elLines;
            var elTip = d3.tip().attr("class", "tip").offset([-8, 0]).html(function(d) { return d.id; });
            elChart.call(elTip);

            // vm
            var vm = this;
            vm.genesets = [];
            vm.datasource = osApi.getDataSource();
            vm.collection = vm.datasource.molecular[0];
            vm.dd = {
                bound: { min: 0, max: 100 },
                value: { min: 0, max: 100 }
            };
            vm.dx = {
                bound: { min: 0, max: 100 },
                value: { min: 0, max: 100 }
            };
            // vm.geneset


            // State
            var data;
            var patients;
            var xScale = new d3.scaleLinear().nice();
            var yScale = new d3.scaleLinear().nice();

            // Lasso
            var lasso;
            var lasso_start = function() {
                lasso.items()
                    .attr("r", 3.5) // reset size
                    .classed("not_possible", true)
                    .classed("selected", false);
            };
            var lasso_draw = function() {
                lasso.possibleItems()
                    .classed("not_possible", false)
                    .classed("possible", true);
                lasso.notPossibleItems()
                    .classed("not_possible", true)
                    .classed("possible", false);
            };

            var lasso_end = function() {

                lasso.items()
                    .classed("not_possible", false)
                    .classed("possible", false);
                var ids = lasso.selectedItems().data().map(function(d) {
                    return d.id;
                });

                var selectedGenes = lasso.selectedItems().data().map(function(v) { return v.id; });
                if (selectedGenes.length < 2) {
                    if (vm.geneset.name != 'Custom') {
                        alert("Please select more than 1 gene");
                        return;
                    } else {
                        $timeout(function() {
                            vm.geneset = prevGeneset;
                        });
                        return;
                    }
                }
                $timeout(function() {
                    if (vm.geneset.name != 'Custom') {
                        prevGeneset = vm.geneset;
                    }

                    vm.geneset = { name: 'Custom', genes: selectedGenes };
                });
            };
            var prevGeneset;

            lasso = d3.lasso()
                .closePathSelect(true)
                .closePathDistance(100)
                .targetArea(elChart)
                .on("start", lasso_start)
                .on("draw", lasso_draw)
                .on("end", lasso_end);

            // Api
            function setData(value) {

                if (data === null) return;
                data = value;

                data.vectors = data.vectors.map(function(v) { return [{ id: v.id, value: [0, 0] }, v]; });

                var range = data.points.reduce(function(p, c) {
                    var x = c.value[0];
                    var y = c.value[1];
                    if (x > p.xMax) p.xMax = x;
                    if (x < p.xMin) p.xMin = x;
                    if (y > p.yMax) p.yMax = y;
                    if (y < p.yMin) p.yMin = y;
                    return p;
                }, { xMin: Infinity, xMax: -Infinity, yMin: Infinity, yMax: -Infinity });
                xScale.domain([range.xMin, range.xMax]);
                yScale.domain([range.yMin, range.yMax]);
                draw();
            }

            function resize() {
                var layout = osApi.getLayout();
                var width = $window.innerWidth - layout.left - layout.right;
                var height = $window.innerHeight - 120; //10
                elDiv.css({
                    "width": width + "px",
                    "padding-left": layout.left + "px"
                });
                elChart.attr("width", width).attr("height", height);
                elGroup.attr("width", width).attr("height", height);
                xScale.range([50, width - 50]);
                yScale.range([50, height - 50]);
                draw();
            }

            // Render
            function draw() {
                if (angular.isUndefined(data)) return;
                elCircles = elGroup.selectAll("circle").data(data.points);
                elCircles.enter().append("circle")
                    .attr("class", "plsr-node")
                    .attr("cx", function(d) {
                        return xScale(d.value[0]);
                    })
                    .attr("cy", function(d) {
                        return yScale(d.value[1]);
                    })
                    .attr("r", 4)
                    .on("mouseover", elTip.show)
                    .on("mouseout", elTip.hide);
                elCircles.exit()
                    .transition()
                    .duration(200)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .style("fill-opacity", "0")
                    .remove();
                elCircles
                    .transition()
                    .duration(750)
                    .delay(function(d, i) {
                        return i / 300 * 100;
                    })
                    .attr("r", 4)
                    .attr("cx", function(d) {
                        return xScale(d.value[0]);
                    })
                    .attr("cy", function(d) {
                        return yScale(d.value[1]);
                    });
                // .style("fill", function(d) {
                //     return d.color;
                // })
                //.style("fill-opacity", 0.8);


                var line = d3.line()
                    .x(function(d) { return xScale(d.value[0]); })
                    .y(function(d) { return yScale(d.value[1]); });

                elLines = elGroup.selectAll(".plsr-line").data(data.vectors);

                elLines.enter().append("path")
                    .attr("class", "plsr-line")
                    .attr("d", line)
                    .style("stroke", function(d) {
                        return (d[0].id == "age_at_diagnosis") ? "#FF9800" : "#38347b";
                    });
                elLines.exit().remove();
                elLines
                    .transition()
                    .duration(750)
                    .attr("d", line);

                lasso.items(elGroup.selectAll(".plsr-node"));
                elChart.call(lasso);
                osApi.setBusy(false);
            }



            // Move To Service 
            function query(disease, genes, samples, features, molecular_collection, clinical_collection, n_components) {
   
                
                var data = { disease: disease, genes: genes, samples: samples, features: features, molecular_collection: molecular_collection, clinical_collection: clinical_collection, n_components: n_components };

                return $http({
                    method: 'POST',
                    url: "/cpu/plsr",
                    data: data,
                    headers: {
                        apikey: 'password'
                    }
                });
                

            }

            // Load Data
            $q.all([
                osApi.query('lookup_genesets'),
                osApi.query(osApi.getDataSource().clinical.patient, {
                    $fields: ['patient_ID', 'gender', 'race', 'age_at_diagnosis', 'days_to_death', 'status_vital']
                })
            ]).then(function(responses) {
                patients = responses[1].data;

                var minMax = patients.reduce(function(p, c) {
                    if (c.age_at_diagnosis !== null) {
                        if (p.dx.max < c.age_at_diagnosis) p.dx.max = c.age_at_diagnosis;
                        if (p.dx.min > c.age_at_diagnosis) p.dx.min = c.age_at_diagnosis;
                    }
                    if (c.days_to_death !== null) {
                        if (p.dd.max < c.days_to_death) p.dd.max = c.days_to_death;
                        if (p.dd.min > c.days_to_death) p.dd.min = c.days_to_death;
                    }
                    return p;
                }, {
                    dd: { min: Infinity, max: -Infinity },
                    dx: { min: Infinity, max: -Infinity }
                });
                vm.dd.bound = minMax.dd;
                vm.dd.value = _.clone(minMax.dd);
                vm.dx.bound = minMax.dx;
                vm.dx.value = _.clone(minMax.dx);

                vm.genesets = responses[0].data;
                vm.geneset = vm.genesets[6];


            });


            // Watches
            vm.filterChange = function() {
                var patientIds = patients.filter(function(patient) {
                    return (patient.age_at_diagnosis >= vm.dx.value.min && patient.age_at_diagnosis <= vm.dx.value.max && patient.days_to_death >= vm.dd.value.min && patient.days_to_death <= vm.dd.value.max);
                }).map(function(patient) {
                    return patient.patient_ID;
                });
                if (patientIds.length == 0) {
                    alert("Filter Does Not Contain Any Patients");
                    return;
                }
                osApi.setBusy(true);
                osApi.setCohort(patientIds, "PCA", osApi.PATIENT);
            };
            var onGeneset = $scope.$watch("vm.geneset", function() {
                if (angular.isUndefined(vm.geneset)) return;
                osApi.setBusy(true);
                loadData();

            });

            function loadData() {

                var samples = osApi.getCohort().sampleIds;
                if (samples.length === 0) samples = Object.keys(osApi.getData().sampleMap);

                query("brain", vm.geneset.genes, samples, ["age_at_diagnosis", "days_to_death"],
                    "tcga_gbmlgg_exp_hiseqv2_ucsc-xena",
                    osApi.getDataSource().clinical.patient,
                    2
                ).then(function(response) {
                    data = response.data;
                    setData({ vectors: data["y.loadings"], points: data["x.loadings"] });
                    osApi.setBusy(false);
                });
            }

            osApi.onResize.add(resize);
            osApi.onCohortChange.add(loadData);
            resize();

        }
    }
})();