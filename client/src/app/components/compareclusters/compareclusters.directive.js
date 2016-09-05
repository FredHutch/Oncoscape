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

            // Retrieve Selected Patient Ids From OS Service
            var pc = osCohortService.getPatientCohort();
            if (pc==null){ osCohortService.setPatientCohort([],"All Patients") }
            var selectedIds = (pc==null) ? [] : pc.ids;
            osCohortService.onPatientsSelect.add(function(patients){
                selectedIds = patients.ids;
                setSelected();
            });
       
            function setSelected() {
                if (selectedIds.length == 0) {
                    chart.selectAll(".point").classed("point-unselected", false);
                } else {
                    chart.selectAll(".point").classed("point-unselected", function() {
                        return (selectedIds.indexOf(this.__data__.id) == -1)
                    });
                }
            }

            // Properties
            var vm = this;
            var table;

            var rows = 3;
            var cell = {w:0,h:0};

            var brushRect;

            var datasource = {"disease":"brain","source":"TCGA","beta":false,"name":"Brain","img":"DSbrain.png","category":[{"source":"tcga","type":"color","collection":"brain_color_tcga_import"}],"molecular":[{"source":"ucsc","type":"cnv","collection":"brain_cnv_ucsc_gistic"},{"source":"ucsc","type":"mut01","collection":"brain_mut01_ucsc_import"},{"source":"cBio","type":"cnv","collection":"brain_cnv_cbio_gistic"},{"source":"cBio","type":"mut","collection":"brain_mut_cbio_wxs"},{"source":"cBio","type":"mut01","collection":"brain_mut01_cbio_import"},{"source":"cBio","type":"methylation","collection":"brain_methylation_cbio_hm27"},{"source":"cBio","type":"rna","collection":"brain_rna_cbio_rnaseq-bc"},{"source":"cBio","type":"protein","collection":"brain_protein_cbio_rppa-zscore"}],"clinical":{"patient":"brain_patient_tcga_clinical","followUp-v1p0":"brain_followup-v1p0_tcga_clinical","drug":"brain_drug_tcga_clinical","newTumor":"brain_newtumor_tcga_clinical","otherMalignancy-v4p0":"brain_othermalignancy-v4p0_tcga_clinical","events":"brain_events_tcga_clinical"},"calculated":[{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-allgenes-cnv-mut01"},{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-allgenes-cnv-mut01-10000"},{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01"},{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-10000"},{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-markergenes545-cnv-mut01"},{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-markergenes545-cnv-mut01-10000"},{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-tcgapancanmutated-cnv-mut01"},{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-10000"},{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-oncovogel274-cnv-mut01"},{"source":"ucsc","type":"mds","collection":"brain_mds_ucsc_mds-oncovogel274-cnv-mut01-10000"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-allgenes-cnv"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-allgenes-cnv-10000"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv-10000"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-markergenes545-cnv"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-markergenes545-cnv-10000"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-tcgapancanmutated-cnv"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-tcgapancanmutated-cnv-10000"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-oncovogel274-cnv"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-oncovogel274-cnv-10000"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-tcgagbmclassifiers-mut01-10000"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-tcgapancanmutated-mut01"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-tcgapancanmutated-mut01-10000"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-oncovogel274-mut01"},{"source":"ucsc","type":"pcaScores","collection":"brain_pcascores_ucsc_prcomp-oncovogel274-mut01-10000"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-allgenes-cnv-mut01-cbio"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-allgenes-cnv-mut01-10000"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-tcgagbmclassifiers-cnv-mut01-cbio"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-tcgagbmclassifiers-cnv-mut01-10000"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-markergenes545-cnv-mut01-cbio"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-markergenes545-cnv-mut01-10000"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-tcgapancanmutated-cnv-mut01-cbio"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-tcgapancanmutated-cnv-mut01-10000"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-oncovogel274-cnv-mut01-cbio"},{"source":"cBio","type":"mds","collection":"brain_mds_cbio_mds-oncovogel274-cnv-mut01-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-cnv"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-cnv-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgagbmclassifiers-cnv"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgagbmclassifiers-cnv-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-markergenes545-cnv"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-markergenes545-cnv-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgapancanmutated-cnv"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgapancanmutated-cnv-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-oncovogel274-cnv"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-oncovogel274-cnv-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-mut01"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-mut01-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgagbmclassifiers-mut01"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgagbmclassifiers-mut01-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-markergenes545-mut01"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-markergenes545-mut01-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgapancanmutated-mut01"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgapancanmutated-mut01-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-oncovogel274-mut01"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-oncovogel274-mut01-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-methylation"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-methylation-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgagbmclassifiers-methylation"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgagbmclassifiers-methylation-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-markergenes545-methylation"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-markergenes545-methylation"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-markergenes545-methylation-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgapancanmutated-methylation"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgapancanmutated-methylation-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-oncovogel274-methylation"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-oncovogel274-methylation-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-rna"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-rna-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgagbmclassifiers-rna"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgagbmclassifiers-rna-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-markergenes545-rna"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-markergenes545-rna-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgapancanmutated-rna"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-tcgapancanmutated-rna-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-oncovogel274-rna"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-oncovogel274-rna-10000"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-protein"},{"source":"cBio","type":"pcaScores","collection":"brain_pcascores_cbio_prcomp-allgenes-protein-10000"}],"edges":[{"name":"TCGA GBM classifiers","source":"ucsc","edges":"brain_edges_ucsc_tcgagbmclassifiers-mut01-cnv","patientWeights":"brain_ptdegree_ucsc_tcgagbmclassifiers-mut01-cnv","genesWeights":"brain_genedegree_ucsc_tcgagbmclassifiers-mut01-cnv"},{"name":"Marker genes 545","source":"ucsc","edges":"brain_edges_ucsc_markergenes545-mut01-cnv","patientWeights":"brain_ptdegree_ucsc_markergenes545-mut01-cnv","genesWeights":"brain_genedegree_ucsc_markergenes545-mut01-cnv"},{"name":"TCGA pancan mutated","source":"ucsc","edges":"brain_edges_ucsc_tcgapancanmutated-mut01-cnv","patientWeights":"brain_ptdegree_ucsc_tcgapancanmutated-mut01-cnv","genesWeights":"brain_genedegree_ucsc_tcgapancanmutated-mut01-cnv"},{"name":"oncoVogel274","source":"ucsc","edges":"brain_edges_ucsc_oncovogel274-mut01-cnv","patientWeights":"brain_ptdegree_ucsc_oncovogel274-mut01-cnv","genesWeights":"brain_genedegree_ucsc_oncovogel274-mut01-cnv"},{"name":"TCGA GBM classifiers","source":"cbio","edges":"brain_edges_cbio_tcgagbmclassifiers-mut01-cnv","patientWeights":"brain_ptdegree_cbio_tcgagbmclassifiers-mut01-cnv","genesWeights":"brain_genedegree_cbio_tcgagbmclassifiers-mut01-cnv"},{"name":"Marker genes 545","source":"cbio","edges":"brain_edges_cbio_markergenes545-mut01-cnv","patientWeights":"brain_ptdegree_cbio_markergenes545-mut01-cnv","genesWeights":"brain_genedegree_cbio_markergenes545-mut01-cnv"},{"name":"TCGA pancan mutated","source":"cbio","edges":"brain_edges_cbio_tcgapancanmutated-mut01-cnv","patientWeights":"brain_ptdegree_cbio_tcgapancanmutated-mut01-cnv","genesWeights":"brain_genedegree_cbio_tcgapancanmutated-mut01-cnv"},{"name":"oncoVogel274","source":"cbio","edges":"brain_edges_cbio_oncovogel274-mut01-cnv","patientWeights":"brain_ptdegree_cbio_oncovogel274-mut01-cnv","genesWeights":"brain_genedegree_cbio_oncovogel274-mut01-cnv"}]};

            var elChart = angular.element("#compareclusterChart");
            var chart = d3.select("#compareclusterChart").append("svg:svg");
  

            vm.allClusters = datasource.calculated.map(function(v){
                v.selected = true;
                return v;
            });
            var clusters = vm.allClusters
                .filter(function(v){ return v.collection.indexOf("ucsc")!=-1; });
            //.filter(function(v){ return v.type=="mds";})
                //.filter(function(v){ return v.collection.indexOf("ucsc")!=-1; });
            

            function plot(p){
                var rect = d3.select(this);
                rect.append("svg:rect")
                    .attr("class", "cell")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", cell.w )
                    .attr("height", cell.h );

                var xScale = d3.scaleLinear().domain(p.xDomain).range([0,cell.w]);
                var yScale = d3.scaleLinear().domain(p.yDomain).range([0,cell.h]);
                rect.selectAll("circle")
                    .data(p.data)
                    .enter().append("svg:circle")
                    .attr("class", "point")
                    .attr("cx", function(d) { return xScale(d.x); })
                    .attr("cy", function(d) { return yScale(d.y); })
                    .attr("r", 1);

                brush.create(rect);


            }

            // Brushes
            var brush = (function(d3, cell, osCohortService){

                var _brushes = [];

                var start = function(){
                    if (d3.event.selection===null) return;
                    _brushes
                        .filter(function(b){ return b.brush!==d3.event.target })
                        .forEach(function(b){
                            b.rect.call(b.brush.move, null);
                        });
                    _brushes
                        .filter(function(b){ return b.brush===d3.event.target })
                        .forEach(function(b){
                            b.brush.on("end", end);
                        });
                };
                var end = function(){
                    if (d3.event.selection===null){
                        osCohortService.setPatientCohort([], "Clusters");  
                        return;
                    } 
                    var bv = d3.event.selection;
                    var xMin = bv[0][0];
                    var xMax = bv[1][0];
                    var yMin = bv[0][1];
                    var yMax = bv[1][1];

                    var brush = _brushes.filter(function(b){ return b.brush===d3.event.target })[0];
                    brush.brush.on("end", null);
                    var rect = brush.rect.data()[0];
                    var xScale = d3.scaleLinear().domain(rect.xDomain).range([0,cell.w]);
                    var yScale = d3.scaleLinear().domain(rect.yDomain).range([0,cell.h]);
                    var ids = rect.data.filter(function(c){
                        var x = xScale(c.x);
                        var y = yScale(c.y);
                        return (x>xMin && x<xMax && y>yMin && y<yMax);
                    })
                    .map(function(d){
                        return d.id;
                    });
                    osCohortService.setPatientCohort(ids, "Clusters");
                };

                var create = function(rect){
                    var brush = d3.brush()
                        .on("start", start);
                        rect.call(brush);
                    _brushes.push({brush:brush,rect:rect});
                }

                var clear = function(brush){

                }

                var destory = function(){

                }

                return {
                    create: create,
                    clear: clear,
                    destory: destory
                }
            })(d3, cell, osCohortService);

            

            function draw(){

                var layout = osApi.getLayout();
                var height = $window.innerHeight - 180;
                var width  = $window.innerWidth - layout.left - layout.right-40;
                    cell.w  = Math.floor( width / rows);
                    cell.h  = Math.floor( height / Math.ceil( clusters.length / rows ));

                elChart.css("margin-left", layout.left+20).css("margin-right", layout.right+20).css("width",width).css("height",height+70);
                chart.attr("width", width )
                    .attr("height", height );

                chart.selectAll("g.graph")
                    .data(clusters)
                    .enter().append("svg:g")
                    .attr("class", "graph")
                    .attr("transform", function(d) {
                        return "translate(" + (d.col * cell.w) + "," + (d.row * cell.h) + ")"; 
                    })
                    .each(plot);
            }

            $q.all(
              clusters
                .map(function(v){
                  console.log(v.collection);
                  return osApi.query(v.collection)})
            ).then(function(data){
                clusters = clusters.map(function(v,i,a){
                    var data = this.data[i].data[0].data;
                    var rv = {
                        name: v,
                        data: Object.keys(data).reduce(function(p,c){
                            var datum = p.data[c];
                            p.value.push({id:c, x:datum.x, y:datum.y});
                            return p;
                        },{data:data,value:[]}).value,
                        xDomain: null,
                        yDomain: null,
                        col: i % this.rows,
                        row: parseInt(i / this.rows)
                    };
                    var xVal = function(d) { return d.x; };
                    var yVal = function(d) { return d.x; };
                    rv.xDomain = [d3.min(rv.data, xVal), d3.max(rv.data, xVal)];
                    rv.yDomain = [d3.min(rv.data, yVal), d3.max(rv.data, yVal)];
                    return rv;
                },{data:data,rows:rows});

                draw();
            });
            var resize = function(){
                var layout = osApi.getLayout();
                var height = $window.innerHeight - 180;
                var width  = $window.innerWidth - layout.left - layout.right-40;
                    cell.w  = Math.floor( width / rows);
                    cell.h  = Math.floor( height / Math.ceil( clusters.length / rows ));

                elChart.css("margin-left", layout.left+20).css("margin-right", layout.right+20).css("width",width).css("height",height+70);
                chart.attr("width", width ).attr("height", height );
                chart.selectAll("g.graph")
                    .attr("transform", function(d) {
                        return "translate(" + (d.col * cell.w) + "," + (d.row * cell.h) + ")"; 
                    }).each(function(p){
                        var xScale = d3.scaleLinear().domain(p.xDomain).range([0,cell.w]);
                        var yScale = d3.scaleLinear().domain(p.yDomain).range([0,cell.h]);
                        var g = d3.select(this);
                        g.select(".cell")
                        .attr("width", cell.w )
                        .attr("height", cell.h );
                        g.selectAll(".point")
                        .attr("cx", function(d) { return xScale(d.x); })
                        .attr("cy", function(d) { return yScale(d.y); })
                        .attr("r", 1);
                    });
            };
            
                // Listen For Resize
            osApi.onResize.add(resize);
            angular.element($window).bind('resize', 
                _.debounce(resize, 300)
            );

        }
    }
})();
