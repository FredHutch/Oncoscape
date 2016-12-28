(function() {
    'use strict';

    angular
        .module('oncoscape')
        .run(runBlock);

    /** @ngInject */
    function runBlock($rootScope, $state, $window, $timeout, $exceptionHandler, osApi, osAuth) { //, $log

        // Force Cohort Menu to Close
        $timeout(function() {
            angular.element("#cohortMenu").css({ "display": "none" });
        }, 200);

        // Route Errors To Angular
        $window.onerror = function handleGlobalError(message, fileName, lineNumber, columnNumber, error) {
            if (!error) {
                error = new Error(message);
                error.fileName = fileName;
                error.lineNumber = lineNumber;
                error.columnNumber = (columnNumber || 0);
            }
            $exceptionHandler(error);
        }

        // Actions To Take On State Change
        var off = $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {

            // Hide Busy Cursor
            osApi.setBusy(false);

            // Route unauthenticated users to landing page
            if (toState.authenticate && !osAuth.isAuthenticated()) {
                $state.transitionTo("landing");
                event.preventDefault();
                return;
            }

            //Redirect If Unable To Resolve Data Source
            if (toState.datasource && (angular.isUndefined(toParams.datasource) || toParams.datasource === "")) {
                $state.transitionTo("datasource")
                event.preventDefault();
                return;
            } else {
                osApi.setDataSource(toParams.datasource);
            }
        });

        osApi.setDataSource({ "disease": "brain", "source": "TCGA", "beta": false, "name": "Brain", "img": "DSbrain.png", "tools": ["timelines", "history", "pca", "markers", "survival", "pathways", "comparecluster", "sunburst", "heatmap", "scatter"], "category": [{ "source": "tcga", "type": "color", "collection": "brain_color_tcga_import" }], "molecular": [{ "source": "broad", "type": "mut", "collection": "brain_mut_broad_mutsig2" }, { "source": "broad", "type": "mut01", "collection": "brain_mut01_broad_mutsig2" }, { "source": "ucsc", "type": "cnv", "collection": "brain_cnv_ucsc_gistic" }, { "source": "ucsc", "type": "mut01", "collection": "brain_mut01_ucsc_mutationbroadgene" }], "calculated": [{ "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-allgenes-cnv-mut01-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-allgenes-cnv-mut01-1e05-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-tcgagbmclassifiers-cnv-mut01-1e05-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-markergenes545-cnv-mut01-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-markergenes545-cnv-mut01-1e05-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-tcgapancanmutated-cnv-mut01-1e05-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-oncovogel274-cnv-mut01-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-oncovogel274-cnv-mut01-1e05-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-oncovogel274-cnv-mut01-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-oncovogel274-cnv-mut01-1e05-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-oncoplex-cnv-mut01-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-oncoplex-cnv-mut01-1e05-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-osccchen131probes-cnv-mut01-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-osccchen131probes-cnv-mut01-1e05-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-osccchen9genes-cnv-mut01-ucsc" }, { "source": "ucsc", "type": "mds", "collection": "brain_mds_ucsc_mds-osccchen9genes-cnv-mut01-1e05-ucsc" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-allgenes-cnv" }, { "source": "ucsc", "type": "pcaLoadings", "collection": "brain_pcaloadings_ucsc_prcomp-allgenes-cnv" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-allgenes-cnv-1e05" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv" }, { "source": "ucsc", "type": "pcaLoadings", "collection": "brain_pcaloadings_ucsc_prcomp-tcgagbmclassifiers-cnv" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-tcgagbmclassifiers-cnv-1e05" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-markergenes545-cnv" }, { "source": "ucsc", "type": "pcaLoadings", "collection": "brain_pcaloadings_ucsc_prcomp-markergenes545-cnv" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-markergenes545-cnv-1e05" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-tcgapancanmutated-cnv" }, { "source": "ucsc", "type": "pcaLoadings", "collection": "brain_pcaloadings_ucsc_prcomp-tcgapancanmutated-cnv" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-tcgapancanmutated-cnv-1e05" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-oncovogel274-cnv" }, { "source": "ucsc", "type": "pcaLoadings", "collection": "brain_pcaloadings_ucsc_prcomp-oncovogel274-cnv" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-oncovogel274-cnv-1e05" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-oncoplex-cnv" }, { "source": "ucsc", "type": "pcaLoadings", "collection": "brain_pcaloadings_ucsc_prcomp-oncoplex-cnv" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-oncoplex-cnv-1e05" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-osccchen131probes-cnv" }, { "source": "ucsc", "type": "pcaLoadings", "collection": "brain_pcaloadings_ucsc_prcomp-osccchen131probes-cnv" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-osccchen131probes-cnv-1e05" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-osccchen9genes-cnv" }, { "source": "ucsc", "type": "pcaLoadings", "collection": "brain_pcaloadings_ucsc_prcomp-osccchen9genes-cnv" }, { "source": "ucsc", "type": "pcaScores", "collection": "brain_pcascores_ucsc_prcomp-osccchen9genes-cnv-1e05" }], "clinical": { "samplemap": "brain_samplemap_tcga_molecular", "events": "brain_events_tcga_clinical", "patient": "brain_patient_tcga_clinical", "followUp-v1p0": "brain_followup-v1p0_tcga_clinical", "drug": "brain_drug_tcga_clinical", "newTumor": "brain_newtumor_tcga_clinical", "otherMalignancy-v4p0": "brain_othermalignancy-v4p0_tcga_clinical", "radiation": "brain_radiation_tcga_clinical", "followup": "brain_followup_tcga_v1p0", "newtumor": "brain_newtumor_tcga_clinical", "othermalignancy": "brain_othermalignancy_tcga_v4p0" }, "edges": [{ "name": "TCGA GBM classifiers", "source": "ucsc", "edges": "brain_edges_ucsc_tcgagbmclassifiers-mut01-cnv", "patientWeights": "brain_ptdegree_ucsc_tcgagbmclassifiers-mut01-cnv", "genesWeights": "brain_genedegree_ucsc_tcgagbmclassifiers-mut01-cnv" }, { "name": "Marker genes 545", "source": "ucsc", "edges": "brain_edges_ucsc_markergenes545-mut01-cnv", "patientWeights": "brain_ptdegree_ucsc_markergenes545-mut01-cnv", "genesWeights": "brain_genedegree_ucsc_markergenes545-mut01-cnv" }, { "name": "TCGA pancan mutated", "source": "ucsc", "edges": "brain_edges_ucsc_tcgapancanmutated-mut01-cnv", "patientWeights": "brain_ptdegree_ucsc_tcgapancanmutated-mut01-cnv", "genesWeights": "brain_genedegree_ucsc_tcgapancanmutated-mut01-cnv" }, { "name": "oncoVogel274", "source": "ucsc", "edges": "brain_edges_ucsc_oncovogel274-mut01-cnv", "patientWeights": "brain_ptdegree_ucsc_oncovogel274-mut01-cnv", "genesWeights": "brain_genedegree_ucsc_oncovogel274-mut01-cnv" }, { "name": "Oncoplex", "source": "ucsc", "edges": "brain_edges_ucsc_oncoplex-mut01-cnv", "patientWeights": "brain_ptdegree_ucsc_oncoplex-mut01-cnv", "genesWeights": "brain_genedegree_ucsc_oncoplex-mut01-cnv" }, { "name": "OSCC Chen 131 probes", "source": "ucsc", "edges": "brain_edges_ucsc_osccchen131probes-mut01-cnv", "patientWeights": "brain_ptdegree_ucsc_osccchen131probes-mut01-cnv", "genesWeights": "brain_genedegree_ucsc_osccchen131probes-mut01-cnv" }, { "name": "OSCC Chen 9 genes", "source": "ucsc", "edges": "brain_edges_ucsc_osccchen9genes-mut01-cnv", "patientWeights": "brain_ptdegree_ucsc_osccchen9genes-mut01-cnv", "genesWeights": "brain_genedegree_ucsc_osccchen9genes-mut01-cnv" }], "$$hashKey": "object:40" });

        $rootScope.$on('$destroy', off)
    }
})();