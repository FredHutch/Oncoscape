(function() {
    'use strict';

    angular
        .module('oncoscape')
        .service('osCohortService', osCohortService);

    /** @ngInject */
    function osCohortService(moment, signals, osSound, _) {

        var onMessage = new signals.Signal();
        var onPatientsSelect = new signals.Signal();
        var onGenesSelect    = new signals.Signal();

        var worker = new Worker("app/components/oncoscape/oncoscape.cohort.service.worker.js");
        worker.addEventListener('message', function(msg) { onMessage.dispatch(msg);}, false);

        var indexPatientCohort = 0,
            indexGeneCohort = 0,
            allPatientCohorts = [],
            allGeneCohorts = [],
            activePatientCohort,
            activeGeneCohort;

        var getPatientMetric = function(property){
            if (!activePatientCohort.ids) return;
              worker.postMessage({
                cmd: "getHistogram",
                data: {
                    property: property,
                    ids: activePatientCohort.ids
                }
            });
        };
        var getPatientCohorts = function(){ return allPatientCohorts;  };
        var getPatientCohort = function(){ return activePatientCohort; };
        var addPatientCohort = function(){ 
                if (allPatientCohorts.indexOf(activePatientCohort)!=-1) return;
                allPatientCohorts.push(activePatientCohort); 
            };
        var delPatientCohort = function(obj){ 
                allPatientCohorts.splice(allPatientCohorts.indexOf(obj),1); 
            };
        var setPatientCohort = function(ids, name){
            activePatientCohort = (!Array.isArray(ids)) ? ids : {
                id: indexPatientCohort,
                ids: ids,
                name: name,
                time: new Date()
            };
            indexPatientCohort += 1;
            onPatientsSelect.dispatch(activePatientCohort);
        };

        var getGeneMetric = function(obj){
            console.log(obj);
        };
        var getGeneCohorts = function(){ return allGeneCohorts;  };
        var getGeneCohort = function(){ return activeGeneCohort; };
        var addGeneCohort = function(){ allGeneCohorts.push(activeGeneCohort); };
        var delGeneCohort = function(obj){ allGeneCohorts.splice(allGeneCohorts.indexOf(obj),1); };
        var setGeneCohort = function(ids, name){
            activeGeneCohort = (!Array.isArray(ids)) ? ids : {
                id: indexPatientCohort,
                ids: ids,
                name: name,
                time: new Date()
            };
            indexPatientCohort += 1;
            onGenesSelect.dispatch(activeGeneCohort);
        };

        var api = {
            onMessage: onMessage,
            onPatientsSelect: onPatientsSelect,
            getPatientCohorts: getPatientCohorts,
            getPatientCohort: getPatientCohort,
            setPatientCohort: setPatientCohort,
            addPatientCohort: addPatientCohort,
            delPatientCohort: delPatientCohort,
            getPatientMetric: getPatientMetric,
            onGenesSelect: onGenesSelect,
            getGeneCohorts: getGeneCohorts,
            getGeneCohort: getGeneCohort,
            setGeneCohort: setGeneCohort,
            addGeneCohort: addGeneCohort,
            delGeneCohort: delGeneCohort,
            getGeneMetric: getGeneMetric
        };

        return api;
    }
})();