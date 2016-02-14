(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', oncoscape);

    /** @ngInject */
    function oncoscape(osSocket, $http) {

        this.login = login;
        this.getDomains = getDomains;
        this.getDataSetNames = getDataSetNames;
        this.getDataManifest = getDataManifest;
        this.getPatientHistoryTable = getPatientHistoryTable;
        this.getPatientHistoryDxAndSurvivalMinMax = getPatientHistoryDxAndSurvivalMinMax;
        this.getSampleDataFrame = getSampleDataFrame;
        this.getGeneSetNames = getGeneSetNames;
        this.getSampleCategorizationNames = getSampleCategorizationNames;
        this.getSampleCategorization = getSampleCategorization;
        this.getMarkersNetwork = getMarkersNetwork;
        this.getPathway = getPathway;
        this.getDrugGeneInteractions = getDrugGeneInteractions;
        this.getCanonicalizePatientIDsInDataset = getCanonicalizePatientIDsInDataset;
        this.getGeneSetGenes = getGeneSetGenes;
        this.getOncoprintDataSelection = getOncoprintDataSelection;
        this.getPCA = getPCA;
        this.getCalculatedPCA = getCalculatedPCA;
        this.getPLSR = getPLSR;
        this.getCalculatedPLSR = getCalculatedPLSR;
        this.getSummarizedPLSRPatientAttributes = getSummarizedPLSRPatientAttributes;
        this.getCalculatedSurvivalCurves = getCalculatedSurvivalCurves;
        this.getTimelines = getTimelines;
        this.getCalculatedTimelines = getCalculatedTimelines;

        function login(user) {
            var req = {
                method: 'POST',
                url: 'http://localhost/login/',
                data: {username:user.name, password:user.password, domain:user.domain.name}
            };
            return $http(req).then(function(res){
                if (res.data.success){
                    user.authenticated = true;
                    user.token = res.data.token;
                }else{
                    user.authenticated = false;
                    user.token = null;
                }
            });
        }

        function getDomains() {
            return [
                {"name": "Guest"},
                {"name": "FHCRC"},
                {"name": "SCCA"}
            ];
        }

        function getDataSetNames() {
            return osSocket.request({cmd: "getDataSetNames"});
            
        }

        function getDataManifest() {}

        function getPatientHistoryTable() {}

        function getPatientHistoryDxAndSurvivalMinMax() {}

        function getSampleDataFrame() {}

        function getGeneSetNames() {}

        function getSampleCategorizationNames() {}

        function getSampleCategorization() {}

        function getMarkersNetwork() {}

        function getPathway() {}

        function getDrugGeneInteractions() {}

        function getCanonicalizePatientIDsInDataset() {}

        function getGeneSetGenes() {}

        function getOncoprintDataSelection() {}

        function getPCA() {}

        function getCalculatedPCA() {}

        function getPLSR() {}

        function getCalculatedPLSR() {}

        function getSummarizedPLSRPatientAttributes() {}

        function getCalculatedSurvivalCurves() {}

        function getTimelines() {}

        function getCalculatedTimelines() {}

       
    }
})();
