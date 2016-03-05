(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', oncoscape);

    /** @ngInject */
    function oncoscape(osSocket, $http) {

        // Functions to move during refactor
        this.setBusy = setBusy;
        this.setBusyMessage = setBusyMessage;
        this.login = login;
        this.setDataset = setDataset;

        // Valid functions
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
        this.getMrnaData = getMrnaData;
        this.getCnvData = getCnvData;
        this.getMutationData = getMutationData;
        this.getModuleModificationDate = getModuleModificationDate;




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
        
        
        function setBusy(value){

            if (value){
                angular.element(".loader-modal").show();
            }else{
                angular.element(".loader-modal").hide();
            }
            return setBusyMessage;
        }
        function setBusyMessage(){
            //console.log(value);
        }

        function getDomains() {
            return [
                {"name": "Guest"},
                {"name": "FHCRC"},
                {"name": "SCCA"}
            ];
        }

        function setDataset(dataPackage){
            return osSocket.request({cmd: "specifyCurrentDataset", payload: dataPackage });
                //.then(function(){ });
        }
        function getDataSetNames() {
            return osSocket.request({cmd: "getDataSetNames"});
        }
        function getDataManifest(dataPackage) {
            return osSocket.request({cmd: "getDataManifest", payload:dataPackage});
        }
        function getPatientHistoryTable(dataPackage) {
            return osSocket.request({cmd: "getPatientHistoryTable", payload:{datasetName: dataPackage, durationFormat: "byYear"}});
        }

        function getPatientHistoryDxAndSurvivalMinMax() {}

        function getSampleDataFrame() {}

        function getGeneSetNames() {
            return osSocket.request({cmd:"getGeneSetNames"});
        }

        function getSampleCategorizationNames() {
            return osSocket.request({cmd:'getSampleCategorizationNames'});
        }

        function getSampleCategorization(names) {
            return osSocket.request({cmd:'getSampleCategorization', payload:names });
        }

        function getMarkersNetwork(payload) {
            // Payload is return From Set DataSource
            return osSocket.request({cmd:"getMarkersNetwork", payload:payload})
        }

        function getDrugGeneInteractions() {}

        function getCanonicalizePatientIDsInDataset() {}

        function getGeneSetGenes() {}

        function getOncoprintDataSelection() {}

        function getPCA(dataPackage, matrixName) {
            var payload = {
                dataPackage: dataPackage, 
                matrixName: matrixName
            };
            return osSocket.request({cmd: "createPCA", payload: payload});
        }

        function getCalculatedPCA(geneSet) {
            var payload = {genes: geneSet};
            return osSocket.request({cmd: "calculatePCA", payload: payload});
        }

        function getPLSR(dataPackage, matrixName) {
            var payload = {
                dataPackage: dataPackage, 
                matrixName: matrixName
            };
            return osSocket.request({cmd: "createPLSR", payload: payload});
        }

        function getCalculatedPLSR(geneSet, factors) {
            var payload = {
                genes: geneSet, 
                factorCount: factors.length, 
                factors: factors
            };
            return osSocket.request({cmd: "calculatePLSR", payload: payload});
        }

        function getSummarizedPLSRPatientAttributes(attrs) {
            attrs = attrs || ['AgeDx','Survival'];
            return osSocket.request({cmd:'summarizePLSRPatientAttributes', payload: attrs});
        }

        function getCalculatedSurvivalCurves() {}

        function getTimelines() {
            return osSocket.request({cmd: "createTimelines"});
        }

        function getCalculatedTimelines() {}

        // GBM
        function getModuleModificationDate(){
            return osSocket.request({cmd: "getModuleModificationDate", payload: 'gbmPathways'});
        }
        function getPathway(){
            return osSocket.request({cmd: "getPathway", payload:'g.gbmPathways.json'});
        }
        function getMrnaData(entities, features){
            return osSocket.request({cmd:"get_mRNA_data",payload:{entities: entities, features: features}});
        }
        function getCnvData(entities, features){
            return osSocket.request({cmd:"get_cnv_data",payload:{entities: entities, features: features}});
        }
        function getMutationData(entities, features){
             return osSocket.request({cmd:"get_mutation_data",payload:{entities: entities, features: features}});
        }
       
    }
})();
