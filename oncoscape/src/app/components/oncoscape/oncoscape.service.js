(function() {
  'use strict';

  angular
      .module('oncoscape')
      .service('sOncoscape', sOncoscape);

  /** @ngInject */
  function sOncoscape(fOncoscape) {
   
    this.login = login;
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

    function login(username, password, domain){}
    function getDataSetNames() {}
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

    function exeCmd(msg){

    }
  }
})();
