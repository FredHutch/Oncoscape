(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osApi', oncoscape);

    /** @ngInject */
    function oncoscape(osSocket, $http) {

    

/*** User Functions ***/
        function getUser(){
            return {
                "name":"",
                "password":"",
                "domain":{"name":"Guest"},
                "authenticated":false,
                "token": null
            }
        }
        function login(user) {
            var req = {
                method: 'POST',
                url: '/login/',
                data: {
                    username: user.name,
                    password: user.password,
                    domain: user.domain.name
                }
            };
            return $http(req).then(function(res) {
                if (res.data.success) {
                    user.authenticated = true;
                    user.token = res.data.token;
                } else {
                    user.authenticated = false;
                    user.token =null;
                }
            });
        }
        function getDomains() {
            return [{
                "name": "Guest"
            }, {
                "name": "FHCRC"
            }, {
                "name": "SCCA"
            }];
        }



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

/*** Filter Functions ***/
        var _patientFilterApi = filter();
        //function setPatientFilter(name){ _patientFilters.set(name); }
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
                return sb;
            };

            function init(dataSource){
                if (_dataSource==dataSource) return;
                _dataSource = dataSource;
                 _filterTree = JSON.parse(localStorage.getItem(dataSource));
                if (!_filterTree) _filterTree = {name:dataSource, ids:'*' };
                _filter = _filterTree;
            }
            function delFilter(filter){}
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
                
        };
  
        return {
            getPatientFilterApi: getPatientFilterApi,
            showFilter: showFilter,
            hideFilter: hideFilter,
            toggleFilter: toggleFilter,
            setBusy: setBusy,
            setBusyMessage: setBusyMessage,
            login: login,
            getUser: getUser,
            setDataset: setDataset,
            getDomains: getDomains,
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
            getPLSR: getPLSR,
            getCalculatedPLSR: getCalculatedPLSR,
            getSummarizedPLSRPatientAttributes: getSummarizedPLSRPatientAttributes,
            getCalculatedSurvivalCurves: getCalculatedSurvivalCurves,
            getTimelines: getTimelines,
            getCalculatedTimelines: getCalculatedTimelines,
            getMrnaData: getMrnaData,
            getCnvData: getCnvData,
            getMutationData: getMutationData,
            getModuleModificationDate: getModuleModificationDate
        }

    }
})();



