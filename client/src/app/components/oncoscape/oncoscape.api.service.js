(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', oncoscape);

    /** @ngInject */
    function oncoscape(osSocket, $http, signals, $location) {

        var _dataSource;
        var onDataSource = new signals.Signal();
        function getDataSource(){ return _dataSource; }
        function setDataSource(value){
            osSocket.setDataSource(value);
            _dataSource = value;
            onDataSource.dispatch(_dataSource);
        }
        
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
                    url: $location.protocol()+"://"+$location.host()+":"+ (($location.port()=="3002") ? 80 : $location.port()) +'/login',
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
            return [{
                name: 'Markers + Patients',
                route: 'markers',
                img: 'markers.png',
                copy: 'Link copy number variation and mutation data to patients.'
            }, {
                name: 'Timelines',
                route: 'timelines',
                img: 'timelines.png',
                copy: ''
            }, {
                name: 'Pathways',
                route: 'pathways',
                img: 'pathways.png',
                copy: 'Map patient specific expression levels on a hand curated network of genes.'
            }, {
                name: 'PLSR',
                route: 'plsr',
                img: 'plsr.png',
                copy: 'Use linear regression to correlate genes with clinical features using RNA expression.'
            }, {
                name: 'PCA',
                route: 'pca',
                img: 'pca.png',
                copy: 'Two dimensional view of per sample expression data.'
            }, {
                name: 'Survival',
                route: 'survival',
                img: 'survival.png',
                copy: 'Compare survival rates of selected patients against the remaining population in a Kaplan Meier plot.'
            }, {
                name: 'Patient Data',
                route: 'history',
                img: 'history.png',
                copy: ''
            }, {
                name: 'Oncoprint',
                route: 'oncoprint',
                img: 'history.png',
                copy: ''
            }, {
                name: 'Geneset Test',
                route: 'genesettest',
                img: 'history.png',
                copy: ''
            }, {
                name: 'MetaData',
                route: 'metadata',
                img: 'metadata.png',
                copy: ''
            }];
        }


        /*** R Service Calls ***/
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
            setDataSource: setDataSource,
            getDataSource: getDataSource,
            onDataSource: onDataSource,
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