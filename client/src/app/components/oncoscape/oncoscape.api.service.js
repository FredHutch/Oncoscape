(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', oncoscape);

    /** @ngInject */
    function oncoscape(osSocket, $http, signals) {

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
                "token": null 
            };
            var _domains = [
                { "name": "Guest" },
                { "name": "FHCRC" },
                { "name": "SCCA" }
            ];
            var logout = function(){
                _user.name = "";
                _user.password = "";
                _user.domain = {"name":"Guest"};
                _user.authenticated = false;
                _user.token = null 
                onLogout.dispatch();
            }
            var login = function(user){
                _user = user;
                if (user.domain.name=="Guest"){
                    _user.authenticated = true;
                    _user.token = "Guest";
                    onLogin.dispatch(_user);
                    return;
                }
                var req = {
                    method: 'POST',
                    url: '/login/',
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
        function getDataSetNames() {
            return osSocket.request({
                cmd: "getDataSetNames"
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
            //console.log("***** within osApi.getOncoprint: ", geneSetAndPatients);
            //debugger;
            return osSocket.request({
                cmd: "oncoprint_data_selection",
                payload: {
                    patientIdsAndGenes: geneSetAndPatients
                }
            });
        }

        var _cohortPatient = collection(signals, {name:'All Patients', ids:'*'}, "osCohortPatient");
        function getCohortPatient(){ return _cohortPatient; }

        var _cohortGene = collection(signals, {name:'All Genes', ids:'*'}, "osCohortGene");
        function getCohortGene(){ return _cohortGene; }

        function collection(signals, defaultValue, collectionName){

            var onAdd = new signals.Signal();
            var onRemove = new signals.Signal();
            var onSelect = new signals.Signal();

            var _collection = [defaultValue];
            
            function get() { return _collection; }
            
            function add(value){ 
                _collection.push(value); 
                onAdd.dispatch(_collection);
            }
            function remove(value){
                if (_selected==value) select(_collection[0]);
                _collection.splice(_collection.indexOf(value)); 
                onRemove.dispatch(_collection);
            }
           
            function save(key){

            }

            function load(key){

            }

            return{
                get: get,
                add: add,
                remove: remove,
                onAdd: onAdd,
                onRemove: onRemove,
                save: save,
                load:load
            }
        }


        /*** Filter Api ***/
        var _patientFilterApi = filter();
        function getPatientFilterApi() { return _patientFilterApi; }
        function filter(){

            var _dataSource = null;
            var _filterTree = null;
            var _filter = null;
            var _serialize = function (o){
                var sb = "{";
                sb += '"name":"'+o.name+'"';
                sb += ',"ids":';
                sb += (typeof(o.ids)=="string") ? '"*"' : '["'+o.ids.join('","')+'"]';
                if (o.hasOwnProperty("children")){
                    sb += ',"children":[';
                    for (var i=0; i<o.children.length; i++){
                        if (i>0) sb += ",";
                        sb += _serialize(o.children[i]);
                    }
                    sb += ']';
                }
                sb += "}";
                console.log("****** filter return is ", sb);
                return sb;
            };

            function init(dataSource){
                if (_dataSource==dataSource) return;
                _dataSource = dataSource;
                 _filterTree = angular.fromJson(localStorage.getItem(dataSource));
                if (!_filterTree) _filterTree = {name:dataSource, ids:'*' };
                _filter = _filterTree;
            }
            function delFilter(){}
            function addFilter(name, ids){
                var filter = {
                    name:name,
                    ids:ids
                };
                if (!_filter.hasOwnProperty("children")) _filter.children = [];
                _filter.children.push(filter);
                _filter = filter;
                onChange.dispatch(_filterTree);
                onSelect.dispatch(_filter);
                localStorage.setItem(_dataSource, _serialize(_filterTree));
            }
            function getActiveFilter(){
                return _filter;
            }

            function setActiveFilter(filter){
                _filter = filter;
                onSelect.dispatch(_filter);
            }

            function getFilterTree(){
                return _filterTree;
            }

            function filter(data, idFn){
                if (_filter.ids=="*") return data;

                return data.filter(function(p){
                    for (var i=0; i<_filter.ids.length; i++){
                        if (idFn(p) == _filter.ids[i]) return true;
                    }
                    return false;
                });
            }

            // Events
            var onChange = new signals.Signal(); // Fired When Data Changes
            var onSelect = new signals.Signal(); // Fired When Selection changes

            return {
                init : init,
                filter : filter,
                getActiveFilter : getActiveFilter,
                setActiveFilter : setActiveFilter,
                addFilter: addFilter,
                delFilter: delFilter,
                getFilterTree : getFilterTree,
                onChange : onChange,
                onSelect : onSelect
            };       
        }
  
        return {
            getCohortPatient: getCohortPatient,
            getCohortGene: getCohortGene,
            setDataSource: setDataSource,
            getDataSource: getDataSource,
            onDataSource: onDataSource,
            getPatientFilterApi: getPatientFilterApi,
            getUserApi: getUserApi,
            showFilter: showFilter,
            hideFilter: hideFilter,
            toggleFilter: toggleFilter,
            setBusy: setBusy,
            setBusyMessage: setBusyMessage,
            setDataset: setDataset,
            getDataSetNames: getDataSetNames,
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
            getOncoprint: getOncoprint
        }

    }
})();



