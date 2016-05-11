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
            _cohortGene.clear();
            _cohortPatient.clear();
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



        var history = (function(){

            var _geneSelections = [];
            var _geneSelection = null;
            var _patientSelections = [];
            var _patientSelection = null;

            var addGeneSelection = function(tool, desc, ids){
                var selection = {name:name, desc:desc, ids:ids, date:moment().unix()};
                _geneSelection = selection;
                _geneSelections.unshift(selection);
                if (_geneSelections.length>0) _geneSelections.pop();
            };
            var getGeneSelections = function(){
                return _geneSelection;
            };
            var setGeneSelection = function(selection){
                _geneSelection = selection;
            };
            var getGeneSelection = function(selection){
                return _geneSelection;
            };

            var _patientSelections = [];
            var addPatientSelection = function(name, ids){
                var selection = {name:name, desc:desc, ids:ids, date:moment().unix()};
                _geneSelection = selection;
                _patientSelections.unshift(selection);
                if (_patientSelections.length>5) _patientSelections.pop()

            };
            var getPatientSelections = function(){
                console.log("GET PATIENT SELECTION");
                return _patientSelections;
            };
            var setPatientSelection = function(selection){
                console.log("SET PATIENT SELECTION");
                _patientSelection = selection;
            };
            var getPatientSelection = function(){
                console.log("GET PATIENT SELECTION")
                return _patientSelection;
            };

            return {
                addGeneSelection: addGeneSelection,
                setGeneSelection: setGeneSelection,
                getGeneSelections: getGeneSelections,
                addPatientSelection: addPatientSelection,
                setPatientSelection: setPatientSelection,
                getPatientSelection: getPatientSelection,
                getPatientSelections: getPatientSelections

            }
        });




        var _cohortPatient = collection(signals, {name:'All Patients', ids:'*'}, "osCohortPatient");
        function getCohortPatient(){ return _cohortPatient; }

        var _cohortGene = collection(signals, {name:'All Genes', ids:'*'}, "osCohortGene");
        function getCohortGene(){ return _cohortGene; }

        function collection(signals, defaultValue){ //, collectionName

            var onAdd = new signals.Signal();
            var onRemove = new signals.Signal();
            //var onSelect = new signals.Signal();

            var _collection = [defaultValue];
            
            function get() { return _collection; }
            
            function add(value){ 
                _collection.unshift(value); 
                onAdd.dispatch(_collection);
            }
            function clear(){
                _collection = [defaultValue]   
            }
            function remove(value){
                _collection.splice(_collection.indexOf(value)); 
                onRemove.dispatch(_collection);
            }
           
            function save(){
                
            }

            function load(){
            }

            return{
                get: get,
                add: add,
                remove: remove,
                onAdd: onAdd,
                onRemove: onRemove,
                save: save,
                load:load,
                clear:clear
            }
        }

  
        return {
            getCohortPatient: getCohortPatient,
            getCohortGene: getCohortGene,
            setDataSource: setDataSource,
            getDataSource: getDataSource,
            onDataSource: onDataSource,
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
            getGeneSetScore: getGeneSetScore
        }

    }
})();



