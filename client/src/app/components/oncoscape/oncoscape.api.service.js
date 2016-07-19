(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', oncoscape);

    /** @ngInject */
    function oncoscape(osHttp, $http, signals, $location) {

        // Events
        var onDataSource = new signals.Signal();

        // State
        var _dataSources;
        var _dataSource;
        function getDataSources(){
            return _dataSources;
        }
        function getDataSource(value){ 
            return _dataSource; 
        }
        function setDataSource(value){
            
            if (typeof(value)==="object"){
                if (_dataSource != value) onDataSource.dispatch(_dataSource);
                _dataSource = value;
            }else if (typeof(value)==="string"){
                if (_dataSource.disease!=value){
                    if (_dataSource != value) onDataSource.dispatch(_dataSource);
                    _dataSource = _dataSources.filter(function(v){ v.disease==disease}, {key:value})[0]
                }
            }
        }

        query("lookup_oncoscape_datasources",{beta:false}).then(function(response){ 
            _dataSources = response.data; 
                            
        });
        
        /*** User Api ***/
        function userApi(){

            // Events
            var onLogin = new signals.Signal(); // Fired When Data Changes
            var onLogout = new signals.Signal(); // Fired When Selection changes
            var _user = {
                "name":"",
                "password":"",
                "domain":{"name":"Guest"},
                "authenticated":false,
                "token": null,
                "datasets": []
            };
            var _domains = [
                { "name": "Guest" },
                { "name": "FHCRC" },
                { "name": "UW" }
            ];
            var logout = function(){
                _user.name = "";
                _user.password = "";
                _user.domain = {"name":"Guest"};
                _user.authenticated = false;
                _user.token = null;
                _user.datasets = [];

                onLogout.dispatch();
            }
            var login = function(user){
                _user = user;
                var req = {
                    method: 'POST',
                    url: $location.protocol()+"://"+$location.host()+":"+ (($location.port()=="3000") ? 80 : $location.port()) +'/login',
                    data: {
                        username: _user.name,
                        password: _user.password,
                        domain: _user.domain.name
                    }
                };
                return $http(req).then(function(res) {
                    if (res.data.success) {
                        _user.authenticated = true;
                        _user.token = res.data.token;
                        _user.datasets = res.data.datasets;                        
                        onLogin.dispatch(_user);
                    } else {
                        _user.authenticated = false;
                        _user.token =null;
                    }
                });
            }
            return {
                getDomains: function(){ return _domains; },
                getUser: function() { return _user; },
                login: login,
                logout: logout,
                onLogin: onLogin,
                onLogout: onLogout
            }
        }
        var _userApi = userApi();
        function getUserApi() { return _userApi; }

        /*** UI Functions ***/
        function setBusy(value) {
            if (value) {
                angular.element(".loader-modal").show();
            } else {
                angular.element(".loader-modal").hide();
            }
            return setBusyMessage;
        }
        function setBusyMessage() {
            //console.log(value);
        }
        function showFilter() {
            angular.element("#filter-dropdown").slideToggle();
        }
        function hideFilter() {
            angular.element("#filter-dropdown").slideToggle();
        }
        function toggleFilter(){
            angular.element("#filter-dropdown").slideToggle();
        }

        function getTools(){
        }
        
        function queryString(table, query){
            return osHttp.queryString({
                table: table,
                query: query
            });
        }
        function query(table, query){
            return osHttp.query({
                table: table,
                query: query
            });
        }

        /*** R Service Calls ***/
        var osSocket = {};
        function setDataset(dataPackage) {
            osSocket.setDataSource(dataPackage);
            return osSocket.request({
                cmd: "specifyCurrentDataset",
                payload: dataPackage
            });
        }
        
        function getDataManifest(dataPackage) {
            return osSocket.request({
                cmd: "getDataManifest",
                payload: dataPackage
            });
        }
        function getPatientHistoryTable(dataPackage) {
            return osSocket.request({
                cmd: "getPatientHistoryTable",
                payload: {
                    datasetName: dataPackage,
                    durationFormat: "byYear"
                }
            });
        }
        function getPatientHistoryDxAndSurvivalMinMax() {}
        function getSampleDataFrame() {}
        function getGeneSetNames() {
            return osSocket.request({
                cmd: "getGeneSetNames"
            });
        }
        function getSampleCategorizationNames() {
            return osSocket.request({
                cmd: 'getSampleCategorizationNames'
            });
        }
        function getSampleCategorization(names) {
            return osSocket.request({
                cmd: 'getSampleCategorization',
                payload: names
            });
        }
        function getMarkersNetwork(payload) {
            // Payload is return From Set DataSource
            return osSocket.request({
                cmd: "getMarkersNetwork",
                payload: payload
            })
        }
        function getDrugGeneInteractions() {}
        function getCanonicalizePatientIDsInDataset(patientIds) {
            return osSocket.request({
                cmd: "getCanonicalizePatientIDsInDataset",
                payload: patientIds
            });
        }
        function getGeneSetGenes() {}
        function getOncoprintDataSelection() {}
        function getPCA(dataPackage, matrixName) {
            var payload = {
                dataPackage: dataPackage,
                matrixName: matrixName
            };
            return osSocket.request({
                cmd: "createPCA",
                payload: payload
            });
        }
        function getCalculatedPCA(geneSet) {
            var payload = {
                genes: geneSet
            };

            return osSocket.request({
                cmd: "calculatePCA",
            
                payload: payload
            });
        }
        function getCalculatedPCA2(geneSet) {
            var payload = {
                genes: geneSet
            };
            return osSocket.request({
                cmd: "calculatePCA2",
                payload: payload
            });
        }
        function getPLSR(dataPackage, matrixName) {
            var payload = {
                dataPackage: dataPackage,
                matrixName: matrixName
            };
            return osSocket.request({
                cmd: "createPLSR",
                payload: payload
            });
        }
        function getCalculatedPLSR(geneSet, factors) {
            var payload = {
                genes: geneSet,
                factorCount: factors.length,
                factors: factors
            };
            return osSocket.request({
                cmd: "calculatePLSR",
                payload: payload
            });
        }
        function getSummarizedPLSRPatientAttributes(attrs) {
            attrs = attrs || ['AgeDx', 'Survival'];
            return osSocket.request({
                cmd: 'summarizePLSRPatientAttributes',
                payload: attrs
            });
        }
        function getCalculatedSurvivalCurves(patientIds, title) {
            return osSocket.request({
                cmd: "calculateSurvivalCurves",
                payload: {
                    sampleIDs: patientIds,
                    title: title
                }
            });
        }
        function getTimelines() {
            return osSocket.request({
                cmd: "createTimelines"
            });
        }
        function getCalculatedTimelines() {}
        function getModuleModificationDate() {
            return osSocket.request({
                cmd: "getModuleModificationDate",
                payload: 'gbmPathways'
            });
        }
        function getPathway() {
            return osSocket.request({
                cmd: "getPathway",
                payload: 'g.gbmPathways.json'
            });
        }
        function getMrnaData(entities, features) {
            return osSocket.request({
                cmd: "get_mRNA_data",
                payload: {
                    entities: entities,
                    features: features
                }
            });
        }
        function getCnvData(entities, features) {
            return osSocket.request({
                cmd: "get_cnv_data",
                payload: {
                    entities: entities,
                    features: features
                }
            });
        }
        function getMutationData(entities, features) {
            return osSocket.request({
                cmd: "get_mutation_data",
                payload: {
                    entities: entities,
                    features: features
                }
            });
        }
        function getOncoprint(geneSetAndPatients) {
            return osSocket.request({
                cmd: "oncoprint_data_selection",
                payload: {
                    patientIdsAndGenes: geneSetAndPatients
                }
            });
        }
        function getGeneSetTest(dataPackage, matrixName) {
            var payload = {
                dataPackage: dataPackage,
                matrixName: matrixName
            };
            return osSocket.request({
                cmd: "createGeneSetTest",
                payload: payload
            });
        }
        function getGeneSetScore(Group1, Group2, geneSet) {
            return osSocket.request({
                cmd: "geneSetScoreTest",
                payload: {
                    group1: Group1,
                    group2: Group2, 
                    geneset: geneSet
                }
            });
        }



        return {

            // Mongo V
            query: query,
            queryString: queryString,
            setDataSource: setDataSource,
            getDataSource: getDataSource,
            getDataSources: getDataSources,
            onDataSource: onDataSource,

            // Legacy
            getTools: getTools,
            getUserApi: getUserApi,
            showFilter: showFilter,
            hideFilter: hideFilter,
            toggleFilter: toggleFilter,
            setBusy: setBusy,
            setBusyMessage: setBusyMessage,
            setDataset: setDataset,
            getDataManifest: getDataManifest,
            getPatientHistoryTable: getPatientHistoryTable,
            getPatientHistoryDxAndSurvivalMinMax: getPatientHistoryDxAndSurvivalMinMax,
            getSampleDataFrame: getSampleDataFrame,
            getGeneSetNames: getGeneSetNames,
            getSampleCategorizationNames: getSampleCategorizationNames,
            getSampleCategorization: getSampleCategorization,
            getMarkersNetwork: getMarkersNetwork,
            getPathway: getPathway,
            getDrugGeneInteractions: getDrugGeneInteractions,
            getCanonicalizePatientIDsInDataset: getCanonicalizePatientIDsInDataset,
            getGeneSetGenes: getGeneSetGenes,
            getOncoprintDataSelection: getOncoprintDataSelection,
            getPCA: getPCA,
            getCalculatedPCA: getCalculatedPCA,
            getCalculatedPCA2: getCalculatedPCA2,
            getPLSR: getPLSR,
            getCalculatedPLSR: getCalculatedPLSR,
            getSummarizedPLSRPatientAttributes: getSummarizedPLSRPatientAttributes,
            getCalculatedSurvivalCurves: getCalculatedSurvivalCurves,
            getTimelines: getTimelines,
            getCalculatedTimelines: getCalculatedTimelines,
            getMrnaData: getMrnaData,
            getCnvData: getCnvData,
            getMutationData: getMutationData,
            getModuleModificationDate: getModuleModificationDate,
            getOncoprint: getOncoprint,
            getGeneSetTest: getGeneSetTest,
            getGeneSetScore: getGeneSetScore
        }
    }
})();