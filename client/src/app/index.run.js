(function() {
    'use strict';

    angular
        .module('oncoscape')
        .run(runBlock);

    /** @ngInject */
    function runBlock($rootScope, $state, $window, $exceptionHandler, osApi) { //, $log

        // Route Errors To Angular
        $window.onerror = function handleGlobalError( message, fileName, lineNumber, columnNumber, error ) {
            if ( ! error ) {
                error = new Error( message );
                error.fileName = fileName;
                error.lineNumber = lineNumber;
                error.columnNumber = ( columnNumber || 0 );
            }
            $exceptionHandler( error );
        }
        
        // Actions To Take On State Change
        var off = $rootScope.$on('$stateChangeStart', function(event, toState, toParams) {

            // Hide Busy Cursor
            osApi.setBusy(false);

            // Reset DataTable Custom Filters
            angular.element.fn.DataTable.ext.search = [];

            
            // Route unauthenticated users to landing page
            if (toState.authenticate && !osApi.getUserApi().getUser().authenticated) {
                $state.transitionTo("landing");
                event.preventDefault();
                return;
            }

            //Redirect If Unable To Resolve Data Source
            if (toState.datasource && (angular.isUndefined(toParams.datasource) || toParams.datasource==="")){
                $state.transitionTo("datasource")
                event.preventDefault();
                return;
            }else{
                osApi.setDataSource(toParams.datasource);
            }
            

            //osApi.setDataSource({"disease":"brca","source":"TCGA","name":"Breast","img":"DSbreast.png","beta":false,"collections":{"drug":"clinical_tcga_brca_drug","f1":"clinical_tcga_brca_f1","f2":"clinical_tcga_brca_f2","f3":"clinical_tcga_brca_f3","nte":"clinical_tcga_brca_nte","nte_f1":"clinical_tcga_brca_nte_f1","omf":"clinical_tcga_brca_omf","pt":"clinical_tcga_brca_pt","rad":"clinical_tcga_brca_rad"},"edges":[{"name":"TCGA GBM Classifiers","edges":"edge_brca_tcgagbmclassifiers","patientWeights":"edge_brca_tcgagbmclassifiers_patient_weight","genesWeights":"edge_brca_tcgagbmclassifiers_gene_weight"},{"name":"Marker Genes 545","edges":"edge_brca_markergenes545","patientWeights":"edge_brca_markergenes545_patient_weight","genesWeights":"edge_brca_markergenes545_gene_weight"},{"name":"TCGA Pan Cancer Mutated","edges":"edge_brca_tcgapancancermutated","patientWeights":"edge_brca_tcgapancancermutated_patient_weight","genesWeights":"edge_brca_tcgapancancermutated_gene_weight"},{"name":"Onco Vogel 274","edges":"edge_brca_oncovogel274","patientWeights":"edge_brca_oncovogel274_patient_weight","genesWeights":"edge_brca_oncovogel274_gene_weight"}]});

            
            
            
            
        });

        $rootScope.$on('$destroy', off)
    }
})();